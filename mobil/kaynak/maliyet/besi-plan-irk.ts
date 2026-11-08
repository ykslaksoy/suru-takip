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
  | 'karacabey_merinos'
  | 'asaf'
  | 'pirit_belirsiz'
  | 'sakiz'
  | 'diger';

export const HEDEF_IRK_ETIKET: Record<BesiHedefIrkKodu, string> = {
  generic_kuzu: 'Genel kuzu (ırk belirsiz)',
  kivircik: 'Kıvırcık',
  akkaraman: 'Akkaraman',
  ivesi: 'İvesi',
  merinos_capraz: 'Merinos melezi (genel)',
  karacabey_merinos: 'Karacabey Merinosu',
  asaf: 'Asaf',
  pirit_belirsiz: 'Pırıt — netleştirilecek',
  sakiz: 'Sakız',
  diger: 'Diğer (not)',
};

export type BesiKuzuCinsiyet = 'erkek' | 'disi' | 'karisik' | 'bilinmiyor';
export type BesiKuzuYasDurum = 'sutten_kesim' | 'genc' | 'bilinmiyor';

export const CINSIYET_ETIKET: Record<BesiKuzuCinsiyet, string> = {
  erkek: 'Erkek',
  disi: 'Dişi',
  karisik: 'Karışık grup',
  bilinmiyor: 'Bilinmiyor',
};

export const YAS_DURUM_ETIKET: Record<BesiKuzuYasDurum, string> = {
  sutten_kesim: 'Sütten kesim / damızlık öncesi',
  genc: 'Genç (sürüde)',
  bilinmiyor: 'Bilinmiyor',
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
  /** Tahmin bağlamı — ırktan bağımsız; boş = varsayım üretilmez */
  cinsiyet?: BesiKuzuCinsiyet | null;
  yasDurum?: BesiKuzuYasDurum | null;
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
    cinsiyet: null,
    yasDurum: null,
  };
}

export const HEDEF_IRK_SIRASI: BesiHedefIrkKodu[] = [
  'generic_kuzu',
  'kivircik',
  'akkaraman',
  'ivesi',
  'asaf',
  'karacabey_merinos',
  'merinos_capraz',
  'sakiz',
  'pirit_belirsiz',
  'diger',
];

export function irkAdgPolitikasi(t: BesiPlanIrkTaslak): IrkAdgPolitikasi {
  const uyari = [
    'Cinsiyet, yaş, sağlık ve yemleme ADG’yi değiştirir — ırk tek başına garanti değil.',
    'Plan taslak; onaylı hayvan ırk kaydına yazılmaz.',
  ];
  if (t.cinsiyet && t.cinsiyet !== 'bilinmiyor') uyari.push(`Cinsiyet: ${CINSIYET_ETIKET[t.cinsiyet]} — ADG bantları değişmez, bağlam notu.`);
  else if (t.cinsiyet == null) uyari.push('Cinsiyet girilmedi — tahminde genel bant.');
  if (t.yasDurum && t.yasDurum !== 'bilinmiyor') uyari.push(`Yaş/durum: ${YAS_DURUM_ETIKET[t.yasDurum]}`);
  if (t.hedefIrk === 'pirit_belirsiz') {
    uyari.push('Pırıt seçildi — Pırlak’a çevrilmedi; kullanıcı netleştirmesi bekleniyor (Diğer/not).');
  }
  if (t.hedefIrk === 'merinos_capraz') {
    uyari.push('Merinos melezi ≠ Karacabey Merinosu — belli Karacabey ise onu seçin.');
  }
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
    uyari.push('Pazardan toplama / ırk bilinmiyor — başlangıç muhafazakar 200 g/gün (NSW 150–250)');
    uyari.push('İyimser 320 g/gün varsayılan değil — yalnız karşılaştırma bandı');
    return {
      etiket: 'Genel kuzu — yeni giriş',
      varsayilanSenaryo: 'muhafazakar',
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
