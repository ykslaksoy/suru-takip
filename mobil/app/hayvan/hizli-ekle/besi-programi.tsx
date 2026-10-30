import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { BesiUfukSecici } from '@/bilesenler/hizli-kuzu/BesiUfukSecici';
import {
  besiRasyonDilimleri,
  besiUfukGunOku,
  hesaplaBesiMaliyetTahmin,
  olusturBesiGorevZamanCizelgesi,
  type BesiProgramGorevSatir,
} from '@/kaynak/besi-programi';
import { gunEtiket as gunEtiketPlan } from '@/kaynak/akilli-veteriner/hizli-besi-plani';

/** Besi programı önizleme — seçilen ufka göre görev zaman çizelgesi */
export default function BesiProgramiScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const [satirlar, setSatirlar] = useState<BesiProgramGorevSatir[]>([]);
  const [ufuk, setUfuk] = useState(90);
  const [maliyetGirdi, setMaliyetGirdi] = useState({
    bas: '50',
    alis: '3500',
    girisKg: '22',
    hedefKg: '45',
    satisFiyat: '280',
  });
  const sayiOku = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const yenile = useCallback(async (gun?: number) => {
    const u = gun ?? (await besiUfukGunOku());
    setUfuk(u);
    setSatirlar(olusturBesiGorevZamanCizelgesi({ ufukGun: u }));
  }, []);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const dilimler = besiRasyonDilimleri(ufuk);
  const tahmin = hesaplaBesiMaliyetTahmin({
    ufukGun: ufuk,
    basSayisi: parseInt(maliyetGirdi.bas, 10) || 1,
    alisBasFiyat: parseFloat(maliyetGirdi.alis.replace(',', '.')) || 0,
    girisKg: sayiOku(maliyetGirdi.girisKg) || undefined,
    hedefSatisKg: sayiOku(maliyetGirdi.hedefKg) || undefined,
    satisKgFiyat: parseFloat(maliyetGirdi.satisFiyat.replace(',', '.')) || 0,
  });

  const gunGruplari = satirlar.reduce<Map<number, BesiProgramGorevSatir[]>>((m, s) => {
    const list = m.get(s.gun) ?? [];
    list.push(s);
    m.set(s.gun, list);
    return m;
  }, new Map());

  return (
    <>
      <Stack.Screen options={{ title: 'Besi programı' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <BesiUfukSecici
          colors={colors}
          onDegisti={(g) => {
            void yenile(g);
          }}
        />

        <Text style={[styles.lead, { color: colors.text }]}>
          Görev zaman çizelgesi (~{ufuk} gün)
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          HIZLI_BESI_TAKVIM minimum standart — mevcut Görevler ekranına bağlı.
        </Text>

        <Text style={[styles.lead, { color: colors.text, marginTop: 8 }]}>Rasyon dilimleri (Faz 2)</Text>
        {dilimler.map((d) => (
          <View key={d.id} style={[styles.gunKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.gunBaslik, { color: colors.tint }]}>
              Gün {d.gunBas}–{d.gunBitis} · {d.baslik}
            </Text>
            <Text style={[styles.satirNot, { color: colors.textSecondary }]}>
              {d.rasyonAd} · ~{d.kgBasGun} kg/baş/gün — {d.aciklama}
            </Text>
            <Pressable onPress={() => router.push(d.href as never)} style={{ marginTop: 6 }}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>Günlük rasyon ekranı →</Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.lead, { color: colors.text, marginTop: 8 }]}>Tahmini maliyet / kâr</Text>
        <View style={[styles.gunKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {MALIYET_ALANLARI.map(({ k, etiket }) => (
            <View key={k}>
            <Text style={[styles.satirNot, { color: colors.textSecondary }]}>{etiket}</Text>
            <TextInput
              accessibilityLabel={etiket}
              placeholder={etiket}
              keyboardType="decimal-pad"
              value={maliyetGirdi[k]}
              onChangeText={(v) => setMaliyetGirdi({ ...maliyetGirdi, [k]: v })}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            </View>
          ))}
          <Text style={{ color: colors.text }}>
            Yem ~{tahmin.tahminiYemKg} kg · {tahmin.tahminiYemMaliyet.toLocaleString('tr-TR')} ₺
          </Text>
          <Text style={{ color: colors.text }}>
            Sağlık ~{tahmin.tahminiSaglikMaliyet.toLocaleString('tr-TR')} ₺ · Toplam{' '}
            {tahmin.toplamMaliyet.toLocaleString('tr-TR')} ₺
          </Text>
          <Text style={{ color: tahmin.tahminiKar >= 0 ? colors.tint : '#c1121f', fontWeight: '800', marginTop: 6 }}>
            Tahmini kâr: {tahmin.tahminiKar.toLocaleString('tr-TR')} ₺ ({tahmin.basBasiKar ?? 0} ₺/baş)
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            Satış ~{tahmin.satisKgBas} kg/baş
            {tahmin.basabasKgFiyat !== null ? ` · başabaş ${tahmin.basabasKgFiyat.toLocaleString('tr-TR')} ₺/kg` : ''}
            {tahmin.yemDonusumOrani !== null ? ` · yem dönüşümü ${tahmin.yemDonusumOrani}:1` : ''}
          </Text>
        </View>

        {[...gunGruplari.entries()]
          .sort(([a], [b]) => a - b)
          .map(([gun, items]) => (
            <View key={gun} style={[styles.gunKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.gunBaslik, { color: colors.tint }]}>{gunEtiketPlan(gun)}</Text>
              {items.map((s) => (
                <View key={`${s.programId}-${s.tip}`} style={styles.satir}>
                  <Text style={[styles.satirBaslik, { color: colors.text }]}>{s.baslik}</Text>
                  <Text style={[styles.satirNot, { color: colors.textSecondary }]} numberOfLines={2}>
                    {s.planTarih} · {s.not}
                  </Text>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </>
  );
}

const MALIYET_ALANLARI = [
  { k: 'bas', etiket: 'Baş sayısı' },
  { k: 'alis', etiket: 'Alış fiyatı (₺/baş)' },
  { k: 'girisKg', etiket: 'Giriş ağırlığı (kg/baş)' },
  { k: 'hedefKg', etiket: 'Hedef satış ağırlığı (kg/baş, boşsa günlük 250 g artıştan)' },
  { k: 'satisFiyat', etiket: 'Satış fiyatı (₺/kg canlı)' },
] as const;

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  lead: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  gunKutu: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  gunBaslik: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  satir: { marginBottom: 8 },
  satirBaslik: { fontSize: 15, fontWeight: '700' },
  satirNot: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 15 },
});
