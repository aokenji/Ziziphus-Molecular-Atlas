/**
 * Render the app icons and the social card from SVG sources.
 *
 * Maskable icons get cropped to a circle on some launchers, so the mark is drawn
 * smaller there - anything outside the middle 80% is not guaranteed to survive.
 *
 * Run: npm run build:icons
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const BG = '#07080b';
const ACCENT = '#3ddc84';

/** The molecule mark, scaled to `scale` of a 512 box and centred. */
const mark = (scale) => {
  const t = (v) => 256 + (v - 256) * scale;
  const r = 46 * scale;
  return `
    <g stroke="${ACCENT}" stroke-width="${22 * scale}" stroke-linecap="round" fill="${BG}">
      <line x1="${t(256)}" y1="${t(154)}" x2="${t(168)}" y2="${t(308)}" />
      <line x1="${t(256)}" y1="${t(154)}" x2="${t(344)}" y2="${t(308)}" />
      <line x1="${t(168)}" y1="${t(308)}" x2="${t(344)}" y2="${t(308)}" />
      <circle cx="${t(256)}" cy="${t(154)}" r="${r}" />
      <circle cx="${t(168)}" cy="${t(308)}" r="${r}" />
      <circle cx="${t(344)}" cy="${t(308)}" r="${r}" />
    </g>`;
};

const icon = (scale, radius) =>
  `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
     <rect width="512" height="512" rx="${radius}" fill="${BG}" />
     ${mark(scale)}
   </svg>`;

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

await mkdir('public/icons', { recursive: true });

const rounded = icon(1, 114);
const square = icon(1, 0);
const maskable = icon(0.66, 0);

await writeFile('public/icons/icon-192.png', await png(rounded, 192));
await writeFile('public/icons/icon-512.png', await png(rounded, 512));
await writeFile('public/icons/icon-maskable-512.png', await png(maskable, 512));
// iOS applies its own corner mask, so the source must be a full square.
await writeFile('public/icons/apple-touch-icon.png', await png(square, 180));

// Social card. Kept deliberately plain: mark, wordmark, one line.
const og = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="8%" r="70%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${BG}" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <g transform="translate(494 96) scale(0.41)">${mark(1)}</g>
  <text x="600" y="404" text-anchor="middle" fill="#f1f0ea"
        font-family="Georgia, 'Times New Roman', serif" font-size="74" font-weight="600">
    Ziziphus Molecular Atlas
  </text>
  <text x="600" y="466" text-anchor="middle" fill="#98a0ad"
        font-family="Helvetica, Arial, sans-serif" font-size="29">
    Verified 3D structures for the compounds reported in Ziziphus
  </text>
  <rect x="518" y="516" width="164" height="2" fill="${ACCENT}" opacity="0.5" />
</svg>`;

await writeFile('public/og.png', await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toBuffer());

console.log('icons: 192, 512, maskable-512, apple-touch-icon, og.png');
