export type VerimSutKayit = {
  id: string;
  tur: 'sut';
  /** YYYY-MM-DD */
  tarih: string;
  sabahLitre: number | null;
  aksamLitre: number | null;
  toplamLitre: number;
  /** tank = depo toplamı; bas = hayvan başına ortalama */
  girisModu: 'tank' | 'bas';
  hayvanSayisi: number;
  kaliteNot: string;
  /** L / baş (hesaplanmış veya girilmiş) */
  ortLBas: number | null;
  createdAt: string;
};

export type VerimYapagiKayit = {
  id: string;
  tur: 'yapagi';
  tarih: string;
  basSayisi: number;
  toplamKg: number;
  ortKgBas: number | null;
  satisNot: string;
  createdAt: string;
};

export type VerimKayit = VerimSutKayit | VerimYapagiKayit;
