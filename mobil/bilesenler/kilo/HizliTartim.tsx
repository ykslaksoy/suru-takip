/**
 * Hızlı tartım döngüsü: küpe → kilo → Enter ile kaydet → sıradaki küpe (odak küpede kalır).
 * Her kayıtta anlık günlük artış, hedef kiloya kalan gün ve referans eğri uyarısı.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { addWeightRecord, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { hayvanBul } from '@/kaynak/ses/uygula';
import { upsertRationPlanFromWeight } from '@/kaynak/rasyon/hayvan-plani';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import {
  analizOzeti,
  tartimAnaliz,
  VARSAYILAN_TARTIM_AYAR,
  type TartimAnaliz,
  type TartimAyar,
} from '@/kaynak/kilo/hizli-tartim';
import { getTartimAyar, saveTartimAyar } from '@/kaynak/kilo/tartim-ayar';

type Sonuc = { id: string; animalId: string; etiket: string; analiz: TartimAnaliz };

export function HizliTartim() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [kupe, setKupe] = useState('');
  const [kilo, setKilo] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const [ayar, setAyar] = useState<TartimAyar>(VARSAYILAN_TARTIM_AYAR);
  const [ayarAcik, setAyarAcik] = useState(false);
  const kupeRef = useRef<TextInput>(null);
  const kiloRef = useRef<TextInput>(null);

  useEffect(() => {
    getTartimAyar().then(setAyar).catch(() => {});
  }, []);

  const ayarDegistir = (alan: keyof TartimAyar, d: number) => {
    const yeni = { ...ayar, [alan]: Math.max(1, ayar[alan] + d) };
    setAyar(yeni);
    saveTartimAyar(yeni).catch(() => {});
  };

  const kaydet = useCallback(async () => {
    setHata(null);
    const kg = parseFloat(kilo.replace(',', '.'));
    if (!kupe.trim()) {
      kupeRef.current?.focus();
      return;
    }
    if (!Number.isFinite(kg) || kg <= 0 || kg > 200) {
      setHata('Geçerli bir kilo girin');
      kiloRef.current?.focus();
      return;
    }
    const animal = await hayvanBul(kupe);
    if (!animal) {
      setHata(`${kupe} bulunamadı`);
      kupeRef.current?.focus();
      return;
    }
    const at = new Date().toISOString();
    const onceki = await getWeightRecords(animal.id);
    const analiz = tartimAnaliz(onceki, { kg, at }, ayar);
    await addWeightRecord({ animalId: animal.id, weightKg: kg, recordedAt: at, notes: 'Hızlı tartım' });
    await upsertRationPlanFromWeight(animal, kg).catch(() => {});
    void islemKaydet({ tur: 'tartim', ozet: `${hayvanAnaEtiket(animal)} · ${kg} kg`, detay: 'Hızlı tartım', animalId: animal.id });
    setSonuclar((s) => [{ id: `${Date.now()}`, animalId: animal.id, etiket: hayvanAnaEtiket(animal), analiz }, ...s].slice(0, 30));
    setKupe('');
    setKilo('');
    refresh();
    setTimeout(() => kupeRef.current?.focus(), 30);
  }, [kupe, kilo, ayar, refresh]);

  const altinda = sonuclar.filter((s) => s.analiz.egriAltinda).length;

  return (
    <View>
      <View style={styles.girisSatir}>
        <TextInput
          ref={kupeRef}
          autoFocus
          value={kupe}
          onChangeText={setKupe}
          placeholder="Küpe / sırt no"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => kiloRef.current?.focus()}
          style={[styles.input, { flex: 1.3, borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        />
        <TextInput
          ref={kiloRef}
          value={kilo}
          onChangeText={setKilo}
          placeholder="kg"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={() => void kaydet()}
          style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        />
        <Pressable onPress={() => void kaydet()} style={[styles.kaydet, { backgroundColor: colors.tint }]}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>Kaydet</Text>
        </Pressable>
      </View>
      {hata ? <Text style={{ color: colors.warning, fontWeight: '700', marginBottom: 6 }}>{hata}</Text> : null}

      <Pressable onPress={() => setAyarAcik((v) => !v)}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Hedef satış kilosu {ayar.hedefKg} kg · referans eğri günde {ayar.referansAdgGram} g (varsayılan, değiştirilebilir) {ayarAcik ? '▲' : '▼'}
        </Text>
      </Pressable>
      {ayarAcik ? (
        <View style={[styles.ayarKart, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {(
            [
              ['hedefKg', 'Hedef satış kilosu (kg)', 1],
              ['referansAdgGram', 'Referans günlük artış (g)', 10],
              ['toleransYuzde', 'Eğri altı toleransı (%)', 1],
            ] as const
          ).map(([alan, etiket, adim]) => (
            <View key={alan} style={styles.ayarSatir}>
              <Text style={{ color: colors.text, flex: 1 }}>{etiket}</Text>
              <Pressable onPress={() => ayarDegistir(alan, -adim)} style={[styles.adim, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>−</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>{ayar[alan]}</Text>
              <Pressable onPress={() => ayarDegistir(alan, adim)} style={[styles.adim, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>+</Text>
              </Pressable>
            </View>
          ))}
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
            Eğri, kuzunun ilk tartımından itibaren günlük referans artışla hesaplanan beklenen kilodur. Bilimsel bir standart değil, işletmenize göre ayarlayın.
          </Text>
        </View>
      ) : null}

      {sonuclar.length ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginVertical: 6 }}>
          BU OTURUM: {sonuclar.length} TARTIM{altinda ? ` · ${altinda} KUZU EĞRİNİN ALTINDA` : ''}
        </Text>
      ) : null}
      {sonuclar.map((s, i) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/hayvan/${s.animalId}/kilo`)}
          style={[
            styles.sonuc,
            {
              backgroundColor: colors.card,
              borderColor: s.analiz.egriAltinda ? colors.warning : i === 0 ? colors.tint : colors.border,
            },
          ]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {s.etiket} · {String(s.analiz.kg).replace('.', ',')} kg
              {s.analiz.farkKg != null ? (
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  {'  '}({s.analiz.farkKg >= 0 ? '+' : ''}
                  {String(s.analiz.farkKg).replace('.', ',')} kg)
                </Text>
              ) : null}
            </Text>
            <Text style={{ color: s.analiz.egriAltinda ? colors.warning : colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {analizOzeti(s.analiz, ayar)}
            </Text>
          </View>
          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Grafik →</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  girisSatir: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 20, fontWeight: '700', minHeight: 56, minWidth: 0, width: 0 },
  kaydet: { borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  ayarKart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  ayarSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  adim: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sonuc: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
});
