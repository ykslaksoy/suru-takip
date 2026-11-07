import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  BASKUL_ADAPTOR_TANIMLI,
  baskulBaglan,
  baskulBaglantiyiKes,
  baskulBagliMi,
  baskulDurum,
  baskulDurumDinle,
  baskulDurumEtiket,
  baskulOlcumBeklemeyeAl,
  baskulOrtamDestekliyorMu,
  baskulSonHata,
  type BaskulDurum,
} from '@/kaynak/baskul';
import {
  baskulAdaptorDurumuMetni,
  baskulDestekSecenekleri,
  baskulOrtamAlgila,
} from '@/kaynak/baskul/rehber';

type Props = {
  devreDisi?: boolean;
  onBaglantiDegisti?: () => void;
  /** Oturum özeti / yöntem seçiminde kısa görünüm */
  kompakt?: boolean;
};

export function BaskulTartimPaneli({ devreDisi, onBaglantiDegisti, kompakt = false }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [durum, setDurum] = useState<BaskulDurum>(baskulDurum());
  const [mesaj, setMesaj] = useState(baskulSonHata());

  const ortam = useMemo(() => baskulOrtamAlgila(), []);
  const secenekler = useMemo(() => baskulDestekSecenekleri(ortam), [ortam]);
  const adaptorMetin = useMemo(() => baskulAdaptorDurumuMetni(BASKUL_ADAPTOR_TANIMLI), []);

  useEffect(
    () =>
      baskulDurumDinle((d) => {
        setDurum(d);
        setMesaj(baskulSonHata());
        onBaglantiDegisti?.();
      }),
    [onBaglantiDegisti],
  );

  useEffect(() => {
    if (baskulBagliMi() && !devreDisi) baskulOlcumBeklemeyeAl();
  }, [durum, devreDisi]);

  const baglan = async () => {
    const r = await baskulBaglan();
    setMesaj(r.mesaj || baskulSonHata());
    onBaglantiDegisti?.();
  };

  const bagli = baskulBagliMi();
  const renk = bagli
    ? colors.success
    : durum === 'hata' || durum === 'kesildi' || durum === 'yapilandirilmamis'
      ? colors.warning
      : colors.tint;

  return (
    <View style={[styles.kutu, { borderColor: renk, backgroundColor: colors.card, opacity: devreDisi ? 0.55 : 1 }]}>
      <Text style={{ color: colors.text, fontWeight: '900', fontSize: kompakt ? 15 : 17 }}>Otomatik tartı</Text>

      {!bagli ? (
        <>
          <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8, lineHeight: 21 }}>
            Bağlantı kurulmadan tartım kaydedilemez. Önce tartıyı bağlayın veya oturum yöntemini «Elle» / «Ses» yapın.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 10, fontWeight: '800' }}>Desteklenen bağlantı türleri (ortamınıza göre)</Text>
          {secenekler.map((s) => (
            <Text key={s} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
              • {s}
            </Text>
          ))}
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 18 }}>{adaptorMetin}</Text>
          {!baskulOrtamDestekliyorMu() ? (
            <Text style={{ color: colors.warning, fontSize: 12, marginTop: 6, lineHeight: 18, fontWeight: '700' }}>
              Bu tarayıcıda bağlantı API’si yok — otomatik tartı kullanılamaz; elle veya ses seçin.
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={{ color: renk, fontWeight: '700', marginTop: 8 }}>{baskulDurumEtiket(durum)}</Text>
      )}

      {!bagli && mesaj ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 }}>{mesaj}</Text>
      ) : null}
      {bagli && mesaj ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 18 }}>{mesaj}</Text>
      ) : null}

      <View style={{ marginTop: 12 }}>
        {bagli ? (
          <AnaButon
            title="Bağlantıyı kes"
            variant="secondary"
            disabled={devreDisi}
            onPress={() => {
              baskulBaglantiyiKes();
              onBaglantiDegisti?.();
            }}
          />
        ) : (
          <AnaButon
            title={durum === 'baglaniyor' ? 'Bağlanıyor…' : 'Tartıyı bağla'}
            disabled={devreDisi || durum === 'baglaniyor'}
            onPress={() => void baglan()}
          />
        )}
      </View>

      {!bagli && !kompakt ? (
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 10, lineHeight: 16 }}>
          Sonraki adım: cihazı açın → «Tartıyı bağla». Protokol tanımlı değilse sistem bunu bildirir; bekleyen sahte kilo oluşturulmaz.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
});
