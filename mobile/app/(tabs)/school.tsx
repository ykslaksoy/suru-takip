import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { EDUCATION_LESSONS } from '@/lib/education';
import type { EducationLesson } from '@/lib/types';

export default function SchoolScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [lesson, setLesson] = useState<EducationLesson | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Sürü Okulu</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>2 dakikalık pratik eğitimler</Text>
      <FlatList
        data={EDUCATION_LESSONS}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setLesson(item)}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.category, { color: colors.tint }]}>{item.category} · {item.duration}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={{ color: colors.textSecondary }}>{item.summary}</Text>
          </Pressable>
        )}
      />

      <Modal visible={!!lesson} animationType="slide">
        {lesson && (
          <ScrollView style={[styles.modal, { backgroundColor: colors.background }]}>
            <Pressable onPress={() => setLesson(null)} style={{ padding: 16 }}>
              <Text style={{ color: colors.tint, fontWeight: '700' }}>← Geri</Text>
            </Pressable>
            <View style={{ padding: 16 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{lesson.title}</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>{lesson.category} · {lesson.duration}</Text>
              <Text style={[styles.body, { color: colors.text }]}>{lesson.content}</Text>
              <Text style={[styles.tipsTitle, { color: colors.tint }]}>Pratik ipuçları</Text>
              {lesson.tips.map((tip, i) => (
                <Text key={i} style={[styles.tip, { color: colors.text }]}>• {tip}</Text>
              ))}
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8 },
  sub: { paddingHorizontal: 16, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 },
  category: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', marginVertical: 6 },
  modal: { flex: 1 },
  modalTitle: { fontSize: 24, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24 },
  tipsTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  tip: { fontSize: 15, lineHeight: 22, marginBottom: 6 },
});
