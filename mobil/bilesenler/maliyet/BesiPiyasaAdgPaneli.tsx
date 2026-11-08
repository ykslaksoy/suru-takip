import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BesiPiyasaOzet } from '@/kaynak/maliyet/besi-plan-piyasa-ozet';
import { piyasaReferansYenile } from '@/kaynak/maliyet/besi-piyasa-kayit';
import type { AdgKanitSenaryo } from '@/kaynak/maliyet/besi-adg-kanit';
type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string; card: string };

const ADG: { kod: AdgKanitSenaryo; etiket: string }[] = [
  { kod: 'beklenen', etiket: 'Beklenen 250' },
  { kod: 'iyimser', etiket: 'İyimser 320' },
  { kod: 'muhafazakar', etiket: 'Muhaf. 200' },
];

export function BesiPiyasaAdgPaneli({
  ozet,
  satisKaynak,
  adgKanit,
  yemIllustrasyon,
  onAdgKanit,
  onYemIllustrasyon,
  refreshDurum,
  colors,
}: {
  ozet: BesiPiyasaOzet;
  adgKanit: AdgKanitSenaryo;
  yemIllustrasyon: boolean;
  onAdgKanit: (k: AdgKanitSenaryo) => void;
  onYemIllustrasyon: (v: boolean) => void;
  refreshDurum: string | null;
  colors: Colors;
}) {
  const satir = (u: BesiPiyasaOzet['ufuk60'], baslik: string) => (
    <View key={baslik} style={{ marginTop: 8 }}>
      <Text style={{ color: colors.text, fontWeight: '800' }}>{baslik}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
        Çıkış ~{u.cikisKg ?? '—'} kg · satış {u.satisBas?.toLocaleString('tr-TR') ?? '—'} ₺ · yem ({u.yemKaynak}){' '}
        {u.yemBas?.toLocaleString('tr-TR') ?? '—'} ₺
      </Text>
      <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 13 }}>
        {u.brutKar.etiket}: {u.brutKar.brutKar?.toLocaleString('tr-TR') ?? 'eksik'} ₺/baş
      </Text>
    </View>
  );

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800' }}>Piyasa + ADG (t355u/t356u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 6 }}>
        Alış 12.000 ayrı · sağlık 150 ve sabit giderler brüt kârda yok. Otomatik borsa parse yok.
      </Text>
      <Pressable
        onPress={() => void piyasaReferansYenile()}
        style={[styles.btn, { borderColor: colors.tint, marginBottom: 8 }]}>
        <Text style={{ color: colors.tint, fontSize: 11 }}>Referans durumunu yenile (manuel_only)</Text>
      </Pressable>
      {refreshDurum ? <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{refreshDurum}</Text> : null}

      <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 11, marginTop: 4 }}>Bölgesel karşılaştırma (temel karıştırma)</Text>
      {ozet.karsilastirma.map((k) => (
        <Text
          key={k.kod}
          style={{
            color: k.secili ? colors.tint : colors.textSecondary,
            fontSize: 10,
            fontWeight: k.secili ? '700' : '400',
          }}>
          {k.secili ? '★ ' : '· '}
          {k.etiket}: {k.deger?.toLocaleString('tr-TR') ?? '—'} ₺/{k.birim === 'canli_kg' ? 'canlı kg' : 'karkas kg'}{' '}
          ({k.islemTarihi ?? '—'}, {k.durum}
          {k.min != null && k.max != null && k.min !== k.max ? `, ${k.min}–${k.max}` : ''})
        </Text>
      ))}

      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8 }}>ADG kanıt senaryosu (25 kg giriş)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {ADG.map((a) => (
          <Pressable
            key={a.kod}
            onPress={() => onAdgKanit(a.kod)}
            style={{
              padding: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: adgKanit === a.kod ? colors.tint : colors.border,
            }}>
            <Text style={{ color: colors.text, fontSize: 10 }}>{a.etiket}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
        {ozet.kanit.kaynakAd} · {ozet.kanit.gcaaGramGun} g/gün ({ozet.kanit.min}–{ozet.kanit.max})
      </Text>
      <Text style={{ color: colors.tint, fontSize: 11, marginTop: 4 }}>
        Irk politikası: {ozet.irkPolitikasi.etiket}
        {ozet.irkPolitikasi.iyimserGcaaUst != null ? ` · iyimser üst ${ozet.irkPolitikasi.iyimserGcaaUst} g/gün` : ''}
      </Text>

      <Pressable onPress={() => onYemIllustrasyon(!yemIllustrasyon)} style={{ marginVertical: 8 }}>
        <Text style={{ color: colors.tint, fontWeight: '700' }}>
          İllüstrasyon yem 60g: {yemIllustrasyon ? 'AÇIK' : 'kapalı'} (plan yem yoksa)
        </Text>
      </Pressable>

      {satir(ozet.ufuk60, '60 gün')}
      {satir(ozet.ufuk90, '90 gün')}

      {ozet.uyari.slice(0, 4).map((u) => (
        <Text key={u} style={{ color: colors.warning, fontSize: 10, marginTop: 2 }}>
          · {u}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
  btn: { borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
});
