import Head from 'next/head';
import Link from 'next/link';

function Error({ statusCode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/50 flex items-center justify-center px-4">
      <Head>
        <title>{statusCode ? `${statusCode} - Gabim` : 'Gabim'} - FshatiBio</title>
      </Head>
      
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-green-600 mb-4">
            {statusCode || '?'}
          </h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {statusCode === 404 
              ? 'Faqja nuk u gjet' 
              : statusCode === 500
              ? 'Gabim në server'
              : 'Diçka shkoi keq'}
          </h2>
          <p className="text-gray-600 mb-8">
            {statusCode === 404
              ? 'Na vjen keq, por faqja që po kërkoni nuk ekziston ose është zhvendosur.'
              : 'Na vjen keq për shqetësimin. Ju lutem provoni përsëri më vonë.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
          >
            Kthehu në Faqen Kryesore
          </Link>
          <Link
            href="/products"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all transform hover:scale-105 font-semibold"
          >
            Shiko Produktet
          </Link>
        </div>
        
        {statusCode && statusCode !== 404 && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-green-600 hover:text-green-700 underline text-sm"
          >
            Provoni përsëri
          </button>
        )}
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

