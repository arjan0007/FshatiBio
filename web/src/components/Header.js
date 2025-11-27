import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import SearchBar from './SearchBar';
import ConfirmModal from './ConfirmModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Header() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    setIsAuthenticated(!!token);
    
    if (token) {
      fetchUnreadCount();
      // Refresh count every 10 seconds
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [router.pathname]);

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setProfileDropdownOpen(false);
    setShowLogoutModal(false);
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  return (
    <>
      {/* Top Gradient Bar */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
      
      <header className={`bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-xl' : 'shadow-md'
      }`}>
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4">
          {/* Top Row - Logo, Search, Menu Button */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            {/* Logo */}
            <Link 
              href="/" 
              className="group flex items-center gap-1.5 sm:gap-2 md:gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:rotate-12">
                  <span className="text-lg sm:text-xl md:text-2xl">🌱</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl md:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
                  FshatiBio
                </span>
                <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-medium hidden sm:block">
                  Produkte Organike
                </span>
              </div>
            </Link>

            {/* Search Bar - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-2 md:mx-4">
              <SearchBar />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 md:gap-2">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/notifications" 
                  className={`group relative inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    router.pathname === '/notifications' 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-md' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:text-green-700'
                  }`}
                >
                  <div className="relative">
                    <span className="text-lg md:text-xl transform group-hover:scale-110 transition-transform duration-300">🔔</span>
                    {unreadCount > 0 && router.pathname !== '/notifications' && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] md:text-xs font-black rounded-full min-w-[18px] md:min-w-[20px] h-4 md:h-5 flex items-center justify-center px-1 md:px-1.5 animate-pulse shadow-lg z-10 border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline text-sm md:text-base">Njoftimet</span>
                </Link>
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`group inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      router.pathname === '/profile' || router.pathname.startsWith('/profile')
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-md' 
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:text-green-700'
                    }`}
                  >
                    <span className="text-lg md:text-xl transform group-hover:scale-110 transition-transform duration-300">👤</span>
                    <span className="hidden md:inline text-sm md:text-base">Profili</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden z-50 animate-fade-in">
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          <span>⚙️</span>
                          <span>Menaxhimi i Shpejtë</span>
                        </h3>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <span className="text-xl">👤</span>
                          <span className="font-medium">Profili Im</span>
                        </Link>
                        <Link
                          href="/profile/edit"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <span className="text-xl">✏️</span>
                          <span className="font-medium">Ndrysho Profil</span>
                        </Link>
                        <Link
                          href="/profile/change-password"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <span className="text-xl">🔐</span>
                          <span className="font-medium">Ndrysho Fjalëkalimin</span>
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <Link
                          href="/orders"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <span className="text-xl">📋</span>
                          <span className="font-medium">Porositë e Mia</span>
                        </Link>
                        <Link
                          href="/addresses"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          <span className="text-xl">📍</span>
                          <span className="font-medium">Adresat e Mia</span>
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                        >
                          <span className="text-xl">🛒</span>
                          <span className="font-medium">Shporta</span>
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setShowLogoutModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <span className="text-xl">🚪</span>
                          <span className="font-medium">Dil</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="group inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-300"
              >
                <span className="text-lg md:text-xl transform group-hover:scale-110 transition-transform duration-300">🔑</span>
                <span className="hidden md:inline text-sm md:text-base">Kyçu</span>
              </Link>
            )}
          </nav>
          </div>
        </div>

        {/* Mobile Search Bar - Shown when menu is open */}
        {mobileMenuOpen && (
          <div className="md:hidden px-3 sm:px-4 pb-3 border-t border-gray-100">
            <div className="pt-3">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
            <nav className="px-3 sm:px-4 py-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      router.pathname === '/notifications'
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">🔔</span>
                    <span>Njoftimet</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      router.pathname === '/profile' || router.pathname.startsWith('/profile')
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">👤</span>
                    <span>Profili Im</span>
                  </Link>
                  
                  <Link
                    href="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <span className="text-xl">✏️</span>
                    <span>Ndrysho Profil</span>
                  </Link>
                  
                  <Link
                    href="/profile/change-password"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <span className="text-xl">🔐</span>
                    <span>Ndrysho Fjalëkalimin</span>
                  </Link>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-purple-50 transition-all"
                  >
                    <span className="text-xl">📋</span>
                    <span>Porositë e Mia</span>
                  </Link>
                  
                  <Link
                    href="/addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-indigo-50 transition-all"
                  >
                    <span className="text-xl">📍</span>
                    <span>Adresat e Mia</span>
                  </Link>
                  
                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-orange-50 transition-all"
                  >
                    <span className="text-xl">🛒</span>
                    <span>Shporta</span>
                  </Link>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <span className="text-xl">🚪</span>
                    <span>Dil</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-700 hover:bg-green-50 transition-all"
                >
                  <span className="text-xl">🔑</span>
                  <span>Kyçu</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

    {/* Logout Confirmation Modal */}
    <ConfirmModal
      isOpen={showLogoutModal}
      onClose={() => setShowLogoutModal(false)}
      onConfirm={handleLogout}
      title="Dil nga Llogaria"
      message="A jeni të sigurt që dëshironi të dilni nga llogaria juaj?"
      confirmText="Po, Dil"
      cancelText="Anulo"
      type="warning"
    />
    </>
  );
}

