import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { addBetaFeedback, addBetaSignup, getBetaFeedback, getBetaSignups } from '@/kaynak/cekirdek/veritabani';
import type { BetaFeedback, BetaSignup } from '@/kaynak/cekirdek/tipler';
import { BETA_KATEGORILER, type BetaKategori } from '@/sabitler/Metinler';

export default function PilotProgramEkrani() {
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
    category: 'general' as BetaKategori,
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
    Alert.alert('Kayıt alındı', 'Pilot programa hoş geldiniz!');
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
        <Text style={styles.bannerTitle}>Pilot Program — 50 Çiftlik</Text>
        <Text style={styles.bannerSub}>Kayıtlı: {signups.length}/50 · Geri bildirim: {feedbackList.length}</Text>
      </View>

      <View style={styles.tabs}>
        {(['signup', 'feedback', 'list'] as const).map((t) => (
          <AnaButon
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
          <AnaButon title="Pilot Programa Katıl" onPress={submitSignup} />
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
          ].map((f) => (
            <TextInput
              key={f.k}
              placeholder={f.p}
              value={feedbackForm[f.k as keyof typeof feedbackForm]}
              onChangeText={(v) => setFeedbackForm({ ...feedbackForm, [f.k]: v })}
              keyboardType={f.k === 'rating' ? 'number-pad' : 'default'}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          ))}
          <Text style={[styles.h, { color: colors.text, fontSize: 14, marginBottom: 8 }]}>Kategori</Text>
          <View style={styles.categoryRow}>
            {(Object.keys(BETA_KATEGORILER) as BetaKategori[]).map((k) => (
              <Pressable
                key={k}
                onPress={() => setFeedbackForm({ ...feedbackForm, category: k })}
                style={[
                  styles.chip,
                  {
                    backgroundColor: feedbackForm.category === k ? colors.tint : colors.background,
                    borderColor: colors.border,
                  },
                ]}>
                <Text style={{ color: feedbackForm.category === k ? '#fff' : colors.text, fontSize: 12 }}>
                  {BETA_KATEGORILER[k]}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            placeholder="Mesajınız"
            value={feedbackForm.message}
            onChangeText={(v) => setFeedbackForm({ ...feedbackForm, message: v })}
            multiline
            style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 100 }]}
          />
          <AnaButon title="Gönder" onPress={submitFeedback} />
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
              ⭐{f.rating}{' '}
              {BETA_KATEGORILER[f.category as BetaKategori] ?? f.category}: {f.message.slice(0, 80)}...
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
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
});
