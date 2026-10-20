import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

/**
 * Mobil Safari: 100dvh ilk paint'te görünür alandan büyük → üst kırpılır, altta boşluk.
 * visualViewport yüksekliğini ilk script'te sabitle → FOUC / hydrate kayması olmaz.
 */
const appHeightScript = `
(function () {
  function setAppHeight() {
    var h = window.visualViewport && window.visualViewport.height
      ? window.visualViewport.height
      : window.innerHeight;
    if (!h || h < 1) h = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', h + 'px');
  }
  setAppHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
    window.visualViewport.addEventListener('scroll', setAppHeight);
  }
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', function () {
    setTimeout(setAppHeight, 50);
  });
})();
`;

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
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/ikon/apple-touch-icon.png" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
        <script dangerouslySetInnerHTML={{ __html: appHeightScript }} />
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

:root {
  /* Script gelmeden önce: küçük viewport — Safari chrome ile ilk paint uyumlu */
  --app-height: 100svh;
}

html, body, #root {
  height: 100%;
  height: 100svh;
  height: var(--app-height, 100svh);
  max-height: 100svh;
  max-height: var(--app-height, 100svh);
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

/* RN Web Image varsayılan object-fit:fill maskotu kırpabiliyor */
img {
  object-fit: contain !important;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a241a;
  }
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
    height: auto;
    max-height: none;
    padding: 28px 16px;
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
    padding-top: 0;
    padding-bottom: 0;
  }
}

/* Gerçek telefonda: çentik CSS'ten; tarayıcı chrome --app-height / svh ile */
@media (max-width: 519px) {
  #root {
    /* İlk paint'ten görünür — JS inset beklenmez (FOUC yok) */
    padding-top: max(env(safe-area-inset-top, 0px), 12px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}

@media (orientation: landscape) and (max-width: 900px) {
  html, body, #root {
    height: 100%;
    height: 100svh;
    height: var(--app-height, 100svh);
    max-height: var(--app-height, 100svh);
  }

  #root {
    padding-top: max(env(safe-area-inset-top, 0px), 8px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}
`;
