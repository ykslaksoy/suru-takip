import { readFileSync } from 'node:fs';
import { test, type TestModul } from '../cerceve';
import { bekleyenBelgeler, bosMeta, senkronEt, type Tasiyici, type YerelDepo } from '@/kaynak/bulut/motor';
import { ornekSenkronAnahtarSenkronlanirMi, stokSenkronlanirMi } from '@/kaynak/bulut/kapsam';

const G = 'Bulut senkron pipeline';

export const bulutSenkronPipelineModul: TestModul = {
  grup: G,
  async calistir() {
    const ayar = readFileSync(new URL('../../kaynak/bulut/ayar.ts', import.meta.url), 'utf8');
    const motorDosya = readFileSync(new URL('../../kaynak/cekirdek/senkron-motor.ts', import.meta.url), 'utf8');
    const servis = readFileSync(new URL('../../kaynak/bulut/servis.ts', import.meta.url), 'utf8');

    const r = [
      test(
        G,
        'ayar sabit EXPO_PUBLIC gömümü',
        ayar.includes('process.env.EXPO_PUBLIC_SUPABASE_URL') && !ayar.includes('process.env[k]'),
      ),
      test(G, 'bulut-ortam.json yükleme', ayar.includes('bulutOrtamYukle') && ayar.includes('/bulut-ortam.json')),
      test(
        G,
        'kuyruk flush önce sunucu senkronu',
        motorDosya.includes('simdiSenkronEt') && !/await flushSyncQueue\(\)/.test(motorDosya.split('simdiSenkronEt')[0] ?? ''),
      ),
      test(G, 'hayvan ack sonrası legacy temizlik', servis.includes("gonderilenAnahtarlar?.includes('sy_animals')")),
      test(G, 'stok belgeleri senkron kapsamında', stokSenkronlanirMi()),
      test(G, 'örnek sürü anahtarları senkronlanır', ornekSenkronAnahtarSenkronlanirMi()),
    ];

    const depo: YerelDepo = {
      anahtarlar: async () => ['sy_animals'],
      oku: async () => JSON.stringify([{ id: 't1' }]),
      yaz: async () => undefined,
      sil: async () => undefined,
    };
    const tasiyici: Tasiyici = {
      gonder: async () => undefined,
      cek: async () => [],
    };
    let cagrildi = false;
    const tasiyiciHata: Tasiyici = {
      gonder: async () => {
        cagrildi = true;
        throw new Error('ag');
      },
      cek: async () => [],
    };
    const meta = { ...bosMeta(), bekleyen: ['sy_animals'] };
    const belgeler = await bekleyenBelgeler(depo, meta, true);
    r.push(test(G, 'bekleyen belge üretimi', belgeler.length === 1 && belgeler[0].anahtar === 'sy_animals'));

    const hataSonuc = await senkronEt(depo, tasiyiciHata, meta, { finansYetkisi: true });
    r.push(
      test(
        G,
        'sunucu hatasında bekleyen korunur',
        cagrildi && hataSonuc.rapor.bekleyen === 1 && (hataSonuc.rapor.gonderilen ?? 0) === 0,
      ),
    );

    const okSonuc = await senkronEt(depo, tasiyici, meta, { finansYetkisi: true, simdi: () => '2026-11-08T20:00:00.000Z' });
    r.push(
      test(
        G,
        'başarıda gonderilen anahtarlar raporda',
        okSonuc.rapor.gonderilen === 1 && okSonuc.rapor.gonderilenAnahtarlar?.includes('sy_animals'),
      ),
    );

    return r;
  },
};
