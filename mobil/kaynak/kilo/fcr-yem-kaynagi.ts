/** Bireysel FCR için yem verisi güven düzeyi. */
export type FcrYemGuven = 'bireysel_plan' | 'padok_tahsis' | 'tahmini_rasyon' | 'yok';

export type FcrYemKaynagiBilgi = {
  guven: FcrYemGuven;
  /** Kullanıcıya gösterilecek tahsis/ölçüm açıklaması */
  aciklama: string;
  tahsis: boolean;
};

export function bireyselFcrGosterimMetni(bilgi: FcrYemKaynagiBilgi): string {
  if (bilgi.guven === 'bireysel_plan') {
    return 'Yem: hayvanın kayıtlı günlük rasyon planı × dönem (bireysel).';
  }
  if (bilgi.guven === 'padok_tahsis') {
    return `Yem: padok tüketimi başına tahsis — ${bilgi.aciklama} Bireysel tartım değil; tahsis FCR’si.`;
  }
  if (bilgi.guven === 'tahmini_rasyon') {
    return `Yem: tahmini rasyon — ${bilgi.aciklama}`;
  }
  return bilgi.aciklama;
}
