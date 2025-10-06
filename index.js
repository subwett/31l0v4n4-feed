// Usiamo puppeteer-extra invece del puppeteer base
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express');

// Applichiamo il plugin stealth
puppeteer.use(StealthPlugin());

const PORT = 3000;

async function fetchPageContent(urlToFetch) {
    let browser = null;
    console.log(`Richiesta di fetch per: ${urlToFetch} (con stealth mode)`);
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process' // Può aiutare in ambienti con poche risorse
            ]
        });

        const page = await browser.newPage();
        
        // Aggiungiamo un User-Agent più realistico
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
        
        await page.setDefaultNavigationTimeout(60000);

        await page.goto(urlToFetch, { waitUntil: 'networkidle2' });
        
        const content = await page.content();
        
        // A volte la pagina di blocco rimane, controlliamo il titolo
        const pageTitle = await page.title();
        if (pageTitle.toLowerCase().includes('just a moment') || pageTitle.toLowerCase().includes('verify you are human')) {
             console.log('Rilevata pagina di blocco anche con stealth. Accesso fallito.');
             throw new Error("Cloudflare ha bloccato la richiesta nonostante la modalità stealth.");
        }
        
        console.log(`Contenuto recuperato con successo per: ${urlToFetch}`);
        return content;

    } catch (error) {
        console.error(`Errore durante il fetch di ${urlToFetch}:`, error);
        throw new Error("Impossibile recuperare il contenuto della pagina.");
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const app = express();

app.get('/fetch', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send("Parametro 'url' mancante.");
    }

    try {
        const htmlContent = await fetchPageContent(url);
        res.type('text/html').send(htmlContent);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server Proxy in ascolto sulla porta interna ${PORT}`);
});
