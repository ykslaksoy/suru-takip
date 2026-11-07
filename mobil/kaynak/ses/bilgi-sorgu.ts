import { getLatestWeight, getWeightRecords } from '@/kaynak/cekirdek/veritabani';
import { hayvanAnaEtiket } from '@/kaynak/cekirdek/hayvan-etiket';
import { getBugunGorevleri } from '@/kaynak/gorevler/liste';
import type { BilgiKomutu } from './tipler';
import { hayvanBulKesin } from './hayvan-kesin';

/** Salt okunur — uydurma yok; veri yoksa açıkça söyle */
export async function bilgiSorgula(eylem: BilgiKomutu): Promise<{ ok: true; metin: string } | { ok: false; hata: string }> {
  switch (eylem.soru) {
    case 'son_kilo': {
      const h = await hayvanBulKesin(eylem.kupeArama);
      if (!h.ok) return h;
      const kayitlar = (await getWeightRecords(h.animal.id)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
      const son = kayitlar[0];
      if (!son) {
        return { ok: true, metin: `${hayvanAnaEtiket(h.animal)} için kayıtlı tartım yok.` };
      }
      const tarih = son.recordedAt.slice(0, 10);
      const sonKg = await getLatestWeight(h.animal.id);
      return {
        ok: true,
        metin: `${hayvanAnaEtiket(h.animal)} son tartım: ${son.weightKg} kg (${tarih}). Güncel kayıt: ${sonKg ?? son.weightKg} kg.`,
      };
    }
    case 'bugun_asi_ozet': {
      const gorevler = await getBugunGorevleri(40);
      const asi = gorevler.filter((g) => g.kaynak === 'asi' || g.href.includes('/asi'));
      if (!asi.length) {
        return {
          ok: true,
          metin: 'Bugün için uygulama takviminde planlı aşı görevi görünmüyor. Menü: Görevler → Aşı.',
        };
      }
      const satir = asi
        .slice(0, 8)
        .map((g) => `• ${g.baslik}${g.aciklama ? ` — ${g.aciklama}` : ''}`)
        .join('\n');
      return {
        ok: true,
        metin: `Bugün planlı aşı / takviye (${asi.length}):\n${satir}${asi.length > 8 ? '\n…' : ''}`,
      };
    }
    default:
      return { ok: false, hata: 'Desteklenmeyen bilgi sorusu.' };
  }
}
