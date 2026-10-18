import {
  eksikKayitAyikla,
  eksikSorusu,
  eksikTamamla,
  kiloYakala,
  komutAyikla,
  kupeYakala,
  sayiYakala,
  type EksikKayit,
} from './komut';
import {
  anlasilmadiMetni,
  duzeltmeIpucuMetni,
  duzeltmeSorusu,
  geriOkumaMetni,
  iptalMetni,
  komutMetni,
  onayCumlesi,
  uygulandiMetni,
} from './geri-okuma';
import { duzeltmeIstegiMi, kesinOnayMi, tamIptalMi } from './onay';
import { grupHayvanSayisi, komutuUygula } from './uygula';
import type { SesKomutEylemi, SesKomutSonucu } from './tipler';

type Durum =
  | { tip: 'bos' }
  | { tip: 'onay'; eylem: SesKomutEylemi; ham: string; tekrar: number }
  | { tip: 'duzeltme'; eylem: SesKomutEylemi; ham: string; tekrar: number }
  | { tip: 'eksik'; eksik: EksikKayit; tekrar: number };

/**
 * Sesli komut oturumu.
 * Kural: önce sesli geri okuma → yalnız "tamam / evet / onayla" ile kayıt.
 * "dur / yanlış / hayır / iptal / değil / düzelt" → KAYDEDİLMEZ, düzeltme istenir.
 */
export class SesKomutOturumu {
  private durum: Durum = { tip: 'bos' };

  get bekleyenEylem(): SesKomutEylemi | null {
    return this.durum.tip === 'onay' || this.durum.tip === 'duzeltme' ? this.durum.eylem : null;
  }

  private onayaGec(eylem: SesKomutEylemi, ham: string): SesKomutSonucu {
    this.durum = { tip: 'onay', eylem, ham, tekrar: 0 };
    return {
      asama: 'onay_bekliyor',
      okumaMetni: geriOkumaMetni(eylem),
      konusmaMetni: onayCumlesi(eylem),
      bekleyenEylem: eylem,
      cevapBekleniyor: true,
    };
  }

  private duzeltmeyeGec(eylem: SesKomutEylemi, ham: string, onEk = ''): SesKomutSonucu {
    this.durum = { tip: 'duzeltme', eylem, ham, tekrar: 0 };
    const soru = duzeltmeSorusu(eylem);
    return {
      asama: 'duzeltme',
      okumaMetni: `${onEk}${soru} ${duzeltmeIpucuMetni(eylem)}`,
      konusmaMetni: `${onEk}${soru}`,
      bekleyenEylem: eylem,
      duzeltmeMetni: komutMetni(eylem, ham),
      cevapBekleniyor: true,
    };
  }

  private eksigeGec(eksik: EksikKayit, tekrar = 0): SesKomutSonucu {
    this.durum = { tip: 'eksik', eksik, tekrar };
    const soru = eksikSorusu(eksik);
    const bilinen =
      eksik.kupeArama != null
        ? `Küpe ${eksik.kupeArama}. `
        : eksik.tur === 'tartim' && eksik.kiloKg != null
          ? `${eksik.kiloKg} kilo. `
          : '';
    return {
      asama: 'eksik_bilgi',
      okumaMetni: `${bilinen}${soru}`,
      konusmaMetni: soru,
      bekleyenEylem: null,
      cevapBekleniyor: true,
    };
  }

  private iptal(): SesKomutSonucu {
    this.durum = { tip: 'bos' };
    return { asama: 'iptal', okumaMetni: iptalMetni(), bekleyenEylem: null };
  }

  private anlasilmadi(): SesKomutSonucu {
    return { asama: 'anlasilmadi', okumaMetni: anlasilmadiMetni(), bekleyenEylem: null };
  }

  /** Yeni (bağımsız) komut: tam ise geri oku, eksikse soru sor */
  private yeniKomut(metin: string): SesKomutSonucu {
    const eylem = komutAyikla(metin);
    if (eylem) return this.onayaGec(eylem, metin);
    const eksik = eksikKayitAyikla(metin);
    if (eksik) return this.eksigeGec(eksik);
    this.durum = { tip: 'bos' };
    return this.anlasilmadi();
  }

  /** Düzeltme cevabı: yeni küpe (veya kilo / miktar) eskisinin yerine geçer */
  private duzeltmeUygula(eylem: SesKomutEylemi, metin: string): SesKomutEylemi | null {
    switch (eylem.tur) {
      case 'tartim': {
        const kg = kiloYakala(metin);
        if (kg != null) return { ...eylem, kiloKg: kg };
        const k = kupeYakala(metin);
        return k ? { ...eylem, kupeArama: k } : null;
      }
      case 'asi': {
        const k = kupeYakala(metin);
        return k ? { ...eylem, kupeArama: k } : null;
      }
      case 'stok': {
        const m = sayiYakala(metin);
        return m != null ? { ...eylem, miktar: m } : null;
      }
      default:
        return null;
    }
  }

  /** STT/transkript veya yazılan metin geldiğinde çağır */
  async metinAl(metin: string): Promise<SesKomutSonucu> {
    const r = await this.metinAlIc(metin);
    const e = r.bekleyenEylem;
    if (e?.tur === 'grup_asi' && e.hayvanSayisi == null && (this.durum.tip === 'onay' || this.durum.tip === 'duzeltme')) {
      const sayi = await grupHayvanSayisi(e);
      if (sayi === 0) {
        this.durum = { tip: 'bos' };
        return { asama: 'anlasilmadi', okumaMetni: 'Bu grupta kayıtlı kuzu bulunamadı. Parti numarasını kontrol edin.', bekleyenEylem: null };
      }
      const zengin = { ...e, hayvanSayisi: sayi };
      this.durum = { ...this.durum, eylem: zengin };
      if (r.asama === 'onay_bekliyor') {
        return { ...r, bekleyenEylem: zengin, okumaMetni: geriOkumaMetni(zengin), konusmaMetni: onayCumlesi(zengin) };
      }
      return { ...r, bekleyenEylem: zengin };
    }
    return r;
  }

  private async metinAlIc(metin: string): Promise<SesKomutSonucu> {
    const trimmed = metin.trim();
    if (!trimmed) return this.anlasilmadi();

    const d = this.durum;

    if (d.tip === 'onay') {
      // Uyarı her zaman önce: "doğru değil" kaydetmez
      if (duzeltmeIstegiMi(trimmed)) {
        // "yanlış, küpe 1300" gibi düzeltme aynı cümlede geldiyse doğrudan yeniden oku
        const duz = this.duzeltmeUygula(d.eylem, trimmed);
        if (duz && JSON.stringify(duz) !== JSON.stringify(d.eylem)) {
          return this.onayaGec(duz, komutMetni(duz, d.ham));
        }
        return this.duzeltmeyeGec(d.eylem, d.ham);
      }
      if (kesinOnayMi(trimmed)) {
        const eylem = d.eylem;
        this.durum = { tip: 'bos' };
        const sonuc = await komutuUygula(eylem);
        if (!sonuc.ok) {
          // Kaydedilemedi (örn. küpe bulunamadı) → düzeltmeye al
          return this.duzeltmeyeGec(eylem, d.ham, `${sonuc.hata} `);
        }
        return { asama: 'uygulandi', okumaMetni: uygulandiMetni(eylem), bekleyenEylem: null };
      }
      // Kullanıcı yeni tam komut söylediyse onu geri oku
      const yeni = komutAyikla(trimmed);
      if (yeni) return this.onayaGec(yeni, trimmed);
      // Anlaşılmadı → soruyu bir kez tekrarla, sonra kaydetmeden düzeltmeye geç
      if (d.tekrar < 1) {
        this.durum = { ...d, tekrar: d.tekrar + 1 };
        const cumle = `Anlamadım. ${onayCumlesi(d.eylem)}`;
        return {
          asama: 'onay_bekliyor',
          okumaMetni: `Anlamadım. ${geriOkumaMetni(d.eylem)}`,
          konusmaMetni: cumle,
          bekleyenEylem: d.eylem,
          cevapBekleniyor: true,
        };
      }
      return this.duzeltmeyeGec(d.eylem, d.ham, 'Anlamadım. ');
    }

    if (d.tip === 'duzeltme') {
      if (tamIptalMi(trimmed)) return this.iptal();
      const yeni = komutAyikla(trimmed);
      if (yeni) return this.onayaGec(yeni, trimmed);
      const duz = this.duzeltmeUygula(d.eylem, trimmed);
      if (duz) return this.onayaGec(duz, komutMetni(duz, d.ham));
      // "tamam" denirse kaydetme — kaydı tekrar oku ve onay iste
      if (kesinOnayMi(trimmed)) return this.onayaGec(d.eylem, d.ham);
      this.durum = { ...d, tekrar: d.tekrar + 1 };
      const soru = duzeltmeSorusu(d.eylem).replace(/^Kaydedilmedi\.\s*/, '');
      return {
        asama: 'duzeltme',
        okumaMetni: `Anlamadım. ${soru} ${duzeltmeIpucuMetni(d.eylem)}`,
        konusmaMetni: `Anlamadım. ${soru}`,
        bekleyenEylem: d.eylem,
        duzeltmeMetni: komutMetni(d.eylem, d.ham),
        cevapBekleniyor: true,
      };
    }

    if (d.tip === 'eksik') {
      if (tamIptalMi(trimmed) || duzeltmeIstegiMi(trimmed)) return this.iptal();
      const tam = komutAyikla(trimmed);
      if (tam) return this.onayaGec(tam, trimmed);
      const t = eksikTamamla(d.eksik, trimmed);
      if (t && 'eylem' in t) return this.onayaGec(t.eylem, komutMetni(t.eylem));
      if (t && 'eksik' in t) return this.eksigeGec(t.eksik);
      if (d.tekrar < 1) {
        const r = this.eksigeGec(d.eksik, d.tekrar + 1);
        return { ...r, okumaMetni: `Anlamadım. ${r.okumaMetni}`, konusmaMetni: `Anlamadım. ${r.konusmaMetni}` };
      }
      this.durum = { tip: 'bos' };
      return this.anlasilmadi();
    }

    return this.yeniKomut(trimmed);
  }

  iptalEt(): SesKomutSonucu {
    return this.iptal();
  }
}

export function sesKomutOturumuOlustur(): SesKomutOturumu {
  return new SesKomutOturumu();
}
