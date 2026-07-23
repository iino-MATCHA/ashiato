import { Redirect } from 'expo-router';

/**
 * エントリ。MVPでは認証状態の永続化前提を置かず、まずログイン画面へ。
 * （将来: Supabaseセッションがあれば (tabs) へ redirect する）
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
