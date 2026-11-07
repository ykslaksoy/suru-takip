/**
 * Gözlem incelemede grup bölünmesi — saf doğrulama ve kayıt mantığı.
 * Konumdan otomatik besi/klinik planı çıkarılmaz.
 */
import type {
  UyumBeslemeKayit,
  UyumIncelemeKararTipi,
  UyumIncelemeKarari,
} from './uyum-besleme';
import { uyumBitisTarihi } from './uyum-besleme';

export type UyumBolmeKolu = {
  karar: UyumIncelemeKararTipi;
  hayvanIds: string[];
  hedefPadok?: string;
  sonrakiInceleme?: string;
  supheNotu?: string;
};

export type UyumTasimaSonucu = {
  animalId: string;
  ok: boolean;
  atlandi?: boolean;
  message: string;
};

export type UyumIncelemeOturumu = {
  id: string;
  zaman: string;
  neden: string;
  kollar: UyumBolmeKolu[];
  /** Bu oturumda bilinçli olarak taşınmayan / gözlemde kalan */
  degismeyenHayvanIds: string[];
  /** Kısmi kalınca padok inceleme tarihi */
  padokSonrakiInceleme?: string;
  tasimaSonuclari?: UyumTasimaSonucu[];
};

export type HayvanUyumTakipSatir = {
  sonKarar: UyumIncelemeKararTipi;
  oturumId: string;
  uyumKayitId: string;
  hedefPadok?: string;
  sonrakiInceleme?: string;
  zaman: string;
};

export type PadokKapasiteGirdi = {
  ad: string;
  kapasite: number;
  karantina: boolean;
  mevcutHayvan: number;
};

export type BolmeOzetSatir = {
  karar: UyumIncelemeKararTipi | 'degismeyen';
  adet: number;
  hayvanIds: string[];
  hedefPadok?: string;
  sonrakiInceleme?: string;
};

export function oturumKollarindakiHayvanlar(kollar: UyumBolmeKolu[]): string[] {
  return kollar.flatMap((k) => k.hayvanIds);
}

export function bolmeCiftSecimVar(kollar: UyumBolmeKolu[]): string | null {
  const seen = new Set<string>();
  for (const id of oturumKollarindakiHayvanlar(kollar)) {
    if (seen.has(id)) return 'Aynı hayvan birden fazla kola seçilemez';
    seen.add(id);
  }
  return null;
}

export function padokKapasiteYeterli(g: PadokKapasiteGirdi, eklenecek: number): string | null {
  if (eklenecek <= 0) return null;
  if (!g.ad.trim()) return 'Hedef padok yok';
  if (g.kapasite < 1) return 'Padok kapasitesi geçersiz';
  const bos = g.kapasite - g.mevcutHayvan;
  if (eklenecek > bos) {
    return `${g.ad}: kapasite yetersiz (${bos} boş, ${eklenecek} isteniyor)`;
  }
  return null;
}

export type UyumBolmeGirdi = {
  neden: string;
  kollar: UyumBolmeKolu[];
  padokHayvanIds: string[];
  padokSonrakiInceleme?: string;
  padoklar: PadokKapasiteGirdi[];
};

export function uyumBolmeDogrula(g: UyumBolmeGirdi): string | null {
  if (!g.neden?.trim()) return 'Gerekçe zorunlu';
  const cift = bolmeCiftSecimVar(g.kollar);
  if (cift) return cift;

  const padokSet = new Set(g.padokHayvanIds);
  for (const kol of g.kollar) {
    for (const id of kol.hayvanIds) {
      if (!padokSet.has(id)) return 'Seçim güncel değil — hayvan artık bu padokta değil';
    }
  }

  const atanmis = new Set(oturumKollarindakiHayvanlar(g.kollar));
  const kalan = g.padokHayvanIds.filter((id) => !atanmis.has(id));

  const toplamAtama = atanmis.size;
  if (toplamAtama === 0 && !g.padokSonrakiInceleme?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return 'Hiç hayvan seçilmedi — ya kolları doldurun ya da padok inceleme tarihi girin';
  }

  if (kalan.length > 0 && !g.padokSonrakiInceleme?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const uzatKol = g.kollar.some((k) => k.karar === 'gozlem_uzat' && k.hayvanIds.length > 0);
    if (!uzatKol) return `${kalan.length} hayvan gözlemde kalıyor — padok inceleme tarihi veya gözlem uzatması zorunlu`;
  }

  for (const kol of g.kollar) {
    if (!kol.hayvanIds.length) continue;
    if (kol.karar === 'gozlem_uzat') {
      if (!kol.sonrakiInceleme?.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return 'Gözlem uzatması için inceleme tarihi (YYYY-MM-DD)';
      }
    }
    if (kol.karar === 'besiye_gecis') {
      if (!kol.hedefPadok?.trim()) return 'Besiye geçiş hedef padoku seçin';
      const hedef = g.padoklar.find((p) => p.ad === kol.hedefPadok);
      if (!hedef) return `Hedef padok bulunamadı: ${kol.hedefPadok}`;
      if (hedef.karantina) return 'Besiye geçiş karantina padokuna yapılamaz';
      const kap = padokKapasiteYeterli(hedef, kol.hayvanIds.length);
      if (kap) return kap;
    }
    if (kol.karar === 'karantina_suphe') {
      if (!kol.supheNotu?.trim()) return 'Karantina şüphe notu — teşhis değil';
      if (!kol.hedefPadok?.trim()) return 'Karantina hedef padoku seçin';
      const hedef = g.padoklar.find((p) => p.ad === kol.hedefPadok);
      if (!hedef) return `Karantina padoku yok: ${kol.hedefPadok}`;
      if (!hedef.karantina) return 'Hedef padok karantina olarak işaretli değil';
      const kap = padokKapasiteYeterli(hedef, kol.hayvanIds.length);
      if (kap) return kap;
    }
  }

  if (g.padokSonrakiInceleme && !g.padokSonrakiInceleme.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return 'Padok inceleme tarihi YYYY-MM-DD';
  }

  return null;
}

export function bolmeOzetHesapla(g: UyumBolmeGirdi): BolmeOzetSatir[] {
  const atanmis = new Set(oturumKollarindakiHayvanlar(g.kollar));
  const degismeyen = g.padokHayvanIds.filter((id) => !atanmis.has(id));
  const out: BolmeOzetSatir[] = [];

  for (const tip of ['gozlem_uzat', 'besiye_gecis', 'karantina_suphe'] as const) {
    const kollar = g.kollar.filter((k) => k.karar === tip);
    const ids = [...new Set(kollar.flatMap((k) => k.hayvanIds))];
    if (!ids.length) continue;
    out.push({
      karar: tip,
      adet: ids.length,
      hayvanIds: ids,
      hedefPadok: kollar.find((k) => k.hedefPadok)?.hedefPadok,
      sonrakiInceleme: kollar.find((k) => k.sonrakiInceleme)?.sonrakiInceleme,
    });
  }

  if (degismeyen.length) {
    out.push({
      karar: 'degismeyen',
      adet: degismeyen.length,
      hayvanIds: degismeyen,
      sonrakiInceleme: g.padokSonrakiInceleme,
    });
  }
  return out;
}

export function secimGuncelMi(secilen: string[], guncelPadokIds: string[]): boolean {
  const set = new Set(guncelPadokIds);
  return secilen.every((id) => set.has(id));
}

export function idempotentTasimaGerekli(
  animalId: string,
  hedefPadok: string,
  oturumId: string,
  idempotansi: UyumBeslemeKayit['tasimaIdempotansi'],
  suAnkiPadok?: string,
): boolean {
  const kayit = idempotansi?.[animalId];
  if (kayit?.oturumId === oturumId && kayit.hedefPadok === hedefPadok) return false;
  if (suAnkiPadok === hedefPadok) return false;
  return true;
}

export function sonIncelemeOturumu(kayit: UyumBeslemeKayit): UyumIncelemeOturumu | null {
  const liste = kayit.incelemeOturumlari ?? [];
  if (!liste.length) return null;
  const taban = uyumBitisTarihi(kayit.baslangic, kayit.gunSayisi);
  const uygun = liste.filter((o) => o.zaman.slice(0, 10) >= taban);
  if (!uygun.length) return null;
  return uygun.sort((a, b) => b.zaman.localeCompare(a.zaman))[0]!;
}

export function uyumBolmeKaydaUygula(
  kayit: UyumBeslemeKayit,
  oturum: UyumIncelemeOturumu,
  g: UyumBolmeGirdi,
): UyumBeslemeKayit {
  const hata = uyumBolmeDogrula(g);
  if (hata) throw new Error(hata);

  const atanmis = new Set(oturumKollarindakiHayvanlar(g.kollar));
  const degismeyen = g.padokHayvanIds.filter((id) => !atanmis.has(id));
  const tamOturum: UyumIncelemeOturumu = {
    ...oturum,
    kollar: g.kollar,
    degismeyenHayvanIds: degismeyen,
    padokSonrakiInceleme: g.padokSonrakiInceleme,
  };

  let uzatmaBitis = kayit.uzatmaBitis;
  const tarihler: string[] = [];
  if (g.padokSonrakiInceleme) tarihler.push(g.padokSonrakiInceleme);
  for (const kol of g.kollar) {
    if (kol.sonrakiInceleme) tarihler.push(kol.sonrakiInceleme);
  }
  if (tarihler.length) {
    uzatmaBitis = tarihler.sort((a, b) => b.localeCompare(a))[0];
  }

  const hayvanTakip = { ...(kayit.hayvanUyumTakibi ?? {}) };
  const zaman = tamOturum.zaman;
  for (const kol of g.kollar) {
    for (const animalId of kol.hayvanIds) {
      hayvanTakip[animalId] = {
        sonKarar: kol.karar,
        oturumId: tamOturum.id,
        uyumKayitId: kayit.id,
        hedefPadok: kol.hedefPadok,
        sonrakiInceleme: kol.sonrakiInceleme ?? g.padokSonrakiInceleme,
        zaman,
      };
    }
  }
  for (const animalId of degismeyen) {
    hayvanTakip[animalId] = {
      sonKarar: 'gozlem_uzat',
      oturumId: tamOturum.id,
      uyumKayitId: kayit.id,
      sonrakiInceleme: g.padokSonrakiInceleme ?? uzatmaBitis,
      zaman,
    };
  }

  const kararlar: UyumIncelemeKarari[] = [...(kayit.incelemeKararlari ?? [])];
  for (const kol of g.kollar) {
    if (!kol.hayvanIds.length) continue;
    kararlar.push({
      id: `${tamOturum.id}-${kol.karar}`,
      zaman: tamOturum.zaman,
      karar: kol.karar,
      neden: g.neden.trim(),
      sonrakiInceleme: kol.sonrakiInceleme,
      hayvanIds: [...kol.hayvanIds],
      supheNotu: kol.supheNotu,
      hedefPadok: kol.hedefPadok,
      oturumId: tamOturum.id,
    });
  }

  const besiyeVar = g.kollar.some((k) => k.karar === 'besiye_gecis' && k.hayvanIds.length);
  const karantinaVar = g.kollar.some((k) => k.karar === 'karantina_suphe' && k.hayvanIds.length);

  void karantinaVar;

  return {
    ...kayit,
    incelemeOturumlari: [...(kayit.incelemeOturumlari ?? []), tamOturum],
    incelemeKararlari: kararlar,
    uzatmaBitis,
    besiyeGecisOnay: besiyeVar ? true : kayit.besiyeGecisOnay,
    incelemeOnay: true,
    hayvanUyumTakibi: hayvanTakip,
    gozlem: {
      ...kayit.gozlem,
      onayZaman: zaman,
    },
  };
}

export function bolmeKismiHataMesaji(sonuclar: UyumTasimaSonucu[]): string | null {
  const basarisiz = sonuclar.filter((s) => !s.ok && !s.atlandi);
  if (!basarisiz.length) return null;
  return `Kısmi hata: ${basarisiz.map((s) => s.message).join('; ')} — başarılı taşımalar kayıtlı, yeniden deneyin (çoğaltma yok).`;
}
