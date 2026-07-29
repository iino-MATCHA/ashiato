# 足跡 (Ashiato) — 開発メモ

日本を旅した記録を残し、都道府県ごとに御朱印を集め、旅をジャーナル(PDF)にするアプリ。
運営は株式会社MATCHA。Expo(React Native) + expo-router + Supabase、Web(Vercel)が主戦場。

- 本番: https://ashiato-nine.vercel.app
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
- **都道府県を検索対象にしない**（チェックイン時）。市区町村か観光エリアを選ばせる
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
app/trip/[id]/     旅の地図・共有カード・ジャーナル(book)・編集・stop
app/admin/         管理コンソール（Japan / Prefectures / Spots / Manage）
lib/i18n.ts        辞書と t()。localizeMatchaUrl もここ
lib/api.ts         Supabaseアクセス層（ほぼ全てのクエリ）
lib/photobook/     台割(plan) と 紙面描画(render.web)
lib/ugc/           シェアカードの座標計算（緯度経度→日本地図SVG）
components/map/    Mapbox（.web / .native で分割）
supabase/migrations/  0001〜0013。適用済み
```

---

## 未着手・残件

- 印刷版の製本（PDFはできている。決済と入稿が未着手）
- 記事→アプリの導線（MATCHAの記事に「足跡に保存」を埋める）— 集客の本体
- 「MATCHA 200」を制覇の軸にする案（47都道府県だと天井が低い）
- 管理画面とプライバシーポリシーは英語のまま（意図的）
- ネイティブビルドは未検証（Web運用が前提）
