import { v4 as uuidv4 } from 'uuid';
import type { Animal, AnimalModId, AnimalSex } from '@/kaynak/cekirdek/tipler';
import { getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { addPlanlananGorev } from '@/kaynak/gorevler/planlanan';
import { olusturModTakviyePlani } from '@/kaynak/akilli-veteriner/mod-takviye';
import { HIZLI_BESI_TAKVIM } from '@/kaynak/akilli-veteriner/hizli-besi-plani';
import { upsertRationPlanFromWeight } from '@/kaynak/rasyon/hayvan-plani';
import { GOZLEM_PADOK_AD, addPadok, getPadokByAd } from '@/kaynak/suru/padok';
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
  const sonraki = await rehberGorevleriYaz(1, paddock);

  return {
    hayvanlar: [{ id: animal.id, earTag: animal.earTag, paddock: animal.paddock }],
    planMesaj: plan.message,
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

  // Çakışan küpe var mı?
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
  }

  const plan = await olusturModTakviyePlani({ modId });
  const sonraki = await rehberGorevleriYaz(hayvanlar.length, paddock);

  return {
    hayvanlar,
    planMesaj: plan.message,
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

/** Kabul sonrası saha rehberi — görevler + Tarım Bakanlığı aşıları */
async function rehberGorevleriYaz(
  adet: number,
  paddock: string,
): Promise<{ baslik: string; aciklama: string; href: string }[]> {
  const bugun = new Date();
  const iso = (gun: number) => {
    const d = new Date(bugun);
    d.setDate(d.getDate() + gun);
    return d.toISOString().slice(0, 10);
  };

  const adimlar: { baslik: string; aciklama: string; href: string; tarih: string }[] = [
    {
      baslik: 'Alım tartımı (T1)',
      aciklama: `${adet} kuzu · ${paddock} — 1–2. gün tartın`,
      href: '/seri-giris',
      tarih: iso(1),
    },
    {
      baslik: 'Giriş koruma — aşı / parazit',
      aciklama: HIZLI_BESI_TAKVIM.filter((t) => t.gun === 0)
        .map((t) => t.not)
        .slice(0, 3)
        .join(' · '),
      href: '/(tabs)/veteriner',
      tarih: iso(0),
    },
    {
      baslik: 'Beslenme — kuzu besi rasyonu',
      aciklama: `Günlük yem planı açıldı (~${VARSAYILAN_GIRIS_KILO} kg varsayım). Tartımdan sonra güncelleyin.`,
      href: '/(tabs)/rasyon',
      tarih: iso(0),
    },
  ];

  // Tarım Bakanlığı (devlet) aşıları — kullanıcıya “ekle” demeden etiketle
  for (const id of ['ppr', 'cicek', 'sap'] as const) {
    const p = ASI_PROGRAMI.find((x) => x.id === id);
    if (!p) continue;
    const etiket =
      p.devletNotu?.startsWith('Tarım')
        ? p.devletNotu
        : (p.devletNotu?.replace(/^Devlet/, 'Tarım Bakanlığı') ?? 'Tarım Bakanlığı');
    adimlar.push({
      baslik: `${p.ad} · Tarım Bakanlığı`,
      aciklama: `${p.koruma} — ${etiket}`,
      href: `/gorevler/asi/${p.id}`,
      tarih: iso(7),
    });
  }

  adimlar.push({
    baslik: '15 günlük kontrol tartımı',
    aciklama: 'Sağlık sonrası kilo takibi — satışa kadar tekrarlanır',
    href: '/seri-giris',
    tarih: iso(15),
  });

  for (const a of adimlar) {
    await addPlanlananGorev({
      baslik: a.baslik,
      aciklama: a.aciklama,
      tarih: a.tarih,
      href: a.href,
    });
  }

  return adimlar.map(({ baslik, aciklama, href }) => ({ baslik, aciklama, href }));
}
