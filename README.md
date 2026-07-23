# 足跡 (Ashiato)

旅の記録 × 御朱印コレクション × UGC生成 — 日本版Polarsteps。

Expo (React Native) + Supabase。iOS / Android / Web で動作します。

## デザイン言語「墨と朱」

和紙(washi)を地に、藍(indigo)を構造色、朱(vermilion)を差し色に。
カード・箱を多用せず、余白・極細罫線・明朝体で構成する編集的スタイル。
ライト／ダーク両対応（`lib/theme.ts`, `lib/useTheme.ts`）。

## セットアップ

```bash
npm install
npm run web      # ブラウザで確認
npm run ios      # iOS シミュレータ（要 Mac / EAS）
npm run android  # Android エミュレータ
```

Supabase を接続する場合は `.env.example` を `.env` にコピーして値を設定します。
未設定の場合は `lib/mock.ts` のモックデータで全画面が動作します。

## 画面構成（実装済み）

| # | 画面 | ルート |
|---|------|--------|
| 1 | ログイン / 会員登録 | `app/(auth)/login.tsx` |
| 2 | 初期設定（通知・プロフィール） | `app/(auth)/onboarding.tsx` |
| 3 | マイマップ（ホーム） | `app/(tabs)/map.tsx` |
| 4 | 旅一覧（タイムライン） | `app/(tabs)/trips.tsx` |
| 5 | 御朱印帳 | `app/(tabs)/goshuin.tsx` |
| 6 | 発見（Explore） | `app/(tabs)/explore.tsx` |
| 7 | 旅の新規作成 | `app/trip/new.tsx` |
| 8 | 旅の詳細（ルート＆タイムライン） | `app/trip/[id]/index.tsx` |
| 9 | Step作成・編集 | `app/trip/[id]/step/*` |
| 10 | 御朱印詳細 | `app/goshuin/[id].tsx` |
| 13 | シェア＆保存 | `app/share.tsx` |
| 14 | UGCギャラリー | `app/gallery.tsx` |
| 16 | プロフィール＆設定 | `app/(tabs)/profile.tsx` |

### ガワのみ（エンジン未実装）

| # | 画面 | 備考 |
|---|------|------|
| 11 | 軌跡カード作成 | 設定UIあり。高画質レンダリング(Skia)は未実装 |
| 12 | UGC生成プレビュー | 簡易プレビューのみ |
| 15 | 製本注文 | フロー提示のみ。PDF生成・決済は未実装 |

### 今回対象外

管理画面（#17-19、Web / Next.js）は別途。

## 方針メモ

- 位置情報は常時取得しない。訪問地は Step 作成時の**手動チェックイン**で記録し、
  都道府県の選択に応じて御朱印を記帳する。
- DBスキーマは `supabase/migrations/` を参照。

## ディレクトリ

```
app/           expo-router の画面
components/     共通UI（ui.tsx / Header / Stamp / ProgressArc / UgcCard / StepEditor）
lib/           theme / useTheme / supabase / mock
supabase/      マイグレーション
```
