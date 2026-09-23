import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

/** SuperAraç tarzı masaüstü telefon kolonu: geniş ekranda ~390px, çerçeve her zaman görünür. */
const TELEFON_GENISLIK = 390;

export function WebOnizlemeCercevesi({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  // Yatay masaüstünde de açık kalsın (SuperAraç gibi); sadece gerçek dar telefon/tablet tam ekran.
  const masaustuGenis = Platform.OS === 'web' && width >= 520;

  if (!masaustuGenis) {
    return <View style={styles.tamEkran}>{children}</View>;
  }

  const telefonYukseklik = Math.min(844, Math.max(560, height - 32));

  return (
    <View style={styles.dis}>
      <View style={[styles.telefon, { height: telefonYukseklik, maxHeight: height - 24 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tamEkran: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  dis: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8ecee',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  telefon: {
    width: TELEFON_GENISLIK,
    maxWidth: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#f4f7f0',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(17, 24, 39, 0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
});
