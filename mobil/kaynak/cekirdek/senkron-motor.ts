import { flushSyncQueue, getSyncQueueEntries } from '@/kaynak/cekirdek/veritabani';
import { bulutOrtamBekle } from '@/kaynak/bulut/ayar';
import { getSenkronBekleyenSayisi } from '@/kaynak/bulut/bekleyen-sayim';
import { simdiSenkronEt } from '@/kaynak/bulut/servis';

export type SenkronSonuc = {
  islenen: number;
  kalan: number;
  mesaj: string;
};

/**
 * Manuel kuyruk işleme: yalnızca oturum + çiftlik + sunucu yanıtı sonrası legacy kuyruk temizlenir.
 */
export async function isleSenkronKuyrugu(): Promise<SenkronSonuc> {
  const bekleyen = await getSenkronBekleyenSayisi();
  if (bekleyen === 0) {
    const bulutHazir = await bulutOrtamBekle();
    if (bulutHazir) {
      return {
        islenen: 0,
        kalan: 0,
        mesaj: 'Bekleyen kuyruk yok. Buluta aktarmak için Daha → Bulut: giriş yapıp “Şimdi eşitle”.',
      };
    }
    return { islenen: 0, kalan: 0, mesaj: 'Bekleyen kayıt yok (yerel sürü/stok kayıtları duruyor).' };
  }

  const bulutHazir = await bulutOrtamBekle();
  if (!bulutHazir) {
    return {
      islenen: 0,
      kalan: bekleyen,
      mesaj: `${bekleyen} kayıt bu cihazda bekliyor. Bulut yapılandırması yüklenemedi — sayfayı yenileyin veya Daha → Bulut → Tekrar dene.`,
    };
  }

  const legacyOnce = (await getSyncQueueEntries()).length;
  const rapor = await simdiSenkronEt();
  if (!rapor) {
    return {
      islenen: 0,
      kalan: bekleyen,
      mesaj: 'Buluta göndermek için Daha → Bulut: e-posta kodu ile giriş ve çiftlik seçimi gerekli.',
    };
  }
  if (rapor.hata) {
    const kalan = await getSenkronBekleyenSayisi();
    return { islenen: 0, kalan, mesaj: `Sunucu yanıt vermedi; kayıtlar cihazda kaldı. ${rapor.hata}` };
  }

  let legacyTemiz = 0;
  if (legacyOnce > 0 && rapor.gonderilenAnahtarlar?.includes('sy_animals')) {
    legacyTemiz = await flushSyncQueue();
  }

  const kalan = await getSenkronBekleyenSayisi();
  const islenen = rapor.gonderilen + (legacyTemiz > 0 ? legacyTemiz : 0);
  const mesaj =
    kalan === 0
      ? `Bulutla eşitlendi (${rapor.gonderilen} belge gönderildi, ${rapor.alinan} alındı).`
      : `${rapor.gonderilen} belge gönderildi; ${kalan} bekliyor (ağ veya yetki).`;

  return { islenen, kalan, mesaj };
}

export async function senkronDurumOzet(): Promise<string> {
  const [bekleyen, bulutHazir] = await Promise.all([getSenkronBekleyenSayisi(), bulutOrtamBekle()]);

  if (!bulutHazir) {
    return bekleyen > 0
      ? `${bekleyen} kayıt cihazda bekliyor; bulut ayarı henüz yüklenmedi. Daha → Bulut veya sayfayı yenileyin.`
      : 'Yerel kayıtlar cihazda. Bulut ayarı yüklenemedi — Daha → Bulut ekranında “Tekrar dene” veya Safari’de bir kez yenileyin.';
  }

  if (bekleyen === 0) {
    return 'Bulut bağlantısı hazır. Bekleyen kuyruk satırı yok; sürü/stok verileri cihazda. Aktarmak için Daha → Bulut → giriş → “Şimdi eşitle”.';
  }

  return `${bekleyen} değişiklik gönderilmeyi bekliyor (legacy kuyruk veya belge listesi). Daha → Bulut: giriş yapıp “Şimdi eşitle”.`;
}
