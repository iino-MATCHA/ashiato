/**
 * 新しいパスワードの条件。
 * 既存ユーザーの古いパスワードには遡って適用しない（ログインは今まで通り通る）。
 * これから設定するもの — 新規登録とパスワード変更 — にだけかける。
 */
export const PASSWORD_MIN = 8;

/** 満たしていなければ辞書キーを返す。満たしていれば null。 */
export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return 'password.rule';
  if (!/[A-Za-z]/.test(pw)) return 'password.rule';
  if (!/[0-9]/.test(pw)) return 'password.rule';
  return null;
}
