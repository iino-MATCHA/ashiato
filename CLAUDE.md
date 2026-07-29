# My Japan — 開発メモ

日本を旅した記録を残し、都道府県ごとに御朱印を集め、旅をジャーナル(PDF)にするアプリ。
表に出る名前は **My Japan**。リポジトリ名・DBのユーザー名(`ashiato_demo`)・
Storageのパス・bundle id は `ashiato` のまま（変えると既存データと繋がらない）。
運営は株式会社MATCHA。Expo(React Native) + expo-router + Supabase、Web(Vercel)が主戦場。

- 本番: https://www.my-japan-matcha.com （apex は www へ転送。OGP・認証の戻り先はすべて www 側）
- リポジトリ: https://github.com/iino-MATCHA/ashiato （`iino-MATCHA` の M A T C H A は大文字）
- Supabase project ref: `tcyclvfinguwudztfgsb`

---

## まず読むもの

| 目的 | ファイル |
|---|---|
| 製本(PDF)の設計思想とアルゴリズム | `docs/photobook.md` |
| 進捗表 | `docs/progress.xlsx` |

---

## 決まっていること（勝手に変えない）

- **UIは全画面が多言語**。en / ja / ko / zh-Hans / zh-Hant。文字列は必ず `lib/i18n.ts` の
  辞書に足して `t('key')` で使う。**言語切替UIは置かない**（ブラウザ言語から自動判定）
- **配色**: 白ベース。ブランド色は MATCHA green `#69AF00`。**朱色 `#C4432B` は御朱印専用**
- **箱で囲まない**。入力欄は下線。「スタイリッシュに」が一貫した要求
- **バックグラウンドGPSは使わない**。チェックインは場所検索から手動
- **都道府県そのものはチェックインの候補に出さない**。ただし検索語として
  都道府県名を入れたときは、その中の市区町村を並べて選ばせる（searchPlaces）
- 御朱印は **1都道府県に1つ、全47個**
- サンプル旅(`ashiato_demo`所有)は閲覧・共有できるが編集不可。他人の旅は
  共有/設定ボタン自体を出さない

---

## ハマりどころ（同じ失敗を繰り返さない）

### 表示の確認
- **必ず目で確認してから「できました」と言う。** LPを未確認で報告して作り直しになった
- Browser paneが非表示だとスクリーンショットが撮れない。そのときは
  `javascript_tool` でDOM/CSSを実測して検証する（高さ・画像の naturalWidth・
  computed style）
- **`IntersectionObserver` と `requestAnimationFrame` は、ページが描画されていないと
  発火/実行されない。** スクロール連動は `scroll` イベント内で直接判定する

### レイアウト
- アプリのシェル(`app/+html.tsx`)は `height:100dvh` 固定で、**文書はスクロールしない**。
  画面ごとに内側でスクロールする設計。全画面スクロールが要るものは
  その要素自身を `height:100dvh; overflow-y:auto` にする（LPがこれで1画面に
  閉じ込められていた）
- 縦に伸びる要素を `Row` の中に入れると、隣の見出しや下の内容が押し出される。
  絶対配置にする

### Supabase / PostgREST
- **同じ2テーブル間にFKが複数あると埋め込みが `PGRST201` で必ず失敗する。**
  `profiles!comments_author_id_fkey(...)` のようにFK名を明示する
  （`notification_reads` 追加でコメントが一切表示されなくなった実績あり）
- `supabase.auth.getUser()` は毎回サーバーに問い合わせる。**`getSession()`（ローカル）を使う**
- DDLはanon keyでは打てない。Management API に PAT で投げる。
  SQLはファイルに書いてJSONエンコードして送る（インラインの引用符で400になる）
- RLSは概ね正しく設定済み。動かないときはまずクライアント側を疑う

### 外部データ
- Wikimediaのサムネイルは**任意の幅が使えるとは限らない**（640pxが400を返す例あり）。
  実際に叩いて200が返る幅だけを使う
- MATCHAのURL: `matcha-jp.com/{lang}/list?region={id}`
  - lang: `jp` / `en` / `ko` / `cn`(簡体) / `tw`(繁体)
  - region: 都道府県は **JISコード + 100**（101=北海道 … 147=沖縄）。
    エリア単位は 148〜408（224=渋谷・原宿・表参道 など）

### Windows環境
- `git push` は remote URL に `iino-MATCHA@` を含める（資格情報マネージャの
  該当エントリを引くため）。PowerShellがstderrを赤字で出すが push は成功している
- 非ASCIIを含むスクリプトはヒアドキュメントだとエスケープが壊れる。
  **ファイルに書いてから実行する**

---

## データ

- マスタは既存のものを使う: `Prefecture_master` / `municipalities_master`(1,741) /
  `tourism_area_master`(200、MATCHAリンク付き)
- デモ用アカウント（パスワードは全て `ashiato-demo-2026`）
  - `ashiato_demo` … サンプル旅「Japan Grand Tour」の所有者
  - `miki` `riku` `sana` `ken` `yui` … 友達機能用
  - `emma_travels` `minjun_kim` `yuki_hokkaido` `chloe_paris` `wei_formosa`
    `haruto_umi` `sofia_berlin` `liam_sydney` `aoi_yama` `nina_bkk` … モブ10名
- マスターアカウント: `iino_matcha`（superadmin）

---

## 主要な置き場所

```
app/(tabs)/        ホーム(map) / 御朱印(goshuin) / 発見(explore)
app/trip/[id]/     旅の地図・共有カード・ジャーナル(book)・編集・stop・製本(bind)
app/cart.tsx       ① 注文かご
app/checkout.tsx   ② 連絡先・お届け先・送料・決済（1画面）
app/order/[id].tsx ③ ご購入ありがとうございました
app/admin/         管理コンソール（Japan / Prefectures / Spots / Manage）
lib/i18n.ts        辞書と t()。localizeMatchaUrl もここ
lib/api.ts         Supabaseアクセス層（ほぼ全てのクエリ）
lib/photobook/     台割(plan) と 紙面描画(render.web)
lib/ugc/           シェアカードの座標計算（緯度経度→日本地図SVG）
components/map/    Mapbox（.web / .native で分割）
lib/exif.ts        写真のEXIF（撮影日時・緯度経度）を自前で読む
lib/shareImage.*   カード画像をSNSへ（web=Web Share API / native=共有シート）
lib/cardShot.*     ネイティブでカードのビューを写し取って画像にする
lib/autotrip.ts    写真 → 立ち寄り先 → 旅（写真から記録を起こす本体）
supabase/migrations/  0001〜0017。適用済み
```

---

## 写真から旅を起こす（0015）

写真を選ぶだけで旅の記録ができる。手入力の導線はそのまま残す ―― 入り口が
増えただけで、できあがる旅の形は同じ（/trip で普通に編集できる）。

```
入口①  サインアップ → 日本地図の選択 → 「旅してますか？」（初回だけ）
入口②  /map の「あなたの旅」一覧のいちばん上のカード（いつでも）
  ↓
写真選択 → 中央モーダルの中で読込 → 「旅を見ますか？」→ /trip
```

- `lib/exif.ts` … JPEGのAPP1を自前で読む（撮影日時 / 緯度 / 経度の3つだけ）。
  ライブラリは足していない。リトル/ビッグ両方のバイトオーダーに対応
- `lib/autotrip.ts` … 12km・8時間で立ち寄り先に割り、同じ市区町村が続いたら
  1つにまとめる。位置の無い写真は時間が近い立ち寄り先へ寄せる
- `nearest_municipality(lat,lng)` … 座標→市区町村。外部ジオコーダは使わず
  `municipalities_master`(1,741件)の代表点から引く。60km超は日本国外と扱う
- **ピンは市区町村の代表点ではなく実際に撮った座標**（`logs.lat/lng`）

### 旅の題

行った場所の名前をそのまま並べる（`titleFromPlaces`）。1か所なら地名、
2〜3か所なら「A, B & C」、4か所以上は「A, B, C +2」。**AIは使わない。**
Gemini を通していた Edge Function とシークレットは 0017 と一緒に廃止した。

作られる旅は **既定で public**（Exploreに並び、共有もそのままできる）。
見せたくない旅は /trip/[id]/edit で private に落とす。

---

## 製本の購入（0014）

```
bind「かごに入れる」→ 全ページを焼いて Storage へ → cart_items に1行
  ↓
/cart          削除だけできる。冊数は増やせない
  ↓
/checkout      お届けエリアを選ぶと送料が即確定
  ↓ checkout_cart()   かご→orders + order_items + books(status='ordered')、かごは空に
                      この時点で admin_notifications に order_placed を1件
  ↓ mark_order_paid() ここを通ったときだけ paid。order_paid を1件（二度目は無視）
/order/[id]    控えを出して、地図へ戻るか注文履歴へ
```

- **かごに入れた時点で全ページを画像として保存する**。旅をあとから編集しても
  届く本は変わらない。印刷所に渡すのは `order_items.page_urls`
- 金額はクライアントから受け取らない。`checkout_cart()` がDBの単価から組み直す
- **送料はお届けエリア別の一律料金**（0016）。冊数にも小計にもよらない。
  日本は east-asia に含む。金額の正は `shipping_fee_for(region)`

  | region | | ¥ |
  |---|---|---|
  | `east-asia` | 日本・韓国・台湾・香港・中国 | 1,000 |
  | `southeast-asia` | タイ・ベトナム・シンガポールなど | 1,300 |
  | `west` | ヨーロッパ・北米・オセアニア | 2,200 |
  | `other` | 南米・中東・アフリカなど | 2,500 |
- Stripe は未接続。`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` が入るまで注文は
  `pending` のまま止まり、決済画面にその旨を出す（黙って成功にしない）。
  鍵を入れたら `app/checkout.tsx` の `if (STRIPE_KEY)` の場所に決済を挟む

---

## 未着手・残件

- Stripe の接続（かご〜注文〜通知は動いている。カード決済だけ未接続）
- 印刷所への入稿（`order_items.page_urls` を渡す先が未定）
- 記事→アプリの導線（MATCHAの記事に「My Japanに保存」を埋める）— 集客の本体
- 「MATCHA 200」を制覇の軸にする案（47都道府県だと天井が低い）
- 管理画面は英語のまま（意図的）。プライバシーポリシーは正文が英語で、
  表示言語への翻訳ボタンを持つ
- ネイティブビルドは未検証（Web運用が前提）。
  **SNS共有のネイティブ経路（expo-sharing + react-native-view-shot）は
  実機で未確認。** Webは Web Share API で確認済み
