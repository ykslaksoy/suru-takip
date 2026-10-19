/**
 * İşlem geçmişi + Çöp kutusu — kim / ne / ne zaman (bu cihaz). Silinen hayvanlar buradan geri alınır.
 * Mevcut ekranlarda karşılığı yoktu; yeni ekran.
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { getCopKutusu, getIslemler } from '@/kaynak/gecmis/gunluk';
import { hayvanGeriYukle } from '@/kaynak/gecmis/hayvan-sil';
import type { CopKaydi, Islem, IslemTur } from '@/kaynak/gecmis/tipler';

const IKON: Record<IslemTur, string> = {
  tartim: '⚖️', asi: '💉', ilac: '💊', stok: '📦', hayvan: '🐑', padok: '🏠', satis: '💰', durum: '•', silme: '🗑️', geri_alma: '↩️', diger: '•',
};

function zamanMetni(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function GecmisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [sekme, setSekme] = useState<'gecmis' | 'cop'>('gecmis');
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [cop, setCop] = useState<CopKaydi[]>([]);
  const [mesaj, setMesaj] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [i, c] = await Promise.all([getIslemler(), getCopKutusu()]);
    setIslemler(i);
    setCop(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <>
      <Stack.Screen options={{ title: 'İşlem geçmişi' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <AltButonlar
          items={[
            { key: 'gecmis', label: `Geçmiş (${islemler.length})` },
            { key: 'cop', label: `Çöp kutusu (${cop.length})` },
          ]}
          activeKey={sekme}
          onSelect={(k) => setSekme(k as 'gecmis' | 'cop')}
        />
        {mesaj ? <Text style={{ color: colors.tint, fontWeight: '700', marginVertical: 8 }}>{mesaj}</Text> : null}
        {sekme === 'gecmis' ? (
          islemler.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              Henüz işlem yok. Tartım, aşı, stok ve silme işlemleri burada listelenir.
            </Text>
          ) : (
            islemler.map((i) => (
              <Pressable
                key={i.id}
                disabled={!i.animalId}
                onPress={() => i.animalId && router.push(`/hayvan/${i.animalId}` as never)}
                style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 18, width: 28 }}>{IKON[i.tur] ?? '•'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{i.ozet}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {zamanMetni(i.zaman)} · {i.kim}
                    {i.detay ? ` · ${i.detay}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))
          )
        ) : cop.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Çöp kutusu boş.</Text>
        ) : (
          cop.map((c) => (
            <View key={c.id} style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 18, width: 28 }}>🐑</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{c.etiket}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Silindi: {zamanMetni(c.silinme)}</Text>
              </View>
              <Pressable
                onPress={async () => {
                  if (await hayvanGeriYukle(c.id)) {
                    setMesaj(`${c.etiket} geri alındı`);
                    refresh();
                    await load();
                  }
                }}
                style={[styles.geriAl, { backgroundColor: colors.tint }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Geri al</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  geriAl: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
});
