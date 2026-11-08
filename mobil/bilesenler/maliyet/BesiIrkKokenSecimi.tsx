import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  CINSIYET_ETIKET,
  HEDEF_IRK_ETIKET,
  HEDEF_IRK_SIRASI,
  YAS_DURUM_ETIKET,
  type BesiAlisKoken,
  type BesiHedefIrkKodu,
  type BesiIrkBilgi,
  type BesiKuzuCinsiyet,
  type BesiKuzuYasDurum,
  type BesiPlanIrkTaslak,
  irkAdgPolitikasi,
} from '@/kaynak/maliyet/besi-plan-irk';
import { IRK_PLAN_REFERANS } from '@/kaynak/maliyet/besi-plan-irk-referans';

type Colors = { text: string; textSecondary: string; border: string; tint: string; warning: string };

const KOKEN: { k: BesiAlisKoken; e: string }[] = [
  { k: 'uretim_suru', e: 'Kendi sürü / üretim' },
  { k: 'pazar_toplama', e: 'Pazardan toplama' },
];

const IRK_BILGI: { k: BesiIrkBilgi; e: string }[] = [
  { k: 'irk_belli', e: 'Irk belli' },
  { k: 'irk_kismen', e: 'Kısmen biliniyor' },
  { k: 'irk_bilinmiyor', e: 'Irk bilinmiyor' },
];

const CINS: BesiKuzuCinsiyet[] = ['bilinmiyor', 'erkek', 'disi', 'karisik'];
const YAS: BesiKuzuYasDurum[] = ['bilinmiyor', 'sutten_kesim', 'genc'];

export function BesiIrkKokenSecimi({
  taslak,
  onChange,
  colors,
  planKilitli,
}: {
  taslak: BesiPlanIrkTaslak;
  onChange: (t: BesiPlanIrkTaslak) => void;
  colors: Colors;
  planKilitli: boolean;
}) {
  const politika = irkAdgPolitikasi(taslak);
  const karisikOneri = taslak.koken === 'pazar_toplama' && taslak.irkBilgi !== 'irk_belli';

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Text style={{ color: colors.tint, fontWeight: '800', marginBottom: 6 }}>Hedef kuzu — köken ve ırk (t358u)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 8 }}>
        Alış kökeni ırktan ayrı. Pazar + karışık grupta adlandırılmış ırk max ADG uygulanmaz.
      </Text>

      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Alış kökeni</Text>
      <View style={styles.row}>
        {KOKEN.map((x) => (
          <Chip
            key={x.k}
            aktif={taslak.koken === x.k}
            label={x.e}
            disabled={planKilitli}
            onPress={() => {
              const next = { ...taslak, koken: x.k };
              if (x.k === 'pazar_toplama' && next.irkBilgi === 'irk_belli' && next.hedefIrk !== 'generic_kuzu') {
                /* pazar + belli ırk OK */
              } else if (x.k === 'pazar_toplama' && next.irkBilgi === 'irk_bilinmiyor') {
                next.hedefIrk = 'generic_kuzu';
              }
              onChange(next);
            }}
            colors={colors}
          />
        ))}
      </View>

      {taslak.koken === 'pazar_toplama' ? (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>Pazar grubu</Text>
          <View style={styles.row}>
            {IRK_BILGI.map((x) => (
              <Chip
                key={x.k}
                aktif={taslak.irkBilgi === x.k}
                label={x.e}
                disabled={planKilitli}
                onPress={() => {
                  const next = { ...taslak, irkBilgi: x.k };
                  if (x.k === 'irk_bilinmiyor') next.hedefIrk = 'generic_kuzu';
                  onChange(next);
                }}
                colors={colors}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>Üretimde ırk genelde bellidir — yine de garanti değil.</Text>
      )}

      {!karisikOneri || taslak.irkBilgi === 'irk_belli' ? (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>Plan hedef ırk</Text>
          <View style={styles.row}>
            {HEDEF_IRK_SIRASI.filter((h) => (karisikOneri ? h === 'generic_kuzu' || h === 'diger' || h === 'pirit_belirsiz' : true)).map((h) => (
              <Chip
                key={h}
                aktif={taslak.hedefIrk === h}
                label={HEDEF_IRK_ETIKET[h]}
                disabled={planKilitli || (karisikOneri && h !== 'generic_kuzu' && h !== 'diger' && h !== 'pirit_belirsiz')}
                onPress={() => onChange({ ...taslak, hedefIrk: h })}
                colors={colors}
              />
            ))}
          </View>
          {IRK_PLAN_REFERANS[taslak.hedefIrk]?.kaynak ? (
            <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>
              Kaynak: {IRK_PLAN_REFERANS[taslak.hedefIrk].kaynak}
              {IRK_PLAN_REFERANS[taslak.hedefIrk].aramaAlias?.length
                ? ` · arama: ${IRK_PLAN_REFERANS[taslak.hedefIrk].aramaAlias!.join(', ')}`
                : ''}
            </Text>
          ) : null}
          {IRK_PLAN_REFERANS[taslak.hedefIrk]?.beklemede ? (
            <Text style={{ color: colors.warning, fontSize: 11, marginTop: 4 }}>
              {IRK_PLAN_REFERANS[taslak.hedefIrk].beklemeNotu}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={{ color: colors.warning, fontSize: 12, marginTop: 6 }}>
          Pazardan toplama · karışık/ırk bilinmiyor → yalnızca «{HEDEF_IRK_ETIKET.generic_kuzu}»
        </Text>
      )}

      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>Cinsiyet (tahmin bağlamı)</Text>
      <View style={styles.row}>
        {CINS.map((c) => (
          <Chip
            key={c}
            aktif={(taslak.cinsiyet ?? 'bilinmiyor') === c}
            label={CINSIYET_ETIKET[c]}
            disabled={planKilitli}
            onPress={() => onChange({ ...taslak, cinsiyet: c === 'bilinmiyor' ? null : c })}
            colors={colors}
          />
        ))}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>Yaş / sütten kesim</Text>
      <View style={styles.row}>
        {YAS.map((y) => (
          <Chip
            key={y}
            aktif={(taslak.yasDurum ?? 'bilinmiyor') === y}
            label={YAS_DURUM_ETIKET[y]}
            disabled={planKilitli}
            onPress={() => onChange({ ...taslak, yasDurum: y === 'bilinmiyor' ? null : y })}
            colors={colors}
          />
        ))}
      </View>
      {(taslak.hedefIrk === 'diger' || taslak.hedefIrk === 'pirit_belirsiz') && (
        <NotInput
          label={taslak.hedefIrk === 'pirit_belirsiz' ? 'Pırıt / Pırlak / varyete notu' : 'Irk notu'}
          value={taslak.hedefIrkNot ?? ''}
          onEnd={(v) => onChange({ ...taslak, hedefIrkNot: v })}
          colors={colors}
          disabled={planKilitli}
        />
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <MiniInput
          label="Plan baş (kapsam)"
          value={taslak.planBasSayisi != null ? String(taslak.planBasSayisi) : ''}
          onEnd={(v) => onChange({ ...taslak, planBasSayisi: v })}
          colors={colors}
          disabled={planKilitli}
        />
        <MiniInput
          label="Irkı bilinen baş"
          value={taslak.bilinenIrkBas != null ? String(taslak.bilinenIrkBas) : ''}
          onEnd={(v) => onChange({ ...taslak, bilinenIrkBas: v })}
          colors={colors}
          disabled={planKilitli}
        />
      </View>
      <MiniInput
        label="Tartım ADG (g/gün) — gerçek eğilim"
        value={taslak.olcumGcaaGramGun != null ? String(taslak.olcumGcaaGramGun) : ''}
        onEnd={(v) => onChange({ ...taslak, olcumGcaaGramGun: v })}
        colors={colors}
        disabled={planKilitli}
      />

      <Text style={{ color: colors.tint, fontSize: 12, fontWeight: '700', marginTop: 8 }}>{politika.etiket}</Text>
      {politika.heterojenlik ? (
        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{politika.heterojenlik}</Text>
      ) : null}
      {politika.uyari.slice(0, 3).map((u) => (
        <Text key={u} style={{ color: colors.textSecondary, fontSize: 10 }}>
          · {u}
        </Text>
      ))}
    </View>
  );
}

function Chip({
  aktif,
  label,
  onPress,
  disabled,
  colors,
}: {
  aktif: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: Colors;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 4,
        borderColor: aktif ? colors.tint : colors.border,
        backgroundColor: aktif ? `${colors.tint}18` : 'transparent',
      }}>
      <Text style={{ color: colors.text, fontSize: 10 }}>{label}</Text>
    </Pressable>
  );
}

function MiniInput({
  label,
  value,
  onEnd,
  colors,
  disabled,
}: {
  label: string;
  value: string;
  onEnd: (n: number | null) => void;
  colors: Colors;
  disabled?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{label}</Text>
      <TextInput
        editable={!disabled}
        defaultValue={value}
        keyboardType="decimal-pad"
        onEndEditing={(e) => {
          const t = e.nativeEvent.text.trim();
          const n = t === '' ? null : parseFloat(t.replace(',', '.'));
          onEnd(n != null && Number.isFinite(n) ? n : null);
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

function NotInput({
  label,
  value,
  onEnd,
  colors,
  disabled,
}: {
  label: string;
  value: string;
  onEnd: (s: string | null) => void;
  colors: Colors;
  disabled?: boolean;
}) {
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{label}</Text>
      <TextInput
        editable={!disabled}
        defaultValue={value}
        onEndEditing={(e) => {
          const t = e.nativeEvent.text.trim();
          onEnd(t === '' ? null : t);
        }}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 6, fontSize: 14, marginTop: 2 },
});
