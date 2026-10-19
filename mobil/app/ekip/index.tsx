/**
 * Ekip ve yetkiler — bu cihazı kullanan kişiler (Sahip / Ortak / Bakıcı / Veteriner),
 * aktif kullanıcıyı değiştir, kişi başı yetkiler (yalnız Sahip değiştirir), isteğe bağlı PIN.
 */
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useEkip } from '@/bilesenler/ekip/useEkip';
import { kisiKaydet, kisiSil, kullaniciDegistir, pinAyarla, yetkiAyarla } from '@/kaynak/ekip/depo';
import {
  ekipYonetebilir,
  ROL_ETIKET,
  ROL_SIMGE,
  ROLLER,
  VARSAYILAN_YETKI,
  YETKI_ACIKLAMA,
  YETKI_ETIKET,
  YETKILER,
  yetkiVar,
  type Kisi,
  type Rol,
} from '@/kaynak/ekip/hesap';

function onayla(mesaj: string, evet: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(mesaj)) evet();
    return;
  }
  Alert.alert('Onay', mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Evet', style: 'destructive', onPress: evet },
  ]);
}

export default function EkipScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { kisiler, aktif } = useEkip();
  const sahip = ekipYonetebilir(aktif);
  const [hata, setHata] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [yeni, setYeni] = useState<{ id?: string; ad: string; rol: Rol } | null>(null);
  const [pinIste, setPinIste] = useState<{ kisi: Kisi; pin: string } | null>(null);
  const [pinKoy, setPinKoy] = useState<{ kisi: Kisi; pin: string } | null>(null);
  const [acik, setAcik] = useState<string | null>(null);

  const calistir = async (f: () => Promise<unknown>, ok?: string) => {
    setHata(null);
    try {
      await f();
      if (ok) setMesaj(ok);
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e));
    }
  };

  const gec = (k: Kisi) => {
    if (k.id === aktif.id) return;
    if (k.pinOzet) setPinIste({ kisi: k, pin: '' });
    else void calistir(() => kullaniciDegistir(k.id), `Aktif kullanıcı: ${k.ad}`);
  };

  const Chip = ({ t, sec, onPress }: { t: string; sec: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.chip, { borderColor: sec ? colors.tint : colors.border, backgroundColor: sec ? colors.tint : colors.background }]}>
      <Text style={{ color: sec ? '#fff' : colors.text, fontWeight: '700', fontSize: 13 }}>{t}</Text>
    </Pressable>
  );
  const Btn = ({ t, onPress, birincil, tehlike }: { t: string; onPress: () => void; birincil?: boolean; tehlike?: boolean }) => (
    <Pressable
      onPress={onPress}
      style={[styles.btn, birincil ? { backgroundColor: colors.tint } : { borderWidth: 1, borderColor: tehlike ? colors.danger : colors.border }]}>
      <Text style={{ color: birincil ? '#fff' : tehlike ? colors.danger : colors.text, fontWeight: '700' }}>{t}</Text>
    </Pressable>
  );
  const inp = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }];

  return (
    <>
      <Stack.Screen options={{ title: 'Ekip ve yetkiler' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>ŞU AN KULLANAN</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 }}>
            {ROL_SIMGE[aktif.rol]} {aktif.ad} · {ROL_ETIKET[aktif.rol]}
          </Text>
          <View style={[styles.chipSatir, { marginTop: 8 }]}>
            {YETKILER.map((y) => (
              <Text key={y} style={{ color: yetkiVar(aktif, y) ? colors.success : colors.danger, fontSize: 13, marginRight: 10 }}>
                {yetkiVar(aktif, y) ? '✓' : '✕'} {YETKI_ETIKET[y]}
              </Text>
            ))}
          </View>
        </View>

        {mesaj ? (
          <Pressable onPress={() => setMesaj(null)} style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.success }]}>
            <Text style={{ color: colors.text }}>✅ {mesaj}</Text>
          </Pressable>
        ) : null}
        {hata ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.danger }]}>
            <Text style={{ color: colors.danger }}>{hata}</Text>
          </View>
        ) : null}

        {pinIste ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <Text style={[styles.baslik, { color: colors.text }]}>🔑 {pinIste.kisi.ad} PIN</Text>
            <TextInput value={pinIste.pin} onChangeText={(t) => setPinIste({ ...pinIste, pin: t.replace(/\D/g, '').slice(0, 6) })} keyboardType="number-pad" secureTextEntry placeholder="PIN" placeholderTextColor={colors.textSecondary} style={inp} autoFocus />
            <View style={styles.ikili}>
              <View style={{ flex: 1 }}>
                <Btn t="Vazgeç" onPress={() => setPinIste(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn
                  t="Geç"
                  birincil
                  onPress={() => void calistir(async () => { await kullaniciDegistir(pinIste.kisi.id, pinIste.pin); setPinIste(null); }, `Aktif kullanıcı: ${pinIste.kisi.ad}`)}
                />
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.baslik, { color: colors.text, flex: 1, marginBottom: 0 }]}>👥 Bu cihazdaki ekip</Text>
            {sahip && !yeni ? (
              <Pressable onPress={() => setYeni({ ad: '', rol: 'bakici' })}>
                <Text style={{ color: colors.tint, fontWeight: '800' }}>+ Kişi ekle</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.not, { color: colors.textSecondary, marginVertical: 6 }]}>Kişiye dokun → o kişiye geç. Yaptığı her işlem işlem kaydına onun adıyla yazılır.</Text>

          {yeni ? (
            <View style={[styles.form, { borderColor: colors.tint }]}>
              <TextInput value={yeni.ad} onChangeText={(t) => setYeni({ ...yeni, ad: t })} placeholder="Ad (ör. Mehmet usta)" placeholderTextColor={colors.textSecondary} style={inp} />
              <View style={[styles.chipSatir, { marginVertical: 8 }]}>
                {ROLLER.map((r) => (
                  <Chip key={r} t={`${ROL_SIMGE[r]} ${ROL_ETIKET[r]}`} sec={yeni.rol === r} onPress={() => setYeni({ ...yeni, rol: r })} />
                ))}
              </View>
              <Text style={[styles.not, { color: colors.textSecondary }]}>
                Varsayılan: {YETKILER.filter((y) => VARSAYILAN_YETKI[yeni.rol][y]).map((y) => YETKI_ETIKET[y]).join(', ') || 'yetki yok'}. Sonra tek tek değiştirebilirsin.
              </Text>
              <View style={styles.ikili}>
                <View style={{ flex: 1 }}>
                  <Btn t="Vazgeç" onPress={() => setYeni(null)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Btn t="Kaydet" birincil onPress={() => void calistir(async () => { await kisiKaydet(yeni); setYeni(null); }, `${yeni.ad.trim()} eklendi`)} />
                </View>
              </View>
            </View>
          ) : null}

          {kisiler.map((k) => {
            const ben = k.id === aktif.id;
            return (
              <View key={k.id} style={[styles.kisi, { borderColor: colors.border }]}>
                <Pressable onPress={() => gec(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 22 }}>{ROL_SIMGE[k.rol]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                      {k.ad} {k.pinOzet ? '🔒' : ''}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {ROL_ETIKET[k.rol]} · {YETKILER.filter((y) => yetkiVar(k, y)).length}/{YETKILER.length} yetki
                    </Text>
                  </View>
                  {ben ? (
                    <Text style={{ color: colors.success, fontWeight: '800', fontSize: 12 }}>● aktif</Text>
                  ) : (
                    <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>Geç ›</Text>
                  )}
                  {sahip || ben ? (
                    <Pressable onPress={() => setAcik(acik === k.id ? null : k.id)} hitSlop={8}>
                      <Text style={{ color: colors.textSecondary, fontSize: 18, paddingHorizontal: 6 }}>{acik === k.id ? '▴' : '▾'}</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
                {acik === k.id ? (
                  <View style={{ marginTop: 8 }}>
                    {YETKILER.map((y) => (
                      <View key={y} style={styles.yetkiSatir}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: '600' }}>{YETKI_ETIKET[y]}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{YETKI_ACIKLAMA[y]}</Text>
                        </View>
                        <Switch
                          value={yetkiVar(k, y)}
                          disabled={!sahip || k.rol === 'sahip'}
                          onValueChange={(v) => void calistir(() => yetkiAyarla(k.id, y, v))}
                          trackColor={{ true: colors.tint, false: colors.border }}
                        />
                      </View>
                    ))}
                    {k.rol === 'sahip' ? <Text style={[styles.not, { color: colors.textSecondary }]}>Sahip her şeyi yapar.</Text> : null}
                    {sahip ? (
                      <View style={[styles.chipSatir, { marginTop: 8 }]}>
                        {ROLLER.map((r) => (
                          <Chip key={r} t={ROL_ETIKET[r]} sec={k.rol === r} onPress={() => void calistir(() => kisiKaydet({ id: k.id, ad: k.ad, rol: r }))} />
                        ))}
                      </View>
                    ) : null}
                    {pinKoy?.kisi.id === k.id ? (
                      <View style={{ marginTop: 8 }}>
                        <TextInput value={pinKoy.pin} onChangeText={(t) => setPinKoy({ ...pinKoy, pin: t.replace(/\D/g, '').slice(0, 6) })} keyboardType="number-pad" secureTextEntry placeholder="Yeni PIN (4–6 rakam)" placeholderTextColor={colors.textSecondary} style={inp} />
                        <View style={styles.ikili}>
                          <View style={{ flex: 1 }}>
                            <Btn t="Vazgeç" onPress={() => setPinKoy(null)} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Btn t="PIN kaydet" birincil onPress={() => void calistir(async () => { await pinAyarla(k.id, pinKoy.pin); setPinKoy(null); }, `${k.ad} için PIN kondu`)} />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.ikili, { marginTop: 8 }]}>
                        <View style={{ flex: 1 }}>
                          <Btn t={k.pinOzet ? 'PIN değiştir' : 'PIN koy'} onPress={() => setPinKoy({ kisi: k, pin: '' })} />
                        </View>
                        {k.pinOzet ? (
                          <View style={{ flex: 1 }}>
                            <Btn t="PIN kaldır" onPress={() => void calistir(() => pinAyarla(k.id, null), 'PIN kaldırıldı')} />
                          </View>
                        ) : null}
                        {sahip && !ben ? (
                          <View style={{ flex: 1 }}>
                            <Btn t="Çıkar" tehlike onPress={() => onayla(`${k.ad} ekipten çıkarılsın mı? Eski işlem kayıtları adıyla kalır.`, () => void calistir(() => kisiSil(k.id), `${k.ad} çıkarıldı`))} />
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.baslik, { color: colors.text }]}>ℹ️ Nasıl çalışır</Text>
          <Text style={[styles.not, { color: colors.textSecondary }]}>
            • Ekip bu cihazda tutulur; sunucu yok. Her telefon kendi ekibini ayrı kurar, kayıtlar cihazlar arasında paylaşılmaz.{'\n'}
            • Yetkiler bu cihazdaki ekranları ve işlemleri kısıtlar; veriyi şifrelemez. Bakıcı sahibe geçmesin diye Sahip profiline PIN koy.{'\n'}
            • Yalnız Sahip kişi ekler, rol ve yetki değiştirir. En az bir Sahip her zaman kalır.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  not: { fontSize: 13, lineHeight: 19 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  btn: { borderRadius: 10, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  ikili: { flexDirection: 'row', gap: 8, marginTop: 8 },
  form: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginVertical: 8 },
  kisi: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  yetkiSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
});
