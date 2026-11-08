/** t358u — plan hedef ırk / köken; hayvan kartı kaydı değiştirilmez. */

import type { AdgKanitSenaryo } from './besi-adg-kanit';
import { kanitGcaa } from './besi-adg-kanit';

export type BesiAlisKoken = 'uretim_suru' | 'pazar_toplama';
export type BesiIrkBilgi = 'irk_belli' | 'irk_kismen' | 'irk_bilinmiyor';

export type BesiHedefIrkKodu =
  | 'generic_kuzu'
  | 'kivircik'
  | 'akkaraman'
  | 'ivesi'
  | 'merinos_capraz'
  | 'sakiz'
  | 'diger';

export const HEDEF_IRK_ETIKET: Record<BesiHedefIrkKodu, string> = {
  generic_kuzu: 'Genel kuzu (ırk belirsiz)',
  kivircik: 'Kıvırcık',
  akkaraman: 'Akkaraman',
  ivesi: 'İvesi',
  merinos_capraz: 'Merinos melezi',
  sakiz: 'Sakız',
  diger: 'Diğer (not)',
};

export type BesiPlanIrkTaslak = {
  koken: BesiAlisKoken;
  irkBilgi: BesiIrkBilgi;
  hedefIrk: BesiHedefIrkKodu;
  hedefIrkNot?: string | null;
  /** Plan kapsamındaki baş — heterojenlik için */
  planBasSayisi?: number | null;
  bilinenIrkBas?: number | null;
  /** Tartım penceresinden g/gün — varsa senaryoyu ezer */
  olcumGcaaGramGun?: number | null;
  olcumBas?: string | null;
  olcumBit?: string | null;
};

export type IrkAdgPolitikasi = {
  etiket: string;
  varsayilanSenaryo: AdgKanitSenaryo;
  izinliSenaryolar: AdgKanitSenaryo[];
  /** İyimser üst gcaa — null ise ırk tavanı uygulanmaz */
  iyimserGcaaUst: number | null;
  heterojenlik: string | null;
  uyari: string[];
};

export function varsayilanIrkTaslak(): BesiPlanIrkTaslak {
  return {
    koken: 'pazar_toplama',
    irkBilgi: 'irk_bilinmiyor',
    hedefIrk: 'generic_kuzu',
    hedefIrkNot: null,
    planBasSayisi: null,
    bilinenIrkBas: null,
    olcumGcaaGramGun: null,
    olcumBas: null,
    olcumBit: null,
  };
}

export function irkAdgPolitikasi(t: BesiPlanIrkTaslak): IrkAdgPolitikasi {
  const uyari = [
    'Cinsiyet, yaş, sağlık ve yemleme ADG’yi değiştirir — ırk tek başına garanti değil.',
    'Plan taslak; onaylı hayvan ırk kaydına yazılmaz.',
  ];
  const karisik = t.koken === 'pazar_toplama' && (t.irkBilgi === 'irk_bilinmiyor' || t.irkBilgi === 'irk_kismen');
  const generic = t.hedefIrk === 'generic_kuzu' || karisik;

  let heterojenlik: string | null = null;
  if (t.planBasSayisi != null && t.bilinenIrkBas != null && t.planBasSayisi > 0) {
    const oran = Math.round((t.bilinenIrkBas / t.planBasSayisi) * 100);
    heterojenlik = `Bilinen ırk ≈ ${t.bilinenIrkBas}/${t.planBasSayisi} baş (%${oran})`;
    if (oran < 100) uyari.push('Karışık grup — adlandırılmış ırk max ADG tüm gruba yazılmaz');
  }

  if (t.olcumGcaaGramGun != null && t.olcumGcaaGramGun > 0) {
    uyari.push(`Gerçek tartım eğilimi: ${t.olcumGcaaGramGun} g/gün — senaryo yerine öncelik`);
    return {
      etiket: 'Ölçüm ağırlıklı',
      varsayilanSenaryo: 'beklenen',
      izinliSenaryolar: ['beklenen', 'muhafazakar', 'iyimser'],
      iyimserGcaaUst: t.olcumGcaaGramGun > 320 ? 350 : 320,
      heterojenlik,
      uyari,
    };
  }

  if (generic) {
    uyari.push('Pazardan toplama / ırk bilinmiyor — genel 200–320 g/gün (NSW DPI aralığı)');
    return {
      etiket: 'Genel kuzu senaryosu',
      varsayilanSenaryo: 'beklenen',
      izinliSenaryolar: ['muhafazakar', 'beklenen', 'iyimser'],
      iyimserGcaaUst: 320,
      heterojenlik,
      uyari,
    };
  }

  /** Belli ırk + üretim/pazar belli — yine kanıtlı genel aralık; ırka özel sabit max yok */
  const irkAd = HEDEF_IRK_ETIKET[t.hedefIrk];
  uyari.push(`${irkAd} seçildi — yine literatür aralığı; 8 model tablo max’ı kullanılmaz`);
  return {
    etiket: irkAd,
    varsayilanSenaryo: 'beklenen',
    izinliSenaryolar: ['muhafazakar', 'beklenen', 'iyimser'],
    iyimserGcaaUst: 320,
    heterojenlik,
    uyari,
  };
}

export function adgSenaryoIrkUygunMu(senaryo: AdgKanitSenaryo, politika: IrkAdgPolitikasi): boolean {
  return politika.izinliSenaryolar.includes(senaryo);
}

export function efektifGcaaGramGun(
  senaryo: AdgKanitSenaryo,
  t: BesiPlanIrkTaslak,
): { gcaa: number | null; kaynak: string } {
  if (t.olcumGcaaGramGun != null && t.olcumGcaaGramGun > 0) {
    return { gcaa: t.olcumGcaaGramGun, kaynak: 'tartım eğilimi' };
  }
  const p = irkAdgPolitikasi(t);
  const k = kanitGcaa(senaryo);
  let gcaa = k.gcaaGramGun;
  if (senaryo === 'iyimser' && p.iyimserGcaaUst != null && gcaa > p.iyimserGcaaUst) {
    gcaa = p.iyimserGcaaUst;
  }
  return { gcaa, kaynak: `${p.etiket} · ${k.kaynakAd}` };
}
