import type { AppProps } from "next/app"
import Head from "next/head"
import "tailwindcss/tailwind.css"
import Footer from "../components/Footer"
import "../public/global.css"

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return <div className="bg-slate-50 dark:bg-slate-700 min-h-screen flex flex-col items-center justify-between text-slate-900 dark:text-slate-100">
    <Head>
      <title>{router.pathname.substring(1).replace(/^\w/, w => w.toUpperCase())} | The GUOBA Project</title>
      <link rel="icon" href="/favicon.ico" />
      <meta httpEquiv="content-language" content="en-us"></meta>
    </Head>

    <div className="w-full">
      <div className="p-4 flex flex-col w-full flex-1 px-1 lg:px-20 items-center justify-center">
        <Component {...pageProps} location={router.asPath} />
      </div>
    </div>

    <Footer location={router.asPath} marginBottom={3} />
  </div>
}
