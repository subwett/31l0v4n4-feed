// index.js - VERSIONE PROXY
const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const PORT = process.env.PORT || 3000;

// La funzione di scraping ora è generica
async function fetchPageContent(urlToFetch) {
    let browser = null;
    console.log(`Richiesta di fetch per: ${urlToFetch}`);
    try {
        browser = await puppeteer.launch({
            args: ['--disable-dev-shm-usage', ...chromium.args],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000); // Timeout di 60 secondi

        await page.goto(urlToFetch, { waitUntil: 'networkidle2' }); // Aspetta che la pagina sia "calma"
        
        // Non facciamo più il parsing, prendiamo solo tutto il contenuto HTML
        const content = await page.content();
        console.log(`Contenuto recuperato con successo per: ${urlToFetch}`);
        return content;

    } catch (error) {
        console.error(`Errore durante il fetch di ${urlToFetch}:`, error);
        throw new Error("Impossibile recuperare il contenuto della pagina.");
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}

// Creiamo il server web con Express
const app = express();

// Un solo endpoint: /fetch, che prende l'URL da un parametro query
app.get('/fetch', async (req, res) => {
    const { url } = req.query; // Leggiamo il parametro ?url=...

    if (!url) {
        return res.status(400).send("Parametro 'url' mancante.");
    }

    try {
        const htmlContent = await fetchPageContent(url);
        res.type('text/html'); // Specifichiamo che stiamo restituendo HTML
        res.send(htmlContent);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server Proxy in ascolto sulla porta ${PORT}`);
});
