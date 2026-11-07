import { test, type TestModul } from '../cerceve';
import {
  frekansOrtalama,
  seviyeCubuklari,
  sesEsikUstu,
  mikrofonKaynaklariSerbest,
} from '@/kaynak/ses/mikrofon-seviye';
import { dinlemeDurumuEtiket, dinlemeErisilebilirOzet } from '@/kaynak/ses/dinleme-durumu';
import { dinlemeyiBaslatOtomatik } from '@/kaynak/ses/konusma';

export const sesMikrofonSeviyeModul: TestModul = {
  grup: 'Ses mikrofon seviye (t267u)',
  calistir: () => {
    const g = 'Ses seviye';
    const frek = new Uint8Array([0, 0, 0, 200, 220, 180, 0, 0]);
    const bars = seviyeCubuklari(frek, 4);
    const ort = frekansOrtalama(frek);

    const trackDurdu = { n: 0 };
    const mockTrack = { stop: () => { trackDurdu.n += 1; } };
    const ctxKapandi = { n: 0 };
    const mockCtx = { close: async () => { ctxKapandi.n += 1; } };
    mikrofonKaynaklariSerbest({
      stream: { getTracks: () => [mockTrack, mockTrack] } as unknown as MediaStream,
      audioContext: mockCtx as unknown as AudioContext,
      rafId: null,
      analyser: null,
    });

    return [
      test(g, 'çubuklar 0–1 aralığında', bars.every((b) => b >= 0 && b <= 1)),
      test(g, 'yüksek frekans ortalaması esik üstü', sesEsikUstu(ort) && ort > 0.1, String(ort)),
      test(g, 'sessizlik esik altı', !sesEsikUstu(0.02)),
      test(g, 'track.stop iki kez', trackDurdu.n === 2),
      test(g, 'AudioContext kapanır', ctxKapandi.n === 1),
      test(g, 'durum etiketleri ayrık', dinlemeDurumuEtiket('ses_algilandi').includes('henüz metin yok')),
      test(
        g,
        'ölçüm yok metni dürüst',
        dinlemeErisilebilirOzet('dinliyor', false).includes('canlı ses çubuğu yok'),
      ),
      test(g, 'otomatik dinleme API (seviye kapalı)', typeof dinlemeyiBaslatOtomatik === 'function'),
    ];
  },
};
