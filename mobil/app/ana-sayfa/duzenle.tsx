import { View } from 'react-native';
import { AnaSayfaPlanlayici } from '@/bilesenler/ana-sayfa/AnaSayfaPlanlayici';
import { useAnaSayfa } from '@/baglam/AnaSayfaBaglami';

export default function AnaSayfaDuzenleScreen() {
  const { tercih, saveTercih, resetTercih } = useAnaSayfa();

  return (
    <View style={{ flex: 1 }}>
      <AnaSayfaPlanlayici initialTercih={tercih} onSave={saveTercih} onReset={resetTercih} />
    </View>
  );
}
