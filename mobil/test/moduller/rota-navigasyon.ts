import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DAHA_MENUSU, KILITLI_HIZLI_ISLEMLER, KILITLI_DOCK } from '@/sabitler/HizliIslemler';
import { test, type TestModul } from '../cerceve';

const KOK = join(__dirname, '..', '..');

/** Expo Router yolu → olası dosya konumları */
function rotaDosyalari(href: string): string[] {
  const yol = href.split('?')[0].replace(/^\//, '').replace(/^\(tabs\)\//, '');
  const parcalar = yol.split('/').filter(Boolean);
  if (!parcalar.length) return [join(KOK, 'app/(tabs)/index.tsx')];
  const adaylar: string[] = [];
  if (href.includes('(tabs)')) {
    adaylar.push(join(KOK, 'app/(tabs)', ...parcalar, 'index.tsx'));
  }
  adaylar.push(join(KOK, 'app', ...parcalar, 'index.tsx'));
  if (parcalar.length === 1) adaylar.push(join(KOK, 'app', `${parcalar[0]}.tsx`));
  return adaylar;
}

function rotaVarMi(href?: string): boolean {
  if (!href) return true;
  return rotaDosyalari(href).some((p) => existsSync(p));
}

export const rotaNavigasyonModul: TestModul = {
  grup: 'Rota navigasyon',
  calistir() {
    const g = 'Rota navigasyon';
    const r: ReturnType<typeof test>[] = [];
    for (const item of DAHA_MENUSU) {
      if (item.ayarlar || !item.href) continue;
      r.push(test(g, `Daha: ${item.label}`, rotaVarMi(item.href)));
    }
    for (const item of KILITLI_HIZLI_ISLEMLER) {
      r.push(test(g, `Hızlı: ${item.label}`, rotaVarMi(item.href)));
    }
    for (const tab of KILITLI_DOCK) {
      const yol =
        tab.name === 'index'
          ? join(KOK, 'app/(tabs)/index.tsx')
          : join(KOK, 'app/(tabs)', tab.name, 'index.tsx');
      r.push(test(g, `Dock: ${tab.title}`, existsSync(yol)));
    }
    r.push(
      test(g, 'Gecmis ekranı', existsSync(join(KOK, 'app/gecmis/index.tsx'))),
      test(
        g,
        'Gecmis sekme query senkron',
        /useEffect\([\s\S]*params\.sekme/.test(readFileSync(join(KOK, 'app/gecmis/index.tsx'), 'utf8')),
      ),
    );
    return r;
  },
};
