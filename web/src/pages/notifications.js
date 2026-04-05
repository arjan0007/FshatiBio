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
        return '🎁';
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
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full border-4 border-forest-200 border-t-forest-700 animate-spin"></div>
          <p className="text-forest-700 font-medium">Duke ngarkuar njoftimet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Njoftimet - FshatiBio</title>
      </Head>

      {/* Header */}
      <header className="bg-white shadow-card border-b border-earth-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-6 h-6 text-forest-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.1L5.71 21l1-1.3A4.49 4.49 0 008 20c4 0 8-3 11-12l-2 0z"/>
              </svg>
              <span className="font-display text-xl font-bold text-forest-800">FshatiBio</span>
            </Link>
            <nav className="flex gap-6">
              <Link href="/products" className="text-earth-600 hover:text-forest-700 transition-colors text-sm font-medium">
                Produktet
              </Link>
              <Link href="/cart" className="text-earth-600 hover:text-forest-700 transition-colors text-sm font-medium">
                Shporta
              </Link>
              <Link href="/profile" className="text-earth-600 hover:text-forest-700 transition-colors text-sm font-medium">
                Profili
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">

        {/* Page title card */}
        <div className="bg-white rounded-3xl shadow-card px-6 py-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-forest-100 rounded-2xl flex items-center justify-center">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-900">Njoftimet</h1>
              {unreadCount > 0 && (
                <p className="text-earth-500 text-xs mt-0.5">{unreadCount} të palexuara</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Filter pill tabs */}
            <div className="flex gap-2 bg-cream-100 rounded-full p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-forest-700 text-white shadow-warm'
                    : 'text-earth-600 hover:text-forest-700'
                }`}
              >
                Të gjitha
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all relative ${
                  filter === 'unread'
                    ? 'bg-forest-700 text-white shadow-warm'
                    : 'text-earth-600 hover:text-forest-700'
                }`}
              >
                Të palexuara
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="bg-forest-700 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-forest-800 transition-all shadow-warm disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
              >
                {markingAll ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span>Duke përditësuar...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Shëno të gjitha si të lexuara</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
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
          <div className="space-y-3 animate-slide-up">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl shadow-card border-l-4 overflow-hidden transition-all hover:shadow-warm ${
                  !notification.is_read
                    ? 'bg-forest-50 border-l-forest-500'
                    : `bg-white ${
                        notification.type === 'order' ? 'border-l-blue-400' :
                        notification.type === 'promotion' ? 'border-l-purple-400' :
                        notification.type === 'system' ? 'border-l-amber-400' :
                        'border-l-earth-300'
                      }`
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon bubble */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${
                      !notification.is_read ? 'bg-forest-100' :
                      notification.type === 'order' ? 'bg-blue-100' :
                      notification.type === 'promotion' ? 'bg-purple-100' :
                      notification.type === 'system' ? 'bg-amber-100' :
                      'bg-earth-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`text-base font-bold break-words text-forest-900 ${!notification.is_read ? 'text-forest-900' : 'text-earth-800'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="bg-forest-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            E re
                          </span>
                        )}
                      </div>

                      <p className="text-earth-600 mb-2 text-sm break-words leading-relaxed">{notification.message}</p>

                      <p className="text-xs text-earth-400">
                        {new Date(notification.created_at).toLocaleString('sq-AL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {notification.link_url && (
                          <Link
                            href={notification.link_url}
                            className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-900 text-sm font-semibold transition-colors"
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                          >
                            <span>Shiko më shumë</span>
                            <span>→</span>
                          </Link>
                        )}
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-earth-400 hover:text-forest-700 transition-colors font-medium flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Shëno si të lexuar
                          </button>
                        )}
                      </div>
                    </div>
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
