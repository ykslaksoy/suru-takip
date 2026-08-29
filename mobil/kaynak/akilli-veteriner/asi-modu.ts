import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASI_PROGRAMI, asiDozEtiketi, type AsiProgramKalemi } from '@/kaynak/cekirdek/asi-programi';
import type { Animal } from '@/kaynak/cekirdek/tipler';
import { getAnimals } from '@/kaynak/cekirdek/veritabani';

const PROFIL_KEY = 'sy_asi_profil_v1';
const TERCIH_KEY = 'sy_asi_tercih_v1';
const PLAN_KEY = 'sy_asi_plan_v1';

export type BolgeTipi = 'sicak' | 'ilik' | 'soguk' | 'daglik';
export type BesiSekli = 'ic' | 'dis' | 'karisik';
export type HayvanGrubu = 'kuzu' | 'besi' | 'gebe' | 'sut' | 'koc' | 'genel';

export type AsiOrtamProfili = {
  bolge: BolgeTipi;
  tur: 'sheep' | 'goat';
  irk: string;
  besiSekli: BesiSekli;
  hayvanGrubu: HayvanGrubu;
  nemliAlan: boolean;
  yogunSuru: boolean;
};

export type AsiTercih = {
  programId: string;
  aktif: boolean;
  riskOnaylandi?: boolean;
};

export type AsiOneriKalemi = {
  programId: string;
  ad: string;
  /** "sabit 2 ml" — çoban satırı */
  mlEtiket: string;
  oncelik: 'zorunlu' | 'onerilen' | 'opsiyonel';
  neden: string;
  varsayilan: boolean;
};

export type AsiUyari = {
  id: string;
  programId: string;
  baslik: string;
  mesaj: string;
  risk: string;
  onayMetni: string;
};

export type AsiPlani = {
  id: string;
  programId: string;
  asiAdi: string;
  tarih: string;
  hedef: 'tum_kuzular';
  hayvanSayisi: number;
  olusturuldu: string;
};

export const VARSAYILAN_PROFIL: AsiOrtamProfili = {
  bolge: 'ilik',
  tur: 'sheep',
  irk: '',
  besiSekli: 'karisik',
  hayvanGrubu: 'kuzu',
  nemliAlan: false,
  yogunSuru: false,
};

export const BOLGE_SECENEKLER: { id: BolgeTipi; label: string }[] = [
  { id: 'sicak', label: 'Sıcak / düşük rakım' },
  { id: 'ilik', label: 'Ilıman' },
  { id: 'soguk', label: 'Soğuk / yüksek rakım' },
  { id: 'daglik', label: 'Dağlık / mera ağırlıklı' },
];

export const BESI_SECENEKLER: { id: BesiSekli; label: string }[] = [
  { id: 'ic', label: 'İç mekân / ahır besi' },
  { id: 'dis', label: 'Açık alan / mera' },
  { id: 'karisik', label: 'Hem içerde hem dışarda' },
];

export const GRUP_SECENEKLER: { id: HayvanGrubu; label: string }[] = [
  { id: 'kuzu', label: 'Kuzu' },
  { id: 'besi', label: 'Besi hayvanı' },
  { id: 'gebe', label: 'Gebe / damızlık' },
  { id: 'sut', label: 'Süt sürüsü' },
  { id: 'koc', label: 'Koç / erkek' },
  { id: 'genel', label: 'Genel sürü' },
];

function programBul(id: string): AsiProgramKalemi | undefined {
  return ASI_PROGRAMI.find((p) => p.id === id);
}

/** Ortam + cinse göre aşı önerileri */
export function olusturAsiOnerileri(profil: AsiOrtamProfili): AsiOneriKalemi[] {
  const skor: Record<string, { oncelik: AsiOneriKalemi['oncelik']; nedenler: string[] }> = {};

  for (const p of ASI_PROGRAMI) {
    skor[p.id] = { oncelik: 'opsiyonel', nedenler: [] };
  }

  const ekle = (id: string, oncelik: AsiOneriKalemi['oncelik'], neden: string) => {
    const s = skor[id];
    if (!s) return;
    s.nedenler.push(neden);
    const rank = { zorunlu: 3, onerilen: 2, opsiyonel: 1 };
    if (rank[oncelik] > rank[s.oncelik]) s.oncelik = oncelik;
  };

  ekle('karma', 'zorunlu', 'Tek iğne — klostridiyal + pastörella temel koruma');
  ekle('enterotoksemi', 'onerilen', 'Genel sürü koruması');
  ekle('ppr', 'zorunlu', 'Resmi / destek şartı — VETBİS kaydı');
  ekle('cicek', 'zorunlu', 'Resmi / destek şartı — VETBİS kaydı');
  ekle('sap', 'onerilen', 'Şap — genelde 6 ayda bir');

  if (profil.besiSekli === 'ic') {
    ekle('enterotoksemi', 'zorunlu', 'İç mekân beside yem değişimi riski yüksek');
    ekle('karma', 'zorunlu', 'Ahırda sıkışık besi — karma koruma');
    ekle('pasteurella', 'onerilen', 'Kapalı ahır — solunum riski');
  }
  if (profil.besiSekli === 'dis' || profil.besiSekli === 'karisik') {
    ekle('parazit', 'onerilen', 'Açık alan / mera — parazit maruziyeti');
    ekle('ektima', 'onerilen', 'Mera / açık alan — ektima riski');
  }
  if (profil.bolge === 'sicak' || profil.nemliAlan) {
    ekle('parazit', 'zorunlu', 'Sıcak/nemli ortam — parazit programı gerekli');
    ekle('topallik', 'onerilen', 'Nemli zemin — ayak / topallık riski');
  }
  if (profil.bolge === 'soguk' || profil.bolge === 'daglik') {
    ekle('enterotoksemi', 'zorunlu', 'Soğuk/dağlık — enterotoksemi riski artar');
  }
  if (profil.hayvanGrubu === 'kuzu') {
    ekle('karma', 'zorunlu', 'Kuzu gelişimi için temel karma aşı');
    ekle('enterotoksemi', 'zorunlu', 'Kuzuda enterotoksemi kayıpları sık görülür');
    ekle('septisemi', 'onerilen', 'Yeni doğan / genç kuzu — septisemi');
  }
  if (profil.hayvanGrubu === 'gebe') {
    ekle('karma', 'zorunlu', 'Gebe koyun — kolostrum antikorları için');
    ekle('septisemi', 'onerilen', 'Doğuma 1–1,5 ay kala septisemi');
    ekle('brusella', 'onerilen', 'Damızlık — resmi brusella programı');
  }
  if (profil.hayvanGrubu === 'sut') {
    ekle('karma', 'zorunlu', 'Süt sürüsü — temel koruma');
    ekle('agalaksi', 'zorunlu', 'Süt kesen hastalığı — sütçü sürü');
  }
  if (profil.hayvanGrubu === 'besi' || profil.yogunSuru) {
    ekle('enterotoksemi', 'zorunlu', 'Yoğun / besi sürüsü — bulaşı hızlı yayılır');
    ekle('pasteurella', 'onerilen', 'Yoğun sürü — solunum enfeksiyonu');
  }
  if (profil.tur === 'goat') {
    ekle('karma', 'zorunlu', 'Keçi sürüsü — temel koruma');
    ekle('ppr', 'zorunlu', 'Keçi — PPR (veba) kritik');
  }

  return ASI_PROGRAMI.map((p) => {
    const s = skor[p.id];
    return {
      programId: p.id,
      ad: p.ad,
      mlEtiket: asiDozEtiketi(p),
      oncelik: s.oncelik,
      neden: s.nedenler.join(' · ') || 'Genel program',
      varsayilan: s.oncelik !== 'opsiyonel',
    };
  });
}

/** Kapatılan aşılar için uyarı metinleri */
export function asiUyarilari(
  profil: AsiOrtamProfili,
  oneriler: AsiOneriKalemi[],
  tercihler: AsiTercih[]
): AsiUyari[] {
  const out: AsiUyari[] = [];
  for (const o of oneriler) {
    const t = tercihler.find((x) => x.programId === o.programId);
    if (!t || t.aktif || t.riskOnaylandi) continue;
    if (o.oncelik === 'opsiyonel') continue;

    const riskler: Record<string, string> = {
      karma: 'Klostridiyal ve pastörella hastalıkları için temel koruma kaybı.',
      clostridial: 'Kuzu gelişimi zayıf kalabilir, ani ölüm (overeating) riski artar.',
      enterotoksemi: 'Enterotoksemi (çelertme) kayıpları ve sürüde hızlı yayılma riski.',
      pasteurella: 'Solunum enfeksiyonu ve pastörella salgını riski artar.',
      septisemi: 'Genç kuzuda septisemi kaynaklı ani ölüm riski.',
      ektima: 'Ağız/meme yaraları (ORF) sürüye yayılabilir.',
      tetanos: 'Yara sonrası tetanoz riski.',
      ppr: 'Koyun-keçi vebası — resmi program ve destek şartı kaçabilir.',
      cicek: 'Çiçek hastalığı — resmi program ve destek şartı kaçabilir.',
      sap: 'Şap hastalığı — üretim ve hareket kısıtı riski.',
      brusella: 'Brusella — damızlık ve halk sağlığı riski.',
      sarbon: 'Şarbon — bölgesel ani ölüm riski.',
      agalaksi: 'Süt kesen hastalık — süt verimi düşer.',
      topallik: 'Topallık / ayak sorunları artabilir.',
      parazit: 'Parazit yükü artar; kilo kaybı ve ishal riski yükselir.',
    };

    out.push({
      id: `uyari-${o.programId}`,
      programId: o.programId,
      baslik: `${o.ad} yapılmazsa`,
      mesaj: o.neden,
      risk: riskler[o.programId] ?? 'Hastalık riski artar.',
      onayMetni: 'Riski anladım, yine de yapmayacağım',
    });
  }

  if (profil.hayvanGrubu === 'kuzu' && tercihler.some((t) => !t.aktif && !t.riskOnaylandi)) {
    const pasif = tercihler.filter((t) => !t.aktif);
    if (pasif.length > 0) {
      out.push({
        id: 'uyari-kuzu-gelisim',
        programId: pasif[0].programId,
        baslik: 'Kuzu gelişimi',
        mesaj: 'Seçmediğiniz aşılar kuzu büyümesini olumsuz etkileyebilir.',
        risk: 'Zayıf gelişim, mortalite artışı.',
        onayMetni: 'Anladım, onayla',
      });
    }
  }

  return out;
}

/** Eksik / yapılması gereken aşılar */
export function eksikAsiMesajlari(
  oneriler: AsiOneriKalemi[],
  tercihler: AsiTercih[]
): string[] {
  const mesajlar: string[] = [];
  for (const o of oneriler) {
    const t = tercihler.find((x) => x.programId === o.programId);
    if (t?.aktif && o.oncelik !== 'opsiyonel') {
      mesajlar.push(`✓ ${o.ad} — planınıza dahil (önerilen)`);
    }
    if (!t?.aktif && o.oncelik === 'zorunlu' && !t?.riskOnaylandi) {
      mesajlar.push(`⚠ ${o.ad} — kullanmanız gerekli (zorunlu öneri)`);
    }
  }
  return mesajlar;
}

export function varsayilanTercihler(oneriler: AsiOneriKalemi[]): AsiTercih[] {
  return oneriler.map((o) => ({
    programId: o.programId,
    aktif: o.varsayilan,
  }));
}

export async function profilKaydet(profil: AsiOrtamProfili): Promise<void> {
  await AsyncStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
}

export async function profilOku(): Promise<AsiOrtamProfili> {
  const raw = await AsyncStorage.getItem(PROFIL_KEY);
  if (!raw) return VARSAYILAN_PROFIL;
  try {
    return { ...VARSAYILAN_PROFIL, ...(JSON.parse(raw) as AsiOrtamProfili) };
  } catch {
    return VARSAYILAN_PROFIL;
  }
}

export async function tercihKaydet(tercihler: AsiTercih[]): Promise<void> {
  await AsyncStorage.setItem(TERCIH_KEY, JSON.stringify(tercihler));
}

export async function tercihOku(): Promise<AsiTercih[]> {
  const raw = await AsyncStorage.getItem(TERCIH_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AsiTercih[];
  } catch {
    return [];
  }
}

export async function planKaydet(plan: AsiPlani): Promise<void> {
  const list = await planOku();
  list.unshift(plan);
  await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(list.slice(0, 20)));
}

export async function planOku(): Promise<AsiPlani[]> {
  const raw = await AsyncStorage.getItem(PLAN_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AsiPlani[];
  } catch {
    return [];
  }
}

/** 12 aydan küçük kuzular */
export async function getKuzular(): Promise<Animal[]> {
  const animals = await getAnimals();
  const now = Date.now();
  return animals.filter((a) => {
    if (a.status === 'sold' || a.status === 'dead') return false;
    const yasGun = (now - new Date(a.birthDate).getTime()) / 86400000;
    return yasGun <= 365;
  });
}

export function programAdi(id: string): string {
  return programBul(id)?.ad ?? id;
}

export function gecerliTarih(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !Number.isNaN(d.getTime());
}
