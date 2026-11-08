import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestModul } from '../cerceve';
import {
  parseKullaniciOndalikFiyat,
  parseTobbOtKuzusuHtml,
  parseUkonKuzuHtml,
  parseUskYemHtml,
} from '@/kaynak/maliyet/besi-referans-parse';
import { besiReferanslariFixtureIle, piyasaKayitlariniParseIleGuncelle } from '@/kaynak/maliyet/besi-referans-yenile';
import {
  efektifBirimFiyat,
  referansOverrideAyarla,
  referansOverrideTemizle,
} from '@/kaynak/maliyet/besi-referans-override';
import { gomuluPiyasaKayitlari } from '@/kaynak/maliyet/besi-piyasa-kayit';
import { VARSAYILAN_ALIS_CANLI_KG_FIYAT } from '@/kaynak/maliyet/besi-plan-alis';

const FIX = join(process.cwd(), 'test/fixtures/besi-referans');
const g = 'Besi referans yenileme t366u';

function fixture(ad: string): string {
  return readFileSync(join(FIX, ad), 'utf8');
}

export const besiReferansYenileModul: TestModul = {
  grup: g,
  calistir() {
    const tobb = fixture('tobb-kuzu.html');
    const ukon = fixture('ukon-fiyatlar.html');
    const usk = fixture('usk-yem.html');
    const tobbParse = parseTobbOtKuzusuHtml(tobb);
    const ukonParse = parseUkonKuzuHtml(ukon);
    const uskParse = parseUskYemHtml(usk);
    const birlesik = besiReferanslariFixtureIle(tobb, ukon, usk);
    const edirne = birlesik.piyasa.kayitlar.find((k) => k.id === 'tobb-edirne-kasaplik-kuzu');
    const ege = birlesik.piyasa.kayitlar.find((k) => k.id === 'ukon-kuzu-ege');
    const bal = birlesik.piyasa.kayitlar.find((k) => k.id === 'balikesir-kuzu-canli-kg-agustos2026');
    const yonca = birlesik.yemTablo.kalemler.find((k) => k.id === 'yonca-kuru');

    referansOverrideAyarla('alis_canli_kg', 480);
    const ov = efektifBirimFiyat(VARSAYILAN_ALIS_CANLI_KG_FIYAT, 'alis_canli_kg');
    referansOverrideTemizle('alis_canli_kg');
    const reset = efektifBirimFiyat(VARSAYILAN_ALIS_CANLI_KG_FIYAT, 'alis_canli_kg');

    const kayitlarDegismedi = piyasaKayitlariniParseIleGuncelle(
      gomuluPiyasaKayitlari(),
      {
        ok: true,
        alinmaTarihi: '2026-11-08',
        yenilemeSonuc: 'ag_ok',
        parse: { tobb: tobbParse, ukon: ukonParse, usk: uskParse },
        uyari: [],
        iz: tobbParse.ok ? tobbParse.iz : [],
        otomatik: {},
        kaynaklar: { tobb: 'fixture', ukon: 'fixture', usk: 'fixture' },
      },
      '2026-11-08',
    );
    const bal2 = kayitlarDegismedi.find((k) => k.id === 'balikesir-kuzu-canli-kg-agustos2026');

    return [
      test(g, 'TOBB parse trace', tobbParse.ok && tobbParse.iz.some((z) => z.startsWith('tobb:edirne'))),
      test(g, 'TOBB Edirne 397.38', tobbParse.ok && tobbParse.veri.some((s) => s.borsaKod === 'edirne' && s.ortalama === 397.38)),
      test(g, 'UKON parse', ukonParse.ok && ukonParse.veri.bolgeler.some((b) => b.bolgeId === 'ukon-kuzu-ege' && b.kuzuKg === 665)),
      test(g, 'USK yonca', uskParse.ok && uskParse.veri.find((u) => u.id === 'yonca-kuru')?.fiyat === 12.91),
      test(g, 'birleşik önbellek', birlesik.piyasa.depo.yenilemeSonuc === 'önbellek_ok'),
      test(g, 'fixture edirne durum', edirne?.durum === 'önbellek'),
      test(g, 'balikesir bayat korunur', bal?.durum === 'bayat' && bal2?.durum === 'bayat'),
      test(g, 'balikesir tarih değişmedi', bal?.islemTarihi === '2026-08-31' && bal2?.islemTarihi === '2026-08-31'),
      test(g, 'override 480', ov.kaynak === 'override' && ov.deger === 480),
      test(g, 'reset referans 500', reset.kaynak === 'referans' && reset.deger === 500),
      test(g, 'virgül 12,5', parseKullaniciOndalikFiyat('12,5') === 12.5),
      test(g, 'nokta 12.5', parseKullaniciOndalikFiyat('12.5') === 12.5),
      test(g, 'sıfır geçersiz', parseKullaniciOndalikFiyat('0') === 'gecersiz_sifir'),
      test(g, 'bozuk TOBB fail', !parseTobbOtKuzusuHtml(fixture('tobb-bozuk.html')).ok),
      test(g, 'Ege karkas', ege?.deger === 665),
      test(g, 'yonca tablo', yonca?.fiyat === 12.91),
    ];
  },
};
