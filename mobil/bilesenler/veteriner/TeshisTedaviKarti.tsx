import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { KiloOnayPaneli } from '@/bilesenler/veteriner/KiloOnayPaneli';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { DozSatir } from '@/bilesenler/veteriner/DozSatir';
import { ilaclariKgIleHesapla } from '@/kaynak/akilli-veteriner/doz-hesap';
import type { HastalikTeshis } from '@/kaynak/akilli-veteriner/teshis';
import type { VetKanal } from '@/kaynak/veteriner-koprusu/vet-iletisim';

type Props = {
  teshis: HastalikTeshis;
  vetKanal: VetKanal;
  vetAd?: string;
  earTag?: string;
  kayitliKg: number | null;
  onayliKg: number | null;
  onKgOnay: (kg: number) => void;
  onKgSifirla: () => void;
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
  earTag,
  kayitliKg,
  onayliKg,
  onKgOnay,
  onKgSifirla,
  onVetDanis,
  onTedaviUygula,
  onKarantina,
  onSuruPadok,
  onSuruTum,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const dereceRenk = teshis.derece === 'ileri' ? colors.danger : colors.warning;

  const ilaclar = useMemo(() => {
    if (onayliKg == null || onayliKg <= 0) return teshis.ilaclar;
    return ilaclariKgIleHesapla(teshis.ilaclar, onayliKg);
  }, [teshis.ilaclar, onayliKg]);

  const suruIlaclari = useMemo(() => {
    if (onayliKg == null || onayliKg <= 0) return teshis.suruIlaclari;
    return ilaclariKgIleHesapla(teshis.suruIlaclari, onayliKg);
  }, [teshis.suruIlaclari, onayliKg]);

  const dozHazir = onayliKg != null && onayliKg > 0;

  return (
    <View style={[styles.wrap, { borderColor: colors.tint, backgroundColor: colors.card }]}>
      <Text style={[styles.baslik, { color: colors.tint }]}>Teşhis</Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{teshis.hastalikAdiTr}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>({teshis.tibbiAd})</Text>
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

      <KiloOnayPaneli
        earTag={earTag}
        kayitliKg={kayitliKg}
        onayliKg={onayliKg}
        onOnay={onKgOnay}
        onSifirla={onKgSifirla}
      />

      {dozHazir ? (
        <>
          <Text style={[styles.section, { color: colors.tint }]}>Önerilen iğneler / tedavi</Text>
          {ilaclar.map((il) => (
            <View key={il.id} style={[styles.ilac, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {il.tip === 'igne' ? '💉' : il.tip === 'asi' ? '🛡️' : '💊'} {il.ilacAdi}
              </Text>
              <DozSatir doz={il.doz} formul={il.dozFormul} buyuk />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {il.uygulama} · {il.siklik}
              </Text>
              {il.not ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{il.not}</Text> : null}
            </View>
          ))}
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontStyle: 'italic' }}>
          Doz (ml) için önce kiloyu onaylayın.
        </Text>
      )}

      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
        Etki süresi: {teshis.etkiSuresiGun} gün — sonrasında kontrol fotoğrafı istenecek
      </Text>

      {dozHazir && teshis.vetDanisma !== 'gerekmez' && vetKanal !== 'yapilandir' ? (
        <View style={[styles.vetKutu, { backgroundColor: colors.warning + '22' }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {teshis.vetDanisma === 'zorunlu' ? 'Veteriner danışması gerekli' : 'Veterinere danışmanız önerilir'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {vetAd || 'Veterineriniz'} ({vetKanal === 'program' ? 'program' : 'WhatsApp'})
          </Text>
          <AnaButon title="Veterinere danış" variant="secondary" onPress={onVetDanis} />
        </View>
      ) : null}

      {dozHazir ? (
        <>
          <AnaButon title="İğneleri uygula — takibe al" onPress={onTedaviUygula} />
          {teshis.karantinaGerekli ? (
            <AnaButon title="Karantina padokuna al" variant="secondary" onPress={onKarantina} />
          ) : null}
          {teshis.suruMudahale === 'ayni_padok' && suruIlaclari.length > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.tint }]}>Sürü tedavisi (aynı padok)</Text>
              {suruIlaclari.map((il) => (
                <View key={il.id} style={{ marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>• {il.ilacAdi}</Text>
                  <DozSatir doz={il.doz} formul={il.dozFormul} />
                </View>
              ))}
              <AnaButon title="Aynı padok hayvanlarına uygula" variant="secondary" onPress={onSuruPadok} />
            </>
          ) : null}
          {teshis.suruMudahale === 'tum_kuzular' && suruIlaclari.length > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.tint }]}>Sürü tedavisi (tüm kuzular)</Text>
              {suruIlaclari.map((il) => (
                <View key={il.id} style={{ marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>• {il.ilacAdi}</Text>
                  <DozSatir doz={il.doz} formul={il.dozFormul} />
                </View>
              ))}
              <AnaButon title="Tüm kuzulara uygula" variant="secondary" onPress={onSuruTum} />
            </>
          ) : null}
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
