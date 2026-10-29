// Render the PWA icons from the horizon mark. Usage: node scripts/icons.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const out = "public/icons";
await mkdir(out, { recursive: true });

const mark = (size, maskable) => {
  // Maskable icons keep the mark inside the safe zone (80% circle).
  const pad = maskable ? size * 0.1 : 0;
  const r = maskable ? 0 : size * 0.22;
  const inner = size - pad * 2;
  const horizonY = pad + inner * 0.62;
  return `<!doctype html><html><body style="margin:0;background:transparent">
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <clipPath id="c"><rect x="0" y="0" width="${size}" height="${size}" rx="${r}"/></clipPath>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e2b56a" stop-opacity="0"/>
        <stop offset="1" stop-color="#e2b56a" stop-opacity="0.26"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#c)">
      <rect width="${size}" height="${size}" fill="#121523"/>
      <rect x="0" y="${horizonY - inner * 0.3}" width="${size}" height="${inner * 0.3}" fill="url(#g)"/>
      <rect x="0" y="${horizonY}" width="${size}" height="${size - horizonY}" fill="#0a0c15"/>
      <rect x="0" y="${horizonY - Math.max(1, size / 128)}" width="${size}" height="${Math.max(1, size / 128)}" fill="#e2b56a" opacity="0.95"/>
    </g>
  </svg></body></html>`;
};

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });

for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(mark(size, maskable));
  await page.screenshot({ path: `${out}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log("icons written to", out);
