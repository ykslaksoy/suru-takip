import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  BESI_IRK_GRUP_ETIKET,
  BESI_IRK_KATALOG,
  type BesiHedefIrkKodu,
  type BesiIrkGrup,
  irkKatalogAra,
  IRK_KATALOG_BY_KOD,
  KARISIK_IZINLI_IRK,
  normalizeHedefIrkKodu,
} from '@/kaynak/maliyet/besi-plan-irk-katalog';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string; card: string };

const GRUP_SIRA: BesiIrkGrup[] = ['plan_ozel', 'yerli', 'gelistirilmis_melez', 'yabanci'];

export function BesiIrkKatalogSecici({
  secili,
  onSec,
  karisikPazar,
  colors,
  disabled,
}: {
  secili: BesiHedefIrkKodu;
  onSec: (k: BesiHedefIrkKodu) => void;
  karisikPazar: boolean;
  colors: Colors;
  disabled?: boolean;
}) {
  const [sorgu, setSorgu] = useState('');
  const satirlar = useMemo(
    () => irkKatalogAra(sorgu, { karisikPazar }),
    [sorgu, karisikPazar],
  );

  const gruplu = useMemo(() => {
    const m = new Map<BesiIrkGrup, typeof satirlar>();
    for (const g of GRUP_SIRA) m.set(g, []);
    for (const r of satirlar) m.get(r.grup)!.push(r);
    return GRUP_SIRA.map((g) => ({ grup: g, satirlar: m.get(g)! })).filter((x) => x.satirlar.length > 0);
  }, [satirlar]);

  const canon = normalizeHedefIrkKodu(secili);
  const meta = IRK_KATALOG_BY_KOD[canon];

  return (
    <View>
      <TextInput
        editable={!disabled}
        value={sorgu}
        onChangeText={setSorgu}
        placeholder="Ara: Asaf, İmroz, Şarole, merinos…"
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Text style={{ color: colors.tint, fontSize: 11, marginBottom: 4 }}>
        Seçili: {meta?.etiket ?? secili}
        {secili === 'pirit_belirsiz' ? ' (kayıt: eski pirit_belirsiz)' : ''}
        {karisikPazar ? ' · pazar karışık — sınırlı liste' : ''}
      </Text>
      <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
        {gruplu.map(({ grup, satirlar: ls }) => (
          <View key={grup} style={{ marginBottom: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
              {BESI_IRK_GRUP_ETIKET[grup]}
            </Text>
            {ls.map((r) => (
              <Pressable
                key={r.kod}
                disabled={disabled}
                onPress={() => onSec(r.kod)}
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  borderRadius: 6,
                  marginTop: 2,
                  backgroundColor: canon === r.kod ? `${colors.tint}22` : colors.card,
                  borderWidth: 1,
                  borderColor: canon === r.kod ? colors.tint : colors.border,
                }}>
                <Text style={{ color: colors.text, fontSize: 11 }}>{r.etiket}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      {!karisikPazar && (
        <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 4 }}>
          Katalog: {BESI_IRK_KATALOG.length} ırk · plan ADG ırktan bağımsız (NSW bant)
        </Text>
      )}
    </View>
  );
}

export { KARISIK_IZINLI_IRK };

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14, marginBottom: 6 },
});
