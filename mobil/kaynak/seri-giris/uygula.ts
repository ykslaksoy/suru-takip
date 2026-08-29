/**
 * Seri ahır — satır metnini ses komut ayıklayıcı ile yapılandır.
 * Tartım: "1234, 68" | "küpe 1234, 68 kilo"
 * Aşı: "1234, çiçek" | "küpe 1234 aşı çiçek"
 */

import { komutAyikla } from '@/kaynak/ses/komut';
import { komutuUygula } from '@/kaynak/ses/uygula';
import type { SesKomutEylemi } from '@/kaynak/ses/tipler';
import type { SeriKayit, SeriMod, SeriOturum } from './mod';
import { getSeriOturum, seriOturumBitir } from './mod';

export type SeriAyiklama =
  | { ok: true; eylem: SesKomutEylemi }
  | { ok: false; hata: string };

/** Seri satırını (kısa veya uzun) ses komut eylemine çevir */
export function seriSatirAyikla(mod: SeriMod, metin: string): SeriAyiklama {
  const t = metin.trim();
  if (!t) return { ok: false, hata: 'Boş satır' };

  // Önce tam ses komut sözdizimi
  const dogrudan = komutAyikla(t);
  if (dogrudan) {
    if (mod === 'tartim' && dogrudan.tur !== 'tartim') {
      return { ok: false, hata: 'Bu oturum tartım; aşı/stok satırı değil.' };
    }
    if (mod === 'asi' && dogrudan.tur !== 'asi') {
      return { ok: false, hata: 'Bu oturum aşı; tartım/stok satırı değil.' };
    }
    return { ok: true, eylem: dogrudan };
  }

  // Kısa ahır biçimi: "küpe, değer"
  const parcalar = t.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parcalar.length >= 2) {
    const kupe = parcalar[0].replace(/^(?:küpe|kupe)\s*/i, '').trim();
    const ikinci = parcalar.slice(1).join(' ').trim();
    if (mod === 'tartim') {
      const kg = parseFloat(ikinci.replace(',', '.').replace(/[^\d.]/g, ''));
      if (!kupe || !Number.isFinite(kg) || kg <= 0) {
        return { ok: false, hata: 'Tartım için: küpe, kilo (örn. 1234, 68)' };
      }
      return { ok: true, eylem: { tur: 'tartim', kupeArama: kupe.toUpperCase(), kiloKg: kg } };
    }
    if (!kupe || !ikinci) {
      return { ok: false, hata: 'Aşı için: küpe, aşı adı (örn. 1234, çiçek)' };
    }
    return { ok: true, eylem: { tur: 'asi', kupeArama: kupe.toUpperCase(), asiAdi: ikinci } };
  }

  // Tek satır: ses komutuna çevirmeyi dene (mod ipucu ekleyerek)
  const ipucu =
    mod === 'tartim'
      ? komutAyikla(t.includes('kilo') || t.includes('kg') ? t : `${t} kilo`)
      : komutAyikla(/aşı|asi/i.test(t) ? t : `aşı ${t}`);
  if (ipucu && ((mod === 'tartim' && ipucu.tur === 'tartim') || (mod === 'asi' && ipucu.tur === 'asi'))) {
    return { ok: true, eylem: ipucu };
  }

  return {
    ok: false,
    hata:
      mod === 'tartim'
        ? 'Anlaşılmadı. Örn: 1234, 68 veya küpe 1234, 68 kilo'
        : 'Anlaşılmadı. Örn: 1234, çiçek veya küpe 1234 aşı çiçek',
  };
}

export type SeriUygulamaOzet = {
  basarili: number;
  hatali: number;
  mesajlar: string[];
};

/** Bekleyen satırları onaylı gibi uygular (ahırda satır eklerken zaten kullanıcı onayı vardır) */
export async function seriKayitlariUygula(oturum?: SeriOturum | null): Promise<SeriUygulamaOzet> {
  const o = oturum ?? (await getSeriOturum());
  if (!o || o.kayitlar.length === 0) {
    return { basarili: 0, hatali: 0, mesajlar: ['Uygulanacak kayıt yok.'] };
  }

  let basarili = 0;
  let hatali = 0;
  const mesajlar: string[] = [];

  // Eskiden yeniye uygula
  const sirali = [...o.kayitlar].reverse();
  for (const k of sirali) {
    const ayik = seriSatirAyikla(o.mod, k.metin);
    if (!ayik.ok) {
      hatali += 1;
      mesajlar.push(`${k.metin}: ${ayik.hata}`);
      continue;
    }
    const r = await komutuUygula(ayik.eylem);
    if (r.ok) {
      basarili += 1;
    } else {
      hatali += 1;
      mesajlar.push(`${k.metin}: ${r.hata}`);
    }
  }

  await seriOturumBitir();
  return { basarili, hatali, mesajlar };
}

export function seriKayitOzeti(kayit: SeriKayit, mod: SeriMod): string {
  const ayik = seriSatirAyikla(mod, kayit.metin);
  if (!ayik.ok) return `⚠ ${kayit.metin}`;
  if (ayik.eylem.tur === 'tartim') {
    return `⚖️ ${ayik.eylem.kupeArama} · ${ayik.eylem.kiloKg} kg`;
  }
  if (ayik.eylem.tur === 'asi') {
    return `🛡️ ${ayik.eylem.kupeArama} · ${ayik.eylem.asiAdi}`;
  }
  return kayit.metin;
}
