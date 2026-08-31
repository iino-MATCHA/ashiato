# My Japan（リポジトリ名: ashiato）

日本を旅した記録を残し、都道府県ごとに御朱印を集め、旅をジャーナル（PDF）に
できるアプリ。運営は株式会社MATCHA。UIは5言語（en / ja / ko / zh-Hans / zh-Hant）。
印刷版の販売は 2026-08 に取りやめ、アプリの軸はアフィリエイトとMATCHAの体験向上に移した。

- 本番: https://www.my-japan-matcha.com
- 構成: Expo (React Native) + expo-router + Supabase。**Web運用が前提**（Vercel）
- リポジトリ名・DBユーザー・Storageパス・bundle id は旧名 `ashiato` のまま
  （変えると既存データと繋がらないので、意図的にそのまま）

## まず読むもの

| 知りたいこと | どこ |
|---|---|
| 開発の決まりごと・ハマりどころ（**開発前に必読**） | [`CLAUDE.md`](CLAUDE.md) |
| 引き継ぎの段取り（権限・秘密情報・残作業） | [`docs/HANDOVER.md`](docs/HANDOVER.md) |
| アプリ・管理画面・運営道具の使い方 | [`docs/MANUAL.md`](docs/MANUAL.md) |
| ジャーナル（PDF）の設計思想 | [`docs/photobook.md`](docs/photobook.md) |
| ドメインを引き継ぐか取り直すかの判断材料 | [`docs/DOMAIN-DECISION.md`](docs/DOMAIN-DECISION.md) |
| **ドメインを変えるときの手順** | [`docs/DOMAIN-MIGRATION.md`](docs/DOMAIN-MIGRATION.md) |

## 動かす

```bash
npm install
# .env に2行（値は Vercel の環境変数からコピー）
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
#   EXPO_PUBLIC_MAPBOX_TOKEN=...   # 地図を出すなら
npx expo start --web
```

`.env` が無くてもモックデータで起動する。デプロイは Vercel が main を見て自動
（`vercel.json` が `npx expo export -p web` → `dist` → SPA rewrite を設定）。

## 置き場所の地図

```
app/(tabs)/        ホーム(map) / 御朱印(goshuin) / 発見(explore)
app/trip/[id]/     旅の地図・共有カード・ジャーナル(book)・その編集(bind)
app/journals.tsx   旅ごとのジャーナル(PDF)一覧
app/admin/         管理コンソール（日本語・管理者のみ）
lib/i18n.ts        5言語の辞書と t()
lib/api.ts         Supabaseアクセス層（ほぼ全てのクエリ）
lib/photobook/     ジャーナルの台割と紙面描画
lib/quiz/          都道府県診断
scripts/           MATCHA記事の取り込み道具（読み取り専用）
supabase/migrations/  DBの変更履歴。SQL Editor に手で貼る運用
```

DBの変更はサービスキーを環境に置かず、migrationファイルを
Supabase の SQL Editor に手で貼る運用にしている（理由は HANDOVER §3）。
