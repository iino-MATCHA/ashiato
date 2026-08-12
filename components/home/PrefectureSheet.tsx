/**
 * /map の日本地図で県をタップしたときのカード。
 *
 * **記録が先、情報があと。** このアプリの主は旅の記録なので、
 * その県での「あなたの記録」を最上段に、次に「みんなの旅」、
 * その下に県の紹介と MATCHA への導線を置く（ユーザー指定の並び）。
 *
 * 出し方はホームと同じ BottomSheet。つまみや面を上へ払うと全面まで伸び、
 * たたんだ状態からさらに下へ払うと閉じる（✕は置かない）。
 * Modal にしない理由が2つ:
 *   - Modal の層は旅を開くときの波紋(TransitionProvider)より上に乗り、
 *     カードを押したときの演出が隠れてしまう
 *   - BottomSheet の掴む・払う操作をそのまま借りられる
 *
 * みんなの旅と「行くなら」は横並びのカード。FlatList にしてあるので、
 * 画面の外のカードは描かれない（求められた遅延読み込みは仮想化で満たす）。
 */
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Row, Rule, Gap, Eyebrow } from '@/components/ui';
import { BottomSheet, useSheetScroll, SHEET_GRIP_HEIGHT } from '@/components/BottomSheet';
import { SignInPrompt } from '@/components/SignInPrompt';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useI18n, localizeMatchaUrl } from '@/lib/i18n';
import { useTrips, usePublicTrips } from '@/lib/useData';
import { useSession } from '@/lib/useSession';
import { useRippleNav } from '@/lib/transition';
import { router } from 'expo-router';
import {
  PREFECTURE_EN_BY_ID, PREFECTURE_SLUG_BY_ID, prefectureName, prefectureMatchaUrl, slugForName,
} from '@/lib/prefectures';
import { usePrefectureText } from '@/lib/usePrefectureText';
import { photoFor } from '@/lib/quiz/photos';
import { searchTourismAreas, fetchMatchaArticles, type TourismArea, type MatchaArticle } from '@/lib/api';
import { ArticleModal } from '@/components/home/ArticleModal';
import type { Trip } from '@/lib/mock';
import type { Locale } from '@/lib/i18n';

/** step.placeName（"Kanazawa, Ishikawa" など）から市区町村ぶんだけを取る */
const townOf = (placeName: string) => (placeName ?? '').split(',')[0].trim();

/**
 * 中身の版面の上限。
 * シートは画面いっぱいに広がるが、パソコンの幅で中身まで広げると
 * 県の写真が壁一面になってしまう（実際に「大きすぎる」と指摘された）。
 * 読み物の幅に留めて、左右は紙の余白にする。
 */
const CONTENT_MAX = 620;

export function PrefectureSheet({ code, onClose }: { code: number | null; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!code) return null;
  const usable = height - insets.top;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 30 }]} pointerEvents="box-none">
      {/* 背景。地図側をタップしても閉じられる */}
      <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(12,10,8,0.35)' }]} onPress={onClose} />
      <BottomSheet
        collapsedHeight={Math.round(usable * 0.62)}
        expandedHeight={Math.round(usable)}
        onDismiss={onClose}
      >
        <SheetBody code={code} onClose={onClose} />
      </BottomSheet>
    </View>
  );
}

/** 中身。BottomSheet の下に置く（たたんだ状態でもスクロールできる） */
function SheetBody({ code, onClose }: { code: number; onClose: () => void }) {
  const { palette } = useTheme();
  const { width: winW } = useWindowDimensions();
  /** PC幅か。写真の大きさをここで切り替える */
  const wide = winW >= 700;
  const { t, locale } = useI18n();
  const { guest } = useSession();
  const { navigate } = useRippleNav();
  const { trips } = useTrips();
  const { trips: publicTrips } = usePublicTrips();
  const [areas, setAreas] = useState<TourismArea[]>([]);
  const [articles, setArticles] = useState<MatchaArticle[]>([]);
  /** アプリ内で開いている記事（新聞風のポップアップ） */
  const [reading, setReading] = useState<MatchaArticle | null>(null);
  const [askSignIn, setAskSignIn] = useState(false);
  // 開閉の状態は BottomSheet が持つ。ここでは使わない（常にスクロール可）
  const sheetScroll = useSheetScroll();

  const slug = PREFECTURE_SLUG_BY_ID[code];
  const inPref = (trip: Trip) => trip.steps.some((s) => slugForName(s.prefectureName ?? '') === slug);
  const prefSteps = (trip: Trip) => trip.steps.filter((s) => slugForName(s.prefectureName ?? '') === slug);

  const mine = useMemo(() => trips.filter(inPref), [trips, slug]);
  const stats = useMemo(() => {
    let stops = 0;
    let photos = 0;
    mine.forEach((trip) =>
      prefSteps(trip).forEach((s) => {
        stops += 1;
        photos += s.images.filter(Boolean).length;
      })
    );
    return { stops, photos };
  }, [mine, slug]);

  const others = useMemo(
    () => publicTrips.filter(inPref).filter((p) => !mine.some((m) => m.id === p.id)),
    [publicTrips, mine, slug]
  );

  // 県の観光エリア（MATCHAリンク付き）。未接続時は空のまま
  useEffect(() => {
    let alive = true;
    setAreas([]);
    searchTourismAreas(PREFECTURE_EN_BY_ID[code] ?? '')
      .then((a) => alive && setAreas(a.slice(0, 8)))
      .catch(() => {});
    return () => { alive = false; };
  }, [code]);

  // 県のMATCHA記事（アプリ内で読める抜粋）。表示言語で引き、無ければ日→英
  useEffect(() => {
    let alive = true;
    setArticles([]);
    fetchMatchaArticles(code, locale)
      .then((a) => alive && setArticles(a))
      .catch(() => {});
    return () => { alive = false; };
  }, [code, locale]);

  const name = prefectureName(code, locale);
  const prefText = usePrefectureText(code, locale as Locale);
  const photo = photoFor(code);
  const matchaUrl = localizeMatchaUrl(prefectureMatchaUrl(code));

  /**
   * 旅を開く。押した点から波紋が広がって遷移する
   * （/map の「あなたの旅」一覧と同じ動き）。
   * その県の最初の立ち寄り先を ?stop= で渡し、開いた瞬間に
   * その県のスポットが前に出ている状態にする。
   */
  const openTrip = (trip: Trip, e?: any) => {
    const first = prefSteps(trip)[0];
    navigate(`/trip/${trip.id}${first ? `?stop=${first.id}` : ''}`, e);
  };
  const newTrip = () => {
    if (guest) { setAskSignIn(true); return; }
    onClose();
    router.push('/trip/new');
  };

  /** みんなの旅のカード。表紙・題・誰の旅か・その県で寄った市区町村 */
  const renderOther = ({ item }: { item: Trip }) => {
    const ps = prefSteps(item);
    const cover = ps.find((s) => s.images[0])?.images[0] ?? item.steps.find((s) => s.images[0])?.images[0];
    const towns = Array.from(new Set(ps.map((s) => townOf(s.placeName)))).filter(Boolean);
    const townLabel = towns.slice(0, 3).join(' · ') + (towns.length > 3 ? ` +${towns.length - 3}` : '');
    return (
      <Pressable onPress={(e) => openTrip(item, e)} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <View style={[styles.tripCard, { borderColor: palette.rule, backgroundColor: palette.washiPaper }]}>
          <View style={[styles.tripCover, { backgroundColor: palette.fill }]}>
            {!!cover && <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
          </View>
          <View style={{ padding: space.sm }}>
            <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{item.title}</AppText>
            <AppText variant="small" tone="inkFaint" numberOfLines={1}>
              {item.ownerUsername ? `@${item.ownerUsername}` : item.subtitle}
            </AppText>
            <Gap h={4} />
            {/* その県のどこに行っていたか（市区町村） */}
            <AppText variant="small" tone="matcha" numberOfLines={2}>{townLabel}</AppText>
          </View>
        </View>
      </Pressable>
    );
  };

  /**
   * MATCHAの段のカード。
   * 抜粋を持つ記事（アプリ内で読める）を先に、観光エリアのリンクを後に。
   * 記事カードはタップでその場のポップアップ、リンクカードはMATCHAへ。
   */
  type MatchaItem =
    | { kind: 'article'; key: string; article: MatchaArticle }
    | { kind: 'link'; key: string; title: string; sub: string; url: string | null };

  const matchaCards = useMemo<MatchaItem[]>(() => {
    /**
     * **この段は行き先の一覧。** 見出しが「◯◯県で行くなら」なので、
     * 記事の題をそのまま出すと「福島市の気温は？年間平均と…」のような
     * 行き先でないものが並ぶ（指摘を受けた）。地名が付いている記事だけを
     * 出し、地名の分かっていない記事はこの段に置かない
     * （ポップアップ自体はほかの入口から開ける）。
     *
     * 同じ地名が二度並ばないようにもする ―― 会津若松の記事が2本あっても
     * 「会津若松」のカードは1枚でよい。
     */
    const seen = new Set<string>();
    const cards: MatchaItem[] = [];
    articles.forEach((a) => {
      if (!a.place || seen.has(a.place)) return;
      seen.add(a.place);
      cards.push({ kind: 'article', key: a.id, article: a });
    });
    areas.forEach((a) => {
      // 記事で同じ地名を出したなら、観光エリアのカードは重ねない
      if (seen.has(a.name)) return;
      seen.add(a.name);
      cards.push({ kind: 'link', key: a.id, title: a.name, sub: a.municipality, url: localizeMatchaUrl(a.matchaUrl) });
    });
    if (matchaUrl) {
      cards.push({ kind: 'link', key: 'pref', title: t('quiz.aff.matchaTitle', { name }), sub: name, url: matchaUrl });
    }
    return cards;
  }, [articles, areas, matchaUrl, name, t, locale]);

  const renderMatcha = ({ item }: { item: MatchaItem }) => {
    if (item.kind === 'article') {
      const a = item.article;
      return (
        <Pressable onPress={() => setReading(a)} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
          <View style={[styles.matchaCard, { borderColor: palette.rule, backgroundColor: palette.washiPaper, padding: 0 }]}>
            <View style={[styles.articleCover, { backgroundColor: palette.fill }]}>
              {!!a.images[0] && (
                <Image source={{ uri: a.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
            </View>
            <View style={{ padding: space.sm, flex: 1 }}>
              {/* 出すのは行き先の名前。記事の題はポップアップの中で読ませる */}
              <AppText variant="bodyStrong" tone="ink" numberOfLines={2} style={{ flex: 1 }}>{a.place}</AppText>
              <AppText variant="small" tone="matcha">{t('article.read')}</AppText>
            </View>
          </View>
        </Pressable>
      );
    }
    return (
      <Pressable
        onPress={() => item.url && Linking.openURL(item.url)}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.matchaCard, { borderColor: palette.rule, backgroundColor: palette.washiPaper }]}>
          <AppText variant="bodyStrong" tone="ink" numberOfLines={2} style={{ flex: 1 }}>{item.title}</AppText>
          <AppText variant="small" tone="inkFaint" numberOfLines={1}>{item.sub}</AppText>
          <Gap h={6} />
          <AppText variant="small" tone="matcha">MATCHA →</AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <ScrollView
        {...sheetScroll}
        /**
         * たたんだ状態でも中身をスクロールさせる。
         * ホームの常設シートは「開くまで動かさない」でよいが、こちらは
         * 一時的なカードで、下の段（県の紹介・MATCHAの記事）まで必ず読ませたい。
         * PCではつまみをマウスで掴まないと開けず、ホイールも効かないため、
         * 記事に辿り着けなかった（実測）。
         * 指の操作は BottomSheet 側が先に取る（一番上で下へ払えば閉じる）ので、
         * ここを開けても閉じる操作は壊れない。
         */
        scrollEnabled
        contentContainerStyle={{
          // つまみの帯（半透明で浮いている）のぶん、先頭を空ける
          paddingTop: SHEET_GRIP_HEIGHT,
          paddingHorizontal: space.lg,
          paddingBottom: space.xxl * 2,
          // PCの幅では読み物の幅に留める（写真が壁一面になるのを防ぐ）
          width: '100%',
          maxWidth: CONTENT_MAX,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 見出し。閉じる印は置かない ―― 下へ払えば閉じる */}
        <Row style={{ alignItems: 'baseline', gap: space.sm }}>
          <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 26, color: palette.ink }}>{name}</AppText>
          <AppText variant="small" tone="inkFaint" style={{ letterSpacing: 2 }}>
            {(PREFECTURE_EN_BY_ID[code] ?? '').toUpperCase()}
          </AppText>
        </Row>

        {/* ---------------- あなたの記録（最上段） ---------------- */}
        <Gap h={space.lg} />
        <Eyebrow tone="matcha">{t('prefCard.yours')}</Eyebrow>
        <Gap h={space.sm} />
        {mine.length ? (
          <>
            <AppText variant="small" tone="inkFaint">
              {t('prefCard.yoursMeta', { trips: mine.length, stops: stats.stops, photos: stats.photos })}
            </AppText>
            <Gap h={space.xs} />
            <Rule />
            {mine.slice(0, 3).map((trip) => (
              <Pressable key={trip.id} onPress={(e) => openTrip(trip, e)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Row style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" tone="ink" numberOfLines={1}>{trip.title}</AppText>
                    <AppText variant="small" tone="inkFaint" numberOfLines={1}>
                      {trip.startDate.replace(/-/g, '.')}
                    </AppText>
                  </View>
                  <AppText variant="small" tone="matcha">→</AppText>
                </Row>
                <Rule />
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <AppText variant="body" tone="inkSoft">{t('prefCard.none')}</AppText>
            <Gap h={space.md} />
            <Pressable
              onPress={newTrip}
              style={({ pressed }) => [styles.cta, { backgroundColor: palette.matcha }, pressed && { opacity: 0.85 }]}
            >
              <AppText variant="bodyStrong" style={{ color: '#fff' }}>{t('home.newTrip')}</AppText>
            </Pressable>
          </>
        )}

        {/* ---------------- みんなの旅（横並びのカード） ---------------- */}
        {!!others.length && (
          <>
            <Gap h={space.xl} />
            <Eyebrow tone="matcha">{t('prefCard.others')}</Eyebrow>
            <Gap h={space.md} />
            <FlatList
              horizontal
              data={others}
              keyExtractor={(item) => item.id}
              renderItem={renderOther}
              showsHorizontalScrollIndicator={false}
              // 画面の外は描かない（仮想化＝遅延読み込み）
              initialNumToRender={2}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews
              ItemSeparatorComponent={() => <View style={{ width: space.sm }} />}
              style={{ marginHorizontal: -space.lg }}
              contentContainerStyle={{ paddingHorizontal: space.lg }}
            />
          </>
        )}

        {/* ---------------- 県の紹介（記録の下） ---------------- */}
        <Gap h={space.xl} />
        {!!photo && (
          <Image
            source={{ uri: photo.url }}
            style={{
              // PCでは版面いっぱいに伸ばさない。記事の扉写真くらいの大きさに留める
              // （620pxのまま16:9にすると高さ350pxの壁になり、下の文章が押し出される）
              width: wide ? 360 : '100%',
              aspectRatio: 16 / 9,
              borderRadius: 10,
              backgroundColor: palette.fill,
            }}
            resizeMode="cover"
          />
        )}
        <Gap h={space.md} />
        <AppText variant="body" tone="inkSoft" style={{ lineHeight: 24 }}>
          {prefText}
        </AppText>

        {/* 行くなら（MATCHAへ）。こちらも横並びのカード */}
        {!!matchaCards.length && (
          <>
            <Gap h={space.lg} />
            <Eyebrow tone="matcha">{t('quiz.result.spots', { name })}</Eyebrow>
            <Gap h={space.md} />
            <FlatList
              horizontal
              data={matchaCards}
              keyExtractor={(item) => item.key}
              renderItem={renderMatcha}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={2}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews
              ItemSeparatorComponent={() => <View style={{ width: space.sm }} />}
              style={{ marginHorizontal: -space.lg }}
              contentContainerStyle={{ paddingHorizontal: space.lg }}
            />
          </>
        )}
      </ScrollView>

      {/* 記事のポップアップ。文章が主役・写真は左右に小さく・下にMATCHAへの導線 */}
      <ArticleModal article={reading} onClose={() => setReading(null)} />

      <SignInPrompt visible={askSignIn} onClose={() => setAskSignIn(false)} reason="save" />
    </>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  cta: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  // みんなの旅。表紙＋題＋人＋市区町村。押せる面なので枠を持ってよい
  tripCard: { width: 200, borderRadius: 12, borderWidth: hairline, overflow: 'hidden' },
  tripCover: { height: 104, width: '100%' },
  // MATCHAの記事。文字だけのカード
  matchaCard: { width: 176, minHeight: 108, borderRadius: 12, borderWidth: hairline, padding: space.md, overflow: 'hidden' },
  // 抜粋つき記事カードのサムネイル
  articleCover: { width: '100%', height: 76 },
});
