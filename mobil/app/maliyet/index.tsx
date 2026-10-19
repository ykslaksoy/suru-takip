/**
 * Maliyet ve Kâr (Mod 1 besi) — parti başına alış + yem + ilaç → baş başı / kg başı maliyet, tahmini ve gerçek kâr.
 * Mevcut ekranlarda bu hesap yoktu; yeni ekran. Veriler stok hareketleri ve birim fiyatlardan kendiliğinden gelir.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimals, getLatestWeight, getStockItems, getStockMovements } from '@/kaynak/cekirdek/veritabani';
import { getBirimFiyatlar } from '@/kaynak/stok/fiyat';
import { partiMaliyetleri, tl, type MaliyetAyar, type PartiMaliyet } from '@/kaynak/maliyet/hesap';
import { getMaliyetAyar, saveMaliyetAyar } from '@/kaynak/maliyet/depo';

type Alan = 'alisBasFiyat' | 'satisKgFiyat' | 'gercekSatisTutar';

export default function MaliyetScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [satirlar, setSatirlar] = useState<PartiMaliyet[] | null>(null);
  const [ayar, setAyar] = useState<MaliyetAyar>({ partiler: {}, hayvanAlis: {} });
  const [fiyatsizStok, setFiyatsizStok] = useState(0);
  const [acik, setAcik] = useState<string | null>(null);

  const hesapla = useCallback(async (a?: MaliyetAyar) => {
    const [animals, items, movements, fiyatlar, kayitli] = await Promise.all([
      getAnimals(),
      getStockItems(),
      getStockMovements(),
      getBirimFiyatlar(),
      a ? Promise.resolve(a) : getMaliyetAyar(),
    ]);
    const sonKg: Record<string, number | null> = {};
    await Promise.all(animals.map(async (x) => (sonKg[x.id] = await getLatestWeight(x.id).catch(() => null))));
    setAyar(kayitli);
    setFiyatsizStok(new Set(movements.filter((m) => m.movementType === 'out' && !fiyatlar[m.stockId]).map((m) => m.stockId)).size);
    setSatirlar(partiMaliyetleri({ animals, sonKg, items, movements, fiyatlar, ayar: kayitli }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void hesapla();
    }, [hesapla]),
  );

  const alanKaydet = async (parti: string, alan: Alan, metin: string) => {
    const n = parseFloat(metin.replace(/\./g, '').replace(',', '.'));
    const pa = { ...(ayar.partiler[parti] ?? {}) };
    if (Number.isFinite(n) && n > 0) pa[alan] = n;
    else delete pa[alan];
    const yeni = { ...ayar, partiler: { ...ayar.partiler, [parti]: pa } };
    await saveMaliyetAyar(yeni);
    await hesapla(yeni);
  };

  const toplam = satirlar?.reduce(
    (s, r) => ({ bas: s.bas + r.bas, maliyet: s.maliyet + r.toplam, kar: r.gercekKar ?? r.tahminiKar ?? null }),
    { bas: 0, maliyet: 0, kar: null as number | null },
  );

  const girdi = (parti: string, alan: Alan, etiket: string) => (
    <View style={styles.girdi}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{etiket}</Text>
      <TextInput
        defaultValue={ayar.partiler[parti]?.[alan] ? String(ayar.partiler[parti]![alan]) : ''}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textSecondary}
        onEndEditing={(e) => void alanKaydet(parti, alan, e.nativeEvent.text)}
        onBlur={(e) => void alanKaydet(parti, alan, (e.target as unknown as { value?: string })?.value ?? '')}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );

  const satir = (etiket: string, deger: string, vurgu?: string) => (
    <View style={styles.satir}>
      <Text style={{ color: colors.textSecondary }}>{etiket}</Text>
      <Text style={{ color: vurgu ?? colors.text, fontWeight: '700' }}>{deger}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Maliyet ve Kâr' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          Parti başına alış + yem + ilaç. Yem ve ilaç maliyeti stok çıkışlarından ve girişte yazdığın birim fiyattan kendiliğinden hesaplanır.
        </Text>
        {fiyatsizStok ? (
          <Pressable onPress={() => router.push('/(tabs)/stok' as never)} style={[styles.uyari, { borderColor: colors.warning, backgroundColor: colors.card }]}>
            <Text style={{ color: colors.warning, fontWeight: '800' }}>⚠ {fiyatsizStok} stok kaleminin birim fiyatı yok</Text>
            <Text style={{ color: colors.text, fontSize: 13, marginTop: 2 }}>Bu kalemlerin çıkışı maliyete yansımıyor. Stokta girişte fiyat yaz →</Text>
          </Pressable>
        ) : null}
        {!satirlar ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
        ) : satirlar.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Henüz partide kuzu yok.</Text>
        ) : (
          <>
            <View style={[styles.ozet, { backgroundColor: colors.tint }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ozetSayi}>{toplam?.bas ?? 0}</Text>
                <Text style={styles.ozetEtiket}>baş</Text>
              </View>
              <View style={{ flex: 2 }}>
                <Text style={styles.ozetSayi}>{tl(toplam?.maliyet ?? 0)}</Text>
                <Text style={styles.ozetEtiket}>toplam maliyet</Text>
              </View>
            </View>
            {satirlar.map((r) => {
              const kar = r.gercekKar ?? r.tahminiKar;
              return (
                <View key={r.parti} style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Pressable onPress={() => setAcik((a) => (a === r.parti ? null : r.parti))} style={styles.kartBaslik}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, flex: 1 }}>
                      {r.parti} · {r.bas} baş
                    </Text>
                    <Text style={{ color: colors.tint, fontWeight: '800' }}>{acik === r.parti ? 'Kapat' : 'Fiyat gir'}</Text>
                  </Pressable>
                  {satir('Alış', `${tl(r.alis)}${r.alisEksikBas ? ` (${r.alisEksikBas} kuzuda fiyat yok)` : ''}`)}
                  {satir('Yem', tl(r.yem))}
                  {satir('İlaç / aşı', tl(r.ilac))}
                  {satir('Toplam maliyet', tl(r.toplam))}
                  {satir('Baş başı maliyet', tl(r.basBasi))}
                  {satir('Kg başı maliyet', r.kgBasi == null ? '—' : `${r.kgBasi.toLocaleString('tr-TR')} ₺/kg · ${r.toplamKg.toLocaleString('tr-TR')} kg canlı`)}
                  {r.gercekKar != null
                    ? satir('Gerçek kâr', tl(r.gercekKar), r.gercekKar >= 0 ? colors.tint : colors.warning)
                    : r.tahminiKar != null
                      ? satir('Tahmini kâr', tl(r.tahminiKar), r.tahminiKar >= 0 ? colors.tint : colors.warning)
                      : satir(kar == null ? 'Kâr' : '', 'Satış ₺/kg gir')}
                  {acik === r.parti ? (
                    <View style={styles.girdiler}>
                      {girdi(r.parti, 'alisBasFiyat', 'Alış ₺/baş')}
                      {girdi(r.parti, 'satisKgFiyat', 'Satış ₺/kg (tahmin)')}
                      {girdi(r.parti, 'gercekSatisTutar', 'Gerçek satış toplamı ₺')}
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Kuzu notunda “Alım 9.000 ₺” varsa alış fiyatı oradan alınır; parti alış fiyatı yazarsan o kullanılır.
            </Text>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  uyari: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  ozet: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12 },
  ozetSayi: { color: '#fff', fontSize: 22, fontWeight: '900' },
  ozetEtiket: { color: '#ffffffcc', fontSize: 12 },
  kart: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  kartBaslik: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  satir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  girdiler: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  girdi: { flex: 1, minWidth: 100 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, fontSize: 16, minWidth: 0 },
});
