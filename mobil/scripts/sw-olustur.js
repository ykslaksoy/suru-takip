/**
 * Dışa aktarılmış dist/ için service worker üretir (dist/sw.js):
 * önbelleğe alınacak dosya listesi + sürüm (içerik özeti) + vercel.json yönlendirmeleri.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dist = path.join(__dirname, '..', 'dist');
const kok = path.join(__dirname, '..', '..', 'vercel.json');
const yerel = path.join(__dirname, '..', 'vercel.json');

const dosyalar = [];
const ozet = crypto.createHash('sha1');
function gez(dir) {
  for (const ad of fs.readdirSync(dir).sort()) {
    const tam = path.join(dir, ad);
    const rel = '/' + path.relative(dist, tam).split(path.sep).join('/');
    if (fs.statSync(tam).isDirectory()) {
      gez(tam);
      continue;
    }
    if (rel.includes('[') || rel === '/sw.js' || rel.endsWith('.map')) continue;
    if (rel.endsWith('.ttf') && !/(Ionicons|SpaceMono)/.test(rel)) continue; // kullanılan ikon fontları
    if (rel.endsWith('.html')) {
      if (/\/(_sitemap|\+not-found)\.html$/.test(rel)) continue;
      let u = rel.slice(0, -5);
      if (u.endsWith('/index')) u = u.slice(0, -6) || '/';
      dosyalar.push(u || '/');
    } else {
      dosyalar.push(rel);
    }
    ozet.update(rel);
    ozet.update(fs.readFileSync(tam));
  }
}
gez(dist);
const vercel = JSON.parse(fs.readFileSync(fs.existsSync(kok) ? kok : yerel, 'utf8'));
const yonlendirmeler = (vercel.rewrites || []).map((r) => [
  '^' + r.source.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-zA-Z]+/g, '[^/]+') + '$',
  r.destination,
]);
const surum = ozet.digest('hex').slice(0, 12);
const ayar = { surum, dosyalar: ['/', ...dosyalar.filter((d) => d !== '/')], yonlendirmeler };
const sablon = fs.readFileSync(path.join(__dirname, 'sw-sablon.js'), 'utf8');
fs.writeFileSync(path.join(dist, 'sw.js'), `self.__SW_AYAR__ = ${JSON.stringify(ayar)};\n${sablon}`);
console.log(`sw-olustur: ${ayar.dosyalar.length} dosya · sürüm ${surum}`);
