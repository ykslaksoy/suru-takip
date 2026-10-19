/** Toplu koç katımı / süngerleme — bir koç, çok koyun; akrabalık uyarısı satırda */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { bugunYerel, getCiftlesmeler, topluKatim } from '@/kaynak/ciftlesme/depo';
import {
  aktifMi,
  beklenenDogum,
  DURUM_ETIKET,
  durum,
  sungerdenKatim,
  trTarih,
  VARSAYILAN_GEBELIK_GUN,
  YONTEM_ETIKET,
  type CiftlesmeKaydi,
  type CiftlesmeYontem,
} from '@/kaynak/ciftlesme/hesap';
import { ciftlesmeKontrol, soyHaritasi, type AkrabaSeviye } from '@/kaynak/soy/hesap';
import { yetkiUyar } from '@/bilesenler/ekip/useEkip';
import { HayvanSecici } from '@/bilesenler/soy/HayvanSecici';
import { bildir } from '@/bilesenler/ciftlesme/ortak';

const yasAy = (iso: string) => {
  const t = Date.parse(`${iso}T12:00:00`);
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / (30.44 * 86400000)) : null;
};

export default function KatimEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [hayvanlar, setHayvanlar] = useState<Animal[] | null>(null);
  const [kayitlar, setKayitlar] = useState<CiftlesmeKaydi[]>([]);
  const [yontem, setYontem] = useState<CiftlesmeYontem>('koc');
  const [tarih, setTarih] = useState(bugunYerel());
  const [sungerGun, setSungerGun] = useState(14);
  const [gebelik, setGebelik] = useState(String(VARSAYILAN_GEBELIK_GUN));
  const [koc, setKoc] = useState<Animal | null>(null);
  const [kocSec, setKocSec] = useState(false);
  const [padok, setPadok] = useState<string | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const bugun = bugunYerel();

  useFocusEffect(
    useCallback(() => {
      void Promise.all([getAnimals(), getCiftlesmeler()]).then(([a, k]) => {
        setHayvanlar(a);
        setKayitlar(k);
      });
    }, []),
  );

  const harita = useMemo(() => soyHaritasi(hayvanlar ?? []), [hayvanlar]);
  const aktifKayit = useMemo(() => new Map(kayitlar.filter(aktifMi).map((k) => [k.koyunId, k])), [kayitlar]);
  const koyunlar = useMemo(
    () =>
      (hayvanlar ?? [])
        .filter((a) => a.sex === 'female' && a.status !== 'sold' && a.status !== 'dead')
        .sort((a, b) => (a.birthDate || '9').localeCompare(b.birthDate || '9')),
    [hayvanlar],
  );
  const padoklar = useMemo(() => [...new Set(koyunlar.map((a) => a.paddock || '—'))].sort((a, b) => a.localeCompare(b, 'tr')), [koyunlar]);
  const gorunen = koyunlar.filter((a) => !padok || (a.paddock || '—') === padok);
  const secilebilir = gorunen.filter((a) => !aktifKayit.has(a.id));
  const uyari = (a: Animal): { seviye: AkrabaSeviye; mesaj: string } | null => {
    if (!koc) return null;
    const k = ciftlesmeKontrol(harita, koc.id, a.id);
    return k.seviye === 'yok' || k.seviye === 'dusuk' ? null : k;
  };
  const SEV: Record<AkrabaSeviye, string> = { yok: colors.success, dusuk: colors.textSecondary, orta: colors.warning, yuksek: colors.danger };

  const katimGunu = yontem === 'sunger' ? sungerdenKatim(tarih, sungerGun) : tarih;
  const gg = parseInt(gebelik, 10) || VARSAYILAN_GEBELIK_GUN;
  const yakinSecili = [...secili].filter((id) => {
    const a = koyunlar.find((x) => x.id === id);
    return a && uyari(a)?.seviye === 'yuksek';
  }).length;

  const degistir = (id: string) =>
    setSecili((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const kaydet = async () => {
    setHata(null);
    if (!yetkiUyar('duzenleme')) return;
    setKaydediliyor(true);
    try {
      const s = await topluKatim({ koyunIds: [...secili], kocId: koc?.id ?? null, yontem, tarih, sungerGun, gebelikGun: gg });
      if (!s.ok) {
        setHata(s.message);
        return;
      }
      bildir(`${s.eklenen} koyun kaydedildi${s.atlanan ? ` · ${s.atlanan} atlandı (zaten kayıtlı)` : ''}. Hatırlatmalar Görevler ve Takvim'de.`);
      router.replace('/ciftlesme' as never);
    } finally {
      setKaydediliyor(false);
    }
  };

  if (!hayvanlar) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Koç katımı / süngerleme' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chipSatir}>
            {(Object.keys(YONTEM_ETIKET) as CiftlesmeYontem[]).map((y) => (
              <Pressable key={y} onPress={() => setYontem(y)} style={[styles.chip, { borderColor: yontem === y ? colors.tint : colors.border, backgroundColor: yontem === y ? colors.tint : colors.background }]}>
                <Text style={{ color: yontem === y ? '#fff' : colors.text, fontWeight: '700' }}>{YONTEM_ETIKET[y]}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1.3 }}>
              <Text style={[styles.etiket, { color: colors.textSecondary }]}>{yontem === 'sunger' ? 'Sünger takma' : yontem === 'suni' ? 'Tohumlama' : 'Katım'} tarihi</Text>
              <TextInput value={tarih} onChangeText={setTarih} placeholder="YYYY-AA-GG" placeholderTextColor={colors.textSecondary} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.etiket, { color: colors.textSecondary }]}>Gebelik (gün)</Text>
              <TextInput value={gebelik} onChangeText={setGebelik} keyboardType="number-pad" style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} />
            </View>
          </View>
          {yontem === 'sunger' ? (
            <View style={[styles.chipSatir, { marginTop: 8, alignItems: 'center' }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Sünger kalır:</Text>
              {[12, 13, 14].map((g) => (
                <Pressable key={g} onPress={() => setSungerGun(g)} style={[styles.chip, { borderColor: sungerGun === g ? colors.tint : colors.border, backgroundColor: sungerGun === g ? colors.tint : colors.background }]}>
                  <Text style={{ color: sungerGun === g ? '#fff' : colors.text, fontWeight: '700', fontSize: 12 }}>{g} gün</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Text style={{ color: colors.text, marginTop: 10, fontWeight: '700' }}>
            {yontem === 'sunger' ? `Koç ${trTarih(katimGunu)} · ` : ''}Beklenen doğum: {/^\d{4}-\d{2}-\d{2}$/.test(tarih) ? trTarih(beklenenDogum({ katimTarih: katimGunu, gebelikGun: gg })) : '—'}
          </Text>
          <View style={[styles.kocSatir, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', width: 40 }}>Koç</Text>
            <Text style={{ color: koc ? colors.text : colors.textSecondary, fontWeight: '800', flex: 1 }}>{koc ? `♂ ${hayvanAnaEtiket(koc)}` : yontem === 'koc' ? 'seç (zorunlu)' : 'isteğe bağlı'}</Text>
            <Pressable onPress={() => setKocSec(!kocSec)} style={[styles.kucukBtn, { borderColor: colors.tint }]}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>{koc ? 'Değiştir' : 'Koç seç'}</Text>
            </Pressable>
          </View>
        </View>

        {kocSec ? (
          <HayvanSecici
            baslik="Koç seç"
            hayvanlar={hayvanlar.filter((a) => a.status !== 'sold' && a.status !== 'dead')}
            cinsiyet="male"
            bosSecenek={yontem === 'koc' ? undefined : '— Koç yok / bilinmiyor'}
            onSec={(a) => {
              setKoc(a);
              setKocSec(false);
            }}
            onKapat={() => setKocSec(false)}
          />
        ) : null}

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>♀ Koyunlar · {secili.size} seçili</Text>
          <View style={styles.chipSatir}>
            {[null, ...padoklar].map((p) => (
              <Pressable key={p ?? 'hepsi'} onPress={() => setPadok(p)} style={[styles.chip, { borderColor: padok === p ? colors.tint : colors.border, backgroundColor: padok === p ? colors.tint : colors.background }]}>
                <Text style={{ color: padok === p ? '#fff' : colors.text, fontWeight: '700', fontSize: 12 }}>{p ?? 'Tümü'}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 4 }}>
            <Pressable onPress={() => setSecili((s) => new Set([...s, ...secilebilir.filter((a) => uyari(a)?.seviye !== 'yuksek').map((a) => a.id)]))}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>✓ Görünenleri seç ({secilebilir.length})</Text>
            </Pressable>
            <Pressable onPress={() => setSecili(new Set())}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Temizle</Text>
            </Pressable>
          </View>
          {koc ? <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Toplu seçim, koçla yakın akraba (⛔) koyunları atlar.</Text> : null}
          {gorunen.map((a) => {
            const ak = aktifKayit.get(a.id);
            const u = uyari(a);
            const on = secili.has(a.id);
            const ay = yasAy(a.birthDate);
            return (
              <Pressable key={a.id} disabled={!!ak} onPress={() => degistir(a.id)} style={[styles.satir, { borderColor: colors.border, opacity: ak ? 0.5 : 1 }]}>
                <View style={[styles.kutucuk, { borderColor: on ? colors.tint : colors.border, backgroundColor: on ? colors.tint : 'transparent' }]}>
                  {on ? <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {hayvanAnaEtiket(a)}
                    <Text style={{ color: colors.textSecondary, fontWeight: '400', fontSize: 12 }}>
                      {'  '}
                      {a.paddock}
                      {ay != null ? ` · ${ay >= 24 ? `${Math.floor(ay / 12)} yaş` : `${ay} ay`}` : ''}
                      {ay != null && ay < 7 ? ' · genç' : ''}
                    </Text>
                  </Text>
                  {ak ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Zaten kayıtlı: {DURUM_ETIKET[durum(ak, bugun)]}</Text> : null}
                  {u ? <Text style={{ color: SEV[u.seviye], fontSize: 12 }}>{u.mesaj}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {yakinSecili ? <Text style={{ color: colors.danger, fontWeight: '700', marginBottom: 8 }}>⛔ Seçilenlerden {yakinSecili} koyun koçla yakın akraba.</Text> : null}
        {hata ? <Text style={{ color: colors.danger, marginBottom: 8 }}>{hata}</Text> : null}
        <Pressable disabled={kaydediliyor || secili.size === 0} onPress={() => void kaydet()} style={[styles.kaydet, { backgroundColor: secili.size ? colors.tint : colors.border }]}>
          <Text style={styles.kaydetYazi}>{kaydediliyor ? 'Kaydediliyor…' : `${secili.size} koyunu kaydet`}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14 },
  baslik: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  etiket: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  kocSatir: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 8 },
  kucukBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  satir: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 9, gap: 10 },
  kutucuk: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  kaydet: { minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kaydetYazi: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
