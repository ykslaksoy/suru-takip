import { terim, terimKisa } from '@/sabitler/Metinler';

export type SuggestionUrgency = 'info' | 'action' | 'alert';

export interface SmartSuggestion {
  id: string;
  title: string;
  body: string;
  /** Kısa açıklama / gerekçe */
  voice: string;
  urgency: SuggestionUrgency;
  source: 'karantina' | 'asi' | 'tartim' | 'rasyon' | 'stok' | 'saglik' | 'genel';
  cta?: string;
}

/**
 * Akıllı Kuzu — sürü operasyon önerileri (karar destek).
 * Süper Kuzu = hedef metriklere ulaşınca açılan performans unvanı.
 */
export const AKILLI_KUZU = {
  name: 'Akıllı Kuzu',
  emoji: '🐑',
  tagline: 'Operasyon önerileri · öncelik sırası · karar destek',
  greetings: [
    'Bugünkü öncelikler hazır.',
    'Sürü durumu değerlendirildi.',
    'Kritik ve aksiyon maddeleri güncellendi.',
  ],
} as const;

/** En üst verim başarı unvanı — öneri karakteri değil */
export const SUPER_KUZU_BASARI = {
  name: 'Süper Kuzu',
  emoji: '🏆',
  title: 'Süper Kuzu eşiğine ulaşıldı',
  desc: `Hedef kilo, yeterli ${terim('ADG')} ve düşük ${terim('FCR')} birlikte sağlandı. Bu parti performans eşiğini geçti.`,
} as const;

const URGENCY_ORDER: Record<SuggestionUrgency, number> = {
  alert: 0,
  action: 1,
  info: 2,
};

/**
 * Akıllı Kuzu önerileri.
 * İleride canlı sürü verisinden üretilecek.
 */
export function getSmartSuggestions(ctx?: {
  quarantineDay?: number;
  quarantineTotal?: number;
  lowStock?: boolean;
  needsVaccine?: boolean;
  needsWeigh?: boolean;
  adgGrams?: number | null;
}): SmartSuggestion[] {
  const out: SmartSuggestion[] = [];
  const qDay = ctx?.quarantineDay;
  const qTotal = ctx?.quarantineTotal ?? 5;

  if (qDay != null && qDay <= qTotal) {
    out.push({
      id: 'q-yonca',
      title: 'Karantina protokolü',
      body: `${qDay}. / ${qTotal}. gün — yalnızca yonca ve temiz su`,
      voice: `Kesif yem vermeyin. Mide adaptasyonu için kaba yem + su yeterli. Günlük gözlem ve padok hijyenini sürdürün.`,
      urgency: 'action',
      source: 'karantina',
      cta: 'Karantina kontrolü',
    });
  }

  if (ctx?.needsVaccine) {
    out.push({
      id: 'vax',
      title: 'Aşı planı',
      body: 'Karantina sonrası aşı kaydı ve stok düşümü bekleniyor',
      voice: `Karantina bitiminde aşıyı planlayın. Uygulamayı sağlık kaydına işleyin; stoktan otomatik veya manuel düşüm yapın. Seri ahır modu toplu işlem için uygundur.`,
      urgency: 'action',
      source: 'asi',
      cta: 'Aşılama',
    });
  }

  if (ctx?.needsWeigh) {
    out.push({
      id: 'w0',
      title: `Başlangıç tartımı (${terim('T1')})`,
      body: `${terim('T1')} olmadan ${terim('ADG')} hesaplanamaz`,
      voice: `Besi başlangıcında referans tartım alın. Sonraki tartımlarla günlük canlı ağırlık artışı hesaplanır.`,
      urgency: 'action',
      source: 'tartim',
      cta: 'Tartım',
    });
  }

  if (ctx?.adgGrams != null && ctx.adgGrams < 150) {
    out.push({
      id: 'adg-low',
      title: `${terimKisa('ADG')} düşük`,
      body: `Ortalama ${terim('ADG')}: ~${ctx.adgGrams} g/gün`,
      voice: `Hedef aralığın altında. Rasyon protein/enerji dengesini, padok stresini ve hastalık belirtilerini kontrol edin. Gerekirse rasyon önerisini güncelleyin.`,
      urgency: 'alert',
      source: 'rasyon',
      cta: 'Rasyon önerisi',
    });
  }

  if (ctx?.lowStock) {
    out.push({
      id: 'stock',
      title: 'Yem stoku kritik',
      body: 'Stok minimum seviyenin altında',
      voice: `Besi döneminde yem kesintisi performans kaybına yol açar. Eksik kalemleri tamamlayın ve minimum stok eşiğini güncelleyin.`,
      urgency: 'alert',
      source: 'stok',
      cta: 'Stok',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'welcome',
      title: 'Standart iş akışı',
      body: 'Karantina → aşı → tartım → rasyon',
      voice: `Yeni girişlerde sırayı koruyun: karantina (yonca + su), aşı, ${terim('T1')}, ardından rasyon. Sıra bozulursa hastalık ve verim riski artar.`,
      urgency: 'info',
      source: 'genel',
    });
    out.push({
      id: 'tip-fcr',
      title: terim('FCR'),
      body: '1 kg canlı ağırlık artışı için tüketilen yem (kg)',
      voice: `Yem dönüşüm oranı kârlılığı belirler. Düzenli tartım ve yem kaydı ile ${terim('FCR')} hesaplanır.`,
      urgency: 'info',
      source: 'rasyon',
    });
  }

  out.push({
    id: 'soft-edu-padok',
    title: 'Padok gruplama',
    body: 'Zayıf ve yeni girişleri ayırın',
    voice: `Karışık padoklarda hastalık bulaşı ve yem rekabeti artar. Yeni gelen / zayıf hayvanları ayrı grupta tutun.`,
    urgency: 'info',
    source: 'genel',
  });

  return out.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
}

export function akilliKuzuGreeting(): string {
  const list = AKILLI_KUZU.greetings;
  return list[Math.floor(Date.now() / 86400000) % list.length];
}

export function urgencyEtiket(u: SuggestionUrgency): string {
  if (u === 'alert') return 'Kritik';
  if (u === 'action') return 'Aksiyon';
  return 'Bilgi';
}

/** En üst verim eşiği — true ise Süper Kuzu unvanı açılır */
export function isSuperKuzuAchieved(metrics: {
  adgGrams: number;
  fcr: number;
  targetReached: boolean;
}): boolean {
  return metrics.targetReached && metrics.adgGrams >= 250 && metrics.fcr > 0 && metrics.fcr <= 4.5;
}
