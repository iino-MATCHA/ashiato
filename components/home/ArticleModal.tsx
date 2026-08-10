/**
 * MATCHAの記事のポップアップ（県カードから開く）。
 *
 * 記事の文章が主役。写真は小さめにして、段落の左右に交互へ差し込む
 * ―― 新聞の組みに寄せる（ユーザー指定）。写真をタップすると
 * その場で少しだけ大きく出す（全画面にはしない。主役は文章のまま）。
 * いちばん下に、続きをMATCHAで読む導線を置く。
 *
 * 本文は matcha_articles.body（抜粋）。全文は持っていないので、
 * 「味見 → 続きはMATCHAで」という流れが崩れない。
 */
import { useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Row, Rule, Gap } from '@/components/ui';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n } from '@/lib/i18n';
import type { MatchaArticle } from '@/lib/api';

export function ArticleModal({ article, onClose }: { article: MatchaArticle | null; onClose: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  /** タップで少しだけ拡大している写真 */
  const [zoom, setZoom] = useState<string | null>(null);

  if (!article) return null;

  const paragraphs = article.body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const cardW = Math.min(width - space.lg * 2, 640);
  /**
   * 段落の横に写真を置けるのは版面に余裕があるときだけ。
   * スマホ(390px)では版面が342px、写真132pxと余白を引くと文章が146pxしか
   * 残らず、1行に9文字ほどしか入らなかった（実測）。狭いときは写真を
   * 段落の上に置き、左右を交互にして新聞の呼吸だけ残す
   */
  const sideBySide = cardW - space.lg * 2 >= 420;
  /**
   * 「少しだけ」の拡大。小さい写真(132px)の3倍ほど。
   * カードの9割だけを上限にしていたら、PCの広い版面(640px)で
   * 記事をほぼ覆ってしまった ―― 絶対値でも抑える。
   */
  const zoomW = Math.round(Math.min(cardW * 0.9, 420));

  const openMatcha = () => Linking.openURL(article.url);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, styles.veil]} onPress={onClose} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.card, { width: cardW, maxHeight: height * 0.82, backgroundColor: palette.washiPaper }]}>
          {/* 見出し */}
          <Row style={{ alignItems: 'flex-start', padding: space.lg, paddingBottom: space.sm }}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" tone="matcha" style={{ letterSpacing: 3, fontSize: 10 }}>MATCHA</AppText>
              <Gap h={6} />
              <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 20, lineHeight: 28, color: palette.ink }}>
                {article.title}
              </AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={{ marginTop: 2 }}>
              <Ionicons name="close" size={20} color={palette.inkFaint} />
            </Pressable>
          </Row>
          <View style={{ paddingHorizontal: space.lg }}><Rule /></View>

          {/* 本文。段落の左右に写真を交互に差し込む（新聞の組み） */}
          <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.md }} showsVerticalScrollIndicator={false}>
            {paragraphs.map((text, i) => {
              const img = article.images[i];
              if (!img) {
                return (
                  <AppText key={i} variant="body" tone="inkSoft" style={styles.para}>{text}</AppText>
                );
              }
              const imgLeft = i % 2 === 0;
              const photo = (
                <Pressable
                  key="img"
                  onPress={() => setZoom(img)}
                  style={({ pressed }) => [
                    !sideBySide && { alignSelf: imgLeft ? 'flex-start' : 'flex-end', marginBottom: space.sm },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Image
                    source={{ uri: img }}
                    style={[
                      styles.thumb,
                      // 横に並べないときは、文章を細らせないぶん写真を大きく取る
                      !sideBySide && { width: Math.round((cardW - space.lg * 2) * 0.62) },
                      { backgroundColor: palette.fill },
                    ]}
                    resizeMode="cover"
                  />
                </Pressable>
              );
              const body = (
                <AppText
                  key="txt"
                  variant="body"
                  tone="inkSoft"
                  style={[styles.para, sideBySide && { flex: 1, marginBottom: 0 }]}
                >
                  {text}
                </AppText>
              );
              if (!sideBySide) {
                return (
                  <View key={i}>
                    {photo}
                    {body}
                  </View>
                );
              }
              return (
                <Row key={i} style={styles.paraRow}>
                  {imgLeft ? [photo, body] : [body, photo]}
                </Row>
              );
            })}

            {/* いちばん下: MATCHAへの導線 */}
            <Gap h={space.md} />
            <Pressable
              onPress={openMatcha}
              style={({ pressed }) => [styles.cta, { backgroundColor: palette.matcha }, pressed && { opacity: 0.85 }]}
            >
              <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('article.readOn')}</AppText>
            </Pressable>
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkFaint" center>matcha-jp.com</AppText>
          </ScrollView>

          {/* 写真の拡大。タップで戻る。全画面にせず「少しだけ」大きく */}
          {!!zoom && (
            <Pressable style={[StyleSheet.absoluteFill, styles.zoomVeil]} onPress={() => setZoom(null)}>
              <Image
                source={{ uri: zoom }}
                style={{ width: zoomW, aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: palette.fill }}
                resizeMode="cover"
              />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  veil: { backgroundColor: 'rgba(12,10,8,0.5)' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: { borderRadius: 18, overflow: 'hidden' },
  para: { lineHeight: 24, marginBottom: space.md },
  paraRow: { alignItems: 'flex-start', gap: space.md, marginBottom: space.md },
  // 写真は小さめ（幅の38%）。文章が主役
  thumb: { width: 132, aspectRatio: 4 / 3, borderRadius: 8, borderWidth: hairline, borderColor: 'rgba(0,0,0,0.08)' },
  cta: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  zoomVeil: { backgroundColor: 'rgba(12,10,8,0.55)', alignItems: 'center', justifyContent: 'center' },
});
