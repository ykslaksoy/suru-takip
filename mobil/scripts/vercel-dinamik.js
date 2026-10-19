/**
 * Vercel: dinamik rotaların ([id]) statik HTML'ini köşeli parantezsiz bir ada kopyalar,
 * vercel.json rewrites (/hayvan/:id → /hayvan/_id) doğrudan açılan linkte 404'ü önler.
 */
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
let n = 0;
function gez(dir) {
  for (const ad of fs.readdirSync(dir)) {
    const tam = path.join(dir, ad);
    const yeniAd = ad.replace(/\[([^\]]+)\]/g, '_$1');
    const hedef = path.join(dir, yeniAd);
    if (fs.statSync(tam).isDirectory()) {
      if (yeniAd !== ad) {
        fs.cpSync(tam, hedef, { recursive: true });
        n += 1;
      }
      gez(yeniAd !== ad ? hedef : tam);
    } else if (yeniAd !== ad && ad.endsWith('.html')) {
      fs.copyFileSync(tam, hedef);
      n += 1;
    }
  }
}
gez(dist);
console.log(`vercel-dinamik: ${n} dinamik rota kopyalandı`);
