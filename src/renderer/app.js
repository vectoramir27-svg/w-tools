/**
 * ============================================================================
 * W Tools - Application Controller
 * ============================================================================
 */

(async function() {
  const api = window.desktopAPI;
  const gate = document.getElementById('activation-gate');
  const errorBox = document.getElementById('activation-error');
  const keyInput = document.getElementById('activation-key');
  const activateButton = document.getElementById('activate-license');
  const hwidLabel = document.getElementById('activation-hwid');
  let acceptLicense;
  let updatesReady = false;
  const unlocked = new Promise(resolve => { acceptLicense = resolve; });
  function setLicenseBadge(license) {
    const rawDate = license.expiresAt;
    const date = rawDate ? new Date(rawDate) : null;
    document.getElementById('license-status').textContent = date && !Number.isNaN(date.getTime()) ? `Pro до ${date.toLocaleDateString('ru-RU')}` : 'Pro · Активна';
    document.getElementById('license-badge').hidden = false;
  }
  function unlock(license) {
    setLicenseBadge(license);
    document.body.classList.remove('license-locked');
    gate.classList.add('unlocked');
    errorBox.textContent = '';
    acceptLicense();
    if (updatesReady) api.checkForUpdates().catch(() => {});
  }
  function lock(error = '') {
    document.body.classList.add('license-locked');
    gate.classList.remove('unlocked');
    document.getElementById('license-badge').hidden = true;
    errorBox.textContent = error;
  }
  document.getElementById('gate-minimize').addEventListener('click', () => api?.windowControl('minimize'));
  document.getElementById('gate-close').addEventListener('click', () => api?.windowControl('close'));
  document.getElementById('copy-hwid').addEventListener('click', async () => {
    try { await api.copyHwid(); errorBox.style.color = '#48ddc0'; errorBox.textContent = 'HWID скопирован'; }
    catch (error) { errorBox.style.color = ''; errorBox.textContent = 'Не удалось скопировать HWID'; }
  });
  document.getElementById('open-license-bot').addEventListener('click', () => api?.openExternal());
  keyInput.addEventListener('input', () => { keyInput.value = keyInput.value.toUpperCase(); errorBox.style.color = ''; errorBox.textContent = ''; });
  async function activate() {
    if (activateButton.disabled) return;
    if (!api) { errorBox.textContent = 'Активация доступна в приложении W Tools'; return; }
    activateButton.disabled = true; errorBox.style.color = ''; errorBox.textContent = 'Проверка ключа…';
    try { const result = await api.activateLicense(keyInput.value); if (result.valid) { keyInput.value = ''; unlock(result); } else errorBox.textContent = result.error || 'Не удалось активировать ключ'; }
    catch (error) { errorBox.textContent = 'Ошибка активации: ' + error.message; }
    finally { activateButton.disabled = false; }
  }
  activateButton.addEventListener('click', activate);
  keyInput.addEventListener('keydown', event => { if (event.key === 'Enter') activate(); });
  if (api) {
    try {
      const license = await api.getLicenseState();
      hwidLabel.textContent = license.hwid;
      if (license.valid) unlock(license); else lock(license.error);
    } catch (error) { lock('Не удалось проверить лицензию: ' + error.message); }
    finally { activateButton.disabled = false; }
  } else { activateButton.disabled = false; lock('Откройте W Tools в десктопном приложении'); }
  await unlocked;

  // 1. ENGINE & SUBSYSTEM INITIALIZATION
  const engine = new EmoteEngine({
    opentype: window.opentype,
    pako: window.pako,
    lottie: window.lottie,
    autoInitFont: true
  });

  // Explicitly ensure the embedded base64 font is parsed into vector contours before anything else
  try {
    await engine.initFont();
  } catch (err) {
    console.warn('Initial font load warning:', err);
  }


  // 2. GLOBAL APPLICATION STATE
  const state = {
    screen: 'dashboard', // 'dashboard' | 'editor'
    activeTool: 'select', // 'select' | 'text' | 'hand'
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    isPlaying: false,
    isLooping: true,
    currentFrame: 0,
    totalFrames: 180,
    animInstance: null,
    selectedLayerId: 'CUSTOM_TEXT',
    selectedLayerData: null,
    selectedColorPath: null,
    expandedPrecomps: new Set(),
    
    // Project model
    project: {
      id: 'proj_' + Date.now(),
      title: 'Telegram Emoji 01',
      rawLottieJson: null,
      baseData: null,
      lottieData: null,
      layerOverrides: {},
      customFontName: null,
      config: {
        text: 'HELLO',
        textPos: [256, 274],
        textScale: 100,
        textRotation: 0,
        fontSize: 60,
        colorHex: '#FFFFFF',
        opacity: 100,
        parentLayer: 'none',
        hiddenLayers: [],
        zOffset: 0
      },
      customLayers: [
        {
          id: 'layer_init_1',
          type: 'text',
          name: 'HELLO',
          text: 'HELLO',
          pos: [256, 274],
          scale: 100,
          rot: 0,
          opacity: 100,
          colorHex: '#FFFFFF',
          fontSize: 60,
          parentLayer: 'none',
          zOffset: 0
        }
      ]
    },

    recentProjects: []
  };

  function getSelectedCustomLayer() {
    if (!state.project.customLayers || state.project.customLayers.length === 0) return null;
    return state.project.customLayers.find(l => l.id === state.selectedLayerId) || null;
  }

  let storedSettings = {};
  try { storedSettings = JSON.parse(localStorage.getItem('tes_settings') || '{}'); } catch (e) {}
  const settings = Object.assign({ gifSize: 512, videoFps: 60, strictTgs: true, canvasBackground: 'checker', autoSave: true, fontData: null, fontName: '' }, storedSettings);
  const storage = window.desktopAPI || {
    async loadProjects() { return JSON.parse(localStorage.getItem('tes_recent_projects') || '[]'); },
    async saveProject(project) {
      const projects = JSON.parse(localStorage.getItem('tes_recent_projects') || '[]');
      localStorage.setItem('tes_recent_projects', JSON.stringify([project, ...projects.filter(item => item.id !== project.id)]));
    },
    async deleteProject(id) {
      const projects = JSON.parse(localStorage.getItem('tes_recent_projects') || '[]');
      localStorage.setItem('tes_recent_projects', JSON.stringify(projects.filter(item => item.id !== id)));
    },
    async loadSession() { return JSON.parse(localStorage.getItem('tes_current_session') || 'null'); },
    async saveSession(session) { localStorage.setItem('tes_current_session', JSON.stringify(session)); },
    async loadSettings() { return JSON.parse(localStorage.getItem('tes_settings') || 'null'); },
    async saveSettings(value) { localStorage.setItem('tes_settings', JSON.stringify(value)); }
  };
  const persistSettings = () => storage.saveSettings(structuredClone(settings)).catch(error => showToast('Ошибка сохранения настроек: ' + error.message, true));
  let saveTimer;
  let saveQueue = Promise.resolve();
  let restoring = true;

  // 3. DOM ELEMENTS CACHE
  const dom = {
    // Titlebar
    titlebarProBadge: document.getElementById('titlebar-pro-badge'),
    titlebarProText: document.getElementById('titlebar-pro-text'),
    winBtnMinimize: document.getElementById('win-btn-minimize'),
    winBtnMaximize: document.getElementById('win-btn-maximize'),
    winBtnClose: document.getElementById('win-btn-close'),

    // Screens
    screenDashboard: document.getElementById('screen-dashboard'),
    screenEditor: document.getElementById('screen-editor'),

    // Dashboard
    btnCreateBlank: document.getElementById('btn-create-blank-project'),
    hubDragZone: document.getElementById('hub-drag-zone'),
    hubFileInput: document.getElementById('hub-file-input'),
    btnBrowseFile: document.getElementById('btn-browse-file'),
    hubRecentGrid: document.getElementById('hub-recent-grid'),
    hubTemplatesGrid: document.getElementById('hub-templates-grid'),
    btnOpenLicenseCard: document.getElementById('btn-open-license-card'),

    // Top Toolbar
    tbBtnBack: document.getElementById('tb-btn-back'),
    toolSelect: document.getElementById('tool-select'),
    toolText: document.getElementById('tool-text'),
    toolHand: document.getElementById('tool-hand'),
    canvasZoomSelect: document.getElementById('canvas-zoom-select'),
    projectTitleInput: document.getElementById('project-title-input'),
    tgsSizeBadge: document.getElementById('tgs-size-badge'),
    tgsSizeText: document.getElementById('tgs-size-text'),
    btnOpenExport: document.getElementById('btn-open-export'),

    // Outliner
    outlinerLayersList: document.getElementById('outliner-layers-list'),
    outlinerCountBadge: document.getElementById('outliner-count-badge'),
    outlinerAddBtn: document.getElementById('outliner-add-btn'),
    outlinerAddDropdown: document.getElementById('outliner-add-dropdown'),
    btnAddTextAction: document.getElementById('btn-add-text-action'),
    btnAddLogoAction: document.getElementById('btn-add-logo-action'),
    logoFileInput: document.getElementById('logo-file-input'),

    // Canvas
    canvasViewport: document.getElementById('canvas-viewport'),
    canvasCard: document.getElementById('canvas-card'),
    lottieHost: document.getElementById('lottie-player-container'),
    canvasTextBox: document.getElementById('canvas-text-box'),

    // Playback Capsule
    frameIndicator: document.getElementById('playback-frame-indicator'),
    ctrlBtnFirst: document.getElementById('ctrl-btn-first'),
    ctrlBtnPlay: document.getElementById('ctrl-btn-play'),
    ctrlIconPlay: document.getElementById('ctrl-icon-play'),
    ctrlIconPause: document.getElementById('ctrl-icon-pause'),
    ctrlBtnLoop: document.getElementById('ctrl-btn-loop'),
    ctrlBtnResetView: document.getElementById('ctrl-btn-reset-view'),

    // Inspector
    sectionTransform: document.getElementById('section-transform'),
    sectionTextProps: document.getElementById('section-text-props'),
    sectionLogoProps: document.getElementById('section-logo-props'),
    sectionCustomCommon: document.getElementById('section-custom-common'),
    sectionLayerProps: document.getElementById('section-layer-props'),
    selectedLayerName: document.getElementById('selected-layer-name'),
    selectedLayerType: document.getElementById('selected-layer-type'),
    selectedLayerInd: document.getElementById('selected-layer-ind'),
    selectedLayerFrames: document.getElementById('selected-layer-frames'),
    btnToggleSelectedVisibility: document.getElementById('btn-toggle-selected-visibility'),
    labelToggleSelectedVisibility: document.getElementById('label-toggle-selected-visibility'),
    btnParentToSelected: document.getElementById('btn-parent-to-selected'),

    selectedLogoName: document.getElementById('selected-logo-name'),
    selectedLogoFormat: document.getElementById('selected-logo-format'),
    btnReplaceLogo: document.getElementById('btn-replace-logo'),
    btnDeleteCustomLayer: document.getElementById('btn-delete-custom-layer'),

    propPosX: document.getElementById('prop-pos-x'),
    propPosY: document.getElementById('prop-pos-y'),
    propScale: document.getElementById('prop-scale'),
    btnPropAspect: document.getElementById('btn-prop-aspect'),
    propRot: document.getElementById('prop-rot'),
    propOpacity: document.getElementById('prop-opacity'),
    propTextContent: document.getElementById('prop-text-content'),
    propColorNative: document.getElementById('prop-color-native'),
    propColorHex: document.getElementById('prop-color-hex'),
    btnBrowseFont: document.getElementById('btn-browse-font'),
    fontFileInput: document.getElementById('font-file-input'),
    fontNameLabel: document.getElementById('font-name-label'),
    propParentSelect: document.getElementById('prop-parent-select'),
    btnZDeeper: document.getElementById('btn-z-deeper'),
    btnZHigher: document.getElementById('btn-z-higher'),
    zOrderHint: document.getElementById('z-order-hint'),

    // Timeline
    timelineRuler: document.getElementById('timeline-ruler'),
    timelineTracksLeft: document.getElementById('timeline-tracks-left'),
    timelineBarsStack: document.getElementById('timeline-bars-stack'),
    timelinePlayhead: document.getElementById('timeline-playhead'),
    timelineBarsContainer: document.getElementById('timeline-bars-container'),

    // Modals
    modalExport: document.getElementById('modal-export'),
    btnCloseExportModal: document.getElementById('btn-close-export-modal'),
    modalTgsStatus: document.getElementById('modal-tgs-status'),
    btnDoExportTgs: document.getElementById('btn-do-export-tgs'),
    btnDoExportGif: document.getElementById('btn-do-export-gif'),
    btnDoExportVideo: document.getElementById('btn-do-export-video'),
    btnDoExportJson: document.getElementById('btn-do-export-json'),

    modalLicense: document.getElementById('modal-license'),
    btnCloseLicenseModal: document.getElementById('btn-close-license-modal'),
    licenseKeyInput: document.getElementById('license-key-input'),
    btnActivateKey: document.getElementById('btn-activate-key'),
    licenseStatusMsg: document.getElementById('license-status-msg'),
    btnToggleDevMode: document.getElementById('btn-toggle-dev-mode'),

    // Progress & Toast
    progressOverlay: document.getElementById('app-progress-overlay'),
    progressTitle: document.getElementById('progress-modal-title'),
    progressSub: document.getElementById('progress-modal-sub'),
    progressFill: document.getElementById('progress-modal-fill'),
    toastContainer: document.getElementById('toast-container')
  };

  // 4. TOAST NOTIFICATIONS HELPER
  function showToast(message, isError = false) {
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = message;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all 0.2s';
      setTimeout(() => el.remove(), 250);
    }, 3000);
  }

  // 5. WINDOW CONTROLS & CLICK-BASED MENU DROPDOWNS
  function setupWindowControls() {
    if (window.electronAPI) {
      dom.winBtnMinimize.addEventListener('click', () => window.electronAPI.minimizeWindow());
      dom.winBtnMaximize.addEventListener('click', () => window.electronAPI.maximizeWindow());
      dom.winBtnClose.addEventListener('click', () => window.electronAPI.closeWindow());
    }



    // Click-based menus with zero gap
    let isAnyMenuOpen = false;
    const menuItems = document.querySelectorAll('.titlebar-menus .menu-item');

    function closeAllMenus() {
      menuItems.forEach(m => m.classList.remove('open'));
      isAnyMenuOpen = false;
    }

    menuItems.forEach(menu => {
      menu.addEventListener('click', (e) => {
        if (e.target.closest('.menu-action')) {
          closeAllMenus();
          return;
        }
        e.stopPropagation();
        const wasOpen = menu.classList.contains('open');
        closeAllMenus();
        if (!wasOpen) {
          menu.classList.add('open');
          isAnyMenuOpen = true;
        }
      });

      menu.addEventListener('mouseenter', () => {
        if (isAnyMenuOpen && !menu.classList.contains('open')) {
          closeAllMenus();
          menu.classList.add('open');
          isAnyMenuOpen = true;
        }
      });
    });

    window.addEventListener('click', (e) => {
      if (!e.target.closest('.titlebar-menus')) {
        closeAllMenus();
      }
    });

    // Menu Actions
    document.getElementById('menu-new-project').addEventListener('click', () => { closeAllMenus(); createBlankProject(); });
    document.getElementById('menu-open-file').addEventListener('click', () => { closeAllMenus(); browseLocalFile(); });
    document.getElementById('menu-save-tgs').addEventListener('click', () => { closeAllMenus(); saveNow(true); });
    document.getElementById('menu-back-dashboard').addEventListener('click', () => { closeAllMenus(); switchScreen('dashboard'); });
    document.getElementById('menu-add-text').addEventListener('click', () => { closeAllMenus(); activateTool('text'); focusTextInput(); });
    document.getElementById('menu-reset-canvas').addEventListener('click', () => { closeAllMenus(); resetCanvasView(); });
    document.getElementById('menu-export-tgs-quick').addEventListener('click', () => { closeAllMenus(); exportTGS(); });
    document.getElementById('menu-export-gif-quick').addEventListener('click', () => { closeAllMenus(); exportGIF(); });
    document.getElementById('menu-export-video-quick').addEventListener('click', () => { closeAllMenus(); exportVideo(); });
    document.getElementById('menu-export-json-quick').addEventListener('click', () => { closeAllMenus(); exportJSON(); });
  }

  // 6. SCREEN SWITCHING & NAVIGATION
  function switchScreen(screenName) {
    if (screenName === 'dashboard' && state.screen === 'editor' && state.project.rawLottieJson && settings.autoSave) saveNow(false);
    state.screen = screenName;
    if (screenName === 'dashboard') {
      dom.screenDashboard.classList.add('active');
      dom.screenEditor.classList.remove('active');
      if (state.animInstance) state.animInstance.pause();
      state.isPlaying = false;
      updatePlaybackDisplay();
      renderRecentProjects();
      scheduleSave();
    } else {
      dom.screenDashboard.classList.remove('active');
      dom.screenEditor.classList.add('active');
      renderEditor();
      scheduleSave();
    }
  }

  // 7. PROJECT LOADING & RECENT MANAGEMENT
  function collectLayerColors(shapes) {
    const colors = [];
    function visit(value, path) {
      if (!value || typeof value !== 'object') return;
      if ((value.ty === 'fl' || value.ty === 'st') && value.c && Array.isArray(value.c.k)) {
        const rgb = value.c.a === 1 ? value.c.k.find(frame => Array.isArray(frame?.s))?.s : value.c.k;
        if (rgb && rgb.length >= 3 && rgb.slice(0, 3).every(Number.isFinite)) {
          colors.push({ path: JSON.stringify(path), rgb, label: (value.ty === 'fl' ? 'Заливка' : 'Обводка') + (value.nm ? ' · ' + value.nm : '') });
        }
      }
      Object.keys(value).forEach(key => {
        if (value[key] && typeof value[key] === 'object') visit(value[key], [...path, key]);
      });
    }
    visit(shapes, []);
    return colors;
  }

  function rgbToHex(rgb) {
    return '#' + rgb.slice(0, 3).map(value => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function applyLayerColors(layer, overrides) {
    if (!layer || !Array.isArray(layer.shapes) || !overrides) return;
    for (const [path, hex] of Object.entries(overrides)) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) continue;
      let item = layer.shapes;
      try { for (const key of JSON.parse(path)) item = item?.[key]; } catch { continue; }
      if (!item || !['fl', 'st'].includes(item.ty) || !Array.isArray(item.c?.k)) continue;
      const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
      const update = values => { if (Array.isArray(values) && values.length >= 3) values.splice(0, 3, ...rgb); };
      if (item.c.a === 1) item.c.k.forEach(frame => { if (frame) { update(frame.s); update(frame.e); } });
      else update(item.c.k);
    }
  }

  function sourceWithColorOverrides(raw, overrides) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : structuredClone(raw);
    (data.layers || []).forEach(layer => applyLayerColors(layer, overrides?.[String(layer.ind)]?.colors));
    (data.assets || []).forEach(asset => (asset.layers || []).forEach(layer => applyLayerColors(layer, overrides?.[`${asset.id}:${layer.ind}`]?.colors)));
    return JSON.stringify(data);
  }

  function updateColorInspector() {
    const section = document.getElementById('section-layer-color');
    const layer = state.selectedLayerData;
    const colors = layer?.type === 4 ? collectLayerColors(layer.layerRef.shapes) : [];
    section.style.display = colors.length ? 'block' : 'none';
    if (!colors.length) return;
    if (!colors.some(color => color.path === state.selectedColorPath)) state.selectedColorPath = colors[0].path;
    const overrides = state.project.layerOverrides[layer.id]?.colors || {};
    const swatches = document.getElementById('layer-color-swatches');
    swatches.replaceChildren();
    colors.forEach(color => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'swatch' + (color.path === state.selectedColorPath ? ' selected' : '');
      button.style.backgroundColor = overrides[color.path] || rgbToHex(color.rgb);
      button.title = color.label; button.setAttribute('aria-label', color.label);
      button.addEventListener('click', () => { state.selectedColorPath = color.path; updateColorInspector(); });
      swatches.appendChild(button);
    });
    const selected = colors.find(color => color.path === state.selectedColorPath);
    const hex = overrides[selected.path] || rgbToHex(selected.rgb);
    document.getElementById('layer-color-label').textContent = selected.label;
    document.getElementById('layer-color-picker').value = hex;
    document.getElementById('layer-color-hex').value = hex.toUpperCase();
  }

  function setLayerColor(value) {
    if (!/^#[0-9a-f]{6}$/i.test(value) || !state.selectedLayerData || !state.selectedColorPath) return;
    const id = state.selectedLayerData.id;
    const override = state.project.layerOverrides[id] ||= {};
    (override.colors ||= {})[state.selectedColorPath] = value.toUpperCase();
    updateColorInspector();
    rebuildLottieAnimation();
  }

  function updateCompositionInspector() {
    const data = state.project.baseData || {};
    document.getElementById('composition-size').textContent = `${data.w || 512} × ${data.h || 512}`;
    document.getElementById('composition-fps').textContent = `${data.fr || 60} FPS`;
    document.getElementById('composition-tgs').textContent = dom.tgsSizeText.textContent.replace('Размер TGS: ', '');
  }

  function projectSnapshot(proj) {
    return {
      id: proj.id, title: proj.title, date: new Date().toISOString(),
      config: structuredClone(proj.config), rawLottieJson: proj.rawLottieJson,
      customLayers: structuredClone(proj.customLayers || []),
      layerOverrides: structuredClone(proj.layerOverrides || {}),
      fontData: proj.fontData || null, fontName: proj.customFontName || ''
    };
  }

  function sessionSnapshot(project) {
    return {
      screen: state.screen, project, currentFrame: state.currentFrame,
      selectedLayerId: state.selectedLayerId, zoom: state.zoom,
      pan: structuredClone(state.pan), isLooping: state.isLooping,
      expandedPrecomps: [...state.expandedPrecomps]
    };
  }

  function saveNow(notify = false) {
    clearTimeout(saveTimer);
    const project = state.screen === 'editor' && state.project.rawLottieJson ? projectSnapshot(state.project) : null;
    const session = sessionSnapshot(project);
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      if (project) {
        await storage.saveProject(project);
        state.recentProjects = [project, ...state.recentProjects.filter(item => item.id !== project.id)];
      }
      await storage.saveSession(session);
      const status = document.getElementById('save-status');
      if (status) status.textContent = 'Сохранено в ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      if (notify) showToast('Проект сохранён на диск');
      return true;
    }).catch(error => {
      showToast('Ошибка сохранения: ' + error.message, true);
      const status = document.getElementById('save-status');
      if (status) status.textContent = 'Ошибка сохранения';
      return false;
    });
    return saveQueue;
  }

  function scheduleSave() {
    if (restoring) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow(false), 1500);
  }

  async function loadStoredData() {
    const diskSettings = await storage.loadSettings();
    if (diskSettings) Object.assign(settings, diskSettings);
    state.recentProjects = await storage.loadProjects();
    if (window.desktopAPI && !state.recentProjects.length) {
      let legacy = [];
      try { legacy = JSON.parse(localStorage.getItem('tes_recent_projects') || '[]'); } catch (e) {}
      for (const project of legacy.filter(item => item.rawLottieJson && item.id)) {
        await storage.saveProject(project);
        state.recentProjects.push(project);
      }
    }
    return await storage.loadSession();
  }

  async function restoreSession(session) {
    if (!session || session.screen !== 'editor' || !session.project?.rawLottieJson) return;
    await openSavedProject(session.project);
    state.currentFrame = Math.max(0, Math.min(session.currentFrame || 0, state.totalFrames));
    state.zoom = session.zoom || 1;
    state.pan = session.pan || { x: 0, y: 0 };
    state.isLooping = session.isLooping !== false;
    state.expandedPrecomps = new Set(session.expandedPrecomps || []);
    dom.ctrlBtnLoop.classList.toggle('active', state.isLooping);
    dom.canvasZoomSelect.value = String(state.zoom);
    updateCanvasTransform();
    if (state.animInstance) { state.animInstance.loop = state.isLooping; state.animInstance.goToAndStop(state.currentFrame, true); }
    const custom = (state.project.customLayers || []).find(layer => layer.id === session.selectedLayerId);
    if (custom) selectLayer({ ...custom, isCustom: true });
    else if (session.selectedLayerId != null) {
      const find = list => { for (const item of list) { if (item.id === session.selectedLayerId) return item; const child = find(item.children || []); if (child) return child; } return null; };
      const selected = find(engine.getLayersTree(state.project.baseData));
      if (selected) selectLayer(selected);
    } else { deselectAll(); }
    buildOutliner(); buildTimeline(); updatePlaybackDisplay(); updateTimelinePlayheadPosition(); updateBoundingBoxPosition();
  }

  function renderRecentProjects() {
    renderProjectGrid(dom.hubRecentGrid, state.recentProjects.slice(0, 8));
    const grid = document.getElementById('projects-all-grid');
    if (!grid) return;
    const query = document.getElementById('projects-search').value.toLocaleLowerCase();
    const sort = document.getElementById('projects-sort').value;
    const projects = state.recentProjects.filter(p => p.title.toLocaleLowerCase().includes(query));
    if (sort === 'name') projects.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    else projects.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    renderProjectGrid(grid, projects);
  }

  function renderProjectGrid(grid, projects) {
    grid.querySelectorAll('.card-thumb').forEach(el => { if (el.animation) el.animation.destroy(); });
    grid.replaceChildren();
    if (!projects.length) {
      const empty = document.createElement('p'); empty.className = 'empty-projects';
      empty.textContent = 'Здесь появятся сохранённые проекты.'; grid.appendChild(empty); return;
    }
    projects.forEach(project => {
      const card = document.createElement('article'); card.className = 'project-card';
      card.addEventListener('click', event => {
        if (event.target.closest('button')) return;
        document.querySelectorAll('.project-card.selected').forEach(item => item.classList.remove('selected'));
        card.classList.add('selected');
      });
      card.addEventListener('dblclick', event => {
        if (event.target.closest('button')) return;
        openSavedProject(project);
      });
      const thumb = document.createElement('div'); thumb.className = 'card-thumb';
      const info = document.createElement('div'); info.className = 'card-info';
      const title = document.createElement('div'); title.className = 'card-item-title'; title.textContent = project.title;
      const meta = document.createElement('div'); meta.className = 'card-item-date';
      const date = new Date(project.date);
      let layerCount = (project.customLayers || []).length;
      try { layerCount += (JSON.parse(project.rawLottieJson || JSON.stringify(project.baseData || {})).layers || []).length; } catch (e) {}
      meta.textContent = (isNaN(date) ? (project.date || 'Недавно') : date.toLocaleString('ru-RU')) + ' · ' + layerCount + ' слоёв';
      const weight = document.createElement('span'); weight.className = 'project-weight';
      try {
        const data = project.rawLottieJson || JSON.stringify(project.baseData);
        const previousFont = engine.font;
        let parsed;
        try {
          if (project.fontData) engine.loadFontFromBuffer(Uint8Array.from(atob(project.fontData), c => c.charCodeAt(0)).buffer);
          else engine.initFont();
          parsed = engine.buildCleanTgsExport(sourceWithColorOverrides(data, project.layerOverrides), { hiddenLayers: project.config?.hiddenLayers || [], layerOverrides: project.layerOverrides || {}, customLayers: (project.customLayers || []).filter(layer => !layer.hd) });
        } finally { engine.font = previousFont; }
        const bytes = pako.gzip(JSON.stringify(parsed), { level: 9 }).length;
        weight.textContent = (bytes / 1024).toFixed(1) + ' КБ TGS';
        const anim = lottie.loadAnimation({container: thumb, renderer: 'svg', autoplay: false, loop: true, animationData: parsed});
        thumb.animation = anim;
        card.addEventListener('mouseenter', () => anim.play());
        card.addEventListener('mouseleave', () => anim.goToAndStop(0, true));
      } catch (e) { weight.textContent = 'Нет превью'; }
      const actions = document.createElement('div'); actions.className = 'project-actions';
      const button = (label, handler) => { const b = document.createElement('button'); b.textContent = label; b.addEventListener('click', handler); actions.appendChild(b); };
      button('Открыть', () => openSavedProject(project));
      button('Дублировать', async () => {
        const copy = structuredClone(project); copy.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2); copy.title += ' — копия'; copy.date = new Date().toISOString();
        try { await storage.saveProject(copy); state.recentProjects.unshift(copy); renderRecentProjects(); }
        catch (e) { showToast('Не удалось дублировать проект', true); }
      });
      button('Удалить', async () => {
        if (!confirm('Удалить проект «' + project.title + '»?')) return;
        const next = state.recentProjects.filter(p => p.id !== project.id);
        try { await storage.deleteProject(project.id); state.recentProjects = next; renderRecentProjects(); }
        catch (e) { showToast('Не удалось удалить проект', true); }
      });
      info.append(title, meta, weight); card.append(thumb, info, actions); grid.appendChild(card);
    });
  }

  async function openSavedProject(project) {
    const source = project.rawLottieJson || project.baseData;
    if (!source && project.templateId) {
      const template = DEFAULT_TEMPLATES.find(item => item.id === project.templateId);
      if (template) { await openProjectData(template.data, project.title); return; }
    }
    if (!source) { showToast('В проекте отсутствует исходная анимация', true); return; }
    await openProjectData(source, project.title, project.config, project);
  }

  function renderTemplatesGrid() {
    dom.hubTemplatesGrid.innerHTML = '';
    DEFAULT_TEMPLATES.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="card-thumb">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8"/></svg>
        </div>
        <div class="card-info">
          <div class="card-item-title">${tpl.name}</div>
          <div class="card-item-date">${tpl.category} · 512×512</div>
        </div>
      `;
      card.addEventListener('click', () => {
        openProjectData(tpl.data, tpl.name);
      });
      dom.hubTemplatesGrid.appendChild(card);
    });
  }

  function createBlankProject() {
    const blankTpl = DEFAULT_TEMPLATES.find(t => t.id === 'blank') || DEFAULT_TEMPLATES[0];
    openProjectData(blankTpl.data, 'Новый проект 512×512');
  }

  async function openProjectData(lottieOrTgsData, title = 'Telegram Emoji 01', savedConfig = null, savedProject = null) {
    try {
      if (!restoring && state.screen === 'editor' && state.project.rawLottieJson && !(await saveNow(false))) return;
      if (!engine.font) {
        try {
          await engine.initFont();
        } catch (fErr) {
          console.warn('Font init in openProjectData:', fErr);
        }
      }
      const fontData = savedProject ? savedProject.fontData : settings.fontData;
      if (fontData) {
        const bytes = Uint8Array.from(atob(fontData), c => c.charCodeAt(0));
        await engine.loadFontFromBuffer(bytes.buffer);
      } else { await engine.initFont(); }
      state.project.fontData = fontData || null;
      state.project.customFontName = savedProject ? savedProject.fontName : settings.fontName;
      dom.fontNameLabel.textContent = state.project.customFontName || 'Загрузить кастомный шрифт';
      window.PRISTINE_RAW_JSON = null;
      const parsed = engine.parseTgsOrJson(lottieOrTgsData);
      const pristine = window.PRISTINE_RAW_JSON || engine.lastPristineRawJson || ((typeof lottieOrTgsData === 'string' && lottieOrTgsData.trim().startsWith('{')) ? lottieOrTgsData.trim() : JSON.stringify(parsed));
      window.PRISTINE_RAW_JSON = pristine;
      state.project.id = savedProject ? savedProject.id : 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      state.project.title = title;
      state.currentFrame = 0;
      state.isPlaying = false;
      dom.ctrlIconPlay.style.display = 'block';
      dom.ctrlIconPause.style.display = 'none';
      state.project.rawLottieJson = pristine;
      state.project.baseData = parsed;
      state.project.layerOverrides = structuredClone(savedProject?.layerOverrides || {});
      state.project.totalFrames = parsed.op || 180;
      state.selectedLayerData = null;

      // Expand all precomps by default so nested shapes are immediately visible
      state.expandedPrecomps = new Set();
      const tree = engine.getLayersTree(parsed);
      function expandAll(list) {
        list.forEach(item => {
          if (item.type === 0) {
            state.expandedPrecomps.add(item.id);
            if (item.children) expandAll(item.children);
          }
        });
      }
      expandAll(tree);

      if (savedProject && Array.isArray(savedProject.customLayers)) {
        state.project.customLayers = structuredClone(savedProject.customLayers);
        state.project.config = { ...state.project.config, ...savedConfig };
      } else if (savedConfig && Array.isArray(savedConfig.customLayers) && savedConfig.customLayers.length > 0) {
        state.project.customLayers = JSON.parse(JSON.stringify(savedConfig.customLayers));
        state.project.config = { ...state.project.config, ...savedConfig };
      } else if (savedConfig) {
        state.project.config = { ...state.project.config, ...savedConfig };
        state.project.customLayers = [{
          id: 'layer_' + Date.now(),
          type: 'text',
          name: savedConfig.text || 'HELLO',
          text: savedConfig.text || 'HELLO',
          pos: savedConfig.textPos ? [...savedConfig.textPos] : [256, 274],
          scale: savedConfig.textScale !== undefined ? savedConfig.textScale : 100,
          rot: savedConfig.textRotation !== undefined ? savedConfig.textRotation : 0,
          opacity: savedConfig.opacity !== undefined ? savedConfig.opacity : 100,
          colorHex: savedConfig.colorHex || '#FFFFFF',
          fontSize: savedConfig.fontSize || 60,
          parentLayer: savedConfig.parentLayer || 'none',
          zOffset: savedConfig.zOffset || 0
        }];
      } else {
        state.project.config = {
          text: 'HELLO',
          textPos: [256, 274],
          textScale: 100,
          textRotation: 0,
          fontSize: 60,
          colorHex: '#FFFFFF',
          opacity: 100,
          parentLayer: 'none',
          hiddenLayers: [],
          zOffset: 0
        };
        state.project.customLayers = [];
      }

      state.selectedLayerId = state.project.customLayers[0]?.id || null;

      switchScreen('editor');
    } catch (err) {
      showToast('Ошибка открытия файла: ' + err.message, true);
    }
  }

  function addTextLayer(pos = [256, 256], initialText = "TEXT") {
    const newId = 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newLayer = {
      id: newId,
      type: 'text',
      name: initialText,
      text: initialText,
      pos: [...pos],
      scale: 100,
      rot: 0,
      opacity: 100,
      colorHex: '#FFFFFF',
      fontSize: 60,
      parentLayer: 'none',
      zOffset: 0
    };
    state.project.customLayers.push(newLayer);
    selectLayer({ id: newId, isCustom: true, ...newLayer });
    rebuildLottieAnimation();
    buildOutliner();
    buildTimeline();
    showToast(`Добавлен текстовый слой «${initialText}»`);
  }

  function addLogoLayer(name, format, vectorShapes, pos = [256, 256]) {
    const newId = 'logo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newLayer = {
      id: newId,
      type: 'logo',
      format: format,
      name: name || 'Logo',
      vectorShapes: vectorShapes,
      pos: [...pos],
      scale: 100,
      rot: 0,
      opacity: 100,
      parentLayer: 'none',
      zOffset: 0
    };
    state.project.customLayers.push(newLayer);
    selectLayer({ id: newId, isCustom: true, ...newLayer });
    rebuildLottieAnimation();
    buildOutliner();
    buildTimeline();
    showToast(`Логотип «${name}» успешно добавлен и векторизован!`);
  }

  function deleteCustomLayer(layerId) {
    if (!state.project.customLayers || state.project.customLayers.length === 0) return;
    const idx = state.project.customLayers.findIndex(l => l.id === layerId);
    if (idx !== -1) {
      const removed = state.project.customLayers.splice(idx, 1)[0];
      if (state.project.customLayers.length > 0) {
        const nextLayer = state.project.customLayers[Math.max(0, idx - 1)];
        selectLayer({ id: nextLayer.id, isCustom: true, ...nextLayer });
      } else {
        state.selectedLayerId = null;
        dom.canvasTextBox.style.display = 'none';
        syncPropertiesToInputs();
      }
      rebuildLottieAnimation();
      buildOutliner();
      buildTimeline();
      showToast(`Слой «${removed.name}» удален`);
    }
  }

  // 8. EDITOR STUDIO CORE: RENDER & REBUILD
  async function renderEditor() {
    if (!engine.font) {
      try {
        await engine.initFont();
      } catch (e) {
        console.warn('Font load in renderEditor:', e);
      }
    }
    dom.projectTitleInput.value = state.project.title;
    syncPropertiesToInputs();
    rebuildLottieAnimation();
    buildOutliner();
    buildTimeline();
  }

  let textRenderTimer = null;
  function scheduleTextRender() {
    scheduleSave();
    clearTimeout(textRenderTimer);
    textRenderTimer = setTimeout(() => { textRenderTimer = null; rebuildLottieAnimation(); }, 75);
  }
  function flushTextRender() {
    if (textRenderTimer !== null) { clearTimeout(textRenderTimer); textRenderTimer = null; rebuildLottieAnimation(); }
  }

  function rebuildLottieAnimation() {
    if (textRenderTimer !== null) { clearTimeout(textRenderTimer); textRenderTimer = null; }
    scheduleSave();
    if (!window.PRISTINE_RAW_JSON && state.project.rawLottieJson) {
      window.PRISTINE_RAW_JSON = state.project.rawLottieJson;
    } else if (!window.PRISTINE_RAW_JSON && state.project.baseData) {
      window.PRISTINE_RAW_JSON = JSON.stringify(state.project.baseData);
    }
    const sourceJson = window.PRISTINE_RAW_JSON || state.project.rawLottieJson;
    if (!sourceJson) return;

    try {
      // 1. Deep clone from clean immutable PRISTINE_RAW_JSON source
      const renderData = JSON.parse(sourceWithColorOverrides(sourceJson, state.project.layerOverrides));

      // Ensure root animation structure and bounds
      if (!renderData.layers || !Array.isArray(renderData.layers)) {
        renderData.layers = [];
      }
      renderData.tgs = 1;
      renderData.fr = renderData.fr || 60;
      renderData.w = renderData.w || 512;
      renderData.h = renderData.h || 512;
      renderData.ip = renderData.ip !== undefined ? renderData.ip : 0;
      renderData.op = renderData.op !== undefined ? renderData.op : 180;

      // 2. Filter out any previous custom or legacy text layers
      renderData.layers = renderData.layers.filter(l => l && l.ty !== 5 && !(typeof l.nm === 'string' && l.nm.startsWith("CUSTOM_")));

      // 3. Apply hidden layers (hd: true) and timeline ip/op overrides to root layers
      const hiddenList = state.project.config.hiddenLayers || [];
      const overrides = state.project.layerOverrides || {};

      renderData.layers.forEach(l => {
        if (!l) return;
        if (hiddenList.includes(l.ind) || hiddenList.includes(Number(l.ind)) || hiddenList.includes(String(l.ind))) {
          l.hd = true;
        }
        if (overrides[l.ind]) {
          if (overrides[l.ind].ip !== undefined) l.ip = overrides[l.ind].ip;
          if (overrides[l.ind].op !== undefined) l.op = overrides[l.ind].op;
        }
      });

      // 4. Apply hidden layers and timeline ip/op overrides inside precomposition assets WITHOUT breaking assets structure
      if (renderData.assets && Array.isArray(renderData.assets)) {
        renderData.assets.forEach(asset => {
          if (asset && asset.layers && Array.isArray(asset.layers)) {
            asset.layers.forEach(l => {
              if (!l) return;
              const compKey = `${asset.id}:${l.ind}`;
              if (hiddenList.includes(compKey) || hiddenList.includes(l.ind) || hiddenList.includes(Number(l.ind)) || hiddenList.includes(String(l.ind))) {
                l.hd = true;
              }
              if (overrides[compKey]) {
                if (overrides[compKey].ip !== undefined) l.ip = overrides[compKey].ip;
                if (overrides[compKey].op !== undefined) l.op = overrides[compKey].op;
              }
            });
          }
        });
      }

      // 5. Ensure font is parsed and ready before generating custom text layers
      if (!engine.font) {
        try {
          engine.initFont();
        } catch (fErr) {
          console.warn('initFont in rebuildLottieAnimation:', fErr);
        }
      }

      // 6. Find max existing ind across root layers and precomp assets to guarantee unique ind
      let maxExistingInd = 0;
      if (renderData.layers && Array.isArray(renderData.layers)) {
        renderData.layers.forEach(l => {
          if (l && typeof l.ind === 'number' && l.ind > maxExistingInd) {
            maxExistingInd = l.ind;
          }
        });
      }
      if (renderData.assets && Array.isArray(renderData.assets)) {
        renderData.assets.forEach(asset => {
          if (asset && asset.layers && Array.isArray(asset.layers)) {
            asset.layers.forEach(l => {
              if (l && typeof l.ind === 'number' && l.ind > maxExistingInd) {
                maxExistingInd = l.ind;
              }
            });
          }
        });
      }

      // Build and inject custom layers (ty: 4) into root renderData.layers
      const customLayers = state.project.customLayers || [];
      customLayers.forEach((layer, idx) => {
        const ind = maxExistingInd + 1 + idx;
        const pos = layer.pos || [256, 274];
        const scale = layer.scale !== undefined ? layer.scale : 100;
        const rot = layer.rot !== undefined ? layer.rot : 0;
        const opacity = layer.opacity !== undefined ? layer.opacity : 100;
        const parentInd = (layer.parentLayer !== undefined && layer.parentLayer !== 'none' && layer.parentLayer !== null)
          ? Number(layer.parentLayer)
          : null;

        let shapeLayer = null;

        if (layer.type === 'logo') {
          const shapes = layer.vectorShapes || [];
          shapeLayer = {
            ddd: 0,
            ind: ind,
            ty: 4,
            nm: layer.name ? `CUSTOM_LOGO_${layer.name}` : `CUSTOM_LOGO_${idx + 1}`,
            cl: `custom-layer-${layer.id}`,
            ln: `layer-${layer.id}`,
            sr: 1,
            ks: {
              o: { a: 0, k: opacity },
              r: { a: 0, k: rot },
              p: { a: 0, k: [pos[0], pos[1], 0] },
              a: { a: 0, k: [0, 0, 0] },
              s: { a: 0, k: [scale, scale, 100] }
            },
            ao: 0,
            shapes: shapes,
            ip: layer.ip !== undefined ? layer.ip : renderData.ip,
            op: layer.op !== undefined ? layer.op : renderData.op,
            st: 0,
            bm: 0
          };
        } else {
          // Text layer: generate native Bezier shapes (ty: 4)
          const text = (layer.text !== undefined && layer.text !== null) ? layer.text : "HELLO";
          const baseSize = layer.fontSize || 60;
          const fontSize = engine.calculateFontSize(text.length, baseSize);

          shapeLayer = engine.textToLottieShapeLayer(text, {
            fontSize: fontSize,
            pos: pos,
            scale: scale,
            rot: rot,
            parent: parentInd,
            color: layer.colorHex || "#FFFFFF",
            ip: layer.ip !== undefined ? layer.ip : renderData.ip,
            op: layer.op !== undefined ? layer.op : renderData.op,
            ind: ind,
            cl: `custom-layer-${layer.id}`,
            ln: `layer-${layer.id}`,
            opacity: opacity,
            nm: layer.name ? `CUSTOM_TEXT_${layer.name}` : `CUSTOM_TEXT_${idx + 1}`
          });
        }

        if (layer.hd) shapeLayer.hd = true;
        if (parentInd !== null) {
          shapeLayer.parent = parentInd;
        }

        // Smart Z-order placement
        let defaultInsertIndex = 0;
        const targetLayers = (layer.parentAssetId && renderData.assets?.find(asset => asset.id === layer.parentAssetId)?.layers) || renderData.layers;
        const parentIdx = (parentInd !== null) ? targetLayers.findIndex(l => l.ind === parentInd) : -1;
        if (parentIdx !== -1) {
          defaultInsertIndex = parentIdx;
        } else {
          defaultInsertIndex = 0;
        }

        let insertIdx = defaultInsertIndex;
        if (layer.zOffset !== undefined && layer.zOffset !== null) {
          insertIdx = defaultInsertIndex + Number(layer.zOffset);
        }
        insertIdx = Math.max(0, Math.min(targetLayers.length, insertIdx));
        targetLayers.splice(insertIdx, 0, shapeLayer);
      });

      // Keep project.lottieData updated for preview
      state.project.lottieData = renderData;

      // Validate .TGS size (< 64 KB Telegram limit) directly from pristine raw JSON + editor state
      try {
        const rawPristine = window.PRISTINE_RAW_JSON || state.project.rawLottieJson;
        if (rawPristine) {
          const editorState = {
            hiddenLayers: state.project.config.hiddenLayers || [],
            layerOverrides: state.project.layerOverrides || {},
            customLayers: (state.project.customLayers || []).filter(layer => !layer.hd)
          };
          const tgsBytes = engine.exportPristineToTgsBytes(sourceWithColorOverrides(rawPristine, state.project.layerOverrides), editorState, { checkSize: false });
          const sizeKb = (tgsBytes.length / 1024).toFixed(1);
          dom.tgsSizeText.textContent = `Размер TGS: ${sizeKb} / 64.0 КБ`;
          if (tgsBytes.length <= 65536) {
            dom.tgsSizeBadge.className = 'tgs-size-badge safe';
            dom.modalTgsStatus.textContent = `Размер: ${sizeKb} КБ (Совместимо с Telegram)`;
            dom.modalTgsStatus.style.color = 'var(--accent-turquoise)';
          } else {
            dom.tgsSizeBadge.className = 'tgs-size-badge warning';
            dom.modalTgsStatus.textContent = `Размер: ${sizeKb} КБ — Превышает 64.0 КБ!`;
            dom.modalTgsStatus.style.color = 'var(--danger-color)';
          }
        }
      } catch (e) {}

      updateCompositionInspector();

      // 7. Safely destroy previous animation instance
      if (state.animInstance) {
        try {
          state.animInstance.destroy();
        } catch (e) {
          console.warn('Destroy animation warning:', e);
        }
        state.animInstance = null;
      }

      // 8. Empty container before creating new animation
      dom.lottieHost.innerHTML = '';

      // 9. Load animation with lottie-web wrapped in try / catch
      // ALWAYS pass a cloned copy so lottie-web mutations can never contaminate renderData or PRISTINE_RAW_JSON
      state.totalFrames = renderData.op || 180;
      state.animInstance = window.lottie.loadAnimation({
        container: dom.lottieHost,
        renderer: 'svg',
        loop: state.isLooping,
        autoplay: state.isPlaying,
        animationData: JSON.parse(JSON.stringify(renderData))
      });

      state.animInstance.addEventListener('DOMLoaded', () => { updateBoundingBoxPosition(); if (state.selectedLayerData) highlightLayerOnCanvas(state.selectedLayerData); });
      state.animInstance.addEventListener('enterFrame', (e) => {
        state.currentFrame = Math.round(e.currentTime);
        updatePlaybackDisplay();
        updateTimelinePlayheadPosition();
        updateBoundingBoxPosition();
      });

      state.animInstance.goToAndStop(state.currentFrame, true);
      if (state.isPlaying) state.animInstance.play();
      updateBoundingBoxPosition();

      // Re-apply layer highlight if a non-custom template layer is selected
      if (state.selectedLayerData && !getSelectedCustomLayer()) {
        highlightLayerOnCanvas(state.selectedLayerData);
      } else {
        highlightLayerOnCanvas(null);
      }

    } catch (err) {
      console.error('Lottie rebuild error:', err);
      showToast('Ошибка рендера анимации: ' + err.message, true);
    }
  }

  function syncPropertiesToInputs() {
    const layer = getSelectedCustomLayer();
    document.getElementById('section-composition').style.display = !layer && !state.selectedLayerData ? 'block' : 'none';
    updateCompositionInspector();
    updateColorInspector();
    if (layer) {
      dom.propPosX.value = layer.pos[0];
      dom.propPosY.value = layer.pos[1];
      dom.propScale.value = layer.scale;
      dom.propRot.value = layer.rot || 0;
      dom.propOpacity.value = layer.opacity !== undefined ? layer.opacity : 100;
      dom.zOrderHint.textContent = `Смещение Z: ${(layer.zOffset || 0) >= 0 ? '+' : ''}${layer.zOffset || 0}`;

      if (layer.type === 'logo') {
        dom.sectionTextProps.style.display = 'none';
        dom.sectionLogoProps.style.display = 'block';
        dom.selectedLogoName.textContent = layer.name;
        dom.selectedLogoFormat.textContent = layer.format ? layer.format.toUpperCase() : 'VECTOR';
      } else {
        dom.sectionTextProps.style.display = 'block';
        dom.sectionLogoProps.style.display = 'none';
        dom.propTextContent.value = layer.text || '';
        dom.propColorNative.value = layer.colorHex || '#FFFFFF';
        dom.propColorHex.value = layer.colorHex || '#FFFFFF';
      }

      dom.sectionTransform.style.display = 'block';
      dom.sectionCustomCommon.style.display = 'block';
      dom.sectionLayerProps.style.display = 'none';
      dom.canvasTextBox.style.display = 'block';

      populateParentDropdown(layer.parentLayer);
    } else if (state.selectedLayerData) {
      dom.sectionTransform.style.display = 'none';
      dom.sectionTextProps.style.display = 'none';
      dom.sectionLogoProps.style.display = 'none';
      dom.sectionCustomCommon.style.display = 'none';
      dom.sectionLayerProps.style.display = 'block';
      dom.canvasTextBox.style.display = 'none';
    } else {
      dom.sectionTransform.style.display = 'none';
      dom.sectionTextProps.style.display = 'none';
      dom.sectionLogoProps.style.display = 'none';
      dom.sectionCustomCommon.style.display = 'none';
      dom.sectionLayerProps.style.display = 'none';
      dom.canvasTextBox.style.display = 'none';
    }
  }

  function populateParentDropdown(currentParent = 'none') {
    dom.propParentSelect.innerHTML = '<option value="none">Без привязки (статично)</option>';
    if (!state.project.baseData) return;

    const tree = engine.getLayersTree(state.project.baseData);
    function addOptions(list) {
      list.forEach(l => {
        if (!l.isText && !l.isCustom) {
          const opt = document.createElement('option');
          opt.value = l.id;
          opt.textContent = `${l.ind}: ${l.name} (${l.typeName})`;
          const selected = getSelectedCustomLayer();
          if (String(currentParent) === String(l.ind) && (selected?.parentAssetId || null) === (l.assetId || null)) {
            opt.selected = true;
          }
          dom.propParentSelect.appendChild(opt);
        }
        if (l.children && l.children.length > 0) addOptions(l.children);
      });
    }
    addOptions(tree);
  }

  // 9. OUTLINER WITH PRECOMP TREE, CLICK SELECTION & EYE TOGGLE
  function buildOutliner() {
    dom.outlinerLayersList.innerHTML = '';
    if (!state.project.baseData) return;

    const tree = engine.getLayersTree(state.project.baseData);

    let totalCount = (state.project.customLayers || []).length;
    function countLayers(list) {
      list.forEach(item => {
        totalCount++;
        if (item.children) countLayers(item.children);
      });
    }
    countLayers(tree);
    dom.outlinerCountBadge.textContent = totalCount;

    // 1. Render all Custom Layers (Text & Logos)
    (state.project.customLayers || []).forEach((cLayer) => {
      const isSelected = (state.selectedLayerId === cLayer.id);
      const isHidden = cLayer.hd;
      const row = document.createElement('div');
      row.className = 'layer-row-item is-text' + (isSelected ? ' active' : '') + (isHidden ? ' hidden-layer' : '');

      const isText = (cLayer.type === 'text');
      const tagClass = isText ? 'text' : 'logo';
      const tagLabel = isText ? 'TEXT' : 'LOGO';
      const displayName = isText ? `CUSTOM_TEXT ("${cLayer.text}")` : `LOGO ("${cLayer.name}")`;

      row.innerHTML = `
        <span class="layer-chevron placeholder"></span>
        <button class="layer-visibility-btn ${isHidden ? 'hidden' : ''}" title="Скрыть / Показать слой">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <div class="layer-type-tag ${tagClass}">${tagLabel}</div>
        <div class="layer-row-name" title="${displayName}">${displayName}</div>
        ${cLayer.parentLayer && cLayer.parentLayer !== 'none' ? `<button class="btn-icon-small" title="Привязан к: ${cLayer.parentLayer}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/></svg></button>` : ''}
        <button class="layer-row-delete-btn" title="Удалить слой">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      `;

      row.addEventListener('click', () => {
        selectLayer({ id: cLayer.id, isCustom: true, ...cLayer });
      });

      const eyeBtn = row.querySelector('.layer-visibility-btn');
      eyeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cLayer.hd = !cLayer.hd;
        rebuildLottieAnimation();
        buildOutliner();
      });

      const delBtn = row.querySelector('.layer-row-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCustomLayer(cLayer.id);
      });

      dom.outlinerLayersList.appendChild(row);
    });

    // 2. Render Hierarchical Tree (Top level + Precompositions)
    function renderTreeNodes(nodeList) {
      nodeList.forEach(item => {
        const hasChildren = (item.children && item.children.length > 0);
        const isExpanded = state.expandedPrecomps.has(item.id);
        const isSelected = (state.selectedLayerId === item.id);
        const isHidden = item.layerRef.hd || state.project.config.hiddenLayers.includes(item.id) || state.project.config.hiddenLayers.includes(item.ind);

        const row = document.createElement('div');
        row.className = 'layer-row-item' + (isSelected ? ' active' : '') + (isHidden ? ' hidden-layer' : '');
        row.style.paddingLeft = (item.depth * 14 + 8) + 'px';

        let chevronHtml = '<span class="layer-chevron placeholder"></span>';
        if (hasChildren) {
          chevronHtml = `
            <button class="layer-chevron ${isExpanded ? 'expanded' : ''}" title="${isExpanded ? 'Свернуть' : 'Раскрыть'} precomp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          `;
        }

        const tagClass = item.type === 0 ? 'preco' : (item.type === 4 ? 'shape' : (item.type === 3 ? 'null' : 'other'));
        const tagText = item.type === 0 ? 'PRECO' : item.typeName.substring(0, 5).toUpperCase();

        row.innerHTML = `
          ${chevronHtml}
          <button class="layer-visibility-btn ${isHidden ? 'hidden' : ''}" title="Скрыть / Показать слой">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <div class="layer-type-tag ${tagClass}">${tagText}</div>
          <div class="layer-row-name" title="${item.name}">${item.ind}: ${item.name}</div>
        `;

        if (hasChildren) {
          const chevronBtn = row.querySelector('.layer-chevron');
          chevronBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.expandedPrecomps.has(item.id)) {
              state.expandedPrecomps.delete(item.id);
            } else {
              state.expandedPrecomps.add(item.id);
            }
            buildOutliner();
            buildTimeline();
          });
        }

        const eyeBtn = row.querySelector('.layer-visibility-btn');
        eyeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleLayerItemVisibility(item);
        });

        row.addEventListener('click', () => {
          selectLayer(item);
        });

        dom.outlinerLayersList.appendChild(row);

        if (hasChildren && isExpanded) {
          renderTreeNodes(item.children);
        }
      });
    }

    renderTreeNodes(tree);
  }

  function toggleLayerItemVisibility(item) {
    // Toggle on the raw layer object directly
    item.layerRef.hd = !item.layerRef.hd;

    // Sync with hiddenLayers array
    const list = state.project.config.hiddenLayers;
    const targetKey = item.id;
    const indKey = item.ind;

    if (item.layerRef.hd) {
      if (!list.includes(targetKey)) list.push(targetKey);
      if (!list.includes(indKey)) list.push(indKey);
    } else {
      const idx1 = list.indexOf(targetKey);
      if (idx1 !== -1) list.splice(idx1, 1);
      const idx2 = list.indexOf(indKey);
      if (idx2 !== -1) list.splice(idx2, 1);
    }

    rebuildLottieAnimation();
    buildOutliner();
    if (state.selectedLayerData && state.selectedLayerData.id === item.id) {
      dom.labelToggleSelectedVisibility.textContent = item.layerRef.hd ? 'Показать слой' : 'Скрыть слой';
    }
  }

  // 10. LAYER SELECTION & CANVAS VISUAL HIGHLIGHT
  function selectLayer(layerItem) {
    if (!layerItem) return;
    if (state.selectedLayerId !== layerItem.id) state.selectedColorPath = null;

    const isCustom = layerItem.isCustom || (state.project.customLayers && state.project.customLayers.some(l => l.id === layerItem.id));

    if (isCustom) {
      state.selectedLayerId = layerItem.id;
      state.selectedLayerData = null;
      syncPropertiesToInputs();
      updateBoundingBoxPosition();
      highlightLayerOnCanvas(null);
    } else {
      state.selectedLayerId = layerItem.id;
      state.selectedLayerData = layerItem;
      document.getElementById('section-composition').style.display = 'none';
      updateColorInspector();
      dom.sectionTransform.style.display = 'none';
      dom.sectionTextProps.style.display = 'none';
      dom.sectionLogoProps.style.display = 'none';
      dom.sectionCustomCommon.style.display = 'none';
      dom.sectionLayerProps.style.display = 'block';

      dom.selectedLayerName.textContent = layerItem.name;
      dom.selectedLayerType.textContent = layerItem.typeName;
      dom.selectedLayerInd.textContent = layerItem.ind;
      dom.selectedLayerFrames.textContent = `${layerItem.ip}f – ${layerItem.op}f`;
      dom.labelToggleSelectedVisibility.textContent = layerItem.layerRef.hd ? 'Показать слой' : 'Скрыть слой';
      dom.canvasTextBox.style.display = 'none';

      highlightLayerOnCanvas(layerItem);
    }

    buildOutliner();
    buildTimeline();
    scheduleSave();
  }

  function highlightLayerOnCanvas(targetLayer) {
    if (!state.animInstance || !state.animInstance.renderer) return;
    const elements = state.animInstance.renderer.elements || [];

    function applyHighlight(elementList) {
      if (!elementList || !Array.isArray(elementList)) return;
      elementList.forEach(el => {
        const svgNode = el.layerElement || el.baseElement;
        if (!svgNode || !svgNode.style) return;

        if (!targetLayer) {
          svgNode.style.opacity = '1';
          svgNode.style.filter = 'none';
        } else {
          const isTarget = (el.data && (el.data === targetLayer.layerRef || (el.data.ind === targetLayer.ind && (!targetLayer.assetId || el.data.nm === targetLayer.name))));
          if (isTarget) {
            svgNode.style.opacity = '1';
            svgNode.style.filter = 'drop-shadow(0 0 10px #00D09C) drop-shadow(0 0 3px #FFFFFF)';
          } else {
            svgNode.style.opacity = '0.25';
            svgNode.style.filter = 'none';
          }
        }

        if (el.elements && Array.isArray(el.elements)) {
          applyHighlight(el.elements);
        }
      });
    }

    applyHighlight(elements);
  }

  function deselectAll() {
    state.selectedLayerId = null;
    state.selectedLayerData = null;
    state.selectedColorPath = null;
    dom.canvasTextBox.style.display = 'none';
    document.getElementById('section-composition').style.display = 'block';
    document.getElementById('section-layer-color').style.display = 'none';
    syncPropertiesToInputs();
    buildOutliner();
    buildTimeline();
    highlightLayerOnCanvas(null);
    scheduleSave();
  }

  // 11. INTERACTIVE CANVAS & TEXT/LOGO BOUNDING BOX (SCALE, ROTATION, DRAG)
  function updateBoundingBoxPosition() {
    const layer = getSelectedCustomLayer();
    if (!layer || layer.hd) {
      dom.canvasTextBox.style.display = 'none';
      return;
    }

    // 1. Look for the actual rendered SVG group element in lottie-web player
    const svgEl = dom.lottieHost.querySelector(`.custom-layer-${layer.id}`) ||
                  dom.lottieHost.querySelector(`#layer-${layer.id}`);

    if (svgEl) {
      const rect = svgEl.getBoundingClientRect();
      const cardRect = dom.canvasCard.getBoundingClientRect();

      if (rect.width > 2 && rect.height > 2) {
        const pad = 6;
        const localLeft = (rect.left - cardRect.left) / state.zoom - pad;
        const localTop = (rect.top - cardRect.top) / state.zoom - pad;
        const localWidth = (rect.width / state.zoom) + (pad * 2);
        const localHeight = (rect.height / state.zoom) + (pad * 2);

        dom.canvasTextBox.style.display = 'block';
        dom.canvasTextBox.style.left = localLeft + 'px';
        dom.canvasTextBox.style.top = localTop + 'px';
        dom.canvasTextBox.style.width = localWidth + 'px';
        dom.canvasTextBox.style.height = localHeight + 'px';
        dom.canvasTextBox.style.transform = 'none';
        return;
      }
    }

    // 2. Fallback if SVG element not yet rendered or has 0 size
    const pos = canvasPosition(layer);
    const scale = (layer.scale || 100) / 100;
    const len = (layer.text || layer.name || "TEXT").length;
    const w = Math.max(70, len * 26 * scale);
    const h = 48 * scale;

    dom.canvasTextBox.style.display = 'block';
    dom.canvasTextBox.style.left = (pos[0] - w / 2) + 'px';
    dom.canvasTextBox.style.top = (pos[1] - h / 2) + 'px';
    dom.canvasTextBox.style.width = w + 'px';
    dom.canvasTextBox.style.height = h + 'px';
    dom.canvasTextBox.style.transform = `rotate(${layer.rot || 0}deg)`;
  }

  function setupCanvasInteractions() {
    let activeAction = null; // 'drag' | 'scale' | 'rotate'
    let dragStartMouse = { x: 0, y: 0 };
    let initialConfig = null;
    let initialCenterDistance = 0;
    let initialAngle = 0;

    // Pan with Hand tool [H] or Spacebar
    let isPanning = false;
    let panStartMouse = { x: 0, y: 0 };
    let initialPan = { x: 0, y: 0 };
    let isSpacePressed = false;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); deselectAll(); return; }
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (!isSpacePressed) {
          isSpacePressed = true;
          dom.canvasViewport.style.cursor = 'grab';
        }
      }
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'v' || e.key === 'V' || e.key === 'м' || e.key === 'М') activateTool('select');
        if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') {
          activateTool('text');
        }
        if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') activateTool('hand');
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const selected = getSelectedCustomLayer();
          if (selected) deleteCustomLayer(selected.id);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        isSpacePressed = false;
        if (state.activeTool !== 'hand') {
          dom.canvasViewport.style.cursor = state.activeTool === 'text' ? 'crosshair' : 'default';
        }
      }
    });

    // Viewport panning
    dom.canvasViewport.addEventListener('mousedown', (e) => {
      if (state.activeTool === 'select' && e.target === dom.canvasViewport) deselectAll();
      if (e.button === 1 || state.activeTool === 'hand' || isSpacePressed) {
        isPanning = true;
        panStartMouse = { x: e.clientX, y: e.clientY };
        initialPan = { ...state.pan };
        dom.canvasViewport.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    // Tool [T] - Click anywhere on 512x512 canvas creates NEW independent text layer at that spot
    dom.canvasCard.addEventListener('click', (e) => {
      if (state.activeTool === 'select' && e.target === dom.canvasCard) { deselectAll(); return; }
      if (state.activeTool === 'text') {
        const rect = dom.canvasCard.getBoundingClientRect();
        const clickX = Math.round((e.clientX - rect.left) / state.zoom);
        const clickY = Math.round((e.clientY - rect.top) / state.zoom);

        const clampedX = Math.max(20, Math.min(492, clickX));
        const clampedY = Math.max(20, Math.min(492, clickY));

        addTextLayer([clampedX, clampedY], 'TEXT');
        activateTool('select');
        focusTextInput();
      }
    });

    dom.canvasViewport.addEventListener('click', e => {
      if (state.activeTool !== 'select' || e.target.closest('#playback-capsule') || e.target.closest('#canvas-text-box')) return;
      const customNode = e.target.closest('[class*="custom-layer-"]');
      if (customNode) {
        const layer = (state.project.customLayers || []).find(item => customNode.classList.contains(`custom-layer-${item.id}`));
        if (layer && !layer.hd) { selectLayer({ ...layer, isCustom: true }); return; }
      }
      if (e.target.closest('#lottie-player-container') && e.target.tagName.toLowerCase() !== 'svg' && e.target !== dom.lottieHost) {
        const tree = engine.getLayersTree(state.project.baseData);
        const findRenderedLayer = (elements, nodes) => {
          for (const element of elements || []) {
            const node = nodes.find(item => item.ind === element.data?.ind);
            if (!node) continue;
            const child = findRenderedLayer(element.elements, node.children || []);
            if (child) return child;
            const svg = element.layerElement || element.baseElement;
            if (svg && svg.contains(e.target)) return node;
          }
          return null;
        };
        const selected = findRenderedLayer(state.animInstance?.renderer?.elements, tree);
        if (selected) { selectLayer(selected); return; }
      }
      deselectAll();
    });

    // Bounding Box Center Dragging (Anywhere inside box)
    dom.canvasTextBox.addEventListener('mousedown', (e) => {
      if (state.activeTool !== 'select') return;
      if (e.target.dataset.handle) return; // handled by corner scale or rotation

      const layer = getSelectedCustomLayer();
      if (!layer) return;

      activeAction = 'drag';
      dragStartMouse = { x: e.clientX, y: e.clientY };
      initialConfig = {
        pos: [...layer.pos],
        scale: layer.scale,
        rot: layer.rot || 0
      };
      e.stopPropagation();
    });

    // Bounding Box 4 Corner Handles - SMOOTH RESIZE / SCALE
    dom.canvasTextBox.querySelectorAll('.bb-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        if (state.activeTool !== 'select') return;
        const layer = getSelectedCustomLayer();
        if (!layer) return;

        activeAction = 'scale';
        dragStartMouse = { x: e.clientX, y: e.clientY };
        initialConfig = {
          pos: [...layer.pos],
          scale: layer.scale,
          rot: layer.rot || 0
        };

        const boxRect = dom.canvasTextBox.getBoundingClientRect();
        const boxCenterX = boxRect.left + boxRect.width / 2;
        const boxCenterY = boxRect.top + boxRect.height / 2;
        initialCenterDistance = Math.hypot(e.clientX - boxCenterX, e.clientY - boxCenterY);
        if (initialCenterDistance < 10) initialCenterDistance = 10;

        e.stopPropagation();
        e.preventDefault();
      });
    });

    // Bounding Box Rotation Handle
    const rotHandle = dom.canvasTextBox.querySelector('.bb-rot-handle');
    if (rotHandle) {
      rotHandle.addEventListener('mousedown', (e) => {
        if (state.activeTool !== 'select') return;
        const layer = getSelectedCustomLayer();
        if (!layer) return;

        activeAction = 'rotate';
        initialConfig = {
          pos: [...layer.pos],
          scale: layer.scale,
          rot: layer.rot || 0
        };

        const boxRect = dom.canvasTextBox.getBoundingClientRect();
        const boxCenterX = boxRect.left + boxRect.width / 2;
        const boxCenterY = boxRect.top + boxRect.height / 2;
        initialAngle = Math.atan2(e.clientY - boxCenterY, e.clientX - boxCenterX) * (180 / Math.PI);

        e.stopPropagation();
        e.preventDefault();
      });
    }

    // Global Mousemove for Drag / Scale / Rotate / Pan
    window.addEventListener('mousemove', (e) => {
      if (isPanning) {
        state.pan.x = initialPan.x + (e.clientX - panStartMouse.x);
        state.pan.y = initialPan.y + (e.clientY - panStartMouse.y);
        updateCanvasTransform();
        scheduleSave();
        return;
      }

      if (!activeAction) return;
      const layer = getSelectedCustomLayer();
      if (!layer) return;

      if (activeAction === 'drag') {
        let dx = (e.clientX - dragStartMouse.x) / state.zoom;
        let dy = (e.clientY - dragStartMouse.y) / state.zoom;
        if (layer.parentLayer !== 'none' && layer.parentLayer != null) {
          const matrix = parentElement(layer.parentLayer, layer.parentAssetId)?.layerElement?.getCTM();
          if (matrix && Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) > 1e-8) {
            const inverse = matrix.inverse();
            const localX = inverse.a * dx + inverse.c * dy;
            const localY = inverse.b * dx + inverse.d * dy;
            dx = localX; dy = localY;
          }
        }
        const newX = Math.round(initialConfig.pos[0] + dx);
        const newY = Math.round(initialConfig.pos[1] + dy);

        layer.pos = [newX, newY];
        dom.propPosX.value = newX;
        dom.propPosY.value = newY;
        rebuildLottieAnimation();
        updateBoundingBoxPosition();
      } else if (activeAction === 'scale') {
        const boxRect = dom.canvasTextBox.getBoundingClientRect();
        const boxCenterX = boxRect.left + boxRect.width / 2;
        const boxCenterY = boxRect.top + boxRect.height / 2;
        const currentDist = Math.hypot(e.clientX - boxCenterX, e.clientY - boxCenterY);

        const ratio = currentDist / initialCenterDistance;
        const newScale = Math.max(10, Math.min(400, Math.round(initialConfig.scale * ratio)));

        layer.scale = newScale;
        dom.propScale.value = newScale;
        rebuildLottieAnimation();
        updateBoundingBoxPosition();
      } else if (activeAction === 'rotate') {
        const boxRect = dom.canvasTextBox.getBoundingClientRect();
        const boxCenterX = boxRect.left + boxRect.width / 2;
        const boxCenterY = boxRect.top + boxRect.height / 2;
        const currentAngle = Math.atan2(e.clientY - boxCenterY, e.clientX - boxCenterX) * (180 / Math.PI);
        const deltaAngle = currentAngle - initialAngle;

        let newRot = Math.round((initialConfig.rot + deltaAngle) % 360);
        if (newRot > 180) newRot -= 360;
        if (newRot < -180) newRot += 360;

        layer.rot = newRot;
        dom.propRot.value = newRot;
        rebuildLottieAnimation();
        updateBoundingBoxPosition();
      }
    });

    window.addEventListener('mouseup', () => {
      activeAction = null;
      if (isPanning) {
        isPanning = false;
        dom.canvasViewport.style.cursor = (state.activeTool === 'hand' || isSpacePressed) ? 'grab' : 'default';
      }
    });

    // Zoom Selector
    dom.canvasZoomSelect.addEventListener('change', (e) => {
      setCanvasZoom(parseFloat(e.target.value));
    });

    // Ctrl+Wheel Zoom
    dom.canvasViewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setCanvasZoom(Math.max(0.5, Math.min(2.5, state.zoom + delta)));
      }
    }, { passive: false });
  }

  function activateTool(toolName) {
    state.activeTool = toolName;
    [dom.toolSelect, dom.toolText, dom.toolHand].forEach(b => b.classList.remove('active'));
    if (toolName === 'select') dom.toolSelect.classList.add('active');
    if (toolName === 'text') dom.toolText.classList.add('active');
    if (toolName === 'hand') dom.toolHand.classList.add('active');

    if (toolName === 'hand') {
      dom.canvasViewport.style.cursor = 'grab';
      dom.canvasTextBox.style.pointerEvents = 'none';
    } else if (toolName === 'text') {
      dom.canvasViewport.style.cursor = 'crosshair';
      dom.canvasTextBox.style.pointerEvents = 'none';
    } else {
      dom.canvasViewport.style.cursor = 'default';
      dom.canvasTextBox.style.pointerEvents = 'all';
    }
  }

  function updateCanvasTransform() {
    dom.canvasCard.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
  }

  function setCanvasZoom(val) {
    state.zoom = Math.round(val * 100) / 100;
    scheduleSave();
    updateCanvasTransform();
    dom.canvasZoomSelect.value = state.zoom.toString();
  }

  function resetCanvasView() {
    state.zoom = 1.0;
    state.pan = { x: 0, y: 0 };
    updateCanvasTransform();
    dom.canvasZoomSelect.value = "1.0";
  }

  // 12. PLAYBACK CONTROLS
  function setupPlaybackControls() {
    dom.ctrlBtnPlay.addEventListener('click', togglePlayPause);
    dom.ctrlBtnFirst.addEventListener('click', () => {
      state.currentFrame = 0;
      scheduleSave();
      if (state.animInstance) state.animInstance.goToAndStop(0, true);
      updatePlaybackDisplay();
      updateTimelinePlayheadPosition();
      updateBoundingBoxPosition();
    });

    dom.ctrlBtnLoop.addEventListener('click', () => {
      state.isLooping = !state.isLooping;
      scheduleSave();
      dom.ctrlBtnLoop.classList.toggle('active', state.isLooping);
      if (state.animInstance) state.animInstance.loop = state.isLooping;
    });

    dom.ctrlBtnResetView.addEventListener('click', resetCanvasView);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlayPause();
      }
    });
  }

  function togglePlayPause() {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      if (state.animInstance) state.animInstance.play();
      dom.ctrlIconPlay.style.display = 'none';
      dom.ctrlIconPause.style.display = 'block';
    } else {
      if (state.animInstance) state.animInstance.pause();
      dom.ctrlIconPlay.style.display = 'block';
      dom.ctrlIconPause.style.display = 'none';
    }
  }

  function updatePlaybackDisplay() {
    const cur = String(state.currentFrame).padStart(2, '0');
    const tot = String(state.totalFrames);
    dom.frameIndicator.textContent = `${cur} / ${tot}f`;
  }

  // 13. PROPERTIES INSPECTOR BINDINGS (KEYBOARD + MOUSE WHEEL CONTROL)
  function attachWheelAndKeyControl(inputEl, onValueChange, step = 1, min = -Infinity, max = Infinity) {
    if (!inputEl) return;

    inputEl.addEventListener('input', (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val)) val = 0;
      val = Math.max(min, Math.min(max, val));
      onValueChange(val);
    });

    inputEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      let currentVal = parseFloat(inputEl.value) || 0;
      const direction = e.deltaY < 0 ? 1 : -1;
      let newVal = currentVal + (direction * step);
      newVal = Math.max(min, Math.min(max, newVal));
      inputEl.value = newVal;
      onValueChange(newVal);
    }, { passive: false });
  }

  function setupLayerColorControls() {
    const picker = document.getElementById('layer-color-picker');
    const hex = document.getElementById('layer-color-hex');
    picker.addEventListener('input', () => setLayerColor(picker.value));
    hex.addEventListener('change', () => { let value = hex.value.trim(); if (/^[0-9a-f]{6}$/i.test(value)) value = '#' + value; if (/^#[0-9a-f]{6}$/i.test(value)) setLayerColor(value); else updateColorInspector(); });
    document.getElementById('layer-color-reset').addEventListener('click', () => {
      const id = state.selectedLayerData?.id;
      if (id && state.project.layerOverrides[id]) { delete state.project.layerOverrides[id].colors; if (!Object.keys(state.project.layerOverrides[id]).length) delete state.project.layerOverrides[id]; }
      updateColorInspector(); rebuildLottieAnimation();
    });
  }

  function findParentNode(id) {
    const find = list => {
      for (const item of list) {
        if (String(item.id) === String(id)) return item;
        const child = find(item.children || []);
        if (child) return child;
      }
      return null;
    };
    return find(engine.getLayersTree(state.project.baseData));
  }

  function parentElement(ind, assetId = null) {
    function find(elements, currentAsset = null) {
      for (const element of elements || []) {
        if (currentAsset === assetId && String(element?.data?.ind) === String(ind)) return element;
        const child = find(element?.elements, element?.data?.refId || currentAsset);
        if (child) return child;
      }
      return null;
    }
    return find(state.animInstance?.renderer?.elements);
  }

  function canvasPosition(layer) {
    if (layer.parentLayer === 'none' || layer.parentLayer == null) return [...layer.pos];
    const svg = parentElement(layer.parentLayer, layer.parentAssetId)?.layerElement;
    const matrix = svg?.getCTM();
    if (!matrix) return [256, 256];
    const point = new DOMPoint(layer.pos[0], layer.pos[1]).matrixTransform(matrix);
    return [Math.round(point.x), Math.round(point.y)];
  }

  function setLayerParent(layer, parentId) {
    const currentId = layer.parentAssetId ? `${layer.parentAssetId}:${layer.parentLayer}` : String(layer.parentLayer);
    if (currentId === String(parentId)) return;
    if (parentId === 'none') {
      layer.pos = canvasPosition(layer);
      layer.parentLayer = 'none';
      delete layer.parentAssetId;
    } else {
      const node = findParentNode(parentId);
      if (!node) { showToast('Родительский слой не найден', true); return; }
      const animatedAnchor = parentElement(node.ind, node.assetId)?.finalTransform?.mProp?.a?.v;
      const anchor = node.layerRef.ks?.a?.a === 0 ? node.layerRef.ks.a.k : (animatedAnchor ? [-animatedAnchor[0], -animatedAnchor[1]] : [0, 0]);
      layer.pos = [Number(anchor[0]) || 0, Number(anchor[1]) || 0];
      layer.parentLayer = String(node.ind);
      if (node.assetId) layer.parentAssetId = node.assetId; else delete layer.parentAssetId;
    }
    if (getSelectedCustomLayer()?.id === layer.id) syncPropertiesToInputs();
    rebuildLottieAnimation();
    buildOutliner();
  }

  function setupPropertiesInspector() {
    // Position X & Y
    attachWheelAndKeyControl(dom.propPosX, (val) => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.pos[0] = Math.round(val);
      rebuildLottieAnimation();
      updateBoundingBoxPosition();
    }, 1, -512, 1024);

    attachWheelAndKeyControl(dom.propPosY, (val) => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.pos[1] = Math.round(val);
      rebuildLottieAnimation();
      updateBoundingBoxPosition();
    }, 1, -512, 1024);

    // Scale
    attachWheelAndKeyControl(dom.propScale, (val) => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.scale = Math.round(val);
      rebuildLottieAnimation();
      updateBoundingBoxPosition();
    }, 5, 10, 400);

    // Rotation
    attachWheelAndKeyControl(dom.propRot, (val) => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.rot = Math.round(val);
      rebuildLottieAnimation();
      updateBoundingBoxPosition();
    }, 5, -360, 360);

    // Opacity
    attachWheelAndKeyControl(dom.propOpacity, (val) => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.opacity = Math.round(val);
      rebuildLottieAnimation();
    }, 5, 0, 100);

    // Text Content
    dom.propTextContent.addEventListener('input', (e) => {
      const layer = getSelectedCustomLayer();
      if (!layer || layer.type !== 'text') return;
      layer.text = e.target.value;
      layer.name = e.target.value;
      scheduleTextRender();
      updateBoundingBoxPosition();
      buildOutliner();
    });

    // Colors
    dom.propColorNative.addEventListener('input', (e) => {
      const layer = getSelectedCustomLayer();
      if (!layer || layer.type !== 'text') return;
      layer.colorHex = e.target.value;
      dom.propColorHex.value = e.target.value;
      rebuildLottieAnimation();
    });

    dom.propColorHex.addEventListener('change', (e) => {
      const layer = getSelectedCustomLayer();
      if (!layer || layer.type !== 'text') return;
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      layer.colorHex = val;
      dom.propColorNative.value = val;
      rebuildLottieAnimation();
    });

    // Swatches
    document.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const layer = getSelectedCustomLayer();
        if (!layer || layer.type !== 'text') return;
        const col = btn.dataset.color;
        layer.colorHex = col;
        dom.propColorNative.value = col;
        dom.propColorHex.value = col;
        rebuildLottieAnimation();
      });
    });

    // Parent Layer Select
    dom.propParentSelect.addEventListener('change', (e) => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      setLayerParent(layer, e.target.value);
      showToast(`Слой привязан к: ${e.target.value}`);
      buildOutliner();
    });

    // Z-Order
    dom.btnZDeeper.addEventListener('click', () => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.zOffset = (layer.zOffset || 0) + 1;
      dom.zOrderHint.textContent = `Смещение Z: +${layer.zOffset}`;
      rebuildLottieAnimation();
    });

    dom.btnZHigher.addEventListener('click', () => {
      const layer = getSelectedCustomLayer();
      if (!layer) return;
      layer.zOffset = (layer.zOffset || 0) - 1;
      dom.zOrderHint.textContent = `Смещение Z: ${layer.zOffset}`;
      rebuildLottieAnimation();
    });

    // Custom Font Upload
    dom.btnBrowseFont.addEventListener('click', () => dom.fontFileInput.click());
    dom.fontFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        engine.loadFontFromBuffer(buf);
        state.project.fontData = await fileToBase64(file);
        state.project.customFontName = file.name;
        dom.fontNameLabel.textContent = file.name;
        rebuildLottieAnimation();
        showToast(`Шрифт «${file.name}» успешно подключен!`);
      } catch (err) {
        showToast('Ошибка загрузки шрифта: ' + err.message, true);
      }
    });

    // Selected non-text layer controls
    dom.btnToggleSelectedVisibility.addEventListener('click', () => {
      if (state.selectedLayerData) {
        toggleLayerItemVisibility(state.selectedLayerData);
      }
    });

    dom.btnParentToSelected.addEventListener('click', () => {
      const customLayer = getSelectedCustomLayer() || (state.project.customLayers && state.project.customLayers[0]);
      if (state.selectedLayerData && customLayer) {
        setLayerParent(customLayer, state.selectedLayerData.id);
        dom.propParentSelect.value = state.selectedLayerData.id;
        buildOutliner();
        showToast(`Слой «${customLayer.name}» привязан к: ${state.selectedLayerData.ind} (${state.selectedLayerData.name})`);
      }
    });

    // Outliner + Dropdown Actions
    dom.outlinerAddBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.outlinerAddDropdown.classList.toggle('active');
    });

    dom.btnAddTextAction.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.outlinerAddDropdown.classList.remove('active');
      addTextLayer([256, 256], 'TEXT');
      activateTool('select');
      focusTextInput();
    });

    dom.btnAddLogoAction.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.outlinerAddDropdown.classList.remove('active');
      dom.logoFileInput.value = '';
      dom.logoFileInput.click();
    });

    window.addEventListener('click', (e) => {
      if (!e.target.closest('.outliner-add-container')) {
        dom.outlinerAddDropdown.classList.remove('active');
      }
    });

    // Logo File Upload (SVG / PNG / JPG) with Client-Side Vectorizer
    dom.logoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const ext = file.name.split('.').pop().toLowerCase();
      showProgress('Векторизация логотипа', `Обработка файла «${file.name}»...`);

      try {
        if (ext === 'svg') {
          const text = await file.text();
          const shapes = engine.svgToLottieShapes(text);
          if (shapes.length === 0) {
            throw new Error('Не удалось извлечь векторные контуры из SVG файла');
          }
          addLogoLayer(file.name.replace(/\.[^/.]+$/, ''), 'svg', shapes, [256, 256]);
        } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
          const reader = new FileReader();
          const dataUrl = await new Promise((res, rej) => {
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(file);
          });
          const shapes = await engine.rasterImageToLottieShapes(dataUrl, { maxDim: 96 });
          if (shapes.length === 0) {
            throw new Error('Не удалось трассировать контуры изображения');
          }
          addLogoLayer(file.name.replace(/\.[^/.]+$/, ''), 'png', shapes, [256, 256]);
        } else {
          throw new Error('Поддерживаются только форматы .svg, .png, .jpg');
        }
      } catch (err) {
        showToast('Ошибка импорта логотипа: ' + err.message, true);
      } finally {
        hideProgress();
      }
    });

    // Replace Logo button
    dom.btnReplaceLogo.addEventListener('click', () => {
      dom.logoFileInput.value = '';
      dom.logoFileInput.click();
    });

    // Delete Custom Layer button
    dom.btnDeleteCustomLayer.addEventListener('click', () => {
      if (state.selectedLayerId) {
        deleteCustomLayer(state.selectedLayerId);
      }
    });

    // Project Name In-Place Rename
    dom.projectTitleInput.addEventListener('input', (e) => {
      state.project.title = e.target.value;
      scheduleSave();
    });
  }

  function focusTextInput() {
    dom.propTextContent.focus();
    dom.propTextContent.select();
  }

  // 14. INTERACTIVE TIMELINE (BOTTOM PANEL)
  function buildTimeline() {
    dom.timelineRuler.innerHTML = '';
    const total = state.totalFrames;
    const step = 30;

    for (let f = 0; f <= total; f += step) {
      const pct = (f / total) * 100;
      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.style.left = pct + '%';
      tick.textContent = f + 'f';
      dom.timelineRuler.appendChild(tick);
    }

    dom.timelineTracksLeft.innerHTML = '';
    dom.timelineBarsStack.innerHTML = '';

    if (!state.project.baseData) return;
    const tree = engine.getLayersTree(state.project.baseData);

    // 1. Custom layers tracks (Text & Logos)
    (state.project.customLayers || []).forEach(cLayer => {
      const isText = (cLayer.type === 'text');
      const label = isText ? `TEXT: ${cLayer.text}` : `LOGO: ${cLayer.name}`;
      addTimelineTrackRow(cLayer.id, label, cLayer.ip ?? 0, cLayer.op ?? total, true, { id: cLayer.id, isCustom: true, ...cLayer });
    });

    // 2. Template layers tracks (flattened tree)
    function addTreeRows(list) {
      list.forEach(item => {
        const override = state.project.layerOverrides[item.id] || {};
        const ip = override.ip ?? item.ip ?? 0;
        const op = override.op ?? item.op ?? total;
        addTimelineTrackRow(item.id, item.name, ip, op, false, item);
        if (item.children && item.children.length > 0 && state.expandedPrecomps.has(item.id)) {
          addTreeRows(item.children);
        }
      });
    }
    addTreeRows(tree);

  }

  function addTimelineTrackRow(id, name, ip, op, isText = false, layerItem = null) {
    const isSelected = (state.selectedLayerId === id);

    // Left label
    const labelRow = document.createElement('div');
    labelRow.className = 'tl-track-label-row' + (isSelected ? ' active' : '');
    labelRow.textContent = name;
    labelRow.addEventListener('click', () => {
      selectLayer(layerItem || { id: 'CUSTOM_TEXT', isText: true, name: 'CUSTOM_TEXT_VECTOR' });
    });
    dom.timelineTracksLeft.appendChild(labelRow);

    // Right bar track
    const barTrackRow = document.createElement('div');
    barTrackRow.className = 'tl-bar-track-row';

    const bar = document.createElement('div');
    bar.className = 'tl-layer-bar' + (isText ? ' is-text' : '');
    
    const total = state.totalFrames || 180;
    const leftPct = (ip / total) * 100;
    const widthPct = Math.max(4, ((op - ip) / total) * 100);

    bar.style.left = leftPct + '%';
    bar.style.width = widthPct + '%';
    bar.textContent = `${name} [${ip}f - ${op}f]`;

    bar.addEventListener('click', (e) => {
      e.stopPropagation();
      selectLayer(layerItem || { id: 'CUSTOM_TEXT', isText: true, name: 'CUSTOM_TEXT_VECTOR' });
    });

    const hLeft = document.createElement('div');
    hLeft.className = 'tl-bar-handle left';
    const hRight = document.createElement('div');
    hRight.className = 'tl-bar-handle right';

    // Drag handle left to modify in-point (ip)
    hLeft.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const initialIp = ip;
      const initialOp = op;
      const rect = dom.timelineBarsContainer.getBoundingClientRect();

      function onMouseMove(moveEv) {
        const deltaX = moveEv.clientX - startX;
        const deltaFrames = Math.round((deltaX / rect.width) * total);
        let newIp = Math.max(0, Math.min(initialOp - 1, initialIp + deltaFrames));
        if (layerItem) {
          layerItem.ip = newIp;
          if (layerItem.isCustom) {
            const cLayer = state.project.customLayers.find(l => l.id === layerItem.id);
            if (cLayer) cLayer.ip = newIp;
          } else {
            state.project.layerOverrides[layerItem.id] = state.project.layerOverrides[layerItem.id] || {};
            state.project.layerOverrides[layerItem.id].ip = newIp;
          }
        }
        rebuildLottieAnimation();
        buildTimeline();
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Drag handle right to modify out-point (op)
    hRight.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const initialIp = ip;
      const initialOp = op;
      const rect = dom.timelineBarsContainer.getBoundingClientRect();

      function onMouseMove(moveEv) {
        const deltaX = moveEv.clientX - startX;
        const deltaFrames = Math.round((deltaX / rect.width) * total);
        let newOp = Math.max(initialIp + 1, Math.min(total, initialOp + deltaFrames));
        if (layerItem) {
          layerItem.op = newOp;
          if (layerItem.isCustom) {
            const cLayer = state.project.customLayers.find(l => l.id === layerItem.id);
            if (cLayer) cLayer.op = newOp;
          } else {
            state.project.layerOverrides[layerItem.id] = state.project.layerOverrides[layerItem.id] || {};
            state.project.layerOverrides[layerItem.id].op = newOp;
          }
        }
        rebuildLottieAnimation();
        buildTimeline();
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    bar.appendChild(hLeft);
    bar.appendChild(hRight);
    barTrackRow.appendChild(bar);
    dom.timelineBarsStack.appendChild(barTrackRow);
  }

  function setupTimelinePlayheadScrubbing() {
    let isScrubbing = false;

    function scrub(e) {
      const rect = dom.timelineBarsContainer.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const pct = x / rect.width;
      const targetFrame = Math.round(pct * state.totalFrames);
      
      state.currentFrame = targetFrame;
      scheduleSave();
      if (state.animInstance) {
        state.animInstance.goToAndStop(targetFrame, true);
      }
      updatePlaybackDisplay();
      updateTimelinePlayheadPosition();
    }

    dom.timelineRuler.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      if (state.isPlaying) togglePlayPause();
      scrub(e);
    });

    dom.timelineBarsContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      if (state.isPlaying) togglePlayPause();
      scrub(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) scrub(e);
    });

    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });
  }

  function updateTimelinePlayheadPosition() {
    const total = state.totalFrames || 180;
    const pct = (state.currentFrame / total) * 100;
    dom.timelinePlayhead.style.left = pct + '%';
  }

  // 15. EXPORT MODAL & FORMATS
  function setupExportModal() {
    dom.btnOpenExport.addEventListener('click', () => {
      dom.modalExport.classList.add('active');
    });

    dom.btnCloseExportModal.addEventListener('click', () => {
      dom.modalExport.classList.remove('active');
    });

    dom.btnDoExportTgs.addEventListener('click', () => exportTGS());
    dom.btnDoExportGif.addEventListener('click', () => exportGIF());
    dom.btnDoExportVideo.addEventListener('click', () => exportVideo());
    dom.btnDoExportJson.addEventListener('click', () => exportJSON());
  }

  async function exportTGS() {
    flushTextRender();
    try {
      // Strictly build from pristine unmutated raw JSON, completely bypassing lottie-web player mutations
      const rawJson = window.PRISTINE_RAW_JSON || state.project.rawLottieJson;
      if (!rawJson) {
        throw new Error("Отсутствует исходный JSON анимации");
      }

      const editorState = {
        hiddenLayers: state.project.config.hiddenLayers || [],
        layerOverrides: state.project.layerOverrides || {},
        customLayers: (state.project.customLayers || []).filter(layer => !layer.hd)
      };

      const bytes = engine.exportPristineToTgsBytes(sourceWithColorOverrides(rawJson, state.project.layerOverrides), editorState, { checkSize: settings.strictTgs });
      const filename = `${state.project.title.replace(/\s+/g, '_')}.tgs`;

      if (window.electronAPI) {
        const saveRes = await window.electronAPI.saveFileDialog({
          defaultPath: filename,
          filters: [{ name: 'Telegram .TGS', extensions: ['tgs'] }]
        });
        if (!saveRes.canceled && saveRes.filePath) {
          const result = await window.electronAPI.saveBinaryFile(saveRes.filePath, bytes);
          if (!result.success) throw new Error(result.error || 'Не удалось записать файл');
          showToast(`Файл сохранен: ${saveRes.filePath}`);
        }
      } else {
        const blob = new Blob([bytes], { type: "application/x-tgsticker" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Файл ${filename} скачан!`);
      }
      dom.modalExport.classList.remove('active');
    } catch (err) {
      showToast('Ошибка экспорта .TGS: ' + err.message, true);
    }
  }

  async function exportGIF() {
    flushTextRender();
    try {
      dom.modalExport.classList.remove('active');
      showProgress(`Рендеринг GIF ${settings.gifSize}×${settings.gifSize}`,  'Генерация палитры и покадровая отрисовка...');
      
      const customLottie = state.project.lottieData;
      const blob = await engine.renderGif(customLottie, {
        width: settings.gifSize,
        height: settings.gifSize,
        fps: 30,
        bgColor: '#000000',
        onProgress: (pct) => updateProgress(pct)
      });

      hideProgress();
      engine.downloadBlob(blob, `${state.project.title}_preview.gif`);
      showToast('Анимированный GIF успешно сохранен!');
    } catch (err) {
      hideProgress();
      showToast('Ошибка рендера GIF: ' + err.message, true);
    }
  }

  async function exportVideo() {
    flushTextRender();
    try {
      dom.modalExport.classList.remove('active');
      showProgress(`Запись видео ${settings.videoFps} FPS`,  'Покадровый захват canvas...');

      const customLottie = state.project.lottieData;
      const blob = await engine.recordVideo(customLottie, {
        width: 512,
        height: 512,
        fps: settings.videoFps,
        durationSec: (customLottie.op - (customLottie.ip || 0)) / (customLottie.fr || 60),
        bgColor: '#000000',
        onProgress: (pct) => updateProgress(pct)
      });

      hideProgress();
      const isMp4 = blob.type.includes('mp4');
      engine.downloadBlob(blob, `${state.project.title}_${settings.videoFps}fps.${isMp4 ? 'mp4' : 'webm'}`);
      showToast(isMp4 ? 'Видео MP4 успешно сохранено!' : 'MP4 не поддерживается, сохранено видео WebM');
    } catch (err) {
      hideProgress();
      showToast('Ошибка экспорта видео: ' + err.message, true);
    }
  }

  function exportJSON() {
    flushTextRender();
    try {
      const rawJson = window.PRISTINE_RAW_JSON || state.project.rawLottieJson;
      const editorState = {
        hiddenLayers: state.project.config.hiddenLayers || [],
        layerOverrides: state.project.layerOverrides || {},
        customLayers: (state.project.customLayers || []).filter(layer => !layer.hd)
      };
      const cleanExport = rawJson ? engine.buildCleanTgsExport(sourceWithColorOverrides(rawJson, state.project.layerOverrides), editorState) : state.project.lottieData;
      const jsonStr = JSON.stringify(cleanExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      engine.downloadBlob(blob, `${state.project.title}.json`);
      showToast('Lottie JSON успешно экспортирован!');
      dom.modalExport.classList.remove('active');
    } catch (err) {
      showToast('Ошибка экспорта JSON: ' + err.message, true);
    }
  }

  function showProgress(title, sub) {
    dom.progressTitle.textContent = title;
    dom.progressSub.textContent = sub;
    dom.progressFill.style.width = '0%';
    dom.progressOverlay.classList.add('active');
  }

  function updateProgress(pct) {
    dom.progressFill.style.width = pct + '%';
  }

  function hideProgress() {
    dom.progressOverlay.classList.remove('active');
  }

  // 17. DRAG & DROP IMPORT
  function setupDragAndDrop() {
    const zone = dom.hubDragZone;
    ['dragenter', 'dragover'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
      });
    });

    zone.addEventListener('drop', async (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleFileImport(file);
    });

    window.addEventListener('dragover', e => {
      if (state.screen === 'dashboard' && e.dataTransfer.types.includes('Files')) { e.preventDefault(); zone.classList.add('dragover'); }
    });
    window.addEventListener('dragleave', e => { if (!e.relatedTarget) zone.classList.remove('dragover'); });
    window.addEventListener('drop', e => {
      if (state.screen !== 'dashboard' || zone.contains(e.target)) return;
      e.preventDefault(); zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleFileImport(e.dataTransfer.files[0]);
    });

    dom.btnBrowseFile.addEventListener('click', (e) => { e.stopPropagation(); browseLocalFile(); });
    zone.addEventListener('click', () => browseLocalFile());
    dom.hubFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileImport(file);
    });
  }

  async function browseLocalFile() {
    if (window.electronAPI) {
      const res = await window.electronAPI.openFileDialog({
        filters: [{ name: 'Telegram Emoji & Stickers', extensions: ['tgs', 'json'] }]
      });
      if (!res.canceled && res.data) {
        openProjectData(res.data, res.fileName.replace(/\.[^/.]+$/, ''));
      }
    } else {
      dom.hubFileInput.click();
    }
  }

  async function handleFileImport(file) {
    try {
      const buf = await file.arrayBuffer();
      const title = file.name.replace(/\.[^/.]+$/, '');
      openProjectData(buf, title);
    } catch (err) {
      showToast('Ошибка импорта: ' + err.message, true);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function setupHub() {
    const content = document.querySelector('.hub-content');
    const home = document.createElement('div'); home.id = 'hub-home-view';
    while (content.firstChild) home.appendChild(content.firstChild);
    content.appendChild(home);
    const projects = document.createElement('section'); projects.id = 'hub-projects-view'; projects.hidden = true;
    projects.innerHTML = `<div class="view-heading"><h1>Мои проекты</h1><p>Все ваши анимации в одном месте</p></div><div class="projects-toolbar"><input id="projects-search" class="text-input" placeholder="Поиск проектов" aria-label="Поиск проектов"><select id="projects-sort" class="select-input" aria-label="Сортировка"><option value="date">По дате изменения</option><option value="name">По названию</option></select></div><div class="projects-grid" id="projects-all-grid"></div>`;
    content.appendChild(projects);
    const settingsView = document.createElement('section'); settingsView.id = 'hub-settings-view'; settingsView.hidden = true;
    settingsView.innerHTML = `<div class="view-heading"><h1>Настройки</h1><p>Настройте рабочее пространство под себя</p></div>
      <div class="settings-card"><h2>Типографика</h2><div class="setting-row"><div><strong>Шрифт по умолчанию</strong><small id="settings-font-name"></small></div><div class="setting-actions"><input type="file" id="settings-font-file" accept=".ttf,.otf,.woff" hidden><button class="btn-secondary" id="settings-font-upload">Загрузить</button><button class="btn-secondary" id="settings-font-reset">Сбросить</button></div></div></div>
      <div class="settings-card"><h2>Экспорт</h2><label class="setting-row"><span>Разрешение GIF</span><select id="settings-gif" class="select-input"><option value="256">256 × 256</option><option value="512">512 × 512</option></select></label><label class="setting-row"><span>Частота кадров видео</span><select id="settings-fps" class="select-input"><option value="30">30 FPS</option><option value="60">60 FPS</option></select></label><label class="setting-row"><span>Лимит Telegram 64 КБ</span><input id="settings-strict" type="checkbox" class="ios-toggle"></label></div>
      <div class="settings-card"><h2>Рабочая область</h2><label class="setting-row"><span>Фон холста</span><select id="settings-background" class="select-input"><option value="checker">Тёмная шахматка</option><option value="black">Глубокий чёрный</option><option value="light">Светлый</option></select></label><label class="setting-row"><span>Автосохранение при выходе</span><input id="settings-autosave" type="checkbox" class="ios-toggle"></label></div>`;
    settingsView.insertAdjacentHTML('beforeend', `<div class="settings-card"><h2>Обновления программы</h2><div class="setting-row"><div><strong id="update-version">Версия</strong><small id="update-message">Проверка обновлений доступна в установленной версии</small></div><div class="setting-actions"><button class="btn-secondary" id="check-updates">Проверить обновления</button><button class="btn-secondary" id="download-update" hidden>Скачать</button><button class="btn-secondary" id="install-update" hidden>Установить и перезапустить</button></div></div><progress id="update-progress" class="update-progress" max="100" value="0" hidden></progress></div>`);
    content.appendChild(settingsView);
    if (api) {
      api.getVersion().then(version => { document.getElementById('update-version').textContent = `v${version}`; });
      const message = document.getElementById('update-message');
      const banner = document.getElementById('update-banner');
      const download = document.getElementById('download-update');
      const install = document.getElementById('install-update');
      const progress = document.getElementById('update-progress');
      const downloadUpdate = async () => { banner.hidden = true; download.hidden = true; progress.hidden = false; message.textContent = 'Загрузка обновления…'; const result = await api.downloadUpdate(); if (!result.ok) message.textContent = result.error; };
      document.getElementById('check-updates').addEventListener('click', async () => { message.textContent = 'Проверка обновлений…'; const result = await api.checkForUpdates(); if (!result.ok) message.textContent = result.error; });
      download.addEventListener('click', downloadUpdate);
      document.getElementById('update-banner-download').addEventListener('click', downloadUpdate);
      install.addEventListener('click', async () => { if (await saveNow(false)) await api.installUpdate(); });
      api.onUpdateStatus(data => {
        if (data.status === 'checking') message.textContent = 'Проверка обновлений…';
        if (data.status === 'latest') message.textContent = 'Установлена последняя версия';
        if (data.status === 'available') { message.textContent = `Доступна версия ${data.version}`; document.getElementById('update-banner-text').textContent = `Доступна версия ${data.version}`; download.hidden = false; banner.hidden = false; }
        if (data.status === 'downloaded') { message.textContent = `Версия ${data.version} загружена`; progress.value = 100; install.hidden = false; }
        if (data.status === 'error') message.textContent = data.error || 'Ошибка обновления';
      });
      api.onUpdateProgress(data => { progress.hidden = false; progress.value = data.percent; message.textContent = `Загрузка обновления — ${data.percent}%`; });
      updatesReady = true;
      api.checkForUpdates().then(result => { if (!result.ok) message.textContent = result.error; });
    }
    const brand = document.createElement('div'); brand.className = 'sidebar-brand';
    brand.innerHTML = `<div class="wtools-mark sidebar-wtools-mark" aria-hidden="true">W</div><strong>W Tools</strong>`;
    document.querySelector('.hub-sidebar').prepend(brand);
    document.querySelector('.app-logo').innerHTML = '<span class="titlebar-wtools-mark">W</span>';
    const views = { 'hub-home': home, 'hub-projects': projects, 'hub-settings': settingsView };
    document.querySelectorAll('.hub-nav-btn').forEach(button => button.addEventListener('click', () => {
      if (!views[button.dataset.tab]) return;
      Object.entries(views).forEach(([key, view]) => { view.hidden = key !== button.dataset.tab; });
      document.querySelectorAll('.hub-nav-btn').forEach(b => b.classList.toggle('active', b === button));
      renderRecentProjects(); content.scrollTop = 0;
    }));
    document.getElementById('projects-search').addEventListener('input', renderRecentProjects);
    document.getElementById('projects-sort').addEventListener('change', renderRecentProjects);
    const bind = (id, key, isCheckbox = false) => {
      const input = document.getElementById(id);
      if (isCheckbox) input.checked = settings[key]; else input.value = settings[key];
      input.addEventListener('change', () => {
        settings[key] = isCheckbox ? input.checked : (key === 'gifSize' || key === 'videoFps' ? Number(input.value) : input.value);
        persistSettings(); applyCanvasBackground();
      });
    };
    bind('settings-gif', 'gifSize'); bind('settings-fps', 'videoFps'); bind('settings-strict', 'strictTgs', true);
    bind('settings-background', 'canvasBackground'); bind('settings-autosave', 'autoSave', true);
    const fontLabel = document.getElementById('settings-font-name');
    const updateFontLabel = () => { fontLabel.textContent = settings.fontName || 'Встроенный шрифт'; };
    updateFontLabel(); applyCanvasBackground();
    const fontInput = document.getElementById('settings-font-file');
    document.getElementById('settings-font-upload').addEventListener('click', () => fontInput.click());
    fontInput.addEventListener('change', async () => {
      const file = fontInput.files[0]; if (!file) return;
      try {
        const previous = engine.font;
        try { engine.loadFontFromBuffer(await file.arrayBuffer()); } finally { engine.font = previous; }
        settings.fontData = await fileToBase64(file); settings.fontName = file.name; persistSettings(); updateFontLabel();
        showToast('Шрифт по умолчанию сохранён');
      } catch (e) { showToast('Ошибка загрузки шрифта: ' + e.message, true); }
    });
    document.getElementById('settings-font-reset').addEventListener('click', () => { settings.fontData = null; settings.fontName = ''; persistSettings(); updateFontLabel(); });
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.screen === 'editor') {
        e.preventDefault(); saveNow(true);
      }
    });
    document.getElementById('toolbar-add-logo').addEventListener('click', () => dom.logoFileInput.click());
    document.getElementById('playback-capsule').appendChild(document.querySelector('.zoom-selector'));
  }

  function applyCanvasBackground() { dom.canvasCard.dataset.background = settings.canvasBackground; }

  // 18. BOOTSTRAP APP
  let previousSession = null;
  try { previousSession = await loadStoredData(); }
  catch (error) { console.error('Ошибка загрузки данных:', error); showToast('Не удалось загрузить сохранённые данные: ' + error.message, true); }
  setupHub();
  setupWindowControls();
  setupCanvasInteractions();
  setupPlaybackControls();
  setupTimelinePlayheadScrubbing();
  setupPropertiesInspector();
  setupLayerColorControls();
  setupExportModal();
  setupDragAndDrop();

  renderRecentProjects();


  dom.btnCreateBlank.addEventListener('click', () => createBlankProject());
  dom.tbBtnBack.addEventListener('click', () => switchScreen('dashboard'));

  // Tools toggle
  [dom.toolSelect, dom.toolText, dom.toolHand].forEach(btn => {
    btn.addEventListener('click', () => {
      activateTool(btn.dataset.tool);
      if (btn.dataset.tool === 'text') focusTextInput();
    });
  });

  try { await restoreSession(previousSession); }
  catch (error) { showToast('Не удалось восстановить сессию: ' + error.message, true); }
  restoring = false;
  setInterval(() => { if (state.screen === 'editor') saveNow(false); }, 5 * 60 * 1000);
  window.addEventListener('keydown', async event => {
    if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (await saveNow(false)) location.reload();
    }
  }, true);
  if (window.desktopAPI) {
    window.desktopAPI.onPrepareClose(async () => window.desktopAPI.closeReady(document.body.classList.contains('license-locked') ? true : await saveNow(false)));
    window.desktopAPI.rendererReady();
  } else {
    window.addEventListener('beforeunload', () => {
      try {
        const project = state.screen === 'editor' && state.project.rawLottieJson ? projectSnapshot(state.project) : null;
        if (project) {
          const projects = JSON.parse(localStorage.getItem('tes_recent_projects') || '[]');
          localStorage.setItem('tes_recent_projects', JSON.stringify([project, ...projects.filter(item => item.id !== project.id)]));
        }
        localStorage.setItem('tes_current_session', JSON.stringify(sessionSnapshot(project)));
      } catch (error) { console.error('Ошибка сохранения сессии:', error); }
    });
  }
  document.getElementById('change-license').addEventListener('click', async () => {
    if (state.screen === 'editor') { if (!(await saveNow(false))) return; switchScreen('dashboard'); if (!(await saveNow(false))) return; }
    try { await api.clearLicense(); keyInput.value = ''; lock(); }
    catch (error) { showToast('Не удалось сменить ключ: ' + error.message, true); }
  });
  console.log('W Tools initialized');
})();
