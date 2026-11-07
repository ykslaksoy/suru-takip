import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  BESI_SECENEKLER,
  besiSekliKaydet,
  besiSekliOku,
  type BesiSekli,
} from '@/kaynak/suru/besi-sekli-yon';

type Props = {
  compact?: boolean;
  onSekilDegisti?: (sekil: BesiSekli) => void;
};

/** Aşı ortam profilindeki `besiSekli` — tek kalıcı kaynak */
export function BesiSekliSecici({ compact, onSekilDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [sekil, setSekil] = useState<BesiSekli | null>(null);
  const [busy, setBusy] = useState(false);

  const yukle = useCallback(async () => {
    setSekil(await besiSekliOku());
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const sec = async (v: BesiSekli) => {
    if (busy || v === sekil) return;
    setBusy(true);
    try {
      await besiSekliKaydet(v);
      setSekil(v);
      onSekilDegisti?.(v);
    } finally {
      setBusy(false);
    }
  };

  if (sekil == null) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: compact ? 11 : 12 }]}>
        Besi şekli
      </Text>
      <View style={styles.row}>
        {BESI_SECENEKLER.map((s) => {
          const aktif = sekil === s.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              accessibilityLabel={s.label}
              disabled={busy}
              onPress={() => void sec(s.id)}
              style={[
                styles.chip,
                compact && styles.chipCompact,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? `${colors.tint}22` : colors.background,
                },
              ]}>
              <Text
                style={{
                  color: aktif ? colors.tint : colors.text,
                  fontSize: compact ? 11 : 12,
                  fontWeight: aktif ? '800' : '500',
                }}
                numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  label: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 88,
    flexGrow: 1,
    flexBasis: '30%',
  },
  chipCompact: { paddingVertical: 6, minWidth: 72 },
});
