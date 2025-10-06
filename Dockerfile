# Partiamo dalla stessa immagine ufficiale
FROM ghcr.io/puppeteer/puppeteer:latest

# --- INIZIO MODIFICA ---

# Passiamo temporaneamente all'utente root per poter installare pacchetti
USER root

# Installiamo i font e altre dipendenze, poi facciamo pulizia per mantenere l'immagine leggera
RUN apt-get update && apt-get install -y \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Ritorniamo all'utente non-privilegiato 'pptr' per il resto delle operazioni e per l'esecuzione dell'app
USER pptr

# --- FINE MODIFICA ---

WORKDIR /usr/src/app

# Copiamo prima il package.json, che ora verrà scritto con i permessi di 'pptr'
COPY --chown=pptr:pptr package.json ./

# Eseguiamo npm install come utente 'pptr'
RUN npm install

# Copiamo il resto del codice
COPY --chown=pptr:pptr index.js ./

# La porta viene esposta come prima
EXPOSE 3000

# Il comando per avviare l'applicazione
CMD [ "node", "index.js" ]
