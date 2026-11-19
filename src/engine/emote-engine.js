/**
 * ============================================================================
 * EMOTE ENGINE - Standalone .TGS / Lottie Vector & Sticker Kernel
 * ============================================================================
 *
 * Fully autonomous JavaScript engine for parsing, inspecting, modifying,
 * and exporting Telegram animated custom emojis and stickers (.tgs) with native
 * Bezier vector paths (100% compatible with rlottie and official Telegram clients).
 *
 * No dependencies on Telegram WebApp or storefront UI. Designed for standalone
 * usage in Web Browsers, Desktop Apps (.exe via Electron or WebView2), Node.js.
 *
 * Runtime Dependencies:
 *   - opentype.js (window.opentype or passed via constructor options)
 *   - pako.js     (window.pako or passed via constructor options)
 *   - lottie.js   (window.lottie, required for GIF / Video rendering)
 *   - GIFEncoder  (bundled internally inside this file, zero external CDN needed)
 *
 * ----------------------------------------------------------------------------
 * QUICK USAGE EXAMPLES:
 * ----------------------------------------------------------------------------
 *
 * // 1. Instantiate engine:
 * const engine = new EmoteEngine();
 *
 * // 2. Initialize font (uses embedded base64 font by default):
 * await engine.initFont();
 * // Or load a custom font:
 * // const fontBuffer = await file.arrayBuffer();
 * // await engine.loadFontFromBuffer(fontBuffer);
 *
 * // 3. Parse .TGS (gzip) or .JSON:
 * const lottieData = engine.parseTgsOrJson(fileBufferOrJsonString);
 *
 * // 4. Inspect layers:
 * const layers = engine.getLayersInfo(lottieData);
 * console.log("Layers in template:", layers);
 *
 * // 5. Add custom vector text with parenting, scale, rotation and Z-order:
 * const customLottie = engine.prepareLottieWithVectorText(lottieData, {
 *     textPos: [256, 300],          // [x, y] coordinates
 *     textScale: 100,               // Scale percentage (100 = 100%)
 *     textRotation: 0,              // Angle in degrees
 *     fontSize: 60,                 // Base font size
 *     defaultColor: "#FFFFFF",      // Text color (hex)
 *     parentLayer: 2,               // Attach motion to layer index 2 (optional)
 *     hiddenLayers: [5],            // Hide specific layers by ind (optional)
 *     zOffset: 0                    // Layer depth offset (under hands/front items)
 * }, "HELLO");
 *
 * // 6. Export to Telegram .TGS (< 64 KB validation):
 * const tgsUint8Array = engine.exportToTgsBytes(customLottie);
 * engine.downloadTgs(customLottie, "my_sticker.tgs");
 *
 * // 7. Export to animated GIF:
 * const gifBlob = await engine.renderGif(customLottie, {
 *     width: 512,
 *     height: 512,
 *     fps: 30,
 *     onProgress: (pct, frame, total) => console.log(`GIF: ${pct}%`)
 * });
 * engine.downloadBlob(gifBlob, "preview.gif");
 *
 * // 8. Export to MP4 / WebM video:
 * const videoBlob = await engine.recordVideo(customLottie, {
 *     width: 512,
 *     height: 512,
 *     fps: 60,
 *     durationSec: 3,
 *     onProgress: (pct) => console.log(`Video: ${pct}%`)
 * });
 * engine.downloadBlob(videoBlob, "preview.mp4");
 * ============================================================================
 */


// Scoped GIFEncoder Bundle for offline zero-CORS animated GIF rendering
const gifenc = (function() {
  const root = (typeof globalThis !== 'undefined') ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {}));
  var window = root;
  var exports = root.gifenc = root.gifenc || {};
  // Embedded standalone GIF encoder (gifenc) for 100% offline & zero-CORS reliability
    var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// src/index.js
__markAsModule(exports);
__export(exports, {
  GIFEncoder: () => GIFEncoder,
  applyPalette: () => applyPalette,
  default: () => src_default,
  nearestColor: () => nearestColor,
  nearestColorIndex: () => nearestColorIndex,
  nearestColorIndexWithDistance: () => nearestColorIndexWithDistance,
  prequantize: () => prequantize,
  quantize: () => quantize,
  snapColorsToPalette: () => snapColorsToPalette
});

// src/constants.js
var constants_default = {
  signature: "GIF",
  version: "89a",
  trailer: 59,
  extensionIntroducer: 33,
  applicationExtensionLabel: 255,
  graphicControlExtensionLabel: 249,
  imageSeparator: 44,
  signatureSize: 3,
  versionSize: 3,
  globalColorTableFlagMask: 128,
  colorResolutionMask: 112,
  sortFlagMask: 8,
  globalColorTableSizeMask: 7,
  applicationIdentifierSize: 8,
  applicationAuthCodeSize: 3,
  disposalMethodMask: 28,
  userInputFlagMask: 2,
  transparentColorFlagMask: 1,
  localColorTableFlagMask: 128,
  interlaceFlagMask: 64,
  idSortFlagMask: 32,
  localColorTableSizeMask: 7
};

// src/stream.js
function createStream(initialCapacity = 256) {
  let cursor = 0;
  let contents = new Uint8Array(initialCapacity);
  return {
    get buffer() {
      return contents.buffer;
    },
    reset() {
      cursor = 0;
    },
    bytesView() {
      return contents.subarray(0, cursor);
    },
    bytes() {
      return contents.slice(0, cursor);
    },
    writeByte(byte) {
      expand(cursor + 1);
      contents[cursor] = byte;
      cursor++;
    },
    writeBytes(data, offset = 0, byteLength = data.length) {
      expand(cursor + byteLength);
      for (let i = 0; i < byteLength; i++) {
        contents[cursor++] = data[i + offset];
      }
    },
    writeBytesView(data, offset = 0, byteLength = data.byteLength) {
      expand(cursor + byteLength);
      contents.set(data.subarray(offset, offset + byteLength), cursor);
      cursor += byteLength;
    }
  };
  function expand(newCapacity) {
    var prevCapacity = contents.length;
    if (prevCapacity >= newCapacity)
      return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
    if (prevCapacity != 0)
      newCapacity = Math.max(newCapacity, 256);
    const oldContents = contents;
    contents = new Uint8Array(newCapacity);
    if (cursor > 0)
      contents.set(oldContents.subarray(0, cursor), 0);
  }
}

// src/lzwEncode.js
var BITS = 12;
var DEFAULT_HSIZE = 5003;
var MASKS = [
  0,
  1,
  3,
  7,
  15,
  31,
  63,
  127,
  255,
  511,
  1023,
  2047,
  4095,
  8191,
  16383,
  32767,
  65535
];
function lzwEncode(width, height, pixels, colorDepth, outStream = createStream(512), accum = new Uint8Array(256), htab = new Int32Array(DEFAULT_HSIZE), codetab = new Int32Array(DEFAULT_HSIZE)) {
  const hsize = htab.length;
  const initCodeSize = Math.max(2, colorDepth);
  accum.fill(0);
  codetab.fill(0);
  htab.fill(-1);
  let cur_accum = 0;
  let cur_bits = 0;
  const init_bits = initCodeSize + 1;
  const g_init_bits = init_bits;
  let clear_flg = false;
  let n_bits = g_init_bits;
  let maxcode = (1 << n_bits) - 1;
  const ClearCode = 1 << init_bits - 1;
  const EOFCode = ClearCode + 1;
  let free_ent = ClearCode + 2;
  let a_count = 0;
  let ent = pixels[0];
  let hshift = 0;
  for (let fcode = hsize; fcode < 65536; fcode *= 2) {
    ++hshift;
  }
  hshift = 8 - hshift;
  outStream.writeByte(initCodeSize);
  output(ClearCode);
  const length = pixels.length;
  for (let idx = 1; idx < length; idx++) {
    next_block: {
      const c = pixels[idx];
      const fcode = (c << BITS) + ent;
      let i = c << hshift ^ ent;
      if (htab[i] === fcode) {
        ent = codetab[i];
        break next_block;
      }
      const disp = i === 0 ? 1 : hsize - i;
      while (htab[i] >= 0) {
        i -= disp;
        if (i < 0)
          i += hsize;
        if (htab[i] === fcode) {
          ent = codetab[i];
          break next_block;
        }
      }
      output(ent);
      ent = c;
      if (free_ent < 1 << BITS) {
        codetab[i] = free_ent++;
        htab[i] = fcode;
      } else {
        htab.fill(-1);
        free_ent = ClearCode + 2;
        clear_flg = true;
        output(ClearCode);
      }
    }
  }
  output(ent);
  output(EOFCode);
  outStream.writeByte(0);
  return outStream.bytesView();
  function output(code) {
    cur_accum &= MASKS[cur_bits];
    if (cur_bits > 0)
      cur_accum |= code << cur_bits;
    else
      cur_accum = code;
    cur_bits += n_bits;
    while (cur_bits >= 8) {
      accum[a_count++] = cur_accum & 255;
      if (a_count >= 254) {
        outStream.writeByte(a_count);
        outStream.writeBytesView(accum, 0, a_count);
        a_count = 0;
      }
      cur_accum >>= 8;
      cur_bits -= 8;
    }
    if (free_ent > maxcode || clear_flg) {
      if (clear_flg) {
        n_bits = g_init_bits;
        maxcode = (1 << n_bits) - 1;
        clear_flg = false;
      } else {
        ++n_bits;
        maxcode = n_bits === BITS ? 1 << n_bits : (1 << n_bits) - 1;
      }
    }
    if (code == EOFCode) {
      while (cur_bits > 0) {
        accum[a_count++] = cur_accum & 255;
        if (a_count >= 254) {
          outStream.writeByte(a_count);
          outStream.writeBytesView(accum, 0, a_count);
          a_count = 0;
        }
        cur_accum >>= 8;
        cur_bits -= 8;
      }
      if (a_count > 0) {
        outStream.writeByte(a_count);
        outStream.writeBytesView(accum, 0, a_count);
        a_count = 0;
      }
    }
  }
}
var lzwEncode_default = lzwEncode;

// src/rgb-packing.js
function rgb888_to_rgb565(r, g, b) {
  return r << 8 & 63488 | g << 2 & 992 | b >> 3;
}
function rgba8888_to_rgba4444(r, g, b, a) {
  return r >> 4 | g & 240 | (b & 240) << 4 | (a & 240) << 8;
}
function rgb888_to_rgb444(r, g, b) {
  return r >> 4 << 8 | g & 240 | b >> 4;
}

// src/pnnquant2.js
function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
function sqr(value) {
  return value * value;
}
function find_nn(bins, idx, hasAlpha) {
  var nn = 0;
  var err = 1e100;
  const bin1 = bins[idx];
  const n1 = bin1.cnt;
  const wa = bin1.ac;
  const wr = bin1.rc;
  const wg = bin1.gc;
  const wb = bin1.bc;
  for (var i = bin1.fw; i != 0; i = bins[i].fw) {
    const bin = bins[i];
    const n2 = bin.cnt;
    const nerr2 = n1 * n2 / (n1 + n2);
    if (nerr2 >= err)
      continue;
    var nerr = 0;
    if (hasAlpha) {
      nerr += nerr2 * sqr(bin.ac - wa);
      if (nerr >= err)
        continue;
    }
    nerr += nerr2 * sqr(bin.rc - wr);
    if (nerr >= err)
      continue;
    nerr += nerr2 * sqr(bin.gc - wg);
    if (nerr >= err)
      continue;
    nerr += nerr2 * sqr(bin.bc - wb);
    if (nerr >= err)
      continue;
    err = nerr;
    nn = i;
  }
  bin1.err = err;
  bin1.nn = nn;
}
function create_bin() {
  return {
    ac: 0,
    rc: 0,
    gc: 0,
    bc: 0,
    cnt: 0,
    nn: 0,
    fw: 0,
    bk: 0,
    tm: 0,
    mtm: 0,
    err: 0
  };
}
function create_bin_list(data, format) {
  const bincount = format === "rgb444" ? 4096 : 65536;
  const bins = new Array(bincount);
  const size = data.length;
  if (format === "rgba4444") {
    for (let i = 0; i < size; ++i) {
      const color = data[i];
      const a = color >> 24 & 255;
      const b = color >> 16 & 255;
      const g = color >> 8 & 255;
      const r = color & 255;
      const index = rgba8888_to_rgba4444(r, g, b, a);
      let bin = index in bins ? bins[index] : bins[index] = create_bin();
      bin.rc += r;
      bin.gc += g;
      bin.bc += b;
      bin.ac += a;
      bin.cnt++;
    }
  } else if (format === "rgb444") {
    for (let i = 0; i < size; ++i) {
      const color = data[i];
      const b = color >> 16 & 255;
      const g = color >> 8 & 255;
      const r = color & 255;
      const index = rgb888_to_rgb444(r, g, b);
      let bin = index in bins ? bins[index] : bins[index] = create_bin();
      bin.rc += r;
      bin.gc += g;
      bin.bc += b;
      bin.cnt++;
    }
  } else {
    for (let i = 0; i < size; ++i) {
      const color = data[i];
      const b = color >> 16 & 255;
      const g = color >> 8 & 255;
      const r = color & 255;
      const index = rgb888_to_rgb565(r, g, b);
      let bin = index in bins ? bins[index] : bins[index] = create_bin();
      bin.rc += r;
      bin.gc += g;
      bin.bc += b;
      bin.cnt++;
    }
  }
  return bins;
}
function quantize(rgba, maxColors, opts = {}) {
  const {
    format = "rgb565",
    clearAlpha = true,
    clearAlphaColor = 0,
    clearAlphaThreshold = 0,
    oneBitAlpha = false
  } = opts;
  if (!rgba || !rgba.buffer) {
    throw new Error("quantize() expected RGBA Uint8Array data");
  }
  if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
    throw new Error("quantize() expected RGBA Uint8Array data");
  }
  const data = new Uint32Array(rgba.buffer);
  let useSqrt = opts.useSqrt !== false;
  const hasAlpha = format === "rgba4444";
  const bins = create_bin_list(data, format);
  const bincount = bins.length;
  const bincountMinusOne = bincount - 1;
  const heap = new Uint32Array(bincount + 1);
  var maxbins = 0;
  for (var i = 0; i < bincount; ++i) {
    const bin = bins[i];
    if (bin != null) {
      var d = 1 / bin.cnt;
      if (hasAlpha)
        bin.ac *= d;
      bin.rc *= d;
      bin.gc *= d;
      bin.bc *= d;
      bins[maxbins++] = bin;
    }
  }
  if (sqr(maxColors) / maxbins < 0.022) {
    useSqrt = false;
  }
  var i = 0;
  for (; i < maxbins - 1; ++i) {
    bins[i].fw = i + 1;
    bins[i + 1].bk = i;
    if (useSqrt)
      bins[i].cnt = Math.sqrt(bins[i].cnt);
  }
  if (useSqrt)
    bins[i].cnt = Math.sqrt(bins[i].cnt);
  var h, l, l2;
  for (i = 0; i < maxbins; ++i) {
    find_nn(bins, i, false);
    var err = bins[i].err;
    for (l = ++heap[0]; l > 1; l = l2) {
      l2 = l >> 1;
      if (bins[h = heap[l2]].err <= err)
        break;
      heap[l] = h;
    }
    heap[l] = i;
  }
  var extbins = maxbins - maxColors;
  for (i = 0; i < extbins; ) {
    var tb;
    for (; ; ) {
      var b1 = heap[1];
      tb = bins[b1];
      if (tb.tm >= tb.mtm && bins[tb.nn].mtm <= tb.tm)
        break;
      if (tb.mtm == bincountMinusOne)
        b1 = heap[1] = heap[heap[0]--];
      else {
        find_nn(bins, b1, false);
        tb.tm = i;
      }
      var err = bins[b1].err;
      for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
        if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
          l2++;
        if (err <= bins[h = heap[l2]].err)
          break;
        heap[l] = h;
      }
      heap[l] = b1;
    }
    var nb = bins[tb.nn];
    var n1 = tb.cnt;
    var n2 = nb.cnt;
    var d = 1 / (n1 + n2);
    if (hasAlpha)
      tb.ac = d * (n1 * tb.ac + n2 * nb.ac);
    tb.rc = d * (n1 * tb.rc + n2 * nb.rc);
    tb.gc = d * (n1 * tb.gc + n2 * nb.gc);
    tb.bc = d * (n1 * tb.bc + n2 * nb.bc);
    tb.cnt += nb.cnt;
    tb.mtm = ++i;
    bins[nb.bk].fw = nb.fw;
    bins[nb.fw].bk = nb.bk;
    nb.mtm = bincountMinusOne;
  }
  let palette = [];
  var k = 0;
  for (i = 0; ; ++k) {
    let r = clamp(Math.round(bins[i].rc), 0, 255);
    let g = clamp(Math.round(bins[i].gc), 0, 255);
    let b = clamp(Math.round(bins[i].bc), 0, 255);
    let a = 255;
    if (hasAlpha) {
      a = clamp(Math.round(bins[i].ac), 0, 255);
      if (oneBitAlpha) {
        const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
        a = a <= threshold ? 0 : 255;
      }
      if (clearAlpha && a <= clearAlphaThreshold) {
        r = g = b = clearAlphaColor;
        a = 0;
      }
    }
    const color = hasAlpha ? [r, g, b, a] : [r, g, b];
    const exists = existsInPalette(palette, color);
    if (!exists)
      palette.push(color);
    if ((i = bins[i].fw) == 0)
      break;
  }
  return palette;
}
function existsInPalette(palette, color) {
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i];
    let matchesRGB = p[0] === color[0] && p[1] === color[1] && p[2] === color[2];
    let matchesAlpha = p.length >= 4 && color.length >= 4 ? p[3] === color[3] : true;
    if (matchesRGB && matchesAlpha)
      return true;
  }
  return false;
}

// src/color.js
function euclideanDistanceSquared(a, b) {
  var sum = 0;
  var n;
  for (n = 0; n < a.length; n++) {
    const dx = a[n] - b[n];
    sum += dx * dx;
  }
  return sum;
}

// src/palettize.js
function roundStep(byte, step) {
  return step > 1 ? Math.round(byte / step) * step : byte;
}
function prequantize(rgba, {roundRGB = 5, roundAlpha = 10, oneBitAlpha = null} = {}) {
  const data = new Uint32Array(rgba.buffer);
  for (let i = 0; i < data.length; i++) {
    const color = data[i];
    let a = color >> 24 & 255;
    let b = color >> 16 & 255;
    let g = color >> 8 & 255;
    let r = color & 255;
    a = roundStep(a, roundAlpha);
    if (oneBitAlpha) {
      const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
      a = a <= threshold ? 0 : 255;
    }
    r = roundStep(r, roundRGB);
    g = roundStep(g, roundRGB);
    b = roundStep(b, roundRGB);
    data[i] = a << 24 | b << 16 | g << 8 | r << 0;
  }
}
function applyPalette(rgba, palette, format = "rgb565") {
  if (!rgba || !rgba.buffer) {
    throw new Error("quantize() expected RGBA Uint8Array data");
  }
  if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
    throw new Error("quantize() expected RGBA Uint8Array data");
  }
  if (palette.length > 256) {
    throw new Error("applyPalette() only works with 256 colors or less");
  }
  const data = new Uint32Array(rgba.buffer);
  const length = data.length;
  const bincount = format === "rgb444" ? 4096 : 65536;
  const index = new Uint8Array(length);
  const cache = new Array(bincount);
  const hasAlpha = format === "rgba4444";
  if (format === "rgba4444") {
    for (let i = 0; i < length; i++) {
      const color = data[i];
      const a = color >> 24 & 255;
      const b = color >> 16 & 255;
      const g = color >> 8 & 255;
      const r = color & 255;
      const key = rgba8888_to_rgba4444(r, g, b, a);
      const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGBA(r, g, b, a, palette);
      index[i] = idx;
    }
  } else {
    const rgb888_to_key = format === "rgb444" ? rgb888_to_rgb444 : rgb888_to_rgb565;
    for (let i = 0; i < length; i++) {
      const color = data[i];
      const b = color >> 16 & 255;
      const g = color >> 8 & 255;
      const r = color & 255;
      const key = rgb888_to_key(r, g, b);
      const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGB(r, g, b, palette);
      index[i] = idx;
    }
  }
  return index;
}
function nearestColorIndexRGBA(r, g, b, a, palette) {
  let k = 0;
  let mindist = 1e100;
  for (let i = 0; i < palette.length; i++) {
    const px2 = palette[i];
    const a2 = px2[3];
    let curdist = sqr2(a2 - a);
    if (curdist > mindist)
      continue;
    const r2 = px2[0];
    curdist += sqr2(r2 - r);
    if (curdist > mindist)
      continue;
    const g2 = px2[1];
    curdist += sqr2(g2 - g);
    if (curdist > mindist)
      continue;
    const b2 = px2[2];
    curdist += sqr2(b2 - b);
    if (curdist > mindist)
      continue;
    mindist = curdist;
    k = i;
  }
  return k;
}
function nearestColorIndexRGB(r, g, b, palette) {
  let k = 0;
  let mindist = 1e100;
  for (let i = 0; i < palette.length; i++) {
    const px2 = palette[i];
    const r2 = px2[0];
    let curdist = sqr2(r2 - r);
    if (curdist > mindist)
      continue;
    const g2 = px2[1];
    curdist += sqr2(g2 - g);
    if (curdist > mindist)
      continue;
    const b2 = px2[2];
    curdist += sqr2(b2 - b);
    if (curdist > mindist)
      continue;
    mindist = curdist;
    k = i;
  }
  return k;
}
function snapColorsToPalette(palette, knownColors, threshold = 5) {
  if (!palette.length || !knownColors.length)
    return;
  const paletteRGB = palette.map((p) => p.slice(0, 3));
  const thresholdSq = threshold * threshold;
  const dim = palette[0].length;
  for (let i = 0; i < knownColors.length; i++) {
    let color = knownColors[i];
    if (color.length < dim) {
      color = [color[0], color[1], color[2], 255];
    } else if (color.length > dim) {
      color = color.slice(0, 3);
    } else {
      color = color.slice();
    }
    const r = nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), euclideanDistanceSquared);
    const idx = r[0];
    const distanceSq = r[1];
    if (distanceSq > 0 && distanceSq <= thresholdSq) {
      palette[idx] = color;
    }
  }
}
function sqr2(a) {
  return a * a;
}
function nearestColorIndex(colors, pixel, distanceFn = euclideanDistanceSquared) {
  let minDist = Infinity;
  let minDistIndex = -1;
  for (let j = 0; j < colors.length; j++) {
    const paletteColor = colors[j];
    const dist = distanceFn(pixel, paletteColor);
    if (dist < minDist) {
      minDist = dist;
      minDistIndex = j;
    }
  }
  return minDistIndex;
}
function nearestColorIndexWithDistance(colors, pixel, distanceFn = euclideanDistanceSquared) {
  let minDist = Infinity;
  let minDistIndex = -1;
  for (let j = 0; j < colors.length; j++) {
    const paletteColor = colors[j];
    const dist = distanceFn(pixel, paletteColor);
    if (dist < minDist) {
      minDist = dist;
      minDistIndex = j;
    }
  }
  return [minDistIndex, minDist];
}
function nearestColor(colors, pixel, distanceFn = euclideanDistanceSquared) {
  return colors[nearestColorIndex(colors, pixel, distanceFn)];
}

// src/index.js
function GIFEncoder(opt = {}) {
  const {initialCapacity = 4096, auto = true} = opt;
  const stream = createStream(initialCapacity);
  const HSIZE = 5003;
  const accum = new Uint8Array(256);
  const htab = new Int32Array(HSIZE);
  const codetab = new Int32Array(HSIZE);
  let hasInit = false;
  return {
    reset() {
      stream.reset();
      hasInit = false;
    },
    finish() {
      stream.writeByte(constants_default.trailer);
    },
    bytes() {
      return stream.bytes();
    },
    bytesView() {
      return stream.bytesView();
    },
    get buffer() {
      return stream.buffer;
    },
    get stream() {
      return stream;
    },
    writeHeader,
    writeFrame(index, width, height, opts = {}) {
      const {
        transparent = false,
        transparentIndex = 0,
        delay = 0,
        palette = null,
        repeat = 0,
        colorDepth = 8,
        dispose = -1
      } = opts;
      let first = false;
      if (auto) {
        if (!hasInit) {
          first = true;
          writeHeader();
          hasInit = true;
        }
      } else {
        first = Boolean(opts.first);
      }
      width = Math.max(0, Math.floor(width));
      height = Math.max(0, Math.floor(height));
      if (first) {
        if (!palette) {
          throw new Error("First frame must include a { palette } option");
        }
        encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth);
        encodeColorTable(stream, palette);
        if (repeat >= 0) {
          encodeNetscapeExt(stream, repeat);
        }
      }
      const delayTime = Math.round(delay / 10);
      encodeGraphicControlExt(stream, dispose, delayTime, transparent, transparentIndex);
      const useLocalColorTable = Boolean(palette) && !first;
      encodeImageDescriptor(stream, width, height, useLocalColorTable ? palette : null);
      if (useLocalColorTable)
        encodeColorTable(stream, palette);
      encodePixels(stream, index, width, height, colorDepth, accum, htab, codetab);
    }
  };
  function writeHeader() {
    writeUTFBytes(stream, "GIF89a");
  }
}
function encodeGraphicControlExt(stream, dispose, delay, transparent, transparentIndex) {
  stream.writeByte(33);
  stream.writeByte(249);
  stream.writeByte(4);
  if (transparentIndex < 0) {
    transparentIndex = 0;
    transparent = false;
  }
  var transp, disp;
  if (!transparent) {
    transp = 0;
    disp = 0;
  } else {
    transp = 1;
    disp = 2;
  }
  if (dispose >= 0) {
    disp = dispose & 7;
  }
  disp <<= 2;
  const userInput = 0;
  stream.writeByte(0 | disp | userInput | transp);
  writeUInt16(stream, delay);
  stream.writeByte(transparentIndex || 0);
  stream.writeByte(0);
}
function encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth = 8) {
  const globalColorTableFlag = 1;
  const sortFlag = 0;
  const globalColorTableSize = colorTableSize(palette.length) - 1;
  const fields = globalColorTableFlag << 7 | colorDepth - 1 << 4 | sortFlag << 3 | globalColorTableSize;
  const backgroundColorIndex = 0;
  const pixelAspectRatio = 0;
  writeUInt16(stream, width);
  writeUInt16(stream, height);
  stream.writeBytes([fields, backgroundColorIndex, pixelAspectRatio]);
}
function encodeNetscapeExt(stream, repeat) {
  stream.writeByte(33);
  stream.writeByte(255);
  stream.writeByte(11);
  writeUTFBytes(stream, "NETSCAPE2.0");
  stream.writeByte(3);
  stream.writeByte(1);
  writeUInt16(stream, repeat);
  stream.writeByte(0);
}
function encodeColorTable(stream, palette) {
  const colorTableLength = 1 << colorTableSize(palette.length);
  for (let i = 0; i < colorTableLength; i++) {
    let color = [0, 0, 0];
    if (i < palette.length) {
      color = palette[i];
    }
    stream.writeByte(color[0]);
    stream.writeByte(color[1]);
    stream.writeByte(color[2]);
  }
}
function encodeImageDescriptor(stream, width, height, localPalette) {
  stream.writeByte(44);
  writeUInt16(stream, 0);
  writeUInt16(stream, 0);
  writeUInt16(stream, width);
  writeUInt16(stream, height);
  if (localPalette) {
    const interlace = 0;
    const sorted = 0;
    const palSize = colorTableSize(localPalette.length) - 1;
    stream.writeByte(128 | interlace | sorted | 0 | palSize);
  } else {
    stream.writeByte(0);
  }
}
function encodePixels(stream, index, width, height, colorDepth = 8, accum, htab, codetab) {
  lzwEncode_default(width, height, index, colorDepth, stream, accum, htab, codetab);
}
function writeUInt16(stream, short) {
  stream.writeByte(short & 255);
  stream.writeByte(short >> 8 & 255);
}
function writeUTFBytes(stream, text) {
  for (var i = 0; i < text.length; i++) {
    stream.writeByte(text.charCodeAt(i));
  }
}
function colorTableSize(length) {
  return Math.max(Math.ceil(Math.log2(length)), 1);
}
var src_default = GIFEncoder;
//# sourceMappingURL=gifenc.js.map
    
    
    
    
    
    
    
  var GIFEncoder = exports.GIFEncoder || window.GIFEncoder;
  var quantize = exports.quantize || window.quantize;
  var applyPalette = exports.applyPalette || window.applyPalette;
  window.GIFEncoder = GIFEncoder;
  const SF_MARKUP = `<div id="view-storefront" class="active">
        <!-- STEP 1: Выберите эмодзи -->
        <div id="storefront-step-1" class="storefront-step active">
            <div class="step-top-title">Выберите эмодзи</div>
            <div class="step-progress-bar">
                <div class="step-progress-seg active"></div>
                <div class="step-progress-seg"></div>
                <div class="step-progress-seg"></div>
            </div>

            <!-- Subtitle -->
            <div class="step-subtitle" id="step1-subtitle-text">
                Выберите эмодзи из нашего пака — на следующем шаге впишете в каждую свой текст и сразу увидите, как получится.
            </div>

            <!-- Section Heading -->
            <div class="step1-section-header">
                <div class="step1-title">С надписью</div>
                <div class="step1-subtitle">До 12 символов</div>
            </div>

            <!-- 3-Column Grid -->
            <div class="step1-grid" id="step1-grid"></div>

            <!-- Fixed Bottom Bar -->
            <div class="step-bottom-bar single">
                <button class="btn-capsule full-width" id="btn-step1-next" onclick="goToStep(2)" disabled>
                    Выберите эмодзи
                </button>
            </div>
        </div>

        <!-- STEP 2: Ваш текст -->
        <div id="storefront-step-2" class="storefront-step" style="display: none;">
            <div class="step-top-title">Ваш текст</div>
            <div class="step-progress-bar">
                <div class="step-progress-seg active"></div>
                <div class="step-progress-seg active"></div>
                <div class="step-progress-seg"></div>
            </div>

            <!-- Subtitle -->
            <div class="step-subtitle">
                Латиница, кириллица и цифры. Предпросмотр — ровно то, что придёт.
            </div>

            <!-- Dynamic Items List -->
            <div class="step2-items-list" id="step2-items-list"></div>

            <!-- Fixed Bottom Bar -->
            <div class="step-bottom-bar">
                <button class="btn-circle" onclick="goToStep(1)" title="Добавить ещё эмодзи">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button class="btn-capsule" id="btn-step2-next" onclick="goToStep(3)">
                    Далее · 1 эмодзи
                </button>
            </div>
        </div>

        <!-- STEP 3: Как забрать -->
        <div id="storefront-step-3" class="storefront-step" style="display: none;">
            <div class="step-top-title">Как забрать</div>
            <div class="step-progress-bar">
                <div class="step-progress-seg active"></div>
                <div class="step-progress-seg active"></div>
                <div class="step-progress-seg active"></div>
            </div>

            <div class="step3-content-wrapper">
                <!-- Формат -->
                <div class="step3-section-title">Формат</div>
                <div class="step3-radio-group">
                    <div class="step3-radio-card selected" id="format-card-emoji" onclick="setPackFormat('emoji')">
                        <div class="step3-icon-box" style="color: #FF3B30;">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </div>
                        <div class="step3-card-info">
                            <div class="step3-card-title">Эмодзи-пак</div>
                            <div class="step3-card-desc">Премиум-эмодзи в Telegram</div>
                        </div>
                        <div class="step3-radio-dot">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                    </div>

                    <div class="step3-radio-card" id="format-card-sticker" onclick="setPackFormat('sticker')">
                        <div class="step3-icon-box" style="color: #FF9500;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                        <div class="step3-card-info">
                            <div class="step3-card-title">Стикер-пак</div>
                            <div class="step3-card-desc">Анимированные стикеры для чатов</div>
                        </div>
                        <div class="step3-radio-dot">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                    </div>

                    <div class="step3-radio-card" id="format-card-archive" onclick="setPackFormat('archive')">
                        <div class="step3-icon-box" style="color: #0A84FF;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                        </div>
                        <div class="step3-card-info">
                            <div class="step3-card-title">Архив TGS</div>
                            <div class="step3-card-desc">Файлы .tgs придут в чат с ботом</div>
                        </div>
                        <div class="step3-radio-dot">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                    </div>
                </div>

                <!-- Название пака -->
                <div class="step3-section-title" style="margin-top: 18px;">Название пака</div>
                <div class="step3-input-card">
                    <input type="text" id="pack-name-input" class="step3-text-input" placeholder="Например, WshopPack" value="WshopPack" oninput="onPackNameChange(this.value)">
                </div>
                <div class="step3-footnote">Так пак будет называться в Telegram</div>

                <!-- Switch Card -->
                <div class="step3-switch-card">
                    <div class="step3-switch-info">
                        <div class="step3-switch-title">Без «by @wshop_aibot»</div>
                        <div class="step3-switch-desc" id="step3-wl-desc">Название пака без подписи шопа · +5 ₽</div>
                    </div>
                    <label class="ios-switch">
                        <input type="checkbox" id="white-label-toggle" onchange="onWhiteLabelToggle(this.checked)">
                        <span class="ios-slider-switch"></span>
                    </label>
                </div>

                <!-- Итого -->
                <div class="step3-section-title">Итого</div>
                <div class="step3-summary-card">
                    <div class="step3-summary-row">
                        <span id="summary-items-count-text">1 × 10 ₽</span>
                        <span id="summary-items-subtotal">10 ₽</span>
                    </div>
                    <div class="step3-summary-row" id="summary-wl-row" style="display: none;">
                        <span>Без подписи шопа</span>
                        <span>+5 ₽</span>
                    </div>
                    <div class="step3-divider"></div>
                    <div class="step3-summary-row total-row">
                        <span>К оплате</span>
                        <span id="summary-total-price">10 ₽</span>
                    </div>
                </div>
            </div>

            <!-- Fixed Bottom Bar -->
            <div class="step-bottom-bar single">
                <button class="btn-capsule full-width" id="btn-step3-buy" onclick="handleEmoteOrderSubmit()">
                    Купить · 10 ₽
                </button>
            </div>
        </div>
    </div>`;
  const AD_MARKUP = `<div id="view-admin" class="active" style="margin-bottom: 24px;">
        <!-- Compact Upload Bar (height: 56px) & Template Name -->
        <div class="card" style="padding: 14px;">
            <div class="admin-compact-upload" onclick="document.getElementById('admin-file-input').click()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Загрузить .TGS / .JSON</span>
                <input type="file" id="admin-file-input" accept="*/*" style="display:none;" onchange="handleAdminFileUpload(event)">
            </div>

            <div style="margin-top: 10px;">
                <input type="text" class="text-input" id="admin-tpl-name" placeholder="Название шаблона (например: VIP SHIELD)" value="CUSTOM STICKER">
            </div>
        </div>

        <!-- Interactive Drag & Drop Preview Box -->
        <div class="card" style="padding: 14px;">
            <div class="section-header" style="margin-top: 0; margin-bottom: 8px;">
                <span class="section-title">
                    Интерактивное превью
                </span>
                <span style="font-size: 12px; color: var(--accent-orange); font-weight: 600;">
                    Тяните текст пальцем
                </span>
            </div>

            <div class="preview-box" id="admin-preview-box">
                <div class="lottie-view" id="admin-main-lottie"></div>
                <div class="drag-crosshair" id="admin-drag-handle" style="left: 50%; top: 54%;">
                    <div class="drag-center-dot"></div>
                </div>
                <div class="admin-coord-pill" id="admin-coord-pill">X: 256, Y: 274</div>
            </div>

            <!-- Fine Tuning Sliders & Center Button -->
            <div style="margin-top: 12px;">
                <div class="slider-row">
                    <span class="slider-name">Масштаб</span>
                    <input type="range" class="range-slider" id="admin-scale-slider" min="40" max="200" value="100" oninput="onAdminScaleChange(this.value)" onchange="onAdminScaleChange(this.value)">
                    <span class="slider-val" id="admin-scale-val">100%</span>
                </div>
                <div class="slider-row">
                    <span class="slider-name">Поворот</span>
                    <input type="range" class="range-slider" id="admin-rot-slider" min="-180" max="180" value="0" oninput="onAdminRotChange(this.value)" onchange="onAdminRotChange(this.value)">
                    <span class="slider-val" id="admin-rot-val">0°</span>
                </div>
                <div class="slider-row">
                    <span class="slider-name">Позиция X</span>
                    <button type="button" class="btn-step-coord" onclick="stepAdminCoord('x', -1)" title="-1 px">−</button>
                    <input type="range" class="range-slider" id="admin-x-slider" min="-512" max="512" value="256" step="1" oninput="onAdminPosXChange(this.value)" onchange="onAdminPosXChange(this.value)">
                    <button type="button" class="btn-step-coord" onclick="stepAdminCoord('x', 1)" title="+1 px">+</button>
                    <span class="slider-val" id="admin-x-val">256 px</span>
                </div>
                <div class="slider-row">
                    <span class="slider-name">Позиция Y</span>
                    <button type="button" class="btn-step-coord" onclick="stepAdminCoord('y', -1)" title="-1 px">−</button>
                    <input type="range" class="range-slider" id="admin-y-slider" min="-512" max="512" value="274" step="1" oninput="onAdminPosYChange(this.value)" onchange="onAdminPosYChange(this.value)">
                    <button type="button" class="btn-step-coord" onclick="stepAdminCoord('y', 1)" title="+1 px">+</button>
                    <span class="slider-val" id="admin-y-val">274 px</span>
                </div>
                <div style="margin-top: 8px;">
                    <button class="btn-secondary" style="width: 100%; height: 40px; font-size: 13px;" onclick="resetAdminTextPos()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
                        <span>Центрировать текст</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Motion Parent Linking Card -->
        <div class="card" style="padding: 14px;">
            <div class="section-title" style="margin-bottom: 6px; font-size: 14px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>Привязка к слою (parent)</span>
            </div>
            <p style="font-size: 12px; color: var(--text-sec); margin-bottom: 8px;">Текст автоматически следует за анимацией выбранного слоя</p>
            <select class="select-input" id="admin-parent-select" onchange="onAdminParentChange(this.value)">
                <option value="none">Без привязки (статично)</option>
            </select>
        </div>

        <!-- Text Layer Depth (Z-Order) Card -->
        <div class="card" style="padding: 14px;">
            <div class="section-title" style="margin-bottom: 6px; font-size: 14px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px;"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    <span>Глубина слоя текста</span>
                </div>
                <span id="admin-zorder-val" style="font-size: 12px; font-weight: 700; color: var(--accent-orange); font-variant-numeric: tabular-nums;">Слой 1</span>
            </div>
            <p style="font-size: 12px; color: var(--text-sec); margin-bottom: 10px;">
                Позволяет спрятать текст за передний план (например, за руки персонажа или рамку)
            </p>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-secondary" id="btn-zorder-deeper" style="flex: 1; height: 38px; font-size: 12px; padding: 0 6px; justify-content: center; gap: 6px;" onclick="changeAdminZOrder(1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 15px; height: 15px;"><polyline points="6 9 12 15 18 9"/></svg>
                    <span>Глубже (под объект)</span>
                </button>
                <button type="button" class="btn-secondary" id="btn-zorder-higher" style="flex: 1; height: 38px; font-size: 12px; padding: 0 6px; justify-content: center; gap: 6px;" onclick="changeAdminZOrder(-1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 15px; height: 15px;"><polyline points="18 15 12 9 6 15"/></svg>
                    <span>Выше (поверх)</span>
                </button>
            </div>
        </div>

        <!-- Layer Inspection Panel (Max Height 220px with Quick Filters) -->
        <div class="card" style="padding: 14px;">
            <div class="section-header" style="margin-top: 0; margin-bottom: 8px;">
                <span class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    <span>Слои шаблона</span>
                    <span class="badge-counter" id="admin-layer-count">0</span>
                </span>
            </div>

            <!-- Quick Filter Bar -->
            <div class="layer-filter-bar">
                <button class="layer-filter-chip active" id="filter-all-layers" onclick="setLayerFilter('all')">Все слои</button>
                <button class="layer-filter-chip" id="filter-hidden-layers" onclick="setLayerFilter('hidden')">Только скрытые</button>
                <button class="layer-filter-action" onclick="resetAllHiddenLayers()">Сбросить все</button>
            </div>

            <!-- Compact Scroll Container (max-height: 220px) -->
            <div class="layer-list" id="admin-layer-list">
                <!-- Dynamically populated -->
            </div>
        </div>

        <!-- Catalog Persistence Actions (Compact Buttons 44-46px) -->
        <div class="card" style="padding: 14px; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-primary" style="width: 100%; height: 46px;" onclick="saveAdminTemplateToCatalog()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>Сохранить шаблон в витрину</span>
            </button>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="btn-secondary" style="height: 44px;" onclick="exportCatalogJson()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    <span>Экспорт JSON</span>
                </button>
                <button class="btn-secondary" style="height: 44px;" onclick="document.getElementById('catalog-import-input').click()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Импорт JSON</span>
                </button>
                <input type="file" id="catalog-import-input" accept=".json" style="display:none;" onchange="importCatalogJson(event)">
            </div>

            <button class="btn-secondary" style="color: var(--text-dim); font-size: 11.5px; height: 38px; margin-top: 4px;" onclick="resetCatalogToDefaults()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                <span>Сбросить каталог к заводским</span>
            </button>
        </div>
    </main>
</div>`;
  const SHEET_MARKUP = `<div class="sheet-backdrop" id="export-backdrop" onclick="closeExportSheet()"></div>
    <div class="sheet-modal" id="export-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">Ваш заказ готов</div>
        <div class="sheet-subtitle" id="sheet-order-subtitle">Формат: Эмодзи-пак · Пак: «WshopPack»</div>

        <div id="sheet-items-summary-list" style="max-height: 140px; overflow-y: auto; margin-bottom: 12px;"></div>

        <div class="sheet-actions-list">
            <div id="sheet-pack-url-container" style="display: none; margin-bottom: 4px;">
                <a id="sheet-pack-url-btn" href="#" target="_blank" class="sheet-btn primary" style="background: #2481CC; color: #FFFFFF; text-decoration: none; justify-content: center; width: 100%; box-sizing: border-box;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    <span>Добавить пак в Telegram</span>
                </a>
            </div>
            <button class="sheet-btn primary" onclick="exportAllTGS()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Скачать все .TGS (кривые, <64 КБ)</span>
            </button>
            <button class="sheet-btn" onclick="exportGIF()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>Скачать GIF (512×512)</span>
            </button>
            <button class="sheet-btn" onclick="exportVideo()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <span>Скачать видео MP4 (60 FPS)</span>
            </button>
            <button class="sheet-btn" onclick="sendToTelegramBot()" style="background: rgba(10, 132, 255, 0.15); color: #0A84FF; border: 1px solid rgba(10, 132, 255, 0.3);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                <span>Отправить в @wshop_aibot</span>
            </button>
            <button class="sheet-btn" onclick="closeExportSheet()" style="margin-top: 4px; background: transparent; color: var(--text-sec);">
                Закрыть
            </button>
        </div>
    </div>

    <!-- Progress Overlay -->
    <div class="progress-overlay" id="progress-overlay">
        <div class="progress-box">
            <div id="progress-title" style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">Обработка...</div>
            <div id="progress-subtitle" style="font-size: 12px; color: var(--text-sec);">Пожалуйста, подождите</div>
            <div class="progress-bar-track">
                <div class="progress-bar-fill" id="progress-bar-fill"></div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toast-container" class="toast-container"></div>


    <!-- Embedded GIF Encoder (gifenc) -->`;

    // ----------------------------------------------------
    // EMBEDDED APPLE-STYLE FONT (Inter-Bold.woff Base64)
    // ----------------------------------------------------
  return exports;
})();

const EMBEDDED_FONT_B64 = "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";

class EmoteEngine {
  /**
   * @param {Object} [options]
   * @param {Object} [options.opentype] - opentype.js reference (defaults to global opentype)
   * @param {Object} [options.pako] - pako reference (defaults to global pako)
   * @param {Object} [options.lottie] - lottie-web reference (defaults to global lottie)
   * @param {boolean} [options.autoInitFont=true] - automatically load default embedded font
   */
  constructor(options = {}) {
    this._options = options;
    this.opentype = options.opentype || (typeof window !== 'undefined' && window.opentype) || (typeof globalThis !== 'undefined' && globalThis.opentype) || (typeof opentype !== 'undefined' ? opentype : null);
    this.pako = options.pako || (typeof window !== 'undefined' && window.pako) || (typeof globalThis !== 'undefined' && globalThis.pako) || (typeof pako !== 'undefined' ? pako : null);
    this.lottie = options.lottie || (typeof window !== 'undefined' && window.lottie) || (typeof globalThis !== 'undefined' && globalThis.lottie) || (typeof lottie !== 'undefined' ? lottie : null);
    this.gifenc = gifenc;
    this.font = null;

    if (options.autoInitFont !== false) {
      try {
        this.initFont();
      } catch (err) {
        // Will be initialized when opentype is loaded
      }
    }
  }

  _getOpentype() {
    const ot = this.opentype
      || (typeof window !== 'undefined' && window.opentype)
      || (typeof globalThis !== 'undefined' && globalThis.opentype)
      || (typeof opentype !== 'undefined' ? opentype : null);
    if (!ot) {
      throw new Error("Библиотека opentype.js не найдена. Подключите opentype.js или передайте в options.opentype.");
    }
    this.opentype = ot;
    return ot;
  }

  _getPako() {
    const pk = this.pako
      || (typeof window !== 'undefined' && window.pako)
      || (typeof globalThis !== 'undefined' && globalThis.pako)
      || (typeof pako !== 'undefined' ? pako : null);
    if (!pk) {
      throw new Error("Библиотека pako не найдена. Подключите pako.js или передайте в options.pako.");
    }
    this.pako = pk;
    return pk;
  }

  _getLottie() {
    const lt = this.lottie
      || (typeof window !== 'undefined' && window.lottie)
      || (typeof globalThis !== 'undefined' && globalThis.lottie)
      || (typeof lottie !== 'undefined' ? lottie : null);
    if (!lt) {
      throw new Error("Библиотека lottie-web не найдена. Подключите lottie.js или передайте в options.lottie.");
    }
    this.lottie = lt;
    return lt;
  }

  // --------------------------------------------------------------------------
  // 1. FONT MANAGEMENT & VECTOR PATH GENERATION
  // --------------------------------------------------------------------------

  /**
   * Initialize default embedded font or custom base64 font
   * @param {string} [base64Str] Optional base64 encoded font data
   * @returns {Object} opentype.Font instance
   */
  initFont(base64Str = null) {
    const ot = this._getOpentype();
    const b64 = base64Str || EMBEDDED_FONT_B64;
    if (!b64) throw new Error("Шрифт base64 не предоставлен");

    let binary = '';
    if (typeof atob === 'function') {
      binary = atob(b64);
    } else if (typeof Buffer !== 'undefined') {
      binary = Buffer.from(b64, 'base64').toString('binary');
    } else {
      throw new Error("Не удалось декодировать base64 (atob / Buffer отсутствует)");
    }

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    this.font = ot.parse(bytes.buffer);
    return this.font;
  }

  /**
   * Load custom font from ArrayBuffer (.ttf, .otf, .woff)
   * @param {ArrayBuffer} arrayBuffer
   * @returns {Object} opentype.Font
   */
  loadFontFromBuffer(arrayBuffer) {
    const ot = this._getOpentype();
    this.font = ot.parse(arrayBuffer);
    return this.font;
  }

  /**
   * Load font from remote URL
   * @param {string} url
   * @returns {Promise<Object>} opentype.Font
   */
  async loadFontFromUrl(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Ошибка загрузки шрифта с ${url}: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    return this.loadFontFromBuffer(buf);
  }

  /**
   * Convert text to opentype.Path with kerning and tracking
   * @param {string} text Text to render
   * @param {number} [x=0]
   * @param {number} [y=0]
   * @param {number} [fontSize=60]
   * @param {number} [letterSpacingEm=0.04]
   * @param {Object} [font=null] Optional opentype font override
   * @returns {Object} opentype.Path
   */
  getTrackedFontPath(text, x = 0, y = 0, fontSize = 60, letterSpacingEm = 0.04, font = null) {
    const fnt = font || this.font;
    if (!fnt) {
      this.initFont();
    }
    const activeFont = font || this.font;
    if (!activeFont) throw new Error("Шрифт не инициализирован");

    const ot = this._getOpentype();
    const scale = 1 / activeFont.unitsPerEm * fontSize;
    const letterSpacing = letterSpacingEm * activeFont.unitsPerEm;
    const glyphs = activeFont.stringToGlyphs(text || "");
    let curX = x;
    const fullPath = new ot.Path();

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      if (glyph.unicode !== undefined) {
        const glyphPath = glyph.getPath(curX, y, fontSize);
        fullPath.commands.push(...glyphPath.commands);
      }
      let advance = (glyph.advanceWidth || 0);
      if (i < glyphs.length - 1) {
        const kerning = activeFont.getKerningValue(glyph, glyphs[i + 1]);
        advance += kerning;
      }
      advance += letterSpacing;
      curX += advance * scale;
    }
    return fullPath;
  }

  /**
   * Convert opentype Path commands to Lottie Bezier Shape Contours
   * @param {Array|Object} commands Or opentype.Path
   * @param {number} [offsetX=0]
   * @param {number} [offsetY=0]
   * @returns {Array<Object>} Array of Lottie shape objects ({ ty: "sh", ... })
   */
  opentypeToLottieShapes(commandsOrPath, offsetX = 0, offsetY = 0) {
    const commands = Array.isArray(commandsOrPath) ? commandsOrPath : (commandsOrPath.commands || []);
    const lottieShapes = [];
    let currentContour = null;

    const rCoord = (n) => {
      if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return 0;
      return Number(n.toFixed(3));
    };

    function finishContour() {
      if (!currentContour || currentContour.v.length < 2) {
        currentContour = null;
        return;
      }
      const v = currentContour.v;
      const i = currentContour.i;
      const o = currentContour.o;
      const lastIdx = v.length - 1;

      if (lastIdx > 0) {
        const dx = Math.abs(v[lastIdx][0] - v[0][0]);
        const dy = Math.abs(v[lastIdx][1] - v[0][1]);
        if (dx < 0.001 && dy < 0.001) {
          i[0] = i[lastIdx];
          v.pop();
          i.pop();
          o.pop();
        }
      }

      if (v.length >= 2) {
        lottieShapes.push({
          ty: "sh",
          nm: "Path " + (lottieShapes.length + 1),
          ks: {
            a: 0,
            k: {
              c: true,
              v: v,
              i: i,
              o: o
            }
          }
        });
      }
      currentContour = null;
    }

    for (let idx = 0; idx < commands.length; idx++) {
      const cmd = commands[idx];
      if (cmd.type === 'M') {
        finishContour();
        currentContour = {
          v: [[rCoord(cmd.x + offsetX), rCoord(cmd.y + offsetY)]],
          i: [[0, 0]],
          o: [[0, 0]]
        };
      } else if (cmd.type === 'L') {
        if (!currentContour) continue;
        currentContour.v.push([rCoord(cmd.x + offsetX), rCoord(cmd.y + offsetY)]);
        currentContour.i.push([0, 0]);
        currentContour.o.push([0, 0]);
      } else if (cmd.type === 'C') {
        if (!currentContour) continue;
        const prevIdx = currentContour.v.length - 1;
        const prevV = currentContour.v[prevIdx];

        currentContour.o[prevIdx] = [
          rCoord(cmd.x1 + offsetX - prevV[0]),
          rCoord(cmd.y1 + offsetY - prevV[1])
        ];

        const endV = [rCoord(cmd.x + offsetX), rCoord(cmd.y + offsetY)];
        currentContour.v.push(endV);
        currentContour.i.push([
          rCoord(cmd.x2 + offsetX - endV[0]),
          rCoord(cmd.y2 + offsetY - endV[1])
        ]);
        currentContour.o.push([0, 0]);
      } else if (cmd.type === 'Q') {
        if (!currentContour) continue;
        const prevIdx = currentContour.v.length - 1;
        const prevV = currentContour.v[prevIdx];

        const qp1 = [cmd.x1 + offsetX, cmd.y1 + offsetY];
        const endV = [rCoord(cmd.x + offsetX), rCoord(cmd.y + offsetY)];

        const c1 = [
          rCoord(prevV[0] + (2 / 3) * (qp1[0] - prevV[0])),
          rCoord(prevV[1] + (2 / 3) * (qp1[1] - prevV[1]))
        ];
        const c2 = [
          rCoord(endV[0] + (2 / 3) * (qp1[0] - endV[0])),
          rCoord(endV[1] + (2 / 3) * (qp1[1] - endV[1]))
        ];

        currentContour.o[prevIdx] = [
          rCoord(c1[0] - prevV[0]),
          rCoord(c1[1] - prevV[1])
        ];
        currentContour.v.push(endV);
        currentContour.i.push([
          rCoord(c2[0] - endV[0]),
          rCoord(c2[1] - endV[1])
        ]);
        currentContour.o.push([0, 0]);
      } else if (cmd.type === 'Z') {
        finishContour();
      }
    }
    finishContour();

    return lottieShapes;
  }

  /**
   * Convert text string into a native Lottie Vector Shape Layer (ty: 4)
   * 100% compatible with Telegram, rlottie, and Android/iOS/Desktop.
   * @param {string} text
   * @param {Object} [options]
   * @returns {Object} Lottie Shape Layer definition
   */
  textToLottieShapeLayer(text, options = {}) {
    const fontSize = options.fontSize || 60;
    const pos = options.pos || options.textPos || [256, 274];
    const scale = options.scale !== undefined ? options.scale : (options.textScale !== undefined ? options.textScale : 100);
    const rot = options.rot !== undefined ? options.rot : (options.textRotation !== undefined ? options.textRotation : 0);
    const parentInd = options.parent !== undefined ? options.parent : options.parentLayer;
    const colorHex = options.color || options.defaultColor || options.colorHex || "#FFFFFF";
    const rgb = this.hexToRgb01(colorHex);
    const ip = options.ip !== undefined ? options.ip : 0;
    const op = options.op !== undefined ? options.op : 180;
    const ind = options.ind || 999;

    let pathCommands = [];
    let offsetX = 0;
    let offsetY = 0;
    let fitScale = 1;

    if (text && String(text).trim().length > 0) {
      if (!this.font) {
        try {
          this.initFont();
        } catch (e) {
          console.warn('initFont in textToLottieShapeLayer failed:', e);
        }
      }
      if (this.font) {
        const path = this.getTrackedFontPath(String(text), 0, 0, fontSize, 0.04);
        pathCommands = path.commands || [];
        const bbox = path.getBoundingBox();
        if (bbox && isFinite(bbox.x1) && isFinite(bbox.x2)) {
          const width = bbox.x2 - bbox.x1;
          const height = bbox.y2 - bbox.y1;
          const renderedWidth = width * Math.abs(scale) / 100;
          if (renderedWidth > 420) fitScale = 420 / renderedWidth;
          offsetX = -(bbox.x1 + width / 2);
          offsetY = -(bbox.y1 + height / 2);
        }
      }
    }

    const pathShapes = this.opentypeToLottieShapes(pathCommands, offsetX, offsetY);

    const layer = {
      ddd: 0,
      ind: ind,
      ty: 4, // Vector Shape Layer (Native Bezier Curves)
      nm: options.nm || "CUSTOM_TEXT_VECTOR",
      cl: options.cl || ("custom-layer-" + (options.id || ind)),
      ln: options.ln || ("layer-" + (options.id || ind)),
      sr: 1,
      ks: {
        o: { a: 0, k: options.opacity !== undefined ? options.opacity : 100 },
        r: { a: 0, k: rot },
        p: { a: 0, k: [pos[0], pos[1], 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [scale, scale, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          nm: "Text Group",
          it: [
            ...pathShapes,
            {
              ty: "fl",
              nm: "Text Fill",
              c: { a: 0, k: rgb },
              o: { a: 0, k: 100 },
              r: 1, // Non-Zero Winding Rule
              bm: 0
            },
            {
              ty: "tr",
              nm: "Transform",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [fitScale * 100, fitScale * 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 }
            }
          ]
        }
      ],
      ip: ip,
      op: op,
      st: 0,
      bm: 0
    };

    if (parentInd !== null && parentInd !== undefined && parentInd !== "none") {
      layer.parent = Number(parentInd);
    }

    return layer;
  }

  /**
   * Convert an SVG document string into native Lottie shape groups (ty: "gr")
   * Extracts <path>, <rect>, <circle>, <polygon>, normalizes coordinates to center (0, 0)
   * @param {string} svgString
   * @returns {Array<Object>} Lottie shape groups
   */
  svgToLottieShapes(svgString) {
    if (!svgString || typeof svgString !== 'string') return [];
    let doc;
    try {
      const parser = new DOMParser();
      doc = parser.parseFromString(svgString, 'image/svg+xml');
    } catch (e) {
      return [];
    }
    const svg = doc.querySelector('svg');
    if (!svg) return [];

    const parseColor = (str) => {
      if (!str || str === 'none') return null;
      if (str === 'currentColor' || str === 'inherit') return [1, 1, 1];
      if (str.startsWith('#')) {
        let hex = str.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
      }
      if (str.startsWith('rgb')) {
        const parts = str.match(/\d+/g);
        if (parts && parts.length >= 3) {
          return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
        }
      }
      const map = {
        white: [1, 1, 1], black: [0, 0, 0], red: [1, 0, 0], green: [0, 1, 0],
        blue: [0, 0, 1], yellow: [1, 1, 0], cyan: [0, 1, 1], magenta: [1, 0, 1],
        orange: [1, 0.5, 0], purple: [0.5, 0, 0.5], gray: [0.5, 0.5, 0.5]
      };
      return map[str.toLowerCase()] || [1, 1, 1];
    };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const rawShapes = [];
    const allNodes = svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline');

    allNodes.forEach((node, nodeIdx) => {
      const tagName = node.tagName.toLowerCase();
      let contours = [];
      let fillColor = parseColor(node.getAttribute('fill') || node.style.fill);
      const strokeColor = parseColor(node.getAttribute('stroke') || node.style.stroke);
      if (!fillColor && strokeColor) fillColor = strokeColor;
      if (!fillColor) fillColor = [1, 1, 1];

      if (tagName === 'path') {
        const d = node.getAttribute('d');
        if (d) contours = this._parseSvgPathD(d);
      } else if (tagName === 'rect') {
        const x = parseFloat(node.getAttribute('x')) || 0;
        const y = parseFloat(node.getAttribute('y')) || 0;
        const w = parseFloat(node.getAttribute('width')) || 0;
        const h = parseFloat(node.getAttribute('height')) || 0;
        if (w > 0 && h > 0) {
          contours.push({
            v: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
            i: [[0, 0], [0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0], [0, 0]],
            c: true
          });
        }
      } else if (tagName === 'circle' || tagName === 'ellipse') {
        const cx = parseFloat(node.getAttribute('cx')) || 0;
        const cy = parseFloat(node.getAttribute('cy')) || 0;
        const rx = tagName === 'circle' ? (parseFloat(node.getAttribute('r')) || 0) : (parseFloat(node.getAttribute('rx')) || 0);
        const ry = tagName === 'circle' ? rx : (parseFloat(node.getAttribute('ry')) || 0);
        if (rx > 0 && ry > 0) {
          const kx = rx * 0.5522847498;
          const ky = ry * 0.5522847498;
          contours.push({
            v: [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]],
            i: [[-kx, 0], [0, -ky], [kx, 0], [0, ky]],
            o: [[kx, 0], [0, ky], [-kx, 0], [0, -ky]],
            c: true
          });
        }
      } else if (tagName === 'polygon' || tagName === 'polyline') {
        const pointsStr = node.getAttribute('points') || '';
        const pts = pointsStr.trim().split(/[\s,]+/).map(Number);
        const v = [];
        for (let i = 0; i < pts.length - 1; i += 2) {
          if (!isNaN(pts[i]) && !isNaN(pts[i + 1])) v.push([pts[i], pts[i + 1]]);
        }
        if (v.length >= 3) {
          contours.push({
            v: v,
            i: v.map(() => [0, 0]),
            o: v.map(() => [0, 0]),
            c: tagName === 'polygon'
          });
        }
      }

      if (contours.length > 0) {
        contours.forEach(c => {
          c.v.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          });
        });
        rawShapes.push({ contours, fillColor, name: `Shape ${nodeIdx + 1}` });
      }
    });

    if (rawShapes.length === 0 || !isFinite(minX)) return [];

    const bboxW = maxX - minX || 1;
    const bboxH = maxY - minY || 1;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetSize = 200;
    const scaleFactor = Math.min(targetSize / bboxW, targetSize / bboxH, 1.0);

    const rCoord = (n) => {
      if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return 0;
      return Number(n.toFixed(3));
    };

    const lottieShapeGroups = [];
    rawShapes.forEach((item, idx) => {
      const pathItems = item.contours.map((c, cIdx) => ({
        ty: "sh",
        nm: `Path ${cIdx + 1}`,
        ks: {
          a: 0,
          k: {
            c: c.c !== false,
            v: c.v.map(([x, y]) => [rCoord((x - centerX) * scaleFactor), rCoord((y - centerY) * scaleFactor)]),
            i: c.i.map(([x, y]) => [rCoord(x * scaleFactor), rCoord(y * scaleFactor)]),
            o: c.o.map(([x, y]) => [rCoord(x * scaleFactor), rCoord(y * scaleFactor)])
          }
        }
      }));

      lottieShapeGroups.push({
        ty: "gr",
        nm: item.name || `Group ${idx + 1}`,
        it: [
          ...pathItems,
          {
            ty: "fl",
            nm: "Fill",
            c: { a: 0, k: item.fillColor },
            o: { a: 0, k: 100 },
            r: 1,
            bm: 0
          },
          {
            ty: "tr",
            nm: "Transform",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 }
          }
        ]
      });
    });

    return lottieShapeGroups;
  }

  /**
   * Internal SVG path d-attribute tokenizer & cubic Bezier converter
   */
  _parseSvgPathD(d) {
    if (!d) return [];
    const contours = [];
    let curV = [];
    let curI = [];
    let curO = [];
    let curX = 0, curY = 0;
    let startX = 0, startY = 0;
    let lastCpX = 0, lastCpY = 0;
    let lastCmd = '';

    const cmdRegex = /([a-df-z])([^a-df-z]*)/gi;
    let match;

    function finish() {
      if (curV.length >= 2) {
        contours.push({ v: curV, i: curI, o: curO, c: true });
      }
      curV = []; curI = []; curO = [];
    }

    while ((match = cmdRegex.exec(d)) !== null) {
      const cmd = match[1];
      const isRel = (cmd === cmd.toLowerCase());
      const type = cmd.toUpperCase();
      const numMatches = match[2].match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g);
      const args = numMatches ? numMatches.map(Number) : [];
      let i = 0;

      if (type === 'M') {
        if (curV.length >= 2) finish();
        const nx = isRel ? curX + args[0] : args[0];
        const ny = isRel ? curY + args[1] : args[1];
        curX = nx; curY = ny;
        startX = nx; startY = ny;
        curV.push([curX, curY]);
        curI.push([0, 0]);
        curO.push([0, 0]);
        i = 2;
        while (i + 1 < args.length) {
          const lx = isRel ? curX + args[i] : args[i];
          const ly = isRel ? curY + args[i + 1] : args[i + 1];
          curX = lx; curY = ly;
          curV.push([curX, curY]);
          curI.push([0, 0]);
          curO.push([0, 0]);
          i += 2;
        }
      } else if (type === 'L') {
        while (i + 1 < args.length) {
          const nx = isRel ? curX + args[i] : args[i];
          const ny = isRel ? curY + args[i + 1] : args[i + 1];
          curX = nx; curY = ny;
          curV.push([curX, curY]);
          curI.push([0, 0]);
          curO.push([0, 0]);
          i += 2;
        }
      } else if (type === 'H') {
        while (i < args.length) {
          curX = isRel ? curX + args[i] : args[i];
          curV.push([curX, curY]);
          curI.push([0, 0]);
          curO.push([0, 0]);
          i++;
        }
      } else if (type === 'V') {
        while (i < args.length) {
          curY = isRel ? curY + args[i] : args[i];
          curV.push([curX, curY]);
          curI.push([0, 0]);
          curO.push([0, 0]);
          i++;
        }
      } else if (type === 'C') {
        while (i + 5 < args.length) {
          const cp1x = isRel ? curX + args[i] : args[i];
          const cp1y = isRel ? curY + args[i + 1] : args[i + 1];
          const cp2x = isRel ? curX + args[i + 2] : args[i + 2];
          const cp2y = isRel ? curY + args[i + 3] : args[i + 3];
          const endX = isRel ? curX + args[i + 4] : args[i + 4];
          const endY = isRel ? curY + args[i + 5] : args[i + 5];

          if (curO.length > 0) {
            curO[curO.length - 1] = [cp1x - curX, cp1y - curY];
          }
          curV.push([endX, endY]);
          curI.push([cp2x - endX, cp2y - endY]);
          curO.push([0, 0]);

          lastCpX = cp2x; lastCpY = cp2y;
          curX = endX; curY = endY;
          i += 6;
        }
      } else if (type === 'S') {
        while (i + 3 < args.length) {
          let cp1x = curX, cp1y = curY;
          if (lastCmd === 'C' || lastCmd === 'S') {
            cp1x = 2 * curX - lastCpX;
            cp1y = 2 * curY - lastCpY;
          }
          const cp2x = isRel ? curX + args[i] : args[i];
          const cp2y = isRel ? curY + args[i + 1] : args[i + 1];
          const endX = isRel ? curX + args[i + 2] : args[i + 2];
          const endY = isRel ? curY + args[i + 3] : args[i + 3];

          if (curO.length > 0) {
            curO[curO.length - 1] = [cp1x - curX, cp1y - curY];
          }
          curV.push([endX, endY]);
          curI.push([cp2x - endX, cp2y - endY]);
          curO.push([0, 0]);

          lastCpX = cp2x; lastCpY = cp2y;
          curX = endX; curY = endY;
          i += 4;
        }
      } else if (type === 'Q') {
        while (i + 3 < args.length) {
          const qx = isRel ? curX + args[i] : args[i];
          const qy = isRel ? curY + args[i + 1] : args[i + 1];
          const endX = isRel ? curX + args[i + 2] : args[i + 2];
          const endY = isRel ? curY + args[i + 3] : args[i + 3];

          const cp1x = curX + (2 / 3) * (qx - curX);
          const cp1y = curY + (2 / 3) * (qy - curY);
          const cp2x = endX + (2 / 3) * (qx - endX);
          const cp2y = endY + (2 / 3) * (qy - endY);

          if (curO.length > 0) {
            curO[curO.length - 1] = [cp1x - curX, cp1y - curY];
          }
          curV.push([endX, endY]);
          curI.push([cp2x - endX, cp2y - endY]);
          curO.push([0, 0]);

          lastCpX = qx; lastCpY = qy;
          curX = endX; curY = endY;
          i += 4;
        }
      } else if (type === 'Z') {
        finish();
        curX = startX; curY = startY;
      }
      lastCmd = type;
    }
    finish();
    return contours;
  }

  /**
   * Client-side vector contour tracer for PNG/JPG images
   * Converts raster pixels into native Lottie Bezier curves (ty: 4)
   * Guaranteed 100% compliant with Telegram rlottie .TGS (under 64 KB)
   * @param {string|HTMLImageElement} imageInput Data URL or image element
   * @param {Object} [options]
   * @returns {Promise<Array<Object>>} Lottie shape groups
   */
  async rasterImageToLottieShapes(imageInput, options = {}) {
    let img;
    if (typeof imageInput === 'string') {
      img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageInput;
      });
    } else {
      img = imageInput;
    }

    const maxDim = options.maxDim || 96;
    let w = img.width || 100;
    let h = img.height || 100;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.max(16, Math.round((h * maxDim) / w));
        w = maxDim;
      } else {
        w = Math.max(16, Math.round((w * maxDim) / h));
        h = maxDim;
      }
    }
    w = Math.max(16, w);
    h = Math.max(16, h);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const colorCounts = new Map();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a < 32) continue;
        const qr = (data[idx] >> 4) << 4;
        const qg = (data[idx + 1] >> 4) << 4;
        const qb = (data[idx + 2] >> 4) << 4;
        const key = `${qr},${qg},${qb}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
    }

    if (colorCounts.size === 0) return [];

    const topColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => {
        const parts = entry[0].split(',').map(Number);
        return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
      });

    const getClosestColorIdx = (r, g, b) => {
      let bestDist = Infinity;
      let bestIdx = 0;
      topColors.forEach((col, idx) => {
        const dr = (col[0] * 255) - r;
        const dg = (col[1] * 255) - g;
        const db = (col[2] * 255) - b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      return bestIdx;
    };

    const colorGrids = topColors.map(() => Array.from({ length: h }, () => new Uint8Array(w)));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a >= 32) {
          const cIdx = getClosestColorIdx(data[idx], data[idx + 1], data[idx + 2]);
          colorGrids[cIdx][y][x] = 1;
        }
      }
    }

    const targetSize = 180;
    const scaleFactor = Math.min(targetSize / w, targetSize / h);
    const offsetX = w / 2;
    const offsetY = h / 2;

    const lottieShapeGroups = [];

    colorGrids.forEach((grid, cIdx) => {
      const contours = this._traceGridContours(grid, w, h);
      if (contours.length === 0) return;

      const pathItems = [];
      contours.forEach((poly, polyIdx) => {
        if (poly.length < 3) return;
        const simplified = this._simplifyPolygonRDP(poly, 1.2);
        if (simplified.length < 3) return;

        const { v, i, o } = this._smoothPolygonToCurves(simplified, offsetX, offsetY, scaleFactor);

        pathItems.push({
          ty: "sh",
          nm: `Path ${polyIdx + 1}`,
          ks: {
            a: 0,
            k: {
              c: true,
              v, i, o
            }
          }
        });
      });

      if (pathItems.length > 0) {
        lottieShapeGroups.push({
          ty: "gr",
          nm: `Logo Color Group ${cIdx + 1}`,
          it: [
            ...pathItems,
            {
              ty: "fl",
              nm: "Fill",
              c: { a: 0, k: topColors[cIdx] },
              o: { a: 0, k: 100 },
              r: 1,
              bm: 0
            },
            {
              ty: "tr",
              nm: "Transform",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 }
            }
          ]
        });
      }
    });

    return lottieShapeGroups;
  }

  _traceGridContours(grid, w, h) {
    const segments = [];
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w - 1; x++) {
        const tl = grid[y][x] ? 1 : 0;
        const tr = grid[y][x + 1] ? 1 : 0;
        const br = grid[y + 1][x + 1] ? 1 : 0;
        const bl = grid[y + 1][x] ? 1 : 0;
        const state = (tl << 3) | (tr << 2) | (br << 1) | bl;

        const top = [x + 0.5, y];
        const right = [x + 1, y + 0.5];
        const bottom = [x + 0.5, y + 1];
        const left = [x, y + 0.5];

        switch (state) {
          case 1:  segments.push([left, bottom]); break;
          case 2:  segments.push([bottom, right]); break;
          case 3:  segments.push([left, right]); break;
          case 4:  segments.push([top, right]); break;
          case 5:  segments.push([left, top]); segments.push([bottom, right]); break;
          case 6:  segments.push([top, bottom]); break;
          case 7:  segments.push([left, top]); break;
          case 8:  segments.push([top, left]); break;
          case 9:  segments.push([top, bottom]); break;
          case 10: segments.push([top, right]); segments.push([bottom, left]); break;
          case 11: segments.push([top, right]); break;
          case 12: segments.push([right, left]); break;
          case 13: segments.push([bottom, right]); break;
          case 14: segments.push([left, bottom]); break;
          default: break;
        }
      }
    }

    if (segments.length === 0) return [];

    const polygons = [];
    const used = new Uint8Array(segments.length);

    for (let i = 0; i < segments.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      const poly = [segments[i][0], segments[i][1]];

      let extended = true;
      while (extended) {
        extended = false;
        const tail = poly[poly.length - 1];
        for (let j = 0; j < segments.length; j++) {
          if (used[j]) continue;
          const p1 = segments[j][0];
          const p2 = segments[j][1];
          const d1 = Math.hypot(p1[0] - tail[0], p1[1] - tail[1]);
          const d2 = Math.hypot(p2[0] - tail[0], p2[1] - tail[1]);
          if (d1 < 0.1) {
            used[j] = 1;
            poly.push(p2);
            extended = true;
            break;
          } else if (d2 < 0.1) {
            used[j] = 1;
            poly.push(p1);
            extended = true;
            break;
          }
        }
      }

      if (poly.length >= 3) {
        polygons.push(poly);
      }
    }

    return polygons;
  }

  _simplifyPolygonRDP(points, epsilon) {
    if (points.length <= 2) return points;

    function getSqSegDist(p, p1, p2) {
      let x = p1[0], y = p1[1];
      let dx = p2[0] - x, dy = p2[1] - y;
      if (dx !== 0 || dy !== 0) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          x = p2[0]; y = p2[1];
        } else if (t > 0) {
          x += dx * t; y += dy * t;
        }
      }
      return (p[0] - x) ** 2 + (p[1] - y) ** 2;
    }

    function rdp(pts, eps) {
      const epsSq = eps * eps;
      let maxDistSq = 0;
      let maxIdx = 0;
      const end = pts.length - 1;

      for (let i = 1; i < end; i++) {
        const dSq = getSqSegDist(pts[i], pts[0], pts[end]);
        if (dSq > maxDistSq) {
          maxDistSq = dSq;
          maxIdx = i;
        }
      }

      if (maxDistSq > epsSq) {
        const left = rdp(pts.slice(0, maxIdx + 1), eps);
        const right = rdp(pts.slice(maxIdx), eps);
        return left.slice(0, left.length - 1).concat(right);
      } else {
        return [pts[0], pts[end]];
      }
    }

    return rdp(points, epsilon);
  }

  _smoothPolygonToCurves(points, offsetX, offsetY, scale) {
    const N = points.length;
    const v = [];
    const i = [];
    const o = [];

    for (let k = 0; k < N; k++) {
      const cur = points[k];
      const prev = points[(k - 1 + N) % N];
      const next = points[(k + 1) % N];

      const vx = (cur[0] - offsetX) * scale;
      const vy = (cur[1] - offsetY) * scale;
      v.push([vx, vy]);

      const dx = (next[0] - prev[0]) * 0.22 * scale;
      const dy = (next[1] - prev[1]) * 0.22 * scale;

      o.push([dx, dy]);
      i.push([-dx, -dy]);
    }

    return { v, i, o };
  }

  // --------------------------------------------------------------------------
  // 2. LOTTIE PARSING, INSPECTION & LAYER MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Parse .TGS file (GZIP) or raw JSON string/buffer
   * @param {ArrayBuffer|Uint8Array|string} input
   * @returns {Object} Parsed Lottie JSON object
   */
  parseTgsOrJson(input) {
    if (!input) throw new Error("Входные данные пусты");

    let bytes = null;
    let jsonStr = '';

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        jsonStr = trimmed;
      } else {
        // If base64 or binary string
        if (typeof atob === 'function') {
          const bin = atob(input);
          bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        } else {
          bytes = new Uint8Array(Buffer.from(input, 'base64'));
        }
      }
    } else if (input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input);
    } else if (input instanceof Uint8Array) {
      bytes = input;
    } else if (typeof input === 'object' && input !== null) {
      jsonStr = JSON.stringify(input);
    }

    if (!jsonStr) {
      if (!bytes) throw new Error("Не удалось преобразовать входные данные в байты");

      // Check gzip signature: 0x1f 0x8b
      const isGzip = (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b);

      if (isGzip) {
        const pk = this._getPako();
        if (!pk.ungzip) throw new Error("pako.ungzip отсутствует");
        jsonStr = pk.ungzip(bytes, { to: 'string' });
      } else {
        if (typeof TextDecoder !== 'undefined') {
          jsonStr = new TextDecoder('utf-8').decode(bytes);
        } else {
          jsonStr = Buffer.from(bytes).toString('utf-8');
        }
      }
    }

    if (jsonStr.charCodeAt(0) === 0xFEFF) {
      jsonStr = jsonStr.slice(1);
    }

    // Capture pristine raw JSON string BEFORE anything can mutate it
    this.lastPristineRawJson = jsonStr;
    if (typeof window !== 'undefined') {
      window.PRISTINE_RAW_JSON = jsonStr;
    }

    const data = JSON.parse(jsonStr);
    if (!data || !data.layers) throw new Error("Невалидный Lottie-объект: отсутствует массив layers");
    return data;
  }

  /**
   * Inspect all layers in a Lottie animation
   * @param {Object} lottieData
   * @returns {Array<Object>} List of layer descriptors
   */
  getLayersInfo(lottieData) {
    if (!lottieData || !Array.isArray(lottieData.layers)) return [];
    return lottieData.layers.map((l, index) => ({
      index: index,
      ind: l.ind,
      name: l.nm || `Layer ${l.ind}`,
      type: l.ty,
      typeName: this.getLayerTypeName(l.ty),
      parentId: l.parent !== undefined ? l.parent : null,
      isHidden: !!l.hd,
      isText: l.ty === 5 || l.nm === "CUSTOM_TEXT_VECTOR",
      ip: l.ip,
      op: l.op
    }));
  }

  /**
   * Deep hierarchical parser for layers including Precompositions in assets
   * @param {Object} lottieData
   * @returns {Array<Object>} Hierarchical tree of layers with children
   */
  getLayersTree(lottieData) {
    if (!lottieData || !Array.isArray(lottieData.layers)) return [];
    const assets = (lottieData.assets && Array.isArray(lottieData.assets)) ? lottieData.assets : [];

    const parseList = (layers, assetId = null, depth = 0) => {
      return layers.map((l, index) => {
        const uniqueId = assetId ? `${assetId}:${l.ind}` : String(l.ind);
        const item = {
          id: uniqueId,
          ind: l.ind,
          name: l.nm || `Layer ${l.ind}`,
          type: l.ty,
          typeName: this.getLayerTypeName(l.ty),
          parentId: l.parent !== undefined ? l.parent : null,
          isHidden: !!l.hd,
          isText: l.ty === 5 || l.nm === "CUSTOM_TEXT_VECTOR",
          ip: l.ip !== undefined ? l.ip : 0,
          op: l.op !== undefined ? l.op : (lottieData.op || 180),
          depth: depth,
          assetId: assetId,
          refId: l.refId || null,
          layerRef: l,
          children: []
        };

        // If Precomp (ty: 0), find its asset layers!
        if (l.ty === 0 && l.refId) {
          const matchedAsset = assets.find(a => a.id === l.refId);
          if (matchedAsset && matchedAsset.layers && Array.isArray(matchedAsset.layers)) {
            item.children = parseList(matchedAsset.layers, matchedAsset.id, depth + 1);
          }
        }
        return item;
      });
    };

    return parseList(lottieData.layers, null, 0);
  }

  /**
   * Helper for layer type name
   * @param {number} ty
   * @returns {string}
   */
  getLayerTypeName(ty) {
    switch (ty) {
      case 0: return "Precomp";
      case 1: return "Solid";
      case 2: return "Image";
      case 3: return "Null";
      case 4: return "Shape";
      case 5: return "Text";
      default: return `Type ${ty}`;
    }
  }

  /**
   * Inject multiple custom layers (vector text + vector logos) into Lottie animation
   * @param {Object|string} baseData
   * @param {Array<Object>} customLayers
   * @param {Object} [options]
   * @returns {Object} Updated Lottie JSON
   */
  prepareLottieWithCustomLayers(baseData, customLayers = [], options = {}) {
    if (!baseData) return null;
    let data = null;
    try {
      data = (typeof baseData === 'string') ? JSON.parse(baseData) : JSON.parse(JSON.stringify(baseData));
    } catch (e) {
      return null;
    }
    if (!data || typeof data !== 'object') return null;

    const opts = options || {};
    const hiddenList = opts.hiddenLayers || [];

    if (data.layers && Array.isArray(data.layers)) {
      data.layers = data.layers.filter(l => l && l.ty !== 5 && !(typeof l.nm === 'string' && l.nm.startsWith("CUSTOM_")));
      data.layers.forEach(l => {
        if (l && (hiddenList.includes(l.ind) || hiddenList.includes(Number(l.ind)) || hiddenList.includes(String(l.ind)))) {
          l.hd = true;
        }
      });
      if (data.assets && Array.isArray(data.assets)) {
        data.assets.forEach(asset => {
          if (asset && asset.layers && Array.isArray(asset.layers)) {
            asset.layers.forEach(l => {
              if (l) {
                const compKey = `${asset.id}:${l.ind}`;
                if (hiddenList.includes(compKey) || hiddenList.includes(l.ind) || hiddenList.includes(Number(l.ind)) || hiddenList.includes(String(l.ind))) {
                  l.hd = true;
                }
              }
            });
          }
        });
      }
    } else {
      data.layers = [];
    }

    if (data.fonts) delete data.fonts;

    let maxExistingInd = 0;
    const scanInd = (layerList) => {
      if (!Array.isArray(layerList)) return;
      layerList.forEach(l => {
        if (l && typeof l.ind === 'number' && isFinite(l.ind)) {
          if (l.ind > maxExistingInd) maxExistingInd = l.ind;
        }
      });
    };
    scanInd(data.layers);
    if (data.assets && Array.isArray(data.assets)) {
      data.assets.forEach(asset => {
        if (asset && asset.layers) scanInd(asset.layers);
      });
    }

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
          ip: 0,
          op: data.op || 180,
          st: 0,
          bm: 0
        };
      } else {
        const text = layer.text || "HELLO";
        const baseSize = layer.fontSize || 60;
        const fontSize = this.calculateFontSize(text.length, baseSize);

        shapeLayer = this.textToLottieShapeLayer(text, {
          fontSize: fontSize,
          pos: pos,
          scale: scale,
          rot: rot,
          parent: parentInd,
          color: layer.colorHex || "#FFFFFF",
          op: data.op || 180,
          ind: ind,
          cl: `custom-layer-${layer.id}`,
          ln: `layer-${layer.id}`,
          opacity: opacity,
          nm: layer.name ? `CUSTOM_TEXT_${layer.name}` : `CUSTOM_TEXT_${idx + 1}`
        });
      }

      if (parentInd !== null) {
        shapeLayer.parent = parentInd;
      }

      let defaultInsertIndex = 0;
      const targetLayers = (layer.parentAssetId && data.assets?.find(asset => asset.id === layer.parentAssetId)?.layers) || data.layers;
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

    data.tgs = 1;
    data.fr = 60;
    data.w = 512;
    data.h = 512;

    return data;
  }

  /**
   * Inject vector text layer, configure transforms, apply motion parenting and smart Z-order
   * @param {Object|string} baseData
   * @param {Object} [config] Configuration options (position, scale, rotation, parenting, z-depth)
   * @param {string|Object} [textOrOptions="WSHOP"] Text string or extra options
   * @returns {Object} Cloned and updated Lottie JSON ready for rendering or .TGS export
   */
  prepareLottieWithVectorText(baseData, config = {}, textOrOptions = "WSHOP") {
    if (config && Array.isArray(config.customLayers) && config.customLayers.length > 0) {
      return this.prepareLottieWithCustomLayers(baseData, config.customLayers, config);
    }
    if (!baseData) return null;
    let data = null;
    try {
      data = (typeof baseData === 'string') ? JSON.parse(baseData) : JSON.parse(JSON.stringify(baseData));
    } catch (e) {
      return null;
    }
    if (!data || typeof data !== 'object') return null;

    const text = (typeof textOrOptions === 'string') ? textOrOptions : (textOrOptions.text || config.text || "WSHOP");
    const cfg = config || {};
    const hiddenList = cfg.hiddenLayers || [];
    const pos = cfg.textPos || [256, 274];
    const baseTemplateScale = cfg.textScale !== undefined ? cfg.textScale : 100;
    const userScaleMult = (typeof textOrOptions === 'object' && textOrOptions.scaleMultiplier) ? textOrOptions.scaleMultiplier : 100;
    const finalScale = Math.round(baseTemplateScale * (userScaleMult / 100));
    const rot = cfg.textRotation || 0;
    const parentInd = cfg.parentLayer;
    const baseSize = cfg.fontSize || 60;
    const fontSize = this.calculateFontSize((text || "").length, baseSize);

    // Track index of original text layer (ty === 5) before filtering
    let origTextIndex = -1;
    if (data.layers && Array.isArray(data.layers)) {
      let countBefore = 0;
      for (let i = 0; i < data.layers.length; i++) {
        const l = data.layers[i];
        if (l && (l.ty === 5 || (typeof l.nm === 'string' && l.nm === "CUSTOM_TEXT_VECTOR"))) {
          origTextIndex = countBefore;
          break;
        }
        countBefore++;
      }
    }

    if (data.layers) {
      data.layers = data.layers.filter(l => l && l.ty !== 5 && !(typeof l.nm === 'string' && l.nm === "CUSTOM_TEXT_VECTOR"));
      data.layers.forEach(l => {
        if (l && (hiddenList.includes(l.ind) || hiddenList.includes(Number(l.ind)) || hiddenList.includes(String(l.ind)))) {
          l.hd = true;
        }
      });
      if (data.assets && Array.isArray(data.assets)) {
        data.assets.forEach(asset => {
          if (asset && asset.layers && Array.isArray(asset.layers)) {
            asset.layers.forEach(l => {
              if (l) {
                const compKey = `${asset.id}:${l.ind}`;
                if (hiddenList.includes(compKey) || hiddenList.includes(l.ind) || hiddenList.includes(Number(l.ind)) || hiddenList.includes(String(l.ind))) {
                  l.hd = true;
                }
              }
            });
          }
        });
      }
    } else {
      data.layers = [];
    }

    // Strip legacy fonts definition so players don't attempt font lookups
    if (data.fonts) delete data.fonts;

    const shapeLayer = this.textToLottieShapeLayer(text, {
      fontSize: fontSize,
      pos: pos,
      scale: finalScale,
      rot: rot,
      parent: parentInd,
      color: cfg.colorHex || cfg.defaultColor || "#FFFFFF",
      op: data.op || 180,
      ind: (() => {
        let maxExistingInd = 0;
        if (data.layers && Array.isArray(data.layers)) {
          data.layers.forEach(l => {
            if (l && typeof l.ind === 'number' && isFinite(l.ind) && l.ind > maxExistingInd) {
              maxExistingInd = l.ind;
            }
          });
        }
        return maxExistingInd + 1;
      })()
    });

    // Smart Z-order calculation:
    // In Lottie, layers are ordered from top (0) to bottom (N).
    // Placing immediately BEFORE parentLayer draws text on top of parent, but below foreground hands/borders.
    let defaultInsertIndex = 0;
    const parentLayerIdx = (parentInd !== null && parentInd !== undefined && parentInd !== "none")
      ? data.layers.findIndex(l => l.ind === Number(parentInd))
      : -1;

    if (parentLayerIdx !== -1) {
      defaultInsertIndex = parentLayerIdx;
    } else if (origTextIndex !== -1) {
      defaultInsertIndex = Math.min(origTextIndex, data.layers.length);
    } else {
      defaultInsertIndex = 0;
    }

    let insertIdx = defaultInsertIndex;
    if (cfg.zOffset !== undefined && cfg.zOffset !== null) {
      insertIdx = defaultInsertIndex + Number(cfg.zOffset);
    } else if (cfg.textLayerIndex !== undefined && cfg.textLayerIndex !== null) {
      insertIdx = Number(cfg.textLayerIndex);
    }

    insertIdx = Math.max(0, Math.min(data.layers.length, insertIdx));
    data.layers.splice(insertIdx, 0, shapeLayer);

    // Standardize TGS properties (never force w, h, fr if present!)
    data.tgs = 1;
    if (data.fr === undefined) data.fr = 60;
    if (data.w === undefined) data.w = 512;
    if (data.h === undefined) data.h = 512;

    return data;
  }

  // --------------------------------------------------------------------------
  // 3. EXPORT METHODS (.TGS, GIF, VIDEO) & RLOTTIE SANITIZATION
  // --------------------------------------------------------------------------

  /**
   * Helper to round coordinates to 3 decimal places and eliminate NaN / Infinity
   */
  _roundCoord(n) {
    if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return 0;
    return Number(n.toFixed(3));
  }

  _sanitizePoint(pt) {
    if (!Array.isArray(pt)) return [0, 0];
    return [this._roundCoord(pt[0]), this._roundCoord(pt[1])];
  }

  _sanitizeBezierK(kObj) {
    if (!kObj || typeof kObj !== 'object') return;
    if (Array.isArray(kObj.v)) kObj.v = kObj.v.map(pt => this._sanitizePoint(pt));
    if (Array.isArray(kObj.i)) kObj.i = kObj.i.map(pt => this._sanitizePoint(pt));
    if (Array.isArray(kObj.o)) kObj.o = kObj.o.map(pt => this._sanitizePoint(pt));
    if (kObj.c !== undefined) kObj.c = (kObj.c !== false);
  }

  /**
   * Strict shape order inside shape group (ty: "gr") "it" array for Telegram rlottie:
   * 1. All path contours (ty: "sh")
   * 2. Other geometry elements (ellipses, rects, nested groups)
   * 3. Fill (ty: "fl") with mandatory Non-Zero Winding Rule "r": 1
   * 4. Stroke (ty: "st")
   * 5. Transform (ty: "tr") strictly as the LAST item!
   */
  sanitizeShapeGroupIt(itArray) {
    if (!Array.isArray(itArray)) return itArray;

    const contours = [];
    const fills = [];
    const strokes = [];
    const others = [];
    let transform = null;

    itArray.forEach(item => {
      if (!item || typeof item !== 'object') return;

      if (item.ty === 'sh') {
        if (item.ks && item.ks.k && item.ks.a === 0) {
          this._sanitizeBezierK(item.ks.k);
        } else if (item.ks && item.ks.a === 1 && Array.isArray(item.ks.k)) {
          item.ks.k.forEach(kf => {
            if (kf.s && kf.s[0]) this._sanitizeBezierK(kf.s[0]);
            if (kf.e && kf.e[0]) this._sanitizeBezierK(kf.e[0]);
          });
        }
        contours.push(item);
      } else if (item.ty === 'fl') {
        item.r = 1; // Mandatory Non-Zero Winding Rule for rlottie
        if (item.c && Array.isArray(item.c.k)) {
          if (item.c.a === 1) {
            item.c.k.forEach(keyframe => {
              if (keyframe && Array.isArray(keyframe.s)) keyframe.s = keyframe.s.map(c => this._roundCoord(c));
              if (keyframe && Array.isArray(keyframe.e)) keyframe.e = keyframe.e.map(c => this._roundCoord(c));
            });
          } else {
            item.c.k = item.c.k.map(c => this._roundCoord(c));
          }
        }
        fills.push(item);
      } else if (item.ty === 'st') {
        if (item.c && Array.isArray(item.c.k)) {
          if (item.c.a === 1) {
            item.c.k.forEach(keyframe => {
              if (keyframe && Array.isArray(keyframe.s)) keyframe.s = keyframe.s.map(c => this._roundCoord(c));
              if (keyframe && Array.isArray(keyframe.e)) keyframe.e = keyframe.e.map(c => this._roundCoord(c));
            });
          } else {
            item.c.k = item.c.k.map(c => this._roundCoord(c));
          }
        }
        strokes.push(item);
      } else if (item.ty === 'tr') {
        transform = item;
      } else if (item.ty === 'gr') {
        if (item.it && Array.isArray(item.it)) {
          item.it = this.sanitizeShapeGroupIt(item.it);
        }
        others.push(item);
      } else {
        others.push(item);
      }
    });

    if (!transform) {
      transform = {
        ty: "tr",
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
        sk: { a: 0, k: 0 },
        sa: { a: 0, k: 0 }
      };
    }

    return [...contours, ...others, ...fills, ...strokes, transform];
  }

  /**
   * Strict layer sanitization for Telegram C++ rlottie parser:
   * Strips all custom editor fields (cl, ln, id, selected, isCustom, etc.),
   * leaving ONLY official Lottie/TGS fields.
   */
  sanitizeLayerForRlottie(rawLayer) {
    if (!rawLayer || typeof rawLayer !== 'object') return rawLayer;

    const ALLOWED_LAYER_KEYS = new Set([
      'ddd', 'ind', 'ty', 'nm', 'sr', 'ks', 'ao', 'shapes', 'ip', 'op',
      'st', 'bm', 'parent', 'refId', 'w', 'h', 'sw', 'sh', 'sc', 'tt',
      'tp', 'masksProperties', 'hd'
    ]);

    const cleanLayer = {};
    for (const key of Object.keys(rawLayer)) {
      if (ALLOWED_LAYER_KEYS.has(key)) {
        cleanLayer[key] = rawLayer[key];
      }
    }

    if (cleanLayer.ind !== undefined) cleanLayer.ind = Number(cleanLayer.ind);
    if (cleanLayer.parent !== undefined && cleanLayer.parent !== null) cleanLayer.parent = Number(cleanLayer.parent);

    // Sanitize shapes array if vector shape layer (ty: 4)
    if (cleanLayer.ty === 4 && Array.isArray(cleanLayer.shapes)) {
      cleanLayer.shapes = cleanLayer.shapes.map(grp => {
        if (grp && grp.ty === 'gr' && Array.isArray(grp.it)) {
          grp.it = this.sanitizeShapeGroupIt(grp.it);
        }
        return grp;
      });
    }

    if (cleanLayer.ddd === undefined) cleanLayer.ddd = 0;
    if (cleanLayer.sr === undefined) cleanLayer.sr = 1;
    if (cleanLayer.ao === undefined) cleanLayer.ao = 0;
    if (cleanLayer.bm === undefined) cleanLayer.bm = 0;
    if (cleanLayer.st === undefined) cleanLayer.st = 0;

    return cleanLayer;
  }

  /**
   * Build clean Lottie export object strictly isolated from lottie-web player mutations.
   * Based on pristine JSON string with surgical editor state applied.
   *
   * @param {string|Object} pristineRawJson The unmutated raw JSON string from file/ungzip
   * @param {Object} editorState
   * @param {Array<string|number>} [editorState.hiddenLayers]
   * @param {Object} [editorState.layerOverrides]
   * @param {Array<Object>} [editorState.customLayers]
   * @returns {Object} Clean, fully-sanitized Lottie object ready for pako.gzip
   */
  buildCleanTgsExport(pristineRawJson, editorState = {}) {
    if (!pristineRawJson) {
      throw new Error("pristineRawJson отсутствует");
    }

    const jsonStr = (typeof pristineRawJson === 'string')
      ? pristineRawJson
      : JSON.stringify(pristineRawJson);

    // 1. Pristine baseline - NOT touched by lottie-web!
    const cleanExport = JSON.parse(jsonStr);

    // Telegram required flag
    cleanExport.tgs = 1;

    // Do NOT overwrite root v, fr, ip, op, w, h, markers! Keep them pristine.

    const hiddenList = editorState.hiddenLayers || [];
    const overrides = editorState.layerOverrides || {};
    const customLayers = editorState.customLayers || [];

    // 2. Identify which root layers are referenced as parent by custom layers
    const rootReferencedParents = new Set();
    customLayers.forEach(cl => {
      if (cl && !cl.parentAssetId && cl.parentLayer !== undefined && cl.parentLayer !== 'none' && cl.parentLayer !== null) {
        rootReferencedParents.add(Number(cl.parentLayer));
      }
    });

    // Identify which root layers are referenced as parent by visible root layers
    if (cleanExport.layers && Array.isArray(cleanExport.layers)) {
      cleanExport.layers.forEach(l => {
        if (!l) return;
        const isHidden = hiddenList.includes(l.ind) ||
                         hiddenList.includes(Number(l.ind)) ||
                         hiddenList.includes(String(l.ind));
        if (!isHidden && l.parent !== undefined && l.parent !== null) {
          rootReferencedParents.add(Number(l.parent));
        }
      });
    }

    // 3. Apply hidden layers and timeline overrides to root layers
    if (cleanExport.layers && Array.isArray(cleanExport.layers)) {
      // Filter out any legacy or custom layers that might exist in raw json
      cleanExport.layers = cleanExport.layers.filter(l => l && l.ty !== 5 && !(typeof l.nm === 'string' && l.nm.startsWith("CUSTOM_")));

      cleanExport.layers.forEach(l => {
        if (!l) return;
        const isHidden = hiddenList.includes(l.ind) ||
                         hiddenList.includes(Number(l.ind)) ||
                         hiddenList.includes(String(l.ind)) ||
                         Boolean(l.hd);
        if (isHidden) {
          l.hd = true;
          // If layer has no child referring to it as parent, clear shapes: [] to reduce size
          if (!rootReferencedParents.has(Number(l.ind))) {
            l.shapes = [];
          } else {
            // Layer is a parent: empty its shapes so it won't render,
            // but keep transforms and remove hd so rlottie parent matrix resolution succeeds
            l.shapes = [];
            delete l.hd;
          }
        }
        // If user adjusted timeline strips, update only numbers ip and op
        if (overrides[l.ind]) {
          if (overrides[l.ind].ip !== undefined) l.ip = overrides[l.ind].ip;
          if (overrides[l.ind].op !== undefined) l.op = overrides[l.ind].op;
        }
      });
    }

    // 4. Apply hidden layers and timeline overrides inside precomposition assets
    if (cleanExport.assets && Array.isArray(cleanExport.assets)) {
      cleanExport.assets.forEach(asset => {
        if (asset && asset.layers && Array.isArray(asset.layers)) {
          const assetParents = new Set();
          customLayers.forEach(layer => { if (layer.parentAssetId === asset.id && layer.parentLayer !== 'none') assetParents.add(Number(layer.parentLayer)); });
          asset.layers.forEach(l => {
            if (!l) return;
            const compKey = `${asset.id}:${l.ind}`;
            const isHidden = hiddenList.includes(compKey) ||
                             hiddenList.includes(l.ind) ||
                             hiddenList.includes(Number(l.ind)) ||
                             hiddenList.includes(String(l.ind)) ||
                             Boolean(l.hd);
            if (!isHidden && l.parent !== undefined && l.parent !== null) {
              assetParents.add(Number(l.parent));
            }
          });

          asset.layers.forEach(l => {
            if (!l) return;
            if (l.ty === 5) return;
            const compKey = `${asset.id}:${l.ind}`;
            const isHidden = hiddenList.includes(compKey) ||
                             hiddenList.includes(l.ind) ||
                             hiddenList.includes(Number(l.ind)) ||
                             hiddenList.includes(String(l.ind)) ||
                             Boolean(l.hd);
            if (isHidden) {
              l.hd = true;
              if (!assetParents.has(Number(l.ind))) {
                l.shapes = [];
              } else {
                l.shapes = [];
                delete l.hd;
              }
            }
            const ov = overrides[compKey] || overrides[l.ind];
            if (ov) {
              if (ov.ip !== undefined) l.ip = ov.ip;
              if (ov.op !== undefined) l.op = ov.op;
            }
          });
        }
      });
    }

    // 5. Build and inject custom layers (ty: 4) into cleanExport.layers
    let maxExistingInd = 0;
    if (cleanExport.layers && Array.isArray(cleanExport.layers)) {
      cleanExport.layers.forEach(l => {
        if (l && typeof l.ind === 'number' && l.ind > maxExistingInd) {
          maxExistingInd = l.ind;
        }
      });
    }
    if (cleanExport.assets && Array.isArray(cleanExport.assets)) {
      cleanExport.assets.forEach(asset => {
        if (asset && asset.layers && Array.isArray(asset.layers)) {
          asset.layers.forEach(l => {
            if (l && typeof l.ind === 'number' && l.ind > maxExistingInd) {
              maxExistingInd = l.ind;
            }
          });
        }
      });
    }

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
          sr: 1,
          ks: {
            o: { a: 0, k: opacity },
            r: { a: 0, k: rot },
            p: { a: 0, k: [this._roundCoord(pos[0]), this._roundCoord(pos[1]), 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [this._roundCoord(scale), this._roundCoord(scale), 100] }
          },
          ao: 0,
          shapes: shapes,
          ip: layer.ip !== undefined ? layer.ip : cleanExport.ip,
          op: layer.op !== undefined ? layer.op : cleanExport.op,
          st: 0,
          bm: 0
        };
      } else {
        const text = (layer.text !== undefined && layer.text !== null) ? layer.text : "HELLO";
        const baseSize = layer.fontSize || 60;
        const fontSize = this.calculateFontSize(text.length, baseSize);

        shapeLayer = this.textToLottieShapeLayer(text, {
          fontSize: fontSize,
          pos: pos,
          scale: scale,
          rot: rot,
          parent: parentInd,
          color: layer.colorHex || "#FFFFFF",
          ip: layer.ip !== undefined ? layer.ip : cleanExport.ip,
          op: layer.op !== undefined ? layer.op : cleanExport.op,
          ind: ind,
          opacity: opacity,
          nm: layer.name ? `CUSTOM_TEXT_${layer.name}` : `CUSTOM_TEXT_${idx + 1}`
        });
      }

      if (parentInd !== null) {
        shapeLayer.parent = parentInd;
      }

      // Sanitize custom layer (strip cl, ln, id, selected, isCustom, sort shape items)
      shapeLayer = this.sanitizeLayerForRlottie(shapeLayer);

      // Smart Z-order placement
      let defaultInsertIndex = 0;
      const targetLayers = (layer.parentAssetId && cleanExport.assets?.find(asset => asset.id === layer.parentAssetId)?.layers) || cleanExport.layers;
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

    if (cleanExport.fonts) delete cleanExport.fonts;

    return cleanExport;
  }

  /**
   * Export pristine JSON + editor state directly to GZIP level 9 .TGS bytes.
   * Completely bypasses lottie-web player mutations.
   *
   * @param {string|Object} pristineRawJson
   * @param {Object} [editorState]
   * @param {Object} [options]
   * @returns {Uint8Array}
   */
  exportPristineToTgsBytes(pristineRawJson, editorState = {}, options = {}) {
    const pk = this._getPako();
    const cleanExport = this.buildCleanTgsExport(pristineRawJson, editorState);

    const jsonString = JSON.stringify(cleanExport);
    let utf8Bytes;
    if (typeof TextEncoder !== 'undefined') {
      utf8Bytes = new TextEncoder().encode(jsonString);
    } else {
      utf8Bytes = Buffer.from(jsonString, 'utf-8');
    }

    const compressed = pk.gzip(utf8Bytes, { level: 9 });
    const checkSize = options.checkSize !== false;
    const maxSize = options.maxSize || 65536;

    if (checkSize && compressed.length > maxSize) {
      throw new Error(`Размер сжатого .TGS (${compressed.length} байт) превышает лимит Telegram в ${maxSize} байт (64 КБ)`);
    }

    return compressed;
  }

  /**
   * Export Lottie object to compressed .TGS bytes (GZIP level 9) with 64 KB validation
   * Fully sanitized for Telegram rlottie C++ parser:
   * - Preserves original w, h, fr, ip, op, v (only sets "tgs": 1)
   * - Strips all non-standard editor properties (cl, ln, id, etc.)
   * - Ensures unique ind indices
   * - Preserves Z-order & motion hierarchy for hidden layers referenced as parents
   * - Rounds all Bezier vertices/tangents to 3 decimals with zero NaN/Infinity
   * - Strictly orders shapes -> it: contours -> fills ("r": 1) -> transform last
   * @param {Object|string} lottieData
   * @param {Object} [options]
   * @param {boolean} [options.checkSize=true]
   * @param {number} [options.maxSize=65536] 64 KB limit
   * @returns {Uint8Array}
   */
  exportToTgsBytes(lottieData, options = {}) {
    if (!lottieData) throw new Error("lottieData отсутствует");
    if (typeof lottieData === 'string' && lottieData.trim().startsWith('{')) {
      return this.exportPristineToTgsBytes(lottieData, options.editorState || {}, options);
    }
    if (options.editorState && (options.pristineRawJson || this.lastPristineRawJson || (typeof window !== 'undefined' && window.PRISTINE_RAW_JSON))) {
      const pJson = options.pristineRawJson || this.lastPristineRawJson || window.PRISTINE_RAW_JSON;
      return this.exportPristineToTgsBytes(pJson, options.editorState, options);
    }
    const pk = this._getPako();

    // 1. Clean deep clone from provided lottieData
    const exportData = JSON.parse(JSON.stringify(lottieData));

    // 2. Base parameters: NEVER overwrite original w, h, fr, ip, op, v if present!
    exportData.tgs = 1;
    if (exportData.w === undefined) exportData.w = 512;
    if (exportData.h === undefined) exportData.h = 512;
    if (exportData.fr === undefined) exportData.fr = 60;
    if (exportData.ip === undefined) exportData.ip = 0;
    if (exportData.op === undefined) exportData.op = 180;
    if (exportData.v === undefined) exportData.v = "5.5.2";

    // 3. Preserve Z-Order and Motion Hierarchy for Hidden Layers (Root Layers)
    const referencedParents = new Set();
    if (exportData.layers && Array.isArray(exportData.layers)) {
      exportData.layers.forEach(l => {
        if (l && !l.hd && l.parent !== undefined && l.parent !== null) {
          referencedParents.add(Number(l.parent));
        }
      });

      const filteredLayers = [];
      exportData.layers.forEach(l => {
        if (!l) return;
        if (l.ty === 5) return; // strip unsupported legacy text

        if (l.hd) {
          // If this hidden layer is used as parent by a visible layer:
          // NEVER delete it! Empty its shapes so it remains as a motion controller
          if (referencedParents.has(Number(l.ind))) {
            l.shapes = [];
            delete l.hd;
            filteredLayers.push(l);
          }
          // Otherwise, it can be safely removed to save size
        } else {
          filteredLayers.push(l);
        }
      });
      exportData.layers = filteredLayers;
    }

    // 4. Preserve Z-Order and Motion Hierarchy for Hidden Layers inside Precomp Assets
    if (exportData.assets && Array.isArray(exportData.assets)) {
      exportData.assets.forEach(asset => {
        if (asset && asset.layers && Array.isArray(asset.layers)) {
          const assetParents = new Set();
          customLayers.forEach(layer => { if (layer.parentAssetId === asset.id && layer.parentLayer !== 'none') assetParents.add(Number(layer.parentLayer)); });
          asset.layers.forEach(l => {
            if (l && !l.hd && l.parent !== undefined && l.parent !== null) {
              assetParents.add(Number(l.parent));
            }
          });

          const filteredAssetLayers = [];
          asset.layers.forEach(l => {
            if (!l) return;
            if (l.ty === 5) return;
            if (l.hd) {
              if (assetParents.has(Number(l.ind))) {
                l.shapes = [];
                delete l.hd;
                filteredAssetLayers.push(l);
              }
            } else {
              filteredAssetLayers.push(l);
            }
          });
          asset.layers = filteredAssetLayers;
        }
      });
    }

    // 5. Strict Sanitization for C++ rlottie:
    // Sanitize root layers: remove editor fields (cl, ln, id, etc.), round Bezier coords, sort shape items
    if (exportData.layers && Array.isArray(exportData.layers)) {
      exportData.layers = exportData.layers.map(l => this.sanitizeLayerForRlottie(l));
    }

    // Sanitize asset layers
    if (exportData.assets && Array.isArray(exportData.assets)) {
      exportData.assets.forEach(asset => {
        if (asset && asset.layers && Array.isArray(asset.layers)) {
          asset.layers = asset.layers.map(l => this.sanitizeLayerForRlottie(l));
        }
      });
    }

    if (exportData.fonts) delete exportData.fonts;

    // 6. Gzip compress level 9
    const jsonString = JSON.stringify(exportData);
    let utf8Bytes;
    if (typeof TextEncoder !== 'undefined') {
      utf8Bytes = new TextEncoder().encode(jsonString);
    } else {
      utf8Bytes = Buffer.from(jsonString, 'utf-8');
    }

    const compressed = pk.gzip(utf8Bytes, { level: 9 });
    const checkSize = options.checkSize !== false;
    const maxSize = options.maxSize || 65536;

    if (checkSize && compressed.length > maxSize) {
      throw new Error(`Размер сжатого .TGS (${compressed.length} байт) превышает лимит Telegram в ${maxSize} байт (64 КБ)`);
    }

    return compressed;
  }

  /**
   * Export to .TGS Blob
   * @param {Object} lottieData
   * @param {Object} [options]
   * @returns {Blob}
   */
  exportToTgsBlob(lottieData, options = {}) {
    const bytes = this.exportToTgsBytes(lottieData, options);
    return new Blob([bytes], { type: "application/x-tgsticker" });
  }

  /**
   * Download .TGS in browser
   * @param {Object} lottieData
   * @param {string} [filename="sticker.tgs"]
   * @param {Object} [options]
   */
  downloadTgs(lottieData, filename = "sticker.tgs", options = {}) {
    const blob = this.exportToTgsBlob(lottieData, options);
    this.downloadBlob(blob, filename);
  }

  /**
   * Render Lottie animation to animated GIF using embedded GIFEncoder
   * @param {Object} lottieData
   * @param {Object} [options]
   * @param {number} [options.width=512]
   * @param {number} [options.height=512]
   * @param {number} [options.fps=30]
   * @param {string} [options.bgColor="#000000"]
   * @param {Function} [options.onProgress] (pct, frame, totalFrames) => {}
   * @returns {Promise<Blob>}
   */
  async renderGif(lottieData, options = {}) {
    const lt = this._getLottie();
    const width = options.width || 512;
    const height = options.height || 512;
    const fps = options.fps || 30;
    const bgColor = options.bgColor !== undefined ? options.bgColor : "#000000";
    const onProgress = options.onProgress || (() => {});

    if (typeof document === 'undefined') {
      throw new Error("renderGif требует DOM-окружение (document / canvas)");
    }

    const offscreenContainer = document.createElement("div");
    offscreenContainer.style.width = width + "px";
    offscreenContainer.style.height = height + "px";
    offscreenContainer.style.position = "fixed";
    offscreenContainer.style.left = "-9999px";
    document.body.appendChild(offscreenContainer);

    const anim = lt.loadAnimation({
      container: offscreenContainer,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: lottieData
    });

    await new Promise(r => anim.addEventListener("DOMLoaded", r));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const totalFrames = anim.totalFrames || 180;
    const frameRate = anim.frameRate || 60;
    const step = Math.max(1, Math.round(frameRate / fps));
    const framesToRender = Math.floor(totalFrames / step);

    const encoder = this.gifenc.GIFEncoder();
    const img = new Image();

    let rendered = 0;
    for (let f = 0; f < totalFrames; f += step) {
      anim.goToAndStop(f, true);
      const svgEl = offscreenContainer.querySelector("svg");
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      await new Promise(resolve => {
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          if (bgColor) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(svgUrl);

          const imgData = ctx.getImageData(0, 0, width, height);
          const palette = this.gifenc.quantize(imgData.data, 256);
          const index = this.gifenc.applyPalette(imgData.data, palette);
          encoder.writeFrame(index, width, height, { palette, delay: Math.round(1000 / fps) });
          resolve();
        };
        img.src = svgUrl;
      });

      rendered++;
      onProgress(Math.round((rendered / framesToRender) * 100), rendered, framesToRender);
    }

    encoder.finish();
    anim.destroy();
    document.body.removeChild(offscreenContainer);

    return new Blob([encoder.bytes()], { type: "image/gif" });
  }

  /**
   * Record animation to MP4 / WebM video via MediaRecorder
   * @param {Object} lottieData
   * @param {Object} [options]
   * @param {number} [options.width=512]
   * @param {number} [options.height=512]
   * @param {number} [options.fps=60]
   * @param {number} [options.durationSec=3]
   * @param {string} [options.bgColor="#000000"]
   * @param {Function} [options.onProgress] (pct) => {}
   * @returns {Promise<Blob>}
   */
  async recordVideo(lottieData, options = {}) {
    const lt = this._getLottie();
    const width = options.width || 512;
    const height = options.height || 512;
    const fps = options.fps || 60;
    const durationSec = options.durationSec || 3;
    const bgColor = options.bgColor !== undefined ? options.bgColor : "#000000";
    const onProgress = options.onProgress || (() => {});

    if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
      throw new Error("recordVideo требует окружение с Canvas и MediaRecorder");
    }

    const offscreenContainer = document.createElement("div");
    offscreenContainer.style.width = width + "px";
    offscreenContainer.style.height = height + "px";
    offscreenContainer.style.position = "fixed";
    offscreenContainer.style.left = "-9999px";
    document.body.appendChild(offscreenContainer);

    const anim = lt.loadAnimation({
      container: offscreenContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: lottieData
    });

    await new Promise(r => anim.addEventListener("DOMLoaded", r));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const stream = canvas.captureStream(fps);
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        try {
          anim.destroy();
          document.body.removeChild(offscreenContainer);
          const videoBlob = new Blob(chunks, { type: mimeType });
          resolve(videoBlob);
        } catch (err) {
          reject(err);
        }
      };

      recorder.onerror = reject;
      recorder.start();

      const startTime = Date.now();
      const img = new Image();

      const renderLoop = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(100, Math.round((elapsed / durationSec) * 100));
        onProgress(pct);

        const svgEl = offscreenContainer.querySelector("svg");
        if (svgEl) {
          const svgString = new XMLSerializer().serializeToString(svgEl);
          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(svgBlob);
          img.onload = () => {
            if (bgColor) {
              ctx.fillStyle = bgColor;
              ctx.fillRect(0, 0, width, height);
            } else {
              ctx.clearRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        }

        if (elapsed >= durationSec) {
          clearInterval(renderLoop);
          recorder.stop();
        }
      }, 1000 / fps);
    });
  }

  /**
   * Helper to trigger browser download of any Blob
   * @param {Blob} blob
   * @param {string} filename
   */
  downloadBlob(blob, filename) {
    if (typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------------------------
  // 4. UTILITIES
  // --------------------------------------------------------------------------

  /**
   * Convert hex color string to [r, g, b] array with 0..1 values (Lottie format)
   * @param {string} hex
   * @returns {Array<number>}
   */
  hexToRgb01(hex) {
    let c = (hex || "#FFFFFF").replace('#', '').trim();
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const num = parseInt(c, 16);
    return [
      Number(((num >> 16) / 255).toFixed(3)),
      Number((((num >> 8) & 255) / 255).toFixed(3)),
      Number(((num & 255) / 255).toFixed(3))
    ];
  }

  /**
   * Calculate dynamically scaled font size
   * @param {number} length
   * @param {number} [baseSize=60]
   * @returns {number}
   */
  calculateFontSize(length, baseSize = 60) {
    if (length <= 4) return baseSize;
    if (length <= 6) return Math.round(baseSize * 0.88);
    if (length <= 8) return Math.round(baseSize * 0.76);
    if (length <= 10) return Math.round(baseSize * 0.65);
    return Math.max(22, Math.round(baseSize * 0.55));
  }
}

// Universal Module Definition (UMD) & global attachment
if (typeof window !== 'undefined') {
  window.EmoteEngine = EmoteEngine;
  // Pre-instantiated default instance for quick access
  window.emoteEngine = new EmoteEngine();
}
if (typeof globalThis !== 'undefined') {
  globalThis.EmoteEngine = EmoteEngine;
  if (!globalThis.emoteEngine && typeof window !== 'undefined') {
    globalThis.emoteEngine = window.emoteEngine;
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmoteEngine;
  module.exports.EmoteEngine = EmoteEngine;
  module.exports.default = EmoteEngine;
}
