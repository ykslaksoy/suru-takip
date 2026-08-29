import type { VetSuggestion } from '@/kaynak/cekirdek/tipler';
import type { VetCevaplar } from './netlestirme';

/** Kullanıcının seçtiği fotoğraf türü — görüntü analizi ipucu kaynağı */
export type FotoTur = 'yara' | 'ayak' | 'diski' | 'agiz' | 'genel';

export type VakaFotografi = {
  id: string;
  uri: string;
  tur: FotoTur;
  etiket: string;
  createdAt: string;
  /** İsteğe bağlı — hangi foto isteğini karşıladı */
  istekId?: string;
};

export const FOTO_TURLER: { id: FotoTur; label: string; ipucu: string }[] = [
  { id: 'yara', label: 'Yara / cilt', ipucu: 'Yara, kabuk, şişlik, akıntı' },
  { id: 'ayak', label: 'Ayak / topallama', ipucu: 'Tırnak, yay, şiş ayak' },
  { id: 'diski', label: 'Dışkı', ipucu: 'Renk, kıvam, kan' },
  { id: 'agiz', label: 'Ağız / meme', ipucu: 'Diş, dil, meme ucu' },
  { id: 'genel', label: 'Genel', ipucu: 'Durum, postür, kuzu genel' },
];

export function fotoTurEtiketi(tur: FotoTur): string {
  return FOTO_TURLER.find((t) => t.id === tur)?.label ?? 'Genel';
}

type FotoKural = {
  tur: FotoTur;
  gozlemler: string[];
  tedavi: string[];
  urgency?: VetSuggestion['urgency'];
  conditions?: string[];
};

const FOTO_KURALLARI: FotoKural[] = [
  {
    tur: 'yara',
    gozlemler: ['Cilt/yara bölgesi fotoğrafı — enfeksiyon veya travma şüphesi'],
    tedavi: [
      'Hayvanı sürüden ayırın',
      'Yarayı temiz su ile yıkayın, kirli pansuman yapmayın',
      'Veteriner gelene kadar yara üzerine rastgele ilaç sürmeyin',
    ],
    urgency: 'medium',
    conditions: ['Deri enfeksiyonu', 'Travma / yara'],
  },
  {
    tur: 'ayak',
    gozlemler: ['Ayak/tırnak fotoğrafı — topallama veya pododermatit şüphesi'],
    tedavi: [
      'Ayak banyosu (ılık su + antiseptik — vet önerisiyle)',
      'Yumuşak zemin, sert taşlı alandan uzak tutun',
      'Topallık 48 saatten uzunsa vet muayenesi',
    ],
    urgency: 'medium',
    conditions: ['Pododermatit (yay)', 'Ayak travması'],
  },
  {
    tur: 'diski',
    gozlemler: ['Dışkı fotoğrafı — ishal veya parazit şüphesi'],
    tedavi: [
      'Bol temiz su',
      'Kesif yem azaltın, iyi kaba yem verin',
      '24 saat düzelmezse dışkı numunesi için vet',
    ],
    urgency: 'medium',
    conditions: ['Enterit / ishal'],
  },
  {
    tur: 'agiz',
    gozlemler: ['Ağız/meme bölgesi — Orf, diş veya meme problemi şüphesi'],
    tedavi: [
      'Hayvanı ayırın (bulaşıcı olabilir)',
      'Meme/ağız bölgesine dokunmayı sınırlayın',
      'Veteriner muayenesi önerilir',
    ],
    urgency: 'high',
    conditions: ['Ekthima (Orf)', 'Meme enfeksiyonu'],
  },
  {
    tur: 'genel',
    gozlemler: ['Genel durum fotoğrafı — postür, kondisyon, halsizlik'],
    tedavi: ['Hayvanı gözlem altında tutun', 'Su ve gölge sağlayın', 'Belirti kötüleşirse vet'],
    urgency: 'low',
  },
];

/**
 * Fotoğraf türüne göre gözlem + tedavi (yerel kural; görüntü AI yok).
 * Cevap bağlamı varsa aciliyet yükseltilir.
 */
export function fotografAnalizi(
  tur: FotoTur,
  ctx?: { cevaplar?: VetCevaplar; symptoms?: string }
): Pick<VetSuggestion, 'fotoGozlemleri' | 'tedaviOnerileri' | 'conditions' | 'urgency'> {
  const kural = FOTO_KURALLARI.find((k) => k.tur === tur) ?? FOTO_KURALLARI[FOTO_KURALLARI.length - 1];
  const gozlemler = [...kural.gozlemler];
  const tedavi = [...kural.tedavi];
  const conditions = kural.conditions ? [...kural.conditions] : [];
  let urgency = kural.urgency ?? 'low';
  const cevaplar = ctx?.cevaplar ?? {};
  const symptoms = (ctx?.symptoms ?? '').toLowerCase();

  if (tur === 'diski' && (cevaplar['ishal-kan'] === 'evet' || /kanlı|kanli/.test(symptoms))) {
    urgency = 'high';
    gozlemler.push('Kanlı dışkı bağlamı — acil değerlendirme');
    tedavi.unshift('Kanlı ishal — hayvanı ayırın, veterineri arayın');
    conditions.push('Kanlı enterit şüphesi');
  }
  if (tur === 'ayak' && cevaplar['topallama-sis'] === 'evet') {
    urgency = urgency === 'low' ? 'medium' : urgency;
    gozlemler.push('Şiş ayak bildirimi — yay/travma ihtimali yüksek');
  }
  if (tur === 'agiz' && (cevaplar['kuzu-gobek'] === 'koku' || cevaplar['kuzu-gobek'] === 'sis')) {
    urgency = 'high';
    gozlemler.push('Göbek şiş/koku — omphalitis şüphesi');
    conditions.push('Göbek enfeksiyonu');
  }
  if (tur === 'genel' && (cevaplar['solunum-nefes'] === 'hizli' || cevaplar['solunum-ates'] === 'evet')) {
    urgency = 'high';
    gozlemler.push('Hızlı solunum / ateş bağlamı');
  }

  return {
    fotoGozlemleri: gozlemler,
    tedaviOnerileri: tedavi,
    conditions,
    urgency,
  };
}

export function formatAiOzet(sonuc: VetSuggestion): string {
  const parcalar = [
    `Aciliyet: ${sonuc.urgency}`,
    sonuc.conditions.length ? `Olası: ${sonuc.conditions.slice(0, 3).join(', ')}` : null,
    sonuc.fotoGozlemleri.length ? `Foto: ${sonuc.fotoGozlemleri[0]}` : null,
    sonuc.tedaviOnerileri.length ? `Öneri: ${sonuc.tedaviOnerileri[0]}` : null,
  ].filter(Boolean);
  return parcalar.join(' · ');
}
