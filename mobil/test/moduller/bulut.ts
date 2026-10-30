import { bulutAcik, bulutAyarDogrula, SUPERARI_REF, SUPERKUZU_REF } from '@/kaynak/bulut/ayar';
import { finansMi, senkronlanirMi } from '@/kaynak/bulut/siniflama';
import { varsayilanEkip, yerelEkipProfiliVar } from '@/kaynak/ekip/hesap';
import { readFileSync } from 'fs';
import { test, type TestModul } from '../cerceve';

const G = 'Bulut eşitleme';

export const bulutModul: TestModul = {
  grup: G,
  async calistir() {
    const r = [];
    r.push(test(G, 'Env yokken bulut kapalı (özellik bayrağı)', !bulutAcik()));
    r.push(test(G, 'Ekip/PIN ve oturum cihazda kalır', !senkronlanirMi('sy_ekip_v1') && !senkronlanirMi('sy_bulut_oturum_v1') && !senkronlanirMi('sy_sync_queue')));
    r.push(test(G, 'Sürü kayıtları senkronlanır', senkronlanirMi('sy_animals') && senkronlanirMi('sy_foto_meta_v1')));
    r.push(test(G, 'Yerel ekip profili ayırt edilir', !yerelEkipProfiliVar(varsayilanEkip()) && yerelEkipProfiliVar({ ...varsayilanEkip(), kisiler: [{ ...varsayilanEkip().kisiler[0], pinOzet: 'x' }] })));
    r.push(test(G, 'Maliyet/sigorta finans sayılır', finansMi('sy_maliyet_ayar_v1') && finansMi('sy_sigorta_policeler_v1') && !finansMi('sy_animals')));

    // Proje kilidi: yalnız SuperKuzu Supabase
    r.push(test(G, 'SüperArı DB adresi reddedilir', bulutAyarDogrula('https://' + SUPERARI_REF + '.supabase.co', 'k') === null));
    r.push(test(G, 'SuperKuzu DB adresi kabul edilir', bulutAyarDogrula('https://' + SUPERKUZU_REF + '.supabase.co', 'k') !== null));

    // Şema: RLS ve finans kuralı
    const sql = readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8');
    r.push(test(G, 'Şemada tüm tablolarda RLS açık', ['ciftlik', 'ciftlik_uye', 'ciftlik_davet', 'belge', 'foto'].every((t) => sql.includes(`alter table public.${t} enable row level security`))));
    r.push(test(G, 'Bakıcı finans=false sunucuda zorlanır', sql.includes("if new.rol = 'bakici' then new.finans := false")));
    r.push(test(G, 'Finans belgesi okuma politikası', /belge_oku[\s\S]*not finans or finans_gorur/.test(sql)));
    return r;
  },
};
