# 43 · Bölge ve ırka göre sağlık programı

**Yer:** Daha → “Sağlık programı (bölge/ırk)” (`/saglik-programi`); Aşı ve İlaç ekranında “📍 Bölge ve ırka göre program →”.
**Kod:** `kaynak/saglik-programi/` (hesap.ts saf mantık + kaynak yorumları, depo.ts kayıt/aktarım), `app/saglik-programi/index.tsx`, test `test/moduller/saglik-programi.ts`.

## Ne yapar
- Çiftlik ayarı: 7 coğrafi bölge, isteğe bağlı il, çiftlik ırkı; padok (parti) başına farklı ırk.
- Mod + bölge + ırk → varsayılan program (yalnız ASI_PROGRAMI / VITAMIN_PROGRAMI kalemleri). Her adımda “Neden”, “Öneridir; bölge veterinerinize danışın”.
- Düzenleme: ilaç/aşı değiştir, gün, tekrar, doz kuralı; adım ekle/çıkar; “değiştirildi/eklendi” işareti; adım ve tüm program için onaylı “Varsayılana dön”.
- Bölge/ırk değişince “yeniden oluştur” önerisi; kullanıcı değişiklikleri korunur.
- Etkin program mevcut sağlık planına (kendi plan + zamanlama) yazılır → Görevler, alarmlar, Takvim aynı kaynaktan okur; “Program: giriş günü” kayıt şablonu güncellenir. Çift kayıt yok.
- Parti ırkından gelen ek adımlar yalnız o padoktaki kuzulara planlanır (`KalemZaman.padoklar`).

## Kurallar ve kaynaklar
| Kural | Kaynak |
|---|---|
| Gün 1: İvermektin, Albendazol, Karma, Selenyum-E (tüm bölgeler) | Mevcut Mod 1 paketi |
| Çiçek ve PPR resmi programda | GKGM 2024 aşılama sayıları |
| Trakya (Edirne, Kırklareli, Tekirdağ; İstanbul/Çanakkale Avrupa yakası): PPR yok | Bakanlık Genelge 2021/04 (PPR aşılaması 2021'de durduruldu) |
| Trakya şaptan aşılı ari bölge | Bakanlık HAYGEM Genelge 2025/9 |
| Besi modlarında şap: kurban/sevk öncesi şart | Kütahya İl Müdürlüğü duyurusu |
| Şarbon: Doğu ve İç Anadolu | Sağlık Bakanlığı HSGM Şarbon Mevcut Durum Raporu 2007–2019 |
| Triklabendazol (karaciğer kelebeği): Karadeniz, Doğu Anadolu | Samsun/Sinop/Tokat %31,4 (JMII 2015), Kars %93 (Helminthologia 2014), Van/Tatvan |
| Selenyum-E vurgusu: Doğu, Güneydoğu, İç Anadolu | Türkiye Klinikleri (beyaz kas hastalığı); Kars toprak Se (Vet J 2002) |
| Agalaksi: süt modları; damızlıkta süt ırkı (İvesi, Sakız) | M. agalactiae Türkiye'de endemik (Tjvr 2025, KVFD 2015) |
| Brusella: damızlık modlarda | Resmi küçükbaş brusella aşılaması (GKGM 2024) |
| Parazit ilkbahar ayı (Mart/Nisan/Mayıs) | Genel uygulama; iklime göre **yaklaşık**, bölge verisi değil |

## Sınırlar
- Uygulama yalnız Mod 1'de (Aşı ve İlaç Mod 1'e kilitli); diğer modlarda önizleme + “Yakında”.
- Doz kuralı metin olarak saklanır/gösterilir; tabanca/doz hesabı katalog dozunu kullanmaya devam eder.
- Aşı ve İlaç ekranında elle yapılan değişiklik programa geri yazılmaz; program kaydedilince plan programla eşitlenir.
- Mastitis için katalogda aşı yok, eklenmedi.
