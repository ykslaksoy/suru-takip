/**
 * Tüm ürün doğrulama testleri — Node: npx tsx test/index.ts
 */
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

import { calistirTestModulleri, raporYaz } from './cerceve';
import { hizliBesiModul } from './moduller/hizli-besi';
import { gun1SecimModul } from './moduller/gun1-secim';
import { padokModul } from './moduller/padok';
import { gorevlerModul } from './moduller/gorevler';
import { dozModul } from './moduller/doz';
import { ortamModul } from './moduller/ortam';
import { modlarModul } from './moduller/modlar';
import { ozellikModul } from './moduller/ozellik-bayraklari';
import { abonelikModul } from './moduller/abonelik';
import { senkronModul } from './moduller/senkron';
import { yasalModul } from './moduller/yasal';
import { kaynakModul } from './moduller/kaynak-dogrulama';
import { superAgilModul } from './moduller/super-agil';
import { uremeModul } from './moduller/ureme';
import { anaSayfaKilitModul } from './moduller/ana-sayfa-kilit';
import { hizliKuzuModul } from './moduller/hizli-kuzu';
import { profesyonellikModul } from './moduller/profesyonellik';
import { topluModul } from './moduller/toplu';
import { planTakvimModul } from './moduller/plan-takvim';
import { hizliTartimModul } from './moduller/hizli-tartim';
import { stokEslesmeModul } from './moduller/stok-eslesme';
import { maliyetModul } from './moduller/maliyet';
import { zamanCizelgesiModul } from './moduller/zaman-cizelgesi';
import { kuzuDereceModul } from './moduller/kuzu-derece';
import { besiCinsiyetModul } from './moduller/besi-cinsiyet';
import { tahminiFiyatModul } from './moduller/tahmini-fiyat';
import { asiTabancasiModul } from './moduller/asi-tabancasi';
import { sigortaModul } from './moduller/sigorta';
import { sayimModul } from './moduller/sayim';
import { arinmaModul } from './moduller/arinma';
import { sablonModul } from './moduller/sablon';
import { takvimModul } from './moduller/takvim';
import { geriDonusumModul } from './moduller/geri-donusum';
import { excelModul } from './moduller/excel';
import { yemModul } from './moduller/yem';
import { ekipModul } from './moduller/ekip';
import { galeriModul } from './moduller/galeri';
import { soyModul } from './moduller/soy';
import { ciftlesmeModul } from './moduller/ciftlesme';

const MODULLER = [
  hizliBesiModul,
  gun1SecimModul,
  padokModul,
  gorevlerModul,
  dozModul,
  ortamModul,
  modlarModul,
  ozellikModul,
  abonelikModul,
  senkronModul,
  yasalModul,
  kaynakModul,
  superAgilModul,
  uremeModul,
  anaSayfaKilitModul,
  hizliKuzuModul,
  profesyonellikModul,
  topluModul,
  planTakvimModul,
  hizliTartimModul,
  stokEslesmeModul,
  maliyetModul,
  zamanCizelgesiModul,
  kuzuDereceModul,
  besiCinsiyetModul,
  tahminiFiyatModul,
  asiTabancasiModul,
  sigortaModul,
  sayimModul,
  arinmaModul,
  sablonModul,
  takvimModul,
  geriDonusumModul,
  excelModul,
  yemModul,
  ekipModul,
  galeriModul,
  soyModul,
  ciftlesmeModul,
];

async function main() {
  console.log('SürüYön ürün doğrulama testleri\n');
  const rapor = await calistirTestModulleri(MODULLER);
  raporYaz(rapor);
  if (rapor.kaldi > 0) process.exit(1);
}

main();
