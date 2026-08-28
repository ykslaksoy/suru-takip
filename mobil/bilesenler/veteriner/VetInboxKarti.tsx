import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { AnaButon } from '@/bilesenler/ortak/AnaButon';
import {
  getVetVakalar,
  type VetVakaKaydi,
} from '@/kaynak/veteriner-koprusu/case-thread';
import { talimatUygulandi } from '@/kaynak/veteriner-koprusu/talimat';

const DURUM_ETIKET: Record<VetVakaKaydi['durum'], string> = {
  gonderildi: 'WhatsApp ile gönderildi',
  yanit_bekliyor: 'Programda · yanıt bekleniyor',
  talimat_verildi: 'Talimat var',
  kapandi: 'Kapandı',
};

export function VetInboxKarti({ refreshKey = 0 }: { refreshKey?: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [liste, setListe] = useState<VetVakaKaydi[]>([]);

  const load = useCallback(async () => {
    setListe(await getVetVakalar());
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (liste.length === 0) {
    return (
      <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
        Henüz veterinere gönderilmiş vaka yok.
      </Text>
    );
  }

  return (
    <View>
      {liste.map((v) => (
        <View
          key={v.id}
          style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.ust}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {v.paket.animal?.earTag ?? 'Hayvan'} · {v.vetAd}
            </Text>
            <Text style={{ color: v.kanal === 'program' ? colors.tint : '#25D366', fontSize: 12, fontWeight: '700' }}>
              {v.kanal === 'program' ? '📱 Program' : '💬 WhatsApp'}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {DURUM_ETIKET[v.durum]}
          </Text>
          <Text style={{ color: colors.text, marginTop: 6 }} numberOfLines={2}>
            {v.paket.symptoms || '—'}
          </Text>
          {v.talimat ? (
            <View style={[styles.talimat, { backgroundColor: colors.tint + '15' }]}>
              <Text style={{ color: colors.tint, fontWeight: '800' }}>Veteriner talimatı</Text>
              <Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>{v.talimat.metin}</Text>
              {v.talimat.ilac ? (
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>İlaç: {v.talimat.ilac}</Text>
              ) : null}
              {!v.talimat.uygulandi ? (
                <AnaButon
                  title="Talimatı uyguladım"
                  variant="secondary"
                  onPress={async () => {
                    await talimatUygulandi(v.id, v.talimat!);
                    await load();
                    Alert.alert('Tamam', 'Talimat uygulandı olarak işaretlendi.');
                  }}
                />
              ) : (
                <Text style={{ color: colors.success, marginTop: 8, fontWeight: '700' }}>✓ Uygulandı</Text>
              )}
            </View>
          ) : v.kanal === 'program' && v.durum === 'yanit_bekliyor' ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
              Veteriner programdan yanıt verince burada görünür.
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  ust: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  talimat: { marginTop: 10, padding: 10, borderRadius: 10 },
});
