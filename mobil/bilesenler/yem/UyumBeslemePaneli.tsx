import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { yerelGun } from '@/kaynak/arinma/depo';
import {
  UYUM_GUN_SECENEKLERI,
  uyumBitisTarihi,
  uyumDonemDurumu,
  uyumIncelemeMetni,
  uyumUyariMetni,
  type UyumBeslemeKayit,
  type UyumGunSayisi,
} from '@/kaynak/yem/uyum-besleme';
import { padokUyumKaydi, uyumIncelemeKaydet, uyumKaydet, uyumKayitlariniOku } from '@/kaynak/yem/uyum-besleme-kayit';

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
  }, [p.padok]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const bugun = yerelGun();
  const durum = uyumDonemDurumu(kayit, bugun);
  const bitis = kayit ? uyumBitisTarihi(kayit.baslangic, kayit.gunSayisi) : null;
  const inceleme = uyumIncelemeMetni(durum, bitis ?? bugun);

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

  const onayla = async () => {
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
        true,
      );
      setKayit(k);
      p.onKaydedildi?.();
    } finally {
      setMesgul(false);
    }
  };

  return (
    <View style={[s.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={() => setAcik((v) => !v)}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
          {acik ? '▼' : '▶'} Varış ve uyum beslemesi (isteğe bağlı)
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
                    style={[s.chip, { borderColor: gun === g ? colors.tint : colors.border, backgroundColor: gun === g ? `${colors.tint}22` : colors.background }]}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{g} gün</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                disabled={mesgul}
                onPress={() => void kaydet()}
                style={[s.btn, { backgroundColor: colors.tint }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{mesgul ? '…' : 'Uyum planını kaydet'}</Text>
              </Pressable>

              {durum === 'inceleme_gerekli' || durum === 'devam' || durum === 'onaylandi' ? (
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
                  {durum === 'inceleme_gerekli' ? (
                    <Pressable onPress={() => void onayla()} style={[s.btn, { borderWidth: 1, borderColor: colors.tint }]}>
                      <Text style={{ color: colors.tint, fontWeight: '800' }}>İncelemeyi onayla (rasyonu değiştirmez)</Text>
                    </Pressable>
                  ) : null}
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
  row: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
});
