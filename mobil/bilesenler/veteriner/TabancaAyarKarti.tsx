import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  TABANCA_KAPASITELERI,
  ayriAyarMetni,
  igneUcuAdedi,
  igneUcuKurali,
  mlMetni,
  type TabancaAyari,
  type TabancaUygunDegil,
} from '@/kaynak/akilli-veteriner/asi-tabancasi';
import type { TabancaDurum } from '@/kaynak/akilli-veteriner/tabanca-ayar';

type Props = {
  durum: TabancaDurum;
  ayar: TabancaAyari | TabancaUygunDegil | null;
  onKullan: (kullan: boolean) => void;
  onKapasite: (ml: number) => void;
  /** Ayar yokken (ör. plan ekranı) gösterilecek not */
  bilgi?: string;
};

/** Toplu aşı ekranı — tek satır tabanca ayarı + gerekirse "ayrı ayarla" listesi */
export default function TabancaAyarKarti({ durum, ayar, onKullan, onKapasite, bilgi }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const aktif = durum.aktif;

  return (
    <View
      style={[
        styles.kart,
        { borderColor: aktif ? colors.tint : colors.border, backgroundColor: aktif ? colors.tint + '10' : colors.card },
      ]}>
      <View style={styles.ust}>
        <Pressable
          onPress={() => onKullan(!aktif)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: aktif }}
          style={styles.toggle}>
          <View style={[styles.kutu, { borderColor: colors.tint, backgroundColor: aktif ? colors.tint : 'transparent' }]}>
            {aktif ? <Text style={styles.tik}>✓</Text> : null}
          </View>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Tabancayla yapıyorum</Text>
        </Pressable>
        {aktif ? (
          <View style={styles.cipler}>
            {TABANCA_KAPASITELERI.map((k) => {
              const secili = durum.kapasite === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => onKapasite(k)}
                  style={[styles.cip, { borderColor: colors.tint, backgroundColor: secili ? colors.tint : 'transparent' }]}>
                  <Text style={{ color: secili ? '#fff' : colors.tint, fontWeight: '700', fontSize: 12 }}>{k} ml</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {!aktif ? (
        <Text style={[styles.not, { color: colors.textSecondary }]}>
          Otomatik aşı tabancan varsa işaretle; ayar ve iğne ucu hesaplanır.
        </Text>
      ) : !ayar ? (
        bilgi ? <Text style={[styles.not, { color: colors.textSecondary }]}>{bilgi}</Text> : null
      ) : !ayar.uygun ? (
        <Text style={[styles.not, { color: colors.textSecondary }]}>{ayar.satir}</Text>
      ) : (
        <>
          <Text style={[styles.ayar, { color: colors.text }]}>{ayar.satir}</Text>
          <Text style={[styles.not, { color: colors.textSecondary }]}>
            {ayar.kiloyaGore
              ? `Kiloya göre · ort. ${String(Math.round((ayar.ortKg ?? 0) * 10) / 10).replace(".", ",")} kg → ${mlMetni(ayar.dozMl)} ml · adım ${mlMetni(ayar.adim)} ml`
              : `Sabit doz ${mlMetni(ayar.dozMl)} ml · tabanca en çok ${ayar.kapasite} ml, adım ${mlMetni(ayar.adim)} ml`}
          </Text>
          {ayriAyarMetni(ayar) ? (
            <Text style={[styles.uyari, { color: colors.warning }]}>{ayriAyarMetni(ayar)}</Text>
          ) : null}
          {ayar.kiloYok.length > 0 ? (
            <Text style={[styles.not, { color: colors.warning }]}>
              {ayar.kiloYok.length} kuzunun kilosu yok, ~20 kg sayıldı:{' '}
              {ayar.kiloYok.slice(0, 5).map((k) => k.etiket).join(', ')}
              {ayar.kiloYok.length > 5 ? '…' : ''}
            </Text>
          ) : null}
          <Text style={[styles.not, { color: colors.textSecondary }]}>
            İğne ucu: ~{igneUcuAdedi(ayar.kuzuSayisi)} adet · {igneUcuKurali()}. Kaydedince stoktan düşülür.
            {!durum.stoktaVar ? ' Stokta tabanca kaydı yok; Stok › Ekipman’dan ekleyebilirsin.' : ''}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kutu: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tik: { color: '#fff', fontWeight: '900', fontSize: 13 },
  cipler: { flexDirection: 'row', gap: 6 },
  cip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ayar: { fontSize: 15, fontWeight: '800', marginTop: 10, lineHeight: 21 },
  uyari: { fontSize: 13, fontWeight: '700', marginTop: 6, lineHeight: 19 },
  not: { fontSize: 12, marginTop: 6, lineHeight: 17 },
});
