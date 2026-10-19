/** Kuzu fotoğraf galerisi — ekle, listele, sil (geri dönüşüm kutusu), 30 gün sonra görüntüyü temizle */
import { v4 as uuidv4 } from 'uuid';
import { copeAt, islemKaydet } from '@/kaynak/gecmis/gunluk';
import { denetimYaz } from '@/kaynak/cekirdek/denetim';
import { kapasiteHatasi, gorunenler, suresiDolanlar, type FotoEtiket, type FotoKaydi } from './hesap';
import { metaOku, metaYaz } from './meta';
import { gorselHazirla, gorselSil } from './gorsel';

export { gorselSec, gorselUrl } from './gorsel';

export async function getFotolar(animalId: string): Promise<FotoKaydi[]> {
  const l = await metaOku();
  const dolan = suresiDolanlar(l);
  if (dolan.length) {
    for (const f of dolan) await gorselSil(f).catch(() => undefined);
    await metaYaz(l.filter((f) => !dolan.some((d) => d.id === f.id)));
  }
  return gorunenler(l, animalId);
}

export async function fotoSayilari(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const f of gorunenler(await metaOku())) out[f.animalId] = (out[f.animalId] ?? 0) + 1;
  return out;
}

export async function fotoEkle(animalId: string, kaynak: Parameters<typeof gorselHazirla>[0], etiket: FotoEtiket = 'genel', not?: string): Promise<FotoKaydi> {
  const l = await metaOku();
  const h = kapasiteHatasi(l, animalId);
  if (h) throw new Error(h);
  const g = await gorselHazirla(kaynak);
  const id = uuidv4();
  const uri = await g.kaydet(id);
  const f: FotoKaydi = { id, animalId, tarih: new Date().toISOString(), etiket, not: not?.trim() || undefined, en: g.en, boy: g.boy, bayt: g.bayt, uri };
  await metaYaz([f, ...(await metaOku())]);
  denetimYaz({ eylem: 'ekleme', tablo: 'foto', kayitId: id, animalId, ozet: `Fotoğraf eklendi` });
  return f;
}

export async function fotoGuncelle(id: string, d: { etiket?: FotoEtiket; not?: string }): Promise<void> {
  const l = await metaOku();
  await metaYaz(l.map((f) => (f.id === id ? { ...f, ...d, not: d.not !== undefined ? d.not.trim() || undefined : f.not } : f)));
}

/** Kutuya taşı (görüntü 30 gün saklanır) */
export async function fotoSil(f: FotoKaydi, etiket: string): Promise<void> {
  await copeAt({ id: `foto-${f.id}`, tur: 'foto', etiket: `Fotoğraf · ${etiket}`, veri: f, animalId: f.animalId });
  const l = await metaOku();
  await metaYaz(l.map((x) => (x.id === f.id ? { ...x, silindi: new Date().toISOString() } : x)));
  await islemKaydet({ tur: 'silme', ozet: `Fotoğraf silindi · ${etiket}`, animalId: f.animalId }).catch(() => undefined);
}
