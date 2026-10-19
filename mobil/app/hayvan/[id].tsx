import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { calculateADG, getAnimal, getHealthRecords, getLatestWeight, getWeightRecords, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanZamanCizelgesi, olayIkonu, type ZamanOlayi } from '@/kaynak/gecmis/zaman-cizelgesi';
import { getIslemler, islemKaydet } from '@/kaynak/gecmis/gunluk';
import { hayvanSilGeriAlinabilir } from '@/kaynak/gecmis/hayvan-sil';
import { getPadoklar } from '@/kaynak/suru/padok';
import { hayvanAnaEtiket, hayvanAltEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { ANIMAL_STATUS_LABELS } from '@/kaynak/cekirdek/tipler';
import { TURKVET_FIELD_LABELS } from '@/kaynak/turkvet/dogrula';
import { ageInMonths, bandForAge, gradeFromAdg, dereceEtiket, KUZU_GRADES, type KuzuGrade } from '@/kaynak/kilo/kuzu-derece';
import { hesaplaFcr } from '@/kaynak/kilo/fcr-hesap';
import { ensureRationPlan } from '@/kaynak/rasyon/hayvan-plani';
import { DereceRozeti } from '@/bilesenler/kilo/DereceRozeti';
import { RozetGorseli } from '@/bilesenler/kilo/RozetGorseli';
import { KiloGrafigi } from '@/bilesenler/kilo/KiloGrafigi';
import { YemAdgTablosu } from '@/bilesenler/kilo/YemAdgTablosu';
import { hayvanSinifEtiketi, turEmoji } from '@/kaynak/suru/tur';
import { terim, fcrDeger } from '@/sabitler/Metinler';
import { gebeIsaretle } from '@/kaynak/ureme';
import { getPoliceler, hayvanPolicesi, kalanGun, tarihGoster, yerelTarih, type SigortaPolice } from '@/kaynak/sigorta';
import { getAktifArinmalar, kesilemezMetni, type HayvanArinma } from '@/kaynak/arinma';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import type { WeightRecord } from '@/kaynak/cekirdek/tipler';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [adg, setAdg] = useState<number | null>(null);
  const [grade, setGrade] = useState<KuzuGrade | null>(null);
  const [fcrValue, setFcrValue] = useState<number | null>(null);
  const [dailyRation, setDailyRation] = useState<number | null>(null);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [anneEtiket, setAnneEtiket] = useState<string | null>(null);
  const [olaylar, setOlaylar] = useState<ZamanOlayi[]>([]);
  const [tumOlaylar, setTumOlaylar] = useState(false);
  const [resmiAcik, setResmiAcik] = useState(false);
  const [padoklar, setPadoklar] = useState<string[]>([]);
  const [padokAcik, setPadokAcik] = useState(false);
  const [skalaAcik, setSkalaAcik] = useState(false);
  const [police, setPolice] = useState<SigortaPolice | null | undefined>(undefined);
  const [arinma, setArinma] = useState<HayvanArinma | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const a = await getAnimal(id);
      setAnimal(a);
      if (a) {
        const w = await getLatestWeight(a.id);
        const g = await calculateADG(a.id);
        const records = await getWeightRecords(a.id);
        const fcr = await hesaplaFcr(a, records);
        const plan = await ensureRationPlan(a, w);
        setWeightRecords(records);
        const [health, islemler, pl, policeler, arinmalar] = await Promise.all([
          getHealthRecords(a.id).catch(() => []),
          getIslemler(),
          getPadoklar().catch(() => []),
          getPoliceler().catch(() => [] as SigortaPolice[]),
          getAktifArinmalar().catch(() => [] as HayvanArinma[]),
        ]);
        setArinma(arinmalar.find((x) => x.animalId === a.id) ?? null);
        // undefined = hiç poliçe girilmemiş (satır gösterme); null = sigortasız
        setPolice(policeler.length ? hayvanPolicesi(policeler, a.id, yerelTarih()) : undefined);
        setOlaylar(hayvanZamanCizelgesi({ animal: a, weights: records, health, islemler }));
        setPadoklar(pl.map((x) => x.ad));
        setWeight(w);
        setAdg(g);
        setFcrValue(fcr?.fcr ?? null);
        setDailyRation(fcr?.dailyGivenKg ?? plan?.dailyGivenKg ?? null);
        setGrade(
          gradeFromAdg(g, {
            birthDate: a.birthDate,
            isSick: a.status === 'sick',
            fcr: fcr?.fcr ?? null,
          })
        );
        if (a.motherId) {
          const anne = await getAnimal(a.motherId);
          setAnneEtiket(anne ? hayvanAnaEtiket(anne) : a.motherId);
        } else {
          setAnneEtiket(null);
        }
      }
    })();
  }, [id, refreshKey]);

  if (!animal) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Yükleniyor...</Text>
      </View>
    );
  }

  const sexLabel = animal.sex === 'female' ? 'Dişi' : 'Erkek';
  const avatar = grade && grade.level >= 3 ? grade.emoji : turEmoji(animal.species ?? 'sheep'); // kupa: bronz/gümüş/altın
  const ageMonths = ageInMonths(animal.birthDate);
  const ageBand = bandForAge(ageMonths);
  const ageLabel =
    ageMonths != null ? `~${ageMonths} ay · ${ageBand.label}` : ageBand.label;
  const anaEtiket = hayvanAnaEtiket(animal);
  const altEtiket = hayvanAltEtiket(animal);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.card,
            borderColor: grade && grade.id !== 'bilinmiyor' ? grade.color : colors.border,
            borderWidth: grade && grade.level >= 4 ? 2 : 1,
          },
        ]}>
        {grade ? (
          <View style={styles.rozetSatir}>
            <RozetGorseli grade={grade} boyut={72} />
            <DereceRozeti grade={grade} />
          </View>
        ) : (
          <Text style={{ fontSize: 52, textAlign: 'center' }}>{avatar}</Text>
        )}
        <Text style={[styles.tag, { color: colors.tint }]}>{anaEtiket}</Text>
        {altEtiket ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 14 }}>
            {altEtiket}
          </Text>
        ) : null}
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
          {hayvanSinifEtiketi(animal.species, animal.sex, ageMonths)} · {animal.breed} · {sexLabel} · {ANIMAL_STATUS_LABELS[animal.status]}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
          {ageLabel}
        </Text>
        {grade ? (
          <Text style={{ color: grade.color, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>
            {grade.short}
          </Text>
        ) : null}
        {grade ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
            {grade.hint}
          </Text>
        ) : null}
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>{animal.paddock}</Text>
        {police !== undefined ? (
          <Pressable
            onPress={() => router.push('/sigorta')}
            style={[
              styles.sigorta,
              {
                borderColor: police ? (kalanGun(police, yerelTarih()) <= 30 ? colors.warning : colors.tint) : colors.danger,
                backgroundColor: (police ? colors.tint : colors.danger) + '12',
              },
            ]}>
            <Text style={{ color: police ? colors.tint : colors.danger, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
              {police
                ? `🛡️ Sigortalı · Poliçe ${police.policeNo} · bitiş ${tarihGoster(police.bitis)}${
                    kalanGun(police, yerelTarih()) <= 30 ? ` (${kalanGun(police, yerelTarih())} gün)` : ''
                  }`
                : '⚠️ Sigortasız · geçerli poliçe yok'}
            </Text>
          </Pressable>
        ) : null}
        {arinma ? (
          <Pressable
            onPress={() => router.push('/arinma')}
            style={[styles.sigorta, { borderColor: colors.danger, backgroundColor: colors.danger + '14' }]}>
            <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>{kesilemezMetni(arinma)}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.tint, marginBottom: 0, flex: 1 }]}>Zaman çizelgesi</Text>
          <Pressable onPress={() => setPadokAcik((v) => !v)} hitSlop={8}>
            <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Parti değiştir</Text>
          </Pressable>
        </View>
        {padokAcik ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {padoklar.map((p) => (
              <Pressable
                key={p}
                disabled={p === animal.paddock}
                onPress={async () => {
                  const eski = animal.paddock;
                  await upsertAnimal({ ...animal, paddock: p });
                  await islemKaydet({ tur: 'padok', ozet: `Parti: ${eski || '—'} → ${p}`, animalId: animal.id });
                  setPadokAcik(false);
                  refresh();
                }}
                style={{
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderColor: p === animal.paddock ? colors.tint : colors.border,
                  backgroundColor: p === animal.paddock ? colors.tint : 'transparent',
                }}>
                <Text style={{ color: p === animal.paddock ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{p}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {olaylar.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>Henüz kayıt yok.</Text>
        ) : (
          (tumOlaylar ? olaylar : olaylar.slice(0, 6)).map((o, i, arr) => (
            <View key={o.id} style={styles.olay}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <Text style={{ fontSize: 16 }}>{olayIkonu(o.tur)}</Text>
                {i < arr.length - 1 ? <View style={[styles.olayCizgi, { backgroundColor: colors.border }]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 10 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{o.baslik}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                  {new Date(o.zaman).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {o.detay ? ` · ${o.detay}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
        {olaylar.length > 6 ? (
          <Pressable onPress={() => setTumOlaylar((v) => !v)}>
            <Text style={{ color: colors.tint, fontWeight: '700' }}>{tumOlaylar ? 'Daha az göster' : `Tümünü göster (${olaylar.length})`}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable onPress={() => setResmiAcik((v) => !v)}>
          <Text style={[styles.sectionTitle, { color: colors.tint, marginBottom: resmiAcik ? 12 : 0 }]}>
            Resmi Kayıt (TÜRKVET / GEKİS) {resmiAcik ? '▲' : '▼'}
          </Text>
        </Pressable>
        {resmiAcik ? (
        <>
        <InfoRow label={TURKVET_FIELD_LABELS.turkvetNo} value={animal.turkvetNo || '—'} colors={colors} />
        <InfoRow label="Kulak küpe" value={animal.earTag || '—'} colors={colors} />
        <InfoRow label="Sırt no" value={animal.sirtNo || '—'} colors={colors} />
        <InfoRow label="Aref / GEKİS ID" value={animal.gehisId || '—'} colors={colors} />
        <InfoRow label={TURKVET_FIELD_LABELS.birthDate} value={animal.birthDate || '—'} colors={colors} />
        <InfoRow
          label={TURKVET_FIELD_LABELS.motherId}
          value={anneEtiket || animal.motherId || '—'}
          colors={colors}
        />
        </>
        ) : null}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Performans</Text>
        <InfoRow label="Yaş bandı" value={ageLabel} colors={colors} />
        <InfoRow label="Derece" value={grade ? dereceEtiket(grade) : '—'} colors={colors} />
        <Pressable onPress={() => setSkalaAcik((v) => !v)} hitSlop={6}>
          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13, paddingVertical: 4 }}>
            Derece skalası {skalaAcik ? '▲' : '▼'}
          </Text>
        </Pressable>
        {skalaAcik ? (
          <View style={{ gap: 6, marginBottom: 6 }}>
            {[KUZU_GRADES.bilinmiyor, KUZU_GRADES.zayif, KUZU_GRADES.fit, KUZU_GRADES.sportmen, KUZU_GRADES.kasli, KUZU_GRADES.super_kuzu].map((g) => (
              <View
                key={g.id}
                style={[
                  styles.skalaSatir,
                  { borderColor: grade?.id === g.id ? g.color : 'transparent', backgroundColor: grade?.id === g.id ? g.color + '14' : 'transparent' },
                ]}>
                <RozetGorseli grade={g} boyut={56} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: g.color, fontWeight: '800' }}>
                    {g.emoji} {g.label}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{g.short}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        <InfoRow label="Son tartım" value={weight != null ? `${weight} kg` : '—'} colors={colors} />
        <View style={{ marginTop: 8 }}>
          <YemAdgTablosu gunlukYemKg={dailyRation} adgGram={adg} />
        </View>
        <InfoRow label={terim('FCR')} value={fcrValue != null ? fcrDeger(fcrValue) : '—'} colors={colors} />
      </View>

      {weightRecords.length >= 2 ? (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.tint }]}>Kilo Grafiği</Text>
          <KiloGrafigi records={weightRecords} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/hayvan/${animal.id}/kilo`)}
          style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.tint }])}>
          <Text style={styles.actionText}>📊 Kilo Takibi</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/hayvan/${animal.id}/saglik`)}
          style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.accent }])}>
          <Text style={StyleSheet.flatten([styles.actionText, { color: colors.text }])}>💊 Sağlık</Text>
        </Pressable>
      </View>

      {animal.sex === 'female' && animal.status !== 'sold' && animal.status !== 'dead' ? (
        <View style={[styles.actions, { marginTop: 10 }]}>
          {animal.status !== 'pregnant' ? (
            <Pressable
              onPress={async () => {
                const r = await gebeIsaretle(animal.id);
                if (!r.ok) {
                  Alert.alert('Gebe', r.message);
                  return;
                }
                refresh();
              }}
              style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.tint }])}>
              <Text style={StyleSheet.flatten([styles.actionText, { color: colors.tint }])}>Gebe işaretle</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push(`/hayvan/${animal.id}/dogum`)}
            style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.tint }])}>
            <Text style={styles.actionText}>Doğum kaydı</Text>
          </Pressable>
        </View>
      ) : null}

      {animal.status !== 'sold' && animal.status !== 'dead' ? (
        <View style={[styles.actions, { marginTop: 10 }]}>
          <Pressable
            onPress={() => router.push(`/satis?id=${animal.id}`)}
            style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: arinma ? colors.danger : colors.tint }])}>
            <Text style={StyleSheet.flatten([styles.actionText, { color: arinma ? colors.danger : colors.tint }])}>
              {arinma ? '🚫 Satış / çıkış (arınmada)' : '💰 Satış / çıkış'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {animal.notes ? (
        <Text style={[styles.notes, { color: colors.textSecondary }]}>Not: {animal.notes}</Text>
      ) : null}

      <View style={{ padding: 16 }}>
        <AnaButon
          title="Hayvanı Sil"
          variant="danger"
          onPress={() => {
            const mesaj = 'Kayıt çöp kutusuna taşınır; İşlem geçmişi ekranından geri alabilirsin.';
            if (Platform.OS === 'web') {
              // RN-web Alert butonları göstermez — tarayıcı onayı
              if (typeof window !== 'undefined' && window.confirm(`Sil? ${mesaj}`)) {
                void hayvanSilGeriAlinabilir(animal.id).then(() => {
                  refresh();
                  router.back();
                });
              }
              return;
            }
            Alert.alert('Sil', mesaj, [
              { text: 'İptal', style: 'cancel' },
              {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                  await hayvanSilGeriAlinabilir(animal.id);
                  refresh();
                  router.back();
                },
              },
            ]);
          }}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  tag: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  name: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  section: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', paddingVertical: 6 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  actionBtn: { flex: 1, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  notes: { padding: 16, fontStyle: 'italic' },
  olay: { flexDirection: 'row', gap: 8 },
  rozetSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  sigorta: { marginTop: 10, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center' },
  skalaSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 4, borderRadius: 12, borderWidth: 1.5 },
  olayCizgi: { width: 2, flex: 1, marginTop: 2 },
});
