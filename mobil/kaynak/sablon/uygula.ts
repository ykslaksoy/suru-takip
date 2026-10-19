import type { Animal } from '@/kaynak/cekirdek/tipler';
import { topluUygula } from '@/kaynak/toplu/uygula';
import { islemKaydet } from '@/kaynak/gecmis/gunluk';
import { adimEtiket, type KayitSablonu } from './hesap';

export type SablonSonuc = { satirlar: string[]; tartimVar: boolean; kayit: number };

/** Şablonun aşı / ilaç / vitamin adımlarını sırayla uygular; tartım adımı kilo girişi için işaretlenir */
export async function sablonUygula(s: KayitSablonu, hayvanlar: Animal[]): Promise<SablonSonuc> {
  const satirlar: string[] = [];
  let tartimVar = false;
  let kayit = 0;
  for (const a of s.adimlar) {
    if (a.tur === 'tartim') {
      tartimVar = true;
      satirlar.push(`${adimEtiket(a)}: kilo girişi bekliyor`);
      continue;
    }
    const r = await topluUygula({
      hayvanlar,
      programId: a.programId,
      programTur: a.tur === 'asi' ? 'asi' : 'vitamin',
      kaynak: `Şablon: ${s.ad}`,
    });
    kayit += r.kayit;
    satirlar.push(`${adimEtiket(a)}: ${r.mesaj}`);
  }
  await islemKaydet({ tur: 'diger', ozet: `Şablon uygulandı · ${s.ad} · ${hayvanlar.length} kuzu`, adet: hayvanlar.length });
  return { satirlar, tartimVar, kayit };
}
