import { takviyeGorevOncelikSira } from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import type { TakviyeTip } from '@/kaynak/akilli-veteriner/takviye-tipler';

export type GorevSeviye = 'uyari' | 'sira' | 'plan' | 'bilgi';

export type GorevKaynak =
  | 'bekletme'
  | 'asi'
  | 'stok'
  | 'saglik'
  | 'tartim'
  | 'yem'
  | 'yolculuk'
  | 'planlanan'
  | 'is-plani';

export type Gorev = {
  id: string;
  seviye: GorevSeviye;
  kaynak: GorevKaynak;
  baslik: string;
  aciklama: string;
  href: string;
  cta: string;
  tarih?: string;
  baslikIgne?: string;
  baslikMl?: string;
  /** Girişten kaçıncı gün (aşı gün gün grup) */
  planGun?: number;
  tamamlanabilir?: boolean;
  tamam?: boolean;
};

const SEVIYE_SIRASI: Record<GorevSeviye, number> = { uyari: 0, sira: 1, plan: 2, bilgi: 3 };

export function bugunTarih(): string {
  return new Date().toISOString().slice(0, 10);
}

/** takviye-ozet id’sinden öncelik sırası (tarih eşitse) */
export function gorevTakviyeOncelikSira(gorevId: string): number {
  const m = gorevId.match(/^takviye-ozet-(asi|parazit|vitamin|tartim)-(.+)$/);
  if (!m) return 50;
  return takviyeGorevOncelikSira(m[1] as TakviyeTip, m[2]);
}

/** En yakın tarih önce · aynı günde sağlık önceliği · sonra acil→sırada→planlı */
export function gorevleriSirala(gorevler: Gorev[]): Gorev[] {
  const bugun = bugunTarih();
  return [...gorevler].sort((a, b) => {
    const ga = a.planGun;
    const gb = b.planGun;
    if (ga != null && gb != null && ga !== gb) return ga - gb;
    const dt = (a.tarih ?? bugun).localeCompare(b.tarih ?? bugun);
    if (dt !== 0) return dt;
    const po = gorevTakviyeOncelikSira(a.id) - gorevTakviyeOncelikSira(b.id);
    if (po !== 0) return po;
    return SEVIYE_SIRASI[a.seviye] - SEVIYE_SIRASI[b.seviye];
  });
}
