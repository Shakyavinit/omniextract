/**
 * OmniExtract — Universal Web Media & Video Harvester
 * High-speed multi-proxy scraper, media parser, dimension detector, and batch ZIP packer.
 */

// Global State
const state = {
  items: [],
  selectedIds: new Set(),
  activeTab: 'all',          // 'all' | 'image' | 'video' | 'audio' | 'svg'
  qualityFilter: 'all',      // 'all' | '4k' | '1080p' | '720p' | 'sd'
  searchQuery: '',
  sortBy: 'default',         // 'default' | 'res-desc' | 'name-asc' | 'type'
  viewMode: 'grid',          // 'grid' | 'list'
  isScanning: false,
  scanStats: { total: 0, images: 0, videos: 0, audio: 0, svg: 0, timeMs: 0 },
  currentUrl: '',
  pageTitle: '',
  activeLightboxIndex: -1,
  lightboxZoom: 1,
  lightboxRotation: 0,
  recentScans: []
};

// Known Video & Audio Extensions
const EXT_IMAGE = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp', 'tiff'];
const EXT_VIDEO = ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'flv', 'wmv', 'm3u8', 'ts'];
const EXT_AUDIO = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'];
const EXT_VECTOR = ['svg'];

// DOM Content Loaded Initializer
document.addEventListener('DOMContentLoaded', () => {
  loadRecentScans();
  setupEventListeners();
  initBookmarkletCode();

  // Check if opened via Bookmarklet with imported media
  checkForBookmarkletImport();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  const urlForm = document.getElementById('url-form');
  if (urlForm) {
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('target-url');
      if (input && input.value.trim()) {
        startUrlScan(input.value.trim());
      }
    });
  }

  // Live search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderMediaItems();
    });
  }

  // Drag and drop for HTML files
  const dropZone = document.getElementById('html-drop-zone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('border-sky-400', 'bg-sky-500/10');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-sky-400', 'bg-sky-500/10');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileDrop(files[0]);
      }
    });
  }

  // Keyboard navigation for Lightbox
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightbox-modal');
    if (modal && !modal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxItem();
      if (e.key === 'ArrowLeft') prevLightboxItem();
    }
  });
}

/**
 * Switch Input Mode Tabs (URL vs Raw HTML vs File Drop)
 */
function switchInputMode(mode) {
  const modes = ['url', 'raw-html', 'file-drop'];
  modes.forEach(m => {
    const pane = document.getElementById(`pane-${m}`);
    const tab = document.getElementById(`tab-${m}`);
    if (m === mode) {
      pane?.classList.remove('hidden');
      tab?.classList.add('bg-sky-500/20', 'text-sky-300', 'border-sky-500/50');
      tab?.classList.remove('text-slate-400', 'border-transparent');
    } else {
      pane?.classList.add('hidden');
      tab?.classList.remove('bg-sky-500/20', 'text-sky-300', 'border-sky-500/50');
      tab?.classList.add('text-slate-400', 'border-transparent');
    }
  });
}

/**
 * Scan Preset Example URL
 */
function scanPreset(url) {
  const input = document.getElementById('target-url');
  if (input) {
    input.value = url;
    switchInputMode('url');
    startUrlScan(url);
  }
}

/**
 * Start URL Scan with Multi-Proxy Auto-Racing Engine
 */
async function startUrlScan(rawUrl) {
  let targetUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  state.currentUrl = targetUrl;
  state.isScanning = true;
  setScanningUI(true, 'Connecting to fast proxy cascade...');

  const startTime = performance.now();

  try {
    const html = await fetchHtmlWithProxyRace(targetUrl);
    const endTime = performance.now();
    state.scanStats.timeMs = Math.round(endTime - startTime);

    setScanningUI(true, 'Parsing media and detecting resolutions...');
    parseMediaFromHTML(html, targetUrl);

    // Save to history
    saveRecentScan(targetUrl, state.pageTitle || targetUrl, state.items.length);
  } catch (err) {
    console.error('Scan error:', err);
    showScanError(err.message || 'Failed to fetch webpage. Try Raw HTML Paste mode if the site is behind Cloudflare.');
  } finally {
    state.isScanning = false;
    setScanningUI(false);
  }
}

/**
 * Multi-Proxy Racing Engine
 * Races multiple proxies concurrently with auto-failover
 */
async function fetchHtmlWithProxyRace(url) {
  const proxies = [
    {
      name: 'AllOrigins Raw',
      fetcher: async () => {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      }
    },
    {
      name: 'CodeTabs Proxy',
      fetcher: async () => {
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      }
    },
    {
      name: 'CorsProxy.io',
      fetcher: async () => {
        const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      }
    },
    {
      name: 'AllOrigins JSON',
      fetcher: async () => {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.contents) throw new Error('No contents returned');
        return data.contents;
      }
    }
  ];

  // Race the first 2 fast proxies with timeout
  const timeoutMs = 8500;
  
  const raceWithTimeout = (promise, ms) => {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Proxy timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  };

  updateProxyIndicator('Racing proxies: AllOrigins, CodeTabs, CorsProxy.io...');

  // Try fast parallel race first
  try {
    const fastResult = await Promise.any(
      proxies.slice(0, 3).map(p => raceWithTimeout(p.fetcher(), timeoutMs))
    );
    if (fastResult && fastResult.length > 50) {
      updateProxyIndicator('Proxy connected successfully', 'emerald');
      return fastResult;
    }
  } catch (raceErr) {
    console.warn('Initial proxy race failed, trying sequential fallbacks...', raceErr);
  }

  // Sequential fallback loop
  for (const proxy of proxies) {
    try {
      updateProxyIndicator(`Attempting fallback via ${proxy.name}...`, 'amber');
      const result = await raceWithTimeout(proxy.fetcher(), 7000);
      if (result && result.length > 50) {
        updateProxyIndicator(`Connected via ${proxy.name}`, 'emerald');
        return result;
      }
    } catch (e) {
      console.warn(`Proxy ${proxy.name} failed:`, e);
    }
  }

  // Direct fetch attempt (if same domain or CORS allowed)
  try {
    updateProxyIndicator('Attempting direct fetch...', 'cyan');
    const directRes = await fetch(url, { mode: 'cors' });
    if (directRes.ok) {
      updateProxyIndicator('Direct connection succeeded', 'emerald');
      return await directRes.text();
    }
  } catch (directErr) {
    // Ignore direct fetch failure
  }

  throw new Error('All CORS proxies failed to load this URL. The website might be blocking scrapers. Please switch to the "RAW HTML PASTE" tab and paste the page source directly!');
}

/**
 * Handle Raw HTML / Page Source Input
 */
function scanRawHtmlInput() {
  const textarea = document.getElementById('raw-html-input');
  const baseUrlInput = document.getElementById('raw-html-base-url');
  
  if (!textarea || !textarea.value.trim()) {
    alert('Please paste some HTML or source code first!');
    return;
  }

  const html = textarea.value.trim();
  let baseUrl = baseUrlInput ? baseUrlInput.value.trim() : '';
  if (!baseUrl) {
    baseUrl = 'https://extracted-source.local/';
  } else if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = 'https://' + baseUrl;
  }

  state.currentUrl = baseUrl;
  state.isScanning = true;
  setScanningUI(true, 'Parsing pasted HTML source...');

  const startTime = performance.now();
  setTimeout(() => {
    parseMediaFromHTML(html, baseUrl);
    const endTime = performance.now();
    state.scanStats.timeMs = Math.round(endTime - startTime);
    state.isScanning = false;
    setScanningUI(false);
  }, 50);
}

/**
 * Handle HTML File Drop
 */
function handleFileDrop(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const html = e.target.result;
    const baseUrl = 'https://' + (file.name.replace(/\.[^/.]+$/, '')) + '.local/';
    state.currentUrl = baseUrl;
    state.isScanning = true;
    setScanningUI(true, `Reading ${file.name}...`);
    setTimeout(() => {
      parseMediaFromHTML(html, baseUrl);
      state.isScanning = false;
      setScanningUI(false);
    }, 50);
  };
  reader.readAsText(file);
}

/**
 * Deep Media Parser from HTML string
 */
function parseMediaFromHTML(html, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract Page Title
  const titleElem = doc.querySelector('title');
  state.pageTitle = titleElem ? titleElem.innerText.trim() : baseUrl;

  const rawFound = [];
  const seenUrls = new Set();

  const addMedia = (rawUrl, typeHint, sourceTag, altTitle = '', extra = {}) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return;
    
    // Ignore tiny tracking 1x1 gifs or blank data URLs
    if (trimmed.includes('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')) return;

    let fullUrl = trimmed;
    if (!trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
      try {
        fullUrl = new URL(trimmed, baseUrl).href;
      } catch (e) {
        return;
      }
    }

    if (seenUrls.has(fullUrl)) return;
    seenUrls.add(fullUrl);

    // Determine type and format
    const inferred = inferMediaTypeAndFormat(fullUrl, typeHint);
    
    rawFound.push({
      id: 'media_' + Math.random().toString(36).substring(2, 9),
      url: fullUrl,
      type: inferred.type,
      format: inferred.format,
      sourceTag: sourceTag,
      title: altTitle || inferTitleFromUrl(fullUrl),
      width: extra.width || 0,
      height: extra.height || 0,
      aspectRatio: 'Auto',
      qualityLabel: inferred.type === 'svg' ? 'Vector' : 'Scanning...',
      sizeBytes: extra.sizeBytes || 0,
      selected: true,
      embedId: extra.embedId || null
    });
  };

  // 1. <img> tags (src, srcset, data-src, etc.)
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || img.getAttribute('data-hi-res-src');
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    const alt = img.getAttribute('alt') || '';
    const w = parseInt(img.getAttribute('width')) || 0;
    const h = parseInt(img.getAttribute('height')) || 0;

    if (srcset) {
      const highestSrc = parseHighestFromSrcset(srcset);
      if (highestSrc) addMedia(highestSrc, 'image', 'img:srcset', alt, { width: w, height: h });
    }
    if (dataSrc) addMedia(dataSrc, 'image', 'img:data-src', alt, { width: w, height: h });
    if (src) addMedia(src, 'image', 'img:src', alt, { width: w, height: h });
  });

  // 2. <picture> and <source> tags
  doc.querySelectorAll('picture source').forEach(source => {
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      const highest = parseHighestFromSrcset(srcset);
      if (highest) addMedia(highest, 'image', 'picture:source');
    }
  });

  // 3. CSS Background Images
  doc.querySelectorAll('[style*="url("]').forEach(elem => {
    const style = elem.getAttribute('style') || '';
    const matches = style.match(/url\(['"]?(.*?)['"]?\)/gi);
    if (matches) {
      matches.forEach(m => {
        const clean = m.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        addMedia(clean, 'image', 'css:background');
      });
    }
  });

  // Also parse <style> blocks
  doc.querySelectorAll('style').forEach(styleElem => {
    const text = styleElem.textContent || '';
    const matches = text.match(/url\(['"]?([^'"\)]+)['"]?\)/gi);
    if (matches) {
      matches.forEach(m => {
        const clean = m.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        if (!clean.startsWith('data:font') && !clean.endsWith('.woff') && !clean.endsWith('.woff2') && !clean.endsWith('.ttf')) {
          addMedia(clean, 'image', 'css:stylesheet');
        }
      });
    }
  });

  // 4. OpenGraph and Twitter Meta Tags
  doc.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(meta => {
    const prop = meta.getAttribute('property') || meta.getAttribute('name') || '';
    const content = meta.getAttribute('content');
    if (!content) return;

    if (prop.includes('image')) {
      addMedia(content, 'image', 'meta:' + prop, 'Social Card Image');
    } else if (prop.includes('video')) {
      addMedia(content, 'video', 'meta:' + prop, 'Social Card Video');
    }
  });

  // 5. <video> tags and <source>
  doc.querySelectorAll('video').forEach(video => {
    const src = video.getAttribute('src');
    const poster = video.getAttribute('poster');
    const w = parseInt(video.getAttribute('width')) || 0;
    const h = parseInt(video.getAttribute('height')) || 0;

    if (poster) addMedia(poster, 'image', 'video:poster', 'Video Poster Frame');
    if (src) addMedia(src, 'video', 'video:src', '', { width: w, height: h });

    video.querySelectorAll('source').forEach(source => {
      const sSrc = source.getAttribute('src');
      if (sSrc) addMedia(sSrc, 'video', 'video:source', '', { width: w, height: h });
    });
  });

  // 6. Embedded Video Players (YouTube, Vimeo, etc.)
  doc.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    if (!src) return;

    // YouTube Detection
    const ytMatch = src.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const ytId = ytMatch[1];
      // Add YouTube 1080p Maxres Thumbnail
      addMedia(`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`, 'image', 'youtube:thumbnail', `YouTube Thumbnail (${ytId})`, { width: 1920, height: 1080 });
      // Add Direct YouTube Video player
      addMedia(`https://www.youtube.com/watch?v=${ytId}`, 'video', 'youtube:embed', `YouTube Video (${ytId})`, { embedId: ytId, width: 1920, height: 1080 });
    }

    // Vimeo Detection
    const vimeoMatch = src.match(/player\.vimeo\.com\/video\/([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      const vimeoId = vimeoMatch[1];
      addMedia(`https://vimeo.com/${vimeoId}`, 'video', 'vimeo:embed', `Vimeo Video (${vimeoId})`, { embedId: vimeoId });
    }
  });

  // 7. Direct Media Links (<a href="...">)
  doc.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    const ext = getFileExtension(href).toLowerCase();
    const text = a.innerText.trim() || '';

    if (EXT_IMAGE.includes(ext)) {
      addMedia(href, 'image', 'a:href', text);
    } else if (EXT_VIDEO.includes(ext)) {
      addMedia(href, 'video', 'a:href', text);
    } else if (EXT_AUDIO.includes(ext)) {
      addMedia(href, 'audio', 'a:href', text);
    } else if (EXT_VECTOR.includes(ext)) {
      addMedia(href, 'svg', 'a:href', text);
    }
  });

  // 8. <audio> and <source>
  doc.querySelectorAll('audio').forEach(audio => {
    const src = audio.getAttribute('src');
    if (src) addMedia(src, 'audio', 'audio:src');
    audio.querySelectorAll('source').forEach(source => {
      const sSrc = source.getAttribute('src');
      if (sSrc) addMedia(sSrc, 'audio', 'audio:source');
    });
  });

  // 9. Inline SVGs
  doc.querySelectorAll('svg').forEach((svg, idx) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svg);
      if (svgString && svgString.length > 50 && svgString.length < 500000) {
        const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        addMedia(svgDataUri, 'svg', 'svg:inline', `Inline Vector Icon #${idx + 1}`);
      }
    } catch (e) {
      // Ignore serialization errors
    }
  });

  // Populate State
  state.items = rawFound;
  state.selectedIds = new Set(rawFound.map(item => item.id));

  // Compute Stats
  updateStateCounts();

  // Asynchronously resolve natural dimensions for images & videos
  resolveAllMediaDimensions();

  // Render to UI
  renderMediaItems();
}

/**
 * Infer Media Type and Format Extension
 */
function inferMediaTypeAndFormat(url, typeHint) {
  let format = 'UNKNOWN';
  let type = typeHint || 'image';

  if (url.startsWith('data:image/svg')) {
    return { type: 'svg', format: 'SVG' };
  }

  const ext = getFileExtension(url).toLowerCase();

  if (EXT_VECTOR.includes(ext) || ext === 'svg') {
    type = 'svg';
    format = 'SVG';
  } else if (EXT_VIDEO.includes(ext) || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
    type = 'video';
    format = ext ? ext.toUpperCase() : 'STREAM';
  } else if (EXT_AUDIO.includes(ext)) {
    type = 'audio';
    format = ext ? ext.toUpperCase() : 'AUDIO';
  } else if (EXT_IMAGE.includes(ext)) {
    type = 'image';
    format = ext.toUpperCase();
  } else {
    // Fallback based on typeHint
    type = typeHint || 'image';
    format = type === 'video' ? 'MP4' : (type === 'svg' ? 'SVG' : 'JPG');
  }

  return { type, format };
}

/**
 * Extract clean extension from URL
 */
function getFileExtension(url) {
  try {
    const cleanUrl = url.split('#')[0].split('?')[0];
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * Infer human-friendly title from URL
 */
function inferTitleFromUrl(url) {
  try {
    if (url.startsWith('data:')) return 'Data URI Asset';
    const clean = url.split('#')[0].split('?')[0];
    const parts = clean.split('/');
    const last = parts[parts.length - 1];
    return decodeURIComponent(last).replace(/[-_]/g, ' ') || 'Web Media';
  } catch (e) {
    return 'Web Media Asset';
  }
}

/**
 * Parse highest resolution candidate from srcset string
 */
function parseHighestFromSrcset(srcset) {
  if (!srcset) return null;
  const candidates = srcset.split(',').map(s => s.trim()).filter(Boolean);
  let bestUrl = null;
  let bestScore = -1;

  for (const cand of candidates) {
    const parts = cand.split(/\s+/);
    const url = parts[0];
    let score = 1;
    if (parts[1]) {
      const matchW = parts[1].match(/(\d+)w/i);
      const matchX = parts[1].match(/(\d+(\.\d+)?)x/i);
      if (matchW) score = parseInt(matchW[1]);
      else if (matchX) score = parseFloat(matchX[1]) * 1000;
    }
    if (score > bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  }

  return bestUrl;
}

/**
 * Asynchronously inspect natural dimensions for all images & videos
 */
function resolveAllMediaDimensions() {
  const maxInspect = Math.min(state.items.length, 120);

  for (let i = 0; i < maxInspect; i++) {
    const item = state.items[i];
    if (item.width > 0 && item.height > 0) {
      assignQualityLabel(item);
      continue;
    }

    if (item.type === 'image' || item.type === 'svg') {
      const img = new Image();
      img.onload = () => {
        item.width = img.naturalWidth;
        item.height = img.naturalHeight;
        assignQualityLabel(item);
        updateCardDimensions(item.id, item);
      };
      img.onerror = () => {
        item.qualityLabel = 'Standard';
      };
      img.src = item.url;
    } else if (item.type === 'video' && !item.url.includes('youtube.com') && !item.url.includes('vimeo.com')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        item.width = video.videoWidth;
        item.height = video.videoHeight;
        assignQualityLabel(item);
        updateCardDimensions(item.id, item);
      };
      video.src = item.url;
    }
  }
}

/**
 * Assign quality badges (4K, 1080p FHD, 720p HD, SD)
 */
function assignQualityLabel(item) {
  if (item.type === 'svg') {
    item.qualityLabel = 'Vector';
    return;
  }
  const w = item.width || 0;
  const h = item.height || 0;
  const maxDim = Math.max(w, h);

  if (maxDim >= 3840 || h >= 2160) {
    item.qualityLabel = '4K UHD';
  } else if (maxDim >= 1920 || h >= 1080) {
    item.qualityLabel = '1080p FHD';
  } else if (maxDim >= 1280 || h >= 720) {
    item.qualityLabel = '720p HD';
  } else if (maxDim > 0) {
    item.qualityLabel = `${w}×${h}`;
  } else {
    item.qualityLabel = 'Standard';
  }

  if (w > 0 && h > 0) {
    const ratio = (w / h).toFixed(2);
    if (ratio === '1.78') item.aspectRatio = '16:9';
    else if (ratio === '1.00') item.aspectRatio = '1:1';
    else if (ratio === '1.33') item.aspectRatio = '4:3';
    else if (ratio === '0.56') item.aspectRatio = '9:16';
    else item.aspectRatio = `${w}:${h}`;
  }
}

/**
 * Update UI state counts
 */
function updateStateCounts() {
  const counts = { total: state.items.length, images: 0, videos: 0, audio: 0, svg: 0 };
  state.items.forEach(item => {
    if (item.type === 'image') counts.images++;
    else if (item.type === 'video') counts.videos++;
    else if (item.type === 'audio') counts.audio++;
    else if (item.type === 'svg') counts.svg++;
  });

  state.scanStats.total = counts.total;
  state.scanStats.images = counts.images;
  state.scanStats.videos = counts.videos;
  state.scanStats.audio = counts.audio;
  state.scanStats.svg = counts.svg;

  // Update DOM Pills
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl('count-all', counts.total);
  setEl('count-images', counts.images);
  setEl('count-videos', counts.videos);
  setEl('count-audio', counts.audio);
  setEl('count-svg', counts.svg);
  setEl('selected-count-badge', `${state.selectedIds.size} / ${counts.total}`);

  // Header quick stats
  setEl('hdr-stat-total', counts.total);
  setEl('hdr-stat-videos', counts.videos);
  setEl('hdr-stat-time', `${state.scanStats.timeMs}ms`);

  // Target banner
  const targetHost = document.getElementById('target-host-display');
  if (targetHost && state.currentUrl) {
    try {
      const u = new URL(state.currentUrl);
      targetHost.innerText = u.hostname;
    } catch (e) {
      targetHost.innerText = state.currentUrl;
    }
  }

  const targetTitle = document.getElementById('target-title-display');
  if (targetTitle) {
    targetTitle.innerText = state.pageTitle || 'Extracted Website';
  }
}

/**
 * Filter & Sort Items
 */
function getFilteredItems() {
  return state.items.filter(item => {
    // Type Tab
    if (state.activeTab !== 'all' && item.type !== state.activeTab) {
      return false;
    }

    // Quality Filter
    if (state.qualityFilter !== 'all') {
      const maxDim = Math.max(item.width || 0, item.height || 0);
      if (state.qualityFilter === '4k' && maxDim < 3840 && (item.height || 0) < 2160) return false;
      if (state.qualityFilter === '1080p' && (maxDim < 1920 && (item.height || 0) < 1080)) return false;
      if (state.qualityFilter === '720p' && (maxDim < 1280 && (item.height || 0) < 720)) return false;
      if (state.qualityFilter === 'sd' && maxDim >= 1280) return false;
    }

    // Search Query
    if (state.searchQuery) {
      const q = state.searchQuery;
      const matchUrl = item.url.toLowerCase().includes(q);
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchFormat = (item.format || '').toLowerCase().includes(q);
      if (!matchUrl && !matchTitle && !matchFormat) return false;
    }

    return true;
  }).sort((a, b) => {
    if (state.sortBy === 'res-desc') {
      const resA = (a.width || 0) * (a.height || 0);
      const resB = (b.width || 0) * (b.height || 0);
      return resB - resA;
    }
    if (state.sortBy === 'name-asc') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (state.sortBy === 'type') {
      return a.type.localeCompare(b.type);
    }
    return 0;
  });
}

/**
 * Render Media Items to UI
 */
function renderMediaItems() {
  const container = document.getElementById('media-results-container');
  const emptyState = document.getElementById('empty-state');
  const resultsHeader = document.getElementById('results-header-section');

  if (!container) return;

  const items = getFilteredItems();

  if (state.items.length === 0) {
    if (resultsHeader) resultsHeader.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (resultsHeader) resultsHeader.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');

  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 font-mono">
        <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-600 mb-3"></i>
        <p class="text-sm">No media items match your active filters.</p>
        <button onclick="resetFilters()" class="mt-3 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition">
          Reset All Filters
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  items.forEach((item, index) => {
    const isSelected = state.selectedIds.has(item.id);
    const card = document.createElement('div');
    card.id = `card-${item.id}`;
    card.className = `media-card rounded-xl overflow-hidden flex flex-col relative group ${isSelected ? 'is-selected' : ''}`;

    let previewHtml = '';
    if (item.type === 'video') {
      if (item.embedId) {
        // YouTube Embed Preview
        previewHtml = `
          <div class="relative w-full h-44 bg-black flex items-center justify-center overflow-hidden cursor-pointer" onclick="openLightboxById('${item.id}')">
            <img src="https://img.youtube.com/vi/${item.embedId}/hqdefault.jpg" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-600/40">
                <i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i>
              </div>
            </div>
            <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-red-400 font-bold border border-red-500/30">
              YOUTUBE
            </span>
          </div>
        `;
      } else {
        // HTML5 Video preview
        previewHtml = `
          <div class="relative w-full h-44 bg-black flex items-center justify-center overflow-hidden cursor-pointer" onclick="openLightboxById('${item.id}')">
            <video src="${item.url}" preload="metadata" muted playsinline class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"></video>
            <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div class="w-11 h-11 rounded-full bg-sky-600/90 text-white flex items-center justify-center shadow-lg shadow-sky-600/40">
                <i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i>
              </div>
            </div>
            <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-sky-400 font-bold border border-sky-500/30">
              VIDEO • ${item.format}
            </span>
          </div>
        `;
      }
    } else if (item.type === 'audio') {
      previewHtml = `
        <div class="w-full h-44 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 flex flex-col items-center justify-center p-4 border-b border-slate-800 cursor-pointer" onclick="openLightboxById('${item.id}')">
          <div class="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-2">
            <i data-lucide="music" class="w-6 h-6"></i>
          </div>
          <span class="text-xs font-mono text-purple-200 font-bold line-clamp-1">${item.title}</span>
          <span class="text-[10px] font-mono text-slate-400 mt-1">${item.format} AUDIO</span>
        </div>
      `;
    } else if (item.type === 'svg') {
      previewHtml = `
        <div class="relative w-full h-44 checkerboard-bg flex items-center justify-center p-5 cursor-pointer overflow-hidden" onclick="openLightboxById('${item.id}')">
          <img src="${item.url}" alt="${item.title}" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300" />
          <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400 font-bold border border-emerald-500/30">
            VECTOR SVG
          </span>
        </div>
      `;
    } else {
      // Standard Photo / Image
      previewHtml = `
        <div class="relative w-full h-44 bg-black/60 flex items-center justify-center overflow-hidden cursor-pointer" onclick="openLightboxById('${item.id}')">
          <img 
            src="${item.url}" 
            alt="${item.title}" 
            loading="lazy" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onerror="this.onerror=null; this.src='https://placehold.co/400x300/0d1522/0ea5e9?text=Image+Load+Error';"
          />
          <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 font-bold border border-slate-700">
            ${item.format}
          </span>
        </div>
      `;
    }

    card.innerHTML = `
      <!-- Media Viewport -->
      ${previewHtml}

      <!-- Top Overlay Controls -->
      <div class="absolute top-2 left-2 flex items-center gap-1.5 z-10">
        <span id="badge-quality-${item.id}" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
          item.qualityLabel.includes('4K') ? 'bg-amber-500/90 text-black shadow-md shadow-amber-500/30' :
          item.qualityLabel.includes('1080p') ? 'bg-sky-500/90 text-white shadow-md shadow-sky-500/30' :
          item.qualityLabel.includes('720p') ? 'bg-emerald-500/90 text-white' :
          'bg-slate-900/90 text-slate-300 border border-slate-700'
        }">
          ${item.qualityLabel}
        </span>
      </div>

      <!-- Select Checkbox -->
      <button 
        type="button" 
        onclick="event.stopPropagation(); toggleSelectItem('${item.id}')"
        class="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all z-10 ${
          isSelected ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40' : 'bg-black/60 text-slate-400 hover:text-white hover:bg-black/80'
        }"
        title="Toggle select"
      >
        <i data-lucide="${isSelected ? 'check' : 'square'}" class="w-4 h-4"></i>
      </button>

      <!-- Card Meta Info -->
      <div class="p-3 flex-1 flex flex-col justify-between gap-2 bg-[#0C1420] border-t border-slate-800">
        <div>
          <h4 class="text-xs font-mono font-bold text-white line-clamp-1" title="${item.title}">
            ${item.title}
          </h4>
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span id="dim-${item.id}" class="text-sky-400">
              ${item.width > 0 ? `${item.width} × ${item.height}` : 'Calculating...'}
            </span>
            <span class="text-slate-500 text-[10px]">${item.sourceTag}</span>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1.5 text-xs font-mono">
          <button 
            type="button" 
            onclick="downloadSingleItem('${item.id}')"
            class="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 transition flex items-center justify-center gap-1.5 font-bold"
            title="Download direct"
          >
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>SAVE</span>
          </button>

          <button 
            type="button" 
            onclick="copyMediaUrl('${item.url}')"
            class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Copy URL"
          >
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>

          <a 
            href="${item.url}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Open in new tab"
          >
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </a>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Update card resolution badge once detected
 */
function updateCardDimensions(id, item) {
  const dimEl = document.getElementById(`dim-${id}`);
  if (dimEl && item.width > 0) {
    dimEl.innerText = `${item.width} × ${item.height}`;
  }
  const badgeEl = document.getElementById(`badge-quality-${id}`);
  if (badgeEl) {
    badgeEl.innerText = item.qualityLabel;
    if (item.qualityLabel.includes('4K')) {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/90 text-black shadow-md shadow-amber-500/30';
    } else if (item.qualityLabel.includes('1080p')) {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/90 text-white shadow-md shadow-sky-500/30';
    } else if (item.qualityLabel.includes('720p')) {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/90 text-white';
    }
  }
}

/**
 * Selection Helpers
 */
function toggleSelectItem(id) {
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
  } else {
    state.selectedIds.add(id);
  }
  renderMediaItems();
  updateStateCounts();
}

function selectAllItems() {
  const filtered = getFilteredItems();
  if (state.selectedIds.size === filtered.length) {
    state.selectedIds.clear();
  } else {
    filtered.forEach(item => state.selectedIds.add(item.id));
  }
  renderMediaItems();
  updateStateCounts();
}

function selectHdOnly() {
  state.selectedIds.clear();
  state.items.forEach(item => {
    const maxDim = Math.max(item.width || 0, item.height || 0);
    if (maxDim >= 1280 || (item.height || 0) >= 720 || item.qualityLabel.includes('HD') || item.qualityLabel.includes('4K') || item.type === 'svg') {
      state.selectedIds.add(item.id);
    }
  });
  renderMediaItems();
  updateStateCounts();
}

function invertSelection() {
  const newSelected = new Set();
  getFilteredItems().forEach(item => {
    if (!state.selectedIds.has(item.id)) {
      newSelected.add(item.id);
    }
  });
  state.selectedIds = newSelected;
  renderMediaItems();
  updateStateCounts();
}

/**
 * Tab and Filter Switchers
 */
function switchTab(tab) {
  state.activeTab = tab;
  ['all', 'image', 'video', 'audio', 'svg'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-mono font-bold shadow-md shadow-sky-500/30 transition flex items-center gap-1.5';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono font-medium transition flex items-center gap-1.5';
      }
    }
  });
  renderMediaItems();
}

function applyQualityFilter(q) {
  state.qualityFilter = q;
  renderMediaItems();
}

function applySort(val) {
  state.sortBy = val;
  renderMediaItems();
}

function resetFilters() {
  state.activeTab = 'all';
  state.qualityFilter = 'all';
  state.searchQuery = '';
  state.sortBy = 'default';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  switchTab('all');
}

/**
 * Lightbox Modal Functions
 */
function openLightboxById(id) {
  const items = getFilteredItems();
  const idx = items.findIndex(item => item.id === id);
  if (idx !== -1) {
    openLightboxIndex(idx);
  }
}

function openLightboxIndex(idx) {
  const items = getFilteredItems();
  if (idx < 0 || idx >= items.length) return;

  state.activeLightboxIndex = idx;
  state.lightboxZoom = 1;
  state.lightboxRotation = 0;

  const item = items[idx];
  const modal = document.getElementById('lightbox-modal');
  const mediaContainer = document.getElementById('lightbox-media-container');
  const title = document.getElementById('lightbox-title');
  const meta = document.getElementById('lightbox-meta');

  if (!modal || !mediaContainer) return;

  modal.classList.remove('hidden');
  title.innerText = item.title;
  meta.innerText = `${item.type.toUpperCase()} • ${item.format} • ${item.width > 0 ? `${item.width}×${item.height}` : 'Original Resolution'}`;

  // Build viewer depending on type
  if (item.type === 'video') {
    if (item.embedId) {
      mediaContainer.innerHTML = `
        <iframe 
          src="https://www.youtube-nocookie.com/embed/${item.embedId}?autoplay=1" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen 
          class="w-full max-w-4xl aspect-video rounded-xl shadow-2xl"
        ></iframe>
      `;
    } else {
      mediaContainer.innerHTML = `
        <div class="flex flex-col items-center gap-3 w-full max-w-4xl">
          <video 
            id="lightbox-video-elem" 
            src="${item.url}" 
            controls 
            autoplay 
            playsinline 
            class="max-h-[70vh] max-w-full rounded-xl shadow-2xl"
          ></video>
          <div class="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span>Speed:</span>
            <button onclick="setVideoSpeed(0.5)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-sky-600">0.5x</button>
            <button onclick="setVideoSpeed(1)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-sky-600 font-bold">1x</button>
            <button onclick="setVideoSpeed(1.5)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-sky-600">1.5x</button>
            <button onclick="setVideoSpeed(2)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-sky-600">2x</button>
          </div>
        </div>
      `;
    }
  } else if (item.type === 'audio') {
    mediaContainer.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
        <div class="w-16 h-16 mx-auto rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
          <i data-lucide="music" class="w-8 h-8"></i>
        </div>
        <h4 class="text-sm font-mono font-bold text-white">${item.title}</h4>
        <audio src="${item.url}" controls autoplay class="w-full"></audio>
      </div>
    `;
  } else {
    // Image / SVG
    mediaContainer.innerHTML = `
      <img 
        id="lightbox-img-elem" 
        src="${item.url}" 
        alt="${item.title}" 
        class="max-h-[75vh] max-w-[85vw] object-contain transition-transform duration-150 rounded-lg shadow-2xl" 
        style="transform: scale(${state.lightboxZoom}) rotate(${state.lightboxRotation}deg);"
      />
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.add('hidden');
  const mediaContainer = document.getElementById('lightbox-media-container');
  if (mediaContainer) mediaContainer.innerHTML = '';
}

function nextLightboxItem() {
  const items = getFilteredItems();
  const nextIdx = (state.activeLightboxIndex + 1) % items.length;
  openLightboxIndex(nextIdx);
}

function prevLightboxItem() {
  const items = getFilteredItems();
  const prevIdx = (state.activeLightboxIndex - 1 + items.length) % items.length;
  openLightboxIndex(prevIdx);
}

function zoomLightbox(delta) {
  state.lightboxZoom = Math.max(0.2, Math.min(4, state.lightboxZoom + delta));
  applyLightboxTransform();
}

function rotateLightbox() {
  state.lightboxRotation = (state.lightboxRotation + 90) % 360;
  applyLightboxTransform();
}

function resetLightboxTransform() {
  state.lightboxZoom = 1;
  state.lightboxRotation = 0;
  applyLightboxTransform();
}

function applyLightboxTransform() {
  const img = document.getElementById('lightbox-img-elem');
  if (img) {
    img.style.transform = `scale(${state.lightboxZoom}) rotate(${state.lightboxRotation}deg)`;
  }
}

function setVideoSpeed(speed) {
  const vid = document.getElementById('lightbox-video-elem');
  if (vid) vid.playbackRate = speed;
}

function downloadCurrentLightboxItem() {
  const items = getFilteredItems();
  if (state.activeLightboxIndex >= 0 && state.activeLightboxIndex < items.length) {
    downloadSingleItem(items[state.activeLightboxIndex].id);
  }
}

/**
 * Direct Download for a single item
 */
function downloadSingleItem(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  const a = document.createElement('a');
  a.href = item.url;
  a.target = '_blank';
  a.download = `${sanitizeFilename(item.title)}.${item.format.toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Batch ZIP Download with JSZip & FileSaver
 */
async function downloadSelectedZip() {
  const selected = state.items.filter(item => state.selectedIds.has(item.id));
  if (selected.length === 0) {
    alert('Please select at least one media item to download.');
    return;
  }

  if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
    alert('Compression library is loading... please try again in a moment.');
    return;
  }

  const modal = document.getElementById('zip-progress-modal');
  const bar = document.getElementById('zip-progress-bar');
  const status = document.getElementById('zip-progress-status');
  const count = document.getElementById('zip-progress-count');
  const pct = document.getElementById('zip-progress-percent');

  if (modal) modal.classList.remove('hidden');

  const zip = new JSZip();
  const folderImages = zip.folder('images');
  const folderVideos = zip.folder('videos');
  const folderAudio = zip.folder('audio');
  const folderSvg = zip.folder('vectors');

  let successCount = 0;
  const manifest = [];

  for (let i = 0; i < selected.length; i++) {
    const item = selected[i];
    const percent = Math.round(((i + 1) / selected.length) * 100);
    
    if (status) status.innerText = `Archiving ${item.title}...`;
    if (count) count.innerText = `${i + 1} / ${selected.length} items`;
    if (pct) pct.innerText = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;

    try {
      let blob = null;

      if (item.url.startsWith('data:')) {
        // Handle Data URI directly
        blob = dataUriToBlob(item.url);
      } else {
        // Fetch binary data, fallback via CORS proxy if blocked
        try {
          const res = await fetch(item.url, { mode: 'cors' });
          if (res.ok) blob = await res.blob();
        } catch (corsErr) {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(item.url)}`;
          const resProxy = await fetch(proxyUrl);
          if (resProxy.ok) blob = await resProxy.blob();
        }
      }

      if (blob) {
        const cleanName = `${String(i + 1).padStart(3, '0')}_${sanitizeFilename(item.title)}.${item.format.toLowerCase()}`;
        
        if (item.type === 'image') folderImages.file(cleanName, blob);
        else if (item.type === 'video') folderVideos.file(cleanName, blob);
        else if (item.type === 'audio') folderAudio.file(cleanName, blob);
        else if (item.type === 'svg') folderSvg.file(cleanName, blob);

        successCount++;
        manifest.push({
          filename: cleanName,
          type: item.type,
          format: item.format,
          resolution: item.width > 0 ? `${item.width}x${item.height}` : 'unknown',
          originalUrl: item.url
        });
      }
    } catch (e) {
      console.warn('Failed to bundle:', item.url, e);
    }
  }

  // Add Manifest Report
  zip.file('manifest.json', JSON.stringify({
    generator: 'OmniExtract Media Engine',
    extractedFrom: state.currentUrl,
    extractedAt: new Date().toISOString(),
    totalExtracted: successCount,
    files: manifest
  }, null, 2));

  if (status) status.innerText = 'Compressing archive...';
  
  const content = await zip.generateAsync({ type: 'blob' });
  const host = state.currentUrl ? (new URL(state.currentUrl).hostname.replace(/[^a-zA-Z0-9]/g, '_')) : 'web';
  saveAs(content, `OmniExtract_${host}_${new Date().toISOString().slice(0, 10)}.zip`);

  if (modal) modal.classList.add('hidden');
}

/**
 * Data URI to Blob converter
 */
function dataUriToBlob(dataUri) {
  const parts = dataUri.split(',');
  const byteString = atob(parts[1]);
  const mime = parts[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

/**
 * Copy Single URL or Export All
 */
function copyMediaUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Copied URL to clipboard!');
  }).catch(() => {
    alert('URL: ' + url);
  });
}

function exportUrlsAsText() {
  const urls = state.items.filter(i => state.selectedIds.has(i.id)).map(i => i.url).join('\n');
  downloadTextFile(urls, 'extracted_urls.txt', 'text/plain');
}

function exportUrlsAsJson() {
  const selected = state.items.filter(i => state.selectedIds.has(i.id));
  const jsonStr = JSON.stringify(selected, null, 2);
  downloadTextFile(jsonStr, 'extracted_media.json', 'application/json');
}

function exportUrlsAsCsv() {
  const selected = state.items.filter(i => state.selectedIds.has(i.id));
  let csv = 'ID,Type,Format,Width,Height,Quality,Title,URL\n';
  selected.forEach(i => {
    csv += `"${i.id}","${i.type}","${i.format}","${i.width}","${i.height}","${i.qualityLabel}","${(i.title || '').replace(/"/g, '""')}","${i.url}"\n`;
  });
  downloadTextFile(csv, 'extracted_media.csv', 'text/csv');
}

function downloadTextFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/**
 * Sanitize filename helper
 */
function sanitizeFilename(name) {
  return (name || 'media').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}

/**
 * UI State Helpers
 */
function setScanningUI(isScanning, msg = 'Scanning...') {
  const btn = document.getElementById('scan-btn');
  const btnLabel = document.getElementById('scan-btn-label');
  const statusBanner = document.getElementById('scanning-status-banner');
  const statusMsg = document.getElementById('scanning-status-msg');

  if (isScanning) {
    if (btn) btn.disabled = true;
    if (btnLabel) btnLabel.innerText = 'HARVESTING...';
    if (statusBanner) statusBanner.classList.remove('hidden');
    if (statusMsg) statusMsg.innerText = msg;
  } else {
    if (btn) btn.disabled = false;
    if (btnLabel) btnLabel.innerText = 'EXTRACT MEDIA';
    if (statusBanner) statusBanner.classList.add('hidden');
  }
}

function updateProxyIndicator(text, color = 'sky') {
  const ind = document.getElementById('proxy-status-indicator');
  if (ind) {
    ind.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-${color}-400 animate-pulse"></span>
      <span class="text-${color}-300">${text}</span>
    `;
  }
}

function showScanError(msg) {
  const box = document.getElementById('scan-error-box');
  const msgEl = document.getElementById('scan-error-msg');
  if (box && msgEl) {
    msgEl.innerText = msg;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 9000);
  } else {
    alert(msg);
  }
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-5 right-5 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-mono text-xs font-bold shadow-2xl z-50 animate-bounce';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/**
 * Recent Scans Storage
 */
function loadRecentScans() {
  try {
    const raw = localStorage.getItem('omniextract_recent_scans');
    if (raw) state.recentScans = JSON.parse(raw);
    renderRecentScans();
  } catch (e) {
    state.recentScans = [];
  }
}

function saveRecentScan(url, title, count) {
  try {
    state.recentScans = state.recentScans.filter(s => s.url !== url);
    state.recentScans.unshift({
      url,
      title: title || url,
      count,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (state.recentScans.length > 8) state.recentScans.pop();
    localStorage.setItem('omniextract_recent_scans', JSON.stringify(state.recentScans));
    renderRecentScans();
  } catch (e) {}
}

function renderRecentScans() {
  const list = document.getElementById('recent-scans-list');
  if (!list) return;

  if (state.recentScans.length === 0) {
    list.innerHTML = `<span class="text-xs text-slate-500 font-mono">No recent scans yet.</span>`;
    return;
  }

  list.innerHTML = state.recentScans.map(s => `
    <button 
      type="button" 
      onclick="scanPreset('${s.url}')" 
      class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700 hover:border-sky-500/50 text-xs font-mono text-slate-300 transition flex items-center gap-2"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      <span class="truncate max-w-[150px]">${s.title}</span>
      <span class="text-[10px] text-sky-400 font-bold">(${s.count})</span>
    </button>
  `).join('');
}

/**
 * 1-Click Bookmarklet Generation
 * Allows scraping ANY website directly in the browser context with zero CORS
 */
function initBookmarkletCode() {
  // Draggable Bookmarklet script
  const script = `javascript:(function(){
    try {
      var found = [];
      var seen = {};
      function add(u, t, alt){
        if(!u || typeof u !== 'string' || u.indexOf('javascript:')===0 || seen[u]) return;
        seen[u] = true;
        found.push({url: u, type: t || 'image', title: alt || document.title});
      }
      document.querySelectorAll('img').forEach(function(i){ add(i.src, 'image', i.alt); if(i.srcset) add(i.srcset.split(',')[0].trim().split(' ')[0], 'image'); });
      document.querySelectorAll('video, video source').forEach(function(v){ if(v.src) add(v.src, 'video'); if(v.poster) add(v.poster, 'image'); });
      document.querySelectorAll('meta[property*="image"], meta[name*="image"]').forEach(function(m){ add(m.content, 'image'); });
      document.querySelectorAll('meta[property*="video"], meta[name*="video"]').forEach(function(m){ add(m.content, 'video'); });
      document.querySelectorAll('[style*="url("]').forEach(function(e){ var m = (e.getAttribute('style')||'').match(/url\\(['"]?(.*?)['"]?\\)/i); if(m) add(m[1], 'image'); });
      sessionStorage.setItem('omniextract_import_data', JSON.stringify({ url: window.location.href, title: document.title, items: found }));
      var win = window.open('https://shakyavinit.github.io/omniextract/#import', '_blank');
      if(!win) alert('Found ' + found.length + ' media items! Please enable popups to open OmniExtract.');
    } catch(e) { alert('OmniExtract error: ' + e.message); }
  })();`;

  const btn = document.getElementById('draggable-bookmarklet');
  if (btn) {
    btn.setAttribute('href', script);
  }
}

function checkForBookmarkletImport() {
  try {
    if (window.location.hash === '#import') {
      const raw = sessionStorage.getItem('omniextract_import_data');
      if (raw) {
        const data = JSON.parse(raw);
        sessionStorage.removeItem('omniextract_import_data');
        if (data.items && data.items.length > 0) {
          state.currentUrl = data.url;
          state.pageTitle = data.title;
          const dummyHtml = data.items.map(i => `<img src="${i.url}" alt="${i.title}">`).join('');
          parseMediaFromHTML(dummyHtml, data.url);
          showToast(`Imported ${data.items.length} items from ${data.title}!`);
        }
      }
    }
  } catch (e) {}
}
