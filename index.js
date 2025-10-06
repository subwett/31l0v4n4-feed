const express = require('express');
const puppeteer = require('puppeteer');

const PORT = 3000; // Il container ascolterà su questa porta interna

async function fetchPageContent(urlToFetch) {
    let browser = null;
    console.log(`Richiesta di fetch per: ${urlToFetch}`);
    try {
        // --- INIZIO MODIFICA ---
        // Rimuoviamo 'executablePath' e aggiorniamo 'headless'
        browser = await puppeteer.launch({
            headless: "new", // Usiamo il nuovo headless mode come suggerito
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
        // --- FINE MODIFICA ---

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);

        await page.goto(urlToFetch, { waitUntil: 'networkidle2' });
        
        const content = await page.content();
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
