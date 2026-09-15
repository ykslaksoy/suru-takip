import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { GorevSatiri } from '@/bilesenler/gorevler/GorevSatiri';
import { Gun1SecimPaneli } from '@/bilesenler/gorevler/Gun1SecimPaneli';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  GOREV_KATEGORI_SIRASI,
  asiGorevleriniGuneGore,
  getGorevGruplari,
  setPlanlananTamam,
  setIsPlaniTamam,
  type GorevGrup,
  type GorevGunGrup,
  type GorevKategoriId,
} from '@/kaynak/gorevler';
import {
  GUN1_SECIM_VARSAYILAN_PADOK,
  gun1GorevVarMi,
  gun1SecimKaydet,
  gun1SecimOku,
  gun1SecimSil,
  gunGruplariniSecimeGoreFiltrele,
  type Gun1SecimKayit,
  type Gun1SecimMod,
} from '@/kaynak/gorevler/gun1-secim';

async function gorevTamamla(id: string): Promise<void> {
  if (id.startsWith('is-plani-')) {
    await setIsPlaniTamam(id.replace(/^is-plani-/, ''), true);
  } else if (id.startsWith('plan-')) {
    await setPlanlananTamam(id.replace(/^plan-/, ''), true);
  }
}

function isKategoriId(v: string | undefined): v is GorevKategoriId {
  return GOREV_KATEGORI_SIRASI.some((k) => k.id === v);
}

export default function GorevKategoriScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { ready, refreshKey } = useDatabase();
  const [grup, setGrup] = useState<GorevGrup | null>(null);
  const [gunGruplari, setGunGruplari] = useState<GorevGunGrup[]>([]);
  const [loading, setLoading] = useState(true);
  const [gun1Secim, setGun1Secim] = useState<Gun1SecimKayit | null>(null);
  const [secimAcik, setSecimAcik] = useState(false);

  const meta = isKategoriId(id) ? GOREV_KATEGORI_SIRASI.find((k) => k.id === id)! : null;

  const load = useCallback(async () => {
    if (!isKategoriId(id)) {
      setGrup(null);
      setGunGruplari([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { gruplar } = await getGorevGruplari();
      const g = gruplar.find((x) => x.id === id) ?? null;
      setGrup(g);
      if (id === 'asi' && g) {
        const gg = asiGorevleriniGuneGore(g.gorevler);
        setGunGruplari(gg);
        if (gun1GorevVarMi(gg)) {
          const s = await gun1SecimOku(GUN1_SECIM_VARSAYILAN_PADOK);
          setGun1Secim(s);
          setSecimAcik(!s);
        } else {
          setGun1Secim(null);
          setSecimAcik(false);
        }
      } else if (id === 'yem' && g) {
        setGunGruplari(asiGorevleriniGuneGore(g.gorevler));
        setGun1Secim(null);
        setSecimAcik(false);
      } else {
        setGunGruplari([]);
        setGun1Secim(null);
        setSecimAcik(false);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load, refreshKey])
  );

  const tamamlaVeYenile = async (gorevId: string) => {
    await gorevTamamla(gorevId);
    await load();
  };

  const kaydetSecim = async (mod: Gun1SecimMod, programIds: string[]) => {
    const s = await gun1SecimKaydet({
      mod,
      programIds,
      padokAnahtar: GUN1_SECIM_VARSAYILAN_PADOK,
    });
    setGun1Secim(s);
    setSecimAcik(false);
  };

  const secimiDegistir = async () => {
    await gun1SecimSil(GUN1_SECIM_VARSAYILAN_PADOK);
    setGun1Secim(null);
    setSecimAcik(true);
  };

  const baslik = meta ? `${meta.icon} ${meta.label}` : 'Kategori';
  const gunlukMu = id === 'asi' || id === 'yem';
  const gun1Var = id === 'asi' && gun1GorevVarMi(gunGruplari);
  const gosterilecek =
    id === 'asi' && gun1Secim && !secimAcik
      ? gunGruplariniSecimeGoreFiltrele(gunGruplari, gun1Secim)
      : gunGruplari;
  const listeGoster = !(gun1Var && secimAcik);

  return (
    <>
      <Stack.Screen options={{ title: meta?.label ?? 'Kategori' }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginVertical: 32 }} />
        ) : !meta ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Geçersiz kategori.
          </Text>
        ) : !grup || grup.gorevler.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
            Bu kategoride bekleyen görev yok.
          </Text>
        ) : (
          <View style={[styles.detay, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <View style={styles.detayBaslik}>
              <Text style={[styles.detayTitle, { color: colors.text }]}>{baslik}</Text>
              <Text style={{ color: colors.textSecondary }}>{grup.adet} görev</Text>
            </View>
            {gunlukMu ? (
              <>
                <Text style={{ color: colors.textSecondary, marginBottom: 12, fontSize: 13, lineHeight: 18 }}>
                  {id === 'asi'
                    ? 'Tartarken aynı gün aşı/iğne de yapılır. Tartı önerilen ilk adım. Doz gerçek kiloya göre; henüz tartılmadıysa geçici ~20 kg (gelenler ~17–24 kg). Yem/beslenme ayrı listede.'
                    : 'Yem uygulamaları aşıdan ayrı · satılana kadar milestone’lar.'}
                </Text>
                {gun1Var ? (
                  <Gun1SecimPaneli
                    colors={colors}
                    secimAcik={secimAcik}
                    kayitOzet={
                      gun1Secim
                        ? { mod: gun1Secim.mod, adet: gun1Secim.programIds.length }
                        : null
                    }
                    onKaydet={kaydetSecim}
                    onDegistir={secimiDegistir}
                  />
                ) : null}
                {listeGoster
                  ? gosterilecek.map((gg) => (
                      <View key={`gun-${gg.gun}`} style={{ marginBottom: 12 }}>
                        <Text style={[styles.gunBaslik, { color: colors.tint }]}>{gg.baslik}</Text>
                        {gg.gorevler.map((g) => (
                          <GorevSatiri
                            key={g.id}
                            g={g}
                            colors={colors}
                            onTamamla={g.tamamlanabilir ? () => tamamlaVeYenile(g.id) : undefined}
                          />
                        ))}
                      </View>
                    ))
                  : null}
              </>
            ) : (
              grup.gorevler.map((g) => (
                <GorevSatiri
                  key={g.id}
                  g={g}
                  colors={colors}
                  onTamamla={g.tamamlanabilir ? () => tamamlaVeYenile(g.id) : undefined}
                />
              ))
            )}
            <Pressable onPress={() => router.push(grup.href as never)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>
                {grup.label} ekranına git →
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  detay: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  detayBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detayTitle: { fontSize: 17, fontWeight: '800' },
  gunBaslik: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 4,
  },
});
