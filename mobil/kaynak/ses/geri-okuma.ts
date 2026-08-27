import type { SesKomutEylemi } from './tipler';
import { onayIpucuMetni } from './onay';

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
