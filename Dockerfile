# Partiamo da un'immagine ufficiale che contiene già Node.js e Puppeteer (Chrome)
FROM ghcr.io/puppeteer/puppeteer:latest

# Impostiamo la directory di lavoro all'interno del container
WORKDIR /usr/src/app

# Copiamo prima il package.json per ottimizzare il caching di Docker
COPY package.json ./

# Installiamo le dipendenze della nostra app (solo Express)
RUN npm install

# Copiamo il resto del codice della nostra applicazione
COPY index.js ./

# Esponiamo la porta 3000, su cui il nostro server Express è in ascolto
EXPOSE 3000

# Il comando per avviare l'applicazione quando il container parte
CMD [ "node", "index.js" ]
