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
      {/* Announcement Bar */}
      <div className="bg-[#1b4332] text-[#fefae0] text-sm py-2 text-center font-medium tracking-wide">
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4 text-[#f4a261]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
          Dorëzim falas për porosi mbi 500 L — Produkte 100% BIO të certifikuara
          <svg className="w-4 h-4 text-[#f4a261]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
          </svg>
        </span>
      </div>

      <header className={`bg-white/95 backdrop-blur-md border-b border-[#d8f3dc] sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-[0_4px_20px_rgba(45,106,79,0.12)]' : 'shadow-[0_2px_10px_rgba(45,106,79,0.06)]'
      }`}>
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4">
          {/* Top Row - Logo, Search, Menu Button */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2 md:gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-[#2d6a4f] rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(45,106,79,0.35)] group-hover:shadow-[0_6px_20px_rgba(45,106,79,0.45)] transition-all duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#fefae0]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl sm:text-2xl font-bold text-[#1b4332] leading-tight">
                  FshatiBio
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#52b788] font-semibold tracking-wide hidden sm:block uppercase">
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
              className="md:hidden p-2 rounded-xl text-[#2d6a4f] hover:bg-[#d8f3dc] transition-colors"
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
                      ? 'bg-[#d8f3dc] text-[#2d6a4f] border-b-2 border-[#f4a261]'
                      : 'text-[#2d6a4f] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
                  }`}
                >
                  <div className="relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && router.pathname !== '/notifications' && (
                      <span className="absolute -top-2 -right-2 bg-[#e76f51] text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md z-10 border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline text-sm">Njoftimet</span>
                </Link>
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`group inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      router.pathname === '/profile' || router.pathname.startsWith('/profile')
                        ? 'bg-[#d8f3dc] text-[#2d6a4f] border-b-2 border-[#f4a261]'
                        : 'text-[#2d6a4f] hover:bg-[#d8f3dc] hover:text-[#1b4332]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden md:inline text-sm">Profili</span>
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
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgba(45,106,79,0.15)] border border-[#d8f3dc] overflow-hidden z-50 animate-fade-in">
                      <div className="p-3 bg-gradient-to-r from-[#d8f3dc] to-[#b7e4c7] border-b border-[#d8f3dc]">
                        <h3 className="font-bold text-[#1b4332] text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#2d6a4f]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                          </svg>
                          <span>Menaxhimi i Shpejtë</span>
                        </h3>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2d6a4f] hover:bg-[#f0faf2] hover:text-[#1b4332] transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-sm">Profili Im</span>
                        </Link>
                        <Link
                          href="/profile/edit"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2d6a4f] hover:bg-[#f0faf2] hover:text-[#1b4332] transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="font-medium text-sm">Ndrysho Profil</span>
                        </Link>
                        <Link
                          href="/profile/change-password"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2d6a4f] hover:bg-[#f0faf2] hover:text-[#1b4332] transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="font-medium text-sm">Ndrysho Fjalëkalimin</span>
                        </Link>
                        <div className="border-t border-[#d8f3dc] my-1"></div>
                        <Link
                          href="/orders"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2d6a4f] hover:bg-[#f0faf2] hover:text-[#1b4332] transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#f4a261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="font-medium text-sm">Porositë e Mia</span>
                        </Link>
                        <Link
                          href="/addresses"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2d6a4f] hover:bg-[#f0faf2] hover:text-[#1b4332] transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#f4a261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium text-sm">Adresat e Mia</span>
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[#2d6a4f] hover:bg-[#f0faf2] hover:text-[#1b4332] transition-colors"
                        >
                          <svg className="w-4 h-4 text-[#f4a261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium text-sm">Shporta</span>
                        </Link>
                        <div className="border-t border-[#d8f3dc] my-1"></div>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setShowLogoutModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[#e76f51] hover:bg-[#fff3ef] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-medium text-sm">Dil</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-[#1b4332] transition-all shadow-[0_4px_14px_rgba(45,106,79,0.3)] hover:shadow-[0_6px_20px_rgba(45,106,79,0.4)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Kyçu</span>
              </Link>
            )}
          </nav>
          </div>
        </div>

        {/* Mobile Search Bar - Shown when menu is open */}
        {mobileMenuOpen && (
          <div className="md:hidden px-3 sm:px-4 pb-3 border-t border-[#d8f3dc]">
            <div className="pt-3">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#d8f3dc] bg-white animate-fade-in">
            <nav className="px-3 sm:px-4 py-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                      router.pathname === '/notifications'
                        ? 'bg-[#d8f3dc] text-[#2d6a4f]'
                        : 'text-[#2d6a4f] hover:bg-[#f0faf2]'
                    }`}
                  >
                    <svg className="w-5 h-5 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Njoftimet</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-[#e76f51] text-white text-xs font-black rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                      router.pathname === '/profile' || router.pathname.startsWith('/profile')
                        ? 'bg-[#d8f3dc] text-[#2d6a4f]'
                        : 'text-[#2d6a4f] hover:bg-[#f0faf2]'
                    }`}
                  >
                    <svg className="w-5 h-5 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profili Im</span>
                  </Link>

                  <Link
                    href="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#2d6a4f] hover:bg-[#f0faf2] transition-all"
                  >
                    <svg className="w-5 h-5 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Ndrysho Profil</span>
                  </Link>

                  <Link
                    href="/profile/change-password"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#2d6a4f] hover:bg-[#f0faf2] transition-all"
                  >
                    <svg className="w-5 h-5 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Ndrysho Fjalëkalimin</span>
                  </Link>

                  <div className="border-t border-[#d8f3dc] my-2"></div>

                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#2d6a4f] hover:bg-[#f0faf2] transition-all"
                  >
                    <svg className="w-5 h-5 text-[#f4a261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Porositë e Mia</span>
                  </Link>

                  <Link
                    href="/addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#2d6a4f] hover:bg-[#f0faf2] transition-all"
                  >
                    <svg className="w-5 h-5 text-[#f4a261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Adresat e Mia</span>
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#2d6a4f] hover:bg-[#f0faf2] transition-all"
                  >
                    <svg className="w-5 h-5 text-[#f4a261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Shporta</span>
                  </Link>

                  <div className="border-t border-[#d8f3dc] my-2"></div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#e76f51] hover:bg-[#fff3ef] transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Dil</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-[#2d6a4f] hover:bg-[#d8f3dc] transition-all"
                >
                  <svg className="w-5 h-5 text-[#52b788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
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
