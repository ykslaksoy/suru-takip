import { getAllHealthRecordsForAsi, getAllWeightRecords, getAnimals } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { getAktifArinmalar } from '@/kaynak/arinma/depo';
import { getPoliceler } from '@/kaynak/sigorta/depo';
import { getGorevler } from '@/kaynak/gorevler/liste';
import { getYemOzeti } from '@/kaynak/yem/depo';
import { yemBitisOlaylari } from '@/kaynak/yem/hesap';
import { yerelGun } from '@/kaynak/arinma/depo';
import { getCiftlesmeler } from '@/kaynak/ciftlesme/depo';
import { grupla, hatirlatmalar, HATIRLATMA_ETIKET } from '@/kaynak/ciftlesme/hesap';
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
  const [hayvanlar, saglik, tartim, arinma, policeler, gorevler, yem, ciftlesme, ...ek] = await Promise.all([
    getAnimals(),
    getAllHealthRecordsForAsi().catch(() => []),
    getAllWeightRecords().catch(() => []),
    getAktifArinmalar().catch(() => []),
    getPoliceler().catch(() => []),
    getGorevler().catch(() => []),
    getYemOzeti().catch(() => null),
    getCiftlesmeler().catch(() => []),
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
    yem ? yemBitisOlaylari(yem.durumlar, yerelGun()) : [],
    grupla(hatirlatmalar(ciftlesme, yerelGun())).map((g) => ({
      id: `ureme-${g.tur}-${g.tarih}`,
      tarih: g.tarih,
      tur: 'ureme' as const,
      baslik: `${HATIRLATMA_ETIKET[g.tur]} · ${g.koyunIds.length === 1 ? etiket(g.koyunIds[0]) : `${g.koyunIds.length} koyun`}`,
      href: g.tur === 'ultrason' ? '/ciftlesme/ultrason' : '/ciftlesme',
      adet: g.koyunIds.length,
    })),
    ...ek,
  );
}
