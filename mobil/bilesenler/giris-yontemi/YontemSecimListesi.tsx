import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  kuzuSecimYontemDurumu,
  tartimGirisYontemDurumu,
  yontemDurumEtiket,
  type KuzuSecimYontemi,
  type TartimGirisYontemi,
  type YontemDurum,
} from '@/kaynak/giris-yontemi';

type Secenek = { id: string; baslik: string; aciklama: string };

type Props<T extends string> = {
  tur: 'kuzu' | 'tartim';
  secenekler: Secenek[];
  secili: T;
  onSec: (id: T) => void;
};

function durumAl(tur: 'kuzu' | 'tartim', id: string): YontemDurum {
  return tur === 'kuzu'
    ? kuzuSecimYontemDurumu(id as KuzuSecimYontemi)
    : tartimGirisYontemDurumu(id as TartimGirisYontemi);
}

export function YontemSecimListesi<T extends string>({ tur, secenekler, secili, onSec }: Props<T>) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.list}>
      {secenekler.map((s) => {
        const aktif = secili === s.id;
        const durum = durumAl(tur, s.id);
        const kapali = durum === 'kapali';
        return (
          <Pressable
            key={s.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: aktif, disabled: kapali }}
            disabled={kapali}
            onPress={() => onSec(s.id as T)}
            style={[
              styles.kart,
              {
                borderColor: aktif ? colors.tint : colors.border,
                backgroundColor: aktif ? colors.tint + '14' : colors.card,
                opacity: kapali ? 0.45 : 1,
              },
            ]}>
            <View style={styles.ust}>
              <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>{s.baslik}</Text>
              <View
                style={[
                  styles.rozet,
                  {
                    backgroundColor:
                      durum === 'aktif'
                        ? colors.success + '22'
                        : durum === 'yakininda'
                          ? colors.warning + '22'
                          : colors.border,
                  },
                ]}>
                <Text
                  style={{
                    color:
                      durum === 'aktif'
                        ? colors.success
                        : durum === 'yakininda'
                          ? colors.warning
                          : colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}>
                  {yontemDurumEtiket(durum)}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>{s.aciklama}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  kart: { borderWidth: 2, borderRadius: 14, padding: 14 },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rozet: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});
