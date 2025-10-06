// index.js

// 1. Importiamo le librerie necessarie
const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { create } = require('xmlbuilder2');

// --- CONFIGURAZIONE ---
const PORT = process.env.PORT || 3000; // La porta su cui il nostro servizio ascolterà
const BASE_URL = 'https://milovana.com';
const NUMERO_PAGINE_DA_ANALIZZARE = 2; // Riduciamo per non sovraccaricare il server gratuito

// 2. La funzione principale di scraping
async function scrapeMilovana() {
    let browser = null;
    console.log("Inizio scraping...");

    try {
        // Avviamo un browser "headless" ottimizzato per ambienti server
        browser = await puppeteer.launch({
            args: [
                '--disable-dev-shm-usage', // Aggiungi questa linea
                ...chromium.args
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        // Aumentiamo il timeout per dare tempo a Cloudflare di fare il suo lavoro
        await page.setDefaultNavigationTimeout(60000); 

        let items = [];
        for (let i = 0; i < NUMERO_PAGINE_DA_ANALIZZARE; i++) {
            const start = i * 20;
            const url = `${BASE_URL}/webteases/?pp=20&start=${start}`;
            console.log(`Navigando verso: ${url}`);
            
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            // Aspettiamo che il contenitore degli articoli sia visibile
            // Questo implicitamente attende che la protezione Cloudflare sia superata
            await page.waitForSelector('#tease_list div.tease', { timeout: 30000 });

            // page.evaluate esegue il codice dentro il browser
            const pageItems = await page.evaluate((baseUrl) => {
                const results = [];
                // Selezioniamo tutti gli elementi .tease
                document.querySelectorAll('#tease_list div.tease').forEach(element => {
                    const titleEl = element.querySelector('.tease_title a');
                    const imageEl = element.querySelector('.tease_image img');
                    const authorEl = element.querySelector('.tease_author a');
                    const dateEl = element.querySelector('.tease_date');
                    const viewsEl = element.querySelector('.tease_views');
                    const descEl = element.querySelector('.tease_description');

                    // Estraiamo i tag
                    const tags = Array.from(element.querySelectorAll('.tease_tags a')).map(tag => tag.innerText.trim());

                    if (titleEl && imageEl && authorEl) {
                        results.push({
                            title: titleEl.innerText.trim(),
                            link: baseUrl + titleEl.getAttribute('href'),
                            image: baseUrl + imageEl.getAttribute('src'),
                            description: `<img src="${baseUrl + imageEl.getAttribute('src')}" /><br/>${descEl.innerHTML}<br/><b>Tags:</b> ${tags.join(', ')}`,
                            author: authorEl.innerText.trim(),
                            pubDate: new Date(dateEl.innerText.trim()).toUTCString(),
                            views: viewsEl.innerText.replace('Views:', '').trim(),
                            tags: tags.join(', ')
                        });
                    }
                });
                return results;
            }, BASE_URL);
            
            items = items.concat(pageItems);
        }

        console.log(`Scraping completato. Trovati ${items.length} articoli.`);
        return items;

    } catch (error) {
        console.error("Errore durante lo scraping:", error);
        return []; // Restituisci un array vuoto in caso di errore
    } finally {
        if (browser !== null) {
            await browser.close(); // Chiudiamo sempre il browser!
        }
    }
}

// 3. Funzione per creare il feed RSS
function createRssFeed(items) {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rss', { version: '2.0' })
        .ele('channel')
          .ele('title').txt('Milovana WebTeases Feed').up()
          .ele('link').txt(BASE_URL + '/webteases/').up()
          .ele('description').txt('Feed RSS non ufficiale degli ultimi webtease da Milovana.com').up();

    items.forEach(item => {
        const itemNode = root.ele('item');
        itemNode.ele('title').txt(item.title).up();
        itemNode.ele('link').txt(item.link).up();
        itemNode.ele('guid', { isPermaLink: 'true' }).txt(item.link).up();
        itemNode.ele('pubDate').txt(item.pubDate).up();
        itemNode.ele('author').txt(item.author).up();
        itemNode.ele('description').dat(item.description).up(); // CDATA per l'HTML
    });

    return root.end({ prettyPrint: true });
}

// 4. Creiamo il server web con Express
const app = express();

app.get('/', async (req, res) => {
    res.send('Server dello scraper per Milovana. Aggiungi /rss al link per vedere il feed.');
});

app.get('/rss', async (req, res) => {
    try {
        const items = await scrapeMilovana();
        if (items.length === 0) {
            return res.status(500).send("Impossibile recuperare gli articoli.");
        }
        const rssFeed = createRssFeed(items);
        res.type('application/rss+xml');
        res.send(rssFeed);
    } catch (error) {
        res.status(500).send("Errore nella generazione del feed RSS.");
    }
});

// 5. Avviamo il server
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);

});
