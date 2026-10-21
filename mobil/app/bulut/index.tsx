/**
 * Bulut eşitleme — e-posta koduyla giriş, çiftlik oluştur (Sahip) / davet koduyla katıl,
 * ekip rolleri (sunucuda), elle "Şimdi eşitle". Env yoksa yalnızca bilgilendirme gösterir.
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  bulutDurum,
  cikis,
  ciftlikOlustur,
  davetKabul,
  davetOlustur,
  ekipListesi,
  girisKoduDogrula,
  girisKoduGonder,
  simdiSenkronEt,
  uyeYetkiGuncelle,
  type BulutDurum,
} from '@/kaynak/bulut/servis';
import { KullanimSartlariNotu } from '@/bilesenler/ortak/KullanimSartlariNotu';
import { TurnstileKutusu } from '@/bilesenler/bulut/TurnstileKutusu';
import { OTP_GONDER_BEKLEME_MS, otpGonderBeklemeKalanMs, turnstileKorumasiAktif } from '@/kaynak/bulut/otp-koruma';
import { ekipAnlik, ekipDinle, ekipYukle } from '@/kaynak/ekip/depo';
import { yerelEkipProfiliVar } from '@/kaynak/ekip/hesap';

const ROL_AD: Record<string, string> = { sahip: 'Sahip', ortak: 'Ortak', bakici: 'Bakıcı', veteriner: 'Veteriner' };
const YESIL = '#2d6a4f';

function Dugme({ etiket, onPress, ikincil }: { etiket: string; onPress: () => void; ikincil?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.dugme, ikincil && s.dugme2]}>
      <Text style={[s.dugmeYazi, ikincil && { color: YESIL }]}>{etiket}</Text>
    </Pressable>
  );
}

export default function BulutEkrani() {
  const [d, setD] = useState<BulutDurum | null>(null);
  const [eposta, setEposta] = useState('');
  const [kod, setKod] = useState('');
  const [kodGitti, setKodGitti] = useState(false);
  const [ciftlikAd, setCiftlikAd] = useState('');
  const [davetKod, setDavetKod] = useState('');
  const [ad, setAd] = useState('');
  const [yeniDavet, setYeniDavet] = useState<string | null>(null);
  const [ekip, setEkip] = useState<Awaited<ReturnType<typeof ekipListesi>>>([]);
  const [mesaj, setMesaj] = useState('');
  const [yerelEkip, setYerelEkip] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [beklemeSn, setBeklemeSn] = useState(0);

  const yenile = useCallback(async () => {
    const x = await bulutDurum();
    setD(x);
    if (x.uyelik) setEkip(await ekipListesi().catch(() => []));
  }, []);
  useEffect(() => {
    void ekipYukle().then(() => setYerelEkip(yerelEkipProfiliVar(ekipAnlik())));
    return ekipDinle(() => setYerelEkip(yerelEkipProfiliVar(ekipAnlik())));
  }, []);
  useEffect(() => {
    void yenile();
  }, [yenile]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    const guncelle = () => {
      void otpGonderBeklemeKalanMs().then((ms) => setBeklemeSn(Math.ceil(ms / 1000)));
    };
    guncelle();
    t = setInterval(guncelle, 1000);
    return () => clearInterval(t);
  }, [d?.oturum, kodGitti]);

  const calistir = (f: () => Promise<unknown>, basari?: string) => async () => {
    setMesaj('');
    try {
      await f();
      if (basari) setMesaj(basari);
    } catch (e) {
      setMesaj(e instanceof Error ? e.message : String(e));
    }
    await yenile();
  };

  if (!d) return null;

  if (!d.acik) {
    return (
      <ScrollView contentContainerStyle={s.kap}>
        <Stack.Screen options={{ title: 'Bulut eşitleme' }} />
        <Text style={s.baslik}>Bulut eşitleme henüz açık değil</Text>
        <Text style={s.metin}>
          Kayıtların şu an yalnızca bu cihazda duruyor ve uygulama tamamen çalışıyor. Bulut açılınca sürü kayıtları, ekip ve
          fotoğraflar bütün telefonlarda ortak olacak.
        </Text>
        <Text style={s.metin}>Yedek için Excel / CSV dışa aktarmayı kullanabilirsin.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.kap}>
      <Stack.Screen options={{ title: 'Bulut eşitleme' }} />
      {!!mesaj && <Text style={s.mesaj}>{mesaj}</Text>}

      {!d.oturum ? (
        <View style={s.kart}>
          <Text style={s.baslik}>Giriş yap</Text>
          <Text style={s.metin}>E-postana bir giriş kodu ve bağlantı gelir. Şifre yok.</Text>
          <TextInput style={s.girdi} placeholder="E-posta" autoCapitalize="none" keyboardType="email-address" value={eposta} onChangeText={setEposta} />
          <KullanimSartlariNotu />
          {!kodGitti ? (
            <>
              {turnstileKorumasiAktif() ? <TurnstileKutusu onToken={setTurnstileToken} /> : null}
              <Dugme
                etiket={beklemeSn > 0 ? `Bekle (${beklemeSn} sn)` : 'Kod gönder'}
                onPress={calistir(async () => {
                  if (beklemeSn > 0) throw new Error(`Çok sık denedin. ${beklemeSn} saniye sonra tekrar dene.`);
                  if (turnstileKorumasiAktif() && !turnstileToken) throw new Error('Önce bot kontrolünü tamamla.');
                  await girisKoduGonder(eposta, turnstileToken ?? undefined);
                  setKodGitti(true);
                }, 'Kod gönderildi, e-postanı kontrol et.')}
              />
              {!turnstileKorumasiAktif() ? (
                <Text style={s.metin}>
                  Kod gönderimi en fazla {Math.round(OTP_GONDER_BEKLEME_MS / 1000)} saniyede bir. Tam bot koruması için Vercel’de Turnstile anahtarlarını tanımla (mobil/docs/BULUT-GUVENLIK.md).
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <TextInput style={s.girdi} placeholder="6 haneli kod" keyboardType="number-pad" value={kod} onChangeText={setKod} />
              <Dugme
                etiket="Giriş"
                onPress={calistir(async () => {
                  await girisKoduDogrula(eposta, kod);
                }, 'Giriş yapıldı; kayıtlar eşitleniyor.')}
              />
            </>
          )}
        </View>
      ) : !d.uyelik ? (
        <>
          <View style={s.kart}>
            <Text style={s.baslik}>Yeni çiftlik (Sahip ol)</Text>
            <Text style={s.metin}>Bu cihazdaki tüm kayıtlar bir kereliğine buluta yüklenir.</Text>
            <TextInput style={s.girdi} placeholder="Çiftlik adı" value={ciftlikAd} onChangeText={setCiftlikAd} />
            <Dugme etiket="Çiftlik oluştur" onPress={calistir(async () => { await ciftlikOlustur(ciftlikAd); await simdiSenkronEt(); }, 'Çiftlik oluşturuldu, kayıtlar yüklendi.')} />
          </View>
          <View style={s.kart}>
            <Text style={s.baslik}>Davet koduyla katıl</Text>
            <TextInput style={s.girdi} placeholder="Adın" value={ad} onChangeText={setAd} />
            <TextInput style={s.girdi} placeholder="Davet kodu" autoCapitalize="characters" value={davetKod} onChangeText={setDavetKod} />
            <Dugme
              etiket="Katıl"
              onPress={calistir(async () => {
                await davetKabul(davetKod, ad);
                await simdiSenkronEt();
                setEkip(await ekipListesi().catch(() => []));
              }, 'Çiftliğe katıldın.')}
            />
          </View>
        </>
      ) : (
        <>
          {yerelEkip && (
            <View style={s.ipucu}>
              <Text style={s.ipucuBaslik}>Bu cihazda yerel ekip profilleri var</Text>
              <Text style={s.ipucuMetin}>
                Ayarlar → Ekip’teki kişiler ve PIN yalnız bu telefonda geçerli; buluta gitmez. Ortak çiftlik rolleri (Sahip, Ortak, Bakıcı…) sunucudaki ekip
                listesinde; davet koduyla katılanlar orada görünür.
              </Text>
            </View>
          )}
          <View style={s.kart}>
            <Text style={s.baslik}>Bağlı: {d.oturum.eposta}</Text>
            <Text style={s.metin}>Rolün: {ROL_AD[d.uyelik.rol]}{d.uyelik.rol === 'bakici' ? ' · para bilgileri bu cihaza gönderilmez' : ''}</Text>
            <Text style={s.metin}>
              Son eşitleme: {d.son ? `${new Date(d.son.zaman).toLocaleString('tr-TR')} · ${d.son.rapor.gonderilen} gönderildi, ${d.son.rapor.alinan} alındı${d.son.rapor.hata ? ` · ${d.son.rapor.hata}` : ''}` : 'henüz yok'}
            </Text>
            <Dugme
              etiket="Şimdi eşitle"
              onPress={calistir(async () => {
                const r = await simdiSenkronEt();
                if (r?.hata) throw new Error(`Eşitlenemedi, bekleyenler internet gelince gönderilecek: ${r.hata}`);
                if (r && r.alinan > 0 && Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
              }, 'Eşitlendi.')}
            />
          </View>
          {d.uyelik.rol === 'sahip' && (
            <View style={s.kart}>
              <Text style={s.baslik}>Ekibe davet et</Text>
              <View style={s.satir}>
                <Dugme ikincil etiket="Ortak" onPress={calistir(async () => setYeniDavet(await davetOlustur('ortak', true)))} />
                <Dugme ikincil etiket="Bakıcı" onPress={calistir(async () => setYeniDavet(await davetOlustur('bakici', false)))} />
                <Dugme ikincil etiket="Veteriner" onPress={calistir(async () => setYeniDavet(await davetOlustur('veteriner', false)))} />
              </View>
              {yeniDavet && <Text style={s.kod}>Davet kodu: {yeniDavet} (7 gün geçerli)</Text>}
            </View>
          )}
          <View style={s.kart}>
            <Text style={s.baslik}>Ekip (bulutta ortak)</Text>
            {ekip.map((u) => (
              <View key={u.kullanici_id} style={s.uye}>
                <Text style={s.metin}>{u.ad || 'İsimsiz'} · {ROL_AD[u.rol]} · para: {u.rol === 'sahip' || u.rol === 'ortak' || u.finans ? 'görür' : 'görmez'}</Text>
                {d.uyelik!.rol === 'sahip' && u.rol !== 'sahip' && u.rol !== 'bakici' && (
                  <Dugme ikincil etiket={u.finans ? 'Parayı gizle' : 'Parayı göster'} onPress={calistir(() => uyeYetkiGuncelle(u.kullanici_id, { finans: !u.finans }))} />
                )}
              </View>
            ))}
          </View>
          <Dugme ikincil etiket="Çıkış yap" onPress={calistir(cikis)} />
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  kap: { padding: 16, gap: 12 },
  kart: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  baslik: { fontSize: 17, fontWeight: '700', color: '#1b4332' },
  metin: { fontSize: 14, color: '#374151' },
  mesaj: { backgroundColor: '#ecfdf5', padding: 10, borderRadius: 8, color: '#065f46' },
  girdi: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fff' },
  dugme: { backgroundColor: YESIL, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  dugme2: { backgroundColor: '#fff', borderWidth: 1, borderColor: YESIL },
  dugmeYazi: { color: '#fff', fontWeight: '700' },
  satir: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kod: { fontSize: 18, fontWeight: '800', color: YESIL, letterSpacing: 1 },
  uye: { gap: 6, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  ipucu: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, gap: 6, borderWidth: 1, borderColor: '#fcd34d' },
  ipucuBaslik: { fontSize: 15, fontWeight: '700', color: '#92400e' },
  ipucuMetin: { fontSize: 13, color: '#78350f', lineHeight: 19 },
});
