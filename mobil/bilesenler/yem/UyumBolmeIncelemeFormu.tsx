import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import Colors from '@/sabitler/Renkler';
import { getPadoklar, padokDoluluk, type Padok } from '@/kaynak/suru/padok';
import type { UyumIncelemeKararTipi } from '@/kaynak/yem/uyum-besleme';
import { uyumUzatmaOneriBitis } from '@/kaynak/yem/uyum-inceleme';
import {
  bolmeOzetHesapla,
  secimGuncelMi,
  type UyumBolmeGirdi,
  type UyumBolmeKolu,
} from '@/kaynak/yem/uyum-inceleme-bolme';

type Kova = UyumIncelemeKararTipi;

export function UyumBolmeIncelemeFormu(p: {
  padokHayvanlari: { id: string; etiket: string }[];
  kaynakPadok: string;
  bugun: string;
  duzen: boolean;
  mesgul: boolean;
  onIptal: () => void;
  onOnayla: (girdi: UyumBolmeGirdi) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [neden, setNeden] = useState('');
  const [padokSonraki, setPadokSonraki] = useState(uyumUzatmaOneriBitis(p.bugun, 2));
  const [aktifKova, setAktifKova] = useState<Kova>('gozlem_uzat');
  const [uzatTarih, setUzatTarih] = useState(uyumUzatmaOneriBitis(p.bugun, 2));
  const [supheNotu, setSupheNotu] = useState('');
  const [besiyePadok, setBesiyePadok] = useState('');
  const [karantinaPadok, setKarantinaPadok] = useState('');
  const [secim, setSecim] = useState<Record<Kova, string[]>>({
    gozlem_uzat: [],
    besiye_gecis: [],
    karantina_suphe: [],
  });
  const [padoklar, setPadoklar] = useState<(Padok & { mevcutHayvan: number })[]>([]);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const list = await getPadoklar();
      const zengin = await Promise.all(
        list.map(async (pad) => {
          const d = await padokDoluluk(pad);
          return { ...pad, mevcutHayvan: d.hayvan };
        }),
      );
      setPadoklar(zengin);
      const normal = zengin.filter((x) => !x.karantina && x.ad !== p.kaynakPadok);
      const kar = zengin.filter((x) => x.karantina);
      if (!besiyePadok && normal[0]) setBesiyePadok(normal[0].ad);
      if (!karantinaPadok && kar[0]) setKarantinaPadok(kar[0].ad);
    })();
  }, [p.kaynakPadok, besiyePadok, karantinaPadok]);

  const padokIds = useMemo(() => p.padokHayvanlari.map((h) => h.id), [p.padokHayvanlari]);
  const tumSecim = useMemo(() => Object.values(secim).flat(), [secim]);

  const hayvanKovada = (id: string): Kova | null => {
    for (const tip of Object.keys(secim) as Kova[]) {
      if (secim[tip].includes(id)) return tip;
    }
    return null;
  };

  const toggleHayvan = (id: string) => {
    setSecim((prev) => {
      const mevcut = hayvanKovada(id);
      const next = { ...prev, gozlem_uzat: [...prev.gozlem_uzat], besiye_gecis: [...prev.besiye_gecis], karantina_suphe: [...prev.karantina_suphe] };
      if (mevcut === aktifKova) {
        next[aktifKova] = next[aktifKova].filter((x) => x !== id);
        return next;
      }
      (Object.keys(next) as Kova[]).forEach((k) => {
        next[k] = next[k].filter((x) => x !== id);
      });
      next[aktifKova] = [...next[aktifKova], id];
      return next;
    });
  };

  const kollar = useMemo((): UyumBolmeKolu[] => {
    const out: UyumBolmeKolu[] = [];
    if (secim.gozlem_uzat.length) {
      out.push({ karar: 'gozlem_uzat', hayvanIds: secim.gozlem_uzat, sonrakiInceleme: uzatTarih });
    }
    if (secim.besiye_gecis.length) {
      out.push({ karar: 'besiye_gecis', hayvanIds: secim.besiye_gecis, hedefPadok: besiyePadok });
    }
    if (secim.karantina_suphe.length) {
      out.push({
        karar: 'karantina_suphe',
        hayvanIds: secim.karantina_suphe,
        hedefPadok: karantinaPadok,
        supheNotu,
      });
    }
    return out;
  }, [secim, uzatTarih, besiyePadok, karantinaPadok, supheNotu]);

  const girdi: UyumBolmeGirdi = useMemo(
    () => ({
      neden,
      kollar,
      padokHayvanIds: padokIds,
      padokSonrakiInceleme: padokSonraki,
      padoklar: padoklar.map((x) => ({
        ad: x.ad,
        kapasite: x.kapasite,
        karantina: x.karantina,
        mevcutHayvan: x.mevcutHayvan,
      })),
    }),
    [neden, kollar, padokIds, padokSonraki, padoklar],
  );

  const ozet = useMemo(() => bolmeOzetHesapla(girdi), [girdi]);

  const onayla = () => {
    setHata(null);
    if (!secimGuncelMi(tumSecim, padokIds)) {
      setHata('Seçim güncel değil — padok listesi değişmiş olabilir; yenileyin.');
      return;
    }
    try {
      p.onOnayla(girdi);
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    }
  };

  const iptal = () => {
    setSecim({ gozlem_uzat: [], besiye_gecis: [], karantina_suphe: [] });
    setHata(null);
    p.onIptal();
  };

  if (!p.duzen) return null;

  return (
    <View style={{ gap: 8, marginTop: 6 }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>
        Grup bölme incelemesi (alt küme; sessiz toplu taşıma yok)
      </Text>
      <View style={s.row}>
        {(
          [
            ['gozlem_uzat', 'Gözlemde uzat'],
            ['besiye_gecis', 'Normal padok'],
            ['karantina_suphe', 'Karantina şüphesi'],
          ] as const
        ).map(([tip, label]) => (
          <Pressable
            key={tip}
            onPress={() => setAktifKova(tip)}
            style={[s.chip, { borderColor: aktifKova === tip ? colors.tint : colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 11 }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={neden}
        onChangeText={setNeden}
        placeholder="Oturum gerekçesi"
        placeholderTextColor={colors.textSecondary}
        style={[s.inp, { color: colors.text, borderColor: colors.border }]}
      />

      {aktifKova === 'gozlem_uzat' ? (
        <TextInput
          value={uzatTarih}
          onChangeText={setUzatTarih}
          placeholder="Seçilenler için inceleme YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          style={[s.inp, { color: colors.text, borderColor: colors.border }]}
        />
      ) : null}

      {aktifKova === 'besiye_gecis' ? (
        <View style={s.row}>
          {padoklar
            .filter((x) => !x.karantina && x.ad !== p.kaynakPadok)
            .map((pad) => (
              <Pressable key={pad.ad} onPress={() => setBesiyePadok(pad.ad)} style={s.chip}>
                <Text style={{ color: besiyePadok === pad.ad ? colors.tint : colors.text, fontSize: 11 }}>
                  {pad.ad} ({pad.mevcutHayvan}/{pad.kapasite})
                </Text>
              </Pressable>
            ))}
        </View>
      ) : null}

      {aktifKova === 'karantina_suphe' ? (
        <>
          <TextInput
            value={supheNotu}
            onChangeText={setSupheNotu}
            placeholder="Şüphe notu"
            placeholderTextColor={colors.textSecondary}
            style={[s.inp, { color: colors.text, borderColor: colors.border }]}
          />
          <View style={s.row}>
            {padoklar
              .filter((x) => x.karantina)
              .map((pad) => (
                <Pressable key={pad.ad} onPress={() => setKarantinaPadok(pad.ad)} style={s.chip}>
                  <Text style={{ color: karantinaPadok === pad.ad ? colors.tint : colors.text, fontSize: 11 }}>
                    {pad.ad} ({pad.mevcutHayvan}/{pad.kapasite})
                  </Text>
                </Pressable>
              ))}
          </View>
        </>
      ) : null}

      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
        Hayvan seç ({aktifKova}) — her hayvan en fazla bir kovada
      </Text>
      {p.padokHayvanlari.map((h) => {
        const k = hayvanKovada(h.id);
        return (
          <Pressable key={h.id} onPress={() => toggleHayvan(h.id)} style={s.hayvanSatir}>
            <Text style={{ color: k ? colors.tint : colors.textSecondary }}>
              {k ? `✓ [${k}] ` : '○ '}
              {h.etiket}
            </Text>
          </Pressable>
        );
      })}

      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Kalanlar için padok inceleme tarihi</Text>
      <TextInput
        value={padokSonraki}
        onChangeText={setPadokSonraki}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary}
        style={[s.inp, { color: colors.text, borderColor: colors.border }]}
      />

      {ozet.length ? (
        <View style={{ gap: 4, backgroundColor: `${colors.tint}11`, padding: 8, borderRadius: 8 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>Onay özeti</Text>
          {ozet.map((o) => (
            <Text key={o.karar} style={{ color: colors.text, fontSize: 11 }}>
              {o.karar}: {o.adet} hayvan
              {o.hedefPadok ? ` → ${o.hedefPadok}` : ''}
              {o.sonrakiInceleme ? ` · inceleme ${o.sonrakiInceleme}` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable disabled={p.mesgul} onPress={onayla} style={[s.btn, { borderWidth: 1, borderColor: colors.tint }]}>
        <Text style={{ color: colors.tint, fontWeight: '800' }}>Bölünmeyi onayla ve uygula</Text>
      </Pressable>
      <Pressable onPress={iptal}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>İptal — seçimleri temizle</Text>
      </Pressable>
      {hata ? <Text style={{ color: colors.danger }}>{hata}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  inp: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderColor: '#ccc' },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  hayvanSatir: { paddingVertical: 4 },
});
