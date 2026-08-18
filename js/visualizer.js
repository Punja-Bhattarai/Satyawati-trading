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
  const SHADES = [
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

  const FAMILIES = ['White', 'Cream', 'Beige', 'Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey', 'Brown'];

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
    shade: null,        // current shade {n,c,h,f}
    undo: [],
    redo: [],
    view: { scale: 1, tx: 0, ty: 0 },
    painting: false,
    paintingRegion: null,
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
      $('#studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateCanvasHint();
      renderRegions();
      updateToolButtons();
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

  function growRegion(data, w, h, sx, sy) {
    const mask = new Uint8Array(w * h);
    const visited = new Uint8Array(w * h);
    const i0 = sy * w + sx;
    const o0 = i0 * 4;
    const sr = data[o0], sg = data[o0 + 1], sb = data[o0 + 2];
    const grad = state.grad;
    const stack = [i0];
    visited[i0] = 1;
    let count = 0;
    let rSum = 0, gSum = 0, bSum = 0;

    while (stack.length) {
      const i = stack.pop();
      const o = i * 4;
      const r = data[o], g = data[o + 1], b = data[o + 2];

      let ok = false;
      if (count === 0) {
        ok = true;
      } else {
        const ar = rSum / count, ag = gSum / count, ab = bSum / count;
        const dAvg = Math.max(Math.abs(r - ar), Math.abs(g - ag), Math.abs(b - ab));
        if (dAvg <= 38) ok = true;
        else {
          const dSeed = Math.max(Math.abs(r - sr), Math.abs(g - sg), Math.abs(b - sb));
          if (dSeed <= 55) ok = true;
        }
        if (grad && grad[i] > 30) {
          const dSeed = Math.max(Math.abs(r - sr), Math.abs(g - sg), Math.abs(b - sb));
          if (dSeed > 28) ok = false;
        }
      }
      if (!ok) continue;

      mask[i] = 255;
      count++;
      rSum += r; gSum += g; bSum += b;

      const x = i % w;
      if (x > 0 && !visited[i - 1]) { visited[i - 1] = 1; stack.push(i - 1); }
      if (x < w - 1 && !visited[i + 1]) { visited[i + 1] = 1; stack.push(i + 1); }
      if (i >= w && !visited[i - w]) { visited[i - w] = 1; stack.push(i - w); }
      if (i < (h - 1) * w && !visited[i + w]) { visited[i + w] = 1; stack.push(i + w); }
    }

    fillGaps(mask, w, h);
    return { mask, count };
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

  function smartPaint(x, y) {
    if (!state.shade) {
      toast('Pick a shade first.');
      return;
    }
    const { mask, count } = growRegion(state.image.data, state.width, state.height, x, y);
    if (count < 60) {
      toast('Could not detect a wall here — try the Brush tool.');
      return;
    }
    pushUndo();
    addRegion(mask, state.shade);
    renderCanvas();
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
          f = Math.max(0.3, Math.min(2.2, f));
          const t = a / 255;
          out[o] = base[o] * (1 - t) + Math.max(0, Math.min(255, color.r * f)) * t;
          out[o + 1] = base[o + 1] * (1 - t) + Math.max(0, Math.min(255, color.g * f)) * t;
          out[o + 2] = base[o + 2] * (1 - t) + Math.max(0, Math.min(255, color.b * f)) * t;
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
    let region = state.regions.find((r) => r.id === state.selectedId);
    if (!region) {
      if (state.tool === 'eraser') {
        toast('Select a painted region to erase from.');
        return;
      }
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

    const size = Number($('#brushSize').value);
    const soft = Number($('#brushSoft').value) / 100;
    const r = Math.max(2, size);
    const x0 = Math.max(0, Math.floor(x - r));
    const y0 = Math.max(0, Math.floor(y - r));
    const x1 = Math.min(state.width - 1, Math.ceil(x + r));
    const y1 = Math.min(state.height - 1, Math.ceil(y + r));
    const erase = state.tool === 'eraser';

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const d = Math.hypot(px - x, py - y);
        if (d > r) continue;
        let fall = 1;
        if (soft > 0) {
          fall = Math.max(0, 1 - (d / r));
          fall = fall * fall * (3 - 2 * fall);
          fall = 0.15 + 0.85 * fall;
        }
        const v = Math.round(255 * fall);
        const i = py * state.width + px;
        if (erase) {
          region.mask[i] = Math.min(region.mask[i], 255 - v);
        } else {
          region.mask[i] = Math.max(region.mask[i], v);
        }
      }
    }
  }

  function beginStroke(x, y) {
    if (state.tool === 'smart') {
      smartPaint(Math.round(x), Math.round(y));
      return;
    }
    if (state.tool === 'select') {
      addSelectPoint(Math.round(x), Math.round(y));
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
    if (!state.shade) {
      toast('Pick a shade first — the selection paints it.');
      return;
    }
    pushUndo();
    addRegion(mask, state.shade);
    renderCanvas();
  }

  /* ============================================================
     POINTER / TOUCH — painting only (photo always fits)
  ============================================================ */
  const wrap = $('#canvasWrap');

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
    state.shade = shade;
    $('#shadeCurrent').textContent = shade.n + ' · ' + shade.c;
    $('#shadeCurrent').style.background = shade.h;
    $('#shadeCurrent').style.color = shade.h === '#ffffff' ? '#1c1c1c' : '#fff';
    renderShades();
    updateCanvasHint();
  });

  function updateCanvasHint() {
    const hint = $('#canvasHint');
    if (!hint) return;
    if (state.tool === 'smart') hint.textContent = state.shade ? 'Tap a wall to paint it ' + state.shade.n : 'Pick a shade, then tap a wall';
    else if (state.tool === 'select') hint.textContent = 'Tap dots around the part, then tap Finish';
    else if (state.tool === 'brush') hint.textContent = 'Drag to paint with the brush';
    else hint.textContent = 'Erase from the selected region';
  }

  /* ============================================================
     TOOL BUTTONS
  ============================================================ */
  document.querySelectorAll('.tool-btn[data-tool]').forEach((b) => {
    b.addEventListener('click', () => {
      state.tool = b.dataset.tool;
      state.painting = false;
      clearLasso();
      document.querySelectorAll('.tool-btn[data-tool]').forEach((x) => x.classList.toggle('active', x === b));
      const selectBar = $('#selectBar');
      if (selectBar) selectBar.classList.toggle('hidden', state.tool !== 'select');
      if (state.tool !== 'smart' && !state.regions.length && !state.shade) {
        toast('Pick a shade first — the brush paints the selected shade.');
      }
      updateCanvasHint();
    });
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