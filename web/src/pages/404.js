import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>404 - Faqja nuk u gjet | FshatiBio</title>
      </Head>
      
      <div className="text-center">
        <h1 className="text-9xl font-bold text-green-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Faqja nuk u gjet</h2>
        <p className="text-gray-600 mb-8">
          Na vjen keq, por faqja që po kërkoni nuk ekziston ose është zhvendosur.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Kthehu në Faqen Kryesore
          </Link>
          <Link
            href="/products"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Shiko Produktet
          </Link>
        </div>
      </div>
    </div>
  );
}

