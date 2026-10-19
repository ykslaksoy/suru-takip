/** Sürüden hayvan seç — arama + cinsiyet süzgeci; her satırda isteğe bağlı uyarı */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';

const DURUM: Partial<Record<Animal['status'], string>> = { sold: 'satıldı', dead: 'öldü', pregnant: 'gebe', lactating: 'sağmal' };

export function HayvanSecici({
  hayvanlar,
  cinsiyet,
  haric,
  satirNotu,
  bosSecenek,
  onSec,
  onKapat,
  baslik,
}: {
  hayvanlar: Animal[];
  cinsiyet?: Animal['sex'];
  /** true dönerse listede gösterilmez; string dönerse gri ve seçilemez (sebep yazılır) */
  haric?: (a: Animal) => boolean | string | null;
  satirNotu?: (a: Animal) => { metin: string; renk?: string } | null;
  bosSecenek?: string;
  onSec: (a: Animal | null) => void;
  onKapat: () => void;
  baslik: string;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [ara, setAra] = useState('');
  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase('tr');
    return hayvanlar
      .filter((a) => !cinsiyet || a.sex === cinsiyet)
      .filter((a) => haric?.(a) !== true)
      .filter((a) => !q || [a.earTag, a.name, a.sirtNo ?? '', a.turkvetNo, a.paddock].some((x) => x.toLocaleLowerCase('tr').includes(q)))
      // damızlık seçimi: yaşlılar (ergin) önce
      .sort((x, y) => (x.birthDate || '9999').localeCompare(y.birthDate || '9999'))
      .slice(0, 40);
  }, [hayvanlar, cinsiyet, haric, ara]);
  return (
    <View style={[styles.kutu, { borderColor: colors.tint, backgroundColor: colors.card }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>{baslik}</Text>
        <Pressable onPress={onKapat} hitSlop={10}>
          <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>Kapat ✕</Text>
        </Pressable>
      </View>
      <TextInput
        value={ara}
        onChangeText={setAra}
        placeholder="Küpe, sırt no, ad, padok ara"
        placeholderTextColor={colors.textSecondary}
        style={[styles.ara, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
      />
      {bosSecenek ? (
        <Pressable onPress={() => onSec(null)} style={[styles.satir, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{bosSecenek}</Text>
        </Pressable>
      ) : null}
      {liste.map((a) => {
        const engel = haric?.(a);
        const not = typeof engel === 'string' ? { metin: engel, renk: colors.danger } : satirNotu?.(a) ?? null;
        return (
          <Pressable key={a.id} disabled={typeof engel === 'string'} onPress={() => onSec(a)} style={[styles.satir, { borderColor: colors.border, opacity: typeof engel === 'string' ? 0.5 : 1 }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {a.sex === 'male' ? '♂' : '♀'} {hayvanAnaEtiket(a)}
              <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>
                {'  '}
                {a.earTag} · {a.paddock}
                {DURUM[a.status] ? ` · ${DURUM[a.status]}` : ''}
              </Text>
            </Text>
            {not ? <Text style={{ color: not.renk ?? colors.textSecondary, fontSize: 12, marginTop: 2 }}>{not.metin}</Text> : null}
          </Pressable>
        );
      })}
      {liste.length === 0 ? <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Eşleşen hayvan yok.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1.5, borderRadius: 14, padding: 12, marginBottom: 14 },
  ara: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6, fontSize: 14 },
  satir: { borderTopWidth: 1, paddingVertical: 9 },
});
