import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ButceTaslak, OrtakGiderPaylasim } from '@/kaynak/maliyet/besi-plan-butce-tipler';
import type { ButceMutabakatSonuc } from '@/kaynak/maliyet/besi-plan-butce-hesap';
import { ornekButce12000, ornekButce12500 } from '@/kaynak/maliyet/besi-plan-butce-hesap';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string; card: string };

const DONEM_SEC: { kod: OrtakGiderPaylasim['donem']; etiket: string }[] = [
  { kod: 'bilinmiyor', etiket: 'Bilinmiyor' },
  { kod: 'döngü_tamami', etiket: 'Döngü tamamı' },
  { kod: 'aylik', etiket: 'Aylık' },
  { kod: 'yillik', etiket: 'Yıllık' },
];

export function BesiButceMutabakatPaneli({
  taslak,
  sonuc,
  onChange,
  colors,
  planKilitli,
}: {
  taslak: ButceTaslak;
  sonuc: ButceMutabakatSonuc;
  onChange: (t: ButceTaslak) => void;
  colors: Colors;
  planKilitli: boolean;
}) {
  const satirGuncelle = (id: string, tutar: string) => {
    if (planKilitli) return;
    const n = tutar.trim() === '' ? null : parseFloat(tutar.replace(',', '.'));
    onChange({
      ...taslak,
      satirlar: taslak.satirlar.map((s) =>
        s.id === id
          ? {
              ...s,
              tutar: n != null && Number.isFinite(n) ? n : null,
              degerDurumu: tutar.trim() === '' ? ('bilinmiyor' as const) : ('tutar' as const),
              kaynak: 'kullanici_girdi' as const,
            }
          : s,
      ),
    });
  };

  const ortakGuncelle = (alan: keyof ButceTaslak['ortak'], v: string | number | null) => {
    if (planKilitli) return;
    if (typeof v === 'string') {
      const n = v.trim() === '' ? null : parseFloat(v.replace(',', '.'));
      onChange({ ...taslak, ortak: { ...taslak.ortak, [alan]: n != null && Number.isFinite(n) ? n : null } });
    } else {
      onChange({ ...taslak, ortak: { ...taslak.ortak, [alan]: v } });
    }
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Bütçe mutabakatı (t344u / t349u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
        Yem 1080/270/80 eski taslak — yeni karşılaştırmada plan motoru ({sonuc.planYemGun} gün). 28,20 ₺/gün ortalaması kullanılmaz.
      </Text>
      {!planKilitli ? (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Pressable onPress={() => onChange(ornekButce12000())} style={[styles.btn, { borderColor: colors.tint }]}>
            <Text style={{ color: colors.tint, fontSize: 11 }}>Örnek 12.000 ₺/baş</Text>
          </Pressable>
          <Pressable onPress={() => onChange(ornekButce12500())} style={[styles.btn, { borderColor: colors.tint }]}>
            <Text style={{ color: colors.tint, fontSize: 11 }}>Örnek 12.500 (500×25)</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Karşılaştırma günü (plan yem)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={String(taslak.karsilastirmaGun ?? 60)}
        keyboardType="number-pad"
        onEndEditing={(e) => {
          const n = parseInt(e.nativeEvent.text, 10);
          onChange({ ...taslak, karsilastirmaGun: Number.isFinite(n) && n > 0 ? n : 60 });
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Yem ₺/kg kaynak tarihi (araştırma)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.yemFiyatKaynakTarih ?? ''}
        placeholder="örn. 2026-11-08 veya boş"
        onEndEditing={(e) => onChange({ ...taslak, yemFiyatKaynakTarih: e.nativeEvent.text.trim() || null })}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      {taslak.satirlar
        .filter((s) => s.sinif === 'besi_isletme')
        .map((s) => (
          <View key={s.id} style={{ marginBottom: 6, opacity: s.karsilastirmaHaric ? 0.55 : 1 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              {s.etiket} (₺/baş){s.karsilastirmaHaric ? ' · taslak dışı' : ''}
            </Text>
            <TextInput
              editable={!planKilitli}
              defaultValue={s.tutar != null ? String(s.tutar) : ''}
              keyboardType="decimal-pad"
              onEndEditing={(e) => satirGuncelle(s.id, e.nativeEvent.text)}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
        ))}

      <View style={{ marginTop: 10, padding: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.tint }}>
        <Text style={{ color: colors.tint, fontWeight: '800' }}>Yeni karşılaştırma (alış 12.000 + plan yem + aşı…)</Text>
        {sonuc.yeniKarsilastirmaSatirlar.map((s) => (
          <Text key={s.etiket} style={{ color: colors.textSecondary, fontSize: 12 }}>
            · {s.etiket}: {s.tutar?.toLocaleString('tr-TR') ?? '—'} ₺ {s.not ? `(${s.not})` : ''}
          </Text>
        ))}
        <Text style={{ color: colors.text, fontWeight: '700', marginTop: 4 }}>
          Toplam: {sonuc.yeniKarsilastirmaToplam != null ? `${sonuc.yeniKarsilastirmaToplam.toLocaleString('tr-TR')} ₺/baş` : 'eksik — 0 yazılmaz'}
        </Text>
        {sonuc.planYemEksik.map((e) => (
          <Text key={e} style={{ color: colors.warning, fontSize: 11 }}>
            · {e}
          </Text>
        ))}
        {sonuc.yeniKarsilastirmaDenge != null ? (
          <Text style={{ color: colors.tint, fontWeight: '700', marginTop: 4 }}>
            {sonuc.yeniDengeEtiket}: {sonuc.yeniKarsilastirmaDenge.toLocaleString('tr-TR')} ₺/baş
          </Text>
        ) : null}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>Kullanıcı iddia toplam maliyet (₺/baş)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.kullaniciIddiaToplamMaliyet != null ? String(taslak.kullaniciIddiaToplamMaliyet) : ''}
        keyboardType="decimal-pad"
        onEndEditing={(e) => {
          const n = parseFloat(e.nativeEvent.text.replace(',', '.'));
          onChange({ ...taslak, kullaniciIddiaToplamMaliyet: Number.isFinite(n) ? n : null });
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Satış gelir varsayımı (₺/baş)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.satisGelirBas != null ? String(taslak.satisGelirBas) : ''}
        keyboardType="decimal-pad"
        onEndEditing={(e) => {
          const n = parseFloat(e.nativeEvent.text.replace(',', '.'));
          onChange({ ...taslak, satisGelirBas: Number.isFinite(n) ? n : null });
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      <Text style={{ color: colors.text, fontWeight: '800', marginTop: 10 }}>Ortak gider (ham: {sonuc.ortakGiderHam?.toLocaleString('tr-TR') ?? '—'} ₺)</Text>
      {(['kira', 'coban', 'elektrik', 'digerToplam'] as const).map((k) => (
        <View key={k}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            {k === 'digerToplam' ? 'Diğer (toplu — kullanıcı)' : k}
          </Text>
          <TextInput
            editable={!planKilitli}
            defaultValue={taslak.ortak[k] != null ? String(taslak.ortak[k]) : ''}
            keyboardType="decimal-pad"
            onEndEditing={(e) => ortakGuncelle(k, e.nativeEvent.text)}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </View>
      ))}
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>Dönem türü</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {DONEM_SEC.map((d) => (
          <Pressable
            key={d.kod}
            disabled={planKilitli}
            onPress={() => ortakGuncelle('donem', d.kod)}
            style={{
              padding: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: taslak.ortak.donem === d.kod ? colors.tint : colors.border,
            }}>
            <Text style={{ color: colors.text, fontSize: 11 }}>{d.etiket}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Dönem adedi (ör. ay sayısı)</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.ortak.donemAdet != null ? String(taslak.ortak.donemAdet) : ''}
        keyboardType="number-pad"
        onEndEditing={(e) => ortakGuncelle('donemAdet', e.nativeEvent.text)}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Paylaşım hayvan sayısı</Text>
      <TextInput
        editable={!planKilitli}
        defaultValue={taslak.ortak.payBasSayisi != null ? String(taslak.ortak.payBasSayisi) : ''}
        keyboardType="number-pad"
        onEndEditing={(e) => ortakGuncelle('payBasSayisi', e.nativeEvent.text)}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      {sonuc.ortakBasBasi != null ? (
        <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700' }}>
          Ortak gider ≈ {sonuc.ortakBasBasi.toLocaleString('tr-TR')} ₺/baş (ham ÷ pay baş; net kâr değil)
        </Text>
      ) : null}
      {sonuc.ortakEksik.map((e) => (
        <Text key={e} style={{ color: colors.warning, fontSize: 11 }}>
          · {e}
        </Text>
      ))}

      <View style={{ marginTop: 10 }}>
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Eski kullanıcı tablosu (taslak geçmişi)</Text>
        <Text style={{ color: colors.text, fontWeight: '800' }}>
          Listelenen: {Number.isFinite(sonuc.listelenenToplam) ? sonuc.listelenenToplam.toLocaleString('tr-TR') : 'eksik'} ₺/baş
        </Text>
        {sonuc.taslakDisiKalemler.map((s) => (
          <Text key={s.etiket} style={{ color: colors.textSecondary, fontSize: 10 }}>
            (hariç) {s.etiket} {s.tutar?.toLocaleString('tr-TR')} ₺
          </Text>
        ))}
        {sonuc.farkAciklama ? <Text style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>{sonuc.farkAciklama}</Text> : null}
        {sonuc.isletmeOncesiDenge != null ? (
          <Text style={{ color: colors.textSecondary, fontWeight: '600', marginTop: 4 }}>
            {sonuc.dengeEtiket}: {sonuc.isletmeOncesiDenge.toLocaleString('tr-TR')} ₺/baş
          </Text>
        ) : null}
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>{sonuc.nakitGereksinimNot}</Text>
        {sonuc.uyari.slice(0, 5).map((u) => (
          <Text key={u} style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>
            · {u}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 4, fontSize: 15 },
  btn: { borderWidth: 1, borderRadius: 8, padding: 8 },
});
