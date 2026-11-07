/**
 * Yem kaynağı: çiftlikte üretim karışımı vs ticari hazır yem (besleme dönemi/faz ayrı).
 * «Başlangıç» adı tam/yeterli rasyon anlamına gelmez; etiket beyanı gerekir.
 */
import type { StockItem } from '@/kaynak/cekirdek/tipler';
import { standartYem } from '@/kaynak/rasyon/yem-besin';
import type { RasyonKalemi } from './hesap';

export type YemKaynagiTercih = 'uretim' | 'ticari' | 'her_ikisi';

export type YemStokMeta = {
  kaynak: 'ticari' | 'uretim' | 'belirsiz';
  katalogId?: string;
  etiketAnalizi: 'var' | 'yok' | 'belirsiz';
  tamYemBeyan: 'tam' | 'tamamlayici' | 'belirsiz';
  birim: string;
};

/** Stok notundan meta — otomatik migrasyon yok */
export function yemStokMeta(item: Pick<StockItem, 'name' | 'notes' | 'unit'>): YemStokMeta {
  const n = (item.notes ?? '').toLocaleLowerCase('tr');
  const kid = n.match(/\b(fabrika-[a-z0-9-]+|arpa-kirmasi|soya-kuspesi|[a-z]+-[a-z]+)\b/)?.[1];
  const katalogId = n.includes('fabrika-') ? (n.match(/fabrika-[a-z]+/)?.[0] ?? kid) : kid;

  let kaynak: YemStokMeta['kaynak'] = 'belirsiz';
  if (n.includes('ticari') || katalogId?.startsWith('fabrika-')) kaynak = 'ticari';
  else if (n.includes('uretim') || n.includes('uretim-bilesen')) kaynak = 'uretim';
  else if (standartYem(item.name) && !katalogId?.startsWith('fabrika-')) kaynak = 'uretim';

  let etiketAnalizi: YemStokMeta['etiketAnalizi'] = 'belirsiz';
  if (n.includes('etiket:var') || n.includes('analiz:var')) etiketAnalizi = 'var';
  else if (n.includes('etiket:yok') || n.includes('analiz:yok')) etiketAnalizi = 'yok';

  let tamYemBeyan: YemStokMeta['tamYemBeyan'] = 'belirsiz';
  if (n.includes('tam:etiket') || n.includes('tam:evet')) tamYemBeyan = 'tam';
  else if (n.includes('tam:hayir') || n.includes('tamamlayici')) tamYemBeyan = 'tamamlayici';

  return { kaynak, katalogId, etiketAnalizi, tamYemBeyan, birim: item.unit || 'kg' };
}

export function ticariYemMi(item: Pick<StockItem, 'name' | 'notes'>): boolean {
  return yemStokMeta(item).kaynak === 'ticari';
}

export function uretimBilesenMi(item: Pick<StockItem, 'name' | 'notes'>): boolean {
  const m = yemStokMeta(item);
  return m.kaynak === 'uretim';
}

export function tamYemOlarakSayilir(item: Pick<StockItem, 'name' | 'notes'>): boolean {
  return yemStokMeta(item).tamYemBeyan === 'tam';
}

export function stokKaynagaUygun(
  item: Pick<StockItem, 'name' | 'notes'>,
  tercih: YemKaynagiTercih,
): boolean {
  if (tercih === 'her_ikisi') return true;
  const m = yemStokMeta(item);
  if (m.kaynak === 'belirsiz') return true;
  return tercih === 'ticari' ? m.kaynak === 'ticari' : m.kaynak === 'uretim';
}

export type AnalizOzet = { bilinen: string[]; eksik: string[]; uyari: string };

export function yemAnalizOzeti(item: Pick<StockItem, 'name' | 'notes'>): AnalizOzet {
  const m = yemStokMeta(item);
  const s = standartYem(item.name);
  const bilinen: string[] = [];
  const eksik: string[] = [];
  if (m.etiketAnalizi === 'var') bilinen.push('Etiket / kullanıcı analizi');
  else if (m.etiketAnalizi === 'yok') eksik.push('Etiket analizi girilmedi');
  else eksik.push('Etiket / analiz durumu belirsiz');

  if (s && m.etiketAnalizi !== 'var') {
    eksik.push('Besin değerleri yalnızca genel tablo ortalaması (garanti değil)');
  } else if (s) bilinen.push('Standart tablo + etiket işareti');

  const uyari =
    'Yeterlilik garantisi verilmez; veteriner / etiket analizi ile doğrulayın.' +
    (m.tamYemBeyan === 'belirsiz' ? ' Tam/tamamlayıcı yem türü etiketten girilmelidir.' : '');
  return { bilinen, eksik, uyari };
}

export function rasyonCiftSayimRiski(
  kalemler: RasyonKalemi[],
  yemler: Pick<StockItem, 'id' | 'name' | 'notes'>[],
): string | null {
  const byId = new Map(yemler.map((y) => [y.id, y]));
  const tamlar = kalemler.filter((k) => tamYemOlarakSayilir(byId.get(k.stockId) ?? { name: '', notes: '' }));
  if (tamlar.length === 0) return null;
  if (kalemler.length > tamlar.length) {
    return 'Tam yem (etiket beyanı) ile ek bileşen birlikte — çift sayım riski; tam yem tek başına veya tamamlayıcı etikete göre planlayın.';
  }
  return null;
}

/** İsimde «başlangıç» tam yem kanıtı değildir */
export function isimdenTamYemCikarimYasak(ad: string): boolean {
  const s = ad.toLocaleLowerCase('tr');
  return /başlangıç|baslangic|starter|kuzu/.test(s);
}
