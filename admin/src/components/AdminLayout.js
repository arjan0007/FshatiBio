import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const sidebarItems = [
    { name: 'Dashboard', href: '/', icon: '📊', active: router.pathname === '/' },
    { name: 'Analitikë & Raporte', href: '/admin/analytics', icon: '📈', active: router.pathname === '/admin/analytics' },
    { name: 'Menaxho Produktet', href: '/admin/products', icon: '📦', active: router.pathname === '/admin/products' },
    { name: 'Menaxho Porositë', href: '/admin/orders', icon: '📋', active: router.pathname === '/admin/orders' },
    { name: 'Furnizuesit', href: '/admin/suppliers', icon: '🚚', active: router.pathname === '/admin/suppliers' },
    { name: 'Kuponat', href: '/admin/coupons', icon: '🎫', active: router.pathname === '/admin/coupons' },
    { name: 'Vlerësimet', href: '/admin/reviews', icon: '⭐', active: router.pathname === '/admin/reviews' },
    { name: 'Kategoritë', href: '/admin/categories', icon: '📁', active: router.pathname === '/admin/categories' },
    { name: 'Bannerat', href: '/admin/banners', icon: '🖼️', active: router.pathname === '/admin/banners' },
    { name: 'Përdoruesit', href: '/admin/users', icon: '👤', active: router.pathname === '/admin/users' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  const fetchUnreadChatCount = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      // Try to get unread conversations count from chat API
      try {
        const chatResponse = await axios.get(`${API_URL}/chat/admin/conversations/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (chatResponse.data.success) {
          setUnreadChatCount(chatResponse.data.data.unread_count || 0);
          return;
        }
      } catch (chatError) {
        console.log('Chat unread count API not available, falling back to notifications');
      }

      // Fallback: Get all unread notifications to filter chat ones
      const notifResponse = await axios.get(`${API_URL}/notifications?unread_only=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (notifResponse.data.success) {
        const chatNotifications = notifResponse.data.data.notifications.filter(
          (n) => {
            const isChatLink = n.link_url && n.link_url.includes('/admin/chat');
            const isChatTitle = n.title === 'Mesazh i ri në Chat';
            const isChatType = n.type === 'system' && n.title && n.title.includes('Chat');
            return isChatLink || isChatTitle || isChatType;
          }
        );
        setUnreadChatCount(chatNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching unread chat count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadChatCount();

    // Refresh count every 10 seconds
    const interval = setInterval(fetchUnreadChatCount, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [router.pathname]);

  return (
    <div className="min-h-screen bg-forest-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} gradient-forest transition-all duration-300 ease-in-out flex flex-col fixed h-full z-50 shadow-warm-md`}>
        {/* Sidebar Header */}
        <div className={`p-5 border-b border-white/10 ${!sidebarOpen ? 'px-3' : ''}`}>
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center flex-col gap-3'}`}>
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'flex-col'}`}>
              {/* Leaf Logo */}
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
                </svg>
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <h1 className="font-display text-xl text-white leading-tight">FshatiBio</h1>
                  <p className="text-xs text-forest-200 font-sans">Admin Panel</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 hover:bg-white/10 rounded-lg transition-all duration-200 ${!sidebarOpen ? 'mt-2' : ''}`}
              title={sidebarOpen ? 'Mbyll Sidebar' : 'Hap Sidebar'}
            >
              <span className="text-forest-200 hover:text-white transition-colors text-sm">
                {sidebarOpen ? '◀' : '▶'}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {sidebarItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                title={!sidebarOpen ? item.name : ''}
                className={`group relative flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-2.5 rounded-xl transition-all duration-200 ${
                  item.active
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-forest-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <span className="font-medium text-sm animate-fade-in whitespace-nowrap">{item.name}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-forest-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.name}
                  </div>
                )}
              </a>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-white/10 ${!sidebarOpen ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Dil' : ''}
            className={`w-full flex items-center ${sidebarOpen ? 'gap-3 justify-center' : 'justify-center'} px-4 py-2.5 rounded-xl bg-red-600/80 text-white hover:bg-red-600 transition-all duration-200 font-medium text-sm`}
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {sidebarOpen && <span className="animate-fade-in">Dil</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen bg-forest-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <div className="bg-white border-b border-forest-100 shadow-warm sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl text-forest-900">
                {sidebarItems.find(item => item.active)?.name || 'Admin Panel'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/orders"
                className="text-forest-700 hover:text-forest-900 font-semibold text-sm transition-colors px-3 py-1.5 rounded-xl hover:bg-forest-50"
              >
                Porositë
              </a>
              <a
                href="/admin/chat"
                className={`relative inline-flex items-center gap-2 font-semibold text-sm transition-colors px-3 py-1.5 rounded-xl ${
                  router.pathname === '/admin/chat'
                    ? 'bg-forest-100 text-forest-800'
                    : 'text-forest-700 hover:text-forest-900 hover:bg-forest-50'
                }`}
              >
                <span className="relative">
                  💬 Chat Live
                  {unreadChatCount > 0 && router.pathname !== '/admin/chat' && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse shadow-lg">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
