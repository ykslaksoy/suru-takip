import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

/**
 * Masaüstünde dikey önizleme çerçevesi.
 * Yatay / kısa ekranda çerçeve kapalı — içerik gerçek genişliği kullanır.
 */
export function WebOnizlemeCercevesi({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const yatay = width > height;
  const kisa = height < 520;
  const masaustuDikey =
    Platform.OS === 'web' && width >= 560 && !yatay && !kisa;

  if (!masaustuDikey) {
    return <View style={styles.tamEkran}>{children}</View>;
  }

  return (
    <View style={styles.dis}>
      <View style={[styles.telefon, { maxHeight: Math.min(920, height - 48) }]}>{children}</View>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2e1a',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  telefon: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#f4f7f0',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      web: {
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 0.45,
        shadowRadius: 40,
        elevation: 24,
      },
    }),
  },
});
