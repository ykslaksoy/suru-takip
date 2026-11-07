import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { PadokRasyonDurumu } from '@/kaynak/yem/padok-durum';

const kg = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: n < 10 ? 2 : 0 })} kg`;
const gunTR = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

export function PadokRasyonDurumKarti(p: {
  durum: PadokRasyonDurumu;
  yemAdi: (id: string) => string;
  partiler: string[];
  basSayisi: Record<string, number>;
  seciliPadok: string;
  onPadok: (padok: string) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [padokAcik, setPadokAcik] = useState(false);
  const { plan, sonYemleme } = p.durum;
  const r = plan.rasyon;

  return (
    <View style={[s.kart, { backgroundColor: colors.card, borderColor: colors.tint }]}>
      <View style={s.ust}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>Seçili padok</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>
            {p.seciliPadok} · {p.basSayisi[p.seciliPadok] ?? 0} baş
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPadokAcik((v) => !v)}
          style={[s.degistir, { borderColor: colors.border }]}>
          <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>{padokAcik ? 'Kapat' : 'Değiştir'}</Text>
        </Pressable>
      </View>

      {padokAcik ? (
        <View style={[s.chipSatir, { marginBottom: 10 }]}>
          {p.partiler.map((x) => (
            <Pressable
              key={x}
              onPress={() => {
                p.onPadok(x);
                setPadokAcik(false);
              }}
              style={[s.chip, { borderColor: x === p.seciliPadok ? colors.tint : colors.border, backgroundColor: x === p.seciliPadok ? `${colors.tint}18` : colors.background }]}>
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{x} · {p.basSayisi[x]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[s.bolum, { borderColor: colors.border }]}>
        <Text style={[s.baslik, { color: colors.text }]}>Kayıtlı plan (aktif)</Text>
        {plan.tur === 'yok' ? (
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Aktif rasyon yok</Text>
        ) : (
          <>
            <Text style={{ color: plan.tur === 'aktif' ? colors.success : colors.warning, fontWeight: '800' }}>
              {plan.tur === 'aktif' ? '● Aktif' : '⏸ Durdurulmuş'} · {r?.ad?.trim() || 'İsimsiz rasyon'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Başlangıç {r ? gunTR(r.baslangic) : '—'} · güncelleme {r?.guncelleme ? gunTR(r.guncelleme.slice(0, 10)) : '—'}
            </Text>
            {r?.kalemler.map((k) => (
              <Text key={k.stockId} style={{ color: colors.text, fontSize: 13, marginTop: 2 }}>
                {p.yemAdi(k.stockId)}: {kg(k.kgBasGun)}/baş/gün
              </Text>
            ))}
            <Text style={{ color: colors.text, fontWeight: '700', marginTop: 6 }}>
              Padok günde {kg(plan.padokGunlukKg)} ({kg(plan.kgBasGunToplam)}/baş × {plan.bas} baş)
            </Text>
          </>
        )}
      </View>

      <View style={[s.bolum, { borderColor: colors.border }]}>
        <Text style={[s.baslik, { color: colors.text }]}>Son gerçek yemleme (stok düşümü)</Text>
        {!sonYemleme ? (
          <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Henüz yemleme kaydı yok</Text>
        ) : (
          <>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {gunTR(sonYemleme.gun)} · düşülen {kg(sonYemleme.toplamDusulenKg)}
            </Text>
            {sonYemleme.anlik ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                O andaki plan: {sonYemleme.anlik.ad?.trim() || 'İsimsiz'} (
                {sonYemleme.anlik.kalemler.map((k) => `${p.yemAdi(k.stockId)} ${k.kgBasGun}`).join(', ')})
              </Text>
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                Eski kayıt — düşüm anı plan görüntüsü yok; mevcut stok düşümü kalemleri gösterilir.
              </Text>
            )}
            {sonYemleme.kalemler.slice(0, 4).map((k) => (
              <Text key={k.stockId} style={{ color: colors.textSecondary, fontSize: 12 }}>
                {k.yemAd ?? k.stockId}: {kg(k.dusulen)} düşüldü{k.eksik > 0 ? ` · ${kg(k.eksik)} eksik` : ''}
              </Text>
            ))}
          </>
        )}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8, lineHeight: 16 }}>{p.durum.oneriNotu}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kart: { borderWidth: 2, borderRadius: 14, padding: 14, marginBottom: 12 },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  degistir: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  bolum: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 8 },
  baslik: { fontWeight: '800', marginBottom: 4, fontSize: 13 },
  chipSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
