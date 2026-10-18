/** Sesli komut tercihleri — cihazda kalıcı (web: localStorage doğrulamalı). */
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';

const KEY_SESLI_TEKRAR = 'sy_ses_sesli_tekrar_v1';

/** Kayıt öncesi sesli tekrar açık mı? Varsayılan: açık. */
export async function sesliTekrarAcikMi(): Promise<boolean> {
  try {
    const v = await kaliciGetItem(KEY_SESLI_TEKRAR);
    return v !== '0';
  } catch {
    return true;
  }
}

export async function sesliTekrarKaydet(acik: boolean): Promise<void> {
  await kaliciSetItem(KEY_SESLI_TEKRAR, acik ? '1' : '0');
}
