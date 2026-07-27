import React from 'react';
import { Platform, View, Pressable } from 'react-native';

/**
 * 写真ピッカー。
 *
 * iOS Safari / Android Chrome では、React Native Web の Pressable の onPress から
 * `input.click()` を呼ぶとユーザージェスチャの文脈が失われ、ファイル選択が開かない
 * ことがある（DOM未挿入のinputも同様に無視される）。
 * そのため「本物の <input type="file"> を透明にして当たり判定の上に重ねる」方式にする。
 * ユーザーが直接 input をタップするので、どのモバイルブラウザでも確実に開く。
 */
export function PhotoPicker({
  onPick,
  multiple = false,
  children,
  style,
}: {
  onPick: (files: File[]) => void;
  multiple?: boolean;
  children: React.ReactNode;
  style?: any;
}) {
  if (Platform.OS !== 'web') {
    // ネイティブは expo-image-picker を将来接続（現状Web運用）
    return <Pressable style={style}>{children}</Pressable>;
  }

  const input = React.createElement('input', {
    type: 'file',
    accept: 'image/*',
    multiple,
    onChange: (e: any) => {
      const files: File[] = Array.from(e.target.files ?? []);
      if (files.length) onPick(files);
      e.target.value = ''; // 同じ写真を続けて選べるようにリセット
    },
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
      // iOS がフォントサイズ<16pxで拡大しないように
      fontSize: 16,
    },
  });

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {children}
      {input}
    </View>
  );
}
