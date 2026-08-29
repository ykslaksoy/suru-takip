import { v4 as uuidv4 } from 'uuid';
import { ASI_PROGRAMI, asiDozEtiketi, asiKategori, type AsiProgramKalemi } from '@/kaynak/cekirdek/asi-programi';
import type { Animal, StockItem } from '@/kaynak/cekirdek/tipler';
import { addHealthRecord, adjustStock, getStockItems } from '@/kaynak/cekirdek/veritabani';
import { kaydetKatalogKullanim } from '@/kaynak/stok/kullanim';
import { getKuzular, planGuncelle, type AsiPlani } from './asi-modu';

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

function programBul(id: string): AsiProgramKalemi | undefined {
  return ASI_PROGRAMI.find((p) => p.id === id);
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

export type AsiUygulaSonuc = {
  ok: boolean;
  hayvanSayisi: number;
  kayitSayisi: number;
  stokDusum: number;
  stokAdi: string | null;
  stokUyari: string | null;
  message: string;
};

/**
 * Planı uygula: her kuzuya aşı sağlık kaydı + stoktan doz düşümü.
 * Parazit programı da kayıt yazar; stok yoksa uyarı verir, kayıt yine yapılır.
 */
export async function uygulaAsiPlani(plan: AsiPlani): Promise<AsiUygulaSonuc> {
  if (plan.uygulandi) {
    return {
      ok: false,
      hayvanSayisi: 0,
      kayitSayisi: 0,
      stokDusum: 0,
      stokAdi: null,
      stokUyari: null,
      message: 'Bu plan zaten uygulanmış.',
    };
  }

  const program = programBul(plan.programId);
  if (!program) {
    return {
      ok: false,
      hayvanSayisi: 0,
      kayitSayisi: 0,
      stokDusum: 0,
      stokAdi: null,
      stokUyari: null,
      message: 'Aşı programı bulunamadı.',
    };
  }

  const kuzular = await getKuzular();
  if (kuzular.length === 0) {
    return {
      ok: false,
      hayvanSayisi: 0,
      kayitSayisi: 0,
      stokDusum: 0,
      stokAdi: null,
      stokUyari: null,
      message: 'Kayıtlı kuzu yok.',
    };
  }

  const mlEtiket = asiDozEtiketi(program);
  const medicine = `${program.koruma} (${program.ad})`;
  const recordedAt = plan.tarih.includes('T') ? plan.tarih : `${plan.tarih}T12:00:00.000Z`;
  const kayitTipi = asiKategori(program) === 'parazit' ? 'treatment' : 'vaccine';
  const etiket = asiKategori(program) === 'parazit' ? 'parazit' : 'aşı';

  let kayitSayisi = 0;
  for (const hayvan of kuzular) {
    await addHealthRecord({
      id: uuidv4(),
      animalId: hayvan.id,
      recordType: kayitTipi,
      symptoms: '',
      diagnosis: program.koruma,
      treatment: `${program.ad} · ${mlEtiket}`,
      medicine,
      withdrawalDays: 0,
      vetName: 'Aşı / parazit planı',
      recordedAt,
      notes: [
        `Plan: ${plan.id.slice(0, 8)}`,
        program.devletNotu ?? '',
        `Küpe: ${hayvan.earTag}`,
      ]
        .filter(Boolean)
        .join(' · '),
    });
    kayitSayisi += 1;
  }

  const stock = await getStockItems();
  const item = stokBul(program, stock);
  const gerekenDoz = kuzular.length * program.dozHayvan;
  let stokDusum = 0;
  let stokUyari: string | null = null;
  let stokAdi: string | null = null;

  if (!item) {
    stokUyari = `Stokta "${program.koruma}" bulunamadı — sağlık kaydı yazıldı, stok düşülmedi.`;
  } else if (item.quantity < gerekenDoz) {
    stokAdi = item.name;
    const dusulecek = Math.max(0, item.quantity);
    if (dusulecek > 0) {
      await adjustStock(item.id, 'out', dusulecek, `${etiket} planı · ${plan.tarih} · ${kuzular.length} hayvan`);
      await kaydetKatalogKullanim(program.id, dusulecek);
      stokDusum = dusulecek;
    }
    stokUyari = `Stok yetersiz: ${gerekenDoz} doz gerekli, ${item.quantity} vardı — ${dusulecek} düşüldü.`;
  } else {
    stokAdi = item.name;
    await adjustStock(item.id, 'out', gerekenDoz, `${etiket} planı · ${plan.tarih} · ${kuzular.length} hayvan`);
    await kaydetKatalogKullanim(program.id, gerekenDoz);
    stokDusum = gerekenDoz;
  }

  const guncel: AsiPlani = {
    ...plan,
    hayvanSayisi: kuzular.length,
    uygulandi: true,
    uygulandiAt: new Date().toISOString(),
  };
  await planGuncelle(guncel);

  return {
    ok: true,
    hayvanSayisi: kuzular.length,
    kayitSayisi,
    stokDusum,
    stokAdi,
    stokUyari,
    message: `${kayitSayisi} ${etiket} kaydı · ${stokDusum} doz stok${stokUyari ? ` · ${stokUyari}` : ''}`,
  };
}

/** Tek hayvana tek aşı — küpe / id ile */
export async function uygulaAsiHayvana(opts: {
  animal: Animal;
  programId: string;
  tarih?: string;
}): Promise<{ ok: boolean; message: string }> {
  const program = programBul(opts.programId);
  if (!program) return { ok: false, message: 'Program yok' };

  const mlEtiket = asiDozEtiketi(program);
  const medicine = `${program.koruma} (${program.ad})`;
  const recordedAt = opts.tarih ?? new Date().toISOString();
  const kayitTipi = asiKategori(program) === 'parazit' ? 'treatment' : 'vaccine';

  await addHealthRecord({
    id: uuidv4(),
    animalId: opts.animal.id,
    recordType: kayitTipi,
    symptoms: '',
    diagnosis: program.koruma,
    treatment: `${program.ad} · ${mlEtiket}`,
    medicine,
    withdrawalDays: 0,
    vetName: 'Aşı / parazit uygulaması',
    recordedAt,
    notes: program.devletNotu ?? '',
  });

  const stock = await getStockItems();
  const item = stokBul(program, stock);
  if (item && item.quantity >= program.dozHayvan) {
    await adjustStock(item.id, 'out', program.dozHayvan, `Aşı · ${opts.animal.earTag}`);
    await kaydetKatalogKullanim(program.id, program.dozHayvan);
    return { ok: true, message: `${opts.animal.earTag} · ${medicine} · ${mlEtiket} · stok −${program.dozHayvan}` };
  }

  return {
    ok: true,
    message: item
      ? `${opts.animal.earTag} kaydedildi — stok yetersiz (${item.quantity})`
      : `${opts.animal.earTag} kaydedildi — stok kalemi yok`,
  };
}
