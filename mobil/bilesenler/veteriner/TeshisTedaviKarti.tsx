import { StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { HastalikTeshis } from '@/kaynak/akilli-veteriner/teshis';
import type { VetKanal } from '@/kaynak/veteriner-koprusu/vet-iletisim';

type Props = {
  teshis: HastalikTeshis;
  vetKanal: VetKanal;
  vetAd?: string;
  onVetDanis: () => void;
  onTedaviUygula: () => void;
  onKarantina: () => void;
  onSuruPadok: () => void;
  onSuruTum: () => void;
};

export function TeshisTedaviKarti({
  teshis,
  vetKanal,
  vetAd,
  onVetDanis,
  onTedaviUygula,
  onKarantina,
  onSuruPadok,
  onSuruTum,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const dereceRenk = teshis.derece === 'ileri' ? colors.danger : colors.warning;

  return (
    <View style={[styles.wrap, { borderColor: colors.tint, backgroundColor: colors.card }]}>
      <Text style={[styles.baslik, { color: colors.tint }]}>Teşhis</Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{teshis.hastalikAdi}</Text>
      <View style={styles.etiketRow}>
        <Text style={[styles.etiket, { backgroundColor: dereceRenk + '33', color: dereceRenk }]}>
          {teshis.dereceEtiket}
        </Text>
        {teshis.bulasici ? (
          <Text style={[styles.etiket, { backgroundColor: colors.danger + '33', color: colors.danger }]}>
            Bulaşıcı
          </Text>
        ) : null}
      </View>
      <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 20 }}>{teshis.aciklama}</Text>

      <Text style={[styles.section, { color: colors.tint }]}>Önerilen iğneler / tedavi</Text>
      {teshis.ilaclar.map((il) => (
        <View key={il.id} style={[styles.ilac, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {il.tip === 'igne' ? '💉' : il.tip === 'asi' ? '🛡️' : '💊'} {il.ilacAdi}
          </Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>
            Doz: {il.doz} · {il.uygulama} · {il.siklik}
          </Text>
          {il.not ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{il.not}</Text> : null}
        </View>
      ))}

      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
        Etki süresi: {teshis.etkiSuresiGun} gün — sonrasında kontrol fotoğrafı istenecek
      </Text>

      {teshis.vetDanisma !== 'gerekmez' && vetKanal !== 'yapilandir' ? (
        <View style={[styles.vetKutu, { backgroundColor: colors.warning + '22' }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {teshis.vetDanisma === 'zorunlu' ? 'Veteriner danışması gerekli' : 'Veterinere danışmanız önerilir'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {vetAd || 'Veterineriniz'} ({vetKanal === 'program' ? 'program' : 'WhatsApp'})
          </Text>
          <AnaButon title="Veterinere danış" variant="secondary" onPress={onVetDanis} />
        </View>
      ) : teshis.vetDanisma === 'zorunlu' && vetKanal === 'yapilandir' ? (
        <Text style={{ color: colors.danger, marginTop: 10, fontWeight: '700' }}>
          Vet tanımlı değil — ileri derece / bulaşıcı vaka için vet ayarı gerekli
        </Text>
      ) : null}

      <AnaButon title="İğneleri uygula — takibe al" onPress={onTedaviUygula} />

      {teshis.karantinaGerekli ? (
        <AnaButon title="Karantina padokuna al" variant="secondary" onPress={onKarantina} />
      ) : null}

      {teshis.suruMudahale === 'ayni_padok' && teshis.suruIlaclari.length > 0 ? (
        <>
          <Text style={[styles.section, { color: colors.tint }]}>Sürü tedavisi (aynı padok)</Text>
          {teshis.suruIlaclari.map((il) => (
            <Text key={il.id} style={{ color: colors.text, fontSize: 13 }}>
              • {il.ilacAdi} — {il.doz} {il.uygulama}
            </Text>
          ))}
          <AnaButon title="Aynı padok hayvanlarına uygula" variant="secondary" onPress={onSuruPadok} />
        </>
      ) : null}

      {teshis.suruMudahale === 'tum_kuzular' && teshis.suruIlaclari.length > 0 ? (
        <>
          <Text style={[styles.section, { color: colors.tint }]}>Sürü tedavisi (tüm kuzular)</Text>
          {teshis.suruIlaclari.map((il) => (
            <Text key={il.id} style={{ color: colors.text, fontSize: 13 }}>
              • {il.ilacAdi} — {il.doz} {il.uygulama}
            </Text>
          ))}
          <AnaButon title="Tüm kuzulara uygula" variant="secondary" onPress={onSuruTum} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 2 },
  baslik: { fontWeight: '800', fontSize: 14, marginBottom: 4 },
  etiketRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  etiket: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontWeight: '700', fontSize: 12 },
  section: { fontWeight: '800', marginTop: 14, marginBottom: 8 },
  ilac: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  vetKutu: { marginTop: 12, padding: 12, borderRadius: 10 },
});
