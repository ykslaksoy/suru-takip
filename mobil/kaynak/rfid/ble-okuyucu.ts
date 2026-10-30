/**
 * RFID / elektronik küpe okuyucu — gerçek BLE (Web Bluetooth).
 *
 * Desteklenen GATT profilleri (piyasadaki BLE küpe okuyucularının çoğu bunlardan
 * birini kullanır): Nordic UART (NUS), HM-10/HC-08 seri (FFE0/FFE1) ve
 * Microchip/ISSC transparent UART. Okuyucu her etiket okumasında ASCII satır
 * (ör. "982 000123456789" / "TR3400012345") gönderir; burada ayrıştırılır.
 *
 * Simülasyon YOK: tarayıcı Web Bluetooth desteklemiyorsa veya cihaz seçilmezse
 * okuma başarısız döner ve kullanıcı elle giriş / OCR kullanır.
 */

export type RfidOkuyucuDurum = 'desteklenmiyor' | 'kapali' | 'baglaniyor' | 'hazir' | 'okuyor' | 'hata';

export type RfidOkumaSonuc = {
  ok: boolean;
  durum: RfidOkuyucuDurum;
  /** Ham etiket (ISO 11784 / FDX-B / GEKİS) */
  ham: string;
  earTagOneri: string;
  gehisIdOneri: string;
  message: string;
};

/** Bilinen BLE seri profilleri: servis → notify karakteristiği */
export const RFID_BLE_PROFILLERI: { ad: string; servis: string; karakteristik: string }[] = [
  { ad: 'Nordic UART', servis: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', karakteristik: '6e400003-b5a3-f393-e0a9-e50e24dcca9e' },
  { ad: 'HM-10 seri', servis: '0000ffe0-0000-1000-8000-00805f9b34fb', karakteristik: '0000ffe1-0000-1000-8000-00805f9b34fb' },
  { ad: 'ISSC transparent', servis: '49535343-fe7d-4ae5-8fa9-9fafd205e455', karakteristik: '49535343-1e4d-4bd9-ba61-23c647249616' },
];

type BleChar = {
  startNotifications(): Promise<unknown>;
  stopNotifications?(): Promise<unknown>;
  addEventListener(t: string, f: (e: { target: { value: DataView } }) => void): void;
  removeEventListener(t: string, f: (e: { target: { value: DataView } }) => void): void;
};
type BleDevice = {
  name?: string;
  gatt?: { connected: boolean; connect(): Promise<BleServer>; disconnect(): void };
  addEventListener(t: string, f: () => void): void;
};
type BleServer = { getPrimaryService(uuid: string): Promise<{ getCharacteristic(u: string): Promise<BleChar> }> };
type BleNavigator = {
  bluetooth?: {
    requestDevice(o: { filters?: unknown[]; acceptAllDevices?: boolean; optionalServices?: string[] }): Promise<BleDevice>;
  };
};

let durum: RfidOkuyucuDurum = 'kapali';
let cihaz: BleDevice | null = null;
let karakteristik: BleChar | null = null;
let profilAd = '';
let tampon = '';
const bekleyenler: ((ham: string) => void)[] = [];
const dinleyiciler = new Set<(d: RfidOkuyucuDurum) => void>();

function durumAyarla(d: RfidOkuyucuDurum) {
  durum = d;
  dinleyiciler.forEach((f) => f(d));
}

function bleNavigator(): BleNavigator | null {
  if (typeof navigator === 'undefined') return null;
  return navigator as unknown as BleNavigator;
}

export function rfidBleDestekleniyor(): boolean {
  return !!bleNavigator()?.bluetooth;
}

export function rfidDurum(): RfidOkuyucuDurum {
  if (!rfidBleDestekleniyor() && durum === 'kapali') return 'desteklenmiyor';
  return durum;
}

export function rfidCihazAdi(): string {
  return cihaz?.name ? `${cihaz.name}${profilAd ? ` · ${profilAd}` : ''}` : '';
}

export function rfidDurumDinle(f: (d: RfidOkuyucuDurum) => void): () => void {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}

export function rfidDurumEtiket(d: RfidOkuyucuDurum): string {
  const map: Record<RfidOkuyucuDurum, string> = {
    desteklenmiyor: 'Bu tarayıcı Bluetooth desteklemiyor',
    kapali: 'Okuyucu bağlı değil',
    baglaniyor: 'Bağlanıyor…',
    hazir: 'Okuyucu bağlı · hazır',
    okuyor: 'Küpe bekleniyor…',
    hata: 'Bağlantı hatası',
  };
  return map[d];
}

/** Ham RFID → küpe / GEKİS önerisi (ISO 11784: 3 hane ülke + 12 hane ulusal no) */
export function rfidEtiketEsle(ham: string): { earTag: string; gehisId: string } {
  const cleaned = ham.replace(/[\s\-_.]/g, '').toUpperCase();
  const digits = cleaned.replace(/\D/g, '');
  // ISO FDX-B: 792 = Türkiye ülke kodu
  if (/^792\d{12}$/.test(digits)) {
    const ulusal = digits.slice(3);
    return { earTag: `TR-${ulusal.slice(0, 2)}-${ulusal.slice(-6)}`, gehisId: digits };
  }
  const tr = cleaned.match(/^TR(\d{2})(\d{4,13})$/);
  if (tr) return { earTag: `TR-${tr[1]}-${tr[2].slice(-6)}`, gehisId: cleaned };
  const gehisId = cleaned.slice(0, 20);
  const earTag = digits.length >= 6 ? `TR-${digits.slice(0, 2)}-${digits.slice(-6)}` : cleaned.slice(0, 14);
  return { earTag, gehisId };
}

/** BLE’den gelen bayt akışını satırlara böl (okuyucular CR/LF ile bitirir) */
export function rfidAkisCoz(onceki: string, parca: string): { satirlar: string[]; kalan: string } {
  const birlesik = onceki + parca;
  const bolum = birlesik.split(/[\r\n\x03]+/);
  const kalan = bolum.pop() ?? '';
  const satirlar = bolum.map((s) => s.replace(/[\x00-\x1f\x02]/g, '').trim()).filter((s) => s.length >= 4);
  return { satirlar, kalan };
}

function bildirim(e: { target: { value: DataView } }) {
  const v = e.target.value;
  const parca = new TextDecoder().decode(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
  const { satirlar, kalan } = rfidAkisCoz(tampon, parca);
  tampon = kalan.length > 64 ? '' : kalan;
  for (const s of satirlar) {
    const f = bekleyenler.shift();
    if (f) f(s);
  }
}

/** Kullanıcı jesti içinde çağrılmalı (buton) — tarayıcı cihaz seçiciyi açar */
export async function rfidBaglan(): Promise<{ ok: boolean; message: string }> {
  const nav = bleNavigator();
  if (!nav?.bluetooth) {
    durumAyarla('kapali');
    return {
      ok: false,
      message:
        'Bu tarayıcıda Web Bluetooth yok. Android’de Chrome/Edge veya masaüstü Chrome kullanın; iOS Safari desteklemez (Bluefy tarayıcı çalışır).',
    };
  }
  try {
    durumAyarla('baglaniyor');
    const servisler = RFID_BLE_PROFILLERI.map((p) => p.servis);
    const d = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: servisler });
    const server = await d.gatt!.connect();
    let bulunan: BleChar | null = null;
    for (const p of RFID_BLE_PROFILLERI) {
      try {
        const s = await server.getPrimaryService(p.servis);
        bulunan = await s.getCharacteristic(p.karakteristik);
        profilAd = p.ad;
        break;
      } catch {
        /* sonraki profil */
      }
    }
    if (!bulunan) {
      d.gatt?.disconnect();
      durumAyarla('hata');
      return { ok: false, message: `${d.name ?? 'Cihaz'} desteklenen bir RFID seri servisi sunmuyor.` };
    }
    await bulunan.startNotifications();
    bulunan.addEventListener('characteristicvaluechanged', bildirim);
    d.addEventListener('gattserverdisconnected', () => {
      karakteristik = null;
      durumAyarla('kapali');
    });
    cihaz = d;
    karakteristik = bulunan;
    durumAyarla('hazir');
    return { ok: true, message: `${d.name ?? 'Okuyucu'} bağlandı (${profilAd}).` };
  } catch (e) {
    durumAyarla('kapali');
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: /cancel/i.test(msg) ? 'Cihaz seçilmedi.' : `Bağlanamadı: ${msg}` };
  }
}

export function rfidBaglantiyiKes(): void {
  karakteristik?.removeEventListener('characteristicvaluechanged', bildirim);
  cihaz?.gatt?.disconnect();
  cihaz = null;
  karakteristik = null;
  durumAyarla('kapali');
}

/** Gerçek okuyucudan bir sonraki küpeyi bekle (varsayılan 15 sn) */
export async function rfidOku(opts?: { zamanAsimiMs?: number }): Promise<RfidOkumaSonuc> {
  const bos = { ham: '', earTagOneri: '', gehisIdOneri: '' };
  if (!karakteristik) {
    const b = await rfidBaglan();
    if (!b.ok) return { ok: false, durum: rfidDurum(), ...bos, message: b.message };
  }
  durumAyarla('okuyor');
  const ham = await new Promise<string | null>((resolve) => {
    const t = setTimeout(() => {
      const i = bekleyenler.indexOf(f);
      if (i >= 0) bekleyenler.splice(i, 1);
      resolve(null);
    }, opts?.zamanAsimiMs ?? 15000);
    const f = (s: string) => {
      clearTimeout(t);
      resolve(s);
    };
    bekleyenler.push(f);
  });
  durumAyarla(karakteristik ? 'hazir' : 'kapali');
  if (!ham) return { ok: false, durum: rfidDurum(), ...bos, message: 'Süre doldu — küpeyi okuyucuya yaklaştırın.' };
  const esle = rfidEtiketEsle(ham);
  return { ok: true, durum: 'hazir', ham, earTagOneri: esle.earTag, gehisIdOneri: esle.gehisId, message: `Okundu: ${ham}` };
}
