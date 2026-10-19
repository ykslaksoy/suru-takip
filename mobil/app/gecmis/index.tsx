/**
 * İşlem geçmişi · İşlem kaydı (denetim) · Geri dönüşüm kutusu.
 * Geri dönüşüm kutusu: silinen kuzu / kayıt 30 gün tutulur; geri al ya da onayla kalıcı sil.
 * İşlem kaydı: her ekleme / değişiklik / silme — kim, ne zaman, eski → yeni.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { getCopKutusu, getIslemler } from '@/kaynak/gecmis/gunluk';
import { copGeriYukle, copKaliciSil } from '@/kaynak/gecmis/hayvan-sil';
import { COP_SAKLAMA_GUN, COP_TUR_ETIKET, COP_TUR_SIMGE, copKalanGun } from '@/kaynak/gecmis/cop';
import type { CopKaydi, Islem, IslemTur } from '@/kaynak/gecmis/tipler';
import {
  denetimFiltrele,
  EYLEM_ETIKET,
  getDenetimKayitlari,
  TABLO_ETIKET,
  type DenetimKaydi,
  type DenetimTablo,
} from '@/kaynak/cekirdek/denetim';

const IKON: Record<IslemTur, string> = {
  tartim: '⚖️', asi: '💉', ilac: '💊', stok: '📦', hayvan: '🐑', padok: '🏠', satis: '💰', durum: '•', silme: '🗑️', geri_alma: '↩️', diger: '•',
};

type Sekme = 'gecmis' | 'kayit' | 'cop';

function zamanMetni(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

function onayla(baslik: string, mesaj: string, evet: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${baslik}\n\n${mesaj}`)) evet();
    return;
  }
  Alert.alert(baslik, mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Kalıcı sil', style: 'destructive', onPress: evet },
  ]);
}

export default function GecmisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const params = useLocalSearchParams<{ sekme?: string }>();
  const [sekme, setSekme] = useState<Sekme>(params.sekme === 'cop' || params.sekme === 'kayit' ? params.sekme : 'gecmis');
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [denetim, setDenetim] = useState<DenetimKaydi[]>([]);
  const [cop, setCop] = useState<CopKaydi[]>([]);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [tablo, setTablo] = useState<DenetimTablo | null>(null);
  const [limit, setLimit] = useState(80);

  const load = useCallback(async () => {
    const [i, c, d] = await Promise.all([getIslemler(), getCopKutusu(), getDenetimKayitlari()]);
    setIslemler(i);
    setCop(c);
    setDenetim(d);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const tablolar = useMemo(() => [...new Set(denetim.map((d) => d.tablo))], [denetim]);
  const gorunenDenetim = useMemo(() => denetimFiltrele(denetim, { tablo }), [denetim, tablo]);

  const kaliciSil = (c: CopKaydi) =>
    onayla('Kalıcı sil', `${c.etiket} kalıcı olarak silinecek. Bu işlem geri alınamaz.`, async () => {
      await copKaliciSil(c.id);
      setMesaj(`${c.etiket} kalıcı silindi`);
      await load();
    });

  return (
    <>
      <Stack.Screen options={{ title: sekme === 'cop' ? 'Geri dönüşüm kutusu' : sekme === 'kayit' ? 'İşlem kaydı' : 'İşlem geçmişi' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <AltButonlar
          items={[
            { key: 'gecmis', label: 'Özet' },
            { key: 'kayit', label: `İşlem kaydı` },
            { key: 'cop', label: `Geri dönüşüm (${cop.length})` },
          ]}
          activeKey={sekme}
          onSelect={(k) => setSekme(k as Sekme)}
        />
        {mesaj ? <Text style={{ color: colors.tint, fontWeight: '700', marginVertical: 8 }}>{mesaj}</Text> : null}

        {sekme === 'gecmis' ? (
          islemler.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              Henüz işlem yok. Tartım, aşı, stok ve silme işlemleri burada listelenir.
            </Text>
          ) : (
            islemler.map((i) => (
              <Pressable
                key={i.id}
                disabled={!i.animalId}
                onPress={() => i.animalId && router.push(`/hayvan/${i.animalId}` as never)}
                style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 18, width: 28 }}>{IKON[i.tur] ?? '•'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{i.ozet}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {zamanMetni(i.zaman)} · {i.kim}
                    {i.detay ? ` · ${i.detay}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))
          )
        ) : null}

        {sekme === 'kayit' ? (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
              Her ekleme, değişiklik ve silme: kim, ne zaman, ne değişti. Son {denetim.length} kayıt.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 8 }}>
              {[null, ...tablolar].map((t) => (
                <Pressable
                  key={t ?? 'hepsi'}
                  onPress={() => setTablo(t)}
                  style={[styles.chip, { borderColor: tablo === t ? colors.tint : colors.border, backgroundColor: tablo === t ? colors.tint + '18' : colors.card }]}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{t ? TABLO_ETIKET[t] : 'Tümü'}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {gorunenDenetim.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Kayıt yok.</Text>
            ) : (
              gorunenDenetim.slice(0, limit).map((d) => (
                <Pressable
                  key={d.id}
                  disabled={!d.animalId || d.eylem === 'silme' || d.eylem === 'kalici_silme'}
                  onPress={() => d.animalId && router.push(`/hayvan/${d.animalId}` as never)}
                  style={[styles.kayit, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    <Text style={{ color: d.eylem === 'silme' || d.eylem === 'kalici_silme' ? colors.danger : d.eylem === 'ekleme' ? colors.tint : colors.text }}>
                      {EYLEM_ETIKET[d.eylem]}
                    </Text>{' '}
                    · {TABLO_ETIKET[d.tablo]}: {d.ozet}
                  </Text>
                  {d.degisiklikler?.map((x) => (
                    <Text key={x.alan} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {x.alan}: <Text style={{ textDecorationLine: 'line-through' }}>{x.eski}</Text> → <Text style={{ color: colors.text, fontWeight: '700' }}>{x.yeni}</Text>
                    </Text>
                  ))}
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 3 }}>
                    👤 {d.kim} · {zamanMetni(d.zaman)}
                  </Text>
                </Pressable>
              ))
            )}
            {gorunenDenetim.length > limit ? (
              <Pressable onPress={() => setLimit((l) => l + 200)} style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>Daha fazla göster ({gorunenDenetim.length - limit})</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {sekme === 'cop' ? (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
              Silinen kuzu ve kayıtlar {COP_SAKLAMA_GUN} gün burada kalır, sonra kendiliğinden kalıcı silinir. Kuzu geri alınınca tartım ve
              sağlık kayıtları da geri gelir.
            </Text>
            {cop.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Geri dönüşüm kutusu boş.</Text>
            ) : (
              cop.map((c) => (
                <View key={c.id} style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'flex-start' }]}>
                  <Text style={{ fontSize: 18, width: 28 }}>{COP_TUR_SIMGE[c.tur] ?? '🗑️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{c.etiket}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {COP_TUR_ETIKET[c.tur]} · silindi {zamanMetni(c.silinme)}
                      {c.kim ? ` · ${c.kim}` : ''}
                    </Text>
                    <Text style={{ color: colors.warning, fontSize: 12, marginTop: 2, fontWeight: '700' }}>
                      {copKalanGun(c)} gün sonra kalıcı silinir
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Pressable
                        onPress={async () => {
                          if (await copGeriYukle(c.id)) {
                            setMesaj(`${c.etiket} geri alındı`);
                            refresh();
                            await load();
                          } else setMesaj('Geri alınamadı');
                        }}
                        style={[styles.btn, { backgroundColor: colors.tint }]}>
                        <Text style={{ color: '#fff', fontWeight: '800' }}>↩️ Geri al</Text>
                      </Pressable>
                      <Pressable onPress={() => kaliciSil(c)} style={[styles.btn, { borderWidth: 1.5, borderColor: colors.danger }]}>
                        <Text style={{ color: colors.danger, fontWeight: '800' }}>Kalıcı sil</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  kayit: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 10, marginTop: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  btn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
});
