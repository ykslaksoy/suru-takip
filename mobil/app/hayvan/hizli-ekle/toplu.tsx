import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useSubscription } from '@/baglam/AbonelikBaglami';
import { countAnimals, getAnimals } from '@/kaynak/cekirdek/veritabani';
import { limitAsimindaPaketAc } from '@/kaynak/abonelik/limit';
import { PadokButonIzgarasi } from '@/bilesenler/hizli-kuzu/PadokButonIzgarasi';
import {
  TOPLU_KABUL_MAX_ADET,
  VARSAYILAN_KABUL_CINSIYET,
  VARSAYILAN_KABUL_PADOK,
  aralikAdet,
  ensureGozlemPadok,
  kupeAralikAyikla,
  onerilenBaslangicNo,
  otomatikKupeSerisi,
  topluKuzuKabul,
} from '@/kaynak/suru/hizli-kuzu-kabul';
import {
  KABUL_KAYNAK_SECENEKLER,
  addCambaz,
  addCiftlik,
  addOzelDurum,
  getCambazListesi,
  getCiftlikListesi,
  getOzelDurumListesi,
  kaynakDetayEksik,
  kaynakOzetMetni,
  kaynakUiEtiket,
  type KabulKaynakDetay,
  type KabulKaynakId,
} from '@/kaynak/suru/kabul-kaynaklari';
import type { AnimalSex } from '@/kaynak/cekirdek/tipler';

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  Alert.alert(baslik, mesaj);
}

/** Toplu kabul — kaynak (Cambaz/Çiftlik/Pazar/Ağılda doğum/Ekle), padok, aralık */
export default function TopluKabulScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const { refresh, ready, refreshKey } = useDatabase();
  const { limit, refresh: refreshSub } = useSubscription();

  const [adim, setAdim] = useState<'kaynak' | 'padok' | 'sayi' | 'onay'>('kaynak');
  const [kaynakId, setKaynakId] = useState<KabulKaynakId>('cambaz');
  const [detayDeger, setDetayDeger] = useState('');
  const [kmMetin, setKmMetin] = useState('');
  const [ozelEtiket, setOzelEtiket] = useState('');
  const [ekleAcik, setEkleAcik] = useState(false);
  const [yeniOzel, setYeniOzel] = useState('');

  const [cambazlar, setCambazlar] = useState<string[]>([]);
  const [ciftlikler, setCiftlikler] = useState<string[]>([]);
  const [ozeller, setOzeller] = useState<string[]>([]);

  const [padok, setPadok] = useState(VARSAYILAN_KABUL_PADOK);
  const [aralikMetin, setAralikMetin] = useState('');
  const [onek, setOnek] = useState('TR-');
  const [adetMetin, setAdetMetin] = useState('');
  const [baslangicMetin, setBaslangicMetin] = useState('');
  const [mevcutTags, setMevcutTags] = useState<string[]>([]);
  const [kayitliSayi, setKayitliSayi] = useState(0);
  const [busy, setBusy] = useState(false);
  /** Özet / onay tıklanınca inline Türkçe hata (disabled sessizliği yok) */
  const [sayiHata, setSayiHata] = useState('');
  /** Besi kuralı: varsayılan erkek; kullanıcı dişi seçerse korunur */
  const [sex, setSex] = useState<AnimalSex>(VARSAYILAN_KABUL_CINSIYET);

  const listeleriYukle = useCallback(async () => {
    const [c, f, o] = await Promise.all([
      getCambazListesi(),
      getCiftlikListesi(),
      getOzelDurumListesi(),
    ]);
    setCambazlar(c);
    setCiftlikler(f);
    setOzeller(o);
  }, []);

  useEffect(() => {
    void ensureGozlemPadok().then((ad) => setPadok(ad));
    void listeleriYukle();
  }, [listeleriYukle]);

  /** Seed / ensure bitmeden okuma → boş sürü → başlangıç 1 hatası; ready + refresh sonrası yeniden yükle */
  useEffect(() => {
    if (!ready) return;
    void getAnimals().then((list) => {
      setMevcutTags(list.map((a) => a.earTag));
      setKayitliSayi(list.length);
    });
  }, [ready, refreshKey]);

  /** max(önek max+1, kayıtlı hayvan+1) — 60 kuzu → 61; önek TR-34-… ile uyumsuz olsa bile */
  const onerilenBaslangic = useMemo(
    () => onerilenBaslangicNo(mevcutTags, onek, kayitliSayi),
    [mevcutTags, onek, kayitliSayi],
  );

  useEffect(() => {
    setBaslangicMetin(String(onerilenBaslangic));
  }, [onerilenBaslangic]);

  const kaynakDetay: KabulKaynakDetay = useMemo(() => {
    const km = parseFloat(kmMetin.replace(',', '.'));
    return {
      kaynak: kaynakId,
      deger: detayDeger,
      km: Number.isFinite(km) ? km : undefined,
      ozelEtiket: kaynakId === 'ozel' ? ozelEtiket || detayDeger : undefined,
    };
  }, [kaynakId, detayDeger, kmMetin, ozelEtiket]);

  const aralik = useMemo(
    () => (aralikMetin.trim() ? kupeAralikAyikla(aralikMetin, onek) : null),
    [aralikMetin, onek],
  );
  const adet = aralik ? aralikAdet(aralik) : parseInt(adetMetin, 10) || 0;
  const baslangicNo = parseInt(baslangicMetin, 10);
  const otomatikOnizleme = useMemo(() => {
    if (aralik || adet < 1) return null;
    return otomatikKupeSerisi({
      onek,
      adet,
      mevcutEarTags: mevcutTags,
      toplamHayvan: kayitliSayi,
      baslangic: Number.isFinite(baslangicNo) && baslangicNo >= 1 ? baslangicNo : undefined,
    });
  }, [aralik, adet, onek, mevcutTags, kayitliSayi, baslangicNo]);

  const kaynakSec = (id: KabulKaynakId) => {
    setKaynakId(id);
    setEkleAcik(false);
    if (id !== 'cambaz' && id !== 'ciftlik') setDetayDeger('');
    if (id !== 'pazar') setKmMetin('');
    if (id !== 'ozel') setOzelEtiket('');
  };

  const kaynaktanDevam = async () => {
    const eksik = kaynakDetayEksik(kaynakDetay);
    if (eksik) {
      uyar('Eksik', eksik);
      return;
    }
    if (kaynakId === 'cambaz' && detayDeger.trim()) {
      setCambazlar(await addCambaz(detayDeger));
    }
    if (kaynakId === 'ciftlik' && detayDeger.trim()) {
      setCiftlikler(await addCiftlik(detayDeger));
    }
    if (kaynakId === 'ozel') {
      const et = (ozelEtiket || detayDeger).trim();
      if (et) setOzeller(await addOzelDurum(et));
    }
    setAdim('padok');
  };

  const ozelEkleKaydet = async () => {
    const ad = yeniOzel.trim();
    if (!ad) {
      uyar('Ekle', 'Durum adını yazın (ör. Komşu ağıldan)');
      return;
    }
    const list = await addOzelDurum(ad);
    setOzeller(list);
    setKaynakId('ozel');
    setOzelEtiket(ad);
    setDetayDeger(ad);
    setYeniOzel('');
    setEkleAcik(false);
  };

  /** Adet/aralık geçerliyse onaya geç; değilse net Türkçe hata (buton asla sessiz ölmez) */
  const ozetOnayaGit = () => {
    if (!padok.trim()) {
      const msg = 'Hedef padok seçin';
      setSayiHata(msg);
      uyar('Padok', msg);
      return;
    }
    if (aralikMetin.trim() && !aralik) {
      const msg = 'Küpe aralığını kontrol edin (örn. 1001–1100)';
      setSayiHata(msg);
      uyar('Aralık', msg);
      return;
    }
    if (adet < 1) {
      const msg = 'Kaç kuzu geldiğini yazın (adet) veya geçerli küpe aralığı girin';
      setSayiHata(msg);
      uyar('Adet', msg);
      return;
    }
    if (adet > TOPLU_KABUL_MAX_ADET) {
      const msg = `Bir seferde en fazla ${TOPLU_KABUL_MAX_ADET} kuzu`;
      setSayiHata(msg);
      uyar('Adet', msg);
      return;
    }
    setSayiHata('');
    setAdim('onay');
  };

  const onayla = async () => {
    if (busy) return;
    if (!padok.trim()) {
      uyar('Padok', 'Hedef padok seçin');
      return;
    }
    if (adet < 1) {
      uyar('Sayı', 'Küpe aralığı veya adet girin');
      return;
    }
    if (adet > TOPLU_KABUL_MAX_ADET) {
      uyar('Adet', `Bir seferde en fazla ${TOPLU_KABUL_MAX_ADET} kuzu`);
      return;
    }
    setBusy(true);
    try {
      const count = await countAnimals();
      if (count + adet > limit) {
        const ac = await limitAsimindaPaketAc(count + adet);
        await refreshSub();
        if (!ac.success) {
          uyar('Limit', ac.message);
          router.push('/abonelik' as never);
          return;
        }
      }
      const sonuc = await topluKuzuKabul({
        paddock: padok,
        kaynak: kaynakId,
        kaynakOzet: kaynakOzetMetni(kaynakDetay),
        sex,
        aralik: aralik ?? undefined,
        adet: aralik ? undefined : adet,
        otomatikOnek: onek,
        otomatikBaslangic:
          !aralik && Number.isFinite(baslangicNo) && baslangicNo >= 1 ? baslangicNo : undefined,
      });
      refresh();
      router.replace({
        pathname: '/hayvan/hizli-ekle/sonuc',
        params: {
          ids: sonuc.hayvanlar.map((h) => h.id).join(','),
          tags: sonuc.hayvanlar.map((h) => h.earTag).join(','),
          padok,
          plan: sonuc.planMesaj,
          kupe: sonuc.kupeNeden ?? '',
        },
      } as never);
    } catch (e) {
      uyar('Hata', e instanceof Error ? e.message : 'Kabul başarısız');
    } finally {
      setBusy(false);
    }
  };

  const chipList =
    kaynakId === 'cambaz' ? cambazlar : kaynakId === 'ciftlik' ? ciftlikler : kaynakId === 'ozel' ? ozeller : [];

  return (
    <>
      <Stack.Screen options={{ title: 'Toplu kabul' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPadBottom }]}>
        <Text style={[styles.lead, { color: colors.text }]}>
          {adim === 'kaynak' && 'Şuradan geldi'}
          {adim === 'padok' && 'Hedef padok'}
          {adim === 'sayi' && 'Kaç kuzu / hangi küpeler'}
          {adim === 'onay' && 'Onayla ve kaydet'}
        </Text>

        {adim === 'kaynak' && (
          <View style={styles.gap}>
            {KABUL_KAYNAK_SECENEKLER.map((k) => (
              <Pressable
                key={k.id}
                accessibilityRole="button"
                accessibilityState={{ selected: kaynakId === k.id && !ekleAcik }}
                onPress={() => kaynakSec(k.id)}
                style={[
                  styles.bigBtn,
                  {
                    borderColor: kaynakId === k.id && !ekleAcik ? colors.tint : colors.border,
                    backgroundColor:
                      kaynakId === k.id && !ekleAcik ? colors.tint + '18' : colors.card,
                  },
                ]}>
                <Text style={[styles.bigBtnText, { color: colors.text }]}>{k.label}</Text>
                {k.ipucu ? (
                  <Text style={{ color: colors.textSecondary, marginTop: 4, fontWeight: '600' }}>
                    {k.ipucu}
                  </Text>
                ) : null}
              </Pressable>
            ))}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Özel durum ekle"
              onPress={() => {
                setEkleAcik(true);
                setKaynakId('ozel');
              }}
              style={[
                styles.bigBtn,
                {
                  borderColor: ekleAcik || kaynakId === 'ozel' ? colors.tint : colors.border,
                  backgroundColor:
                    ekleAcik || kaynakId === 'ozel' ? colors.tint + '18' : colors.card,
                  borderStyle: 'dashed',
                },
              ]}>
              <Text style={[styles.bigBtnText, { color: colors.tint }]}>+ Ekle</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4, fontWeight: '600' }}>
                Başka durum (kendi listenize kaydolur)
              </Text>
            </Pressable>

            {ozeller.length > 0 && kaynakId === 'ozel' ? (
              <View style={styles.chipWrap}>
                {ozeller.map((o) => (
                  <Pressable
                    key={o}
                    onPress={() => {
                      setOzelEtiket(o);
                      setDetayDeger(o);
                      setEkleAcik(false);
                    }}
                    style={[
                      styles.chip,
                      {
                        borderColor: ozelEtiket === o ? colors.tint : colors.border,
                        backgroundColor: ozelEtiket === o ? colors.tint + '22' : colors.card,
                      },
                    ]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{o}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {ekleAcik ? (
              <View style={[styles.detayKutu, { borderColor: colors.tint, backgroundColor: colors.card }]}>
                <Text style={[styles.label, { color: colors.text }]}>Yeni durum adı</Text>
                <TextInput
                  value={yeniOzel}
                  onChangeText={setYeniOzel}
                  placeholder="Örn. Komşu ağıldan"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  ]}
                />
                <Pressable
                  onPress={() => void ozelEkleKaydet()}
                  style={[styles.next, { backgroundColor: colors.tint, marginTop: 4 }]}>
                  <Text style={styles.nextText}>Listeye ekle</Text>
                </Pressable>
              </View>
            ) : null}

            {kaynakId === 'cambaz' ? (
              <View style={[styles.detayKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.label, { color: colors.text }]}>Kimden? (cambaz adı)</Text>
                <TextInput
                  value={detayDeger}
                  onChangeText={setDetayDeger}
                  placeholder="Ad soyad"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  ]}
                />
                {cambazlar.length > 0 ? (
                  <View style={styles.chipWrap}>
                    {cambazlar.map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setDetayDeger(c)}
                        style={[
                          styles.chip,
                          {
                            borderColor: detayDeger === c ? colors.tint : colors.border,
                            backgroundColor: detayDeger === c ? colors.tint + '22' : colors.background,
                          },
                        ]}>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                    İlk kayıt — sonraki kabullerde listeden seçersiniz
                  </Text>
                )}
              </View>
            ) : null}

            {kaynakId === 'ciftlik' ? (
              <View style={[styles.detayKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.label, { color: colors.text }]}>Hangi çiftlik?</Text>
                <TextInput
                  value={detayDeger}
                  onChangeText={setDetayDeger}
                  placeholder="Çiftlik adı"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                  ]}
                />
                {ciftlikler.length > 0 ? (
                  <View style={styles.chipWrap}>
                    {ciftlikler.map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setDetayDeger(c)}
                        style={[
                          styles.chip,
                          {
                            borderColor: detayDeger === c ? colors.tint : colors.border,
                            backgroundColor: detayDeger === c ? colors.tint + '22' : colors.background,
                          },
                        ]}>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {kaynakId === 'pazar' ? (
              <View style={[styles.detayKutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.label, { color: colors.text }]}>Mesafe</Text>
                <Text style={{ color: colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>
                  Pazardan ağıla kaç kilometre?
                </Text>
                <View style={styles.kmRow}>
                  <TextInput
                    value={kmMetin}
                    onChangeText={setKmMetin}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.kmInput,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background,
                      },
                    ]}
                  />
                  <Text style={[styles.kmBirim, { color: colors.tint }]}>km</Text>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={() => void kaynaktanDevam()}
              style={[styles.next, { backgroundColor: colors.tint }]}>
              <Text style={styles.nextText}>Devam — padok</Text>
            </Pressable>
          </View>
        )}

        {adim === 'padok' && (
          <View style={styles.gap}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>
              Varsayılan: Gözlem padok (yeni kabul). Değiştirebilirsiniz.
            </Text>
            <PadokButonIzgarasi
              oneriAd={VARSAYILAN_KABUL_PADOK}
              yeniSonraSec={false}
              onSec={(ad) => {
                setPadok(ad);
                setAdim('sayi');
              }}
            />
            <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 8 }}>
              Seçili: {padok}
            </Text>
            <Pressable
              onPress={() => setAdim('sayi')}
              style={[styles.next, { backgroundColor: colors.tint }]}>
              <Text style={styles.nextText}>Devam — sayı / küpe</Text>
            </Pressable>
            <Pressable onPress={() => setAdim('kaynak')} style={styles.backLink}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>← Kaynak</Text>
            </Pressable>
          </View>
        )}

        {adim === 'sayi' && (
          <View style={styles.gap}>
            <Text style={[styles.label, { color: colors.text }]}>
              Küpe aralığı (biliniyorsa)
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
              Örn. 001001–001100 veya TR-34-1001–TR-34-1100
            </Text>
            <TextInput
              value={aralikMetin}
              onChangeText={(t) => {
                setAralikMetin(t);
                setSayiHata('');
              }}
              placeholder="1001–1100"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
              ]}
            />
            <Text style={[styles.label, { color: colors.text }]}>Küpe öneki (aralık kısa ise)</Text>
            <TextInput
              value={onek}
              onChangeText={setOnek}
              placeholder="TR-"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
              ]}
            />
            <Text style={[styles.label, { color: colors.text }]}>
              veya sadece adet (küpe otomatik)
            </Text>
            <TextInput
              value={adetMetin}
              onChangeText={(t) => {
                setAdetMetin(t);
                setSayiHata('');
              }}
              keyboardType="number-pad"
              placeholder="örn. 100"
              placeholderTextColor={colors.textSecondary}
              editable={!aralikMetin.trim()}
              style={[
                styles.input,
                {
                  borderColor: sayiHata && adet < 1 ? '#c62828' : colors.border,
                  color: colors.text,
                  backgroundColor: colors.card,
                  opacity: aralikMetin.trim() ? 0.5 : 1,
                },
              ]}
            />
            {!aralikMetin.trim() ? (
              <>
                <Text style={[styles.label, { color: colors.text }]}>
                  Başlangıç no (opsiyonel)
                </Text>
                <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
                  Öneri: kayıtlı {kayitliSayi} hayvan → sonraki ({onerilenBaslangic}). Düzenlenebilir.
                </Text>
                <TextInput
                  value={baslangicMetin}
                  onChangeText={setBaslangicMetin}
                  keyboardType="number-pad"
                  placeholder={String(onerilenBaslangic)}
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.card,
                    },
                  ]}
                />
              </>
            ) : null}
            <Text style={[styles.label, { color: colors.text }]}>Cinsiyet</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
              Besi varsayılanı erkek — dişi seçerseniz korunur
            </Text>
            <View style={styles.chipWrap}>
              {(
                [
                  { id: 'male' as const, label: 'Erkek' },
                  { id: 'female' as const, label: 'Dişi' },
                ] as const
              ).map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sex === s.id }}
                  onPress={() => setSex(s.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: sex === s.id ? colors.tint : colors.border,
                      backgroundColor: sex === s.id ? colors.tint : colors.card,
                    },
                  ]}>
                  <Text
                    style={{
                      color: sex === s.id ? '#fff' : colors.text,
                      fontWeight: '800',
                    }}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 16 }}>
              {adet > 0 ? `${adet} kuzu → ${padok}` : 'Aralık veya adet girin'}
            </Text>
            {aralik ? (
              <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                Aralık: {aralik.onek}
                {aralik.baslangic}–{aralik.onek}
                {aralik.bitis}
              </Text>
            ) : null}
            {otomatikOnizleme ? (
              <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                {otomatikOnizleme.neden}
                {'\n'}
                İlk: {otomatikOnizleme.etiketler[0]} · Son:{' '}
                {otomatikOnizleme.etiketler[otomatikOnizleme.etiketler.length - 1]}
              </Text>
            ) : null}
            {sayiHata ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: '#c62828', fontWeight: '800', marginTop: 10, lineHeight: 20 }}>
                {sayiHata}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Özet onay"
              onPress={ozetOnayaGit}
              style={[styles.next, { backgroundColor: colors.tint }]}>
              <Text style={styles.nextText}>Özet / onay</Text>
            </Pressable>
            <Pressable onPress={() => setAdim('padok')} style={styles.backLink}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>← Padok</Text>
            </Pressable>
          </View>
        )}

        {adim === 'onay' && (
          <View style={styles.gap}>
            <View
              style={[
                styles.ozet,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.ozetSatir, { color: colors.text }]}>
                Kaynak: {kaynakUiEtiket(kaynakDetay)}
              </Text>
              <Text style={[styles.ozetSatir, { color: colors.text }]}>Padok: {padok}</Text>
              <Text style={[styles.ozetSatir, { color: colors.text }]}>
                Cinsiyet: {sex === 'female' ? 'Dişi' : 'Erkek'}
              </Text>
              <Text style={[styles.ozetSatir, { color: colors.text }]}>
                Adet: {adet}
                {aralik
                  ? ` · ${aralik.onek}${aralik.baslangic}–${aralik.onek}${aralik.bitis}`
                  : otomatikOnizleme
                    ? ` · ${otomatikOnizleme.etiketler[0]}…${otomatikOnizleme.etiketler[otomatikOnizleme.etiketler.length - 1]}`
                    : ' · otomatik küpe'}
              </Text>
              {otomatikOnizleme ? (
                <Text style={{ color: colors.textSecondary, marginBottom: 8, lineHeight: 20 }}>
                  {otomatikOnizleme.neden}
                </Text>
              ) : null}
              <Text style={{ color: colors.textSecondary, marginTop: 10, lineHeight: 20 }}>
                Onayda hayvanlar hemen oluşur. Aşı / tartım / yem takvimi satışa kadar
                hazırlanır. Tarım Bakanlığı aşıları görevlere eklenir.
              </Text>
            </View>
            <Pressable
              disabled={busy}
              onPress={() => void onayla()}
              style={[styles.next, { backgroundColor: colors.tint, opacity: busy ? 0.5 : 1 }]}>
              <Text style={styles.nextText}>
                {busy ? 'Kaydediliyor…' : `${adet} kuzuyu kabul et`}
              </Text>
            </Pressable>
            <Pressable onPress={() => setAdim('sayi')} style={styles.backLink}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>← Sayı</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  lead: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
  gap: { gap: 4 },
  bigBtn: {
    borderWidth: 2,
    borderRadius: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    marginBottom: 10,
  },
  bigBtnText: { fontSize: 18, fontWeight: '800' },
  label: { fontWeight: '700', marginTop: 8, marginBottom: 6, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    minHeight: 54,
    marginBottom: 10,
  },
  detayKutu: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kmInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '800',
    minHeight: 64,
    textAlign: 'center',
  },
  kmBirim: { fontSize: 22, fontWeight: '900', minWidth: 48 },
  next: {
    marginTop: 16,
    borderRadius: 14,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  backLink: { paddingVertical: 14, alignItems: 'center' },
  ozet: { borderWidth: 1, borderRadius: 14, padding: 16 },
  ozetSatir: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
});
