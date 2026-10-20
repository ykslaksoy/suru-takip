import { test, type TestModul, type TestSonuc } from '../cerceve';
import {
  ekipOnar,
  ekipYonetebilir,
  kisiDogrula,
  kisiSilinebilir,
  pinDogru,
  pinGecerli,
  pinOzeti,
  VARSAYILAN_YETKI,
  varsayilanEkip,
  yetkiMesaji,
  yetkiVar,
  type Kisi,
} from '@/kaynak/ekip/hesap';
import { setYetkiDenetleyici, yetkiEngeli, yetkiGerekli } from '@/kaynak/ekip/kapi';

const G = 'Roller ve yetkiler';

function kisi(p: Partial<Kisi>): Kisi {
  const rol = p.rol ?? 'bakici';
  return { id: 'k', ad: 'Mehmet', rol, yetkiler: { ...VARSAYILAN_YETKI[rol] }, olusturma: '', ...p };
}

export const ekipModul: TestModul = {
  grup: G,
  calistir() {
    const r: TestSonuc[] = [];
    const t = (ad: string, k: boolean) => {
      r.push(test(G, ad, k));
    };
    const bakici = kisi({});
    const vet = kisi({ id: 'v', ad: 'Vet', rol: 'veteriner' });
    const ortak = kisi({ id: 'o', ad: 'Ortak', rol: 'ortak' });
    const sahip = kisi({ id: 's', ad: 'Sahip', rol: 'sahip', yetkiler: { finans: false, silme: false, duzenleme: false, tedavi: false } });
    t('bakıcı varsayılan: para görmez, silemez, düzenleyemez, tedavi girer', !yetkiVar(bakici, 'finans') && !yetkiVar(bakici, 'silme') && !yetkiVar(bakici, 'duzenleme') && yetkiVar(bakici, 'tedavi'));
    t('veteriner varsayılan: tedavi girer, para görmez', yetkiVar(vet, 'tedavi') && !yetkiVar(vet, 'finans'));
    t('ortak varsayılan: hepsi açık', ['finans', 'silme', 'duzenleme', 'tedavi'].every((y) => yetkiVar(ortak, y as never)));
    t('sahip anahtarlardan bağımsız her şeyi yapar', yetkiVar(sahip, 'finans') && yetkiVar(sahip, 'silme'));
    t('kişiye özel: bakıcıya silme açılabilir', yetkiVar(kisi({ yetkiler: { ...VARSAYILAN_YETKI.bakici, silme: true } }), 'silme'));
    t('ekibi yalnız sahip yönetir', ekipYonetebilir(sahip) && !ekipYonetebilir(ortak) && !ekipYonetebilir(bakici));

    const v = varsayilanEkip();
    t('varsayılan ekip: tek sahip aktif', v.kisiler.length === 1 && v.kisiler[0].rol === 'sahip' && v.aktifId === v.kisiler[0].id);
    t('onar: sahipsiz kayıt varsayılana döner', ekipOnar({ kisiler: [bakici], aktifId: 'k' }).kisiler[0].rol === 'sahip');
    t('onar: geçersiz aktif → sahip', ekipOnar({ kisiler: [sahip, bakici], aktifId: 'yok' }).aktifId === 's');
    t('onar: eksik yetki anahtarı role göre dolar', ekipOnar({ kisiler: [sahip, { ...bakici, yetkiler: {} as never }], aktifId: 'k' }).kisiler[1].yetkiler.tedavi === true);
    t('onar: bozuk veri', ekipOnar(null).kisiler.length === 1);

    const l = [sahip, bakici];
    t('aynı ad engellenir (büyük/küçük harf)', kisiDogrula(l, { id: 'x', ad: 'mehmet', rol: 'ortak' }) != null);
    t('boş ad engellenir', kisiDogrula(l, { id: 'x', ad: '  ', rol: 'ortak' }) != null);
    t('son sahibin rolü değişmez', kisiDogrula(l, { id: 's', ad: 'Sahip', rol: 'ortak' }) != null);
    t('ikinci sahip varken rol değişir', kisiDogrula([...l, kisi({ id: 's2', ad: 'Eş', rol: 'sahip' })], { id: 's', ad: 'Sahip', rol: 'ortak' }) === null);
    t('son sahip silinemez, aktif kişi silinemez', kisiSilinebilir(l, 's', 'k') != null && kisiSilinebilir(l, 'k', 'k') != null && kisiSilinebilir(l, 'k', 's') === null);

    t('PIN 4–6 rakam', pinGecerli('1234') && pinGecerli('123456') && !pinGecerli('12') && !pinGecerli('12a4'));
    const oz = pinOzeti('1234', 's');
    t('PIN özeti kişiye tuzlu, düz metin saklanmaz', oz !== pinOzeti('1234', 'k') && !oz.includes('1234') && oz.length === 8);
    t('PIN doğrulama', pinDogru({ id: 's', pinOzet: oz }, '1234') && !pinDogru({ id: 's', pinOzet: oz }, '0000') && pinDogru({ id: 'k' }, ''));
    t('yetki mesajı kişi ve yetkiyi söyler', yetkiMesaji('finans', bakici).includes('Mehmet') && yetkiMesaji('finans', bakici).includes('Bakıcı'));

    // kapı: denetleyici bağlanınca veri katmanı korumaları
    let aktif: Kisi = bakici;
    setYetkiDenetleyici((y) => (yetkiVar(aktif, y) ? null : yetkiMesaji(y, aktif)));
    let atti = false;
    try {
      yetkiGerekli('silme');
    } catch {
      atti = true;
    }
    t('kapı: bakıcı silemez (hata)', atti && yetkiEngeli('finans') != null && yetkiEngeli('tedavi') === null);
    aktif = sahip;
    t('kapı: sahibe geçince serbest', yetkiEngeli('silme') === null);
    setYetkiDenetleyici(() => null);
    return r;
  },
};
