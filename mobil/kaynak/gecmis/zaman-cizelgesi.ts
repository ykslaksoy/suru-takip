/** Hayvan kartı zaman çizelgesi — saf mantık (giriş, tartım, aşı/ilaç, padok, satış tek listede) */
import type { Animal, HealthRecord, WeightRecord } from '@/kaynak/cekirdek/tipler';
import type { Islem } from './tipler';

export type OlayTur = 'giris' | 'tartim' | 'asi' | 'ilac' | 'hastalik' | 'padok' | 'satis' | 'olum' | 'diger';

export type ZamanOlayi = { id: string; zaman: string; tur: OlayTur; baslik: string; detay: string };

const IKON: Record<OlayTur, string> = {
  giris: '🚚',
  tartim: '⚖️',
  asi: '💉',
  ilac: '💊',
  hastalik: '🤒',
  padok: '🏠',
  satis: '💰',
  olum: '✝️',
  diger: '•',
};

export function olayIkonu(t: OlayTur): string {
  return IKON[t];
}

function kg(n: number): string {
  return `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;
}

export function hayvanZamanCizelgesi(opts: {
  animal: Animal;
  weights: WeightRecord[];
  health: HealthRecord[];
  islemler?: Islem[];
}): ZamanOlayi[] {
  const { animal } = opts;
  const out: ZamanOlayi[] = [];
  if (animal.createdAt) {
    out.push({
      id: `giris-${animal.id}`,
      zaman: animal.createdAt,
      tur: 'giris',
      baslik: 'Sürüye giriş',
      detay: [animal.paddock, animal.breed].filter(Boolean).join(' · '),
    });
  }
  const w = [...opts.weights].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  w.forEach((r, i) => {
    const onceki = w[i - 1];
    const fark = onceki ? r.weightKg - onceki.weightKg : null;
    out.push({
      id: `w-${r.id}`,
      zaman: r.recordedAt,
      tur: 'tartim',
      baslik: `Tartım ${kg(r.weightKg)}`,
      detay: [fark != null ? `${fark >= 0 ? '+' : ''}${kg(fark)}` : 'ilk tartım', r.notes].filter(Boolean).join(' · '),
    });
  });
  for (const h of opts.health) {
    const tur: OlayTur = h.recordType === 'vaccine' ? 'asi' : h.recordType === 'illness' ? 'hastalik' : h.recordType === 'treatment' ? 'ilac' : 'diger';
    out.push({
      id: `h-${h.id}`,
      zaman: h.recordedAt,
      tur,
      baslik: h.medicine || h.diagnosis || h.treatment || 'Sağlık kaydı',
      detay: [h.recordType === 'illness' ? h.symptoms : h.treatment, h.withdrawalDays ? `${h.withdrawalDays} gün arınma` : ''].filter(Boolean).join(' · '),
    });
  }
  for (const l of opts.islemler ?? []) {
    if (l.animalId !== animal.id) continue;
    if (l.tur !== 'padok' && l.tur !== 'satis' && l.tur !== 'durum') continue;
    out.push({ id: `l-${l.id}`, zaman: l.zaman, tur: l.tur === 'durum' ? 'diger' : l.tur, baslik: l.ozet, detay: l.detay ?? '' });
  }
  if ((animal.status === 'sold' || animal.status === 'dead') && !out.some((o) => o.tur === 'satis' || o.tur === 'olum')) {
    out.push({
      id: `son-${animal.id}`,
      zaman: animal.updatedAt || animal.createdAt,
      tur: animal.status === 'sold' ? 'satis' : 'olum',
      baslik: animal.status === 'sold' ? 'Satıldı' : 'Öldü',
      detay: '',
    });
  }
  return out.sort((a, b) => b.zaman.localeCompare(a.zaman));
}
