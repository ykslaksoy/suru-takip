/**
 * Excel / CSV — dışa aktar (sürü, tedaviler, tartımlar, maliyetler; .xlsx + .csv) ve
 * içe aktar (dosya seç / yapıştır → sütun eşle → önizle → mükerrer küpe kararı → kaydet).
 */
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { tumSayfalar, veriSetiTablosu } from '@/kaynak/excel/disa-aktar';
import { dosyaAdi, VERI_SETLERI, type VeriSeti } from '@/kaynak/excel/disa-aktar-tablo';
import { csvOku, csvYaz } from '@/kaynak/excel/csv';
import { xlsxYaz } from '@/kaynak/excel/xlsx';
import { dosyaOku } from '@/kaynak/excel/oku';
import { DOSYA_SECICI_VAR, dosyaIndir, dosyaSec } from '@/kaynak/excel/dosya';
import {
  eslesmeDegistir,
  HEDEF_ALANLAR,
  onizle,
  otomatikEslesme,
  SATIR_DURUM_ETIKET,
  sablonTablosu,
  uygulanacaklar,
  type Eslesme,
  type HedefAlan,
  type SatirDurum,
  type TekrarPolitika,
} from '@/kaynak/excel/ice-aktar';
import { iceAktarUygula, mevcutKupeAnahtarlari, type IceAktarSonuc } from '@/kaynak/excel/ice-aktar-uygula';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIME = 'text/csv;charset=utf-8';

export default function ExcelScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [mesgul, setMesgul] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);

  // içe aktarma
  const [dosyaAd, setDosyaAd] = useState<string | null>(null);
  const [tablo, setTablo] = useState<string[][] | null>(null);
  const [eslesme, setEslesme] = useState<Eslesme>({});
  const [mevcut, setMevcut] = useState<Set<string>>(new Set());
  const [politika, setPolitika] = useState<TekrarPolitika>('atla');
  const [yapistir, setYapistir] = useState<string | null>(null);
  const [acikSutun, setAcikSutun] = useState<number | null>(null);
  const [filtre, setFiltre] = useState<SatirDurum | 'hepsi'>('hepsi');
  const [sonuc, setSonuc] = useState<IceAktarSonuc | null>(null);

  const disaAktar = async (id: VeriSeti | 'hepsi', tur: 'xlsx' | 'csv') => {
    setMesgul(`${id}-${tur}`);
    setMesaj(null);
    try {
      if (id === 'hepsi') {
        await dosyaIndir(dosyaAdi('tum-veriler', 'xlsx'), xlsxYaz(await tumSayfalar()), XLSX_MIME);
        setMesaj('Tüm veriler tek Excel dosyasına aktarıldı (4 sayfa).');
      } else {
        const v = VERI_SETLERI.find((x) => x.id === id)!;
        const t = await veriSetiTablosu(id);
        if (tur === 'xlsx') await dosyaIndir(dosyaAdi(v.dosya, 'xlsx'), xlsxYaz([{ ad: v.ad, satirlar: t }]), XLSX_MIME);
        else await dosyaIndir(dosyaAdi(v.dosya, 'csv'), csvYaz(t), CSV_MIME);
        setMesaj(`${v.ad}: ${Math.max(0, t.length - 1)} satır indirildi (.${tur}).`);
      }
    } catch (e) {
      setMesaj(`Aktarılamadı: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMesgul(null);
    }
  };

  const tabloyuAc = useCallback(async (t: string[][], ad: string) => {
    if (t.length < 2) {
      setMesaj('Dosyada başlık + en az bir satır bulunamadı.');
      return;
    }
    setMevcut(await mevcutKupeAnahtarlari());
    setTablo(t);
    setDosyaAd(ad);
    setEslesme(otomatikEslesme(t[0]));
    setSonuc(null);
    setFiltre('hepsi');
    setYapistir(null);
  }, []);

  const dosyaSecTikla = async () => {
    setMesaj(null);
    const f = await dosyaSec();
    if (!f) return;
    try {
      const o = dosyaOku(f.veri);
      await tabloyuAc(o.tablo, f.ad + (o.sayfaAdi && o.digerSayfalar.length > 1 ? ` · ${o.sayfaAdi}` : ''));
    } catch (e) {
      setMesaj(`Dosya okunamadı: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const onizleme = useMemo(() => (tablo ? onizle(tablo, eslesme, mevcut) : null), [tablo, eslesme, mevcut]);
  const yazilacak = onizleme ? uygulanacaklar(onizleme, politika).length : 0;

  const kaydet = async () => {
    if (!onizleme || !yazilacak) return;
    setMesgul('ice');
    try {
      const r = await iceAktarUygula(onizleme, politika);
      setSonuc(r);
      setTablo(null);
      refresh();
    } catch (e) {
      setMesaj(`Kaydedilemedi: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMesgul(null);
    }
  };

  const alanAdi = (a: HedefAlan | null | undefined) => (a ? HEDEF_ALANLAR.find((x) => x.id === a)?.ad ?? a : 'Alma');
  const durumRenk = (d: SatirDurum) =>
    d === 'yeni' ? colors.success : d === 'mevcut' ? colors.warning : d === 'hatali' ? colors.danger : colors.textSecondary;

  const Btn = ({ t, onPress, birincil, k }: { t: string; onPress: () => void; birincil?: boolean; k?: string }) => (
    <Pressable
      onPress={onPress}
      disabled={!!mesgul}
      style={[
        styles.btn,
        birincil ? { backgroundColor: colors.tint } : { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
        mesgul && mesgul !== k ? { opacity: 0.6 } : null,
      ]}>
      {mesgul && mesgul === k ? (
        <ActivityIndicator color={birincil ? '#fff' : colors.tint} />
      ) : (
        <Text style={{ color: birincil ? '#fff' : colors.text, fontWeight: '700' }}>{t}</Text>
      )}
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Excel / CSV' }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {mesaj ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
            <Text style={{ color: colors.text }}>{mesaj}</Text>
          </View>
        ) : null}

        {sonuc ? (
          <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.success }]}>
            <Text style={[styles.baslik, { color: colors.text }]}>✅ İçe aktarma tamam</Text>
            <Text style={{ color: colors.text, lineHeight: 22 }}>
              {sonuc.eklenen} yeni kuzu · {sonuc.guncellenen} güncellendi · {sonuc.tartim} tartım · {sonuc.atlanan} satır atlandı
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Btn t="Sürüye git" birincil onPress={() => router.push('/(tabs)/suru' as never)} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn t="İşlem kaydı" onPress={() => router.push('/gecmis?sekme=kayit' as never)} />
              </View>
            </View>
          </View>
        ) : null}

        {!tablo ? (
          <>
            {/* DIŞA AKTAR */}
            <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.baslik, { color: colors.text }]}>⬇️ Dışa aktar</Text>
              <Btn t="Tüm veriler · tek Excel (4 sayfa)" birincil k="hepsi-xlsx" onPress={() => void disaAktar('hepsi', 'xlsx')} />
              {VERI_SETLERI.map((v) => (
                <View key={v.id} style={[styles.satir, { borderColor: colors.border }]}>
                  <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' }}>
                    {v.simge} {v.ad}
                  </Text>
                  <View style={{ width: 78 }}>
                    <Btn t=".xlsx" k={`${v.id}-xlsx`} onPress={() => void disaAktar(v.id, 'xlsx')} />
                  </View>
                  <View style={{ width: 70 }}>
                    <Btn t=".csv" k={`${v.id}-csv`} onPress={() => void disaAktar(v.id, 'csv')} />
                  </View>
                </View>
              ))}
              <Text style={[styles.not, { color: colors.textSecondary }]}>
                CSV Türkçe Excel için ';' ayırıcı ve UTF-8 ile yazılır. Sürü listesi aynı sütunlarla geri içe aktarılabilir.
              </Text>
            </View>

            {/* İÇE AKTAR */}
            <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.baslik, { color: colors.text }]}>⬆️ İçe aktar (kuzu listesi)</Text>
              <Text style={[styles.not, { color: colors.textSecondary, marginBottom: 10 }]}>
                Başka uygulamadan ya da kendi Excel'inden kuzu listesi al. Sütunlar otomatik eşlenir; kaydetmeden önce
                her satırı görürsün. Aynı küpe sürüde varsa atla ya da güncelle seçersin.
              </Text>
              {DOSYA_SECICI_VAR ? <Btn t="📄 Dosya seç (.xlsx / .csv)" birincil onPress={() => void dosyaSecTikla()} /> : null}
              <View style={{ height: 8 }} />
              {yapistir == null ? (
                <Btn t="📋 Tablodan yapıştır" onPress={() => setYapistir('')} />
              ) : (
                <>
                  <TextInput
                    value={yapistir}
                    onChangeText={setYapistir}
                    multiline
                    placeholder={'Excel\'den satırları kopyalayıp buraya yapıştır (ilk satır başlık)'}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { minHeight: 120, color: colors.text, borderColor: colors.border, textAlignVertical: 'top' }]}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Btn t="Vazgeç" onPress={() => setYapistir(null)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Btn t="Önizle" birincil onPress={() => void tabloyuAc(csvOku(yapistir), 'Yapıştırılan tablo')} />
                    </View>
                  </View>
                </>
              )}
              <View style={{ height: 8 }} />
              <Btn
                t="Boş şablon indir (.xlsx)"
                onPress={() => void dosyaIndir('superkuzu-ice-aktarma-sablonu.xlsx', xlsxYaz([{ ad: 'Kuzular', satirlar: sablonTablosu() }]), XLSX_MIME)}
              />
            </View>
          </>
        ) : (
          onizleme && (
            <>
              {/* EŞLEME */}
              <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
                <Text style={[styles.baslik, { color: colors.text }]}>1 · Sütunları eşle</Text>
                <Text style={[styles.not, { color: colors.textSecondary, marginBottom: 8 }]}>
                  {dosyaAd} · {tablo.length - 1} satır. Yanlış eşlenen sütuna dokunup düzelt.
                </Text>
                {tablo[0].map((bas, i) => {
                  const alan = eslesme[i];
                  const ornek = tablo.slice(1, 4).map((r) => r[i]).filter(Boolean).join(' · ');
                  return (
                    <View key={i}>
                      <Pressable onPress={() => setAcikSutun(acikSutun === i ? null : i)} style={[styles.satir, { borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: '700' }}>{bas || `Sütun ${i + 1}`}</Text>
                          {ornek ? (
                            <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12 }}>
                              {ornek}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={{ color: alan ? colors.tint : colors.textSecondary, fontWeight: '800' }}>→ {alanAdi(alan)} ▾</Text>
                      </Pressable>
                      {acikSutun === i ? (
                        <View style={[styles.chipSatir, { paddingVertical: 8 }]}>
                          {[null, ...HEDEF_ALANLAR.map((a) => a.id)].map((id) => {
                            const sec = (alan ?? null) === id;
                            return (
                              <Pressable
                                key={id ?? 'yok'}
                                onPress={() => {
                                  setEslesme(eslesmeDegistir(eslesme, i, id));
                                  setAcikSutun(null);
                                }}
                                style={[styles.chip, { borderColor: sec ? colors.tint : colors.border, backgroundColor: sec ? colors.tint : colors.background }]}>
                                <Text style={{ color: sec ? '#fff' : colors.text, fontSize: 13 }}>{alanAdi(id)}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                {onizleme.eksikZorunlu.length ? (
                  <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 8 }}>
                    Zorunlu alan eşlenmedi: {onizleme.eksikZorunlu.join(', ')}
                  </Text>
                ) : null}
              </View>

              {/* ÖNİZLEME */}
              <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.baslik, { color: colors.text }]}>2 · Önizleme</Text>
                <View style={styles.chipSatir}>
                  {(['hepsi', 'yeni', 'mevcut', 'dosyada-tekrar', 'hatali'] as const).map((d) => {
                    const n = d === 'hepsi' ? onizleme.satirlar.length : onizleme.sayac[d];
                    if (d !== 'hepsi' && !n) return null;
                    const sec = filtre === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setFiltre(d)}
                        style={[styles.chip, { borderColor: sec ? colors.tint : colors.border, backgroundColor: sec ? colors.tint : colors.background }]}>
                        <Text style={{ color: sec ? '#fff' : colors.text, fontSize: 13, fontWeight: '700' }}>
                          {d === 'hepsi' ? 'Tümü' : SATIR_DURUM_ETIKET[d]} · {n}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {onizleme.satirlar
                  .filter((s) => filtre === 'hepsi' || s.durum === filtre)
                  .slice(0, 40)
                  .map((s) => (
                    <View key={s.satirNo} style={[styles.onizSatir, { borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, width: 34 }}>#{s.satirNo}</Text>
                        <Text style={{ flex: 1, color: colors.text, fontWeight: '700' }} numberOfLines={1}>
                          {s.veri.earTag || '—'}
                          {s.veri.sirtNo ? ` · Sırt ${s.veri.sirtNo}` : ''}
                        </Text>
                        <Text style={{ color: durumRenk(s.durum), fontSize: 12, fontWeight: '800' }}>{SATIR_DURUM_ETIKET[s.durum]}</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 42 }} numberOfLines={1}>
                        {[
                          s.veri.sex ? (s.veri.sex === 'female' ? 'Dişi' : 'Erkek') : null,
                          s.veri.breed,
                          s.veri.birthDate,
                          s.veri.paddock,
                          s.veri.kiloKg ? `${String(s.veri.kiloKg).replace('.', ',')} kg` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      {[...s.hatalar, ...s.uyarilar].map((h, j) => (
                        <Text key={j} style={{ color: j < s.hatalar.length ? colors.danger : colors.warning, fontSize: 12, marginLeft: 42 }}>
                          {j < s.hatalar.length ? '✖' : '⚠'} {h}
                        </Text>
                      ))}
                    </View>
                  ))}
                {onizleme.satirlar.filter((s) => filtre === 'hepsi' || s.durum === filtre).length > 40 ? (
                  <Text style={[styles.not, { color: colors.textSecondary }]}>İlk 40 satır gösteriliyor.</Text>
                ) : null}
              </View>

              {/* KAYDET */}
              <View style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.baslik, { color: colors.text }]}>3 · Kaydet</Text>
                {onizleme.sayac.mevcut ? (
                  <>
                    <Text style={{ color: colors.text, marginBottom: 6 }}>
                      {onizleme.sayac.mevcut} küpe sürüde zaten var:
                    </Text>
                    <View style={[styles.chipSatir, { marginBottom: 8 }]}>
                      {(
                        [
                          ['atla', 'Atla (dokunma)'],
                          ['guncelle', 'Güncelle (dolu alanlar yazılır)'],
                        ] as const
                      ).map(([p, t]) => (
                        <Pressable
                          key={p}
                          onPress={() => setPolitika(p)}
                          style={[styles.chip, { borderColor: politika === p ? colors.tint : colors.border, backgroundColor: politika === p ? colors.tint : colors.background }]}>
                          <Text style={{ color: politika === p ? '#fff' : colors.text, fontWeight: '700' }}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}
                {onizleme.sayac.hatali || onizleme.sayac['dosyada-tekrar'] ? (
                  <Text style={[styles.not, { color: colors.textSecondary, marginBottom: 6 }]}>
                    Hatalı ({onizleme.sayac.hatali}) ve dosyada tekrar eden ({onizleme.sayac['dosyada-tekrar']}) satırlar alınmaz.
                  </Text>
                ) : null}
                <Pressable
                  disabled={!yazilacak || !!mesgul || onizleme.eksikZorunlu.length > 0}
                  onPress={() => void kaydet()}
                  style={[styles.cta, { backgroundColor: yazilacak && !onizleme.eksikZorunlu.length ? colors.tint : colors.border }]}>
                  {mesgul === 'ice' ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{yazilacak} kuzuyu kaydet</Text>}
                </Pressable>
                <Btn t="Vazgeç" onPress={() => setTablo(null)} />
              </View>
            </>
          )
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  kart: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  not: { fontSize: 13, lineHeight: 19 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  onizSatir: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  cta: { borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btn: { borderRadius: 10, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, marginVertical: 3 },
});
