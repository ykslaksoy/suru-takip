/**
 * Ekip, roller ve yetkiler — saf hesap.
 * Cihaz düzeyi profiller: aynı telefonu/tableti kullanan kişiler. Sunucu yok.
 */
export type Rol = 'sahip' | 'ortak' | 'bakici' | 'veteriner';
export type Yetki = 'finans' | 'silme' | 'duzenleme' | 'tedavi';

export type Kisi = {
  id: string;
  ad: string;
  rol: Rol;
  yetkiler: Record<Yetki, boolean>;
  /** İsteğe bağlı 4–6 haneli PIN özeti (bu profile geçişte sorulur) */
  pinOzet?: string;
  olusturma: string;
};

export type EkipDurumu = { kisiler: Kisi[]; aktifId: string };

export const ROLLER: Rol[] = ['sahip', 'ortak', 'bakici', 'veteriner'];
export const YETKILER: Yetki[] = ['finans', 'silme', 'duzenleme', 'tedavi'];

export const ROL_ETIKET: Record<Rol, string> = { sahip: 'Sahip', ortak: 'Ortak', bakici: 'Bakıcı', veteriner: 'Veteriner' };
export const ROL_SIMGE: Record<Rol, string> = { sahip: '👑', ortak: '🤝', bakici: '🧑‍🌾', veteriner: '🩺' };

export const YETKI_ETIKET: Record<Yetki, string> = {
  finans: 'Para / maliyet görür',
  silme: 'Kayıt silebilir',
  duzenleme: 'Sürü ve ayarları düzenler',
  tedavi: 'Tedavi / aşı girer',
};

export const YETKI_ACIKLAMA: Record<Yetki, string> = {
  finans: 'Maliyet ve kâr, satış tutarı, yem ₺, Excel maliyet sayfası',
  silme: 'Kuzu, tartım, sağlık kaydı, rasyon, poliçe, şablon silme; kalıcı silme',
  duzenleme: 'Kuzu bilgisi, parti, satış/çıkış, içe aktarma, şablon ve rasyon kurma, ayarlar',
  tedavi: 'Tek kuzuya ya da topluca ilaç/aşı kaydı, şablon uygulama',
};

export const VARSAYILAN_YETKI: Record<Rol, Record<Yetki, boolean>> = {
  sahip: { finans: true, silme: true, duzenleme: true, tedavi: true },
  ortak: { finans: true, silme: true, duzenleme: true, tedavi: true },
  bakici: { finans: false, silme: false, duzenleme: false, tedavi: true },
  veteriner: { finans: false, silme: false, duzenleme: false, tedavi: true },
};

export const VARSAYILAN_SAHIP_ID = 'sahip';

export function varsayilanEkip(simdi = new Date().toISOString()): EkipDurumu {
  return {
    kisiler: [{ id: VARSAYILAN_SAHIP_ID, ad: 'Sahip', rol: 'sahip', yetkiler: { ...VARSAYILAN_YETKI.sahip }, olusturma: simdi }],
    aktifId: VARSAYILAN_SAHIP_ID,
  };
}

/** Sahip her şeyi yapar; diğerleri kendi anahtarlarına göre */
export function yetkiVar(k: Pick<Kisi, 'rol' | 'yetkiler'> | null | undefined, y: Yetki): boolean {
  if (!k) return true;
  if (k.rol === 'sahip') return true;
  return !!k.yetkiler?.[y];
}

export function ekipYonetebilir(k: Pick<Kisi, 'rol'> | null | undefined): boolean {
  return !k || k.rol === 'sahip';
}

export function yetkiMesaji(y: Yetki, k?: Pick<Kisi, 'ad' | 'rol'> | null): string {
  return `${k ? `${k.ad} (${ROL_ETIKET[k.rol]})` : 'Bu kullanıcı'} için yetki yok: ${YETKI_ETIKET[y].toLocaleLowerCase('tr')}. Sahip, Ekip ekranından açabilir.`;
}

/** Bozuk / eski kaydı onarır: en az bir sahip, geçerli aktif kişi, tüm yetki anahtarları */
export function ekipOnar(d: Partial<EkipDurumu> | null | undefined): EkipDurumu {
  const kisiler = (Array.isArray(d?.kisiler) ? d!.kisiler : [])
    .filter((k) => k && k.id && ROLLER.includes(k.rol))
    .map((k) => ({ ...k, ad: (k.ad || ROL_ETIKET[k.rol]).trim(), yetkiler: { ...VARSAYILAN_YETKI[k.rol], ...(k.yetkiler ?? {}) } }));
  if (!kisiler.some((k) => k.rol === 'sahip')) return varsayilanEkip();
  const aktifId = kisiler.some((k) => k.id === d?.aktifId) ? d!.aktifId! : kisiler.find((k) => k.rol === 'sahip')!.id;
  return { kisiler, aktifId };
}

export function kisiDogrula(kisiler: Kisi[], k: Pick<Kisi, 'id' | 'ad' | 'rol'>): string | null {
  const ad = k.ad.trim();
  if (!ad) return 'Ad yaz';
  if (ad.length > 40) return 'Ad çok uzun';
  if (kisiler.some((x) => x.id !== k.id && x.ad.trim().toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'))) return 'Bu adda biri zaten var';
  const eski = kisiler.find((x) => x.id === k.id);
  if (eski?.rol === 'sahip' && k.rol !== 'sahip' && kisiler.filter((x) => x.rol === 'sahip').length === 1) return 'Son sahibin rolü değiştirilemez';
  return null;
}

export function kisiSilinebilir(kisiler: Kisi[], id: string, aktifId: string): string | null {
  const k = kisiler.find((x) => x.id === id);
  if (!k) return 'Kişi yok';
  if (k.rol === 'sahip' && kisiler.filter((x) => x.rol === 'sahip').length === 1) return 'Son sahip silinemez';
  if (id === aktifId) return 'Önce başka kullanıcıya geç';
  return null;
}

/** Basit, tuzlu PIN özeti (FNV-1a). Kriptografik değildir; cihazdaki gündelik geçişi korur. */
export function pinOzeti(pin: string, tuz: string): string {
  let h = 0x811c9dc5;
  const s = `${tuz}:${pin}:superkuzu`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function pinGecerli(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function pinDogru(k: Pick<Kisi, 'id' | 'pinOzet'>, pin: string): boolean {
  return !k.pinOzet || k.pinOzet === pinOzeti(pin, k.id);
}

export function kisiEtiket(k: Pick<Kisi, 'ad' | 'rol'>): string {
  return `${k.ad} (${ROL_ETIKET[k.rol]})`;
}

/** Cihazdaki ekstra profil / PIN — bulut `ciftlik_uye` ile karıştırılmamalı */
export function yerelEkipProfiliVar(d: EkipDurumu): boolean {
  if (d.kisiler.length > 1) return true;
  const k = d.kisiler[0];
  if (!k) return false;
  return !!k.pinOzet || k.ad !== 'Sahip' || k.rol !== 'sahip';
}
