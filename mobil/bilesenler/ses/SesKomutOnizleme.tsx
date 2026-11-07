import { StyleSheet, Text, View } from 'react-native';
import type { KomutOnizlemeAlan } from '@/kaynak/ses/komut-onizleme';

type Props = {
  onizleme: KomutOnizlemeAlan;
  onayBekliyor: boolean;
  tint: string;
  border: string;
  text: string;
  textSecondary: string;
  warning: string;
};

export function SesKomutOnizleme({ onizleme, onayBekliyor, tint, border, text, textSecondary, warning }: Props) {
  const baslik = onayBekliyor ? 'Onay bekleyen işlem (henüz kayıt yok)' : 'Taslak yorum (Gönder ile doğrula)';

  return (
    <View
      style={[styles.kutu, { borderColor: onayBekliyor ? tint : border }]}
      accessibilityRole="summary"
      accessibilityLabel={`${baslik}. Hayvan: ${onizleme.hayvan}. İşlem: ${onizleme.islem}. Değer: ${onizleme.deger}`}>
      <Text style={{ color: onayBekliyor ? tint : textSecondary, fontWeight: '800', marginBottom: 8 }}>{baslik}</Text>
      <Satir etiket="Hayvan / hedef" deger={onizleme.hayvan} text={text} textSecondary={textSecondary} />
      <Satir etiket="İşlem" deger={onizleme.islem} text={text} textSecondary={textSecondary} />
      <Satir etiket="Değer / birim" deger={onizleme.deger} text={text} textSecondary={textSecondary} />
      {!onizleme.tam ? (
        <Text style={{ color: warning, fontSize: 12, marginTop: 8 }}>
          {onizleme.not ?? 'Eksik veya belirsiz alan — kayıt için Gönder sonrası soru sorulabilir.'}
        </Text>
      ) : onayBekliyor ? (
        <Text style={{ color: textSecondary, fontSize: 12, marginTop: 8 }}>
          Kayıt için «tamam» deyip Gönder’e basın veya metni düzenleyin (onay sıfırlanır).
        </Text>
      ) : null}
    </View>
  );
}

function Satir({
  etiket,
  deger,
  text,
  textSecondary,
}: {
  etiket: string;
  deger: string;
  text: string;
  textSecondary: string;
}) {
  return (
    <View style={styles.satir}>
      <Text style={{ color: textSecondary, fontSize: 12, width: 108 }}>{etiket}</Text>
      <Text style={{ color: text, fontWeight: '600', flex: 1 }}>{deger}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  satir: { flexDirection: 'row', gap: 8, marginBottom: 4 },
});
