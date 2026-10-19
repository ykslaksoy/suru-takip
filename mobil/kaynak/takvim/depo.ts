import { getAllHealthRecordsForAsi, getAllWeightRecords, getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { getAktifArinmalar } from '@/kaynak/arinma/depo';
import { getPoliceler } from '@/kaynak/sigorta/depo';
import { getGorevler } from '@/kaynak/gorevler/liste';
import {
  arinmaOlaylari,
  gorevOlaylari,
  olaylariBirlestir,
  saglikOlaylari,
  sigortaOlaylari,
  tartimOlaylari,
  type TakvimOlay,
} from './hesap';

type Kaynak = () => Promise<TakvimOlay[]>;
const ekKaynaklar: Kaynak[] = [];

/** Diğer modüller (ör. üreme) takvime olay ekler */
export function takvimKaynagiEkle(k: Kaynak): void {
  ekKaynaklar.push(k);
}

export async function getTakvimOlaylari(): Promise<TakvimOlay[]> {
  const [hayvanlar, saglik, tartim, arinma, policeler, gorevler, ...ek] = await Promise.all([
    getAnimals(),
    getAllHealthRecordsForAsi().catch(() => []),
    getAllWeightRecords().catch(() => []),
    getAktifArinmalar().catch(() => []),
    getPoliceler().catch(() => []),
    getGorevler().catch(() => []),
    ...ekKaynaklar.map((k) => k().catch(() => [] as TakvimOlay[])),
  ]);
  const m = new Map(hayvanlar.map((a) => [a.id, a]));
  const etiket = (id: string) => {
    const a = m.get(id);
    return a ? hayvanAnaEtiket(a) : 'silinmiş kuzu';
  };
  return olaylariBirlestir(
    saglikOlaylari(saglik, etiket),
    tartimOlaylari(tartim, etiket),
    arinmaOlaylari(arinma, etiket),
    sigortaOlaylari(policeler),
    gorevOlaylari(gorevler),
    ...ek,
  );
}
