import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BESLEME_YONTEM_ETIKET,
  type BesiPlanBeslemeTaslak,
  type BesiPlanBeslemeYontemi,
} from '@/kaynak/maliyet/besi-plan-besleme';
import { cozPlanAdg, VERIM_KAVRAM, type PlanAdgCozum } from '@/kaynak/maliyet/besi-plan-adg-besleme';
import type { AdgKanitSenaryo } from '@/kaynak/maliyet/besi-adg-kanit';
import type { BesiPlanIrkTaslak } from '@/kaynak/maliyet/besi-plan-irk';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string };

const YONTEMLER: BesiPlanBeslemeYontemi[] = [
  'hazir_pellet',
  'ev_karisimi',
  'mera_kaba',
  'karma',
  'belirsiz',
];

export function BesiBeslemeAdgPaneli({
  irk,
  besleme,
  adgSenaryo,
  onBeslemeChange,
  colors,
  planKilitli,
}: {
  irk: BesiPlanIrkTaslak;
  besleme: BesiPlanBeslemeTaslak;
  adgSenaryo: AdgKanitSenaryo;
  onBeslemeChange: (b: BesiPlanBeslemeTaslak) => void;
  colors: Colors;
  planKilitli: boolean;
}) {
  const coz = cozPlanAdg(adgSenaryo, irk, besleme);
  const ornek60 =
    coz.seciliGcaa != null ? Math.round((25 + (coz.seciliGcaa / 1000) * 60) * 10) / 10 : null;
  const ornek90 =
    coz.seciliGcaa != null ? Math.round((25 + (coz.seciliGcaa / 1000) * 90) * 10) / 10 : null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>Besleme + ADG planı (t372u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 6 }}>
        {VERIM_KAVRAM.not}. Katkı veya model seçimi tek başına büyüme artırmaz.
      </Text>

      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Besleme yöntemi</Text>
      <View style={styles.row}>
        {YONTEMLER.map((y) => (
          <Pressable
            key={y}
            disabled={planKilitli}
            onPress={() => onBeslemeChange({ ...besleme, yontem: y })}
            style={[
              styles.chip,
              {
                borderColor: besleme.yontem === y ? colors.tint : colors.border,
                backgroundColor: besleme.yontem === y ? `${colors.tint}18` : 'transparent',
              },
            ]}>
            <Text style={{ color: colors.text, fontSize: 9 }}>{BESLEME_YONTEM_ETIKET[y]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Toggle
          label="Formül/alım doğrulandı"
          value={besleme.formulDogrulandi}
          onChange={(v) => onBeslemeChange({ ...besleme, formulDogrulandi: v })}
          colors={colors}
          disabled={planKilitli}
        />
        <Toggle
          label="Katkı seçili (ADG + yok)"
          value={besleme.katkiSecildi}
          onChange={(v) => onBeslemeChange({ ...besleme, katkiSecildi: v })}
          colors={colors}
          disabled={planKilitli}
        />
      </View>

      <AdgSatir coz={coz} secili={adgSenaryo} colors={colors} />
      <Text style={{ color: colors.tint, fontSize: 11, marginTop: 6 }}>
        25 kg giriş örnek çıkış: 60g ≈ {ornek60 ?? '—'} kg · 90g ≈ {ornek90 ?? '—'} kg
      </Text>
      {coz.uyari.slice(0, 4).map((u) => (
        <Text key={u} style={{ color: colors.warning, fontSize: 10 }}>
          · {u}
        </Text>
      ))}
    </View>
  );
}

function AdgSatir({ coz, secili, colors }: { coz: PlanAdgCozum; secili: AdgKanitSenaryo; colors: Colors }) {
  const cell = (etiket: string, v: number, aktif: boolean) => (
    <View
      style={[
        styles.adgCell,
        { borderColor: aktif ? colors.tint : colors.border, backgroundColor: aktif ? `${colors.tint}12` : 'transparent' },
      ]}>
      <Text style={{ color: colors.textSecondary, fontSize: 9 }}>{etiket}</Text>
      <Text style={{ color: colors.text, fontWeight: aktif ? '800' : '500' }}>{v} g/gün</Text>
    </View>
  );
  return (
  <View style={{ marginTop: 8 }}>
    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
      Grup: {coz.grup} · {coz.band.kaynakAd}
    </Text>
    <Text style={{ color: colors.textSecondary, fontSize: 9 }}>{coz.band.baglam}</Text>
    <View style={[styles.row, { marginTop: 4 }]}>
      {cell('Muhafazakar', coz.muhafazakar, secili === 'muhafazakar')}
      {cell('Beklenen', coz.beklenen, secili === 'beklenen')}
      {cell('İyimser', coz.iyimser, secili === 'iyimser')}
    </View>
    <Text style={{ color: colors.tint, fontSize: 10, marginTop: 4 }}>
      Seçili senaryo: {coz.seciliGcaa ?? '—'} g/gün {!coz.yeterliVeri ? '(veri yetersiz)' : ''}
    </Text>
  </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
  colors,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: Colors;
  disabled: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.chip, { borderColor: value ? colors.tint : colors.border, flex: 1 }]}>
      <Text style={{ color: colors.text, fontSize: 9 }}>
        {value ? '☑ ' : '☐ '}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 8, padding: 6 },
  adgCell: { borderWidth: 1, borderRadius: 8, padding: 6, minWidth: 90 },
});
