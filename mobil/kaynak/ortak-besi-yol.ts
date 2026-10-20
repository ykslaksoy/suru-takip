/**
 * Ortak satın alım + besiye alınmış kuzu besi adımı kanıtları (Mod 5 & 7).
 */
import {
  getAllHealthRecordsForAsi,
  getStockItems,
  getStockMovements,
  getWeightRecords,
} from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { besiYolundaMi, type KuzuYonHedef } from '@/kaynak/kuzu-yonlendirme';

const KARANTINA_GUN = 5;

function gunFarki(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export type OrtakBesiAdimId =
  | 'kuzu-alim'
  | 'karantina'
  | 'asi-giris'
  | 't0-besi'
  | 'rasyon-besi'
  | 'besi-donem'
  | 'tartim-besi';

export type OrtakBesiKanit = { id: OrtakBesiAdimId; tamam: boolean; kanit: string };

export async function tespitOrtakBesiKanitlari(
  besiKuzular: Animal[],
  hedef: Record<string, KuzuYonHedef>,
): Promise<OrtakBesiKanit[]> {
  const liste = besiKuzular.filter((a) => besiYolundaMi(a, hedef));
  const n = liste.length;
  const health = await getAllHealthRecordsForAsi();
  const asiIds = new Set(health.filter((h) => h.recordType === 'vaccine').map((h) => h.animalId));
  const feedIds = new Set((await getStockItems('feed')).map((s) => s.id));
  const yemCikis = (await getStockMovements()).some(
    (m) => m.movementType === 'out' && feedIds.has(m.stockId),
  );

  let t0 = 0;
  let ara = 0;
  for (const a of liste) {
    const w = await getWeightRecords(a.id);
    if (w.length >= 1) t0 += 1;
    if (w.length >= 2) ara += 1;
  }

  const asi = liste.filter((a) => asiIds.has(a.id)).length;
  const esik = Math.max(1, Math.floor(n / 2));
  const enEski = liste.map((a) => gunFarki(a.createdAt)).reduce((m, g) => Math.max(m, g), -1);
  const karantinaNot =
    liste.some((a) => /karantina/i.test(`${a.notes} ${a.paddock}`)) ||
    health.some((h) => /karantina/i.test(`${h.notes} ${h.diagnosis}`));

  const alimTamam = n >= 1;
  const karantinaTamam =
    n > 0 && (karantinaNot || enEski >= KARANTINA_GUN || asi >= 1);
  const asiTamam = n > 0 && asi >= esik;
  const t0Tamam = n > 0 && t0 >= esik;
  const rasyonTamam = n > 0 && (yemCikis || t0 >= 1);
  const besiTamam = n > 0 && yemCikis;
  const tartimTamam = n > 0 && ara >= 1;

  return [
    {
      id: 'kuzu-alim',
      tamam: alimTamam,
      kanit: alimTamam ? `${n} besi kuzusu (satın alım veya besiye alınmış)` : 'Besi kuzusu ekleyin veya besiye alın',
    },
    {
      id: 'karantina',
      tamam: karantinaTamam,
      kanit: karantinaTamam
        ? `Karantina süreci (${enEski >= 0 ? enEski : 0} gün)`
        : 'Karantina notu veya ≥5 gün bekleyin',
    },
    {
      id: 'asi-giris',
      tamam: asiTamam,
      kanit: asiTamam ? `${asi}/${n} kuzu giriş aşısı` : 'Giriş paketi: karma, ivermektin, albendazol, selen-E',
    },
    {
      id: 't0-besi',
      tamam: t0Tamam,
      kanit: t0Tamam ? `${t0} kuzuda T1 tartım` : 'Besi T1 tartımı girin',
    },
    {
      id: 'rasyon-besi',
      tamam: rasyonTamam,
      kanit: rasyonTamam ? 'Besi yem planı / çıkışı var' : 'Besi rasyonu bağlayın',
    },
    {
      id: 'besi-donem',
      tamam: besiTamam,
      kanit: besiTamam ? 'Besi dönemi yem çıkışı kayıtlı' : 'Günlük yem takibi',
    },
    {
      id: 'tartim-besi',
      tamam: tartimTamam,
      kanit: tartimTamam ? `${ara} kuzuda ara tartım` : 'Ara tartım girin',
    },
  ];
}
