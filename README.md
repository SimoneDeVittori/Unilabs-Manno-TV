# Unilabs · Manno TV
Formato fisso 1920×1080 (16:9), con adattamento proporzionale e senza ritagli su schermi diversi.

Due schermate automatiche: meteo Manno e ultime notizie RSI per 20 secondi, poi piano turni per 20 secondi. Il piano è mostrato integralmente senza ritagli.

## Pubblicazione su GitHub Pages
1. Caricare tutte le cartelle e i file in un repository con ramo `main`, inclusa `.github`.
2. Aprire Settings → Pages → Source → GitHub Actions.
3. Aprire Actions → TV - aggiorna dati e pubblica → Run workflow.
4. Aprire l'indirizzo indicato dalla pubblicazione sulla TV. Muovendo il mouse compare il pulsante Schermo intero; da tastiera si può usare F11.

## Cambiare il piano
Sostituire `piano.png` con la nuova immagine, mantenendo nome e formato PNG. Il push ripubblica il sito. Ricaricare la pagina sulla TV dopo aver sostituito l'immagine.

## Aggiornamento dati
GitHub Actions recupera i dati ogni 15 minuti. GitHub può ritardare le esecuzioni programmate. La pagina verifica i nuovi dati ogni 5 minuti, senza fermare la rotazione. Eventuali errori mantengono gli ultimi dati disponibili e mostrano un avviso. Fonti: MeteoSvizzera (Manno 692800) e feed RSS Info di RSI. Nessuna chiave API necessaria. Non vengono riutilizzate le icone proprietarie MeteoSvizzera.

## Modificare l'interfaccia
Il sito pubblicato si trova nella cartella principale. Il sorgente React è `dashboard.tsx`. Per rigenerare app.js: `npm install`, poi `npm run build`.

## Traffico
Informazioni Viasuisse dal servizio pubblico utilizzato dalla pagina Traffico RSI. Le segnalazioni sono filtrate con il confine cantonale del Ticino, ordinate dando precedenza a code e pericoli, ed escluse se future o scadute. Fonte del confine: swisstopo, swissBOUNDARIES3D, https://www.swisstopo.admin.ch/en/landscape-model-swissboundaries3d.
