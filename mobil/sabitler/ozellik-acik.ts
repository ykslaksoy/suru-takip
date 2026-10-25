import { OZELLIK_BAYRAKLARI } from '@/sabitler/OzellikBayraklari';

function envOverride(id: string): boolean | null {
  const anahtar = `EXPO_PUBLIC_OZELLIK_${id.replace(/-/g, '_').toUpperCase()}`;
  const v = String(process.env[anahtar] ?? '').trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'kapali') return false;
  if (v === '1' || v === 'true' || v === 'acik') return true;
  return null;
}

/** Pilot / tam bayraklar varsayılan açık; `EXPO_PUBLIC_OZELLIK_*` ile kapatılabilir. */
export function ozellikPilotAcik(id: string): boolean {
  const o = envOverride(id);
  if (o !== null) return o;
  const b = OZELLIK_BAYRAKLARI.find((x) => x.id === id);
  if (!b) return false;
  return b.durum === 'tam' || b.durum === 'pilot';
}

export function meraHaritaAktif(): boolean {
  return ozellikPilotAcik('mera-harita');
}
