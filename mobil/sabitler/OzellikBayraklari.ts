/**
 * Özellik olgunluk bayrakları — mağaza / pilot iletişiminde dürüst etiketler.
 */

export type OzellikDurum = 'tam' | 'pilot' | 'simulasyon' | 'yakinda';

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
    id: 'mod2-4',
    ad: 'Mod2–4 yolculuk',
    durum: 'pilot',
    aciklama: 'Mod1 kadar derin değil · temel checklist',
  },
  {
    id: 'bulut-senkron',
    ad: 'Bulut senkron',
    durum: 'yakinda',
    aciklama: 'EXPO_PUBLIC_API_URL tanımlanınca açılır',
  },
  {
    id: 'ocr-kupe',
    ad: 'Küpe OCR',
    durum: 'simulasyon',
    aciklama: 'Fotoğraftan okuma simüle',
  },
  {
    id: 'rfid',
    ad: 'RFID okuyucu',
    durum: 'simulasyon',
    aciklama: 'BLE donanım bağlantısı yok',
  },
  {
    id: 'turkvet-api',
    ad: 'TÜRKVET resmi API',
    durum: 'yakinda',
    aciklama: 'CSV dışa aktarım hazır',
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
    durum: 'simulasyon',
    aciklama: 'RevenueCat anahtarı + SDK sonraki sürüm',
  },
  {
    id: 'cok-kullanici',
    ad: 'Çok kullanıcı / rol',
    durum: 'yakinda',
    aciklama: 'Tek cihaz · yerel profil',
  },
];

export function ozellikDurumEtiketi(durum: OzellikDurum): string {
  const map: Record<OzellikDurum, string> = {
    tam: 'Hazır',
    pilot: 'Pilot',
    simulasyon: 'Simülasyon',
    yakinda: 'Yakında',
  };
  return map[durum];
}
