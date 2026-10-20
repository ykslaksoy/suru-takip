/** Çiftleşme ve doğum — özet, yaklaşanlar, koyun listesi */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { bugunYerel, ciftlesmeSil, getCiftlesmeler } from '@/kaynak/ciftlesme/depo';
import {
  aktifMi,
  beklenenDogum,
  DURUM_ETIKET,
  durum,
  grupla,
  gunFarki,
  HATIRLATMA_ETIKET,
  hatirlatmalar,
  ozet,
  sungerCikis,
  trTarih,
  ULTRASON_EN_ERKEN,
  YONTEM_ETIKET,
  type CiftlesmeDurum,
  type CiftlesmeKaydi,
} from '@/kaynak/ciftlesme/hesap';
import { yetkiUyar } from '@/bilesenler/ekip/useEkip';
import { DURUM_SIMGE, durumRenk, onayla } from '@/bilesenler/ciftlesme/ortak';

const SIRA: CiftlesmeDurum[] = ['gecikti', 'gebe', 'bekleniyor', 'sunger'];

export default function CiftlesmeEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [kayitlar, setKayitlar] = useState<CiftlesmeKaydi[] | null>(null);
  const [hayvan, setHayvan] = useState<Map<string, Animal>>(new Map());
  const [hepsi, setHepsi] = useState(false);
  const bugun = bugunYerel();

  const yukle = useCallback(async () => {
    const [l, a] = await Promise.all([getCiftlesmeler(), getAnimals()]);
    setKayitlar(l);
    setHayvan(new Map(a.map((x) => [x.id, x])));
  }, []);
  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  const ad = (id: string | null | undefined) => (id ? (hayvan.get(id) ? hayvanAnaEtiket(hayvan.get(id)!) : 'silinmiş') : '—');
  const o = useMemo(() => ozet(kayitlar ?? [], bugun), [kayitlar, bugun]);
  const yaklasan = useMemo(
    () => grupla(hatirlatmalar(kayitlar ?? [], bugun)).filter((g) => gunFarki(bugun, g.tarih) <= 200 && (g.tur !== 'ultrason' || gunFarki(bugun, g.tarih) > -60)),
    [kayitlar, bugun],
  );
  const aktifler = useMemo(
    () =>
      (kayitlar ?? [])
        .filter(aktifMi)
        .sort((a, b) => SIRA.indexOf(durum(a, bugun)) - SIRA.indexOf(durum(b, bugun)) || beklenenDogum(a).localeCompare(beklenenDogum(b))),
    [kayitlar, bugun],
  );
  const bitenler = useMemo(() => (kayitlar ?? []).filter((k) => !aktifMi(k)).sort((a, b) => (b.dogum?.tarih ?? b.ultrason?.tarih ?? '').localeCompare(a.dogum?.tarih ?? a.ultrason?.tarih ?? '')), [kayitlar]);
  const ultrasonBekleyen = (kayitlar ?? []).filter((k) => aktifMi(k) && !k.ultrason && durum(k, bugun) !== 'sunger' && gunFarki(k.katimTarih, bugun) >= ULTRASON_EN_ERKEN).length;

  if (!kayitlar) return null;

  const Kutu = ({ d }: { d: CiftlesmeDurum }) => (
    <View style={[styles.sayac, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: durumRenk(d, colors) }}>{o[d]}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700', textAlign: 'center' }}>
        {DURUM_SIMGE[d]} {DURUM_ETIKET[d]}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Çiftleşme ve doğum' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(['sunger', 'bekleniyor', 'gebe', 'gecikti', 'dogurdu', 'bos'] as CiftlesmeDurum[]).map((d) => (
            <Kutu key={d} d={d} />
          ))}
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
          Gebelik oranı: {o.gebelikOrani == null ? '—' : `%${Math.round(o.gebelikOrani * 100)}`} · Kuzu verimi:{' '}
          {o.kuzuVerimi == null ? '—' : `${o.kuzuVerimi.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kuzu/koyun`}
          {o.oluKuzu ? ` · ölü doğan ${o.oluKuzu}` : ''}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <Pressable onPress={() => router.push('/ciftlesme/katim' as never)} style={[styles.buyukBtn, { backgroundColor: colors.tint }]}>
            <Text style={styles.buyukYazi}>🐏 Koç katımı / sünger</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/ciftlesme/ultrason' as never)} style={[styles.buyukBtn, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.tint }]}>
            <Text style={[styles.buyukYazi, { color: colors.tint }]}>🔎 Ultrason{ultrasonBekleyen ? ` (${ultrasonBekleyen})` : ''}</Text>
          </Pressable>
        </View>

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>📅 Yaklaşanlar</Text>
          {yaklasan.length === 0 ? <Text style={{ color: colors.textSecondary }}>Hatırlatma yok. Koç katımı girince sünger, ultrason ve doğum tarihleri burada, Görevler'de ve Takvim'de çıkar.</Text> : null}
          {yaklasan.slice(0, 12).map((g) => {
            const kalan = gunFarki(bugun, g.tarih);
            return (
              <Pressable key={`${g.tur}${g.tarih}`} onPress={() => g.tur === 'ultrason' && router.push('/ciftlesme/ultrason' as never)} style={[styles.satir, { borderColor: colors.border }]}>
                <View style={{ width: 62 }}>
                  <Text style={{ color: kalan < 0 ? colors.danger : colors.text, fontWeight: '800' }}>{trTarih(g.tarih).slice(0, 5)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{kalan === 0 ? 'bugün' : kalan > 0 ? `${kalan} gün` : `${-kalan} gün geçti`}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: g.tur === 'gecikti' ? colors.danger : colors.text, fontWeight: '700' }}>
                    {HATIRLATMA_ETIKET[g.tur]} · {g.koyunIds.length} koyun
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {g.koyunIds.slice(0, 8).map(ad).join(', ')}
                    {g.koyunIds.length > 8 ? '…' : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>🐑 Takipteki koyunlar ({aktifler.length})</Text>
          {aktifler.length === 0 ? <Text style={{ color: colors.textSecondary }}>Kayıt yok.</Text> : null}
          {aktifler.map((k) => {
            const d = durum(k, bugun);
            const bd = beklenenDogum(k);
            const kalan = gunFarki(bugun, bd);
            return (
              <View key={k.id} style={[styles.satir, { borderColor: colors.border }]}>
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/hayvan/${k.koyunId}` as never)}>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>
                    ♀ {ad(k.koyunId)}{' '}
                    <Text style={{ color: durumRenk(d, colors), fontSize: 12 }}>
                      {DURUM_SIMGE[d]} {DURUM_ETIKET[d]}
                      {d === 'gebe' && (k.ultrason?.yavruSayisi ?? 1) > 1 ? ` · ${k.ultrason?.yavruSayisi === 2 ? 'ikiz' : 'üçüz'}` : ''}
                    </Text>
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {YONTEM_ETIKET[k.yontem]}
                    {k.kocId ? ` · ♂ ${ad(k.kocId)}` : ''}
                    {d === 'sunger' ? ` · sünger çıkar ${trTarih(sungerCikis(k)!)}` : ` · katım ${trTarih(k.katimTarih)}`}
                  </Text>
                  <Text style={{ color: d === 'gecikti' ? colors.danger : colors.text, fontSize: 12, fontWeight: '700', marginTop: 1 }}>
                    Beklenen doğum {trTarih(bd)} · {kalan >= 0 ? `${kalan} gün kaldı` : `${-kalan} gün geçti`}
                  </Text>
                </Pressable>
                <View style={{ gap: 6, alignItems: 'flex-end' }}>
                  {d !== 'sunger' ? (
                    <Pressable onPress={() => router.push(`/hayvan/${k.koyunId}/dogum` as never)} style={[styles.kucukBtn, { borderColor: colors.tint }]}>
                      <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 12 }}>Doğum gir</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      if (!yetkiUyar('silme')) return;
                      onayla(`${ad(k.koyunId)} çiftleşme kaydı silinsin mi? 30 gün geri dönüşüm kutusunda kalır.`, () => void ciftlesmeSil(k.id).then(yukle));
                    }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>🗑 Sil</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {bitenler.length ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => setHepsi(!hepsi)}>
              <Text style={[styles.baslik, { color: colors.text }]}>
                ✅ Sonuçlananlar ({bitenler.length}) {hepsi ? '▴' : '▾'}
              </Text>
            </Pressable>
            {(hepsi ? bitenler : bitenler.slice(0, 5)).map((k) => (
              <Pressable key={k.id} onPress={() => router.push(`/hayvan/${k.koyunId}` as never)} style={[styles.satir, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, flex: 1 }}>
                  ♀ {ad(k.koyunId)}
                  {k.kocId ? ` × ♂ ${ad(k.kocId)}` : ''}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {k.dogum
                    ? `${trTarih(k.dogum.tarih)} · ${k.dogum.canli === 1 ? 'tek' : k.dogum.canli === 2 ? 'ikiz' : k.dogum.canli === 3 ? 'üçüz' : `${k.dogum.canli} kuzu`}${k.dogum.olu ? ` + ${k.dogum.olu} ölü` : ''}`
                    : `Boş · ${trTarih(k.ultrason!.tarih)}`}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Gebelik süresi varsayılan 150 gün (koyun 145–155). Ultrason katımdan ~45 gün sonra. Sünger 12–14 gün kalır; çıkarınca ~48 saat sonra koç.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14 },
  baslik: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  sayac: { width: '31.5%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  buyukBtn: { flex: 1, minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  buyukYazi: { color: '#fff', fontWeight: '800', fontSize: 14 },
  satir: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 9, gap: 8 },
  kucukBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
});
