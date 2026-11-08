import { test, type TestModul } from '../cerceve';
import {
  VARSAYILAN_ALIS_CANLI_KG_FIYAT,
  alisBasCanliKgden,
  cozPlanAlisBas,
  sayiPlanAlis,
  yeniPlanVarsayilanAlisKgFiyat,
} from '@/kaynak/maliyet/besi-plan-alis';

const g = 'Besi plan alış varsayımı';

export const besiPlanAlisModul: TestModul = {
  grup: g,
  calistir() {
    const parti = {
      parti: 'A',
      bas: 10,
      alis: 100000,
      yem: 0,
      ilac: 0,
      sigorta: 0,
      toplam: 100000,
      tahminiAlisBas: 0,
      eksikAlisBas: 0,
    };

    return [
      test(g, 'Yeni plan varsayılan 500 ₺/kg', yeniPlanVarsayilanAlisKgFiyat() === 500),
      test(g, '25 kg × 500 = 12.500 ₺/baş', alisBasCanliKgden(500, 25) === 12500),
      test(g, 'Eski 480×25 varsayılan değil', VARSAYILAN_ALIS_CANLI_KG_FIYAT !== 480),
      test(g, 'Türkçe virgül', sayiPlanAlis('500,5') === 500.5),
      test(g, 'Boş sıfır sayılmaz', sayiPlanAlis('') === null && sayiPlanAlis('0') === null),
      test(
        g,
        'Kg varsayımı',
        cozPlanAlisBas({ alisBasFiyat: null, alisCanliKgFiyat: 500, girisKg: 25, gercekParti: null }).alisBas === 12500,
      ),
      test(
        g,
        '₺/baş override öncelik',
        cozPlanAlisBas({ alisBasFiyat: 12000, alisCanliKgFiyat: 500, girisKg: 25, gercekParti: null }).alisBas === 12000,
      ),
      test(
        g,
        'Gerçek parti öncelik',
        cozPlanAlisBas({ alisBasFiyat: 12000, alisCanliKgFiyat: 500, girisKg: 25, gercekParti: parti }).alisBas === 10000,
      ),
      test(
        g,
        'Eksik kg',
        cozPlanAlisBas({ alisBasFiyat: null, alisCanliKgFiyat: 500, girisKg: null, gercekParti: null }).alisBas === null,
      ),
    ];
  },
};
