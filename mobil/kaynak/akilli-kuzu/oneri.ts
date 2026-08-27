import { terim, terimKisa } from '@/sabitler/Metinler';

export type SuggestionUrgency = 'info' | 'action' | 'alert';

export interface SmartSuggestion {
  id: string;
  title: string;
  body: string;
  /** Akıllı Kuzu'nun konuşma metni (balon) */
  voice: string;
  urgency: SuggestionUrgency;
  source: 'karantina' | 'asi' | 'tartim' | 'rasyon' | 'stok' | 'saglik' | 'genel';
  cta?: string;
}

/**
 * Rehber karakter: Akıllı Kuzu — önerileri o verir.
 * Süper Kuzu = en üst verime ulaşınca çıkan sonuç unvanı (başarı).
 */
export const AKILLI_KUZU = {
  name: 'Akıllı Kuzu',
  emoji: '🐑',
  tagline: 'Ben Akıllı Kuzu — sırayı ve kârı birlikte tutarız.',
  greetings: [
    'Merhaba! Bugün de yanındayım.',
    'Hoş geldin — birlikte bakalım.',
    'Hazırım, sürüye göz attım.',
  ],
} as const;

/** En üst verim başarı unvanı — öneri karakteri değil */
export const SUPER_KUZU_BASARI = {
  name: 'Süper Kuzu',
  emoji: '🏆🐑',
  title: 'Süper Kuzu seviyesine ulaştın!',
  desc: `Hedef kilo, iyi ${terim('ADG')} ve düşük ${terim('FCR')} — bu parti en üst verimde. İşte senin Süper Kuzun.`,
} as const;

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
      title: 'Karantina günü',
      body: `${qDay}/${qTotal}. gün — sadece yonca + su.`,
      voice: `Bugün karantinada ${qDay}. günümüz. Ben olsam kesif yeme hiç dokunmam — az yonca, bol temiz su. Kuzuların mideleri alışsın.`,
      urgency: 'action',
      source: 'karantina',
      cta: 'Karantina kontrolü',
    });
  }

  if (ctx?.needsVaccine) {
    out.push({
      id: 'vax',
      title: 'Aşı sırası',
      body: 'Karantina sonrası aşıyı planla.',
      voice: `Karantina bitince aşıya geçelim. Unutma: aşıyı uygulamada kaydet, stoktan düş. İstersen seri modda peş peşe yaparız.`,
      urgency: 'action',
      source: 'asi',
      cta: 'Aşılama',
    });
  }

  if (ctx?.needsWeigh) {
    out.push({
      id: 'w0',
      title: `${terim('T0')}`,
      body: `${terim('T0')} kilosu olmadan ${terim('ADG')} hesaplanmaz.`,
      voice: `Besi başlamadan bir tartım alalım — buna ${terim('T0')} diyoruz. Sonraki tartımlarda “günde kaç gram aldık”ı ben hesaplarım.`,
      urgency: 'action',
      source: 'tartim',
      cta: 'Tartım',
    });
  }

  if (ctx?.adgGrams != null && ctx.adgGrams < 150) {
    out.push({
      id: 'adg-low',
      title: `${terimKisa('ADG')} düşük`,
      body: `${terim('ADG')} ~${ctx.adgGrams} g/gün.`,
      voice: `Hmm… ${terim('ADG')} yaklaşık ${ctx.adgGrams} g/gün. Biraz düşük. Rasyona ve strese bak — istersen sana daha kârlı bir rasyon önerisi çıkarayım. Süper Kuzu seviyesine böyle çıkılır.`,
      urgency: 'alert',
      source: 'rasyon',
      cta: 'Rasyon önerisi',
    });
  }

  if (ctx?.lowStock) {
    out.push({
      id: 'stock',
      title: 'Yem azalıyor',
      body: 'Stok minimumun altında.',
      voice: `Yem stoku düşmüş! Besi ortasında yem bitmesin — bak, şimdi tamamla. Ben uyarmasaydım yarın ağılda panik olurdu.`,
      urgency: 'alert',
      source: 'stok',
      cta: 'Stok',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'welcome',
      title: 'Sıra önemli',
      body: 'Karantina → aşı → tartım → rasyon.',
      voice: `Kuzu alınca acele etme. Önce karantina (yonca + su), sonra aşı, sonra ${terim('T0')}, sonra rasyon. Bu sırayı bozma — ben hatırlatırım. En üstte Süper Kuzu seni bekliyor.`,
      urgency: 'info',
      source: 'genel',
    });
    out.push({
      id: 'tip-fcr',
      title: terim('FCR'),
      body: '1 kg artış için kaç kg yem?',
      voice: `Kârın sırrı ${terim('FCR')}: 1 kilo almak için kaç kilo yem yedik? Tartım + yem kaydı yap, ben hesabı çıkarayım.`,
      urgency: 'info',
      source: 'rasyon',
    });
  }

  out.push({
    id: 'soft-edu-padok',
    title: 'Padok ipucu',
    body: 'Grupları ayır.',
    voice: `Bir de şunu unutma: zayıf / yeni gelen kuzuları ayrı tut. Karışık padokta hastalık ve yem kavgası artar — ben gördüm, sen görme.`,
    urgency: 'info',
    source: 'genel',
  });

  return out;
}

export function akilliKuzuGreeting(): string {
  const list = AKILLI_KUZU.greetings;
  return list[Math.floor(Date.now() / 86400000) % list.length];
}

/** En üst verim eşiği — true ise Süper Kuzu unvanı açılır */
export function isSuperKuzuAchieved(metrics: {
  adgGrams: number;
  fcr: number;
  targetReached: boolean;
}): boolean {
  return metrics.targetReached && metrics.adgGrams >= 250 && metrics.fcr > 0 && metrics.fcr <= 4.5;
}
