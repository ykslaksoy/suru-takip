import { v4 as uuidv4 } from 'uuid';
import { ASI_PROGRAMI, asiDozEtiketi, asiKategori, type AsiProgramKalemi } from '@/kaynak/cekirdek/asi-programi';
import type { Animal, StockItem } from '@/kaynak/cekirdek/tipler';
import { addHealthRecord, adjustStock, getStockItems, getStockMovements } from '@/kaynak/cekirdek/veritabani';
import { kaydetKatalogKullanim } from '@/kaynak/stok/kullanim';
import {
  asiDozEtiketiStok,
  asiHareketIzAnahtar,
  asiMetaOku,
  asiPartiSec,
  asiSaglikStokIzNotu,
  asiStokAdaylari,
  asiStokDusumPlanla,
  stokGorunenAd,
} from '@/kaynak/stok/asi-urun-meta';
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

  const medicine = `${program.koruma} (${program.ad})`;
  const recordedAt = plan.tarih.includes('T') ? plan.tarih : `${plan.tarih}T12:00:00.000Z`;
  const kayitTipi = asiKategori(program) === 'parazit' ? 'treatment' : 'vaccine';
  const etiket = asiKategori(program) === 'parazit' ? 'parazit' : 'aşı';

  const stock = await getStockItems();
  const adaylar =
    asiKategori(program) === 'parazit'
      ? []
      : asiStokAdaylari(program.id, [program.koruma, program.ad, ...program.stokAnahtarlar], stock);
  const legacy = stokBul(program, stock);
  const item = asiPartiSec(adaylar.length ? adaylar : legacy ? [legacy] : []);
  const mlKaynak = asiDozEtiketiStok(program.dozHayvan, item);
  const mlEtiket = mlKaynak.bilinmiyor
    ? `${asiDozEtiketi(program)} · etiket dozu eksik`
    : mlKaynak.etiket;
  const stokIz =
    item && asiKategori(program) !== 'parazit'
      ? asiSaglikStokIzNotu({
          stockId: item.id,
          partiLot: asiMetaOku(item)?.partiLot ?? null,
          miktar: mlKaynak.birimDoz,
          birim: item.unit,
          urunAd: stokGorunenAd(item),
        })
      : null;

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
        stokIz ?? '',
      ]
        .filter(Boolean)
        .join(' · '),
    });
    kayitSayisi += 1;
  }
  const gerekenDoz = kuzular.length * mlKaynak.birimDoz;
  let stokDusum = 0;
  let stokUyari: string | null = null;
  let stokAdi: string | null = null;

  if (!item) {
    stokUyari = `Stokta "${program.koruma}" bulunamadı — sağlık kaydı yazıldı, stok düşülmedi.`;
  } else {
    const meta = asiMetaOku(item);
    const iz = asiHareketIzAnahtar(plan.id, item.id, meta?.partiLot ?? null);
    const hareketler = await getStockMovements({ stockId: item.id });
    const planD = asiStokDusumPlanla(
      item.quantity,
      gerekenDoz,
      hareketler.map((h) => h.notes),
      iz,
    );
    stokAdi = stokGorunenAd(item);
    if (planD.ciftSayim) {
      stokUyari = 'Bu plan için bu parti stoktan zaten düşülmüş (çift düşüm engellendi).';
    } else if (planD.dusulecek <= 0) {
      stokUyari = `Stok yetersiz veya boş (${item.quantity}) — kayıt yazıldı, düşüm yok.`;
    } else {
      const not = [
        etiket,
        'planı',
        plan.tarih,
        `${kuzular.length} hayvan`,
        iz,
        meta?.partiLot ? `lot ${meta.partiLot}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      await adjustStock(item.id, 'out', planD.dusulecek, not);
      await kaydetKatalogKullanim(meta?.sablonKatalogId ?? program.id, planD.dusulecek);
      stokDusum = planD.dusulecek;
      if (adaylar.length > 1) {
        stokUyari = `${adaylar.length} parti var — bu düşüm: ${stokAdi} (SKT yakın tek parti).`;
      }
      if (planD.eksik > 0) {
        stokUyari = `Stok yetersiz: ${gerekenDoz} gerekli — ${planD.dusulecek} düşüldü.`;
      }
      if (mlKaynak.bilinmiyor) {
        stokUyari = [stokUyari, 'Ürün etiket dozu girilmedi — miktar program dozuna göre.'].filter(Boolean).join(' ');
      }
    }
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
  const adaylar =
    asiKategori(program) === 'parazit'
      ? []
      : asiStokAdaylari(program.id, [program.koruma, program.ad, ...program.stokAnahtarlar], stock);
  const legacy = stokBul(program, stock);
  const item = asiPartiSec(adaylar.length ? adaylar : legacy ? [legacy] : []);
  const mlKaynak = asiDozEtiketiStok(program.dozHayvan, item);
  const doz = mlKaynak.birimDoz;
  const meta = item ? asiMetaOku(item) : null;
  const iz = item ? asiHareketIzAnahtar(`${opts.animal.id}:${program.id}`, item.id, meta?.partiLot ?? null) : '';
  if (item) {
    const hareketler = await getStockMovements({ stockId: item.id });
    const planD = asiStokDusumPlanla(item.quantity, doz, hareketler.map((h) => h.notes), iz);
    if (planD.dusulecek > 0 && !planD.ciftSayim) {
      await adjustStock(
        item.id,
        'out',
        planD.dusulecek,
        [`Aşı`, opts.animal.earTag, iz, meta?.partiLot ? `lot ${meta.partiLot}` : ''].filter(Boolean).join(' · '),
      );
      await kaydetKatalogKullanim(meta?.sablonKatalogId ?? program.id, planD.dusulecek);
      return {
        ok: true,
        message: `${opts.animal.earTag} · ${medicine} · ${mlKaynak.etiket} · stok −${planD.dusulecek} (${stokGorunenAd(item)})`,
      };
    }
  }

  return {
    ok: true,
    message: item
      ? `${opts.animal.earTag} kaydedildi — stok yetersiz (${item.quantity})`
      : `${opts.animal.earTag} kaydedildi — stok kalemi yok`,
  };
}
