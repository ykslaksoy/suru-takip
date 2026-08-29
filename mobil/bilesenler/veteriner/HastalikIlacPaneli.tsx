/**
 * Hastalık kataloğu + ilaç malzeme listesi.
 * Aşı paneli ile aynı mantık: ana isim (küçük detay) + ml.
 */

import { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { DozSatir } from '@/bilesenler/veteriner/DozSatir';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import Colors from '@/sabitler/Renkler';
import {
  HASTALIK_REF_KG,
  hastalikMalzemeMetni,
  listeleHastaliklar,
  olusturHastalikMalzemeListesi,
  type HastalikIlacSatir,
  type HastalikListeOgesi,
  type HastalikMalzemeListe,
} from '@/kaynak/akilli-veteriner/hastalik-liste';

function IlacSatirGoster({ ilac, colors }: { ilac: HastalikIlacSatir; colors: (typeof Colors)['light'] }) {
  return (
    <View style={styles.ilacSatir}>
      <Text style={{ lineHeight: 20 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{ilac.ilacAdi}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '400' }}> ({ilac.tipEtiket})</Text>
      </Text>
      <DozSatir doz={ilac.doz} formul={ilac.formul} />
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
        {ilac.uygulama} · {ilac.siklik}
        {ilac.not ? ` · ${ilac.not}` : ''}
      </Text>
    </View>
  );
}

function HastalikKart({
  h,
  colors,
}: {
  h: HastalikListeOgesi;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={[styles.kart, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.kartBas}>
        <View style={{ flex: 1 }}>
          <Text style={{ lineHeight: 22 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{h.ad}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '400' }}> ({h.tibbiAd})</Text>
          </Text>
        </View>
        {h.bulasici ? (
          <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '700' }}>BULAŞICI</Text>
        ) : null}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
        {h.aciklama}
      </Text>
      {h.karantina ? (
        <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
          Ayır · karantina önerilir · etki ~{h.etkiSuresiGun} gün
        </Text>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          Etki ~{h.etkiSuresiGun} gün
        </Text>
      )}

      <Text style={[styles.altBaslik, { color: colors.tint }]}>Başlangıç</Text>
      {h.baslangic.map((ilac) => (
        <IlacSatirGoster key={ilac.id} ilac={ilac} colors={colors} />
      ))}

      <Text style={[styles.altBaslik, { color: colors.tint }]}>İleri derece</Text>
      {h.ileri.map((ilac) => (
        <IlacSatirGoster key={ilac.id} ilac={ilac} colors={colors} />
      ))}

      {h.suru.length > 0 ? (
        <>
          <Text style={[styles.altBaslik, { color: colors.tint }]}>Sürü / padok</Text>
          {h.suru.map((ilac) => (
            <IlacSatirGoster key={ilac.id} ilac={ilac} colors={colors} />
          ))}
        </>
      ) : null}
    </View>
  );
}

function MalzemeBolumu({
  liste,
  colors,
  onPaylas,
}: {
  liste: HastalikMalzemeListe;
  colors: (typeof Colors)['light'];
  onPaylas: () => void;
}) {
  if (liste.satirlar.length === 0) {
    return (
      <View style={[styles.malzemeWrap, { borderColor: colors.border }]}>
        <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>İlaç malzeme listesi</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{liste.ozet}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.malzemeWrap, { borderColor: colors.tint, backgroundColor: colors.tint + '08' }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 4 }}>İlaç malzeme listesi</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}>
        Aktif takip vakalarına göre · {liste.refKg} kg varsayılan
      </Text>

      {liste.satirlar.map((s) => (
        <View key={s.ilacAdi} style={[styles.malzemeSatir, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
            {s.ilacAdi}{' '}
            <Text style={{ fontSize: 10, fontWeight: '400', color: colors.textSecondary }}>({s.tipEtiket})</Text>
          </Text>
          <Text style={{ color: colors.tint, fontWeight: '700', marginTop: 2 }}>{s.dozEtiket}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {s.siklik} · {s.teshisAdlari.join(' · ')}
          </Text>
          <Text
            style={{
              color: s.eksikMl != null && s.eksikMl > 0 ? colors.danger : colors.success,
              fontSize: 12,
              fontWeight: '700',
              marginTop: 4,
            }}>
            {s.eksikMl != null && s.eksikMl > 0
              ? `Eksik ≈ ${String(s.eksikMl).replace('.', ',')} ml` +
                (s.stokAdi ? ` · stok: ${s.stokAdi} (${s.stokMiktar})` : '')
              : s.stokAdi
                ? `Stok yeterli (${s.stokAdi}: ${s.stokMiktar})`
                : 'Stok kaydı yok — ekleyin'}
          </Text>
        </View>
      ))}

      <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
        Şırınga tahmini: {liste.siringaAdedi} adet
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
        (İğne / aşı uygulamaları — {liste.ozet})
      </Text>

      <AnaButon title="Listeyi kopyala / paylaş" variant="secondary" onPress={onPaylas} />
    </View>
  );
}

/** Hastalık + ilaç kataloğu ve aktif vakalardan malzeme. */
export function HastalikIlacPaneli({ refreshKey = 0 }: { refreshKey?: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const katalog = listeleHastaliklar(HASTALIK_REF_KG);
  const [malzeme, setMalzeme] = useState<HastalikMalzemeListe | null>(null);

  const yukle = useCallback(async () => {
    setMalzeme(await olusturHastalikMalzemeListesi(HASTALIK_REF_KG));
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle, refreshKey]);

  return (
    <View style={styles.kok}>
      <Text style={[styles.baslik, { color: colors.text }]}>Hastalık ve ilaç listesi</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>
        Dozlar {HASTALIK_REF_KG} kg kuzu için örnektir. Uygulamada hayvan kilosuna göre yeniden hesaplanır.
      </Text>

      {katalog.map((h) => (
        <HastalikKart key={h.temaId} h={h} colors={colors} />
      ))}

      {malzeme ? (
        <MalzemeBolumu
          liste={malzeme}
          colors={colors}
          onPaylas={() => {
            void Share.share({ message: hastalikMalzemeMetni(malzeme) });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { marginTop: 8, marginBottom: 8 },
  baslik: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  kart: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  kartBas: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  altBaslik: { fontWeight: '800', fontSize: 12, marginTop: 12, marginBottom: 4 },
  ilacSatir: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000022',
    paddingTop: 6,
    marginTop: 4,
  },
  malzemeWrap: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14, marginBottom: 8 },
  malzemeSatir: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
});
