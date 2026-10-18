import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import {
  dinlemeyiBaslat,
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
  const [ahirModu, setAhirModu] = useState(true);
  const [sesliTekrar, setSesliTekrar] = useState(true);
  const [ipucu, setIpucu] = useState<string | null>(null);
  const [uygulanan, setUygulanan] = useState(0);
  const dinlemeRef = useRef<DinlemeKontrol | null>(null);
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

  const sesliTekrarDegis = (v: boolean) => {
    setSesliTekrar(v);
    if (!v) seslendirmeyiDurdur();
    sesliTekrarKaydet(v).catch(() => {});
  };

  const isleRef = useRef<(girdi: string) => Promise<void>>(async () => {});

  /** otomatik: konuşma sonrası kendiliğinden açıldı (iOS engelleyebilir) */
  const dinlemeyiAc = useCallback((otomatik = false) => {
    seslendirmeyiDurdur();
    const ctrl = dinlemeyiBaslat({
      onBasladi: () => {
        setDinliyor(true);
        setIpucu(null);
      },
      onSonuc: (t) => {
        setDinliyor(false);
        setMetin(t);
        void isleRef.current(t);
      },
      onBitti: () => setDinliyor(false),
      onHata: (mesaj, kod) => {
        setDinliyor(false);
        if (otomatik) {
          setIpucu(IOS_IPUCU);
          return;
        }
        if (kod === 'no-speech' || kod === 'aborted') {
          setIpucu('Ses duyulmadı. Tekrar Dinle’ye basın veya yazın.');
          return;
        }
        if (!ahirRef.current) Alert.alert('Dinleme', mesaj);
        else setIpucu(mesaj);
      },
    });
    dinlemeRef.current = ctrl;
    if (!ctrl) {
      setDinliyor(false);
      if (otomatik) setIpucu(IOS_IPUCU);
    }
  }, []);

  /** Sonucu göster + (açıksa) sesli oku; cevap bekleniyorsa konuşma bitince dinle */
  const sonucuSun = useCallback(
    (sonuc: SesKomutSonucu) => {
      setOkuma(sonuc.okumaMetni);
      setAsama(sonuc.asama);
      if (sonuc.duzeltmeMetni) setMetin(sonuc.duzeltmeMetni);
      else if (sonuc.asama === 'onay_bekliyor' || sonuc.asama === 'eksik_bilgi') setMetin('');

      const sonraDinle =
        durum.sttHazir &&
        (sonuc.cevapBekleniyor || (sonuc.asama === 'uygulandi' && ahirRef.current));
      const dinlemeyeGec = () => {
        if (sonraDinle) setTimeout(() => dinlemeyiAc(true), 250);
        else if (sonuc.cevapBekleniyor && !durum.sttHazir) setIpucu(null);
      };

      if (sesliRef.current) {
        metniSeslendir(sonuc.konusmaMetni ?? sonuc.okumaMetni, { onBitti: dinlemeyeGec });
      } else if (sonraDinle) {
        setTimeout(() => dinlemeyiAc(true), 600);
      }
    },
    [dinlemeyiAc, durum.sttHazir]
  );

  const isle = useCallback(
    async (girdi: string) => {
      const sonuc = await oturum.metinAl(girdi);
      if (sonuc.asama === 'uygulandi') {
        refresh();
        setUygulanan((n) => n + 1);
        setMetin('');
      }
      sonucuSun(sonuc);
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
      dinlemeRef.current?.durdur();
      setDinliyor(false);
      return;
    }
    seslendirmeKilidiAc();
    dinlemeyiAc(false);
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
            dinlemeRef.current?.durdur();
            setDinliyor(false);
            const r = oturum.iptalEt();
            setOkuma(r.okumaMetni);
            setAsama(r.asama);
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
