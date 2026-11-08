import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  OYUN_FIYAT_KATALOG,
  VARSAYILAN_BUTCE_SECENEKLERI,
} from '@/kaynak/akilli-ciftlik/katalog';
import { oyunKaydet, oyunOku, oyunSifirla } from '@/kaynak/akilli-ciftlik/depo';
import {
  asiProgramiOde,
  bakimAyarla,
  fiyatGuncelle,
  ilerleGun,
  kuzuSatinAl,
  netKar,
  satisYap,
  vitaminOde,
  yemSatinAl,
  yeniOyun,
} from '@/kaynak/akilli-ciftlik/motor';
import type { AkilliCiftlikDurum, OyunFiyatKodu } from '@/kaynak/akilli-ciftlik/tipler';

function sayi(m: string): number | null {
  const n = parseFloat(m.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function AkilliCiftlikScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [durum, setDurum] = useState<AkilliCiftlikDurum | null>(null);
  const [butce, setButce] = useState('250000');
  const [alAdet, setAlAdet] = useState('10');
  const [yukleniyor, setYukleniyor] = useState(true);

  const persist = useCallback(async (d: AkilliCiftlikDurum | null) => {
    setDurum(d);
    await oyunKaydet(d);
  }, []);

  useEffect(() => {
    void (async () => {
      const depo = await oyunOku();
      setDurum(depo.oyun);
      setYukleniyor(false);
    })();
  }, []);

  const baslat = async () => {
    const b = sayi(butce) ?? 250_000;
    const o = yeniOyun({ baslangicButce: b, hedefGun: 60 });
    await persist(o);
  };

  const sifirla = async () => {
    await oyunSifirla();
    setDurum(null);
  };

  if (yukleniyor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Akıllı Çiftlik' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View style={[styles.uyari, { borderColor: colors.warning, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.warning, fontWeight: '800' }}>Öğretici simülasyon</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
            Gerçek hayvan, stok, aşı veya muhasebe kaydı değiştirilmez. Kayıplar ve olaylar kurgusal eğitim amaçlıdır.
          </Text>
        </View>

        {!durum ? (
          <View style={[styles.kutu, { borderColor: colors.border }]}>
            <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 8 }}>Başlangıç bütçesi (senaryo)</Text>
            <TextInput
              value={butce}
              onChangeText={setButce}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <View style={styles.row}>
              {VARSAYILAN_BUTCE_SECENEKLERI.map((b) => (
                <Pressable key={b} onPress={() => setButce(String(b))} style={[styles.chip, { borderColor: colors.tint }]}>
                  <Text style={{ color: colors.tint, fontSize: 11 }}>{(b / 1000).toFixed(0)}k ₺</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => void baslat()} style={[styles.btn, { backgroundColor: colors.tint }]}>
              <Text style={styles.btnYazi}>Oyuna başla</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <DurumOzeti d={durum} colors={colors} />
            {durum.iflas || durum.tamamlandi ? (
              <Text style={{ color: durum.iflas ? colors.warning : colors.tint, fontWeight: '700', marginVertical: 8 }}>
                {durum.ogrenmeNotu ?? 'Senaryo sonu'}
              </Text>
            ) : null}

            {!durum.iflas && !durum.tamamlandi ? (
              <>
                <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 12 }}>Alım & gider</Text>
                <View style={styles.row}>
                  <MiniInput label="Kuzu adet" value={alAdet} onChange={setAlAdet} colors={colors} />
                  <Pressable
                    onPress={() => {
                      const r = kuzuSatinAl(durum, sayi(alAdet) ?? 0);
                      if (r.hata) Alert.alert('Alım', r.hata);
                      else void persist(r.durum);
                    }}
                    style={[styles.btnOutline, { borderColor: colors.tint, flex: 1 }]}>
                    <Text style={{ color: colors.tint, fontWeight: '700' }}>Kuzu al</Text>
                  </Pressable>
                </View>
                <View style={styles.row}>
                  <Pressable
                    onPress={() => {
                      const r = yemSatinAl(durum, 200 * Math.max(durum.kuzuBas, 1), 0);
                      if (r.hata) Alert.alert('Yem', r.hata);
                      else void persist(r.durum);
                    }}
                    style={[styles.btnOutline, { borderColor: colors.border, flex: 1 }]}>
                    <Text style={{ color: colors.text }}>Kesif yem (ör. 200 kg×baş)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const r = asiProgramiOde(durum);
                      if (r.hata) Alert.alert('Aşı', r.hata);
                      else void persist(r.durum);
                    }}
                    style={[styles.btnOutline, { borderColor: colors.border, flex: 1 }]}>
                    <Text style={{ color: colors.text }}>Aşı programı (maliyet)</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => {
                    const r = vitaminOde(durum);
                    if (r.hata) Alert.alert('Vitamin', r.hata);
                    else void persist(r.durum);
                  }}
                  style={[styles.btnOutline, { borderColor: colors.border, marginBottom: 8 }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Vitamin (isteğe bağlı — büyüme garantisi yok)
                  </Text>
                </Pressable>

                <Text style={{ color: colors.tint, fontWeight: '800' }}>Bakım kararları</Text>
                <BakimChip
                  aktif={durum.bakim.suVeTemizlikIy}
                  label="Su + padok iyi"
                  onPress={() => void persist(bakimAyarla(durum, { suVeTemizlikIy: !durum.bakim.suVeTemizlikIy }))}
                  colors={colors}
                />
                <BakimChip
                  aktif={durum.bakim.kesifAniGecis}
                  label="Kesifte ani değişim (risk)"
                  onPress={() => void persist(bakimAyarla(durum, { kesifAniGecis: !durum.bakim.kesifAniGecis }))}
                  colors={colors}
                  uyar
                />
                <BakimChip
                  aktif={durum.bakim.karantinaIhlal}
                  label="Karantina ihlali (risk)"
                  onPress={() => void persist(bakimAyarla(durum, { karantinaIhlal: !durum.bakim.karantinaIhlal }))}
                  colors={colors}
                  uyar
                />

                <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 8 }}>Zaman</Text>
                <View style={styles.row}>
                  {[7, 14, 30].map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => void persist(ilerleGun(durum, g))}
                      style={[styles.chip, { borderColor: colors.tint }]}>
                      <Text style={{ color: colors.tint }}>+{g} gün</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => void persist(ilerleGun(durum, Math.max(0, durum.hedefGun - durum.gun)))}
                    style={[styles.chip, { borderColor: colors.accent }]}>
                    <Text style={{ color: colors.accent }}>→ {durum.hedefGun} gün</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => {
                    const r = satisYap(durum);
                    if (r.hata) Alert.alert('Satış', r.hata);
                    else void persist(r.durum);
                  }}
                  style={[styles.btn, { backgroundColor: colors.accent, marginTop: 8 }]}>
                  <Text style={styles.btnYazi}>Satış yap (senaryo)</Text>
                </Pressable>
              </>
            ) : null}

            <FiyatTablosu
              d={durum}
              onFiyat={(k, v) => void persist(fiyatGuncelle(durum, k, v))}
              colors={colors}
            />

            <OlayDefter d={durum} colors={colors} />

            {netKar(durum) != null ? (
              <Text style={{ color: colors.text, fontWeight: '800', marginTop: 12 }}>
                Net senaryo farkı: {netKar(durum)!.toLocaleString('tr-TR')} ₺
              </Text>
            ) : null}
          </>
        )}

        <View style={{ marginTop: 16, gap: 8 }}>
          <Pressable
            onPress={() => router.push('/maliyet/besi-planlama' as never)}
            style={[styles.btnOutline, { borderColor: colors.tint }]}>
            <Text style={{ color: colors.tint, fontWeight: '700' }}>Gerçek Besi Yönetimi planı →</Text>
          </Pressable>
          <Pressable onPress={() => void sifirla()} style={[styles.btnOutline, { borderColor: colors.warning }]}>
            <Text style={{ color: colors.warning, fontWeight: '700' }}>Oyunu sıfırla</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

function DurumOzeti({ d, colors }: { d: AkilliCiftlikDurum; colors: (typeof Colors)['light'] }) {
  return (
    <View style={[styles.kutu, { borderColor: colors.border }]}>
      <Text style={{ color: colors.text, fontWeight: '800' }}>
        Gün {d.gun} / hedef {d.hedefGun} · Nakit {d.nakit.toLocaleString('tr-TR')} ₺
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
        {d.kuzuBas} baş · ~{d.canliKgOrt} kg · Yatırım {d.toplamYatirim.toLocaleString('tr-TR')} ₺ · İşletme{' '}
        {d.toplamIsletmeGideri.toLocaleString('tr-TR')} ₺
      </Text>
    </View>
  );
}

function FiyatTablosu({
  d,
  onFiyat,
  colors,
}: {
  d: AkilliCiftlikDurum;
  onFiyat: (k: OyunFiyatKodu, v: number) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>Senaryo fiyatları (tolerans)</Text>
      {OYUN_FIYAT_KATALOG.map((k) => (
        <View key={k.kod} style={{ marginTop: 6 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            {k.etiket} · {k.min}–{k.max} {k.birim}
          </Text>
          <TextInput
            value={String(d.fiyatlar[k.kod])}
            onChangeText={(t) => {
              const v = sayi(t);
              if (v != null) onFiyat(k.kod, v);
            }}
            keyboardType="decimal-pad"
            style={[styles.input, { borderColor: colors.border, color: colors.text, marginBottom: 0 }]}
          />
          <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{k.not}</Text>
        </View>
      ))}
    </View>
  );
}

function OlayDefter({ d, colors }: { d: AkilliCiftlikDurum; colors: (typeof Colors)['light'] }) {
  if (d.olaylar.length === 0 && d.defterKayip.length === 0) return null;
  return (
    <View style={[styles.kutu, { borderColor: colors.border, marginTop: 12 }]}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>Olay defteri</Text>
      {d.defterKayip.map((k) => (
        <Text key={k.id} style={{ color: colors.warning, fontSize: 11, marginTop: 4 }}>
          G{k.gun}: {k.bas} baş kayıp (kurgu) — {k.neden}
        </Text>
      ))}
      {d.olaylar.slice(-6).map((o) => (
        <View key={o.id} style={{ marginTop: 6 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
            {o.baslik} (gün {o.gun})
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{o.metin}</Text>
          {o.onlem ? <Text style={{ color: colors.tint, fontSize: 10 }}>Önlem: {o.onlem}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function BakimChip({
  aktif,
  label,
  onPress,
  colors,
  uyar,
}: {
  aktif: boolean;
  label: string;
  onPress: () => void;
  colors: (typeof Colors)['light'];
  uyar?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: aktif ? (uyar ? colors.warning : colors.tint) : colors.border,
          marginBottom: 4,
        },
      ]}>
      <Text style={{ color: colors.text, fontSize: 12 }}>
        {aktif ? '☑' : '☐'} {label}
      </Text>
    </Pressable>
  );
}

function MiniInput({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={{ flex: 1, marginRight: 8 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  uyari: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  kutu: { borderWidth: 1, borderRadius: 12, padding: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, marginBottom: 8, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 8, padding: 8 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnYazi: { color: '#fff', fontWeight: '800' },
  btnOutline: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
});
