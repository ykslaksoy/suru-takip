import { createElement, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/sabitler/Renkler';
import { useColorScheme } from '@/bilesenler/ortak/useRenkSemasi';
import { meraHaritaPadoklarlaSenkron, type MeraHaritaBelge } from '@/kaynak/mera/harita';

type Props = {
  seciliPadok?: string | null;
  onPadokSec?: (ad: string) => void;
};

type LeafletMap = {
  setView: (c: [number, number], z: number) => void;
  remove: () => void;
};

declare global {
  interface Window {
    L?: {
      map: (el: HTMLElement, o: Record<string, unknown>) => LeafletMap;
      tileLayer: (url: string, o: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
      circleMarker: (
        c: [number, number],
        o?: Record<string, unknown>,
      ) => { addTo: (m: LeafletMap) => void; bindPopup: (h: string) => void; on: (e: string, fn: () => void) => void };
    };
  }
}

function leafletYukle(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.setAttribute('data-leaflet', '1');
      document.head.appendChild(css);
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Leaflet yüklenemedi'));
    document.body.appendChild(s);
  });
}

export function MeraHarita({ seciliPadok, onPadokSec }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [belge, setBelge] = useState<MeraHaritaBelge | null>(null);

  useEffect(() => {
    let iptal = false;
    void (async () => {
      const b = await meraHaritaPadoklarlaSenkron();
      if (iptal) return;
      setBelge(b);
      await leafletYukle();
      if (iptal || !ref.current || !window.L || mapRef.current) return;
      const L = window.L;
      const map = L.map(ref.current, { scrollWheelZoom: true });
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);
      map.setView([b.meta.merkez[1], b.meta.merkez[0]], b.meta.zoom);
      for (const f of b.padoklar.features) {
        const [lon, lat] = f.geometry.coordinates;
        const ad = f.properties.padokAd;
        const dolu =
          f.properties.kapasite && f.properties.hayvan
            ? f.properties.hayvan / f.properties.kapasite
            : 0;
        const renk = dolu >= 1 ? '#c0392b' : '#1a7f4b';
        const marker = L.circleMarker([lat, lon], { radius: 10, color: renk, fillOpacity: 0.75 });
        marker.bindPopup(
          `<strong>${ad}</strong><br/>${f.properties.hayvan ?? 0}/${f.properties.kapasite ?? '—'} baş`,
        );
        marker.on('click', () => onPadokSec?.(ad));
        marker.addTo(map);
      }
    })();
    return () => {
      iptal = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onPadokSec]);

  return (
    <View style={[styles.kutu, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.ust}>
        <Text style={[styles.baslik, { color: colors.text }]}>Mera haritası</Text>
        <Pressable onPress={() => router.push('/(tabs)/suru' as never)}>
          <Text style={{ color: colors.tint, fontWeight: '800' }}>Liste</Text>
        </Pressable>
      </View>
      {createElement('div', {
        ref,
        style: { height: 320, width: '100%', borderRadius: 10, overflow: 'hidden' },
      })}
      <View style={styles.alt}>
        {(belge?.padoklar.features ?? []).map((f) => (
          <Pressable
            key={f.properties.padokAd}
            onPress={() => onPadokSec?.(f.properties.padokAd)}
            style={[
              styles.chip,
              {
                borderColor: colors.border,
                backgroundColor: seciliPadok === f.properties.padokAd ? colors.tint + '18' : colors.background,
              },
            ]}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{f.properties.padokAd}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kutu: { borderWidth: 1, borderRadius: 12, padding: 12 },
  ust: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  baslik: { fontSize: 16, fontWeight: '800' },
  alt: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});
