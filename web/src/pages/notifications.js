import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import EmptyState from '../components/EmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/notifications');
      return;
    }
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          unread_only: filter === 'unread' ? 'true' : 'false',
          limit: 50
        }
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në përditësim');
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Gabim në përditësim');
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'promotion':
        return '🎉';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-200';
      case 'promotion':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Duke ngarkuar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Njoftimet - FshatiBio</title>
      </Head>

      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-green-700">
              🥛 FshatiBio
            </Link>
            <nav className="flex gap-4">
              <Link href="/products" className="text-gray-700 hover:text-green-700">
                Produktet
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-green-700">
                Shporta
              </Link>
              <Link href="/profile" className="text-gray-700 hover:text-green-700">
                Profili
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Njoftimet</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Të gjitha
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg relative text-sm sm:text-base ${
                  filter === 'unread'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Të palexuara
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
              >
                {markingAll ? 'Duke përditësuar...' : 'Shëno të gjitha si të lexuara'}
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title={filter === 'unread' ? 'Nuk keni njoftime të palexuara' : 'Nuk keni njoftime'}
            description={filter === 'unread'
              ? 'Të gjitha njoftimet tuaja janë të lexuara'
              : 'Njoftimet tuaja do të shfaqen këtu'}
            actionLabel="Shiko Produktet"
            onAction={() => router.push('/products')}
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 ${
                  notification.is_read
                    ? getNotificationColor(notification.type)
                    : `${getNotificationColor(notification.type)} border-l-green-500`
                } ${!notification.is_read ? 'font-semibold' : ''}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="text-2xl sm:text-3xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold mb-1 break-words">{notification.title}</h3>
                        <p className="text-gray-700 mb-2 text-sm sm:text-base break-words">{notification.message}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleString('sq-AL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                          E re
                        </span>
                      )}
                    </div>
                    {notification.link_url && (
                      <div className="mt-3 sm:mt-4">
                        <Link
                          href={notification.link_url}
                          className="text-green-600 hover:text-green-700 underline text-sm sm:text-base"
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          Shiko më shumë →
                        </Link>
                      </div>
                    )}
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                      >
                        Shëno si të lexuar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

