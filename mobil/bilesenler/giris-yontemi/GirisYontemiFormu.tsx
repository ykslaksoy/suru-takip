import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { YontemSecimListesi } from '@/bilesenler/giris-yontemi/YontemSecimListesi';
import {
  KUZU_SECIM_SECENEKLER,
  TARTIM_GIRIS_SECENEKLER,
  type KuzuSecimYontemi,
  type TartimGirisYontemi,
} from '@/kaynak/giris-yontemi';

type Props = {
  baslik: string;
  aciklama: string;
  baslangicKuzu: KuzuSecimYontemi;
  baslangicTartim: TartimGirisYontemi;
  kaydetMetin: string;
  onKaydet: (kuzu: KuzuSecimYontemi, tartim: TartimGirisYontemi) => Promise<void>;
};

export function GirisYontemiFormu({
  baslik,
  aciklama,
  baslangicKuzu,
  baslangicTartim,
  kaydetMetin,
  onKaydet,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scrollPadBottom } = useAltGuvenliBosluk(72);
  const [adim, setAdim] = useState<1 | 2>(1);
  const [kuzuSecim, setKuzuSecim] = useState<KuzuSecimYontemi>(baslangicKuzu);
  const [tartimGiris, setTartimGiris] = useState<TartimGirisYontemi>(baslangicTartim);
  const [busy, setBusy] = useState(false);

  const kaydet = async () => {
    setBusy(true);
    try {
      await onKaydet(kuzuSecim, tartimGiris);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.pad, { paddingBottom: scrollPadBottom }]}>
      <Text style={[styles.baslik, { color: colors.text }]}>{baslik}</Text>
      <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 16 }}>{aciklama}</Text>

      <View style={[styles.adimCubugu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: adim === 1 ? colors.tint : colors.textSecondary, fontWeight: '800' }}>
          1 · Kuzu seçim
        </Text>
        <Text style={{ color: colors.textSecondary }}>→</Text>
        <Text style={{ color: adim === 2 ? colors.tint : colors.textSecondary, fontWeight: '800' }}>
          2 · Tartım giriş
        </Text>
      </View>

      {adim === 1 ? (
        <>
          <Text style={[styles.bolum, { color: colors.text }]}>Kuzu nasıl seçeceksiniz?</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 12, lineHeight: 20 }}>
            Bu seçim tüm akışlarda geçerli olur (hızlı kuzu, tartım, seri ahır). Ayarlardan sonra
            değiştirebilirsiniz.
          </Text>
          <YontemSecimListesi
            tur="kuzu"
            secenekler={KUZU_SECIM_SECENEKLER}
            secili={kuzuSecim}
            onSec={setKuzuSecim}
          />
          <View style={{ marginTop: 20 }}>
            <AnaButon title="Devam — tartım girişi" onPress={() => setAdim(2)} />
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.bolum, { color: colors.text }]}>Tartım kilosu nasıl girilecek?</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 12, lineHeight: 20 }}>
            «Son tartım kopyala» yok — her seferinde gerçek tartım. Yakında olan yöntemler manuel
            yedekle çalışır.
          </Text>
          <YontemSecimListesi
            tur="tartim"
            secenekler={TARTIM_GIRIS_SECENEKLER}
            secili={tartimGiris}
            onSec={setTartimGiris}
          />
          <View style={{ marginTop: 20, gap: 10 }}>
            <AnaButon title={busy ? 'Kaydediliyor…' : kaydetMetin} onPress={() => void kaydet()} />
            <AnaButon title="Geri — kuzu seçim" variant="secondary" onPress={() => setAdim(1)} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  baslik: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  bolum: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  adimCubugu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
});
