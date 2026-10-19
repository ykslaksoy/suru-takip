/**
 * Standart yem besin değerleri (kuru madde bazında).
 * Kaynak: NRC (2007) "Nutrient Requirements of Small Ruminants" yem bileşim tabloları ve
 * INRA-CIRAD-AFZ Feedipedia (feedipedia.org) ortalama değerleri; Türkiye için Kutlu ve ark.,
 * "Yem Değerlendirme ve Analiz Yöntemleri" (Ç.Ü. Ziraat Fak.) tablolarıyla aynı aralıktadır.
 * Değerler yaklaşık ortalamalardır; parti analizi varsa kullanıcı ekrandan düzenleyebilir.
 * km: kuru madde % (yedirildiği hâliyle) · me: MJ/kg KM · hp: ham protein % KM · ca/p: % KM
 */
export type YemBesin = { ad: string; km: number; me: number; hp: number; ca: number; p: number; kaba: boolean; maksPay?: number; sabitPay?: number; /** Tahmini piyasa fiyatı ₺/kg (Ekim 2026, yaklaşık) */ tahminiFiyat?: number };

export const STANDART_YEMLER: YemBesin[] = [
  { ad: 'Arpa', tahminiFiyat: 15, km: 89, me: 12.8, hp: 12.4, ca: 0.06, p: 0.39, kaba: false },
  { ad: 'Mısır', tahminiFiyat: 14.5, km: 88, me: 13.6, hp: 9.4, ca: 0.03, p: 0.3, kaba: false },
  { ad: 'Buğday', tahminiFiyat: 14, km: 89, me: 13.6, hp: 14.2, ca: 0.05, p: 0.42, kaba: false, maksPay: 0.3 },
  { ad: 'Buğday kepeği', tahminiFiyat: 10, km: 89, me: 10.9, hp: 17.3, ca: 0.13, p: 1.13, kaba: false, maksPay: 0.3 },
  { ad: 'Ayçiçeği küspesi', tahminiFiyat: 14, km: 90, me: 9.6, hp: 32, ca: 0.4, p: 1.0, kaba: false },
  { ad: 'Soya küspesi', tahminiFiyat: 24, km: 89, me: 13.3, hp: 49.9, ca: 0.4, p: 0.71, kaba: false },
  { ad: 'Pamuk tohumu küspesi', tahminiFiyat: 15, km: 90, me: 10.5, hp: 44, ca: 0.2, p: 1.15, kaba: false, maksPay: 0.15 },
  { ad: 'Yonca kuru otu', tahminiFiyat: 12.9, km: 90, me: 9.0, hp: 18, ca: 1.4, p: 0.25, kaba: true },
  { ad: 'Buğday samanı', tahminiFiyat: 4.4, km: 91, me: 6.4, hp: 3.6, ca: 0.25, p: 0.08, kaba: true },
  { ad: 'Mısır silajı', tahminiFiyat: 3.5, km: 33, me: 10.8, hp: 8.0, ca: 0.25, p: 0.22, kaba: true },
  { ad: 'Mermer tozu (kireçtaşı)', tahminiFiyat: 3, km: 99, me: 0, hp: 0, ca: 38, p: 0, kaba: false, maksPay: 0.02 },
  { ad: 'Tuz', tahminiFiyat: 6, km: 99, me: 0, hp: 0, ca: 0, p: 0, kaba: false, sabitPay: 0.005 },
  { ad: 'Vitamin-mineral premiksi', tahminiFiyat: 60, km: 98, me: 0, hp: 0, ca: 0, p: 0, kaba: false, sabitPay: 0.003 },
];

/** Bilinmeyen (özel) yem için başlangıç değeri: kesif varsayımı */
export const OZEL_YEM: Omit<YemBesin, 'ad'> = { km: 88, me: 11, hp: 12, ca: 0.1, p: 0.4, kaba: false };

const kok = (w: string) => w.toLocaleLowerCase('tr').slice(0, 4);

/** Ada göre standart yem: yem adının tüm kelimeleri geçen, en çok kelimeli kayıt ("Buğday samanı" ≠ "Buğday") */
export function standartYem(ad: string): YemBesin | undefined {
  const s = ad.toLocaleLowerCase('tr');
  const kel = s.split(/[^a-zçğıöşü]+/u).filter(Boolean);
  let enIyi: YemBesin | undefined;
  let puan = 0;
  for (const y of STANDART_YEMLER) {
    const yk = y.ad.split(/[^A-Za-zÇĞİÖŞÜçğıöşü]+/u).filter(Boolean).map(kok);
    const tum = yk.every((k) => kel.some((w) => w.startsWith(k) || (w.length >= 2 && k.startsWith(w))));
    if (!tum) continue;
    // Tek kelimelik eşleşmede yem adı başka bir kayıtla daha çok eşleşebilir
    if (yk.length > puan) {
      puan = yk.length;
      enIyi = y;
    }
  }
  // "Buğday samanı" tek kelime "Buğday" ile eşleşmesin: yem adında kayıtta olmayan ayırt edici kelime varsa ve
  // o kelime başka kayıtta geçiyorsa (saman, kepek, küspe) zaten o kayıt seçilir.
  if (enIyi && puan === 1) {
    const ayirt = ['saman', 'kepe', 'küsp', 'sila'];
    if (kel.some((w) => ayirt.some((a) => w.startsWith(a))) && !enIyi.ad.toLocaleLowerCase('tr').split(' ').some((w) => ayirt.some((a) => w.startsWith(a)))) return undefined;
  }
  return enIyi;
}
