/**
 * RFID / elektronik küpe okuyucu.
 * Varsayılan: simülasyon (BLE donanımı yok).
 * Aynı API ileride gerçek BLE okuyucuya bağlanır.
 */

export type RfidOkuyucuDurum = 'kapali' | 'hazir' | 'okuyor' | 'hata' | 'simulasyon';

export type RfidOkumaSonuc = {
  ok: boolean;
  durum: RfidOkuyucuDurum;
  /** Ham etiket (EPC / GEKİS benzeri) */
  ham: string;
  /** Normalize küpe önerisi */
  earTagOneri: string;
  gehisIdOneri: string;
  message: string;
};

let simulasyonAcik = true;

export function rfidSimulasyonMu(): boolean {
  return simulasyonAcik;
}

export function rfidSimulasyonAyarla(acik: boolean): void {
  simulasyonAcik = acik;
}

export function rfidDurum(): RfidOkuyucuDurum {
  return simulasyonAcik ? 'simulasyon' : 'kapali';
}

export function rfidDurumEtiket(d: RfidOkuyucuDurum): string {
  const map: Record<RfidOkuyucuDurum, string> = {
    kapali: 'Okuyucu kapalı',
    hazir: 'Hazır',
    okuyor: 'Okunuyor…',
    hata: 'Hata',
    simulasyon: 'Simülasyon modu',
  };
  return map[d];
}

/** Ham RFID → küpe / GEKİS önerisi */
export function rfidEtiketEsle(ham: string): { earTag: string; gehisId: string } {
  const cleaned = ham.replace(/\s/g, '').toUpperCase();
  const gehisId = cleaned.length >= 8 ? cleaned.slice(0, 16) : cleaned;
  // Küpe: TR-XX-XXXXXX benzeri
  const digits = cleaned.replace(/\D/g, '');
  const earTag =
    digits.length >= 6
      ? `TR-${digits.slice(0, 2) || '00'}-${digits.slice(-6)}`
      : cleaned.slice(0, 14);
  return { earTag, gehisId };
}

/**
 * Etiket oku — simülasyonda rastgele/geçilen ham değer.
 * Gerçek BLE: aynı imza, donanım SDK’sı içeride.
 */
export async function rfidOku(opts?: { hamSimulasyon?: string }): Promise<RfidOkumaSonuc> {
  if (!simulasyonAcik) {
    return {
      ok: false,
      durum: 'kapali',
      ham: '',
      earTagOneri: '',
      gehisIdOneri: '',
      message: 'BLE okuyucu bağlı değil. Simülasyonu açın veya donanım eşleştirin.',
    };
  }

  await new Promise((r) => setTimeout(r, 350));
  const stamp = Date.now().toString().slice(-8);
  const ham = (opts?.hamSimulasyon ?? `GEKIS${stamp}RFID`).toUpperCase();
  const esle = rfidEtiketEsle(ham);
  return {
    ok: true,
    durum: 'simulasyon',
    ham,
    earTagOneri: esle.earTag,
    gehisIdOneri: esle.gehisId,
    message: `Simüle okuma: ${ham}`,
  };
}
