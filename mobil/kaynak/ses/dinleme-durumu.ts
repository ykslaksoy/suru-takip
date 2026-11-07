/** Mikrofon / STT arayüz durumları — transkriptten ayrı; seviye çubuğu tanıma iddiası etmez. */

export type SesDinlemeDurumu =
  | 'durdu'
  | 'izin_istek'
  | 'dinliyor'
  | 'ses_algilandi'
  | 'isleniyor'
  | 'hata';

export function dinlemeDurumuEtiket(d: SesDinlemeDurumu): string {
  switch (d) {
    case 'durdu':
      return 'Dinleme kapalı';
    case 'izin_istek':
      return 'Mikrofon izni isteniyor';
    case 'dinliyor':
      return 'Dinleniyor — konuşun';
    case 'ses_algilandi':
      return 'Ses algılandı (henüz metin yok)';
    case 'isleniyor':
      return 'Metin işleniyor';
    case 'hata':
      return 'Dinleme hatası';
    default:
      return 'Dinleme';
  }
}

/** Erişilebilir özet: seviye ölçer yoksa dürüst fallback */
export function dinlemeErisilebilirOzet(d: SesDinlemeDurumu, seviyeOlcumVar: boolean): string {
  const temel = dinlemeDurumuEtiket(d);
  if (!seviyeOlcumVar && (d === 'dinliyor' || d === 'ses_algilandi')) {
    return `${temel}. Bu ortamda canlı ses çubuğu yok; tanıma sonucu «Algılanan» satırında görünür.`;
  }
  return temel;
}
