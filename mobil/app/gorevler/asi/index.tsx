import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  SAGLIK_PLANI_BOLUMLER,
  bolumKatalogIdleri,
  useSaglikPlani,
  type SaglikPlani,
  type SaglikPlaniBolum,
} from '@/kaynak/gorevler/saglik-plani';

const BOLUM_BASLIK: Record<SaglikPlaniBolum, string> = {
  asi: 'Aşılar',
  parazit: 'Haplar',
  vitamin: 'Vitaminler',
};

/** Önerilen plan kalemlerinin gerekçesi (yalnız önerilen plandaki kalemlerde gösterilir). */
const NEDEN: Record<string, string> = {
  karma: 'Birinci öncelik · klostridiyal + pastörella (pratikte karma)',
  cicek: 'Yaş / dönem zorunlu risk',
  ppr: 'Yüksek öncelikli viral koruma',
  pasteurella: 'Solunum koruması',
  sarbon: 'Bölgesel risk',
  brusella: 'Damızlık programı',
  sap: 'Kampanya / resmi program',
  ivermektin: 'Gün 1 min. paket · parazit',
  albendazol: 'Gün 1 min. paket · parazit',
  'selen-e': 'Beyaz kas hastalığı önlemi — Gün 1',
};

type Kalem = { id: string; ad: string; aciklama: string };

const KALEM: Map<string, Kalem> = new Map([
  ...ASI_PROGRAMI.map((p) => [p.id, { id: p.id, ad: p.ad, aciklama: p.koruma }] as const),
  ...VITAMIN_PROGRAMI.map((v) => [v.id, { id: v.id, ad: v.ad, aciklama: v.detay }] as const),
]);

function kalemler(ids: string[]): Kalem[] {
  return ids.map((id) => KALEM.get(id)).filter((k): k is Kalem => k != null);
}

export default function KuzuSaglikPlaniScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { hazir, onerilenAcik, onerilen, kendi, mod, setMod, ekle, cikar, sifirla } = useSaglikPlani();
  const [duzenle, setDuzenle] = useState(false);
  const [acikEkle, setAcikEkle] = useState<SaglikPlaniBolum | null>(null);

  const onerilenGoster = onerilenAcik && mod === 'onerilen' && onerilen != null;
  const plan: SaglikPlani = onerilenGoster ? onerilen! : kendi;
  const duzenlenebilir = !onerilenGoster;
  const onerilenSet = new Set(onerilen ? SAGLIK_PLANI_BOLUMLER.flatMap((b) => onerilen[b]) : []);

  // Detay ekranı (/gorevler/asi/[programId]) aşı, parazit ve vitamin kalemlerini birlikte açar.
  const renderSatir = (b: SaglikPlaniBolum, p: Kalem, sira: number) => {
    const neden = onerilenSet.has(p.id) ? NEDEN[p.id] : undefined;
    return (
      <Pressable
        key={p.id}
        onPress={duzenlenebilir && duzenle ? undefined : () => router.push(`/gorevler/asi/${p.id}` as never)}
        style={[styles.satir, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.siraBadge, { backgroundColor: colors.tint }]}>
          <Text style={styles.siraText}>{sira}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.ad, { color: colors.text }]}>{p.ad}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{p.aciklama}</Text>
          {neden ? (
            <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700', marginTop: 4 }}>{neden}</Text>
          ) : null}
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Durum: sırada</Text>
        </View>
        {duzenlenebilir && duzenle ? (
          <Pressable
            onPress={() => cikar(b, p.id)}
            hitSlop={8}
            accessibilityLabel={`${p.ad} planından çıkar`}
            style={[styles.cikarBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.warning, fontWeight: '800', fontSize: 16 }}>×</Text>
          </Pressable>
        ) : (
          <Text style={{ color: colors.tint, fontWeight: '800' }}>→</Text>
        )}
      </Pressable>
    );
  };

  let sayac = 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Kuzu Sağlığı' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}>
        <Text style={[styles.planBaslik, { color: colors.text }]}>Kuzu Sağlığı</Text>
        {onerilenGoster ? (
          <Text style={[styles.planAlt, { color: colors.tint }]}>Kuzu besi (Mod 1)</Text>
        ) : null}

        {onerilenAcik ? (
          <View style={[styles.segment, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {(
              [
                ['onerilen', 'Önerilen plan (SuperKuzu)'],
                ['kendi', 'Kendi planım'],
              ] as const
            ).map(([m, etiket]) => {
              const secili = mod === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMod(m);
                    setAcikEkle(null);
                  }}
                  style={[styles.segmentBtn, secili && { backgroundColor: colors.tint }]}>
                  <Text
                    style={{
                      color: secili ? '#fff' : colors.text,
                      fontWeight: '800',
                      fontSize: 13,
                      textAlign: 'center',
                    }}>
                    {etiket}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Text style={[styles.katmanBaslik, { color: colors.text }]}>Önleyici Sağlık Planı</Text>
        <Text style={[styles.katmanNot, { color: colors.tint }]}>Her kuzuya istisnasız rutin uygulanır.</Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {onerilenGoster
            ? 'Önerilen aşı, hap ve vitaminler, öncelik sırasıyla (salt okunur).'
            : 'Kendi planın: kalem ekle veya çıkar. Değişiklikler bu cihazda saklanır.'}
        </Text>

        {duzenlenebilir ? (
          <View style={styles.aksiyonlar}>
            <Pressable
              onPress={() => {
                setDuzenle((d) => !d);
                setAcikEkle(null);
              }}
              style={[styles.aksiyonBtn, { borderColor: colors.tint }]}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>{duzenle ? 'Bitti' : 'Düzenle'}</Text>
            </Pressable>
            {onerilenAcik ? (
              <Pressable
                onPress={() => {
                  sifirla();
                  setAcikEkle(null);
                }}
                style={[styles.aksiyonBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>Önerilene sıfırla</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!hazir ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: 24 }} />
        ) : (
          SAGLIK_PLANI_BOLUMLER.map((b, bi) => {
            const liste = kalemler(plan[b]);
            const eklenebilir = kalemler(bolumKatalogIdleri(b).filter((id) => !plan[b].includes(id)));
            return (
              <View key={b} style={{ marginTop: bi === 0 ? 0 : 16 }}>
                <Text style={[styles.bolum, { color: colors.text, borderBottomColor: colors.tint }]}>
                  {BOLUM_BASLIK[b]}
                </Text>
                {liste.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                    Bu bölümde kalem yok.
                  </Text>
                ) : (
                  liste.map((p) => renderSatir(b, p, ++sayac))
                )}

                {duzenlenebilir && duzenle ? (
                  <>
                    <Pressable
                      onPress={() => setAcikEkle((a) => (a === b ? null : b))}
                      style={{ paddingVertical: 6 }}>
                      <Text style={{ color: colors.tint, fontWeight: '800' }}>
                        {acikEkle === b ? '− Kapat' : '+ Ekle'}
                      </Text>
                    </Pressable>
                    {acikEkle === b ? (
                      eklenebilir.length === 0 ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                          Katalogdaki tüm kalemler planda.
                        </Text>
                      ) : (
                        eklenebilir.map((k) => (
                          <Pressable
                            key={k.id}
                            onPress={() => ekle(b, k.id)}
                            style={[styles.ekleSatir, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.text, fontWeight: '700' }}>{k.ad}</Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                {k.aciklama}
                              </Text>
                            </View>
                            <Text style={{ color: colors.tint, fontWeight: '800' }}>+</Text>
                          </Pressable>
                        ))
                      )
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })
        )}

        <View style={[styles.tedaviKart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.katmanBaslik, { color: colors.text, marginTop: 0 }]}>Tedavi ve Ek Destek</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
            Hastalık veya verim kaybında ilgili kuzuya ayrıca verilir.
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/saglik' as never)} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.tint, fontWeight: '800' }}>Sağlık bölümüne git →</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/gorevler/kategori/asi' as never)}
          style={{ marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Gün gün aşı görevleri →</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/saglik' as never)} style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Sağlık / aşı kayıtları →</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  planBaslik: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  planAlt: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  intro: { lineHeight: 20, marginBottom: 12, fontSize: 14 },
  katmanBaslik: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  katmanNot: { fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  tedaviKart: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 24 },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  segmentBtn: { flex: 1, borderRadius: 9, paddingVertical: 9, paddingHorizontal: 6 },
  aksiyonlar: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  aksiyonBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  bolum: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    letterSpacing: 0.2,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  siraBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siraText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  ad: { fontSize: 16, fontWeight: '800' },
  cikarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekleSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
});
