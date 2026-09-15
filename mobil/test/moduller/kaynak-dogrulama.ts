import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestModul } from '../cerceve';

const KOK = join(__dirname, '..', '..');

function oku(yol: string): string {
  return readFileSync(join(KOK, yol), 'utf8');
}

export const kaynakModul: TestModul = {
  grup: 'Kaynak dosya bütünlüğü',
  calistir() {
    const dosyalar = [
      'kaynak/akilli-veteriner/hizli-besi-plani.ts',
      'kaynak/cekirdek/padok-kuzu-kayitlar.ts',
      'kaynak/ureme/dogum-kayit.ts',
      'kaynak/excel/disa-aktar.ts',
      'kaynak/gorevler/liste.ts',
      'sabitler/Ortam.ts',
      'sabitler/OzellikBayraklari.ts',
      'sabitler/YasalMetinler.ts',
      'app.json',
      'assets/home-locked/mascot-lamb.png',
      'sabitler/HizliIslemler.ts',
    ];
    const plan = oku('kaynak/akilli-veteriner/hizli-besi-plani.ts');
    const banner = oku('bilesenler/ortak/CevrimdisiBanner.tsx');
    const dogum = oku('kaynak/ureme/dogum-kayit.ts');
    const disa = oku('kaynak/excel/disa-aktar.ts');

    return [
      ...dosyalar.map((d) =>
        test('Kaynak dosya bütünlüğü', `Dosya var: ${d}`, existsSync(join(KOK, d))),
      ),
      test(
        'Kaynak dosya bütünlüğü',
        'Plan v14.2 kaynakta',
        plan.includes("HIZLI_BESI_PLAN_SURUM = 'v14.2'"),
      ),
      test(
        'Kaynak dosya bütünlüğü',
        'Banner otomatik bulut senkron iddiası yok',
        !banner.includes('İnternet gelince otomatik senkron'),
      ),
      test(
        'Kaynak dosya bütünlüğü',
        'Doğum kaydı anne UUID bağlar',
        dogum.includes('motherId: anne.id'),
      ),
      test(
        'Kaynak dosya bütünlüğü',
        'Özet CSV export var',
        disa.includes('suruOzetCsv'),
      ),
      test(
        'Kaynak dosya bütünlüğü',
        'eas.json veya app.json bundle',
        existsSync(join(KOK, 'eas.json')) || oku('app.json').includes('bundleIdentifier'),
      ),
    ];
  },
};
