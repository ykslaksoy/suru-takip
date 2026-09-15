import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { AsiBaslikSatir } from '@/bilesenler/veteriner/AsiBaslikSatir';
import { AsiMalzemePaneli } from '@/bilesenler/veteriner/AsiMalzemePaneli';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import {
  asiUyarilari,
  BESI_SECENEKLER,
  BOLGE_SECENEKLER,
  eksikAsiMesajlari,
  gecerliTarih,
  getKuzular,
  GRUP_SECENEKLER,
  olusturAsiOnerileri,
  planKaydet,
  planOku,
  profilKaydet,
  profilOku,
  tercihKaydet,
  tercihOku,
  varsayilanTercihler,
  type AsiOrtamProfili,
  type AsiPlani,
  type AsiTercih,
  type AsiUyari,
  type BesiSekli,
  type BolgeTipi,
  type HayvanGrubu,
} from '@/kaynak/akilli-veteriner/asi-modu';
import { uygulaAsiPlani } from '@/kaynak/akilli-veteriner/asi-uygula';
import {
  asiMalzemeMetni,
  olusturAsiMalzemeListesi,
  type AsiMalzemeListesi,
} from '@/kaynak/akilli-veteriner/asi-malzeme';
import { v4 as uuidv4 } from 'uuid';

function Secici<T extends string>({
  label,
  secenekler,
  value,
  onChange,
  colors,
}: {
  label: string;
  secenekler: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <View style={styles.seciciWrap}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
      <View style={styles.chipRow}>
        {secenekler.map((s) => {
          const aktif = value === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onChange(s.id)}
              style={[
                styles.chip,
                {
                  borderColor: aktif ? colors.tint : colors.border,
                  backgroundColor: aktif ? colors.tint + '20' : colors.background,
                },
              ]}>
              <Text style={{ color: aktif ? colors.tint : colors.text, fontSize: 12, fontWeight: aktif ? '700' : '500' }}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AsiModuPaneli() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [profil, setProfil] = useState<AsiOrtamProfili | null>(null);
  const [tercihler, setTercihler] = useState<AsiTercih[]>([]);
  const [planlar, setPlanlar] = useState<AsiPlani[]>([]);
  const [planTarih, setPlanTarih] = useState('');
  const [irk, setIrk] = useState('');
  const [malzeme, setMalzeme] = useState<AsiMalzemeListesi | null>(null);

  const malzemeYenile = useCallback(async (t: AsiTercih[]) => {
    setMalzeme(await olusturAsiMalzemeListesi(t));
  }, []);

  const yukle = useCallback(async () => {
    const p = await profilOku();
    setProfil(p);
    setIrk(p.irk);
    const oneriler = olusturAsiOnerileri(p);
    const kayitli = await tercihOku();
    const varsayilan = varsayilanTercihler(oneriler);
    let t: AsiTercih[];
    if (kayitli.length === 0) {
      t = varsayilan;
    } else {
      const map = new Map(kayitli.map((x) => [x.programId, x]));
      t = varsayilan.map((v) => map.get(v.programId) ?? v);
    }
    setTercihler(t);
    setPlanlar(await planOku());
    await malzemeYenile(t);
  }, [malzemeYenile]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  if (!profil) return null;

  const oneriler = olusturAsiOnerileri(profil);
  const uyarilar = asiUyarilari(profil, oneriler, tercihler);
  const eksikler = eksikAsiMesajlari(oneriler, tercihler);

  const profilGuncelle = async (next: AsiOrtamProfili) => {
    setProfil(next);
    await profilKaydet(next);
    const yeniOneriler = olusturAsiOnerileri(next);
    const yeniTercih = varsayilanTercihler(yeniOneriler);
    setTercihler(yeniTercih);
    await tercihKaydet(yeniTercih);
    await malzemeYenile(yeniTercih);
  };

  const tercihToggle = async (programId: string, aktif: boolean) => {
    const next = tercihler.map((t) =>
      t.programId === programId ? { ...t, aktif, riskOnaylandi: aktif ? undefined : t.riskOnaylandi } : t
    );
    setTercihler(next);
    await tercihKaydet(next);
    await malzemeYenile(next);
  };

  const uyariOnayla = async (uyari: AsiUyari) => {
    Alert.alert(uyari.baslik, `${uyari.risk}\n\n${uyari.mesaj}`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: uyari.onayMetni,
        style: 'destructive',
        onPress: async () => {
          const next = tercihler.map((t) =>
            t.programId === uyari.programId ? { ...t, riskOnaylandi: true } : t
          );
          setTercihler(next);
          await tercihKaydet(next);
        },
      },
    ]);
  };

  const tumKuzularaPlanla = () => {
    Alert.alert(
      'Tüm kuzulara aşı / parazit planla',
      'Seçtiğiniz aktif aşılar için tüm kuzulara toplu plan oluşturulsun mu?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamam',
          onPress: () => {
            if (!planTarih.trim()) {
              Alert.alert('Tarih', 'Lütfen aşı tarihini girin (YYYY-MM-DD)');
              return;
            }
            if (!gecerliTarih(planTarih.trim())) {
              Alert.alert('Tarih', 'Geçerli bir tarih girin (ör: 2026-09-15)');
              return;
            }
            void planOlustur();
          },
        },
      ]
    );
  };

  const planOlustur = async () => {
    const kuzular = await getKuzular();
    const aktif = tercihler.filter((t) => t.aktif);
    if (aktif.length === 0) {
      Alert.alert('Aşı seçin', 'En az bir aşıyı aktif bırakın.');
      return;
    }
    if (kuzular.length === 0) {
      Alert.alert('Kuzu yok', 'Kayıtlı kuzu bulunamadı.');
      return;
    }
    const tarih = planTarih.trim();
    for (const t of aktif) {
      const o = oneriler.find((x) => x.programId === t.programId);
      await planKaydet({
        id: uuidv4(),
        programId: t.programId,
        asiAdi: o ? `${o.koruma} (${o.ad}) ${o.mlEtiket}` : t.programId,
        tarih,
        hedef: 'tum_kuzular',
        hayvanSayisi: kuzular.length,
        olusturuldu: new Date().toISOString(),
      });
    }
    setPlanlar(await planOku());
    await malzemeYenile(tercihler);
    Alert.alert('Planlandı', `${kuzular.length} kuzu · ${tarih} · ${aktif.length} aşı`);
  };

  const planUygula = (plan: AsiPlani) => {
    if (plan.uygulandi) {
      Alert.alert('Uygulandı', 'Bu plan zaten sağlık kaydına işlenmiş.');
      return;
    }
    Alert.alert(
      'Aşıyı uygula',
      `${plan.asiAdi}\n${plan.tarih} · ${plan.hayvanSayisi} kuzu\n\nHer kuzuya aşı kaydı yazılır, stoktan doz düşülür.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: () => {
            void (async () => {
              const r = await uygulaAsiPlani(plan);
              setPlanlar(await planOku());
              await malzemeYenile(tercihler);
              if (!r.ok) {
                Alert.alert('Uygulanamadı', r.message);
                return;
              }
              Alert.alert(
                'Tamam',
                `${r.kayitSayisi} sağlık kaydı yazıldı` +
                  (r.stokDusum > 0 ? `\nStok −${r.stokDusum} doz${r.stokAdi ? ` (${r.stokAdi})` : ''}` : '') +
                  (r.stokUyari ? `\n\n⚠ ${r.stokUyari}` : '')
              );
            })();
          },
        },
      ]
    );
  };

  return (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>Aşı ve parazit koruma</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 14, lineHeight: 20 }}>
        Yer, cinse, besi şekline göre aşı ve parazit hapı önerisi; istemediklerinizi kapatın — uyarıları onaylayın.
      </Text>
      <View style={[styles.bilgi, { backgroundColor: colors.tint + '12', borderColor: colors.tint }]}>
        <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}>Doz — kilo ile</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          Aşılar: her kuzuya 1–2 ml. Hap/iğne: tartıdan sonra gerçek kiloya göre (tartı yoksa geçici ~20 kg;
          gelenler ~17–24 kg). Örnek: 20 kg → her 10 kiloya yazılanın iki katı.
        </Text>
      </View>

      <Secici
        label="Bölge / iklim"
        secenekler={BOLGE_SECENEKLER}
        value={profil.bolge}
        onChange={(v) => profilGuncelle({ ...profil, bolge: v as BolgeTipi })}
        colors={colors}
      />
      <Secici
        label="Besi şekli"
        secenekler={BESI_SECENEKLER}
        value={profil.besiSekli}
        onChange={(v) => profilGuncelle({ ...profil, besiSekli: v as BesiSekli })}
        colors={colors}
      />
      <Secici
        label="Hayvan grubu"
        secenekler={GRUP_SECENEKLER}
        value={profil.hayvanGrubu}
        onChange={(v) => profilGuncelle({ ...profil, hayvanGrubu: v as HayvanGrubu })}
        colors={colors}
      />

      <View style={styles.satir}>
        <Pressable
          onPress={() => profilGuncelle({ ...profil, nemliAlan: !profil.nemliAlan })}
          style={[styles.toggle, { borderColor: colors.border, backgroundColor: profil.nemliAlan ? colors.tint + '20' : colors.background }]}>
          <Text style={{ color: colors.text, fontSize: 13 }}>{profil.nemliAlan ? '✓' : '○'} Nemli / sulak alan</Text>
        </Pressable>
        <Pressable
          onPress={() => profilGuncelle({ ...profil, yogunSuru: !profil.yogunSuru })}
          style={[styles.toggle, { borderColor: colors.border, backgroundColor: profil.yogunSuru ? colors.tint + '20' : colors.background }]}>
          <Text style={{ color: colors.text, fontSize: 13 }}>{profil.yogunSuru ? '✓' : '○'} Yoğun sürü</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Irk / cins (ör: Merinos, Sakız)"
        value={irk}
        onChangeText={setIrk}
        onBlur={() => profilGuncelle({ ...profil, irk: irk.trim() })}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />

      <Text style={[styles.section, { color: colors.tint }]}>Önerilen aşı ve parazitler</Text>
      {oneriler.map((o) => {
        const t = tercihler.find((x) => x.programId === o.programId);
        const aktif = t?.aktif ?? o.varsayilan;
        return (
          <View key={o.programId} style={[styles.oneriKart, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={styles.oneriUst}>
              <View style={{ flex: 1 }}>
                <AsiBaslikSatir
                  koruma={o.koruma}
                  asiAdi={o.ad}
                  mlEtiket={o.mlEtiket}
                  devletNotu={o.devletNotu}
                />
              </View>
              <Text style={{ color: o.oncelik === 'zorunlu' ? colors.danger : colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                {o.oncelik.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginVertical: 6 }}>{o.neden}</Text>
            <View style={styles.tercihRow}>
              <Pressable
                onPress={() => tercihToggle(o.programId, true)}
                style={[styles.tercihBtn, { backgroundColor: aktif ? colors.tint : colors.border }]}>
                <Text style={{ color: aktif ? '#fff' : colors.text, fontWeight: '700' }}>Olsun</Text>
              </Pressable>
              <Pressable
                onPress={() => tercihToggle(o.programId, false)}
                style={[styles.tercihBtn, { backgroundColor: !aktif ? colors.danger : colors.border }]}>
                <Text style={{ color: !aktif ? '#fff' : colors.text, fontWeight: '700' }}>Olmasın</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {uyarilar.map((u) => (
        <View key={u.id} style={[styles.uyari, { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>⚠ {u.baslik}</Text>
          <Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>{u.risk}</Text>
          <AnaButon title={u.onayMetni} variant="secondary" onPress={() => uyariOnayla(u)} />
        </View>
      ))}

      {eksikler.length > 0 && (
        <View style={[styles.eksik, { borderColor: colors.border }]}>
          <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Durum özeti</Text>
          {eksikler.map((m, i) => (
            <Text key={i} style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>
              {m}
            </Text>
          ))}
        </View>
      )}

      {malzeme ? (
        <AsiMalzemePaneli
          liste={malzeme}
          onPaylas={() => {
            void Share.share({ message: asiMalzemeMetni(malzeme) });
          }}
        />
      ) : null}

      <Text style={[styles.section, { color: colors.tint, marginTop: 16 }]}>Tüm kuzulara aşı / parazit planla</Text>
      <TextInput
        placeholder="Aşı tarihi (YYYY-MM-DD)"
        value={planTarih}
        onChangeText={setPlanTarih}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
      <AnaButon title="Tüm kuzulara planla — Tamam / İptal" onPress={tumKuzularaPlanla} />

      {planlar.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 8 }}>Kayıtlı planlar</Text>
          {planlar.slice(0, 8).map((p) => (
            <View
              key={p.id}
              style={[styles.planKart, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                {p.tarih} · {p.asiAdi}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {p.hayvanSayisi} kuzu
                {p.uygulandi ? ` · ✓ uygulandı${p.uygulandiAt ? ` (${p.uygulandiAt.slice(0, 10)})` : ''}` : ' · bekliyor'}
              </Text>
              {!p.uygulandi ? (
                <AnaButon title="Uygula — kayıt + stok" variant="secondary" onPress={() => planUygula(p)} />
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  section: { fontWeight: '800', fontSize: 15, marginTop: 12, marginBottom: 8 },
  seciciWrap: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  satir: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  toggle: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10 },
  oneriKart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  oneriUst: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tercihRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  tercihBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  uyari: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
  eksik: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  bilgi: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  planKart: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
});
