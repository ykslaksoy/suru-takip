/**
 * Rasyon kurma modları: Hazır rasyon · Kendi rasyonum · Elimdeki malzemeler (en düşük maliyet).
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
  hazirSec,
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
  varsayilanParti?: string;
  duzen: boolean;
  finans: boolean;
  onKendi: () => void;
  onUygulandi: (mesaj: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [mod, setMod] = useState<Mod>('hazir');
  const [parti, setParti] = useState<string | undefined>(p.varsayilanParti ?? p.partiler[0]);
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

  useEffect(() => {
    void partiOrtalamalari().then(setOrt).catch(() => undefined);
    void kaliciGetItem(KEY_HAZIR).then((r) => {
      try {
        if (r) setDuzenler(JSON.parse(r));
      } catch {}
    });
  }, []);
  useEffect(() => {
    if (!parti && p.partiler.length) setParti(p.varsayilanParti ?? p.partiler[0]);
  }, [p.partiler, p.varsayilanParti, parti]);

  const ortKg = (parti && ort[parti]) || VARSAYILAN_KG;
  const tartimli = !!(parti && ort[parti]);
  const bas = parti ? p.basSayisi[parti] ?? 0 : 0;
  const hazir = HAZIR_RASYONLAR.find((h) => h.id === (hazirId ?? hazirSec(ortKg)))!;
  const g = gereksinim(ortKg, mod === 'hazir' ? hazir.faz : faz);
  const karisim: Karisim = duzenler[hazir.id] ?? hazir.karisim;
  const gunluk = sayiOku(gunlukStr) ?? g.yemKg;

  /** stoktaki eşleşen yem (fiyat ve stockId için) */
  const stokEsle = (ad: string) => {
    const st = standartYem(ad)?.ad;
    return p.yemler.find((y) => y.name.trim().toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr')) ?? (st ? p.yemler.find((y) => standartYem(y.name)?.ad === st) : undefined);
  };

  const hazirKalemler = useMemo(() => karisimKg(karisim, gunluk), [karisim, gunluk]);
  const hazirKontrol = besinKontrol(hazirKalemler.map((k) => ({ m: malzemeOlustur(k.ad, 0), kg: k.kgBasGun })), g);
  const hazirTl = hazirKalemler.reduce((s, k) => {
    const y = stokEsle(k.ad);
    return s + k.kgBasGun * ((y && p.fiyatlar[y.id]) || standartYem(k.ad)?.tahminiFiyat || 0);
  }, 0);
  const fiyatsiz = hazirKalemler.filter((k) => {
    const y = stokEsle(k.ad);
    return !(y && p.fiyatlar[y.id]);
  }).length;

  const karisimYaz = (k: Karisim | null) => {
    const yeni = { ...duzenler };
    if (k) yeni[hazir.id] = k;
    else delete yeni[hazir.id];
    setDuzenler(yeni);
    void kaliciSetItem(KEY_HAZIR, JSON.stringify(yeni));
  };

  const uygula = async (ad: string, kalemler: { ad: string; stockId?: string; kgBasGun: number }[]) => {
    if (!parti) return setHata('Padok seç');
    setHata(null);
    setMesgul(true);
    try {
      await adliRasyonUygula(parti, ad, kalemler.map((k) => ({ ...k, stockId: k.stockId ?? stokEsle(k.ad)?.id })));
      setSonuc(null);
      p.onUygulandi(`${ad} ${parti} için uygulandı. Stokta olmayan yemler 0 kg ile eklendi.`);
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

  return (
    <View style={[s.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[s.baslik, { color: colors.text }]}>🧪 Rasyon kur</Text>
      <View style={s.chipSatir}>
        <Chip t="Hazır rasyon" sec={mod === 'hazir'} onPress={() => setMod('hazir')} />
        <Chip t="Kendi rasyonum" sec={mod === 'kendi'} onPress={() => setMod('kendi')} />
        <Chip t="Elimdeki malzemeler" sec={mod === 'elimdeki'} onPress={() => setMod('elimdeki')} />
      </View>

      {mod !== 'kendi' ? (
        <>
          <Text style={[s.etiket, { color: colors.textSecondary, marginTop: 10 }]}>Padok</Text>
          <View style={s.chipSatir}>
            {p.partiler.map((x) => (
              <Chip key={x} t={`${x} · ${p.basSayisi[x]}`} sec={parti === x} onPress={() => { setParti(x); setSonuc(null); setHazirId(null); }} />
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            Ort. {kgF(ortKg)}{tartimli ? ' (son tartım)' : ' (tartım yok, varsayılan)'} · KM {kgF(g.kmKg)}/baş · ME ≥ {g.meMJkg} · HP ≥ %{g.hpYuzde}
          </Text>
        </>
      ) : null}

      {mod === 'kendi' ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Yemleri ve kg/baş/gün miktarlarını tamamen kendin gir.</Text>
          {p.duzen ? <Btn t="Elle rasyon gir →" birincil onPress={p.onKendi} /> : null}
        </View>
      ) : mod === 'hazir' ? (
        <View style={{ marginTop: 8 }}>
          <View style={s.chipSatir}>
            {HAZIR_RASYONLAR.map((h) => (
              <Chip key={h.id} t={`${h.ad}${duzenler[h.id] ? ' ✎' : ''}`} sec={hazir.id === h.id} onPress={() => setHazirId(h.id)} />
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginVertical: 6 }}>{hazir.aciklama} · karışım %, yedirildiği hâliyle</Text>
          {karisim.map((k, i) => (
            <View key={k.ad + i} style={[s.satir, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, flex: 1 }}>{k.ad}{stokEsle(k.ad) ? '' : ' · stokta yok'}</Text>
              <TextInput
                value={String(k.yuzde).replace('.', ',')}
                onChangeText={(t) => karisimYaz(karisim.map((x, j) => (j === i ? { ...x, yuzde: sayiOku(t) ?? 0 } : x)))}
                keyboardType="decimal-pad"
                style={[inp, { width: 70, textAlign: 'right', paddingVertical: 4 }]}
              />
              <Text style={{ color: colors.textSecondary, width: 70, textAlign: 'right' }}>{kgF(hazirKalemler.find((h) => h.ad === k.ad)?.kgBasGun ?? 0)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: colors.text, flex: 1 }}>Günlük yem (kg/baş)</Text>
            <TextInput value={gunlukStr} onChangeText={setGunlukStr} placeholder={String(g.yemKg).replace('.', ',')} placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" style={[inp, { width: 90, textAlign: 'right' }]} />
          </View>
          <Kontrol k={hazirKontrol} />
          {p.finans ? (
            <Text style={{ color: colors.text, fontWeight: '800', marginTop: 6 }}>
              {tlF(hazirTl)}/baş/gün · padok {tlF(hazirTl * bas)}/gün{fiyatsiz ? ` (${fiyatsiz} yem tahmini fiyatla)` : ''}
            </Text>
          ) : null}
          <Uzman />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Btn t="Varsayılana dön" onPress={() => { karisimYaz(null); setGunlukStr(''); }} />
            </View>
            {p.duzen ? (
              <View style={{ flex: 1 }}>
                <Btn t="Uygula" birincil onPress={() => void uygula(hazir.ad, hazirKalemler)} />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 8 }}>
          <Text style={[s.etiket, { color: colors.textSecondary }]}>Dönem</Text>
          <View style={s.chipSatir}>
            {(Object.keys(PHASE_LABELS) as RationPhase[]).map((f) => (
              <Chip key={f} t={PHASE_LABELS[f]} sec={faz === f} onPress={() => { setFaz(f); setSonuc(null); }} />
            ))}
          </View>
          <Text style={[s.etiket, { color: colors.textSecondary, marginTop: 8 }]}>Elimdeki yemler</Text>
          <View style={s.chipSatir}>
            {STANDART_YEMLER.map((y) => {
              const var_ = secili.some((m) => m.ad === y.ad);
              return (
                <Chip
                  key={y.ad}
                  t={y.ad}
                  sec={var_}
                  onPress={() => {
                    setSonuc(null);
                    if (var_) setSecili(secili.filter((m) => m.ad !== y.ad));
                    else {
                      const st = stokEsle(y.ad);
                      setSecili([...secili, malzemeOlustur(y.ad, st ? p.fiyatlar[st.id] ?? 0 : 0, st?.id)]);
                    }
                  }}
                />
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput value={ozelAd} onChangeText={setOzelAd} placeholder="Başka yem (ör. Fiğ otu)" placeholderTextColor={colors.textSecondary} style={[inp, { flex: 1 }]} />
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
              {p.duzen && sonuc.kalemler.length ? (
                <View style={{ marginTop: 10 }}>
                  <Btn t="Uygula" birincil onPress={() => void uygula('En ucuz rasyon', sonuc.kalemler)} />
                </View>
              ) : null}
            </View>
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
