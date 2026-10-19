/** Ekranın altında ince çip: çevrimdışı / tekrar çevrimiçi / yeni sürüm */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { baglantiDinle, baglantiDurumu, baglantiMetni } from '@/kaynak/cevrimdisi/durum';
import { cevrimdisiKur, guncellemeyiUygula } from '@/kaynak/cevrimdisi/kur';

export function BaglantiSeridi() {
  const d = useSyncExternalStore(baglantiDinle, baglantiDurumu, baglantiDurumu);
  const [simdi, setSimdi] = useState(Date.now());
  useEffect(() => {
    cevrimdisiKur();
  }, []);
  useEffect(() => {
    if (!d.geriGeldi) return;
    setSimdi(Date.now());
    const t = setTimeout(() => setSimdi(Date.now()), 4200);
    return () => clearTimeout(t);
  }, [d.geriGeldi]);
  const m = baglantiMetni(d, simdi);
  if (!m) return null;
  const renk = m.tur === 'cevrimdisi' ? '#5c4813' : m.tur === 'geri' ? '#1b4332' : '#1d3557';
  const zemin = m.tur === 'cevrimdisi' ? '#ffe8a3' : m.tur === 'geri' ? '#d8f3dc' : '#dbe9ff';
  return (
    <View pointerEvents="box-none" style={styles.kap}>
      <Pressable
        disabled={m.tur !== 'guncelleme'}
        onPress={guncellemeyiUygula}
        accessibilityRole={m.tur === 'guncelleme' ? 'button' : undefined}
        style={[styles.cip, { backgroundColor: zemin }]}>
        <Text style={[styles.yazi, { color: renk }]}>{m.metin}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kap: { position: 'absolute', left: 0, right: 0, bottom: 74, alignItems: 'center', zIndex: 1000 },
  cip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  yazi: { fontSize: 12.5, fontWeight: '800' },
});

/** Daha sekmesi: çevrimdışı kullanıma hazır mı (yalnız web) */
export function CevrimdisiHazirSatiri() {
  const d = useSyncExternalStore(baglantiDinle, baglantiDurumu, baglantiDurumu);
  if (Platform.OS !== 'web') return null;
  return (
    <Text style={{ fontSize: 12, color: d.hazir ? '#2d6a4f' : '#8a6d1f', marginHorizontal: 16, marginBottom: 8, fontWeight: '700' }}>
      {!d.cevrimici ? '📴 Şu an çevrimdışısın · uygulama önbellekten çalışıyor' : d.hazir ? '📴 İnternetsiz kullanıma hazır · tüm veriler bu cihazda' : '⏳ İnternetsiz kullanım için dosyalar indiriliyor…'}
    </Text>
  );
}
