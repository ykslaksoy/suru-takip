import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OndalikFiyatGirdi } from './OndalikFiyatGirdi';
import {
  efektifBirimFiyat,
  kullaniciFiyatGirisindenOverride,
  referansOverrideTemizle,
  type BesiRefOverrideDepo,
} from '@/kaynak/maliyet/besi-referans-override';
import { VARSAYILAN_ALIS_CANLI_KG_FIYAT } from '@/kaynak/maliyet/besi-plan-alis';
import type { PiyasaSatisKaynak } from '@/kaynak/maliyet/besi-plan-piyasa-kaynak';
import { cozPiyasaFiyat } from '@/kaynak/maliyet/besi-plan-piyasa-kaynak';
import { piyasaKayitOku } from '@/kaynak/maliyet/besi-piyasa-kayit';

type Colors = { text: string; textSecondary: string; border: string; tint: string; card: string };

export function BesiReferansOverridePaneli({
  satisKaynak,
  overrideDepo,
  onDepoChange,
  colors,
}: {
  satisKaynak: PiyasaSatisKaynak;
  overrideDepo: BesiRefOverrideDepo;
  onDepoChange: (d: BesiRefOverrideDepo) => void;
  colors: Colors;
}) {
  const refSatis = cozPiyasaFiyat(satisKaynak, null, null).fiyatKg;
  const satisEfektif = efektifBirimFiyat(refSatis, 'satis_canli_kg');
  const alisEfektif = efektifBirimFiyat(VARSAYILAN_ALIS_CANLI_KG_FIYAT, 'alis_canli_kg');
  const depo = piyasaKayitOku().depo;

  const reset = (alan: Parameters<typeof referansOverrideTemizle>[0]) => {
    onDepoChange(referansOverrideTemizle(alan));
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>Referans / kullanıcı fiyatları (t366u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 6 }}>
        Boş alan = güncel referans. “Referans fiyata dön” override’ı kaldırır. Fiyat 0 geçersiz.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
        Son yenileme: {depo.sonYenileme ?? '—'} ({depo.yenilemeSonuc ?? 'gömülü'}) · Otomatik: TOBB+UKON+USK yonca/saman
      </Text>

      <OndalikFiyatGirdi
        label="Alış varsayımı (planlama, piyasa değil)"
        referans={VARSAYILAN_ALIS_CANLI_KG_FIYAT}
        referansEtiket="Kullanıcı plan varsayımı"
        deger={overrideDepo.alis_canli_kg ?? null}
        colors={colors}
        onCommit={(v, h) => {
          if (h) return;
          if (v == null) onDepoChange(referansOverrideTemizle('alis_canli_kg'));
          else onDepoChange(kullaniciFiyatGirisindenOverride('alis_canli_kg', String(v)).depo);
        }}
      />
      <Pressable onPress={() => reset('alis_canli_kg')} style={styles.link}>
        <Text style={{ color: colors.tint, fontSize: 10 }}>Referans fiyata dön (alış)</Text>
      </Pressable>

      <OndalikFiyatGirdi
        label={`Satış ${satisKaynak} — canlı/kg override`}
        referans={refSatis}
        referansEtiket="Seçili satış kaynağı"
        deger={overrideDepo.satis_canli_kg ?? null}
        colors={colors}
        onCommit={(v) => {
          if (v == null) onDepoChange(referansOverrideTemizle('satis_canli_kg'));
          else onDepoChange(kullaniciFiyatGirisindenOverride('satis_canli_kg', String(v)).depo);
        }}
      />
      <Pressable onPress={() => reset('satis_canli_kg')} style={styles.link}>
        <Text style={{ color: colors.tint, fontSize: 10 }}>Referans fiyata dön (satış)</Text>
      </Pressable>

      <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 6 }}>
        Etkin: alış {alisEfektif.deger?.toLocaleString('tr-TR') ?? '—'} ({alisEfektif.kaynak}) · satış{' '}
        {satisEfektif.deger?.toLocaleString('tr-TR') ?? '—'} ({satisEfektif.kaynak})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
  link: { marginBottom: 4 },
});
