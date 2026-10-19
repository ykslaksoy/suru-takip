/**
 * Kayıt şablonları — “Giriş paketi” gibi çok adımlı işleri seçili gruba tek dokunuşla uygula.
 * Kullanıcı kendi şablonunu oluşturur, düzenler, siler.
 */
import { useEkip, yetkiUyar } from '@/bilesenler/ekip/useEkip';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import TopluHayvanSecici from '@/bilesenler/ortak/TopluHayvanSecici';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket, hayvanAltEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { copeAt, islemKaydet } from '@/kaynak/gecmis/gunluk';
import {
  adimAnahtar,
  adimEtiket,
  adimTasi,
  getSablonlar,
  sablonDogrula,
  sablonKaydet,
  sablonOzet,
  sablonSil,
  sablonUygula,
  secilebilirAdimlar,
  type KayitSablonu,
  type SablonAdim,
  type SablonSonuc,
} from '@/kaynak/sablon';

function onayla(mesaj: string, evet: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(mesaj)) evet();
    return;
  }
  Alert.alert('Onay', mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Evet', style: 'destructive', onPress: evet },
  ]);
}

export default function SablonScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sablonlar, setSablonlar] = useState<KayitSablonu[]>([]);
  const [hayvanlar, setHayvanlar] = useState<Animal[]>([]);
  const [uygulanan, setUygulanan] = useState<string | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState<(SablonSonuc & { ad: string; n: number }) | null>(null);
  // düzenleme formu
  const [form, setForm] = useState<{ id?: string; ad: string; adimlar: SablonAdim[] } | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    const [s, a] = await Promise.all([getSablonlar(), getAnimals()]);
    setSablonlar(s);
    setHayvanlar(a.filter((x) => x.status !== 'sold' && x.status !== 'dead'));
    setYukleniyor(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle, refreshKey]),
  );

  const tumAdimlar = useMemo(() => secilebilirAdimlar(), []);

  const uygula = async (s: KayitSablonu) => {
    const hedef = hayvanlar.filter((a) => secili.has(a.id));
    if (!hedef.length) return;
    if (!yetkiUyar('tedavi')) return;
    setCalisiyor(true);
    try {
      const r = await sablonUygula(s, hedef);
      setSonuc({ ...r, ad: s.ad, n: hedef.length });
      setUygulanan(null);
      setSecili(new Set());
      refresh();
    } finally {
      setCalisiyor(false);
    }
  };

  const kaydet = async () => {
    if (!form) return;
    if (!yetkiUyar('duzenleme')) return;
    const h = sablonDogrula(form.ad, form.adimlar, sablonlar.filter((s) => s.id !== form.id).map((s) => s.ad));
    setHata(h);
    if (h) return;
    const s = await sablonKaydet(form);
    await islemKaydet({ tur: 'diger', ozet: `Şablon ${form.id ? 'düzenlendi' : 'oluşturuldu'} · ${s.ad}` });
    setForm(null);
    await yukle();
  };

  const sil = (s: KayitSablonu) =>
    yetkiUyar('silme') &&
    onayla(`“${s.ad}” şablonu silinsin mi? 30 gün geri dönüşüm kutusunda kalır; yapılmış kayıtlar silinmez.`, async () => {
      await copeAt({ id: s.id, tur: 'sablon', etiket: s.ad, veri: s });
      await sablonSil(s.id);
      await islemKaydet({ tur: 'silme', ozet: `Şablon silindi · ${s.ad}` });
      await yukle();
    });

  const adimVarMi = (a: SablonAdim) => !!form?.adimlar.some((x) => adimAnahtar(x) === adimAnahtar(a));

  return (
    <>
      <Stack.Screen options={{ title: 'Kayıt şablonları' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        {yukleniyor ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : form ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <Text style={[styles.baslik, { color: colors.text }]}>{form.id ? 'Şablonu düzenle' : 'Yeni şablon'}</Text>
            <Text style={[styles.etiket, { color: colors.textSecondary }]}>Ad</Text>
            <TextInput
              value={form.ad}
              onChangeText={(t) => setForm({ ...form, ad: t })}
              placeholder="ör. Giriş paketi"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <Text style={[styles.etiket, { color: colors.textSecondary, marginTop: 12 }]}>Adımlar (sırayla uygulanır)</Text>
            {form.adimlar.length === 0 ? <Text style={{ color: colors.textSecondary }}>Aşağıdan adım ekle.</Text> : null}
            {form.adimlar.map((a, i) => (
              <View key={adimAnahtar(a)} style={[styles.adim, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>
                  {i + 1}. {adimEtiket(a)}
                </Text>
                <Pressable onPress={() => setForm({ ...form, adimlar: adimTasi(form.adimlar, i, -1) })} hitSlop={6}>
                  <Text style={{ color: colors.tint, fontSize: 16 }}>▲</Text>
                </Pressable>
                <Pressable onPress={() => setForm({ ...form, adimlar: adimTasi(form.adimlar, i, 1) })} hitSlop={6}>
                  <Text style={{ color: colors.tint, fontSize: 16 }}>▼</Text>
                </Pressable>
                <Pressable onPress={() => setForm({ ...form, adimlar: form.adimlar.filter((_, j) => j !== i) })} hitSlop={6}>
                  <Text style={{ color: colors.danger, fontWeight: '900' }}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Text style={[styles.etiket, { color: colors.textSecondary, marginTop: 12 }]}>Adım ekle</Text>
            <View style={styles.chipSatir}>
              {tumAdimlar
                .filter((a) => !adimVarMi(a))
                .map((a) => (
                  <Pressable
                    key={adimAnahtar(a)}
                    onPress={() => setForm({ ...form, adimlar: [...form.adimlar, a] })}
                    style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>+ {adimEtiket(a)}</Text>
                  </Pressable>
                ))}
            </View>
            {hata ? <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 8 }}>{hata}</Text> : null}
            <Pressable onPress={() => void kaydet()} style={[styles.cta, { backgroundColor: colors.tint }]}>
              <Text style={styles.ctaText}>Şablonu kaydet</Text>
            </Pressable>
            <Pressable onPress={() => setForm(null)} style={{ alignItems: 'center', padding: 10 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Vazgeç</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {sonuc ? (
              <View style={[styles.kart, { backgroundColor: colors.tint + '12', borderColor: colors.tint }]}>
                <Text style={{ color: colors.tint, fontWeight: '900' }}>
                  ✓ {sonuc.ad} · {sonuc.n} kuzuya uygulandı
                </Text>
                {sonuc.satirlar.map((s) => (
                  <Text key={s} style={{ color: colors.text, marginTop: 4, fontSize: 13 }}>
                    {s}
                  </Text>
                ))}
                {sonuc.tartimVar ? (
                  <Pressable onPress={() => router.push('/seri-giris')} style={[styles.cta, { backgroundColor: colors.tint }]}>
                    <Text style={styles.ctaText}>⚖️ Tartıma geç</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {sablonlar.map((s) => (
              <View key={s.id} style={[styles.kart, { backgroundColor: colors.card, borderColor: uygulanan === s.id ? colors.tint : colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>📋 {s.ad}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}>{sablonOzet(s)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable
                    onPress={() => {
                      setSonuc(null);
                      setSecili(new Set());
                      setUygulanan((x) => (x === s.id ? null : s.id));
                    }}
                    style={[styles.btn, { backgroundColor: colors.tint, flex: 2 }]}>
                    <Text style={{ color: '#fff', fontWeight: '800' }}>{uygulanan === s.id ? 'Kapat' : 'Uygula'}</Text>
                  </Pressable>
                  <Pressable onPress={() => { setHata(null); setForm({ id: s.id, ad: s.ad, adimlar: [...s.adimlar] }); }} style={[styles.btn, { borderColor: colors.tint, borderWidth: 1.5, flex: 1 }]}>
                    <Text style={{ color: colors.tint, fontWeight: '800' }}>Düzenle</Text>
                  </Pressable>
                  <Pressable onPress={() => sil(s)} style={[styles.btn, { borderColor: colors.danger, borderWidth: 1.5, flex: 1 }]}>
                    <Text style={{ color: colors.danger, fontWeight: '800' }}>Sil</Text>
                  </Pressable>
                </View>
                {uygulanan === s.id ? (
                  <View style={{ marginTop: 12 }}>
                    <TopluHayvanSecici
                      hayvanlar={hayvanlar.map((a) => ({
                        id: a.id,
                        etiket: hayvanAnaEtiket(a),
                        altEtiket: hayvanAltEtiket(a) ?? undefined,
                        paddock: a.paddock,
                        kupe: a.earTag || a.sirtNo || a.id,
                      }))}
                      secili={secili}
                      onChange={setSecili}
                    />
                    <Pressable
                      disabled={calisiyor || secili.size === 0}
                      onPress={() => void uygula(s)}
                      style={[styles.cta, { backgroundColor: colors.tint, opacity: calisiyor || secili.size === 0 ? 0.5 : 1 }]}>
                      <Text style={styles.ctaText}>{calisiyor ? 'Uygulanıyor…' : `${s.ad} · ${secili.size} kuzuya uygula`}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            {sablonlar.length === 0 ? <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Şablon yok. Yeni bir tane oluştur.</Text> : null}
            <Pressable
              onPress={() => {
                setHata(null);
                setForm({ ad: '', adimlar: [] });
              }}
              style={[styles.cta, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.tint }]}>
              <Text style={[styles.ctaText, { color: colors.tint }]}>+ Yeni şablon</Text>
            </Pressable>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
              Aşı ve ilaç adımları her kuzuya ayrı sağlık kaydı yazar ve stoktan düşer. Tartım adımı kilo ister; şablon uygulanınca
              “Tartıma geç” ile seri tartım açılır.
            </Text>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  etiket: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  adim: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  cta: { borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btn: { borderRadius: 10, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
});
