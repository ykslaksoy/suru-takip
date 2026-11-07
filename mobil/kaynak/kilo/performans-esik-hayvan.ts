import type { Animal, WeightRecord } from '@/kaynak/cekirdek/tipler';
import { adgHesapla } from '@/kaynak/kilo/adg';
import { hesaplaFcrSonuc } from '@/kaynak/kilo/fcr-hesap';
import { getPerformansEsikDepo } from '@/kaynak/kilo/performans-esik-depo';
import {
  aktifEsikOzet,
  cozumlePerformansEsikleri,
  type CozulmusPerformansEsik,
} from '@/kaynak/kilo/performans-esik-oncelik';
import {
  performansEsikFcrBaslik,
  performansEsikFcrDegerlendir,
  performansEsikGcaaBaslik,
  performansEsikGcaaDegerlendir,
  performansEsikUyumBaskiNedeni,
} from '@/kaynak/kilo/performans-esik-degerlendir';
import { inferRationPhase } from '@/kaynak/rasyon/hayvan-plani';
import { gozlemPadokMu } from '@/kaynak/suru/padok';

export type HayvanPerformansEsikOzeti = {
  aktifEsik: string;
  cozulmus: CozulmusPerformansEsik;
  uyumBaski: string | null;
  gcaa: ReturnType<typeof performansEsikGcaaDegerlendir>;
  fcr: ReturnType<typeof performansEsikFcrDegerlendir>;
  uyariBaslik: string | null;
  uyariGovde: string | null;
};

export async function hayvanPerformansEsikOzeti(
  animal: Animal,
  records: WeightRecord[],
  opts?: { karantinaPadok?: boolean },
): Promise<HayvanPerformansEsikOzeti> {
  const depo = await getPerformansEsikDepo();
  const faz = inferRationPhase(animal);
  const cozulmus = cozumlePerformansEsikleri(depo, animal.paddock ?? '', faz);
  const uyumBaski = performansEsikUyumBaskiNedeni({
    gozlemPadok: gozlemPadokMu(animal.paddock),
    karantinaPadok: opts?.karantinaPadok === true,
  });

  const adg = adgHesapla(records);
  const fcr = await hesaplaFcrSonuc(animal, records);

  const gcaa =
    uyumBaski != null
      ? ({ sonuc: 'yetersiz_veri', neden: uyumBaski } as const)
      : performansEsikGcaaDegerlendir(adg, cozulmus);
  const fcrD =
    uyumBaski != null
      ? ({ sonuc: 'yetersiz_veri', neden: uyumBaski } as const)
      : performansEsikFcrDegerlendir(fcr, cozulmus);

  const gcaaBaslik = uyumBaski ? null : performansEsikGcaaBaslik(gcaa);
  const fcrBaslik = uyumBaski ? null : performansEsikFcrBaslik(fcrD);
  const uyariBaslik = gcaaBaslik ?? fcrBaslik ?? null;

  let uyariGovde: string | null = null;
  if (gcaa.sonuc === 'hedef_alti') {
    uyariGovde = `Kaynak: ${gcaa.kaynak}. Kontrol listesi (tanı değil): ${gcaa.kontrolListesi.join(' ')}`;
  } else if (fcrD.sonuc === 'hedef_ustu') {
    uyariGovde = `Kaynak: ${fcrD.kaynak}. Kontrol listesi (tanı değil): ${fcrD.kontrolListesi.join(' ')}`;
  }

  return {
    aktifEsik: aktifEsikOzet(cozulmus),
    cozulmus,
    uyumBaski,
    gcaa,
    fcr: fcrD,
    uyariBaslik,
    uyariGovde,
  };
}
