import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only HTML shell. Ensures the app fills the visual viewport on mobile
 * (dynamic viewport height so the bottom tab bar is never cut off) and that
 * layout is full-width and doesn't scroll horizontally.
 */
const css = `
html, body { margin: 0; padding: 0; height: 100%; }
#root { display: flex; flex-direction: column; min-height: 100%; width: 100%; }
/* fill the *visible* viewport on mobile so the footer isn't below the fold */
@supports (height: 100dvh) {
  html, body, #root { min-height: 100dvh; }
}
/* keep the top (back button etc.) clear of the notch / status bar on mobile */
body {
  overflow-x: hidden;
  overscroll-behavior-y: none;
  -webkit-text-size-adjust: 100%;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
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
