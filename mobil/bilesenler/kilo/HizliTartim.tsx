/**
 * Hızlı tartım: oturum yöntemi bir kez → ardından kuzu onayı + kilo döngüsü.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { YontemCipIzgarasi } from '@/bilesenler/kilo/YontemCipIzgarasi';
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
import {
  ciftTartimKaydiMi,
  hayvanKesinEslestir,
  hizliTartimKayitEtkin,
  hizliTartimYontemOzeti,
  tartimKaydaHazirMi,
} from '@/kaynak/kilo/hizli-tartim-akisi';
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
import {
  baskulBaglantiNesli,
  baskulBagliMi,
  baskulDurum,
  baskulDurumDinle,
  baskulDurumEtiket,
  baskulOlcumuGecerliMi,
  baskulOturumuSifirla,
  tartimYontemDegisinceKiloSifirla,
  yeniBaskulOturumNesli,
  type BaskulOturumNesli,
  type BekleyenBaskulOlcumu,
} from '@/kaynak/baskul';
import { BaskulTartimPaneli } from '@/bilesenler/kilo/BaskulTartimPaneli';
import { HizliTartimKiloGiris } from '@/bilesenler/kilo/HizliTartimKiloGiris';
import { KuzuSecimPaneli, type KuzuSecimDeger } from '@/bilesenler/giris-yontemi/KuzuSecimPaneli';
import { HayvanSecici } from '@/bilesenler/soy/HayvanSecici';
import {
  aramaJetonuUret,
  gecikmisAramaMi,
  kuzuAramaTerimiHamdan,
  metinSadeceKiloGibiMi,
  onayHalaGecerli,
  tanimaNesliArtti,
  yeniOnayNesli,
} from '@/kaynak/kilo/kuzu-tanima-akisi';
import { HIZLI_KILO_YONTEMLERI, hizliKiloYontemDurumu, hizliKiloYontemEtiket } from '@/kaynak/tartim/hizli-kilo-yontem';

type Sonuc = { id: string; animalId: string; etiket: string; analiz: TartimAnaliz };

const KUZU_CHIP: { key: HizliTartimKuzuYontem; label: string }[] = [
  { key: 'manuel', label: 'Elle' },
  { key: 'liste', label: 'Listeden' },
  { key: 'sesle-numara', label: 'Ses' },
  { key: 'kupe-ocr', label: 'Küpe OCR' },
  { key: 'sirt-no-ocr', label: 'Sırt OCR' },
  { key: 'rfid', label: 'RFID' },
];

const TARTIM_CHIP_AKTIF = HIZLI_KILO_YONTEMLERI.map((key) => ({
  key,
  label: hizliKiloYontemEtiket(key),
}));

function kuzuChipGosterilebilir(id: HizliTartimKuzuYontem): boolean {
  if (id === 'liste') return true;
  return kuzuSecimYontemDurumu(id) === 'aktif';
}

function tartimChipGosterilebilir(id: TartimGirisYontemi): boolean {
  if (HIZLI_KILO_YONTEMLERI.includes(id as (typeof HIZLI_KILO_YONTEMLERI)[number])) return true;
  return tartimGirisYontemDurumu(id) === 'aktif';
}

function kuzuYontemEtiket(k: HizliTartimKuzuYontem): string {
  if (k === 'liste') return 'Listeden seç';
  return kuzuSecimEtiket(k);
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
  const [yontemDuzenle, setYontemDuzenle] = useState(false);

  const [kuzuDeger, setKuzuDeger] = useState<KuzuSecimDeger>({ earTag: '', sirtNo: '' });
  const [adayHayvan, setAdayHayvan] = useState<Animal | null>(null);
  const [onayliHayvanId, setOnayliHayvanId] = useState<string | null>(null);
  const [manuelArama, setManuelArama] = useState('');
  const [listeAcik, setListeAcik] = useState(false);
  const [belirsizListe, setBelirsizListe] = useState<Animal[] | null>(null);
  const [sesOcrOnayBekliyor, setSesOcrOnayBekliyor] = useState(false);

  const [kilo, setKilo] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const [ayar, setAyar] = useState<TartimAyar>(VARSAYILAN_TARTIM_AYAR);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const sonKayitRef = useRef<{ animalId: string; kg: number; atMs: number } | null>(null);
  const aramaJetonuRef = useRef(0);
  const tanimaNesliRef = useRef(0);
  const onayNesliRef = useRef(0);
  const [baskulUiDurum, setBaskulUiDurum] = useState(baskulDurum());
  const [nesil, setNesil] = useState<BaskulOturumNesli>({
    baglantiNesli: baskulBaglantiNesli(),
    hayvanNesli: 0,
    yontemNesli: 0,
  });
  const [baskulOlcum, setBaskulOlcum] = useState<BekleyenBaskulOlcumu | null>(null);

  useEffect(() => baskulDurumDinle(setBaskulUiDurum), []);

  useEffect(() => {
    getTartimAyar().then(setAyar).catch(() => {});
    void getHizliTartimYontem(tercih.kuzuSecim, tercih.tartimGiris).then(setYontem);
  }, [tercih.kuzuSecim, tercih.tartimGiris]);

  useEffect(() => {
    void getAnimals().then(setHayvanlar);
  }, [refreshKey]);

  const yontemKaydet = useCallback(
    (next: HizliTartimYontemTercih) => {
      setYontem((onceki) => {
        if (onceki && onceki.kuzu !== next.kuzu) {
          aramaJetonuRef.current = aramaJetonuUret(aramaJetonuRef.current);
          tanimaNesliRef.current = tanimaNesliArtti(tanimaNesliRef.current);
          onayNesliRef.current = 0;
        }
        if (onceki && onceki.tartim !== next.tartim) {
          setKilo((k) => tartimYontemDegisinceKiloSifirla(k, next.tartim, onceki.tartim));
          setBaskulOlcum(null);
          setNesil((n) => yeniBaskulOturumNesli(n, 'yontemNesli'));
          if (next.tartim === 'baskul') baskulOturumuSifirla();
        }
        return next;
      });
      void saveHizliTartimYontem(next);
    },
    [],
  );

  const sonrakiKuzuTemizle = useCallback(() => {
    setOnayliHayvanId(null);
    setAdayHayvan(null);
    setKuzuDeger({ earTag: '', sirtNo: '' });
    setManuelArama('');
    setKilo('');
    setBaskulOlcum(null);
    setBelirsizListe(null);
    setSesOcrOnayBekliyor(false);
    setHata(null);
    setNesil((n) => yeniBaskulOturumNesli(n, 'hayvanNesli'));
    aramaJetonuRef.current = aramaJetonuUret(aramaJetonuRef.current);
    tanimaNesliRef.current = tanimaNesliArtti(tanimaNesliRef.current);
    onayNesliRef.current = 0;
  }, []);

  const baskulBaglantiDegisti = useCallback(() => {
    setKilo('');
    setBaskulOlcum(null);
    setNesil((n) => ({ ...n, baglantiNesli: baskulBaglantiNesli() }));
  }, []);

  const adayGuncelle = useCallback(async (h: Animal | null) => {
    setAdayHayvan(h);
    setOnayliHayvanId(null);
    setBelirsizListe(null);
    setSesOcrOnayBekliyor(false);
    setHata(null);
    if (h) {
      setKuzuDeger({ earTag: h.earTag, sirtNo: h.sirtNo ?? '', gehisId: h.gehisId ?? undefined });
    }
  }, []);

  const araVeEslestir = useCallback(
    async (terim: string) => {
      const jeton = aramaJetonuUret(aramaJetonuRef.current);
      aramaJetonuRef.current = jeton;
      const list = hayvanlar.length ? hayvanlar : await getAnimals();
      if (gecikmisAramaMi(jeton, aramaJetonuRef.current)) return;
      const es = hayvanKesinEslestir(terim, list);
      if (gecikmisAramaMi(jeton, aramaJetonuRef.current)) return;
      if (es.durum === 'bulundu') {
        await adayGuncelle(es.hayvan);
        return;
      }
      if (es.durum === 'belirsiz') {
        setBelirsizListe(es.adaylar);
        setHata('Birden fazla kuzu eşleşti — listeden seçin');
        setAdayHayvan(null);
        setOnayliHayvanId(null);
        return;
      }
      setHata(`${terim.trim()} kayıtlı kuzu bulunamadı — numarayı kontrol edin veya listeden seçin`);
      await adayGuncelle(null);
    },
    [adayGuncelle, hayvanlar],
  );

  const kuzuPanelYontem = (): KuzuSecimYontemi => {
    const k = yontem?.kuzu ?? 'manuel';
    return k === 'liste' ? 'manuel' : k;
  };

  useEffect(() => {
    if (!yontem || yontemDuzenle || yontem.kuzu === 'liste') return;
    const t = [kuzuDeger.earTag, kuzuDeger.sirtNo, kuzuDeger.gehisId].filter(Boolean).join(' ');
    if (!t.trim()) return;
    if (metinSadeceKiloGibiMi(t)) return;
    const arama = kuzuAramaTerimiHamdan(t) ?? t;
    const gecikme = setTimeout(() => {
      const otomatik = yontem.kuzu === 'kupe-ocr' || yontem.kuzu === 'sirt-no-ocr' || yontem.kuzu === 'sesle-numara' || yontem.kuzu === 'rfid';
      if (otomatik) setSesOcrOnayBekliyor(true);
      void araVeEslestir(arama);
    }, yontem.kuzu === 'manuel' ? 400 : 200);
    return () => clearTimeout(gecikme);
  }, [kuzuDeger.earTag, kuzuDeger.sirtNo, kuzuDeger.gehisId, yontem, yontemDuzenle, araVeEslestir]);

  const hayvanOnayla = () => {
    if (!adayHayvan) {
      setHata('Önce eşleşen bir kuzu seçin');
      return;
    }
    setOnayliHayvanId(adayHayvan.id);
    onayNesliRef.current = yeniOnayNesli(tanimaNesliRef.current);
    setKilo('');
    setBaskulOlcum(null);
    setSesOcrOnayBekliyor(false);
    setHata(null);
  };

  const yontemKilitle = () => {
    sonrakiKuzuTemizle();
    setYontemDuzenle(false);
    if (tartimYontem === 'baskul') baskulOturumuSifirla();
  };

  const ayarDegistir = (alan: keyof TartimAyar, d: number) => {
    const yeni = { ...ayar, [alan]: Math.max(1, ayar[alan] + d) };
    setAyar(yeni);
    saveTartimAyar(yeni).catch(() => {});
  };

  const kaydet = useCallback(async () => {
    if (kaydediliyor) return;
    setHata(null);
    if (
      (yontem?.tartim ?? 'manuel') === 'baskul' &&
      baskulOlcum &&
      !baskulOlcumuGecerliMi(baskulOlcum, onayliHayvanId, nesil, Date.now())
    ) {
      setHata('Baskül ölçümü geçersiz (bağlantı/kuzu değişti) — yeniden ölçün veya elle girin');
      setKilo('');
      setBaskulOlcum(null);
      return;
    }
    if (
      !onayHalaGecerli(
        onayliHayvanId,
        adayHayvan?.id ?? null,
        tanimaNesliRef.current,
        onayNesliRef.current,
      )
    ) {
      setHata('Kuzu onayı geçersiz — yeniden seçin ve onaylayın');
      setOnayliHayvanId(null);
      setKilo('');
      return;
    }
    const hazir = tartimKaydaHazirMi(onayliHayvanId, adayHayvan?.id ?? null, kilo);
    if (!hazir.hazir) {
      setHata(hazir.hata);
      return;
    }
    const animal = adayHayvan;
    if (!animal) return;

    const now = Date.now();
    if (ciftTartimKaydiMi(sonKayitRef.current, animal.id, hazir.kg, now)) {
      setHata('Bu tartım az önce kaydedildi — kiloyu kontrol edin');
      return;
    }

    setKaydediliyor(true);
    try {
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
      sonKayitRef.current = { animalId: animal.id, kg: hazir.kg, atMs: now };
      setSonuclar((s) =>
        [{ id: `${now}`, animalId: animal.id, etiket: hayvanAnaEtiket(animal), analiz }, ...s].slice(0, 30),
      );
      sonrakiKuzuTemizle();
      refresh();
    } finally {
      setKaydediliyor(false);
    }
  }, [adayHayvan, ayar, baskulOlcum, kilo, kaydediliyor, nesil, onayliHayvanId, refresh, sonrakiKuzuTemizle, yontem?.tartim]);

  const altinda = sonuclar.filter((s) => s.analiz.egriAltinda).length;
  const onayli = onayliHayvanId && adayHayvan?.id === onayliHayvanId;
  const kuzuYontem = yontem?.kuzu ?? 'manuel';
  const tartimYontem = yontem?.tartim ?? 'manuel';
  const tartimEtkin = tartimChipGosterilebilir(tartimYontem) ? tartimYontem : 'manuel';
  const tartimEtkinLabel =
    HIZLI_KILO_YONTEMLERI.includes(tartimEtkin as (typeof HIZLI_KILO_YONTEMLERI)[number])
      ? hizliKiloYontemEtiket(tartimEtkin as (typeof HIZLI_KILO_YONTEMLERI)[number])
      : tartimGirisEtiket(tartimEtkin);
  const baskulBagli = baskulBagliMi();
  const kayitEtkin = hizliTartimKayitEtkin(!!onayli, tartimEtkin, baskulBagli) && !!kilo.trim();

  if (!yontem) {
    return <Text style={{ color: colors.textSecondary, padding: 8 }}>Yükleniyor…</Text>;
  }

  const ozetMetin = hizliTartimYontemOzeti(
    kuzuYontemEtiket(kuzuYontem),
    tartimEtkinLabel,
    tartimEtkin === 'baskul' ? 'baskul' : tartimEtkin === 'baskul-ocr' ? 'baskul-ocr' : 'diger',
    tartimEtkin === 'baskul' ? baskulDurumEtiket(baskulUiDurum) : undefined,
  );

  return (
    <View>
      <View style={[styles.bolum, { borderColor: colors.tint, backgroundColor: colors.card }]}>
        <Text style={[styles.bolumBaslik, { color: colors.text }]}>Tartım oturumu</Text>
        {!yontemDuzenle ? (
          <>
            <Text style={{ color: colors.text, fontWeight: '700', lineHeight: 22 }}>{ozetMetin}</Text>
            {tartimEtkin === 'baskul' && !baskulBagli ? (
              <View style={{ marginTop: 10 }}>
                <BaskulTartimPaneli kompakt onBaglantiDegisti={baskulBaglantiDegisti} />
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                sonrakiKuzuTemizle();
                setYontemDuzenle(true);
              }}
              style={[styles.degistirBtn, { borderColor: colors.tint }]}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>Yöntemi değiştir</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 18 }}>
              Bu oturumda tüm tartımlar için geçerli. Kayıttan sonra yöntem tekrar sorulmaz.
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 4 }}>Kuzu tanıma</Text>
            <YontemCipIzgarasi
              items={KUZU_CHIP.filter((c) => kuzuChipGosterilebilir(c.key))}
              activeKey={kuzuYontem}
              onSelect={(k) => yontemKaydet({ ...yontem, kuzu: k as HizliTartimKuzuYontem })}
            />
            <Text style={[styles.altBaslik, { color: colors.text }]}>Kilo nasıl girilecek?</Text>
            <YontemCipIzgarasi
              items={TARTIM_CHIP_AKTIF.filter((c) => tartimChipGosterilebilir(c.key))}
              activeKey={tartimEtkin}
              onSelect={(k) => yontemKaydet({ ...yontem, tartim: k as TartimGirisYontemi })}
            />
            {TARTIM_CHIP_AKTIF.map((c) =>
              c.key === tartimEtkin && hizliKiloYontemDurumu(c.key).durum !== 'hazir' ? (
                <Text key={c.key} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                  {hizliKiloYontemDurumu(c.key).not}
                </Text>
              ) : null,
            )}
            {tartimEtkin === 'baskul' ? (
              <View style={{ marginTop: 10 }}>
                <BaskulTartimPaneli onBaglantiDegisti={baskulBaglantiDegisti} />
              </View>
            ) : null}
            <View style={{ marginTop: 12 }}>
              <AnaButon title="Seçimi kilitle ve tartıma başla" onPress={yontemKilitle} />
            </View>
          </>
        )}
      </View>

      {yontemDuzenle ? null : (
        <>
          <View style={[styles.bolum, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={styles.adimBaslik}>
              <View style={[styles.adimRozet, { backgroundColor: colors.tint }]}>
                <Text style={styles.adimRozetMetin}>1</Text>
              </View>
              <Text style={[styles.bolumBaslik, { color: colors.text, marginBottom: 0 }]}>Kuzuyu tanımla</Text>
            </View>
            <Text style={[styles.yontemOzet, { color: colors.textSecondary }]}>
              {kuzuYontemEtiket(kuzuYontem)}
              {kuzuYontem === 'rfid' ? ' · Web Bluetooth' : ''}
              {(kuzuYontem === 'kupe-ocr' || kuzuYontem === 'sirt-no-ocr' || kuzuYontem === 'sesle-numara') ? ' · Sonucu onaylayın' : ''}
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
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {a.earTag} · {a.paddock}
                    </Text>
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
                {sesOcrOnayBekliyor && !onayli ? (
                  <Text style={{ color: colors.warning, fontWeight: '700', marginTop: 8 }}>
                    Tanıma sonucunu kontrol edip onaylayın
                  </Text>
                ) : null}
                {onayli ? (
                  <>
                    <Text style={{ color: colors.success, fontWeight: '800', marginTop: 8, lineHeight: 20 }}>
                      {tartimEtkin === 'baskul' && !baskulBagli
                        ? '✓ Onaylandı — tartıyı bağlayın veya yöntemi Elle/Ses yapın'
                        : '✓ Onaylandı — kilo girebilirsiniz'}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Başka kuzu seç"
                      onPress={sonrakiKuzuTemizle}
                      style={[styles.baskaKuzuBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 15 }}>Başka kuzu seç</Text>
                    </Pressable>
                  </>
                ) : (
                  <View style={{ flexDirection: dar ? 'column' : 'row', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <AnaButon title="Bu kuzuyu onayla" onPress={hayvanOnayla} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AnaButon title="Başka kuzu seç" variant="secondary" onPress={sonrakiKuzuTemizle} />
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                Sonraki kuzu için arama veya listeden seçim yapın.
              </Text>
            )}
          </View>

          <View style={[styles.bolum, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={styles.adimBaslik}>
              <View style={[styles.adimRozet, { backgroundColor: onayli ? colors.tint : colors.border }]}>
                <Text style={[styles.adimRozetMetin, !onayli ? { opacity: 0.7 } : null]}>2</Text>
              </View>
              <Text style={[styles.bolumBaslik, { color: colors.text, marginBottom: 0 }]}>Kilo gir — {tartimEtkinLabel}</Text>
            </View>
            {!onayli ? (
              <View style={[styles.bekleKutu, { backgroundColor: colors.warning + '18', borderColor: colors.warning }]}>
                <Text style={{ color: colors.text, fontWeight: '800', lineHeight: 20 }}>Önce adım 1’de kuzuyu onaylayın</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                  Onaydan sonra «{tartimEtkinLabel}» ile kilo girilebilir.
                </Text>
              </View>
            ) : (
              <>
                <HizliTartimKiloGiris
                  yontem={tartimEtkin}
                  kilo={kilo}
                  onKiloChange={setKilo}
                  onOlcumIptal={() => setBaskulOlcum(null)}
                  devreDisi={false}
                  onayli
                  onBaglantiDegisti={baskulBaglantiDegisti}
                />
                <Pressable
                  disabled={!kayitEtkin || kaydediliyor}
                  onPress={() => void kaydet()}
                  style={[
                    styles.kaydet,
                    {
                      backgroundColor: kayitEtkin && !kaydediliyor ? colors.tint : colors.border,
                      marginTop: 12,
                    },
                  ]}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, textAlign: 'center' }}>
                    {kaydediliyor ? 'Kaydediliyor…' : 'Tartımı kaydet'}
                  </Text>
                </Pressable>
                {!kayitEtkin && onayli ? (
                  <Text style={{ color: colors.warning, fontSize: 13, marginTop: 8, fontWeight: '700', lineHeight: 18 }}>
                    {tartimEtkin === 'baskul' && !baskulBagli
                      ? 'Bağlı tartı yok — «Tartıyı bağla» veya oturum yöntemini değiştirin.'
                      : 'Geçerli bir kilo girin veya OCR ile onaylayın.'}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </>
      )}

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
  bolum: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12, overflow: 'hidden' as const },
  bolumBaslik: { fontWeight: '900', fontSize: 16, marginBottom: 4 },
  altBaslik: { fontSize: 13, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  adimBaslik: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  adimRozet: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  adimRozetMetin: { color: '#fff', fontWeight: '900', fontSize: 15 },
  yontemOzet: { fontSize: 13, marginBottom: 10, lineHeight: 19 },
  bekleKutu: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 4 },
  degistirBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignSelf: 'stretch', minHeight: 48, justifyContent: 'center', alignItems: 'center' },
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
  baskaKuzuBtn: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  adaySatir: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 6, minHeight: 48, justifyContent: 'center' },
  kaydet: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 18, minHeight: 52, justifyContent: 'center', alignSelf: 'stretch' },
  ayarKart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  ayarSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  adim: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sonuc: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, gap: 8 },
});
