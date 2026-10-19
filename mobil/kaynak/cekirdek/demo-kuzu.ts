/** Demo/seed besi kuzuları — saf sabitler (besi kuzusu genelde erkektir) */
export const DEMO_KUZU_CINSIYET = 'male' as const;
export const DEMO_KUZU_ONEKLERI = ['padok-a-kuzu-', 'gozlem-kuzu-', 'padok-b-grup-', 'padok-c-grup-'];

/** Yalnızca demo kimlikli kuzular — kullanıcı kayıtlarına dokunmaz */
export function demoKuzuMu(id: string): boolean {
  return DEMO_KUZU_ONEKLERI.some((p) => id.startsWith(p));
}
