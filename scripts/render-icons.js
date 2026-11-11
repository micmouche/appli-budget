// Usage : node scripts/render-icons.js (nécessite Playwright + Chromium). Régénère assets/*.png.
// Rend les icônes de l'app depuis un SVG (monogramme « P » sur pièce) avec Chromium.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FONT = path.resolve(
  __dirname,
  '../node_modules/@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf',
);
const OUT = path.resolve(__dirname, '../assets');
const GREEN = '#1E5A48',
  CREAM = '#F6F5F1',
  INK = '#17191D',
  MINT = '#6FCBA6';

function svg({ size, bg, coin, letter, ring, scale = 1, mono = false }) {
  const c = size / 2;
  const r = size * 0.36 * scale;
  const fontSize = size * 0.46 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <style>@font-face{font-family:M;src:url('file://${FONT}');} text{font-family:M;font-weight:800;}</style>
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  ${coin ? `<circle cx="${c}" cy="${c}" r="${r}" fill="${coin}"/>` : ''}
  ${ring ? `<circle cx="${c}" cy="${c}" r="${r * 0.86}" fill="none" stroke="${ring}" stroke-width="${size * 0.018 * scale}" opacity="0.55"/>` : ''}
  <text x="${c + size * 0.012 * scale}" y="${c + fontSize * 0.36}" text-anchor="middle" font-size="${fontSize}" fill="${letter}">P</text>
  ${!mono ? `<circle cx="${c + r * 0.62}" cy="${c - r * 0.62}" r="${size * 0.045 * scale}" fill="${MINT}"/>` : ''}
</svg>`;
}

const jobs = [
  {
    file: 'icon.png',
    size: 1024,
    svg: svg({ size: 1024, bg: CREAM, coin: GREEN, letter: CREAM, ring: CREAM }),
    transparent: false,
  },
  {
    file: 'icon-dark.png',
    size: 1024,
    svg: svg({ size: 1024, bg: '#0F1114', coin: GREEN, letter: CREAM, ring: CREAM }),
    transparent: false,
  },
  {
    file: 'icon-tinted.png',
    size: 1024,
    svg: svg({ size: 1024, bg: '#000000', coin: '#FFFFFF', letter: '#000000', ring: '#000000', mono: true }),
    transparent: false,
  },
  {
    file: 'splash-icon.png',
    size: 1024,
    svg: svg({ size: 1024, bg: null, coin: GREEN, letter: CREAM, ring: CREAM }),
    transparent: true,
  },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    svg: svg({ size: 1024, bg: null, coin: CREAM, letter: GREEN, ring: GREEN, scale: 0.78 }),
    transparent: true,
  },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    svg: svg({
      size: 1024,
      bg: null,
      coin: '#FFFFFF',
      letter: '#000000',
      ring: null,
      scale: 0.78,
      mono: true,
    }),
    transparent: true,
  },
  {
    file: 'favicon.png',
    size: 48,
    svg: svg({ size: 48, bg: CREAM, coin: GREEN, letter: CREAM, ring: null }),
    transparent: false,
  },
];

(async () => {
  const browser = await chromium.launch();
  for (const job of jobs) {
    const page = await browser.newPage({
      viewport: { width: job.size, height: job.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(`<html><body style="margin:0;background:transparent">${job.svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, job.file), omitBackground: job.transparent, type: 'png' });
    await page.close();
    console.log('wrote', job.file);
  }
  await browser.close();
})();
