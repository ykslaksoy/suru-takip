/** Bağlantı + uygulama güncelleme durumu — küçük gözlenebilir depo (RN'siz) */
export type BaglantiDurum = {
  cevrimici: boolean;
  /** Son çevrimdışı → çevrimiçi geçiş zamanı (ms) */
  geriGeldi: number | null;
  /** Uygulama kabuğu önbellekte mi (çevrimdışı açılabilir) */
  hazir: boolean;
  /** Yeni sürüm indirildi, yenile bekliyor */
  guncellemeVar: boolean;
};

let durum: BaglantiDurum = { cevrimici: true, geriGeldi: null, hazir: false, guncellemeVar: false };
const dinleyiciler = new Set<() => void>();

export function baglantiDurumu(): BaglantiDurum {
  return durum;
}

export function baglantiGuncelle(y: Partial<BaglantiDurum>): void {
  const yeni = { ...durum, ...y };
  if (y.cevrimici === true && !durum.cevrimici) yeni.geriGeldi = Date.now();
  if (JSON.stringify(yeni) === JSON.stringify(durum)) return;
  durum = yeni;
  for (const f of dinleyiciler) f();
}

export function baglantiDinle(f: () => void): () => void {
  dinleyiciler.add(f);
  return () => {
    dinleyiciler.delete(f);
  };
}

/** Ağ isteği yapılmadan önce: çevrimdışıysa hiç deneme (12 sn zaman aşımı beklenmesin) */
export function cevrimiciMi(): boolean {
  return durum.cevrimici;
}

/** Durum metni — saf, test edilir */
export function baglantiMetni(d: BaglantiDurum, simdi: number): { metin: string; tur: 'cevrimdisi' | 'geri' | 'guncelleme' } | null {
  if (!d.cevrimici) return { metin: '📴 Çevrimdışı · kayıtlar bu cihaza yazılıyor', tur: 'cevrimdisi' };
  if (d.guncellemeVar) return { metin: '⬆️ Yeni sürüm hazır · Yenile', tur: 'guncelleme' };
  if (d.geriGeldi && simdi - d.geriGeldi < 4000) return { metin: '✅ Tekrar çevrimiçi', tur: 'geri' };
  return null;
}
