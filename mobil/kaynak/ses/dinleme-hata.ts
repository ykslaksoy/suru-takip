/** Web SpeechRecognition hata kodlarını kullanıcıya açık Türkçe metne çevirir */

export type DinlemeHataKodu =
  | 'not-allowed'
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'start-failed'
  | 'unsupported'
  | 'unknown';

export function dinlemeHataKodu(kod?: string): DinlemeHataKodu {
  const k = (kod ?? '').toLowerCase();
  if (k === 'not-allowed' || k === 'service-not-allowed') return 'not-allowed';
  if (k === 'no-speech') return 'no-speech';
  if (k === 'aborted') return 'aborted';
  if (k === 'audio-capture') return 'audio-capture';
  if (k === 'network') return 'network';
  if (k === 'bad-grammar' || k === 'language-not-supported') return 'language-not-supported';
  if (k === 'start-failed') return 'start-failed';
  if (k === 'unsupported') return 'unsupported';
  return 'unknown';
}

export function dinlemeHataMesaji(kod?: string, otomatikDinleme = false): string {
  switch (dinlemeHataKodu(kod)) {
    case 'not-allowed':
      return otomatikDinleme
        ? 'iPhone tarayıcısı otomatik dinlemeye izin vermeyebilir. Önce «Dinle»ye dokunun; gerekirse Site ayarlarından mikrofonu açın.'
        : 'Mikrofon izni verilmedi. Chrome → adres çubuğu kilit → Mikrofon → İzin ver. Veya komutu yazıp «Gönder»e basın.';
    case 'no-speech':
      return 'Ses duyulmadı. Tekrar «Dinle»ye basın veya komutu yazıp «Gönder»e basın.';
    case 'aborted':
      return 'Dinleme durdu. Tekrar denemek için «Dinle»ye basın.';
    case 'audio-capture':
      return 'Mikrofon kullanılamıyor (başka uygulama veya cihaz ayarı). Metin ile gönderin.';
    case 'network':
      return 'Ses tanıma ağ hatası (çevrimdışı olabilir). Komutu yazıp «Gönder»e basın.';
    case 'language-not-supported':
      return 'Tarayıcı Türkçe tanımayı desteklemiyor. Komutu kutuya yazın.';
    case 'start-failed':
    case 'unsupported':
      return 'Bu tarayıcıda canlı dinleme açılamadı. Komutu kutuya yazıp «Gönder»e basın.';
    default:
      return 'Dinleme başarısız. Komutu yazıp «Gönder»e basın.';
  }
}
