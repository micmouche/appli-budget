// Usage : node scripts/build-legal.js — convertit legal/*.md en pages HTML autonomes (hébergeables sur GitHub Pages).
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../legal');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1">$1</a>');

function md(src) {
  const lines = src.split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,3} /.test(line)) {
      const level = line.match(/^#+/)[0].length;
      html += `<h${level}>${inline(line.replace(/^#+ /, ''))}</h${level}>\n`;
      i += 1;
    } else if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      html += `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>\n`;
    } else if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2));
      html += `<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>\n`;
    } else if (line.startsWith('> ')) {
      html += `<blockquote>${inline(line.slice(2))}</blockquote>\n`;
      i += 1;
    } else if (line.trim() === '') {
      i += 1;
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||- |> )/.test(lines[i])) para.push(lines[i++]);
      html += `<p>${inline(para.join(' '))}</p>\n`;
    }
  }
  return html;
}

const STYLE = `<style>
:root{color-scheme:light dark;--bg:#F6F5F1;--fg:#17191D;--muted:#5E6470;--line:#E3E1DA;--brand:#1E5A48}
@media(prefers-color-scheme:dark){:root{--bg:#0F1114;--fg:#F2F1EC;--muted:#A0A6B1;--line:#2A2F37;--brand:#6FCBA6}}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:40px 20px 80px}
h1{font-size:30px;line-height:1.2;margin:0 0 8px}h2{font-size:21px;margin:36px 0 10px}h3{font-size:17px;margin:24px 0 6px}
a{color:var(--brand)}p{margin:0 0 14px}blockquote{margin:0 0 16px;padding:10px 14px;border-left:3px solid var(--brand);color:var(--muted)}
table{width:100%;border-collapse:collapse;margin:8px 0 18px;font-size:15px}th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
ul{padding-left:22px}code{background:rgba(127,127,127,.15);padding:1px 5px;border-radius:4px}
nav{display:flex;gap:16px;margin-bottom:28px;font-size:15px}footer{margin-top:48px;color:var(--muted);font-size:14px}
</style>`;

const nav = `<nav><a href="./index.html">Pécule</a><a href="./confidentialite.html">Confidentialité</a><a href="./cgu.html">Conditions d'utilisation</a></nav>`;
const page = (title, body) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Pécule</title>${STYLE}</head><body><main>${nav}${body}<footer>© ${new Date().getFullYear()} Pécule. Simulation indicative, ne constitue pas un conseil financier.</footer></main></body></html>`;

for (const [file, title] of [['confidentialite', 'Politique de confidentialité'], ['cgu', "Conditions générales d'utilisation"]]) {
  const src = fs.readFileSync(path.join(DIR, `${file}.md`), 'utf8');
  fs.writeFileSync(path.join(DIR, `${file}.html`), page(title, md(src)));
  console.log('wrote', `${file}.html`);
}
const index = `<h1>Pécule</h1><p>Budget, épargne, immobilier, loyers et travaux : toute la gestion financière de votre foyer, sans compte ni banque connectée. Vos données restent sur votre téléphone.</p><ul><li><a href="./confidentialite.html">Politique de confidentialité</a></li><li><a href="./cgu.html">Conditions générales d'utilisation</a></li><li>Support : <a href="mailto:[adresse e-mail de contact]">[adresse e-mail de contact]</a></li></ul>`;
fs.writeFileSync(path.join(DIR, 'index.html'), page('Accueil', index));
console.log('wrote index.html');
