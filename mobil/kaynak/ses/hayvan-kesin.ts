import { getAnimals } from '@/kaynak/cekirdek/veritabani';
import type { Animal } from '@/kaynak/cekirdek/tipler';

/** Ses komutları için tek hayvan — çoklu eşleşmede tahmin yok */
export async function hayvanBulKesin(
  arama: string,
): Promise<{ ok: true; animal: Animal } | { ok: false; hata: string }> {
  const term = arama.trim();
  if (!term) return { ok: false, hata: 'Küpe veya sırt numarası gerekli.' };
  const list = await getAnimals({ search: term });
  if (list.length === 0) return { ok: false, hata: `${term} kayıtlı hayvan bulunamadı.` };
  const upper = term.toUpperCase();
  const digits = term.replace(/\D/g, '');
  const skor = (a: Animal): number => {
    if (a.earTag.toUpperCase() === upper) return 100;
    if (a.sirtNo?.trim() === term || a.sirtNo?.trim() === digits) return 95;
    if (a.earTag.toUpperCase().endsWith(upper) || a.earTag.toUpperCase().includes(upper)) return 50;
    return 10;
  };
  const sirali = [...list].sort((a, b) => skor(b) - skor(a));
  const enIyi = sirali[0];
  const esit = sirali.filter((a) => skor(a) === skor(enIyi) && skor(a) >= 50);
  if (esit.length > 1) {
    const ornek = esit
      .slice(0, 3)
      .map((a) => a.earTag)
      .join(', ');
    return { ok: false, hata: `Belirsiz eşleşme (${esit.length} hayvan). Örnek: ${ornek}. Küpeyi net yazın.` };
  }
  if (skor(enIyi) < 50) {
    return { ok: false, hata: `${term} için net eşleşme yok; tam küpe yazın.` };
  }
  return { ok: true, animal: enIyi };
}
