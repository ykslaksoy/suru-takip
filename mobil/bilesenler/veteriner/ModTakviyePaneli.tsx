/**
 * Mod bazlı aşı + vitamin planı: oluştur, takip et, yapıldığını denetle.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { AsiBaslikSatir } from '@/bilesenler/veteriner/AsiBaslikSatir';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { useMod } from '@/baglam/ModBaglami';
import Colors from '@/sabitler/Renkler';
import {
  aktifPlanOku,
  bekleyenSatirlar,
  getHayvanlarByMod,
  isaretleYapildi,
  kalemiTumuneUygula,
  modTakviyeSablonu,
  olusturModTakviyePlani,
  planaYeniHayvanlariEkle,
  planOzeti,
  tipEtiket,
  type ModTakviyeKalemi,
  type ModTakviyeOzet,
  type ModTakviyePlani,
} from '@/kaynak/akilli-veteriner/mod-takviye';
import type { Animal } from '@/kaynak/cekirdek/tipler';

function planlananEtiket(iso?: string): string | null {
  if (!iso) return null;
  const gun = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  const tarih = new Date(iso).toLocaleDateString('tr-TR');
  if (gun > 0) return `${gun} gün sonra · ${tarih}`;
  if (gun === 0) return `Bugün · ${tarih}`;
  return `Gecikti (${Math.abs(gun)}g) · ${tarih}`;
}

export function ModTakviyePaneli() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { aktifId, aktifMod } = useMod();
  const [hayvanlar, setHayvanlar] = useState<Animal[]>([]);
  const [sablon, setSablon] = useState<ModTakviyeKalemi[]>([]);
  const [ozet, setOzet] = useState<ModTakviyeOzet | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const yukle = useCallback(async () => {
    setHayvanlar(await getHayvanlarByMod(aktifId));
    setSablon(modTakviyeSablonu(aktifId));
    const plan = await aktifPlanOku(aktifId);
    setOzet(plan ? planOzeti(plan) : null);
  }, [aktifId]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const planOlustur = async () => {
    setYukleniyor(true);
    try {
      const r = await olusturModTakviyePlani({ modId: aktifId });
      setOzet(planOzeti(r.plan));
      setHayvanlar(await getHayvanlarByMod(aktifId));
      Alert.alert('Plan oluşturuldu', r.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const yenileriEkle = async () => {
    if (!ozet) return;
    const r = await planaYeniHayvanlariEkle(ozet.plan.id);
    if (r.plan) setOzet(planOzeti(r.plan));
    Alert.alert(
      'Güncelleme',
      r.eklenen === 0 ? 'Yeni hayvan yok.' : `${r.eklenen} hayvan plana eklendi.`,
    );
  };

  const kalemUygula = async (k: ModTakviyeKalemi) => {
    if (!ozet) return;
    const tartimMi = k.tip === 'tartim';
    Alert.alert(
      `${k.ad} — tümüne uygula`,
      tartimMi
        ? `Bekleyen tüm hayvanlarda ${k.ad} yapıldı işaretlensin mi? (Kilo kaydı için Kilo Takibi’ni kullanın)`
        : `Bekleyen tüm hayvanlara ${k.mlEtiket} işaretlensin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: () => {
            void (async () => {
              const r = await kalemiTumuneUygula({
                planId: ozet.plan.id,
                tip: k.tip,
                programId: k.programId,
              });
              if (r.plan) setOzet(planOzeti(r.plan));
              Alert.alert(r.ok ? 'Tamam' : 'Hata', r.message);
            })();
          },
        },
      ],
    );
  };

  const tekIsaretle = async (d: ModTakviyePlani['durumlar'][0]) => {
    if (!ozet) return;
    const r = await isaretleYapildi({
      planId: ozet.plan.id,
      animalId: d.animalId,
      tip: d.tip,
      programId: d.programId,
    });
    if (r.plan) setOzet(planOzeti(r.plan));
    if (!r.ok) Alert.alert('Hata', r.message);
  };

  const bekleyen = ozet ? bekleyenSatirlar(ozet.plan).slice(0, 40) : [];

  return (
    <View style={styles.kok}>
      <Text style={[styles.title, { color: colors.text }]}>Mod aşı, tartım & vitamin planı</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 12, lineHeight: 20 }}>
        {aktifMod.icon} {aktifMod.baslik} — aşı/parazit 21 gün sonraya planlanır; 15 günde bir tartım ve
        vitamin takip edilir.
      </Text>

      <View style={[styles.bilgi, { backgroundColor: colors.tint + '12', borderColor: colors.tint }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          Bu modda {hayvanlar.length} hayvan
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
          Hayvan eklerken aktif mod otomatik yazılır. Modu atanmamış eski kayıtlar plan
          oluşturulunca buraya bağlanır.
        </Text>
      </View>

      <Text style={[styles.section, { color: colors.tint }]}>Şablon kalemler</Text>
      {sablon.map((k) => (
        <View key={`${k.tip}-${k.programId}`} style={[styles.kart, { borderColor: colors.border }]}>
          <AsiBaslikSatir
            koruma={k.ad}
            asiAdi={`${k.detay} · ${tipEtiket(k.tip)}`}
            mlEtiket={k.mlEtiket}
          />
        </View>
      ))}

      <AnaButon
        title={yukleniyor ? 'Oluşturuluyor…' : 'Planı oluştur / yenile — takibe al'}
        onPress={() => void planOlustur()}
      />

      {ozet ? (
        <>
          <View
            style={[
              styles.ozetKutu,
              {
                borderColor: ozet.tamamlandi ? colors.success : colors.tint,
                backgroundColor: (ozet.tamamlandi ? colors.success : colors.tint) + '12',
              },
            ]}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
              {ozet.tamamlandi ? 'Tamamlandı' : 'Takipte'} · %{ozet.yuzde}
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 19 }}>
              {ozet.yapilan}/{ozet.toplamIs} işlem · {ozet.hayvanSayisi} hayvan · {ozet.kalemSayisi}{' '}
              kalem · aşı planı {ozet.plan.tarih}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              Bekleyen: {ozet.bekleyen}
            </Text>
          </View>

          <AnaButon title="Yeni hayvanları plana ekle" variant="secondary" onPress={() => void yenileriEkle()} />

          <Text style={[styles.section, { color: colors.tint }]}>Kalem — toplu uygula</Text>
          {ozet.plan.kalemler.map((k) => {
            const bek = ozet.plan.durumlar.filter(
              (d) => d.tip === k.tip && d.programId === k.programId && !d.yapildi,
            ).length;
            const top = ozet.plan.durumlar.filter(
              (d) => d.tip === k.tip && d.programId === k.programId,
            ).length;
            return (
              <View
                key={`u-${k.tip}-${k.programId}`}
                style={[styles.kart, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <AsiBaslikSatir
                  koruma={k.ad}
                  asiAdi={k.detay}
                  mlEtiket={k.mlEtiket}
                />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginVertical: 6 }}>
                  {top - bek}/{top} yapıldı · {bek} bekliyor
                </Text>
                {bek > 0 ? (
                  <Pressable
                    onPress={() => void kalemUygula(k)}
                    style={[styles.btn, { backgroundColor: colors.tint }]}>
                    <Text style={styles.btnYazi}>Bekleyen {bek} hayvana uygula</Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Tamam</Text>
                )}
              </View>
            );
          })}

          {bekleyen.length > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.tint }]}>Bekleyen — tek tek denetle</Text>
              {bekleyen.map((d) => {
                const k = ozet.plan.kalemler.find(
                  (x) => x.tip === d.tip && x.programId === d.programId,
                );
                return (
                  <Pressable
                    key={`${d.animalId}-${d.tip}-${d.programId}`}
                    onPress={() => void tekIsaretle(d)}
                    style={[styles.bekleyen, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      {d.earTag}{' '}
                      <Text style={{ fontWeight: '400', color: colors.textSecondary, fontSize: 12 }}>
                        · {k?.ad ?? d.programId} ({tipEtiket(d.tip)})
                      </Text>
                    </Text>
                    {planlananEtiket(d.planlananAt) ? (
                      <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                        Plan: {planlananEtiket(d.planlananAt)}
                      </Text>
                    ) : null}
                    <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                      Yapıldı işaretle · {k?.mlEtiket ?? ''}
                    </Text>
                  </Pressable>
                );
              })}
              {ozet.bekleyen > 40 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  +{ozet.bekleyen - 40} bekleyen daha — kalemden toplu uygulayın.
                </Text>
              ) : null}
            </>
          ) : ozet.toplamIs > 0 ? (
            <Text style={{ color: colors.success, fontWeight: '700', marginTop: 8 }}>
              Tüm kalemler uygulandı — denetim tamam.
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, fontStyle: 'italic', marginTop: 8 }}>
          Henüz plan yok — yukarıdan oluşturun.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  section: { fontWeight: '800', fontSize: 14, marginTop: 16, marginBottom: 8 },
  bilgi: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  kart: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  ozetKutu: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14, marginBottom: 8 },
  btn: { borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnYazi: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bekleyen: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 6 },
});
