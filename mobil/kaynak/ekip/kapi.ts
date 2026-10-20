/**
 * Yetki kapısı — döngüsel içe aktarma olmadan her modülün çağırabileceği tek nokta.
 * Ekip deposu açılışta denetleyiciyi bağlar; bağlanmadan önce her şeye izin verilir.
 */
import type { Yetki } from './hesap';

let denetleyici: (y: Yetki) => string | null = () => null;

export function setYetkiDenetleyici(f: (y: Yetki) => string | null): void {
  denetleyici = f;
}

/** Yetki yoksa açıklayıcı mesaj, varsa null */
export function yetkiEngeli(y: Yetki): string | null {
  return denetleyici(y);
}

export function yetkiGerekli(y: Yetki): void {
  const m = denetleyici(y);
  if (m) throw new Error(m);
}
