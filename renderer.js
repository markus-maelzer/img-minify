const btnSelect = document.getElementById('btnSelect');
const selectedPathDisplay = document.getElementById('selectedPath');
const btnStart = document.getElementById('btnStart');
const inputWidth = document.getElementById('width');
const inputHeight = document.getElementById('height');
const inputFit = document.getElementById('fit');
const inputFormat = document.getElementById('format');
const inputBackground = document.getElementById('background');
const logArea = document.getElementById('logArea');

// New Elements
const historyList = document.getElementById('historyList');
const presetsList = document.getElementById('presetsList');
const btnClearHistory = document.getElementById('btnClearHistory');
const btnSavePreset = document.getElementById('btnSavePreset');

// Preset Input Elements
const savePresetArea = document.getElementById('savePresetArea');
const newPresetName = document.getElementById('newPresetName');
const btnConfirmSave = document.getElementById('btnConfirmSave');
const btnCancelSave = document.getElementById('btnCancelSave');

let currentPath = null;
let history = [];
let presets = [];

// Load settings and data
window.addEventListener('DOMContentLoaded', () => {
  const savedWidth = localStorage.getItem('img-minify-width');
  const savedHeight = localStorage.getItem('img-minify-height');
  const savedFit = localStorage.getItem('img-minify-fit');
  const savedFormat = localStorage.getItem('img-minify-format');
  const savedBg = localStorage.getItem('img-minify-bg');
  const savedPath = localStorage.getItem('img-minify-path');

  if (savedWidth) inputWidth.value = savedWidth;
  if (savedHeight) inputHeight.value = savedHeight;
  if (savedFit) inputFit.value = savedFit;
  if (savedFormat) inputFormat.value = savedFormat;
  if (savedBg) inputBackground.value = savedBg;

  if (savedPath) {
    currentPath = savedPath;
    selectedPathDisplay.textContent = savedPath;
    btnStart.removeAttribute('disabled');
    log(`Restored last folder: ${savedPath}`);
  }

  // Load History and Presets
  const savedHistory = localStorage.getItem('img-minify-history');
  if (savedHistory) history = JSON.parse(savedHistory);

  const savedPresets = localStorage.getItem('img-minify-presets');
  if (savedPresets) presets = JSON.parse(savedPresets);

  renderLists();
});

function log(msg) {
  const line = document.createElement('div');
  line.textContent = `> ${msg}`;
  logArea.appendChild(line);
  logArea.scrollTop = logArea.scrollHeight;
}

function renderLists() {
  renderHistory();
  renderPresets();
}

function renderHistory() {
  historyList.innerHTML = '';
  history
    .slice()
    .reverse()
    .forEach((item, index) => {
      // Index in reversed array is different from original array
      // original index = length - 1 - index
      const originalIndex = history.length - 1 - index;

      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <span onclick="applyHistory(${originalIndex})">${item.width}x${
        item.height
      } (${item.fit}, ${item.format || 'webp'})</span>
        <span class="preset-actions" onclick="deleteHistoryItem(${originalIndex})">×</span>
      `;
      div.title = `Bg: ${item.background || 'none'}`;
      historyList.appendChild(div);
    });
}

function renderPresets() {
  presetsList.innerHTML = '';
  presets.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
            <span onclick="applyPreset(${index})">${item.name}</span>
            <span class="preset-actions" onclick="deletePreset(${index})">×</span>
        `;
    // We separate onclicks so clicking delete doesn't apply settings
    // But here innerHTML string structure makes it tricky to separate clean events without more code
    // Handled by specific binding below for better safety or just keep simple structure
    presetsList.appendChild(div);
  });
}

// Global scope helpers for HTML onclicks
window.applyPreset = (index) => {
  applySettings(presets[index]);
};

window.deletePreset = (index) => {
  presets.splice(index, 1);
  saveData();
  renderPresets();
};

window.applyHistory = (index) => {
  applySettings(history[index]);
};

window.deleteHistoryItem = (index) => {
  history.splice(index, 1);
  saveData();
  renderHistory();
};

function applySettings(settings) {
  if (!settings) return;
  inputWidth.value = settings.width;
  inputHeight.value = settings.height;
  inputFit.value = settings.fit;
  inputFormat.value = settings.format || 'webp';
  inputBackground.value = settings.background;
  log(
    `Applied settings: ${settings.width}x${settings.height}, ${settings.fit}, ${
      settings.format || 'webp'
    }`
  );
}

function addToHistory(settings) {
  // Remove identical simplified object if exists to avoid dupes at top
  // simple check
  const newEntry = {
    width: settings.width,
    height: settings.height,
    fit: settings.fit,
    format: settings.format,
    background: settings.background,
  };

  // Filter out identicals to promote unique history or just push top?
  // Let's just push to top and limit to 10
  history = history.filter(
    (h) =>
      h.width !== newEntry.width ||
      h.height !== newEntry.height ||
      h.fit !== newEntry.fit ||
      h.format !== newEntry.format ||
      h.background !== newEntry.background
  );

  history.push(newEntry);
  if (history.length > 10) history.shift();

  saveData();
  renderHistory();
}

function saveData() {
  localStorage.setItem('img-minify-history', JSON.stringify(history));
  localStorage.setItem('img-minify-presets', JSON.stringify(presets));
}

btnClearHistory.addEventListener('click', () => {
  history = [];
  saveData();
  renderHistory();
  log('History cleared.');
});

btnSavePreset.addEventListener('click', () => {
  savePresetArea.style.display = 'block';
  newPresetName.value = `${inputWidth.value}x${inputHeight.value} (${inputFit.value}, ${inputFormat.value})`;
  newPresetName.focus();
});

btnCancelSave.addEventListener('click', () => {
  savePresetArea.style.display = 'none';
});

btnConfirmSave.addEventListener('click', () => {
  const name = newPresetName.value.trim();
  if (name) {
    presets.push({
      name,
      width: inputWidth.value,
      height: inputHeight.value,
      fit: inputFit.value,
      format: inputFormat.value,
      background: inputBackground.value,
    });
    saveData();
    renderPresets();
    log(`Saved preset: ${name}`);
    savePresetArea.style.display = 'none';
  } else {
    alert('Please enter a name.');
  }
});

btnSelect.addEventListener('click', async () => {
  const path = await window.api.selectFolder();
  if (path) {
    currentPath = path;
    selectedPathDisplay.textContent = path;
    btnStart.removeAttribute('disabled');
    log(`Selected folder: ${path}`);
    localStorage.setItem('img-minify-path', path);
  }
});

btnStart.addEventListener('click', async () => {
  if (!currentPath) return;

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);
  const fit = inputFit.value;
  const format = inputFormat.value;
  const background = inputBackground.value;

  if (isNaN(width) || isNaN(height)) {
    log('Error: Invalid dimensions.');
    return;
  }

  // Save settings state
  localStorage.setItem('img-minify-width', width);
  localStorage.setItem('img-minify-height', height);
  localStorage.setItem('img-minify-fit', fit);
  localStorage.setItem('img-minify-format', format);
  localStorage.setItem('img-minify-bg', background);

  // Add to app history
  addToHistory({ width, height, fit, format, background });

  btnStart.setAttribute('disabled', 'true');
  btnSelect.setAttribute('disabled', 'true');
  log('Starting processing...');

  try {
    const result = await window.api.startProcessing({
      inputDir: currentPath,
      width,
      height,
      fit,
      format,
      background,
    });
    log(result);
  } catch (err) {
    log(`Error: ${err}`);
  } finally {
    btnStart.removeAttribute('disabled');
    btnSelect.removeAttribute('disabled');
  }
});

window.api.onLog((msg) => {
  log(msg);
});
