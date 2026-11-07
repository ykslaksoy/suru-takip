/**
 * Hızlı tartım: önce kuzu tanımla + onayla, sonra kilo gir ve kaydet.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { addWeightRecord, getAnimals, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { upsertRationPlanFromWeight } from '@/kaynak/rasyon/hayvan-plani';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import {
  analizOzeti,
  tartimAnaliz,
  VARSAYILAN_TARTIM_AYAR,
  type TartimAnaliz,
  type TartimAyar,
} from '@/kaynak/kilo/hizli-tartim';
import { getTartimAyar, saveTartimAyar } from '@/kaynak/kilo/tartim-ayar';
import { hayvanKesinEslestir, tartimKaydaHazirMi } from '@/kaynak/kilo/hizli-tartim-akisi';
import {
  getHizliTartimYontem,
  saveHizliTartimYontem,
  type HizliTartimKuzuYontem,
  type HizliTartimYontemTercih,
} from '@/kaynak/kilo/hizli-tartim-yontem-depo';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import {
  kuzuSecimEtiket,
  kuzuSecimYontemDurumu,
  tartimGirisEtiket,
  tartimGirisYontemDurumu,
  type KuzuSecimYontemi,
  type TartimGirisYontemi,
} from '@/kaynak/giris-yontemi';
import { KuzuSecimPaneli, type KuzuSecimDeger } from '@/bilesenler/giris-yontemi/KuzuSecimPaneli';
import { TartimGirisPaneli } from '@/bilesenler/giris-yontemi/TartimGirisPaneli';
import { HayvanSecici } from '@/bilesenler/soy/HayvanSecici';

type Sonuc = { id: string; animalId: string; etiket: string; analiz: TartimAnaliz };

const KUZU_CHIP: { key: HizliTartimKuzuYontem; label: string }[] = [
  { key: 'manuel', label: 'Elle' },
  { key: 'liste', label: 'Listeden' },
  { key: 'sesle-numara', label: 'Ses' },
  { key: 'kupe-ocr', label: 'Küpe OCR' },
  { key: 'sirt-no-ocr', label: 'Sırt OCR' },
  { key: 'rfid', label: 'RFID' },
];

const TARTIM_CHIP: { key: TartimGirisYontemi; label: string }[] = [
  { key: 'manuel', label: 'Elle' },
  { key: 'sesle-kilo', label: 'Ses' },
];

function kuzuChipGosterilebilir(id: HizliTartimKuzuYontem): boolean {
  if (id === 'liste') return true;
  return kuzuSecimYontemDurumu(id) === 'aktif';
}

function tartimChipGosterilebilir(id: TartimGirisYontemi): boolean {
  return tartimGirisYontemDurumu(id) === 'aktif';
}

export function HizliTartim() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const dar = width < 440;
  const { refresh, refreshKey } = useDatabase();
  const [hayvanlar, setHayvanlar] = useState<Animal[]>([]);
  const { tercih } = useGirisYontemi();
  const [yontem, setYontem] = useState<HizliTartimYontemTercih | null>(null);

  const [kuzuDeger, setKuzuDeger] = useState<KuzuSecimDeger>({ earTag: '', sirtNo: '' });
  const [adayHayvan, setAdayHayvan] = useState<Animal | null>(null);
  const [onayliHayvanId, setOnayliHayvanId] = useState<string | null>(null);
  const [manuelArama, setManuelArama] = useState('');
  const [listeAcik, setListeAcik] = useState(false);
  const [belirsizListe, setBelirsizListe] = useState<Animal[] | null>(null);

  const [kilo, setKilo] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const [ayar, setAyar] = useState<TartimAyar>(VARSAYILAN_TARTIM_AYAR);
  const [ayarAcik, setAyarAcik] = useState(false);
  useEffect(() => {
    getTartimAyar().then(setAyar).catch(() => {});
    void getHizliTartimYontem(tercih.kuzuSecim, tercih.tartimGiris).then(setYontem);
  }, [tercih.kuzuSecim, tercih.tartimGiris]);

  useEffect(() => {
    void getAnimals().then(setHayvanlar);
  }, [refreshKey]);

  const yontemKaydet = useCallback(
    (next: HizliTartimYontemTercih) => {
      setYontem(next);
      void saveHizliTartimYontem(next);
    },
    [],
  );

  const adayGuncelle = useCallback(
    async (h: Animal | null) => {
      setAdayHayvan(h);
      setOnayliHayvanId(null);
      setBelirsizListe(null);
      setHata(null);
      if (h) {
        setKuzuDeger({ earTag: h.earTag, sirtNo: h.sirtNo ?? '', gehisId: h.gehisId ?? undefined });
      }
    },
    [],
  );

  const araVeEslestir = useCallback(
    async (terim: string) => {
      const list = hayvanlar.length ? hayvanlar : await getAnimals();
      const es = hayvanKesinEslestir(terim, list);
      if (es.durum === 'bulundu') {
        await adayGuncelle(es.hayvan);
        return;
      }
      if (es.durum === 'belirsiz') {
        setBelirsizListe(es.adaylar);
        setHata('Birden fazla kuzu eşleşti — listeden seçin');
        return;
      }
      setHata(`${terim.trim()} kayıtlı kuzu bulunamadı`);
      await adayGuncelle(null);
    },
    [adayGuncelle, hayvanlar],
  );

  const kuzuPanelYontem = (): KuzuSecimYontemi => {
    const k = yontem?.kuzu ?? 'manuel';
    return k === 'liste' ? 'manuel' : k;
  };

  useEffect(() => {
    if (!yontem || yontem.kuzu === 'liste') return;
    const t = [kuzuDeger.earTag, kuzuDeger.sirtNo, kuzuDeger.gehisId].filter(Boolean).join(' ');
    if (!t.trim()) return;
    const gecikme = setTimeout(() => void araVeEslestir(t), yontem.kuzu === 'manuel' ? 400 : 200);
    return () => clearTimeout(gecikme);
  }, [kuzuDeger.earTag, kuzuDeger.sirtNo, kuzuDeger.gehisId, yontem, araVeEslestir]);

  const hayvanOnayla = () => {
    if (!adayHayvan) {
      setHata('Önce eşleşen bir kuzu seçin');
      return;
    }
    setOnayliHayvanId(adayHayvan.id);
    setHata(null);
  };

  const hayvanSifirla = () => {
    setOnayliHayvanId(null);
    setAdayHayvan(null);
    setKuzuDeger({ earTag: '', sirtNo: '' });
    setManuelArama('');
    setKilo('');
    setBelirsizListe(null);
  };

  const ayarDegistir = (alan: keyof TartimAyar, d: number) => {
    const yeni = { ...ayar, [alan]: Math.max(1, ayar[alan] + d) };
    setAyar(yeni);
    saveTartimAyar(yeni).catch(() => {});
  };

  const kaydet = useCallback(async () => {
    setHata(null);
    const hazir = tartimKaydaHazirMi(onayliHayvanId, adayHayvan?.id ?? null, kilo);
    if (!hazir.hazir) {
      setHata(hazir.hata);
      return;
    }
    const animal = adayHayvan;
    if (!animal) return;
    const at = new Date().toISOString();
    const onceki = await getWeightRecords(animal.id);
    const analiz = tartimAnaliz(onceki, { kg: hazir.kg, at }, ayar);
    await addWeightRecord({ animalId: animal.id, weightKg: hazir.kg, recordedAt: at, notes: 'Hızlı tartım' });
    await upsertRationPlanFromWeight(animal, hazir.kg).catch(() => {});
    void islemKaydet({
      tur: 'tartim',
      ozet: `${hayvanAnaEtiket(animal)} · ${hazir.kg} kg`,
      detay: 'Hızlı tartım',
      animalId: animal.id,
    });
    setSonuclar((s) =>
      [{ id: `${Date.now()}`, animalId: animal.id, etiket: hayvanAnaEtiket(animal), analiz }, ...s].slice(0, 30),
    );
    hayvanSifirla();
    refresh();
  }, [adayHayvan, ayar, kilo, onayliHayvanId, refresh]);

  const altinda = sonuclar.filter((s) => s.analiz.egriAltinda).length;
  const onayli = onayliHayvanId && adayHayvan?.id === onayliHayvanId;
  const kuzuYontem = yontem?.kuzu ?? 'manuel';
  const tartimYontem = yontem?.tartim ?? 'manuel';

  if (!yontem) {
    return <Text style={{ color: colors.textSecondary, padding: 8 }}>Yükleniyor…</Text>;
  }

  return (
    <View>
      <View style={[styles.bolum, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.bolumBaslik, { color: colors.text }]}>1 · Kuzuyu tanımla</Text>
        <AltButonlar
          items={KUZU_CHIP.filter((c) => kuzuChipGosterilebilir(c.key))}
          activeKey={kuzuYontem}
          onSelect={(k) => {
            hayvanSifirla();
            yontemKaydet({ ...yontem, kuzu: k as HizliTartimKuzuYontem });
            if (k === 'liste') setListeAcik(true);
          }}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Yöntem: {kuzuYontem === 'liste' ? 'Listeden seç' : kuzuSecimEtiket(kuzuPanelYontem())}
          {kuzuYontem === 'rfid' ? ' · Web Bluetooth (Chrome/Edge)' : ''}
          {kuzuYontem === 'kupe-ocr' || kuzuYontem === 'sirt-no-ocr' ? ' · Sonucu onaylayın' : ''}
        </Text>

        {kuzuYontem === 'liste' ? (
          <>
            <AnaButon title={listeAcik ? 'Listeyi gizle' : 'Sürüden kuzu seç'} variant="secondary" onPress={() => setListeAcik((v) => !v)} />
            {listeAcik ? (
              <HayvanSecici
                hayvanlar={hayvanlar}
                haric={(a) => (a.status === 'sold' || a.status === 'dead' ? 'Satıldı / öldü' : null)}
                baslik="Tartılacak kuzu"
                onKapat={() => setListeAcik(false)}
                onSec={(a) => {
                  void adayGuncelle(a);
                  setListeAcik(false);
                }}
              />
            ) : null}
          </>
        ) : kuzuYontem === 'manuel' ? (
          <>
            <TextInput
              value={manuelArama}
              onChangeText={setManuelArama}
              placeholder="Küpe, sırt no veya GEKİS"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              onSubmitEditing={() => void araVeEslestir(manuelArama)}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <AnaButon title="Ara ve eşleştir" variant="secondary" onPress={() => void araVeEslestir(manuelArama)} />
          </>
        ) : (
          <KuzuSecimPaneli
            value={kuzuDeger}
            onChange={setKuzuDeger}
            yeniKayit={false}
            yontemOverride={kuzuPanelYontem()}
            eslesenEtiket={adayHayvan ? hayvanAnaEtiket(adayHayvan) : null}
            onEslesenEtiket={() => {}}
          />
        )}

        {belirsizListe?.length ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: colors.warning, fontWeight: '700', marginBottom: 6 }}>Hangi kuzu?</Text>
            {belirsizListe.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => void adayGuncelle(a)}
                style={[styles.adaySatir, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{hayvanAnaEtiket(a)}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{a.earTag} · {a.paddock}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {adayHayvan ? (
          <View style={[styles.onayKart, { borderColor: onayli ? colors.success : colors.tint, backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{hayvanAnaEtiket(adayHayvan)}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
              {adayHayvan.earTag}
              {adayHayvan.sirtNo ? ` · sırt ${adayHayvan.sirtNo}` : ''} · {adayHayvan.paddock}
            </Text>
            {onayli ? (
              <Text style={{ color: colors.success, fontWeight: '800', marginTop: 8 }}>✓ Onaylandı — kilo girebilirsiniz</Text>
            ) : (
              <View style={{ flexDirection: dar ? 'column' : 'row', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <AnaButon title="Bu kuzuyu onayla" onPress={hayvanOnayla} />
                </View>
                <View style={{ flex: 1 }}>
                  <AnaButon title="Değiştir" variant="secondary" onPress={hayvanSifirla} />
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>Kayıt için önce listeden veya arama ile kuzuyu eşleştirin.</Text>
        )}
      </View>

      <View style={[styles.bolum, { borderColor: colors.border, backgroundColor: colors.card, opacity: onayli ? 1 : 0.55 }]}>
        <Text style={[styles.bolumBaslik, { color: colors.text }]}>2 · Kilo gir</Text>
        <AltButonlar
          items={TARTIM_CHIP.filter((c) => tartimChipGosterilebilir(c.key))}
          activeKey={tartimYontem}
          onSelect={(k) => yontemKaydet({ ...yontem, tartim: k as TartimGirisYontemi })}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Yöntem: {tartimGirisEtiket(tartimYontem)}
          {tartimGirisYontemDurumu(tartimYontem) !== 'aktif' ? ' (şimdilik elle)' : ''}
        </Text>
        {!onayli ? (
          <Text style={{ color: colors.warning, fontWeight: '700', marginBottom: 8 }}>Kilo girişi için önce kuzuyu onaylayın.</Text>
        ) : null}

        <TartimGirisPaneli
          value={kilo}
          onChange={setKilo}
          placeholder="kg"
          yontemOverride={tartimYontem}
          devreDisi={!onayli}
        />

        <View style={dar ? styles.kaydetDikey : styles.kaydetYatay}>
          <Pressable
            disabled={!onayli}
            onPress={() => void kaydet()}
            style={[
              styles.kaydet,
              { backgroundColor: onayli ? colors.tint : colors.border, flex: dar ? undefined : 1 },
              dar ? { alignSelf: 'stretch' } : null,
            ]}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, textAlign: 'center' }}>Tartımı kaydet</Text>
          </Pressable>
        </View>
      </View>

      {hata ? <Text style={{ color: colors.warning, fontWeight: '700', marginVertical: 6 }}>{hata}</Text> : null}

      <Pressable onPress={() => setAyarAcik((v) => !v)}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Hedef satış kilosu {ayar.hedefKg} kg · referans eğri günde {ayar.referansAdgGram} g (varsayılan, değiştirilebilir) {ayarAcik ? '▲' : '▼'}
        </Text>
      </Pressable>
      {ayarAcik ? (
        <View style={[styles.ayarKart, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {(
            [
              ['hedefKg', 'Hedef satış kilosu (kg)', 1],
              ['referansAdgGram', 'Referans günlük artış (g)', 10],
              ['toleransYuzde', 'Eğri altı toleransı (%)', 1],
            ] as const
          ).map(([alan, etiket, adim]) => (
            <View key={alan} style={styles.ayarSatir}>
              <Text style={{ color: colors.text, flex: 1 }}>{etiket}</Text>
              <Pressable onPress={() => ayarDegistir(alan, -adim)} style={[styles.adim, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>−</Text>
              </Pressable>
              <Text style={{ color: colors.text, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>{ayar[alan]}</Text>
              <Pressable onPress={() => ayarDegistir(alan, adim)} style={[styles.adim, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>+</Text>
              </Pressable>
            </View>
          ))}
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
            Eğri, kuzunun ilk tartımından itibaren günlük referans artışla hesaplanan beklenen kilodur. Bilimsel bir standart değil, işletmenize göre ayarlayın.
          </Text>
        </View>
      ) : null}

      {sonuclar.length ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginVertical: 6 }}>
          BU OTURUM: {sonuclar.length} TARTIM{altinda ? ` · ${altinda} KUZU EĞRİNİN ALTINDA` : ''}
        </Text>
      ) : null}
      {sonuclar.map((s, i) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/hayvan/${s.animalId}/kilo`)}
          style={[
            styles.sonuc,
            {
              backgroundColor: colors.card,
              borderColor: s.analiz.egriAltinda ? colors.warning : i === 0 ? colors.tint : colors.border,
            },
          ]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {s.etiket} · {String(s.analiz.kg).replace('.', ',')} kg
              {s.analiz.farkKg != null ? (
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  {'  '}({s.analiz.farkKg >= 0 ? '+' : ''}
                  {String(s.analiz.farkKg).replace('.', ',')} kg)
                </Text>
              ) : null}
            </Text>
            <Text style={{ color: s.analiz.egriAltinda ? colors.warning : colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {analizOzeti(s.analiz, ayar)}
            </Text>
          </View>
          <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Grafik →</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bolum: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  bolumBaslik: { fontWeight: '900', fontSize: 15, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    minHeight: 52,
    marginBottom: 10,
  },
  onayKart: { borderWidth: 2, borderRadius: 12, padding: 12, marginTop: 10 },
  adaySatir: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 6 },
  kaydetYatay: { marginTop: 4 },
  kaydetDikey: { marginTop: 8 },
  kaydet: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 18, minHeight: 52, justifyContent: 'center' },
  ayarKart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  ayarSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  adim: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sonuc: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, gap: 8 },
});
