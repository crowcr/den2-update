import { Html, Head, Main, NextScript } from 'next/document'
import { Toaster } from 'react-hot-toast';

export default function Document() {
  return (
    <Html lang="ja">
      <Head />
      <body>
        <Main />
        <NextScript />
        <Toaster position="bottom-right" />
      </body>
    </Html>
  )
}
