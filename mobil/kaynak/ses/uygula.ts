import { addHealthRecord, adjustStock, getAnimals, getStockItems, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { kaydetTartimKaydi } from '@/kaynak/kilo/tartim-kayit';
import { tartimKaydiDuzelt } from '@/kaynak/kilo/tartim-duzelt';
import { dogumKaydet } from '@/kaynak/ureme/dogum-kayit';
import { addPlanlananGorev } from '@/kaynak/gorevler/planlanan';
import { partiAdiCoz } from '@/kaynak/toplu/secim';
import { padokManuelYemKaydet } from '@/kaynak/yem/padok-manuel-tuketim';
import { hayvanBulKesin } from './hayvan-kesin';
import { getTabancaDurum, tabancaAyariGetir } from '@/kaynak/akilli-veteriner/tabanca-ayar';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { v4 as uuidv4 } from 'uuid';
import type { GrupAsiKomutu, SesKomutEylemi } from './tipler';
import { topluSec } from '@/kaynak/toplu/secim';
import { topluUygula } from '@/kaynak/toplu/uygula';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';

/** Grup komutundaki aktif kuzu sayısı (geri okuma için) */
export async function grupHayvanSayisi(e: GrupAsiKomutu): Promise<number> {
  return topluSec(await getAnimals(), e.grup).secilen.length;
}

/** Tabanca açıksa grubun tabanca ayarı (ml); kapalı/uygun değilse undefined */
export async function grupTabancaMl(e: GrupAsiKomutu): Promise<number | undefined> {
  const durum = await getTabancaDurum();
  if (!durum.aktif) return undefined;
  const { secilen } = topluSec(await getAnimals(), e.grup);
  const ayar = await tabancaAyariGetir(e.programId, secilen, durum.kapasite);
  return ayar.uygun ? ayar.ayarMl : undefined;
}

export async function hayvanBul(arama: string) {
  const term = arama.trim();
  if (!term) return null;
  const list = await getAnimals({ search: term });
  const upper = term.toUpperCase();
  const digits = term.replace(/\D/g, '');
  return (
    list.find((a) => a.sirtNo?.trim() === term || a.sirtNo?.trim() === digits) ??
    list.find((a) => a.earTag.toUpperCase() === upper) ??
    list.find(
      (a) =>
        a.earTag.toUpperCase().includes(upper) ||
        a.turkvetNo.toUpperCase().includes(upper) ||
        (a.gehisId ?? '').toUpperCase().includes(upper) ||
        (a.sirtNo ?? '').includes(digits || term),
    ) ??
    list[0] ??
    null
  );
}

/** Onaylandıktan sonra eylemi veritabanına yazar */
export async function komutuUygula(eylem: SesKomutEylemi): Promise<{ ok: true } | { ok: false; hata: string }> {
  switch (eylem.tur) {
    case 'padok_tasi': {
      const h = await hayvanBulKesin(eylem.kupeArama);
      if (!h.ok) return { ok: false, hata: h.hata };
      const padok = partiAdiCoz(eylem.padokHedef);
      await upsertAnimal({ ...h.animal, paddock: padok });
      await islemKaydet({
        tur: 'padok',
        ozet: `${hayvanAnaEtiket(h.animal)} → ${padok}`,
        detay: 'Sesli komut padok taşıma',
        animalId: h.animal.id,
      });
      return { ok: true };
    }
    case 'gozlem_hatirlat': {
      const h = await hayvanBulKesin(eylem.kupeArama);
      if (!h.ok) return { ok: false, hata: h.hata };
      await addHealthRecord({
        id: uuidv4(),
        animalId: h.animal.id,
        recordType: 'checkup',
        symptoms: eylem.gozlem,
        diagnosis: '',
        treatment: '',
        medicine: '',
        withdrawalDays: 0,
        vetName: '',
        recordedAt: new Date().toISOString().split('T')[0],
        notes: `Sesli gözlem · hatırlatma ${eylem.hatirlatmaTarihi}`,
      });
      await addPlanlananGorev({
        baslik: `Kontrol: ${hayvanAnaEtiket(h.animal)}`,
        aciklama: eylem.gozlem,
        tarih: eylem.hatirlatmaTarihi,
        href: `/hayvan/${h.animal.id}`,
      });
      await islemKaydet({
        tur: 'ilac',
        ozet: `${hayvanAnaEtiket(h.animal)} gözlem + hatırlatma`,
        detay: eylem.gozlem,
        animalId: h.animal.id,
      });
      return { ok: true };
    }
    case 'padok_yem': {
      const sonuc = await padokManuelYemKaydet({
        padokHam: eylem.padokHam,
        miktarKg: eylem.miktarKg,
        yemAdi: eylem.yemAdi,
        tarih: eylem.tarih,
      });
      return sonuc.ok ? { ok: true } : { ok: false, hata: sonuc.neden };
    }
    case 'dogum': {
      const h = await hayvanBulKesin(eylem.anneArama);
      if (!h.ok) return { ok: false, hata: h.hata };
      const sonuc = await dogumKaydet({
        anneId: h.animal.id,
        birthDate: eylem.birthDate,
        kuzular: eylem.kuzular.map((k) => ({
          earTag: k.earTag,
          sex: k.sex,
          birthWeightKg: null,
          sirtNo: null,
        })),
        paddock: eylem.paddock,
        notes: 'Sesli komut doğum',
      });
      return sonuc.ok ? { ok: true } : { ok: false, hata: sonuc.message };
    }
    case 'tartim_duzelt': {
      const h = await hayvanBulKesin(eylem.kupeArama);
      if (!h.ok) return { ok: false, hata: h.hata };
      if (!eylem.kayitId || eylem.eskiKg == null) {
        return { ok: false, hata: 'Tartım kaydı seçilemedi; komutu yeniden gönderin.' };
      }
      const sonuc = await tartimKaydiDuzelt({
        animal: h.animal,
        kayitId: eylem.kayitId,
        eskiKg: eylem.eskiKg,
        yeniKg: eylem.yeniKg,
      });
      return sonuc.ok ? { ok: true } : { ok: false, hata: sonuc.neden };
    }
    case 'bilgi':
      return { ok: false, hata: 'Bilgi komutu doğrudan uygulanmaz.' };
    case 'tartim': {
      const h = await hayvanBulKesin(eylem.kupeArama);
      if (!h.ok) return { ok: false, hata: h.hata };
      const tartim = await kaydetTartimKaydi({
        animalId: h.animal.id,
        weightKg: eylem.kiloKg,
        notes: 'Sesli komut',
      });
      if (!tartim.ok) return { ok: false, hata: tartim.neden };
      await islemKaydet({ tur: 'tartim', ozet: `${hayvanAnaEtiket(h.animal)} · ${eylem.kiloKg} kg`, detay: 'Sesli komut', animalId: h.animal.id });
      return { ok: true };
    }
    case 'asi': {
      const hres = await hayvanBulKesin(eylem.kupeArama);
      if (!hres.ok) return { ok: false, hata: hres.hata };
      const animal = hres.animal;
      await addHealthRecord({
        id: uuidv4(),
        animalId: animal.id,
        recordType: 'vaccine',
        symptoms: '',
        diagnosis: 'Sesli komut aşı',
        treatment: eylem.asiAdi,
        medicine: eylem.asiAdi,
        withdrawalDays: 0,
        vetName: '',
        recordedAt: new Date().toISOString().split('T')[0],
        notes: `Sesli komut · ${hayvanAnaEtiket(animal)}`,
      });
      await islemKaydet({ tur: 'asi', ozet: `${hayvanAnaEtiket(animal)} · ${eylem.asiAdi}`, detay: 'Sesli komut', animalId: animal.id });
      return { ok: true };
    }
    case 'grup_asi': {
      const { secilen } = topluSec(await getAnimals(), eylem.grup);
      if (secilen.length === 0) return { ok: false, hata: 'Bu grupta kuzu bulunamadı.' };
      await topluUygula({ hayvanlar: secilen, programId: eylem.programId, programTur: eylem.programTur, kaynak: 'Sesli komut', tabanca: eylem.tabancaMl != null });
      return { ok: true };
    }
    case 'stok': {
      const items = await getStockItems();
      const item = items.find((i) => i.name.toLowerCase().includes(eylem.stokAdi.toLowerCase()));
      if (!item) {
        return { ok: false, hata: 'Eşleşen stok kalemi bulunamadı; stok adını net söyleyin.' };
      }
      await adjustStock(item.id, eylem.yon === 'giris' ? 'in' : 'out', eylem.miktar, 'Sesli komut');
      await islemKaydet({ tur: 'stok', ozet: `${item.name} ${eylem.yon === 'giris' ? '+' : '−'}${eylem.miktar} ${item.unit}`, detay: 'Sesli komut' });
      return { ok: true };
    }
    default:
      return { ok: false, hata: 'Desteklenmeyen komut.' };
  }
}
