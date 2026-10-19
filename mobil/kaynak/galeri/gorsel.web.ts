/** Web: IndexedDB görüntü deposu + tuval ile küçültme */
import { KUCUK_EN_COK, olcekle, TAM_EN_COK } from './hesap';

const DB = 'superkuzu-foto';
const STORE = 'gorsel';

function ac(): Promise<IDBDatabase> {
  return new Promise((coz, red) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => coz(r.result);
    r.onerror = () => red(r.error);
  });
}

async function islem<T>(mod: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ac();
  return new Promise((coz, red) => {
    const tx = db.transaction(STORE, mod);
    const req = f(tx.objectStore(STORE));
    req.onsuccess = () => coz(req.result);
    req.onerror = () => red(req.error);
  });
}

function resimYukle(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((coz, red) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      coz(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      red(new Error('Görüntü okunamadı'));
    };
    img.src = url;
  });
}

function kucult(img: HTMLImageElement, maks: number, kalite: number): Promise<{ blob: Blob; en: number; boy: number }> {
  const o = olcekle(img.naturalWidth, img.naturalHeight, maks);
  const c = document.createElement('canvas');
  c.width = o.en;
  c.height = o.boy;
  c.getContext('2d')!.drawImage(img, 0, 0, o.en, o.boy);
  return new Promise((coz, red) =>
    c.toBlob((b) => (b ? coz({ blob: b, en: o.en, boy: o.boy }) : red(new Error('Sıkıştırılamadı'))), 'image/jpeg', kalite),
  );
}

export type HazirGorsel = { en: number; boy: number; bayt: number; kaydet: (id: string) => Promise<string | undefined> };

/** Seçilen dosyayı 1600 px JPEG + 320 px küçük resme çevirir */
export async function gorselHazirla(kaynak: Blob | string): Promise<HazirGorsel> {
  const blob = typeof kaynak === 'string' ? await (await fetch(kaynak)).blob() : kaynak;
  const img = await resimYukle(blob);
  const tam = await kucult(img, TAM_EN_COK, 0.8);
  const kucuk = await kucult(img, KUCUK_EN_COK, 0.7);
  return {
    en: tam.en,
    boy: tam.boy,
    bayt: tam.blob.size,
    kaydet: async (id) => {
      await islem('readwrite', (s) => s.put({ tam: tam.blob, kucuk: kucuk.blob }, id));
      return undefined;
    },
  };
}

const urlOnbellek = new Map<string, string>();

export async function gorselUrl(f: { id: string }, boyut: 'tam' | 'kucuk'): Promise<string | null> {
  const k = `${f.id}:${boyut}`;
  if (urlOnbellek.has(k)) return urlOnbellek.get(k)!;
  const v = (await islem('readonly', (s) => s.get(f.id))) as { tam: Blob; kucuk: Blob } | undefined;
  if (!v) return null;
  const url = URL.createObjectURL(v[boyut]);
  urlOnbellek.set(k, url);
  return url;
}

export async function gorselSil(f: { id: string }): Promise<void> {
  for (const b of ['tam', 'kucuk']) {
    const u = urlOnbellek.get(`${f.id}:${b}`);
    if (u) URL.revokeObjectURL(u);
    urlOnbellek.delete(`${f.id}:${b}`);
  }
  await islem('readwrite', (s) => s.delete(f.id));
}

/** Web: kamera (capture) ya da dosya seçici */
export function gorselSec(kaynak: 'kamera' | 'dosya'): Promise<Blob[]> {
  return new Promise((coz) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    if (kaynak === 'kamera') inp.setAttribute('capture', 'environment');
    else inp.multiple = true;
    inp.style.display = 'none';
    inp.onchange = () => {
      const l = [...(inp.files ?? [])];
      inp.remove();
      coz(l);
    };
    document.body.appendChild(inp);
    inp.click();
  });
}

/** Bulut senkronu için ham görüntü (tam boy) oku */
export async function gorselHamOku(id: string): Promise<Blob | null> {
  const v = (await islem('readonly', (s) => s.get(id))) as { tam: Blob; kucuk: Blob } | undefined;
  return v?.tam ?? null;
}

/** Buluttan inen görüntüyü yerel depoya yaz (küçük resim olarak da aynı blob) */
export async function gorselHamYaz(id: string, blob: Blob): Promise<void> {
  await islem('readwrite', (s) => s.put({ tam: blob, kucuk: blob }, id));
}
