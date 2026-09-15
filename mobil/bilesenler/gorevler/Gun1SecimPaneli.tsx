import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import {
  GUN1_MIN_STANDART_PROGRAM_IDS,
  GUN1_SECENEKLER,
  etkinMinStandartIdsAsync,
  eksikMinStandart,
  gun1KalemEtiketleri,
  gun1ProgramIdsForMod,
  kalemFayda,
  kalemLabel,
  minStandartFaydaSatirlari,
  minStandartTavsiyeMesaji,
  type Gun1SecimMod,
} from '@/kaynak/gorevler/gun1-secim';

type ColorsT = (typeof Colors)['light'];

type Props = {
  colors: ColorsT;
  /** Kaydedilmiş seçim özeti — gösterimde */
  kayitOzet?: { mod: Gun1SecimMod; adet: number; programIds?: string[] } | null;
  onKaydet: (mod: Gun1SecimMod, programIds: string[]) => void;
  onDegistir?: () => void;
  /** true = seçim formu; false = özet şeridi */
  secimAcik: boolean;
};

/**
 * Gün 1: önce ne yapılacağını seç — soft min. standart tavsiyesi, engel yok.
 */
export function Gun1SecimPaneli({
  colors,
  kayitOzet,
  onKaydet,
  onDegistir,
  secimAcik,
}: Props) {
  const [mod, setMod] = useState<Gun1SecimMod | null>(null);
  const [ozel, setOzel] = useState<Set<string>>(
    () => new Set([gun1ProgramIdsForMod('sadece-tartim')[0]!]),
  );
  const [standart, setStandart] = useState<string[]>([
    ...GUN1_MIN_STANDART_PROGRAM_IDS,
  ]);
  const [tavsiyeOnay, setTavsiyeOnay] = useState(false);
  const [sonEklenenFayda, setSonEklenenFayda] = useState<string | null>(null);
  const kalemler = useMemo(() => gun1KalemEtiketleri(), []);

  useEffect(() => {
    void etkinMinStandartIdsAsync().then(setStandart);
  }, []);

  const secilenIds = useMemo(() => {
    if (!mod) return [] as string[];
    if (mod === 'ozel') return Array.from(ozel);
    return gun1ProgramIdsForMod(mod, undefined, standart);
  }, [mod, ozel, standart]);

  const eksikler = useMemo(
    () => eksikMinStandart(secilenIds, standart),
    [secilenIds, standart],
  );
  const tavsiye = minStandartTavsiyeMesaji(eksikler);

  if (!secimAcik && kayitOzet) {
    const oncekiEksik = eksikMinStandart(
      kayitOzet.programIds ?? [],
      standart,
    );
    const faydaSatir =
      oncekiEksik.length > 0
        ? minStandartFaydaSatirlari(oncekiEksik)
        : [];
    return (
      <View
        style={[
          styles.ozet,
          { backgroundColor: colors.background, borderColor: colors.tint },
        ]}
      >
        <Text style={[styles.ozetBaslik, { color: colors.text }]}>
          Bugün: {GUN1_SECENEKLER.find((s) => s.mod === kayitOzet.mod)?.baslik}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
          {kayitOzet.adet} adım · tartı seçildiyse önce
        </Text>
        {oncekiEksik.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              Minimum paketten eksik: {oncekiEksik.map(kalemLabel).join(' · ')}.
              İstersen sonra ekle — kazanım:
            </Text>
            {faydaSatir.slice(0, 3).map((s) => (
              <Text
                key={s}
                style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 16 }}
              >
                · {s}
              </Text>
            ))}
          </View>
        ) : null}
        {onDegistir ? (
          <Pressable onPress={onDegistir} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 13 }}>
              Seçimi değiştir
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const toggleOzel = (id: string) => {
    setOzel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
        setSonEklenenFayda(null);
      } else {
        n.add(id);
        setSonEklenenFayda(kalemFayda(id));
      }
      return n;
    });
    setTavsiyeOnay(false);
  };

  const tavsiyeEdilenleriEkle = () => {
    if (mod === 'ozel') {
      setOzel((prev) => {
        const n = new Set(prev);
        for (const id of eksikler) n.add(id);
        return n;
      });
      const satirlar = minStandartFaydaSatirlari(eksikler);
      setSonEklenenFayda(satirlar[0] ?? null);
    } else {
      setMod('hepsi');
      setSonEklenenFayda(
        minStandartFaydaSatirlari(eksikler)[0] ??
          'Minimum standart paketi seçildi.',
      );
    }
    setTavsiyeOnay(false);
  };

  const basla = (engeliAtla = false) => {
    if (!mod) return;
    const ids =
      mod === 'ozel'
        ? Array.from(ozel)
        : gun1ProgramIdsForMod(mod, undefined, standart);
    if (ids.length === 0) return;
    const eksik = eksikMinStandart(ids, standart);
    if (eksik.length > 0 && !engeliAtla && !tavsiyeOnay) {
      setTavsiyeOnay(true);
      return;
    }
    onKaydet(mod, ids);
  };

  return (
    <View style={[styles.kutu, { borderColor: colors.tint, backgroundColor: colors.card }]}>
      <Text style={[styles.baslik, { color: colors.text }]}>
        Bugün ne yapacaksın?
      </Text>
      <Text style={[styles.alt, { color: colors.textSecondary }]}>
        Minimum standart: tartı · İvermektin · Albendazol · karma · Selenyum-E.
        Tartarken aynı gün aşı/iğne de olur. Yem ayrı. A-D3-E / B yalnız gerekliyse.
      </Text>

      {GUN1_SECENEKLER.map((s) => {
        const on = mod === s.mod;
        return (
          <Pressable
            key={s.mod}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              setMod(s.mod);
              setTavsiyeOnay(false);
              setSonEklenenFayda(null);
            }}
            style={[
              styles.secenek,
              {
                borderColor: on ? colors.tint : colors.border,
                backgroundColor: on ? colors.background : colors.card,
              },
            ]}
          >
            <Text style={[styles.secenekBaslik, { color: colors.text }]}>{s.baslik}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              {s.aciklama}
            </Text>
          </Pressable>
        );
      })}

      {mod === 'ozel' ? (
        <View style={styles.liste}>
          <Text style={[styles.listeBaslik, { color: colors.tint }]}>İşaretle</Text>
          {kalemler.map((k) => {
            const on = ozel.has(k.programId);
            return (
              <Pressable
                key={k.programId}
                onPress={() => toggleOzel(k.programId)}
                style={[
                  styles.chip,
                  {
                    borderColor: on ? colors.tint : colors.border,
                    backgroundColor: on ? colors.tint : colors.background,
                    opacity: k.opsiyonel && !on ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: on ? '#fff' : colors.text,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {on ? '✓ ' : ''}
                  {k.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {sonEklenenFayda ? (
        <View
          style={[
            styles.faydaKutu,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 12 }}>
            Ekleyince ne kazanırsın
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
            {sonEklenenFayda}
          </Text>
        </View>
      ) : null}

      {tavsiyeOnay && tavsiye ? (
        <View
          style={[
            styles.tavsiye,
            { borderColor: colors.tint, backgroundColor: colors.background },
          ]}
        >
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '600' }}>
            {tavsiye}
          </Text>
          {minStandartFaydaSatirlari(eksikler).map((s) => (
            <Text
              key={s}
              style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 16 }}
            >
              · {s}
            </Text>
          ))}
          <View style={styles.tavsiyeBtnRow}>
            <Pressable
              onPress={tavsiyeEdilenleriEkle}
              style={[styles.tavsiyeBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.ctaText}>Tavsiye edilenleri ekle</Text>
            </Pressable>
            <Pressable
              onPress={() => basla(true)}
              style={[styles.tavsiyeBtn, { borderWidth: 1, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
                Kendi yolumla devam
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => basla(false)}
        disabled={!mod || (mod === 'ozel' && ozel.size === 0)}
        style={[
          styles.cta,
          {
            backgroundColor: colors.tint,
            opacity: !mod || (mod === 'ozel' && ozel.size === 0) ? 0.45 : 1,
          },
        ]}
      >
        <Text style={styles.ctaText}>Seçtiklerimle devam</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  baslik: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  alt: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  secenek: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  secenekBaslik: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  liste: { marginTop: 4, marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listeBaslik: {
    width: '100%',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  faydaKutu: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  tavsiye: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  tavsiyeBtnRow: { marginTop: 10, gap: 8 },
  tavsiyeBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cta: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  ozet: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ozetBaslik: { fontSize: 14, fontWeight: '800' },
});
