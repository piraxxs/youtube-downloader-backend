const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route de santé
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'YouTube Downloader API v1.0',
    endpoints: {
      health: '/health',
      info: '/info',
      download: '/download'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Page de simulation
app.get('/simulation', (req, res) => {
  res.sendFile(`${__dirname}/public/simulation.html`);
});

// Route pour obtenir les infos de la vidéo
app.post('/info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    const info = await ytdl.getInfo(url);
    const formats = info.formats
      .filter(f => f.hasAudio && f.hasVideo)
      .map(f => ({
        quality: f.qualityLabel,
        format: f.container,
        size: f.contentLength
      }));

    res.json({
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      formats: formats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de téléchargement - Retourne un stream
app.get('/download', async (req, res) => {
  try {
    const { url, format, quality } = req.query;

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    console.log(`📥 Téléchargement: ${url} (${format} - ${quality})`);

    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title);

    // Options selon le format
    let downloadOptions = {};
    let filename = '';

    if (format === 'mp3') {
      downloadOptions = {
        quality: 'highestaudio',
        filter: 'audioonly'
      };
      filename = `${title}.mp3`;
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (format === 'mp4') {
      const qualityMap = {
        '360': '18',
        '720': '22', 
        '1080': '137'
      };
      downloadOptions = {
        quality: qualityMap[quality] || 'highest',
        filter: format => format.container === 'mp4'
      };
      filename = `${title}.mp4`;
      res.setHeader('Content-Type', 'video/mp4');
    } else if (format === 'webm') {
      downloadOptions = {
        quality: 'highest',
        filter: format => format.container === 'webm'
      };
      filename = `${title}.webm`;
      res.setHeader('Content-Type', 'video/webm');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream directement vers le client
    const stream = ytdl(url, downloadOptions);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('❌ Erreur stream:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 YouTube Downloader API           ║
║  📡 Port: ${PORT}                        
║  🌐 Ready to serve requests          ║
╚═══════════════════════════════════════╝
  `);
});
