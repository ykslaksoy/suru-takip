import { flushSyncQueue, getSyncQueueEntries } from '@/kaynak/cekirdek/veritabani';
import { bulutSenkronAktif } from '@/sabitler/Ortam';
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
    return { islenen: 0, kalan: 0, mesaj: 'Bekleyen kayıt yok.' };
  }

  if (!bulutSenkronAktif()) {
    return {
      islenen: 0,
      kalan: bekleyen,
      mesaj: `${bekleyen} kayıt bu cihazda bekliyor. Bulut bağlantısı bu sürümde yapılandırılmamış — yerel kayıtlar silinmez.`,
    };
  }

  const legacyOnce = (await getSyncQueueEntries()).length;
  const rapor = await simdiSenkronEt();
  if (!rapor) {
    return {
      islenen: 0,
      kalan: bekleyen,
      mesaj: 'Buluta göndermek için Daha → Bulut: e-posta kodu ile giriş ve çiftlik seçimi gerekli. Yeni hesap otomatik açılmaz.',
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
  const bekleyen = await getSenkronBekleyenSayisi();
  if (bekleyen === 0) {
    return bulutSenkronAktif()
      ? 'Bulut senkron güncel (son deneme başarılı veya bekleyen yok).'
      : 'Yerel kayıtlar güncel. Bulut API bu derlemede yok — JSON/Excel yedek önerilir.';
  }
  return bulutSenkronAktif()
    ? `${bekleyen} değişiklik buluta gönderilmeyi bekliyor — Bulut ekranından giriş yapıp “Şimdi eşitle”.`
    : `${bekleyen} kayıt yalnızca bu cihazda (bulut yapılandırması kapalı).`;
}
