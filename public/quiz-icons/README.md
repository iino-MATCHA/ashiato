# 診断の選択肢の絵

`/quiz` の「この旅で、いちばん大事にしたいことは？」の18択に添える絵を置く場所。
**ファイル名は選択肢の id + `.svg`。** id は `lib/quiz/questions.ts` の
QuizOption.id と一致させる。

置いたあと `components/quiz/QuizIcon.tsx` の `HAS_ICON` に同じ id を足すと出る
（足さなければ何も出ない ―― 描き途中でも画面は崩れない）。

| ファイル名 | 選択肢 |
|---|---|
| `ramen.svg` | ラーメン・郷土料理 |
| `sake.svg` | 日本酒蔵めぐり |
| `sweets.svg` | スイーツ・カフェ |
| `shrines.svg` | 古い神社・寺院 |
| `castles.svg` | 城 |
| `crafts.svg` | 伝統工芸・陶芸 |
| `festivals.svg` | 祭り・地元の行事 |
| `cityShopping.svg` | 都会・ショッピング |
| `nightlife.svg` | 夜の街・バー |
| `artMuseums.svg` | 美術館・ギャラリー |
| `onsen.svg` | 温泉 |
| `mountainHikes.svg` | 山歩き・トレイル |
| `snow.svg` | 雪・スキー |
| `beaches.svg` | ビーチ・ダイビング |
| `island.svg` | 離島 |
| `wildlife.svg` | 野生動物との出会い |
| `gardens.svg` | 庭園・花畑 |
| `popCulture.svg` | アニメ・ポップカルチャー |

## 絵の仕様（発注時はこのまま渡せる）

- **版面 28×28**。余白を上下左右1pxずつ空け、絵は 26×26 に収める
- 表示は 28×28 CSS px 固定。倍率は端末任せ（3倍端末で84px相当）
- **SVGで作る。** 線画なので拡大で滲まず、1ファイルで全倍率に足りる。
  ラスタなら 84×84 以上の透明PNG。**webpは使わない** ―― webでは問題ないが、
  ネイティブのiOS/Androidで扱いが揺れる
- 線は 1.5px 相当。端と角は丸める（アプリの罫線と同じ表情）
- **色は2色だけ。輪郭 `#4A453C`（墨）、差し色 `#69AF00`（MATCHA green）**。
  朱色 `#C4432B` は御朱印専用なので使わない
- 塗りは置かず線だけで持たせる（白い面に馴染み、暗い面でも効く）
- **26pxで読めることが条件。** 狭い所に線を寄せると潰れる
