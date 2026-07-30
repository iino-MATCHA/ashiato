import React from 'react';
import { Platform, View, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * 写真ピッカー。**写真フォルダからだけ選ばせる。**
 *
 * その場で撮る道は用意しない。ブラウザのカメラで撮った写真には位置情報が
 * 載らない仕様なので、撮っても地図に置けず行き止まりになるため
 * （実機で「撮った写真だけ位置情報がありませんと出る」を確認済み）。
 * ファイル一般の選択も外す ―― 書類やスクリーンショットを渡されても記録に
 * ならない。
 *
 * accept に `image/*` のようなワイルドカードを書くと、iOS はファイル選択の
 * シートに「写真を撮る」を並べる。そこで**具体的な形式だけを列挙する**。
 * 拡張子も併記するのは、MIMEを付けずに渡してくる端末があるため。
 *
 * Web:
 *   iOS Safari / Android Chrome では、React Native Web の Pressable の onPress から
 *   `input.click()` を呼ぶとユーザージェスチャの文脈が失われ、ファイル選択が開かない
 *   ことがある（DOM未挿入のinputも同様に無視される）。
 *   そのため「本物の <input type="file"> を透明にして当たり判定の上に重ねる」方式にする。
 *
 * ネイティブ:
 *   expo-image-picker のライブラリを開く。カメラは開かない。
 */
/**
 * iOS に渡す accept。
 * ワイルドカードだと「写真を撮る」がシートに並ぶので、形式を列挙する。
 */
const PHOTO_TYPES_IOS = [
  'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/heif-sequence',
  'image/webp', 'image/avif',
  '.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.avif',
].join(',');

/**
 * Android に渡す accept。
 *
 * **列挙してはいけない。** Android の選択画面は accept をそのまま
 * MIME の絞り込みに使うので、端末が付けた MIME が列に無い写真は
 * 灰色になって選べない。Android の写真の MIME は端末とアプリの組み合わせで
 * まちまち（image/heif-sequence, image/x-adobe-dng, 空文字 など）で、
 * 列挙で追いつけるものではない。実際に「Androidだと写真が選べない」が出た。
 * iOS のような「写真を撮る」を避ける事情も Android には無いので、
 * ここは image/* にする。
 */
const PHOTO_TYPES_ANDROID = 'image/*';

/** iOS かどうか（iPadOS は Mac を名乗るので touch の有無も見る）。 */
function isIOSBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && (navigator as any).maxTouchPoints > 1;
}

/**
 * 明らかに写真ではないものだけ落とす。
 *
 * 以前は「image/ で始まる」か「既知の拡張子」でないと捨てていたが、
 * Android は MIME を空で渡してくることがあり、名前も拡張子を持たない
 * ことがある（コンテンツURI由来）。その結果、選んだのに一枚も残らず、
 * 何も起きないように見えていた。
 * 判断がつかないものは通して、後段（EXIF・圧縮）に任せる。
 */
function looksLikePhoto(f: File): boolean {
  const type = (f.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  if (type && !type.startsWith('image/')) return false;   // 動画・PDF・テキストなど
  // MIME が空。名前で分かるなら使い、分からなければ通す
  const name = (f.name || '').toLowerCase();
  if (/\.(jpe?g|png|heic|heif|webp|avif|dng|tiff?)$/.test(name)) return true;
  if (/\.[a-z0-9]{1,5}$/.test(name)) return false;        // 別の拡張子が付いている
  return true;
}
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
      // launchCameraAsync は使わない（撮った写真には位置情報が載らない）
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
    accept: isIOSBrowser() ? PHOTO_TYPES_IOS : PHOTO_TYPES_ANDROID,
    multiple,
    onChange: (e: any) => {
      const all: File[] = Array.from<File>(e.target.files ?? []);
      const files = all.filter(looksLikePhoto);
      // 選ばれたのに一枚も残らなかった場合でも、黙って何も起きないのは避ける。
      // 判断がつかないものは通す作りなので、ここに来るのは動画などを選んだとき
      if (files.length) onPick(files);
      else if (all.length) onPick(all);
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
