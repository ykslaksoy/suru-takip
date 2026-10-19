import { KUZU_GRADES, dereceEtiket } from '@/kaynak/kilo/kuzu-derece';
import { TERIMLER } from '@/sabitler/Metinler';
import { test, type TestModul } from '../cerceve';

const G = 'Kuzu derecesi';

export const kuzuDereceModul: TestModul = {
  grup: G,
  calistir() {
    const g = KUZU_GRADES;
    const tum = Object.values(g);
    const metin = tum.map((x) => `${x.label} ${x.short} ${x.hint}`).join(' ');
    const sira = [g.bilinmiyor, g.zayif, g.fit, g.sportmen, g.kasli, g.super_kuzu];
    return [
      test(
        G,
        'Yeni etiketler',
        sira.map((x) => x.label).join('|') === 'Ölçülmedi|Zayıf|Normal|İyi|Çok iyi|Süper Kuzu',
        sira.map((x) => x.label).join(' → '),
      ),
      test(G, 'Emoji: ⚪ 🔴 🟢 🥉 🥈 🏆', sira.map((x) => x.emoji).join('') === '⚪🔴🟢🥉🥈🏆'),
      test(G, '🐑 eki yok', !tum.some((x) => x.emoji.includes('🐑'))),
      test(G, 'Kupalar bronz → gümüş → altın', g.sportmen.color === '#cd7f32' && g.kasli.color === '#8a8d91' && g.super_kuzu.color === '#b8860b'),
      test(G, "Eski adlar kalmadı (Fit/Sportmen/Kaslı)", !/\bFit\b|Sportmen|Kasl[ıi]|kas durumu|kas yapısı/i.test(metin)),
      test(G, 'Tek Normal seviye', tum.filter((x) => x.label === 'Normal').length === 1),
      test(G, 'Çok iyi ipucu Süper Kuzu der', g.kasli.hint.includes('Süper Kuzu')),
      test(G, 'Kısa metinler', g.zayif.short === 'Beklenenin altında' && g.fit.short === 'Yaşına göre normal gelişim' && g.sportmen.short === 'Yaşına göre iyi gelişim' && g.kasli.short === 'Yaşına göre çok iyi gelişim'),
      test(G, 'dereceEtiket = label', tum.every((x) => dereceEtiket(x) === x.label)),
      test(G, 'FIT/SPORTMEN terimleri kaldırıldı', !('FIT' in TERIMLER) && !('SPORTMEN' in TERIMLER)),
      test(G, 'Seviye sırası korunur', sira.every((x, i) => x.level === i)),
    ];
  },
};
