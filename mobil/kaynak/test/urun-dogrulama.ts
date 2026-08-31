/**
 * Uygulama içi sistem kontrolü — kaynak-dogrulama hariç tüm mantık testleri.
 */
import { calistirTestModulleri, type TestRapor } from '@/test/cerceve';
import { hizliBesiModul } from '@/test/moduller/hizli-besi';
import { padokModul } from '@/test/moduller/padok';
import { gorevlerModul } from '@/test/moduller/gorevler';
import { dozModul } from '@/test/moduller/doz';
import { ortamModul } from '@/test/moduller/ortam';
import { modlarModul } from '@/test/moduller/modlar';
import { ozellikModul } from '@/test/moduller/ozellik-bayraklari';
import { abonelikModul } from '@/test/moduller/abonelik';
import { senkronModul } from '@/test/moduller/senkron';
import { yasalModul } from '@/test/moduller/yasal';

const UYGULAMA_MODULLERI = [
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
];

export async function calistirUrunDogrulama(): Promise<TestRapor> {
  return calistirTestModulleri(UYGULAMA_MODULLERI);
}

export type { TestRapor, TestSonuc } from '@/test/cerceve';
