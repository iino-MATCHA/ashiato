import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only HTML shell. Ensures the app fills the visual viewport on mobile
 * (dynamic viewport height so the bottom tab bar is never cut off) and that
 * layout is full-width and doesn't scroll horizontally.
 */
const css = `
/* Fixed-height app shell: the app always fits the VISIBLE viewport exactly,
   so the bottom tab bar is never cut off. Screens scroll internally. */
html { height: 100%; }
body {
  margin: 0;
  height: 100%;
  box-sizing: border-box; /* safe-area paddings are inside the height */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  overflow-x: hidden;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
}
@supports (height: 100dvh) {
  body { height: 100dvh; } /* dynamic viewport = excludes browser chrome */
}
#root { display: flex; flex-direction: column; height: 100%; width: 100%; }
/* no browser focus ring anywhere — the app draws its own underline/borders.
   (covers :focus and :focus-visible, incl. RNW's inner focus outlines) */
*, *:focus, *:focus-visible { outline: none !important; }
input, textarea, select, [contenteditable] {
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 0;
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
