/**
 * Varış sonrası gözlem ve uyum — inceleme kararları (saf mantık).
 * Süre sonunda otomatik besi, sağlık veya karantina yok.
 */
import { gunEkle } from './hesap';
import type { UyumBeslemeKayit, UyumIncelemeKarari } from './uyum-besleme';

export const UYUM_FAZ_BASLIK = 'Varış sonrası gözlem ve uyum';

function kararlar(kayit: UyumBeslemeKayit): UyumIncelemeKarari[] {
  return kayit.incelemeKararlari ?? [];
}

export function uyumIncelemeKararDogrula(
  karar: Pick<UyumIncelemeKarari, 'karar' | 'neden' | 'sonrakiInceleme' | 'hayvanIds' | 'supheNotu' | 'hedefPadok'>,
): string | null {
  if (!karar.neden?.trim()) return 'Karar gerekçesi zorunlu';
  if (karar.karar === 'gozlem_uzat') {
    if (!karar.sonrakiInceleme?.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Uzatma için inceleme tarihi (YYYY-MM-DD)';
  }
  if (karar.karar === 'karantina_suphe') {
    if (!karar.supheNotu?.trim()) return 'Şüphe notu girin — teşhis değil';
    if (!karar.hayvanIds.length) return 'Karantina için en az bir hayvan seçin';
    if (!karar.hedefPadok?.trim()) return 'Hedef karantina padoku seçin';
  }
  return null;
}

export function uyumKararUygula(
  kayit: UyumBeslemeKayit,
  karar: Omit<UyumIncelemeKarari, 'id' | 'zaman'> & { id?: string; zaman?: string },
): UyumBeslemeKayit {
  const hata = uyumIncelemeKararDogrula(karar);
  if (hata) throw new Error(hata);
  const tam: UyumIncelemeKarari = {
    id: karar.id ?? `k-${Date.now()}`,
    zaman: karar.zaman ?? new Date().toISOString(),
    karar: karar.karar,
    neden: karar.neden?.trim(),
    sonrakiInceleme: karar.sonrakiInceleme,
    hayvanIds: [...karar.hayvanIds],
    supheNotu: karar.supheNotu?.trim(),
    hedefPadok: karar.hedefPadok?.trim(),
  };
  const liste = [...kararlar(kayit), tam];
  let uzatmaBitis = kayit.uzatmaBitis;
  let besiyeGecisOnay = kayit.besiyeGecisOnay;
  let incelemeOnay = kayit.incelemeOnay;

  if (tam.karar === 'gozlem_uzat' && tam.sonrakiInceleme) {
    uzatmaBitis = tam.sonrakiInceleme;
    incelemeOnay = false;
  } else if (tam.karar === 'besiye_gecis') {
    besiyeGecisOnay = true;
    incelemeOnay = true;
  } else if (tam.karar === 'karantina_suphe') {
    incelemeOnay = true;
  }

  return {
    ...kayit,
    incelemeKararlari: liste,
    uzatmaBitis,
    besiyeGecisOnay,
    incelemeOnay,
    gozlem: {
      ...kayit.gozlem,
      onayZaman: tam.zaman,
      genel: [kayit.gozlem?.genel, tam.neden].filter(Boolean).join(' · ') || kayit.gozlem?.genel,
    },
  };
}

export function uyumUzatmaOneriBitis(bugun: string, gun = 2): string {
  return gunEkle(bugun, gun);
}

export function uyumOtomatikSaglikTemizligi(): false {
  return false;
}

export function uyumOtomatikIlacUygulama(): false {
  return false;
}

export function uyumOtomatikKarantina(_kayit: UyumBeslemeKayit, _bugun: string): false {
  return false;
}

export function karantinaKapsamGecerli(secilen: string[], padokHayvanIds: string[]): boolean {
  if (!secilen.length) return false;
  const set = new Set(padokHayvanIds);
  return secilen.every((id) => set.has(id));
}
