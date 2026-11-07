/**
 * Varış ve uyum beslemesi — besleme adaptasyonu; karantina/teşhis değil.
 * Süre sonunda otomatik rasyon veya sağlık durumu değişmez.
 */
import { gunEkle } from './hesap';

export const UYUM_GUN_SECENEKLERI = [2, 3] as const;
export type UyumGunSayisi = (typeof UYUM_GUN_SECENEKLERI)[number];

export type UyumIncelemeKararTipi = 'gozlem_uzat' | 'besiye_gecis' | 'karantina_suphe';

export type UyumIncelemeKarari = {
  id: string;
  zaman: string;
  karar: UyumIncelemeKararTipi;
  neden?: string;
  /** Uzatılmış inceleme / dönem bitişi (YYYY-MM-DD) */
  sonrakiInceleme?: string;
  hayvanIds: string[];
  /** Şüphe — teşhis değil */
  supheNotu?: string;
  hedefPadok?: string;
};

export type UyumGozlemGirdisi = {
  istah?: string;
  diski?: string;
  rumen?: string;
  genel?: string;
  /** Kullanıcı inceleme onayı — teşhis değil */
  onayZaman?: string;
};

export type UyumBeslemeKayit = {
  id: string;
  padok: string;
  rasyonId?: string;
  baslangic: string;
  gunSayisi: UyumGunSayisi;
  kayitZaman: string;
  gozlem?: UyumGozlemGirdisi;
  /** Süre sonu incelemesi kullanıcı onayı; rasyonu otomatik değiştirmez */
  incelemeOnay?: boolean;
  incelemeKararlari?: UyumIncelemeKarari[];
  uzatmaBitis?: string;
  /** Kullanıcı besiye geçiş onayı — planı otomatik başlatmaz */
  besiyeGecisOnay?: boolean;
};

export type UyumDonemDurumu =
  | 'yok'
  | 'planli'
  | 'devam'
  | 'inceleme_gerekli'
  | 'gozlem_uzatildi'
  | 'besiye_gecis_onay'
  | 'suphe_kaydi'
  | 'onaylandi';

export function uyumBitisTarihi(baslangic: string, gunSayisi: UyumGunSayisi): string {
  return gunEkle(baslangic, gunSayisi - 1);
}

export function uyumEtkinBitis(kayit: UyumBeslemeKayit): string {
  const temel = uyumBitisTarihi(kayit.baslangic, kayit.gunSayisi);
  const uz = kayit.uzatmaBitis?.trim();
  if (!uz) return temel;
  return uz > temel ? uz : temel;
}

function uyumKararlar(kayit: UyumBeslemeKayit): UyumIncelemeKarari[] {
  return kayit.incelemeKararlari ?? [];
}

export function sonIncelemeKarari(kayit: UyumBeslemeKayit): UyumIncelemeKarari | null {
  const bitis = uyumEtkinBitis(kayit);
  const uygun = uyumKararlar(kayit).filter((k) => k.zaman.slice(0, 10) >= bitis);
  if (!uygun.length) {
    if (kayit.incelemeOnay && !uyumKararlar(kayit).length) {
      return {
        id: 'legacy-onay',
        zaman: kayit.gozlem?.onayZaman ?? `${bitis}T12:00:00.000Z`,
        karar: 'besiye_gecis',
        hayvanIds: [],
        neden: 'Eski inceleme onayı (geriye uyum)',
      };
    }
    return null;
  }
  return uygun.sort((a, b) => b.zaman.localeCompare(a.zaman))[0]!;
}

export function incelemeGerekliMi(kayit: UyumBeslemeKayit, bugun: string): boolean {
  if (bugun < kayit.baslangic) return false;
  const bitis = uyumEtkinBitis(kayit);
  if (bugun <= bitis) return false;
  if (kayit.besiyeGecisOnay) return false;
  const son = sonIncelemeKarari(kayit);
  if (!son) return true;
  if (son.karar === 'gozlem_uzat') {
    const yeniBitis = kayit.uzatmaBitis ?? bitis;
    return bugun > yeniBitis;
  }
  return false;
}

export function uyumDonemDurumu(kayit: UyumBeslemeKayit | null | undefined, bugun: string): UyumDonemDurumu {
  if (!kayit) return 'yok';
  if (bugun < kayit.baslangic) return 'planli';
  const bitis = uyumEtkinBitis(kayit);
  if (bugun <= bitis) return 'devam';
  if (kayit.besiyeGecisOnay) return 'besiye_gecis_onay';
  const son = sonIncelemeKarari(kayit);
  if (son?.karar === 'karantina_suphe') return 'suphe_kaydi';
  if (incelemeGerekliMi(kayit, bugun)) return 'inceleme_gerekli';
  if (son?.karar === 'gozlem_uzat') return 'gozlem_uzatildi';
  if (son?.karar === 'besiye_gecis' || kayit.incelemeOnay) return 'onaylandi';
  return 'inceleme_gerekli';
}

export function uyumUyariMetni(): string {
  return 'Varış sonrası gözlem ve uyum fazıdır; karantina veya sağlık onayı değildir. Süre bitince inceleme sizin kararınızla uzar, besiye geçer veya şüphede karantinaya taşınır — otomatik işlem yok.';
}

export function uyumIncelemeMetni(durum: UyumDonemDurumu, bitis: string): string | null {
  if (durum === 'inceleme_gerekli') {
    return `${bitis} sonrası inceleme gerekir — gözlem notları + açık karar: uzat, besiye geçiş veya şüpheli hayvanı karantinaya. Otomatik rasyon/sağlık/ilaç yok.`;
  }
  if (durum === 'gozlem_uzatildi') {
    return 'Gözlem uzatıldı; aktif uyum planı korunur. Yeni inceleme tarihine kadar rasyon elle değiştirilmez.';
  }
  if (durum === 'besiye_gecis_onay') {
    return 'Besiye geçiş onaylandı. Kayıtlı rasyon planını rasyon ekranından siz uygularsınız; otomatik başlamaz.';
  }
  if (durum === 'suphe_kaydi') {
    return 'Şüphe ve seçili hayvan taşıması kayıtlı (teşhis yok). Veteriner planı yoksa «eylem gerekli» — ilaç buradan eklenmez.';
  }
  if (durum === 'onaylandi') {
    return 'İnceleme kaydedildi. Sonraki besleme planına geçişi elle seçin; yoğun besiye otomatik geçilmez.';
  }
  return null;
}

/** Süre bitişinde bile rasyon/sağlık otomatik güncellenmez */
export function uyumOtomatikRasyonDegisimi(_kayit: UyumBeslemeKayit, _bugun: string): false {
  return false;
}

export function uyumKayitDogrula(g: Partial<UyumBeslemeKayit> & { padok?: string }): string | null {
  if (!g.padok?.trim()) return 'Padok seç';
  if (!g.baslangic?.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Başlangıç tarihi (YYYY-MM-DD)';
  if (g.gunSayisi !== 2 && g.gunSayisi !== 3) return 'Süre 2 veya 3 gün';
  return null;
}

export function padokUyumKaydi(kayitlar: UyumBeslemeKayit[], padok: string): UyumBeslemeKayit | null {
  const p = padok.trim();
  const uygun = kayitlar.filter((k) => k.padok === p);
  if (!uygun.length) return null;
  return uygun.sort((a, b) => b.kayitZaman.localeCompare(a.kayitZaman))[0]!;
}
