/** Native: dosyayı önbelleğe yazıp paylaş menüsünü açar */
import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';

export async function dosyaIndir(ad: string, veri: Uint8Array | string, _mime: string): Promise<void> {
  const f = new File(Paths.cache, ad);
  if (f.exists) f.delete();
  f.create();
  f.write(veri);
  await Share.share({ url: f.uri, title: ad });
}

/** Native'de dosya seçici yok; yapıştırma alanı kullanılır */
export async function dosyaSec(): Promise<{ ad: string; veri: Uint8Array } | null> {
  return null;
}

export const DOSYA_SECICI_VAR = false;
