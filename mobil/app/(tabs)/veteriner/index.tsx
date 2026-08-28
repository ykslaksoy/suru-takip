import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AltButonlar } from '@/bilesenler/ortak/AltButonlar';
import { AsiModuPaneli } from '@/bilesenler/veteriner/AsiModuPaneli';
import { FotografYukle } from '@/bilesenler/veteriner/FotografYukle';
import { FotoIstekKarti } from '@/bilesenler/veteriner/FotoIstekKarti';
import { NetlestirmeSorulari } from '@/bilesenler/veteriner/NetlestirmeSorulari';
import { VakaDosKarti } from '@/bilesenler/veteriner/VakaDosKarti';
import { VetIletisimFormu } from '@/bilesenler/veteriner/VetIletisimFormu';
import { VetInboxKarti } from '@/bilesenler/veteriner/VetInboxKarti';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  analyzeVakaTam,
  formatAiOzet,
  vakaDosMetni,
  vakaDosOlustur,
  VET_DISCLAIMER,
  type VetAnalizSonuc,
  type VetCevaplar,
  type VakaDos,
} from '@/kaynak/akilli-veteriner';
import type { VakaFotografi } from '@/kaynak/akilli-veteriner/fotograf';
import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';
import { olusturVakaPaketi } from '@/kaynak/veteriner-koprusu/vaka-paketi';
import { fotograflariPaylas, gonderVakaPaketi } from '@/kaynak/veteriner-koprusu/gonder';
import { vetGonderimKanali } from '@/kaynak/veteriner-koprusu/vet-iletisim';

type Alt = 'asi' | 'hastalik' | 'gonder' | 'vakalar' | 'vet-ayar';

function TedaviSonucKarti({
  result,
  colors,
  onVetGonder,
}: {
  result: VetSuggestion;
  colors: (typeof Colors)['light'];
  onVetGonder?: () => void;
}) {
  const urgencyColor = {
    low: colors.success,
    medium: colors.warning,
    high: colors.danger,
  };

  return (
    <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.urgency, { color: urgencyColor[result.urgency] }]}>
        Aciliyet: {result.urgency === 'high' ? 'Yüksek' : result.urgency === 'medium' ? 'Orta' : 'Düşük'}
        {result.seeVet ? ' · Veteriner önerilir' : ''}
      </Text>
      {result.fotoGozlemleri.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.tint }]}>Fotoğraf gözlemleri</Text>
          {result.fotoGozlemleri.map((g, i) => (
            <Text key={i} style={{ color: colors.text, lineHeight: 20 }}>
              • {g}
            </Text>
          ))}
        </>
      )}
      {result.conditions.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.tint }]}>Olası durumlar (bilgilendirme)</Text>
          {result.conditions.map((c, i) => (
            <Text key={i} style={{ color: colors.text }}>
              • {c}
            </Text>
          ))}
        </>
      )}
      {result.tedaviOnerileri.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.tint }]}>Önerilen tedavi adımları</Text>
          {result.tedaviOnerileri.map((t, i) => (
            <Text key={i} style={{ color: colors.text, lineHeight: 22 }}>
              {i + 1}. {t}
            </Text>
          ))}
        </>
      )}
      <Text style={[styles.section, { color: colors.tint }]}>Genel öneri</Text>
      <Text style={{ color: colors.text, lineHeight: 22 }}>{result.advice}</Text>
      {result.seeVet && onVetGonder ? (
        <View style={{ marginTop: 14 }}>
          <AnaButon title="Veterinere gönder" onPress={onVetGonder} />
        </View>
      ) : null}
    </View>
  );
}

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
    if (Object.keys(cevaplar).length > 0) {
      calistir(symptoms, f, cevaplar);
    }
  };

  const analizEt = () => calistir(symptoms, fotograflar, cevaplar);

  const cevapVer = (soruId: string, secenekId: string) => {
    const next = { ...cevaplar, [soruId]: secenekId };
    setCevaplar(next);
    calistir(symptoms, fotograflar, next);
  };

  const result = analiz?.oneri ?? null;
  const dos: VakaDos | null = useMemo(() => {
    if (!analiz?.hazir || !result) return null;
    return vakaDosOlustur({
      baglamMetni: analiz.baglamMetni,
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

function HastalikModu({
  colors,
  vaka,
  onVetGonder,
}: {
  colors: (typeof Colors)['light'];
  vaka: ReturnType<typeof useVakaAnalizi>;
  onVetGonder: () => void;
}) {
  const { symptoms, setSymptoms, fotograflar, setFotograflar, cevaplar, analiz, analizEt, cevapVer, result, dos } =
    vaka;

  return (
    <>
      <Text style={[styles.title, { color: colors.text }]}>Hastalık modu</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 12, lineHeight: 20 }}>
        Fotoğraf + semptom → sorular → gerekirse yeni foto isteği → tedavi önerisi → vaka dosyası.
      </Text>

      <TextInput
        placeholder="Belirtileri buraya yazın..."
        multiline
        value={symptoms}
        onChangeText={setSymptoms}
        style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 120 }]}
      />

      <FotografYukle fotograflar={fotograflar} onChange={setFotograflar} />

      <AnaButon title="Analiz Et" onPress={analizEt} />

      {analiz?.netlestirmeGerekli && analiz.sorular.length > 0 ? (
        <NetlestirmeSorulari sorular={analiz.sorular} cevaplar={cevaplar} onCevap={cevapVer} />
      ) : null}

      {analiz?.fotoBekleniyor && analiz.fotoIstekleri.length > 0 ? (
        <FotoIstekKarti istekler={analiz.fotoIstekleri} />
      ) : null}

      {analiz && !analiz.hazir && !analiz.netlestirmeGerekli && !analiz.fotoBekleniyor ? (
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>
          Soruları yanıtlayın veya istenen fotoğrafları ekleyin.
        </Text>
      ) : null}

      {result ? <TedaviSonucKarti result={result} colors={colors} onVetGonder={onVetGonder} /> : null}
      {dos ? <VakaDosKarti dos={dos} onVetGonder={onVetGonder} /> : null}

      <Text style={[styles.examples, { color: colors.textSecondary }]}>
        Örnek: ishal, topallama, kuzu emmeme + ayak/yara fotoğrafı
      </Text>
    </>
  );
}

export default function VetScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [alt, setAlt] = useState<Alt>('hastalik');
  const [kupe, setKupe] = useState('');
  const [kanalAciklama, setKanalAciklama] = useState('');
  const [inboxKey, setInboxKey] = useState(0);
  const vaka = useVakaAnalizi();

  const loadKanal = useCallback(async () => {
    const k = await vetGonderimKanali();
    setKanalAciklama(k.aciklama);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadKanal();
    }, [loadKanal])
  );

  const veterinerGonder = async () => {
    const sonucAnaliz = vaka.result ? vaka.analiz : vaka.analizEt();
    if (!sonucAnaliz.hazir || !sonucAnaliz.oneri) {
      Alert.alert(
        'Eksik bilgi',
        sonucAnaliz.fotoBekleniyor
          ? 'Lütfen istenen açılardan fotoğraf ekleyin.'
          : 'Netleştirme sorularını yanıtlayın ve analizi tamamlayın.'
      );
      return;
    }

    const dos = vaka.dos ?? vakaDosOlustur({
      baglamMetni: sonucAnaliz.baglamMetni,
      oneri: sonucAnaliz.oneri,
      fotograflar: vaka.fotograflar,
      cevaplar: vaka.cevaplar,
    });
    const aiOzet = `${formatAiOzet(sonucAnaliz.oneri)}\n${vakaDosMetni(dos, kupe.trim() || undefined).slice(0, 400)}…`;

    const paket = await olusturVakaPaketi(kupe, dos.baglamMetni, {
      aiOzet,
      fotograflar: vaka.fotograflar,
    });
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

    Alert.alert(
      sonuc.kanal === 'program' ? 'Dosya iletildi' : 'WhatsApp',
      sonuc.message,
      sonuc.kanal === 'program'
        ? [{ text: 'Vakalar', onPress: () => setAlt('vakalar') }, { text: 'Tamam' }]
        : [{ text: 'Tamam' }]
    );
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <AltButonlar
        items={[
          { key: 'asi', label: 'Aşı modu' },
          { key: 'hastalik', label: 'Hastalık' },
          { key: 'gonder', label: 'Vet gönder' },
          { key: 'vakalar', label: 'Vakalar' },
          { key: 'vet-ayar', label: 'Vet ayarı' },
        ]}
        activeKey={alt}
        onSelect={(k) => setAlt(k as Alt)}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.disclaimer, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{VET_DISCLAIMER}</Text>
        </View>

        {alt === 'vet-ayar' ? (
          <VetIletisimFormu
            onKaydedildi={() => {
              loadKanal();
              setAlt('gonder');
            }}
          />
        ) : alt === 'vakalar' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Gönderilen vakalar</Text>
            <VetInboxKarti refreshKey={inboxKey} />
          </>
        ) : alt === 'asi' ? (
          <AsiModuPaneli />
        ) : alt === 'gonder' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Veterinere gönder</Text>
            <Text style={{ color: colors.tint, fontWeight: '700', marginBottom: 12, lineHeight: 20 }}>
              {kanalAciklama}
            </Text>
            <TextInput
              placeholder="Kulak küpe no"
              value={kupe}
              onChangeText={setKupe}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder="Semptom / gözlem"
              multiline
              value={vaka.symptoms}
              onChangeText={vaka.setSymptoms}
              style={[styles.input, { borderColor: colors.border, color: colors.text, minHeight: 100 }]}
            />
            <FotografYukle fotograflar={vaka.fotograflar} onChange={vaka.setFotograflar} />
            <AnaButon title="Analiz / soruları getir" variant="secondary" onPress={vaka.analizEt} />
            {vaka.analiz?.netlestirmeGerekli ? (
              <NetlestirmeSorulari
                sorular={vaka.analiz.sorular}
                cevaplar={vaka.cevaplar}
                onCevap={vaka.cevapVer}
              />
            ) : null}
            {vaka.analiz?.fotoBekleniyor ? <FotoIstekKarti istekler={vaka.analiz.fotoIstekleri} /> : null}
            {vaka.dos ? <VakaDosKarti dos={vaka.dos} /> : null}
            <AnaButon title="Dosyayı veterinere gönder" onPress={veterinerGonder} />
          </>
        ) : (
          <HastalikModu colors={colors} vaka={vaka} onVetGonder={() => setAlt('gonder')} />
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
  result: { marginTop: 20, padding: 16, borderRadius: 12, borderWidth: 1 },
  urgency: { fontWeight: '700', marginBottom: 12 },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  examples: { marginTop: 24, fontSize: 13, fontStyle: 'italic' },
});
