/**
 * Takvim — aşı, tedavi, arınma bitişi, sigorta bitişi, tartım ve görevleri tek görünümde toplar.
 * Saf mantık: kayıtlardan olay üretimi, ay ızgarası, ajanda gruplama.
 */

export type TakvimTur = 'asi' | 'tedavi' | 'arinma' | 'sigorta' | 'tartim' | 'gorev' | 'ureme';

export type TakvimOlay = {
  id: string;
  /** YYYY-MM-DD */
  tarih: string;
  tur: TakvimTur;
  baslik: string;
  aciklama?: string;
  /** Dokununca açılacak ekran */
  href: string;
  adet?: number;
};

export const TUR_SIMGE: Record<TakvimTur, string> = {
  asi: '💉',
  tedavi: '💊',
  arinma: '🚫',
  sigorta: '🛡️',
  tartim: '⚖️',
  gorev: '📋',
  ureme: '🐑',
};

export const TUR_ETIKET: Record<TakvimTur, string> = {
  asi: 'Aşı',
  tedavi: 'Tedavi',
  arinma: 'Arınma bitişi',
  sigorta: 'Sigorta bitişi',
  tartim: 'Tartım',
  gorev: 'Görev',
  ureme: 'Üreme',
};

type SaglikGirdi = { id: string; animalId: string; recordType: string; medicine: string; treatment: string; recordedAt: string };
type TartimGirdi = { id: string; animalId: string; weightKg: number; recordedAt: string };

const gun = (t: string) => t.slice(0, 10);

/** Aynı gün + aynı ilaç kayıtları tek olay (toplu aşı 20 kuzu → 1 satır) */
export function saglikOlaylari(kayitlar: SaglikGirdi[], etiket: (animalId: string) => string): TakvimOlay[] {
  const gruplar = new Map<string, SaglikGirdi[]>();
  for (const r of kayitlar) {
    if (r.recordType === 'illness' || r.recordType === 'checkup') continue;
    const ad = (r.medicine || r.treatment || 'Sağlık kaydı').trim();
    const k = `${gun(r.recordedAt)}|${r.recordType}|${ad}`;
    gruplar.set(k, [...(gruplar.get(k) ?? []), r]);
  }
  return [...gruplar.entries()].map(([k, l]) => {
    const [tarih, tip, ad] = k.split('|');
    const tek = l.length === 1;
    return {
      id: `saglik-${k}`,
      tarih,
      tur: tip === 'vaccine' ? 'asi' : 'tedavi',
      baslik: ad,
      aciklama: tek ? etiket(l[0].animalId) : `${l.length} kuzu`,
      href: tek ? `/hayvan/${l[0].animalId}` : '/(tabs)/saglik',
      adet: l.length,
    } satisfies TakvimOlay;
  });
}

export function tartimOlaylari(kayitlar: TartimGirdi[], etiket: (animalId: string) => string): TakvimOlay[] {
  const gruplar = new Map<string, TartimGirdi[]>();
  for (const w of kayitlar) gruplar.set(gun(w.recordedAt), [...(gruplar.get(gun(w.recordedAt)) ?? []), w]);
  return [...gruplar.entries()].map(([tarih, l]) => {
    const ort = Math.round((l.reduce((s, w) => s + w.weightKg, 0) / l.length) * 10) / 10;
    const tek = l.length === 1;
    return {
      id: `tartim-${tarih}`,
      tarih,
      tur: 'tartim',
      baslik: tek ? `Tartım · ${l[0].weightKg} kg` : `Tartım · ${l.length} kuzu`,
      aciklama: tek ? etiket(l[0].animalId) : `ort. ${ort.toLocaleString('tr-TR')} kg`,
      href: tek ? `/hayvan/${l[0].animalId}` : '/seri-giris',
      adet: l.length,
    } satisfies TakvimOlay;
  });
}

/** Arınma bitişleri: aynı gün bitenler tek satır */
export function arinmaOlaylari(l: { animalId: string; bitis: string; ilac: string }[], etiket: (id: string) => string): TakvimOlay[] {
  const g = new Map<string, typeof l>();
  for (const a of l) g.set(a.bitis, [...(g.get(a.bitis) ?? []), a]);
  return [...g.entries()].map(([tarih, x]) => ({
    id: `arinma-${tarih}`,
    tarih,
    tur: 'arinma',
    baslik: x.length === 1 ? `Arınma biter · ${etiket(x[0].animalId)}` : `Arınma biter · ${x.length} kuzu`,
    aciklama: `${[...new Set(x.map((y) => y.ilac))].join(', ')} · bu günden itibaren kesilebilir`,
    href: x.length === 1 ? `/hayvan/${x[0].animalId}` : '/arinma',
    adet: x.length,
  }));
}

export function sigortaOlaylari(l: { id: string; policeNo: string; bitis: string; hayvanIds: string[] }[]): TakvimOlay[] {
  return l.map((p) => ({
    id: `sigorta-${p.id}`,
    tarih: p.bitis,
    tur: 'sigorta',
    baslik: `Sigorta biter · ${p.policeNo}`,
    aciklama: `${p.hayvanIds.length} kuzu`,
    href: '/sigorta',
    adet: p.hayvanIds.length,
  }));
}

export function gorevOlaylari(l: { id: string; baslik: string; aciklama: string; href: string; tarih?: string; kaynak: string }[]): TakvimOlay[] {
  return l
    .filter((g) => g.tarih && !['bekletme', 'sigorta', 'stok'].includes(g.kaynak) && !/stok|stoğu|SKT/i.test(g.baslik))
    .map((g) => ({
      id: `gorev-${g.id}`,
      tarih: g.tarih!,
      tur: (g.kaynak === 'asi' ? 'asi' : g.kaynak === 'tartim' ? 'tartim' : 'gorev') as TakvimTur,
      baslik: `Yapılacak: ${g.baslik}`,
      aciklama: g.aciklama,
      href: g.href,
    }));
}

/** Tarihe göre sıralı, aynı id tekrar etmez */
export function olaylariBirlestir(...listeler: TakvimOlay[][]): TakvimOlay[] {
  const m = new Map<string, TakvimOlay>();
  for (const l of listeler) for (const o of l) if (!m.has(o.id)) m.set(o.id, o);
  return [...m.values()].sort((a, b) => a.tarih.localeCompare(b.tarih) || a.tur.localeCompare(b.tur));
}

export function gunOlaylari(olaylar: TakvimOlay[], tarih: string): TakvimOlay[] {
  return olaylar.filter((o) => o.tarih === tarih);
}

export function gunSayilari(olaylar: TakvimOlay[]): Record<string, number> {
  const s: Record<string, number> = {};
  for (const o of olaylar) s[o.tarih] = (s[o.tarih] ?? 0) + 1;
  return s;
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Ay ızgarası — Pazartesi başlar; null = boş hücre. ay: 0–11 */
export function ayIzgarasi(yil: number, ay: number): (string | null)[][] {
  const ilk = new Date(Date.UTC(yil, ay, 1));
  const bas = (ilk.getUTCDay() + 6) % 7;
  const gunSayisi = new Date(Date.UTC(yil, ay + 1, 0)).getUTCDate();
  const hucreler: (string | null)[] = [...Array(bas).fill(null), ...Array.from({ length: gunSayisi }, (_, i) => iso(yil, ay, i + 1))];
  while (hucreler.length % 7) hucreler.push(null);
  const haftalar: (string | null)[][] = [];
  for (let i = 0; i < hucreler.length; i += 7) haftalar.push(hucreler.slice(i, i + 7));
  return haftalar;
}

export function ayKaydir(yil: number, ay: number, fark: number): { yil: number; ay: number } {
  const t = yil * 12 + ay + fark;
  return { yil: Math.floor(t / 12), ay: ((t % 12) + 12) % 12 };
}

export const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** Ajanda: [bugün − geri, bugün + ileri] aralığı, güne göre gruplu */
export function ajanda(olaylar: TakvimOlay[], bugun: string, geriGun = 14, ileriGun = 60): { tarih: string; olaylar: TakvimOlay[] }[] {
  const ekle = (t: string, n: number) => {
    const [y, m, d] = t.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };
  const bas = ekle(bugun, -geriGun);
  const son = ekle(bugun, ileriGun);
  const g = new Map<string, TakvimOlay[]>();
  for (const o of olaylar) if (o.tarih >= bas && o.tarih <= son) g.set(o.tarih, [...(g.get(o.tarih) ?? []), o]);
  return [...g.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tarih, l]) => ({ tarih, olaylar: l }));
}
