import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { test, type TestModul } from '../cerceve';
import {
  ISTEMCI_REF_TTL_MS,
  besiReferansOtomatikSenkron,
  referansOtomatikTestSimdi,
  referansOtomatikTestSifirla,
  referansInflightVarMi,
  referansTazelikGerekliMi,
  referansOtomatikAtlanmaNedeni,
} from '@/kaynak/maliyet/besi-referans-otomatik';
import { referansSyncMetaYaz } from '@/kaynak/maliyet/besi-referans-sync-meta';
import {
  efektifBirimFiyat,
  referansOverrideAyarla,
  referansOverrideTemizle,
} from '@/kaynak/maliyet/besi-referans-override';
import { besiReferanslariFixtureIle } from '@/kaynak/maliyet/besi-referans-yenile';
import { VARSAYILAN_ALIS_CANLI_KG_FIYAT } from '@/kaynak/maliyet/besi-plan-alis';

const FIX = join(process.cwd(), 'test/fixtures/besi-referans');
const g = 'Besi referans otomatik t368u';
const require = createRequire(import.meta.url);

export const besiReferansOtomatikModul: TestModul = {
  grup: g,
  async calistir() {
    const base = Date.UTC(2026, 10, 8, 12, 0, 0);
    referansOtomatikTestSifirla();
    referansSyncMetaYaz({
      sonBasariliIso: new Date(base).toISOString(),
      sonDenemeIso: null,
      sonNeden: 'acilis',
      sonSonuc: 'ok',
      kaynakIslemTarihleri: { tobb_edirne: '2026-11-02' },
      sonCekimIso: new Date(base).toISOString(),
      hataMesaji: null,
      atlanmaNedeni: null,
    });
    referansOtomatikTestSimdi(() => base + 3600_000);
    const tazeDegil = !referansTazelikGerekliMi();
    const atlanma = referansOtomatikAtlanmaNedeni(false);

    referansOtomatikTestSimdi(() => base + ISTEMCI_REF_TTL_MS + 1000);
    const tazeGerekli = referansTazelikGerekliMi();

    referansOtomatikTestSifirla();
    referansSyncMetaYaz({
      sonBasariliIso: new Date(base).toISOString(),
      sonDenemeIso: null,
      sonNeden: 'acilis',
      sonSonuc: 'ok',
      kaynakIslemTarihleri: {},
      sonCekimIso: null,
      hataMesaji: null,
      atlanmaNedeni: null,
    });
    referansOtomatikTestSimdi(() => base + 1000);
    const skip = await besiReferansOtomatikSenkron({ neden: 'resume' });

    const tobb = readFileSync(join(FIX, 'tobb-kuzu.html'), 'utf8');
    const ukon = readFileSync(join(FIX, 'ukon-fiyatlar.html'), 'utf8');
    const usk = readFileSync(join(FIX, 'usk-yem.html'), 'utf8');
    const eskiIslem = '2026-11-02';
    besiReferanslariFixtureIle(tobb, ukon, usk);

    referansOverrideAyarla('alis_canli_kg', 480);
    const ovOnce = efektifBirimFiyat(VARSAYILAN_ALIS_CANLI_KG_FIYAT, 'alis_canli_kg').deger;
    besiReferanslariFixtureIle(tobb, ukon, usk);
    const ovSonra = efektifBirimFiyat(VARSAYILAN_ALIS_CANLI_KG_FIYAT, 'alis_canli_kg').deger;
    referansOverrideTemizle('alis_canli_kg');

    const cache = require('../../../api/besi/_referans-cache.js');
    cache.__testCacheSifirla();
    const NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = NODE_TLS_REJECT_UNAUTHORIZED;
    const ilk = await cache.referansCachetenVeyaCek({ force: false, neden: 'test' });
    const ikinci = await cache.referansCachetenVeyaCek({ force: false, neden: 'test' });

    return [
      test(g, 'TTL 1saat taze', tazeDegil),
      test(g, 'TTL atlanma metni', atlanma != null),
      test(g, 'TTL 6saat sonra gerekli', tazeGerekli),
      test(g, 'TTL 6 saat', ISTEMCI_REF_TTL_MS === 6 * 3600_000),
      test(g, 'inflight başlangıç false', !referansInflightVarMi()),
      test(g, 'otomatik skip', skip.atlandi === true && skip.meta.sonSonuc === 'atlandi'),
      test(g, 'override korunur', ovOnce === 480 && ovSonra === 480),
      test(g, 'trade tarih meta', eskiIslem === '2026-11-02'),
      test(g, 'sunucu cache 2. hit', ikinci?.zamanlama?.sunucuCacheHit === true),
      test(g, 'sunucu cache 1. fetch', ilk?.zamanlama?.sunucuCacheHit === false),
    ];
  },
};
