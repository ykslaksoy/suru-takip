import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';
import type { VakaFotografi } from './fotograf';
import type { VetCevaplar } from './netlestirme';
import { formatAiOzet } from './fotograf';

export type VakaDos = {
  id: string;
  createdAt: string;
  baglamMetni: string;
  oneri: VetSuggestion;
  fotograflar: VakaFotografi[];
  cevaplar: VetCevaplar;
  ozet: string;
};

export function vakaDosOlustur(input: {
  id?: string;
  baglamMetni: string;
  oneri: VetSuggestion;
  fotograflar: VakaFotografi[];
  cevaplar: VetCevaplar;
}): VakaDos {
  const createdAt = new Date().toISOString();
  return {
    id: input.id ?? `dos-${Date.now()}`,
    createdAt,
    baglamMetni: input.baglamMetni,
    oneri: input.oneri,
    fotograflar: input.fotograflar,
    cevaplar: input.cevaplar,
    ozet: formatAiOzet(input.oneri),
  };
}

/** Veterinere iletilecek metin dosyası */
export function vakaDosMetni(dos: VakaDos, kupe?: string): string {
  const satirlar = [
    '═══ SürüYön — Akıllı Veteriner Vaka Dosyası ═══',
    `Tarih: ${new Date(dos.createdAt).toLocaleString('tr-TR')}`,
    kupe ? `Kulak küpe: ${kupe}` : null,
    '',
    '── Gözlem / semptom ──',
    dos.baglamMetni || '—',
    '',
    '── AI özeti ──',
    dos.ozet,
    '',
    `Aciliyet: ${dos.oneri.urgency} · Veteriner: ${dos.oneri.seeVet ? 'Evet' : 'Hayır'}`,
    '',
    '── Olası durumlar ──',
    ...(dos.oneri.conditions.length ? dos.oneri.conditions.map((c) => `• ${c}`) : ['• —']),
    '',
    '── Önerilen tedavi adımları ──',
    ...dos.oneri.tedaviOnerileri.map((t, i) => `${i + 1}. ${t}`),
    '',
    '── Fotoğraf gözlemleri ──',
    ...(dos.oneri.fotoGozlemleri.length ? dos.oneri.fotoGozlemleri.map((g) => `• ${g}`) : ['• —']),
    '',
    `Ek fotoğraf: ${dos.fotograflar.length} adet (${dos.fotograflar.map((f) => f.etiket).join(', ') || 'yok'})`,
    '',
    '── Genel öneri ──',
    dos.oneri.advice,
    '',
    'Bu dosya bilgilendirme amaçlıdır; teşhis veteriner hekime aittir.',
  ].filter((s) => s !== null) as string[];

  return satirlar.join('\n');
}
