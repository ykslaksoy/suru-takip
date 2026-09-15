/**
 * Kabul sonrası: satış ufkuna kadar aşı + yem planı (stub değil).
 */

import { v4 as uuidv4 } from 'uuid';
import type { Animal, AnimalModId, AnimalSex } from '@/kaynak/cekirdek/tipler';
import { getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { olusturModTakviyePlani } from '@/kaynak/akilli-veteriner/mod-takviye';
import {
  BESI_PLAN_TAVAN_GUN,
  BESI_SATIS_UFUK_GUN,
  HIZLI_BESI_TAKVIM,
  HIZLI_BESI_YEM_TAKVIM,
  asiGorunumBaslik,
  gunEtiket,
} from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { upsertRationPlanFromWeight } from '@/kaynak/rasyon/hayvan-plani';
import { GOZLEM_PADOK_AD, addPadok, getPadokByAd } from '@/kaynak/suru/padok';
import { yemPlaniHayvanlaraEkle } from '@/kaynak/gorevler/yem-gorev';
import {
  TOPLU_KABUL_MAX_ADET,
  aralikAdet,
  aralikEtiketleri,
  kupeAralikAyikla,
  otomatikKupeSerisi,
  type KupeAralik,
} from '@/kaynak/suru/kupe-aralik';
import { getAktifModId } from '@/sabitler/Modlar';

export {
  TOPLU_KABUL_MAX_ADET,
  aralikAdet,
  aralikEtiketleri,
  kupeAralikAyikla,
  onekMaxNumara,
  onerilenBaslangicNo,
  otomatikKupeSerisi,
  type KupeAralik,
} from '@/kaynak/suru/kupe-aralik';

/** Yeni kabul için önerilen hedef padok */
export const VARSAYILAN_KABUL_PADOK = GOZLEM_PADOK_AD;

/**
 * Kuzu besiciliği ürün kuralı: varsayılan cinsiyet erkek.
 * Kullanıcı dişi seçtiyse asla zorla erkek yapma.
 */
export const VARSAYILAN_KABUL_CINSIYET: AnimalSex = 'male';

/** Tipik alım tartım varsayımı (2–3 aylık kuzu) — rasyon başlangıcı */
export const VARSAYILAN_GIRIS_KILO = 25;

export type KabulKaynak =
  | 'cambaz'
  | 'ciftlik'
  | 'pazar'
  | 'agilda_dogum'
  | 'ozel';

/** @deprecated — UI için `@/kaynak/suru/kabul-kaynaklari` KABUL_KAYNAK_SECENEKLER kullanın */
export const KABUL_KAYNAK_ETIKET: Record<KabulKaynak, string> = {
  cambaz: 'Cambaz',
  ciftlik: 'Çiftlik',
  pazar: 'Pazar',
  agilda_dogum: 'Ağılda doğum',
  ozel: 'Özel',
};
export type HizliKuzuGirdi = {
  earTag: string;
  paddock: string;
  sex?: AnimalSex;
  birthDate?: string;
  sirtNo?: string;
  kaynak?: KabulKaynak;
  /** Yapılandırılmış kaynak özeti (Cambaz adı, km, …) */
  kaynakOzet?: string;
};

export type TopluKabulGirdi = {
  paddock: string;
  kaynak: KabulKaynak;
  /** Kaynak detay özeti — notes’a yazılır */
  kaynakOzet?: string;
  sex?: AnimalSex;
  /** Tahmini doğum / alım yaşına göre YYYY-MM-DD */
  birthDate?: string;
  /** Küpe aralığı — varsa hayvan sayısı buradan */
  aralik?: KupeAralik;
  /** Aralık yoksa otomatik küpe ile N adet */
  adet?: number;
  /** Otomatik küpe öneki (aralık yokken) */
  otomatikOnek?: string;
  /** Otomatik sırada kullanıcı başlangıç no (yoksa önek serisi max+1) */
  otomatikBaslangic?: number;
};

export type KabulSonucHayvan = {
  id: string;
  earTag: string;
  paddock: string;
};

export type KabulSonuc = {
  hayvanlar: KabulSonucHayvan[];
  planMesaj: string;
  sonrakiAdimlar: { baslik: string; aciklama: string; href: string }[];
  /** Küpe nasıl seçildi (UI özeti) */
  kupeNeden?: string;
};

function kaynakNotMetni(kaynak: KabulKaynak, ozet?: string): string {
  if (ozet?.trim()) return ozet.trim();
  return `Kaynak: ${KABUL_KAYNAK_ETIKET[kaynak] ?? kaynak}`;
}

async function hayvanKaydet(
  partial: Omit<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'> &
    Partial<Pick<Animal, 'createdAt' | 'updatedAt' | 'syncStatus'>>,
): Promise<Animal> {
  return upsertAnimal(partial);
}

/** Tek hızlı kuzu */
export async function hizliTekKuzuEkle(
  girdi: HizliKuzuGirdi,
  opts?: { modId?: AnimalModId },
): Promise<KabulSonuc> {
  const earTag = girdi.earTag.trim();
  if (!earTag) throw new Error('Kulak küpe numarası gerekli');
  const paddock = girdi.paddock.trim();
  if (!paddock) throw new Error('Padok seçin');

  const modId = opts?.modId ?? ((await getAktifModId()) as AnimalModId);
  const notes = girdi.kaynak
    ? kaynakNotMetni(girdi.kaynak, girdi.kaynakOzet)
    : girdi.kaynakOzet?.trim() ?? '';

  const animal = await hayvanKaydet({
    id: uuidv4(),
    earTag,
    turkvetNo: '',
    gehisId: null,
    sirtNo: girdi.sirtNo?.trim() || null,
    name: '',
    breed: 'Merinos',
    species: 'sheep',
    sex: girdi.sex ?? VARSAYILAN_KABUL_CINSIYET,
    birthDate: girdi.birthDate ?? new Date().toISOString().slice(0, 10),
    paddock,
    status: 'healthy',
    motherId: null,
    modId,
    notes,
  });

  await upsertRationPlanFromWeight(animal, VARSAYILAN_GIRIS_KILO);
  const plan = await olusturModTakviyePlani({ modId });
  await yemPlaniHayvanlaraEkle([animal.id]);
  const sonraki = await rehberGorevleriYaz(1, paddock);

  return {
    hayvanlar: [{ id: animal.id, earTag: animal.earTag, paddock: animal.paddock }],
    planMesaj: `${plan.message} · Yem planı satılana kadar (~${BESI_SATIS_UFUK_GUN}+${BESI_PLAN_TAVAN_GUN - BESI_SATIS_UFUK_GUN}g)`,
    sonrakiAdimlar: sonraki,
  };
}

/** Toplu kabul — aralık veya adet */
export async function topluKuzuKabul(
  girdi: TopluKabulGirdi,
  opts?: { modId?: AnimalModId; limit?: number },
): Promise<KabulSonuc> {
  const paddock = girdi.paddock.trim();
  if (!paddock) throw new Error('Padok seçin');

  let etiketler: string[] = [];
  let kupeNeden = '';
  if (girdi.aralik) {
    const n = aralikAdet(girdi.aralik);
    if (n < 1) throw new Error('Geçersiz küpe aralığı');
    if (n > TOPLU_KABUL_MAX_ADET) {
      throw new Error(`Bir seferde en fazla ${TOPLU_KABUL_MAX_ADET} kuzu`);
    }
    etiketler = aralikEtiketleri(girdi.aralik);
    kupeNeden = `Girdiğiniz aralık ${girdi.aralik.onek}${girdi.aralik.baslangic}–${girdi.aralik.onek}${girdi.aralik.bitis}`;
  } else {
    const adet = Math.floor(girdi.adet ?? 0);
    if (adet < 1) throw new Error('Kaç kuzu geldiğini yazın veya küpe aralığı girin');
    if (adet > TOPLU_KABUL_MAX_ADET) {
      throw new Error(`Bir seferde en fazla ${TOPLU_KABUL_MAX_ADET} kuzu`);
    }
    const onek = (girdi.otomatikOnek ?? 'TR-').trim() || 'TR-';
    const mevcut = await getAnimals();
    const seri = otomatikKupeSerisi({
      onek,
      adet,
      mevcutEarTags: mevcut.map((a) => a.earTag),
      toplamHayvan: mevcut.length,
      baslangic: girdi.otomatikBaslangic,
    });
    etiketler = seri.etiketler;
    kupeNeden = seri.neden;
  }

  const mevcutSayi = (await getAnimals()).length;
  if (opts?.limit != null && mevcutSayi + etiketler.length > opts.limit) {
    throw new Error(`Paket limiti ${opts.limit} hayvan. Önce aboneliği yükseltin.`);
  }

  const mevcutSet = new Set(
    (await getAnimals()).map((a) => a.earTag.trim().toLocaleUpperCase('tr-TR')),
  );
  const cakisma = etiketler.filter((t) => mevcutSet.has(t.trim().toLocaleUpperCase('tr-TR')));
  if (cakisma.length > 0) {
    throw new Error(
      `Bu küpeler zaten kayıtlı: ${cakisma.slice(0, 5).join(', ')}${cakisma.length > 5 ? '…' : ''}. Aralık veya başlangıç no değiştirin.`,
    );
  }

  const modId = opts?.modId ?? ((await getAktifModId()) as AnimalModId);
  const notes = kaynakNotMetni(girdi.kaynak, girdi.kaynakOzet);
  const birthDate = girdi.birthDate ?? new Date().toISOString().slice(0, 10);
  const sex = girdi.sex ?? VARSAYILAN_KABUL_CINSIYET;
  const hayvanlar: KabulSonucHayvan[] = [];
  const ids: string[] = [];

  for (const earTag of etiketler) {
    const animal = await hayvanKaydet({
      id: uuidv4(),
      earTag,
      turkvetNo: '',
      gehisId: null,
      sirtNo: null,
      name: '',
      breed: 'Merinos',
      species: 'sheep',
      sex,
      birthDate,
      paddock,
      status: 'healthy',
      motherId: null,
      modId,
      notes,
    });
    await upsertRationPlanFromWeight(animal, VARSAYILAN_GIRIS_KILO);
    hayvanlar.push({ id: animal.id, earTag: animal.earTag, paddock: animal.paddock });
    ids.push(animal.id);
  }

  const plan = await olusturModTakviyePlani({ modId });
  await yemPlaniHayvanlaraEkle(ids);
  const sonraki = await rehberGorevleriYaz(hayvanlar.length, paddock);

  return {
    hayvanlar,
    planMesaj: `${plan.message} · Yem planı satılana kadar (~${BESI_SATIS_UFUK_GUN}g)`,
    sonrakiAdimlar: sonraki,
    kupeNeden,
  };
}

/** Gözlem padok yoksa oluştur */
export async function ensureGozlemPadok(): Promise<string> {
  const mevcut = await getPadokByAd(GOZLEM_PADOK_AD);
  if (mevcut) return mevcut.ad;
  await addPadok({
    ad: GOZLEM_PADOK_AD,
    kapasite: 100,
    karantina: true,
    not: 'Yeni kabul · gözlem · yonca + su',
  });
  return GOZLEM_PADOK_AD;
}

/**
 * Kabul sonrası saha özeti — tam takvim (satışa kadar), aşı ve yem ayrı.
 * Plan asıl kaynak: mod takviye + yem-gorev; burada kullanıcıya gün gün özet.
 */
async function rehberGorevleriYaz(
  adet: number,
  paddock: string,
): Promise<{ baslik: string; aciklama: string; href: string }[]> {
  const asiGunler = [...new Set(HIZLI_BESI_TAKVIM.filter((t) => t.tip !== 'tartim').map((t) => t.gun))].sort(
    (a, b) => a - b,
  );
  const yemGunler = HIZLI_BESI_YEM_TAKVIM.map((y) => y.gun);

  const sonraki: { baslik: string; aciklama: string; href: string }[] = [
    {
      baslik: `Aşı / ilaç — gün gün (satış ~${BESI_SATIS_UFUK_GUN}g)`,
      aciklama: `${adet} kuzu · ${paddock} · ${asiGunler.map((g) => gunEtiket(g)).join(' → ')}`,
      href: '/gorevler/kategori/asi',
    },
    {
      baslik: `Yem — ayrı liste (satışa kadar)`,
      aciklama: `${HIZLI_BESI_YEM_TAKVIM.length} kontrol · gün ${yemGunler.join(', ')}`,
      href: '/gorevler/kategori/yem',
    },
  ];

  // Gün 1: önce tartı özeti, sonra giriş ilaçları (Türkçe ad (ilaç))
  sonraki.push({
    baslik: 'Alım tartımı',
    aciklama: `${gunEtiket(1)} · sabah önce — dozlar gerçek kiloya göre`,
    href: '/(tabs)/suru',
  });
  const gun1 = HIZLI_BESI_TAKVIM.filter(
    (t) => t.gun === 1 && (t.tip === 'asi' || t.tip === 'parazit'),
  );
  for (const t of gun1) {
    const p = ASI_PROGRAMI.find((x) => x.id === t.programId);
    if (!p) continue;
    sonraki.push({
      baslik: asiGorunumBaslik(p.koruma, p.ad),
      aciklama: `${gunEtiket(1)} · tartı sonrası · ${t.not}`,
      href: `/gorevler/asi/${t.programId}`,
    });
  }

  // Tarım Bakanlığı — etiketli (ekle demeden)
  for (const id of ['ppr', 'cicek', 'sap'] as const) {
    const p = ASI_PROGRAMI.find((x) => x.id === id);
    if (!p) continue;
    sonraki.push({
      baslik: asiGorunumBaslik(p.koruma, p.ad),
      aciklama: `Tarım Bakanlığı · ${p.devletNotu ?? 'resmi program'}`,
      href: `/gorevler/asi/${p.id}`,
    });
  }

  return sonraki;
}
