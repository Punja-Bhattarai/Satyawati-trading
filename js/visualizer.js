/* ============================================================
   Satyawati Trading & Paints Suppliers
   Virtual Paint Studio — visualizer.js
============================================================ */

(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);

  /* ============================================================
     SHADE PALETTE  (name, code, hex, family)
  ============================================================ */
  const SHADES = (typeof window !== 'undefined' && window.ASIAN_SHADES) ? window.ASIAN_SHADES : [
    { n: 'Droplet', c: '9322', h: '#4d8fc9', f: 'Blue' },
    { n: 'Royal Blue', c: '9833', h: '#2f5fb3', f: 'Blue' },
    { n: 'Sky Blue', c: '9330', h: '#7db8e0', f: 'Blue' },
    { n: 'Aqua Mist', c: '9301', h: '#a7d6df', f: 'Blue' },
    { n: 'Deep Ocean', c: '9801', h: '#1f4e79', f: 'Blue' },
    { n: 'Spring Green', c: '8586', h: '#6faf5e', f: 'Green' },
    { n: 'Olive Leaf', c: '8760', h: '#7c8a3c', f: 'Green' },
    { n: 'Mint', c: '8551', h: '#b8d9a0', f: 'Green' },
    { n: 'Pine', c: '8610', h: '#2f6b3f', f: 'Green' },
    { n: 'Emerald', c: '8804', h: '#2e8b57', f: 'Green' },
    { n: 'Cream', c: '3011', h: '#f3e6c8', f: 'Cream' },
    { n: 'Vanilla', c: '3020', h: '#f0e0b8', f: 'Cream' },
    { n: 'Ivory', c: '3001', h: '#f7f1df', f: 'White' },
    { n: 'White', c: '1001', h: '#ffffff', f: 'White' },
    { n: 'Off White', c: '1003', h: '#f5f3ef', f: 'White' },
    { n: 'Pearl', c: '1008', h: '#e9e6e0', f: 'White' },
    { n: 'Beige', c: '4050', h: '#d6c3a3', f: 'Beige' },
    { n: 'Sand', c: '4070', h: '#cbb896', f: 'Beige' },
    { n: 'Stone', c: '4010', h: '#b8a88e', f: 'Beige' },
    { n: 'Terracotta', c: '7002', h: '#c96a45', f: 'Orange' },
    { n: 'Sunburst', c: '7550', h: '#e8963c', f: 'Orange' },
    { n: 'Golden Yellow', c: '7010', h: '#f5c518', f: 'Yellow' },
    { n: 'Butter', c: '7110', h: '#f7dc7b', f: 'Yellow' },
    { n: 'Marigold', c: '7600', h: '#f0a92e', f: 'Yellow' },
    { n: 'Tomato Red', c: '6670', h: '#d94f36', f: 'Red' },
    { n: 'Brick', c: '6602', h: '#a94f35', f: 'Red' },
    { n: 'Rose Petal', c: '5520', h: '#e39aa8', f: 'Pink' },
    { n: 'Blush', c: '5504', h: '#efb8be', f: 'Pink' },
    { n: 'Magenta', c: '5600', h: '#c4496a', f: 'Pink' },
    { n: 'Lavender', c: '6103', h: '#b9a9d6', f: 'Purple' },
    { n: 'Plum', c: '6200', h: '#7d4f8f', f: 'Purple' },
    { n: 'Grape', c: '6300', h: '#5b3a7a', f: 'Purple' },
    { n: 'Grey', c: '2002', h: '#9a9a9a', f: 'Grey' },
    { n: 'Slate', c: '2100', h: '#6e7275', f: 'Grey' },
    { n: 'Silver', c: '2020', h: '#c4c4c4', f: 'Grey' },
    { n: 'Charcoal', c: '2300', h: '#3a3d42', f: 'Grey' },
    { n: 'Brown', c: '8050', h: '#6b4423', f: 'Brown' },
    { n: 'Walnut', c: '8100', h: '#4f3018', f: 'Brown' },
    { n: 'Coffee', c: '8080', h: '#8a6240', f: 'Brown' },
  ];

  const FAMILIES = [...new Set(SHADES.map((s) => s.f))].sort();

  // Development debug mode: /paint-visualizer?d=1 (or ?debug=1) draws the
  // detected region/edges on the overlay canvas after each Smart Paint.
  const debugMode = /[?&](d|debug)=1/i.test(window.location.search);

  /* ============================================================
     STATE
  ============================================================ */
  const state = {
    image: null,        // original ImageData (working resolution)
    width: 0,
    height: 0,
    originalURL: null,  // original as dataURL (for save/continue)
    regions: [],
    selectedId: null,
    tool: 'smart',
    eraseMode: 'brush', // eraser: 'brush' | 'select' (dots)
    shade: null,        // current shade {n,c,h,f}
    undo: [],
    redo: [],
    painting: false,
    lastX: -1,
    lastY: -1,
  };

  const canvas = $('#paintCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const lassoCanvas = $('#lassoCanvas');
  const lctx = lassoCanvas ? lassoCanvas.getContext('2d') : null;

  /* ============================================================
     HELPERS
  ============================================================ */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  function cloneRegions(regions) {
    return regions.map((r) => ({ id: r.id, mask: new Uint8Array(r.mask), color: { ...r.color }, hex: r.hex, name: r.name, code: r.code }));
  }

  function snapshot() {
    return cloneRegions(state.regions);
  }

  function pushUndo() {
    state.undo.push(snapshot());
    if (state.undo.length > 50) state.undo.shift();
    state.redo = [];
  }

  function fitCanvas() {
    if (!state.width || !state.height) return;
    const holder = document.querySelector('.canvas-holder');
    if (!holder) return;
    const pad = 16;
    const hw = holder.clientWidth - pad;
    const hh = holder.clientHeight - pad;
    if (hw <= 0 || hh <= 0) return;
    const scale = Math.min(hw / state.width, hh / state.height);
    const w = Math.round(state.width * scale);
    const h = Math.round(state.height * scale);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const wrap = document.querySelector('.canvas-wrap');
    if (wrap) {
      wrap.style.width = w + 'px';
      wrap.style.height = h + 'px';
    }
  }

  function toast(msg) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ============================================================
     IMAGE LOADING
  ============================================================ */
  const MAX_DIM = 1100;

  function loadFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast('Please use a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 18 * 1024 * 1024) {
      toast('Image is too large. Please use one under 18 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => loadImageFromDataURL(e.target.result);
    reader.readAsDataURL(file);
  }

  function loadImageFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = Math.min(1, MAX_DIM / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(img, 0, 0, w, h);

      state.image = tctx.getImageData(0, 0, w, h);
      state.width = w;
      state.height = h;
      state.originalURL = tmp.toDataURL('image/jpeg', 0.88);
      state.regions = [];
      state.selectedId = null;
      state.undo = [];
      state.redo = [];
      state.lasso = [];
      state.grad = computeGradients(state.image.data, w, h);

      canvas.width = w;
      canvas.height = h;
      lassoCanvas.width = w;
      lassoCanvas.height = h;
      ctx.putImageData(state.image, 0, 0);
      clearLasso();

      $('#uploadStep').classList.add('hidden');
      $('#editorStep').classList.remove('hidden');
      fitCanvas();
      updateCanvasHint();
      renderRegions();
      updateToolButtons();
      const nFound = autoSuggestWalls();
      if (nFound === 0) {
        suggestions = remodelForDetection();
        drawSuggestions();
        updateAutoUi();
        toast(nFound === 0 && suggestions.length
          ? 'Detection needed a small contrast boost — try clicking a wall or Paint All Walls.'
          : 'Could not auto-detect walls. Click a wall or use Brush/Select.');
      } else {
        toast('Detected ' + nFound + ' wall area(s). Click one to paint it, or use Paint All Walls.');
      }
    };
    img.onerror = () => toast('Could not read that image.');
    img.src = dataURL;
  }

  /* ============================================================
     FLOOD FILL — region detection
  ============================================================ */
  function computeGradients(data, w, h) {
    const grad = new Uint8Array(w * h);
    const cx = (v) => Math.max(0, Math.min(w - 1, v));
    const cy = (v) => Math.max(0, Math.min(h - 1, v));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const L = (px, py) => {
          const p = cy(py) * w + cx(px);
          return 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];
        };
        const tl = L(x - 1, y - 1), tm = L(x, y - 1), tr = L(x + 1, y - 1);
        const ml = L(x - 1, y), mr = L(x + 1, y);
        const bl = L(x - 1, y + 1), bm = L(x, y + 1), br = L(x + 1, y + 1);
        const gx = (tl + 2 * ml + bl) - (tr + 2 * mr + br);
        const gy = (tl + 2 * tm + tr) - (bl + 2 * bm + br);
        grad[i] = Math.min(255, (Math.abs(gx) + Math.abs(gy)) >> 2);
      }
    }
    return grad;
  }

  /* ============================================================
     SEGMENTATION — edge-aware, non leak-prone Smart Paint
     Grows a connected region from the click, gated by:
       • seed-relative color bound  (cannot drift onto another surface)
       • running local mean        (follows gradients/shadows on a wall)
       • gradient barrier          (roof/window/door edges STOP the grow
                                    even when the color is similar)
       • luminance bound
     Then: sky/context guard, confidence safety cap, mask cleanup,
     and a conservative bounded fallback.
  ============================================================ */

  // cached work buffers (allocated once per image)
  let segVisited = null;   // Uint8Array
  let segStack = null;     // Int32Array (capacity = w*h)

  function allocSeg(w, h) {
    const n = w * h;
    segVisited = new Uint8Array(n);
    segStack = new Int32Array(n);
  }

  // Edge-aware connected region grow from (sx, sy).
  // DENSE result: the mask is completed for every pixel of the same surface, so
  // no original wall color remains visible inside the detected wall. Strong
  // architectural edges (roof / window / door lines) stop the grow; the sky cap
  // in smartPaint protects against leaks. Windows/doors stay as legitimate holes.
  function growRegion(data, w, h, sx, sy, opts) {
    const o = opts || {};
    const grad = state.grad;
    const sf = (o.stopFactor !== undefined) ? o.stopFactor : 1;   // < 1 => more conservative
    const T_SEED = (o.seedTol || 58) * sf;   // generous seed bound => full-surface coverage
    const T_LUM = (o.lumTol || 75) * sf;     // luminance bound follows shadow gradient
    const E_BAR = o.edgeBar || 52;           // only strong edges tighten (wall texture/shadows pass)
    const E_HARD = o.edgeHard || 80;         // very strong edge => only near-identical may cross

    const n = w * h;
    const mask = new Uint8Array(n);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return { mask, count: 0 };

    const i0 = sy * w + sx;
    const o0 = i0 * 4;
    const sr = data[o0], sg = data[o0 + 1], sb = data[o0 + 2];
    const sl = 0.299 * sr + 0.587 * sg + 0.114 * sb;

    // reuse buffers
    if (!segVisited || segVisited.length !== n) allocSeg(w, h);
    segVisited.fill(0);

    let stackLen = 0;
    segStack[stackLen++] = i0;
    segVisited[i0] = 1;
    mask[i0] = 255;
    let count = 1;

    while (stackLen) {
      const i = segStack[--stackLen];
      const oi = i * 4;
      const r = data[oi], g = data[oi + 1], b = data[oi + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const dR = r - sr, dG = g - sg, dB = b - sb;
      const dSeed = Math.max(Math.abs(dR), Math.abs(dG), Math.abs(dB));
      const dLum = Math.abs(lum - sl);
      const gb = grad[i];

      // Surface membership: whole wall (incl. texture/shadows) is within tolerance.
      const okSurf = dSeed <= T_SEED && dLum <= T_LUM;

      // Gradient barrier: a strong edge stops the grow even if color is similar,
      // which prevents roof/skylines/windows from being crossed/painted.
      let ok = okSurf;
      if (ok && gb >= E_BAR) {
        ok = gb >= E_HARD ? dSeed <= 7 : dSeed <= 16;
      }

      if (ok) {
        mask[i] = 255;
        count++;
        const x = i % w;
        if (x > 0 && !segVisited[i - 1]) { segVisited[i - 1] = 1; segStack[stackLen++] = i - 1; }
        if (x < w - 1 && !segVisited[i + 1]) { segVisited[i + 1] = 1; segStack[stackLen++] = i + 1; }
        if (i >= w && !segVisited[i - w]) { segVisited[i - w] = 1; segStack[stackLen++] = i - w; }
        if (i < (h - 1) * w && !segVisited[i + w]) { segVisited[i + w] = 1; segStack[stackLen++] = i + w; }
      }
    }

    // ---- complete the mask: close thin texture gaps, keep windows as holes ----
    let cleaned = mask;
    if (count > 0) cleaned = closeMask(mask, w, h, data, i0, sr, sg, sb, T_SEED, grad);
    return { mask: cleaned, count };
  }

  // Close thin ragged gaps inside the wall so no original color shows, WITHOUT
  // filling enclosed windows/doors (those are legitimately unpainted). A zero
  // pixel is filled only if it is on the same surface as the wall (color within
  // tolerance of the seed, not a strong architectural edge) and adjacent to the mask.
  function closeMask(mask, w, h, data, seedIdx, sr, sg, sb, T_SEED, grad) {
    const n = w * h;
    const out = new Uint8Array(mask);
    const edgeBar = 55;
    // fill zero pixels that are 4-adjacent to the mask and same-surface
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (out[i]) continue;
          const oi = i * 4;
          const r = data[oi], g = data[oi + 1], b = data[oi + 2];
          const dSeed = Math.max(Math.abs(r - sr), Math.abs(g - sg), Math.abs(b - sb));
          if (dSeed > T_SEED) continue;               // different surface -> keep hole (window/door)
          if (grad && grad[i] >= edgeBar) continue;   // don't bridge a real architectural edge
          const xl = x > 0 && out[i - 1], xr = x < w - 1 && out[i + 1];
          const yu = y > 0 && out[i - w], yd = y < h - 1 && out[i + w];
          if (xl || xr || yu || yd) out[i] = 255;
        }
      }
    }
    // keep only pixels connected to the seed (safe)
    const visited = new Int32Array(n);
    const stack = new Int32Array(n);
    let sp = 0;
    visited[seedIdx] = 1;
    stack[sp++] = seedIdx;
    const res = new Uint8Array(n);
    res[seedIdx] = 255;
    while (sp) {
      const i = stack[--sp];
      const x = i % w, y = (i / w) | 0;
      const tryP = (j) => { if (out[j] && !visited[j]) { visited[j] = 1; stack[sp++] = j; res[j] = 255; } };
      if (x > 0 && out[i - 1]) tryP(i - 1);
      if (x < w - 1 && out[i + 1]) tryP(i + 1);
      if (y > 0 && out[i - w]) tryP(i - w);
      if (y < h - 1 && out[i + w]) tryP(i + w);
    }
    return res;
  }

  /* ============================================================
     AUTO WALL SUGGESTIONS + REMODEL FALLBACK
     After the photo loads we run detection from a coarse grid of seeds
     and surface the promising "wall" regions as clickable suggestions.
     If too few are found, we re-run on an edge-enhanced copy of the same
     photo (remodel) — wall colors/texture are unchanged, only local
     contrast is boosted so roof/window seams become detectable.
  ============================================================ */
  let suggestions = [];   // [{ mask, cx, cy, count }]

  function autoSuggestWalls() {
    suggestions = detectWalls(state.image.data, state.width, state.height, state.grad);
    drawSuggestions();
    updateAutoUi();
    return suggestions.length;
  }

  // Re-render an edge-enhanced copy of the photo (for detection only) and
  // re-scan. Original pixels are never shown/modified on the paint canvas.
  function remodelForDetection() {
    const w = state.width, h = state.height;
    const src = state.image.data;
    const grad = computeGradients(src, w, h);
    const data = new Uint8ClampedArray(src);
    // A) darken seam pixels so roof/wall seams read as edges
    for (let i = 0; i < data.length; i += 4) {
      const gi = (i >> 2);
      const g = grad[gi];
      if (g < 12) continue;
      const boost = g >= 60 ? 70 : (g >= 30 ? 34 : 18);
      data[i] = Math.max(0, data[i] - boost);
      data[i + 1] = Math.max(0, data[i + 1] - boost);
      data[i + 2] = Math.max(0, data[i + 2] - boost);
    }
    // B) normalize flat-surface luminance toward seed readability (lighten shadows,
    //    darken bright highlights) so walls become more color-homogeneous
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 30) continue;
      const f = lum > 128 ? 1.06 : 0.94;
      data[i] = Math.min(255, data[i] * f);
      data[i + 1] = Math.min(255, data[i + 1] * f);
      data[i + 2] = Math.min(255, data[i + 2] * f);
    }
    const ng = computeGradients(data, w, h);
    // detection with LOOSER size bounds (preferMore => accept partial walls)
    return detectWalls(data, w, h, ng, true);
  }

  // Scan seeds on a coarse grid and collect wall-like regions.
  function detectWalls(data, w, h, grad, preferMore) {
    const n = w * h;
    const tops = [];
    const gs = 8;                       // grid step (% of width)
    const step = Math.max(24, Math.round(w / gs));
    const yStart = Math.round(h * 0.14); // start toward upper-middle (walls/roof band)
    const yEnd = Math.round(h * 0.78);   // stay well above ground/lower foreground
    for (let fy = yStart; fy <= yEnd; fy += step) {
      for (let fx = step; fx < w; fx += step) {
        const seed = fy * w + fx;
        const g = growRegion(data, w, h, fx, fy, { seedTol: 58, lumTol: 75 });
        const minPx = preferMore ? 200 : 500;
        if (g.count < minPx) continue;      // too small
        const frac = g.count / n;
        // require the candidate to be large enough to be a wall, not a window/door.
        // Windows/doors on a house are usually < ~4% of the frame.
        const minFrac = preferMore ? 0.03 : 0.06;
        if (frac > (preferMore ? 0.9 : 0.85) || frac < minFrac) continue;
        if (touchesTop(g.mask, w, h)) continue;     // sky touched => not a wall
        if (touchesBottom(g.mask, w, h)) continue;  // ground touched => not a wall
        tops.push({ mask: g.mask, count: g.count, cx: fx, cy: fy });
      }
    }
    // merge heavily-overlapping suggestions, keep the largest.
    // Also drop a candidate whose bounding box is fully enclosed inside an already
    // kept suggestion's bbox — that means it is a window/door/hole of that wall,
    // not a separate wall.
    tops.sort((a, b) => b.count - a.count);
    const kept = [];
    for (const t of tops) {
      if (kept.find((k) => overlapFrac(k.mask, t.mask) > 0.55)) continue;
      const bb = maskBBox(t.mask, w, h);
      if (bb && kept.find((k) => {
        const kb = maskBBox(k.mask, w, h);
        return kb && bb[0] >= kb[0] && bb[1] >= kb[1] && bb[2] <= kb[2] && bb[3] <= kb[3];
      })) continue;
      kept.push(t);
      if (kept.length >= 8) break;
    }
    return kept;
  }

  function maskBBox(mask, w, h) {
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    return maxX < 0 ? null : [minX, minY, maxX, maxY];
  }

  function overlapFrac(a, b) {
    let inter = 0, union = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i]) { union++; if (b[i]) inter++; }
      else if (b[i]) union++;
    }
    return union ? inter / union : 0;
  }

  // Draw suggestion outlines on the overlay canvas (subtle, non-blocking).
  function drawSuggestions() {
    if (!lctx || !state.width) return;
    lctx.clearRect(0, 0, state.width, state.height);
    if (!suggestions.length) return;
    lctx.save();
    lctx.strokeStyle = 'rgba(0,200,255,0.85)';
    lctx.lineWidth = 1;
    suggestions.forEach((s) => {
      const w = state.width, h = state.height;
      let first = true;
      for (let cy = 0; cy < h; cy++) {
        for (let cx = 0; cx < w; cx++) {
          const i = cy * w + cx;
          if (!s.mask[i]) continue;
          const on = cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1
            ? true
            : !(s.mask[i - 1] && s.mask[i + 1] && s.mask[i - w] && s.mask[i + w]);
          if (on && cx % 2 === 0 && cy % 2 === 0) {
            lctx.fillRect(cx, cy, 1, 1);
          }
        }
      }
    });
    lctx.restore();
  }

  function suggestionAt(x, y) {
    const i = y * state.width + x;
    for (const s of suggestions) if (s.mask[i]) return s;
    return null;
  }

  function paintSuggestion(s) {
    if (!state.shade) { toast('Pick a shade first.'); return; }
    pushUndo();
    addRegion(s.mask, state.shade);
    renderCanvas();
  }

  function paintAllWalls() {
    if (!state.shade) { toast('Pick a shade first.'); return; }
    if (!suggestions.length) { toast('No walls auto-detected — try the Brush/Select tool.'); return; }
    if (state.regions.length) pushUndo();
    suggestions.forEach((s) => addRegion(s.mask, state.shade));
    renderCanvas();
    toast('Painted ' + suggestions.length + ' auto-detected wall(s).');
  }

  function updateAutoUi() {
    const btn = $('#paintAllBtn');
    if (!btn) return;
    btn.disabled = !state.shade || !suggestions.length;
  }

  if (debugMode) {
    window.__suggestions = () => suggestions.map((s) => s.count);
    window.__suggestMask = (k) => { const s = suggestions[k]; return s ? Array.from(s.mask) : []; };
  }

  /* ============================================================
     SMART PAINT — dispatch + safety + fallback
  ============================================================ */

  function smartPaint(x, y) {
    if (!state.shade) {
      toast('Pick a shade first.');
      return;
    }
    const w = state.width, h = state.height;
    const data = state.image.data;
    const n = w * h;
    const px = Math.max(0, Math.min(w - 1, Math.round(x)));
    const py = Math.max(0, Math.min(h - 1, Math.round(y)));
    const i0 = py * w + px;

    // ---- LEVEL 1: attempt full edge-aware grow ----
    const primary = growRegion(data, w, h, px, py);
    const pFrac = primary.count / n;
    const pTop = touchesTop(primary.mask, w, h);

    // ---- SAFETY CAP (Phase 18 / 17) ----
    // A wall should almost never be > ~40% of the frame; sky is the #1 leak.
    // If the region touches the sky band at the top over a wide run, it almost
    // certainly caught the sky — so we drop down to a bounded fallback instead.
    // A genuine wall can fill a large portion of the frame. The primary sky guard
    // is touchesTop() (sky always reaches the top border); the size cap only
    // rejects the pathological case of filling almost the entire frame.
    const TOPCAP = 0.85;

    let use = primary;
    let accepted = primary.count > 120 && pFrac <= TOPCAP && !pTop;

    // ---- LEVEL 2: conservative edge-aware fallback ----
    if (!accepted) {
      const fb = growRegion(data, w, h, px, py, { stopFactor: 0.4, seedTol: 46, lumTol: 46, adaptiveRadius: 5 });
      const fFrac = fb.count / n;
      const fTop = touchesTop(fb.mask, w, h);
      if (fb.count >= 120 && fFrac <= TOPCAP && !fTop) { use = fb; accepted = true; }
    }

    // ---- LEVEL 3: last-resort tiny safe region (never sky - stays local) ----
    if (!accepted) {
      const mini = growRegion(data, w, h, px, py, { stopFactor: 0.18, seedTol: 34, lumTol: 34, adaptiveRadius: 6 });
      const mFrac = mini.count / n;
      if (mini.count >= 60 && mFrac <= TOPCAP) { use = mini; accepted = true; }
    }

    if (!accepted || use.count < 60) {
      toast(use.count > 10 && (use.count / n) > TOPCAP
        ? 'Region too large — it caught the sky/background. Click closer to the wall or use Select/Brush.'
        : 'Could not detect a clean wall here — try the Brush tool or click the middle of a wall.');
      if (debugMode && use.count) dumpDebug(i0, use.mask, w, h, true);
      return;
    }

    pushUndo();
    addRegion(use.mask, state.shade);
    renderCanvas();
    if (debugMode) dumpDebug(i0, use.mask, w, h, false);
  }

  // True if the mask reaches the image's top border over a notably wide run.
  function touchesTop(mask, w, h) {
    let run = 0, maxRun = 0;
    for (let x = 0; x < w; x++) {
      run = mask[x] ? run + 1 : 0;
      if (run > maxRun) maxRun = run;
    }
    return maxRun > w * 0.15;
  }

  // True if the mask reaches the bottom border over a notably wide run (ground).
  function touchesBottom(mask, w, h) {
    let run = 0, maxRun = 0;
    for (let x = 0; x < w; x++) {
      run = mask[(h - 1) * w + x] ? run + 1 : 0;
      if (run > maxRun) maxRun = run;
    }
    return maxRun > w * 0.15;
  }

  // Debug visualization on the overlay canvas (enabled with ?d=1).
  function dumpDebug(seedIdx, mask, w, h, rejected) {
    if (!lctx) return;
    lctx.clearRect(0, 0, w, h);
    // faint outline of the detected mask
    lctx.save();
    lctx.strokeStyle = rejected ? 'rgba(255,60,0,0.9)' : 'rgba(0,230,120,0.9)';
    lctx.lineWidth = 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        const on = x === 0 || y === 0 || x === w - 1 || y === h - 1
          ? false
          : !(mask[i - 1] && mask[i + 1] && mask[i - w] && mask[i + w]);
        if (on) {
          if (x % 2 === 0 && y % 2 === 0) lctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // seed marker
    const sx = seedIdx % w, sy = (seedIdx / w) | 0;
    lctx.fillStyle = '#ff0044';
    lctx.beginPath();
    lctx.arc(sx, sy, 3, 0, Math.PI * 2);
    lctx.fill();
    lctx.restore();
  }

  function fillGaps(mask, w, h, maxGap) {
    if (maxGap === undefined) maxGap = Math.round(w * 0.04);
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        if (!mask[y * w + x]) { x++; continue; }
        let end = x + 1;
        while (end < w && mask[y * w + end]) end++;
        if (end >= w) break;
        let gapEnd = end;
        while (gapEnd < w && !mask[y * w + gapEnd]) gapEnd++;
        if (gapEnd < w && gapEnd - end <= maxGap) {
          for (let gx = end; gx < gapEnd; gx++) mask[y * w + gx] = 255;
        }
        x = gapEnd;
      }
    }
  }

  function addRegion(mask, shade) {
    const id = Date.now() + Math.random();
    const region = {
      id,
      mask,
      color: hexToRgb(shade.h),
      hex: shade.h,
      name: shade.n,
      code: shade.c,
    };
    state.regions.push(region);
    state.selectedId = id;
    renderRegions();
    updateCanvasHint();
  }

  /* ============================================================
     RENDERING — luminance-preserving paint
  ============================================================ */
  let renderQueued = false;
  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; renderCanvas(); });
  }

  function renderCanvas() {
    const w = state.width, h = state.height;
    const base = state.image.data;
    const out = new Uint8ClampedArray(base);
    const n = w * h;
    const regions = state.regions;
    const R = regions.length;

    if (R) {
      const lumSum = new Float64Array(R);
      const cnt = new Int32Array(R);
      for (let i = 0; i < n; i++) {
        const o = i * 4;
        const lum = 0.299 * base[o] + 0.587 * base[o + 1] + 0.114 * base[o + 2];
        for (let r = 0; r < R; r++) {
          if (regions[r].mask[i]) { lumSum[r] += lum; cnt[r]++; }
        }
      }
      const means = new Float64Array(R);
      for (let r = 0; r < R; r++) means[r] = cnt[r] ? lumSum[r] / cnt[r] : 128;

      for (let r = 0; r < R; r++) {
        const mask = regions[r].mask;
        const color = regions[r].color;
        const mean = means[r];
        for (let i = 0; i < n; i++) {
          const a = mask[i];
          if (!a) continue;
          const o = i * 4;
          const lum = 0.299 * base[o] + 0.587 * base[o + 1] + 0.114 * base[o + 2];
          let f = mean > 0 ? lum / mean : 1;
          f = 0.5 + 0.5 * f;
          f = Math.max(0.75, Math.min(1.25, f));
          const t = a / 255;
          out[o] = out[o] * (1 - t) + Math.max(0, Math.min(255, color.r * f)) * t;
          out[o + 1] = out[o + 1] * (1 - t) + Math.max(0, Math.min(255, color.g * f)) * t;
          out[o + 2] = out[o + 2] * (1 - t) + Math.max(0, Math.min(255, color.b * f)) * t;
        }
      }
    }

    ctx.putImageData(new ImageData(out, w, h), 0, 0);
    updateToolButtons();
  }

  /* ============================================================
     BRUSH / ERASER
  ============================================================ */
  function strokeAt(x, y) {
    if (state.tool === 'smart') return;
    if (state.tool === 'brush' && !state.shade) {
      toast('Pick a shade first.');
      return;
    }
    const erase = state.tool === 'eraser';
    if (erase && !state.regions.length) {
      toast('Nothing painted to erase yet.');
      return;
    }
    let region = null;
    if (!erase) {
      region = state.regions.find((r) => r.id === state.selectedId);
      if (!region) {
        region = {
          id: Date.now() + Math.random(),
          mask: new Uint8Array(state.width * state.height),
          color: hexToRgb(state.shade.h),
          hex: state.shade.h,
          name: state.shade.n,
          code: state.shade.c,
        };
        state.regions.push(region);
        state.selectedId = region.id;
      }
    }

    const size = Number($('#brushSize').value);
    const soft = Number($('#brushSoft').value) / 100;
    const r = Math.max(2, size);
    const x0 = Math.max(0, Math.floor(x - r));
    const y0 = Math.max(0, Math.floor(y - r));
    const x1 = Math.min(state.width - 1, Math.ceil(x + r));
    const y1 = Math.min(state.height - 1, Math.ceil(y + r));

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const d = Math.hypot(px - x, py - y);
        if (d > r) continue;
        let fall = 1;
        if (soft > 0) {
          fall = Math.max(0, 1 - (d / r));
          fall = fall * fall * (3 - 2 * fall);
          fall = 0.45 + 0.55 * fall;
        }
        const v = Math.round(255 * fall);
        const i = py * state.width + px;
        if (erase) {
          state.regions.forEach((reg) => { reg.mask[i] = Math.min(reg.mask[i], 255 - v); });
        } else {
          region.mask[i] = Math.max(region.mask[i], v);
        }
      }
    }
  }

  function beginStroke(x, y) {
    const rx = Math.round(x), ry = Math.round(y);
    if (state.tool === 'smart') {
      const s = suggestions.length ? suggestionAt(rx, ry) : null;
      if (s) { paintSuggestion(s); return; }
      smartPaint(rx, ry);
      return;
    }
    if (state.tool === 'select' || (state.tool === 'eraser' && state.eraseMode === 'select')) {
      addSelectPoint(rx, ry);
      return;
    }
    state.painting = true;
    state.lastX = x;
    state.lastY = y;
    pushUndo();
    strokeAt(x, y);
    renderCanvas();
    renderRegions();
  }

  function continueStroke(x, y) {
    if (!state.painting) return;
    if (Math.hypot(x - state.lastX, y - state.lastY) < 1.5) return;
    state.lastX = x;
    state.lastY = y;
    strokeAt(x, y);
    requestRender();
  }

  /* ============================================================
     SELECT TOOL — tap dots around the part, Finish paints it
  ============================================================ */
  function addSelectPoint(x, y) {
    const last = state.lasso[state.lasso.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < 5) return;
    state.lasso.push({ x, y });
    drawLasso();
    updateSelectButtons();
  }

  function undoSelectPoint() {
    state.lasso.pop();
    drawLasso();
    updateSelectButtons();
  }

  function updateSelectButtons() {
    const n = state.lasso.length;
    $('#finishSelectBtn').disabled = n < 3;
    $('#undoPointBtn').disabled = n === 0;
    $('#clearSelectBtn').disabled = n === 0;
  }

  function drawLasso() {
    if (!lctx) return;
    lctx.clearRect(0, 0, state.width, state.height);
    const pts = state.lasso;
    if (!pts.length) return;
    const dw = state.width / 240;
    lctx.save();
    lctx.lineWidth = Math.max(2, dw);
    lctx.lineJoin = 'round';
    lctx.lineCap = 'round';
    lctx.strokeStyle = 'rgba(255,255,255,0.95)';
    lctx.beginPath();
    lctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) lctx.lineTo(pts[i].x, pts[i].y);
    if (pts.length >= 3) lctx.closePath();
    lctx.stroke();
    lctx.lineWidth = 1.5;
    lctx.strokeStyle = 'rgba(0,0,0,0.55)';
    lctx.stroke();
    const dotR = Math.max(4, dw);
    for (let i = 0; i < pts.length; i++) {
      lctx.beginPath();
      lctx.arc(pts[i].x, pts[i].y, dotR, 0, Math.PI * 2);
      lctx.fillStyle = '#fff';
      lctx.fill();
      lctx.strokeStyle = 'rgba(0,0,0,0.7)';
      lctx.lineWidth = 1.5;
      lctx.stroke();
    }
    lctx.restore();
  }

  function clearLasso() {
    state.lasso = [];
    if (lctx) lctx.clearRect(0, 0, state.width, state.height);
    updateSelectButtons();
  }

  function polygonMask(points, w, h) {
    const mask = new Uint8Array(w * h);
    const n = points.length;
    for (let y = 0; y < h; y++) {
      const xs = [];
      for (let j = 0; j < n; j++) {
        const k = (j + 1) % n;
        const x1 = points[j].x, y1 = points[j].y;
        const x2 = points[k].x, y2 = points[k].y;
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
          const t = (y - y1) / (y2 - y1);
          xs.push(x1 + t * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let e = 0; e + 1 < xs.length; e += 2) {
        const a = Math.max(0, Math.round(xs[e]));
        const b = Math.min(w - 1, Math.round(xs[e + 1]));
        for (let x = a; x <= b; x++) mask[y * w + x] = 255;
      }
    }
    return mask;
  }

  function applySelection() {
    if (state.lasso.length < 3) {
      toast('Tap at least 3 points around the part first.');
      return;
    }
    const mask = polygonMask(state.lasso, state.width, state.height);
    clearLasso();
    if (state.tool === 'eraser') {
      applyEraseSelection(mask);
      return;
    }
    if (!state.shade) {
      toast('Pick a shade first — the selection paints it.');
      return;
    }
    pushUndo();
    addRegion(mask, state.shade);
    renderCanvas();
  }

  function applyEraseSelection(mask) {
    if (!state.regions.length) {
      toast('Nothing painted to erase.');
      return;
    }
    pushUndo();
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      state.regions.forEach((r) => { r.mask[i] = 0; });
    }
    renderCanvas();
    renderRegions();
  }

  /* ============================================================
     POINTER / TOUCH — painting only (photo always fits)
  ============================================================ */
  const wrap = $('#canvasWrap');
  const canvasActions = $('#canvasActions');

  canvasActions.addEventListener('pointerdown', (e) => e.stopPropagation());
  canvasActions.addEventListener('pointerup', (e) => e.stopPropagation());
  canvasActions.addEventListener('click', (e) => e.stopPropagation());

  function canvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(state.width, (clientX - rect.left) * (state.width / rect.width))),
             y: Math.max(0, Math.min(state.height, (clientY - rect.top) * (state.height / rect.height))) };
  }

  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    wrap.setPointerCapture(e.pointerId);
    const p = canvasPos(e.clientX, e.clientY);
    if (state.tool === 'smart' || state.tool === 'select' || state.tool === 'brush' || state.tool === 'eraser') {
      beginStroke(p.x, p.y);
    }
  });

  wrap.addEventListener('pointermove', (e) => {
    if (state.painting) {
      const p = canvasPos(e.clientX, e.clientY);
      continueStroke(p.x, p.y);
    }
  });

  function endPointer() {
    state.painting = false;
    renderRegions();
  }

  wrap.addEventListener('pointerup', endPointer);
  wrap.addEventListener('pointercancel', endPointer);
  wrap.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') state.painting = false;
  });
  wrap.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      state.painting = false;
      clearLasso();
    }
  });

  /* ============================================================
     UNDO / REDO / RESET / CLEAR
  ============================================================ */
  function undo() {
    if (!state.undo.length) return;
    state.redo.push(snapshot());
    state.regions = state.undo.pop();
    state.selectedId = state.regions.length ? state.regions[state.regions.length - 1].id : null;
    renderCanvas();
    renderRegions();
    updateCanvasHint();
  }

  function redo() {
    if (!state.redo.length) return;
    state.undo.push(snapshot());
    state.regions = state.redo.pop();
    state.selectedId = state.regions.length ? state.regions[state.regions.length - 1].id : null;
    renderCanvas();
    renderRegions();
    updateCanvasHint();
  }

  function resetAll() {
    if (!state.regions.length) return;
    pushUndo();
    state.regions = [];
    state.selectedId = null;
    renderCanvas();
    renderRegions();
    updateCanvasHint();
  }

  function clearRegion() {
    if (!state.selectedId) { toast('Select a region first.'); return; }
    pushUndo();
    state.regions = state.regions.filter((r) => r.id !== state.selectedId);
    state.selectedId = null;
    renderCanvas();
    renderRegions();
    updateCanvasHint();
  }

  $('#undoBtn').addEventListener('click', undo);
  $('#redoBtn').addEventListener('click', redo);
  $('#resetBtn').addEventListener('click', resetAll);
  $('#clearRegionBtn').addEventListener('click', clearRegion);
  $('#paintAllBtn').addEventListener('click', paintAllWalls);

  /* ============================================================
     REGION LIST
  ============================================================ */
  function renderRegions() {
    const wrapEl = $('#regionsWrap');
    if (state.regions.length === 0) {
      wrapEl.innerHTML = '<p class="region-empty">No regions yet — pick a shade and tap a wall.</p>';
      return;
    }
    wrapEl.innerHTML = '';
    state.regions.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'region-row' + (r.id === state.selectedId ? ' active' : '');
      row.innerHTML =
        '<span class="region-swatch" style="background:' + r.hex + '"></span>' +
        '<div class="region-meta">' +
        '<div class="region-name">' + r.name + '</div>' +
        '<div class="region-code">' + r.code + '</div>' +
        '</div>' +
        '<button class="region-del" title="Remove region">&#10005;</button>';
      row.addEventListener('click', (e) => {
        if (e.target.closest('.region-del')) {
          pushUndo();
          state.regions = state.regions.filter((x) => x.id !== r.id);
          if (state.selectedId === r.id) state.selectedId = null;
          renderCanvas();
          renderRegions();
          updateCanvasHint();
          return;
        }
        state.selectedId = r.id;
        renderRegions();
      });
      wrapEl.appendChild(row);
    });
  }

  /* ============================================================
     SHADE PANEL
  ============================================================ */
  let activeFamily = 'All';

  function renderShades() {
    const grid = $('#shadeGrid');
    const q = $('#shadeSearch').value.trim().toLowerCase();
    const list = SHADES.filter((s) => {
      if (activeFamily !== 'All' && s.f !== activeFamily) return false;
      if (!q) return true;
      return s.n.toLowerCase().includes(q) || s.c.toLowerCase().includes(q);
    });
    grid.innerHTML = list.length
      ? list.map((s) => shadeHTML(s)).join('')
      : '<p class="region-empty">No shades match.</p>';
  }

  function shadeHTML(s) {
    return (
      '<button class="shade-chip' + (state.shade && state.shade.c === s.c ? ' active' : '') + '" data-code="' + s.c + '" type="button">' +
      '<span class="shade-swatch" style="background:' + s.h + '"></span>' +
      '<span class="shade-name">' + s.n + '</span>' +
      '<span class="shade-code">' + s.c + '</span>' +
      '</button>'
    );
  }

  function renderFamilies() {
    const wrapEl = $('#shadeFamilies');
    wrapEl.innerHTML = '';
    ['All'].concat(FAMILIES).forEach((f) => {
      const b = document.createElement('button');
      b.className = 'family-chip' + (activeFamily === f ? ' active' : '');
      b.textContent = f;
      b.type = 'button';
      b.addEventListener('click', () => {
        activeFamily = f;
        renderFamilies();
        renderShades();
      });
      wrapEl.appendChild(b);
    });
  }

  $('#shadeSearch').addEventListener('input', renderShades);
  $('#shadeGrid').addEventListener('click', (e) => {
    const chip = e.target.closest('.shade-chip');
    if (!chip) return;
    const shade = SHADES.find((s) => s.c === chip.dataset.code);
    if (!shade) return;
    selectShade(shade);
  });

  function selectShade(shade) {
    state.shade = shade;
    $('#shadeCurrent').textContent = shade.n + ' · ' + shade.c;
    $('#shadeCurrent').style.background = shade.h;
    $('#shadeCurrent').style.color = shade.h === '#ffffff' ? '#1c1c1c' : '#fff';
    const chip = $('#curShadeChip');
    if (chip) chip.querySelector('i').style.background = shade.h;
    renderShades();
    updateCanvasHint();
    updateAutoUi();
  }

  /* ---------- Search Shades menu ---------- */
  function openShadeSearch() {
    $('#shadeSearchOverlay').classList.add('show');
    $('#shadeSearchModal').classList.add('show');
    $('#shadeSearchModal').style.opacity = 1;
    $('#shadeSearchModal').style.visibility = 'visible';
    $('#shadeSearchInput').value = '';
    renderShadeSearch('');
    setTimeout(() => $('#shadeSearchInput').focus(), 60);
  }

  function closeShadeSearch() {
    $('#shadeSearchOverlay').classList.remove('show');
    $('#shadeSearchModal').classList.remove('show');
    $('#shadeSearchModal').style.opacity = 0;
    $('#shadeSearchModal').style.visibility = 'hidden';
  }

  function renderShadeSearch(q) {
    const grid = $('#shadeSearchResults');
    q = q.trim().toLowerCase();
    const list = q
      ? SHADES.filter((s) => s.n.toLowerCase().includes(q) || s.c.toLowerCase().includes(q)).slice(0, 120)
      : [];
    grid.innerHTML = list.length
      ? list.map((s) =>
          '<button class="ss-tile" data-code="' + s.c + '" type="button">' +
          '<span class="ss-swatch" style="background:' + s.h + '"></span>' +
          '<span class="ss-name">' + s.n + '</span>' +
          '<span class="ss-code">' + s.c + '</span>' +
          '</button>'
        ).join('')
      : '<p class="ss-empty">' + (q ? 'No shades match "' + q + '".' : 'Start typing a shade name or code to see matching colours.') + '</p>';
  }

  $('#openShadeSearchBtn').addEventListener('click', openShadeSearch);
  $('#shadeSearchClose').addEventListener('click', closeShadeSearch);
  $('#shadeSearchOverlay').addEventListener('click', closeShadeSearch);
  $('#shadeSearchInput').addEventListener('input', (e) => renderShadeSearch(e.target.value));
  $('#shadeSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = $('#shadeSearchResults').querySelector('.ss-tile');
      if (first) first.click();
    }
  });
  $('#shadeSearchResults').addEventListener('click', (e) => {
    const tile = e.target.closest('.ss-tile');
    if (!tile) return;
    const shade = SHADES.find((s) => s.c === tile.dataset.code);
    if (!shade) return;
    selectShade(shade);
    closeShadeSearch();
    toast('Shade selected: ' + shade.n + ' · ' + shade.c);
  });

  function updateCanvasHint() {
    const hint = $('#canvasHint');
    if (!hint) return;
    if (state.tool === 'smart') hint.textContent = state.shade ? 'Tap a wall to paint it ' + state.shade.n : 'Pick a shade, then tap a wall';
    else if (state.tool === 'select') hint.textContent = 'Tap dots around the part, then press the check (Finish) below';
    else if (state.tool === 'brush') hint.textContent = 'Drag to paint with the brush';
    else if (state.tool === 'eraser' && state.eraseMode === 'select') hint.textContent = 'Tap dots around the paint to erase, then press the check (Finish) below';
    else hint.textContent = 'Drag to erase paint';
  }

  /* ============================================================
     TOOL BUTTONS
  ============================================================ */
  function updateActionVisibility() {
    const selectBar = $('#selectBar');
    const eraseModes = $('#eraseModes');
    if (selectBar) selectBar.classList.toggle('hidden', !(state.tool === 'select' || (state.tool === 'eraser' && state.eraseMode === 'select')));
    if (eraseModes) eraseModes.classList.toggle('hidden', state.tool !== 'eraser');
  }

  document.querySelectorAll('.tool-btn[data-tool]').forEach((b) => {
    b.addEventListener('click', () => {
      state.tool = b.dataset.tool;
      state.painting = false;
      clearLasso();
      document.querySelectorAll('.tool-btn[data-tool]').forEach((x) => x.classList.toggle('active', x === b));
      updateActionVisibility();
      if (state.tool !== 'smart' && !state.regions.length && !state.shade) {
        toast('Pick a shade first — the brush paints the selected shade.');
      }
      updateCanvasHint();
    });
  });

  $('#eraseBrushMode').addEventListener('click', () => {
    state.eraseMode = 'brush';
    $('#eraseBrushMode').classList.add('active');
    $('#eraseSelectMode').classList.remove('active');
    clearLasso();
    updateActionVisibility();
    updateCanvasHint();
  });

  $('#eraseSelectMode').addEventListener('click', () => {
    state.eraseMode = 'select';
    $('#eraseSelectMode').classList.add('active');
    $('#eraseBrushMode').classList.remove('active');
    clearLasso();
    updateActionVisibility();
    updateCanvasHint();
  });

  $('#finishSelectBtn').addEventListener('click', applySelection);
  $('#undoPointBtn').addEventListener('click', undoSelectPoint);
  $('#clearSelectBtn').addEventListener('click', clearLasso);

  function updateToolButtons() {
    $('#undoBtn').disabled = state.undo.length === 0;
    $('#redoBtn').disabled = state.redo.length === 0;
    $('#resetBtn').disabled = state.regions.length === 0;
    $('#clearRegionBtn').disabled = !state.selectedId;
  }

  /* ============================================================
     UPLOAD WIRING
  ============================================================ */
  const zone = $('#uploadZone');
  const fileInput = $('#fileInput');

  $('#newPhotoBtn').addEventListener('click', () => {
    $('#editorStep').classList.add('hidden');
    $('#uploadStep').classList.remove('hidden');
    state.regions = [];
    state.selectedId = null;
    state.undo = [];
    state.redo = [];
    clearLasso();
    if (lctx) lctx.clearRect(0, 0, state.width, state.height);
    window.scrollTo(0, 0);
  });

  window.addEventListener('resize', () => {
    if (!$('#editorStep').classList.contains('hidden')) fitCanvas();
  });
  zone.addEventListener('click', () => fileInput.click());
  $('#pickBtn').addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('dragover'); })
  );
  zone.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  /* ============================================================
     BEFORE / AFTER COMPARISON
  ============================================================ */
  const compareOverlay = $('#compareOverlay');
  const compareBefore = $('#compareBefore');
  const compareAfter = $('#compareAfter');
  const afterWrap = $('#compareAfterWrap');
  const handle = $('#compareHandle');

  function openCompare() {
    if (!state.image) return;
    compareBefore.width = state.width;
    compareBefore.height = state.height;
    compareAfter.width = state.width;
    compareAfter.height = state.height;
    compareBefore.getContext('2d').putImageData(state.image, 0, 0);
    compareAfter.getContext('2d').drawImage(canvas, 0, 0);
    setComparePos(50);
    compareOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function setComparePos(pct) {
    pct = Math.max(0, Math.min(100, pct));
    handle.style.left = pct + '%';
    afterWrap.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
  }

  $('#compareBtn').addEventListener('click', openCompare);
  $('#compareClose').addEventListener('click', () => {
    compareOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  });
  compareOverlay.addEventListener('click', (e) => {
    if (e.target === compareOverlay) {
      compareOverlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });

  let comparing = false;
  $('#compareImgs').addEventListener('pointerdown', (e) => {
    comparing = true;
    $('#compareImgs').setPointerCapture(e.pointerId);
    const rect = $('#compareImgs').getBoundingClientRect();
    setComparePos(((e.clientX - rect.left) / rect.width) * 100);
  });
  $('#compareImgs').addEventListener('pointermove', (e) => {
    if (!comparing) return;
    const rect = $('#compareImgs').getBoundingClientRect();
    setComparePos(((e.clientX - rect.left) / rect.width) * 100);
  });
  $('#compareImgs').addEventListener('pointerup', () => { comparing = false; });

  /* ============================================================
     DOWNLOAD
  ============================================================ */
  $('#downloadBtn').addEventListener('click', () => {
    if (!state.image) return;
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'paint-design.jpg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/jpeg', 0.92);
  });

  /* ============================================================
     SAVE DESIGN (uses existing auth + backend)
  ============================================================ */
  $('#saveBtn').addEventListener('click', () => {
    if (!state.image) return;
    Auth.requireLogin(doSave);
  });

  async function doSave() {
    const name = prompt('Design name:', 'My Design ' + new Date().toLocaleDateString());
    if (name === null) return;
    const shades = state.regions.map((r) => ({ name: r.name, code: r.code, hex: r.hex }));
    const payload = {
      name: name.trim(),
      original_image: state.originalURL,
      final_image: canvas.toDataURL('image/jpeg', 0.88),
      shades,
      regions: shades,
    };
    try {
      const res = await Auth.apiFetch('/api/designs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { Auth.clear(); toast('Please login again.'); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error || 'Could not save design.'); return; }
      toast('Design saved!');
      loadDesigns();
    } catch (err) {
      toast('Could not save design.');
    }
  }

  /* ============================================================
     MY DESIGNS
  ============================================================ */
  async function loadDesigns() {
    const grid = $('#designsGrid');
    if (!Auth.user()) {
      grid.innerHTML = '<p class="region-empty">Sign in to save and manage your designs.</p>';
      return;
    }
    try {
      const res = await Auth.apiFetch('/api/designs');
      const data = await res.json();
      const designs = (data.designs || []).filter((d) => d.final_image);
      if (!designs.length) {
        grid.innerHTML = '<p class="region-empty">No saved designs yet.</p>';
        return;
      }
      grid.innerHTML = '';
      designs.forEach((d) => {
        const card = document.createElement('div');
        card.className = 'design-card';
        const shadesTxt = (d.shades || []).map((s) => s.name || s.n).join(', ') || '—';
        card.innerHTML =
          '<img class="design-thumb" src="' + d.final_image + '" alt="' + d.name + '" loading="lazy">' +
          '<div class="design-body">' +
          '<h4>' + escapeHTML(d.name) + '</h4>' +
          '<p>' + escapeHTML(shadesTxt) + ' &middot; ' + (d.created_at || '').slice(0, 10) + '</p>' +
          '<div class="design-actions">' +
          '<button class="tool-btn" data-act="view">View</button>' +
          '<button class="tool-btn" data-act="edit">Edit</button>' +
          '<button class="tool-btn" data-act="rename">Rename</button>' +
          '<button class="tool-btn" data-act="del">Delete</button>' +
          '</div></div>';
        card.querySelector('[data-act="view"]').addEventListener('click', () => viewDesign(d));
        card.querySelector('[data-act="edit"]').addEventListener('click', () => editDesign(d));
        card.querySelector('[data-act="rename"]').addEventListener('click', () => renameDesign(d));
        card.querySelector('[data-act="del"]').addEventListener('click', () => deleteDesign(d.id));
        grid.appendChild(card);
      });
    } catch (err) {
      grid.innerHTML = '<p class="region-empty">Could not load designs.</p>';
    }
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function viewDesign(d) {
    $('#viewModalImg').src = d.final_image;
    $('#viewModalCaption').textContent = d.name;
    $('#viewModal').classList.add('open');
    $('#viewModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  $('#viewModalClose').addEventListener('click', () => {
    $('#viewModal').classList.remove('open');
    $('#viewModal').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
  $('#viewModal').addEventListener('click', (e) => {
    if (e.target.id === 'viewModal') {
      $('#viewModal').classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  function editDesign(d) {
    if (d.original_image) {
      loadImageFromDataURL(d.original_image);
      toast('Loaded design — paint it again or continue.');
    } else {
      toast('Original photo not saved for this design.');
    }
  }

  async function renameDesign(d) {
    const name = prompt('New design name:', d.name);
    if (name === null || !name.trim()) return;
    try {
      const res = await Auth.apiFetch('/api/designs/' + d.id, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) { toast('Renamed.'); loadDesigns(); } else toast('Could not rename.');
    } catch (err) { toast('Could not rename.'); }
  }

  async function deleteDesign(id) {
    if (!confirm('Delete this design?')) return;
    try {
      const res = await Auth.apiFetch('/api/designs/' + id, { method: 'DELETE' });
      if (res.ok) { toast('Deleted.'); loadDesigns(); } else toast('Could not delete.');
    } catch (err) { toast('Could not delete.'); }
  }

  /* ============================================================
     PAGE SETUP
  ============================================================ */
  document.getElementById('year').textContent = new Date().getFullYear();

  const navToggle = $('#navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => $('#navLinks').classList.toggle('open'));
    $('#navLinks').querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => $('#navLinks').classList.remove('open'))
    );
  }

  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll);

  renderFamilies();
  renderShades();
  updateToolButtons();
  loadDesigns();
})();