/** Ultrason sonuçları — her koyun tek dokunuş: Boş / Gebe / İkiz / Üçüz */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { bugunYerel, getCiftlesmeler, ultrasonGir, ultrasonSil } from '@/kaynak/ciftlesme/depo';
import { aktifMi, beklenenDogum, durum, gunFarki, trTarih, ULTRASON_EN_ERKEN, type CiftlesmeKaydi, type UltrasonSonuc } from '@/kaynak/ciftlesme/hesap';
import { yetkiUyar } from '@/bilesenler/ekip/useEkip';

const SECENEK: { ad: string; sonuc: UltrasonSonuc; n?: number }[] = [
  { ad: 'Boş', sonuc: 'bos' },
  { ad: 'Gebe', sonuc: 'gebe', n: 1 },
  { ad: 'İkiz', sonuc: 'gebe', n: 2 },
  { ad: 'Üçüz', sonuc: 'gebe', n: 3 },
];

export default function UltrasonEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [kayitlar, setKayitlar] = useState<CiftlesmeKaydi[] | null>(null);
  const [hayvan, setHayvan] = useState<Map<string, Animal>>(new Map());
  const [tarih, setTarih] = useState(bugunYerel());
  const [buOturum, setBuOturum] = useState<string[]>([]);
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

  const ad = (id: string) => (hayvan.get(id) ? hayvanAnaEtiket(hayvan.get(id)!) : 'silinmiş');
  const bekleyen = useMemo(
    () => (kayitlar ?? []).filter((k) => aktifMi(k) && !k.ultrason && durum(k, bugun) !== 'sunger').sort((a, b) => a.katimTarih.localeCompare(b.katimTarih)),
    [kayitlar, bugun],
  );
  const girilen = (kayitlar ?? []).filter((k) => buOturum.includes(k.id));

  const gir = async (k: CiftlesmeKaydi, s: (typeof SECENEK)[number]) => {
    if (!yetkiUyar('tedavi')) return;
    await ultrasonGir(k.id, s.sonuc, s.n, /^\d{4}-\d{2}-\d{2}$/.test(tarih) ? tarih : bugun);
    setBuOturum((l) => [k.id, ...l]);
    await yukle();
  };

  if (!kayitlar) return null;
  const gebeSay = girilen.filter((k) => k.ultrason?.sonuc === 'gebe').length;

  return (
    <>
      <Stack.Screen options={{ title: 'Ultrason sonuçları' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Ultrason günü</Text>
          <TextInput value={tarih} onChangeText={setTarih} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>{bekleyen.length} koyun bekliyor</Text>
        </View>

        {bekleyen.length === 0 ? <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 16 }}>Ultrason bekleyen koyun yok.</Text> : null}
        {bekleyen.map((k) => {
          const gun = gunFarki(k.katimTarih, bugun);
          return (
            <View key={k.id} style={[styles.satirKart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, flex: 1 }}>♀ {ad(k.koyunId)}</Text>
                <Text style={{ color: gun < ULTRASON_EN_ERKEN ? colors.warning : colors.textSecondary, fontSize: 12 }}>
                  katım {trTarih(k.katimTarih)} · {gun} gün{gun < ULTRASON_EN_ERKEN ? ' · erken olabilir' : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {SECENEK.map((s) => (
                  <Pressable
                    key={s.ad}
                    onPress={() => void gir(k, s)}
                    style={[styles.secBtn, { borderColor: s.sonuc === 'bos' ? colors.border : colors.tint, backgroundColor: s.sonuc === 'bos' ? colors.background : s.n === 1 ? colors.tint : colors.card }]}>
                    <Text style={{ color: s.sonuc === 'bos' ? colors.text : s.n === 1 ? '#fff' : colors.tint, fontWeight: '800' }}>{s.ad}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {girilen.length ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 6 }]}>
            <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 6 }}>
              Bu oturumda {girilen.length} · gebe {gebeSay} · boş {girilen.length - gebeSay}
            </Text>
            {girilen.map((k) => (
              <View key={k.id} style={[styles.girilen, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, flex: 1 }}>
                  ♀ {ad(k.koyunId)} ·{' '}
                  <Text style={{ fontWeight: '800', color: k.ultrason?.sonuc === 'gebe' ? colors.success : colors.textSecondary }}>
                    {k.ultrason?.sonuc === 'bos' ? 'Boş' : k.ultrason?.yavruSayisi === 2 ? 'İkiz' : k.ultrason?.yavruSayisi === 3 ? 'Üçüz' : 'Gebe'}
                  </Text>
                  {k.ultrason?.sonuc === 'gebe' ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}> · doğum {trTarih(beklenenDogum(k))}</Text> : null}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    if (!yetkiUyar('tedavi')) return;
                    void ultrasonSil(k.id).then(() => {
                      setBuOturum((l) => l.filter((x) => x !== k.id));
                      return yukle();
                    });
                  }}>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>Geri al</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>Gebe → hayvan "Gebe" olur. Boş → gebe işaretliyse "Sağlıklı"ya döner, koyun yeniden koça verilebilir.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, fontSize: 14, width: 120 },
  satirKart: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8 },
  secBtn: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  girilen: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 7 },
});
