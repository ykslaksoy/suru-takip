/** Çiftleşme / doğum — işlemler (koç katımı, ultrason, doğum, silme) */
import { v4 as uuidv4 } from 'uuid';
import { getAnimal, getAnimals, upsertAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { denetimYaz } from '@/kaynak/cekirdek/denetim';
import { copeAt } from '@/kaynak/gecmis/gunluk';
import { yetkiGerekli } from '@/kaynak/ekip/kapi';
import { dogumKaydet, type DogumKayitSonuc } from '@/kaynak/ureme/dogum-kayit';
import type { DogumKayitGirdi } from '@/kaynak/ureme/dogum-dogrula';
import {
  beklenenDogum,
  gorunenler,
  katimDogrula,
  katimKayitlari,
  koyunKaydi,
  trTarih,
  YONTEM_ETIKET,
  type CiftlesmeKaydi,
  type KatimGirdi,
  type UltrasonSonuc,
} from './hesap';
import { ciftlesmeOku, ciftlesmeYaz } from './kayit';

export const bugunYerel = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export async function getCiftlesmeler(): Promise<CiftlesmeKaydi[]> {
  return gorunenler(await ciftlesmeOku());
}

export async function getKoyunCiftlesme(koyunId: string): Promise<CiftlesmeKaydi | null> {
  return koyunKaydi(await ciftlesmeOku(), koyunId);
}

export async function topluKatim(g: KatimGirdi): Promise<{ ok: true; eklenen: number; atlanan: number } | { ok: false; message: string }> {
  yetkiGerekli('duzenleme');
  const bugun = bugunYerel();
  const h = katimDogrula(g, bugun);
  if (h) return { ok: false, message: h };
  const hayvanlar = new Map((await getAnimals()).map((a) => [a.id, a]));
  const koc = g.kocId ? hayvanlar.get(g.kocId) : null;
  if (g.kocId && (!koc || koc.sex !== 'male')) return { ok: false, message: 'Koç bulunamadı' };
  const uygun = g.koyunIds.filter((id) => {
    const a = hayvanlar.get(id);
    return a && a.sex === 'female' && a.status !== 'sold' && a.status !== 'dead';
  });
  if (!uygun.length) return { ok: false, message: 'Seçilen koyunlar uygun değil' };
  const mevcut = await ciftlesmeOku();
  const { kayitlar, atlanan } = katimKayitlari({ ...g, koyunIds: uygun }, mevcut, uuidv4, new Date().toISOString());
  await ciftlesmeYaz([...kayitlar, ...mevcut]);
  if (kayitlar.length) {
    const ilk = kayitlar[0];
    denetimYaz({
      eylem: 'ekleme',
      tablo: 'ureme',
      kayitId: ilk.id,
      ozet: `${YONTEM_ETIKET[g.yontem]} · ${kayitlar.length} koyun${koc ? ` · koç ${hayvanAnaEtiket(koc)}` : ''} · beklenen doğum ${trTarih(beklenenDogum(ilk))}`,
    });
  }
  return { ok: true, eklenen: kayitlar.length, atlanan: atlanan.length + (g.koyunIds.length - uygun.length) };
}

export async function ciftlesmeGuncelle(id: string, yama: Partial<Pick<CiftlesmeKaydi, 'katimTarih' | 'gebelikGun' | 'kocId' | 'not'>>): Promise<void> {
  yetkiGerekli('duzenleme');
  const l = await ciftlesmeOku();
  const k = l.find((x) => x.id === id);
  if (!k) return;
  await ciftlesmeYaz(l.map((x) => (x.id === id ? { ...x, ...yama } : x)));
  const a = await getAnimal(k.koyunId);
  denetimYaz({ eylem: 'guncelleme', tablo: 'ureme', kayitId: id, animalId: k.koyunId, ozet: `Çiftleşme kaydı · ${a ? hayvanAnaEtiket(a) : ''}`, degisiklikler: Object.entries(yama).map(([alan, yeni]) => ({ alan, eski: String((k as Record<string, unknown>)[alan] ?? ''), yeni: String(yeni ?? '') })) });
}

/** Ultrason sonucu: gebe → hayvan "gebe"; boş → gebe işaretliyse sağlıklıya döner */
export async function ultrasonGir(id: string, sonuc: UltrasonSonuc, yavruSayisi: number | undefined, tarih = bugunYerel()): Promise<void> {
  yetkiGerekli('tedavi');
  const l = await ciftlesmeOku();
  const k = l.find((x) => x.id === id);
  if (!k) return;
  await ciftlesmeYaz(l.map((x) => (x.id === id ? { ...x, ultrason: { tarih, sonuc, yavruSayisi: sonuc === 'gebe' ? yavruSayisi ?? 1 : undefined } } : x)));
  const a = await getAnimal(k.koyunId);
  if (a && a.status !== 'sold' && a.status !== 'dead') {
    if (sonuc === 'gebe' && a.status !== 'pregnant') await upsertAnimal({ ...a, status: 'pregnant' });
    if (sonuc === 'bos' && a.status === 'pregnant') await upsertAnimal({ ...a, status: 'healthy' });
  }
  denetimYaz({ eylem: 'guncelleme', tablo: 'ureme', kayitId: id, animalId: k.koyunId, ozet: `Ultrason · ${a ? hayvanAnaEtiket(a) : ''} · ${sonuc === 'bos' ? 'boş' : yavruSayisi && yavruSayisi > 1 ? `gebe (${yavruSayisi} yavru)` : 'gebe'}` });
}

/** Ultrasonu geri al (yanlış basıldıysa) */
export async function ultrasonSil(id: string): Promise<void> {
  yetkiGerekli('tedavi');
  const l = await ciftlesmeOku();
  await ciftlesmeYaz(l.map((x) => (x.id === id ? { ...x, ultrason: null } : x)));
}

/**
 * Doğum: kuzuları oluşturur (ana + baba bağlı), anneyi sağmal yapar, aktif çiftleşme kaydını kapatır.
 * Çiftleşme kaydı yoksa yine de doğum yazılır (babaId elle verilebilir).
 */
export async function ciftlesmeliDogum(girdi: DogumKayitGirdi & { olu?: number }): Promise<DogumKayitSonuc> {
  const kayit = await getKoyunCiftlesme(girdi.anneId);
  const aktif = kayit && !kayit.dogum && kayit.ultrason?.sonuc !== 'bos' ? kayit : null;
  const babaId = girdi.babaId !== undefined ? girdi.babaId : aktif?.kocId ?? null;
  const s = await dogumKaydet({ ...girdi, babaId });
  if (!s.ok) return s;
  const l = await ciftlesmeOku();
  const dogum = { tarih: girdi.birthDate, kuzuIds: s.kuzular.map((x) => x.id), canli: s.kuzular.length, olu: Math.max(0, girdi.olu ?? 0) };
  if (aktif) {
    await ciftlesmeYaz(l.map((x) => (x.id === aktif.id ? { ...x, dogum, kocId: babaId } : x)));
  } else {
    // Kayıtsız doğum: istatistik için sonradan kayıt oluştur (katım = doğum − 150)
    const d = new Date(`${girdi.birthDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 150);
    await ciftlesmeYaz([
      { id: uuidv4(), koyunId: girdi.anneId, kocId: babaId, yontem: 'koc', katimTarih: d.toISOString().slice(0, 10), gebelikGun: 150, ultrason: null, dogum, not: 'doğumdan geriye yazıldı', olusturma: new Date().toISOString() },
      ...l,
    ]);
  }
  denetimYaz({ eylem: 'ekleme', tablo: 'ureme', kayitId: aktif?.id ?? girdi.anneId, animalId: girdi.anneId, ozet: `Doğum · ${hayvanAnaEtiket(s.anne)} · ${s.kuzular.length === 1 ? 'tek' : s.kuzular.length === 2 ? 'ikiz' : s.kuzular.length === 3 ? 'üçüz' : `${s.kuzular.length} kuzu`}${dogum.olu ? ` + ${dogum.olu} ölü` : ''}` });
  return s;
}

export async function ciftlesmeSil(id: string): Promise<void> {
  yetkiGerekli('silme');
  const l = await ciftlesmeOku();
  const k = l.find((x) => x.id === id);
  if (!k) return;
  const a = await getAnimal(k.koyunId);
  await ciftlesmeYaz(l.filter((x) => x.id !== id));
  await copeAt({ id: `ureme-${id}`, tur: 'ureme', etiket: `Çiftleşme · ${a ? hayvanAnaEtiket(a) : 'koyun'} · ${trTarih(k.katimTarih)}`, veri: k, animalId: k.koyunId });
  denetimYaz({ eylem: 'silme', tablo: 'ureme', kayitId: id, animalId: k.koyunId, ozet: `Çiftleşme kaydı silindi · ${a ? hayvanAnaEtiket(a) : ''}` });
}
