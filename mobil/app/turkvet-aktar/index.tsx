import { useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { exportTurkvetData, getAnimals } from '@/kaynak/cekirdek/veritabani';
import { TURKVET_FIELD_LABELS } from '@/kaynak/turkvet/dogrula';
import {
  turkvetCsvAktar,
  turkvetCsvIceAktar,
  turkvetKontrolListesi,
  VETBIS_ASI_NOTLARI,
  type TurkvetIceAktarRapor,
  type TurkvetKontrolSatir,
} from '@/kaynak/turkvet/resmi-api';
import { terim } from '@/sabitler/Metinler';

export default function TurkvetAktarimEkrani() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [preview, setPreview] = useState('');
  const [kontrol, setKontrol] = useState<{ tamam: number; eksik: number; satirlar: TurkvetKontrolSatir[] } | null>(
    null
  );
  const [iceCsv, setIceCsv] = useState('');
  const [iceRapor, setIceRapor] = useState<(TurkvetIceAktarRapor & { kuru: boolean }) | null>(null);

  const iceAktar = async (kuru: boolean) => {
    const r = await turkvetCsvIceAktar(iceCsv, { kuruCalisma: kuru });
    setIceRapor({ ...r, kuru });
  };

  const dosyaSec = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.csv,text/csv,text/plain';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (f) setIceCsv(await f.text());
    };
    inp.click();
  };

  const loadPreview = async () => {
    const json = await exportTurkvetData();
    setPreview(json.slice(0, 2000) + (json.length > 2000 ? '\n...' : ''));
  };

  const exportData = async () => {
    const json = await exportTurkvetData();
    try {
      await Share.share({ message: json, title: 'TÜRKVET Dışa Aktarım' });
    } catch {
      Alert.alert('Dışa aktarım', `${(await getAnimals()).length} hayvan dışa aktarıldı.`);
    }
  };

  const exportCsv = async () => {
    const csv = await turkvetCsvAktar();
    try {
      await Share.share({ message: csv, title: 'TÜRKVET CSV' });
    } catch {
      Alert.alert('CSV', 'CSV oluşturuldu.');
    }
  };

  const kontrolEt = async () => {
    setKontrol(await turkvetKontrolListesi());
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>TÜRKVET / VETBİS / GEKİS</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
        Alan doğrulama, kontrol listesi, JSON/CSV dışa aktarım ve resmi listeden CSV içe aktarım. Bakanlık
        üçüncü taraf uygulamalara TÜRKVET API’si açmadığı için bildirim CSV ile il/ilçe müdürlüğü veya veteriner
        hekim üzerinden yapılır.
      </Text>

      <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.tint }]}>Zorunlu / önerilen alanlar</Text>
        {Object.entries(TURKVET_FIELD_LABELS).map(([key, label]) => (
          <Text key={key} style={{ color: colors.text, marginBottom: 4 }}>
            • {label}
          </Text>
        ))}
      </View>

      <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.section, { color: colors.tint }]}>VETBİS notları</Text>
        {VETBIS_ASI_NOTLARI.map((n) => (
          <Text key={n} style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 4, lineHeight: 18 }}>
            • {n}
          </Text>
        ))}
      </View>

      <AnaButon title="Alan kontrol listesi" variant="secondary" onPress={() => void kontrolEt()} />
      {kontrol ? (
        <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {kontrol.tamam} tamam · {kontrol.eksik} eksik
          </Text>
          {kontrol.satirlar
            .filter((s) => s.eksikler.length > 0)
            .slice(0, 12)
            .map((s) => (
              <Text key={s.animalId} style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>
                {s.earTag}: {s.eksikler.join(', ')}
              </Text>
            ))}
        </View>
      ) : null}

      <AnaButon title="Önizleme Yükle" onPress={() => void loadPreview()} />
      <AnaButon title={`${terim('JSON')} Dışa Aktar`} onPress={() => void exportData()} />
      <AnaButon title="CSV Dışa Aktar (Excel)" variant="secondary" onPress={() => void exportCsv()} />

      <View style={[styles.fields, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        <Text style={[styles.section, { color: colors.tint }]}>CSV içe aktar (resmi liste → TÜRKVET / GEKİS no)</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>
          Sütunlar: kulakKupeNo + turkvetKimlikNo ve/veya gehisElektronikKimlik (; veya , ayırıcı). Hayvanlar küpe
          numarasıyla eşleşir; önce önizleyin.
        </Text>
        <TextInput
          value={iceCsv}
          onChangeText={setIceCsv}
          multiline
          placeholder={'kulakKupeNo;turkvetKimlikNo;gehisElektronikKimlik\nTR-34-001234;TR340000001234;982000123456789'}
          placeholderTextColor={colors.textSecondary}
          style={[styles.csvInput, { color: colors.text, borderColor: colors.border }]}
        />
        {Platform.OS === 'web' ? <AnaButon title="CSV dosyası seç" variant="secondary" onPress={dosyaSec} /> : null}
        <AnaButon title="Önizle (yazmadan doğrula)" variant="secondary" onPress={() => void iceAktar(true)} />
        <AnaButon title="İçe aktar" onPress={() => void iceAktar(false)} disabled={!iceCsv.trim()} />
        {iceRapor ? (
          <View style={{ marginTop: 8 }}>
            {iceRapor.hata ? <Text style={{ color: colors.warning }}>{iceRapor.hata}</Text> : null}
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {iceRapor.kuru ? 'Önizleme: ' : ''}
              {iceRapor.guncellenen} güncelle{iceRapor.kuru ? 'necek' : 'ndi'} · {iceRapor.degisiklikYok} aynı ·{' '}
              {iceRapor.bulunamayan.length} bulunamadı · {iceRapor.hatali.length} hatalı
            </Text>
            {iceRapor.hatali.slice(0, 10).map((h) => (
              <Text key={h.satirNo} style={{ color: colors.warning, fontSize: 12, marginTop: 2 }}>
                Satır {h.satirNo} ({h.kulakKupeNo || '—'}): {h.hatalar.join(', ')}
              </Text>
            ))}
            {iceRapor.bulunamayan.length ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                Sürüde yok: {iceRapor.bulunamayan.slice(0, 15).join(', ')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {preview ? (
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontFamily: 'SpaceMono', fontSize: 11 }}>{preview}</Text>
        </View>
      ) : null}

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        GEKİS alanı hayvan formunda vardır. CSV çıktısı il/ilçe müdürlüğü ve VETBİS kullanıcısı veteriner hekim ile
        paylaşılabilir.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  fields: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  section: { fontWeight: '700', marginBottom: 10 },
  csvInput: { borderWidth: 1, borderRadius: 8, minHeight: 90, padding: 8, fontSize: 12, marginBottom: 8 },
  preview: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  note: { marginTop: 20, fontSize: 12, lineHeight: 18, marginBottom: 40 },
});
