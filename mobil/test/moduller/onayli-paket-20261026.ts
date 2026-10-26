import { cariNetBakiye, islemBakiyeEtkisi, type CariIslem } from '@/kaynak/cari/hesap';
import { besiRasyonDilimleri, dilimGunSayisi } from '@/kaynak/besi-programi/rasyon-dilimleri';
import { hesaplaBesiMaliyetTahmin } from '@/kaynak/besi-programi/maliyet-tahmin';
import { degerlendirMeraKapasite } from '@/kaynak/mera/kapasite-hesap';
import { sutToplamLitre, verimSutOzet } from '@/kaynak/verim/hesap';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestModul } from '../cerceve';

const KOK = join(__dirname, '..', '..');
const CARI_ANAHTAR = 'sy_cari_hesaplar_v1';
const VERIM_ANAHTAR = 'sy_verim_kayitlari_v1';
const MERA_KAPASITE_ANAHTAR = 'sy_mera_kapasite_v1';

export const onayliPaket20261026Modul: TestModul = {
  grup: 'Onaylı paket (2026-10-26)',
  calistir() {
    const islemler: CariIslem[] = [
      {
        id: '1',
        cariId: 'c',
        tur: 'borc',
        tutar: 1000,
        tarih: '2026-10-01',
        not: '',
        createdAt: '',
      },
      {
        id: '2',
        cariId: 'c',
        tur: 'tahsilat',
        tutar: 400,
        tarih: '2026-10-02',
        not: '',
        createdAt: '',
      },
    ];
    const dilim90 = besiRasyonDilimleri(90);
    const dilim120 = besiRasyonDilimleri(120);
    const tahmin = hesaplaBesiMaliyetTahmin({
      ufukGun: 90,
      basSayisi: 10,
      alisBasFiyat: 3000,
      hedefSatisKg: 45,
      satisKgFiyat: 280,
    });
    const kap = degerlendirMeraKapasite(
      { alan: 10, birim: 'donum', tasimaBasHa: 4, uygulamalar: [], guncelleme: '' },
      50,
    );
    const sutOzet = verimSutOzet([
      {
        id: 's',
        tur: 'sut',
        tarih: '2026-10-01',
        sabahLitre: 10,
        aksamLitre: 12,
        toplamLitre: 22,
        girisModu: 'bas',
        hayvanSayisi: 2,
        kaliteNot: '',
        ortLBas: 11,
        createdAt: '',
      },
    ]);
    const cariDepo = readFileSync(join(KOK, 'kaynak/cari/depo.ts'), 'utf8');
    const verimDepo = readFileSync(join(KOK, 'kaynak/verim/depo.ts'), 'utf8');
    return [
      test('Onaylı paket', 'Cari anahtar', cariDepo.includes(CARI_ANAHTAR)),
      test('Onaylı paket', 'Cari net bakiye', cariNetBakiye(islemler) === 600),
      test('Onaylı paket', 'Cari vade etkisi sıfır', islemBakiyeEtkisi('vade', 500) === 0),
      test('Onaylı paket', 'Verim anahtar', verimDepo.includes(VERIM_ANAHTAR)),
      test('Onaylı paket', 'Süt toplam litre', sutToplamLitre(10, 12) === 22),
      test('Onaylı paket', 'Süt özet', sutOzet.litre === 22 && sutOzet.ortLBas === 11),
      test('Onaylı paket', 'Besi dilim 90', dilim90.length >= 2 && dilim90.every((d) => d.href.includes('rasyon'))),
      test('Onaylı paket', 'Besi dilim 120 ufuk', dilim120.some((d) => d.gunBitis === 120)),
      test(
        'Onaylı paket',
        'Dilim gün sayısı',
        dilimGunSayisi(dilim90[0]!) >= 5 && dilimGunSayisi(dilim90[0]!) <= 6,
      ),
      test('Onaylı paket', 'Besi tahmin kar hesabı', tahmin.toplamMaliyet > 0 && Number.isFinite(tahmin.tahminiKar)),
      test(
        'Onaylı paket',
        'Mera kapasite anahtar',
        readFileSync(join(KOK, 'kaynak/mera/kapasite-hesap.ts'), 'utf8').includes(MERA_KAPASITE_ANAHTAR),
      ),
      test('Onaylı paket', 'Mera aşırı otlatma', kap.asiri === true && !!kap.uyari?.includes('Aşırı')),
      test(
        'Onaylı paket',
        'Giriş yöntemi kurulum rotası',
        readFileSync(join(KOK, 'app/giris-yontemi/kurulum.tsx'), 'utf8').includes('kurulumTamamla'),
      ),
    ];
  },
};
