import { addPlanlananGorev } from '@/kaynak/gorevler/planlanan';
import {
  type ProfesyonellikAsama,
  etiketMetin,
} from './asamalar';
import { asamaOnaylandiKaydet } from './depolama';
import { profesyonellikHatirlatmalariKur } from './hatirlatma';

function gunEkle(ofset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + ofset);
  return d.toISOString().slice(0, 10);
}

/**
 * Onaylanan aşamanın eylemlerini planlanan görevlere yazar + hatırlatma dener.
 */
export async function asamaOnaylaVeGorevAc(asama: ProfesyonellikAsama): Promise<{
  gorevIdleri: string[];
  hatirlatma: boolean;
}> {
  const gorevIdleri: string[] = [];

  for (const e of asama.eylemler) {
    const etiket = etiketMetin(e.etiket);
    const baslik = etiket ? `${etiket}: ${e.baslik}` : e.baslik;
    const kayit = await addPlanlananGorev({
      baslik,
      aciklama: `Profesyonellik · Aşama ${asama.sira} · ${e.aciklama}`,
      tarih: gunEkle(e.gunOfset),
      href: e.href,
    });
    gorevIdleri.push(kayit.id);
  }

  await asamaOnaylandiKaydet(asama.id, gorevIdleri);
  const hatirlatma = await profesyonellikHatirlatmalariKur(asama, gorevIdleri.length);

  return { gorevIdleri, hatirlatma };
}
