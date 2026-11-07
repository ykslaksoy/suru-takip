import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  SERI_MOD_ETIKET,
  seriKayitEkle,
  seriKayitOzeti,
  seriKayitlariUygula,
  seriOturumBitir,
  seriSatirAyikla,
  type SeriMod,
  type SeriOturum,
} from '@/kaynak/seri-giris';
import { dinlemeyiBaslat, metniSeslendir, seslendirmeyiDurdur, type DinlemeKontrol } from '@/kaynak/ses';

export function SeriOturumPaneli({ oturum, onGuncelle }: { oturum: SeriOturum; onGuncelle: () => Promise<void> }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [satir, setSatir] = useState('');
  const [dinliyor, setDinliyor] = useState(false);
  const dinlemeRef = useRef<DinlemeKontrol | null>(null);

  const ekleMetin = async (ham: string) => {
    const t = ham.trim();
    if (!t) return;
    const ayik = seriSatirAyikla(oturum.mod, t);
    if (!ayik.ok) {
      Alert.alert('Anlaşılmadı', ayik.hata);
      return;
    }
    await seriKayitEkle(t);
    setSatir('');
    await onGuncelle();
    metniSeslendir(
      ayik.eylem.tur === 'tartim'
        ? `Eklendi: ${ayik.eylem.kupeArama}, ${ayik.eylem.kiloKg} kilo`
        : ayik.eylem.tur === 'asi'
          ? `Eklendi: ${ayik.eylem.kupeArama}, ${ayik.eylem.asiAdi}`
          : 'Eklendi',
    );
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
    if (!oturum.kayitlar.length) {
      Alert.alert('Boş', 'Önce satır ekleyin.');
      return;
    }
    const ozet = await seriKayitlariUygula(oturum);
    refresh();
    await onGuncelle();
    const ekstra = ozet.mesajlar.slice(0, 3).join('\n');
    Alert.alert(
      'Uygulandı',
      `${ozet.basarili} başarılı` +
        (ozet.hatali ? `, ${ozet.hatali} hatalı` : '') +
        (ekstra ? `\n\n${ekstra}` : ''),
    );
    metniSeslendir(`${ozet.basarili} kayıt uygulandı.`);
  };

  const mod: SeriMod = oturum.mod;

  return (
    <>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 8 }}>
        {SERI_MOD_ETIKET[mod]} · {oturum.kayitlar.length} bekleyen
      </Text>
      <TextInput
        placeholder={mod === 'tartim' ? '1234, 68  veya  küpe 1234, 68 kilo' : '1234, çiçek'}
        placeholderTextColor={colors.textSecondary}
        value={satir}
        onChangeText={setSatir}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
      />
      <AnaButon title={dinliyor ? 'Dinlemeyi durdur' : 'Dinle ve ekle'} variant="secondary" onPress={dinle} />
      <AnaButon title="Satır ekle" onPress={() => void ekleMetin(satir)} />
      {oturum.kayitlar.map((k) => (
        <Text key={k.id} style={{ color: colors.text, marginTop: 6 }}>
          • {seriKayitOzeti(k, mod)}
        </Text>
      ))}
      <View style={{ marginTop: 16 }}>
        <AnaButon title="Hepsini uygula" onPress={() => void uygula()} />
        <AnaButon
          title="Oturumu iptal et"
          variant="secondary"
          onPress={async () => {
            await seriOturumBitir();
            await onGuncelle();
            Alert.alert('İptal', 'Bekleyen satırlar silindi (DB’ye yazılmadı).');
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginBottom: 12 },
});
