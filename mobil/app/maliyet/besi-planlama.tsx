import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  BESI_DONEM_ETIKET,
  type BesiDonemTuru,
  type BesiPlanDonemGirdi,
  type BesiPlanSenaryo,
} from '@/kaynak/maliyet/besi-plan-tipler';
import { hesaplaBesiPlanProjeksiyon } from '@/kaynak/maliyet/besi-plan-hesap';
import { karsilastirAdaySatisGunleri, planMaliyetVeKgGunHedef } from '@/kaynak/maliyet/dongu-ekonomi-hesap';
import { varsayilanKalemlerBos } from '@/kaynak/maliyet/besi-ekonomi-kalem';
import { hesaplaBesiEkonomiSenaryo } from '@/kaynak/maliyet/besi-ekonomi-senaryo';
import { partiMaliyettenOzet } from '@/kaynak/maliyet/besi-ekonomi-gercek';
import { maliyetTopla } from '@/kaynak/maliyet/topla';
import { BesiEkonomiKalemFormu } from '@/bilesenler/maliyet/BesiEkonomiKalemFormu';
import type { BesiEkonomiKalem } from '@/kaynak/maliyet/besi-ekonomi-kalem';
import type { PartiGercekMaliyetOzet } from '@/kaynak/maliyet/besi-ekonomi-gercek';
import {
  getBesiPlanDepo,
  iptalBesiPlanSenaryo,
  kaydetBesiPlanTaslak,
  onaylaBesiPlanSenaryo,
} from '@/kaynak/maliyet/besi-plan-depo';
import {
  ALIS_KAYNAK_ETIKET,
  alisBasCanliKgden,
  cozPlanAlisBas,
  sayiPlanAlis,
  VARSAYILAN_ALIS_CANLI_KG_FIYAT,
  yeniPlanVarsayilanAlisKgFiyat,
} from '@/kaynak/maliyet/besi-plan-alis';
import {
  EKONOMI_UYARI_KARKAS,
  SATIS_KAYNAK_VARSAYIM,
  karkasVerimOku,
  type SatisFiyatBirimi,
} from '@/kaynak/maliyet/besi-plan-satis';
import { BesiDiyetTaslakPaneli } from '@/bilesenler/maliyet/BesiDiyetTaslakPaneli';
import { BesiButceMutabakatPaneli } from '@/bilesenler/maliyet/BesiButceMutabakatPaneli';
import type { ButceTaslak } from '@/kaynak/maliyet/besi-plan-butce-tipler';
import { hesaplaButceMutabakat, ornekButce12000, ornekButce12500 } from '@/kaynak/maliyet/besi-plan-butce-hesap';
import { BesiPiyasaAdgPaneli } from '@/bilesenler/maliyet/BesiPiyasaAdgPaneli';
import { BesiReferansOverridePaneli } from '@/bilesenler/maliyet/BesiReferansOverridePaneli';
import { BesiReferansSaglikPaneli } from '@/bilesenler/maliyet/BesiReferansSaglikPaneli';
import { useBesiReferansOtomatik } from '@/bilesenler/maliyet/useBesiReferansOtomatik';
import { efektifBirimFiyat, referansOverrideOku, type BesiRefOverrideDepo } from '@/kaynak/maliyet/besi-referans-override';
import type { AdgKanitSenaryo } from '@/kaynak/maliyet/besi-adg-kanit';
import { hesaplaBesiPiyasaOzet } from '@/kaynak/maliyet/besi-plan-piyasa-ozet';
import { BesiBolgeSecimi, varsayilanBolgeTaslak } from '@/bilesenler/maliyet/BesiBolgeSecimi';
import { BesiIrkKokenSecimi } from '@/bilesenler/maliyet/BesiIrkKokenSecimi';
import {
  varsayilanIrkTaslak,
  type BesiPlanIrkTaslak,
  adgSenaryoIrkUygunMu,
  irkAdgPolitikasi,
  isGecerliHedefIrkKodu,
} from '@/kaynak/maliyet/besi-plan-irk';
import { BesiKararSimulasyonPaneli } from '@/bilesenler/maliyet/BesiKararSimulasyonPaneli';
import { hesaplaKararSimulasyon, kararVarsayilanSenaryo } from '@/kaynak/maliyet/besi-plan-karar-sim';

function sayi(m: string): number | null {
  const n = parseFloat(m.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const VARSAYILAN_DONEMLER: BesiDonemTuru[] = ['varis_gozlem', 'uyum', 'buyume', 'bitirme'];

function bosDonem(tur: BesiDonemTuru): BesiPlanDonemGirdi {
  return {
    id: tur,
    tur,
    gun: tur === 'varis_gozlem' ? 3 : tur === 'uyum' ? 5 : tur === 'buyume' ? 60 : 20,
    gcaaGramGun: tur === 'buyume' || tur === 'bitirme' ? null : 0,
    gunlukYemKgBas: null,
    yemFiyatKg: null,
    gunlukBakimBas: null,
  };
}

export default function BesiPlanlamaScreen() {
  const { padok, id } = useLocalSearchParams<{ padok?: string; id?: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [baslik, setBaslik] = useState('Besi planı taslak');
  const [basSayisi, setBasSayisi] = useState('1');
  const [girisKg, setGirisKg] = useState('');
  const [alis, setAlis] = useState('');
  const [alisKgFiyat, setAlisKgFiyat] = useState(String(yeniPlanVarsayilanAlisKgFiyat()));
  const [donemler, setDonemler] = useState<BesiPlanDonemGirdi[]>(VARSAYILAN_DONEMLER.map(bosDonem));
  const [senaryoId, setSenaryoId] = useState<string | undefined>();
  const [kayitli, setKayitli] = useState<BesiPlanSenaryo[]>([]);
  const [kira, setKira] = useState('');
  const [kiraMinAy, setKiraMinAy] = useState('3');
  const [maas, setMaas] = useState('');
  const [maasMinAy, setMaasMinAy] = useState('1');
  const [paylasim, setPaylasim] = useState('');
  const [kapasiteBasGun, setKapasiteBasGun] = useState('');
  const [satisFiyat, setSatisFiyat] = useState('');
  const [satisBirimi, setSatisBirimi] = useState<SatisFiyatBirimi>('canli_kg');
  const [karkasVerim, setKarkasVerim] = useState('');
  const [kesimKomisyon, setKesimKomisyon] = useState('');
  const [planKilitli, setPlanKilitli] = useState(false);
  const [adayGunler, setAdayGunler] = useState('60,90');
  const [bosDonguGun, setBosDonguGun] = useState('');
  const [ekonomiKalemler, setEkonomiKalemler] = useState<BesiEkonomiKalem[]>(varsayilanKalemlerBos());
  const [gercekParti, setGercekParti] = useState<PartiGercekMaliyetOzet | null>(null);
  const [butceTaslak, setButceTaslak] = useState<ButceTaslak | null>(null);
  const [bolgeTaslak, setBolgeTaslak] = useState(varsayilanBolgeTaslak());
  const [adgKanit, setAdgKanit] = useState<AdgKanitSenaryo>('muhafazakar');
  const [isletmeGiderBas, setIsletmeGiderBas] = useState('');
  const [olumOran, setOlumOran] = useState('');
  const [yemIllustrasyon, setYemIllustrasyon] = useState(true);
  const [piyasaRefreshNot, setPiyasaRefreshNot] = useState<string | null>(null);
  const [refOverride, setRefOverride] = useState<BesiRefOverrideDepo>(() => referansOverrideOku());
  const [refTick, setRefTick] = useState(0);
  const { meta: refSyncMeta, sonDurum: refSyncDurum } = useBesiReferansOtomatik();
  const [irkTaslak, setIrkTaslak] = useState<BesiPlanIrkTaslak>(varsayilanIrkTaslak());

  const yukle = useCallback(async () => {
    const d = await getBesiPlanDepo();
    setKayitli(d.senaryolar.filter((s) => s.durum !== 'iptal'));
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const projeksiyon = hesaplaBesiPlanProjeksiyon({
    girisKg: sayi(girisKg),
    basSayisi: sayi(basSayisi) != null ? Math.floor(sayi(basSayisi)!) : null,
    donemler,
  });

  const efektifAlisKg =
    sayiPlanAlis(alisKgFiyat) ??
    efektifBirimFiyat(VARSAYILAN_ALIS_CANLI_KG_FIYAT, 'alis_canli_kg').deger;
  const cozAlis = cozPlanAlisBas({
    alisBasFiyat: sayiPlanAlis(alis),
    alisCanliKgFiyat: efektifAlisKg,
    girisKg: sayi(girisKg),
    gercekParti,
    basSayisi: sayi(basSayisi) != null ? Math.floor(sayi(basSayisi)!) : null,
  });

  const alisBasHesap =
    sayiPlanAlis(alisKgFiyat) != null && sayi(girisKg) != null
      ? alisBasCanliKgden(sayiPlanAlis(alisKgFiyat)!, sayi(girisKg)!)
      : null;

  const ekonomiSenaryo =
    projeksiyon.durum === 'hazir' && sayi(satisFiyat) != null
      ? hesaplaBesiEkonomiSenaryo({
          basSayisi: Math.floor(sayi(basSayisi) ?? 1),
          toplamGun: projeksiyon.toplamGun,
          girisCanliKg: sayi(girisKg),
          satisGelirBas:
            sayi(satisFiyat) != null && projeksiyon.cikisKg != null
              ? projeksiyon.cikisKg * sayi(satisFiyat)!
              : null,
          kalemler: ekonomiKalemler,
          planDegiskenToplam: projeksiyon.toplamMaliyet,
          gercekParti,
          donguArasiBosGun: sayi(bosDonguGun),
          planAlisBas: cozAlis.alisBas,
        })
      : null;

  const gercekPartiYukle = async () => {
    const padokAd = padok?.trim();
    const { satirlar } = await maliyetTopla();
    const parti = padokAd ? satirlar.find((s) => s.parti === padokAd) : satirlar[0];
    if (parti) {
      setGercekParti(partiMaliyettenOzet(parti));
      setEkonomiKalemler((ks) =>
        ks.map((k) =>
          k.ciftSayimAnahtar && parti.yem > 0 && k.kod === 'yem'
            ? { ...k, kaynak: 'gercek_parti_maliyet', degerDurumu: 'bilinmiyor' as const }
            : k,
        ),
      );
    }
  };

  const adayKarsilastirma =
    projeksiyon.durum === 'hazir' && sayi(girisKg) != null && cozAlis.alisBas != null && sayi(satisFiyat) != null
      ? karsilastirAdaySatisGunleri({
          basSayisi: Math.floor(sayi(basSayisi) ?? 1),
          alisBas: cozAlis.alisBas,
          girisKg: sayi(girisKg)!,
          donemler,
          aylikKalemler: [
            ...(sayi(kira)
              ? [{ id: 'kira', etiket: 'Kira', aylikTutar: sayi(kira)!, minSozlesmeAy: Math.floor(sayi(kiraMinAy) ?? 1), marjinaldeArtar: false }]
              : []),
            ...(sayi(maas)
              ? [{ id: 'maas', etiket: 'Çoban maaşı', aylikTutar: sayi(maas)!, minSozlesmeAy: Math.floor(sayi(maasMinAy) ?? 1), marjinaldeArtar: false }]
              : []),
          ],
          donguSabitToplam:
            sayi(kesimKomisyon) != null && sayi(kesimKomisyon)! > 0 ? sayi(kesimKomisyon) : null,
          paylasimli:
            sayi(paylasim) && sayi(kapasiteBasGun)
              ? [{ id: 'p', etiket: 'Ortak gider', toplamTutar: sayi(paylasim)!, kapasiteBasGun: sayi(kapasiteBasGun)! }]
              : [],
          donguArasiBosGun: sayi(bosDonguGun),
          adayGunler: adayGunler
            .split(',')
            .map((x) => parseInt(x.trim(), 10))
            .filter((n) => Number.isFinite(n) && n > 0),
          satisFiyatKg: sayi(satisFiyat)!,
          satisBirimi,
          karkasVerim: karkasVerimOku(karkasVerim),
        })
      : null;

  const basAdet = Math.floor(sayi(basSayisi) ?? 1);

  const alisBrutKar = cozAlis.alisBas ?? (sayi(girisKg) === 25 ? 12000 : null);
  const karkasV = karkasVerimOku(karkasVerim);
  const satisKaynak = bolgeTaslak.satisKaynak;
  void refTick;
  const piyasaOzet =
    sayi(girisKg) != null && alisBrutKar != null
      ? hesaplaBesiPiyasaOzet({
          girisKg: sayi(girisKg)!,
          alisBas: alisBrutKar,
          satisKaynak,
          kullaniciSatisFiyatKg: sayi(satisFiyat),
          kullaniciBolgeSatisKg: bolgeTaslak.kullaniciSatisKg,
          satisBirimi,
          karkasVerim: karkasV,
          adgSenaryo: 'senaryo_taban',
          adgKanit,
          donemler,
          yemIllustrasyon,
          yemFireYuzde: 5,
          olcumGcaa: irkTaslak.olcumGcaaGramGun,
          irkTaslak,
        })
      : null;

  const kararSim =
    sayi(girisKg) != null && alisBrutKar != null
      ? hesaplaKararSimulasyon(
          {
            girisKg: sayi(girisKg)!,
            alisBas: alisBrutKar,
            satisKaynak,
            satisBirimi,
            karkasVerim: karkasV,
            adgSenaryo: 'senaryo_taban',
            adgKanit,
            donemler,
            yemIllustrasyon,
            yemFireYuzde: 5,
            irkTaslak,
            basSayisi: basAdet,
            kullaniciSatisFiyatKg: sayi(satisFiyat),
            kullaniciBolgeSatisKg: bolgeTaslak.kullaniciSatisKg,
            isletmeGiderBas: isletmeGiderBas.trim() ? sayi(isletmeGiderBas) : null,
            olumOranYuzde: olumOran.trim() ? sayi(olumOran) : null,
          },
          sayi(satisFiyat),
        )
      : null;

  const butceMutabakat = butceTaslak
    ? hesaplaButceMutabakat(
        butceTaslak,
        basAdet,
        {
          alisBasFiyat: sayiPlanAlis(alis),
          alisCanliKgFiyat: sayiPlanAlis(alisKgFiyat),
          girisKg: sayi(girisKg),
          gercekParti,
          basSayisi: basAdet,
        },
        { girisKg: sayi(girisKg), donemler },
      )
    : null;

  const kaydet = async () => {
    if (planKilitli) {
      Alert.alert('Onaylı plan', 'Bu sürüm kilitli anlık görüntü — değişiklik için yeni taslak açın.');
      return;
    }
    const s = await kaydetBesiPlanTaslak({
      id: senaryoId,
      baslik,
      kapsam: {
        tur: id ? 'hayvan' : padok ? 'padok' : 'genel',
        etiket: padok ?? (id ? `Hayvan ${id.slice(0, 6)}` : 'Genel'),
        hayvanId: id,
      },
      basSayisi: sayi(basSayisi) != null ? Math.floor(sayi(basSayisi)!) : null,
      girisKg: sayi(girisKg),
      girisTarih: null,
      alisBasFiyat: sayiPlanAlis(alis),
      alisCanliKgFiyat: sayiPlanAlis(alisKgFiyat),
      satisBirimi,
      karkasVerimOrani: karkasVerimOku(karkasVerim),
      satisFiyatKg: sayi(satisFiyat),
      hedefCanliKg: projeksiyon.durum === 'hazir' ? projeksiyon.cikisKg : null,
      hedefGun: projeksiyon.durum === 'hazir' ? projeksiyon.toplamGun : null,
      donemler,
      ekonomiKalemler,
      butceTaslagi: butceTaslak ?? undefined,
      irkTaslagi: irkTaslak,
      bolgeTaslagi: bolgeTaslak,
    });
    setSenaryoId(s.id);
    await yukle();
    Alert.alert('Taslak kaydedildi', `Sürüm ${s.surum}. Stok/rasyon değişmedi.`);
  };

  const onayla = async () => {
    if (!senaryoId) return;
    await onaylaBesiPlanSenaryo(senaryoId);
    await yukle();
    Alert.alert('Plan onaylandı', 'Yem tüketimi otomatik başlamaz — yalnızca plan kaydı.');
  };

  const iptal = async () => {
    if (!senaryoId) return;
    await iptalBesiPlanSenaryo(senaryoId);
    setSenaryoId(undefined);
    await yukle();
  };

  const donemAlan = (d: BesiPlanDonemGirdi, idx: number) => (
    <View key={d.id} style={[styles.donem, { borderColor: colors.border }]}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>{BESI_DONEM_ETIKET[d.tur]}</Text>
      <Mini label="Gün" value={String(d.gun)} onChange={(v) => {
        const next = [...donemler];
        next[idx] = { ...d, gun: parseInt(v, 10) || 0 };
        setDonemler(next);
      }} colors={colors} />
      {(d.tur === 'buyume' || d.tur === 'bitirme') && (
        <Mini
          label="GCAA varsayımı g/gün"
          value={d.gcaaGramGun == null ? '' : String(d.gcaaGramGun)}
          onChange={(v) => {
            const next = [...donemler];
            next[idx] = { ...d, gcaaGramGun: sayi(v) };
            setDonemler(next);
          }}
          colors={colors}
        />
      )}
      <Mini
        label="Yem kg/baş/gün"
        value={d.gunlukYemKgBas == null ? '' : String(d.gunlukYemKgBas)}
        onChange={(v) => {
          const next = [...donemler];
          next[idx] = { ...d, gunlukYemKgBas: sayi(v) };
          setDonemler(next);
        }}
        colors={colors}
      />
      <Mini
        label="Yem ₺/kg"
        value={d.yemFiyatKg == null ? '' : String(d.yemFiyatKg)}
        onChange={(v) => {
          const next = [...donemler];
          next[idx] = { ...d, yemFiyatKg: sayi(v) };
          setDonemler(next);
        }}
        colors={colors}
      />
      <Mini
        label="Bakım ₺/baş/gün"
        value={d.gunlukBakimBas == null ? '' : String(d.gunlukBakimBas)}
        onChange={(v) => {
          const next = [...donemler];
          next[idx] = { ...d, gunlukBakimBas: sayi(v) };
          setDonemler(next);
        }}
        colors={colors}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Besi Yönetimi — planlama' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          Besi öncesi taslak bütçe. Dönemler (varış, uyum, büyüme, bitirme) ayrı; toplam FCR birleşik yem/artış.
          Eksik varsayım uydurulmaz. Onay plan kilidi — gerçek tüketim / doğrulanmamış rasyon başlamaz.
        </Text>
        {planKilitli ? (
          <Text style={{ color: colors.warning, fontWeight: '800', marginBottom: 8 }}>
            Onaylı plan — salt okunur anlık görüntü. Düzenleme yeni taslak gerektirir.
          </Text>
        ) : null}
        <TextInput
          value={baslik}
          onChangeText={setBaslik}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
        <Mini label="Baş sayısı" value={basSayisi} onChange={setBasSayisi} colors={colors} />
        <Mini label="Giriş kg/baş" value={girisKg} onChange={setGirisKg} colors={colors} />
        <BesiIrkKokenSecimi
          taslak={irkTaslak}
          onChange={(t) => {
            setIrkTaslak(t);
            if (t.olcumGcaaGramGun == null) setAdgKanit(kararVarsayilanSenaryo(t));
          }}
          colors={colors}
          planKilitli={planKilitli}
        />
        <BesiBolgeSecimi taslak={bolgeTaslak} onChange={setBolgeTaslak} colors={colors} planKilitli={planKilitli} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
          Tahmini alış fiyatı (₺/canlı kg) — {ALIS_KAYNAK_ETIKET.kullanici_planlama_varsayimi}. Canlı borsa veya satış fiyatı değil.
        </Text>
        <Mini label="Tahmini alış ₺/canlı kg" value={alisKgFiyat} onChange={setAlisKgFiyat} colors={colors} />
        {alisBasHesap != null ? (
          <Text style={{ color: colors.tint, fontSize: 13, marginBottom: 8, fontWeight: '700' }}>
            ≈ {alisBasHesap.toLocaleString('tr-TR')} ₺/baş ({sayi(girisKg)} kg × {sayiPlanAlis(alisKgFiyat)?.toLocaleString('tr-TR')} ₺/kg)
          </Text>
        ) : alisKgFiyat.trim() && sayi(girisKg) == null ? (
          <Text style={{ color: colors.warning, fontSize: 12, marginBottom: 8 }}>Giriş kg girilince baş başı alış hesaplanır.</Text>
        ) : null}
        {cozAlis.alisBas != null ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Bütçe alışı: {cozAlis.alisBas.toLocaleString('tr-TR')} ₺/baş · kaynak: {cozAlis.etiket}
            {cozAlis.ciftSayimUyarisi ? ` · ${cozAlis.ciftSayimUyarisi}` : ''}
          </Text>
        ) : null}
        <Mini
          label="Alış ₺/baş override (gerçek/parti)"
          value={alis}
          onChange={setAlis}
          colors={colors}
        />
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
          Override girilirse kg varsayımının önüne geçer. Boş bırakırsanız 0 sayılmaz.
        </Text>
        {donemler.map((d, i) => donemAlan(d, i))}

        <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {projeksiyon.durum === 'eksik' ? (
            <>
              <Text style={{ color: colors.warning, fontWeight: '800' }}>Tam projeksiyon için eksik</Text>
              {[...new Set(projeksiyon.eksikler)].slice(0, 12).map((e) => (
                <Text key={e} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  · {e}
                </Text>
              ))}
            </>
          ) : (
            <>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                Çıkış ~{projeksiyon.cikisKg} kg · {projeksiyon.toplamGun} gün
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                Yem {projeksiyon.toplamYemKg} kg · maliyet {projeksiyon.toplamMaliyet.toLocaleString('tr-TR')} ₺ · FCR{' '}
                {projeksiyon.birlesikFcr ?? '—'}
              </Text>
            </>
          )}
        </View>

        <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 8, marginBottom: 6 }}>
          Besi Yönetimi — maliyet kalemleri (t306u)
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Alış, nakliye, yem, çoban, kira, su/elektrik, yatak, veteriner, sermaye (ops.), diğer. Gerçek parti stok değerlerini okuyabilir; muhasebeye yazmaz.
        </Text>
        <Pressable onPress={() => void gercekPartiYukle()} style={{ marginBottom: 8 }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>
            Parti gerçek maliyetini oku (stok çıkışı) {gercekParti ? `· ${gercekParti.parti}` : ''}
          </Text>
        </Pressable>
        <BesiEkonomiKalemFormu kalemler={ekonomiKalemler} onChange={setEkonomiKalemler} colors={colors} />

        <Mini
          label="İşletme gideri ₺/baş (brüt dışı — sağlık/çoban payı; boş = net hesaplanmaz)"
          value={isletmeGiderBas}
          onChange={setIsletmeGiderBas}
          colors={colors}
        />
        <Mini
          label="Ölüm/kayıp % (opsiyonel — girilmezse 0 sayılmaz)"
          value={olumOran}
          onChange={setOlumOran}
          colors={colors}
        />

        {kararSim ? <BesiKararSimulasyonPaneli sonuc={kararSim} colors={colors} /> : null}

        <BesiReferansOverridePaneli
          satisKaynak={satisKaynak}
          overrideDepo={refOverride}
          onDepoChange={setRefOverride}
          colors={colors}
        />
        <BesiReferansSaglikPaneli meta={refSyncMeta} colors={colors} />

        {piyasaOzet ? (
          <BesiPiyasaAdgPaneli
            ozet={piyasaOzet}
            adgKanit={adgKanit}
            yemIllustrasyon={yemIllustrasyon}
            onAdgKanit={(k) => {
              if (adgSenaryoIrkUygunMu(k, irkAdgPolitikasi(irkTaslak))) setAdgKanit(k);
            }}
            onYemIllustrasyon={setYemIllustrasyon}
            syncMeta={refSyncMeta}
            onYenilendi={() => {
              setRefTick((x) => x + 1);
              setPiyasaRefreshNot('Manuel yenileme tamamlandı.');
            }}
            refreshDurum={piyasaRefreshNot ?? refSyncDurum}
            colors={colors}
          />
        ) : (
          <Text style={{ color: colors.warning, fontSize: 12, marginVertical: 8 }}>
            Piyasa özeti için giriş kg ve alış (ör. 25 kg, 12.000 ₺/baş) girin.
          </Text>
        )}

        <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 12, marginBottom: 6 }}>
          Kullanıcı bütçe tablosu — mutabakat (t344u)
        </Text>
        {butceTaslak && butceMutabakat ? (
          <BesiButceMutabakatPaneli
            taslak={butceTaslak}
            sonuc={butceMutabakat}
            onChange={setButceTaslak}
            colors={colors}
            planKilitli={planKilitli}
          />
        ) : (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
              Plan alışı varsayılanı 500 ₺/kg (25 kg → 12.500) ayrı kalır. Bütçe satırları silinmez; gereksizleri siz sıfırlayın.
            </Text>
            {!planKilitli ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setButceTaslak(ornekButce12000())} style={[styles.btnOutline, { borderColor: colors.tint }]}>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>12.000 ₺/baş tablo</Text>
                </Pressable>
                <Pressable onPress={() => setButceTaslak(ornekButce12500())} style={[styles.btnOutline, { borderColor: colors.tint }]}>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>12.500 (500×25)</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}

        {ekonomiSenaryo && ekonomiSenaryo.durum !== 'eksik' ? (
          <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 8 }]}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {ekonomiSenaryo.dongu.dengeEtiket}: {ekonomiSenaryo.dongu.basBasiKar.toLocaleString('tr-TR')} ₺/baş · sürü{' '}
              {(ekonomiSenaryo.dongu.basBasiKar * basAdet).toLocaleString('tr-TR')} ₺
            </Text>
            {ekonomiSenaryo.kalemlerDokum
              .filter((x) => !x.atlandi && x.tutar != null)
              .slice(0, 8)
              .map((x) => (
                <Text key={x.etiket} style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {x.etiket}: {x.tutar?.toLocaleString('tr-TR')} ₺ ({x.kaynak})
                </Text>
              ))}
          </View>
        ) : ekonomiSenaryo?.durum === 'eksik' ? (
          <Text style={{ color: colors.warning, marginTop: 8 }}>{ekonomiSenaryo.eksikler.join(' · ')}</Text>
        ) : null}

        <Text style={{ color: colors.tint, fontWeight: '800', marginTop: 12, marginBottom: 6 }}>
          Döngü ekonomisi — aday günler (t303u)
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 17 }}>
          Aylık kira/maaş ay adımı + sözleşme minimumu; günlük orantı yok. Tam döngü net ≠ marjinal şimdi-sat (hayvan ekranı).
        </Text>
        <Mini label="Kira ₺/ay" value={kira} onChange={setKira} colors={colors} />
        <Mini label="Kira min. sözleşme (ay)" value={kiraMinAy} onChange={setKiraMinAy} colors={colors} />
        <Mini label="Çoban maaşı ₺/ay" value={maas} onChange={setMaas} colors={colors} />
        <Mini label="Maaş min. süre (ay)" value={maasMinAy} onChange={setMaasMinAy} colors={colors} />
        <Mini label="Paylaşımlı gider toplam ₺" value={paylasim} onChange={setPaylasim} colors={colors} />
        <Mini label="Paylaşım paydası (baş×gün)" value={kapasiteBasGun} onChange={setKapasiteBasGun} colors={colors} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Satış bazı · {SATIS_KAYNAK_VARSAYIM}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {(['canli_kg', 'karkas_kg'] as SatisFiyatBirimi[]).map((b) => (
            <Pressable
              key={b}
              onPress={() => setSatisBirimi(b)}
              style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: satisBirimi === b ? colors.tint : colors.border }}>
              <Text style={{ color: colors.text, fontSize: 12 }}>{b === 'canli_kg' ? 'Canlı kg' : 'Karkas kg'}</Text>
            </Pressable>
          ))}
        </View>
        {satisBirimi === 'karkas_kg' ? (
          <Text style={{ color: colors.warning, fontSize: 11, marginBottom: 6 }}>{EKONOMI_UYARI_KARKAS}</Text>
        ) : null}
        <Mini
          label={satisBirimi === 'canli_kg' ? 'Satış ₺/kg canlı' : 'Satış ₺/kg karkas'}
          value={satisFiyat}
          onChange={setSatisFiyat}
          colors={colors}
        />
        {satisBirimi === 'karkas_kg' ? (
          <Mini label="Karkas verim % (canlı→karkas)" value={karkasVerim} onChange={setKarkasVerim} colors={colors} />
        ) : null}
        <Mini label="Kesim + komisyon ₺ (döngü sabit, ops.)" value={kesimKomisyon} onChange={setKesimKomisyon} colors={colors} />
        <Mini label="Aday satış günleri (virgülle)" value={adayGunler} onChange={setAdayGunler} colors={colors} />
        <BesiDiyetTaslakPaneli colors={colors} hedefGun={projeksiyon.durum === 'hazir' ? projeksiyon.toplamGun : 90} />
        <Mini label="Döngü arası boş gün (yıllık devir için)" value={bosDonguGun} onChange={setBosDonguGun} colors={colors} />

        {adayKarsilastirma ? (
          <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {adayKarsilastirma.enIyiGun != null ? (
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                Modellenen adaylar içinde en yüksek model dengesi: {adayKarsilastirma.enIyiGun} gün ·{' '}
                {adayKarsilastirma.enIyiNetKar != null
                  ? `${(adayKarsilastirma.enIyiNetKar * basAdet).toLocaleString('tr-TR')} ₺ sürü (${basAdet} baş)`
                  : '—'}{' '}
                (garanti kâr değil)
              </Text>
            ) : (
              <Text style={{ color: colors.warning, fontWeight: '800' }}>Aday gün karşılaştırması için girdi eksik</Text>
            )}
            {adayKarsilastirma.satirlar.map((s) =>
              s.ekonomi.durum === 'hazir' ? (
                <View key={s.gun} style={{ marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: 6 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {s.gun} gün · canlı ~{planMaliyetVeKgGunHedef(sayi(girisKg)!, donemler, s.gun)?.cikisKg ?? '—'} kg ·
                    satış kg {s.satisKgVarsayim ?? '—'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {s.ekonomi.dengeEtiket}: {s.ekonomi.netKar.toLocaleString('tr-TR')} ₺/baş · sürü{' '}
                    {(s.ekonomi.netKar * basAdet).toLocaleString('tr-TR')} ₺ · yer-gün {s.ekonomi.yerGunKar ?? '—'} ₺ ·
                    aylık adım {s.ekonomi.aylikAdimAySayisi} ay
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    Tam döngü batık+sözleşme: {s.ekonomi.batikVeSozlesme.toLocaleString('tr-TR')} ₺ · marjinal günlük (yem/bakım):{' '}
                    {s.ekonomi.marjinalGunlukMaliyetBas ?? '—'} ₺/baş/gün
                  </Text>
                </View>
              ) : null,
            )}
            {adayKarsilastirma.duyarlilik.map((d) => (
              <Text key={d} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                {d}
              </Text>
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => void kaydet()} style={[styles.btn, { backgroundColor: colors.tint }]}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Taslak kaydet</Text>
        </Pressable>
        {senaryoId ? (
          <>
            <Pressable onPress={() => void onayla()} style={[styles.btn, { backgroundColor: colors.accent, marginTop: 8 }]}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Planı onayla (kayıt kilidi)</Text>
            </Pressable>
            <Pressable onPress={() => void iptal()} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.warning, fontWeight: '700' }}>Taslağı iptal et</Text>
            </Pressable>
          </>
        ) : null}

        {kayitli.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>Plan / gerçekleşen (sürüm)</Text>
            {kayitli.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setSenaryoId(s.id);
                  setBaslik(s.baslik);
                  setBasSayisi(s.basSayisi != null ? String(s.basSayisi) : '');
                  setGirisKg(s.girisKg != null ? String(s.girisKg) : '');
                  if (s.alisCanliKgFiyat != null) setAlisKgFiyat(String(s.alisCanliKgFiyat));
                  else setAlisKgFiyat('');
                  setAlis(s.alisBasFiyat != null ? String(s.alisBasFiyat) : '');
                  setDonemler(s.donemler);
                  if (s.ekonomiKalemler?.length) setEkonomiKalemler(s.ekonomiKalemler);
                  setButceTaslak(s.butceTaslagi ?? null);
                  const raw = s.irkTaslagi ?? varsayilanIrkTaslak();
                  setIrkTaslak(
                    isGecerliHedefIrkKodu(raw.hedefIrk) ? raw : { ...raw, hedefIrk: 'generic_kuzu' },
                  );
                  setBolgeTaslak(s.bolgeTaslagi ?? varsayilanBolgeTaslak());
                  setSatisBirimi(s.satisBirimi ?? 'canli_kg');
                  setKarkasVerim(s.karkasVerimOrani != null ? String(s.karkasVerimOrani * 100) : '');
                  setSatisFiyat(s.satisFiyatKg != null ? String(s.satisFiyatKg) : '');
                  setPlanKilitli(s.durum === 'onayli');
                }}
                style={{ paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                <Text style={{ color: colors.text }}>
                  {s.baslik} · v{s.surum} · {s.durum}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {s.kapsam.etiket} · plan≠gerçekleşen (stok otomatik değil)
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function Mini({
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
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, marginBottom: 8, fontSize: 16 },
  donem: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 10 },
  kutu: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 12 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnOutline: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, flex: 1 },
});
