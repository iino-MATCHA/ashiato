/**
 * ネイティブ側の本プレビュー。3Dのめくりは Web の CSS 実装に任せ、
 * ここでは見開きを横スワイプで送るだけにする（表示物は同じPDFページ）。
 */
import { useEffect, useRef, useState } from 'react';
import { View, Image, ScrollView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { AppText, Row } from '@/components/ui';
import { useTheme } from '@/lib/useTheme';

export interface BookPreviewProps {
  total: number;
  getPage: (i: number) => Promise<string | null>;
  width: number;
  ratio?: number;
}

export function BookPreview({ total, getPage, width, ratio = 1654 / 1165 }: BookPreviewProps) {
  const { palette } = useTheme();
  const pageW = width / 2;
  const height = pageW * ratio;

  const [at, setAt] = useState(0);
  const cache = useRef(new Map<number, string | null>());
  const [, force] = useState(0);

  useEffect(() => {
    let alive = true;
    const want = [at, at + 1, at + 2, at + 3].filter((i) => i < total);
    (async () => {
      for (const i of want) {
        if (cache.current.has(i)) continue;
        cache.current.set(i, null);
        const url = await getPage(i);
        if (!alive) return;
        cache.current.set(i, url);
        force((n) => n + 1);
      }
    })();
    return () => { alive = false; };
  }, [at, total, getPage]);

  const spreads = Math.max(1, Math.ceil(total / 2));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width) * 2;
    if (i !== at) setAt(Math.max(0, Math.min(total - 2, i)));
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={width}
        decelerationRate="fast"
      >
        {Array.from({ length: spreads }).map((_, s) => (
          <View key={s} style={{ width, height, flexDirection: 'row' }}>
            {[s * 2, s * 2 + 1].map((i) => {
              const src = cache.current.get(i);
              return (
                <View key={i} style={[styles.leaf, { backgroundColor: '#FBF8F0' }]}>
                  {src ? <Image source={{ uri: src }} style={StyleSheet.absoluteFill as any} resizeMode="cover" /> : null}
                </View>
              );
            })}
            <View style={styles.gutter} pointerEvents="none" />
          </View>
        ))}
      </ScrollView>
      <Row style={{ justifyContent: 'center', gap: 5, marginTop: 12 }}>
        {Array.from({ length: spreads }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === Math.floor(at / 2) ? 17 : 6, height: 6, borderRadius: 3,
              backgroundColor: i === Math.floor(at / 2) ? palette.matcha : palette.rule,
            }}
          />
        ))}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  leaf: { flex: 1, overflow: 'hidden' },
  gutter: {
    position: 'absolute', left: '50%', top: 0, bottom: 0, width: 22, marginLeft: -11,
    backgroundColor: 'rgba(60,50,38,0.12)',
  },
});
