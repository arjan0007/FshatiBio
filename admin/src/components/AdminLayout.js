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
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col fixed h-full z-50 border-r border-gray-200`}>
        {/* Sidebar Header */}
        <div className={`p-6 border-b border-gray-200 ${!sidebarOpen ? 'px-3' : ''}`}>
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center flex-col gap-3'}`}>
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'flex-col'}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white text-xl font-bold">F</span>
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <h1 className="text-lg font-bold text-gray-800">FshatiBio</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ${!sidebarOpen ? 'mt-2' : ''} group`}
              title={sidebarOpen ? 'Mbyll Sidebar' : 'Hap Sidebar'}
            >
              <span className={`text-gray-600 group-hover:text-green-600 transition-colors ${!sidebarOpen ? 'transform rotate-180' : ''}`}>
                {sidebarOpen ? '◀' : '▶'}
              </span>
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
                title={!sidebarOpen ? item.name : ''}
                className={`group relative flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-xl transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                }`}
              >
                <span className={`text-xl flex-shrink-0 ${item.active ? 'animate-pulse' : ''}`}>{item.icon}</span>
                {sidebarOpen && (
                  <span className="font-medium animate-fade-in whitespace-nowrap">{item.name}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.name}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </a>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-gray-200 ${!sidebarOpen ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Dil' : ''}
            className={`w-full flex items-center ${sidebarOpen ? 'gap-3 justify-center' : 'justify-center'} px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105`}
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {sidebarOpen && <span className="animate-fade-in">Dil</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Dil
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
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

