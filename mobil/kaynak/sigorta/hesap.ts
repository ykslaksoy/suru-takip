/**
 * TARSİM / hayvan hayat sigortası takibi — saf mantık (UI ve görevler ortak kullanır).
 * Poliçe: no, şirket (ops.), başlangıç–bitiş, prim (ops.), kapsanan kuzular (hayvan id listesi).
 * Uyarı: bitişe 30 gün ve 7 gün kala, süresi dolunca; aktif poliçesi olmayan kuzular ayrıca işaretlenir.
 */

export type SigortaPolice = {
  id: string;
  policeNo: string;
  sirket?: string;
  /** YYYY-MM-DD */
  baslangic: string;
  /** YYYY-MM-DD — poliçenin son günü (dahil) */
  bitis: string;
  /** Toplam prim ₺ (opsiyonel) — Maliyet ekranına girer */
  prim?: number;
  hayvanIds: string[];
  createdAt: string;
};

export type PoliceDurum = 'baslamadi' | 'aktif' | 'yaklasiyor' | 'son-hafta' | 'doldu';

export const UYARI_GUN_30 = 30;
export const UYARI_GUN_7 = 7;

/** Yerel YYYY-MM-DD */
export function yerelTarih(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

function gunNo(t: string): number {
  const [y, m, d] = t.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/** a → b arası gün (b − a) */
export function gunFarki(a: string, b: string): number {
  return gunNo(b) - gunNo(a);
}

/** "GG.AA.YYYY", "G.A.YYYY", "GG/AA/YYYY" veya "YYYY-AA-GG" → YYYY-MM-DD; geçersizse null */
export function tarihCoz(ham: string): string | null {
  const t = ham.trim();
  let y: number, m: number, d: number;
  let r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (r) {
    y = +r[1];
    m = +r[2];
    d = +r[3];
  } else {
    r = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (!r) return null;
    d = +r[1];
    m = +r[2];
    y = +r[3];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** YYYY-MM-DD → "19.10.2026" */
export function tarihGoster(t: string): string {
  const [y, m, d] = t.split('-');
  return `${d}.${m}.${y}`;
}

/** Başlangıçtan 1 yıl sonrası − 1 gün (yıllık poliçe varsayılan bitişi) */
export function yillikBitis(baslangic: string, ay = 12): string {
  const [y, m, d] = baslangic.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + ay, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/** YYYY-MM-DD + 1 gün */
export function ertesiGun(t: string): string {
  const [y, m, d] = t.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function kalanGun(p: SigortaPolice, bugun: string): number {
  return gunFarki(bugun, p.bitis);
}

export function policeDurumu(p: SigortaPolice, bugun: string): PoliceDurum {
  if (gunFarki(bugun, p.baslangic) > 0) return 'baslamadi';
  const k = kalanGun(p, bugun);
  if (k < 0) return 'doldu';
  if (k <= UYARI_GUN_7) return 'son-hafta';
  if (k <= UYARI_GUN_30) return 'yaklasiyor';
  return 'aktif';
}

export const POLICE_DURUM_ETIKET: Record<PoliceDurum, string> = {
  baslamadi: 'Başlamadı',
  aktif: 'Aktif',
  yaklasiyor: 'Bitişe 30 günden az',
  'son-hafta': 'Bitişe 7 günden az',
  doldu: 'Süresi doldu',
};

/** Bugün koruma sağlıyor mu (başlangıç ≤ bugün ≤ bitiş) */
export function policeGecerli(p: SigortaPolice, bugun: string): boolean {
  const d = policeDurumu(p, bugun);
  return d !== 'doldu' && d !== 'baslamadi';
}

/** Hayvanı bugün kapsayan poliçe (birden çoksa bitişi en geç olan) */
export function hayvanPolicesi(policeler: SigortaPolice[], animalId: string, bugun: string): SigortaPolice | null {
  const uygun = policeler.filter((p) => p.hayvanIds.includes(animalId) && policeGecerli(p, bugun));
  if (!uygun.length) return null;
  return [...uygun].sort((a, b) => b.bitis.localeCompare(a.bitis))[0];
}

type HayvanMin = { id: string; status: string };

function aktifMi(a: HayvanMin): boolean {
  return a.status !== 'sold' && a.status !== 'dead';
}

/** Aktif (satılmamış / ölmemiş) ama geçerli poliçesi olmayan hayvanlar */
export function sigortasizHayvanlar<T extends HayvanMin>(animals: T[], policeler: SigortaPolice[], bugun: string): T[] {
  return animals.filter((a) => aktifMi(a) && !hayvanPolicesi(policeler, a.id, bugun));
}

export type SigortaUyari = {
  id: string;
  seviye: 'uyari' | 'sira';
  baslik: string;
  aciklama: string;
  /** Poliçe id (sigortasız özetinde yok) */
  policeId?: string;
};

/**
 * Görevler / Bugün için uyarılar:
 * - bitişe ≤30 gün: "sira", ≤7 gün: "uyari", dolmuş (son 30 gün içinde): "uyari"
 * - geçerli poliçesi olmayan aktif kuzu varsa tek özet satırı (en az bir poliçe girilmişse)
 */
export function sigortaUyarilari(policeler: SigortaPolice[], animals: HayvanMin[], bugun: string): SigortaUyari[] {
  const out: SigortaUyari[] = [];
  const aktifIds = new Set(animals.filter(aktifMi).map((a) => a.id));
  for (const p of policeler) {
    const d = policeDurumu(p, bugun);
    const k = kalanGun(p, bugun);
    const bas = p.hayvanIds.filter((id) => aktifIds.has(id)).length;
    const ad = `Poliçe ${p.policeNo}${p.sirket ? ` (${p.sirket})` : ''}`;
    if (d === 'yaklasiyor' || d === 'son-hafta') {
      out.push({
        id: `sigorta-bitis-${p.id}`,
        seviye: d === 'son-hafta' ? 'uyari' : 'sira',
        baslik: k === 0 ? 'Sigorta bugün bitiyor' : `Sigorta ${k} gün sonra bitiyor`,
        aciklama: `${ad} · bitiş ${tarihGoster(p.bitis)} · ${bas} kuzu · yenile`,
        policeId: p.id,
      });
    } else if (d === 'doldu' && -k <= 30) {
      // Yenilenmişse (aynı kuzuları kapsayan yeni geçerli poliçe) uyarma
      const yenilendi = p.hayvanIds
        .filter((id) => aktifIds.has(id))
        .every((id) => hayvanPolicesi(policeler, id, bugun));
      if (bas > 0 && !yenilendi) {
        out.push({
          id: `sigorta-doldu-${p.id}`,
          seviye: 'uyari',
          baslik: 'Sigorta süresi doldu',
          aciklama: `${ad} · ${tarihGoster(p.bitis)} tarihinde bitti · ${bas} kuzu korumasız`,
          policeId: p.id,
        });
      }
    }
  }
  if (policeler.length > 0) {
    const sigortasiz = sigortasizHayvanlar(
      animals.filter((a) => aktifIds.has(a.id)),
      policeler,
      bugun,
    ).length;
    if (sigortasiz > 0) {
      out.push({
        id: 'sigorta-sigortasiz',
        seviye: 'sira',
        baslik: 'Sigortasız kuzu',
        aciklama: `${sigortasiz} kuzu hiçbir geçerli poliçede yok`,
      });
    }
  }
  return out;
}

/** Hayvan başına prim payı (poliçe primi ÷ kapsanan kuzu sayısı) — Maliyet ekranı için */
export function hayvanPrimPaylari(policeler: SigortaPolice[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of policeler) {
    if (!p.prim || p.prim <= 0 || p.hayvanIds.length === 0) continue;
    const pay = p.prim / p.hayvanIds.length;
    for (const id of p.hayvanIds) out[id] = (out[id] ?? 0) + pay;
  }
  return out;
}

export type PoliceGirdi = {
  policeNo: string;
  sirket?: string;
  baslangic: string;
  bitis: string;
  prim?: string;
  hayvanIds: string[];
};

/** Form doğrulama — hata metni veya null */
export function policeDogrula(g: PoliceGirdi): string | null {
  if (!g.policeNo.trim()) return 'Poliçe numarasını yaz.';
  const b = tarihCoz(g.baslangic);
  if (!b) return 'Başlangıç tarihi geçersiz (GG.AA.YYYY).';
  const s = tarihCoz(g.bitis);
  if (!s) return 'Bitiş tarihi geçersiz (GG.AA.YYYY).';
  if (gunFarki(b, s) < 0) return 'Bitiş, başlangıçtan önce olamaz.';
  if (g.prim?.trim()) {
    const n = sayiCoz(g.prim);
    if (n == null || n < 0) return 'Prim tutarı geçersiz.';
  }
  if (g.hayvanIds.length === 0) return 'Poliçenin kapsadığı kuzuları seç (Tümü = tüm sürü).';
  return null;
}

/** "12.500,50" / "12500" → 12500.5 */
export function sayiCoz(ham: string): number | null {
  const t = ham.trim().replace(/\s|₺/g, '');
  if (!t) return null;
  const n = parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/\.(?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(n) ? n : null;
}
