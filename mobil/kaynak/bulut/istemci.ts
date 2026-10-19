/**
 * Hafif Supabase istemcisi (fetch ile Auth + PostgREST + Storage). Ek bağımlılık yok.
 */
import type { BulutAyar } from './ayar';
import type { Tasiyici, UzakBelge } from './motor';

export type Oturum = { access_token: string; refresh_token: string; expires_at: number; kullanici_id: string; eposta: string };
export type Uyelik = { ciftlik_id: string; rol: 'sahip' | 'ortak' | 'bakici' | 'veteriner'; finans: boolean; duzenle: boolean; sil: boolean; ad: string };

type Fetch = typeof fetch;

export class BulutIstemci {
  constructor(private ayar: BulutAyar, private f: Fetch = (...a) => fetch(...a)) {}

  private basliklar(token?: string, ek: Record<string, string> = {}): Record<string, string> {
    // Yeni "sb_publishable_" anahtarları JWT değildir: kullanıcı jetonu yoksa Authorization gönderme
    const h: Record<string, string> = { apikey: this.ayar.anonKey, 'Content-Type': 'application/json', ...ek };
    if (token) h.Authorization = `Bearer ${token}`;
    else if (this.ayar.anonKey.startsWith('eyJ')) h.Authorization = `Bearer ${this.ayar.anonKey}`;
    return h;
  }

  private async iste<T>(yol: string, init: RequestInit & { token?: string; ek?: Record<string, string> } = {}): Promise<T> {
    const r = await this.f(`${this.ayar.url}${yol}`, { ...init, headers: this.basliklar(init.token, init.ek) });
    const metin = await r.text();
    if (!r.ok) {
      let m = metin;
      try {
        const j = JSON.parse(metin);
        m = j.msg || j.message || j.error_description || j.error || metin;
      } catch {
        /* düz metin */
      }
      throw new Error(`Bulut hatası (${r.status}): ${m}`);
    }
    return (metin ? JSON.parse(metin) : null) as T;
  }

  /** E-postaya giriş kodu + sihirli bağlantı gönderir */
  async kodGonder(eposta: string, yonlendir?: string): Promise<void> {
    const q = yonlendir ? `?redirect_to=${encodeURIComponent(yonlendir)}` : '';
    await this.iste(`/auth/v1/otp${q}`, { method: 'POST', body: JSON.stringify({ email: eposta, create_user: true }) });
  }

  private oturumYap(j: { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } }): Oturum {
    return {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: Date.now() + j.expires_in * 1000,
      kullanici_id: j.user.id,
      eposta: j.user.email ?? '',
    };
  }

  async kodDogrula(eposta: string, kod: string): Promise<Oturum> {
    const j = await this.iste<any>('/auth/v1/verify', { method: 'POST', body: JSON.stringify({ type: 'email', email: eposta, token: kod.trim() }) });
    return this.oturumYap(j);
  }

  async yenile(o: Oturum): Promise<Oturum> {
    const j = await this.iste<any>('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: o.refresh_token }) });
    return this.oturumYap(j);
  }

  /** Sihirli bağlantıdan dönen #access_token=... parçasını oturuma çevirir */
  async baglantidanOturum(hash: string): Promise<Oturum | null> {
    const p = new URLSearchParams(hash.replace(/^#/, ''));
    const at = p.get('access_token');
    const rt = p.get('refresh_token');
    if (!at || !rt) return null;
    const u = await this.iste<{ id: string; email?: string }>('/auth/v1/user', { token: at });
    return { access_token: at, refresh_token: rt, expires_at: Date.now() + Number(p.get('expires_in') ?? 3600) * 1000, kullanici_id: u.id, eposta: u.email ?? '' };
  }

  async rpc<T>(o: Oturum, ad: string, arg: Record<string, unknown>): Promise<T> {
    return this.iste<T>(`/rest/v1/rpc/${ad}`, { method: 'POST', token: o.access_token, body: JSON.stringify(arg) });
  }

  async uyeliklerim(o: Oturum): Promise<Uyelik[]> {
    return this.iste<Uyelik[]>(`/rest/v1/ciftlik_uye?kullanici_id=eq.${o.kullanici_id}&select=ciftlik_id,rol,finans,duzenle,sil,ad`, { token: o.access_token });
  }

  async uyeler(o: Oturum, ciftlik: string): Promise<(Uyelik & { kullanici_id: string })[]> {
    return this.iste(`/rest/v1/ciftlik_uye?ciftlik_id=eq.${ciftlik}&select=kullanici_id,ciftlik_id,rol,finans,duzenle,sil,ad`, { token: o.access_token });
  }

  async uyeGuncelle(o: Oturum, ciftlik: string, kullanici: string, d: Partial<Pick<Uyelik, 'rol' | 'finans' | 'duzenle' | 'sil'>>): Promise<void> {
    await this.iste(`/rest/v1/ciftlik_uye?ciftlik_id=eq.${ciftlik}&kullanici_id=eq.${kullanici}`, { method: 'PATCH', token: o.access_token, body: JSON.stringify(d) });
  }

  tasiyici(o: Oturum, ciftlik: string): Tasiyici {
    return {
      gonder: async (belgeler: UzakBelge[]) => {
        const satirlar = belgeler.map((b) => ({ ciftlik_id: ciftlik, anahtar: b.anahtar, deger: b.deger, finans: b.finans, silindi: b.silindi, updated_at: b.updated_at }));
        await this.iste('/rest/v1/belge?on_conflict=ciftlik_id,anahtar', {
          method: 'POST',
          token: o.access_token,
          ek: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(satirlar),
        });
      },
      cek: async (imlec: string | null) => {
        const f = imlec ? `&sunucu_zamani=gt.${encodeURIComponent(imlec)}` : '';
        return this.iste<UzakBelge[]>(`/rest/v1/belge?ciftlik_id=eq.${ciftlik}${f}&select=anahtar,deger,finans,silindi,updated_at,sunucu_zamani&order=sunucu_zamani.asc`, { token: o.access_token });
      },
    };
  }

  // --- Storage (fotoğraflar) ---
  async fotoYukle(o: Oturum, ciftlik: string, id: string, blob: Blob): Promise<string> {
    const yol = `${ciftlik}/${id}.jpg`;
    const r = await this.f(`${this.ayar.url}/storage/v1/object/kuzu-foto/${yol}`, {
      method: 'POST',
      headers: { apikey: this.ayar.anonKey, Authorization: `Bearer ${o.access_token}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: blob,
    });
    if (!r.ok) throw new Error(`Foto yüklenemedi (${r.status})`);
    await this.iste('/rest/v1/foto?on_conflict=ciftlik_id,id', {
      method: 'POST',
      token: o.access_token,
      ek: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ ciftlik_id: ciftlik, id, yol, updated_at: new Date().toISOString() }]),
    });
    return yol;
  }

  async fotoListe(o: Oturum, ciftlik: string): Promise<{ id: string; yol: string; silindi: boolean }[]> {
    return this.iste(`/rest/v1/foto?ciftlik_id=eq.${ciftlik}&select=id,yol,silindi`, { token: o.access_token });
  }

  async fotoIndir(o: Oturum, yol: string): Promise<Blob> {
    const r = await this.f(`${this.ayar.url}/storage/v1/object/authenticated/kuzu-foto/${yol}`, {
      headers: { apikey: this.ayar.anonKey, Authorization: `Bearer ${o.access_token}` },
    });
    if (!r.ok) throw new Error(`Foto indirilemedi (${r.status})`);
    return r.blob();
  }
}
