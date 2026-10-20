/**
 * Besi programı motoru — phase 1: ufuk seçimi + HIZLI_BESI_TAKVIM tabanlı görev zaman çizelgesi.
 */

import {
  hizliBesiTakviyeSablonuUfukta,
  HIZLI_BESI_PLAN_BASLIK,
  asiGorunumBaslik,
  gunEtiket,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import { TARTIM_GIRIS_PROGRAM_ID } from '@/kaynak/akilli-veteriner/takviye-tipler';
import type { ModTakviyeKalemi } from '@/kaynak/akilli-veteriner/takviye-tipler';

function planTarihGiristen(gun: number, giris: Date): string {
  const d = new Date(giris);
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
}
import {
  BESI_PLAN_TAVAN_GUN,
  besiUfukGunOku,
  besiPlanMesajUfukta,
  normalizeBesiUfukGun,
  takvimSatirlariUfukta,
  yemSatirlariUfukta,
} from './ufuk';

export {
  BESI_UFUK_DEPOLAMA_ANAHTAR,
  BESI_UFUK_SECENEKLERI,
  BESI_EK_SURE_GUN,
  BESI_PLAN_TAVAN_GUN,
  BESI_SATIS_UFUK_GUN,
  besiPlanMesajUfukta,
  besiUfukGunKaydet,
  besiUfukGunOku,
  normalizeBesiUfukGun,
  takvimSatirlariUfukta,
  varsayilanBesiUfukGun,
  yemSatirlariUfukta,
  type BesiUfukSecenek,
} from './ufuk';

export type BesiProgramGorevSatir = {
  gun: number;
  /** Girişten itibaren plan tarihi (YYYY-MM-DD) */
  planTarih: string;
  programId: string;
  tip: 'asi' | 'parazit' | 'vitamin' | 'tartim' | 'yem';
  baslik: string;
  not: string;
  href: string;
  /** Görevler kategorisi — mevcut rotalar */
  gorevKaynak: 'asi' | 'yem' | 'tartim';
};

function satirBaslik(
  tip: 'asi' | 'parazit' | 'vitamin' | 'tartim',
  programId: string,
  yedekNot: string,
): string {
  if (tip === 'tartim') {
    if (programId === TARTIM_GIRIS_PROGRAM_ID) return 'Alım tartımı';
    return 'Kontrol tartımı';
  }
  if (tip === 'vitamin') {
    const v = VITAMIN_PROGRAMI.find((x) => x.id === programId);
    return v ? `${v.detay} (${v.ad})` : programId;
  }
  const p = ASI_PROGRAMI.find((x) => x.id === programId);
  if (p) return asiGorunumBaslik(p.koruma, p.ad);
  return yedekNot || programId;
}

function satirHref(tip: BesiProgramGorevSatir['tip'], programId: string): string {
  if (tip === 'yem') return `/gorevler/yem/${programId}`;
  if (tip === 'tartim' && programId === TARTIM_GIRIS_PROGRAM_ID) return '/(tabs)/suru';
  return `/gorevler/asi/${programId}`;
}

function satirKaynak(tip: BesiProgramGorevSatir['tip']): BesiProgramGorevSatir['gorevKaynak'] {
  if (tip === 'yem') return 'yem';
  if (tip === 'tartim') return 'tartim';
  return 'asi';
}

/** Minimum standart takvim + yem milestone’ları → görev rotalarına bağlı zaman çizelgesi */
export function olusturBesiGorevZamanCizelgesi(opts: {
  ufukGun: number;
  /** Alım / kabul günü — varsayılan bugün */
  giris?: Date;
}): BesiProgramGorevSatir[] {
  const ufuk = normalizeBesiUfukGun(opts.ufukGun);
  const giris = opts.giris ?? new Date();
  const out: BesiProgramGorevSatir[] = [];

  for (const s of takvimSatirlariUfukta(ufuk)) {
    out.push({
      gun: s.gun,
      planTarih: planTarihGiristen(s.gun, giris),
      programId: s.programId,
      tip: s.tip,
      baslik: satirBaslik(s.tip, s.programId, s.not),
      not: s.not,
      href: satirHref(s.tip, s.programId),
      gorevKaynak: satirKaynak(s.tip),
    });
  }

  for (const y of yemSatirlariUfukta(ufuk)) {
    out.push({
      gun: y.gun,
      planTarih: planTarihGiristen(y.gun, giris),
      programId: y.id,
      tip: 'yem',
      baslik: y.koruma,
      not: `${y.urun} — ${y.not}`,
      href: satirHref('yem', y.id),
      gorevKaynak: 'yem',
    });
  }

  return out.sort((a, b) => a.gun - b.gun || a.baslik.localeCompare(b.baslik, 'tr'));
}

export function besiTakviyeSablonuUfukta(ufukGun: number): ModTakviyeKalemi[] {
  return hizliBesiTakviyeSablonuUfukta(normalizeBesiUfukGun(ufukGun));
}

export async function aktifBesiTakviyeSablonu(): Promise<ModTakviyeKalemi[]> {
  const ufuk = await besiUfukGunOku();
  return besiTakviyeSablonuUfukta(ufuk);
}

export function besiPlanBaslikUfukta(ufukGun: number): string {
  const u = normalizeBesiUfukGun(ufukGun);
  if (u >= BESI_PLAN_TAVAN_GUN) return HIZLI_BESI_PLAN_BASLIK;
  return `Hızlı besi — min. standart · ~${u} gün ufuk`;
}

/** Özet: kaç görev günü, ilk/son milestone */
export function besiProgramOzeti(ufukGun: number, giris?: Date): {
  ufukGun: number;
  asiSatir: number;
  yemSatir: number;
  gunAraligi: string;
} {
  const ufuk = normalizeBesiUfukGun(ufukGun);
  const cizelge = olusturBesiGorevZamanCizelgesi({ ufukGun: ufuk, giris });
  const asiSatir = cizelge.filter((s) => s.tip !== 'yem').length;
  const yemSatir = cizelge.filter((s) => s.tip === 'yem').length;
  const gunlar = [...new Set(cizelge.map((s) => s.gun))].sort((a, b) => a - b);
  const gunAraligi =
    gunlar.length === 0
      ? gunEtiket(1)
      : `${gunEtiket(gunlar[0]!)} → ${gunEtiket(gunlar[gunlar.length - 1]!)}`;
  return { ufukGun: ufuk, asiSatir, yemSatir, gunAraligi };
}
