import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDatabase } from '@/context/DatabaseContext';
import { addBetaFeedback, addBetaSignup, getBetaFeedback, getBetaSignups } from '@/lib/database';
import type { BetaFeedback, BetaSignup } from '@/lib/types';

export default function BetaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh, ready } = useDatabase();
  const [tab, setTab] = useState<'signup' | 'feedback' | 'list'>('signup');
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [feedbackList, setFeedbackList] = useState<BetaFeedback[]>([]);
  const [signupForm, setSignupForm] = useState({ name: '', phone: '', region: '', flockSize: '100' });
  const [feedbackForm, setFeedbackForm] = useState({
    farmName: '',
    region: '',
    phone: '',
    rating: '5',
    category: 'general',
    message: '',
  });

  const load = useCallback(async () => {
    setSignups(await getBetaSignups());
    setFeedbackList(await getBetaFeedback());
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, refreshKey, load]);

  const submitSignup = async () => {
    if (!signupForm.name.trim() || !signupForm.phone.trim()) {
      Alert.alert('Hata', 'Ad ve telefon zorunlu');
      return;
    }
    if (signups.length >= 50) {
      Alert.alert('Pilot dolu', '50 pilot çiftlik kotası doldu. Bekleme listesine alındınız.');
    }
    await addBetaSignup({
      name: signupForm.name.trim(),
      phone: signupForm.phone.trim(),
      region: signupForm.region.trim(),
      flockSize: parseInt(signupForm.flockSize, 10) || 0,
    });
    refresh();
    load();
    Alert.alert('Kayıt alındı', 'Beta pilot programına hoş geldiniz!');
    setSignupForm({ name: '', phone: '', region: '', flockSize: '100' });
  };

  const submitFeedback = async () => {
    if (!feedbackForm.message.trim()) {
      Alert.alert('Hata', 'Geri bildirim mesajı gerekli');
      return;
    }
    await addBetaFeedback({
      farmName: feedbackForm.farmName.trim(),
      region: feedbackForm.region.trim(),
      phone: feedbackForm.phone.trim(),
      rating: parseInt(feedbackForm.rating, 10) || 5,
      category: feedbackForm.category,
      message: feedbackForm.message.trim(),
    });
    refresh();
    load();
    Alert.alert('Teşekkürler', 'Geri bildiriminiz kaydedildi.');
    setFeedbackForm({ farmName: '', region: '', phone: '', rating: '5', category: 'general', message: '' });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.banner, { backgroundColor: colors.tint }]}>
        <Text style={styles.bannerTitle}>Beta Pilot — 50 Çiftlik</Text>
        <Text style={styles.bannerSub}>Kayıtlı: {signups.length}/50 · Geri bildirim: {feedbackList.length}</Text>
      </View>

      <View style={styles.tabs}>
        {(['signup', 'feedback', 'list'] as const).map((t) => (
          <PrimaryButton
            key={t}
            title={t === 'signup' ? 'Kayıt' : t === 'feedback' ? 'Geri Bildirim' : 'Liste'}
            variant={tab === t ? 'primary' : 'secondary'}
            onPress={() => setTab(t)}
          />
        ))}
      </View>

      {tab === 'signup' && (
        <View style={styles.form}>
          <Text style={[styles.h, { color: colors.text }]}>Pilot çiftlik kaydı</Text>
          {[
            { k: 'name', p: 'Ad Soyad / İşletme adı' },
            { k: 'phone', p: 'Telefon' },
            { k: 'region', p: 'İl / İlçe' },
            { k: 'flockSize', p: 'Sürü büyüklüğü (baş)' },
          ].map((f) => (
            <TextInput
              key={f.k}
              placeholder={f.p}
              value={signupForm[f.k as keyof typeof signupForm]}
              onChangeText={(v) => setSignupForm({ ...signupForm, [f.k]: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          ))}
          <PrimaryButton title="Beta'ya Katıl" onPress={submitSignup} />
        </View>
      )}

      {tab === 'feedback' && (
        <View style={styles.form}>
          <Text style={[styles.h, { color: colors.text }]}>Geri bildirim döngüsü</Text>
          {[
            { k: 'farmName', p: 'İşletme adı' },
            { k: 'region', p: 'Bölge' },
            { k: 'phone', p: 'Telefon' },
            { k: 'rating', p: 'Puan (1-5)' },
            { k: 'category', p: 'Kategori (general, bug, feature)' },
            { k: 'message', p: 'Mesajınız' },
          ].map((f) => (
            <TextInput
              key={f.k}
              placeholder={f.p}
              value={feedbackForm[f.k as keyof typeof feedbackForm]}
              onChangeText={(v) => setFeedbackForm({ ...feedbackForm, [f.k]: v })}
              multiline={f.k === 'message'}
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: f.k === 'message' ? 100 : 48 }]}
            />
          ))}
          <PrimaryButton title="Gönder" onPress={submitFeedback} />
        </View>
      )}

      {tab === 'list' && (
        <View style={styles.form}>
          <Text style={[styles.h, { color: colors.text }]}>Pilot kayıtları</Text>
          {signups.map((s) => (
            <Text key={s.id} style={{ color: colors.text, marginBottom: 6 }}>
              {s.name} · {s.region} · {s.flockSize} baş
            </Text>
          ))}
          <Text style={[styles.h, { color: colors.text, marginTop: 16 }]}>Geri bildirimler</Text>
          {feedbackList.map((f) => (
            <Text key={f.id} style={{ color: colors.textSecondary, marginBottom: 8 }}>
              ⭐{f.rating} {f.message.slice(0, 80)}...
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { margin: 16, padding: 20, borderRadius: 14 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bannerSub: { color: '#ffffffcc', marginTop: 6 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 6 },
  form: { padding: 16 },
  h: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16 },
});
