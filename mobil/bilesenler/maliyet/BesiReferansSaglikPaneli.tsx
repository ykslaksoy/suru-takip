import { StyleSheet, Text, View } from 'react-native';
import type { ReferansSyncMeta } from '@/kaynak/maliyet/besi-referans-sync-meta';
import { ISTEMCI_REF_TTL_MS } from '@/kaynak/maliyet/besi-referans-otomatik';
import { piyasaKayitOku } from '@/kaynak/maliyet/besi-piyasa-kayit';
import { fiyatReferansDepoMetaOku } from '@/kaynak/maliyet/fiyat-referans-depo';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string; card: string };

const KAYNAK_ETIKET: Record<string, string> = {
  tobb_edirne: 'TOBB Edirne işlem',
  tobb_gaziantep: 'TOBB Gaziantep işlem',
  ukon_karkas: 'UKON bülten',
  usk_yonca_ay: 'USK yonca (aylık)',
  usk_saman_ay: 'USK saman (aylık)',
};

export function BesiReferansSaglikPaneli({ meta, colors }: { meta: ReferansSyncMeta; colors: Colors }) {
  const depo = piyasaKayitOku().depo;
  const yemMeta = fiyatReferansDepoMetaOku();
  const ttlSaat = Math.round(ISTEMCI_REF_TTL_MS / 3600000);

  const satir = (baslik: string, deger: string, uyari?: boolean) => (
    <Text key={baslik} style={{ color: uyari ? colors.warning : colors.textSecondary, fontSize: 10 }}>
      · {baslik}: {deger}
    </Text>
  );

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', fontSize: 12 }}>Referans senkron durumu</Text>
      {satir('Son başarılı çekim', meta.sonBasariliIso ?? 'henüz yok')}
      {satir('Son deneme', meta.sonDenemeIso ?? '—')}
      {satir('Tetikleyici', `${meta.sonNeden ?? '—'} → ${meta.sonSonuc ?? '—'}`)}
      {meta.atlanmaNedeni ? satir('TTL atlandı', meta.atlanmaNedeni, true) : null}
      {meta.hataMesaji ? satir('Hata/bayat', meta.hataMesaji, true) : null}
      {satir('Piyasa depo', `${depo.sonYenileme ?? '—'} (${depo.yenilemeSonuc ?? 'gömülü'})`)}
      {satir('Yem depo', `${yemMeta.sonYenileme ?? '—'} (${yemMeta.yenilemeSonuc ?? '—'})`)}
      {satir('İstemci TTL', `${ttlSaat} saat · odak/resume/açılış`)}
      {satir(
        'Vercel Cron',
        'Günde 1× 05:00 UTC (Hobby uyumlu); asıl yenileme uygulama açılış/odak TTL',
      )}
      {satir('Sunucu önbellek', '15 dk bellek — kalıcı KV yok; deploy sonrası sıfırlanır')}

      <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 10, marginTop: 8 }}>Kaynak işlem / yayın tarihi</Text>
      {Object.entries(meta.kaynakIslemTarihleri).length === 0
        ? satir('Parse meta', '— (henüz başarılı çekim yok veya gömülü)')
        : Object.entries(meta.kaynakIslemTarihleri).map(([k, v]) =>
            satir(KAYNAK_ETIKET[k] ?? k, v ?? 'eksik'),
          )}
      {satir('Balıkesir PDF', 'manuel/bayat — otomatik yok', true)}
      {satir('Besi yemi TZOB', 'gömülü — USK aylık yonca/saman ayrı', true)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
});
