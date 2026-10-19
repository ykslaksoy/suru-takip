import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import type { KuzuGrade, KuzuRozetGorsel } from '@/kaynak/kilo/kuzu-derece';

/** Karacabey Merinosu rozet görselleri — aynı kuzu, sağa bakar; gövde dereceyle dolar. */
export const ROZET_GORSELLERI: Record<KuzuRozetGorsel, ImageSourcePropType> = {
  olculmedi: require('../../varliklar/images/rozet/olculmedi.jpg'),
  zayif: require('../../varliklar/images/rozet/zayif.jpg'),
  normal: require('../../varliklar/images/rozet/normal.jpg'),
  iyi: require('../../varliklar/images/rozet/iyi.jpg'),
  'cok-iyi': require('../../varliklar/images/rozet/cok-iyi.jpg'),
  'super-kuzu': require('../../varliklar/images/rozet/super-kuzu.jpg'),
};

export function RozetGorseli({ grade, boyut = 64 }: { grade: KuzuGrade; boyut?: number }) {
  return (
    <Image
      source={ROZET_GORSELLERI[grade.gorsel]}
      accessibilityLabel={`${grade.label} rozet görseli`}
      style={[
        styles.img,
        { width: boyut, height: boyut, borderRadius: boyut * 0.22, borderColor: grade.color },
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  img: { borderWidth: 2, backgroundColor: '#f7f6f4' },
});
