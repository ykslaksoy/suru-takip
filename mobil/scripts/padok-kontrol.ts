/** Padok tutarlılık — npm run test:padok veya tam paket: npm run test */
import { calistirTestModulleri, raporYaz } from '../test/cerceve';
import { padokModul } from '../test/moduller/padok';
import { hizliBesiModul } from '../test/moduller/hizli-besi';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

async function main() {
  const rapor = await calistirTestModulleri([hizliBesiModul, padokModul]);
  raporYaz(rapor);
  if (rapor.kaldi > 0) process.exit(1);
}

main();
