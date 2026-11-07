import { Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { TartimGirisPaneli } from '@/bilesenler/giris-yontemi/TartimGirisPaneli';
import { BaskulTartimPaneli } from '@/bilesenler/kilo/BaskulTartimPaneli';
import { BaskulEkranOcrPaneli } from '@/bilesenler/kilo/BaskulEkranOcrPaneli';
import type { TartimGirisYontemi } from '@/kaynak/giris-yontemi';
import { baskulBagliMi } from '@/kaynak/baskul';
import { hizliKiloYontemDurumu, type HizliKiloYontemId } from '@/kaynak/tartim/hizli-kilo-yontem';

type Props = {
  yontem: TartimGirisYontemi;
  kilo: string;
  onKiloChange: (v: string) => void;
  onOlcumIptal: () => void;
  devreDisi: boolean;
  onayli: boolean;
  onBaglantiDegisti: () => void;
};

export function HizliTartimKiloGiris({ yontem, kilo, onKiloChange, onOlcumIptal, devreDisi, onayli, onBaglantiDegisti }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const id = (['manuel', 'sesle-kilo', 'baskul-ocr', 'baskul'].includes(yontem) ? yontem : 'manuel') as HizliKiloYontemId;
  const { durum, not } = hizliKiloYontemDurumu(id);
  const baskulBagli = baskulBagliMi();

  return (
    <View>
      {durum !== 'hazir' ? (
        <Text style={{ color: durum === 'yok' ? colors.warning : colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18, fontWeight: durum === 'yok' ? '700' : '400' }}>
          {not}
        </Text>
      ) : null}

      {id === 'baskul' ? (
        <>
          <BaskulTartimPaneli devreDisi={devreDisi} onBaglantiDegisti={onBaglantiDegisti} />
          {!baskulBagli && onayli ? (
            <Text style={{ color: colors.warning, fontWeight: '700', marginBottom: 8, lineHeight: 18 }}>
              Bağlantı yok — kayıt kapalı. «Tartıyı bağla» veya oturumda başka yöntem seçin.
            </Text>
          ) : null}
          {baskulBagli ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, lineHeight: 18 }}>
              Adaptörden gelen ölçüm onaylanır; elle yazmak bekleyen ölçümü siler.
            </Text>
          ) : null}
        </>
      ) : null}

      {id === 'baskul-ocr' ? (
        <BaskulEkranOcrPaneli
          devreDisi={devreDisi}
          onOnay={(kg) => {
            onOlcumIptal();
            onKiloChange(kg);
          }}
        />
      ) : null}

      {id === 'manuel' || id === 'sesle-kilo' ? (
        <TartimGirisPaneli
          value={kilo}
          onChange={(v) => {
            onOlcumIptal();
            onKiloChange(v);
          }}
          placeholder="kg"
          yontemOverride={id}
          devreDisi={devreDisi}
        />
      ) : null}

      {id === 'baskul' && baskulBagli ? (
        <TartimGirisPaneli
          value={kilo}
          onChange={(v) => {
            onOlcumIptal();
            onKiloChange(v);
          }}
          placeholder="kg (adaptör veya elle)"
          yontemOverride="manuel"
          devreDisi={devreDisi}
        />
      ) : null}
    </View>
  );
}
