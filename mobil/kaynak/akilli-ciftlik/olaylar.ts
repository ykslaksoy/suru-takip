import type { AkilliCiftlikDurum, OyunOlay } from './tipler';

function olayId(gun: number, kod: string): string {
  return `ol-${gun}-${kod}`;
}

/** Öğretici, kurgusal olaylar — gerçek ölüm oranı tahmini değil */
export function degerlendirOlaylar(once: AkilliCiftlikDurum, sonra: AkilliCiftlikDurum): OyunOlay[] {
  const yeni: OyunOlay[] = [];

  if (sonra.bakim.kesifAniGecis && !once.bakim.kesifAniGecis) {
    yeni.push({
      id: olayId(sonra.gun, 'kesif'),
      gun: sonra.gun,
      baslik: 'Kesif yemde ani değişim',
      metin:
        'Karkasların pH ve mikroflorası bozulabilir. Yavaş geçiş ve veteriner/rasyon danışmanlığı gerekir — bu olay öğretici kurgudur.',
      kurgusal: true,
      onlem: '7–10 günde kademeli geçiş; aniden yüksek kesif vermeyin.',
    });
  }

  if (!sonra.bakim.suVeTemizlikIy && once.bakim.suVeTemizlikIy) {
    yeni.push({
      id: olayId(sonra.gun, 'su'),
      gun: sonra.gun,
      baslik: 'Su / padok hijyeni zayıf',
      metin: 'Susuzluk ve kirli yatak ishale ve strese yol açar. Kayıplar simülasyonda semboliktir.',
      kurgusal: true,
      onlem: 'Temiz su, kuru yatak, havalandırma.',
    });
  }

  if (sonra.bakim.karantinaIhlal) {
    yeni.push({
      id: olayId(sonra.gun, 'karantina'),
      gun: sonra.gun,
      baslik: 'Karantina ihlali',
      metin: 'Yeni gelenler ayrı tutulmalı. Bulaşı riski eğitim senaryosunda vurgulanır.',
      kurgusal: true,
      onlem: 'Yeni alımları 2–3 hafta gözlem padokunda tutun.',
    });
  }

  if (sonra.gun >= 30 && !sonra.bakim.asiProgramiYapti && sonra.kuzuBas > 0) {
    yeni.push({
      id: olayId(sonra.gun, 'asi-hatirlat'),
      gun: sonra.gun,
      baslik: 'Aşı takvimi',
      metin: 'Aşılar belirli hastalıklara karşı riski azaltır; %100 koruma garantisi yok — veteriner planı şart.',
      kurgusal: true,
      onlem: 'İşletme aşı takvimini veterinerle belirleyin.',
    });
  }

  return yeni;
}

export type KayipKarar = {
  kayipBas: number;
  neden: string;
  finansalEtkiBas: number | null;
};

/** Deterministik, öğretici kayıp — vitamin dozundan türetilmez */
export function ogreticiKayipHesapla(durum: AkilliCiftlikDurum, tohum: number): KayipKarar | null {
  if (durum.kuzuBas <= 0) return null;
  let risk = 0;
  if (durum.bakim.kesifAniGecis) risk += 1;
  if (!durum.bakim.suVeTemizlikIy) risk += 1;
  if (durum.bakim.karantinaIhlal) risk += 1;
  if (risk === 0) return null;

  const mod = (durum.gun + tohum) % 5;
  if (mod !== 0 && risk < 2) return null;

  const kayipBas = risk >= 2 && durum.kuzuBas > 3 ? 1 : 0;
  if (kayipBas === 0) return null;

  const alisBas =
    durum.fiyatlar.kuzu_alis_kg * durum.girisKgOrt * (1 + (durum.toplamIsletmeGideri / Math.max(durum.kuzuBas, 1) / 5000));

  return {
    kayipBas,
    neden: 'Öğretici kurgu — bakım hatası kombinasyonu (gerçek sürü kaydı değil)',
    finansalEtkiBas: Math.round(alisBas),
  };
}
