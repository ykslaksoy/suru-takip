import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SesDinlemeGostergesi } from '@/bilesenler/ses/SesDinlemeGostergesi';
import { Stack, router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  dinlemeyiBaslat,
  dinlemeyiBaslatOtomatik,
  konusmaDurumu,
  metniSeslendir,
  sesKomutOturumuOlustur,
  seslendirmeKilidiAc,
  seslendirmeyiDurdur,
  sesliTekrarAcikMi,
  sesliTekrarKaydet,
  type DinlemeKontrol,
  type SesKomutSonucu,
} from '@/kaynak/ses';
import type { SesDinlemeDurumu } from '@/kaynak/ses/dinleme-durumu';
import { azalanHareketTercihi, mikrofonSeviyeDestekleniyor } from '@/kaynak/ses/mikrofon-seviye';

const ASAMA_ETIKET: Record<string, string> = {
  hazir: 'hazır',
  bos: 'hazır',
  onay_bekliyor: 'onay bekliyor',
  duzeltme: 'düzeltme bekleniyor (kaydedilmedi)',
  eksik_bilgi: 'eksik bilgi',
  uygulandi: 'kaydedildi',
  iptal: 'iptal',
  anlasilmadi: 'anlaşılmadı',
};

const IOS_IPUCU =
  'Cevap için Dinle’ye basın — iPhone tarayıcısı mikrofonu dokunmadan otomatik açmaya izin vermeyebilir.';

const ORNEKLER = [
  'küpe 1234, 68 kilo',
  'küpe TR-34-001235 aşı çiçek',
  '3. parti karma aşısı yapıldı',
  'tüm kuzular ivermektin',
  'stok giriş yem 50 kg',
  'tamam',
];

export default function SesKomutScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refresh } = useDatabase();
  const [oturum] = useState(() => sesKomutOturumuOlustur());
  const [metin, setMetin] = useState('');
  const [okuma, setOkuma] = useState('Komut yazın veya dinlemeyi başlatın. Örn: küpe 1234, 68 kilo');
  const [asama, setAsama] = useState('hazir');
  const [dinliyor, setDinliyor] = useState(false);
  const [dinlemeDurumu, setDinlemeDurumu] = useState<SesDinlemeDurumu>('durdu');
  const [seviyeCubuklari, setSeviyeCubuklari] = useState<number[]>([]);
  const [seviyeOlcumAktif, setSeviyeOlcumAktif] = useState(false);
  const reducedMotion = useMemo(() => azalanHareketTercihi(), []);
  const seviyeDestek = useMemo(() => mikrofonSeviyeDestekleniyor(), []);
  const [ahirModu, setAhirModu] = useState(true);
  const [sesliTekrar, setSesliTekrar] = useState(true);
  const [ipucu, setIpucu] = useState<string | null>(null);
  const [sonAlgilanan, setSonAlgilanan] = useState<string | null>(null);
  const [uygulanan, setUygulanan] = useState(0);
  const dinlemeRef = useRef<DinlemeKontrol | null>(null);
  const islemeKilidi = useRef(false);
  const metinIsleniyorRef = useRef(false);
  const ahirRef = useRef(true);
  const sesliRef = useRef(true);
  const durum = useMemo(() => konusmaDurumu(), []);

  ahirRef.current = ahirModu;
  sesliRef.current = sesliTekrar;

  useEffect(() => {
    let iptal = false;
    sesliTekrarAcikMi().then((v) => {
      if (!iptal) setSesliTekrar(v);
    });
    return () => {
      iptal = true;
    };
  }, []);

  const mikrofonuBirak = useCallback(() => {
    dinlemeRef.current?.durdur();
    dinlemeRef.current = null;
    setDinliyor(false);
    setDinlemeDurumu('durdu');
    setSeviyeCubuklari([]);
    setSeviyeOlcumAktif(false);
  }, []);

  useEffect(() => {
    return () => mikrofonuBirak();
  }, [mikrofonuBirak]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') mikrofonuBirak();
    });
    return () => sub.remove();
  }, [mikrofonuBirak]);

  const sesliTekrarDegis = (v: boolean) => {
    setSesliTekrar(v);
    if (!v) seslendirmeyiDurdur();
    sesliTekrarKaydet(v).catch(() => {});
  };

  const isleRef = useRef<(girdi: string) => Promise<void>>(async () => {});

  const dinlemeHataIsle = useCallback((mesaj: string, kod: string | undefined, otomatik: boolean) => {
    setDinliyor(false);
    setDinlemeDurumu('hata');
    setSeviyeCubuklari([]);
    setSeviyeOlcumAktif(false);
    if (otomatik) {
      setIpucu(IOS_IPUCU);
      return;
    }
    if (!ahirRef.current) Alert.alert('Dinleme', mesaj);
    else setIpucu(mesaj);
  }, []);

  /** Kullanıcı Dinle — seviye ölçümü açık */
  const dinlemeyiAcKullanici = useCallback(() => {
    seslendirmeyiDurdur();
    setSeviyeCubuklari([]);
    setSeviyeOlcumAktif(seviyeDestek);
    const ctrl = dinlemeyiBaslat({
      kullaniciBaslatti: true,
      onDinlemeDurumu: (d) => {
        setDinlemeDurumu(d);
        if (d === 'dinliyor' || d === 'ses_algilandi') setDinliyor(true);
        if (d === 'durdu' || d === 'hata') setDinliyor(false);
      },
      onSeviye: ({ cubuklar, sesVar }) => {
        setSeviyeCubuklari(cubuklar);
        setSeviyeOlcumAktif(cubuklar.length > 0 || sesVar);
      },
      onBasladi: () => {
        setDinliyor(true);
        setIpucu(null);
      },
      onSonuc: (t) => {
        setDinliyor(false);
        metinIsleniyorRef.current = true;
        setDinlemeDurumu('isleniyor');
        setMetin(t);
        setSonAlgilanan(t);
        setSeviyeCubuklari([]);
        setSeviyeOlcumAktif(false);
        void isleRef.current(t).finally(() => {
          metinIsleniyorRef.current = false;
          setDinlemeDurumu('durdu');
        });
      },
      onBitti: () => {
        setDinliyor(false);
        if (!metinIsleniyorRef.current) setDinlemeDurumu('durdu');
      },
      onHata: (mesaj, kod) => dinlemeHataIsle(mesaj, kod, false),
    });
    dinlemeRef.current = ctrl;
    if (!ctrl) dinlemeHataIsle('Dinleme açılamadı.', 'unsupported', false);
  }, [dinlemeHataIsle, seviyeDestek]);

  /** Otomatik: TTS sonrası — seviye ölçümü yok (t267u) */
  const dinlemeyiAcOtomatik = useCallback(() => {
    seslendirmeyiDurdur();
    setSeviyeCubuklari([]);
    setSeviyeOlcumAktif(false);
    const ctrl = dinlemeyiBaslatOtomatik({
      onBasladi: () => {
        setDinliyor(true);
        setDinlemeDurumu('dinliyor');
        setIpucu(null);
      },
      onSonuc: (t) => {
        setDinliyor(false);
        metinIsleniyorRef.current = true;
        setDinlemeDurumu('isleniyor');
        setMetin(t);
        setSonAlgilanan(t);
        void isleRef.current(t).finally(() => {
          metinIsleniyorRef.current = false;
          setDinlemeDurumu('durdu');
        });
      },
      onBitti: () => {
        setDinliyor(false);
        setDinlemeDurumu('durdu');
      },
      onHata: (mesaj, kod) => dinlemeHataIsle(mesaj, kod, true),
    });
    dinlemeRef.current = ctrl;
    if (!ctrl) {
      setDinliyor(false);
      setIpucu(IOS_IPUCU);
    }
  }, [dinlemeHataIsle]);

  /** Sonucu göster + (açıksa) sesli oku; cevap bekleniyorsa konuşma bitince dinle */
  const sonucuSun = useCallback(
    (sonuc: SesKomutSonucu) => {
      setOkuma(sonuc.okumaMetni);
      setAsama(sonuc.asama);
      if (sonuc.duzeltmeMetni) setMetin(sonuc.duzeltmeMetni);
      else if (sonuc.asama === 'uygulandi') setSonAlgilanan(null);

      const sonraDinle =
        durum.sttHazir &&
        (sonuc.cevapBekleniyor || (sonuc.asama === 'uygulandi' && ahirRef.current));
      const dinlemeyeGec = () => {
        if (sonraDinle) setTimeout(() => dinlemeyiAcOtomatik(), 250);
        else if (sonuc.cevapBekleniyor && !durum.sttHazir) setIpucu(null);
      };

      if (sesliRef.current) {
        metniSeslendir(sonuc.konusmaMetni ?? sonuc.okumaMetni, { onBitti: dinlemeyeGec });
      } else if (sonraDinle) {
        setTimeout(() => dinlemeyiAcOtomatik(), 600);
      }
    },
    [dinlemeyiAcOtomatik, durum.sttHazir]
  );

  const isle = useCallback(
    async (girdi: string) => {
      if (islemeKilidi.current) return;
      islemeKilidi.current = true;
      try {
        const trimmed = girdi.trim();
        if (trimmed) setSonAlgilanan(trimmed);
        const sonuc = await oturum.metinAl(girdi);
        if (sonuc.asama === 'uygulandi') {
          refresh();
          setUygulanan((n) => n + 1);
          setMetin('');
        }
        sonucuSun(sonuc);
      } finally {
        islemeKilidi.current = false;
      }
    },
    [oturum, refresh, sonucuSun]
  );

  isleRef.current = isle;

  const gonder = async () => {
    seslendirmeKilidiAc(); // iOS: dokunuş anında konuşmayı aç
    setIpucu(null);
    await isle(metin);
  };

  const dinle = () => {
    if (dinliyor) {
      mikrofonuBirak();
      return;
    }
    seslendirmeKilidiAc();
    dinlemeyiAcKullanici();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sesli komut' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.pad}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{durum.aciklama}</Text>

        <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Ahır modu</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Onay sonrası sonraki komutu dinlemeye devam et
            </Text>
          </View>
          <Switch value={ahirModu} onValueChange={setAhirModu} />
        </View>

        <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Sesli tekrar</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Kaydetmeden önce kaydı sesli okur; «tamam» ile kaydeder, «dur / yanlış» ile düzeltirsiniz
            </Text>
          </View>
          <Switch value={sesliTekrar} onValueChange={sesliTekrarDegis} />
        </View>

        <View
          style={[
            styles.box,
            {
              backgroundColor: colors.card,
              borderColor: asama === 'duzeltme' ? colors.warning : colors.border,
            },
          ]}>
          <Text
            style={{
              color: asama === 'duzeltme' ? colors.warning : colors.tint,
              fontWeight: '800',
              marginBottom: 6,
            }}>
            {asama === 'duzeltme' ? 'Sistem — kaydedilmedi' : 'Sistem'}
          </Text>
          <Text style={{ color: colors.text, lineHeight: 22 }}>{okuma}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
            Aşama: {ASAMA_ETIKET[asama] ?? asama}
            {dinliyor ? ' · dinleniyor…' : ''}
            {uygulanan > 0 ? ` · Bu oturumda ${uygulanan} kayıt` : ''}
          </Text>
          {sonAlgilanan ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
              Algılanan: <Text style={{ color: colors.text, fontWeight: '600' }}>{sonAlgilanan}</Text>
            </Text>
          ) : null}
          {ipucu ? (
            <Text style={{ color: colors.warning, marginTop: 8, fontSize: 12, fontWeight: '700' }}>{ipucu}</Text>
          ) : null}
        </View>

        <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 13 }}>Hızlı örnek</Text>
        <View style={styles.ornekRow}>
          {ORNEKLER.map((o) => (
            <Pressable
              key={o}
              onPress={() => setMetin(o)}
              style={[styles.ornek, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text, fontSize: 12 }}>{o}</Text>
            </Pressable>
          ))}
        </View>

        {dinlemeDurumu !== 'durdu' ? (
          <SesDinlemeGostergesi
            durum={dinlemeDurumu}
            cubuklar={seviyeCubuklari.length ? seviyeCubuklari : Array(12).fill(0)}
            seviyeOlcumVar={seviyeOlcumAktif && seviyeDestek}
            reducedMotion={reducedMotion}
            tint={colors.tint}
            border={colors.border}
            text={colors.text}
            textSecondary={colors.textSecondary}
            warning={colors.warning}
          />
        ) : null}

        <TextInput
          placeholder='Örn: "küpe TR-34-001235, 52 kilo" sonra "tamam"'
          placeholderTextColor={colors.textSecondary}
          value={metin}
          onChangeText={setMetin}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        />
        <AnaButon title={dinliyor ? 'Dinlemeyi durdur' : 'Dinle'} variant="secondary" onPress={dinle} />
        <AnaButon title="Gönder" onPress={() => void gonder()} />
        <AnaButon
          title="İptal"
          variant="secondary"
          onPress={() => {
            seslendirmeyiDurdur();
            mikrofonuBirak();
            const r = oturum.iptalEt();
            setOkuma(r.okumaMetni);
            setAsama(r.asama);
            setMetin('');
            setSonAlgilanan(null);
            setIpucu(null);
            if (sesliRef.current) metniSeslendir(r.okumaMetni);
          }}
        />

        <Pressable
          onPress={() => router.push('/seri-giris')}
          style={StyleSheet.flatten([
            styles.link,
            { borderColor: colors.border, backgroundColor: colors.card },
          ])}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Seri ahır modu (toplu satır)</Text>
          <Text style={{ color: colors.tint }}>→</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  intro: { lineHeight: 20, marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  box: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 48, marginBottom: 12 },
  ornekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  ornek: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  link: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
