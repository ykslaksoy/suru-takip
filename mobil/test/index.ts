/**
 * Tüm ürün doğrulama testleri — Node: npx tsx test/index.ts
 */
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

import { calistirTestModulleri, raporYaz } from './cerceve';
import { hizliBesiModul } from './moduller/hizli-besi';
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

const MODULLER = [
  hizliBesiModul,
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
];

async function main() {
  console.log('SürüYön ürün doğrulama testleri\n');
  const rapor = await calistirTestModulleri(MODULLER);
  raporYaz(rapor);
  if (rapor.kaldi > 0) process.exit(1);
}

main();
