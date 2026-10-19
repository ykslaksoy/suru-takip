/** Soy ağacı — 3 nesil, ana/baba seç, kendileşme, yavrular, eşleşme kontrolü */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import {
  akrabalikHesaplayici,
  akrabaSeviyesi,
  bilinenAtaSayisi,
  ciftlesmeKontrol,
  ebeveynDogrula,
  soyAgaci,
  soyHaritasi,
  yavrular,
  yuzde,
  type AkrabaSeviye,
  type SoyDugum,
} from '@/kaynak/soy/hesap';
import { yetkiUyar } from '@/bilesenler/ekip/useEkip';
import { HayvanSecici } from '@/bilesenler/soy/HayvanSecici';

type Secim = null | 'ana' | 'baba' | 'es';

export default function SoyAgaciScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [hepsi, setHepsi] = useState<Animal[] | null>(null);
  const [secim, setSecim] = useState<Secim>(null);
  const [es, setEs] = useState<Animal | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    setHepsi(await getAnimals());
  }, []);
  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  const harita = useMemo(() => soyHaritasi(hepsi ?? []), [hepsi]);
  const idMap = useMemo(() => new Map((hepsi ?? []).map((a) => [a.id, a])), [hepsi]);
  const hesap = useMemo(() => akrabalikHesaplayici(harita), [harita]);
  const animal = id ? idMap.get(id) ?? null : null;

  const SEV_RENK: Record<AkrabaSeviye, string> = { yok: colors.success, dusuk: colors.textSecondary, orta: colors.warning, yuksek: colors.danger };

  if (!hepsi) return null;
  if (!animal) return <Text style={{ padding: 24, color: colors.text }}>Hayvan bulunamadı.</Text>;

  const agac = soyAgaci(harita, animal.id, 3);
  const F = hesap.kendilesme(animal.id);
  const yav = yavrular(harita, animal.id).map((x) => idMap.get(x)).filter(Boolean) as Animal[];
  const etiket = (x: string | null | undefined) => (x ? (idMap.get(x) ? hayvanAnaEtiket(idMap.get(x)!) : 'kayıtta yok') : null);

  const ata = async (rol: 'ana' | 'baba', a: Animal | null) => {
    setHata(null);
    if (!yetkiUyar('duzenleme')) return;
    const h = ebeveynDogrula(harita, animal.id, rol, a?.id ?? null);
    if (h) {
      setHata(h);
      return;
    }
    await upsertAnimal(rol === 'ana' ? { ...animal, motherId: a?.id ?? null } : { ...animal, fatherId: a?.id ?? null });
    setSecim(null);
    await yukle();
  };

  const Kutu = ({ d, rol, kok }: { d: SoyDugum | null; rol: string; kok?: boolean }) => {
    const a = d?.id ? idMap.get(d.id) : undefined;
    return (
      <Pressable
        disabled={!a || kok}
        onPress={() => a && router.push(`/hayvan/${a.id}/soy` as never)}
        style={[
          styles.kutu,
          {
            borderColor: kok ? colors.tint : a ? colors.border : colors.border,
            backgroundColor: kok ? colors.tint : a ? colors.card : colors.background,
            borderStyle: a || kok ? 'solid' : 'dashed',
          },
        ]}>
        <Text style={{ fontSize: 10, color: kok ? '#fffc' : colors.textSecondary, fontWeight: '700' }}>{rol}</Text>
        <Text numberOfLines={2} style={{ fontSize: 12, fontWeight: '800', color: kok ? '#fff' : a ? colors.text : colors.textSecondary }}>
          {a ? `${a.sex === 'male' ? '♂' : '♀'} ${hayvanAnaEtiket(a)}` : d?.id ? 'kayıtta yok' : 'bilinmiyor'}
        </Text>
      </Pressable>
    );
  };

  const esKontrol = es ? ciftlesmeKontrol(harita, animal.sex === 'male' ? animal.id : es.id, animal.sex === 'male' ? es.id : animal.id) : null;

  return (
    <>
      <Stack.Screen options={{ title: `${hayvanAnaEtiket(animal)} · Soy ağacı` }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>🌳 3 nesil</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Kutu d={agac} rol="KENDİSİ" kok />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Kutu d={agac.baba} rol="BABA" />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Kutu d={agac.ana} rol="ANA" />
              </View>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Kutu d={agac.baba?.baba ?? null} rol="BABANIN BABASI" />
              <Kutu d={agac.baba?.ana ?? null} rol="BABANIN ANASI" />
              <Kutu d={agac.ana?.baba ?? null} rol="ANANIN BABASI" />
              <Kutu d={agac.ana?.ana ?? null} rol="ANANIN ANASI" />
            </View>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
            Bilinen ata: {bilinenAtaSayisi(agac)}/6 · Kutuya dokun → o hayvanın soy ağacı
          </Text>
          <View style={[styles.fSatir, { borderColor: SEV_RENK[akrabaSeviyesi(F)] }]}>
            <Text style={{ color: SEV_RENK[akrabaSeviyesi(F)], fontWeight: '800' }}>
              Kendileşme (F): {yuzde(F)}
              {akrabaSeviyesi(F) === 'yuksek' ? ' · ana-baba yakın akraba' : akrabaSeviyesi(F) === 'orta' ? ' · ana-baba akraba' : F === 0 ? ' · bilinen akrabalık yok' : ''}
            </Text>
          </View>
        </View>

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>👪 Ana / baba</Text>
          {(['ana', 'baba'] as const).map((rol) => {
            const pid = rol === 'ana' ? animal.motherId : animal.fatherId;
            return (
              <View key={rol} style={[styles.ebeveyn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, width: 44, fontWeight: '700' }}>{rol === 'ana' ? 'Ana' : 'Baba'}</Text>
                <Text style={{ color: pid ? colors.text : colors.textSecondary, flex: 1, fontWeight: '700' }}>{etiket(pid) ?? 'bilinmiyor'}</Text>
                <Pressable onPress={() => setSecim(secim === rol ? null : rol)} style={[styles.kucukBtn, { borderColor: colors.tint }]}>
                  <Text style={{ color: colors.tint, fontWeight: '800' }}>{pid ? 'Değiştir' : '+ Seç'}</Text>
                </Pressable>
              </View>
            );
          })}
          {hata ? <Text style={{ color: colors.danger, marginTop: 6 }}>{hata}</Text> : null}
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>İsteğe bağlı. Ana/baba sürüde kayıtlı olmalı (satılmış ya da ölmüş olabilir).</Text>
        </View>

        {secim === 'ana' || secim === 'baba' ? (
          <HayvanSecici
            baslik={secim === 'ana' ? 'Ana seç (dişi)' : 'Baba seç (koç)'}
            hayvanlar={hepsi}
            cinsiyet={secim === 'ana' ? 'female' : 'male'}
            bosSecenek="— Bilinmiyor (kaldır)"
            haric={(a) => (a.id === animal.id ? true : ebeveynDogrula(harita, animal.id, secim, a.id))}
            satirNotu={(a) => {
              const diger = secim === 'ana' ? animal.fatherId : animal.motherId;
              if (!diger) return null;
              const k = ciftlesmeKontrol(harita, secim === 'baba' ? a.id : diger, secim === 'ana' ? a.id : diger);
              return k.seviye === 'yok' ? null : { metin: k.mesaj, renk: SEV_RENK[k.seviye] };
            }}
            onSec={(a) => void ata(secim, a)}
            onKapat={() => setSecim(null)}
          />
        ) : null}

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>🐑 Yavruları ({yav.length})</Text>
          {yav.length === 0 ? <Text style={{ color: colors.textSecondary }}>Kayıtlı yavru yok.</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {yav.map((y) => (
              <Pressable key={y.id} onPress={() => router.push(`/hayvan/${y.id}/soy` as never)} style={[styles.chip, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                  {y.sex === 'male' ? '♂' : '♀'} {hayvanAnaEtiket(y)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>🔍 Eşleşme kontrolü</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            {animal.sex === 'male' ? 'Bu koçu bir koyunla' : 'Bu koyunu bir koçla'} eşleştirirsen kuzuda kendileşme ne olur?
          </Text>
          {esKontrol && es ? (
            <View style={[styles.fSatir, { borderColor: SEV_RENK[esKontrol.seviye], marginTop: 0, marginBottom: 8 }]}>
              <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 2 }}>× {hayvanAnaEtiket(es)}</Text>
              <Text style={{ color: SEV_RENK[esKontrol.seviye], fontWeight: '700' }}>{esKontrol.mesaj}</Text>
            </View>
          ) : null}
          <Pressable onPress={() => setSecim(secim === 'es' ? null : 'es')} style={[styles.kucukBtn, { borderColor: colors.tint, alignSelf: 'flex-start' }]}>
            <Text style={{ color: colors.tint, fontWeight: '800' }}>{animal.sex === 'male' ? 'Koyun seç' : 'Koç seç'}</Text>
          </Pressable>
        </View>
        {secim === 'es' ? (
          <HayvanSecici
            baslik={animal.sex === 'male' ? 'Koyun seç' : 'Koç seç'}
            hayvanlar={hepsi.filter((a) => a.status !== 'sold' && a.status !== 'dead')}
            cinsiyet={animal.sex === 'male' ? 'female' : 'male'}
            satirNotu={(a) => {
              const k = ciftlesmeKontrol(harita, animal.sex === 'male' ? animal.id : a.id, animal.sex === 'male' ? a.id : animal.id);
              return k.seviye === 'yok' ? null : { metin: k.mesaj, renk: SEV_RENK[k.seviye] };
            }}
            onSec={(a) => {
              setEs(a);
              setSecim(null);
            }}
            onKapat={() => setSecim(null)}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14 },
  baslik: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  kutu: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 6, minHeight: 48, justifyContent: 'center' },
  fSatir: { borderWidth: 1.5, borderRadius: 10, padding: 10, marginTop: 10 },
  ebeveyn: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 8, gap: 8 },
  kucukBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
});
