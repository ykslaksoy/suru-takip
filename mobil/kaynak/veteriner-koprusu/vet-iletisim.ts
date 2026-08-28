import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sy_vet_iletisim_v1';

export type VetIletisim = {
  ad: string;
  /** SürüYön veteriner hesabı var mı */
  programdaKayitli: boolean;
  /** Program vet kimliği (davet / hesap no) */
  programVetId: string;
  /** WhatsApp için telefon (05xx… veya +90…) */
  whatsapp: string;
  klinikAdi: string;
  updatedAt: string;
};

const BOS: VetIletisim = {
  ad: '',
  programdaKayitli: false,
  programVetId: '',
  whatsapp: '',
  klinikAdi: '',
  updatedAt: '',
};

export async function getVetIletisim(): Promise<VetIletisim> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...BOS };
  try {
    return { ...BOS, ...(JSON.parse(raw) as VetIletisim) };
  } catch {
    return { ...BOS };
  }
}

export async function saveVetIletisim(
  patch: Partial<Omit<VetIletisim, 'updatedAt'>>
): Promise<VetIletisim> {
  const mevcut = await getVetIletisim();
  const next: VetIletisim = {
    ...mevcut,
    ...patch,
    ad: patch.ad !== undefined ? patch.ad.trim() : mevcut.ad,
    programVetId: patch.programVetId !== undefined ? patch.programVetId.trim() : mevcut.programVetId,
    whatsapp: patch.whatsapp !== undefined ? patch.whatsapp.trim() : mevcut.whatsapp,
    klinikAdi: patch.klinikAdi !== undefined ? patch.klinikAdi.trim() : mevcut.klinikAdi,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** Program vet mi, WhatsApp mı, yoksa ayar eksik mi */
export type VetKanal = 'program' | 'whatsapp' | 'yapilandir';

export async function vetGonderimKanali(): Promise<{
  kanal: VetKanal;
  vet: VetIletisim;
  aciklama: string;
}> {
  const vet = await getVetIletisim();
  if (vet.programdaKayitli && vet.programVetId.length >= 4) {
    return {
      kanal: 'program',
      vet,
      aciklama: `${vet.ad || 'Veterineriniz'} SürüYön programında — vaka uygulama içinden iletilir.`,
    };
  }
  if (normalizeWhatsAppPhone(vet.whatsapp)) {
    return {
      kanal: 'whatsapp',
      vet,
      aciklama: `${vet.ad || 'Veterineriniz'} WhatsApp (${vet.whatsapp}) ile iletilecek.`,
    };
  }
  return {
    kanal: 'yapilandir',
    vet,
    aciklama: 'Ayarlar → Veteriner köprüsü bölümünden vet tanımlayın (program veya WhatsApp).',
  };
}

/** wa.me için uluslararası rakam dizisi (Türkiye 90…) */
export function normalizeWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('5')) return `90${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `9${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('90')) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function whatsAppGonderUrl(phone: string, text: string): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
