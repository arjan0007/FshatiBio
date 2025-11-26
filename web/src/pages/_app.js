import '../styles/globals.css'
import LiveChat from '../components/LiveChat'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <LiveChat />
    </>
  )
}

