import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { onayla } from '@/bilesenler/ciftlesme/ortak';
import { getAktifModId, getMod } from '@/sabitler/Modlar';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { ASI_PROGRAMI, asiKategori } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  BOLGELER,
  IRKLAR,
  ONERI_ETIKETI,
  adimDuzenle,
  adimEkle,
  adimSil,
  adimVarsayilanaDon,
  ayarFarkli,
  bosDuzenleme,
  degisiklikSayisi,
  etkinProgram,
  getCiftlikAyar,
  getDuzenleme,
  getUretimAyari,
  katalogAd,
  programUygula,
  saveCiftlikAyar,
  saveDuzenleme,
  trakyaDurumu,
  varsayilanProgram,
  type Bolge,
  type EtkinAdim,
  type Irk,
  type ProgramBolum,
  type ProgramDuzenleme,
  type UretimAyari,
} from '@/kaynak/saglik-programi';

const BOLUM_AD: Record<ProgramBolum, string> = { asi: 'Aşılar', parazit: 'İlaçlar (parazit)', vitamin: 'Vitaminler' };

function bolumKatalog(b: ProgramBolum): { id: string; ad: string }[] {
  if (b === 'vitamin') return VITAMIN_PROGRAMI.map((v) => ({ id: v.id, ad: v.ad }));
  return ASI_PROGRAMI.filter((p) => (asiKategori(p) === 'parazit') === (b === 'parazit')).map((p) => ({ id: p.id, ad: p.ad }));
}

export default function SaglikProgramiScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const [modId, setModId] = useState<string>('mod1');
  const [ayar, setAyar] = useState<Omit<UretimAyari, 'modId'> | null>(null);
  const [uretim, setUretim] = useState<UretimAyari | null>(null);
  const [duz, setDuz] = useState<ProgramDuzenleme>(bosDuzenleme());
  const [padoklar, setPadoklar] = useState<string[]>([]);
  const [acik, setAcik] = useState<string | null>(null);
  const [ekleAcik, setEkleAcik] = useState<ProgramBolum | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [partiAcik, setPartiAcik] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [m, a, u, d, an] = await Promise.all([getAktifModId(), getCiftlikAyar(), getUretimAyari(), getDuzenleme(), getAnimals()]);
        setModId(m);
        setAyar(a);
        setUretim(u);
        setDuz(d);
        setPadoklar([...new Set(an.filter((x) => x.status !== 'sold' && x.status !== 'dead').map((x) => x.paddock).filter(Boolean))].sort());
      })().catch(() => {});
    }, []),
  );

  const mod1 = modId === 'mod1';
  const mevcutAyar: UretimAyari | null = ayar ? { modId, ...ayar } : null;
  const kullanilan: UretimAyari | null = uretim ?? mevcutAyar;
  const varsayilan = useMemo(() => (kullanilan ? varsayilanProgram(kullanilan) : []), [kullanilan]);
  const adimlar = useMemo(() => etkinProgram(varsayilan, duz), [varsayilan, duz]);
  const yeniOneri = !!(uretim && mevcutAyar && ayarFarkli(uretim, mevcutAyar));

  const kaydet = async (d: ProgramDuzenleme, u: UretimAyari | null = kullanilan) => {
    setDuz(d);
    if (!u) return;
    if (mod1) {
      await programUygula(u, d);
      setUretim(u);
      setMesaj('Program sağlık planına, alarmlara ve takvime uygulandı.');
    } else {
      await saveDuzenleme(d);
    }
  };

  const ayarDegistir = async (yama: Partial<Omit<UretimAyari, 'modId'>>) => {
    if (!ayar) return;
    const yeni = { ...ayar, ...yama };
    setAyar(yeni);
    await saveCiftlikAyar(yeni);
    if (!uretim && mod1) {
      await programUygula({ modId, ...yeni }, duz);
      setUretim({ modId, ...yeni });
    }
  };

  const yenidenOlustur = () =>
    onayla(
      'Program yeni bölge/ırk bilgisine göre yeniden oluşturulsun mu? Senin yaptığın değişiklikler korunur.',
      () => mevcutAyar && kaydet(duz, mevcutAyar),
      'Yeniden oluştur',
    );

  const tumunuSifirla = () =>
    onayla('Tüm program varsayılana dönsün mü? Yaptığın bütün değişiklikler silinir.', () => kaydet(bosDuzenleme()), 'Varsayılana dön');

  if (!ayar) return null;

  const Chip = ({ secili, etiket, onPress }: { secili: boolean; etiket: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[s.chip, { borderColor: secili ? c.tint : c.border, backgroundColor: secili ? c.tint : c.card }]}>
      <Text style={{ color: secili ? '#fff' : c.text, fontWeight: '700', fontSize: 13 }}>{etiket}</Text>
    </Pressable>
  );

  const Adim = ({ a }: { a: EtkinAdim }) => {
    const ac = acik === a.anahtar;
    const sayi = (alan: 'gunSonra' | 'tekrarGun', d: number) => {
      const deger = alan === 'gunSonra' ? a.gunSonra : a.tekrarGun ?? 0;
      const yeni = Math.max(0, deger + d);
      kaydet(adimDuzenle(duz, a, alan === 'gunSonra' ? { gunSonra: yeni } : { tekrarGun: yeni || null }));
    };
    return (
      <View style={[s.kart, { backgroundColor: c.card, borderColor: a.degisti ? c.warning : c.border }]}>
        <Pressable onPress={() => setAcik(ac ? null : a.anahtar)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[s.ad, { color: c.text, flex: 1 }]}>{katalogAd(a.programId)}</Text>
            {a.degisti ? (
              <Text style={[s.rozet, { color: c.warning, borderColor: c.warning }]}>{a.eklendi ? 'eklendi' : 'değiştirildi'}</Text>
            ) : null}
            <Text style={{ color: c.tint, fontWeight: '800' }}>{ac ? '▲' : '▼'}</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2 }}>
            {a.gunSonra === 0 ? 'Girişte' : `Girişten ${a.gunSonra} gün sonra`} · {a.tekrarGun ? `her ${a.tekrarGun} günde tekrar` : 'tek doz'}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>{a.doz}</Text>
          {a.padoklar?.length ? <Text style={{ color: c.tint, fontSize: 12 }}>Yalnız: {a.padoklar.join(', ')}</Text> : null}
          <Text style={{ color: c.tint, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Neden: {a.neden}</Text>
        </Pressable>
        {ac ? (
          <View style={{ marginTop: 10, gap: 8 }}>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>İlaç / aşı</Text>
            <View style={s.sarmal}>
              {bolumKatalog(a.bolum).map((k) => (
                <Chip key={k.id} secili={k.id === a.programId} etiket={k.ad} onPress={() => kaydet(adimDuzenle(duz, a, { programId: k.id }))} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {(
                [
                  ['gunSonra', 'Gün', a.gunSonra, 1],
                  ['tekrarGun', 'Tekrar (gün)', a.tekrarGun ?? 0, 30],
                ] as const
              ).map(([alan, et, deger, adimBoy]) => (
                <View key={alan}>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>{et}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable onPress={() => sayi(alan, -adimBoy)} style={[s.adim, { borderColor: c.border }]}>
                      <Text style={{ color: c.text, fontWeight: '800' }}>−</Text>
                    </Pressable>
                    <Text style={{ color: c.text, fontWeight: '800', minWidth: 32, textAlign: 'center' }}>
                      {alan === 'tekrarGun' && !deger ? 'yok' : deger}
                    </Text>
                    <Pressable onPress={() => sayi(alan, adimBoy)} style={[s.adim, { borderColor: c.border }]}>
                      <Text style={{ color: c.text, fontWeight: '800' }}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>Doz kuralı</Text>
            <TextInput
              defaultValue={a.doz}
              onEndEditing={(e) => kaydet(adimDuzenle(duz, a, { doz: e.nativeEvent.text }))}
              onBlur={(e) => {
                const t = (e as unknown as { nativeEvent: { text?: string }; target?: { value?: string } }).target?.value;
                if (t != null && t !== a.doz) kaydet(adimDuzenle(duz, a, { doz: t }));
              }}
              style={[s.input, { color: c.text, borderColor: c.border }]}
            />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {a.degisti && !a.eklendi ? (
                <Pressable
                  onPress={() => onayla(`${katalogAd(a.programId)} varsayılana dönsün mü?`, () => kaydet(adimVarsayilanaDon(duz, a.anahtar)), 'Varsayılana dön')}
                  style={[s.btn, { borderColor: c.tint }]}>
                  <Text style={{ color: c.tint, fontWeight: '700' }}>↺ Varsayılana dön</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => onayla(`${katalogAd(a.programId)} programdan çıkarılsın mı?`, () => kaydet(adimSil(duz, a)), 'Çıkar')}
                style={[s.btn, { borderColor: c.warning }]}>
                <Text style={{ color: c.warning, fontWeight: '700' }}>× Programdan çıkar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const trakya = trakyaDurumu(ayar.bolge, ayar.il);
  const silinenler = duz.silinen.filter((id) => varsayilan.some((v) => v.programId === id));

  return (
    <>
      <Stack.Screen options={{ title: 'Sağlık programı' }} />
      <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={s.scroll}>
        <Text style={[s.baslik, { color: c.text }]}>Bölge ve ırka göre sağlık programı</Text>
        <Text style={{ color: c.textSecondary, marginBottom: 4 }}>{getMod(modId as never)?.baslik ?? modId}</Text>
        <View style={[s.uyari, { borderColor: c.warning }]}>
          <Text style={{ color: c.warning, fontWeight: '800' }}>⚠️ {ONERI_ETIKETI}</Text>
        </View>
        {!mod1 ? (
          <Text style={{ color: c.textSecondary, marginVertical: 8 }}>
            Yakında: bu mod için program önizlemedir; Aşı ve İlaç şimdilik yalnız Mod 1'de uygulanıyor.
          </Text>
        ) : null}

        <Text style={[s.alt, { color: c.text }]}>Çiftlik ayarları</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>Bölge</Text>
        <View style={s.sarmal}>
          {BOLGELER.map((b) => (
            <Chip key={b.id} secili={ayar.bolge === b.id} etiket={b.ad} onPress={() => ayarDegistir({ bolge: b.id as Bolge })} />
          ))}
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 8 }}>İl (isteğe bağlı)</Text>
        <TextInput
          defaultValue={ayar.il ?? ''}
          placeholder="Örn. Edirne"
          placeholderTextColor={c.textSecondary}
          onEndEditing={(e) => ayarDegistir({ il: e.nativeEvent.text.trim() || undefined })}
          onBlur={(e) => {
            const t = (e as unknown as { target?: { value?: string } }).target?.value;
            if (t != null && t.trim() !== (ayar.il ?? '')) ayarDegistir({ il: t.trim() || undefined });
          }}
          style={[s.input, { color: c.text, borderColor: c.border }]}
        />
        {trakya !== 'degil' ? (
          <Text style={{ color: c.tint, fontSize: 12 }}>
            {trakya === 'trakya' ? 'Trakya: şaptan aşılı ari bölge, PPR aşılaması yapılmıyor.' : 'Avrupa yakasındaysan Trakya kuralları geçerli (PPR aşısı yok).'}
          </Text>
        ) : null}
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 8 }}>Irk (çiftlik geneli)</Text>
        <View style={s.sarmal}>
          {IRKLAR.map((i) => (
            <Chip key={i.id} secili={ayar.irk === i.id} etiket={i.ad} onPress={() => ayarDegistir({ irk: i.id as Irk })} />
          ))}
        </View>
        {padoklar.length ? (
          <>
            <Pressable onPress={() => setPartiAcik(!partiAcik)}>
              <Text style={{ color: c.tint, fontSize: 13, fontWeight: '700', marginTop: 10 }}>
                Parti ırkı (farklıysa) {partiAcik ? '▲' : '▼'}
                {Object.keys(ayar.partiIrk ?? {}).length ? ` · ${Object.entries(ayar.partiIrk ?? {}).map(([k, v]) => `${k}: ${IRKLAR.find((i) => i.id === v)?.ad}`).join(', ')}` : ''}
              </Text>
            </Pressable>
            {partiAcik && padoklar.map((p) => (
              <View key={p} style={{ marginTop: 4 }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>{p}</Text>
                <View style={s.sarmal}>
                  <Chip secili={!ayar.partiIrk?.[p]} etiket="Çiftlik ırkı" onPress={() => {
                    const pi = { ...(ayar.partiIrk ?? {}) };
                    delete pi[p];
                    ayarDegistir({ partiIrk: pi });
                  }} />
                  {IRKLAR.filter((i) => i.id !== ayar.irk).map((i) => (
                    <Chip key={i.id} secili={ayar.partiIrk?.[p] === i.id} etiket={i.ad} onPress={() => ayarDegistir({ partiIrk: { ...(ayar.partiIrk ?? {}), [p]: i.id as Irk } })} />
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : null}

        {yeniOneri ? (
          <Pressable onPress={yenidenOlustur} style={[s.anaBtn, { backgroundColor: c.tint }]}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Bölge/ırk değişti — programı yeniden oluştur (değişikliklerin korunur)</Text>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <Text style={[s.alt, { color: c.text, flex: 1, marginTop: 0 }]}>Program ({adimlar.length} adım)</Text>
          {degisiklikSayisi(duz) ? (
            <Pressable onPress={tumunuSifirla} style={[s.btn, { borderColor: c.tint }]}>
              <Text style={{ color: c.tint, fontWeight: '700' }}>↺ Tümünü varsayılana dön</Text>
            </Pressable>
          ) : null}
        </View>
        {mesaj ? <Text style={{ color: c.tint, fontSize: 12 }}>{mesaj}</Text> : null}
        {(['parazit', 'asi', 'vitamin'] as ProgramBolum[]).map((b) => (
          <View key={b}>
            <Text style={[s.bolum, { color: c.textSecondary }]}>{BOLUM_AD[b]}</Text>
            {adimlar.filter((a) => a.bolum === b).map((a) => (
              <Adim key={a.anahtar} a={a} />
            ))}
            <Pressable onPress={() => setEkleAcik(ekleAcik === b ? null : b)}>
              <Text style={{ color: c.tint, fontWeight: '700', marginVertical: 6 }}>+ Adım ekle</Text>
            </Pressable>
            {ekleAcik === b ? (
              <View style={s.sarmal}>
                {bolumKatalog(b)
                  .filter((k) => !adimlar.some((a) => a.programId === k.id))
                  .map((k) => (
                    <Chip key={k.id} secili={false} etiket={k.ad} onPress={() => { setEkleAcik(null); kaydet(adimEkle(duz, k.id, varsayilan)); }} />
                  ))}
              </View>
            ) : null}
          </View>
        ))}
        {silinenler.length ? (
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 8 }}>
            Çıkardığın önerilen adımlar: {silinenler.map(katalogAd).join(', ')} (geri eklemek için “+ Adım ekle”)
          </Text>
        ) : null}
        <Pressable onPress={() => router.push('/gorevler/asi' as never)} style={{ marginTop: 16 }}>
          <Text style={{ color: c.tint, fontWeight: '800' }}>Aşı ve İlaç planına git →</Text>
        </Pressable>
        <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 16 }}>
          Kaynaklar: Tarım ve Orman Bakanlığı genelgeleri (2021/04, 2025/9) ve aşılama verileri; Sağlık Bakanlığı şarbon raporu
          (2007–2019); üniversite çalışmaları (karaciğer kelebeği, beyaz kas hastalığı, agalaksi). Parazit ayları iklime göre yaklaşıktır.
        </Text>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  baslik: { fontSize: 20, fontWeight: '800' },
  alt: { fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  bolum: { fontSize: 13, fontWeight: '800', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
  uyari: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 6 },
  sarmal: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  kart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  ad: { fontSize: 15, fontWeight: '800' },
  rozet: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, fontSize: 11, fontWeight: '800' },
  adim: { borderWidth: 1, borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 4 },
  btn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  anaBtn: { borderRadius: 10, padding: 12, marginTop: 12, alignItems: 'center' },
});
