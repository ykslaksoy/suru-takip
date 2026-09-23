import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#2d6a4f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SürüYön" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="description" content="SürüYön — koyun ve kuzu sürü yönetimi" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/** SuperAraç ile aynı fikir: masaüstünde 390px telefon kolonu, çerçeve görünür. */
const webStyles = `
*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
  box-sizing: border-box;
}

html {
  overflow: hidden;
}

body {
  background-color: #f4f7f0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  overscroll-behavior: none;
  margin: 0;
}

#root {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

/* Masaüstü / geniş ekran: SuperAraç tarzı telefon kolonu (yatay dahil) */
@media (min-width: 520px) {
  body {
    background: #e8ecee;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 12px;
    overflow: auto;
  }

  #root {
    width: 100%;
    max-width: 390px;
    height: min(844px, calc(100dvh - 24px));
    max-height: calc(100dvh - 24px);
    border-radius: 28px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(17, 24, 39, 0.08),
      0 8px 32px rgba(17, 24, 39, 0.12);
    background-color: #f4f7f0;
  }
}

/* Gerçek telefonda tam ekran + çentik / Safari toolbar payı */
@media (max-width: 519px) {
  #root {
    padding-top: max(env(safe-area-inset-top, 0px), 8px);
    padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
  }
}
`;
