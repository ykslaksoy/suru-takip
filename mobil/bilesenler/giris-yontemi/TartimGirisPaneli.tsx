import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import {
  etkinTartimGiris,
  kiloAyikla,
  tartimGirisEtiket,
  tartimYontemYakinindaMi,
} from '@/kaynak/giris-yontemi';
import { dinlemeyiBaslat, seslendirmeyiDurdur } from '@/kaynak/ses';

type Props = {
  value: string;
  onChange: (kg: string) => void;
  placeholder?: string;
};

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  Alert.alert(baslik, mesaj);
}

export function TartimGirisPaneli({ value, onChange, placeholder = 'Kilo (kg)' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tercih } = useGirisYontemi();
  const secilen = tercih.tartimGiris;
  const yontem = etkinTartimGiris(secilen);
  const yakininda = tartimYontemYakinindaMi(secilen);
  const [dinliyor, setDinliyor] = useState(false);

  const inputStil = [
    styles.input,
    { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  ];

  const sesleKilo = () => {
    if (dinliyor) return;
    seslendirmeyiDurdur();
    const ctrl = dinlemeyiBaslat({
      onBasladi: () => setDinliyor(true),
      onSonuc: (t) => {
        setDinliyor(false);
        const kg = kiloAyikla(t);
        if (kg != null) {
          onChange(String(kg));
        } else {
          uyar('Ses', 'Kilo anlaşılamadı. Örn: «68 kilo»');
        }
      },
      onHata: (mesaj) => {
        setDinliyor(false);
        uyar('Dinleme', mesaj);
      },
    });
    if (!ctrl) setDinliyor(false);
  };

  const yakindaBanner = yakininda ? (
    <View style={[styles.banner, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>
        {tartimGirisEtiket(secilen)} — yakında
      </Text>
      <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 18, fontSize: 13 }}>
        Şimdilik manuel kilo girişi kullanılıyor. Ayarlardan yöntemi değiştirebilirsiniz.
      </Text>
    </View>
  ) : null;

  return (
    <View>
      {yakindaBanner}

      {yontem === 'manuel' || yakininda ? (
        <>
          <TextInput
            placeholder={placeholder}
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            placeholderTextColor={colors.textSecondary}
            style={inputStil}
          />
        </>
      ) : null}

      {yontem === 'sesle-kilo' ? (
        <>
          <AnaButon
            title={dinliyor ? 'Dinleniyor…' : 'Kiloyu söyle (ör: 68 kilo)'}
            variant="secondary"
            onPress={sesleKilo}
          />
          <TextInput
            placeholder={placeholder}
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            placeholderTextColor={colors.textSecondary}
            style={[inputStil, { marginTop: 10 }]}
          />
        </>
      ) : null}

      {secilen === 'toplu-csv' && !yakininda ? (
        <AnaButon
          title="Toplu CSV / Excel içe aktar"
          variant="secondary"
          onPress={() => router.push('/turkvet-aktar' as never)}
        />
      ) : null}

      {secilen === 'baskul' ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 }}>
          Baskül bağlantısı hazır olunca otomatik okuma burada açılacak.
        </Text>
      ) : null}

      {secilen === 'baskul-ocr' ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 }}>
          Baskül ekranı OCR yakında — şimdilik kiloyu elle yazın.
        </Text>
      ) : null}

      {secilen === 'iot-api' ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 }}>
          IoT / API entegrasyonu planlanıyor.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, minHeight: 48 },
  banner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
});
