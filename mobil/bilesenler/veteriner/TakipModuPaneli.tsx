import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import { FotografYukle } from '@/bilesenler/veteriner/FotografYukle';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import type { VakaFotografi } from '@/kaynak/akilli-veteriner/fotograf';
import {
  asamaEtiket,
  kontrolGuncelle,
  kontrolZamaniGeldi,
  getAktifTakipler,
  taburcuEt,
  type HastalikTakip,
} from '@/kaynak/akilli-veteriner/takip';
import { hayvaniKarantinayaAl } from '@/kaynak/akilli-veteriner/tedavi-uygula';
import { upsertAnimal, getAnimal } from '@/kaynak/cekirdek/veritabani';

export function TakipModuPaneli({ refreshKey = 0 }: { refreshKey?: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<HastalikTakip[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [not, setNot] = useState('');
  const [fotograflar, setFotograflar] = useState<VakaFotografi[]>([]);

  const load = useCallback(async () => {
    setListe(await getAktifTakipler());
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const aktif = liste.find((t) => t.id === secili) ?? liste[0] ?? null;

  const durumGuncelle = async (durum: 'iyilesiyor' | 'ayni' | 'kotulesti') => {
    if (!aktif) return;
    await kontrolGuncelle(aktif.id, { not: not.trim() || durum, durum, fotoSayisi: fotograflar.length });
    setNot('');
    setFotograflar([]);
    await load();
    Alert.alert('Güncellendi', 'Durum kaydedildi.');
  };

  const taburcu = async () => {
    if (!aktif) return;
    Alert.alert('Taburcu', `${aktif.earTag} iyileşti mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Taburcu et',
        onPress: async () => {
          if (aktif.animalId) {
            const a = await getAnimal(aktif.animalId);
            if (a && a.status === 'sick') {
              await upsertAnimal({ ...a, status: 'healthy' });
            }
          }
          await taburcuEt(aktif.id);
          await load();
        },
      },
    ]);
  };

  if (liste.length === 0) {
    return (
      <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
        Aktif takip yok. Hastalık modunda teşhis + tedavi uygulayınca burada görünür.
      </Text>
    );
  }

  return (
    <View>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, marginBottom: 10 }}>
        Takip modu ({liste.length})
      </Text>

      {liste.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => setSecili(t.id)}
          style={[
            styles.kart,
            {
              borderColor: secili === t.id || (!secili && t.id === liste[0]?.id) ? colors.tint : colors.border,
              backgroundColor: colors.card,
            },
          ]}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>
            {t.earTag} · {t.teshis.hastalikAdi}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            {asamaEtiket(t.asama)}
          </Text>
          {kontrolZamaniGeldi(t) && t.asama === 'kontrol_bekliyor' ? (
            <Text style={{ color: colors.warning, fontWeight: '700', marginTop: 4, fontSize: 12 }}>
              ⏰ Kontrol zamanı — yeni fotoğraf ve durum güncellemesi
            </Text>
          ) : null}
        </Pressable>
      ))}

      {aktif ? (
        <View style={[styles.detay, { borderColor: colors.border }]}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>{aktif.teshis.hastalikAdi}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {aktif.teshis.dereceEtiket} · Etki bitiş:{' '}
            {new Date(aktif.etkiBitis).toLocaleDateString('tr-TR')}
          </Text>

          {(kontrolZamaniGeldi(aktif) || aktif.asama === 'takip') && (
            <>
              <Text style={{ color: colors.text, fontWeight: '700', marginTop: 12 }}>
                Durum güncellemesi + fotoğraf
              </Text>
              <TextInput
                placeholder="Nasıl? (iyileşme, aynı, kötüleşme…)"
                value={not}
                onChangeText={setNot}
                multiline
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />
              <FotografYukle fotograflar={fotograflar} onChange={setFotograflar} max={3} />
              <View style={styles.btnRow}>
                <View style={styles.btnHalf}>
                  <AnaButon title="İyileşiyor" variant="secondary" onPress={() => durumGuncelle('iyilesiyor')} />
                </View>
                <View style={styles.btnHalf}>
                  <AnaButon title="Aynı" variant="secondary" onPress={() => durumGuncelle('ayni')} />
                </View>
              </View>
              <AnaButon title="Kötüleşti — vet gerek" variant="danger" onPress={() => durumGuncelle('kotulesti')} />
            </>
          )}

          {aktif.teshis.karantinaGerekli && !aktif.karantinaYapildi && aktif.animalId ? (
            <AnaButon
              title="Karantina padokuna al"
              variant="secondary"
              onPress={async () => {
                const r = await hayvaniKarantinayaAl(aktif.animalId!);
                Alert.alert(r.ok ? 'Tamam' : 'Hata', r.message);
                await load();
              }}
            />
          ) : aktif.karantinaPadok ? (
            <Text style={{ color: colors.success, marginTop: 8 }}>✓ Karantina: {aktif.karantinaPadok}</Text>
          ) : null}

          {aktif.asama !== 'taburcu' ? (
            <AnaButon title="Taburcu et" onPress={taburcu} />
          ) : (
            <Text style={{ color: colors.success, fontWeight: '700' }}>✓ Taburcu</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  detay: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 60, marginVertical: 8, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnHalf: { flex: 1 },
});
