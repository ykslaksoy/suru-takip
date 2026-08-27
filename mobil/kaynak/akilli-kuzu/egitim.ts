import type { EducationLesson } from '@/kaynak/cekirdek/tipler';
import { terim } from '@/sabitler/Metinler';

/** Akıllı Kuzu — pratik rehber içerikleri (eski ad: Sürü Okulu) */
export const EDUCATION_LESSONS: EducationLesson[] = [
  {
    id: '1',
    title: 'Kuzulama Öncesi Hazırlık',
    duration: '2 dk',
    category: 'Üreme',
    summary: 'Gebe koyun padok hazırlığı ve doğum kutusu düzeni.',
    content: 'Doğumdan 2 hafta önce gebe koyunları ayrı padoka alın. Temiz kuru ot, temiz su ve gölge sağlayın. Doğum kutusunda yeterli alan (1,5 m²/koyun) bırakın.',
    tips: ['Gebe koyunları günde 2 kez kontrol edin', 'Kolostrum için süt sağım hazırlığı yapın', 'Doğum zorluğunda 30 dk içinde müdahale edin'],
  },
  {
    id: '2',
    title: 'Parazit Kontrol Programı',
    duration: '2 dk',
    category: 'Sağlık',
    summary: 'Mevsimsel parazit ilacı uygulama zamanlaması.',
    content: 'İlkbahar ve sonbahar rutin dış parazit uygulaması yapın. İç parazit için dışkı yumurta sayımı veya FAMACHA skoru kullanın. Gereksiz ilaç kullanımından kaçının — direnç gelişir.',
    tips: ['Bekletme süresine dikkat edin', 'Tüm sürüye aynı gün uygulamayın — rotasyon yapın', `İlaç stokunu ${terim('SKT')} takibi ile yönetin`],
  },
  {
    id: '3',
    title: 'Padok Yönetimi',
    duration: '2 dk',
    category: 'Yönetim',
    summary: 'Yaş, cinsiyet ve duruma göre gruplama.',
    content: 'Kuzular, gebe koyunlar, sağmal ve besi erkekleri ayrı padoklarda tutulmalı. Padok değişiminde 2 hafta karantina uygulayın.',
    tips: ['Padok kapasitesi: 8-10 koyun/m² barınak', 'Rotasyonla ot yükünü dengeleyin', 'Padok kaydını uygulamada güncel tutun'],
  },
  {
    id: '4',
    title: 'Rasyon Temelleri',
    duration: '3 dk',
    category: 'Besleme',
    summary: 'Canlı ağırlığa göre kuru madde ihtiyacı.',
    content: 'Koyunun kuru madde ihtiyacı canlı ağırlığın %3-4\'ü civarındadır. Gebe ve sağmal dönemde %15-45 artış gerekir. Yem maliyetinin %60-70\'i kaba yemden gelmelidir.',
    tips: ['Haftalık tartım yapın', 'Yem stokunu minimum seviyede tanımlayın', 'Su kabını günlük temizleyin'],
  },
  {
    id: '5',
    title: 'Aşı Takvimi',
    duration: '2 dk',
    category: 'Sağlık',
    summary: 'Clostridial ve enterotoksemi aşı programı.',
    content: 'Yıllık clostridial aşı tüm sürüye uygulanmalı. Kuzular 2-3 aylıkken ilk doz, 3-4 hafta sonra rapel. Gebe koyunlara doğumdan 4 hafta önce rapel aşı.',
    tips: ['Aşı sonrası 24 saat stres azaltın', `${terim('SKT')} geçmiş aşı kullanmayın`, 'Uygulamayı sağlık modülüne kaydedin'],
  },
  {
    id: '6',
    title: 'TÜRKVET Kayıt Disiplini',
    duration: '2 dk',
    category: 'Resmi Kayıt',
    summary: 'Küpe numarası ve dijital kayıt uyumu.',
    content: 'Her hayvanın TÜRKVET numarası uygulamadaki kimlik alanına girilmeli. Doğum, ölüm, satış ve aşı olayları resmi kayıtlarla eşleşmeli.',
    tips: ['Küpe kaybında 7 gün içinde bildirim', 'GEKİS alanlarını boş bırakmayın', 'Dışa aktarım ile yedek alın'],
  },
];
