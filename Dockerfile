# Partiamo dalla stessa immagine ufficiale
FROM ghcr.io/puppeteer/puppeteer:latest

# AGGIUNTA: Installiamo alcuni font comuni per un fingerprint più realistico
# Questo aiuta a sembrare meno un server standard
RUN apt-get update && apt-get install -y \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends

WORKDIR /usr/src/app

COPY package.json ./

# Ora installerà express, puppeteer-extra e il plugin stealth
RUN npm install

COPY index.js ./

EXPOSE 3000

CMD [ "node", "index.js" ]
