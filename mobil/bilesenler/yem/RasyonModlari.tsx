/**
 * Rasyon: Stokla plan (varsayılan) · Referans şablon · Kendi rasyonum.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { PHASE_LABELS, type RationPhase } from '@/kaynak/rasyon/hesapla';
import {
  besinKontrol,
  enUcuzRasyon,
  gereksinim,
  HAZIR_RASYONLAR,
  karisimKg,
  malzemeOlustur,
  type FormulSonuc,
  type KontrolSatiri,
  type Malzeme,
} from '@/kaynak/rasyon/formul';
import { standartYem, STANDART_YEMLER } from '@/kaynak/rasyon/yem-besin';
import { adliRasyonUygula, partiOrtalamalari } from '@/kaynak/yem/depo';
import { sayiOku } from '@/kaynak/yem/hesap';
import { kaliciGetItem, kaliciSetItem } from '@/kaynak/cekirdek/web-kalici-depo';
import { VARSAYILAN_KG } from '@/kaynak/yem/oneri';
import { hazirSablonStokPlani, yemStokEsle } from '@/kaynak/rasyon/stok-plan';
import { onerilenSablonId } from '@/kaynak/yem/padok-durum';
import { stokKaynagaUygun, yemAnalizOzeti, type YemKaynagiTercih } from '@/kaynak/yem/yem-kaynagi';
import { yemKaynagiKaydet, yemKaynagiOku } from '@/kaynak/yem/yem-kaynagi-tercih';

type Mod = 'hazir' | 'kendi' | 'elimdeki';
type Karisim = { ad: string; yuzde: number }[];
const KEY_HAZIR = 'sy_hazir_rasyon_duzen_v1';

const kgF = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: n < 10 ? 2 : 0 })} kg`;
const tlF = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;

export function RasyonModlari(p: {
  partiler: string[];
  basSayisi: Record<string, number>;
  yemler: StockItem[];
  fiyatlar: Record<string, number>;
  seciliPadok: string;
  onPadokDegisti?: (padok: string) => void;
  duzen: boolean;
  finans: boolean;
  onKendi: () => void;
  onUygulandi: (mesaj: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [mod, setMod] = useState<Mod>('elimdeki');
  const [adim, setAdim] = useState(1);
  const [sablonAcik, setSablonAcik] = useState(false);
  const [planAcik, setPlanAcik] = useState(false);
  const parti = p.seciliPadok;
  const [ort, setOrt] = useState<Record<string, number | null>>({});
  const [faz, setFaz] = useState<RationPhase>('lamb_fattening');
  const [hazirId, setHazirId] = useState<string | null>(null);
  const [duzenler, setDuzenler] = useState<Record<string, Karisim>>({});
  const [gunlukStr, setGunlukStr] = useState<string>('');
  const [secili, setSecili] = useState<Malzeme[]>([]);
  const [ozelAd, setOzelAd] = useState('');
  const [acikBesin, setAcikBesin] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<FormulSonuc | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [yemKaynagi, setYemKaynagi] = useState<YemKaynagiTercih>('her_ikisi');

  useEffect(() => {
    void yemKaynagiOku().then(setYemKaynagi);
    void partiOrtalamalari().then(setOrt).catch(() => undefined);
    void kaliciGetItem(KEY_HAZIR).then((r) => {
      try {
        if (r) setDuzenler(JSON.parse(r));
      } catch {}
    });
  }, []);
  useEffect(() => {
    setAdim(1);
    setSonuc(null);
    setHazirId(null);
    setSablonAcik(false);
  }, [parti]);

  const ortKg = (parti && ort[parti]) || VARSAYILAN_KG;
  const tartimli = !!(parti && ort[parti]);
  const bas = parti ? p.basSayisi[parti] ?? 0 : 0;
  const onerilenId = onerilenSablonId(ort[parti] ?? null, VARSAYILAN_KG);
  const sablonId = mod === 'hazir' ? hazirId ?? onerilenId : onerilenId;
  const hazir = HAZIR_RASYONLAR.find((h) => h.id === sablonId) ?? HAZIR_RASYONLAR[0];
  const g = gereksinim(ortKg, mod === 'hazir' ? hazir.faz : faz);
  const karisim: Karisim = duzenler[hazir.id] ?? hazir.karisim;
  const gunluk = sayiOku(gunlukStr) ?? g.yemKg;

  const stokEsle = (ad: string) => yemStokEsle(ad, p.yemler);

  const hazirKalemler = useMemo(() => karisimKg(karisim, gunluk), [karisim, gunluk]);
  const hazirStok = useMemo(
    () => hazirSablonStokPlani(karisim, gunluk, g, p.yemler, bas, 1),
    [karisim, gunluk, g, p.yemler, bas],
  );
  const hazirTl = hazirStok.stokta.reduce((s, k) => {
    const y = p.yemler.find((x) => x.id === k.stockId);
    return s + k.kgBasGunPlan * ((y && p.fiyatlar[y.id]) || standartYem(k.ad)?.tahminiFiyat || 0);
  }, 0);
  const fiyatsiz = hazirStok.stokta.filter((k) => {
    const y = p.yemler.find((x) => x.id === k.stockId);
    return !(y && p.fiyatlar[y.id]);
  }).length;

  const stoktakiYemler = useMemo(
    () => p.yemler.filter((y) => y.quantity > 0 && stokKaynagaUygun(y, yemKaynagi)),
    [p.yemler, yemKaynagi],
  );

  const karisimYaz = (k: Karisim | null) => {
    const yeni = { ...duzenler };
    if (k) yeni[hazir.id] = k;
    else delete yeni[hazir.id];
    setDuzenler(yeni);
    void kaliciSetItem(KEY_HAZIR, JSON.stringify(yeni));
  };

  const uygula = async (
    ad: string,
    kalemler: { ad: string; stockId?: string; kgBasGun: number }[],
    tamStok = true,
  ) => {
    if (!parti) return setHata('Padok seç');
    setHata(null);
    setMesgul(true);
    try {
      const kayit = await adliRasyonUygula(
        parti,
        ad,
        kalemler.map((k) => ({ ...k, stockId: k.stockId ?? stokEsle(k.ad)?.id })),
        { eksikStoktaOlusturma: false, stokMiktarKontrol: tamStok, bas, gun: 1 },
      );
      setSonuc(null);
      p.onUygulandi(
        tamStok
          ? `${ad} · ${parti} kaydedildi (plan). Stok düşümü yalnız gerçek besleme günlerinde yapılır.`
          : `${ad} · ${parti}: yalnız stoktaki ${kayit.kalemler.length} kalem kaydedildi — eksikler tamamlanmadan tam şablon uygulanamaz.`,
      );
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const Chip = ({ t, sec, onPress }: { t: string; sec: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[s.chip, { borderColor: sec ? colors.tint : colors.border, backgroundColor: sec ? colors.tint : colors.background }]}>
      <Text style={{ color: sec ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{t}</Text>
    </Pressable>
  );
  const Btn = ({ t, onPress, birincil }: { t: string; onPress: () => void; birincil?: boolean }) => (
    <Pressable disabled={mesgul} onPress={onPress} style={[s.btn, birincil ? { backgroundColor: colors.tint } : { borderWidth: 1, borderColor: colors.border }]}>
      <Text style={{ color: birincil ? '#fff' : colors.text, fontWeight: '700' }}>{t}</Text>
    </Pressable>
  );
  const inp = [s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }];
  const Kontrol = ({ k }: { k: KontrolSatiri[] }) => (
    <View style={{ marginTop: 8 }}>
      {k.map((r) => (
        <View key={r.ad} style={[s.satir, { borderColor: colors.border }]}>
          <Text style={{ color: r.tamam ? colors.success : colors.danger, fontWeight: '800', width: 22 }}>{r.tamam ? '✓' : '✗'}</Text>
          <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>{r.ad}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>{r.hedef}</Text>
          <Text style={{ color: r.tamam ? colors.success : colors.danger, fontWeight: '700', flex: 1, textAlign: 'right' }}>{r.deger}</Text>
        </View>
      ))}
    </View>
  );
  const Uzman = () => <Text style={{ color: colors.warning, fontSize: 12, marginTop: 6, fontWeight: '700' }}>Öneri; uzman/veteriner onayı önerilir.</Text>;

  if (!planAcik) {
    return (
      <View style={[s.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.baslik, { color: colors.text }]}>Yeni plan veya öneri</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
          {parti} padoku için taslak oluşturun. Kayıtlı aktif plan yukarıdaki karttadır; şablon seçimi otomatik uygulanmaz.
        </Text>
        {p.duzen ? (
          <Btn t="Plan / şablon oluştur" birincil onPress={() => setPlanAcik(true)} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Düzenleme yetkisi gerekir.</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[s.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.chipSatir}>
        <Text style={[s.baslik, { color: colors.text, flex: 1, marginBottom: 0 }]}>🧪 {parti} · plan oluştur</Text>
        <Pressable onPress={() => setPlanAcik(false)}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Kapat</Text>
        </Pressable>
      </View>
      <Text style={[s.etiket, { color: colors.textSecondary }]}>Yem kaynağı (besleme döneminden ayrı)</Text>
      <View style={s.chipSatir}>
        {(
          [
            ['uretim', 'Çiftlikte üretim karışımı'],
            ['ticari', 'Ticari hazır yem'],
            ['her_ikisi', 'Her ikisi'],
          ] as const
        ).map(([id, label]) => (
          <Chip
            key={id}
            t={label}
            sec={yemKaynagi === id}
            onPress={() => {
              setYemKaynagi(id);
              void yemKaynagiKaydet(id);
              setSecili([]);
              setSonuc(null);
            }}
          />
        ))}
      </View>
      <View style={s.chipSatir}>
        <Chip t="Stokla plan" sec={mod === 'elimdeki'} onPress={() => { setMod('elimdeki'); setAdim(1); }} />
        <Chip t="Karışım şablonu" sec={mod === 'hazir'} onPress={() => setMod('hazir')} />
        <Chip t="Kendi rasyonum" sec={mod === 'kendi'} onPress={() => setMod('kendi')} />
      </View>

      {mod !== 'kendi' ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
          Ort. {kgF(ortKg)}{tartimli ? ' (son tartım)' : ' (varsayılan)'}
          {mod === 'elimdeki' ? ` · adım ${adim}/3` : ''}
          {mod === 'hazir' && !hazirId ? ` · önerilen aşama: ${HAZIR_RASYONLAR.find((h) => h.id === onerilenId)?.ad ?? '—'} (kayıtlı değil)` : ''}
        </Text>
      ) : null}

      {mod === 'kendi' ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Yemleri ve kg/baş/gün miktarlarını tamamen kendin gir.</Text>
          {p.duzen ? <Btn t="Elle rasyon gir →" birincil onPress={p.onKendi} /> : null}
        </View>
      ) : mod === 'hazir' ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
            Çiftlik karışımı referans şablonu — ticari starter/complet yem değildir. Ticari yemde «Stokla plan» + stoktaki ürün kullanın.
          </Text>
          {yemKaynagi === 'ticari' ? (
            <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 6 }}>
              Ticari mod: yüzde şablonu yerine stoktaki hazır yemi kg/baş ile planlayın.
            </Text>
          ) : null}
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>Şablon seçimi — kayıtlı plan değildir</Text>
          <View style={s.chipSatir}>
            {HAZIR_RASYONLAR.map((h) => (
              <Chip key={h.id} t={`${h.ad}${duzenler[h.id] ? ' ✎' : ''}`} sec={hazirId === h.id} onPress={() => setHazirId(h.id)} />
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginVertical: 6 }}>{hazir.aciklama}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: colors.text, flex: 1 }}>Günlük yem (kg/baş, yedirildiği hâli)</Text>
            <TextInput value={gunlukStr} onChangeText={setGunlukStr} placeholder={String(g.yemKg).replace('.', ',')} placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" style={[inp, { width: 90, textAlign: 'right' }]} />
          </View>

          <Text style={[s.etiket, { color: colors.text }]}>Besleme planı (stokta olanlar)</Text>
          {hazirStok.stokta.length ? (
            hazirStok.stokta.map((k) => (
              <View key={k.stockId} style={[s.satir, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>{k.ad}</Text>
                <Text style={{ color: colors.textSecondary, width: 88, textAlign: 'right' }}>{kgF(k.kgBasGunPlan)}/baş</Text>
                <Text style={{ color: colors.textSecondary, width: 72, textAlign: 'right', fontSize: 11 }}>{kgF(k.stokKg)} stok</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.danger, fontSize: 13 }}>Stokta şablondan eşleşen yem yok.</Text>
          )}

          {hazirStok.eksik.length ? (
            <View style={[s.form, { borderColor: colors.warning, marginTop: 10 }]}>
              <Text style={{ color: colors.warning, fontWeight: '800' }}>Alış / eksik listesi</Text>
              {hazirStok.eksik.map((k) => (
                <Text key={k.ad} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                  {k.ad} · {kgF(k.kgBasGun)}/baş/gün · padok {kgF(k.gunlukPadokKg)}/gün
                </Text>
              ))}
            </View>
          ) : null}

          {hazirStok.stokKontrol ? (
            <>
              <Text style={[s.etiket, { color: colors.text, marginTop: 10 }]}>Besin kontrolü (yalnız stoktaki miktarlar)</Text>
              <Kontrol k={hazirStok.stokKontrol} />
            </>
          ) : null}

          <Pressable onPress={() => setSablonAcik((v) => !v)} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.tint, fontWeight: '700' }}>{sablonAcik ? '▼' : '▶'} Referans karışım (% ve düzenleme)</Text>
          </Pressable>
          {sablonAcik ? (
            <>
              {karisim.map((k, i) => (
                <View key={k.ad + i} style={[s.satir, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, flex: 1 }}>{k.ad}</Text>
                  <TextInput
                    value={String(k.yuzde).replace('.', ',')}
                    onChangeText={(t) => karisimYaz(karisim.map((x, j) => (j === i ? { ...x, yuzde: sayiOku(t) ?? 0 } : x)))}
                    keyboardType="decimal-pad"
                    style={[inp, { width: 70, textAlign: 'right', paddingVertical: 4 }]}
                  />
                  <Text style={{ color: colors.textSecondary, width: 70, textAlign: 'right' }}>{kgF(hazirKalemler.find((h) => h.ad === k.ad)?.kgBasGun ?? 0)}</Text>
                </View>
              ))}
              <Text style={[s.etiket, { color: colors.textSecondary, marginTop: 6 }]}>Şablon hedefi (tam karışım — referans)</Text>
              <Kontrol k={hazirStok.referansKontrol} />
            </>
          ) : null}

          {hazirStok.uyarilar.map((u) => (
            <Text key={u} style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{u}</Text>
          ))}
          {p.finans && hazirStok.stokta.length ? (
            <Text style={{ color: colors.text, fontWeight: '800', marginTop: 6 }}>
              {tlF(hazirTl)}/baş/gün (stok kalemleri){fiyatsiz ? ` · ${fiyatsiz} tahmini fiyat` : ''}
            </Text>
          ) : null}
          <Uzman />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <Btn t="Varsayılana dön" onPress={() => { karisimYaz(null); setGunlukStr(''); }} />
            {p.duzen && hazirStok.uygulanabilir ? (
              <Btn
                t="Stokla kaydet"
                birincil
                onPress={() =>
                  void uygula(
                    `${hazir.ad} (stok)`,
                    hazirStok.stokta.map((k) => ({ ad: k.ad, stockId: k.stockId, kgBasGun: k.kgBasGunPlan })),
                    true,
                  )
                }
              />
            ) : null}
            {p.duzen && hazirStok.kismiKayit && !hazirStok.uygulanabilir ? (
              <Btn
                t="Kısmi plan (stoktakiler)"
                onPress={() =>
                  void uygula(
                    `${hazir.ad} (kısmi)`,
                    hazirStok.stokta.map((k) => ({ ad: k.ad, stockId: k.stockId, kgBasGun: k.kgBasGunPlan })),
                    false,
                  )
                }
              />
            ) : null}
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 8 }}>
          {adim === 1 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Padok seçin, sonra besi dönemi.</Text>
              <Btn t="İleri → dönem" birincil onPress={() => parti && setAdim(2)} />
            </View>
          ) : null}
          {adim >= 2 ? (
            <>
              <Text style={[s.etiket, { color: colors.textSecondary }]}>Besleme dönemi (faz — yem kaynağı değil)</Text>
              <View style={s.chipSatir}>
                {(Object.keys(PHASE_LABELS) as RationPhase[]).map((f) => (
                  <Chip key={f} t={PHASE_LABELS[f]} sec={faz === f} onPress={() => { setFaz(f); setSonuc(null); }} />
                ))}
              </View>
              {adim === 2 ? <Btn t="İleri → yemler" birincil onPress={() => setAdim(3)} /> : null}
            </>
          ) : null}
          {adim >= 3 ? (
            <>
              <Text style={[s.etiket, { color: colors.textSecondary, marginTop: 8 }]}>Stoktaki yemler (miktar &gt; 0)</Text>
              <View style={s.chipSatir}>
                {stoktakiYemler.length ? (
                  stoktakiYemler.map((y) => {
                    const ad = standartYem(y.name)?.ad ?? y.name;
                    const var_ = secili.some((m) => m.ad === ad || m.stockId === y.id);
                    return (
                      <Chip
                        key={y.id}
                        t={`${y.name} · ${kgF(y.quantity)}`}
                        sec={var_}
                        onPress={() => {
                          setSonuc(null);
                          if (var_) setSecili(secili.filter((m) => m.stockId !== y.id && m.ad !== ad));
                          else setSecili([...secili, malzemeOlustur(ad, p.fiyatlar[y.id] ?? 0, y.id)]);
                        }}
                      />
                    );
                  })
                ) : (
                  <Text style={{ color: colors.danger, fontSize: 13 }}>Yem stoğu boş — önce alım girin.</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput value={ozelAd} onChangeText={setOzelAd} placeholder="Stoktaki başka yem adı" placeholderTextColor={colors.textSecondary} style={[inp, { flex: 1 }]} />
            <Btn
              t="+ Ekle"
              onPress={() => {
                const ad = ozelAd.trim();
                if (!ad || secili.some((m) => m.ad === ad)) return;
                const st = stokEsle(ad);
                setSecili([...secili, malzemeOlustur(ad, st ? p.fiyatlar[st.id] ?? 0 : 0, st?.id)]);
                setOzelAd('');
                setAcikBesin(ad);
              }}
            />
          </View>
          {secili.length ? (
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>
              {yemAnalizOzeti({ name: secili[0].ad, notes: '' }).uyari}
            </Text>
          ) : null}
          {secili.map((m, i) => {
            const set = (alan: keyof Malzeme, v: number | boolean) => { setSonuc(null); setSecili(secili.map((x, j) => (j === i ? { ...x, [alan]: v } : x))); };
            return (
              <View key={m.ad} style={[s.satir, { borderColor: colors.border, flexWrap: 'wrap' }]}>
                <Pressable style={{ flex: 1 }} onPress={() => setAcikBesin(acikBesin === m.ad ? null : m.ad)}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{m.ad}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    KM %{m.km} · ME {m.me} · HP %{m.hp} · {m.kaba ? 'kaba' : 'kesif'}{m.tahmini ? ' · fiyat tahmini' : ''} {acikBesin === m.ad ? '▲' : '✎'}
                  </Text>
                </Pressable>
                <TextInput value={m.fiyatKg ? String(m.fiyatKg).replace('.', ',') : ''} onChangeText={(t) => { setSonuc(null); setSecili(secili.map((x, j) => (j === i ? { ...x, fiyatKg: sayiOku(t) ?? 0, tahmini: false } : x))); }} placeholder="₺/kg" placeholderTextColor={colors.danger} keyboardType="decimal-pad" style={[inp, { width: 76, textAlign: 'right', paddingVertical: 4 }]} />
                {acikBesin === m.ad ? (
                  <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {(['km', 'me', 'hp', 'ca', 'p'] as const).map((a) => (
                      <View key={a} style={{ width: 60 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{a === 'km' ? 'KM %' : a === 'me' ? 'ME MJ' : a === 'hp' ? 'HP %' : a === 'ca' ? 'Ca %' : 'P %'}</Text>
                        <TextInput defaultValue={String(m[a]).replace('.', ',')} onChangeText={(t) => set(a, sayiOku(t) ?? 0)} keyboardType="decimal-pad" style={[inp, { paddingVertical: 4, fontSize: 14 }]} />
                      </View>
                    ))}
                    <Chip t={m.kaba ? 'Kaba yem' : 'Kesif yem'} sec={m.kaba} onPress={() => set('kaba', !m.kaba)} />
                  </View>
                ) : null}
              </View>
            );
          })}
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
            Besin değerleri NRC (2007) / Feedipedia ortalamaları; yeme dokunup düzenleyebilirsin. Fiyat yem stoğundan gelir, yoksa yaz.
          </Text>
          <View style={{ marginTop: 10 }}>
            <Btn t="En ucuz rasyonu hesapla" birincil onPress={() => setSonuc(enUcuzRasyon(secili, g))} />
          </View>
          {sonuc ? (
            <View style={[s.form, { borderColor: sonuc.uygun ? colors.success : colors.danger }]}>
              {sonuc.kalemler.map((k) => (
                <View key={k.ad} style={[s.satir, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.text, flex: 1 }}>{k.ad}</Text>
                  <Text style={{ color: colors.text, fontWeight: '700', width: 80, textAlign: 'right' }}>{kgF(k.kgBasGun)}</Text>
                  {p.finans ? <Text style={{ color: colors.textSecondary, width: 70, textAlign: 'right' }}>{tlF(k.tlBasGun)}</Text> : null}
                </View>
              ))}
              {p.finans ? (
                <Text style={{ color: colors.text, fontWeight: '800', marginTop: 6 }}>
                  {tlF(sonuc.tlBasGun)}/baş/gün · padok {tlF(sonuc.tlBasGun * bas)}/gün
                </Text>
              ) : null}
              <Kontrol k={sonuc.kontrol} />
              {sonuc.uyarilar.map((u) => (
                <Text key={u} style={{ color: colors.danger, marginTop: 4 }}>⚠️ {u}</Text>
              ))}
              {secili.some((m) => !m.fiyatKg) ? <Text style={{ color: colors.warning, marginTop: 4 }}>Fiyatı girilmeyen yem bedava sayıldı.</Text> : null}
              <Uzman />
              {p.duzen && sonuc.kalemler.length && sonuc.uygun ? (
                <View style={{ marginTop: 10 }}>
                  <Btn t="Stokla kaydet" birincil onPress={() => void uygula('Stokla plan', sonuc.kalemler, true)} />
                </View>
              ) : null}
              {sonuc && !sonuc.uygun ? (
                <Text style={{ color: colors.danger, marginTop: 8, fontSize: 12 }}>
                  Hedefler karşılanamıyor — kayıt yok; eksik yem ekleyin veya uyarıları düzeltin.
                </Text>
              ) : null}
            </View>
          ) : null}
            </>
          ) : null}
        </View>
      )}
      {hata ? <Text style={{ color: colors.danger, marginTop: 6 }}>{hata}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  etiket: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  btn: { borderRadius: 10, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 7 },
  form: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginTop: 10 },
});
