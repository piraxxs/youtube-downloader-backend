const urlInput = document.getElementById('video-url');
const formatSelect = document.getElementById('format');
const qualityField = document.getElementById('quality-field');
const qualitySelect = document.getElementById('quality');
const apiBaseInput = document.getElementById('api-base');
const infoContainer = document.getElementById('info');
const fetchInfoButton = document.getElementById('fetch-info');
const downloadButton = document.getElementById('download');

const DEFAULT_API_BASE = 'http://localhost:3000';

function setInfoContent(html) {
  infoContainer.innerHTML = html;
}

function setLoading(isLoading) {
  fetchInfoButton.disabled = isLoading;
  downloadButton.disabled = isLoading;
}

function toggleQualityField() {
  qualityField.style.display = formatSelect.value === 'mp4' ? 'flex' : 'none';
}

async function loadStoredSettings() {
  const stored = await chrome.storage.sync.get(['apiBase']);
  apiBaseInput.value = stored.apiBase || DEFAULT_API_BASE;
}

async function saveApiBase() {
  const apiBase = apiBaseInput.value.trim() || DEFAULT_API_BASE;
  await chrome.storage.sync.set({ apiBase });
  return apiBase;
}

function buildInfoMarkup(info) {
  return `
    <h2>${info.title}</h2>
    <p>Durée: ${formatDuration(info.duration)}</p>
    <p>Auteur: ${info.author}</p>
    <p>Formats disponibles: ${info.formats.map((format) => format.quality).join(', ')}</p>
  `;
}

function formatDuration(seconds) {
  const total = Number(seconds || 0);
  const minutes = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

async function fetchInfo() {
  const url = urlInput.value.trim();
  if (!url) {
    setInfoContent('<div class="placeholder">Ajoutez une URL YouTube valide.</div>');
    return;
  }

  setLoading(true);
  try {
    const apiBase = await saveApiBase();
    const response = await fetch(`${apiBase}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur inconnue');
    }

    const info = await response.json();
    setInfoContent(buildInfoMarkup(info));
  } catch (error) {
    setInfoContent(`<div class="placeholder">${error.message}</div>`);
  } finally {
    setLoading(false);
  }
}

async function downloadVideo() {
  const url = urlInput.value.trim();
  if (!url) {
    setInfoContent('<div class="placeholder">Ajoutez une URL YouTube valide.</div>');
    return;
  }

  setLoading(true);
  try {
    const apiBase = await saveApiBase();
    const format = formatSelect.value;
    const quality = qualitySelect.value;

    const downloadUrl = new URL(`${apiBase}/download`);
    downloadUrl.searchParams.set('url', url);
    downloadUrl.searchParams.set('format', format);
    if (format === 'mp4') {
      downloadUrl.searchParams.set('quality', quality);
    }

    await chrome.downloads.download({
      url: downloadUrl.toString()
    });

    setInfoContent('<div class="placeholder">Téléchargement lancé via Chrome.</div>');
  } catch (error) {
    setInfoContent(`<div class="placeholder">${error.message}</div>`);
  } finally {
    setLoading(false);
  }
}

formatSelect.addEventListener('change', toggleQualityField);
fetchInfoButton.addEventListener('click', fetchInfo);
downloadButton.addEventListener('click', downloadVideo);
apiBaseInput.addEventListener('blur', saveApiBase);

loadStoredSettings().then(toggleQualityField);
