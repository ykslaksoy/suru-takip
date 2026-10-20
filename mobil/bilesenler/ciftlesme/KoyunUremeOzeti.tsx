/** Kuzu kartı (dişi): son çiftleşme durumu → Çiftleşme ve doğum */
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { getAnimal } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { bugunYerel, getKoyunCiftlesme } from '@/kaynak/ciftlesme/depo';
import { beklenenDogum, DURUM_ETIKET, durum, gunFarki, trTarih, type CiftlesmeKaydi } from '@/kaynak/ciftlesme/hesap';
import { DURUM_SIMGE, durumRenk } from './ortak';

export function KoyunUremeOzeti({ koyunId }: { koyunId: string }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [k, setK] = useState<CiftlesmeKaydi | null>(null);
  const [koc, setKoc] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      void getKoyunCiftlesme(koyunId).then(async (x) => {
        setK(x);
        const a = x?.kocId ? await getAnimal(x.kocId) : null;
        setKoc(a ? hayvanAnaEtiket(a) : null);
      });
    }, [koyunId]),
  );
  const bugun = bugunYerel();
  const d = k ? durum(k, bugun) : null;
  const bd = k ? beklenenDogum(k) : null;
  return (
    <Pressable
      onPress={() => router.push(k ? '/ciftlesme' : ('/ciftlesme/katim' as never))}
      style={{ marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderRadius: 14, padding: 12, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 16 }}>🐏 Çiftleşme / doğum</Text>
        {k && d ? (
          <>
            <Text style={{ color: durumRenk(d, colors), fontWeight: '800', marginTop: 2 }}>
              {DURUM_SIMGE[d]} {DURUM_ETIKET[d]}
              {k.dogum ? ` · ${trTarih(k.dogum.tarih)} · ${k.dogum.canli} kuzu` : ''}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
              Katım {trTarih(k.katimTarih)}
              {koc ? ` · ♂ ${koc}` : ''}
              {!k.dogum && d !== 'bos' && bd ? ` · doğum ${trTarih(bd)} (${gunFarki(bugun, bd) >= 0 ? `${gunFarki(bugun, bd)} gün` : `${-gunFarki(bugun, bd)} gün geçti`})` : ''}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Kayıt yok · koç katımı gir</Text>
        )}
      </View>
      <Text style={{ color: colors.tint, fontWeight: '700' }}>›</Text>
    </Pressable>
  );
}
