/**
 * Gerçek akış doğrulamaları — simülasyon yolu olmadığını ve gerçek ayrıştırıcıların
 * doğru çalıştığını kanıtlar (RFID BLE, OCR, IAP/RevenueCat, TÜRKVET CSV).
 */
import { rfidAkisCoz, rfidEtiketEsle, rfidOku, rfidBleDestekleniyor, RFID_BLE_PROFILLERI } from '@/kaynak/rfid/ble-okuyucu';
import { ocrKupeNormalize } from '@/kaynak/ocr/kupe';
import { ocrMetinOku, ocrMotorDestekleniyor } from '@/kaynak/ocr/motor';
import { aktifPaketCoz, iapOrtam, satinAlmaUrl } from '@/kaynak/abonelik/iap-ortam';
import { turkvetCsvCoz } from '@/kaynak/turkvet/csv';
import { test, type TestModul } from '../cerceve';

const G = 'Gerçek akış';

export const gercekAkisModul: TestModul = {
  grup: G,
  async calistir() {
    const r = [];
    // RFID
    const akis1 = rfidAkisCoz('', '\x02792000123456789\r\n98200');
    const akis2 = rfidAkisCoz(akis1.kalan, '0111222333\n');
    r.push(test(G, 'RFID: BLE akışı satırlara bölünür (STX/CRLF)', akis1.satirlar[0] === '792000123456789' && akis2.satirlar[0] === '982000111222333'));
    const iso = rfidEtiketEsle('792 000123456789');
    r.push(test(G, 'RFID: ISO 11784 Türkiye (792) → TR küpe', iso.earTag === 'TR-00-456789' && iso.gehisId === '792000123456789', iso.earTag));
    r.push(test(G, 'RFID: 3 GATT profili tanımlı', RFID_BLE_PROFILLERI.length === 3));
    r.push(test(G, 'RFID: Node ortamında BLE yok', !rfidBleDestekleniyor()));
    const ok = await rfidOku({ zamanAsimiMs: 10 });
    r.push(test(G, 'RFID: donanım yokken sahte etiket üretilmez', !ok.ok && ok.ham === '' && ok.earTagOneri === '', ok.message));
    // OCR
    r.push(test(G, 'OCR: TR küpe metni normalize', ocrKupeNormalize('tr 34 001234').earTag === 'TR-34-001234'));
    r.push(test(G, 'OCR: Node’da motor yok', !ocrMotorDestekleniyor()));
    const ocr = await ocrMetinOku('data:image/png;base64,AAAA');
    r.push(test(G, 'OCR: motor yokken rastgele küpe üretilmez', !ocr.ok));
    // IAP
    r.push(test(G, 'IAP: anahtar yokken yapılandırılmamış (simülasyon değil)', iapOrtam() === 'yapilandirilmamis'));
    const simdi = new Date('2026-10-30T00:00:00Z');
    const aktif = aktifPaketCoz(
      {
        subscriber: {
          entitlements: {
            p50: { expires_date: '2026-09-01T00:00:00Z' },
            p100: { expires_date: '2026-12-01T00:00:00Z' },
            pro: { expires_date: null, product_identifier: 'superkuzu_p75_aylik' },
          },
        },
      },
      simdi,
    );
    r.push(test(G, 'IAP: süresi geçmiş entitlement yok sayılır, en büyük aktif paket seçilir', aktif?.tier === 'p100', aktif?.tier));
    r.push(test(G, 'IAP: entitlement yoksa paket açılmaz', aktifPaketCoz({ subscriber: { entitlements: {} } }, simdi) === null));
    r.push(test(G, 'IAP: ödeme linki kullanıcı + paket taşır', satinAlmaUrl('https://pay.rev.cat/abc', 'sk_1', 'p100', 'yearly') === 'https://pay.rev.cat/abc/sk_1?package_id=p100_yillik'));
    // TÜRKVET CSV
    const csv = 'kulakKupeNo;turkvetKimlikNo;gehisElektronikKimlik\nTR-34-001234;TR340000001234;982000123456789\nTR-34-001235;KISA;\n;TR340000001236;\nTR-34-001237;TR340000001234;';
    const c = turkvetCsvCoz(csv);
    r.push(test(G, 'TÜRKVET CSV: 4 satır çözülür', c.satirlar.length === 4 && !c.hata));
    r.push(test(G, 'TÜRKVET CSV: geçerli satır hatasız', c.satirlar[0].hatalar.length === 0));
    r.push(test(G, 'TÜRKVET CSV: kısa no reddedilir', c.satirlar[1].hatalar.length > 0));
    r.push(test(G, 'TÜRKVET CSV: küpesiz satır reddedilir', c.satirlar[2].hatalar.includes('Küpe no boş')));
    r.push(test(G, 'TÜRKVET CSV: yinelenen TÜRKVET no yakalanır', c.satirlar[3].hatalar.some((h) => h.includes('aynı'))));
    r.push(test(G, 'TÜRKVET CSV: virgül ayırıcı + Türkçe başlık', turkvetCsvCoz('Kulak Küpe No,TÜRKVET Kimlik No\n"TR-1-2",TR3400000012').satirlar[0]?.turkvetKimlikNo === 'TR3400000012'));
    r.push(test(G, 'TÜRKVET CSV: küpe sütunu yoksa hata', !!turkvetCsvCoz('a;b\n1;2').hata));
    return r;
  },
};
