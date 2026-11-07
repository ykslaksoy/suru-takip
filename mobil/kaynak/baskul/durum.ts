/**
 * Baskül bağlantı durumu — simülasyon yok.
 * Gerçek terazi sürücüsü tanımlı değilse bağlanınca hemen yapılandırılmamış/hata döner.
 */

export type BaskulDurum =
  | 'yapilandirilmamis'
  | 'desteklenmiyor'
  | 'bekleniyor'
  | 'baglaniyor'
  | 'hazir'
  | 'olcum_bekleniyor'
  | 'hata'
  | 'kesildi';

/** Ürün içinde marka/model protokolü henüz bağlanmadı */
export const BASKUL_ADAPTOR_TANIMLI = false;

type Dinleyici = (d: BaskulDurum) => void;

let durum: BaskulDurum = 'bekleniyor';
let baglantiNesli = 0;
let sonHata = '';
const dinleyiciler = new Set<Dinleyici>();

function durumAyarla(d: BaskulDurum, hata?: string) {
  durum = d;
  if (hata !== undefined) sonHata = hata;
  dinleyiciler.forEach((f) => f(d));
}

export function baskulDurum(): BaskulDurum {
  return durum;
}

export function baskulBaglantiNesli(): number {
  return baglantiNesli;
}

export function baskulSonHata(): string {
  return sonHata;
}

export function baskulDurumDinle(f: Dinleyici): () => void {
  dinleyiciler.add(f);
  f(durum);
  return () => dinleyiciler.delete(f);
}

export function baskulDurumEtiket(d: BaskulDurum): string {
  const map: Record<BaskulDurum, string> = {
    yapilandirilmamis: 'Baskül modeli yapılandırılmamış',
    desteklenmiyor: 'Bu ortamda baskül bağlantısı desteklenmiyor',
    bekleniyor: 'Bağlantı bekleniyor',
    baglaniyor: 'Bağlanıyor…',
    hazir: 'Baskül bağlı · hazır',
    olcum_bekleniyor: 'Kararlı ölçüm bekleniyor…',
    hata: 'Bağlantı hatası',
    kesildi: 'Bağlantı kesildi',
  };
  return map[d];
}

export function baskulOrtamDestekliyorMu(): boolean {
  if (typeof navigator === 'undefined') return false;
  const n = navigator as Navigator & { serial?: unknown; bluetooth?: unknown };
  return !!(n.serial || n.bluetooth);
}

export function baskulBagliMi(): boolean {
  return durum === 'hazir' || durum === 'olcum_bekleniyor';
}

export function baskulOturumuSifirla(): void {
  baglantiNesli += 1;
  durumAyarla('bekleniyor', '');
}

/** Bağlan — gerçek sürücü yoksa anında yapılandırılmamış/hata; sonsuz bekleme yok */
export async function baskulBaglan(): Promise<{ ok: boolean; mesaj: string }> {
  if (!baskulOrtamDestekliyorMu()) {
    durumAyarla('desteklenmiyor', 'USB/Bluetooth seri erişimi bu tarayıcıda yok.');
    return { ok: false, mesaj: sonHata };
  }
  if (!BASKUL_ADAPTOR_TANIMLI) {
    durumAyarla(
      'yapilandirilmamis',
      'Otomatik baskül seçilebilir; ancak işletmenize uygun model/protokol henüz tanımlı değil. Elle veya sesle kilo girebilirsiniz.',
    );
    return { ok: false, mesaj: sonHata };
  }
  durumAyarla('baglaniyor');
  // Gelecekte: gerçek adaptör burada bağlanır
  durumAyarla('hata', 'Bağlantı tamamlanamadı.');
  return { ok: false, mesaj: sonHata };
}

export function baskulBaglantiyiKes(): void {
  baglantiNesli += 1;
  durumAyarla('kesildi', 'Bağlantı kesildi. Ölçümler geçersiz.');
}

export function baskulOlcumBeklemeyeAl(): void {
  if (baskulBagliMi()) durumAyarla('olcum_bekleniyor');
}
