/**
 * Bulut servis katmanı — oturum, çiftlik, davet, senkron döngüsü.
 * Bayrak kapalıysa (env yok) tüm fonksiyonlar hiçbir şey yapmaz.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kaliciGetItem, kaliciRemoveItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { metaOku } from '@/kaynak/galeri/meta';
import { gorselHamOku, gorselHamYaz } from '@/kaynak/galeri/gorsel';
import { bulutAyar } from './ayar';
import { BulutIstemci, type Oturum, type Uyelik } from './istemci';
import { bosMeta, META_ANAHTAR, senkronEt, type SenkronMeta, type SenkronRapor, type YerelDepo } from './motor';
import { fotoSenkron } from './foto-senkron';

const OTURUM = 'sy_bulut_oturum_v1';
const CIFTLIK = 'sy_bulut_ciftlik_v1';
const SON = 'sy_bulut_son_v1';

export type BulutDurum = {
  acik: boolean;
  oturum: Oturum | null;
  uyelik: Uyelik | null;
  son: { zaman: string; rapor: SenkronRapor } | null;
};

function istemci(): BulutIstemci | null {
  const a = bulutAyar();
  return a ? new BulutIstemci(a) : null;
}

async function jsonOku<T>(k: string): Promise<T | null> {
  const r = await kaliciGetItem(k);
  if (!r) return null;
  try {
    return JSON.parse(r) as T;
  } catch {
    return null;
  }
}

const yerelDepo: YerelDepo = {
  anahtarlar: async () => {
    const s = new Set<string>(await AsyncStorage.getAllKeys());
    if (typeof localStorage !== 'undefined') for (let i = 0; i < localStorage.length; i++) s.add(localStorage.key(i)!);
    return [...s];
  },
  oku: (k) => kaliciGetItem(k),
  yaz: (k, v) => kaliciSetItem(k, v),
  sil: (k) => kaliciRemoveItem(k),
};

export async function bulutDurum(): Promise<BulutDurum> {
  const acik = bulutAyar() !== null;
  if (!acik) return { acik, oturum: null, uyelik: null, son: null };
  return { acik, oturum: await jsonOku<Oturum>(OTURUM), uyelik: await jsonOku<Uyelik>(CIFTLIK), son: await jsonOku(SON) };
}

async function gecerliOturum(): Promise<Oturum> {
  const c = istemci();
  let o = await jsonOku<Oturum>(OTURUM);
  if (!c || !o) throw new Error('Bulut girişi yok');
  if (o.expires_at - Date.now() < 60_000) {
    o = await c.yenile(o);
    await kaliciSetItem(OTURUM, JSON.stringify(o));
  }
  return o;
}

export async function girisKoduGonder(eposta: string): Promise<void> {
  const c = istemci();
  if (!c) return;
  const geri = typeof window !== 'undefined' && window.location ? `${window.location.origin}/bulut` : undefined;
  await c.kodGonder(eposta.trim().toLowerCase(), geri);
}

async function oturumKaydet(o: Oturum): Promise<void> {
  await kaliciSetItem(OTURUM, JSON.stringify(o));
  const c = istemci()!;
  const u = await c.uyeliklerim(o);
  if (u[0]) await kaliciSetItem(CIFTLIK, JSON.stringify(u[0]));
}

export async function girisKoduDogrula(eposta: string, kod: string): Promise<void> {
  const c = istemci();
  if (!c) return;
  await oturumKaydet(await c.kodDogrula(eposta.trim().toLowerCase(), kod));
  if (await jsonOku<Uyelik>(CIFTLIK)) await simdiSenkronEt();
}

/** Sihirli bağlantı ile dönüldüyse oturumu al */
export async function baglantiyiIsle(): Promise<boolean> {
  const c = istemci();
  if (!c || typeof window === 'undefined' || !window.location?.hash.includes('access_token')) return false;
  const o = await c.baglantidanOturum(window.location.hash);
  if (!o) return false;
  await oturumKaydet(o);
  window.history.replaceState(null, '', window.location.pathname);
  return true;
}

export async function cikis(): Promise<void> {
  await kaliciRemoveItem(OTURUM);
  await kaliciRemoveItem(CIFTLIK);
}

export async function ciftlikOlustur(ad: string): Promise<void> {
  const c = istemci();
  if (!c) return;
  const o = await gecerliOturum();
  await c.rpc<string>(o, 'ciftlik_olustur', { p_ad: ad });
  await oturumKaydet(o);
}

export async function davetOlustur(rol: 'ortak' | 'bakici' | 'veteriner', finans: boolean): Promise<string> {
  const c = istemci();
  const u = await jsonOku<Uyelik>(CIFTLIK);
  if (!c || !u) throw new Error('Önce çiftlik oluşturun');
  return c.rpc<string>(await gecerliOturum(), 'davet_olustur', { p_ciftlik: u.ciftlik_id, p_rol: rol, p_finans: finans });
}

export async function davetKabul(kod: string, ad: string): Promise<void> {
  const c = istemci();
  if (!c) return;
  const o = await gecerliOturum();
  await c.rpc(o, 'davet_kabul', { p_kod: kod, p_ad: ad });
  await oturumKaydet(o);
}

export async function ekipListesi() {
  const c = istemci();
  const u = await jsonOku<Uyelik>(CIFTLIK);
  if (!c || !u) return [];
  return c.uyeler(await gecerliOturum(), u.ciftlik_id);
}

export async function uyeYetkiGuncelle(kullanici: string, d: Partial<Pick<Uyelik, 'rol' | 'finans' | 'duzenle' | 'sil'>>): Promise<void> {
  const c = istemci();
  const u = await jsonOku<Uyelik>(CIFTLIK);
  if (!c || !u) return;
  await c.uyeGuncelle(await gecerliOturum(), u.ciftlik_id, kullanici, d);
}

let calisiyor = false;

/** Tam senkron: veri belgeleri + fotoğraflar. Bayrak kapalı / giriş yoksa sessizce çıkar. */
export async function simdiSenkronEt(): Promise<SenkronRapor | null> {
  const c = istemci();
  if (!c || calisiyor) return null;
  const uy = await jsonOku<Uyelik>(CIFTLIK);
  if (!uy || !(await jsonOku<Oturum>(OTURUM))) return null;
  calisiyor = true;
  try {
    let o: Oturum;
    try {
      o = await gecerliOturum();
    } catch (e) {
      return { gonderilen: 0, alinan: 0, bekleyen: 0, hata: e instanceof Error ? e.message : String(e) };
    }
    // Sunucudaki güncel rol/yetkiyi al (Sahip değiştirmiş olabilir)
    try {
      const u = (await c.uyeliklerim(o)).find((x) => x.ciftlik_id === uy.ciftlik_id);
      if (u) await kaliciSetItem(CIFTLIK, JSON.stringify(u));
    } catch {
      /* çevrimdışı: son bilinen yetki */
    }
    const guncel = (await jsonOku<Uyelik>(CIFTLIK))!;
    const finans = guncel.rol === 'sahip' || guncel.rol === 'ortak' || guncel.finans;
    const meta0 = (await jsonOku<SenkronMeta>(META_ANAHTAR)) ?? bosMeta();
    const { meta, rapor } = await senkronEt(yerelDepo, c.tasiyici(o, guncel.ciftlik_id), meta0, { finansYetkisi: finans });
    await kaliciSetItem(META_ANAHTAR, JSON.stringify(meta));
    if (!rapor.hata) {
      try {
        await fotoSenkron({
          yerelIdler: async () => (await metaOku()).map((f) => f.id),
          yerelOku: gorselHamOku,
          yerelYaz: gorselHamYaz,
          uzakListe: () => c.fotoListe(o, guncel.ciftlik_id),
          yukle: async (id, b) => void (await c.fotoYukle(o, guncel.ciftlik_id, id, b)),
          indir: (yol) => c.fotoIndir(o, yol),
        });
      } catch (e) {
        rapor.hata = `Foto: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    await kaliciSetItem(SON, JSON.stringify({ zaman: new Date().toISOString(), rapor }));
    return rapor;
  } finally {
    calisiyor = false;
  }
}

let zamanlayici: ReturnType<typeof setInterval> | null = null;

/** Uygulama açılışında çağrılır: periyodik + çevrimiçi olunca senkron. Bayrak kapalıysa no-op. */
export function bulutBaslat(): void {
  if (!bulutAyar() || zamanlayici) return;
  void baglantiyiIsle().catch(() => {}).then(() => simdiSenkronEt().catch(() => {}));
  zamanlayici = setInterval(() => void simdiSenkronEt().catch(() => {}), 60_000);
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', () => void simdiSenkronEt().catch(() => {}));
  }
}
