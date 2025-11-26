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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-2xl transition-all duration-300 flex flex-col fixed h-full z-50`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">F</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">FshatiBio</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white text-xl font-bold">F</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-gray-600">{sidebarOpen ? '◀' : '▶'}</span>
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </a>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Dil</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {sidebarItems.find(item => item.active)?.name || 'Admin Panel'}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <a href="/admin/orders" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Porositë</a>
                <a href="/admin/chat" className={`relative inline-flex items-center font-medium transition-colors ${router.pathname === '/admin/chat' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'}`}>
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
        </div>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

