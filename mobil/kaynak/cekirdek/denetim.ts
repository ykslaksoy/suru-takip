/**
 * İşlem kaydı (denetim / audit log) — her ekleme, güncelleme, silme, geri alma.
 * Kim (aktif kullanıcı), ne zaman, hangi kayıt, hangi alan eski → yeni.
 * Veritabanı katmanından çağrılır; yazımlar kuyruklanıp toplu kaydedilir (toplu işlemde hız).
 */
import { kaliciGetItem, kaliciSetItem } from './web-kalici-depo';

import { type DenetimKaydi } from './denetim-hesap';
export * from './denetim-hesap';
import { DENETIM_KEY, DENETIM_MAKS } from './denetim-hesap';

// ---- aktif kullanıcı (özellik: Roller) ----
type Kim = { id: string; ad: string };
let kimSaglayici: () => Kim = () => ({ id: 'cihaz', ad: 'Bu cihaz' });
export function setDenetimKimSaglayici(f: () => Kim): void {
  kimSaglayici = f;
}

// ---- kuyruk ----
let bekleyen: DenetimKaydi[] = [];
let zincir: Promise<void> = Promise.resolve();
let zamanlayici: ReturnType<typeof setTimeout> | null = null;
let sayac = 0;

function okuHam(raw: string | null): DenetimKaydi[] {
  if (!raw) return [];
  try {
    const l = JSON.parse(raw);
    return Array.isArray(l) ? l : [];
  } catch {
    return [];
  }
}

export function denetimFlush(): Promise<void> {
  if (zamanlayici) {
    clearTimeout(zamanlayici);
    zamanlayici = null;
  }
  zincir = zincir.then(async () => {
    if (!bekleyen.length) return;
    const yeni = bekleyen;
    bekleyen = [];
    try {
      const l = okuHam(await kaliciGetItem(DENETIM_KEY));
      await kaliciSetItem(DENETIM_KEY, JSON.stringify([...yeni.reverse(), ...l].slice(0, DENETIM_MAKS)));
    } catch {
      /* denetim yazılamadı — asıl kayıt geçerli */
    }
  });
  return zincir;
}

/** Kuyruğa ekle — hata fırlatmaz */
export function denetimYaz(k: Omit<DenetimKaydi, 'id' | 'zaman' | 'kim' | 'kimId'>): void {
  try {
    const kim = kimSaglayici();
    sayac += 1;
    bekleyen.push({ ...k, id: `${Date.now().toString(36)}-${sayac}`, zaman: new Date().toISOString(), kim: kim.ad, kimId: kim.id });
    if (!zamanlayici) zamanlayici = setTimeout(() => void denetimFlush(), 400);
  } catch {
    /* yoksay */
  }
}

export async function getDenetimKayitlari(): Promise<DenetimKaydi[]> {
  await denetimFlush();
  return okuHam(await kaliciGetItem(DENETIM_KEY));
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => void denetimFlush());
  window.addEventListener('pagehide', () => void denetimFlush());
}
