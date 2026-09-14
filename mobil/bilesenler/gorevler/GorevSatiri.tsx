import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import {
  gorevSeviyeEtiket,
  gorevTarihMetni,
  type Gorev,
  type GorevSeviye,
} from '@/kaynak/gorevler';

function seviyeRenk(seviye: GorevSeviye, colors: (typeof Colors)['light']): string {
  if (seviye === 'uyari') return colors.danger;
  if (seviye === 'sira') return colors.warning;
  if (seviye === 'plan') return colors.tint;
  return colors.textSecondary;
}

export function GorevSatiri({
  g,
  colors,
  onTamamla,
}: {
  g: Gorev;
  colors: (typeof Colors)['light'];
  onTamamla?: () => void;
}) {
  const renk = seviyeRenk(g.seviye, colors);
  const tarih = gorevTarihMetni(g.tarih);
  // "20 kuzu" veya "20 kuzu · …" → satırda kaç kuzu net görünsün
  const kuzuEslesme = g.aciklama.match(/^(\d+)\s*kuzu\b/i);
  const kuzuMetin = kuzuEslesme ? `${kuzuEslesme[1]} kuzu` : null;
  const kalanAciklama = kuzuEslesme
    ? g.aciklama.replace(/^\d+\s*kuzu\s*[·•-]?\s*/i, '').trim()
    : g.aciklama;

  return (
    <View style={styles.madde}>
      <Pressable onPress={() => router.push(g.href as never)}>
        <View style={styles.metaRow}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, flex: 1 }}>
            <Text style={{ color: colors.tint }}>{tarih}</Text>
            <Text style={{ color: colors.textSecondary }}> · </Text>
            {g.baslik}
            {g.baslikIgne ? (
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '400' }}>
                {' '}
                ({g.baslikIgne})
              </Text>
            ) : null}
            {g.baslikMl ? (
              <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700' }}>
                {' '}
                {g.baslikMl}
              </Text>
            ) : null}
            {kuzuMetin ? (
              <>
                <Text style={{ color: colors.textSecondary }}> · </Text>
                <Text style={{ color: colors.text }}>{kuzuMetin}</Text>
              </>
            ) : null}
          </Text>
          <View style={[styles.seviyeBadge, { backgroundColor: renk + '22' }]}>
            <Text style={{ color: renk, fontSize: 11, fontWeight: '800' }}>
              {gorevSeviyeEtiket(g.seviye)}
            </Text>
          </View>
        </View>
        {kalanAciklama ? (
          <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
            {kalanAciklama}
          </Text>
        ) : null}
        <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{g.cta} →</Text>
      </Pressable>
      {g.tamamlanabilir && onTamamla ? (
        <Pressable onPress={onTamamla} style={[styles.tamamBtn, { borderColor: colors.success }]}>
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Tamamla</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  seviyeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  madde: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  tamamBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
