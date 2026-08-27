import { komutAyikla } from './komut';
import {
  anlasilmadiMetni,
  geriOkumaMetni,
  iptalMetni,
  uygulandiMetni,
} from './geri-okuma';
import { onayMi, redMi } from './onay';
import { komutuUygula } from './uygula';
import type { SesKomutEylemi, SesKomutSonucu } from './tipler';

/**
 * Sesli komut oturumu.
 * Kural: önce geri okuma → kullanıcı "tamam" demeden kayıt yapılmaz.
 */
export class SesKomutOturumu {
  private bekleyen: SesKomutEylemi | null = null;

  get bekleyenEylem(): SesKomutEylemi | null {
    return this.bekleyen;
  }

  /** STT/transkript geldiğinde çağır */
  async metinAl(metin: string): Promise<SesKomutSonucu> {
    const trimmed = metin.trim();
    if (!trimmed) {
      return {
        asama: 'anlasilmadi',
        okumaMetni: anlasilmadiMetni(),
        bekleyenEylem: null,
      };
    }

    if (this.bekleyen) {
      if (onayMi(trimmed)) {
        const sonuc = await komutuUygula(this.bekleyen);
        const eylem = this.bekleyen;
        this.bekleyen = null;

        if (!sonuc.ok) {
          return {
            asama: 'anlasilmadi',
            okumaMetni: sonuc.hata,
            bekleyenEylem: null,
          };
        }

        return {
          asama: 'uygulandi',
          okumaMetni: uygulandiMetni(eylem),
          bekleyenEylem: null,
        };
      }

      if (redMi(trimmed)) {
        this.bekleyen = null;
        return {
          asama: 'iptal',
          okumaMetni: iptalMetni(),
          bekleyenEylem: null,
        };
      }
    }

    const eylem = komutAyikla(trimmed);
    if (!eylem) {
      return {
        asama: 'anlasilmadi',
        okumaMetni: anlasilmadiMetni(),
        bekleyenEylem: null,
      };
    }

    this.bekleyen = eylem;
    return {
      asama: 'onay_bekliyor',
      okumaMetni: geriOkumaMetni(eylem),
      bekleyenEylem: eylem,
    };
  }

  iptalEt(): SesKomutSonucu {
    this.bekleyen = null;
    return {
      asama: 'iptal',
      okumaMetni: iptalMetni(),
      bekleyenEylem: null,
    };
  }
}

export function sesKomutOturumuOlustur(): SesKomutOturumu {
  return new SesKomutOturumu();
}
