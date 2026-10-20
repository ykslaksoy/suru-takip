import { test, type TestModul, type TestSonuc } from '../cerceve';
import { xlsxOku, xlsxYaz, sutunHarf, harfSutun } from '@/kaynak/excel/xlsx';
import { csvOku, csvYaz, ayiriciBul } from '@/kaynak/excel/csv';
import { dosyaOku, xlsxMi } from '@/kaynak/excel/oku';
import {
  cinsiyetCoz,
  eslesmeDegistir,
  kupeAnahtar,
  onizle,
  otomatikEslesme,
  sayiCoz,
  tarihCoz,
  uygulanacaklar,
  sablonTablosu,
  HEDEF_ALANLAR,
} from '@/kaynak/excel/ice-aktar';
import { maliyetTablosu, suruTablosu, tartimTablosu, tedaviTablosu, trTarih } from '@/kaynak/excel/disa-aktar-tablo';
import type { Animal } from '@/kaynak/cekirdek/tipler';

const G = 'Excel / CSV';

function hayvan(p: Partial<Animal>): Animal {
  return {
    id: 'x', earTag: 'TR1', turkvetNo: '', name: '', breed: 'Merinos', species: 'sheep', sex: 'male', birthDate: '2026-03-15',
    paddock: 'Padok A', status: 'healthy', motherId: null, gehisId: null, sirtNo: null, modId: 'mod1', notes: '',
    createdAt: '', updatedAt: '', syncStatus: 'pending', ...p,
  };
}

export const excelModul: TestModul = {
  grup: G,
  calistir() {
    const r: TestSonuc[] = [];
    const t = (ad: string, k: boolean) => {
      r.push(test(G, ad, k));
    };
    // xlsx gidiş-dönüş
    const bytes = xlsxYaz([
      { ad: 'Sürü', satirlar: [['Küpe no', 'Kilo (kg)', 'Not'], ['TR34 001', 24.5, 'a & <b> "c"'], ['TR34-002', null, 'Çığır ŞÖÜ']] },
      { ad: 'Boş', satirlar: [] },
    ]);
    t('xlsx bir zip (PK) dosyası', xlsxMi(bytes));
    const okunan = xlsxOku(bytes);
    t('xlsx iki sayfa ve adları korunur', okunan.length === 2 && okunan[0].ad === 'Sürü');
    t('xlsx metin + özel karakter gidiş-dönüş', okunan[0].satirlar[1][2] === 'a & <b> "c"' && okunan[0].satirlar[2][2] === 'Çığır ŞÖÜ');
    t('xlsx sayı hücresi', okunan[0].satirlar[1][1] === '24.5');
    t('xlsx boş hücre boşluğu korunur', okunan[0].satirlar[2][1] === '' && okunan[0].satirlar[2][2] !== undefined);
    t('sütun harfi A/Z/AA/AB', sutunHarf(0) === 'A' && sutunHarf(25) === 'Z' && sutunHarf(26) === 'AA' && harfSutun('AB12') === 27);

    // csv
    const csv = csvYaz([['Küpe', 'Not'], ['TR1', 'a;b'], ['TR2', 'çift "tırnak"'], ['TR3', 12.5]]);
    t('CSV BOM ile başlar', csv.charCodeAt(0) === 0xfeff);
    const geri = csvOku(csv);
    t('CSV ; ayırıcı ve tırnak gidiş-dönüş', geri[1][1] === 'a;b' && geri[2][1] === 'çift "tırnak"' && geri[3][1] === '12,5');
    t('CSV ayırıcı otomatik: virgül / sekme', ayiriciBul('a,b,c\n1,2,3') === ',' && ayiriciBul('a\tb\n1\t2') === '\t');
    t('CSV alan içinde yeni satır', csvOku('a,b\n"x\ny",2')[1][0] === 'x\ny');
    t('dosyaOku: CSV baytları', dosyaOku(new TextEncoder().encode('Küpe;Kilo\nTR1;20')).tablo[1][1] === '20');
    t('dosyaOku: xlsx ilk dolu sayfa', dosyaOku(bytes).sayfaAdi === 'Sürü');

    // değer çözme
    t('tarih: 15.03.2026 / 2026-03-15 / 15/3/26', tarihCoz('15.03.2026') === '2026-03-15' && tarihCoz('2026-03-15') === '2026-03-15' && tarihCoz('15/3/26') === '2026-03-15');
    t('tarih: Excel seri sayı 46096 → 2026-03-15', tarihCoz('46096') === '2026-03-15');
    t('tarih: 31.02.2026 geçersiz', tarihCoz('31.02.2026') === null && tarihCoz('abc') === null);
    t('cinsiyet D/E/Dişi/Koç', cinsiyetCoz('D') === 'female' && cinsiyetCoz('Erkek') === 'male' && cinsiyetCoz('dişi') === 'female' && cinsiyetCoz('Koç') === 'male');
    t('sayı 24,5 / 24.5 kg / 1.024,5', sayiCoz('24,5') === 24.5 && sayiCoz('24.5 kg') === 24.5 && sayiCoz('1.024,5') === 1024.5);
    t('küpe anahtarı boşluk/tire yok sayar', kupeAnahtar('tr-34 001') === kupeAnahtar('TR34001'));

    // eşleme
    const bas = ['Kulak Küpesi', 'Cinsiyet', 'D.Tarihi', 'Ağırlık', 'Grup', 'Açıklama', 'Bilinmeyen'];
    const e = otomatikEslesme(bas);
    t('otomatik eşleme: küpe, cinsiyet, doğum, kilo, padok, not', e[0] === 'earTag' && e[1] === 'sex' && e[2] === 'birthDate' && e[3] === 'kiloKg' && e[4] === 'paddock' && e[5] === 'notes');
    t('tanınmayan sütun alınmaz', e[6] === null);
    const e2 = eslesmeDegistir(e, 6, 'earTag');
    t('bir alan tek sütuna: yeniden eşleme eskisini boşaltır', e2[6] === 'earTag' && e2[0] === null);
    const geriEsle = otomatikEslesme(suruTablosu([hayvan({})], [])[0].map(String));
    t('dışa aktarılan sürü başlıkları birebir geri eşlenir', ['earTag', 'turkvetNo', 'sirtNo', 'gehisId', 'name', 'species', 'breed', 'sex', 'birthDate', 'paddock', 'status', 'motherTag', 'fatherTag', 'kiloKg', 'kiloTarih', 'notes'].every((a, i) => geriEsle[i] === a));
    t('şablon başlıkları da eşlenir', Object.values(otomatikEslesme(sablonTablosu()[0])).filter(Boolean).length === sablonTablosu()[0].length);
    t('şablon satırı başlıkla aynı uzunlukta', sablonTablosu()[0].length === sablonTablosu()[1].length && HEDEF_ALANLAR.length === 16);

    // önizleme + mükerrer
    const tablo = [
      ['Küpe', 'Cinsiyet', 'Doğum', 'Kilo'],
      ['TR1', 'E', '01.03.2026', '22'],
      ['TR2', 'D', '99.99.2026', '20'],
      ['TR 3', 'E', '', '21,5'],
      ['TR-3', 'E', '', '23'],
      ['', 'E', '', ''],
      ['TR4', 'x', '', '900'],
      ['', '', '', ''],
    ];
    const o = onizle(tablo, otomatikEslesme(tablo[0]), new Set(['TR1']), new Date(2026, 9, 19));
    const d = (n: number) => o.satirlar.find((s) => s.satirNo === n)?.durum;
    t('önizleme: sürüde olan küpe "mevcut"', d(2) === 'mevcut');
    t('önizleme: geçersiz tarih "hatalı"', d(3) === 'hatali');
    t('önizleme: dosyada tekrar eden küpe (boşluk/tire farkı)', d(4) === 'yeni' && d(5) === 'dosyada-tekrar');
    t('önizleme: küpesiz satır hatalı, tamamen boş satır atlanır', d(6) === 'hatali' && o.satirlar.length === 6);
    t('önizleme: kilo 900 hatalı, anlaşılmayan cinsiyet uyarı', d(7) === 'hatali' && (o.satirlar.find((s) => s.satirNo === 7)?.uyarilar.length ?? 0) > 0);
    t('önizleme: kilo 21,5 sayıya çevrilir', o.satirlar.find((s) => s.satirNo === 4)?.veri.kiloKg === 21.5);
    t('uygulanacak: atla → yalnız yeni', uygulanacaklar(o, 'atla').length === 1);
    t('uygulanacak: güncelle → yeni + mevcut', uygulanacaklar(o, 'guncelle').length === 2);
    t('zorunlu küpe eşlenmezse uyarı', onizle(tablo, { 0: null, 1: 'sex' }, new Set()).eksikZorunlu.includes('Küpe no'));

    // dışa aktarma tabloları
    const a1 = hayvan({ id: 'a1', earTag: 'TR1', sirtNo: '5' });
    const a2 = hayvan({ id: 'a2', earTag: 'TR2', motherId: 'a1', sex: 'female', status: 'pregnant' });
    const w = [
      { id: 'w1', animalId: 'a1', weightKg: 20, recordedAt: '2026-09-01T10:00:00Z', notes: '' },
      { id: 'w2', animalId: 'a1', weightKg: 25, recordedAt: '2026-10-01T10:00:00Z', notes: '' },
    ];
    const st = suruTablosu([a2, a1], w);
    const r1 = st.find((r) => r[0] === 'TR1')!;
    const r2 = st.find((r) => r[0] === 'TR2')!;
    t('sürü tablosu: son kilo + tarih', r1[13] === 25 && r1[14] === '01.10.2026');
    t('sürü tablosu: ana küpe, cinsiyet, durum Türkçe', r2[11] === 'TR1' && r2[7] === 'Dişi' && r2[10] === 'Gebe');
    t('tartım tablosu yeni → eski', tartimTablosu([a1], w)[1][4] === 25);
    const tt = tedaviTablosu([a1], [{ id: 'h', animalId: 'a1', recordType: 'treatment', symptoms: '', diagnosis: 'Pnömoni', treatment: '', medicine: 'Oksitetrasiklin', withdrawalDays: 28, vetName: '', recordedAt: '2026-10-10T00:00:00Z', notes: '' }]);
    t('tedavi tablosu: tür, ilaç, arınma', tt[1][4] === 'Tedavi' && tt[1][5] === 'Oksitetrasiklin' && tt[1][9] === 28 && tt[1][0] === '10.10.2026');
    const p = (parti: string, toplam: number) => ({ parti, bas: 10, alis: 1000, alisEksikBas: 0, alisTahminiBas: 0, yem: 500, ilac: 100, sigorta: 50, toplam, basBasi: toplam / 10, toplamKg: 300, kgBasi: toplam / 300, tahminiSatis: null, tahminiKar: null, gercekSatis: null, gercekKar: null });
    const mt = maliyetTablosu([p('Padok A', 1650), p('Padok B', 1650)]);
    t('maliyet tablosu: parti satırları + TOPLAM', mt.length === 4 && mt[3][0] === 'TOPLAM' && mt[3][6] === 3300);
    t('trTarih', trTarih('2026-03-05T00:00:00Z') === '05.03.2026' && trTarih('') === '');
    return r;
  },
};
