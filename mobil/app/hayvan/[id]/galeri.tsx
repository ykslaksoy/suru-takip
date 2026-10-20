/** Kuzu fotoğraf galerisi — kamera / dosyadan ekle, gün gün ızgara, tam ekran gezin, etiket + not, sil */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { fotoEkle, fotoGuncelle, fotoSil, getFotolar, gorselSec, gorselUrl } from '@/kaynak/galeri/depo';
import { boyutMetni, FOTO_ETIKET, gunlereBol, HAYVAN_BASI_EN_COK, komsu, type FotoEtiket, type FotoKaydi } from '@/kaynak/galeri/hesap';
import { yetkiUyar } from '@/bilesenler/ekip/useEkip';
import { FotoKare } from '@/bilesenler/galeri/FotoKare';

function onayla(mesaj: string, evet: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(mesaj)) evet();
    return;
  }
  Alert.alert('Onay', mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: evet },
  ]);
}

const gunTR = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function GaleriScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width, height } = useWindowDimensions();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [fotolar, setFotolar] = useState<FotoKaydi[] | null>(null);
  const [etiket, setEtiket] = useState<FotoEtiket>('genel');
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [acik, setAcik] = useState<FotoKaydi | null>(null);
  const [not, setNot] = useState('');

  const yukle = useCallback(async () => {
    if (!id) return;
    const [a, l] = await Promise.all([getAnimal(id), getFotolar(id)]);
    setAnimal(a);
    setFotolar(l);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  const ekle = async (kaynak: 'kamera' | 'dosya') => {
    if (!id) return;
    setHata(null);
    try {
      const secilen = await gorselSec(kaynak);
      if (!secilen.length) return;
      setMesgul(true);
      for (const s of secilen) await fotoEkle(id, s as never, etiket);
      await yukle();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const ad = animal ? hayvanAnaEtiket(animal) : '';
  const kare = Math.floor((Math.min(width, 520) - 32 - 12) / 3);

  const ac = (f: FotoKaydi | null) => {
    setAcik(f);
    setNot(f?.not ?? '');
  };

  return (
    <>
      <Stack.Screen options={{ title: ad ? `${ad} · Fotoğraflar` : 'Fotoğraflar' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable disabled={mesgul} onPress={() => void ekle('kamera')} style={[styles.buyukBtn, { backgroundColor: colors.tint }]}>
              <Text style={styles.buyukYazi}>📷 Fotoğraf çek</Text>
            </Pressable>
            <Pressable disabled={mesgul} onPress={() => void ekle('dosya')} style={[styles.buyukBtn, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.tint }]}>
              <Text style={[styles.buyukYazi, { color: colors.tint }]}>🖼️ Dosyadan</Text>
            </Pressable>
          </View>
          <View style={[styles.chipSatir, { marginTop: 10 }]}>
            {(Object.keys(FOTO_ETIKET) as FotoEtiket[]).map((e) => (
              <Pressable key={e} onPress={() => setEtiket(e)} style={[styles.chip, { borderColor: etiket === e ? colors.tint : colors.border, backgroundColor: etiket === e ? colors.tint : colors.background }]}>
                <Text style={{ color: etiket === e ? '#fff' : colors.text, fontSize: 12, fontWeight: '700' }}>{FOTO_ETIKET[e]}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
            Fotoğraflar bu cihazda saklanır, 1600 px'e küçültülür. Kuzu başına en çok {HAYVAN_BASI_EN_COK}.
          </Text>
          {mesgul ? <ActivityIndicator color={colors.tint} style={{ marginTop: 8 }} /> : null}
          {hata ? <Text style={{ color: colors.danger, marginTop: 6 }}>{hata}</Text> : null}
        </View>

        {fotolar == null ? (
          <ActivityIndicator color={colors.tint} />
        ) : fotolar.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Henüz fotoğraf yok. Kuzunun gelişini, yarasını, kondisyonunu fotoğrafla izle.</Text>
        ) : (
          gunlereBol(fotolar).map((g) => (
            <View key={g.gun} style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 12, marginBottom: 6 }}>{gunTR(g.gun).toLocaleUpperCase('tr')} · {g.fotolar.length}</Text>
              <View style={styles.izgara}>
                {g.fotolar.map((f) => (
                  <Pressable key={f.id} onPress={() => ac(f)}>
                    <FotoKare f={f} boyut="kucuk" stil={{ width: kare, height: kare, borderRadius: 10 }} />
                    {f.etiket !== 'genel' ? (
                      <Text style={[styles.rozet, { backgroundColor: '#000a' }]}>{FOTO_ETIKET[f.etiket]}</Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!acik} transparent animationType="fade" onRequestClose={() => ac(null)}>
        {acik ? (
          <View style={styles.tamEkran}>
            <View style={styles.ustBar}>
              <Text style={{ color: '#fff', fontWeight: '800', flex: 1 }}>
                {new Date(acik.tarih).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })} · {FOTO_ETIKET[acik.etiket]}
              </Text>
              <Pressable onPress={() => ac(null)} hitSlop={10}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>✕</Text>
              </Pressable>
            </View>
            <FotoKare f={acik} boyut="tam" stil={{ width, height: height * 0.62 }} />
            <View style={styles.altBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable disabled={!fotolar || !komsu(fotolar, acik.id, -1)} onPress={() => fotolar && ac(komsu(fotolar, acik.id, -1))} style={styles.ok}>
                  <Text style={styles.okYazi}>‹</Text>
                </Pressable>
                <TextInput
                  value={not}
                  onChangeText={setNot}
                  onBlur={() => void fotoGuncelle(acik.id, { not }).then(yukle)}
                  placeholder="Not ekle (ör. sol arka bacakta yara)"
                  placeholderTextColor="#bbb"
                  style={styles.notInput}
                />
                <Pressable disabled={!fotolar || !komsu(fotolar, acik.id, 1)} onPress={() => fotolar && ac(komsu(fotolar, acik.id, 1))} style={styles.ok}>
                  <Text style={styles.okYazi}>›</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: '#ccc', fontSize: 12, flex: 1 }}>
                  {acik.en}×{acik.boy}
                  {acik.bayt ? ` · ${boyutMetni(acik.bayt)}` : ''}
                </Text>
                <Pressable
                  onPress={() => {
                    if (!yetkiUyar('silme')) return;
                    onayla('Fotoğraf silinsin mi? 30 gün geri dönüşüm kutusunda kalır.', async () => {
                      await fotoSil(acik, ad);
                      ac(null);
                      await yukle();
                    });
                  }}
                  style={styles.silBtn}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>🗑 Sil</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14 },
  buyukBtn: { flex: 1, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buyukYazi: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rozet: { position: 'absolute', left: 4, bottom: 4, color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  tamEkran: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  ustBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 24, zIndex: 2 },
  altBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28 },
  ok: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff2', alignItems: 'center', justifyContent: 'center' },
  okYazi: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: -2 },
  notInput: { flex: 1, borderWidth: 1, borderColor: '#fff4', borderRadius: 10, color: '#fff', paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  silBtn: { backgroundColor: '#c1121f', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
});
