import { StyleSheet, Text, View } from 'react-native';
import type { KararSimulasyonSonuc } from '@/kaynak/maliyet/besi-plan-karar-sim';
import { BRUT_KAR_ETIKET } from '@/kaynak/maliyet/besi-plan-karar-sim';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string; card: string };

export function BesiKararSimulasyonPaneli({ sonuc, colors }: { sonuc: KararSimulasyonSonuc; colors: Colors }) {
  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>Karar simülasyonu (t359u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
        Varsayılan: <Text style={{ fontWeight: '700' }}>{sonuc.varsayilanSenaryo}</Text> · tartım girilince tahmin güncellenir, hedef senaryosu donuk kalır.
      </Text>
      {sonuc.satirlar.map((s) => (
        <View key={s.senaryo} style={{ marginTop: 8, opacity: s.senaryo === sonuc.varsayilanSenaryo ? 1 : 0.85 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {s.senaryo} · {s.gcaa} g/gün{s.senaryo === sonuc.varsayilanSenaryo ? ' ★' : ''}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            60g → {s.gun60.cikisKg} kg · {BRUT_KAR_ETIKET}{' '}
            {s.gun60.brutKar?.toLocaleString('tr-TR') ?? 'eksik'} ₺/baş
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            90g → {s.gun90.cikisKg} kg · brüt {s.gun90.brutKar?.toLocaleString('tr-TR') ?? 'eksik'} ₺/baş
          </Text>
        </View>
      ))}
      <Text style={{ color: colors.tint, fontSize: 12, marginTop: 10, fontWeight: '700' }}>
        Başa çıkış canlı ₺/kg (muh.) — 60g: {sonuc.breakevenCanliFiyatKg60 ?? '—'} · 90g: {sonuc.breakevenCanliFiyatKg90 ?? '—'}
      </Text>
      {sonuc.netTamSonuc != null ? (
        <Text style={{ color: colors.text, fontWeight: '700', marginTop: 4 }}>
          Net (brüt − işletme gideri, 60g muh.): {sonuc.netTamSonuc.toLocaleString('tr-TR')} ₺/baş
        </Text>
      ) : (
        <Text style={{ color: colors.warning, fontSize: 11, marginTop: 4 }}>{sonuc.netEksik.join(' · ')}</Text>
      )}
      {sonuc.duyarlilik.map((d) => (
        <Text key={d} style={{ color: colors.textSecondary, fontSize: 10 }}>
          · {d}
        </Text>
      ))}
      {sonuc.uyari.slice(0, 3).map((u) => (
        <Text key={u} style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
          · {u}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
});
