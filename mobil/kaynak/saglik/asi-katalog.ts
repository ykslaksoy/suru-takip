import type { Animal, HealthRecord, StockItem } from '@/kaynak/cekirdek/tipler';
import { getAnimals, getAllHealthRecordsForAsi, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { gorevTarihMetni } from '@/kaynak/gorevler/liste';
import {
  ASI_PROGRAMI,
  asiKategori,
  hesaplaAsiStokDurumu,
  type AsiProgramKalemi,
} from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI, type VitaminKalemi } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  takviyeKatalogMeta,
  type TakviyeKatalogMeta,
  type TakviyeKatalogTip,
} from '@/kaynak/saglik/asi-katalog-meta';

export type { TakviyeKatalogTip } from '@/kaynak/saglik/asi-katalog-meta';
export { takviyeKatalogIdGecerli, takviyeKatalogMeta } from '@/kaynak/saglik/asi-katalog-meta';

export type TakviyeKatalogOzeti = TakviyeKatalogMeta & {
  stokAdi: string | null;
  stokMiktar: number;
  stokBirim: string;
  gerekenDoz: number;
  stokYeterli: boolean;
  eksikDoz: number;
  yapilacakSayisi: number;
  yaklasanSayisi: number;
  sonUygulamaAt: string | null;
  sonUygulamaEtiket: string;
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

function stokBulAsi(program: AsiProgramKalemi, stock: StockItem[]): StockItem | null {
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

function stokBulVitamin(v: VitaminKalemi, stock: StockItem[]): StockItem | null {
  const anahtarlar = [v.ad, v.detay, ...v.stokAnahtarlar];
  const sup = stock.filter((s) => s.type === 'supplement' || s.type === 'medicine');
  return (
    sup.find((s) => eslesir(s.name, anahtarlar)) ??
    stock.find((s) => eslesir(s.name, anahtarlar)) ??
    null
  );
}

function sonAsiSurude(
  program: AsiProgramKalemi,
  animals: Animal[],
  health: HealthRecord[],
): string | null {
  const kategori = asiKategori(program);
  let enSon: string | null = null;
  for (const a of aktifHayvanlar(animals)) {
    const related = health
      .filter((h) => {
        if (h.animalId !== a.id) return false;
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
        ]),
      )
      .sort((x, y) => new Date(y.recordedAt).getTime() - new Date(x.recordedAt).getTime());
    const t = related[0]?.recordedAt;
    if (t && (!enSon || t > enSon)) enSon = t;
  }
  return enSon;
}

function sonVitaminSurude(v: VitaminKalemi, animals: Animal[], health: HealthRecord[]): string | null {
  let enSon: string | null = null;
  const anahtarlar = [v.ad, v.detay, ...v.stokAnahtarlar];
  for (const a of aktifHayvanlar(animals)) {
    const related = health
      .filter((h) => h.animalId === a.id)
      .filter((h) => h.recordType === 'vaccine' || h.recordType === 'treatment')
      .filter((h) => eslesir(`${h.medicine} ${h.treatment} ${h.diagnosis}`, anahtarlar))
      .sort((x, y) => new Date(y.recordedAt).getTime() - new Date(x.recordedAt).getTime());
    const t = related[0]?.recordedAt;
    if (t && (!enSon || t > enSon)) enSon = t;
  }
  return enSon;
}

function sonUygulamaMetni(tarih: string | null): string {
  if (!tarih) return 'Henüz kayıt yok';
  return gorevTarihMetni(tarih, { yil: true });
}

/** Doz, yer, stok ve sürüdeki son uygulama — ASI_PROGRAMI + vitamin (ör. selen-e). */
export async function getTakviyeKatalogOzeti(programId: string): Promise<TakviyeKatalogOzeti | null> {
  const meta = takviyeKatalogMeta(programId);
  if (!meta) return null;

  const [animals, health, stock] = await Promise.all([
    getAnimals(),
    getAllHealthRecordsForAsi(),
    getStockItems(),
  ]);

  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (p) {
    const durum = hesaplaAsiStokDurumu(animals, health, stock).find((d) => d.programId === programId);
    const item = stokBulAsi(p, stock);
    const sonAt = sonAsiSurude(p, animals, health);
    return {
      ...meta,
      stokAdi: durum?.stokAdi ?? item?.name ?? null,
      stokMiktar: durum?.stokMiktar ?? item?.quantity ?? 0,
      stokBirim: durum?.stokBirim ?? item?.unit ?? 'doz',
      gerekenDoz: durum?.gerekenDoz ?? 0,
      stokYeterli: durum?.stokYeterli ?? true,
      eksikDoz: durum?.eksikDoz ?? 0,
      yapilacakSayisi: durum?.yapilacakSayisi ?? 0,
      yaklasanSayisi: durum?.yaklasanSayisi ?? 0,
      sonUygulamaAt: sonAt,
      sonUygulamaEtiket: sonUygulamaMetni(sonAt),
    };
  }

  const v = VITAMIN_PROGRAMI.find((x) => x.id === programId)!;
  const item = stokBulVitamin(v, stock);
  const sonAt = sonVitaminSurude(v, animals, health);
  return {
    ...meta,
    stokAdi: item?.name ?? null,
    stokMiktar: item?.quantity ?? 0,
    stokBirim: item?.unit ?? 'ml',
    gerekenDoz: 0,
    stokYeterli: true,
    eksikDoz: 0,
    yapilacakSayisi: 0,
    yaklasanSayisi: 0,
    sonUygulamaAt: sonAt,
    sonUygulamaEtiket: sonUygulamaMetni(sonAt),
  };
}
