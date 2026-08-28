import type { VakaPaketi } from './vaka-paketi';

export function vakaPaketiToJson(paket: VakaPaketi): string {
  return JSON.stringify(
    {
      suruyonVaka: '1.0',
      exportedAt: paket.createdAt,
      paket,
    },
    null,
    2
  );
}

export function vakaPaketiPaylasimMetni(paket: VakaPaketi): string {
  const a = paket.animal;
  const hayvan = a ? `${a.earTag} · ${a.breed} · ${a.paddock}` : 'Hayvan eşleşmedi';
  return [
    'SürüYön — Veteriner vaka paketi',
    `Tarih: ${new Date(paket.createdAt).toLocaleString('tr-TR')}`,
    `Hayvan: ${hayvan}`,
    `Semptom: ${paket.symptoms || '—'}`,
    `Son sağlık kaydı: ${paket.healthHistory[0]?.diagnosis || '—'}`,
    `Son tartım: ${paket.weights[0]?.weightKg != null ? `${paket.weights[0].weightKg} kg` : '—'}`,
    '',
    paket.not,
  ].join('\n');
}

/** Sunucu API hazır olunca buradan POST edilecek. */
export async function gonderVakaPaketi(paket: VakaPaketi): Promise<{ ok: boolean; message: string }> {
  return {
    ok: true,
    message: `Vaka paketi hazır (${paket.id.slice(0, 8)}). Paylaşım / JSON export ile veterinere iletin.`,
  };
}
