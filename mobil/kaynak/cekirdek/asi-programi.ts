import type { Animal, HealthRecord, StockItem } from './tipler';
import { hayvanAnaEtiket } from './hayvan-etiket';

/** Standart aşı / parazit programı — 1 doz / hayvan */
export type AsiProgramKategori = 'asi' | 'parazit';

export type AsiProgramKalemi = {
  id: string;
  /** Ne için — hastalık / koruma (büyük gösterim) */
  koruma: string;
  /** Aşının / ilacın kendi adı — parantez içinde küçük */
  ad: string;
  /** Stok adıyla eşleşme için anahtar kelimeler */
  stokAnahtarlar: string[];
  /** Son uygulamadan sonra tekrar süresi (gün) */
  tekrarGun: number;
  /** Bu kadar gün kala “yaklaşan” sayılır */
  hatirlatmaGun: number;
  dozHayvan: number;
  /**
   * Hayvan başına sabit ml (şişe etiketi — tipik ürün).
   * null = çizik / hap / kg'ye göre
   */
  mlHayvan: number | null;
  /** mlHayvan null iken gösterilecek kısa not */
  dozNotu?: string;
  /** Devlet / resmi program notu */
  devletNotu?: string;
  /** Varsayılan: aşı. Parazit hapı / iğnesi için 'parazit' */
  kategori?: AsiProgramKategori;
  /** false → görevde yalnızca planlı (acil/sırada değil) */
  oncelikli?: boolean;
};

/** Görev listesinde acil/sırada sayılır mı (varsayılan: evet) */
export function asiGorevOncelikliMi(programId: string): boolean {
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  return p?.oncelikli !== false;
}

/** Ekranda "sabit 2 ml" / "1 hap / 10 kg" */
export function asiDozEtiketi(p: AsiProgramKalemi): string {
  if (p.mlHayvan != null) {
    const ml = String(p.mlHayvan).replace('.', ',');
    return `sabit ${ml} ml`;
  }
  return p.dozNotu ?? 'etikete bak';
}

export function asiKategori(p: AsiProgramKalemi): AsiProgramKategori {
  return p.kategori ?? 'asi';
}

/** Tüm koyun/kuzu aşıları + parazit hapları/iğneleri */
export const ASI_PROGRAMI: AsiProgramKalemi[] = [
  {
    id: 'karma',
    koruma: 'Karma aşı',
    ad: 'Klostridiyal + pastörella',
    stokAnahtarlar: ['karma', 'heptavac', 'kombine', 'çok bileşen'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'pasteurella',
    koruma: 'Solunum',
    ad: 'Pastörella aşısı',
    stokAnahtarlar: ['pasteurella', 'pastörella', 'pastorella', 'solunum'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'clostridial',
    koruma: 'Klostridiyal',
    ad: 'Clostridial aşı',
    stokAnahtarlar: ['clostridial', 'klostridial'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'enterotoksemi',
    koruma: 'Enterotoksemi',
    ad: 'Çelertme aşısı',
    stokAnahtarlar: ['enterotoksemi', 'enterotoxemia', 'çelertme'],
    tekrarGun: 180,
    hatirlatmaGun: 21,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'septisemi',
    koruma: 'Septisemi',
    ad: 'Septisemi aşısı',
    stokAnahtarlar: ['septisemi', 'septicaemia'],
    tekrarGun: 180,
    hatirlatmaGun: 21,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  {
    id: 'ektima',
    koruma: 'Ektima',
    ad: 'ORF aşısı',
    stokAnahtarlar: ['ektima', 'ectima', 'orf'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: 'çizik (etiket)',
  },
  {
    id: 'tetanos',
    koruma: 'Tetanoz',
    ad: 'Tetanoz toksoidi',
    stokAnahtarlar: ['tetanos', 'tetanoz', 'tetanus'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'ppr',
    koruma: 'Veba',
    ad: 'PPR aşısı',
    stokAnahtarlar: ['ppr', 'veba', 'koyun-keçi vebası'],
    tekrarGun: 365,
    hatirlatmaGun: 45,
    dozHayvan: 1,
    mlHayvan: 1,
    devletNotu: 'Devlet — kuzu/oğlak destek şartı · VETBİS kaydı (Trakya muaf)',
  },
  {
    id: 'cicek',
    koruma: 'Çiçek',
    ad: 'Çiçek aşısı',
    stokAnahtarlar: ['çiçek', 'cicek', 'carbon', 'sheep pox'],
    tekrarGun: 365,
    hatirlatmaGun: 45,
    dozHayvan: 1,
    mlHayvan: 0.5,
    devletNotu: 'Devlet — kuzu/oğlak destek şartı · VETBİS kaydı',
  },
  {
    id: 'sap',
    koruma: 'Şap',
    ad: 'Şap aşısı',
    stokAnahtarlar: ['şap', 'sap', 'fmd'],
    tekrarGun: 180,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
    devletNotu: 'Devlet programı — il/ilçe müdürlüğü takvimi',
  },
  {
    id: 'brusella',
    koruma: 'Brusella',
    ad: 'Brusella aşısı',
    stokAnahtarlar: ['brusella', 'brucella'],
    tekrarGun: 365,
    hatirlatmaGun: 45,
    dozHayvan: 1,
    mlHayvan: 1,
    devletNotu: 'Devlet programı — resmi brusella (Rev1)',
  },
  {
    id: 'sarbon',
    koruma: 'Şarbon',
    ad: 'Şarbon aşısı',
    stokAnahtarlar: ['şarbon', 'sarbon', 'anthrax', 'syanemberg'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
    devletNotu: 'Devlet — bölgesel risk programı',
  },
  {
    id: 'agalaksi',
    koruma: 'Süt kesen',
    ad: 'Agalaksi aşısı',
    stokAnahtarlar: ['agalaksi', 'agalactia', 'süt kesen'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 1,
  },
  {
    id: 'topallik',
    koruma: 'Topallık',
    ad: 'Ayak aşısı',
    stokAnahtarlar: ['topallık', 'topallik', 'ayak', 'footrot'],
    tekrarGun: 365,
    hatirlatmaGun: 30,
    dozHayvan: 1,
    mlHayvan: 2,
  },
  /** —— Parazit hapları / iğneleri —— */
  {
    id: 'albendazol',
    koruma: 'İç parazit hapı',
    ad: 'Albendazol',
    stokAnahtarlar: ['albendazol', 'albendezole', 'iç parazit hap'],
    tekrarGun: 90,
    hatirlatmaGun: 14,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: '1 hap / 10 kg (etiket)',
    kategori: 'parazit',
  },
  {
    id: 'levamizol',
    koruma: 'İç parazit',
    ad: 'Levamizol hap / solüsyon',
    stokAnahtarlar: ['levamizol', 'levamisole'],
    tekrarGun: 90,
    hatirlatmaGun: 14,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: "kg'ye göre hap veya ml",
    kategori: 'parazit',
  },
  {
    id: 'triklabendazol',
    koruma: 'Kelebek hapı',
    ad: 'Triklabendazol',
    stokAnahtarlar: ['triklabendazol', 'triclabendazole', 'kelebek'],
    tekrarGun: 120,
    hatirlatmaGun: 21,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: '1 hap / kg bandı (etiket)',
    kategori: 'parazit',
  },
  {
    id: 'oksiklozanid',
    koruma: 'Kelebek',
    ad: 'Oksiklozanid',
    stokAnahtarlar: ['oksiklozanid', 'oxyclozanide', 'kelebek'],
    tekrarGun: 120,
    hatirlatmaGun: 21,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: "kg'ye göre ml / hap",
    kategori: 'parazit',
  },
  {
    id: 'ivermektin',
    koruma: 'İç-dış parazit',
    ad: 'İvermektin iğne',
    stokAnahtarlar: ['ivermektin', 'ivermectin', 'parazit'],
    tekrarGun: 180,
    hatirlatmaGun: 14,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: "kg'ye göre ml (iğne)",
    kategori: 'parazit',
  },
  {
    id: 'doramektin',
    koruma: 'Parazit iğne',
    ad: 'Doramektin',
    stokAnahtarlar: ['doramektin', 'doramectin'],
    tekrarGun: 180,
    hatirlatmaGun: 14,
    dozHayvan: 1,
    mlHayvan: null,
    dozNotu: "kg'ye göre ml",
    kategori: 'parazit',
  },
];

export type AsiHayvanDurum = {
  animalId: string;
  earTag: string;
  /** Ekranda gösterim — sırt / küpe */
  etiket: string;
  sonAsiAt: string | null;
  durum: 'yapilacak' | 'yaklasiyor' | 'tamam';
  kalanGun: number | null;
};

export type AsiStokDurum = {
  programId: string;
  /** Ne için — hastalık / koruma */
  koruma: string;
  /** Aşı adı */
  asiAdi: string;
  /** "sabit 2 ml" */
  mlEtiket: string;
  /** Devlet / resmi program notu */
  devletNotu?: string;
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
  const kategori = asiKategori(program);
  const related = health
    .filter((h) => {
      if (h.animalId !== animalId) return false;
      if (kategori === 'parazit') {
        return h.recordType === 'vaccine' || h.recordType === 'treatment';
      }
      return h.recordType === 'vaccine';
    })
    .filter((h) =>
      eslesir(`${h.medicine} ${h.treatment} ${h.diagnosis}`, [
        program.koruma,
        program.ad,
        ...program.stokAnahtarlar,
      ])
    )
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  return related[0] ?? null;
}

function stokBul(program: AsiProgramKalemi, stock: StockItem[]): StockItem | null {
  const anahtarlar = [program.koruma, program.ad, ...program.stokAnahtarlar];
  if (asiKategori(program) === 'parazit') {
    const medicines = stock.filter((s) => s.type === 'medicine');
    return (
      medicines.find((s) => eslesir(s.name, anahtarlar)) ??
      stock.find((s) => eslesir(s.name, anahtarlar)) ??
      null
    );
  }
  const vaccines = stock.filter((s) => s.type === 'vaccine');
  return (
    vaccines.find((s) => eslesir(s.name, anahtarlar)) ??
    stock.find((s) => eslesir(s.name, anahtarlar)) ??
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
          etiket: hayvanAnaEtiket(a),
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
        etiket: hayvanAnaEtiket(a),
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
      koruma: program.koruma,
      asiAdi: program.ad,
      mlEtiket: asiDozEtiketi(program),
      devletNotu: program.devletNotu,
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
    const tur = ASI_PROGRAMI.find((p) => p.id === d.programId);
    const parazit = tur ? asiKategori(tur) === 'parazit' : false;
    const birimAd = parazit ? 'Parazit' : 'Aşı';

    if (d.gerekenDoz > 0 && !d.stokYeterli) {
      out.push({
        id: `asi-stok-${d.programId}`,
        baslik: `${birimAd} stoğu yetersiz`,
        aciklama: `${d.koruma} (${d.asiAdi}) ${d.mlEtiket} · ${d.gerekenDoz} doz gerekli, stokta ${d.stokMiktar} ${d.stokBirim} (eksik ${d.eksikDoz})`,
        seviye: 'uyari',
      });
    } else if (d.yapilacakSayisi > 0) {
      out.push({
        id: `asi-yap-${d.programId}`,
        baslik: `${birimAd} yapılacak`,
        aciklama: `${d.koruma} (${d.asiAdi}) ${d.mlEtiket} · ${d.yapilacakSayisi} hayvan · stok ${d.stokMiktar} ${d.stokBirim}`,
        seviye: 'sira',
      });
    } else if (d.yaklasanSayisi > 0) {
      out.push({
        id: `asi-yaklas-${d.programId}`,
        baslik: `${birimAd} yaklaşıyor`,
        aciklama: `${d.koruma} (${d.asiAdi}) ${d.mlEtiket} · ${d.yaklasanSayisi} hayvan · stok ${d.stokMiktar} ${d.stokBirim}`,
        seviye: 'sira',
      });
    }

    if (d.sktYakin && d.gerekenDoz > 0) {
      out.push({
        id: `asi-skt-${d.programId}`,
        baslik: `${birimAd} SKT yakın`,
        aciklama: `${d.stokAdi ?? `${d.koruma} (${d.asiAdi})`} · kullanılacak doz var, son kullanma yaklaşıyor`,
        seviye: 'uyari',
      });
    }
  }

  return out;
}
