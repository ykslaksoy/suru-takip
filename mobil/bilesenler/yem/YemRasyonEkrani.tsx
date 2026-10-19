/**
 * Yem ve rasyon — yem stoğu (alımlar ₺/kg), parti başına rasyon (kg/baş/gün),
 * otomatik günlük stok düşümü, maliyete parti bazında yazılan yem gideri, az kalan yem uyarısı.
 * Tek ekran: Rasyon sekmesi ve Daha → Yem ve rasyon ikisi de burayı açar. Rasyonsuz padoklara öneri,
 * hesaplayıcı, akıllı öneri ve öneri vs gerçek karşılaştırması da burada.
 */
import { useEkip } from '@/bilesenler/ekip/useEkip';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  getDusumler,
  getYemOzeti,
  gunlukYemDusumu,
  rasyonDurdur,
  rasyonKaydet,
  rasyonSil,
  yemAlimiEkle,
  type YemOzeti,
} from '@/kaynak/yem/depo';
import { AZ_KALDI_GUN, rasyonDogrula, rasyonMaliyeti, sayiOku, type PartiRasyonu } from '@/kaynak/yem/hesap';
import type { DusumKaydi } from '@/kaynak/yem/kayit';
import { oneriyiUygula, rasyonsuzOneriler } from '@/kaynak/yem/depo';
import type { RasyonOnerisi } from '@/kaynak/yem/oneri';
import { calculateRation, PHASE_LABELS, type RationPhase } from '@/kaynak/rasyon/hesapla';
import { AkilliOneriKarti } from '@/bilesenler/rasyon/AkilliOneriKarti';
import { KarsilastirmaTablosu } from '@/bilesenler/rasyon/KarsilastirmaTablosu';
import { RasyonModlari } from '@/bilesenler/yem/RasyonModlari';
import { getBirimFiyatlar } from '@/kaynak/stok/fiyat';

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

const tl = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: n < 100 ? 2 : 0 })} ₺`;
const kg = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: n < 10 ? 2 : 0 })} kg`;
const gunTR = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

type RasyonForm = { id?: string; partiler: Set<string>; miktar: Record<string, string> };

export function YemRasyonEkrani({ sekme = false }: { sekme?: boolean }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshKey, refresh } = useDatabase();
  const [o, setO] = useState<YemOzeti | null>(null);
  const [gercek, setGercek] = useState<Record<string, number>>({});
  const [dusumler, setDusumler] = useState<DusumKaydi[]>([]);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [alim, setAlim] = useState<{ stockId: string | null; yeniAd: string; kg: string; fiyat: string; tedarikci: string } | null>(null);
  const [form, setForm] = useState<RasyonForm | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const ekip = useEkip();
  const finans = ekip.yetki('finans');
  const duzen = ekip.yetki('duzenleme');
  const para = (n: number) => (finans ? tl(n) : '•••');
  const [oneriler, setOneriler] = useState<RasyonOnerisi[]>([]);
  const [fazlar, setFazlar] = useState<Record<string, RationPhase>>({});
  const [acikOneri, setAcikOneri] = useState<string | null>(null);
  const [arac, setArac] = useState<'hesapla' | 'akilli' | 'karsilastirma' | null>(null);
  const [hes, setHes] = useState({ kg: '30', bas: '50', faz: 'lamb_fattening' as RationPhase, kalite: 'medium' as 'low' | 'medium' | 'high' });

  const yukle = useCallback(async () => {
    await gunlukYemDusumu().catch(() => null);
    const [oz, g, d] = await Promise.all([getYemOzeti(), getBirimFiyatlar(), getDusumler()]);
    setO(oz);
    setGercek(g);
    setDusumler(d);
    setOneriler(await rasyonsuzOneriler(fazlar).catch(() => []));
  }, [fazlar]);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle, refreshKey]),
  );

  const aktifRasyon = useMemo(() => {
    const m = new Map<string, PartiRasyonu>();
    for (const r of o?.rasyonlar ?? []) if (r.aktif) m.set(r.parti, r);
    return m;
  }, [o]);

  if (!o) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  const yemAdi = (id: string) => o.yemler.find((y) => y.id === id)?.name ?? 'silinmiş yem';
  const uyarilar = o.durumlar.filter((d) => d.uyari === 'bitti' || d.uyari === 'az');

  const alimKaydet = async () => {
    if (!alim) return;
    setHata(null);
    const k = sayiOku(alim.kg);
    const f = sayiOku(alim.fiyat);
    try {
      setMesgul(true);
      await yemAlimiEkle({ stockId: alim.stockId ?? undefined, yeniAd: alim.yeniAd, kg: k ?? 0, fiyatKg: f ?? 0, tedarikci: alim.tedarikci });
      setMesaj(`Alım kaydedildi: ${kg(k ?? 0)} × ${para(f ?? 0)}/kg = ${para((k ?? 0) * (f ?? 0))}`);
      setAlim(null);
      refresh();
      await yukle();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const formKalemleri = (f: RasyonForm) =>
    o.yemler.map((y) => ({ stockId: y.id, kgBasGun: sayiOku(f.miktar[y.id] ?? '') ?? 0 })).filter((k) => k.kgBasGun > 0);

  const rasyonFormKaydet = async () => {
    if (!form) return;
    setHata(null);
    const kalemler = formKalemleri(form);
    const partiler = [...form.partiler];
    if (!partiler.length) return setHata('En az bir parti seç');
    const h = rasyonDogrula({ parti: partiler[0], kalemler });
    if (h) return setHata(h);
    setMesgul(true);
    try {
      for (const p of partiler) {
        const mevcut = form.id && partiler.length === 1 ? form.id : aktifRasyon.get(p)?.id;
        await rasyonKaydet({ id: mevcut, parti: p, kalemler });
      }
      setMesaj(`Rasyon ${partiler.length > 1 ? `${partiler.length} partiye` : partiler[0] + ' için'} kaydedildi. Bugünden itibaren her gün stoktan düşülür.`);
      setForm(null);
      await gunlukYemDusumu().catch(() => null);
      refresh();
      await yukle();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const uygula = async (liste: RasyonOnerisi[]) => {
    setHata(null);
    setMesgul(true);
    try {
      for (const on of liste) await oneriyiUygula(on);
      setMesaj(`Önerilen rasyon ${liste.length > 1 ? `${liste.length} padoka` : liste[0].parti + ' için'} uygulandı.${liste.some((l) => l.eksikVar) ? ' Stokta olmayan yem 0 kg ile eklendi; alım gir.' : ''}`);
      setAcikOneri(null);
      await gunlukYemDusumu().catch(() => null);
      refresh();
      await yukle();
    } catch (e) {
      setMesaj(null);
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const Btn = ({ t, onPress, birincil, tehlike }: { t: string; onPress: () => void; birincil?: boolean; tehlike?: boolean }) => (
    <Pressable
      onPress={onPress}
      disabled={mesgul}
      style={[
        styles.btn,
        birincil
          ? { backgroundColor: colors.tint }
          : { borderWidth: 1, borderColor: tehlike ? colors.danger : colors.border, backgroundColor: colors.background },
      ]}>
      <Text style={{ color: birincil ? '#fff' : tehlike ? colors.danger : colors.text, fontWeight: '700' }}>{t}</Text>
    </Pressable>
  );

  const Chip = ({ t, sec, onPress }: { t: string; sec: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.chip, { borderColor: sec ? colors.tint : colors.border, backgroundColor: sec ? colors.tint : colors.background }]}>
      <Text style={{ color: sec ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{t}</Text>
    </Pressable>
  );

  const inp = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }];

  return (
    <>
      {sekme ? null : <Stack.Screen options={{ title: 'Yem ve rasyon' }} />}
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {sekme ? <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Yem ve rasyon</Text> : null}
        {uyarilar.length ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.danger }]}>
            <Text style={[styles.baslik, { color: colors.danger, marginBottom: 4 }]}>⚠️ Yem azalıyor</Text>
            {uyarilar.map((u) => (
              <Text key={u.stockId} style={{ color: colors.text, lineHeight: 22 }}>
                {u.ad}: {u.uyari === 'bitti' ? 'stok bitti' : `${u.yeterGun} gün yeter`} · günde {kg(u.gunlukKg)}
              </Text>
            ))}
          </View>
        ) : null}
        {mesaj ? (
          <Pressable onPress={() => setMesaj(null)} style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.success }]}>
            <Text style={{ color: colors.text }}>✅ {mesaj}</Text>
          </Pressable>
        ) : null}

        {/* RASYONSUZ PADOKLAR */}
        {oneriler.length ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.warning }]}>
            <View style={styles.basSatir}>
              <Text style={[styles.baslik, { color: colors.text, flex: 1, marginBottom: 0 }]}>⚠️ Rasyon yok ({oneriler.length})</Text>
              {duzen && oneriler.length > 1 ? (
                <Pressable
                  disabled={mesgul}
                  onPress={() =>
                    onayla(`${oneriler.length} padoka önerilen rasyon uygulansın mı?`, () => void uygula(oneriler))
                  }>
                  <Text style={{ color: colors.tint, fontWeight: '800' }}>Tümüne öner</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={[styles.not, { color: colors.textSecondary, marginBottom: 6 }]}>
              Kuzusu olan ama rasyonu olmayan padoklar. Öneri son tartım ortalaması ve baş sayısıyla hesaplanır.
            </Text>
            {oneriler.map((on) => {
              const acik = acikOneri === on.parti;
              return (
                <View key={on.parti} style={[styles.parti, { borderColor: colors.border }]}>
                  <View style={styles.basSatir}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800' }}>{on.parti} · {on.bas} baş</Text>
                      <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Rasyon yok</Text>
                    </View>
                    {duzen ? <Btn t={acik ? 'Kapat' : 'Öner'} birincil={!acik} onPress={() => setAcikOneri(acik ? null : on.parti)} /> : null}
                  </View>
                  {acik ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        Ort. {kg(on.ortKg)}{on.tartimli ? ' (son tartım)' : ' (tartım yok, varsayılan)'} · {PHASE_LABELS[on.faz]}
                      </Text>
                      <View style={[styles.chipSatir, { marginVertical: 8 }]}>
                        {(Object.keys(PHASE_LABELS) as RationPhase[]).map((f) => (
                          <Chip key={f} t={PHASE_LABELS[f]} sec={on.faz === f} onPress={() => setFazlar({ ...fazlar, [on.parti]: f })} />
                        ))}
                      </View>
                      {on.kalemler.map((k, i) => (
                        <Text key={i} style={{ color: k.eksik ? colors.danger : colors.text, lineHeight: 22 }}>
                          • {k.ad}: {kg(k.kgBasGun)}/baş/gün{k.eksik ? ' — stokta yok, 0 kg ile eklenecek' : ''}
                        </Text>
                      ))}
                      <Text style={{ color: colors.text, fontWeight: '700', marginTop: 4 }}>
                        Toplam {kg(on.gunlukKgBas)}/baş · padok günde {kg(on.toplamGunlukKg)}
                      </Text>
                      <View style={{ marginTop: 8 }}>
                        <Btn t="Uygula" birincil onPress={() => void uygula([on])} />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        <RasyonModlari
          partiler={o.partiler}
          basSayisi={o.basSayisi}
          yemler={o.yemler}
          fiyatlar={o.fiyatlar}
          varsayilanParti={oneriler[0]?.parti}
          duzen={duzen}
          finans={finans}
          onKendi={() => setForm({ partiler: new Set(), miktar: {} })}
          onUygulandi={(m) => {
            setMesaj(m);
            void gunlukYemDusumu().catch(() => null).then(() => { refresh(); return yukle(); });
          }}
        />

        {/* PARTİ RASYONLARI */}
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.basSatir}>
            <Text style={[styles.baslik, { color: colors.text, flex: 1, marginBottom: 0 }]}>🍽️ Parti rasyonları</Text>
            {!form && duzen ? (
              <Pressable onPress={() => setForm({ partiler: new Set(), miktar: {} })}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>+ Rasyon kur</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.not, { color: colors.textSecondary, marginBottom: 8 }]}>
            kg/baş/gün gir; her gün baş sayısı × kg yem stoktan kendiliğinden düşer ve parti maliyetine yazılır.
          </Text>

          {form ? (
            <View style={[styles.form, { borderColor: colors.tint }]}>
              <Text style={[styles.etiket, { color: colors.textSecondary }]}>Parti / padok (birden çok seçilebilir)</Text>
              <View style={[styles.chipSatir, { marginBottom: 10 }]}>
                {o.partiler.map((p) => (
                  <Chip
                    key={p}
                    t={`${p} · ${o.basSayisi[p]}`}
                    sec={form.partiler.has(p)}
                    onPress={() => {
                      const s = new Set(form.partiler);
                      if (s.has(p)) s.delete(p);
                      else s.add(p);
                      setForm({ ...form, partiler: s });
                    }}
                  />
                ))}
                {o.partiler.length > 1 ? (
                  <Chip t="Tümü" sec={form.partiler.size === o.partiler.length} onPress={() => setForm({ ...form, partiler: new Set(o.partiler) })} />
                ) : null}
              </View>
              <Text style={[styles.etiket, { color: colors.textSecondary }]}>Yem · kg/baş/gün</Text>
              {o.yemler.length === 0 ? (
                <Text style={{ color: colors.textSecondary }}>Önce aşağıdan yem alımı ekle.</Text>
              ) : (
                o.yemler.map((y) => (
                  <View key={y.id} style={[styles.satir, { borderColor: colors.border }]}>
                    <Text style={{ flex: 1, color: colors.text }}>{y.name}</Text>
                    <TextInput
                      value={form.miktar[y.id] ?? ''}
                      onChangeText={(t) => setForm({ ...form, miktar: { ...form.miktar, [y.id]: t } })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      style={[inp, { width: 80, textAlign: 'right', paddingVertical: 6 }]}
                    />
                  </View>
                ))
              )}
              {(() => {
                const kal = formKalemleri(form);
                if (!kal.length) return null;
                const m = rasyonMaliyeti({ id: '', parti: '', kalemler: kal, baslangic: '', sonDusum: null, aktif: true, guncelleme: '' }, 1, o.fiyatlar);
                const bas = [...form.partiler].reduce((s, p) => s + (o.basSayisi[p] ?? 0), 0);
                return (
                  <Text style={{ color: colors.text, marginTop: 8, fontWeight: '700' }}>
                    {kg(m.kgBasGun)}/baş/gün · {para(m.tlBasGun)}/baş/gün{bas ? ` · ${bas} baş: günde ${kg(m.kgBasGun * bas)}, ${para(m.tlBasGun * bas)}` : ''}
                  </Text>
                );
              })()}
              {hata ? <Text style={{ color: colors.danger, marginTop: 6 }}>{hata}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Btn t="Vazgeç" onPress={() => { setForm(null); setHata(null); }} />
                </View>
                <View style={{ flex: 2 }}>
                  <Btn t={mesgul ? 'Kaydediliyor…' : 'Rasyonu kaydet'} birincil onPress={() => void rasyonFormKaydet()} />
                </View>
              </View>
            </View>
          ) : null}

          {o.partiler.map((p) => {
            const r = aktifRasyon.get(p);
            const pasif = !r ? (o.rasyonlar.find((x) => x.parti === p && !x.aktif) ?? null) : null;
            const bas = o.basSayisi[p] ?? 0;
            const gr = r ?? pasif;
            const m = gr ? rasyonMaliyeti(gr, bas, o.fiyatlar) : null;
            return (
              <View key={p} style={[styles.parti, { borderColor: colors.border }]}>
                <View style={styles.basSatir}>
                  <Text style={{ flex: 1, color: colors.text, fontWeight: '800', fontSize: 15 }}>
                    {p} · {bas} baş
                  </Text>
                  {r ? (
                    <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>● her gün düşülüyor</Text>
                  ) : pasif ? (
                    <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 12 }}>⏸ durduruldu</Text>
                  ) : (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>rasyon yok</Text>
                  )}
                </View>
                {gr && m ? (
                  <>
                    <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}>
                      {gr.kalemler.map((k) => `${yemAdi(k.stockId)} ${k.kgBasGun.toLocaleString('tr-TR')}`).join(' · ')} kg/baş/gün
                    </Text>
                    <Text style={{ color: colors.text, marginTop: 2 }}>
                      Günde {kg(m.kgBasGun * bas)} · {para(m.tlGun)}/gün · {para(m.tlBasGun)}/baş
                      {m.fiyatsiz ? ` · ${m.fiyatsiz} yemin fiyatı yok` : ''}
                    </Text>
                    {gr.sonDusum ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Son düşüm: {gunTR(gr.sonDusum)}</Text>
                    ) : null}
                    {duzen ? (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Btn
                          t="Düzenle"
                          onPress={() =>
                            setForm({
                              id: gr.id,
                              partiler: new Set([p]),
                              miktar: Object.fromEntries(gr.kalemler.map((k) => [k.stockId, String(k.kgBasGun).replace('.', ',')])),
                            })
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Btn
                          t={r ? 'Durdur' : 'Başlat'}
                          onPress={async () => {
                            await rasyonDurdur(gr.id, !r);
                            await yukle();
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Btn
                          t="Sil"
                          tehlike
                          onPress={() =>
                            onayla(`${p} rasyonu geri dönüşüm kutusuna taşınsın mı? Geçmiş düşümler ve maliyet kalır.`, async () => {
                              await rasyonSil(gr.id);
                              await yukle();
                            })
                          }
                        />
                      </View>
                    </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* YEM STOĞU */}
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.basSatir}>
            <Text style={[styles.baslik, { color: colors.text, flex: 1, marginBottom: 0 }]}>🌾 Yem stoğu</Text>
            {!alim && finans ? (
              <Pressable onPress={() => setAlim({ stockId: o.yemler[0]?.id ?? null, yeniAd: '', kg: '', fiyat: '', tedarikci: '' })}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>+ Yem alımı</Text>
              </Pressable>
            ) : null}
          </View>

          {alim ? (
            <View style={[styles.form, { borderColor: colors.tint }]}>
              <Text style={[styles.etiket, { color: colors.textSecondary }]}>Yem</Text>
              <View style={[styles.chipSatir, { marginBottom: 8 }]}>
                {o.yemler.map((y) => (
                  <Chip key={y.id} t={y.name} sec={alim.stockId === y.id} onPress={() => setAlim({ ...alim, stockId: y.id })} />
                ))}
                <Chip t="+ Yeni yem" sec={alim.stockId == null} onPress={() => setAlim({ ...alim, stockId: null })} />
              </View>
              {alim.stockId == null ? (
                <TextInput value={alim.yeniAd} onChangeText={(t) => setAlim({ ...alim, yeniAd: t })} placeholder="Yem adı (ör. Mısır silajı)" placeholderTextColor={colors.textSecondary} style={[inp, { marginBottom: 8 }]} />
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.etiket, { color: colors.textSecondary }]}>Miktar (kg)</Text>
                  <TextInput value={alim.kg} onChangeText={(t) => setAlim({ ...alim, kg: t })} keyboardType="decimal-pad" placeholder="1000" placeholderTextColor={colors.textSecondary} style={inp} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.etiket, { color: colors.textSecondary }]}>Fiyat (₺/kg)</Text>
                  <TextInput value={alim.fiyat} onChangeText={(t) => setAlim({ ...alim, fiyat: t })} keyboardType="decimal-pad" placeholder="11,5" placeholderTextColor={colors.textSecondary} style={inp} />
                </View>
              </View>
              <TextInput value={alim.tedarikci} onChangeText={(t) => setAlim({ ...alim, tedarikci: t })} placeholder="Tedarikçi (isteğe bağlı)" placeholderTextColor={colors.textSecondary} style={[inp, { marginTop: 8 }]} />
              {sayiOku(alim.kg) && sayiOku(alim.fiyat) ? (
                <Text style={{ color: colors.text, marginTop: 6, fontWeight: '700' }}>Toplam: {para((sayiOku(alim.kg) ?? 0) * (sayiOku(alim.fiyat) ?? 0))}</Text>
              ) : null}
              {hata ? <Text style={{ color: colors.danger, marginTop: 6 }}>{hata}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Btn t="Vazgeç" onPress={() => { setAlim(null); setHata(null); }} />
                </View>
                <View style={{ flex: 2 }}>
                  <Btn t="Alımı kaydet" birincil onPress={() => void alimKaydet()} />
                </View>
              </View>
            </View>
          ) : null}

          {o.durumlar.map((d) => {
            const renk = d.uyari === 'bitti' || d.uyari === 'az' ? colors.danger : d.uyari === 'min' ? colors.warning : colors.textSecondary;
            return (
              <View key={d.stockId} style={[styles.satir, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{d.ad}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {d.fiyatKg ? `${para(d.fiyatKg)}/kg${gercek[d.stockId] ? '' : ' (tahmini)'}` : 'fiyat yok'}
                    {d.gunlukKg ? ` · günde ${kg(d.gunlukKg)}` : ' · rasyonda değil'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>{kg(d.stokKg)}</Text>
                  <Text style={{ color: renk, fontSize: 12, fontWeight: '700' }}>
                    {d.uyari === 'bitti'
                      ? 'bitti'
                      : d.yeterGun != null
                        ? `${d.yeterGun} gün yeter`
                        : d.uyari === 'min'
                          ? `min ${kg(d.minKg)} altında`
                          : ''}
                  </Text>
                </View>
              </View>
            );
          })}
          <Text style={[styles.not, { color: colors.textSecondary, marginTop: 8 }]}>
            Alım fiyatı eldeki stokla ağırlıklı ortalanır. {AZ_KALDI_GUN} günden az yetecek yem Görevler'de uyarı olarak çıkar.
          </Text>
        </View>

        {/* DÜŞÜMLER */}
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>📉 Otomatik düşümler</Text>
          {dusumler.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>Henüz düşüm yok. Rasyon kurunca uygulama her gün açıldığında stoktan düşer.</Text>
          ) : (
            dusumler.slice(0, 6).map((d) => {
              const top = d.kalemler.reduce((s, k) => s + k.dusulen, 0);
              const eksik = d.kalemler.reduce((s, k) => s + k.eksik, 0);
              const tutar = d.kalemler.reduce((s, k) => s + k.dusulen * (o.fiyatlar[k.stockId] ?? 0), 0);
              const partiler = [...new Set(d.kalemler.map((k) => k.parti))];
              return (
                <View key={d.id} style={[styles.satir, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      {gunTR(d.gun)} · {kg(top)} · {para(tutar)}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {partiler.join(', ')}
                      {d.kalemler[0]?.gunSayisi > 1 ? ` · ${d.kalemler[0].gunSayisi} gün birden` : ''}
                    </Text>
                    {eksik > 0 ? <Text style={{ color: colors.danger, fontSize: 12 }}>{kg(eksik)} stok yetmedi</Text> : null}
                  </View>
                </View>
              );
            })
          )}
          {finans ? (
            <View style={{ marginTop: 8 }}>
              <Btn t="Parti maliyetine bak →" onPress={() => router.push('/maliyet' as never)} />
            </View>
          ) : null}
        </View>
        {/* HESAPLA / AKILLI ÖNERİ / ÖNERİ VS GERÇEK */}
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>🧮 Hesapla ve karşılaştır</Text>
          <View style={styles.chipSatir}>
            <Chip t="Hesapla" sec={arac === 'hesapla'} onPress={() => setArac(arac === 'hesapla' ? null : 'hesapla')} />
            <Chip t="Akıllı öneri" sec={arac === 'akilli'} onPress={() => setArac(arac === 'akilli' ? null : 'akilli')} />
            <Chip t="Öneri vs gerçek" sec={arac === 'karsilastirma'} onPress={() => setArac(arac === 'karsilastirma' ? null : 'karsilastirma')} />
          </View>
          {arac === 'hesapla' ? (() => {
            const r = calculateRation({ liveWeightKg: sayiOku(hes.kg) ?? 0, count: Math.round(sayiOku(hes.bas) ?? 0), phase: hes.faz, forageQuality: hes.kalite });
            return (
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.etiket, { color: colors.textSecondary }]}>Ort. canlı ağırlık (kg)</Text>
                    <TextInput value={hes.kg} onChangeText={(t) => setHes({ ...hes, kg: t })} keyboardType="decimal-pad" style={inp} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.etiket, { color: colors.textSecondary }]}>Hayvan sayısı</Text>
                    <TextInput value={hes.bas} onChangeText={(t) => setHes({ ...hes, bas: t })} keyboardType="number-pad" style={inp} />
                  </View>
                </View>
                <Text style={[styles.etiket, { color: colors.textSecondary, marginTop: 8 }]}>Dönem</Text>
                <View style={styles.chipSatir}>
                  {(Object.keys(PHASE_LABELS) as RationPhase[]).map((f) => (
                    <Chip key={f} t={PHASE_LABELS[f]} sec={hes.faz === f} onPress={() => setHes({ ...hes, faz: f })} />
                  ))}
                </View>
                <Text style={[styles.etiket, { color: colors.textSecondary, marginTop: 8 }]}>Kaba yem kalitesi</Text>
                <View style={styles.chipSatir}>
                  {(['low', 'medium', 'high'] as const).map((q) => (
                    <Chip key={q} t={q === 'low' ? 'Düşük' : q === 'medium' ? 'Orta' : 'Yüksek'} sec={hes.kalite === q} onPress={() => setHes({ ...hes, kalite: q })} />
                  ))}
                </View>
                <View style={[styles.form, { borderColor: colors.border, marginTop: 10, marginBottom: 0 }]}>
                  <Text style={{ color: colors.text }}>Kuru madde/baş/gün: {kg(r.dmRequirementKg)}</Text>
                  <Text style={{ color: colors.text }}>Yem/baş/gün: {kg(r.dailyFeedKg)}</Text>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Toplam/gün: {kg(r.totalDailyKg)}</Text>
                  <Text style={{ color: colors.text }}>Hedef protein: %{r.proteinPercent}</Text>
                  {r.notes.map((n, i) => (
                    <Text key={i} style={{ color: colors.textSecondary, marginTop: 4 }}>• {n}</Text>
                  ))}
                </View>
              </View>
            );
          })() : arac === 'akilli' ? (
            <View style={{ marginTop: 10 }}><AkilliOneriKarti /></View>
          ) : arac === 'karsilastirma' ? (
            <View style={{ marginTop: 10 }}><KarsilastirmaTablosu /></View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  basSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  etiket: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  not: { fontSize: 13, lineHeight: 19 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 16 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  parti: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  form: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 10 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  btn: { borderRadius: 10, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
