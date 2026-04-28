const btnSelect = document.getElementById('btnSelect');
const selectedPathDisplay = document.getElementById('selectedPath');
const btnStart = document.getElementById('btnStart');
const inputWidth = document.getElementById('width');
const inputHeight = document.getElementById('height');
const inputFit = document.getElementById('fit');
const inputFormat = document.getElementById('format');
const inputBackground = document.getElementById('background');
const inputQuality = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const checkKeepDimensions = document.getElementById('keepDimensions');
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

// Live quality label update
inputQuality.addEventListener('input', () => {
  qualityValue.textContent = inputQuality.value;
});

window.setQuality = (val) => {
  inputQuality.value = val;
  qualityValue.textContent = val;
};

// Disable/enable width+height when keepDimensions toggled
checkKeepDimensions.addEventListener('change', () => {
  const disabled = checkKeepDimensions.checked;
  inputWidth.disabled = disabled;
  inputHeight.disabled = disabled;
  inputWidth.style.opacity = disabled ? '0.4' : '';
  inputHeight.style.opacity = disabled ? '0.4' : '';
});

// Load settings and data
window.addEventListener('DOMContentLoaded', () => {
  const savedWidth = localStorage.getItem('img-minify-width');
  const savedHeight = localStorage.getItem('img-minify-height');
  const savedFit = localStorage.getItem('img-minify-fit');
  const savedFormat = localStorage.getItem('img-minify-format');
  const savedBg = localStorage.getItem('img-minify-bg');
  const savedPath = localStorage.getItem('img-minify-path');
  const savedQuality = localStorage.getItem('img-minify-quality');
  const savedKeepDim = localStorage.getItem('img-minify-keepDim');

  if (savedWidth) inputWidth.value = savedWidth;
  if (savedHeight) inputHeight.value = savedHeight;
  if (savedFit) inputFit.value = savedFit;
  if (savedFormat) inputFormat.value = savedFormat;
  if (savedBg) inputBackground.value = savedBg;
  if (savedQuality) {
    inputQuality.value = savedQuality;
    qualityValue.textContent = savedQuality;
  }
  if (savedKeepDim === 'true') {
    checkKeepDimensions.checked = true;
    inputWidth.disabled = true;
    inputHeight.disabled = true;
    inputWidth.style.opacity = '0.4';
    inputHeight.style.opacity = '0.4';
  }

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
      const dimLabel = item.keepDimensions
        ? 'orig. size'
        : `${item.width}x${item.height}`;
      div.innerHTML = `
        <span onclick="applyHistory(${originalIndex})">${dimLabel} (${item.fit}, ${item.format || 'webp'}, q${item.quality || 80})</span>
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

  const q = settings.quality || 80;
  inputQuality.value = q;
  qualityValue.textContent = q;

  const keepDim = !!settings.keepDimensions;
  checkKeepDimensions.checked = keepDim;
  inputWidth.disabled = keepDim;
  inputHeight.disabled = keepDim;
  inputWidth.style.opacity = keepDim ? '0.4' : '';
  inputHeight.style.opacity = keepDim ? '0.4' : '';

  log(
    `Applied settings: ${settings.width}x${settings.height}, ${settings.fit}, ${
      settings.format || 'webp'
    }, q${q}`,
  );
}

function addToHistory(settings) {
  const newEntry = {
    width: settings.width,
    height: settings.height,
    fit: settings.fit,
    format: settings.format,
    background: settings.background,
    quality: settings.quality,
    keepDimensions: settings.keepDimensions,
  };

  history = history.filter(
    (h) =>
      h.width !== newEntry.width ||
      h.height !== newEntry.height ||
      h.fit !== newEntry.fit ||
      h.format !== newEntry.format ||
      h.background !== newEntry.background ||
      h.quality !== newEntry.quality ||
      h.keepDimensions !== newEntry.keepDimensions,
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
  const dimPart = checkKeepDimensions.checked
    ? 'orig'
    : `${inputWidth.value}x${inputHeight.value}`;
  newPresetName.value = `${dimPart} (${inputFit.value}, ${inputFormat.value}, q${inputQuality.value})`;
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
      quality: inputQuality.value,
      keepDimensions: checkKeepDimensions.checked,
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

btnSelect.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  btnSelect.classList.add('drag-over');
});

btnSelect.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  btnSelect.classList.remove('drag-over');
});

btnSelect.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  btnSelect.classList.remove('drag-over');

  const file = e.dataTransfer.files[0];
  if (!file) return;

  const droppedPath = window.api.getPathForFile(file);
  if (!droppedPath) {
    log('Error: Could not resolve dropped path.');
    return;
  }

  const isDir = await window.api.validateFolder(droppedPath);
  if (!isDir) {
    log('Error: Dropped item is not a folder. Please drop a folder.');
    return;
  }

  currentPath = droppedPath;
  selectedPathDisplay.textContent = droppedPath;
  btnStart.removeAttribute('disabled');
  log(`Selected folder (drag & drop): ${droppedPath}`);
  localStorage.setItem('img-minify-path', droppedPath);
});

btnStart.addEventListener('click', async () => {
  if (!currentPath) return;

  const width = parseInt(inputWidth.value);
  const height = parseInt(inputHeight.value);
  const fit = inputFit.value;
  const format = inputFormat.value;
  const background = inputBackground.value;
  const quality = parseInt(inputQuality.value) || 80;
  const keepDimensions = checkKeepDimensions.checked;

  if (!keepDimensions && (isNaN(width) || isNaN(height))) {
    log('Error: Invalid dimensions.');
    return;
  }

  // Save settings state
  localStorage.setItem('img-minify-width', width);
  localStorage.setItem('img-minify-height', height);
  localStorage.setItem('img-minify-fit', fit);
  localStorage.setItem('img-minify-format', format);
  localStorage.setItem('img-minify-bg', background);
  localStorage.setItem('img-minify-quality', quality);
  localStorage.setItem('img-minify-keepDim', keepDimensions);

  // Add to app history
  addToHistory({ width, height, fit, format, background, quality, keepDimensions });

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
      quality,
      keepDimensions,
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
