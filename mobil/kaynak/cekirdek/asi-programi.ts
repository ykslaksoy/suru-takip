import type { Animal, HealthRecord, StockItem } from './tipler';

/** Standart aşı programı — 1 doz / hayvan · sabit ml */
export type AsiProgramKalemi = {
  id: string;
  ad: string;
  /** Stok adıyla eşleşme için anahtar kelimeler */
  stokAnahtarlar: string[];
  /** Son aşıdan sonra tekrar süresi (gün) */
  tekrarGun: number;
  /** Bu kadar gün kala “yaklaşan” sayılır */
  hatirlatmaGun: number;
  dozHayvan: number;
  /**
   * Hayvan başına sabit ml (şişe etiketi — tipik ürün).
   * null = çizik / damla / kg'ye göre (parazit)
   */
  mlHayvan: number | null;
  /** mlHayvan null iken gösterilecek kısa not */
  dozNotu?: string;
};

/** Ekranda "sabit 2 ml" / "çizik (etiket)" */
export function asiDozEtiketi(p: AsiProgramKalemi): string {
  if (p.mlHayvan != null) {
    const ml = String(p.mlHayvan).replace('.', ',');
    return `sabit ${ml} ml`;
  }
  return p.dozNotu ?? 'etikete bak';
}

/** Tüm koyun/kuzu aşıları — doz hayvan başına sabit ml (etiket) */
export const ASI_PROGRAMI: AsiProgramKalemi[] = [
  {
    id: 'karma',
    ad: 'Karma aşı (klostridiyal + pastörella)',
    stokAnahtarlar: ['karma', 'heptavac', 'kombine', 'çok bileşen'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'clostridial',
    ad: 'Clostridial aşı',
    stokAnahtarlar: ['clostridial', 'klostridial'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'enterotoksemi',
    ad: 'Enterotoksemi aşısı',
    stokAnahtarlar: ['enterotoksemi', 'enterotoxemia', 'çelertme'],
    tekrarGun: 180,
    hatirlatmaGun: 21,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'pasteurella',
    ad: 'Pastörella aşısı',
    stokAnahtarlar: ['pasteurella', 'pastörella', 'pastorella'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'septisemi',
    ad: 'Septisemi aşısı',
    stokAnahtarlar: ['septisemi', 'septicaemia'],
    tekrarGun: 180,
    hatirlatmaGun: 21,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'ektima',
    ad: 'Ektima (ORF) aşısı',
    stokAnahtarlar: ['ektima', 'ectima', 'orf'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: 'çizik (etiket)',
  },
  {
    id: 'tetanos',
    ad: 'Tetanoz toksoidi',
    stokAnahtarlar: ['tetanos', 'tetanoz', 'tetanus'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'ppr',
    ad: 'PPR (koyun-keçi vebası)',
    stokAnahtarlar: ['ppr', 'veba', 'koyun-keçi vebası'],
    tekrarGun: 365,
    hatirlatmaGun: 45,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'cicek',
    ad: 'Çiçek aşısı',
    stokAnahtarlar: ['çiçek', 'cicek', 'carbon', 'sheep pox'],
    tekrarGun: 365,
    hatirlatmaGun: 45,
    dozHayvan: 1,
    mlHayvan: 0.5,
  },
  {
    id: 'sap',
    ad: 'Şap aşısı',
    stokAnahtarlar: ['şap', 'sap', 'fmd'],
    tekrarGun: 180,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'brusella',
    ad: 'Brusella aşısı',
    stokAnahtarlar: ['brusella', 'brucella'],
    tekrarGun: 365,
    hatirlatmaGun: 45,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'sarbon',
    ad: 'Şarbon aşısı',
    stokAnahtarlar: ['şarbon', 'sarbon', 'anthrax', 'syanemberg'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'agalaksi',
    ad: 'Agalaksi (süt kesen) aşısı',
    stokAnahtarlar: ['agalaksi', 'agalactia', 'süt kesen'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'topallik',
    ad: 'Topallık / ayak aşısı',
    stokAnahtarlar: ['topallık', 'topallik', 'ayak', 'footrot'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'parazit',
    ad: 'Parazit programı',
    stokAnahtarlar: ['parazit', 'antiparasit', 'ivermektin'],
    tekrarGun: 180,
    hatirlatmaGun: 14,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: 'kg\'ye göre ml',
  },
];

export type AsiHayvanDurum = {
  animalId: string;
  earTag: string;
  sonAsiAt: string | null;
  durum: 'yapilacak' | 'yaklasiyor' | 'tamam';
  kalanGun: number | null;
};

export type AsiStokDurum = {
  programId: string;
  asiAdi: string;
  /** "sabit 2 ml" */
  mlEtiket: string;
  yapilacakSayisi: number;
  yaklasanSayisi: number;
  gerekenDoz: number;
  stokAdi: string | null;
  stokMiktar: number;
  stokBirim: string;
  stokYeterli: boolean;
  eksikDoz: number;
  sktYakin: boolean;
  hayvanlar: AsiHayvanDurum[];
};

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function eslesir(metin: string, anahtarlar: string[]): boolean {
  const n = normalize(metin);
  return anahtarlar.some((k) => n.includes(normalize(k)));
}

function aktifHayvanlar(animals: Animal[]): Animal[] {
  return animals.filter((a) => a.status !== 'sold' && a.status !== 'dead');
}

function sonAsiKaydi(
  animalId: string,
  program: AsiProgramKalemi,
  health: HealthRecord[]
): HealthRecord | null {
  const related = health
    .filter((h) => h.animalId === animalId && h.recordType === 'vaccine')
    .filter((h) => eslesir(`${h.medicine} ${h.treatment} ${h.diagnosis}`, [program.ad, ...program.stokAnahtarlar]))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  return related[0] ?? null;
}

function stokBul(program: AsiProgramKalemi, stock: StockItem[]): StockItem | null {
  const vaccines = stock.filter((s) => s.type === 'vaccine');
  return (
    vaccines.find((s) => eslesir(s.name, [program.ad, ...program.stokAnahtarlar])) ??
    stock.find((s) => eslesir(s.name, [program.ad, ...program.stokAnahtarlar])) ??
    null
  );
}

function sktYakinMi(expiryDate: string | null, gun = 60): boolean {
  if (!expiryDate) return false;
  const left = (new Date(expiryDate).getTime() - Date.now()) / 86400000;
  return left >= 0 && left <= gun;
}

/**
 * Yapılacak / yaklaşan aşılar ve stok yeterliliği.
 * gerekenDoz = (yapılacak + yaklaşan) × doz/hayvan
 */
export function hesaplaAsiStokDurumu(
  animals: Animal[],
  health: HealthRecord[],
  stock: StockItem[],
  now = Date.now()
): AsiStokDurum[] {
  const aktif = aktifHayvanlar(animals);

  return ASI_PROGRAMI.map((program) => {
    const hayvanlar: AsiHayvanDurum[] = aktif.map((a) => {
      const last = sonAsiKaydi(a.id, program, health);
      if (!last) {
        return {
          animalId: a.id,
          earTag: a.earTag,
          sonAsiAt: null,
          durum: 'yapilacak',
          kalanGun: null,
        };
      }
      const nextAt = new Date(last.recordedAt).getTime() + program.tekrarGun * 86400000;
      const kalanGun = Math.ceil((nextAt - now) / 86400000);
      let durum: AsiHayvanDurum['durum'] = 'tamam';
      if (kalanGun <= 0) durum = 'yapilacak';
      else if (kalanGun <= program.hatirlatmaGun) durum = 'yaklasiyor';
      return {
        animalId: a.id,
        earTag: a.earTag,
        sonAsiAt: last.recordedAt,
        durum,
        kalanGun,
      };
    });

    const yapilacakSayisi = hayvanlar.filter((h) => h.durum === 'yapilacak').length;
    const yaklasanSayisi = hayvanlar.filter((h) => h.durum === 'yaklasiyor').length;
    const gerekenDoz = (yapilacakSayisi + yaklasanSayisi) * program.dozHayvan;
    const item = stokBul(program, stock);
    const stokMiktar = item?.quantity ?? 0;
    const eksikDoz = Math.max(0, gerekenDoz - stokMiktar);

    return {
      programId: program.id,
      asiAdi: program.ad,
      mlEtiket: asiDozEtiketi(program),
      yapilacakSayisi,
      yaklasanSayisi,
      gerekenDoz,
      stokAdi: item?.name ?? null,
      stokMiktar,
      stokBirim: item?.unit ?? 'doz',
      stokYeterli: gerekenDoz === 0 || stokMiktar >= gerekenDoz,
      eksikDoz,
      sktYakin: item ? sktYakinMi(item.expiryDate) : false,
      hayvanlar,
    };
  }).filter((d) => d.yapilacakSayisi > 0 || d.yaklasanSayisi > 0 || (!d.stokYeterli && d.gerekenDoz > 0));
}

/** Bugün kartı / uyarılar için özet satırlar */
export function asiStokUyarilari(durumlar: AsiStokDurum[]): {
  id: string;
  baslik: string;
  aciklama: string;
  seviye: 'uyari' | 'sira';
}[] {
  const out: { id: string; baslik: string; aciklama: string; seviye: 'uyari' | 'sira' }[] = [];

  for (const d of durumlar) {
    if (d.gerekenDoz > 0 && !d.stokYeterli) {
      out.push({
        id: `asi-stok-${d.programId}`,
        baslik: 'Aşı stoğu yetersiz',
        aciklama: `${d.asiAdi} · ${d.gerekenDoz} doz gerekli, stokta ${d.stokMiktar} ${d.stokBirim} (eksik ${d.eksikDoz})`,
        seviye: 'uyari',
      });
    } else if (d.yapilacakSayisi > 0) {
      out.push({
        id: `asi-yap-${d.programId}`,
        baslik: 'Aşı yapılacak',
        aciklama: `${d.asiAdi} · ${d.yapilacakSayisi} hayvan · stok ${d.stokMiktar} ${d.stokBirim}`,
        seviye: 'sira',
      });
    } else if (d.yaklasanSayisi > 0) {
      out.push({
        id: `asi-yaklas-${d.programId}`,
        baslik: 'Aşı yaklaşıyor',
        aciklama: `${d.asiAdi} · ${d.yaklasanSayisi} hayvan · stok ${d.stokMiktar} ${d.stokBirim}`,
        seviye: 'sira',
      });
    }

    if (d.sktYakin && d.gerekenDoz > 0) {
      out.push({
        id: `asi-skt-${d.programId}`,
        baslik: 'Aşı SKT yakın',
        aciklama: `${d.stokAdi ?? d.asiAdi} · kullanılacak doz var, son kullanma yaklaşıyor`,
        seviye: 'uyari',
      });
    }
  }

  return out;
}
