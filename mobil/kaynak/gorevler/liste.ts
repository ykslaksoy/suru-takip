import {
  getActiveWithdrawals,
  getAnimals,
  getHealthRecords,
  getLatestWeight,
  getLowStockItems,
  getStockItems,
} from '@/kaynak/cekirdek/veritabani';
import { asiStokUyarilari, hesaplaAsiStokDurumu } from '@/kaynak/cekirdek/asi-programi';
import { asiBuHaftaListesi } from '@/kaynak/saglik/asi-hatirlatma';
import { getAktifModId, getMod } from '@/sabitler/Modlar';
import { getMod1BirlesikIlerleme, sonrakiAcikAdim } from '@/kaynak/besi-ortak';
import { getMod2BirlesikIlerleme, sonrakiAcikAdimMod2 } from '@/kaynak/besi-koc-kat';
import { getMod3BirlesikIlerleme, sonrakiAcikAdimMod3 } from '@/kaynak/damizlik';
import { getMod4BirlesikIlerleme, sonrakiAcikAdimMod4 } from '@/kaynak/sut';
import { getPlanlananGorevler } from '@/kaynak/gorevler/planlanan';
import type { StockItem } from '@/kaynak/cekirdek/tipler';

export type GorevSeviye = 'uyari' | 'sira' | 'plan' | 'bilgi';
export type GorevKaynak =
  | 'bekletme'
  | 'asi'
  | 'stok'
  | 'saglik'
  | 'tartim'
  | 'yolculuk'
  | 'planlanan';

export type Gorev = {
  id: string;
  seviye: GorevSeviye;
  kaynak: GorevKaynak;
  baslik: string;
  aciklama: string;
  href: string;
  cta: string;
  /** YYYY-MM-DD — planlı gün (yoksa bugün/acil) */
  tarih?: string;
  tamamlanabilir?: boolean;
  tamam?: boolean;
};

function kalanGun(recordedAt: string, withdrawalDays: number): number {
  const bitis = new Date(recordedAt).getTime() + withdrawalDays * 86400000;
  return Math.max(0, Math.ceil((bitis - Date.now()) / 86400000));
}

function dusukTakviyeler(items: StockItem[]): StockItem[] {
  return items.filter((i) => i.type === 'supplement' && i.quantity <= i.minQuantity);
}

function sktYakinTakviyeler(items: StockItem[], gun = 60): StockItem[] {
  const limit = Date.now() + gun * 86400000;
  return items.filter(
    (i) =>
      i.type === 'supplement' &&
      i.expiryDate &&
      new Date(i.expiryDate).getTime() <= limit &&
      new Date(i.expiryDate).getTime() >= Date.now()
  );
}

async function yolculukGorevi(): Promise<Gorev | null> {
  const modId = await getAktifModId();
  const mod = getMod(modId);
  if (modId === 'mod1') {
    const m = await getMod1BirlesikIlerleme();
    const sonraki = sonrakiAcikAdim(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  if (modId === 'mod2') {
    const m = await getMod2BirlesikIlerleme();
    const sonraki = sonrakiAcikAdimMod2(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  if (modId === 'mod3') {
    const m = await getMod3BirlesikIlerleme();
    const sonraki = sonrakiAcikAdimMod3(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  if (modId === 'mod4') {
    const m = await getMod4BirlesikIlerleme();
    const sonraki = sonrakiAcikAdimMod4(m.tamamlanan);
    if (!sonraki) return null;
    const kanit = m.kanitlar.find((k) => k.id === sonraki.id);
    return {
      id: `yolculuk-${sonraki.id}`,
      seviye: 'sira',
      kaynak: 'yolculuk',
      baslik: `${mod.icon} ${sonraki.baslik}`,
      aciklama: kanit?.kanit ?? sonraki.aciklama,
      href: '/(tabs)/yolculuk',
      cta: 'Yolculuğa git',
    };
  }
  return null;
}

/**
 * Tüm planlanan / bekleyen görevler — limit yok.
 * Kaynaklar: bekletme, aşı, stok, sağlık, tartım, yolculuk adımı, elle planlanan.
 */
export async function getGorevler(): Promise<Gorev[]> {
  const out: Gorev[] = [];

  const withdrawals = await getActiveWithdrawals();
  if (withdrawals.length > 0) {
    const sorted = [...withdrawals].sort(
      (a, b) =>
        kalanGun(a.recordedAt, a.withdrawalDays) - kalanGun(b.recordedAt, b.withdrawalDays)
    );
    const first = sorted[0];
    const gun = kalanGun(first.recordedAt, first.withdrawalDays);
    out.push({
      id: 'bekletme',
      seviye: 'uyari',
      kaynak: 'bekletme',
      baslik: 'Bekletme',
      aciklama:
        withdrawals.length === 1
          ? `${first.earTag ?? 'Hayvan'} · ${first.medicine} · ${gun} gün kaldı`
          : `${withdrawals.length} hayvan bekletmede · en yakın ${gun} gün`,
      href: '/(tabs)/saglik',
      cta: 'Sağlığa bak',
    });
  }

  const animals = await getAnimals();
  const health = await getHealthRecords();
  const stock = await getStockItems();
  const asiDurum = hesaplaAsiStokDurumu(animals, health, stock);

  for (const u of asiStokUyarilari(asiDurum)) {
    out.push({
      id: u.id,
      seviye: u.seviye === 'uyari' ? 'uyari' : 'sira',
      kaynak: 'asi',
      baslik: u.baslik,
      aciklama: u.aciklama,
      href: u.baslik.includes('stok') || u.baslik.includes('SKT') ? '/(tabs)/stok' : '/(tabs)/saglik',
      cta: u.baslik.includes('stok') || u.baslik.includes('SKT') ? 'Stoka git' : 'Aşıya bak',
    });
  }

  for (const s of asiBuHaftaListesi(asiDurum).slice(0, 20)) {
    // Özet uyarılar zaten var; hayvan satırlarını ayrı görev olarak ekle
    out.push({
      id: `asi-hayvan-${s.programId}-${s.animalId}`,
      seviye: s.durum === 'yapilacak' ? 'uyari' : 'sira',
      kaynak: 'asi',
      baslik: `${s.asiAdi}`,
      aciklama:
        s.durum === 'yapilacak'
          ? `${s.earTag || 'Hayvan'} · aşı zamanı geldi`
          : `${s.earTag || 'Hayvan'} · ${s.kalanGun ?? '?'} gün içinde`,
      href: `/hayvan/${s.animalId}/saglik`,
      cta: 'Kayıt aç',
    });
  }

  const dusukTakviye = dusukTakviyeler(stock);
  const sktTakviye = sktYakinTakviyeler(stock);
  if (dusukTakviye.length > 0) {
    const first = dusukTakviye[0];
    out.push({
      id: 'takviye-stok',
      seviye: 'uyari',
      kaynak: 'stok',
      baslik: 'Takviye stoğu düşük',
      aciklama:
        dusukTakviye.length === 1
          ? `${first.name} · ${first.quantity} ${first.unit} (min ${first.minQuantity})`
          : `${dusukTakviye.length} takviye düşük · örn. ${first.name}`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
    });
  } else if (sktTakviye.length > 0) {
    const first = sktTakviye[0];
    out.push({
      id: 'takviye-skt',
      seviye: 'sira',
      kaynak: 'stok',
      baslik: 'Takviye SKT yakın',
      aciklama: `${first.name} · son kullanma yaklaşıyor`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
    });
  }

  const asiStokAdlari = new Set(
    asiDurum.map((d) => d.stokAdi?.toLocaleLowerCase('tr-TR')).filter(Boolean) as string[]
  );
  const takviyeIds = new Set(dusukTakviye.map((i) => i.id));
  const lowStock = (await getLowStockItems()).filter(
    (i) =>
      !(i.type === 'vaccine' && asiStokAdlari.has(i.name.toLocaleLowerCase('tr-TR'))) &&
      !takviyeIds.has(i.id)
  );
  if (lowStock.length > 0) {
    const first = lowStock[0];
    out.push({
      id: 'stok',
      seviye: 'uyari',
      kaynak: 'stok',
      baslik: 'Düşük stok',
      aciklama:
        lowStock.length === 1
          ? `${first.name} · ${first.quantity} ${first.unit} (min ${first.minQuantity})`
          : `${lowStock.length} kalem düşük · örn. ${first.name}`,
      href: '/(tabs)/stok',
      cta: 'Stoka git',
    });
  }

  const hasta = animals.find((a) => a.status === 'sick');
  if (hasta) {
    out.push({
      id: 'saglik-takip',
      seviye: 'sira',
      kaynak: 'saglik',
      baslik: 'Sağlık takibi',
      aciklama: `${hasta.earTag} hasta kayıtlı — tedavi / aşıya bak`,
      href: `/hayvan/${hasta.id}/saglik`,
      cta: 'Kayıt aç',
    });
  }

  if (animals.length > 0) {
    let tartimEksik = 0;
    for (const a of animals.slice(0, 40)) {
      const w = await getLatestWeight(a.id);
      if (w == null) tartimEksik += 1;
    }
    if (tartimEksik > 0) {
      out.push({
        id: 'tartim',
        seviye: 'sira',
        kaynak: 'tartim',
        baslik: 'Tartım sırası',
        aciklama:
          tartimEksik === 1
            ? '1 hayvanda henüz tartım yok'
            : `${tartimEksik} hayvanda henüz tartım yok`,
        href: '/(tabs)/suru',
        cta: 'Sürüye git',
      });
    }
  }

  const yol = await yolculukGorevi();
  if (yol) out.push(yol);

  const bugun = new Date().toISOString().slice(0, 10);
  for (const p of await getPlanlananGorevler()) {
    if (p.tamam) continue;
    out.push({
      id: `plan-${p.id}`,
      seviye: p.tarih <= bugun ? 'sira' : 'plan',
      kaynak: 'planlanan',
      baslik: p.baslik,
      aciklama: p.aciklama || (p.tarih > bugun ? `Plan: ${p.tarih}` : `Bugün · ${p.tarih}`),
      href: p.href,
      cta: 'Aç',
      tarih: p.tarih,
      tamamlanabilir: true,
      tamam: false,
    });
  }

  // Öncelik: uyari → sira → plan → bilgi; aynı seviyede tarih
  const sira: Record<GorevSeviye, number> = { uyari: 0, sira: 1, plan: 2, bilgi: 3 };
  out.sort((a, b) => {
    const ds = sira[a.seviye] - sira[b.seviye];
    if (ds !== 0) return ds;
    return (a.tarih ?? bugun).localeCompare(b.tarih ?? bugun);
  });

  return out;
}

const BUGUN_DISLA = (id: string) => id.startsWith('asi-hayvan-');

/** Bugün kartı — günlük görevler (gelecek planlar hariç) */
export async function getBugunGorevleri(limit = 3): Promise<Gorev[]> {
  const bugun = new Date().toISOString().slice(0, 10);
  const filtered = (await getGorevler()).filter((g) => {
    if (g.seviye === 'plan') return false;
    if (g.tarih && g.tarih > bugun) return false;
    if (BUGUN_DISLA(g.id)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return [
      {
        id: 'bos',
        seviye: 'bilgi',
        kaynak: 'planlanan',
        baslik: 'Bugün acil iş yok',
        aciklama: 'Planlanan görev ekleyebilir veya tüm listeye bakabilirsiniz.',
        href: '/gorevler',
        cta: 'Görevlere git',
      },
    ];
  }

  return filtered.slice(0, limit);
}

/** Ana sayfa özeti — en fazla 3 görev (eski ad; Bugün ile aynı) */
export async function getGorevOzeti(limit = 3): Promise<Gorev[]> {
  return getBugunGorevleri(limit);
}
