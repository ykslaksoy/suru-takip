export {
  BASKUL_ADAPTOR_TANIMLI,
  baskulBaglan,
  baskulBaglantiyiKes,
  baskulBaglantiNesli,
  baskulBagliMi,
  baskulDurum,
  baskulDurumDinle,
  baskulDurumEtiket,
  baskulOlcumBeklemeyeAl,
  baskulOrtamDestekliyorMu,
  baskulOturumuSifirla,
  baskulSonHata,
  type BaskulDurum,
} from './durum';
export {
  baskulAdaptorDurumuMetni,
  baskulBagliykenKayitAcilir,
  baskulDestekSecenekleri,
  baskulOrtamAlgila,
  type BaskulOrtam,
} from './rehber';
export {
  baskulOlcumuGecerliMi,
  ciftOlcumEventiMi,
  tartimYontemDegisinceKiloSifirla,
  yeniBaskulOturumNesli,
  type BaskulOturumNesli,
  type BekleyenBaskulOlcumu,
} from './olcum-dogrulama';
import { baskulBagliMi } from './durum';

/** Eski API — bağlı ve ölçüm hazır */
export function baskulBaglantiVarMi(): boolean {
  return baskulBagliMi();
}
