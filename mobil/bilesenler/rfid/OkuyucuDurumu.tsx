import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  rfidBaglan,
  rfidBaglantiyiKes,
  rfidCihazAdi,
  rfidDurum,
  rfidDurumDinle,
  rfidDurumEtiket,
  type RfidOkuyucuDurum,
} from '@/kaynak/rfid';

/** RFID okuyucu durumu — gerçek BLE (Web Bluetooth) bağlantısı */
export function OkuyucuDurumu() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [durum, setDurum] = useState<RfidOkuyucuDurum>(rfidDurum());
  const [mesaj, setMesaj] = useState('');

  useEffect(() => rfidDurumDinle(setDurum), []);

  const bagli = durum === 'hazir' || durum === 'okuyor';
  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 4 }}>RFID / GEKİS okuyucu</Text>
      <Text style={{ color: colors.text, fontWeight: '700' }}>
        {rfidDurumEtiket(durum)}
        {bagli && rfidCihazAdi() ? ` — ${rfidCihazAdi()}` : ''}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
        {durum === 'desteklenmiyor'
          ? 'Bluetooth okuyucu için Android Chrome/Edge veya masaüstü Chrome kullanın. Küpeyi elle veya fotoğraf OCR ile girebilirsiniz.'
          : 'Bluetooth (BLE) küpe okuyucunuzu açın ve eşleştirin. Nordic UART, HM-10 ve ISSC seri profilleri desteklenir.'}
      </Text>
      {durum !== 'desteklenmiyor' ? (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            if (bagli) {
              rfidBaglantiyiKes();
              setMesaj('Bağlantı kesildi.');
              return;
            }
            const r = await rfidBaglan();
            setMesaj(r.message);
          }}
          style={[styles.btn, { borderColor: colors.tint }]}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>{bagli ? 'Bağlantıyı kes' : 'Okuyucu bağla'}</Text>
        </Pressable>
      ) : null}
      {mesaj ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>{mesaj}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  btn: { marginTop: 8, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
});
