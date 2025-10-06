# Partiamo dalla stessa immagine ufficiale
FROM ghcr.io/puppeteer/puppeteer:latest

# Passiamo a root per le operazioni di sistema
USER root

# Installiamo i font
RUN apt-get update && apt-get install -y \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --- NUOVA MODIFICA ---
# Creiamo il gruppo e l'utente 'pptr' e la sua directory home
# Questo risolve l'errore "unable to find user pptr"
RUN groupadd -r pptr && useradd -r -g pptr -G audio,video pptr \
    && mkdir -p /home/pptr/app \
    && chown -R pptr:pptr /home/pptr

# Impostiamo la directory di lavoro nella home dell'utente appena creato
WORKDIR /home/pptr/app

# Passiamo al nuovo utente per tutte le operazioni successive
USER pptr

# Copiamo i file di progetto nella directory di lavoro (che ora esiste e ha i permessi corretti)
COPY --chown=pptr:pptr package*.json ./

# Eseguiamo npm install come utente 'pptr'
RUN npm install

# Copiamo il resto del codice
COPY --chown=pptr:pptr index.js ./

EXPOSE 3000

CMD [ "node", "index.js" ]
