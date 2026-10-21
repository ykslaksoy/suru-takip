import { calculateADG, getAnimals, getLatestWeight, getLowStockItems } from '@/kaynak/cekirdek/veritabani';
import { getBugunGorevleri, type Gorev } from '@/kaynak/gorevler/liste';
import { getSmartSuggestions, type SmartSuggestion } from '@/kaynak/akilli-kuzu/oneri';
import { getAsiTakvimiDurumu } from '@/kaynak/saglik/asi-takvimi';
import { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hafta-listesi';

export const KILITLI_ANA_BASLIK = 'Akıllı Kuzu';
export const KILITLI_SEZON_ETIKET = '2026 Sezonu';

export type AnaSayfaPartiTon = 'a' | 'b' | 'c';

export type AnaSayfaParti = {
  harf: 'A' | 'B' | 'C';
  ad: string;
  yasEtiket: string;
  bas: number;
  ton: AnaSayfaPartiTon;
  /** Son tartımların ortalaması (kg) — tartım yoksa null */
  ortKg?: number | null;
};

/** Ana sayfa "Bugün yapılacaklar" satırı — görev veya Akıllı Kuzu önerisinden */
export type AnaSayfaIs = {
  id: string;
  seviye: 'kritik' | 'acil' | 'aksiyon' | 'gorev';
  kaynak: string;
  baslik: string;
  aciklama: string;
  href: string;
};

export type AnaSayfaOzet = {
  hayvanSayisi: number;
  gorevSayisi: number;
  partiler: AnaSayfaParti[];
  kritik: number;
  aksiyon: number;
  /** Sezon kuzularının ortalama günlük canlı ağırlık artışı (g/gün) — veri yoksa null */
  ortAdgGram?: number | null;
  /** En acil 3 iş (kritik → acil görev → aksiyon → diğer görev) */
  bugunIsler?: AnaSayfaIs[];
  /** Kilitli ana ekran aşı kısayolu */
  asiKestirme?: AnaSayfaAsiKestirme | null;
};

export type AnaSayfaAsiKestirme = {
  baslik: string;
  aciklama: string;
  href: string;
  vurgu: boolean;
  rozet?: string;
};

const ONERI_HREF: Record<SmartSuggestion['source'], string> = {
  karantina: '/(tabs)/akilli-kuzu',
  asi: '/gorevler/asi',
  tartim: '/seri-giris',
  rasyon: '/(tabs)/rasyon',
  stok: '/(tabs)/stok',
  saglik: '/(tabs)/saglik',
  genel: '/(tabs)/akilli-kuzu',
};

function oneridenIs(s: SmartSuggestion): AnaSayfaIs {
  return {
    id: `oneri-${s.id}`,
    seviye: s.urgency === 'alert' ? 'kritik' : 'aksiyon',
    kaynak: s.source,
    baslik: s.title,
    aciklama: s.body,
    href: ONERI_HREF[s.source],
  };
}

function gorevdenIs(g: Gorev): AnaSayfaIs {
  return {
    id: `gorev-${g.id}`,
    seviye: g.seviye === 'uyari' ? 'acil' : 'gorev',
    kaynak: g.kaynak,
    baslik: g.baslik,
    aciklama: g.aciklama,
    href: g.kaynak === 'asi' ? '/gorevler/asi' : g.href,
  };
}

/** Görev + öneri birleştir; aynı kaynaktan (ör. aşı) tekrarı at, en fazla 3 */
export function bugunIsleriniSec(gorevler: Gorev[], oneriler: SmartSuggestion[], limit = 3): AnaSayfaIs[] {
  const kritik = oneriler.filter((o) => o.urgency === 'alert');
  const aksiyon = oneriler.filter((o) => o.urgency === 'action');
  const acilGorev = gorevler.filter((g) => g.seviye === 'uyari');
  const digerGorev = gorevler.filter((g) => g.seviye !== 'uyari');
  const sirali: AnaSayfaIs[] = [
    ...kritik.map(oneridenIs),
    ...acilGorev.map(gorevdenIs),
    ...aksiyon.map(oneridenIs),
    ...digerGorev.map(gorevdenIs),
  ];
  const gorulen = new Set<string>();
  const out: AnaSayfaIs[] = [];
  for (const is of sirali) {
    if (gorulen.has(is.kaynak)) continue;
    gorulen.add(is.kaynak);
    out.push(is);
    if (out.length >= limit) break;
  }
  return out;
}

function ortalama(sayilar: (number | null)[]): number | null {
  const v = sayilar.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((s, n) => s + n, 0) / v.length;
}

/** Kilitli sezon yaş etiketleri — Grok 2026-09-07 */
export const KILITLI_PADOKLAR: Omit<AnaSayfaParti, 'bas'>[] = [
  { harf: 'A', ad: 'Padok A', yasEtiket: '2–2,5 aylık', ton: 'a' },
  { harf: 'B', ad: 'Padok B', yasEtiket: '3,5 aylık', ton: 'b' },
  { harf: 'C', ad: 'Padok C', yasEtiket: '4,5 aylık', ton: 'c' },
];



const PADOK_KUZU_ON_EK: Record<string, string> = {
  'Padok A': 'padok-a-kuzu-',
  'Padok B': 'padok-b-grup-',
  'Padok C': 'padok-c-grup-',
};

function sezonKuzuMu(id: string, padok: string): boolean {
  const ek = PADOK_KUZU_ON_EK[padok];
  return Boolean(ek && id.startsWith(ek));
}

function asiKestirmesiHesapla(durumlar: Awaited<ReturnType<typeof getAsiTakvimiDurumu>>): AnaSayfaAsiKestirme {
  const hafta = asiBuHaftaListesi(durumlar);
  if (hafta.length > 0) {
    const s = hafta[0];
    const ek = hafta.length > 1 ? ` (+${hafta.length - 1})` : '';
    return {
      baslik: s.durum === 'yapilacak' ? 'Sıradaki aşı' : 'Yaklaşan aşı',
      aciklama: `${s.koruma} (${s.asiAdi}) · ${s.etiket || s.earTag || 'kuzu'}${ek}`,
      href: `/gorevler/asi/${s.programId}`,
      vurgu: true,
      rozet: s.durum === 'yapilacak' ? 'Yap' : undefined,
    };
  }
  const yapilacak = durumlar.find((d) => d.yapilacakSayisi > 0);
  if (yapilacak) {
    return {
      baslik: 'Aşı yapılacak',
      aciklama: `${yapilacak.koruma} (${yapilacak.asiAdi}) · ${yapilacak.yapilacakSayisi} kuzu`,
      href: `/gorevler/asi/${yapilacak.programId}`,
      vurgu: true,
      rozet: `${yapilacak.yapilacakSayisi}`,
    };
  }
  return {
    baslik: 'Aşı ve İlaç',
    aciklama: 'Plan, katalog ve hatırlatmalar',
    href: '/gorevler/asi',
    vurgu: false,
  };
}

export async function getAnaSayfaOzeti(): Promise<AnaSayfaOzet> {
  const [hayvanlar, gorevler, asiDurum] = await Promise.all([
    getAnimals(),
    getBugunGorevleri(3),
    getAsiTakvimiDurumu().catch(() => [] as Awaited<ReturnType<typeof getAsiTakvimiDurumu>>),
  ]);
  const aktif = (padok: string) =>
    hayvanlar.filter((a) => sezonKuzuMu(a.id, padok) && a.status !== 'sold' && a.status !== 'dead');
  const partiler = await Promise.all(
    KILITLI_PADOKLAR.map(async (p) => {
      const liste = aktif(p.ad);
      const kilolar = await Promise.all(liste.map((a) => getLatestWeight(a.id).catch(() => null)));
      const ort = ortalama(kilolar);
      return { ...p, bas: liste.length, ortKg: ort == null ? null : Math.round(ort * 10) / 10 };
    }),
  );
  const sezonKuzulari = KILITLI_PADOKLAR.flatMap((p) => aktif(p.ad));
  const adgler = await Promise.all(sezonKuzulari.map((a) => calculateADG(a.id).catch(() => null)));
  const ortAdg = ortalama(adgler);
  // Gerçek veriden bağlam (eski sabit demo bağlamı yerine): düşük stok + ortalama günlük artış
  const dusukStok = await getLowStockItems().catch(() => []);
  const oneriler = getSmartSuggestions({
    lowStock: dusukStok.length > 0,
    lowStockAdlar: dusukStok.map((s) => s.name),
    adgGrams: ortAdg == null ? null : Math.round(ortAdg),
  });
  return {
    hayvanSayisi: partiler.reduce((s, p) => s + p.bas, 0),
    gorevSayisi: gorevler.length,
    partiler,
    kritik: oneriler.filter((s) => s.urgency === 'alert').length,
    aksiyon: oneriler.filter((s) => s.urgency === 'action').length,
    ortAdgGram: ortAdg == null ? null : Math.round(ortAdg),
    bugunIsler: bugunIsleriniSec(gorevler, oneriler),
    asiKestirme: asiKestirmesiHesapla(asiDurum),
  };
}
