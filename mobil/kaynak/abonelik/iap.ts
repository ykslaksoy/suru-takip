/**
 * IAP adaptörü — gerçek ödeme: RevenueCat.
 *  - Satın alma: RevenueCat Web Purchase Link (Stripe/Apple Pay/Google Pay) — tarayıcıda açılır.
 *  - Doğrulama / geri yükleme: RevenueCat REST `GET /v1/subscribers/{app_user_id}` → aktif entitlement.
 *  - Entitlement kimliği paket kimliğiyle aynıdır: `p50`, `p100`, … (paketler.ts).
 * Ödeme yapılmadan ücretli paket AÇILMAZ. Ücretsiz paket ve tek seferlik deneme (iş kuralı) yereldir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import type { SubscriptionTier } from '@/kaynak/cekirdek/tipler';
import { denemeBaslat, denemeHakkiVarMi, getSubscriptionExpiry, getSubscriptionTier, setSubscriptionTier } from './limit';
import { paketBul, PAKET_LISTESI, VARSAYILAN_PAKET } from './paketler';
import { aktifPaketCoz, iapAyar, satinAlmaUrl, type RcAbone } from './iap-ortam';
export { iapOrtam, iapOrtamAciklama, iapAyar, aktifPaketCoz, satinAlmaUrl, type IapOrtam } from './iap-ortam';

const APP_USER_KEY = 'suruyon_iap_app_user_id';

export async function iapKullaniciKimligi(): Promise<string> {
  let id = await AsyncStorage.getItem(APP_USER_KEY);
  if (!id) {
    const rnd =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    id = `sk_${rnd}`;
    await AsyncStorage.setItem(APP_USER_KEY, id);
  }
  return id;
}

async function magazadanDogrula(): Promise<{ tier: SubscriptionTier; bitis: Date | null } | null | 'hata'> {
  const ayar = iapAyar();
  if (!ayar) return 'hata';
  try {
    const id = await iapKullaniciKimligi();
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${ayar.anahtar}`, 'Content-Type': 'application/json' },
    });
    if (!r.ok) return 'hata';
    return aktifPaketCoz((await r.json()) as RcAbone);
  } catch {
    return 'hata';
  }
}

export async function iapSatinAl(
  tier: SubscriptionTier,
  billing: 'monthly' | 'yearly'
): Promise<{ success: boolean; message: string }> {
  const paket = paketBul(tier);
  if (paket.ucretsiz) {
    await setSubscriptionTier(VARSAYILAN_PAKET);
    return { success: true, message: '30 kuzu ücretsiz pakete geçildi.' };
  }
  if (await denemeHakkiVarMi()) return denemeBaslat(tier);

  const ayar = iapAyar();
  if (!ayar) {
    return {
      success: false,
      message: 'Ücretli ödeme şu an kapalı (RevenueCat yapılandırılmadı). Paket açılmadı.',
    };
  }
  const id = await iapKullaniciKimligi();
  await WebBrowser.openBrowserAsync(satinAlmaUrl(ayar.satinAlmaLinki, id, tier, billing));
  const d = await magazadanDogrula();
  if (d && d !== 'hata') {
    await setSubscriptionTier(d.tier, d.bitis ?? undefined);
    return { success: true, message: `${paketBul(d.tier).label} paketi ödeme ile doğrulandı.` };
  }
  return {
    success: false,
    message: 'Ödeme henüz doğrulanmadı. Ödemeyi tamamladıysanız “Satın alımları geri yükle”ye dokunun.',
  };
}

/** Satın alımları geri yükle — RevenueCat kaydından doğrular */
export async function iapGeriYukle(): Promise<{ success: boolean; message: string; tier: SubscriptionTier }> {
  const d = await magazadanDogrula();
  if (d === 'hata') {
    const tier = await getSubscriptionTier();
    const expiry = await getSubscriptionExpiry();
    if (!paketBul(tier).ucretsiz && expiry && expiry < new Date()) {
      await setSubscriptionTier(VARSAYILAN_PAKET);
      return { success: true, message: 'Süresi dolmuş paket 30 kuzu ücretsize alındı.', tier: VARSAYILAN_PAKET };
    }
    return {
      success: false,
      message: iapAyar() ? 'Mağaza kaydına ulaşılamadı — internet bağlantısını kontrol edin.' : 'Ödeme altyapısı yapılandırılmadı; geri yüklenecek mağaza kaydı yok.',
      tier,
    };
  }
  if (!d) {
    const tier = await getSubscriptionTier();
    const expiry = await getSubscriptionExpiry();
    if (!paketBul(tier).ucretsiz && (!expiry || expiry < new Date())) await setSubscriptionTier(VARSAYILAN_PAKET);
    return { success: true, message: 'Aktif ücretli abonelik bulunamadı.', tier: await getSubscriptionTier() };
  }
  await setSubscriptionTier(d.tier, d.bitis ?? undefined);
  return {
    success: true,
    message: `${paketBul(d.tier).label} paketi geri yüklendi${d.bitis ? ` · bitiş ${d.bitis.toLocaleDateString('tr-TR')}` : ''}.`,
    tier: d.tier,
  };
}

export { PAKET_LISTESI };
