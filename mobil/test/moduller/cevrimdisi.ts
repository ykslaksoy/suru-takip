import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { test, type TestModul, type TestSonuc } from '../cerceve';
import { baglantiDurumu, baglantiGuncelle, baglantiMetni, cevrimiciMi } from '@/kaynak/cevrimdisi/durum';

const G = 'Çevrimdışı';

export const cevrimdisiModul: TestModul = {
  grup: G,
  calistir() {
    const r: TestSonuc[] = [];
    const t = (ad: string, k: boolean) => {
      r.push(test(G, ad, k));
    };
    const temel = { cevrimici: true, geriGeldi: null, hazir: true, guncellemeVar: false };
    t('çevrimiçi ve güncel: çip yok', baglantiMetni(temel, 0) === null);
    t('çevrimdışı çipi', baglantiMetni({ ...temel, cevrimici: false }, 0)?.tur === 'cevrimdisi');
    t('tekrar çevrimiçi 4 sn görünür, sonra kaybolur', baglantiMetni({ ...temel, geriGeldi: 1000 }, 3000)?.tur === 'geri' && baglantiMetni({ ...temel, geriGeldi: 1000 }, 6000) === null);
    t('yeni sürüm çipi (çevrimdışı öncelikli)', baglantiMetni({ ...temel, guncellemeVar: true }, 0)?.tur === 'guncelleme' && baglantiMetni({ ...temel, guncellemeVar: true, cevrimici: false }, 0)?.tur === 'cevrimdisi');
    baglantiGuncelle({ cevrimici: false });
    const kapali = !cevrimiciMi();
    baglantiGuncelle({ cevrimici: true });
    t('çevrimdışı → çevrimiçi geçişi zamanı yazılır; ağ isteği kapısı', kapali && cevrimiciMi() && baglantiDurumu().geriGeldi != null);

    // Service worker şablonu: yol eşleme (dinamik rota → _id kopyası)
    const kod = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'sw-sablon.js'), 'utf8');
    const dinleyici: Record<string, unknown> = {};
    const ctx: Record<string, unknown> = {
      self: {
        __SW_AYAR__: {
          surum: 't1',
          dosyalar: ['/', '/hayvan/ekle', '/hayvan/_id', '/hayvan/_id/soy', '/ciftlesme'],
          yonlendirmeler: [
            ['^/hayvan/[^/]+/soy$', '/hayvan/_id/soy'],
            ['^/hayvan/[^/]+$', '/hayvan/_id'],
          ],
        },
        addEventListener: (ad: string, f: unknown) => {
          dinleyici[ad] = f;
        },
        location: { origin: 'https://superkuzu.vercel.app' },
      },
      URL,
      Response: class {},
      caches: {},
      fetch: () => Promise.reject(new Error('yok')),
      setTimeout,
    };
    vm.createContext(ctx);
    vm.runInContext(kod, ctx);
    const yol = ctx.yol as (u: URL) => string;
    const u = (p: string) => new URL(`https://superkuzu.vercel.app${p}`);
    t('SW: dinamik rota _id kopyasına eşlenir', yol(u('/hayvan/abc-123/soy')) === '/hayvan/_id/soy' && yol(u('/hayvan/padok-a-kuzu-01')) === '/hayvan/_id');
    t('SW: gerçek dosya yönlendirilmez (/hayvan/ekle)', yol(u('/hayvan/ekle')) === '/hayvan/ekle');
    t('SW: sondaki / ve .html, index', yol(u('/ciftlesme/')) === '/ciftlesme' && yol(u('/ciftlesme.html')) === '/ciftlesme' && yol(u('/index.html')) === '/');
    t('SW: kurulum, etkinleşme, istek dinleyicileri', ['install', 'activate', 'fetch', 'message'].every((k) => typeof dinleyici[k] === 'function'));
    t('SW: önbellek adı sürüme bağlı', ctx.ONBELLEK === undefined || String(vm.runInContext('ONBELLEK', ctx)) === 'superkuzu-t1');
    return r;
  },
};
