/**
 * Varış ve uyum beslemesi — besleme adaptasyonu; karantina/teşhis değil.
 * Süre sonunda otomatik rasyon veya sağlık durumu değişmez.
 */
import { gunEkle } from './hesap';

export const UYUM_GUN_SECENEKLERI = [2, 3] as const;
export type UyumGunSayisi = (typeof UYUM_GUN_SECENEKLERI)[number];

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
};

export type UyumDonemDurumu = 'yok' | 'planli' | 'devam' | 'inceleme_gerekli' | 'onaylandi';

export function uyumBitisTarihi(baslangic: string, gunSayisi: UyumGunSayisi): string {
  return gunEkle(baslangic, gunSayisi - 1);
}

export function uyumDonemDurumu(kayit: UyumBeslemeKayit | null | undefined, bugun: string): UyumDonemDurumu {
  if (!kayit) return 'yok';
  if (bugun < kayit.baslangic) return 'planli';
  const bitis = uyumBitisTarihi(kayit.baslangic, kayit.gunSayisi);
  if (bugun <= bitis) return 'devam';
  if (!kayit.incelemeOnay) return 'inceleme_gerekli';
  return 'onaylandi';
}

export function uyumUyariMetni(): string {
  return 'Besleme adaptasyonu planıdır; veteriner karantina veya sağlık onayı değildir. Süre klinik zorunluluk taşımaz.';
}

export function uyumIncelemeMetni(durum: UyumDonemDurumu, bitis: string): string | null {
  if (durum === 'inceleme_gerekli') {
    return `${bitis} sonrası inceleme gerekir — iştah, dışkı, rumen, genel durum notu girin ve onaylayın. Otomatik besi veya rasyon değişimi yoktur.`;
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
