# YouTube Downloader Extension

Cette extension Chrome utilise l'API du dépôt pour déclencher le téléchargement de vidéos YouTube en MP3 ou MP4.

## Installation locale

1. Lancez l'API :
   ```bash
   npm install
   npm start
   ```
2. Ouvrez `chrome://extensions`.
3. Activez le mode développeur.
4. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier `extension/`.

## Utilisation

1. Collez une URL YouTube.
2. Choisissez MP3 ou MP4 (qualité 360p/720p/1080p).
3. Vérifiez l'URL du backend (par défaut `http://localhost:3000`).
4. Cliquez sur **Télécharger**.

## Notes

- L'API doit être joignable depuis Chrome (CORS activé dans le backend).
- Les téléchargements sont déclenchés via l'API `chrome.downloads`.
