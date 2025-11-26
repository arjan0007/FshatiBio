import Link from 'next/link';
import SearchBar from './SearchBar';

export default function Header() {
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth_token');

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-green-700">
            🥛 FshatiBio
          </Link>
          <SearchBar />
          <nav className="flex gap-4">
            <Link href="/products" className="text-gray-700 hover:text-green-700">
              Produktet
            </Link>
            <Link href="/cart" className="text-gray-700 hover:text-green-700">
              Shporta
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/orders" className="text-gray-700 hover:text-green-700">
                  Porositë
                </Link>
                <Link href="/notifications" className="text-gray-700 hover:text-green-700 relative">
                  Njoftimet
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-green-700">
                  Profili
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-gray-700 hover:text-green-700">
                Kyçu
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

