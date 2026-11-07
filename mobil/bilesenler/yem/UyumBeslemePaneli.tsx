import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { yerelGun } from '@/kaynak/arinma/depo';
import { getAnimals, getAllHealthRecordsForAsi } from '@/kaynak/cekirdek/veritabani';
import { getAktifTakipler } from '@/kaynak/akilli-veteriner/takip';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import {
  UYUM_GUN_SECENEKLERI,
  uyumDonemDurumu,
  uyumEtkinBitis,
  uyumIncelemeMetni,
  uyumUyariMetni,
  type UyumBeslemeKayit,
  type UyumGunSayisi,
  type UyumIncelemeKararTipi,
} from '@/kaynak/yem/uyum-besleme';
import { UYUM_FAZ_BASLIK, uyumUzatmaOneriBitis } from '@/kaynak/yem/uyum-inceleme';
import { uyumVeterinerOzeti } from '@/kaynak/yem/uyum-veteriner-baglam';
import { uyumHayvanKarantinaAktar, uyumKarantinaPadokSecenekleri } from '@/kaynak/yem/uyum-karantina-aktar';
import {
  padokUyumKaydi,
  uyumIncelemeKararKaydet,
  uyumIncelemeKaydet,
  uyumKaydet,
  uyumKayitlariniOku,
} from '@/kaynak/yem/uyum-besleme-kayit';

const gunTR = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

export function UyumBeslemePaneli(p: {
  padok: string;
  rasyonId?: string | null;
  duzen: boolean;
  onKaydedildi?: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [acik, setAcik] = useState(false);
  const [kayit, setKayit] = useState<UyumBeslemeKayit | null>(null);
  const [gun, setGun] = useState<UyumGunSayisi>(2);
  const [baslangic, setBaslangic] = useState(yerelGun());
  const [istah, setIstah] = useState('');
  const [diski, setDiski] = useState('');
  const [rumen, setRumen] = useState('');
  const [genel, setGenel] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [kararTip, setKararTip] = useState<UyumIncelemeKararTipi | null>(null);
  const [neden, setNeden] = useState('');
  const [sonrakiInceleme, setSonrakiInceleme] = useState('');
  const [supheNotu, setSupheNotu] = useState('');
  const [hedefPadok, setHedefPadok] = useState('');
  const [karantinaPadoklari, setKarantinaPadoklari] = useState<string[]>([]);
  const [padokHayvanlari, setPadokHayvanlari] = useState<{ id: string; etiket: string }[]>([]);
  const [seciliHayvanlar, setSeciliHayvanlar] = useState<string[]>([]);

  const yukle = useCallback(async () => {
    const l = await uyumKayitlariniOku();
    const k = padokUyumKaydi(l, p.padok);
    setKayit(k);
    if (k) {
      setGun(k.gunSayisi);
      setBaslangic(k.baslangic);
      setIstah(k.gozlem?.istah ?? '');
      setDiski(k.gozlem?.diski ?? '');
      setRumen(k.gozlem?.rumen ?? '');
      setGenel(k.gozlem?.genel ?? '');
    }
    const animals = await getAnimals();
    const ph = animals
      .filter((a) => a.paddock.trim() === p.padok.trim() && a.status !== 'sold' && a.status !== 'dead')
      .map((a) => ({ id: a.id, etiket: hayvanAnaEtiket(a) }));
    setPadokHayvanlari(ph);
    setKarantinaPadoklari(await uyumKarantinaPadokSecenekleri());
  }, [p.padok]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const bugun = yerelGun();
  const durum = uyumDonemDurumu(kayit, bugun);
  const bitis = kayit ? uyumEtkinBitis(kayit) : null;
  const inceleme = uyumIncelemeMetni(durum, bitis ?? bugun);

  const vetOzet = useMemo(() => {
    if (!seciliHayvanlar.length) return null;
    return uyumVeterinerOzeti(seciliHayvanlar, [], []);
  }, [seciliHayvanlar]);

  useEffect(() => {
    if (kararTip !== 'karantina_suphe' || !seciliHayvanlar.length) return;
    void (async () => {
      const saglik = await getAllHealthRecordsForAsi();
      const takipler = await getAktifTakipler();
      setVetOzetState(
        uyumVeterinerOzeti(
          seciliHayvanlar,
          saglik.map((s) => ({
            animalId: s.animalId,
            recordType: s.recordType,
            treatment: s.treatment,
            medicine: s.medicine,
            diagnosis: s.diagnosis,
            vetName: s.vetName,
          })),
          takipler.map((t) => ({
            animalId: t.animalId,
            asama: t.asama,
            tedaviUygulandi: t.tedaviUygulandi,
            vetDanisildi: t.vetDanisildi,
          })),
        ),
      );
    })();
  }, [kararTip, seciliHayvanlar]);

  const [vetOzetState, setVetOzetState] = useState(vetOzet);

  useEffect(() => {
    if (!hedefPadok && karantinaPadoklari.length) setHedefPadok(karantinaPadoklari[0]!);
    if (!sonrakiInceleme && kayit) setSonrakiInceleme(uyumUzatmaOneriBitis(bugun, 2));
  }, [karantinaPadoklari, hedefPadok, sonrakiInceleme, kayit, bugun]);

  const gozlemKaydet = async () => {
    if (!kayit || !p.duzen) return;
    setMesgul(true);
    try {
      const k = await uyumIncelemeKaydet(
        kayit.id,
        {
          istah: istah.trim() || undefined,
          diski: diski.trim() || undefined,
          rumen: rumen.trim() || undefined,
          genel: genel.trim() || undefined,
        },
        kayit.incelemeOnay ?? false,
      );
      setKayit(k);
    } finally {
      setMesgul(false);
    }
  };

  const kararKaydet = async () => {
    if (!kayit || !p.duzen || !kararTip) return;
    setHata(null);
    setMesgul(true);
    try {
      await gozlemKaydet();
      if (kararTip === 'karantina_suphe') {
        for (const id of seciliHayvanlar) {
          const r = await uyumHayvanKarantinaAktar(id, hedefPadok, supheNotu, neden);
          if (!r.ok) throw new Error(r.message);
        }
      }
      const k = await uyumIncelemeKararKaydet(kayit.id, {
        karar: kararTip,
        neden: neden.trim(),
        sonrakiInceleme: kararTip === 'gozlem_uzat' ? sonrakiInceleme : undefined,
        hayvanIds: kararTip === 'karantina_suphe' ? seciliHayvanlar : [],
        supheNotu: kararTip === 'karantina_suphe' ? supheNotu : undefined,
        hedefPadok: kararTip === 'karantina_suphe' ? hedefPadok : undefined,
      });
      setKayit(k);
      setKararTip(null);
      p.onKaydedildi?.();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const kaydet = async () => {
    if (!p.duzen) return;
    setHata(null);
    setMesgul(true);
    try {
      const k = await uyumKaydet({
        id: kayit?.id,
        padok: p.padok,
        rasyonId: p.rasyonId ?? undefined,
        baslangic,
        gunSayisi: gun,
      });
      setKayit(k);
      p.onKaydedildi?.();
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    } finally {
      setMesgul(false);
    }
  };

  const incelemeAcik =
    durum === 'inceleme_gerekli' || durum === 'devam' || durum === 'gozlem_uzatildi' || durum === 'onaylandi';

  const toggleHayvan = (id: string) => {
    setSeciliHayvanlar((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const gosterilenVet = vetOzetState ?? vetOzet;

  return (
    <View style={[s.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={() => setAcik((v) => !v)}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
          {acik ? '▼' : '▶'} {UYUM_FAZ_BASLIK} (isteğe bağlı uyum beslemesi)
        </Text>
      </Pressable>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16 }}>{uyumUyariMetni()}</Text>

      {acik ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          {!kayit ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Bu padok için kayıtlı uyum dönemi yok.</Text>
          ) : (
            <Text style={{ color: colors.text, fontSize: 13 }}>
              Dönem: {gunTR(kayit.baslangic)} – {bitis ? gunTR(bitis) : '—'} · {kayit.gunSayisi} gün · durum: {durum}
              {kayit.rasyonId ? ' · bağlı plan id var' : ' · bağlı rasyon planı yok'}
            </Text>
          )}
          {inceleme ? <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 12 }}>{inceleme}</Text> : null}

          {kayit?.incelemeKararlari?.length ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>İnceleme geçmişi</Text>
              {kayit.incelemeKararlari.map((k) => (
                <Text key={k.id} style={{ color: colors.text, fontSize: 11 }}>
                  {gunTR(k.zaman.slice(0, 10))} · {k.karar}
                  {k.hayvanIds.length ? ` · ${k.hayvanIds.length} hayvan` : ''}
                  {k.neden ? ` — ${k.neden}` : ''}
                </Text>
              ))}
            </View>
          ) : null}

          {p.duzen ? (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Başlangıç (YYYY-MM-DD)</Text>
              <TextInput
                value={baslangic}
                onChangeText={setBaslangic}
                placeholder="2026-11-07"
                placeholderTextColor={colors.textSecondary}
                style={[s.inp, { color: colors.text, borderColor: colors.border }]}
              />
              <View style={s.row}>
                {UYUM_GUN_SECENEKLERI.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGun(g)}
                    style={[
                      s.chip,
                      { borderColor: gun === g ? colors.tint : colors.border, backgroundColor: gun === g ? `${colors.tint}22` : colors.background },
                    ]}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{g} gün</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable disabled={mesgul} onPress={() => void kaydet()} style={[s.btn, { backgroundColor: colors.tint }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{mesgul ? '…' : 'Uyum planını kaydet'}</Text>
              </Pressable>

              {kayit && incelemeAcik ? (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Gözlem notları (teşhis değil)</Text>
                  {(
                    [
                      ['İştah', istah, setIstah],
                      ['Dışkı', diski, setDiski],
                      ['Rumen / genel', rumen, setRumen],
                      ['Genel durum', genel, setGenel],
                    ] as const
                  ).map(([label, v, set]) => (
                    <TextInput
                      key={label}
                      value={v}
                      onChangeText={set}
                      placeholder={label}
                      placeholderTextColor={colors.textSecondary}
                      style={[s.inp, { color: colors.text, borderColor: colors.border }]}
                    />
                  ))}

                  {(durum === 'inceleme_gerekli' || durum === 'gozlem_uzatildi') && (
                    <View style={{ gap: 6, marginTop: 6 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>İnceleme kararı (zorunlu)</Text>
                      <View style={s.row}>
                        {(
                          [
                            ['gozlem_uzat', 'Gözlemi uzat'],
                            ['besiye_gecis', 'Besiye geçiş'],
                            ['karantina_suphe', 'Şüphe → karantina'],
                          ] as const
                        ).map(([tip, label]) => (
                          <Pressable
                            key={tip}
                            onPress={() => setKararTip(tip)}
                            style={[
                              s.chip,
                              {
                                borderColor: kararTip === tip ? colors.tint : colors.border,
                                backgroundColor: kararTip === tip ? `${colors.tint}22` : colors.background,
                              },
                            ]}>
                            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>{label}</Text>
                          </Pressable>
                        ))}
                      </View>

                      <TextInput
                        value={neden}
                        onChangeText={setNeden}
                        placeholder="Gerekçe (zorunlu)"
                        placeholderTextColor={colors.textSecondary}
                        style={[s.inp, { color: colors.text, borderColor: colors.border }]}
                      />

                      {kararTip === 'gozlem_uzat' ? (
                        <TextInput
                          value={sonrakiInceleme}
                          onChangeText={setSonrakiInceleme}
                          placeholder="Yeni inceleme tarihi YYYY-MM-DD"
                          placeholderTextColor={colors.textSecondary}
                          style={[s.inp, { color: colors.text, borderColor: colors.border }]}
                        />
                      ) : null}

                      {kararTip === 'karantina_suphe' ? (
                        <>
                          <TextInput
                            value={supheNotu}
                            onChangeText={setSupheNotu}
                            placeholder="Şüphe notu — teşhis yazmayın"
                            placeholderTextColor={colors.textSecondary}
                            style={[s.inp, { color: colors.text, borderColor: colors.border }]}
                          />
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Hedef karantina padoku</Text>
                          <View style={s.row}>
                            {karantinaPadoklari.map((pad) => (
                              <Pressable
                                key={pad}
                                onPress={() => setHedefPadok(pad)}
                                style={[
                                  s.chip,
                                  {
                                    borderColor: hedefPadok === pad ? colors.tint : colors.border,
                                    backgroundColor: hedefPadok === pad ? `${colors.tint}22` : colors.background,
                                  },
                                ]}>
                                <Text style={{ color: colors.text, fontSize: 11 }}>{pad}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Taşınacak hayvanlar (grup değil)</Text>
                          {padokHayvanlari.length === 0 ? (
                            <Text style={{ color: colors.warning, fontSize: 12 }}>Padokta seçilebilir hayvan yok</Text>
                          ) : (
                            padokHayvanlari.map((h) => (
                              <Pressable key={h.id} onPress={() => toggleHayvan(h.id)} style={s.hayvanSatir}>
                                <Text style={{ color: seciliHayvanlar.includes(h.id) ? colors.tint : colors.textSecondary }}>
                                  {seciliHayvanlar.includes(h.id) ? '✓ ' : '○ '}
                                  {h.etiket}
                                </Text>
                              </Pressable>
                            ))
                          )}
                          {gosterilenVet ? (
                            <Text
                              style={{
                                color: gosterilenVet.eylemGerekli ? colors.danger : colors.textSecondary,
                                fontSize: 12,
                                lineHeight: 16,
                              }}>
                              {gosterilenVet.eylemGerekli ? '⚠ Eylem gerekli: ' : ''}
                              {gosterilenVet.ozet}
                            </Text>
                          ) : null}
                        </>
                      ) : null}

                      {kararTip ? (
                        <Pressable onPress={() => void kararKaydet()} style={[s.btn, { borderWidth: 1, borderColor: colors.tint }]}>
                          <Text style={{ color: colors.tint, fontWeight: '800' }}>
                            Kararı kaydet (otomatik rasyon/sağlık yok)
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  )}
                </View>
              ) : null}
            </>
          ) : null}
          {hata ? <Text style={{ color: colors.danger }}>{hata}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  inp: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  hayvanSatir: { paddingVertical: 4 },
});
