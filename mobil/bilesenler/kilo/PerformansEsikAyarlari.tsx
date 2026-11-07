import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  getPerformansEsikDepo,
  kaydetPerformansEsikKaydi,
} from '@/kaynak/kilo/performans-esik-depo';
import {
  FCR_BIRIM,
  GCAA_BIRIM,
  type PerformansEsikKapsam,
} from '@/kaynak/kilo/performans-esik-tipler';
import {
  aktifEsikOzet,
  cozumlePerformansEsikleri,
  PERFORMANS_ESIK_ONCELIK_METNI,
} from '@/kaynak/kilo/performans-esik-oncelik';
import { PHASE_LABELS, type RationPhase } from '@/kaynak/rasyon/hesapla';
import { getPadoklar } from '@/kaynak/suru/padok';
import { metrikBaslik } from '@/sabitler/Metinler';

type KapsamSecim = 'genel' | 'padok' | 'faz' | 'padok_faz';

const FAZLAR: RationPhase[] = ['lamb_fattening', 'maintenance', 'pregnant', 'lactating', 'dry'];

export function PerformansEsikAyarlari({ onKayit }: { onKayit?: () => void }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [kapsamSecim, setKapsamSecim] = useState<KapsamSecim>('genel');
  const [padokAd, setPadokAd] = useState('');
  const [faz, setFaz] = useState<RationPhase>('lamb_fattening');
  const [padoklar, setPadoklar] = useState<string[]>([]);
  const [gcaaEtkin, setGcaaEtkin] = useState(false);
  const [gcaaMetin, setGcaaMetin] = useState('');
  const [fcrEtkin, setFcrEtkin] = useState(false);
  const [fcrMetin, setFcrMetin] = useState('');
  const [onizleme, setOnizleme] = useState('');

  const kapsamOlustur = useCallback((): PerformansEsikKapsam => {
    if (kapsamSecim === 'genel') return { tur: 'genel' };
    if (kapsamSecim === 'padok') return { tur: 'padok', padokAd: padokAd.trim() || 'Padok A' };
    if (kapsamSecim === 'faz') return { tur: 'faz', faz };
    return { tur: 'padok_faz', padokAd: padokAd.trim() || 'Padok A', faz };
  }, [kapsamSecim, padokAd, faz]);

  const yukleOnizleme = useCallback(async () => {
    const depo = await getPerformansEsikDepo();
    const c = cozumlePerformansEsikleri(
      depo,
      padokAd.trim() || 'Padok A',
      faz,
    );
    setOnizleme(aktifEsikOzet(c));
  }, [padokAd, faz]);

  useEffect(() => {
    getPadoklar().then((p) => setPadoklar(p.map((x) => x.ad)));
    yukleOnizleme();
  }, [yukleOnizleme]);

  const kaydet = async () => {
    const kapsam = kapsamOlustur();
    const sonuc = await kaydetPerformansEsikKaydi({
      kapsam,
      gcaaAlt: { etkin: gcaaEtkin, deger: gcaaMetin === '' ? 0 : Number(gcaaMetin.replace(',', '.')) },
      fcrUst: { etkin: fcrEtkin, deger: fcrMetin === '' ? 0 : Number(fcrMetin.replace(',', '.')) },
    });
    if (!sonuc.ok) {
      Alert.alert('Hedef doğrulanamadı', sonuc.hatalar.join('\n'));
      return;
    }
    await yukleOnizleme();
    onKayit?.();
    Alert.alert('Kaydedildi', 'Çiftlik performans hedefleri güncellendi. Uyarılar yeniden hesaplanır.');
  };

  const Chip = ({ id, label }: { id: KapsamSecim; label: string }) => (
    <Pressable
      onPress={() => setKapsamSecim(id)}
      style={[
        styles.chip,
        {
          borderColor: kapsamSecim === id ? colors.tint : colors.border,
          backgroundColor: kapsamSecim === id ? colors.tint + '18' : colors.card,
        },
      ]}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.tint }]}>Performans hedefleri (çiftlik)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
        {metrikBaslik('GCAA')} alt ve {metrikBaslik('FCR')} üst sınır — tıbbi normal aralık değil; sizin hedefiniz.
        Tanı veya otomatik tedavi önerilmez.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>{PERFORMANS_ESIK_ONCELIK_METNI}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <Chip id="genel" label="Genel" />
        <Chip id="padok" label="Padok" />
        <Chip id="faz" label="Besleme dönemi" />
        <Chip id="padok_faz" label="Padok + dönem" />
      </View>

      {(kapsamSecim === 'padok' || kapsamSecim === 'padok_faz') && (
        <TextInput
          value={padokAd}
          onChangeText={setPadokAd}
          placeholder={padoklar[0] ?? 'Padok adı'}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
      )}

      {(kapsamSecim === 'faz' || kapsamSecim === 'padok_faz') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {FAZLAR.map((f) => (
            <Pressable key={f} onPress={() => setFaz(f)} style={[styles.chip, { borderColor: faz === f ? colors.tint : colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 11 }}>{PHASE_LABELS[f]}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={() => setGcaaEtkin((v) => !v)} style={styles.row}>
        <Text style={{ color: colors.text, flex: 1 }}>GCAA alt hedef ({GCAA_BIRIM})</Text>
        <Text style={{ color: colors.tint }}>{gcaaEtkin ? 'Açık' : 'Kapalı'}</Text>
      </Pressable>
      {gcaaEtkin ? (
        <TextInput
          value={gcaaMetin}
          onChangeText={setGcaaMetin}
          keyboardType="decimal-pad"
          placeholder="ör. 150"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
      ) : null}

      <Pressable onPress={() => setFcrEtkin((v) => !v)} style={styles.row}>
        <Text style={{ color: colors.text, flex: 1 }}>FCR üst hedef ({FCR_BIRIM})</Text>
        <Text style={{ color: colors.tint }}>{fcrEtkin ? 'Açık' : 'Kapalı'}</Text>
      </Pressable>
      {fcrEtkin ? (
        <TextInput
          value={fcrMetin}
          onChangeText={setFcrMetin}
          keyboardType="decimal-pad"
          placeholder="ör. 7"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
      ) : null}

      <Pressable onPress={kaydet} style={[styles.btn, { backgroundColor: colors.tint }]}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>Kaydet</Text>
      </Pressable>

      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 17 }}>
        Önizleme ({padokAd || 'Padok A'} · {PHASE_LABELS[faz]}): {onizleme}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
  title: { fontWeight: '800', fontSize: 15, marginBottom: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  row: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center' },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 6 },
});
