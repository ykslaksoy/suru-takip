import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  SERI_MOD_ETIKET,
  getSeriOturum,
  seriKayitEkle,
  seriKayitOzeti,
  seriKayitlariUygula,
  seriOturumBaslat,
  seriOturumBitir,
  seriSatirAyikla,
  type SeriMod,
  type SeriOturum,
} from '@/kaynak/seri-giris';
import { dinlemeyiBaslat, metniSeslendir, seslendirmeyiDurdur, type DinlemeKontrol } from '@/kaynak/ses';
import { YontemOzeti } from '@/bilesenler/giris-yontemi/YontemOzeti';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import { etkinKuzuSecim, etkinTartimGiris } from '@/kaynak/giris-yontemi';

export default function SeriGirisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const { tercih } = useGirisYontemi();
  const kuzuYontem = etkinKuzuSecim(tercih.kuzuSecim);
  const tartimYontem = etkinTartimGiris(tercih.tartimGiris);
  const [mod, setMod] = useState<SeriMod>('tartim');
  const [oturum, setOturum] = useState<SeriOturum | null>(null);
  const [satir, setSatir] = useState('');
  const [dinliyor, setDinliyor] = useState(false);
  const dinlemeRef = useRef<DinlemeKontrol | null>(null);

  const load = useCallback(async () => {
    setOturum(await getSeriOturum());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const baslat = async () => {
    setOturum(await seriOturumBaslat(mod));
  };

  const ekleMetin = async (ham: string) => {
    const t = ham.trim();
    if (!t || !oturum) return;
    const ayik = seriSatirAyikla(oturum.mod, t);
    if (!ayik.ok) {
      Alert.alert('Anlaşılmadı', ayik.hata);
      return;
    }
    setOturum(await seriKayitEkle(t));
    setSatir('');
    metniSeslendir(
      ayik.eylem.tur === 'tartim'
        ? `Eklendi: ${ayik.eylem.kupeArama}, ${ayik.eylem.kiloKg} kilo`
        : ayik.eylem.tur === 'asi'
          ? `Eklendi: ${ayik.eylem.kupeArama}, ${ayik.eylem.asiAdi}`
          : 'Eklendi'
    );
  };

  const ekle = async () => {
    await ekleMetin(satir);
  };

  const dinle = () => {
    if (dinliyor) {
      dinlemeRef.current?.durdur();
      setDinliyor(false);
      return;
    }
    seslendirmeyiDurdur();
    const ctrl = dinlemeyiBaslat({
      onBasladi: () => setDinliyor(true),
      onSonuc: (t) => {
        setDinliyor(false);
        setSatir(t);
        void ekleMetin(t);
      },
      onHata: (mesaj) => {
        setDinliyor(false);
        Alert.alert('Dinleme', mesaj);
      },
    });
    dinlemeRef.current = ctrl;
    if (!ctrl) setDinliyor(false);
  };

  const uygula = async () => {
    if (!oturum?.kayitlar.length) {
      Alert.alert('Boş', 'Önce satır ekleyin.');
      return;
    }
    const ozet = await seriKayitlariUygula(oturum);
    refresh();
    await load();
    const ekstra = ozet.mesajlar.slice(0, 3).join('\n');
    Alert.alert(
      'Uygulandı',
      `${ozet.basarili} başarılı` +
        (ozet.hatali ? `, ${ozet.hatali} hatalı` : '') +
        (ekstra ? `\n\n${ekstra}` : '')
    );
    metniSeslendir(`${ozet.basarili} kayıt uygulandı.`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Seri ahır modu' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          Ahırda arka arkaya kayıt. Satır ekleyin (yazın veya dinleyin), sonra «Hepsini uygula» ile veritabanına yazın.
        </Text>
        <YontemOzeti ayarlarLink />
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
          {oturum?.mod === 'tartim'
            ? `Tartım: ${tartimYontem === 'sesle-kilo' ? 'ses veya yazı' : 'kayıtlı yöntem'}`
            : `Kuzu no: ${kuzuYontem === 'sesle-numara' ? 'ses veya yazı' : 'kayıtlı yöntem'}`}
        </Text>
        {!oturum ? (
          <>
            <AltButonlar
              items={[
                { key: 'tartim', label: 'Tartım' },
                { key: 'asi', label: 'Aşı' },
              ]}
              activeKey={mod}
              onSelect={(k) => setMod(k as SeriMod)}
            />
            <AnaButon title={`${SERI_MOD_ETIKET[mod]} başlat`} onPress={() => void baslat()} />
          </>
        ) : (
          <>
            <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 8 }}>
              {SERI_MOD_ETIKET[oturum.mod]} · {oturum.kayitlar.length} bekleyen
            </Text>
            <TextInput
              placeholder={oturum.mod === 'tartim' ? '1234, 68  veya  küpe 1234, 68 kilo' : '1234, çiçek'}
              placeholderTextColor={colors.textSecondary}
              value={satir}
              onChangeText={setSatir}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            />
            <AnaButon title={dinliyor ? 'Dinlemeyi durdur' : 'Dinle ve ekle'} variant="secondary" onPress={dinle} />
            <AnaButon title="Satır ekle" onPress={() => void ekle()} />
            {oturum.kayitlar.map((k) => (
              <Text key={k.id} style={{ color: colors.text, marginTop: 6 }}>
                • {seriKayitOzeti(k, oturum.mod)}
              </Text>
            ))}
            <View style={{ marginTop: 16 }}>
              <AnaButon title="Hepsini uygula" onPress={() => void uygula()} />
              <AnaButon
                title="Oturumu iptal et"
                variant="secondary"
                onPress={async () => {
                  await seriOturumBitir();
                  await load();
                  Alert.alert('İptal', 'Bekleyen satırlar silindi (DB’ye yazılmadı).');
                }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginBottom: 12 },
});
