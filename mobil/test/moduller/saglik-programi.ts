import { test as sonuc, type TestModul } from '../cerceve';

const G = 'Bölge/ırk sağlık programı';
function test(ad: string, fn: () => void) {
  try {
    fn();
    return sonuc(G, ad, true);
  } catch (e) {
    return sonuc(G, ad, false, (e as Error).message);
  }
}
import { ASI_PROGRAMI } from '@/kaynak/cekirdek/asi-programi';
import { VITAMIN_PROGRAMI } from '@/kaynak/akilli-veteriner/vitamin-programi';
import {
  adimDuzenle, adimEkle, adimSil, adimVarsayilanaDon, ayarFarkli, bosDuzenleme, degisiklikSayisi, etkinProgram,
  girisSablonAdimlari, plandanAktar, trakyaDurumu, varsayilanProgram, type UretimAyari,
} from '@/kaynak/saglik-programi/hesap';
import { planVadeleri } from '@/kaynak/gorevler/plan-takvim';
import type { Animal } from '@/kaynak/cekirdek/tipler';

const ok = (k: boolean, m: string) => { if (!k) throw new Error(m); };
const ids = (u: UretimAyari) => varsayilanProgram(u).map((a) => a.programId);
const U = (y: Partial<UretimAyari> = {}): UretimAyari => ({ modId: 'mod1', bolge: 'ic-anadolu', irk: 'akkaraman', ...y });
const katalog = new Set([...ASI_PROGRAMI.map((p) => p.id), ...VITAMIN_PROGRAMI.map((v) => v.id)]);

export const saglikProgramiModul: TestModul = {
  grup: G,
  calistir: () => [
    test('Mod 1 Gün 1 paketi her bölgede var', () => {
      for (const b of ['marmara', 'ege', 'akdeniz', 'ic-anadolu', 'karadeniz', 'dogu-anadolu', 'guneydogu-anadolu'] as const) {
        const l = ids(U({ bolge: b }));
        for (const id of ['ivermektin', 'albendazol', 'karma', 'selen-e']) ok(l.includes(id), `${b} ${id}`);
      }
    }),
    test('Yalnız katalog kalemleri, her adımda neden', () => {
      for (const a of varsayilanProgram(U({ bolge: 'dogu-anadolu', modId: 'mod4', irk: 'ivesi' }))) {
        ok(katalog.has(a.programId), a.programId);
        ok(a.neden.length > 5, 'neden');
      }
    }),
    test('Trakya: PPR yok; İstanbul belirsiz uyarılı', () => {
      ok(trakyaDurumu('marmara', 'Kırklareli') === 'trakya', 'kirklareli');
      ok(!ids(U({ bolge: 'marmara', il: 'Edirne' })).includes('ppr'), 'edirne ppr');
      ok(ids(U({ bolge: 'marmara', il: 'Bursa' })).includes('ppr'), 'bursa ppr');
      const ist = varsayilanProgram(U({ bolge: 'marmara', il: 'İstanbul' })).find((a) => a.programId === 'ppr');
      ok(!!ist && /Avrupa/.test(ist.neden), 'istanbul');
    }),
    test('Şarbon Doğu/İç Anadolu; kelebek Karadeniz/Doğu', () => {
      ok(ids(U({ bolge: 'dogu-anadolu' })).includes('sarbon'), 'dogu');
      ok(!ids(U({ bolge: 'ege' })).includes('sarbon'), 'ege');
      ok(ids(U({ bolge: 'karadeniz' })).includes('triklabendazol'), 'karadeniz');
      ok(!ids(U({ bolge: 'akdeniz' })).includes('triklabendazol'), 'akdeniz');
    }),
    test('Agalaksi: süt modu veya süt ırkı (damızlık); Mod 1 yok', () => {
      ok(ids(U({ modId: 'mod4', irk: 'akkaraman' })).includes('agalaksi'), 'mod4');
      ok(ids(U({ modId: 'mod3', irk: 'sakiz' })).includes('agalaksi'), 'sakiz');
      ok(!ids(U({ irk: 'ivesi' })).includes('agalaksi'), 'mod1');
    }),
    test('Aşı sırası Karma → Çiçek → PPR → Şarbon → Şap', () => {
      const a = varsayilanProgram(U({ bolge: 'dogu-anadolu' })).filter((x) => x.bolum === 'asi').map((x) => x.programId);
      ok(a.join(',') === 'karma,cicek,ppr,sarbon,sap', a.join(','));
    }),
    test('Parti ırkı padok sınırlı ek adım', () => {
      const p = varsayilanProgram(U({ modId: 'mod3', partiIrk: { 'Padok C': 'sakiz' } }));
      const ag = p.find((x) => x.programId === 'agalaksi');
      ok(!!ag && ag.padoklar?.[0] === 'Padok C', 'padok');
      const an = (id: string, paddock: string) => ({ id, paddock, status: 'healthy', createdAt: '2026-10-01' }) as Animal;
      const { plan, zaman } = plandanAktar(p);
      const v = planVadeleri({ animals: [an('1', 'Padok A'), an('2', 'Padok C')], health: [], plan, zaman, now: Date.UTC(2026, 9, 2) });
      const agv = v.filter((x) => x.programId === 'agalaksi').map((x) => x.animalId);
      ok(agv.join() === '2', agv.join());
    }),
    test('Düzenle → değiştirildi; varsayılana dön; sil/ekle', () => {
      const v = varsayilanProgram(U());
      let d = bosDuzenleme();
      let e = etkinProgram(v, d);
      const kar = e.find((x) => x.programId === 'karma')!;
      d = adimDuzenle(d, kar, { gunSonra: 5, doz: 'Her kuzuya 3 ml' });
      e = etkinProgram(v, d);
      const k2 = e.find((x) => x.anahtar === 'karma')!;
      ok(k2.degisti && k2.gunSonra === 5, 'degisti');
      d = adimDuzenle(d, k2, { gunSonra: 1, doz: kar.doz });
      ok(!d.degisen.karma, 'esitse temiz');
      d = adimSil(d, kar);
      ok(!etkinProgram(v, d).some((x) => x.programId === 'karma'), 'sil');
      d = adimVarsayilanaDon(d, 'karma');
      ok(etkinProgram(v, d).some((x) => x.programId === 'karma'), 'geri');
      d = adimEkle(d, 'levamizol', v);
      const lev = etkinProgram(v, d).find((x) => x.programId === 'levamizol')!;
      ok(lev.eklendi && lev.degisti, 'ekle');
      ok(degisiklikSayisi(d) === 1, 'sayi');
    }),
    test('İlaç değişimi: yeni id + doz; bölge değişince düzenleme korunur', () => {
      const v = varsayilanProgram(U());
      const iv = etkinProgram(v, bosDuzenleme()).find((x) => x.programId === 'ivermektin')!;
      const d = adimDuzenle(bosDuzenleme(), iv, { programId: 'doramektin' });
      const e2 = etkinProgram(varsayilanProgram(U({ bolge: 'karadeniz' })), d);
      ok(e2.some((x) => x.programId === 'doramektin' && x.degisti) && !e2.some((x) => x.programId === 'ivermektin'), 'korundu');
      ok(e2.some((x) => x.programId === 'triklabendazol'), 'yeni bolge adimi');
      ok(ayarFarkli(U(), U({ bolge: 'karadeniz' })) && !ayarFarkli(U(), U()), 'fark');
    }),
    test('Plana aktarım + giriş şablonu', () => {
      const { plan, zaman } = plandanAktar(varsayilanProgram(U()));
      ok(plan.parazit.includes('ivermektin') && plan.vitamin.includes('selen-e'), 'plan');
      ok(zaman.cicek.gunSonra === 7, 'zaman');
      const s = girisSablonAdimlari(varsayilanProgram(U()));
      ok(s[0].tur === 'tartim' && s.length === 5, String(s.length));
    }),
  ],
};
