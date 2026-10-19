/** Native: expo-image-picker + uygulama belgeler klasörü */
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

export type HazirGorsel = { en: number; boy: number; bayt: number; kaydet: (id: string) => Promise<string | undefined> };

type Secilen = { uri: string; width: number; height: number; fileSize?: number };

export async function gorselHazirla(kaynak: Secilen | string): Promise<HazirGorsel> {
  const s: Secilen = typeof kaynak === 'string' ? { uri: kaynak, width: 0, height: 0 } : kaynak;
  return {
    en: s.width,
    boy: s.height,
    bayt: s.fileSize ?? 0,
    kaydet: async (id) => {
      const dir = new Directory(Paths.document, 'foto');
      if (!dir.exists) dir.create();
      const hedef = new File(dir, `${id}.jpg`);
      new File(s.uri).copy(hedef);
      return hedef.uri;
    },
  };
}

export async function gorselUrl(f: { uri?: string }, _boyut: 'tam' | 'kucuk'): Promise<string | null> {
  return f.uri ?? null;
}

export async function gorselSil(f: { uri?: string }): Promise<void> {
  if (!f.uri) return;
  const d = new File(f.uri);
  if (d.exists) d.delete();
}

export async function gorselSec(kaynak: 'kamera' | 'dosya'): Promise<Secilen[]> {
  const izin = kaynak === 'kamera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (izin.status !== 'granted') throw new Error(kaynak === 'kamera' ? 'Kamera izni gerekli' : 'Fotoğraf izni gerekli');
  const sec = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.6, allowsMultipleSelection: kaynak === 'dosya' };
  const r = kaynak === 'kamera' ? await ImagePicker.launchCameraAsync(sec) : await ImagePicker.launchImageLibraryAsync(sec);
  if (r.canceled) return [];
  return r.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize }));
}

/** Bulut foto senkronu şimdilik yalnız web'de (native dosya URI'leri) */
export async function gorselHamOku(_id: string): Promise<Blob | null> {
  return null;
}
export async function gorselHamYaz(_id: string, _blob: Blob): Promise<void> {
  /* native: sonraki sürüm */
}
