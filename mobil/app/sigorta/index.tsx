/**
 * Sigorta (TARSİM) — poliçe kaydı, kapsanan kuzular, bitiş uyarıları ve sigortasız kuzular.
 * Uyarılar Görevler / Bugün listesine de düşer (30 gün, 7 gün kala, süresi doldu).
 */
import { useEkip, yetkiUyar } from '@/bilesenler/ekip/useEkip';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import TopluHayvanSecici from '@/bilesenler/ortak/TopluHayvanSecici';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket, hayvanAltEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { copeAt, islemKaydet } from '@/kaynak/gecmis/gunluk';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { tl } from '@/kaynak/maliyet/hesap';
import {
  getPoliceler,
  kalanGun,
  policeDogrula,
  policeDurumu,
  policeEkle,
  policeSil,
  POLICE_DURUM_ETIKET,
  ertesiGun,
  sigortasizHayvanlar,
  tarihCoz,
  tarihGoster,
  yerelTarih,
  yillikBitis,
  type PoliceDurum,
  type SigortaPolice,
} from '@/kaynak/sigorta';

export default function SigortaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [policeler, setPoliceler] = useState<SigortaPolice[]>([]);
  const [hayvanlar, setHayvanlar] = useState<Animal[]>([]);
  const [formAcik, setFormAcik] = useState(false);
  const [acikPolice, setAcikPolice] = useState<string | null>(null);
  const [sigortasizAcik, setSigortasizAcik] = useState(false);
  const bugun = yerelTarih();

  const [policeNo, setPoliceNo] = useState('');
  const [sirket, setSirket] = useState('');
  const [baslangic, setBaslangic] = useState(tarihGoster(bugun));
  const [bitis, setBitis] = useState(tarihGoster(yillikBitis(bugun)));
  const [prim, setPrim] = useState('');
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(async () => {
    const [p, a] = await Promise.all([getPoliceler(), getAnimals()]);
    setPoliceler(p);
    setHayvanlar(a);
    setYukleniyor(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle, refreshKey]),
  );

  const aktifHayvanlar = useMemo(() => hayvanlar.filter((a) => a.status !== 'sold' && a.status !== 'dead'), [hayvanlar]);
  const sigortasiz = useMemo(() => sigortasizHayvanlar(aktifHayvanlar, policeler, bugun), [aktifHayvanlar, policeler, bugun]);
  const hayvanById = useMemo(() => new Map(hayvanlar.map((a) => [a.id, a])), [hayvanlar]);

  const durumRenk = (d: PoliceDurum) =>
    d === 'doldu' || d === 'son-hafta' ? colors.danger : d === 'yaklasiyor' ? colors.warning : d === 'baslamadi' ? colors.textSecondary : colors.tint;

  const formSifirla = () => {
    setPoliceNo('');
    setSirket('');
    setBaslangic(tarihGoster(bugun));
    setBitis(tarihGoster(yillikBitis(bugun)));
    setPrim('');
    setSecili(new Set());
    setHata(null);
  };

  const baslangicDegisti = (t: string) => {
    setBaslangic(t);
    const b = tarihCoz(t);
    if (b) setBitis(tarihGoster(yillikBitis(b)));
  };

  const kaydet = async () => {
    const girdi = { policeNo, sirket, baslangic, bitis, prim, hayvanIds: [...secili] };
    const h = policeDogrula(girdi);
    setHata(h);
    if (h) return;
    setKaydediliyor(true);
    try {
      const p = await policeEkle(girdi);
      await islemKaydet({
        tur: 'diger',
        ozet: `Sigorta poliçesi ${p.policeNo} · ${p.hayvanIds.length} kuzu · bitiş ${tarihGoster(p.bitis)}`,
        adet: p.hayvanIds.length,
      });
      formSifirla();
      setFormAcik(false);
      refresh();
      await yukle();
    } finally {
      setKaydediliyor(false);
    }
  };

  const sil = (p: SigortaPolice) => {
    if (!yetkiUyar('silme')) return;
    const yap = async () => {
      await copeAt({ id: p.id, tur: 'police', etiket: `Poliçe ${p.policeNo}`, veri: p });
      await policeSil(p.id);
      await islemKaydet({ tur: 'silme', ozet: `Sigorta poliçesi silindi · ${p.policeNo} (geri dönüşüm kutusunda)` });
      refresh();
      await yukle();
    };
    const mesaj = `Poliçe ${p.policeNo} silinsin mi? 30 gün geri dönüşüm kutusunda kalır.`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(mesaj)) void yap();
      return;
    }
    Alert.alert('Poliçeyi sil', mesaj, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void yap() },
    ]);
  };

  const girdi = (etiket: string, deger: string, set: (t: string) => void, ph: string, klavye?: 'numeric') => (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.etiket, { color: colors.textSecondary }]}>{etiket}</Text>
      <TextInput
        value={deger}
        onChangeText={set}
        placeholder={ph}
        placeholderTextColor={colors.textSecondary}
        keyboardType={klavye === 'numeric' ? 'numeric' : 'default'}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Sigorta (TARSİM)' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        {yukleniyor ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={[styles.ozet, { backgroundColor: colors.tint }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ozetSayi}>{aktifHayvanlar.length - sigortasiz.length}</Text>
                <Text style={styles.ozetEtiket}>sigortalı kuzu</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ozetSayi}>{sigortasiz.length}</Text>
                <Text style={styles.ozetEtiket}>sigortasız</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ozetSayi}>{policeler.filter((p) => policeDurumu(p, bugun) !== 'doldu').length}</Text>
                <Text style={styles.ozetEtiket}>geçerli poliçe</Text>
              </View>
            </View>

            {sigortasiz.length > 0 && aktifHayvanlar.length > 0 ? (
              <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.warning }]}>
                <Pressable onPress={() => setSigortasizAcik((v) => !v)} style={styles.kartBaslik}>
                  <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>
                    ⚠️ {sigortasiz.length} kuzu hiçbir geçerli poliçede yok
                  </Text>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>{sigortasizAcik ? 'Gizle' : 'Göster'}</Text>
                </Pressable>
                {sigortasizAcik ? (
                  <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                    {sigortasiz.slice(0, 60).map((a) => hayvanAnaEtiket(a)).join(', ')}
                    {sigortasiz.length > 60 ? ` … +${sigortasiz.length - 60}` : ''}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    formSifirla();
                    setSecili(new Set(sigortasiz.map((a) => a.id)));
                    setFormAcik(true);
                  }}
                  style={[styles.ikincil, { borderColor: colors.tint }]}>
                  <Text style={{ color: colors.tint, fontWeight: '800' }}>Sigortasızlar için poliçe gir</Text>
                </Pressable>
              </View>
            ) : null}

            {!formAcik ? (
              <Pressable
                onPress={() => {
                  formSifirla();
                  setFormAcik(true);
                }}
                style={[styles.cta, { backgroundColor: colors.tint }]}>
                <Text style={styles.ctaText}>+ Yeni poliçe</Text>
              </Pressable>
            ) : (
              <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
                <Text style={[styles.baslik, { color: colors.text }]}>Yeni poliçe</Text>
                {girdi('Poliçe no *', policeNo, setPoliceNo, 'ör. 12345678')}
                {girdi('Sigorta şirketi (isteğe bağlı)', sirket, setSirket, 'ör. TARSİM ortağı şirket')}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>{girdi('Başlangıç *', baslangic, baslangicDegisti, 'GG.AA.YYYY')}</View>
                  <View style={{ flex: 1 }}>{girdi('Bitiş *', bitis, setBitis, 'GG.AA.YYYY')}</View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: 10 }}>
                  {[6, 12].map((ay) => (
                    <Pressable
                      key={ay}
                      onPress={() => {
                        const b = tarihCoz(baslangic);
                        if (b) setBitis(tarihGoster(yillikBitis(b, ay)));
                      }}
                      style={[styles.chip, { borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{ay === 12 ? '1 yıl' : '6 ay'}</Text>
                    </Pressable>
                  ))}
                </View>
                {girdi('Prim ₺ (isteğe bağlı, Maliyet ekranına girer)', prim, setPrim, 'ör. 4.500', 'numeric')}
                <Text style={[styles.etiket, { color: colors.textSecondary, marginBottom: 6 }]}>Kapsanan kuzular * (Tümü = tüm sürü)</Text>
                <TopluHayvanSecici
                  hayvanlar={aktifHayvanlar.map((a) => ({
                    id: a.id,
                    etiket: hayvanAnaEtiket(a),
                    altEtiket: hayvanAltEtiket(a) ?? undefined,
                    paddock: a.paddock,
                    kupe: a.earTag || a.sirtNo || a.id,
                  }))}
                  secili={secili}
                  onChange={setSecili}
                />
                {hata ? <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 4 }}>{hata}</Text> : null}
                <Pressable
                  disabled={kaydediliyor}
                  onPress={kaydet}
                  style={[styles.cta, { backgroundColor: colors.tint, opacity: kaydediliyor ? 0.5 : 1 }]}>
                  <Text style={styles.ctaText}>{kaydediliyor ? 'Kaydediliyor…' : `Poliçeyi kaydet · ${secili.size} kuzu`}</Text>
                </Pressable>
                <Pressable onPress={() => setFormAcik(false)} style={{ alignItems: 'center', padding: 10 }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Vazgeç</Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.bolum, { color: colors.textSecondary }]}>POLİÇELER</Text>
            {policeler.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>
                Henüz poliçe yok. TARSİM poliçeni gir; bitişten 30 ve 7 gün önce Görevler’de uyarı çıkar.
              </Text>
            ) : (
              policeler.map((p) => {
                const d = policeDurumu(p, bugun);
                const k = kalanGun(p, bugun);
                const renk = durumRenk(d);
                const kalanMetin =
                  d === 'doldu' ? `${-k} gün önce bitti` : d === 'baslamadi' ? `${tarihGoster(p.baslangic)} başlar` : k === 0 ? 'Bugün bitiyor' : `${k} gün kaldı`;
                return (
                  <View key={p.id} style={[styles.kart, { backgroundColor: colors.card, borderColor: d === 'aktif' ? colors.border : renk }]}>
                    <Pressable onPress={() => setAcikPolice((x) => (x === p.id ? null : p.id))}>
                      <View style={styles.kartBaslik}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, flex: 1 }}>🛡️ {p.policeNo}</Text>
                        <View style={[styles.durum, { borderColor: renk, backgroundColor: renk + '18' }]}>
                          <Text style={{ color: renk, fontWeight: '800', fontSize: 12 }}>{POLICE_DURUM_ETIKET[d]}</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                        {[p.sirket, `${tarihGoster(p.baslangic)} – ${tarihGoster(p.bitis)}`].filter(Boolean).join(' · ')}
                      </Text>
                      <Text style={{ color: colors.text, marginTop: 2, fontWeight: '600' }}>
                        {p.hayvanIds.length} kuzu · {kalanMetin}
                        {p.prim ? ` · prim ${tl(Math.round(p.prim))}` : ''}
                      </Text>
                    </Pressable>
                    {acikPolice === p.id ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
                          {p.hayvanIds
                            .map((id) => {
                              const a = hayvanById.get(id);
                              return a ? hayvanAnaEtiket(a) + (a.status === 'sold' ? ' (satıldı)' : a.status === 'dead' ? ' (öldü)' : '') : 'silinmiş kayıt';
                            })
                            .join(', ')}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <Pressable
                            onPress={() => {
                              formSifirla();
                              setSirket(p.sirket ?? '');
                              // Yenileme: yeni dönem eski bitişin ertesi günü başlar
                              const s = ertesiGun(p.bitis);
                              setBaslangic(tarihGoster(s));
                              setBitis(tarihGoster(yillikBitis(s)));
                              setSecili(new Set(p.hayvanIds.filter((id) => aktifHayvanlar.some((a) => a.id === id))));
                              setFormAcik(true);
                            }}
                            style={[styles.ikincil, { borderColor: colors.tint, flex: 1, marginTop: 0 }]}>
                            <Text style={{ color: colors.tint, fontWeight: '800' }}>Yenile</Text>
                          </Pressable>
                          <Pressable onPress={() => sil(p)} style={[styles.ikincil, { borderColor: colors.danger, flex: 1, marginTop: 0 }]}>
                            <Text style={{ color: colors.danger, fontWeight: '800' }}>Sil</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
            <Pressable onPress={() => router.push('/gorevler')} style={{ alignItems: 'center', padding: 12 }}>
              <Text style={{ color: colors.tint, fontWeight: '700' }}>Uyarılar Görevler’de →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  ozet: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12 },
  ozetSayi: { color: '#fff', fontSize: 24, fontWeight: '900' },
  ozetEtiket: { color: '#e8f5ee', fontSize: 12, fontWeight: '700' },
  kart: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  kartBaslik: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  etiket: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  cta: { borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ikincil: { borderWidth: 1.5, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 },
  bolum: { fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  durum: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
});
