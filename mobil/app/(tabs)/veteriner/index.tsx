import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { AsiModuPaneli } from '@/bilesenler/veteriner/AsiModuPaneli';
import { FotografYukle } from '@/bilesenler/veteriner/FotografYukle';
import { FotoIstekKarti } from '@/bilesenler/veteriner/FotoIstekKarti';
import { HastalikIlacPaneli } from '@/bilesenler/veteriner/HastalikIlacPaneli';
import { ModTakviyePaneli } from '@/bilesenler/veteriner/ModTakviyePaneli';
import { NetlestirmeSorulari } from '@/bilesenler/veteriner/NetlestirmeSorulari';
import { TakipModuPaneli } from '@/bilesenler/veteriner/TakipModuPaneli';
import { TeshisTedaviKarti } from '@/bilesenler/veteriner/TeshisTedaviKarti';
import { VakaDosKarti } from '@/bilesenler/veteriner/VakaDosKarti';
import { VetIletisimFormu } from '@/bilesenler/veteriner/VetIletisimFormu';
import { VetInboxKarti } from '@/bilesenler/veteriner/VetInboxKarti';
import { VitaminListePaneli } from '@/bilesenler/veteriner/VitaminListePaneli';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  analyzeVakaTam,
  baslatTakip,
  formatAiOzet,
  hayvanBulKupe,
  hayvaniKarantinayaAl,
  teshisOzeti,
  uygulaSuruTedavisi,
  uygulaTedaviVeTakip,
  vakaDosMetni,
  vakaDosOlustur,
  vetDanisildiIsaretle,
  VET_DISCLAIMER,
  type VetAnalizSonuc,
  type VetCevaplar,
  type VakaDos,
} from '@/kaynak/akilli-veteriner';
import type { VakaFotografi } from '@/kaynak/akilli-veteriner/fotograf';
import { olusturVakaPaketi } from '@/kaynak/veteriner-koprusu/vaka-paketi';
import { fotograflariPaylas, gonderVakaPaketi } from '@/kaynak/veteriner-koprusu/gonder';
import { vetGonderimKanali, type VetKanal } from '@/kaynak/veteriner-koprusu/vet-iletisim';

type Alt = 'asi' | 'hastalik' | 'vitamin' | 'plan' | 'takip' | 'gonder' | 'vakalar' | 'vet-ayar';

function useVakaAnalizi() {
  const [symptoms, setSymptomsRaw] = useState('');
  const [fotograflar, setFotograflarRaw] = useState<VakaFotografi[]>([]);
  const [cevaplar, setCevaplar] = useState<VetCevaplar>({});
  const [analiz, setAnaliz] = useState<VetAnalizSonuc | null>(null);

  const calistir = useCallback((s: string, fotos: VakaFotografi[], cvp: VetCevaplar) => {
    const sonuc = analyzeVakaTam({ symptoms: s, fotograflar: fotos, cevaplar: cvp });
    setAnaliz(sonuc);
    return sonuc;
  }, []);

  const setSymptoms = (s: string) => {
    setSymptomsRaw(s);
    setCevaplar({});
    setAnaliz(null);
  };

  const setFotograflar = (f: VakaFotografi[]) => {
    setFotograflarRaw(f);
    setAnaliz(null);
    if (Object.keys(cevaplar).length > 0) calistir(symptoms, f, cevaplar);
  };

  const analizEt = () => calistir(symptoms, fotograflar, cevaplar);

  const cevapVer = (soruId: string, secenekId: string) => {
    const next = { ...cevaplar, [soruId]: secenekId };
    setCevaplar(next);
    calistir(symptoms, fotograflar, next);
  };

  const result = analiz?.oneri ?? null;
  const dos: VakaDos | null = useMemo(() => {
    if (!analiz?.hazir || !result || !analiz.teshis) return null;
    return vakaDosOlustur({
      baglamMetni: `${teshisOzeti(analiz.teshis)}\n${analiz.baglamMetni}`,
      oneri: result,
      fotograflar,
      cevaplar,
    });
  }, [analiz, result, fotograflar, cevaplar]);

  return {
    symptoms,
    setSymptoms,
    fotograflar,
    setFotograflar,
    cevaplar,
    analiz,
    analizEt,
    cevapVer,
    baglamMetni: analiz?.baglamMetni ?? symptoms,
    result,
    dos,
  };
}

export default function VetScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [alt, setAlt] = useState<Alt>('hastalik');
  const [kupe, setKupe] = useState('');
  const [kanalAciklama, setKanalAciklama] = useState('');
  const [vetKanal, setVetKanal] = useState<VetKanal>('yapilandir');
  const [vetAd, setVetAd] = useState('');
  const [inboxKey, setInboxKey] = useState(0);
  const [takipKey, setTakipKey] = useState(0);
  const [aktifTakipId, setAktifTakipId] = useState<string | null>(null);
  const [kayitliKg, setKayitliKg] = useState<number | null>(null);
  const [onayliKg, setOnayliKg] = useState<number | null>(null);
  const [hayvanEtiket, setHayvanEtiket] = useState('');
  const vaka = useVakaAnalizi();

  useEffect(() => {
    void (async () => {
      setOnayliKg(null);
      if (!kupe.trim()) {
        setKayitliKg(null);
        setHayvanEtiket('');
        return;
      }
      const h = await hayvanBulKupe(kupe);
      setKayitliKg(h?.kiloKg ?? null);
      setHayvanEtiket(h?.earTag ?? '');
    })();
  }, [kupe]);

  const loadKanal = useCallback(async () => {
    const k = await vetGonderimKanali();
    setKanalAciklama(k.aciklama);
    setVetKanal(k.kanal);
    setVetAd(k.vet.ad || k.vet.klinikAdi);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadKanal();
    }, [loadKanal])
  );

  const tedaviBaslat = async (opts?: { vetAtla?: boolean }) => {
    if (!vaka.analiz?.teshis || !vaka.analiz.hazir) {
      Alert.alert('Eksik', 'Önce analizi tamamlayın.');
      return;
    }
    if (!onayliKg || onayliKg <= 0) {
      Alert.alert('Kilo gerekli', 'Tedavi dozu için kiloyu onaylayın.');
      return;
    }
    const hayvan = await hayvanBulKupe(kupe);
    if (!hayvan) {
      Alert.alert('Küpe gerekli', 'Tedavi ve takip için kulak küpe numarası girin.');
      return;
    }

    const takip = await baslatTakip({
      animalId: hayvan.id,
      earTag: hayvan.earTag,
      paddock: hayvan.paddock,
      teshis: vaka.analiz.teshis,
      baglamMetni: vaka.analiz.baglamMetni,
      cevaplar: vaka.cevaplar,
      fotograflar: vaka.fotograflar,
    });
    setAktifTakipId(takip.id);

    const sonuc = await uygulaTedaviVeTakip(takip.id, { vetOnayAtlandi: opts?.vetAtla, kg: onayliKg });
    if (!sonuc.ok) {
      Alert.alert('Veteriner gerekli', sonuc.message, [
        { text: 'Vet gönder', onPress: () => setAlt('gonder') },
        {
          text: 'Yine de uygula',
          style: 'destructive',
          onPress: () => void uygulaTedaviVeTakip(takip.id, { vetOnayAtlandi: true, kg: onayliKg }).then((r) => {
            Alert.alert(r.ok ? 'Tamam' : 'Hata', r.message);
            setTakipKey((k) => k + 1);
            setAlt('takip');
          }),
        },
      ]);
      return;
    }

    Alert.alert('Takip başladı', sonuc.message, [{ text: 'Takip modu', onPress: () => setAlt('takip') }]);
    setTakipKey((k) => k + 1);
  };

  const veterinerGonder = async () => {
    const sonucAnaliz = vaka.result ? vaka.analiz : vaka.analizEt();
    if (!sonucAnaliz?.hazir || !sonucAnaliz.oneri) {
      Alert.alert('Eksik bilgi', 'Analizi tamamlayın.');
      return;
    }

    const dos =
      vaka.dos ??
      vakaDosOlustur({
        baglamMetni: sonucAnaliz.baglamMetni,
        oneri: sonucAnaliz.oneri,
        fotograflar: vaka.fotograflar,
        cevaplar: vaka.cevaplar,
      });

    if (aktifTakipId) await vetDanisildiIsaretle(aktifTakipId);

    const aiOzet = sonucAnaliz.teshis
      ? `${teshisOzeti(sonucAnaliz.teshis)} · ${formatAiOzet(sonucAnaliz.oneri)}`
      : formatAiOzet(sonucAnaliz.oneri);

    const paket = await olusturVakaPaketi(kupe, dos.baglamMetni, { aiOzet, fotograflar: vaka.fotograflar });
    if (!paket) {
      Alert.alert('Eksik', 'Kulak küpe numarası gerekli');
      return;
    }
    const sonuc = await gonderVakaPaketi(paket);
    if (!sonuc.ok) {
      Alert.alert('Veteriner tanımlı değil', sonuc.message, [
        { text: 'Tamam' },
        { text: 'Vet ayarları', onPress: () => setAlt('vet-ayar') },
      ]);
      return;
    }
    setInboxKey((k) => k + 1);
    if (sonuc.kanal === 'whatsapp' && paket.fotograflar.length > 0) {
      Alert.alert('WhatsApp', sonuc.message, [
        { text: 'Tamam' },
        { text: 'Fotoğraf paylaş', onPress: () => void fotograflariPaylas(paket) },
      ]);
      return;
    }
    Alert.alert(sonuc.kanal === 'program' ? 'Dosya iletildi' : 'WhatsApp', sonuc.message);
  };

  const analizPaneli = (
    <>
      {vaka.analiz?.netlestirmeGerekli ? (
        <NetlestirmeSorulari sorular={vaka.analiz.sorular} cevaplar={vaka.cevaplar} onCevap={vaka.cevapVer} />
      ) : null}
      {vaka.analiz?.fotoBekleniyor ? <FotoIstekKarti istekler={vaka.analiz.fotoIstekleri} /> : null}
      {vaka.analiz?.hazir && vaka.analiz.teshis ? (
        <TeshisTedaviKarti
          teshis={vaka.analiz.teshis}
          vetKanal={vetKanal}
          vetAd={vetAd}
          earTag={hayvanEtiket || kupe}
          kayitliKg={kayitliKg}
          onayliKg={onayliKg}
          onKgOnay={setOnayliKg}
          onKgSifirla={() => setOnayliKg(null)}
          onVetDanis={() => setAlt('gonder')}
          onTedaviUygula={() => void tedaviBaslat()}
          onKarantina={async () => {
            const hayvan = await hayvanBulKupe(kupe);
            if (!hayvan) {
              Alert.alert('Küpe gerekli', 'Kulak küpe numarası girin.');
              return;
            }
            const r = await hayvaniKarantinayaAl(hayvan.id);
            Alert.alert(r.ok ? 'Karantina' : 'Hata', r.message);
          }}
          onSuruPadok={() => {
            if (!aktifTakipId) {
              Alert.alert('Önce', 'Önce tedaviyi uygulayın.');
              return;
            }
            void uygulaSuruTedavisi(aktifTakipId, 'ayni_padok').then((r) =>
              Alert.alert(r.ok ? 'Tamam' : 'Hata', r.message)
            );
          }}
          onSuruTum={() => {
            if (!aktifTakipId) {
              Alert.alert('Önce', 'Önce tedaviyi uygulayın.');
              return;
            }
            void uygulaSuruTedavisi(aktifTakipId, 'tum_kuzular').then((r) =>
              Alert.alert(r.ok ? 'Tamam' : 'Hata', r.message)
            );
          }}
        />
      ) : null}
      {vaka.dos ? <VakaDosKarti dos={vaka.dos} onVetGonder={() => setAlt('gonder')} /> : null}
    </>
  );

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <AltButonlar
        items={[
          { key: 'asi', label: 'Aşı' },
          { key: 'hastalik', label: 'Hastalık' },
          { key: 'vitamin', label: 'Vitamin' },
          { key: 'plan', label: 'Mod plan' },
          { key: 'takip', label: 'Takip' },
          { key: 'gonder', label: 'Vet' },
          { key: 'vakalar', label: 'Vakalar' },
        ]}
        activeKey={alt}
        onSelect={(k) => setAlt(k as Alt)}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.disclaimer, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{VET_DISCLAIMER}</Text>
        </View>

        {alt === 'vet-ayar' ? (
          <VetIletisimFormu onKaydedildi={() => { loadKanal(); setAlt('gonder'); }} />
        ) : alt === 'vakalar' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Gönderilen vakalar</Text>
            <VetInboxKarti refreshKey={inboxKey} />
            <AnaButon title="Vet ayarları" variant="secondary" onPress={() => setAlt('vet-ayar')} />
          </>
        ) : alt === 'takip' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Takip modu</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12, lineHeight: 20 }}>
              Etki süresi bitince fotoğraf + durum güncellemesi istenir. Taburcu olana kadar izlenir.
            </Text>
            <TakipModuPaneli refreshKey={takipKey} />
          </>
        ) : alt === 'asi' ? (
          <AsiModuPaneli />
        ) : alt === 'vitamin' ? (
          <VitaminListePaneli />
        ) : alt === 'plan' ? (
          <ModTakviyePaneli />
        ) : alt === 'gonder' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Veterinere danış / gönder</Text>
            <Text style={{ color: colors.tint, fontWeight: '700', marginBottom: 12 }}>{kanalAciklama}</Text>
            <TextInput
              placeholder="Kulak küpe no"
              value={kupe}
              onChangeText={setKupe}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Semptom"
              multiline
              value={vaka.symptoms}
              onChangeText={vaka.setSymptoms}
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 80 }]}
            />
            <FotografYukle fotograflar={vaka.fotograflar} onChange={vaka.setFotograflar} />
            <AnaButon title="Analiz et" variant="secondary" onPress={vaka.analizEt} />
            {analizPaneli}
            <AnaButon title="Dosyayı veterinere gönder" onPress={veterinerGonder} />
            <AnaButon title="Vet ayarları" variant="secondary" onPress={() => setAlt('vet-ayar')} />
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Hastalık modu</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12, lineHeight: 20 }}>
              Teşhis → başlangıç/ileri derece → iğne/doz → vet danış → takip → taburcu
            </Text>
            <TextInput
              placeholder="Kulak küpe no (zorunlu — tedavi/takip için)"
              value={kupe}
              onChangeText={setKupe}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Belirtiler..."
              multiline
              value={vaka.symptoms}
              onChangeText={vaka.setSymptoms}
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 100 }]}
            />
            <FotografYukle fotograflar={vaka.fotograflar} onChange={vaka.setFotograflar} />
            <AnaButon title="Teşhis koy" onPress={vaka.analizEt} />
            {analizPaneli}
            <HastalikIlacPaneli refreshKey={takipKey} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  container: { flex: 1, padding: 16 },
  disclaimer: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, textAlignVertical: 'top', marginBottom: 10 },
});
