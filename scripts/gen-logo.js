/* eslint-disable */
// Generates the Smart Expense brand assets (app icon, adaptive icon, splash logo)
// as PNGs — a rounded gradient tile with a white wallet glyph, matching the
// in-app branding (colors.primary / gradients.primary on colors.background).
//
// Pure Node: SDF-based anti-aliased rasterizer + minimal zlib PNG encoder.
// No native/image dependencies. Run: node scripts/gen-logo.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---- brand palette (kept in sync with theme/colors.ts) ----
const PRIMARY_TOP = [0x6c, 0x7c, 0xff]; // #6C7CFF
const PRIMARY_BOT = [0x8b, 0x5c, 0xf6]; // #8B5CF6
const WHITE = [0xff, 0xff, 0xff];
const BG = [0x0b, 0x10, 0x20]; // #0B1020

const SS = 4; // supersampling factor

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
// Alpha-over compositing (straight alpha).
function over(dst, src, sa) {
  const oa = sa + dst[3] * (1 - sa);
  if (oa <= 0) return [0, 0, 0, 0];
  const r = (src[0] * sa + dst[0] * dst[3] * (1 - sa)) / oa;
  const g = (src[1] * sa + dst[1] * dst[3] * (1 - sa)) / oa;
  const b = (src[2] * sa + dst[2] * dst[3] * (1 - sa)) / oa;
  return [r, g, b, oa];
}
// Signed distance to a rounded rectangle centered at (cx,cy).
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
}
function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}
// Coverage from signed distance: 1 inside, 0 outside, smooth ~1px edge.
function coverage(d, aa) {
  return Math.min(Math.max(0.5 - d / aa, 0), 1);
}

// Renders the logo into an RGBA buffer of size `size`.
// tileFrac: tile edge as fraction of canvas (1 = full-bleed icon).
// solidBg: optional [r,g,b] to fill behind (else transparent).
function renderLogo(size, tileFrac, solidBg) {
  const S = size * SS;
  const buf = new Float64Array(S * S * 4);
  const cx = S / 2;
  const cy = S / 2;
  const tile = S * tileFrac;
  const hw = tile / 2;
  const hh = tile / 2;
  const radius = tile * 0.235; // squircle-ish corner
  const aa = SS * 1.2;

  // wallet geometry (relative to tile)
  const wHW = tile * 0.30; // body half-width
  const wHH = tile * 0.205; // body half-height
  const wR = tile * 0.058;
  const bodyCy = cy + tile * 0.012;
  // top flap band
  const flapHH = tile * 0.052;
  const flapCy = bodyCy - wHH + flapHH * 0.7;
  // snap button
  const btnR = tile * 0.045;
  const btnCx = cx + wHW - tile * 0.085;
  const btnCy = bodyCy + tile * 0.028;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let col = solidBg ? [solidBg[0], solidBg[1], solidBg[2], 1] : [0, 0, 0, 0];

      // 1) gradient tile
      const dTile = sdRoundRect(px, py, cx, cy, hw, hh, radius);
      const cTile = coverage(dTile, aa);
      if (cTile > 0) {
        const t = (py - (cy - hh)) / tile; // vertical gradient
        const g = mix(PRIMARY_TOP, PRIMARY_BOT, Math.min(Math.max(t, 0), 1));
        col = over(col, g, cTile);
      }

      // 3) wallet body (white)
      const dBody = sdRoundRect(px, py, cx, bodyCy, wHW, wHH, wR);
      const cBody = coverage(dBody, aa);
      if (cBody > 0) col = over(col, WHITE, cBody);

      // 4) pocket flap band (primary, sits on the white body)
      const dFlap = sdRoundRect(px, py, cx, flapCy, wHW * 0.86, flapHH, flapHH);
      const cFlap = coverage(dFlap, aa) * cBody;
      if (cFlap > 0) col = over(col, mix(PRIMARY_TOP, PRIMARY_BOT, 0.35), cFlap);

      // 5) snap button (primary circle on the body)
      const dBtn = sdCircle(px, py, btnCx, btnCy, btnR);
      const cBtn = coverage(dBtn, aa) * cBody;
      if (cBtn > 0) col = over(col, mix(PRIMARY_TOP, PRIMARY_BOT, 0.5), cBtn);

      const i = (y * S + x) * 4;
      buf[i] = col[0];
      buf[i + 1] = col[1];
      buf[i + 2] = col[2];
      buf[i + 3] = col[3];
    }
  }

  // box downsample SS -> 1x
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          const pa = buf[i + 3];
          r += buf[i] * pa;
          g += buf[i + 1] * pa;
          b += buf[i + 2] * pa;
          a += pa;
        }
      }
      const n = SS * SS;
      const oa = a / n;
      const o = (y * size + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round(oa * 255);
    }
  }
  return out;
}

// ---- minimal PNG encoder (RGBA, 8-bit) ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(rgba, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const assets = path.join(__dirname, "..", "assets");
function write(name, size, tileFrac, solidBg) {
  const rgba = renderLogo(size, tileFrac, solidBg);
  const png = encodePNG(rgba, size, size);
  fs.writeFileSync(path.join(assets, name), png);
  console.log(`✓ ${name} (${size}x${size}, ${png.length} bytes)`);
}

// App icon: full-bleed gradient tile (OS masks corners).
write("icon.png", 1024, 1.0, BG);
// Adaptive foreground: glyph tile within the Android safe zone (~66%), transparent.
write("adaptive-icon.png", 1024, 0.66, null);
// Splash logo: centered tile on transparent (shown over #0B1020).
write("splash-icon.png", 1024, 0.42, null);
// Web favicon.
write("favicon.png", 64, 1.0, BG);
