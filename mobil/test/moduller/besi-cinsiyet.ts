import { hayvanSinifEtiketi } from '@/kaynak/suru/tur';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_KUZU_CINSIYET, demoKuzuMu } from '@/kaynak/cekirdek/demo-kuzu';

const KOK = join(__dirname, '..', '..');
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8');
import { test, type TestModul } from '../cerceve';

const G = 'Besi cinsiyet';

export const besiCinsiyetModul: TestModul = {
  grup: G,
  calistir() {
    return [
      test(G, 'Yeni kuzu varsayılanı erkek', /VARSAYILAN_KABUL_CINSIYET: AnimalSex = 'male'/.test(oku('kaynak/suru/hizli-kuzu-kabul.ts'))),
      test(
        G,
        'Tek / toplu / ekle formları varsayılanı kullanır',
        ['app/hayvan/ekle.tsx', 'app/hayvan/hizli-ekle/tek-form.tsx', 'app/hayvan/hizli-ekle/toplu.tsx'].every((f) =>
          oku(f).includes('VARSAYILAN_KABUL_CINSIYET'),
        ),
      ),
      test(G, "Seed'de dişi kalmadı", !/'female'/.test(oku('kaynak/cekirdek/padok-b-kuzular.ts').replace("a.sex === 'female'", ''))),
      test(G, 'Demo kuzular erkek', DEMO_KUZU_CINSIYET === 'male'),
      test(G, 'Demo kimlik tanınır', demoKuzuMu('padok-a-kuzu-01') && demoKuzuMu('padok-c-grup-07')),
      test(G, 'Kullanıcı kaydı demo sayılmaz', !demoKuzuMu('a1b2c3') && !demoKuzuMu('kuzu-123')),
      test(G, "Erkek kuzu 'Koyun' yazılmaz", hayvanSinifEtiketi('sheep', 'male', 3) === 'Kuzu'),
      test(G, 'Yaşı bilinmeyen erkek → Kuzu', hayvanSinifEtiketi('sheep', 'male', null) === 'Kuzu'),
      test(G, 'Ergin erkek → Koç', hayvanSinifEtiketi('sheep', 'male', 18) === 'Koç'),
      test(G, 'Dişi koyun değişmez', hayvanSinifEtiketi('sheep', 'female', 24) === 'Koyun'),
      test(G, 'Keçi değişmez', hayvanSinifEtiketi('goat', 'male', 5) === 'Keçi'),
    ];
  },
};
