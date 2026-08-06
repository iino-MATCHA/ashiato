/**
 * ZoomPan のネイティブ側。
 *
 * つまんで動かす操作はWebだけ（ネイティブビルドは未検証・Web運用が前提）。
 * こちらは寸法だけ合わせてそのまま置く ―― HomeScreen のように
 * .web/.native の無い共有コンポーネントから import しても壊れないための受け皿。
 */
import React from 'react';
import { View } from 'react-native';

export function ZoomPan({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return <View style={{ width, height, overflow: 'hidden' }}>{children}</View>;
}
