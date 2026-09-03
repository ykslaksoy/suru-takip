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

const webStyles = `
html, body, #root {
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
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
}

#root {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a241a;
  }
}

/* Masaüstünde telefon çerçevesi — uygulama hissi */
@media (min-width: 520px) {
  body {
    background: linear-gradient(145deg, #1a2e1a 0%, #2d6a4f 45%, #40916c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 28px 16px;
    overflow: auto;
  }

  #root {
    width: 100%;
    max-width: 430px;
    height: min(920px, calc(100dvh - 56px));
    max-height: 920px;
    border-radius: 32px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.12),
      0 30px 90px rgba(0, 0, 0, 0.45);
    background-color: #f4f7f0;
  }

  @media (prefers-color-scheme: dark) {
    #root {
      background-color: #1a241a;
    }
  }
}

/* Gerçek telefonda tam ekran + çentik / Safari toolbar payı */
@media (max-width: 519px) {
  #root {
    padding-top: env(safe-area-inset-top, 0px);
    /* Tarayıcı alt çubuğu için minimum pay — içerik kesilmesin */
    padding-bottom: max(env(safe-area-inset-bottom, 0px), 12px);
  }
}

@media (orientation: landscape) and (max-width: 900px) {
  html, body, #root {
    height: 100%;
    height: 100dvh;
    max-height: 100dvh;
  }

  #root {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);
  }
}
`;
