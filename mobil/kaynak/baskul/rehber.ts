/** Otomatik tartı bağlantı rehberi — dürüst, uygulanabilir metin */

export type BaskulOrtam = { serial: boolean; bluetooth: boolean };

export function baskulOrtamAlgila(nav?: Navigator | null): BaskulOrtam {
  const n = nav ?? (typeof navigator !== 'undefined' ? navigator : null);
  if (!n) return { serial: false, bluetooth: false };
  const x = n as Navigator & { serial?: unknown; bluetooth?: unknown };
  return { serial: !!x.serial, bluetooth: !!x.bluetooth };
}

export function baskulDestekSecenekleri(ortam: BaskulOrtam): string[] {
  const satirlar: string[] = [];
  if (ortam.serial) satirlar.push('USB kablo → Web Serial (Chrome / Edge, masaüstü)');
  if (ortam.bluetooth) satirlar.push('Bluetooth seri / LE → Web Bluetooth (Chrome / Edge)');
  if (!satirlar.length) {
    satirlar.push('Bu ortamda USB/Bluetooth API yok (Safari, bazı mobil gömülü tarayıcılar)');
  }
  return satirlar;
}

export function baskulAdaptorDurumuMetni(adaptorTanimli: boolean): string {
  if (adaptorTanimli) return 'Kayıtlı baskül protokolü ile bağlanmayı dene.';
  return 'Henüz marka/model protokolü eklenmedi. «Tartıyı bağla» yalnızca ortamı kontrol eder; otomatik ölçüm gelmez. Cihaz markası ve çıkış tipini (USB/RS232/BT) ekibe iletin veya elle/ses yöntemine geçin.';
}

export function baskulBagliykenKayitAcilir(bagli: boolean): boolean {
  return bagli;
}
