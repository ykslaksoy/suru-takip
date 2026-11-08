/** t358u / t364u — plan hedef ırk / köken; hayvan kartı kaydı değiştirilmez. */

import type { AdgKanitSenaryo } from './besi-adg-kanit';
import { kanitGcaa } from './besi-adg-kanit';
import {
  HEDEF_IRK_ETIKET,
  type BesiHedefIrkKodu,
  irkGrup,
  isGecerliHedefIrkKodu,
  normalizeHedefIrkKodu,
} from './besi-plan-irk-katalog';

export type { BesiHedefIrkKodu };
export { HEDEF_IRK_ETIKET, isGecerliHedefIrkKodu, normalizeHedefIrkKodu, kanonikHedefIrkKayit } from './besi-plan-irk-katalog';

export type BesiAlisKoken = 'uretim_suru' | 'pazar_toplama';
export type BesiIrkBilgi = 'irk_belli' | 'irk_kismen' | 'irk_bilinmiyor';

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
  planBasSayisi?: number | null;
  bilinenIrkBas?: number | null;
  olcumGcaaGramGun?: number | null;
  olcumBas?: string | null;
  olcumBit?: string | null;
  cinsiyet?: BesiKuzuCinsiyet | null;
  yasDurum?: BesiKuzuYasDurum | null;
};

export type IrkAdgPolitikasi = {
  etiket: string;
  varsayilanSenaryo: AdgKanitSenaryo;
  izinliSenaryolar: AdgKanitSenaryo[];
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

export function irkAdgPolitikasi(t: BesiPlanIrkTaslak): IrkAdgPolitikasi {
  const uyari = [
    'Cinsiyet, yaş, sağlık ve yemleme ADG’yi değiştirir — ırk tek başına garanti değil.',
    'Plan taslak; onaylı hayvan ırk kaydına yazılmaz.',
  ];
  if (t.cinsiyet && t.cinsiyet !== 'bilinmiyor') uyari.push(`Cinsiyet: ${CINSIYET_ETIKET[t.cinsiyet]} — ADG bantları değişmez, bağlam notu.`);
  else if (t.cinsiyet == null) uyari.push('Cinsiyet girilmedi — tahminde genel bant.');
  if (t.yasDurum && t.yasDurum !== 'bilinmiyor') uyari.push(`Yaş/durum: ${YAS_DURUM_ETIKET[t.yasDurum]}`);
  if (normalizeHedefIrkKodu(t.hedefIrk) === 'pirlak') {
    uyari.push('Pırlak (Pırıt) — plan etiketi; ırka özel büyüme sabiti yok.');
  }
  if (t.hedefIrk === 'merinos_capraz') {
    uyari.push('Merinos melezi ≠ Karacabey / OAM / Anadolu Merinosu — belliyse onu seçin.');
  }
  if (t.hedefIrk === 'asaf') {
    uyari.push('Asaf — geliştirilmiş ırk (Ostfriesisch × İvesi); yerli genotip etiketi değil.');
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

  const irkAd = HEDEF_IRK_ETIKET[t.hedefIrk] ?? HEDEF_IRK_ETIKET[normalizeHedefIrkKodu(t.hedefIrk)];
  const grup = irkGrup(t.hedefIrk);
  if (grup === 'yabanci') uyari.push(`${irkAd} — yabancı ırk seçildi; yaygınlık iddiası yok.`);
  uyari.push(`${irkAd} seçildi — yine literatür aralığı; ırka özel max tablo yok`);
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
