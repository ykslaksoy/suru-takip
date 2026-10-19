/** Dışa aktarma tabloları — saf (test edilebilir). Sürü sayfası başlıkları içe aktarmayla aynı: geri yüklenebilir. */
import type { Animal, HealthRecord, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { ANIMAL_STATUS_LABELS } from '@/kaynak/cekirdek/tipler';
import type { PartiMaliyet } from '@/kaynak/maliyet/hesap';
import type { Hucre } from './xlsx';

export type VeriSeti = 'suru' | 'tedavi' | 'tartim' | 'maliyet';

export const VERI_SETLERI: { id: VeriSeti; ad: string; simge: string; dosya: string }[] = [
  { id: 'suru', ad: 'Sürü listesi', simge: '🐑', dosya: 'suru' },
  { id: 'tedavi', ad: 'Tedavi ve aşılar', simge: '💉', dosya: 'tedaviler' },
  { id: 'tartim', ad: 'Tartımlar', simge: '⚖️', dosya: 'tartimlar' },
  { id: 'maliyet', ad: 'Maliyetler (parti)', simge: '₺', dosya: 'maliyetler' },
];

export function trTarih(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

const KAYIT_TUR: Record<HealthRecord['recordType'], string> = {
  vaccine: 'Aşı',
  treatment: 'Tedavi',
  illness: 'Hastalık',
  checkup: 'Kontrol',
};

function sonTartimlar(tartimlar: WeightRecord[]): Map<string, WeightRecord> {
  const m = new Map<string, WeightRecord>();
  for (const w of tartimlar) {
    const e = m.get(w.animalId);
    if (!e || w.recordedAt > e.recordedAt) m.set(w.animalId, w);
  }
  return m;
}

export function suruTablosu(hayvanlar: Animal[], tartimlar: WeightRecord[]): Hucre[][] {
  const id2 = new Map(hayvanlar.map((a) => [a.id, a]));
  const son = sonTartimlar(tartimlar);
  const bas = ['Küpe no', 'TÜRKVET no', 'Sırt no', 'Aref / RFID', 'İsim', 'Tür', 'Irk', 'Cinsiyet', 'Doğum tarihi', 'Padok / parti', 'Durum', 'Ana küpe', 'Baba küpe', 'Kilo (kg)', 'Tartım tarihi', 'Not'];
  const satirlar = [...hayvanlar]
    .sort((a, b) => (a.paddock || '').localeCompare(b.paddock || '', 'tr') || (a.earTag || '').localeCompare(b.earTag || '', 'tr'))
    .map((a) => {
      const w = son.get(a.id);
      const ana = a.motherId ? id2.get(a.motherId) : undefined;
      const baba = a.fatherId ? id2.get(a.fatherId) : undefined;
      return [
        a.earTag,
        a.turkvetNo,
        a.sirtNo ?? '',
        a.gehisId ?? '',
        a.name,
        a.species === 'goat' ? 'Keçi' : 'Koyun',
        a.breed,
        a.sex === 'female' ? 'Dişi' : 'Erkek',
        trTarih(a.birthDate),
        a.paddock,
        a.status === 'lactating' ? 'Sağmal' : ANIMAL_STATUS_LABELS[a.status] ?? a.status,
        ana?.earTag ?? '',
        baba?.earTag ?? '',
        w ? w.weightKg : '',
        w ? trTarih(w.recordedAt) : '',
        a.notes,
      ];
    });
  return [bas, ...satirlar];
}

function kimlik(a: Animal | undefined): [string, string, string] {
  return [a?.earTag ?? '(silinmiş)', a?.sirtNo ?? '', a?.paddock ?? ''];
}

export function tedaviTablosu(hayvanlar: Animal[], kayitlar: HealthRecord[]): Hucre[][] {
  const id2 = new Map(hayvanlar.map((a) => [a.id, a]));
  const bas = ['Tarih', 'Küpe no', 'Sırt no', 'Padok / parti', 'Kayıt türü', 'İlaç / aşı', 'Teşhis', 'Tedavi', 'Belirti', 'Arınma (gün)', 'Veteriner', 'Not'];
  const satirlar = [...kayitlar]
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .map((h) => [
      trTarih(h.recordedAt),
      ...kimlik(id2.get(h.animalId)),
      KAYIT_TUR[h.recordType] ?? h.recordType,
      h.medicine,
      h.diagnosis,
      h.treatment,
      h.symptoms,
      h.withdrawalDays || '',
      h.vetName,
      h.notes,
    ]);
  return [bas, ...satirlar];
}

export function tartimTablosu(hayvanlar: Animal[], tartimlar: WeightRecord[]): Hucre[][] {
  const id2 = new Map(hayvanlar.map((a) => [a.id, a]));
  const bas = ['Tarih', 'Küpe no', 'Sırt no', 'Padok / parti', 'Kilo (kg)', 'Not'];
  const satirlar = [...tartimlar]
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .map((w) => [trTarih(w.recordedAt), ...kimlik(id2.get(w.animalId)), w.weightKg, w.notes]);
  return [bas, ...satirlar];
}

export function maliyetTablosu(partiler: PartiMaliyet[]): Hucre[][] {
  const n = (x: number | null) => (x == null ? '' : Math.round(x));
  const bas = ['Parti', 'Baş', 'Alış ₺', 'Yem ₺', 'İlaç/aşı ₺', 'Sigorta ₺', 'Toplam ₺', 'Baş başı ₺', 'Toplam kg', 'Kg başı ₺', 'Tahmini satış ₺', 'Tahmini kâr ₺', 'Gerçek satış ₺', 'Gerçek kâr ₺'];
  const satirlar: Hucre[][] = partiler.map((p) => [
    p.parti,
    p.bas,
    n(p.alis),
    n(p.yem),
    n(p.ilac),
    n(p.sigorta),
    n(p.toplam),
    n(p.basBasi),
    Math.round(p.toplamKg * 10) / 10,
    p.kgBasi == null ? '' : Math.round(p.kgBasi * 100) / 100,
    n(p.tahminiSatis),
    n(p.tahminiKar),
    n(p.gercekSatis),
    n(p.gercekKar),
  ]);
  if (partiler.length > 1) {
    const top = (f: (p: PartiMaliyet) => number | null) => Math.round(partiler.reduce((s, p) => s + (f(p) ?? 0), 0));
    satirlar.push(['TOPLAM', top((p) => p.bas), top((p) => p.alis), top((p) => p.yem), top((p) => p.ilac), top((p) => p.sigorta), top((p) => p.toplam), '', top((p) => p.toplamKg), '', top((p) => p.tahminiSatis), top((p) => p.tahminiKar), top((p) => p.gercekSatis), top((p) => p.gercekKar)]);
  }
  return [bas, ...satirlar];
}

export function dosyaAdi(kok: string, uzanti: 'xlsx' | 'csv', tarih = new Date()): string {
  const t = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}-${String(tarih.getDate()).padStart(2, '0')}`;
  return `superkuzu-${kok}-${t}.${uzanti}`;
}
