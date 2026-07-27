/**
 * ネイティブは OS がキーボード分を押し上げるため、追加の余白は不要。
 */
export function useKeyboardInset(): number {
  return 0;
}

export function scrollInputIntoView(_delayMs?: number) {}
