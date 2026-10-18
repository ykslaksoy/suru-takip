import type { SesKomutEylemi } from './tipler';
import { onayIpucuMetni } from './onay';
import { kupeOku, sayiOku } from './sayi-oku';

function formatKilo(kg: number): string {
  return Number.isInteger(kg) ? `${kg}` : kg.toFixed(1).replace('.', ',');
}

/** Onay öncesi kullanıcıya okunacak özet */
export function geriOkumaMetni(eylem: SesKomutEylemi): string {
  switch (eylem.tur) {
    case 'tartim':
      return (
        `Tartım kaydı: küpe ${eylem.kupeArama}, ${formatKilo(eylem.kiloKg)} kilo. ` +
        onayIpucuMetni()
      );
    case 'asi':
      return (
        `Aşı kaydı: küpe ${eylem.kupeArama}, ${eylem.asiAdi}. ` +
        onayIpucuMetni()
      );
    case 'stok':
      return (
        `Stok ${eylem.yon === 'giris' ? 'girişi' : 'çıkışı'}: ${eylem.stokAdi}, ` +
        `${formatKilo(eylem.miktar)} ${eylem.birim}. ` +
        onayIpucuMetni()
      );
    default:
      return onayIpucuMetni();
  }
}

export function anlasilmadiMetni(): string {
  return 'Anlamadım. Örnek: küpe 1234, 68 kilo. Onay için önce komutu okuyacağım, sonra tamam demen gerekir.';
}

export function uygulandiMetni(eylem: SesKomutEylemi): string {
  switch (eylem.tur) {
    case 'tartim':
      return `Tamam, ${eylem.kupeArama} için ${formatKilo(eylem.kiloKg)} kilo kaydedildi.`;
    case 'asi':
      return `Tamam, ${eylem.kupeArama} için aşı kaydı oluşturuldu.`;
    case 'stok':
      return `Tamam, stok hareketi kaydedildi.`;
    default:
      return 'Tamam, kayıt yapıldı.';
  }
}

export function iptalMetni(): string {
  return 'Tamam, iptal ettim. Yeni komut söyleyebilirsin.';
}

function asiAdiSesli(ad: string): string {
  const a = ad.trim();
  return /aşı/i.test(a) ? a : `${a} aşısı`;
}

/**
 * Onay öncesi SESLİ okunacak cümle — sayılar anlaşılır okunur.
 * Örn: "Küpe bin iki yüz, çiçek aşısı yapıldı. Onaylıyor musunuz?"
 */
export function onayCumlesi(eylem: SesKomutEylemi): string {
  const soru = 'Onaylıyor musunuz?';
  switch (eylem.tur) {
    case 'tartim':
      return `Küpe ${kupeOku(eylem.kupeArama)}, ${sayiOku(eylem.kiloKg)} kilo. ${soru}`;
    case 'asi':
      return `Küpe ${kupeOku(eylem.kupeArama)}, ${asiAdiSesli(eylem.asiAdi)} yapıldı. ${soru}`;
    case 'stok':
      return (
        `Stok ${eylem.yon === 'giris' ? 'girişi' : 'çıkışı'}, ${eylem.stokAdi}, ` +
        `${sayiOku(eylem.miktar)} ${eylem.birim}. ${soru}`
      );
    default:
      return soru;
  }
}

/** Düzeltme için metin kutusuna yazılacak komut (yeniden ayıklanabilir biçim) */
export function komutMetni(eylem: SesKomutEylemi, ham?: string): string {
  switch (eylem.tur) {
    case 'tartim':
      return `küpe ${eylem.kupeArama}, ${formatKilo(eylem.kiloKg)} kilo`;
    case 'asi':
      return `küpe ${eylem.kupeArama} aşı ${eylem.asiAdi}`;
    default:
      return ham ?? '';
  }
}

/** "Dur / yanlış" sonrası söylenecek cümle */
export function duzeltmeSorusu(eylem: SesKomutEylemi): string {
  return eylem.tur === 'stok'
    ? 'Kaydedilmedi. Doğru miktarı söyleyin.'
    : 'Kaydedilmedi. Doğru küpe numarasını söyleyin.';
}

export function duzeltmeIpucuMetni(eylem: SesKomutEylemi): string {
  if (eylem.tur === 'tartim') {
    return 'Yeni küpe numarasını söyleyin (kiloyu düzeltmek için örn. "52 kilo"). Komutu kutuda düzenleyip Gönder’e de basabilirsiniz. Vazgeçmek için "iptal".';
  }
  if (eylem.tur === 'asi') {
    return 'Yeni küpe numarasını söyleyin. Komutu kutuda düzenleyip Gönder’e de basabilirsiniz. Vazgeçmek için "iptal".';
  }
  return 'Doğru miktarı söyleyin veya komutu kutuda düzenleyip Gönder’e basın. Vazgeçmek için "iptal".';
}
