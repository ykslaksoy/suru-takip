import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KilitliHizliIslemler } from '@/bilesenler/ana-sayfa/KilitliHizliIslemler';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useDatabase } from '@/baglam/VeritabaniBaglami';
import { useAltGuvenliBosluk } from '@/bilesenler/ortak/guvenliAlan';
import { bulutSenkronAktif } from '@/sabitler/Ortam';
import {
  getAnaSayfaOzeti,
  KILITLI_SEZON_ETIKET,
  type AnaSayfaIs,
  type AnaSayfaOzet,
  type AnaSayfaPartiTon,
} from '@/kaynak/ana-sayfa/ozet';
import { KILITLI_MASKOT } from '@/kaynak/ana-sayfa/kilitli-gorseller';

type Renkler = (typeof Colors)['light'];

const PADOK_TON: Record<AnaSayfaPartiTon, string> = {
  a: '#2F80ED',
  b: '#219653',
  c: '#F2994A',
};

const IS_IKON: Record<string, keyof typeof Ionicons.glyphMap> = {
  asi: 'medkit-outline',
  stok: 'cube-outline',
  tartim: 'speedometer-outline',
  karantina: 'shield-checkmark-outline',
  bekletme: 'time-outline',
  yem: 'nutrition-outline',
  rasyon: 'nutrition-outline',
  saglik: 'heart-outline',
  yolculuk: 'map-outline',
};

const SEVIYE_RENK: Record<AnaSayfaIs['seviye'], string> = {
  kritik: '#C0392B',
  acil: '#C0392B',
  aksiyon: '#D68910',
  gorev: '#2d6a4f',
};

const SEVIYE_ETIKET: Record<AnaSayfaIs['seviye'], string> = {
  kritik: 'Kritik',
  acil: 'Acil',
  aksiyon: 'Aksiyon',
  gorev: 'Görev',
};

const BOS_OZET: AnaSayfaOzet = {
  hayvanSayisi: 0,
  gorevSayisi: 0,
  partiler: [],
  kritik: 0,
  aksiyon: 0,
  ortAdgGram: null,
  bugunIsler: [],
};

function selamla(d: Date): string {
  const s = d.getHours();
  if (s >= 5 && s < 12) return 'Günaydın';
  if (s >= 12 && s < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export function KilitliAnaSayfa() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const light = scheme === 'light';
  const { pendingSync, ready, refreshKey } = useDatabase();
  const { scrollPadBottom, headerPadTop, kisa, darTelefon } = useAltGuvenliBosluk(88);
  const [ozet, setOzet] = useState<AnaSayfaOzet>(BOS_OZET);
  const maskotBoy = kisa ? 76 : darTelefon ? 92 : 104;
  const yatayPad = darTelefon ? 16 : 20;

  const load = useCallback(async () => {
    setOzet(await getAnaSayfaOzeti());
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, refreshKey, load]);

  const simdi = useMemo(() => new Date(), [refreshKey]);
  const tarih = simdi.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  const isler = ozet.bugunIsler ?? [];

  const heroBg = light ? '#2d6a4f' : '#1f4a36';
  const heroText = '#ffffff';
  const heroSub = 'rgba(255,255,255,0.78)';

  return (
    <View style={StyleSheet.flatten([styles.shell, { backgroundColor: colors.background }])}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={StyleSheet.flatten([styles.scrollContent, { paddingBottom: scrollPadBottom }])}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── Üst kart ── */}
        <View style={{ paddingTop: headerPadTop, paddingHorizontal: yatayPad }}>
          <View style={StyleSheet.flatten([styles.hero, { backgroundColor: heroBg }])}>
            <View style={styles.heroUst}>
              <View
                style={StyleSheet.flatten([
                  styles.maskotDaire,
                  { width: maskotBoy, height: maskotBoy, borderRadius: maskotBoy / 2 },
                ])}>
                <Image
                  source={KILITLI_MASKOT}
                  style={{ width: maskotBoy * 0.96, height: maskotBoy * 0.96 }}
                  resizeMode="contain"
                  accessibilityLabel="Akıllı Kuzu"
                />
              </View>
              <View style={styles.heroMetin}>
                <View style={styles.heroSatir}>
                  <Text style={StyleSheet.flatten([styles.sezon, { color: heroSub }])}>{KILITLI_SEZON_ETIKET}</Text>
                  <BulutCipi pendingSync={pendingSync} />
                </View>
                <Text
                  style={StyleSheet.flatten([styles.selam, { color: heroText, fontSize: darTelefon ? 24 : 26 }])}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}>
                  {selamla(simdi)}
                </Text>
                <Text style={StyleSheet.flatten([styles.tarih, { color: heroSub }])} numberOfLines={1}>
                  {tarih}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <HeroStat
                sayi={`${ozet.hayvanSayisi}`}
                etiket="baş kuzu"
                onPress={() => router.push('/(tabs)/suru' as never)}
              />
              <HeroStat
                sayi={`${ozet.gorevSayisi}`}
                etiket="görev bugün"
                onPress={() => router.push('/gorevler' as never)}
              />
              {ozet.ortAdgGram != null ? (
                <HeroStat
                  sayi={`${ozet.ortAdgGram} g`}
                  etiket="günlük artış"
                  onPress={() => router.push('/(tabs)/yolculuk' as never)}
                />
              ) : (
                <HeroStat
                  sayi={`${ozet.partiler.length}`}
                  etiket="aktif parti"
                  onPress={() => router.push('/(tabs)/suru' as never)}
                />
              )}
            </View>

            {ozet.asiKestirme ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${ozet.asiKestirme.baslik}: ${ozet.asiKestirme.aciklama}`}
                onPress={() => router.push(ozet.asiKestirme!.href as never)}
                style={({ pressed }) =>
                  StyleSheet.flatten([
                    styles.asiKestirme,
                    {
                      backgroundColor: ozet.asiKestirme!.vurgu ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)',
                      opacity: pressed ? 0.88 : 1,
                    },
                  ])
                }>
                <View style={styles.asiKestirmeSol}>
                  <Ionicons name="medkit-outline" size={22} color="#fff" />
                  <View style={styles.asiKestirmeMetin}>
                    <Text style={styles.asiKestirmeBaslik}>{ozet.asiKestirme.baslik}</Text>
                    <Text style={styles.asiKestirmeAlt} numberOfLines={2}>
                      {ozet.asiKestirme.aciklama}
                    </Text>
                  </View>
                </View>
                {ozet.asiKestirme.rozet ? (
                  <View style={styles.asiRozet}>
                    <Text style={styles.asiRozetYazi}>{ozet.asiKestirme.rozet}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ── Bugün yapılacaklar ── */}
        <View style={StyleSheet.flatten([styles.bolum, { paddingHorizontal: yatayPad }])}>
          <View style={styles.bolumBaslik}>
            <Text style={StyleSheet.flatten([styles.bolumYazi, { color: colors.text }])}>Bugün yapılacaklar</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Akıllı Kuzu: ${ozet.kritik} kritik, ${ozet.aksiyon} aksiyon`}
              onPress={() => router.push('/(tabs)/akilli-kuzu' as never)}
              hitSlop={8}
              style={styles.rozetRow}>
              {ozet.kritik > 0 ? <Rozet sayi={ozet.kritik} etiket="kritik" renk="#C0392B" light={light} /> : null}
              {ozet.aksiyon > 0 ? <Rozet sayi={ozet.aksiyon} etiket="aksiyon" renk="#D68910" light={light} /> : null}
            </Pressable>
          </View>

          <View style={StyleSheet.flatten([styles.kart, { backgroundColor: colors.card, borderColor: colors.border }])}>
            {isler.length === 0 ? (
              <View style={styles.bos}>
                <Ionicons name="checkmark-circle" size={28} color={colors.tint} />
                <Text style={StyleSheet.flatten([styles.bosYazi, { color: colors.text }])}>Bugün acil iş yok</Text>
                <Text style={StyleSheet.flatten([styles.bosAlt, { color: colors.textSecondary }])}>
                  Sürü yolunda. Planlı işler Görevler’de.
                </Text>
              </View>
            ) : (
              isler.map((is, i) => <IsSatiri key={is.id} is={is} ilk={i === 0} colors={colors} light={light} />)
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tüm görevleri gör"
              onPress={() => router.push('/gorevler' as never)}
              style={({ pressed }) =>
                StyleSheet.flatten([styles.kartAlt, { borderTopColor: colors.border, opacity: pressed ? 0.7 : 1 }])
              }>
              <Text style={StyleSheet.flatten([styles.link, { color: colors.tint }])}>Tüm görevler</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.tint} />
            </Pressable>
          </View>
        </View>

        {/* ── Hızlı işlemler ── */}
        <KilitliHizliIslemler yatayPad={yatayPad} />

        {/* ── Partiler ── */}
        <View style={StyleSheet.flatten([styles.bolumBaslik, { paddingHorizontal: yatayPad }])}>
          <Text style={StyleSheet.flatten([styles.bolumYazi, { color: colors.text }])}>Aktif partiler</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tüm partileri gör"
            onPress={() => router.push('/(tabs)/suru' as never)}
            hitSlop={8}
            style={styles.linkRow}>
            <Text style={StyleSheet.flatten([styles.link, { color: colors.tint }])}>Tümünü gör</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tint} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: yatayPad, gap: 12, paddingBottom: 6 }}>
          {ozet.partiler.map((p) => {
            const renk = PADOK_TON[p.ton];
            return (
              <Pressable
                key={p.ad}
                accessibilityRole="button"
                accessibilityLabel={`${p.ad}, ${p.bas} baş, ${p.yasEtiket}`}
                onPress={() => router.push('/(tabs)/suru' as never)}
                style={({ pressed }) =>
                  StyleSheet.flatten([
                    styles.parti,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
                  ])
                }>
                <View style={styles.partiUst}>
                  <View style={StyleSheet.flatten([styles.harf, { backgroundColor: renk + (light ? '1A' : '33') }])}>
                    <Text style={StyleSheet.flatten([styles.harfYazi, { color: renk }])}>{p.harf}</Text>
                  </View>
                  <Text style={StyleSheet.flatten([styles.partiAd, { color: colors.text }])} numberOfLines={1}>
                    {p.ad}
                  </Text>
                </View>
                <Text style={StyleSheet.flatten([styles.partiBas, { color: colors.text }])}>
                  {p.bas}
                  <Text style={StyleSheet.flatten([styles.partiBirim, { color: colors.textSecondary }])}> baş</Text>
                </Text>
                <Text style={StyleSheet.flatten([styles.partiYas, { color: colors.textSecondary }])} numberOfLines={1}>
                  {p.yasEtiket}
                </Text>
                {p.ortKg != null ? (
                  <Text style={StyleSheet.flatten([styles.partiYas, { color: colors.textSecondary }])} numberOfLines={1}>
                    ort. {p.ortKg.toLocaleString('tr-TR')} kg
                  </Text>
                ) : null}
                <View style={StyleSheet.flatten([styles.serit, { backgroundColor: renk }])} />
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ height: 8 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </ScrollView>
    </View>
  );
}

/** Bulut kapalı / bekleyen kayıt — üst kartın içinde küçük çip (eski üst şeridin yerine) */
function BulutCipi({ pendingSync }: { pendingSync: number }) {
  const cloud = bulutSenkronAktif();
  const [gizli, setGizli] = useState(false);
  useEffect(() => {
    if (pendingSync > 0) setGizli(false);
  }, [pendingSync]);
  if (gizli || pendingSync <= 0) return null;
  const metin = cloud ? `${pendingSync} bekliyor` : `${pendingSync} yerel`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pendingSync} kayıt ${cloud ? 'senkron bekliyor' : 'yerel, bulut kapalı'}. Gizle`}
      onPress={() => setGizli(true)}
      hitSlop={8}
      style={styles.bulut}>
      <Ionicons name={cloud ? 'cloud-upload-outline' : 'cloud-offline-outline'} size={13} color="#fff" />
      <Text style={styles.bulutYazi} numberOfLines={1}>
        {metin}
      </Text>
    </Pressable>
  );
}

function HeroStat({ sayi, etiket, onPress }: { sayi: string; etiket: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sayi} ${etiket}`}
      onPress={onPress}
      style={({ pressed }) => StyleSheet.flatten([styles.stat, { opacity: pressed ? 0.8 : 1 }])}>
      <Text style={styles.statSayi} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {sayi}
      </Text>
      <Text style={styles.statEtiket} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {etiket}
      </Text>
    </Pressable>
  );
}

function Rozet({ sayi, etiket, renk, light }: { sayi: number; etiket: string; renk: string; light: boolean }) {
  return (
    <View style={StyleSheet.flatten([styles.rozet, { backgroundColor: renk + (light ? '18' : '33') }])}>
      <View style={StyleSheet.flatten([styles.rozetNokta, { backgroundColor: renk }])} />
      <Text style={StyleSheet.flatten([styles.rozetYazi, { color: light ? renk : '#fff' }])}>
        {sayi} {etiket}
      </Text>
    </View>
  );
}

function IsSatiri({ is, ilk, colors, light }: { is: AnaSayfaIs; ilk: boolean; colors: Renkler; light: boolean }) {
  const renk = SEVIYE_RENK[is.seviye];
  const ikon = IS_IKON[is.kaynak] ?? 'checkbox-outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${SEVIYE_ETIKET[is.seviye]}: ${is.baslik}. ${is.aciklama}`}
      onPress={() => router.push(is.href as never)}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.isRow,
          !ilk && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
          { opacity: pressed ? 0.75 : 1 },
        ])
      }>
      <View style={StyleSheet.flatten([styles.isIkon, { backgroundColor: renk + (light ? '16' : '33') }])}>
        <Ionicons name={ikon} size={22} color={light ? renk : '#fff'} />
      </View>
      <View style={styles.isMetin}>
        <Text style={StyleSheet.flatten([styles.isSeviye, { color: renk }])}>{SEVIYE_ETIKET[is.seviye]}</Text>
        <Text style={StyleSheet.flatten([styles.isBaslik, { color: colors.text }])} numberOfLines={1}>
          {is.baslik}
        </Text>
        <Text style={StyleSheet.flatten([styles.isAciklama, { color: colors.textSecondary }])} numberOfLines={2}>
          {is.aciklama}
        </Text>
      </View>
      <View style={StyleSheet.flatten([styles.yapBtn, { backgroundColor: light ? '#e7f2ea' : '#ffffff14' }])}>
        <Text style={StyleSheet.flatten([styles.yapYazi, { color: colors.tint }])}>Yap</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.tint} />
      </View>
    </Pressable>
  );
}

const golge = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: { borderRadius: 24, padding: 18, ...golge, shadowOpacity: 0.14 },
  heroUst: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  maskotDaire: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    flexShrink: 0,
  },
  heroMetin: { flex: 1, minWidth: 0 },
  heroSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sezon: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  selam: { fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  tarih: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  bulut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexShrink: 1,
  },
  bulutYazi: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statSayi: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statEtiket: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600', marginTop: 1 },
  asiKestirme: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  asiKestirmeSol: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  asiKestirmeMetin: { flex: 1, minWidth: 0 },
  asiKestirmeBaslik: { color: '#fff', fontSize: 14, fontWeight: '800' },
  asiKestirmeAlt: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  asiRozet: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  asiRozetYazi: { color: '#2d6a4f', fontWeight: '900', fontSize: 13 },
  bolum: { marginTop: 22, marginBottom: 22 },
  bolumBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  bolumYazi: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  rozetRow: { flexDirection: 'row', gap: 6 },
  rozet: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  rozetNokta: { width: 7, height: 7, borderRadius: 4 },
  rozetYazi: { fontSize: 13, fontWeight: '700' },
  kart: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...golge },
  isRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  isIkon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  isMetin: { flex: 1, minWidth: 0 },
  isSeviye: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  isBaslik: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  isAciklama: { fontSize: 14, fontWeight: '500', marginTop: 2, lineHeight: 19 },
  yapBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  yapYazi: { fontSize: 14, fontWeight: '800' },
  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bos: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, gap: 4 },
  bosYazi: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  bosAlt: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  link: { fontSize: 15, fontWeight: '700' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  parti: {
    width: 156,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    paddingBottom: 18,
    overflow: 'hidden',
    ...golge,
  },
  partiUst: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  harf: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  harfYazi: { fontSize: 15, fontWeight: '800' },
  partiAd: { fontSize: 15, fontWeight: '800', flex: 1 },
  partiBas: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  partiBirim: { fontSize: 15, fontWeight: '700' },
  partiYas: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  serit: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 },
});
