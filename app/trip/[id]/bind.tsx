/**
 * 旅のジャーナル（PDF）の編集画面。/trip の本アイコンから開く。
 *
 *   プレビュー → 開いているページの編集 → 追加写真 → PDFへ
 *
 * 印刷版の販売はやめたので、この画面は**PDFを作るための編集だけ**を持つ。
 * 台割そのものは lib/photobook/plan、紙面は lib/photobook/render にある。
 * ここで直した内容は端末に残り、PDF（/trip/[id]/book）にそのまま効く。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Image, Pressable, ScrollView, StyleSheet, Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AppText, Row, Rule, Gap, Eyebrow, Button } from '@/components/ui';
import { space, hairline } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { useTrip } from '@/lib/useData';
import { useI18n } from '@/lib/i18n';
import { planBook } from '@/lib/photobook/plan';
import {
  readBookEdits, writeBookEdits, applyBookEdits, applyCover, pageAssignmentsFrom,
  type BookEdits, type BookPageOverride,
} from '@/lib/photobook/edits';
import { renderPage, PAGE_SIZE } from '@/lib/photobook/render';
import { BookPreview } from '@/components/BookPreview';
import { PhotoPicker } from '@/components/PhotoPicker';
import { uploadPhoto, publicUrl, currentUserId, yieldToUi } from '@/lib/api';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip(id);

  const scrollRef = useRef<ScrollView | null>(null);

  // プレビューは実際のPDFのページをそのまま使う（見本と本番で見え方を変えない）。
  // 最初に全ページを描くと重いので、BookPreview から求められた分だけ描く。
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
  const cache = useRef(new Map<number, string | null>());
  /**
   * 台割が変わったら、描いた絵の控えを捨てる。
   *
   * **効果(useEffect)ではなく描画のときに捨てる。** 効果は子から先に走るので、
   * 見本(BookPreview)が「控えを捨てたから引き直す」と動いたときには、
   * こちらの控えがまだ古いままで、古い絵をそのまま掴んでいた
   * （枚数を2→3にしても見本が変わらなかった正体）。
   */
  const lastBook = useRef(book);
  if (lastBook.current !== book) {
    lastBook.current = book;
    cache.current.clear();
  }
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
  const onSpreadChange = useCallback((left: number) => { setOpenSpread(left); setShortOf(null); }, []);
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
  /** 頼まれた枚数にできなかったとき、何枚までかを覚えておく */
  const [shortOf, setShortOf] = useState<number | null>(null);
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
  /**
   * 一覧から、そのページに「載せる／外す」を切り替える。
   * 写真は1つのページにしか載らないので、ほかのページに居たら引き取る。
   */
  const togglePhotoOnPage = (idx: number, uri: string) => {
    const pages = currentAssignments();
    if (!pages[idx]) return;
    if (pages[idx].photos.includes(uri)) {
      pages[idx] = { photos: pages[idx].photos.filter((u) => u !== uri) };
      updateEdits({ ...edits, pageOverrides: pages });
      return;
    }
    if (pages[idx].photos.length >= 6) { refuse(idx); return; }
    const next = pages.map((pg, i) => (i === idx ? pg : { photos: pg.photos.filter((u) => u !== uri) }));
    next[idx] = { photos: [...next[idx].photos, uri] };
    updateEdits({ ...edits, pageOverrides: next });
  };

  /**
   * このページの枚数を決める。**利用者の指示を最優先する。**
   *
   * 以前は「どのページにも載っていない写真」からしか足せなかったので、
   * 写真が全部どこかのページに載っていると、3枚と押しても何も起きなかった
   * （指摘の「反応しない」の正体）。いまは足りなければ**ほかのページから
   * 借りてくる**。借り先は写真の多いページから順で、1枚は残す ――
   * ページごと消すと番号がずれ、見ていたページが画面から消えてしまう。
   * それでも足りないときは、旅の写真が足りないということなので、
   * 何枚までにできるかをその場で伝える。
   *
   * 減らしたぶんは棚（どこにも載っていない写真）へ戻るので、いつでも戻せる。
   */
  const setPageCount = (idx: number, n: number) => {
    const pages = currentAssignments();
    if (!pages[idx]) return;
    const cur = pages[idx].photos;
    if (n === cur.length) return;
    if (n < cur.length) {
      pages[idx] = { photos: cur.slice(0, n) };
      updateEdits({ ...edits, pageOverrides: pages });
      return;
    }

    const need = n - cur.length;
    const taken: string[] = [];
    // ① まず、どのページにも載っていない写真から
    for (const u of poolPhotos.map((ph) => ph.uri)) {
      if (taken.length >= need) break;
      if (!cur.includes(u)) taken.push(u);
    }
    // ② 足りなければ、写真の多いページから借りる
    if (taken.length < need) {
      const order = pages
        .map((pg, i) => ({ i, count: pg.photos.length }))
        .filter((x) => x.i !== idx)
        .sort((a, b) => b.count - a.count);
      for (const { i } of order) {
        while (taken.length < need && pages[i].photos.length > 1) {
          const u = pages[i].photos[pages[i].photos.length - 1];
          pages[i] = { photos: pages[i].photos.slice(0, -1) };
          if (!cur.includes(u) && !taken.includes(u)) taken.push(u);
        }
        if (taken.length >= need) break;
      }
    }
    // 借りても足りなければ、あるぶんだけ（写真そのものは増やせない）
    setShortOf(taken.length < need ? cur.length + taken.length : null);
    pages[idx] = { photos: [...cur, ...taken] };
    updateEdits({ ...edits, pageOverrides: pages });
  };

  const dropAt = (to: Zone, at: number | null) => {
    const h = heldRef.current;
    release();
    if (!h) return;
    if (!movePhoto(h.uri, h.from, to, at)) refuse(to);
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
            /* key で作り直さない。作り直すと開いていたページを忘れ、
               写真を1枚足すたびに表紙へ戻る（指摘を受けた） */
            revision={`${book.pages.length}-${edits.photosPerPage ?? 0}-${edits.excluded.length}-${edits.cover ?? ''}-${(edits.pageOverrides ?? []).map((p) => p.photos.join(',')).join('|')}-${extras.length}`}
            total={book.pages.length}
            getPage={getPage}
            width={bookW}
            ratio={PAGE_SIZE.height / PAGE_SIZE.width}
            onSpreadChange={onSpreadChange}
          />
        </View>

        {/* ①' いま見本に出ているページだけを、その真下で直す ------------
            見本をめくると、この段の中身が入れ替わる。表紙の編集は
            表紙が見えているときだけ出す。
            **説明文は置かない。見出しだけで足りる**（指摘を受けた） */}
        <View style={{ paddingHorizontal: space.lg }}>
          {coverVisible && (
            <>
              <Gap h={space.xl} />
              <Eyebrow tone="matcha">{t('book.cover')}</Eyebrow>
              <Gap h={space.md} />
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

          {/* このページ ―― 枚数と、一覧からの取捨。この2つだけ */}
          {openPageIdx >= 0 && !!photoPages[openPageIdx] && (() => {
            const pg = photoPages[openPageIdx];
            const on = pg.photos.map((ph) => ph.uri);
            const pickW = Math.min((width - space.lg * 2 - space.sm * 2) / 3, 120);
            return (
              <>
                <Gap h={space.xl} />
                <Eyebrow tone="matcha">{t('book.pageLabel', { n: pg.pageNo })}</Eyebrow>
                <Gap h={space.md} />
                <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const sel = on.length === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => setPageCount(openPageIdx, n)}
                        style={[
                          styles.perChip,
                          {
                            borderColor: sel ? palette.matcha : palette.ruleStrong,
                            backgroundColor: sel ? palette.matcha : 'transparent',
                          },
                        ]}
                      >
                        <AppText variant="bodyStrong" style={{ color: sel ? '#fff' : palette.ink }}>{n}</AppText>
                      </Pressable>
                    );
                  })}
                </Row>
                {refused === openPageIdx && (
                  <>
                    <Gap h={space.sm} />
                    <AppText variant="small" tone="shu">{t('book.pageFull')}</AppText>
                  </>
                )}
                {shortOf !== null && (
                  <>
                    <Gap h={space.sm} />
                    <AppText variant="small" tone="shu">{t('book.notEnough', { n: shortOf })}</AppText>
                  </>
                )}
                <Gap h={space.md} />
                {/* 旅の写真ぜんぶ。押すとこのページに載る／外れる */}
                <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
                  {coverCandidates.map((p, i) => {
                    const here = on.includes(p.uri);
                    const elsewhere = !here && usedUris.has(p.uri);
                    return (
                      <Pressable
                        key={`${p.uri}-${i}`}
                        onPress={() => togglePhotoOnPage(openPageIdx, p.uri)}
                        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                      >
                        <View
                          style={[
                            styles.pickThumb,
                            { width: pickW, height: pickW },
                            here && { borderColor: palette.matcha, borderWidth: 3 },
                          ]}
                        >
                          <Image
                            source={{ uri: p.uri }}
                            style={{ width: '100%', height: '100%', opacity: here ? 1 : elsewhere ? 0.45 : 0.75 }}
                            resizeMode="cover"
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </Row>
              </>
            );
          })()}

          {/* この本のための追加写真 */}
          <Gap h={space.xl} />
          <Eyebrow tone="matcha">{t('book.extras')}</Eyebrow>
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


        {/* ② PDFへ ---------------------------------------------------- */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Gap h={space.xl} />
          <Rule />
          <Gap h={space.xl} />
          <Button
            label={t('bind.makeJournal')}
            tone="matcha"
            onPress={() => router.push(`/trip/${trip.id}/book` as any)}
          />
          <Gap h={space.sm} />
          <AppText variant="small" tone="inkFaint" center style={{ lineHeight: 19 }}>
            {t('bind.makeJournalHint')}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
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
});
