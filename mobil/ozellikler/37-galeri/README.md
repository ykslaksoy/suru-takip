# 37 · Kuzu fotoğraf galerisi

**Nerede:** Kuzu kartı → "📷 Fotoğraflar (N)" şeridi (Kilo Takibi / Sağlık düğmelerinin altında) → `/hayvan/[id]/galeri`.

## Ne yapar
- **📷 Fotoğraf çek** (telefonda arka kamera) veya **🖼️ Dosyadan** (birden çok seçilebilir).
- Fotoğraf eklenmeden önce bir **etiket** seçilir: Genel, Sağlık / yara, Tartım / kondisyon, Doğum, Küpe / kimlik. Etiket ızgarada rozet olarak görünür.
- Izgara gün gün gruplanır (yeni → eski). Kuzu kartında son 4 fotoğraf küçük resim olarak gösterilir.
- Tam ekran görünüm: ‹ › ile gezinme, **not** ekleme (alandan çıkınca kaydolur), boyut bilgisi, **🗑 Sil**.
- Silinen fotoğraf **30 gün geri dönüşüm kutusunda** kalır (Daha → İşlem kaydı → Geri dönüşüm). Geri yüklenebilir, kalıcı silinirse görüntü dosyası da silinir. Kuzu silinip geri yüklenirse fotoğrafları da geri gelir.
- Silme işlemi Roller (36) ile korunur: "Kayıt silebilir" yetkisi gerekir.

## Depolama
- Hiçbir şey sunucuya gitmez. Web: görüntüler **IndexedDB** (`superkuzu-foto/gorsel`), üst veri `sy_foto_meta_v1`. Telefon: uygulama klasöründe dosya (expo-file-system) + expo-image-picker.
- Her fotoğraf yüklenirken **1600 px** tam boy + **320 px** küçük resim olarak JPEG'e küçültülür (~20–300 KB).
- Kuzu başına en çok **60** fotoğraf.

## Kod
- `kaynak/galeri/hesap.ts`: saf mantık (ölçekleme, görünenler, gün grupları, 30 gün temizliği, kapasite, gezinme).
- `kaynak/galeri/meta.ts`, `depo.ts`, `gorsel.web.ts`, `gorsel.ts`.
- `bilesenler/galeri/FotoKare.tsx`, `KuzuFotoSeridi.tsx`; `app/hayvan/[id]/galeri.tsx`.
- Test: `test/moduller/galeri.ts`.

## Sınırlar
- Fotoğraflar yalnız o cihazda/tarayıcıda durur. Excel dışa aktarmaya ve yedeğe girmez, cihazlar arasında paylaşılmaz.
- Tarayıcı verisi temizlenirse fotoğraflar da silinir.
