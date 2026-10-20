import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { gorselUrl } from '@/kaynak/galeri/depo';
import type { FotoKaydi } from '@/kaynak/galeri/hesap';

/** Fotoğraf görüntüsü (web: IndexedDB'den nesne URL'i, native: dosya) */
export function FotoKare({ f, boyut, stil }: { f: FotoKaydi; boyut: 'tam' | 'kucuk'; stil: object }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let iptal = false;
    void gorselUrl(f, boyut).then((u) => !iptal && setUrl(u));
    return () => {
      iptal = true;
    };
  }, [f, boyut]);
  if (!url) return <View style={[stil, { backgroundColor: '#0001', alignItems: 'center', justifyContent: 'center' }]}><Text>📷</Text></View>;
  return <Image source={{ uri: url }} style={stil} resizeMode={boyut === 'tam' ? 'contain' : 'cover'} />;
}

