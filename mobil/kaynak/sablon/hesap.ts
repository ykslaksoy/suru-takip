/**
 * Kayıt şablonları — sık yapılan çok adımlı işler (ör. “Giriş paketi”) tek dokunuşla
 * seçili kuzu grubuna uygulanır. Saf mantık.
 */
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';

export type SablonAdim =
  | { tur: 'tartim' }
  | { tur: 'asi'; programId: string }
  | { tur: 'vitamin'; programId: string };

export type KayitSablonu = {
  id: string;
  ad: string;
  adimlar: SablonAdim[];
  varsayilan?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const GIRIS_PAKETI_ID = 'sablon-giris-paketi';

export const VARSAYILAN_SABLONLAR: KayitSablonu[] = [
  {
    id: GIRIS_PAKETI_ID,
    ad: 'Giriş paketi',
    adimlar: [
      { tur: 'tartim' },
      { tur: 'asi', programId: 'ivermektin' },
      { tur: 'asi', programId: 'albendazol' },
      { tur: 'asi', programId: 'karma' },
      { tur: 'vitamin', programId: 'selen-e' },
    ],
    varsayilan: true,
    createdAt: '2026-10-19T00:00:00.000Z',
    updatedAt: '2026-10-19T00:00:00.000Z',
  },
  {
    id: 'sablon-parazit',
    ad: 'Parazit tekrarı',
    adimlar: [
      { tur: 'asi', programId: 'ivermektin' },
      { tur: 'asi', programId: 'albendazol' },
    ],
    varsayilan: true,
    createdAt: '2026-10-19T00:00:00.000Z',
    updatedAt: '2026-10-19T00:00:00.000Z',
  },
];

export function adimAnahtar(a: SablonAdim): string {
  return a.tur === 'tartim' ? 'tartim' : `${a.tur}:${a.programId}`;
}

export function adimEtiket(a: SablonAdim): string {
  if (a.tur === 'tartim') return '⚖️ Tartım';
  if (a.tur === 'asi') {
    const p = ASI_PROGRAMI.find((x) => x.id === a.programId);
    if (!p) return `💉 ${a.programId}`;
    return `${p.kategori === 'parazit' ? '💊' : '💉'} ${p.ad}`;
  }
  const v = VITAMIN_PROGRAMI.find((x) => x.id === a.programId);
  return `🧪 ${v?.ad ?? a.programId}`;
}

/** Şablona eklenebilecek tüm adımlar */
export function secilebilirAdimlar(): SablonAdim[] {
  return [
    { tur: 'tartim' },
    ...ASI_PROGRAMI.filter((p) => p.kategori === 'parazit').map((p) => ({ tur: 'asi' as const, programId: p.id })),
    ...ASI_PROGRAMI.filter((p) => p.kategori !== 'parazit').map((p) => ({ tur: 'asi' as const, programId: p.id })),
    ...VITAMIN_PROGRAMI.map((v) => ({ tur: 'vitamin' as const, programId: v.id })),
  ];
}

export function adimGecerli(a: SablonAdim): boolean {
  if (a.tur === 'tartim') return true;
  if (a.tur === 'asi') return ASI_PROGRAMI.some((p) => p.id === a.programId);
  return VITAMIN_PROGRAMI.some((v) => v.id === a.programId);
}

/** Aynı adım iki kez eklenemez; geçersiz adımlar atılır */
export function adimlariTemizle(adimlar: SablonAdim[]): SablonAdim[] {
  const gor = new Set<string>();
  return adimlar.filter((a) => {
    const k = adimAnahtar(a);
    if (gor.has(k) || !adimGecerli(a)) return false;
    gor.add(k);
    return true;
  });
}

export function sablonDogrula(ad: string, adimlar: SablonAdim[], digerAdlar: string[] = []): string | null {
  const a = ad.trim();
  if (!a) return 'Şablon adı yaz';
  if (digerAdlar.some((x) => x.trim().toLocaleLowerCase('tr-TR') === a.toLocaleLowerCase('tr-TR'))) return 'Bu adla şablon var';
  if (adimlariTemizle(adimlar).length === 0) return 'En az bir adım seç';
  return null;
}

export function sablonOzet(s: Pick<KayitSablonu, 'adimlar'>): string {
  return s.adimlar.map(adimEtiket).join(' → ');
}

/** Adımı yukarı/aşağı taşı */
export function adimTasi(adimlar: SablonAdim[], i: number, yon: -1 | 1): SablonAdim[] {
  const j = i + yon;
  if (j < 0 || j >= adimlar.length) return adimlar;
  const k = [...adimlar];
  [k[i], k[j]] = [k[j], k[i]];
  return k;
}
