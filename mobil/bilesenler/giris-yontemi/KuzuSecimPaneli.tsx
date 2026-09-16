import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { OkuyucuDurumu } from '@/bilesenler/rfid/OkuyucuDurumu';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useGirisYontemi } from '@/baglam/GirisYontemiBaglami';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { ocrKupeFotodan, ocrKupeNormalize, ocrSirtNormalize } from '@/kaynak/ocr';
import { rfidHayvanBul, rfidOku } from '@/kaynak/rfid';
import {
  etkinKuzuSecim,
  kupeNumarasiAyikla,
  sirtNumarasiAyikla,
} from '@/kaynak/giris-yontemi';
import { dinlemeyiBaslat, seslendirmeyiDurdur, type DinlemeKontrol } from '@/kaynak/ses';

export type KuzuSecimDeger = {
  earTag: string;
  sirtNo: string;
  gehisId?: string;
};

type Props = {
  value: KuzuSecimDeger;
  onChange: (next: KuzuSecimDeger) => void;
  /** Yeni kuzu kaydı mı (otomatik tanıma aramaz) */
  yeniKayit?: boolean;
};

function uyar(baslik: string, mesaj: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${baslik}\n\n${mesaj}`);
    return;
  }
  Alert.alert(baslik, mesaj);
}

export function KuzuSecimPaneli({ value, onChange, yeniKayit = true }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { tercih } = useGirisYontemi();
  const yontem = etkinKuzuSecim(tercih.kuzuSecim);

  const [ocrMetin, setOcrMetin] = useState('');
  const [ocrSirtMetin, setOcrSirtMetin] = useState('');
  const [aramaMetin, setAramaMetin] = useState('');
  const [dinliyor, setDinliyor] = useState(false);
  const [bulunan, setBulunan] = useState<string | null>(null);

  const inputStil = [
    styles.input,
    { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  ];

  const otomatikAra = useCallback(
    async (terim: string) => {
      const t = terim.trim();
      if (!t || yeniKayit) return;
      const list = await getAnimals({ search: t });
      const hayvan = list[0];
      if (hayvan) {
        setBulunan(hayvanAnaEtiket(hayvan));
        onChange({
          earTag: hayvan.earTag,
          sirtNo: hayvan.sirtNo ?? '',
          gehisId: hayvan.gehisId ?? undefined,
        });
        uyar('Bulundu', `${hayvanAnaEtiket(hayvan)} seçildi.`);
      } else {
        setBulunan(null);
        const kupe = kupeNumarasiAyikla(t);
        const sirt = sirtNumarasiAyikla(t);
        onChange({
          earTag: kupe ?? t.toUpperCase(),
          sirtNo: sirt ?? value.sirtNo,
          gehisId: value.gehisId,
        });
      }
    },
    [onChange, value.gehisId, value.sirtNo, yeniKayit],
  );

  const rfidOkut = async () => {
    const r = await rfidOku();
    if (!r.ok) {
      uyar('RFID', r.message);
      return;
    }
    if (!yeniKayit && r.gehisIdOneri) {
      const es = await rfidHayvanBul(r.gehisIdOneri);
      if (es.hayvan) {
        onChange({
          earTag: es.hayvan.earTag,
          sirtNo: es.hayvan.sirtNo ?? '',
          gehisId: es.hayvan.gehisId ?? undefined,
        });
        setBulunan(hayvanAnaEtiket(es.hayvan));
        uyar('RFID', `${hayvanAnaEtiket(es.hayvan)} bulundu.`);
        return;
      }
    }
    onChange({
      earTag: r.earTagOneri || value.earTag,
      sirtNo: value.sirtNo,
      gehisId: r.gehisIdOneri || value.gehisId,
    });
    uyar('RFID', r.message);
  };

  const ocrKupeUygula = async () => {
    const r = ocrMetin.trim() ? ocrKupeNormalize(ocrMetin) : await ocrKupeFotodan({});
    if (!r.ok) {
      uyar('OCR', r.message);
      return;
    }
    onChange({ ...value, earTag: r.earTag || value.earTag });
    uyar('OCR', r.message);
  };

  const ocrSirtUygula = () => {
    const r = ocrSirtNormalize(ocrSirtMetin);
    if (!r.ok) {
      uyar('OCR', r.message);
      return;
    }
    onChange({ ...value, sirtNo: r.sirtNo || value.sirtNo });
    uyar('OCR', r.message);
  };

  const sesleDinle = () => {
    if (dinliyor) return;
    seslendirmeyiDurdur();
    const ctrl: DinlemeKontrol | null = dinlemeyiBaslat({
      onBasladi: () => setDinliyor(true),
      onSonuc: (t) => {
        setDinliyor(false);
        const kupe = kupeNumarasiAyikla(t);
        const sirt = sirtNumarasiAyikla(t);
        if (kupe || sirt) {
          onChange({
            earTag: kupe ?? value.earTag,
            sirtNo: sirt ?? value.sirtNo,
            gehisId: value.gehisId,
          });
          if (!yeniKayit && kupe) void otomatikAra(kupe);
        } else {
          uyar('Ses', 'Küpe veya sırt numarası anlaşılamadı.');
        }
      },
      onHata: (mesaj) => {
        setDinliyor(false);
        uyar('Dinleme', mesaj);
      },
    });
    if (!ctrl) setDinliyor(false);
  };

  const manuelAlanlar = (
    <>
      <Text style={[styles.label, { color: colors.text }]}>Kulak küpe *</Text>
      <TextInput
        value={value.earTag}
        onChangeText={(earTag) => onChange({ ...value, earTag })}
        placeholder="TR-34-001234"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="characters"
        style={inputStil}
      />
      <Text style={[styles.label, { color: colors.text }]}>Sırt no (opsiyonel)</Text>
      <TextInput
        value={value.sirtNo}
        onChangeText={(sirtNo) => onChange({ ...value, sirtNo })}
        placeholder="87"
        placeholderTextColor={colors.textSecondary}
        style={inputStil}
      />
    </>
  );

  return (
    <View style={styles.wrap}>
      {bulunan ? (
        <Text style={{ color: colors.success, fontWeight: '700', marginBottom: 8 }}>✓ {bulunan}</Text>
      ) : null}

      {yontem === 'manuel' ? manuelAlanlar : null}

      {yontem === 'rfid' ? (
        <>
          <OkuyucuDurumu />
          <AnaButon title="RFID / GEKİS okut" variant="secondary" onPress={() => void rfidOkut()} />
          {value.earTag ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
              Küpe: {value.earTag}
              {value.gehisId ? ` · GEKİS: ${value.gehisId}` : ''}
            </Text>
          ) : null}
          {!value.earTag ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>
              Okuyucu yoksa Ayarlar → Manuel seçime geçin.
            </Text>
          ) : null}
        </>
      ) : null}

      {yontem === 'kupe-ocr' ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Küpe OCR metni</Text>
          <TextInput
            value={ocrMetin}
            onChangeText={setOcrMetin}
            placeholder="Etiketten okunan veya yapıştırılan metin"
            placeholderTextColor={colors.textSecondary}
            style={inputStil}
          />
          <AnaButon title="OCR ile küpe doldur" variant="secondary" onPress={() => void ocrKupeUygula()} />
          {value.earTag ? (
            <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>Küpe: {value.earTag}</Text>
          ) : null}
        </>
      ) : null}

      {yontem === 'sirt-no-ocr' ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Sırt no OCR metni</Text>
          <TextInput
            value={ocrSirtMetin}
            onChangeText={setOcrSirtMetin}
            placeholder="Sırt boyasından okunan numara"
            placeholderTextColor={colors.textSecondary}
            style={inputStil}
          />
          <AnaButon title="OCR ile sırt doldur" variant="secondary" onPress={ocrSirtUygula} />
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Kulak küpe *</Text>
          <TextInput
            value={value.earTag}
            onChangeText={(earTag) => onChange({ ...value, earTag })}
            placeholder="TR-34-001234"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            style={inputStil}
          />
          {value.sirtNo ? (
            <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>Sırt: {value.sirtNo}</Text>
          ) : null}
        </>
      ) : null}

      {yontem === 'sesle-numara' ? (
        <>
          <AnaButon
            title={dinliyor ? 'Dinleniyor…' : 'Küpe / sırt numarasını söyle'}
            variant="secondary"
            onPress={sesleDinle}
          />
          {value.earTag || value.sirtNo ? (
            <Text style={{ color: colors.text, marginTop: 8, lineHeight: 20 }}>
              {value.earTag ? `Küpe: ${value.earTag}` : ''}
              {value.sirtNo ? ` · Sırt: ${value.sirtNo}` : ''}
            </Text>
          ) : (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
              Örn: «küpe TR-34-001234» veya «sırt 87»
            </Text>
          )}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Elle düzelt (opsiyonel)</Text>
          <TextInput
            value={value.earTag}
            onChangeText={(earTag) => onChange({ ...value, earTag })}
            placeholder="Kulak küpe"
            placeholderTextColor={colors.textSecondary}
            style={inputStil}
          />
        </>
      ) : null}

      {yontem === 'otomatik-tanima' ? (
        <>
          <Text style={{ color: colors.textSecondary, marginBottom: 8, lineHeight: 20 }}>
            Küpe, sırt, RFID veya ses — kayıtlı kuzu varsa otomatik doldurulur.
          </Text>
          <OkuyucuDurumu />
          <AnaButon title="RFID okut" variant="secondary" onPress={() => void rfidOkut()} />
          <AnaButon
            title={dinliyor ? 'Dinleniyor…' : 'Sesle söyle'}
            variant="secondary"
            onPress={sesleDinle}
          />
          <Text style={[styles.label, { color: colors.text }]}>Ara / yaz</Text>
          <TextInput
            value={aramaMetin}
            onChangeText={setAramaMetin}
            placeholder="Küpe, sırt veya GEKİS"
            placeholderTextColor={colors.textSecondary}
            style={inputStil}
            onSubmitEditing={() => void otomatikAra(aramaMetin)}
          />
          <AnaButon title="Tanı" variant="secondary" onPress={() => void otomatikAra(aramaMetin)} />
          {manuelAlanlar}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { fontWeight: '700', marginBottom: 8, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    minHeight: 56,
    marginBottom: 12,
  },
});
