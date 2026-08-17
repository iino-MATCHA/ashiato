/**
 * 製本の選択画面。/trip の本アイコンから開く。
 *
 *   プレビュー → この一冊の説明 → プラン比較 → 送料の注記 → かごへ
 *
 * 「かごに入れる」を押した時点で全ページを焼いて保存する（lib/api の addToCart）。
 * 少し待たせるが、そのぶん注文の中身はここで確定し、あとから旅を編集されても
 * 届く本は変わらない。
 * 既存のジャーナルPDF（/trip/[id]/book）は残し、一番下から見本として辿れる。
 */
import { track } from '@/lib/analytics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Image, Pressable, ScrollView, StyleSheet, Modal, Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, fonts, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip, useCart } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { planBook, MIN_PHOTOS } from '@/lib/photobook/plan';
import {
  readBookEdits, writeBookEdits, applyBookEdits, applyCover, pageAssignmentsFrom,
  type BookEdits, type BookPageOverride,
} from '@/lib/photobook/edits';
import { renderPage, PAGE_SIZE } from '@/lib/photobook/render';
import { BookPreview } from '@/components/BookPreview';
import { PhotoPicker } from '@/components/PhotoPicker';
import {
  addToCart, PLAN_PRICE, uploadPhoto, publicUrl, currentUserId, yieldToUi,
  type BookPlanKey,
} from '@/lib/api';

/**
 * 写真の置き場所。数値は写真ページの番号（photoPages の並び）、
 * 'tray' はどのページにも置いていない写真の棚、'cover' は表紙。
 */
type Zone = number | 'tray' | 'cover';
/** いま掴んでいる1枚（ドラッグ中でも、タップで持ち上げた状態でも同じ形） */
type Held = { uri: string; from: Zone } | null;

export default function TripBind() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  /**
   * 値段は一段奥に置く。
   * 最初の画面に金額を並べると、中身を見る前に「売りつけられる」印象が先に立つ。
   * まず本そのものを見てもらい、注文する気になった人だけが仕様と値段を見る。
   * 経路を分けてあるので、端末の戻るでちゃんと前の画面へ戻れる。
   */
  const showPlans = step === 'plans';
  const { trip } = useTrip(id);
  const { items: cart } = useCart();

  // ページを焼いている間の進捗。null なら何もしていない。
  const [adding, setAdding] = useState<{ plan: BookPlanKey; done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // プレビューは実際のPDFのページをそのまま使う（見本と本番で見え方を変えない）。
  // 最初に全ページを描くと重いので、BookPreview から求められた分だけ描く。
  // ジャーナル画面(book.tsx)での手直し（写真の取捨・表紙）をここにも効かせる ――
  // 見本・かごに入れて焼く本・PDF がすべて同じ台割になる
  /**
   * 手直し（表紙・1ページの枚数・写真の取捨）。**編集はこの画面に集めた** ――
   * ジャーナル(book)は眺めて保存するだけの画面にする（導線の指摘を受けた）。
   * 端末に残すので、開き直しても消えない。
   */
  const [edits, setEdits] = useState<BookEdits>({ excluded: [] });
  useEffect(() => { if (trip) setEdits(readBookEdits(trip.id)); }, [trip?.id]);
  const updateEdits = (next: BookEdits) => {
    setEdits(next);
    if (trip) writeBookEdits(trip.id, next);
  };
  const toggPhoto = (uri: string) =>
    updateEdits({
      ...edits,
      excluded: edits.excluded.includes(uri)
        ? edits.excluded.filter((u) => u !== uri)
        : [...edits.excluded, uri],
    });
  const allPhotos = useMemo(
    () =>
      (trip?.steps ?? []).flatMap((s) =>
        s.images.filter(Boolean).map((uri) => ({ uri, title: s.title }))
      ),
    [trip]
  );
  const extras = edits.extraPhotos ?? [];
  /**
   * 表紙の候補は**旅の全写真＋追加写真**。除外した写真も外さない。
   *
   * 「表紙にできない画像がある」という指摘の正体がここだった。
   * 除外した写真を候補から落としていたので、ページから外した1枚は
   * 表紙にも選べなくなっていた。さらに追加写真は除外の絞り込みを
   * 通っていなかったため、帯には残るのに押しても何も起きなかった
   * （applyCover が除外を見て黙って諦めていた）。
   *
   * 表紙はページの割付とは別の話 ―― 本文に刷らない写真でも表紙にはできる。
   * 同じ写真が二度並ばないようにだけ揃える。
   */
  const coverCandidates = useMemo(() => {
    const seen = new Set<string>();
    const out: { uri: string; title: string }[] = [];
    for (const p of [...allPhotos, ...extras.map((uri) => ({ uri, title: '' }))]) {
      if (!p.uri || seen.has(p.uri)) continue;
      seen.add(p.uri);
      out.push(p);
    }
    return out;
  }, [allPhotos, extras]);

  const book = useMemo(() => {
    if (!trip) return null;
    // 焼く本はプレビューと同じ台割にする（密度・ページごとの割付も含めて）
    return applyCover(
      planBook(applyBookEdits(trip, edits), {
        photosPerPage: edits.photosPerPage,
        pageAssignments: pageAssignmentsFrom(edits),
      }),
      edits
    );
  }, [trip, edits]);
  // 台割が変わったら描き置きを捨てる（前の本のページが混ざる）
  useEffect(() => { cache.current.clear(); }, [book]);
  const cache = useRef(new Map<number, string | null>());
  const getPage = useCallback(
    async (i: number) => {
      if (!book) return null;
      const hit = cache.current.get(i);
      if (hit !== undefined) return hit;
      const url = await renderPage(book, i);
      cache.current.set(i, url);
      return url;
    },
    [book]
  );

  // ---- ページごとの割付 -------------------------------------------------
  /**
   * 表示中の台割の写真ページ。編集はこの並びを写して固定する。
   *
   * 番号は**写真ページの通し番号**（1から）にする。
   * 本のノンブルをそのまま出すと、最初の写真ページが「4ページ」になり、
   * 「1ページ目に5枚、2ページ目に3枚」という数え方と合わなかった
   * （扉と目次のぶん先頭にずれる）。
   */
  const photoPages = useMemo(() => {
    const out: { photos: { uri: string; stopTitle: string }[]; pageNo: number; bookIndex: number }[] = [];
    (book?.pages ?? []).forEach((p, i) => {
      if (p.kind === 'photos') out.push({ photos: p.photos, pageNo: out.length + 1, bookIndex: i });
    });
    return out;
  }, [book]);
  /**
   * 見本で開いている見開きの左ページ番号。
   * **開いたページの編集欄をその場で前に出す**ために持つ（指定を受けた）。
   * ページを送るたび、そのページの行が光って画面に入ってくる。
   */
  const [openSpread, setOpenSpread] = useState(0);
  const onSpreadChange = useCallback((left: number) => setOpenSpread(left), []);
  /** いま見開きに出ている写真ページ（左右のどちらか）。無ければ -1 */
  const openPageIdx = useMemo(
    () => photoPages.findIndex((pg) => pg.bookIndex === openSpread || pg.bookIndex === openSpread + 1),
    [photoPages, openSpread]
  );
  /** 表紙が見開きに出ているか。表紙の編集はそのときだけ出す（指定を受けた） */
  const coverVisible = useMemo(() => {
    const kinds = [book?.pages?.[openSpread]?.kind, book?.pages?.[openSpread + 1]?.kind];
    return kinds.includes('cover');
  }, [book, openSpread]);

  /** いまの台割をそのまま pageOverrides の形に写す（最初の手直しで固定する） */
  const currentAssignments = (): BookPageOverride[] =>
    photoPages.map((pg) => ({ photos: pg.photos.map((ph) => ph.uri) }));
  /** いま表紙に出ている1枚（選び直していなければ自動選定のもの） */
  const coverUri = useMemo(() => {
    const first = book?.pages[0];
    return first && first.kind === 'cover' ? first.photos[0] : undefined;
  }, [book]);
  const usedUris = useMemo(
    () => new Set(photoPages.flatMap((pg) => pg.photos.map((ph) => ph.uri))),
    [photoPages]
  );
  // ページに足せる写真: 旅の写真（外していないもの）＋追加写真 − すでに載っているもの
  const poolPhotos = useMemo(
    () =>
      [
        ...allPhotos.filter((p) => !edits.excluded.includes(p.uri)),
        ...extras.map((uri) => ({ uri, title: '' })),
      ].filter((p, i, arr) => !usedUris.has(p.uri) && arr.findIndex((q) => q.uri === p.uri) === i),
    [allPhotos, edits.excluded, extras, usedUris]
  );
  /** どのページに写真を足そうとしているか（写真ページの並びの中の番号）。null なら閉じている */
  const [picking, setPicking] = useState<number | null>(null);
  const removeFromPage = (idx: number, uri: string) => {
    const pages = currentAssignments();
    if (!pages[idx]) return;
    pages[idx] = { photos: pages[idx].photos.filter((u) => u !== uri) };
    updateEdits({ ...edits, pageOverrides: pages.filter((p) => p.photos.length > 0) });
  };
  const addToPage = (idx: number, uri: string) => {
    const pages = currentAssignments();
    if (!pages[idx] || pages[idx].photos.length >= 6 || pages[idx].photos.includes(uri)) return;
    pages[idx] = { photos: [...pages[idx].photos, uri] };
    setPicking(null);
    updateEdits({ ...edits, pageOverrides: pages });
  };
  const resetPages = () => updateEdits({ ...edits, pageOverrides: undefined });

  // ---- 掴んで置く（ドラッグ＆ドロップ、とタップの2経路） ----------------
  /**
   * 経路は2つあるが、状態は1つしか持たない。
   *   Web: HTML5 の drag イベント（dragstart で握り、drop で置く）
   *   それ以外・ドラッグできない人: 写真をタップして持ち上げ、置き先をタップ
   * どちらも `held` を握って `movePhoto` に落ちる ―― 経路が増えても
   * 割付を書き換える場所は1箇所のまま。
   */
  const [held, setHeld] = useState<Held>(null);
  // drag イベントは React の描き直しを待たない。掴んだ1枚は ref でも持つ
  const heldRef = useRef<Held>(null);
  heldRef.current = held;
  /** いま指し示している落とし先（枠を光らせる／挿入線を引く） */
  const [over, setOver] = useState<{ zone: Zone; at: number | null } | null>(null);
  /** 6枚を超えるので断った先。少しの間だけ印を出す（黙って無視しない） */
  const [refused, setRefused] = useState<Zone | null>(null);
  const refuseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (refuseTimer.current) clearTimeout(refuseTimer.current); }, []);
  const refuse = (zone: Zone) => {
    setRefused(zone);
    if (refuseTimer.current) clearTimeout(refuseTimer.current);
    refuseTimer.current = setTimeout(() => setRefused(null), 1600);
  };

  /**
   * 写真を1枚、別の場所へ移す。ページ→ページ / 棚→ページ / ページ→棚 /
   * →表紙 を1本で扱う。
   *
   * **最初に1枚動かした時点で、いまの台割を丸ごと pageOverrides に写して固定する。**
   * その写し取りは既存の `currentAssignments()`（＋/✕ と同じ入口）を使う ――
   * ドラッグ用に別の写し方を作らない。
   *
   * 1ページ6枚が上限。超える移動は false を返し、呼んだ側が断りを出す。
   */
  const movePhoto = (uri: string, from: Zone, to: Zone, at: number | null): boolean => {
    if (to === 'cover') {
      updateEdits({ ...edits, cover: uri });
      return true;
    }
    const pages = currentAssignments();
    if (to === 'tray') {
      // 棚に落とす＝そのページから外す（写真そのものは捨てない）
      if (typeof from !== 'number' || !pages[from]) return true;
      pages[from] = { photos: pages[from].photos.filter((u) => u !== uri) };
      updateEdits({ ...edits, pageOverrides: pages.filter((p) => p.photos.length > 0) });
      return true;
    }
    const target = pages[to];
    if (!target) return false;
    const already = target.photos.indexOf(uri);
    if (already < 0 && target.photos.length >= 6) return false; // 1ページ6枚まで
    if (typeof from === 'number' && pages[from] && from !== to) {
      pages[from] = { photos: pages[from].photos.filter((u) => u !== uri) };
    }
    const rest = target.photos.filter((u) => u !== uri);
    // 同じページの中で右へ動かすと、抜いたぶん挿入位置が1つずれる
    let index = at === null ? rest.length : already >= 0 && already < at ? at - 1 : at;
    index = Math.max(0, Math.min(rest.length, index));
    rest.splice(index, 0, uri);
    pages[to] = { photos: rest };
    updateEdits({ ...edits, pageOverrides: pages.filter((p) => p.photos.length > 0) });
    return true;
  };

  /** 掴む・離す・落とす。ドラッグからもタップからも呼ぶ */
  const grab = (uri: string, from: Zone) => {
    heldRef.current = { uri, from };
    setHeld({ uri, from });
  };
  const release = () => {
    heldRef.current = null;
    setHeld(null);
    setOver(null);
  };
  const dropAt = (to: Zone, at: number | null) => {
    const h = heldRef.current;
    release();
    if (!h) return;
    if (!movePhoto(h.uri, h.from, to, at)) refuse(to);
  };
  /** 写真そのものをタップ: 何も持っていなければ持ち上げ、持っていればそこへ置く */
  const tapPhoto = (uri: string, zone: Zone, index: number) => {
    const h = heldRef.current;
    if (!h) return grab(uri, zone);
    if (h.uri === uri && h.from === zone) return release(); // 同じ写真＝持つのをやめる
    dropAt(zone, index);
  };

  // ---- 本のためだけの追加写真 --------------------------------------------
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [uploadFailed, setUploadFailed] = useState(0);
  const onPickExtras = async (files: File[]) => {
    if (!trip || uploading) return;
    const list = files.slice(0, 20); // 一度に扱うのはほどほどに
    setUploadFailed(0);
    setUploading({ done: 0, total: list.length });
    const uid = await currentUserId();
    if (!uid) {
      setUploading(null);
      setUploadFailed(list.length);
      return;
    }
    const added: string[] = [];
    let failed = 0;
    for (let i = 0; i < list.length; i++) {
      try {
        // 旅の写真と同じ経路（縮小してから Storage の photos バケットへ）。
        // stop には紐付けない ―― logs/photos のテーブルには書かない
        const path = await uploadPhoto(uid, trip.id, list[i], 'book-extra');
        if (path) added.push(publicUrl(path));
        else failed += 1;
      } catch {
        failed += 1;
      }
      setUploading({ done: i + 1, total: list.length });
      await yieldToUi(); // 画面を固めない
    }
    setUploading(null);
    setUploadFailed(failed);
    if (added.length) updateEdits({ ...edits, extraPhotos: [...(edits.extraPhotos ?? []), ...added] });
  };
  const removeExtra = (uri: string) => {
    // 表紙・ページ割付からも同時に消す（消した写真が本に残らないように）
    const pages = edits.pageOverrides?.length
      ? currentAssignments()
          .map((p) => ({ photos: p.photos.filter((u) => u !== uri) }))
          .filter((p) => p.photos.length > 0)
      : undefined;
    updateEdits({
      ...edits,
      cover: edits.cover === uri ? undefined : edits.cover,
      extraPhotos: (edits.extraPhotos ?? []).filter((u) => u !== uri),
      pageOverrides: pages,
    });
  };

  const bookW = Math.min(width - space.lg * 2, 460);

  if (!trip || !book) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="inkFaint">{t('common.loading')}</AppText>
      </SafeAreaView>
    );
  }

  const inCart = cart.find((c) => c.tripId === trip.id) ?? null;
  const tooFewPhotos = book.totalPhotos < MIN_PHOTOS;

  const add = async (plan: BookPlanKey) => {
    if (adding || tooFewPhotos) return;
    setFailed(false);
    setAdding({ plan, done: 0, total: book.pages.length });
    try {
      track('add_to_cart');
      const item = await addToCart({
        tripId: trip.id,
        plan,
        title: trip.title,
        photoCount: book.totalPhotos,
        pageCount: book.pages.length,
        renderPage: getPage,
        onProgress: (done, total) => setAdding({ plan, done, total }),
      });
      setAdding(null);
      if (!item) { setFailed(true); return; }
      router.push('/cart' as any);
    } catch {
      setAdding(null);
      setFailed(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.washi }} edges={['top', 'bottom']}>
      <Header title={t('bind.header')} />
      <Rule />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>

        {/* ① プレビュー ------------------------------------------------ */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Gap h={space.lg} />
          <Eyebrow tone="matcha">{t('bind.previewEyebrow')}</Eyebrow>
          <Gap h={space.md} />
        </View>

        <View style={{ alignItems: 'center' }}>
          <BookPreview
            key={`${book.pages.length}-${edits.photosPerPage ?? 0}-${edits.excluded.length}-${edits.cover ?? ''}-${(edits.pageOverrides ?? []).map((p) => p.photos.length).join('.')}-${extras.length}`}
            total={book.pages.length}
            getPage={getPage}
            width={bookW}
            ratio={PAGE_SIZE.height / PAGE_SIZE.width}
            onSpreadChange={onSpreadChange}
          />
        </View>

        {/* ①' いま見本に出ているページだけを、その真下で直す ------------
            ページごとの編集欄を全部並べると、どれを直しているのか分からない
            （指摘を受けた）。見本をめくると、この段の中身が入れ替わる。
            表紙の編集は、表紙が見えているときだけ出す */}
        <View style={{ paddingHorizontal: space.lg }}>
          {coverVisible && (
          <>
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('book.cover')}</Eyebrow>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkFaint">{t('book.coverDrop')}</AppText>
          <Gap h={space.md} />
          {/* 表紙の落とし口。ここへ写真を落とす／持っているときに押すと表紙になる */}
          <CoverSlot
            uri={coverUri}
            palette={palette}
            label={t('book.coverSlot')}
            place={t('book.placeHere')}
            holding={!!held}
            active={over?.zone === 'cover'}
            onOver={() => setOver({ zone: 'cover', at: null })}
            onLeave={() => setOver((o) => (o?.zone === 'cover' ? null : o))}
            onDrop={() => dropAt('cover', null)}
          />
          <Gap h={space.md} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {coverCandidates.map((p, i) => {
              const chosen = coverUri === p.uri;
              return (
                <Pressable
                  key={`${p.uri}-${i}`}
                  onPress={() => updateEdits({ ...edits, cover: p.uri })}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.coverThumb, chosen && { borderColor: palette.matcha, borderWidth: 2 }]}>
                    <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          </>
          )}

          {/* いま開いている写真ページ。これ1枚だけを出す */}
          {openPageIdx >= 0 && !!photoPages[openPageIdx] && (
            <>
              <Gap h={space.xl} />
              <Eyebrow tone="matcha">{t('book.pages')}</Eyebrow>
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkFaint">{t('book.pagesHint')}</AppText>
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkFaint">{t('book.dragHint')}</AppText>
              <Gap h={space.md} />
              <PageRow
                key={`page-${photoPages[openPageIdx].pageNo}`}
                idx={openPageIdx}
                pageNo={photoPages[openPageIdx].pageNo}
                photos={photoPages[openPageIdx].photos.map((ph) => ph.uri)}
                thumbW={Math.min((width - space.lg * 2 - space.sm * 4) / 4, 88)}
                first
                palette={palette}
                t={t}
                held={held}
                over={over}
                refused={refused === openPageIdx}
                onGrab={(uri: string) => grab(uri, openPageIdx)}
                onRelease={release}
                onTap={(uri: string, i: number) => tapPhoto(uri, openPageIdx, i)}
                onOver={(at: number | null) => setOver({ zone: openPageIdx, at })}
                onLeave={() => setOver((o) => (o?.zone === openPageIdx ? null : o))}
                onDrop={(at: number | null) => dropAt(openPageIdx, at)}
                onRemove={(uri: string) => removeFromPage(openPageIdx, uri)}
                onPick={() => setPicking(openPageIdx)}
              />
            </>
          )}

          {/* 持ち上げているときの案内。棚はページ間の受け渡しに要る */}
          {!!held && (
            <>
              <Gap h={space.sm} />
              <Row style={{ gap: space.sm, alignItems: 'center' }}>
                <AppText variant="small" tone="matcha" style={{ flex: 1 }}>{t('book.holding')}</AppText>
                <Pressable onPress={release} hitSlop={8} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                  <AppText variant="small" tone="inkFaint">{t('book.holdCancel')}</AppText>
                </Pressable>
              </Row>
            </>
          )}
          <Gap h={space.md} />
          <PhotoTray
            photos={poolPhotos.map((p) => p.uri)}
            palette={palette}
            t={t}
            held={held}
            over={over}
            onGrab={(uri: string) => grab(uri, 'tray')}
            onRelease={release}
            onTap={(uri: string, i: number) => tapPhoto(uri, 'tray', i)}
            onOver={() => setOver({ zone: 'tray', at: null })}
            onLeave={() => setOver((o) => (o?.zone === 'tray' ? null : o))}
            onDrop={() => dropAt('tray', null)}
          />
          {!!edits.pageOverrides?.length && (
            <>
              <Gap h={space.sm} />
              <Pressable onPress={resetPages} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <AppText variant="small" tone="matcha">{t('book.pagesReset')}</AppText>
              </Pressable>
            </>
          )}

          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('book.perPage')}</Eyebrow>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkFaint">{t('book.perPageHint')}</AppText>
          <Gap h={space.md} />
          <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
            {[undefined, 1, 2, 3, 4, 5, 6].map((n) => {
              const on = edits.photosPerPage === n || (!edits.photosPerPage && n === undefined);
              return (
                <Pressable
                  key={String(n)}
                  // 密度を選び直したら、ページごとの手直しは白紙に戻して割り直す
                  // （固定した割付と両立しないため。下の注記で先に言う）
                  onPress={() => updateEdits({ ...edits, photosPerPage: n, pageOverrides: undefined })}
                  style={[
                    styles.perChip,
                    { borderColor: on ? palette.matcha : palette.ruleStrong, backgroundColor: on ? palette.matcha : 'transparent' },
                  ]}
                >
                  <AppText variant="bodyStrong" style={{ color: on ? '#fff' : palette.ink }}>
                    {n === undefined ? t('book.perPageAuto') : String(n)}
                  </AppText>
                </Pressable>
              );
            })}
          </Row>
          {!!edits.pageOverrides?.length && (
            <>
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkFaint">{t('book.perPageResets')}</AppText>
            </>
          )}

          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('book.customize')}</Eyebrow>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkFaint">{t('book.customizeHint')}</AppText>
          <Gap h={space.md} />
          <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
            {allPhotos.map((p, i) => {
              const off = edits.excluded.includes(p.uri);
              const pickW = Math.min((width - space.lg * 2 - space.sm * 2) / 3, 120);
              return (
                <Pressable key={`${p.uri}-${i}`} onPress={() => toggPhoto(p.uri)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                  <View style={[styles.pickThumb, { width: pickW, height: pickW }]}>
                    <Image
                      source={{ uri: p.uri }}
                      style={{ width: '100%', height: '100%', opacity: off ? 0.3 : 1 }}
                      resizeMode="cover"
                    />
                    {off && (
                      <View style={styles.pickOff} pointerEvents="none">
                        <Ionicons name="close" size={22} color="#fff" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </Row>

          {/* ①'' 本のためだけの追加写真。旅のstopには足さない ----------- */}
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('book.extras')}</Eyebrow>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkFaint">{t('book.extrasHint')}</AppText>
          <Gap h={space.md} />
          {extras.length > 0 && (
            <>
              <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
                {extras.map((uri) => {
                  const pickW = Math.min((width - space.lg * 2 - space.sm * 2) / 3, 120);
                  return (
                    <View key={uri} style={[styles.pickThumb, { width: pickW, height: pickW }]}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <Pressable
                        onPress={() => removeExtra(uri)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.extraRemove, pressed && { opacity: 0.7 }]}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  );
                })}
              </Row>
              <Gap h={space.md} />
            </>
          )}
          <PhotoPicker multiple onPick={onPickExtras}>
            {/* 押せる面なので枠を持ってよい */}
            <View style={[styles.extraAdd, { borderColor: palette.ruleStrong }]}>
              <Ionicons name="add" size={18} color={palette.matcha} />
              <AppText variant="bodyStrong" tone="matcha">
                {uploading ? t('book.extrasUploading', { done: uploading.done, total: uploading.total }) : t('book.extrasUpload')}
              </AppText>
            </View>
          </PhotoPicker>
          {uploadFailed > 0 && (
            <>
              <Gap h={space.sm} />
              <AppText variant="small" tone="shu">{t('book.extrasFailed', { n: uploadFailed })}</AppText>
            </>
          )}

        </View>


        {/* ② この一冊について ------------------------------------------ */}
        <View style={{ paddingHorizontal: space.lg }}>
          {/* 説明は箱で囲わない。細い罫だけで区切る */}
          <Gap h={space.xl} />
          <Rule />
          <Gap h={space.lg} />
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Ionicons name="book-outline" size={17} color={palette.shu} />
            <AppText variant="bodyStrong" tone="ink">{t('bind.aboutTitle')}</AppText>
          </Row>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkSoft" style={{ lineHeight: 23 }}>
            {t('bind.aboutBody')}
          </AppText>
          <Gap h={space.lg} />
          <Rule />

          {/* ③ プラン。注文する気になった人にだけ見せる ------------------ */}
          {!showPlans && (
            <>
              <Gap h={space.xl} />
              <Button
                label={t('bind.startOrder')}
                tone="matcha"
                disabled={tooFewPhotos}
                onPress={() => router.push(`/trip/${trip.id}/bind?step=plans` as any)}
              />
              <Gap h={space.md} />
              {/* 写真が足りない旅で先へ進ませると、プランを選んだ先で行き止まりになる。
                  進めない理由はここで言う。 */}
              <AppText variant="small" tone={tooFewPhotos ? 'shu' : 'inkFaint'} center style={{ lineHeight: 19 }}>
                {tooFewPhotos
                  ? t('bind.needPhotosShort', { n: MIN_PHOTOS, done: book.totalPhotos })
                  : t('bind.startOrderHint')}
              </AppText>
              {/* もう一つの出口。同じ台割を無料のPDFとして眺めて保存する */}
              <Gap h={space.lg} />
              <Button
                label={t('bind.makeJournal')}
                variant="outline"
                tone="matcha"
                onPress={() => router.push(`/trip/${trip.id}/book` as any)}
              />
              <Gap h={space.sm} />
              <AppText variant="small" tone="inkFaint" center style={{ lineHeight: 19 }}>
                {t('bind.makeJournalHint')}
              </AppText>
            </>
          )}

          {showPlans && (
          <>
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('bind.plansEyebrow')}</Eyebrow>
          <Gap h={space.md} />

          <PlanCard
            tier={t('bind.premiumTier')}
            name={t('bind.premiumName')}
            price={PLAN_PRICE.premium.toLocaleString('en-US')}
            badges={[t('bind.badgePopular'), t('bind.badgeCraft')]}
            features={[t('bind.premiumF1'), t('bind.premiumF2'), t('bind.premiumF3')]}
            accent
            palette={palette}
            t={t}
            inCart={inCart?.plan === 'premium'}
            disabled={tooFewPhotos || !!adding}
            onPress={() => (inCart?.plan === 'premium' ? router.push('/cart' as any) : add('premium'))}
          />
          <Gap h={space.md} />
          <PlanCard
            tier={t('bind.regularTier')}
            name={t('bind.regularName')}
            price={PLAN_PRICE.regular.toLocaleString('en-US')}
            badges={[]}
            features={[t('bind.regularF1'), t('bind.regularF2'), t('bind.regularF3')]}
            palette={palette}
            t={t}
            inCart={inCart?.plan === 'regular'}
            disabled={tooFewPhotos || !!adding}
            onPress={() => (inCart?.plan === 'regular' ? router.push('/cart' as any) : add('regular'))}
          />

          {tooFewPhotos && (
            <>
              <Gap h={space.md} />
              <AppText variant="small" tone="shu">
                {t('bind.needPhotos')}（{book.totalPhotos}/{MIN_PHOTOS}）
              </AppText>
            </>
          )}
          {failed && (
            <>
              <Gap h={space.md} />
              <AppText variant="small" tone="shu">{t('bind.addFailed')}</AppText>
            </>
          )}

          {/* ④ 送料の注記 --------------------------------------------- */}
          <Gap h={space.lg} />
          {[t('bind.shipNote1'), t('bind.shipNote2')].map((n) => (
            <Row key={n} style={{ gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
              <AppText variant="small" tone="inkFaint">※</AppText>
              <AppText variant="small" tone="inkFaint" style={{ flex: 1, lineHeight: 19 }}>{n}</AppText>
            </Row>
          ))}
          </>
          )}

        </View>
      </ScrollView>

      {/* ⑤ かごへ入れている間 ------------------------------------------
          全ページを焼いて保存するので数秒かかる。何をしているのかと
          どこまで進んだのかを出して、戻る操作を塞ぐ。 */}
      {/* visible={false} でも中身がDOMに残り、製本ページへ戻ったときに
          「0 / 0」の幕が被る。焼いている間だけ組み立てる。 */}
      {/* ⑥ ページに足す写真を選ぶ ------------------------------------- */}
      {picking !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPicking(null)}>
          <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: palette.washi, maxHeight: '75%' }]} onPress={() => {}}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="h3" tone="ink">
                  {t('book.pickerTitle', { n: photoPages[picking]?.pageNo ?? 0 })}
                </AppText>
                <Pressable onPress={() => setPicking(null)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={palette.ink} />
                </Pressable>
              </Row>
              <Gap h={space.md} />
              {poolPhotos.length === 0 ? (
                <AppText variant="small" tone="inkFaint" style={{ lineHeight: 20 }}>
                  {t('book.pickerEmpty')}
                </AppText>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
                    {poolPhotos.map((p, i) => (
                      <Pressable
                        key={`${p.uri}-${i}`}
                        onPress={() => addToPage(picking, p.uri)}
                        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                      >
                        <View style={[styles.pickThumb, { width: 88, height: 88 }]}>
                          <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </View>
                      </Pressable>
                    ))}
                  </Row>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {adding !== null && (
      <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: palette.washi, alignItems: 'center' }]}>
            <Ionicons name="book-outline" size={30} color={palette.matcha} />
            <Gap h={space.md} />
            <AppText variant="h3" tone="ink" center>{t('bind.preparing')}</AppText>
            <Gap h={space.md} />
            <View style={[styles.bar, { backgroundColor: palette.rule }]}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: palette.matcha,
                  width: `${Math.round((adding.done / Math.max(1, adding.total)) * 100)}%`,
                }}
              />
            </View>
            <Gap h={space.sm} />
            <AppText variant="small" tone="inkFaint">{adding.done} / {adding.total}</AppText>
          </View>
        </View>
      </Modal>
      )}
    </SafeAreaView>
  );
}

function PlanCard({ tier, name, price, badges, features, accent, palette, t, onPress, inCart, disabled }: any) {
  return (
    <View style={[styles.plan, { borderColor: accent ? palette.matcha : palette.rule, backgroundColor: palette.paper }]}>
      {accent && <View style={[styles.planEdge, { backgroundColor: palette.matcha }]} />}
      <View style={{ padding: space.lg }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <AppText variant="eyebrow" tone={accent ? 'matcha' : 'inkFaint'}>{tier}</AppText>
          <Row style={{ gap: 5 }}>
            {badges.map((b: string) => (
              <View key={b} style={[styles.badge, { backgroundColor: palette.fill }]}>
                <AppText variant="small" tone="inkSoft" style={{ fontSize: 10 }}>{b}</AppText>
              </View>
            ))}
          </Row>
        </Row>
        <Gap h={6} />
        <AppText variant="h3" tone="ink">{name}</AppText>

        <Gap h={space.sm} />
        <Row style={{ alignItems: 'baseline', gap: 5 }}>
          <AppText style={{ fontFamily: fonts.minchoBold, fontSize: 30, color: palette.ink }}>¥{price}</AppText>
          <AppText variant="small" tone="inkFaint">{t('bind.taxIncl')}</AppText>
          <AppText variant="small" tone="inkFaint">· {t('bind.shippingExtra')}</AppText>
        </Row>

        <Gap h={space.md} />
        {features.map((f: string) => (
          <Row key={f} style={{ gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
            <Ionicons name="checkmark" size={15} color={palette.matcha} style={{ marginTop: 2 }} />
            <AppText variant="small" tone="inkSoft" style={{ flex: 1, lineHeight: 20 }}>{f}</AppText>
          </Row>
        ))}

        <Gap h={space.md} />
        {inCart && (
          <>
            <Row style={{ gap: 6, alignItems: 'center', paddingBottom: space.sm }}>
              <Ionicons name="checkmark-circle" size={15} color={palette.matcha} />
              <AppText variant="small" tone="matcha">{t('bind.inCart')}</AppText>
            </Row>
          </>
        )}
        <Button
          label={inCart ? t('bind.goToCart') : t('bind.addToCart')}
          tone={accent || inCart ? 'matcha' : 'ink'}
          variant={accent || inCart ? undefined : 'outline'}
          disabled={disabled}
          onPress={onPress}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- 掴んで置く

const WEB = Platform.OS === 'web';

/**
 * Web の drag & drop を react-native-web の View に繋ぐ。
 *
 * react-native は draggable / dragstart を知らないので、DOM ノードを ref で
 * 掴んで自分で付ける（BottomSheet が touch を直に受けているのと同じ手）。
 * **listener は付け替えない。** ハンドラは描き直しのたびに作り直されるので、
 * 最新を ref に写しておき、イベントの中でそれを読む。
 */
function useDnd(cfg: {
  /** 掴める面にする。掴んだ瞬間に呼ぶ */
  onGrab?: () => void;
  /** 離した（置けたかどうかに関わらず必ず来る） */
  onRelease?: () => void;
  /** 上に乗っている。sided なら左右で「前／後」を返す */
  onOver?: (side: 'before' | 'after' | null) => void;
  onLeave?: () => void;
  onDrop?: (side: 'before' | 'after' | null) => void;
  /** 写真1枚ぶんの面。左右どちらに落としたかで挿入位置を決める */
  sided?: boolean;
}) {
  const ref = useRef<View | null>(null);
  const latest = useRef(cfg);
  latest.current = cfg;
  useEffect(() => {
    if (!WEB) return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const off: (() => void)[] = [];
    const on = (name: string, fn: any) => {
      node.addEventListener(name, fn);
      off.push(() => node.removeEventListener(name, fn));
    };

    if (cfg.onGrab) {
      node.setAttribute('draggable', 'true');
      (node.style as any).cursor = 'grab';
      // react-native-web の <img> は draggable="false" を持っている。
      // そのままだと写真の上から掴み始められない
      node.querySelectorAll('[draggable="false"]').forEach((el) => el.setAttribute('draggable', 'true'));
      on('dragstart', (e: DragEvent) => {
        try {
          e.dataTransfer?.setData('text/plain', 'mj-photo');
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        } catch {}
        latest.current.onGrab?.();
      });
      on('dragend', () => latest.current.onRelease?.());
    }

    if (cfg.onDrop) {
      const sideOf = (e: DragEvent): 'before' | 'after' | null => {
        if (!latest.current.sided) return null;
        const r = node.getBoundingClientRect();
        return e.clientX < r.left + r.width / 2 ? 'before' : 'after';
      };
      // 出入りは子要素でも起きる。数えて 0 になったときだけ「離れた」とする
      let depth = 0;
      on('dragenter', (e: DragEvent) => { e.preventDefault(); depth += 1; });
      on('dragover', (e: DragEvent) => {
        e.preventDefault(); // これを呼ばないとブラウザが落とさせてくれない
        // 写真の面は自分で挿入位置を決める。行まで伝えると末尾に上書きされる
        if (latest.current.sided) e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        latest.current.onOver?.(sideOf(e));
      });
      on('dragleave', () => {
        depth -= 1;
        if (depth <= 0) { depth = 0; latest.current.onLeave?.(); }
      });
      on('drop', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        depth = 0;
        latest.current.onDrop?.(sideOf(e));
      });
    }
    return () => off.forEach((f) => f());
    // 付けるのは一度きり。中身は latest 経由で最新を読む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/**
 * 写真1枚。掴んで運べて、落とし先にもなる。
 * ドラッグできない端末・人のために、押すと「持ち上げ／置く」も同じ動きをする。
 */
function Tile({
  uri, tag, size, palette, carried, insert, corner, onGrab, onRelease, onTap, onOver, onDrop,
}: {
  uri: string;
  /** どの面かをDOMに残す（Webの検証用。data-mjtile） */
  tag: string;
  size: number;
  palette: any;
  /** いま運んでいる1枚 */
  carried: boolean;
  /** 挿入線をどちら側に引くか */
  insert: 'before' | 'after' | null;
  corner?: React.ReactNode;
  onGrab: () => void;
  onRelease: () => void;
  onTap: () => void;
  onOver: (side: 'before' | 'after' | null) => void;
  onDrop: (side: 'before' | 'after' | null) => void;
}) {
  const ref = useDnd({ onGrab, onRelease, onOver, onDrop, sided: true });
  return (
    <View style={{ width: size, height: size }}>
      <View
        ref={ref as any}
        {...({ dataSet: WEB ? { mjtile: tag } : undefined } as any)}
        style={[
          styles.pickThumb,
          { width: size, height: size },
          carried && { borderWidth: 2, borderColor: palette.matcha },
        ]}
      >
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%', opacity: carried ? 0.4 : 1 }}
          resizeMode="cover"
        />
        {/* タップの経路。✕ より下に敷いて、✕ の当たりを奪わない */}
        <Pressable onPress={onTap} style={StyleSheet.absoluteFill} />
        {corner}
      </View>
      {insert && (
        <View
          pointerEvents="none"
          style={[
            styles.insertBar,
            { backgroundColor: palette.matcha },
            insert === 'before' ? { left: -5 } : { right: -5 },
          ]}
        />
      )}
    </View>
  );
}

/** 写真ページ1行。行そのものが落とし先（末尾に足す） */
/**
 * ページ1枚ぶんの編集の行。
 * **出るのは見本で開いているページの1枚だけ**（指定を受けた）。
 * 全ページを並べていた頃は、どのページを直しているのか分からなかった。
 */
function PageRow({
  idx, pageNo, photos, thumbW, first, palette, t, held, over, refused,
  onGrab, onRelease, onTap, onOver, onLeave, onDrop, onRemove, onPick,
}: any) {
  const ref = useDnd({ onOver: () => onOver(null), onLeave, onDrop: () => onDrop(null) });
  const active = over?.zone === idx;
  return (
    <View {...({ dataSet: WEB ? { mjrow: `p${idx}` } : undefined } as any)}>
      {!first && <Rule />}
      <Gap h={space.sm} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
        <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
          {t('book.pageLabel', { n: pageNo })} ·{' '}
          {photos.length === 1 ? t('book.pageCount.one') : t('book.pageCount', { n: photos.length })}
        </AppText>
        {/* 満杯のページには置き先を出さない（並べ替えのときだけ出す） */}
        {!!held && (photos.length < 6 || held.from === idx) && (
          <Pressable
            onPress={() => onDrop(null)}
            hitSlop={6}
            style={({ pressed }: any) => [styles.placeHere, { borderColor: palette.matcha }, pressed && { opacity: 0.7 }]}
          >
            <AppText variant="small" tone="matcha">{t('book.placeHere')}</AppText>
          </Pressable>
        )}
      </Row>
      <Gap h={space.sm} />
      <View
        ref={ref as any}
        {...({ dataSet: WEB ? { mjdrop: `p${idx}`, mjcount: String(photos.length) } : undefined } as any)}
        style={[
          styles.dropRow,
          { borderColor: active ? palette.matcha : refused ? palette.ruleStrong : 'transparent' },
          !!refused && { borderStyle: 'solid' },
        ]}
      >
        <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
          {photos.map((uri: string, pi: number) => (
            <Tile
              key={`${uri}-${pi}`}
              uri={uri}
              tag={`p${idx}-${pi}`}
              size={thumbW}
              palette={palette}
              carried={held?.uri === uri && held?.from === idx}
              insert={
                active && over?.at === pi
                  ? 'before'
                  : active && over?.at === photos.length && pi === photos.length - 1
                    ? 'after'
                    : null
              }
              onGrab={() => onGrab(uri)}
              onRelease={onRelease}
              onTap={() => onTap(uri, pi)}
              onOver={(side) => onOver(side === 'after' ? pi + 1 : pi)}
              onDrop={(side) => onDrop(side === 'after' ? pi + 1 : pi)}
              corner={
                <Pressable
                  onPress={() => onRemove(uri)}
                  hitSlop={8}
                  style={({ pressed }: any) => [styles.extraRemove, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              }
            />
          ))}
          {photos.length < 6 && (
            <Pressable
              onPress={onPick}
              style={({ pressed }: any) => [
                styles.pageAdd,
                { width: thumbW, height: thumbW, borderColor: palette.ruleStrong },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="add" size={20} color={palette.matcha} />
            </Pressable>
          )}
        </Row>
      </View>
      {!!refused && (
        <>
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkSoft">{t('book.pageFull')}</AppText>
        </>
      )}
      <Gap h={space.sm} />
    </View>
  );
}

/** どのページにも置いていない写真の棚。引き出し口であり、外す先でもある */
function PhotoTray({
  photos, palette, t, held, over, onGrab, onRelease, onTap, onOver, onLeave, onDrop,
}: any) {
  const ref = useDnd({ onOver: () => onOver(), onLeave, onDrop: () => onDrop() });
  const active = over?.zone === 'tray';
  return (
    <View>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
        <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>
          {/* 0枚のときは枚数を出さない（下の「すべて載っています」と重なる） */}
          {photos.length
            ? `${t('book.tray')} · ${photos.length === 1 ? t('book.pageCount.one') : t('book.pageCount', { n: photos.length })}`
            : t('book.tray')}
        </AppText>
        {!!held && held.from !== 'tray' && (
          <Pressable
            onPress={() => onDrop()}
            hitSlop={6}
            style={({ pressed }: any) => [styles.placeHere, { borderColor: palette.matcha }, pressed && { opacity: 0.7 }]}
          >
            <AppText variant="small" tone="matcha">{t('book.placeHere')}</AppText>
          </Pressable>
        )}
      </Row>
      <Gap h={space.sm} />
      <View
        ref={ref as any}
        {...({ dataSet: WEB ? { mjdrop: 'tray', mjcount: String(photos.length) } : undefined } as any)}
        style={[styles.dropRow, { borderColor: active ? palette.matcha : 'transparent' }]}
      >
        {photos.length === 0 ? (
          <AppText variant="small" tone="inkFaint">{t('book.trayEmpty')}</AppText>
        ) : (
          <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
            {photos.map((uri: string, i: number) => (
              <Tile
                key={`${uri}-${i}`}
                uri={uri}
                tag={`tray-${i}`}
                size={64}
                palette={palette}
                carried={held?.uri === uri && held?.from === 'tray'}
                insert={null}
                onGrab={() => onGrab(uri)}
                onRelease={onRelease}
                onTap={() => onTap(uri, i)}
                onOver={() => onOver()}
                onDrop={() => onDrop()}
              />
            ))}
          </Row>
        )}
      </View>
      <Gap h={space.sm} />
      <AppText variant="small" tone="inkFaint">{t('book.trayHint')}</AppText>
    </View>
  );
}

/** 表紙の落とし口。写真を落とすとその1枚が表紙になる */
function CoverSlot({ uri, palette, label, place, holding, active, onOver, onLeave, onDrop }: any) {
  const ref = useDnd({ onOver: () => onOver(), onLeave, onDrop: () => onDrop() });
  return (
    <View
      ref={ref as any}
      {...({ dataSet: WEB ? { mjdrop: 'cover' } : undefined } as any)}
      style={[styles.coverSlot, { borderColor: active ? palette.matcha : palette.ruleStrong }]}
    >
      <View style={styles.coverSlotThumb}>
        {!!uri && <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
      </View>
      <AppText variant="small" tone="inkFaint" style={{ flex: 1 }}>{label}</AppText>
      {!!holding && (
        <Pressable
          onPress={onDrop}
          hitSlop={6}
          style={({ pressed }: any) => [styles.placeHere, { borderColor: palette.matcha }, pressed && { opacity: 0.7 }]}
        >
          <AppText variant="small" tone="matcha">{place}</AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  coverThumb: { width: 96, height: 68, borderRadius: 8, overflow: 'hidden', borderWidth: hairline, borderColor: 'rgba(0,0,0,0.12)' },
  perChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, minWidth: 44, alignItems: 'center' },
  pickThumb: { borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)' },
  pickOff: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,18,15,0.25)' },
  // 写真の右上に重ねる小さな「外す」ボタン
  extraRemove: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,18,15,0.55)',
  },
  // 押せる面なので枠を持つ（説明文の枠ではない）
  extraAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 10, borderStyle: 'dashed', paddingVertical: 12,
  },
  pageAdd: {
    borderWidth: 1.5, borderRadius: 8, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  // 落とせる面。ふだんは枠を透明にして「箱で囲まない」を守り、
  // 写真を運んでいる間だけ緑の破線として現れる
  dropRow: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10,
    padding: space.sm, marginHorizontal: -space.sm,
  },
  // 何枚目と何枚目の間に入るかを示す線
  insertBar: { position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 2 },
  // 押せる面なので枠を持つ（タップだけで運ぶ人の置き先）
  placeHere: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  coverSlot: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, padding: space.sm,
  },
  coverSlotThumb: { width: 72, height: 51, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)' },
  plan: { borderWidth: hairline * 2, borderRadius: 16, overflow: 'hidden' },
  planEdge: { height: 4, width: '100%' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sampleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  sampleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 16, padding: space.lg },
  bar: { width: '100%', height: 4, borderRadius: 999, overflow: 'hidden' },
});
