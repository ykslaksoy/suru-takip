/**
 * Sayım listesi — küpe/sırt no yaz + Enter (okuyucu gibi hızlı) veya sesle say (önce geri okunur, "tamam" ile eklenir).
 * Bitirince sürü listesiyle karşılaştırma: Eksik / Fazla / Başka padokta; tarihli sayım geçmişi.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import { padokAdlari } from '@/kaynak/toplu/secim';
import {
  dinlemeyiBaslat,
  konusmaDurumu,
  metniSeslendir,
  onayMi,
  redMi,
  seslendirmeKilidiAc,
  seslendirmeyiDurdur,
  type DinlemeKontrol,
} from '@/kaynak/ses';
import {
  aktifSayimKaydet,
  aktifSayimSil,
  gecmisKaydiOlustur,
  getAktifSayim,
  getSayimGecmisi,
  hayvanSayimEtiketi,
  kapsamEtiketi,
  kapsamHayvanlari,
  sayimaEkle,
  sayimBaslat,
  sayimGecmiseEkle,
  sayimRaporu,
  sesGeriOkuma,
  sestenKupeler,
  type EkleDurum,
  type SayimGecmisKaydi,
  type SayimKapsam,
  type SayimOturumu,
} from '@/kaynak/sayim';

type Bildirim = { durum: EkleDurum; mesaj: string };

function tarihSaat(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SayimScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey } = useDatabase();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hayvanlar, setHayvanlar] = useState<Animal[]>([]);
  const [oturum, setOturum] = useState<SayimOturumu | null>(null);
  const [gecmis, setGecmis] = useState<SayimGecmisKaydi[]>([]);
  const [kapsam, setKapsam] = useState<SayimKapsam>('tum');
  const [giris, setGiris] = useState('');
  const [bildirim, setBildirim] = useState<Bildirim | null>(null);
  const [bekleyenSes, setBekleyenSes] = useState<string[] | null>(null);
  const [dinliyor, setDinliyor] = useState(false);
  const [sonRapor, setSonRapor] = useState<SayimGecmisKaydi | null>(null);
  const [acikGecmis, setAcikGecmis] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const dinlemeRef = useRef<DinlemeKontrol | null>(null);
  const oturumRef = useRef<SayimOturumu | null>(null);
  oturumRef.current = oturum;
  const ses = useMemo(() => konusmaDurumu(), []);

  const yukle = useCallback(async () => {
    const [a, o, g] = await Promise.all([getAnimals(), getAktifSayim(), getSayimGecmisi()]);
    setHayvanlar(a);
    setOturum(o);
    setGecmis(g);
    setYukleniyor(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yukle();
      return () => {
        dinlemeRef.current?.durdur();
        seslendirmeyiDurdur();
      };
    }, [yukle, refreshKey]),
  );

  const padoklar = useMemo(() => padokAdlari(hayvanlar), [hayvanlar]);
  const rapor = useMemo(() => (oturum ? sayimRaporu(oturum, hayvanlar) : null), [oturum, hayvanlar]);

  const ekleListe = async (kupeler: string[], yontem: 'yazi' | 'ses') => {
    let o = oturumRef.current;
    if (!o) return;
    const mesajlar: string[] = [];
    let son: EkleDurum = 'eklendi';
    for (const k of kupeler) {
      const r = sayimaEkle(o, hayvanlar, k, yontem);
      o = r.oturum;
      mesajlar.push(r.mesaj);
      if (r.durum !== 'eklendi') son = r.durum;
    }
    setOturum(o);
    await aktifSayimKaydet(o);
    setBildirim({ durum: son, mesaj: mesajlar.join('\n') });
  };

  const yaziEkle = async () => {
    const t = giris.trim();
    setGiris('');
    inputRef.current?.focus();
    if (!t) return;
    await ekleListe([t], 'yazi');
  };

  const onayDinle = (kupeler: string[]) => {
    const ctrl = dinlemeyiBaslat({
      onBasladi: () => setDinliyor(true),
      onSonuc: (m) => {
        setDinliyor(false);
        if (onayMi(m)) {
          setBekleyenSes(null);
          void ekleListe(kupeler, 'ses');
        } else if (redMi(m)) {
          setBekleyenSes(null);
          setBildirim({ durum: 'gecersiz', mesaj: 'Vazgeçildi — eklenmedi.' });
        }
      },
      onHata: () => setDinliyor(false),
      onBitti: () => setDinliyor(false),
    });
    dinlemeRef.current = ctrl;
  };

  const sesleSay = () => {
    if (dinliyor) {
      dinlemeRef.current?.durdur();
      setDinliyor(false);
      return;
    }
    seslendirmeKilidiAc();
    setBekleyenSes(null);
    const ctrl = dinlemeyiBaslat({
      onBasladi: () => setDinliyor(true),
      onSonuc: (metin) => {
        setDinliyor(false);
        const kupeler = sestenKupeler(metin);
        const okuma = sesGeriOkuma(kupeler);
        if (!kupeler.length) {
          setBildirim({ durum: 'gecersiz', mesaj: `Anlaşılmadı: “${metin}”` });
          metniSeslendir(okuma);
          return;
        }
        // Önce geri oku, onaydan sonra ekle
        setBekleyenSes(kupeler);
        metniSeslendir(okuma, { onBitti: () => setTimeout(() => onayDinle(kupeler), 250) });
      },
      onHata: (mesaj) => {
        setDinliyor(false);
        setBildirim({ durum: 'gecersiz', mesaj });
      },
      onBitti: () => setDinliyor(false),
    });
    dinlemeRef.current = ctrl;
    if (!ctrl) setDinliyor(false);
  };

  const baslat = async () => {
    const o = await sayimBaslat(kapsam);
    setOturum(o);
    setSonRapor(null);
    setBildirim(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const bitir = async () => {
    if (!oturum || !rapor) return;
    const k = gecmisKaydiOlustur(oturum, rapor);
    await sayimGecmiseEkle(k);
    await islemKaydet({
      tur: 'diger',
      ozet: `Sayım (${kapsamEtiketi(k.kapsam)}): ${k.eslesen}/${k.beklenen} · eksik ${k.eksik.length} · fazla ${k.fazla.length}`,
      adet: k.sayilan,
    });
    dinlemeRef.current?.durdur();
    setOturum(null);
    setBekleyenSes(null);
    setSonRapor(k);
    setGecmis(await getSayimGecmisi());
  };

  const vazgec = async () => {
    const yap = async () => {
      await aktifSayimSil();
      setOturum(null);
      setBekleyenSes(null);
      setBildirim(null);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Sayım kaydedilmeden silinsin mi?')) await yap();
      return;
    }
    await yap();
  };

  const bildirimRenk = (d: EkleDurum) =>
    d === 'eklendi' ? colors.tint : d === 'tekrar' ? colors.warning : colors.danger;

  const raporKart = (k: SayimGecmisKaydi, baslik?: string) => (
    <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      {baslik ? <Text style={[styles.baslik, { color: colors.text }]}>{baslik}</Text> : null}
      <View style={styles.sayiSatir}>
        <Kutu deger={k.beklenen} etiket="beklenen" renk={colors.text} alt={colors.textSecondary} />
        <Kutu deger={k.sayilan} etiket="sayılan" renk={colors.tint} alt={colors.textSecondary} />
        <Kutu deger={k.eksik.length} etiket="eksik" renk={k.eksik.length ? colors.danger : colors.tint} alt={colors.textSecondary} />
        <Kutu deger={k.fazla.length} etiket="fazla" renk={k.fazla.length ? colors.warning : colors.tint} alt={colors.textSecondary} />
      </View>
      {k.eksik.length === 0 && k.fazla.length === 0 && k.baskaPadok.length === 0 ? (
        <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 8 }}>✓ Sayım tuttu — eksik ve fazla yok.</Text>
      ) : null}
      {k.eksik.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.altBaslik, { color: colors.danger }]}>EKSİK ({k.eksik.length}) — sürüde var, sayılmadı</Text>
          <View style={styles.chipler}>
            {k.eksik.map((e) => (
              <Pressable key={e.id} onPress={() => router.push(`/hayvan/${e.id}`)} style={[styles.chip, { borderColor: colors.danger }]}>
                <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>{e.etiket}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {k.fazla.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.altBaslik, { color: colors.warning }]}>FAZLA ({k.fazla.length}) — sayıldı, sürü listesinde yok</Text>
          <View style={styles.chipler}>
            {k.fazla.map((f) => (
              <View key={f} style={[styles.chip, { borderColor: colors.warning }]}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {k.baskaPadok.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.altBaslik, { color: colors.textSecondary }]}>BAŞKA PADOKTA KAYITLI ({k.baskaPadok.length})</Text>
          <Text style={{ color: colors.textSecondary }}>{k.baskaPadok.map((b) => `${b.etiket} (${b.paddock})`).join(', ')}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Sayım listesi' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {yukleniyor ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : oturum && rapor ? (
          <>
            <View style={[styles.sayac, { backgroundColor: colors.tint }]}>
              <Text style={styles.sayacEtiket}>{kapsamEtiketi(oturum.kapsam)} · sayım sürüyor</Text>
              <Text style={styles.sayacSayi}>
                {rapor.eslesen}
                <Text style={{ fontSize: 26, color: '#d8efe2' }}> / {rapor.beklenen}</Text>
              </Text>
              <Text style={styles.sayacEtiket}>
                {rapor.eksik.length} kaldı{rapor.fazla.length ? ` · ${rapor.fazla.length} fazla` : ''}
                {rapor.baskaPadok.length ? ` · ${rapor.baskaPadok.length} başka padoktan` : ''}
              </Text>
            </View>

            <View style={styles.girisSatir}>
              <TextInput
                ref={inputRef}
                value={giris}
                onChangeText={setGiris}
                onSubmitEditing={() => void yaziEkle()}
                blurOnSubmit={false}
                returnKeyType="next"
                autoFocus
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Küpe / sırt no yaz, Enter"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.tint, backgroundColor: colors.card }]}
              />
              <Pressable onPress={() => void yaziEkle()} style={[styles.ekleBtn, { backgroundColor: colors.tint }]}>
                <Text style={styles.ctaText}>Ekle</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={sesleSay}
              disabled={!ses.sttHazir}
              style={[styles.sesBtn, { borderColor: colors.tint, backgroundColor: dinliyor ? colors.tint : colors.card, opacity: ses.sttHazir ? 1 : 0.5 }]}>
              <Text style={{ color: dinliyor ? '#fff' : colors.tint, fontWeight: '800', fontSize: 16 }}>
                {dinliyor ? '🎤 Dinleniyor… (durdur)' : ses.sttHazir ? '🎤 Sesle say' : '🎤 Bu cihazda mikrofon yok — yazarak say'}
              </Text>
            </Pressable>

            {bekleyenSes ? (
              <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.warning }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>Duyduğum: {bekleyenSes.join(', ')}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 2 }}>“Tamam” de ya da dokun.</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Pressable
                    onPress={() => {
                      dinlemeRef.current?.durdur();
                      const k = bekleyenSes;
                      setBekleyenSes(null);
                      void ekleListe(k, 'ses');
                    }}
                    style={[styles.ikincil, { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Tamam, ekle</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      dinlemeRef.current?.durdur();
                      setBekleyenSes(null);
                    }}
                    style={[styles.ikincil, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '800' }}>Yanlış</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {bildirim ? (
              <View style={[styles.bildirim, { borderColor: bildirimRenk(bildirim.durum), backgroundColor: bildirimRenk(bildirim.durum) + '14' }]}>
                <Text style={{ color: bildirimRenk(bildirim.durum), fontWeight: '800' }}>{bildirim.mesaj}</Text>
              </View>
            ) : null}

            <Text style={[styles.altBaslik, { color: colors.textSecondary, marginTop: 6 }]}>SON SAYILANLAR</Text>
            {oturum.sayilan.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Henüz sayılan yok.</Text>
            ) : (
              <View style={styles.chipler}>
                {[...oturum.sayilan]
                  .reverse()
                  .slice(0, 24)
                  .map((s) => {
                    const a = s.animalId ? hayvanlar.find((x) => x.id === s.animalId) : null;
                    return (
                      <View key={s.zaman + s.ham} style={[styles.chip, { borderColor: a ? colors.border : colors.warning, backgroundColor: colors.card }]}>
                        <Text style={{ color: a ? colors.text : colors.warning, fontWeight: '700', fontSize: 12 }}>
                          {a ? hayvanSayimEtiketi(a) : `${s.ham} (fazla)`}
                          {s.yontem === 'ses' ? ' 🎤' : ''}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}

            <Pressable onPress={() => void bitir()} style={[styles.cta, { backgroundColor: colors.tint, marginTop: 16 }]}>
              <Text style={styles.ctaText}>Sayımı bitir ve raporla</Text>
            </Pressable>
            <Pressable onPress={() => void vazgec()} style={{ alignItems: 'center', padding: 10 }}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>Sayımı sil (kaydetme)</Text>
            </Pressable>
          </>
        ) : (
          <>
            {sonRapor ? raporKart(sonRapor, `Sayım raporu · ${kapsamEtiketi(sonRapor.kapsam)}`) : null}

            <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.baslik, { color: colors.text }]}>Yeni sayım</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
                Ne sayılacak? Küpe veya sırt no yazıp Enter’a bas ya da sesle söyle. Aynı küpe iki kez sayılmaz.
              </Text>
              <View style={styles.chipler}>
                {(['tum', ...padoklar] as SayimKapsam[]).map((k) => {
                  const on = kapsam === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setKapsam(k)}
                      style={[styles.chip, { borderColor: on ? colors.tint : colors.border, backgroundColor: on ? colors.tint : colors.card, paddingVertical: 8 }]}>
                      <Text style={{ color: on ? '#fff' : colors.text, fontWeight: '700' }}>
                        {kapsamEtiketi(k)} ({kapsamHayvanlari(hayvanlar, k).length})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => void baslat()} style={[styles.cta, { backgroundColor: colors.tint, marginTop: 12 }]}>
                <Text style={styles.ctaText}>Sayımı başlat</Text>
              </Pressable>
            </View>

            <Text style={[styles.altBaslik, { color: colors.textSecondary, marginTop: 8 }]}>SAYIM GEÇMİŞİ</Text>
            {gecmis.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Henüz sayım yapılmadı.</Text>
            ) : (
              gecmis.map((g) => (
                <View key={g.id}>
                  <Pressable
                    onPress={() => setAcikGecmis((x) => (x === g.id ? null : g.id))}
                    style={[styles.gecmisSatir, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800' }}>
                        {tarihSaat(g.bitis)} · {kapsamEtiketi(g.kapsam)}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                        {g.eslesen}/{g.beklenen} sayıldı · eksik {g.eksik.length} · fazla {g.fazla.length}
                      </Text>
                    </View>
                    <Text style={{ color: g.eksik.length || g.fazla.length ? colors.danger : colors.tint, fontWeight: '900', fontSize: 18 }}>
                      {g.eksik.length || g.fazla.length ? '!' : '✓'}
                    </Text>
                  </Pressable>
                  {acikGecmis === g.id ? raporKart(g) : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function Kutu({ deger, etiket, renk, alt }: { deger: number; etiket: string; renk: string; alt: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: renk, fontSize: 24, fontWeight: '900' }}>{deger}</Text>
      <Text style={{ color: alt, fontSize: 12, fontWeight: '700' }}>{etiket}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  sayac: { borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 12 },
  sayacSayi: { color: '#fff', fontSize: 52, fontWeight: '900' },
  sayacEtiket: { color: '#e8f5ee', fontWeight: '700' },
  girisSatir: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: { flex: 1, borderWidth: 2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 20, fontWeight: '700' },
  ekleBtn: { borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  sesBtn: { borderWidth: 2, borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bildirim: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 10 },
  kart: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  altBaslik: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  chipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  cta: { borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ikincil: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 10, alignItems: 'center' },
  sayiSatir: { flexDirection: 'row', marginTop: 4 },
  gecmisSatir: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
});
