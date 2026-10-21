import { bulutAcik } from '@/kaynak/bulut/ayar';
import { finansMi, senkronlanirMi } from '@/kaynak/bulut/siniflama';
import { bosMeta, senkronEt, type Tasiyici, type UzakBelge, type YerelDepo } from '@/kaynak/bulut/motor';
import { fotoSenkron } from '@/kaynak/bulut/foto-senkron';
import { BulutIstemci } from '@/kaynak/bulut/istemci';
import { varsayilanEkip, yerelEkipProfiliVar } from '@/kaynak/ekip/hesap';
import { readFileSync } from 'fs';
import { test, type TestModul } from '../cerceve';

const G = 'Bulut eşitleme';

function bellekDepo(ilk: Record<string, string> = {}): YerelDepo & { m: Map<string, string> } {
  const m = new Map(Object.entries(ilk));
  return {
    m,
    anahtarlar: async () => [...m.keys()],
    oku: async (k) => m.get(k) ?? null,
    yaz: async (k, v) => void m.set(k, v),
    sil: async (k) => void m.delete(k),
  };
}

/** Sunucu simülasyonu: LWW + RLS finans filtresi */
function sahteSunucu() {
  const satirlar = new Map<string, UzakBelge>();
  let saat = 0;
  const ts = () => `2026-10-20T00:00:${String(++saat).padStart(2, '0')}.000Z`;
  const tasiyici = (finans: boolean, kopuk = { v: false }): Tasiyici => ({
    gonder: async (b) => {
      if (kopuk.v) throw new Error('çevrimdışı');
      for (const x of b) {
        if (x.finans && !finans) throw new Error('RLS');
        const eski = satirlar.get(x.anahtar);
        if (eski && x.updated_at < eski.updated_at) continue;
        satirlar.set(x.anahtar, { ...x, sunucu_zamani: ts() });
      }
    },
    cek: async (imlec) => {
      if (kopuk.v) throw new Error('çevrimdışı');
      return [...satirlar.values()].filter((x) => (!imlec || x.sunucu_zamani! > imlec) && (finans || !x.finans));
    },
  });
  return { satirlar, tasiyici };
}

export const bulutModul: TestModul = {
  grup: G,
  async calistir() {
    const r = [];
    r.push(test(G, 'Env yokken bulut kapalı (özellik bayrağı)', !bulutAcik()));
    r.push(test(G, 'Ekip/PIN ve oturum cihazda kalır', !senkronlanirMi('sy_ekip_v1') && !senkronlanirMi('sy_bulut_oturum_v1') && !senkronlanirMi('sy_sync_queue')));
    r.push(test(G, 'Sürü kayıtları senkronlanır', senkronlanirMi('sy_animals') && senkronlanirMi('sy_foto_meta_v1')));
    r.push(test(G, 'Yerel ekip profili ayırt edilir', !yerelEkipProfiliVar(varsayilanEkip()) && yerelEkipProfiliVar({ ...varsayilanEkip(), kisiler: [{ ...varsayilanEkip().kisiler[0], pinOzet: 'x' }] })));
    r.push(test(G, 'Maliyet/sigorta finans sayılır', finansMi('sy_maliyet_ayar_v1') && finansMi('sy_sigorta_policeler_v1') && !finansMi('sy_animals')));

    // Tek seferlik göç: yerel her şey yüklenir
    const sv = sahteSunucu();
    const a = bellekDepo({ sy_animals: '[{"id":1}]', sy_maliyet_ayar_v1: '{"x":1}', sy_ekip_v1: '{"pin":"1"}' });
    let ma = bosMeta();
    let s1 = await senkronEt(a, sv.tasiyici(true), ma, { finansYetkisi: true, simdi: () => '2026-10-20T00:00:00.000Z' });
    ma = s1.meta;
    r.push(test(G, 'İlk yükleme yerel veriyi gönderir', sv.satirlar.has('sy_animals') && sv.satirlar.has('sy_maliyet_ayar_v1') && ma.ilkYukleme));
    r.push(test(G, 'Cihaza özel anahtar gönderilmez', !sv.satirlar.has('sy_ekip_v1')));

    // İkinci cihaz (Bakıcı): finans almaz
    const b = bellekDepo();
    const s2 = await senkronEt(b, sv.tasiyici(false), bosMeta(), { finansYetkisi: false });
    r.push(test(G, 'Bakıcı sürüyü alır', b.m.get('sy_animals') === '[{"id":1}]', String(s2.rapor.alinan)));
    r.push(test(G, 'Bakıcıya finans verisi gelmez', !b.m.has('sy_maliyet_ayar_v1')));

    // LWW: B değiştirir, A çeker
    b.m.set('sy_animals', '[{"id":1},{"id":2}]');
    const s3 = await senkronEt(b, sv.tasiyici(false), s2.meta, { finansYetkisi: false, simdi: () => '2026-10-20T01:00:00.000Z' });
    s1 = await senkronEt(a, sv.tasiyici(true), ma, { finansYetkisi: true, simdi: () => '2026-10-20T00:30:00.000Z' });
    r.push(test(G, 'Yeni değişiklik diğer cihaza geçer (LWW)', a.m.get('sy_animals') === '[{"id":1},{"id":2}]'));

    // Çakışma: daha eski yerel yazım kaybeder
    a.m.set('sy_animals', '[]');
    await senkronEt(a, sv.tasiyici(true), s1.meta, { finansYetkisi: true, simdi: () => '2026-10-20T00:45:00.000Z' });
    r.push(test(G, 'Eski zamanlı yazım sunucuda yenisini ezmez', JSON.stringify(sv.satirlar.get('sy_animals')!.deger) === '[{"id":1},{"id":2}]'));

    // Çevrimdışı kuyruk
    const kopuk = { v: true };
    b.m.set('sy_weights', '[{"kg":30}]');
    const s4 = await senkronEt(b, sv.tasiyici(false, kopuk), s3.meta, { finansYetkisi: false, simdi: () => '2026-10-20T02:00:00.000Z' });
    r.push(test(G, 'Çevrimdışıyken değişiklik kuyrukta kalır', !!s4.rapor.hata && s4.meta.bekleyen.includes('sy_weights')));
    kopuk.v = false;
    const s5 = await senkronEt(b, sv.tasiyici(false, kopuk), s4.meta, { finansYetkisi: false, simdi: () => '2026-10-20T02:05:00.000Z' });
    r.push(test(G, 'İnternet gelince kuyruk gönderilir', sv.satirlar.has('sy_weights') && s5.meta.bekleyen.length === 0));

    // Soft delete
    b.m.delete('sy_weights');
    await senkronEt(b, sv.tasiyici(false), s5.meta, { finansYetkisi: false, simdi: () => '2026-10-20T03:00:00.000Z' });
    r.push(test(G, 'Silme soft delete olarak gider', sv.satirlar.get('sy_weights')?.silindi === true));

    // Bakıcı finans yazamaz
    b.m.set('sy_maliyet_ayar_v1', '{"hack":1}');
    const s6 = await senkronEt(b, sv.tasiyici(false), bosMeta(), { finansYetkisi: false });
    r.push(test(G, 'Bakıcı finans belgesi göndermez', !s6.rapor.hata && JSON.stringify(sv.satirlar.get('sy_maliyet_ayar_v1')!.deger) === '{"x":1}'));

    // Foto senkronu
    const yerel = new Map<string, string>([['f1', 'A']]);
    const uzak = new Map<string, string>([['f2', 'B']]);
    const blob = (x: string) => x as unknown as Blob;
    const fr = await fotoSenkron({
      yerelIdler: async () => ['f1', 'f2'],
      yerelOku: async (id) => (yerel.has(id) ? blob(yerel.get(id)!) : null),
      yerelYaz: async (id, x) => void yerel.set(id, x as unknown as string),
      uzakListe: async () => [...uzak.keys()].map((id) => ({ id, yol: id, silindi: false })),
      yukle: async (id, x) => void uzak.set(id, x as unknown as string),
      indir: async (y) => blob(uzak.get(y)!),
    });
    r.push(test(G, 'Fotoğraflar iki yönlü eşitlenir', fr.yuklenen === 1 && fr.indirilen === 1 && yerel.get('f2') === 'B' && uzak.get('f1') === 'A'));

    // İstemci: doğru uç noktalar ve başlıklar
    const cagrilar: { url: string; init: RequestInit }[] = [];
    const sahteFetch = (async (url: string, init: RequestInit) => {
      cagrilar.push({ url, init });
      return new Response('[]', { status: 200 });
    }) as unknown as typeof fetch;
    const c = new BulutIstemci({ url: 'https://ornek.supabase.co', anonKey: 'anon' }, sahteFetch);
    await c.kodGonder('a@b.com');
    const o = { access_token: 'T', refresh_token: 'R', expires_at: 0, kullanici_id: 'u', eposta: '' };
    await c.tasiyici(o, 'c1').cek('2026-01-01T00:00:00Z');
    r.push(test(G, 'OTP ucu çağrılır', cagrilar[0].url.endsWith('/auth/v1/otp')));
    r.push(test(G, 'Çekme çiftliğe ve imlece göre filtreler', cagrilar[1].url.includes('ciftlik_id=eq.c1') && cagrilar[1].url.includes('sunucu_zamani=gt.')));
    r.push(test(G, 'Kullanıcı jetonu gönderilir', (cagrilar[1].init.headers as Record<string, string>).Authorization === 'Bearer T'));

    // Şema: RLS ve finans kuralı
    const sql = readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8');
    r.push(test(G, 'Şemada tüm tablolarda RLS açık', ['ciftlik', 'ciftlik_uye', 'ciftlik_davet', 'belge', 'foto'].every((t) => sql.includes(`alter table public.${t} enable row level security`))));
    r.push(test(G, 'Bakıcı finans=false sunucuda zorlanır', sql.includes("if new.rol = 'bakici' then new.finans := false")));
    r.push(test(G, 'Finans belgesi okuma politikası', /belge_oku[\s\S]*not finans or finans_gorur/.test(sql)));
    return r;
  },
};
