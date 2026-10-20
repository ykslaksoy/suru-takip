/**
 * İlaç arınma süreleri (et — kesim yasağı).
 * Üstte: şu an arınmada olan kuzular. Altta: ilaç / aşı tablosu, günler düzenlenebilir.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import {
  ARINMA_TABLOSU,
  getAktifArinmalar,
  getArinmaAyar,
  ilacGunu,
  setArinmaGunu,
  tarihTR,
  type ArinmaAyar,
  type ArinmaTanim,
  type HayvanArinma,
} from '@/kaynak/arinma';

const GRUP_ETIKET: Record<ArinmaTanim['grup'], string> = { ilac: 'İLAÇLAR', asi: 'AŞILAR', takviye: 'ENJEKSİYON TAKVİYELER' };

export default function ArinmaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [aktif, setAktif] = useState<HayvanArinma[]>([]);
  const [hayvanlar, setHayvanlar] = useState<Map<string, Animal>>(new Map());
  const [ayar, setAyar] = useState<ArinmaAyar>({});
  const [duzenle, setDuzenle] = useState<string | null>(null);
  const [metin, setMetin] = useState('');
  const [tabloAcik, setTabloAcik] = useState(false);
  const [tumu, setTumu] = useState(false);

  const yukle = useCallback(async () => {
    const [a, h, ay] = await Promise.all([getAktifArinmalar(), getAnimals(), getArinmaAyar()]);
    setAktif(a);
    setHayvanlar(new Map(h.map((x) => [x.id, x])));
    setAyar(ay);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle, refreshKey]),
  );

  const gruplar = useMemo(() => (['ilac', 'asi', 'takviye'] as const).map((g) => ({ g, l: ARINMA_TABLOSU.filter((t) => t.grup === g) })), []);

  const kaydet = async (id: string, deger: string | null) => {
    const n = deger == null ? null : parseInt(deger.replace(/\D/g, ''), 10);
    setAyar(await setArinmaGunu(id, n == null || Number.isNaN(n) ? null : n));
    setDuzenle(null);
    refresh();
    void yukle();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'İlaç arınma süreleri' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.ozet, { backgroundColor: aktif.length ? colors.danger : colors.tint }]}>
          <Text style={styles.ozetSayi}>{aktif.length}</Text>
          <Text style={styles.ozetEtiket}>
            {aktif.length ? 'kuzu arınma süresinde · kesime / satışa gönderme' : 'kuzu arınmada değil · hepsi kesime uygun'}
          </Text>
        </View>

        {(tumu ? aktif : aktif.slice(0, 6)).map((w) => {
          const a = hayvanlar.get(w.animalId);
          return (
            <Pressable
              key={w.animalId}
              onPress={() => router.push(`/hayvan/${w.animalId}`)}
              style={[styles.kart, { backgroundColor: colors.card, borderColor: w.kalanGun <= 3 ? colors.warning : colors.danger }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>{a ? hayvanAnaEtiket(a) : w.animalId}</Text>
                <Text style={{ color: colors.danger, fontWeight: '900' }}>{w.kalanGun} gün</Text>
              </View>
              <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 2 }}>🚫 {tarihTR(w.bitis)} tarihine kadar kesilemez</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {w.ilac} · {tarihTR(w.uygulama)} uygulandı · {w.gun} gün arınma
                {w.kaynak === 'tahmini' ? ' (tahmini)' : w.kaynak === 'kayit' ? ' (kayıtta girilen)' : ''}
              </Text>
            </Pressable>
          );
        })}

        {aktif.length > 6 ? (
          <Pressable onPress={() => setTumu((v) => !v)} style={{ padding: 8, alignItems: 'center' }}>
            <Text style={{ color: colors.tint, fontWeight: '800' }}>{tumu ? 'Daha az göster' : `Tümünü göster (${aktif.length})`}</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => router.push('/satis')} style={[styles.cta, { backgroundColor: colors.tint }]}>
          <Text style={styles.ctaText}>💰 Satış / çıkış kaydı</Text>
        </Pressable>

        <Pressable onPress={() => setTabloAcik((v) => !v)} style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>İlaç / aşı arınma tablosu {tabloAcik ? '▲' : '▼'}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
            Et arınma süresi (gün). “tahmini” değerler tipik prospektüs değerleridir — kullandığın ürünün kutusundaki değerle
            düzelt. Kayıtta elle gün girildiyse ikisinden büyüğü esas alınır.
          </Text>
        </Pressable>
        {tabloAcik
          ? gruplar.map(({ g, l }) => (
              <View key={g}>
                <Text style={[styles.bolum, { color: colors.textSecondary }]}>{GRUP_ETIKET[g]}</Text>
                {l.map((t) => {
                  const { gun, kaynak } = ilacGunu(t, ayar);
                  return (
                    <View key={t.id} style={[styles.satir, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{t.ad}</Text>
                      {duzenle === t.id ? (
                        <>
                          <TextInput
                            value={metin}
                            onChangeText={setMetin}
                            keyboardType="number-pad"
                            autoFocus
                            onSubmitEditing={() => void kaydet(t.id, metin)}
                            style={[styles.input, { color: colors.text, borderColor: colors.tint }]}
                          />
                          <Pressable onPress={() => void kaydet(t.id, metin)} hitSlop={6}>
                            <Text style={{ color: colors.tint, fontWeight: '800' }}>Kaydet</Text>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setDuzenle(t.id);
                            setMetin(String(gun));
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: gun > 0 ? colors.danger : colors.text, fontWeight: '900' }}>{gun} gün</Text>
                          <View style={[styles.rozet, { borderColor: kaynak === 'tahmini' ? colors.warning : colors.tint }]}>
                            <Text style={{ color: kaynak === 'tahmini' ? colors.warning : colors.tint, fontSize: 11, fontWeight: '800' }}>
                              {kaynak === 'tahmini' ? 'tahmini' : 'senin değerin'}
                            </Text>
                          </View>
                          {kaynak === 'kullanici' ? (
                            <Pressable onPress={() => void kaydet(t.id, null)} hitSlop={6}>
                              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>↺</Text>
                            </Pressable>
                          ) : null}
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  ozet: { borderRadius: 16, padding: 16, marginBottom: 12 },
  ozetSayi: { color: '#fff', fontSize: 28, fontWeight: '900' },
  ozetEtiket: { color: '#fff', fontSize: 13, fontWeight: '700' },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 12, marginBottom: 8 },
  cta: { borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bolum: { fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, width: 60, fontSize: 15 },
  rozet: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
});
