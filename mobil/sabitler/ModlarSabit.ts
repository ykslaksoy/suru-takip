/**
 * Ürün (üretim) modları — 6 mod, ekranda `no` sırasıyla listelenir.
 *
 * Kimlikler (id) kayıtlı verilerle uyum için sabit tutuldu; `no` ekrandaki sıradır:
 *   no 1 · mod1 · Kuzu Besi                              (tam — eski "Kuzu alarak besi")
 *   no 2 · mod2 · Etçi Koyunculuk + Kuzu Besi            (yakında — eski "Koç katarak besi";
 *                                                         eski mod2 yolculuk/şablonları bu modun temeli)
 *   no 3 · mod3 · Damızlık Et Kuzusu Yetiştiriciliği     (yakında — eski "Damızlık kuzu")
 *   no 4 · mod6 · Damızlık Süt Kuzusu Yetiştiriciliği    (yakında — yeni)
 *   no 5 · mod4 · Süt Koyunculuğu                        (yakında — eski "Süt koyunculuğu")
 *   no 6 · mod5 · Süt Koyunculuğu + Kuzu Besi            (süt sürüsü + satın alım besi)
 *   no 7 · mod7 · Süt Koyunculuğu + Etçi Koyunculuk
 *
 * Kayıtlı değer "Yakında" bir moddaysa aktif mod mod1 (Kuzu Besi) açılır; değer silinmez.
 */
export type UrunModId = 'mod1' | 'mod2' | 'mod3' | 'mod4' | 'mod5' | 'mod6' | 'mod7';

/** Listeden kaldırılmış, yalnız eski kayıt uyumu için tanınan kimlikler (şu an yok) */
export const ESKI_MOD_ESLEME: Partial<Record<UrunModId, UrunModId>> = {};

/** tam = çalışıyor · pilot = deneme · yakinda = henüz yok, seçilemez */
export type ModSeviye = 'tam' | 'pilot' | 'yakinda';

export type UrunMod = {
  id: UrunModId;
  no: number;
  baslik: string;
  kisa: string;
  aciklama: string;
  icon: string;
  hazir: boolean;
  seviye: ModSeviye;
  href: string | null;
};

export const URUN_MODLARI: UrunMod[] = [
  {
    id: 'mod1',
    no: 1,
    baslik: 'Kuzu Besi',
    kisa: 'Kuzu al → besi',
    aciklama: '2–3 aylık kuzu al, karantina, aşı, tartım, rasyon.',
    icon: '🛒',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod2',
    no: 2,
    baslik: 'Etçi Koyunculuk + Kuzu Besi',
    kisa: 'Koç kat → kuzulat → besi',
    aciklama: 'Etçi sürüde koç katımı, kuzulama ve doğan kuzuların besiye alınması.',
    icon: '🐏',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod3',
    no: 3,
    baslik: 'Damızlık Et Kuzusu Yetiştiriciliği',
    kisa: 'Etçi damızlık · seleksiyon',
    aciklama: 'Etçi ırklarda damızlık kuzu yetiştirme, şecere ve seleksiyon.',
    icon: '🏆',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod6',
    no: 4,
    baslik: 'Damızlık Süt Kuzusu Yetiştiriciliği',
    kisa: 'Sütçü damızlık · seleksiyon',
    aciklama: 'Sütçü ırklarda damızlık kuzu yetiştirme ve verim seleksiyonu.',
    icon: '🍼',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod4',
    no: 5,
    baslik: 'Süt Koyunculuğu',
    kisa: 'Sağım / laktasyon',
    aciklama: 'Sağmal sürü, sağım kaydı, meme sağlığı ve süt rasyonu.',
    icon: '🥛',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod5',
    no: 6,
    baslik: 'Süt Koyunculuğu + Kuzu Besi',
    kisa: 'Süt sürüsü + kuzu al besi',
    aciklama:
      'Sağmal süt sürüsü; besi hattı satın alınan kuzularla (Mod 1 giriş paketi). Süt kuzusu isteğe bağlı damızlık/besi ayrımı.',
    icon: '🥛🐑',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
  {
    id: 'mod7',
    no: 7,
    baslik: 'Süt Koyunculuğu + Etçi Koyunculuk',
    kisa: 'Süt + et sürüsü',
    aciklama:
      'Süt kolu: sağım, laktasyon, meme sağlığı. Et kolu: koç kat, gebelik, kuzulatma. Ortak çiftleşme/doğum; süt kuzusu besi yolu satın alım ile birleşik.',
    icon: '🥛🐏',
    hazir: true,
    seviye: 'tam',
    href: '/(tabs)/yolculuk',
  },
];

/** Bilinen bir kimlik mi (listede ya da eski eşlemede) */
export function modIdGecerli(raw: unknown): raw is UrunModId {
  return (
    typeof raw === 'string' &&
    (URUN_MODLARI.some((m) => m.id === raw) || Object.prototype.hasOwnProperty.call(ESKI_MOD_ESLEME, raw))
  );
}

/**
 * Aktif olabilecek moda çöz: eski kimlik eşlenir, hazır olmayan (yakında) mod mod1'e düşer.
 * Kayıtlı değer silinmez; mod hazır olunca kendiliğinden geri gelir.
 */
export function aktifModaCoz(raw: unknown): UrunModId {
  if (!modIdGecerli(raw)) return 'mod1';
  const id = ESKI_MOD_ESLEME[raw] ?? raw;
  const mod = URUN_MODLARI.find((m) => m.id === id);
  return mod?.hazir ? mod.id : 'mod1';
}

export function getMod(id: UrunModId): UrunMod {
  const gercek = ESKI_MOD_ESLEME[id] ?? id;
  return URUN_MODLARI.find((m) => m.id === gercek) ?? URUN_MODLARI[0];
}
