/** Web SpeechRecognition sonuç ayrıştırma — test edilebilir */

export type SttSatir = {
  metin: string;
  kesin: boolean;
};

export function sttSonucSatirlari(
  results: { length: number; [i: number]: { isFinal?: boolean; 0?: { transcript?: string } } },
): SttSatir[] {
  const satirlar: SttSatir[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const metin = String(r?.[0]?.transcript ?? '').trim();
    if (!metin) continue;
    satirlar.push({ metin, kesin: Boolean(r?.isFinal) });
  }
  return satirlar;
}

/** Dinleme olayındaki en güncel satır */
export function sttGuncelSatir(
  results: { length: number; [i: number]: { isFinal?: boolean; 0?: { transcript?: string } } },
  resultIndex: number,
): SttSatir | null {
  const r = results[resultIndex];
  if (!r) return null;
  const metin = String(r[0]?.transcript ?? '').trim();
  if (!metin) return null;
  return { metin, kesin: Boolean(r.isFinal) };
}
