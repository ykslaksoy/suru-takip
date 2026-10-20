import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BESI_UFUK_SECENEKLERI,
  besiProgramOzeti,
  besiUfukGunKaydet,
  besiUfukGunOku,
} from '@/kaynak/besi-programi';

type Props = {
  colors: {
    text: string;
    textSecondary: string;
    tint: string;
    card: string;
    border: string;
  };
  /** Kompakt — hub kartı altında */
  compact?: boolean;
  onDegisti?: (ufukGun: number) => void;
};

/** Satış ufku seçimi — hızlı kabul öncesi */
export function BesiUfukSecici({ colors, compact, onDegisti }: Props) {
  const [secili, setSecili] = useState<number | null>(null);
  const [ozet, setOzet] = useState('');

  const yukle = useCallback(async () => {
    const gun = await besiUfukGunOku();
    setSecili(gun);
    const o = besiProgramOzeti(gun);
    setOzet(`${o.asiSatir + o.yemSatir} adım · ${o.gunAraligi}`);
    onDegisti?.(gun);
  }, [onDegisti]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const sec = async (gun: number) => {
    const kayit = await besiUfukGunKaydet(gun);
    setSecili(kayit);
    const o = besiProgramOzeti(kayit);
    setOzet(`${o.asiSatir + o.yemSatir} adım · ${o.gunAraligi}`);
    onDegisti?.(kayit);
  };

  if (secili == null) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact && (
        <Text style={[styles.title, { color: colors.text }]}>Kaç günlük besi programı?</Text>
      )}
      {compact && (
        <Text style={[styles.titleCompact, { color: colors.text }]}>Besi süresi (satış ufku)</Text>
      )}
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Minimum standart takvim bu süreye kırpılır — aşı, tartım ve yem görevleri.
      </Text>
      <View style={styles.row}>
        {BESI_UFUK_SECENEKLERI.map((s) => {
          const aktif = secili === s.gun;
          return (
            <Pressable
              key={s.gun}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              onPress={() => void sec(s.gun)}
              style={[
                styles.chip,
                compact && styles.chipCompact,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? colors.tint + '18' : colors.card,
                },
              ]}>
              <Text style={[styles.chipTitle, { color: aktif ? colors.tint : colors.text }]}>
                {s.baslik}
              </Text>
              {!compact && (
                <Text style={[styles.chipBody, { color: colors.textSecondary }]}>{s.aciklama}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.ozet, { color: colors.textSecondary }]}>{ozet}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  wrapCompact: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  titleCompact: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 88,
    justifyContent: 'center',
  },
  chipCompact: { minHeight: 56 },
  chipTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  chipBody: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  ozet: { marginTop: 10, fontSize: 13, fontWeight: '600' },
});
