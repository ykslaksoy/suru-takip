import { test, type TestModul } from '../cerceve';
import { komutAyikla, eksikKayitAyikla } from '@/kaynak/ses/komut';
import { iptalMetni, kullaniciIptalMetni } from '@/kaynak/ses/geri-okuma';
import { dinlemeHataMesaji } from '@/kaynak/ses/dinleme-hata';
import { duzeltmeIstegiMi, kesinOnayMi, tamIptalMi } from '@/kaynak/ses/onay';

const ORNEKLER = [
  ['küpe 1234, 68 kilo', 'tartim'],
  ['küpe TR-34-001235 aşı çiçek', 'asi'],
  ['3. parti karma aşısı yapıldı', 'grup_asi'],
  ['tüm kuzular ivermektin', 'grup_asi'],
  ['stok giriş yem 50 kg', 'stok'],
] as const;

export const sesKomutModul: TestModul = {
  grup: 'Sesli komut (t266u — iptal/algılama)',
  calistir: () => {
    const g = 'Ses komut';
    const r = [];

    for (const [cumle, tur] of ORNEKLER) {
      const e = komutAyikla(cumle);
      r.push(test(g, `örnek ayıklanır: ${cumle.slice(0, 28)}…`, e?.tur === tur, JSON.stringify(e)));
    }

    r.push(test(g, 'tek başına tamam komut değil', komutAyikla('tamam') === null));
    r.push(test(g, 'bos tamam kesin onay kelimesi', kesinOnayMi('tamam') && !tamIptalMi('tamam')));

    r.push(
      test(g, 'not-allowed mesajı yazı yolu önerir', dinlemeHataMesaji('not-allowed').includes('Gönder')),
      test(g, 'no-speech mesajı net', dinlemeHataMesaji('no-speech').includes('Ses duyulmadı')),
      test(g, 'network mesajı net', dinlemeHataMesaji('network').includes('ağ')),
    );

    r.push(
      test(g, 'UI iptal metni kayıt yok der', kullaniciIptalMetni().includes('Kayıt yok')),
      test(g, 'sesli iptal metni ayrı', iptalMetni().includes('iptal ettim')),
    );

    r.push(
      test(g, 'eksik tartım küpe ile başlar', eksikKayitAyikla('küpe 1234')?.tur === 'tartim'),
      test(
        g,
        'eksik yanıtta yanlış iptal değil düzeltme',
        duzeltmeIstegiMi('yanlış') && !tamIptalMi('yanlış'),
      ),
      test(g, 'eksik yanıtta iptal gerçek iptal', tamIptalMi('iptal')),
    );

    return r;
  },
};
