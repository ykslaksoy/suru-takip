/**
 * Maliyet ve Kâr (Mod 1 besi) — parti başına alış + yem + ilaç → baş başı / kg başı maliyet, tahmini ve gerçek kâr.
 * Mevcut ekranlarda bu hesap yoktu; yeni ekran. Veriler stok hareketleri ve birim fiyatlardan kendiliğinden gelir.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { setBirimFiyat } from '@/kaynak/stok/fiyat';
import { oneriMetni, type FiyatDurum } from '@/kaynak/maliyet/tahmini-fiyat';
import { CANLI_KUZU_KG, referansTarihMetni } from '@/kaynak/maliyet/fiyat-referans';
import { fiyatSorusunuGec, getGecilenFiyatSorulari } from '@/kaynak/maliyet/fiyat-sorusu';
import { FiyatSorKarti } from '@/bilesenler/maliyet/FiyatSorKarti';
import { tl, type MaliyetAyar, type PartiMaliyet } from '@/kaynak/maliyet/hesap';
import { saveMaliyetAyar } from '@/kaynak/maliyet/depo';
import { maliyetTopla } from '@/kaynak/maliyet/topla';

type Alan = 'alisBasFiyat' | 'satisKgFiyat' | 'gercekSatisTutar';

export default function MaliyetScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [satirlar, setSatirlar] = useState<PartiMaliyet[] | null>(null);
  const [ayar, setAyar] = useState<MaliyetAyar>({ partiler: {}, hayvanAlis: {} });
  const [durumlar, setDurumlar] = useState<FiyatDurum[]>([]);
  const [gecilen, setGecilen] = useState<Record<string, string>>({});
  const [fiyatAcik, setFiyatAcik] = useState<string | null>(null);
  const [acik, setAcik] = useState<string | null>(null);

  const hesapla = useCallback(async (a?: MaliyetAyar) => {
    const [{ satirlar: st, durumlar: d, ayar: kayitli }, gec] = await Promise.all([maliyetTopla(a), getGecilenFiyatSorulari()]);
    setAyar(kayitli);
    setGecilen(gec);
    setDurumlar(d);
    setSatirlar(st);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void hesapla();
    }, [hesapla]),
  );

  const alanKaydet = async (parti: string, alan: Alan, metin: string) => {
    const n = parseFloat(metin.replace(/\./g, '').replace(',', '.'));
    const pa = { ...(ayar.partiler[parti] ?? {}) };
    if (Number.isFinite(n) && n > 0) pa[alan] = n;
    else delete pa[alan];
    const yeni = { ...ayar, partiler: { ...ayar.partiler, [parti]: pa } };
    await saveMaliyetAyar(yeni);
    await hesapla(yeni);
  };

  const gercekKaydet = async (stockId: string, fiyat: number) => {
    await setBirimFiyat(stockId, fiyat);
    setFiyatAcik(null);
    await hesapla();
  };
  const gec = async (anahtar: string) => {
    await fiyatSorusunuGec(anahtar);
    setFiyatAcik(null);
    await hesapla();
  };
  const tahminiler = durumlar.filter((d) => d.tur === 'tahmini');
  const fiyatsizlar = durumlar.filter((d) => d.tur === 'yok');
  /** İsteğe bağlı soru: henüz yanıtlanmamış ilk tahmini kalem (akışı engellemez) */
  const soru = fiyatAcik ? null : tahminiler.find((d) => !gecilen[d.stockId]) ?? null;
  const kaynakMetni = (d: FiyatDurum) =>
    d.ref?.kaynakAd ? `${d.ref.kaynakAd}${d.ref.veriTarihi ? ` · ${referansTarihMetni(d.ref.veriTarihi)}` : ''}` : '';
  const fiyatSor = (d: FiyatDurum) => (
    <FiyatSorKarti
      key={`sor-${d.stockId}`}
      baslik={`${d.ad} — birim fiyatını biliyor musun?`}
      birim={d.birim}
      oneri={oneriMetni(d)}
      altMetin={d.tur === 'tahmini' ? `Şimdilik tahmini fiyat kullanılıyor (${kaynakMetni(d)}).` : 'Fiyat bulunamadı; yazarsan maliyete eklenir.'}
      onKaydet={(f) => gercekKaydet(d.stockId, f)}
      onGec={() => gec(d.stockId)}
    />
  );
  const fiyatNum = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

  const toplam = satirlar?.reduce(
    (s, r) => ({ bas: s.bas + r.bas, maliyet: s.maliyet + r.toplam, kar: r.gercekKar ?? r.tahminiKar ?? null }),
    { bas: 0, maliyet: 0, kar: null as number | null },
  );

  const girdi = (parti: string, alan: Alan, etiket: string, oneri?: string) => (
    <View style={styles.girdi}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{etiket}</Text>
      <TextInput
        defaultValue={ayar.partiler[parti]?.[alan] ? String(ayar.partiler[parti]![alan]) : ''}
        keyboardType="decimal-pad"
        placeholder={oneri ?? '—'}
        placeholderTextColor={colors.textSecondary}
        onEndEditing={(e) => void alanKaydet(parti, alan, e.nativeEvent.text)}
        onBlur={(e) => void alanKaydet(parti, alan, (e.target as unknown as { value?: string })?.value ?? '')}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );

  const satir = (etiket: string, deger: string, vurgu?: string) => (
    <View style={styles.satir}>
      <Text style={{ color: colors.textSecondary }}>{etiket}</Text>
      <Text style={{ color: vurgu ?? colors.text, fontWeight: '700' }}>{deger}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Maliyet ve Kâr' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
          Parti başına alış + yem + ilaç. Yem ve ilaç maliyeti stok çıkışlarından ve girişte yazdığın birim fiyattan hesaplanır; fiyatı olmayan kalemde referans tablodan tahmini fiyat kullanılır.
        </Text>
        {soru ? fiyatSor(soru) : null}
        {tahminiler.length ? (
          <View style={[styles.bilgi, { borderColor: colors.tint, backgroundColor: colors.accent + '22' }]}>
            <Text style={{ color: colors.tint, fontWeight: '800' }}>ℹ {tahminiler.length} kalem tahmini fiyatla maliyete eklendi</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Gerçek fiyatı yazmak için kaleme dokun.</Text>
            {tahminiler.map((d) => (
              <View key={d.stockId}>
                <Pressable
                  onPress={() => setFiyatAcik((x) => (x === d.stockId ? null : d.stockId))}
                  style={styles.kalem}
                  accessibilityRole="button">
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      {d.ad} · {fiyatNum(d.fiyat ?? 0)} ₺/{d.birim}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      <Text style={[styles.etiket, { color: colors.tint, borderColor: colors.tint }]}> tahmini </Text> {kaynakMetni(d)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.tint, fontWeight: '800' }}>{fiyatAcik === d.stockId ? 'Kapat' : 'Gerçek fiyat ›'}</Text>
                </Pressable>
                {fiyatAcik === d.stockId ? fiyatSor(d) : null}
              </View>
            ))}
          </View>
        ) : null}
        {fiyatsizlar.length ? (
          <View style={[styles.uyari, { borderColor: colors.warning, backgroundColor: colors.card }]}>
            <Text style={{ color: colors.warning, fontWeight: '800' }}>
              ⚠ {fiyatsizlar.length} kalemin fiyatı bulunamadı, maliyete yansımıyor
            </Text>
            {fiyatsizlar.map((d) => (
              <View key={d.stockId}>
                <Pressable onPress={() => setFiyatAcik((x) => (x === d.stockId ? null : d.stockId))} style={styles.kalem}>
                  <Text style={{ color: colors.text, flex: 1 }}>{d.ad}</Text>
                  <Text style={{ color: colors.tint, fontWeight: '800' }}>{fiyatAcik === d.stockId ? 'Kapat' : 'Fiyat yaz ›'}</Text>
                </Pressable>
                {fiyatAcik === d.stockId ? fiyatSor(d) : null}
              </View>
            ))}
          </View>
        ) : null}
        {!satirlar ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} />
        ) : satirlar.length === 0 ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>Henüz partide kuzu yok.</Text>
        ) : (
          <>
            <View style={[styles.ozet, { backgroundColor: colors.tint }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ozetSayi}>{toplam?.bas ?? 0}</Text>
                <Text style={styles.ozetEtiket}>baş</Text>
              </View>
              <View style={{ flex: 2 }}>
                <Text style={styles.ozetSayi}>{tl(toplam?.maliyet ?? 0)}</Text>
                <Text style={styles.ozetEtiket}>toplam maliyet</Text>
              </View>
            </View>
            {satirlar.map((r) => {
              const kar = r.gercekKar ?? r.tahminiKar;
              return (
                <View key={r.parti} style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Pressable onPress={() => setAcik((a) => (a === r.parti ? null : r.parti))} style={styles.kartBaslik}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, flex: 1 }}>
                      {r.parti} · {r.bas} baş
                    </Text>
                    <Text style={{ color: colors.tint, fontWeight: '800' }}>{acik === r.parti ? 'Kapat' : 'Fiyat gir'}</Text>
                  </Pressable>
                  {satir(
                    'Alış',
                    `${tl(r.alis)}${r.alisTahminiBas ? ` · ${r.alisTahminiBas} kuzu tahmini` : ''}${r.alisEksikBas ? ` (${r.alisEksikBas} kuzuda fiyat yok)` : ''}`,
                  )}
                  {r.alisTahminiBas && !ayar.partiler[r.parti]?.alisBasFiyat ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 2 }}>
                      Tahmini alış: canlı kuzu {CANLI_KUZU_KG.fiyat} ₺/kg × ilk tartım ({CANLI_KUZU_KG.kaynakAd}). “Fiyat gir” ile değiştir.
                    </Text>
                  ) : null}
                  {satir('Yem', tl(r.yem))}
                  {satir('İlaç / aşı', tl(r.ilac))}
                  {r.sigorta ? satir('Sigorta primi', tl(r.sigorta)) : null}
                  {satir('Toplam maliyet', tl(r.toplam))}
                  {satir('Baş başı maliyet', tl(r.basBasi))}
                  {satir('Kg başı maliyet', r.kgBasi == null ? '—' : `${r.kgBasi.toLocaleString('tr-TR')} ₺/kg · ${r.toplamKg.toLocaleString('tr-TR')} kg canlı`)}
                  {r.gercekKar != null
                    ? satir('Gerçek kâr', tl(r.gercekKar), r.gercekKar >= 0 ? colors.tint : colors.warning)
                    : r.tahminiKar != null
                      ? satir('Tahmini kâr', tl(r.tahminiKar), r.tahminiKar >= 0 ? colors.tint : colors.warning)
                      : satir(kar == null ? 'Kâr' : '', 'Satış ₺/kg gir')}
                  {acik === r.parti ? (
                    <View style={styles.girdiler}>
                      {girdi(r.parti, 'alisBasFiyat', 'Alış ₺/baş', r.alisTahminiBas && r.bas ? `${Math.round(r.alis / r.bas).toLocaleString('tr-TR')} (tahmini)` : undefined)}
                      {girdi(r.parti, 'satisKgFiyat', 'Satış ₺/kg (tahmin)')}
                      {girdi(r.parti, 'gercekSatisTutar', 'Gerçek satış toplamı ₺')}
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Kuzu notunda “Alım 9.000 ₺” varsa alış fiyatı oradan alınır; parti alış fiyatı yazarsan o kullanılır.
            </Text>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  uyari: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  bilgi: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, marginTop: 8 },
  kalem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  etiket: { fontSize: 11, fontWeight: '800', borderWidth: 1, borderRadius: 6 },
  ozet: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12 },
  ozetSayi: { color: '#fff', fontSize: 22, fontWeight: '900' },
  ozetEtiket: { color: '#ffffffcc', fontSize: 12 },
  kart: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  kartBaslik: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  satir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  girdiler: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  girdi: { flex: 1, minWidth: 100 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4, fontSize: 16, minWidth: 0 },
});
