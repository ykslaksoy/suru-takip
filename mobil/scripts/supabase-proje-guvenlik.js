/**
 * SuperKuzu Supabase proje ref doğrulaması — yanlış projeye (SuperAri) asla bağlanma.
 */
const IZINLI_REF = 'eferktaopilgoeetgggk';
const YASAK_REF = 'ssminvxldxaqnzizbrfy';

function refSupabaseUrlden(url) {
  const m = String(url ?? '')
    .trim()
    .match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1].toLowerCase() : '';
}

function refPostgresUrlden(url) {
  const s = String(url ?? '');
  const m1 = s.match(/postgres\.([a-z0-9]{20,})/i);
  if (m1) return m1[1].toLowerCase();
  const m2 = s.match(/@db\.([a-z0-9]+)\.supabase\.co/i);
  if (m2) return m2[1].toLowerCase();
  return '';
}

function tumRefler() {
  const refs = new Set();
  const urlKaynaklari = [
    process.env.SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ];
  for (const u of urlKaynaklari) {
    const r = refSupabaseUrlden(u);
    if (r) refs.add(r);
  }
  const pgKaynaklari = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];
  for (const u of pgKaynaklari) {
    const r = refPostgresUrlden(u);
    if (r) refs.add(r);
  }
  return [...refs];
}

/**
 * @returns {{ izinli: boolean, refs: string[], postgresUrl: string | null, hata?: string }}
 */
function dogrula() {
  const refs = tumRefler();
  if (refs.includes(YASAK_REF)) {
    return {
      izinli: false,
      refs,
      postgresUrl: null,
      hata: `Yasak Supabase proje ref algılandı (${YASAK_REF}). SuperAri projesine bağlanma durduruldu.`,
    };
  }
  const yanlis = refs.filter((r) => r !== IZINLI_REF);
  if (yanlis.length > 0) {
    return {
      izinli: false,
      refs,
      postgresUrl: null,
      hata: `Beklenen ref ${IZINLI_REF}, algılanan: ${yanlis.join(', ')}`,
    };
  }
  if (refs.length > 0 && !refs.includes(IZINLI_REF)) {
    return {
      izinli: false,
      refs,
      postgresUrl: null,
      hata: `Supabase ref ${IZINLI_REF} bulunamadı (algılanan: ${refs.join(', ') || 'yok'})`,
    };
  }

  const postgresUrl =
    String(process.env.POSTGRES_URL_NON_POOLING ?? '').trim() ||
    String(process.env.POSTGRES_URL ?? '').trim() ||
    null;

  const tumRefs = new Set(refs);
  if (postgresUrl) {
    const pgRef = refPostgresUrlden(postgresUrl);
    if (pgRef) tumRefs.add(pgRef);
    if (pgRef === YASAK_REF) {
      return {
        izinli: false,
        refs: [...tumRefs],
        postgresUrl: null,
        hata: 'Postgres URL SuperAri projesine işaret ediyor.',
      };
    }
    if (pgRef && pgRef !== IZINLI_REF) {
      return { izinli: false, refs: [...tumRefs], postgresUrl: null, hata: `Postgres ref uyuşmaz: ${pgRef}` };
    }
  }

  const supRef = refSupabaseUrlden(process.env.SUPABASE_URL);
  if (supRef) tumRefs.add(supRef);
  if (supRef && supRef !== IZINLI_REF) {
    return { izinli: false, refs: [...tumRefs], postgresUrl: null, hata: `SUPABASE_URL ref uyuşmaz: ${supRef}` };
  }

  const birlesik = [...tumRefs];
  if (birlesik.length > 0 && !birlesik.every((r) => r === IZINLI_REF)) {
    return {
      izinli: false,
      refs: birlesik,
      postgresUrl: null,
      hata: `Yalnız ${IZINLI_REF} izinli; algılanan: ${birlesik.join(', ')}`,
    };
  }

  return { izinli: true, refs: birlesik, postgresUrl };
}

module.exports = {
  IZINLI_REF,
  YASAK_REF,
  refSupabaseUrlden,
  refPostgresUrlden,
  dogrula,
};
