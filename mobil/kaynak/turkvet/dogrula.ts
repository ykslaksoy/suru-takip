import type { Animal } from '@/kaynak/cekirdek/tipler';

export function validateTurkvetNo(value: string): { valid: boolean; message: string } {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  if (!cleaned) return { valid: true, message: '' };
  if (cleaned.length < 10 || cleaned.length > 18) {
    return { valid: false, message: 'TÜRKVET numarası 10-18 karakter olmalı' };
  }
  if (!/^TR[A-Z0-9]+$/.test(cleaned) && !/^[0-9A-Z]+$/.test(cleaned)) {
    return { valid: false, message: 'Geçersiz TÜRKVET formatı' };
  }
  return { valid: true, message: '' };
}

export function validateGehisId(value: string): { valid: boolean; message: string } {
  const cleaned = value.replace(/\s/g, '');
  if (!cleaned) return { valid: true, message: '' };
  if (cleaned.length < 8) {
    return { valid: false, message: 'GEKİS ID en az 8 karakter olmalı' };
  }
  return { valid: true, message: '' };
}

export function formatTurkvetExport(animal: Animal) {
  return {
    turkvetKimlikNo: animal.turkvetNo,
    kulakKupeNo: animal.earTag,
    gehisElektronikKimlik: animal.gehisId ?? '',
    tur: 'koyun',
    irk: animal.breed,
    cinsiyet: animal.sex === 'female' ? 'D' : 'E',
    dogumTarihi: animal.birthDate,
    anneTurkvetNo: animal.motherId ?? '',
    durum: animal.status,
    padok: animal.paddock,
    sonGuncelleme: animal.updatedAt,
  };
}

export const TURKVET_FIELD_LABELS = {
  turkvetNo: 'TÜRKVET Kimlik No',
  earTag: 'Kulak Küpe No',
  gehisId: 'GEKİS Elektronik Kimlik',
  motherId: 'Anne TÜRKVET No',
  birthDate: 'Doğum Tarihi',
  breed: 'Irk',
  status: 'Durum',
} as const;
