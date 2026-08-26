import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICES, type SubscriptionTier } from '@/kaynak/cekirdek/tipler';

const TIERS: SubscriptionTier[] = ['free', 'farmer', 'professional', 'enterprise'];

export default function SubscriptionScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tier, purchase } = useSubscription();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const buy = async (t: SubscriptionTier) => {
    if (t === 'enterprise') {
      Alert.alert('Kurumsal', 'Damızlık ve kooperatifler için özel teklif: info@suruyon.app');
      return;
    }
    const result = await purchase(t, billing);
    Alert.alert(result.success ? 'Başarılı' : 'Hata', result.message);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Freemium model — 30 hayvana kadar ücretsiz. App Store / Play Store abonelik entegrasyonu production build&apos;de aktif edilecek.
      </Text>

      <View style={styles.billingRow}>
        {(['monthly', 'yearly'] as const).map((b) => (
          <AnaButon
            key={b}
            title={b === 'monthly' ? 'Aylık' : 'Yıllık (%17 indirim)'}
            variant={billing === b ? 'primary' : 'secondary'}
            onPress={() => setBilling(b)}
          />
        ))}
      </View>

      {TIERS.map((t) => {
        const info = SUBSCRIPTION_PRICES[t];
        const price = billing === 'yearly' ? info.yearly : info.monthly;
        const active = tier === t;
        return (
          <View
            key={t}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: active ? colors.tint : colors.border,
                borderWidth: active ? 2 : 1,
              },
            ]}>
            <Text style={[styles.planName, { color: colors.text }]}>{info.label}</Text>
            <Text style={[styles.price, { color: colors.tint }]}>
              {t === 'enterprise' ? 'Özel teklif' : t === 'free' ? '0 TL' : `${price} TL/${billing === 'yearly' ? 'yıl' : 'ay'}`}
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
              {SUBSCRIPTION_LIMITS[t] >= 999999 ? 'Sınırsız hayvan' : `${SUBSCRIPTION_LIMITS[t]} hayvana kadar`}
            </Text>
            {t !== 'free' && (
              <AnaButon
                title={active ? 'Aktif Paket' : 'Satın Al (Simülasyon)'}
                variant={active ? 'secondary' : 'primary'}
                disabled={active}
                onPress={() => buy(t)}
              />
            )}
          </View>
        );
      })}

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Production: expo-in-app-purchases veya RevenueCat ile gerçek IAP. Mevcut simülasyon geliştirme/test içindir.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  intro: { marginBottom: 16, lineHeight: 20 },
  billingRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  card: { borderRadius: 14, padding: 18, marginBottom: 12 },
  planName: { fontSize: 20, fontWeight: '800' },
  price: { fontSize: 22, fontWeight: '700', marginVertical: 6 },
  note: { fontSize: 12, marginTop: 8, marginBottom: 32, lineHeight: 18 },
});
