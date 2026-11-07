import { useCallback, useEffect, useState } from 'react';
import { UyumBolmeIncelemeFormu } from '@/bilesenler/yem/UyumBolmeIncelemeFormu';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { yerelGun } from '@/kaynak/arinma/depo';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { UyumBolmeGirdi } from '@/kaynak/yem/uyum-inceleme-bolme';
import {
  UYUM_GUN_SECENEKLERI,
  uyumDonemDurumu,
  uyumEtkinBitis,
  uyumIncelemeMetni,
  uyumUyariMetni,
  type UyumBeslemeKayit,
  type UyumGunSayisi,
} from '@/kaynak/yem/uyum-besleme';
import { UYUM_FAZ_BASLIK } from '@/kaynak/yem/uyum-inceleme';
import {
  padokUyumKaydi,
  uyumBolmeIncelemeKaydet,
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
  const [padokHayvanlari, setPadokHayvanlari] = useState<{ id: string; etiket: string }[]>([]);
  const [kismiUyari, setKismiUyari] = useState<string | null>(null);

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
  }, [p.padok]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const bugun = yerelGun();
  const durum = uyumDonemDurumu(kayit, bugun);
  const bitis = kayit ? uyumEtkinBitis(kayit) : null;
  const inceleme = uyumIncelemeMetni(durum, bitis ?? bugun);

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

  const bolmeOnayla = async (girdi: UyumBolmeGirdi) => {
    if (!kayit || !p.duzen) return;
    setHata(null);
    setKismiUyari(null);
    setMesgul(true);
    try {
      await gozlemKaydet();
      const { kayit: yeni, kismiHata } = await uyumBolmeIncelemeKaydet(kayit.id, girdi);
      setKayit(yeni);
      if (kismiHata) setKismiUyari(kismiHata);
      await yukle();
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

          {kayit?.incelemeOturumlari?.length ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Bölme oturumları</Text>
              {kayit.incelemeOturumlari.map((o) => (
                <Text key={o.id} style={{ color: colors.text, fontSize: 11 }}>
                  {gunTR(o.zaman.slice(0, 10))} · {o.kollar.reduce((n, k) => n + k.hayvanIds.length, 0)} atama ·{' '}
                  {o.degismeyenHayvanIds.length} değişmedi
                </Text>
              ))}
            </View>
          ) : null}

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

                  {(durum === 'inceleme_gerekli' || durum === 'gozlem_uzatildi') && kayit ? (
                    <UyumBolmeIncelemeFormu
                      padokHayvanlari={padokHayvanlari}
                      kaynakPadok={p.padok}
                      bugun={bugun}
                      duzen={p.duzen}
                      mesgul={mesgul}
                      onIptal={() => setHata(null)}
                      onOnayla={(g) => void bolmeOnayla(g)}
                    />
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}
          {hata ? <Text style={{ color: colors.danger }}>{hata}</Text> : null}
          {kismiUyari ? <Text style={{ color: colors.warning }}>{kismiUyari}</Text> : null}
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
});
