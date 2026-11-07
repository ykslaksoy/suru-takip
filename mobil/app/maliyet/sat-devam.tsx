import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimal, getLatestWeight } from '@/kaynak/cekirdek/veritabani';
import { hesaplaSatDevam, type SatDevamGirdi, type SatDevamSonuc } from '@/kaynak/maliyet/sat-devam-hesap';
import { nottanAlisFiyati } from '@/kaynak/maliyet/hesap';

function sayi(metin: string): number | null {
  const n = parseFloat(metin.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function SatDevamScreen() {
  const { id, padok } = useLocalSearchParams<{ id?: string; padok?: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [etiket, setEtiket] = useState(padok ?? '—');
  const [kiloKaynak, setKiloKaynak] = useState<'olculmus' | 'girilen' | 'tahmin'>('girilen');
  const [canliKg, setCanliKg] = useState('');
  const [satisFiyat, setSatisFiyat] = useState('');
  const [verim, setVerim] = useState('');
  const [ekGun, setEkGun] = useState('30');
  const [artis, setArtis] = useState('');
  const [yemKg, setYemKg] = useState('');
  const [yemFiyat, setYemFiyat] = useState('');
  const [bakim, setBakim] = useState('');
  const [batik, setBatik] = useState('');
  const [karkas, setKarkas] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const a = await getAnimal(id);
      if (!a) return;
      setEtiket(a.paddock ? `${a.paddock} · ${a.earTag ?? a.id.slice(0, 6)}` : a.earTag ?? id);
      const w = await getLatestWeight(id);
      if (w != null) {
        setCanliKg(String(w));
        setKiloKaynak('olculmus');
      }
      const alis = nottanAlisFiyati(a.notes ?? '');
      if (alis != null) setBatik(String(alis));
    })();
  }, [id]);

  const girdi: SatDevamGirdi = useMemo(
    () => ({
      canliKg: sayi(canliKg),
      kiloKaynagi: kiloKaynak,
      satisBirimi: karkas ? 'karkas_kg' : 'canli_kg',
      satisFiyatKg: sayi(satisFiyat),
      karkasVerim: karkas ? (sayi(verim) ?? null) != null ? (sayi(verim)! > 1 ? sayi(verim)! / 100 : sayi(verim)!) : null : null,
      paraBirimi: 'TRY',
      ekGun: sayi(ekGun) ?? 0,
      gunlukArtisKg: sayi(artis),
      gunlukEkYemKgBas: sayi(yemKg),
      yemFiyatKg: sayi(yemFiyat),
      gunlukBakimBas: sayi(bakim),
      batikMaliyetBas: sayi(batik),
    }),
    [canliKg, kiloKaynak, karkas, satisFiyat, verim, ekGun, artis, yemKg, yemFiyat, bakim, batik],
  );

  const sonuc: SatDevamSonuc = useMemo(() => hesaplaSatDevam(girdi), [girdi]);

  const inp = (label: string, value: string, set: (v: string) => void, ph?: string) => (
    <View style={styles.g}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        keyboardType="decimal-pad"
        placeholder={ph}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Şimdi sat / Besiye devam' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          Marjinal karar: bugünkü satış geliri ile {ekGun || '…'} gün daha beklemenin net farkı. Batık (alış vb.) kararda kullanılmaz; ayrıca gösterilir.
          Piyasa fiyatı ve artış sizin varsayımınız — garanti yok.
        </Text>
        <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 8 }}>Kapsam: {etiket}</Text>

        {inp('Canlı ağırlık (kg)', canliKg, setCanliKg, kiloKaynak === 'olculmus' ? 'ölçülmüş' : undefined)}
        {inp('Satış fiyatı ₺/kg', satisFiyat, setSatisFiyat, karkas ? 'karkas' : 'canlı')}
        <Text onPress={() => setKarkas((k) => !k)} style={{ color: colors.tint, marginBottom: 8 }}>
          Satış birimi: {karkas ? 'Karkas kg (verim gerekli)' : 'Canlı kg'} — değiştir
        </Text>
        {karkas ? inp('Karkas verimi (0,48 veya %48)', verim, setVerim) : null}
        {inp('Ek gün', ekGun, setEkGun, '30')}
        {inp('Günlük artış varsayımı (kg/gün)', artis, setArtis)}
        {inp('Günlük ek yem (kg/baş)', yemKg, setYemKg)}
        {inp('Yem ₺/kg', yemFiyat, setYemFiyat)}
        {inp('Günlük bakım ₺/baş (işçilik, su, yatak, sağlık…)', bakim, setBakim)}
        {inp('Batık maliyet ₺/baş (isteğe bağlı)', batik, setBatik)}

        <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {sonuc.durum === 'eksik' ? (
            <>
              <Text style={{ color: colors.warning, fontWeight: '800' }}>Eksik girdi</Text>
              {sonuc.eksikler.map((e) => (
                <Text key={e} style={{ color: colors.textSecondary, marginTop: 4 }}>
                  · {e}
                </Text>
              ))}
            </>
          ) : (
            <>
              <Satir label="Şimdi net (brüt)" value={`${sonuc.simdiNet.toLocaleString('tr-TR')} ₺`} colors={colors} />
              <Satir
                label={`${ekGun} gün sonra canlı kg (varsayım)`}
                value={`${sonuc.gelecekCanliKg} kg`}
                colors={colors}
              />
              <Satir label="Gelecek brüt" value={`${sonuc.gelecekBrut.toLocaleString('tr-TR')} ₺`} colors={colors} />
              <Satir label="Ek yem + bakım" value={`−${sonuc.ekMaliyet.toLocaleString('tr-TR')} ₺`} colors={colors} />
              <Satir label="Beklemek net" value={`${sonuc.gelecekNet.toLocaleString('tr-TR')} ₺`} colors={colors} />
              <Satir
                label="Marjinal fark (bekle − şimdi)"
                value={`${sonuc.marjinalFark >= 0 ? '+' : ''}${sonuc.marjinalFark.toLocaleString('tr-TR')} ₺`}
                colors={colors}
                vurgu
              />
              {sonuc.basabasGelecekFiyatKg != null ? (
                <Satir
                  label="Başabaş gelecek satış ₺/kg"
                  value={sonuc.basabasGelecekFiyatKg.toLocaleString('tr-TR')}
                  colors={colors}
                />
              ) : null}
              {sonuc.donguKarSimdi != null ? (
                <Satir label="Döngü kârı (batık dahil) — şimdi" value={`${sonuc.donguKarSimdi.toLocaleString('tr-TR')} ₺`} colors={colors} />
              ) : null}
              {sonuc.donguKarDevam != null ? (
                <Satir label="Döngü kârı (batık dahil) — bekle" value={`${sonuc.donguKarDevam.toLocaleString('tr-TR')} ₺`} colors={colors} />
              ) : null}
              {sonuc.uyari.map((u) => (
                <Text key={u} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 }}>
                  {u}
                </Text>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function Satir({
  label,
  value,
  colors,
  vurgu,
}: {
  label: string;
  value: string;
  colors: (typeof Colors)['light'];
  vurgu?: boolean;
}) {
  return (
    <View style={styles.satir}>
      <Text style={{ color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ color: vurgu ? colors.tint : colors.text, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  g: { marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, fontSize: 16 },
  kutu: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12 },
  satir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
});
