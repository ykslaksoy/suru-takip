import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import {
  GUN1_SECENEKLER,
  gun1KalemEtiketleri,
  gun1ProgramIdsForMod,
  type Gun1SecimMod,
} from '@/kaynak/gorevler/gun1-secim';

type ColorsT = (typeof Colors)['light'];

type Props = {
  colors: ColorsT;
  /** Kaydedilmiş seçim özeti — gösterimde */
  kayitOzet?: { mod: Gun1SecimMod; adet: number } | null;
  onKaydet: (mod: Gun1SecimMod, programIds: string[]) => void;
  onDegistir?: () => void;
  /** true = seçim formu; false = özet şeridi */
  secimAcik: boolean;
};

/**
 * Gün 1: önce ne yapılacağını seç — sonra yalnızca o kalemler.
 */
export function Gun1SecimPaneli({
  colors,
  kayitOzet,
  onKaydet,
  onDegistir,
  secimAcik,
}: Props) {
  const [mod, setMod] = useState<Gun1SecimMod | null>(null);
  const [ozel, setOzel] = useState<Set<string>>(() => new Set([gun1ProgramIdsForMod('sadece-tartim')[0]!]));
  const kalemler = useMemo(() => gun1KalemEtiketleri(), []);

  if (!secimAcik && kayitOzet) {
    return (
      <View
        style={[
          styles.ozet,
          { backgroundColor: colors.background, borderColor: colors.tint },
        ]}
      >
        <Text style={[styles.ozetBaslik, { color: colors.text }]}>
          Bugün: {GUN1_SECENEKLER.find((s) => s.mod === kayitOzet.mod)?.baslik}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          {kayitOzet.adet} adım · tartı seçildiyse önce
        </Text>
        {onDegistir ? (
          <Pressable onPress={onDegistir} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>
              Seçimi değiştir
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const toggleOzel = (id: string) => {
    setOzel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const basla = () => {
    if (!mod) return;
    const ids =
      mod === 'ozel' ? Array.from(ozel) : gun1ProgramIdsForMod(mod);
    if (ids.length === 0) return;
    onKaydet(mod, ids);
  };

  return (
    <View style={[styles.kutu, { borderColor: colors.tint, backgroundColor: colors.card }]}>
      <Text style={[styles.baslik, { color: colors.text }]}>
        Bugün ne yapacaksın?
      </Text>
      <Text style={[styles.alt, { color: colors.textSecondary }]}>
        Tartarken aynı gün aşı/iğne de yapılır. Yem ayrı listede. Önce seç, sonra adım adım git.
      </Text>

      {GUN1_SECENEKLER.map((s) => {
        const on = mod === s.mod;
        return (
          <Pressable
            key={s.mod}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => setMod(s.mod)}
            style={[
              styles.secenek,
              {
                borderColor: on ? colors.tint : colors.border,
                backgroundColor: on ? colors.background : colors.card,
              },
            ]}
          >
            <Text style={[styles.secenekBaslik, { color: colors.text }]}>{s.baslik}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              {s.aciklama}
            </Text>
          </Pressable>
        );
      })}

      {mod === 'ozel' ? (
        <View style={styles.liste}>
          <Text style={[styles.listeBaslik, { color: colors.tint }]}>İşaretle</Text>
          {kalemler.map((k) => {
            const on = ozel.has(k.programId);
            return (
              <Pressable
                key={k.programId}
                onPress={() => toggleOzel(k.programId)}
                style={[
                  styles.chip,
                  {
                    borderColor: on ? colors.tint : colors.border,
                    backgroundColor: on ? colors.tint : colors.background,
                  },
                ]}
              >
                <Text
                  style={{
                    color: on ? '#fff' : colors.text,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {on ? '✓ ' : ''}
                  {k.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Pressable
        onPress={basla}
        disabled={!mod || (mod === 'ozel' && ozel.size === 0)}
        style={[
          styles.cta,
          {
            backgroundColor: colors.tint,
            opacity: !mod || (mod === 'ozel' && ozel.size === 0) ? 0.45 : 1,
          },
        ]}
      >
        <Text style={styles.ctaText}>Seçtiklerimle devam</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  alt: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  secenek: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  secenekBaslik: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  liste: { marginTop: 4, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listeBaslik: {
    width: '100%',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cta: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  ozet: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ozetBaslik: { fontSize: 14, fontWeight: '800' },
});
