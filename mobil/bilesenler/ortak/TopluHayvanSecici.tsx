/**
 * Toplu hayvan seçici — parti/padok, tümü veya yapıştırılan küpe listesi ile seçim.
 * Aşı/ilaç/vitamin görevlerinde ve toplu kayıtlarda tekrar kullanılır.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { kupeListesiAyikla } from '@/kaynak/toplu/secim';

export type SeciciHayvan = {
  id: string;
  etiket: string;
  altEtiket?: string;
  paddock: string;
  /** Küpe / sırt no eşleşmesi için */
  kupe: string;
  durum?: string;
};

type Props = {
  hayvanlar: SeciciHayvan[];
  secili: Set<string>;
  onChange: (s: Set<string>) => void;
  onSatir?: (id: string) => void;
};

export default function TopluHayvanSecici({ hayvanlar, secili, onChange, onSatir }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [listeAcik, setListeAcik] = useState(false);
  const [listeMetni, setListeMetni] = useState('');
  const [listeSonuc, setListeSonuc] = useState<string | null>(null);

  const padoklar = useMemo(
    () => [...new Set(hayvanlar.map((h) => h.paddock).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [hayvanlar],
  );
  const tumuSecili = hayvanlar.length > 0 && hayvanlar.every((h) => secili.has(h.id));

  const sec = (ids: string[]) => onChange(new Set(ids));
  const toggle = (id: string) => {
    const s = new Set(secili);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    onChange(s);
  };

  const listeUygula = () => {
    const kupeler = kupeListesiAyikla(listeMetni);
    const ids: string[] = [];
    const yok: string[] = [];
    for (const k of kupeler) {
      const rakam = k.replace(/\D/g, '');
      const h = hayvanlar.find(
        (x) => x.kupe.toUpperCase() === k || (rakam.length >= 3 && x.kupe.replace(/\D/g, '').endsWith(rakam)),
      );
      if (h) ids.push(h.id);
      else yok.push(k);
    }
    sec(ids);
    setListeSonuc(`${ids.length} kuzu seçildi${yok.length ? ` · bu listede yok: ${yok.join(', ')}` : ''}`);
  };

  const chip = (etiket: string, aktif: boolean, onPress: () => void) => (
    <Pressable
      key={etiket}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: aktif ? colors.tint : colors.border, backgroundColor: aktif ? colors.tint : colors.card },
      ]}>
      <Text style={{ color: aktif ? '#fff' : colors.text, fontWeight: '700', fontSize: 13 }}>{etiket}</Text>
    </Pressable>
  );

  return (
    <View>
      <View style={styles.chipSatir}>
        {chip(`Tümü (${hayvanlar.length})`, tumuSecili, () => sec(tumuSecili ? [] : hayvanlar.map((h) => h.id)))}
        {padoklar.map((p) => {
          const ids = hayvanlar.filter((h) => h.paddock === p).map((h) => h.id);
          const aktif = !tumuSecili && ids.length > 0 && ids.every((i) => secili.has(i)) && secili.size === ids.length;
          return chip(`${p} (${ids.length})`, aktif, () => sec(ids));
        })}
        {chip('Küpe listesi', listeAcik, () => setListeAcik((v) => !v))}
      </View>

      {listeAcik ? (
        <View style={[styles.liste, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            value={listeMetni}
            onChangeText={setListeMetni}
            multiline
            placeholder="Küpe numaralarını yapıştır: 1201, 1202 1203…"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <Pressable onPress={listeUygula} style={[styles.listeBtn, { backgroundColor: colors.tint }]}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Listeyi seç</Text>
          </Pressable>
          {listeSonuc ? <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 12 }}>{listeSonuc}</Text> : null}
        </View>
      ) : null}

      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginVertical: 8 }}>
        SEÇİLİ: {secili.size} / {hayvanlar.length} KUZU
      </Text>

      {hayvanlar.map((h) => {
        const on = secili.has(h.id);
        return (
          <View key={h.id} style={[styles.satir, { backgroundColor: colors.card, borderColor: on ? colors.tint : colors.border }]}>
            <Pressable onPress={() => toggle(h.id)} hitSlop={8} style={[styles.kutu, { borderColor: colors.tint, backgroundColor: on ? colors.tint : 'transparent' }]}>
              {on ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={() => toggle(h.id)}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{h.etiket}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {[h.altEtiket, h.paddock, h.durum].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
            {onSatir ? (
              <Pressable onPress={() => onSatir(h.id)} hitSlop={8}>
                <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Kart →</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  liste: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 64, textAlignVertical: 'top' },
  listeBtn: { borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  kutu: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
