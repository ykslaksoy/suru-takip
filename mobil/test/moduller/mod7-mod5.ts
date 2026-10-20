import { ONERILEN_PLANLAR } from '@/kaynak/gorevler/saglik-plani-paketleri';
import { onerilenPlanAcikMiSync } from '@/kaynak/gorevler/saglik-plani-mod';
import { MOD5_ADIMLAR } from '@/kaynak/sut-besi/adim-kilidi';
import { MOD7_ADIMLAR } from '@/kaynak/sut-etc/adim-kilidi';
import { besiYolundaMi, satinAlinanKuzuMu, type KuzuYonHedef } from '@/kaynak/kuzu-hedef-sabit';
import { hayvanSuruKoluSync } from '@/kaynak/suru-kolu';
import { getMod, aktifModaCoz } from '@/sabitler/ModlarSabit';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { test, type TestModul } from '../cerceve';

const ornekKuzu: Animal = {
  id: 'k1',
  earTag: '1',
  turkvetNo: '',
  name: '',
  breed: '',
  species: 'sheep',
  sex: 'male',
  birthDate: new Date().toISOString(),
  paddock: 'Besi',
  status: 'healthy',
  motherId: null,
  gehisId: null,
  sirtNo: null,
  modId: 'mod5',
  notes: 'satın alım',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  syncStatus: 'synced',
};

export const mod7Mod5Modul: TestModul = {
  grup: 'Mod 5 düzeltme · Mod 7',
  calistir() {
    const m5 = getMod('mod5');
    const m7 = getMod('mod7');
    const plan5 = ONERILEN_PLANLAR.mod5;
    const plan7 = ONERILEN_PLANLAR.mod7;
    const hedef: Record<string, KuzuYonHedef> = {};
    return [
      test('Mod 5', 'Açıklama satın alım besi', m5.aciklama.includes('satın alınan')),
      test('Mod 5', 'Damızlık/besi adımı var', MOD5_ADIMLAR.some((a) => a.id === 'damizlik-besi')),
      test('Mod 5', 'Kuzu alım adımı var', MOD5_ADIMLAR.some((a) => a.id === 'kuzu-alim')),
      test(
        'Mod 5',
        'Süt + giriş besi paketi',
        plan5.asi.includes('agalaksi') &&
          plan5.parazit.includes('ivermektin') &&
          plan5.vitamin.includes('selen-e'),
      ),
      test('Mod 7', 'Hazır tam', m7.hazir && m7.seviye === 'tam' && m7.no === 7),
      test('Mod 7', 'Önerilen plan açık', onerilenPlanAcikMiSync('mod7')),
      test(
        'Mod 7',
        'Süt + etçi sağlık paketi',
        plan7.asi.includes('ektima') && plan7.asi.includes('brusella'),
      ),
      test('Mod 7', 'Kol etiket adımı', MOD7_ADIMLAR[0].id === 'kol-etiket'),
      test('Mod 7', 'aktifModaCoz', aktifModaCoz('mod7') === 'mod7'),
      test('Besi yolu', 'Satın alım tespiti', satinAlinanKuzuMu(ornekKuzu)),
      test('Besi yolu', 'Besi yolunda', besiYolundaMi(ornekKuzu, hedef)),
      test(
        'Sürü kolu',
        'Padok süt',
        hayvanSuruKoluSync(
          { ...ornekKuzu, paddock: 'Süt padok', notes: '' },
          { 'Süt padok': 'sut' },
          {},
        ) === 'sut',
      ),
    ];
  },
};
