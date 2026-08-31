/**
 * Hafif test çerçevesi — Jest gerektirmez, Node (tsx) ve uygulama içi çalışır.
 */

export type TestDurum = 'gecti' | 'kaldi' | 'atlandi';

export type TestSonuc = {
  id: string;
  grup: string;
  ad: string;
  durum: TestDurum;
  detay?: string;
};

export type TestModul = {
  grup: string;
  calistir: () => TestSonuc[] | Promise<TestSonuc[]>;
};

let sira = 0;
export function test(
  grup: string,
  ad: string,
  kosul: boolean,
  detay?: string,
): TestSonuc {
  sira += 1;
  return {
    id: `${grup}-${sira}`,
    grup,
    ad,
    durum: kosul ? 'gecti' : 'kaldi',
    detay: kosul ? detay : detay ?? 'Beklenen koşul sağlanmadı',
  };
}

export function testGrupReset(): void {
  sira = 0;
}

export type TestRapor = {
  gecti: number;
  kaldi: number;
  toplam: number;
  sonuclar: TestSonuc[];
  basarisiz: TestSonuc[];
};

export async function calistirTestModulleri(moduller: TestModul[]): Promise<TestRapor> {
  testGrupReset();
  const sonuclar: TestSonuc[] = [];
  for (const mod of moduller) {
    const out = await mod.calistir();
    sonuclar.push(...out);
  }
  const gecti = sonuclar.filter((s) => s.durum === 'gecti').length;
  const kaldi = sonuclar.filter((s) => s.durum === 'kaldi').length;
  return {
    gecti,
    kaldi,
    toplam: sonuclar.length,
    sonuclar,
    basarisiz: sonuclar.filter((s) => s.durum === 'kaldi'),
  };
}

export function raporYaz(rapor: TestRapor): void {
  for (const s of rapor.sonuclar) {
    const ikon = s.durum === 'gecti' ? '✓' : '✗';
    const ek = s.detay ? ` — ${s.detay}` : '';
    console.log(`${ikon} [${s.grup}] ${s.ad}${ek}`);
  }
  console.log('');
  console.log(`Sonuç: ${rapor.gecti}/${rapor.toplam} geçti, ${rapor.kaldi} kaldı`);
}
