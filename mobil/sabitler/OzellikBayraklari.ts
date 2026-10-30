/**
 * Özellik olgunluk bayrakları — mağaza / pilot iletişiminde dürüst etiketler.
 */

export type OzellikDurum = 'tam' | 'pilot' | 'yakinda';

export type OzellikBayrak = {
  id: string;
  ad: string;
  durum: OzellikDurum;
  aciklama: string;
};

export const OZELLIK_BAYRAKLARI: OzellikBayrak[] = [
  {
    id: 'mod1-hizli-besi',
    ad: 'Mod1 · hızlı besi planı',
    durum: 'tam',
    aciklama: 'Padok, aşı, tartım, selenyum, karma rapel',
  },
  {
    id: 'akilli-veteriner',
    ad: 'Akıllı veteriner',
    durum: 'pilot',
    aciklama: 'Yerel kural motoru · teşhis veteriner hekime aittir',
  },
  {
    id: 'mod2-7',
    ad: 'Mod 2–7 (etçi, damızlık, süt)',
    durum: 'tam',
    aciklama: 'Etçi, damızlık, süt koyunculuğu, süt+besi, süt+etçi kombinasyonları',
  },
  {
    id: 'bulut-senkron',
    ad: 'Bulut senkron',
    durum: 'pilot',
    aciklama: 'Supabase — web/PWA; çiftlik, ekip, foto eşitleme',
  },
  {
    id: 'mera-harita',
    ad: 'Mera / padok haritası',
    durum: 'pilot',
    aciklama: 'Yerel GeoJSON · padok noktaları · /suru bağlantısı',
  },
  {
    id: 'ocr-kupe',
    ad: 'Küpe OCR',
    durum: 'pilot',
    aciklama: 'Kamera fotoğrafından gerçek OCR (web: TextDetector / Tesseract)',
  },
  {
    id: 'rfid',
    ad: 'RFID okuyucu',
    durum: 'pilot',
    aciklama: 'Web Bluetooth BLE okuyucu (Nordic UART / HM-10 / ISSC)',
  },
  {
    id: 'turkvet-api',
    ad: 'TÜRKVET CSV köprüsü',
    durum: 'tam',
    aciklama: 'CSV dışa + içe aktarım, alan doğrulama (Bakanlık açık API sunmuyor)',
  },
  {
    id: 'ureme-dogum',
    ad: 'Üreme / doğum kaydı',
    durum: 'tam',
    aciklama: 'Gebe işaretle · doğumda kuzu + anne bağlama',
  },
  {
    id: 'ozet-rapor-csv',
    ad: 'Sürü özet CSV',
    durum: 'tam',
    aciklama: 'Padok / durum / aşı özeti · Excel’de açılır',
  },
  {
    id: 'iap',
    ad: 'Mağaza ödemesi',
    durum: 'pilot',
    aciklama: 'RevenueCat ödeme sayfası + abonelik doğrulama; ödeme olmadan ücretli paket açılmaz',
  },
  {
    id: 'cok-kullanici',
    ad: 'Çok kullanıcı / rol',
    durum: 'pilot',
    aciklama: 'Bulut çiftlik: sahip / ortak / bakıcı / veteriner rolleri, davet kodu',
  },
];

export function ozellikDurumEtiketi(durum: OzellikDurum): string {
  const map: Record<OzellikDurum, string> = {
    tam: 'Hazır',
    pilot: 'Pilot',
    yakinda: 'Yakında',
  };
  return map[durum];
}
