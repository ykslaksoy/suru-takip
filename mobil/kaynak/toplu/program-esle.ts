/** Söylenen / yazılan ilaç adını aşı-parazit-vitamin kataloğuyla eşleştir */
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';

export type ProgramEslesme = { tur: 'asi' | 'vitamin'; id: string; ad: string; koruma: string };

function norm(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/\b(asisi|asi|ilaci|ilac|hapi|hap|vitamini|yapildi|verildi|uygulandi|ignesi)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function programEslestir(ham: string): ProgramEslesme | null {
  const q = norm(ham);
  if (!q) return null;
  const adaylar: ProgramEslesme[] = [
    ...ASI_PROGRAMI.map((p) => ({ tur: 'asi' as const, id: p.id, ad: p.ad, koruma: p.koruma })),
    ...VITAMIN_PROGRAMI.map((v) => ({ tur: 'vitamin' as const, id: v.id, ad: v.ad, koruma: v.detay })),
  ];
  // 1) id birebir
  const idTam = adaylar.find((a) => norm(a.id.replace(/-/g, ' ')) === q || a.id === q);
  if (idTam) return idTam;
  // 2) ilk kelime id / ad / koruma başında
  const ilk = q.split(' ')[0];
  return (
    adaylar.find((a) => norm(a.id.replace(/-/g, ' ')).startsWith(ilk)) ??
    adaylar.find((a) => {
      const idIlk = norm(a.id.replace(/-/g, ' ')).split(' ')[0];
      return idIlk.length >= 4 && ilk.startsWith(idIlk);
    }) ??
    adaylar.find((a) => norm(a.ad).split(' ').includes(ilk)) ??
    adaylar.find((a) => norm(a.koruma).split(' ').includes(ilk)) ??
    adaylar.find((a) => norm(a.ad).includes(q) || norm(a.koruma).includes(q)) ??
    null
  );
}
