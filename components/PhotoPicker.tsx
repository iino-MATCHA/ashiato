import React from 'react';
import { Platform, View, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * 写真ピッカー。
 *
 * Web:
 *   iOS Safari / Android Chrome では、React Native Web の Pressable の onPress から
 *   `input.click()` を呼ぶとユーザージェスチャの文脈が失われ、ファイル選択が開かない
 *   ことがある（DOM未挿入のinputも同様に無視される）。
 *   そのため「本物の <input type="file"> を透明にして当たり判定の上に重ねる」方式にする。
 *
 * ネイティブ:
 *   expo-image-picker のライブラリを開く。入力を一切せずに写真を足せる。
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
    const openLibrary = async () => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple,
        quality: 0.85,
        exif: true, // 撮影日を後段で使えるように
      });
      if (res.canceled) return;
      // 上位は File（Blob互換）を期待しているので、URIから Blob に起こして渡す
      const files = await Promise.all(
        res.assets.map(async (a, i) => {
          const blob = await (await fetch(a.uri)).blob();
          const f: any = blob;
          f.name = a.fileName ?? `photo-${i}.jpg`;
          f.lastModified = a.exif?.DateTimeOriginal
            ? Date.parse(String(a.exif.DateTimeOriginal).replace(/^(\d{4}):(\d{2}):/, '$1-$2-'))
            : Date.now();
          return f as File;
        })
      );
      if (files.length) onPick(files);
    };
    return <Pressable onPress={openLibrary} style={style}>{children}</Pressable>;
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
