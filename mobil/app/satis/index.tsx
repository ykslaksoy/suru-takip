/**
 * Satış / çıkış — toplu satış, kesim veya ölüm kaydı.
 * İlaç arınma süresindeki kuzular için uyarı: arınmadakiler ayrılarak kaydedilebilir
 * ya da onayla yine de hepsi kaydedilir.
 */
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import TopluHayvanSecici from '@/bilesenler/ortak/TopluHayvanSecici';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket, hayvanAltEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import { getArinmalarTarihte, satistaArinmadakiler, tarihTR, yerelGun, type HayvanArinma } from '@/kaynak/arinma';
import { arinmaKontroluGerekli, CIKIS_ETIKET, cikisaHazirla, type CikisTur } from '@/kaynak/satis';
import { sayiCoz, tarihCoz } from '@/kaynak/sigorta/hesap';

export default function SatisScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hayvanlar, setHayvanlar] = useState<Animal[]>([]);
  const [secili, setSecili] = useState<Set<string>>(new Set(id ? [id] : []));
  const [tur, setTur] = useState<CikisTur>('satis');
  const [tarih, setTarih] = useState(tarihTR(yerelGun()));
  const [tutar, setTutar] = useState('');
  const [arinmalar, setArinmalar] = useState<HayvanArinma[]>([]);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const tarihIso = tarihCoz(tarih);

  const yukle = useCallback(async () => {
    const a = await getAnimals();
    setHayvanlar(a.filter((x) => x.status !== 'sold' && x.status !== 'dead'));
    setYukleniyor(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!tarihIso) return;
      void getArinmalarTarihte(tarihIso).then(setArinmalar);
    }, [tarihIso]),
  );

  const hayvanById = useMemo(() => new Map(hayvanlar.map((a) => [a.id, a])), [hayvanlar]);
  const engelli = useMemo(
    () => (arinmaKontroluGerekli(tur) ? satistaArinmadakiler(secili, arinmalar) : []),
    [tur, secili, arinmalar],
  );

  const kaydet = async (ids: string[]) => {
    if (!tarihIso) {
      setMesaj('Tarih GG.AA.YYYY olmalı');
      return;
    }
    if (ids.length === 0) {
      setMesaj('Kuzu seç');
      return;
    }
    setKaydediliyor(true);
    try {
      const toplam = tur === 'olum' ? null : sayiCoz(tutar);
      const basTutar = toplam && ids.length ? toplam / ids.length : null;
      for (const hid of ids) {
        const a = hayvanById.get(hid);
        if (a) await upsertAnimal(cikisaHazirla(a, tur, tarihTR(tarihIso), basTutar));
      }
      const arinmadaGiden = ids.filter((x) => engelli.some((e) => e.animalId === x)).length;
      await islemKaydet({
        tur: tur === 'olum' ? 'durum' : 'satis',
        ozet: `${CIKIS_ETIKET[tur]} · ${ids.length} kuzu · ${tarihTR(tarihIso)}${toplam ? ` · ${Math.round(toplam).toLocaleString('tr-TR')} ₺` : ''}`,
        detay: arinmadaGiden ? `${arinmadaGiden} kuzu arınma süresindeyken onaylandı` : undefined,
        adet: ids.length,
      });
      setMesaj(`${ids.length} kuzu için ${CIKIS_ETIKET[tur].toLocaleLowerCase('tr-TR')} kaydedildi`);
      setSecili(new Set());
      setTutar('');
      refresh();
      await yukle();
    } finally {
      setKaydediliyor(false);
    }
  };

  const yineDeKaydet = () => {
    const msg = `${engelli.length} kuzu ilaç arınma süresinde. Eti tüketime uygun değil. Yine de ${CIKIS_ETIKET[tur].toLocaleLowerCase('tr-TR')} kaydedilsin mi?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) void kaydet([...secili]);
      return;
    }
    Alert.alert('Arınma süresi', msg, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Yine de kaydet', style: 'destructive', onPress: () => void kaydet([...secili]) },
    ]);
  };

  const temizler = [...secili].filter((x) => !engelli.some((e) => e.animalId === x));

  return (
    <>
      <Stack.Screen options={{ title: 'Satış / çıkış' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        {yukleniyor ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['satis', 'kesim', 'olum'] as CikisTur[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTur(t)}
                  style={[styles.chip, { borderColor: t === tur ? colors.tint : colors.border, backgroundColor: t === tur ? colors.tint : colors.card }]}>
                  <Text style={{ color: t === tur ? '#fff' : colors.text, fontWeight: '800' }}>{CIKIS_ETIKET[t]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.etiket, { color: colors.textSecondary }]}>Tarih</Text>
                <TextInput
                  value={tarih}
                  onChangeText={setTarih}
                  placeholder="GG.AA.YYYY"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text, borderColor: tarihIso ? colors.border : colors.danger, backgroundColor: colors.card }]}
                />
              </View>
              {tur !== 'olum' ? (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.etiket, { color: colors.textSecondary }]}>Toplam tutar ₺ (isteğe bağlı)</Text>
                  <TextInput
                    value={tutar}
                    onChangeText={setTutar}
                    keyboardType="numeric"
                    placeholder="ör. 45.000"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  />
                </View>
              ) : null}
            </View>

            {engelli.length > 0 ? (
              <View style={[styles.kart, { borderColor: colors.danger, backgroundColor: colors.danger + '12' }]}>
                <Text style={{ color: colors.danger, fontWeight: '900', fontSize: 15 }}>
                  🚫 {engelli.length} kuzu ilaç arınma süresinde — kesime / satışa uygun değil
                </Text>
                {engelli.slice(0, 20).map((e) => {
                  const a = hayvanById.get(e.animalId);
                  return (
                    <Text key={e.animalId} style={{ color: colors.text, marginTop: 4 }}>
                      {a ? hayvanAnaEtiket(a) : e.animalId} · {e.ilac} · {tarihTR(e.bitis)} tarihine kadar kesilemez
                    </Text>
                  );
                })}
                {engelli.length > 20 ? <Text style={{ color: colors.textSecondary }}>… +{engelli.length - 20}</Text> : null}
              </View>
            ) : null}

            <Text style={[styles.etiket, { color: colors.textSecondary, marginTop: 12, marginBottom: 6 }]}>Çıkacak kuzular</Text>
            <TopluHayvanSecici
              hayvanlar={hayvanlar.map((a) => {
                const ar = arinmaKontroluGerekli(tur) ? arinmalar.find((x) => x.animalId === a.id) : undefined;
                return {
                  id: a.id,
                  etiket: hayvanAnaEtiket(a),
                  altEtiket: ar ? `🚫 ${tarihTR(ar.bitis)} tarihine kadar kesilemez` : hayvanAltEtiket(a) ?? undefined,
                  paddock: a.paddock,
                  kupe: a.earTag || a.sirtNo || a.id,
                };
              })}
              secili={secili}
              onChange={setSecili}
            />
            {mesaj ? <Text style={{ color: colors.tint, fontWeight: '700', marginTop: 8 }}>{mesaj}</Text> : null}
            {engelli.length > 0 ? (
              <>
                <Pressable
                  disabled={kaydediliyor || temizler.length === 0}
                  onPress={() => void kaydet(temizler)}
                  style={[styles.cta, { backgroundColor: colors.tint, opacity: kaydediliyor || temizler.length === 0 ? 0.5 : 1 }]}>
                  <Text style={styles.ctaText}>Arınmadakileri çıkar · {temizler.length} kuzuyu kaydet</Text>
                </Pressable>
                <Pressable disabled={kaydediliyor} onPress={yineDeKaydet} style={[styles.ikincil, { borderColor: colors.danger }]}>
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>Yine de hepsini kaydet ({secili.size})</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                disabled={kaydediliyor || secili.size === 0}
                onPress={() => void kaydet([...secili])}
                style={[styles.cta, { backgroundColor: colors.tint, opacity: kaydediliyor || secili.size === 0 ? 0.5 : 1 }]}>
                <Text style={styles.ctaText}>
                  {kaydediliyor ? 'Kaydediliyor…' : `${CIKIS_ETIKET[tur]} kaydet · ${secili.size} kuzu`}
                </Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.push('/arinma')} style={{ alignItems: 'center', padding: 12 }}>
              <Text style={{ color: colors.tint, fontWeight: '700' }}>İlaç arınma süreleri →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  chip: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  etiket: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 12 },
  cta: { borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 12 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  ikincil: { borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
});
