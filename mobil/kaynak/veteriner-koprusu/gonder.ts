import { Linking } from 'react-native';
import type { VakaPaketi } from './vaka-paketi';
import { programVakaKaydet, whatsappVakaKaydet } from './case-thread';
import {
  vetGonderimKanali,
  whatsAppGonderUrl,
  type VetKanal,
} from './vet-iletisim';

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

export function vakaPaketiPaylasimMetni(paket: VakaPaketi, vetAd?: string): string {
  const a = paket.animal;
  const hayvan = a ? `${a.earTag} · ${a.breed} · ${a.paddock}` : 'Hayvan eşleşmedi';
  const satirlar = [
    'SürüYön — Veteriner vaka paketi',
    vetAd ? `Veteriner: ${vetAd}` : null,
    `Tarih: ${new Date(paket.createdAt).toLocaleString('tr-TR')}`,
    `Hayvan: ${hayvan}`,
    `Semptom: ${paket.symptoms || '—'}`,
    `Son sağlık kaydı: ${paket.healthHistory[0]?.diagnosis || '—'}`,
    `Son tartım: ${paket.weights[0]?.weightKg != null ? `${paket.weights[0].weightKg} kg` : '—'}`,
    paket.aiOzet ? `AI özeti: ${paket.aiOzet}` : null,
    '',
    'Lütfen talimatınızı paylaşın.',
  ].filter(Boolean) as string[];
  return satirlar.join('\n');
}

export type VakaGonderSonuc = {
  ok: boolean;
  kanal: VetKanal;
  message: string;
  vakaId?: string;
  whatsappUrl?: string;
};

/** Programda kayıtlı vet → uygulama içi vaka; değilse WhatsApp. */
export async function gonderVakaPaketi(paket: VakaPaketi): Promise<VakaGonderSonuc> {
  const { kanal, vet, aciklama } = await vetGonderimKanali();
  const metin = vakaPaketiPaylasimMetni(paket, vet.ad || undefined);
  const vetLabel = vet.ad || vet.klinikAdi || 'Veteriner';

  if (kanal === 'yapilandir') {
    return { ok: false, kanal, message: aciklama };
  }

  if (kanal === 'program') {
    const kayit = await programVakaKaydet(paket, vetLabel);
    return {
      ok: true,
      kanal,
      vakaId: kayit.id,
      message: `${vetLabel} programına vaka iletildi. Yanıt gelince Vakalar sekmesinde görünür.`,
    };
  }

  const url = whatsAppGonderUrl(vet.whatsapp, metin);
  if (!url) {
    return {
      ok: false,
      kanal: 'yapilandir',
      message: 'WhatsApp numarası geçersiz. Ayarlardan düzeltin.',
    };
  }

  const kayit = await whatsappVakaKaydet(paket, vetLabel);

  try {
    const destekleniyor = await Linking.canOpenURL(url);
    if (destekleniyor) {
      await Linking.openURL(url);
    } else if (typeof globalThis !== 'undefined' && 'open' in globalThis) {
      (globalThis as Window & typeof globalThis).open(url, '_blank');
    }
  } catch {
    return {
      ok: true,
      kanal: 'whatsapp',
      vakaId: kayit.id,
      whatsappUrl: url,
      message: 'WhatsApp açılamadı; linki kopyalayın.',
    };
  }

  return {
    ok: true,
    kanal: 'whatsapp',
    vakaId: kayit.id,
    whatsappUrl: url,
    message: `${vetLabel} WhatsApp ile açıldı. Mesajı gönderin.`,
  };
}
