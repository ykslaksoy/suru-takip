import { Linking, Platform, Share } from 'react-native';
import type { VakaPaketi } from './vaka-paketi';
import { fotoTurEtiketi } from '@/kaynak/akilli-veteriner/fotograf';
import { programVakaKaydet, whatsappVakaKaydet } from './case-thread';
import {
  vetGonderimKanali,
  whatsAppGonderUrl,
  type VetKanal,
} from './vet-iletisim';

export function vakaPaketiToJson(paket: VakaPaketi): string {
  return JSON.stringify(
    {
      suruyonVaka: '1.1',
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
  const fotoEtiketler =
    paket.fotograflar.length > 0
      ? paket.fotograflar.map((f) => f.etiket || fotoTurEtiketi(f.tur)).join(', ')
      : null;

  const satirlar: (string | null)[] = [
    'SürüYön — Veteriner vaka paketi',
    vetAd ? `Veteriner: ${vetAd}` : null,
    `Tarih: ${new Date(paket.createdAt).toLocaleString('tr-TR')}`,
    `Hayvan: ${hayvan}`,
    `Semptom: ${paket.symptoms || '—'}`,
    '',
  ];

  if (paket.teshisOzet) {
    satirlar.push('── Teşhis ──', paket.teshisOzet, '');
  }
  if (paket.aiOzet) {
    satirlar.push(`AI özeti: ${paket.aiOzet}`, '');
  }
  if (paket.dozSatirlari && paket.dozSatirlari.length > 0) {
    satirlar.push(
      `── Önerilen doz${paket.kg != null ? ` (${paket.kg} kg)` : ''} ──`,
      ...paket.dozSatirlari.map((d) => `• ${d}`),
      '',
    );
  }
  if (fotoEtiketler) {
    satirlar.push(
      '── Fotoğraf ──',
      `${paket.fotograflar.length} adet: ${fotoEtiketler}`,
      'Not: Fotoğrafları mesaja ekleyin (ataç) veya uygulamadan “Fotoğraf paylaş”.',
      '',
    );
  }

  satirlar.push(
    `Son sağlık: ${paket.healthHistory[0]?.diagnosis || '—'}`,
    `Son tartım: ${paket.weights[0]?.weightKg != null ? `${paket.weights[0].weightKg} kg` : '—'}`,
    '',
    'Lütfen talimatınızı paylaşın.',
  );

  return satirlar.filter((s) => s !== null).join('\n');
}

/** WhatsApp sonrası fotoğrafları sistem paylaşımı ile ilet (mobil) — sırayla. */
export async function fotograflariPaylas(paket: VakaPaketi): Promise<boolean> {
  if (paket.fotograflar.length === 0 || Platform.OS === 'web') return false;
  let ok = false;
  for (const f of paket.fotograflar) {
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { url: f.uri, message: `SürüYön · ${f.etiket || fotoTurEtiketi(f.tur)}` }
          : { message: `SürüYön · ${f.etiket || fotoTurEtiketi(f.tur)}`, url: f.uri }
      );
      ok = true;
    } catch {
      /* devam */
    }
  }
  return ok;
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
    message:
      paket.fotograflar.length > 0
        ? `${vetLabel} WhatsApp açıldı (teşhis + doz metni hazır). Mesajı gönderin; ardından fotoğrafları paylaşın.`
        : `${vetLabel} WhatsApp ile açıldı. Mesajı gönderin.`,
  };
}
