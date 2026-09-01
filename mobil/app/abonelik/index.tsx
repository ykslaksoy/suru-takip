import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import {
  KUZU_BASI_AYLIK_TL,
  PAKET_LISTESI,
  SUBSCRIPTION_LIMITS,
  SUBSCRIPTION_PRICES,
  type SubscriptionTier,
} from '@/kaynak/abonelik/paketler';

export default function AbonelikEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tier, purchase, restore, iapAciklama } = useSubscription();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const buy = async (t: SubscriptionTier) => {
    const result = await purchase(t, billing);
    Alert.alert(result.success ? 'Başarılı' : 'Hata', result.message);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        30 kuzu ücretsiz · ücretli paketler 1 TL/kuzu/ay. {iapAciklama}
      </Text>

      <View style={styles.billingRow}>
        {(['monthly', 'yearly'] as const).map((b) => (
          <AnaButon
            key={b}
            title={b === 'monthly' ? 'Aylık' : 'Yıllık (~2 ay indirim)'}
            variant={billing === b ? 'primary' : 'secondary'}
            onPress={() => setBilling(b)}
          />
        ))}
      </View>

      {PAKET_LISTESI.map((paket) => {
        const info = SUBSCRIPTION_PRICES[paket.id];
        const price = billing === 'yearly' ? info.yearly : info.monthly;
        const active = tier === paket.id;
        return (
          <View
            key={paket.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: active ? colors.tint : colors.border,
                borderWidth: active ? 2 : 1,
              },
            ]}>
            <Text style={[styles.planName, { color: colors.text }]}>
              {info.label}
              {paket.ucretsiz ? ' · Ücretsiz' : ''}
            </Text>
            <Text style={[styles.price, { color: colors.tint }]}>
              {paket.ucretsiz ? '0 TL' : `${price} TL/${billing === 'yearly' ? 'yıl' : 'ay'}`}
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
              {SUBSCRIPTION_LIMITS[paket.id]} hayvana kadar
              {!paket.ucretsiz ? ` · ${KUZU_BASI_AYLIK_TL} TL/kuzu/ay` : ''}
            </Text>
            {!paket.ucretsiz && (
              <AnaButon
                title={active ? 'Aktif paket' : 'Satın al (deneme)'}
                variant={active ? 'secondary' : 'primary'}
                disabled={active}
                onPress={() => buy(paket.id)}
              />
            )}
            {paket.ucretsiz && active && (
              <Text style={{ color: colors.tint, fontWeight: '700' }}>Aktif paket</Text>
            )}
          </View>
        );
      })}

      <AnaButon
        title="Satın alımları geri yükle"
        variant="secondary"
        onPress={() => {
          void restore().then((r) => Alert.alert(r.success ? 'Geri yükleme' : 'Hata', r.message));
        }}
      />

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Canlı sürümde App Store / Play Store (RevenueCat) EXPO_PUBLIC_REVENUECAT_KEY ile açılır. Şu an simülasyon.
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
