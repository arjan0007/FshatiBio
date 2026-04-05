import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminChat() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showConversationsScrollButton, setShowConversationsScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchConversations();
    markChatNotificationsAsRead();
  }, []);

  const markChatNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      // Get all unread chat notifications
      const response = await axios.get(`${API_URL}/notifications?unread_only=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const chatNotifications = response.data.data.notifications.filter(
          n => n.link_url === '/admin/chat' || n.title === 'Mesazh i ri në Chat'
        );

        // Mark all chat notifications as read
        for (const notification of chatNotifications) {
          try {
            await axios.put(`${API_URL}/notifications/${notification.id}/read`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error marking chat notifications as read:', error);
    }
  };

  useEffect(() => {
    let messagesInterval;
    let conversationsInterval;

    if (selectedConversation) {
      // Si WhatsApp: ngarkim fillestar - gjithmonë shko në fund
      fetchMessages(selectedConversation.id, false, false);
      messagesInterval = setInterval(() => {
        // Si WhatsApp: polling i heshtur - kontrollo nëse jeni në fund dhe scrollo vetëm nëse ka mesazhe të reja
        fetchMessages(selectedConversation.id, true, false);
      }, 5000);
    }

    // Polling për listën e bisedave për të detektuar mesazhe të reja (silent)
    conversationsInterval = setInterval(() => {
      fetchConversations(true);
    }, 5000);

    return () => {
      if (messagesInterval) clearInterval(messagesInterval);
      if (conversationsInterval) clearInterval(conversationsInterval);
    };
  }, [selectedConversation]);

  // Check scroll position when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      handleScroll();
    }
    if (conversationsContainerRef.current) {
      handleConversationsScroll();
    }
  }, [messages, conversations]);

  const authHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingConversations(true);
      const previousConversations = conversations;
      const response = await axios.get(`${API_URL}/chat/admin/conversations`, {
        headers: authHeaders()
      });
      if (response.data.success) {
        const newConversations = response.data.data.conversations;
        setConversations(newConversations);

        // Kontrollo nëse ka mesazhe të reja nga përdoruesit
        if (previousConversations.length > 0) {
          newConversations.forEach(newConv => {
            const oldConv = previousConversations.find(c => c.id === newConv.id);
            if (oldConv && newConv.last_message_sender === 'user' &&
                oldConv.last_message_at !== newConv.last_message_at &&
                (!selectedConversation || selectedConversation.id !== newConv.id)) {
              // Ka mesazh i ri nga përdoruesi dhe biseda nuk është e zgjedhur
              // Mund të shtosh njoftim këtu nëse dëshiron
              console.log(`Mesazh i ri nga ${newConv.user_name}`);
            }
          });
        }

        if (!selectedConversation && newConversations.length > 0) {
          setSelectedConversation(newConversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId, silent = false, forceScroll = false) => {
    try {
      if (!silent) setLoadingMessages(true);

      // Si WhatsApp: kontrollo pozicionin PARA se të marrësh mesazhet e reja
      const wasAtBottom = isAtBottom();
      const previousMessageCount = messages.length;

      const response = await axios.get(`${API_URL}/chat/admin/conversations/${conversationId}/messages`, {
        headers: authHeaders()
      });

      if (response.data.success) {
        const newMessages = response.data.data.messages;
        const hasNewMessages = newMessages.length > previousMessageCount;

        // Si WhatsApp: vendos mesazhet e reja
        setMessages(newMessages);

        // Përditëso listën e bisedave për të hequr badge-in e mesazheve të palexuara
        if (hasNewMessages || !silent) {
          fetchConversations(true);
        }

        // Si WhatsApp: auto-scroll logjikë
        if (forceScroll) {
          setTimeout(() => scrollToBottom(false), 100);
        } else if (!silent) {
          setTimeout(() => scrollToBottom(false), 150);
        } else if (silent && wasAtBottom && hasNewMessages) {
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    } catch (error) {
      console.error('Error fetching messages', error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Si WhatsApp: scroll direkt në fund të container-it
      if (instant) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    // Si WhatsApp: threshold më i vogël për detektim më të saktë
    const threshold = 50; // pixels from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      setShowScrollButton(!isAtBottom());
    }
  };

  const scrollConversationsToTop = () => {
    if (conversationsContainerRef.current) {
      conversationsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollConversationsToBottom = () => {
    if (conversationsContainerRef.current) {
      conversationsContainerRef.current.scrollTo({
        top: conversationsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleConversationsScroll = () => {
    if (conversationsContainerRef.current) {
      const container = conversationsContainerRef.current;
      const isAtTop = container.scrollTop < 50;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShowConversationsScrollButton(!isAtTop || !isAtBottom);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    // Mark messages as read when admin selects conversation
    try {
      await axios.post(
        `${API_URL}/chat/admin/conversations/${conversation.id}/mark-read`,
        {},
        { headers: authHeaders() }
      );
      // Refresh conversations list to update unread count
      fetchConversations(true);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedConversation) return;
    try {
      setIsSending(true);
      await axios.post(
        `${API_URL}/chat/admin/conversations/${selectedConversation.id}/reply`,
        { message: reply.trim() },
        { headers: authHeaders() }
      );
      setReply('');
      // Si WhatsApp: pas dërgimit të mesazhit, gjithmonë shko në fund
      await fetchMessages(selectedConversation.id, false, true);
      fetchConversations();
    } catch (error) {
      console.error('Error sending reply', error);
      alert(error.response?.data?.error?.message || 'Nuk u dërgua mesazhi');
    } finally {
      setIsSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!selectedConversation) return;
    const newStatus = selectedConversation.status === 'open' ? 'closed' : 'open';
    try {
      const response = await axios.put(
        `${API_URL}/chat/admin/conversations/${selectedConversation.id}/status`,
        { status: newStatus },
        { headers: authHeaders() }
      );

      if (response.data.success) {
        const updated = { ...selectedConversation, status: newStatus };
        setSelectedConversation(updated);
        fetchConversations();
      } else {
        alert(response.data.error?.message || 'Nuk u përditësua statusi');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          error.message ||
                          'Nuk u përditësua statusi. Ju lutem provoni sërish.';
      alert(errorMessage);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <Head>
        <title>Chat Live - Admin</title>
      </Head>
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="font-display text-2xl text-forest-900 font-bold">Chat Live</h1>
          <p className="text-forest-600 font-sans text-sm mt-0.5">Mesazhet me klientët</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(29,78,53,0.07)] border border-forest-100 overflow-hidden flex flex-col lg:flex-row min-h-[70vh]">
          {/* Conversations list */}
          <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-forest-100 flex flex-col relative bg-forest-50">
            <div className="p-4 flex items-center justify-between border-b border-forest-100 bg-white">
              <h2 className="font-display text-base font-semibold text-forest-900">Bisedat</h2>
              <button
                onClick={fetchConversations}
                className="text-xs text-forest-600 hover:text-forest-800 font-sans font-medium border border-forest-200 px-2.5 py-1 rounded-lg hover:bg-forest-50 transition-colors"
              >
                Rifresko
              </button>
            </div>
            <div
              ref={conversationsContainerRef}
              onScroll={handleConversationsScroll}
              className="flex-1 overflow-y-auto relative"
            >
              {loadingConversations ? (
                <div className="p-4 text-sm text-forest-500 font-sans text-center pt-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-forest-200 border-t-forest-600 mx-auto mb-2"></div>
                  Duke ngarkuar bisedat...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-sm text-forest-500 font-sans text-center">Nuk ka mesazhe për momentin.</div>
              ) : (
                conversations.map((conv) => {
                  const unreadCount = parseInt(conv.unread_count) || 0;
                  const hasUnreadMessages = unreadCount > 0 &&
                                           (!selectedConversation || selectedConversation.id !== conv.id);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left px-4 py-3.5 border-b border-forest-100 hover:bg-forest-100 transition-colors relative ${
                        selectedConversation?.id === conv.id
                          ? 'bg-forest-100 border-l-4 border-l-forest-600'
                          : hasUnreadMessages
                          ? 'bg-amber-50 border-l-4 border-l-honey-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold text-sm font-sans ${
                            hasUnreadMessages ? 'text-forest-900' : 'text-forest-800'
                          }`}>
                            {conv.user_name}
                          </p>
                          {hasUnreadMessages && (
                            <span className="bg-forest-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          conv.status === 'open'
                            ? 'bg-forest-100 text-forest-700 border border-forest-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {conv.status === 'open' ? 'Aktive' : 'Mbyllur'}
                        </span>
                      </div>
                      <p className="text-xs text-forest-500 font-sans mb-1">{conv.user_email}</p>
                      <div className="flex items-center gap-1.5">
                        {conv.last_message_sender === 'user' && (
                          <span className={`text-xs font-semibold ${hasUnreadMessages ? 'text-honey-600' : 'text-forest-500'}`}>
                            Klienti:
                          </span>
                        )}
                        {conv.last_message_sender === 'admin' && (
                          <span className="text-xs font-semibold text-forest-600">Ju:</span>
                        )}
                        <p className={`text-xs flex-1 truncate font-sans ${
                          hasUnreadMessages ? 'text-forest-900 font-medium' : 'text-forest-500'
                        }`}>
                          {conv.last_message ? conv.last_message.slice(0, 50) : '—'}
                          {conv.last_message && conv.last_message.length > 50 ? '...' : ''}
                        </p>
                      </div>
                      <p className="text-[11px] text-forest-400 font-sans mt-1">
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </p>
                    </button>
                  );
                })
              )}

              {/* Scroll buttons for conversations list */}
              {showConversationsScrollButton && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-1.5 z-20">
                  <button
                    onClick={scrollConversationsToTop}
                    className="bg-forest-700 hover:bg-forest-800 text-white rounded-full p-1.5 shadow-lg transition-all"
                    title="Shko në fillim"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={scrollConversationsToBottom}
                    className="bg-forest-700 hover:bg-forest-800 text-white rounded-full p-1.5 shadow-lg transition-all"
                    title="Shko në fund"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Fixed header */}
                <div className="border-b border-forest-100 p-4 flex items-center justify-between bg-white flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-forest-400 to-forest-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {selectedConversation.user_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-forest-900">{selectedConversation.user_name}</h3>
                      <p className="text-xs text-forest-500 font-sans">{selectedConversation.user_email}</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleStatus}
                    className={`px-3 py-1.5 text-xs rounded-xl font-semibold font-sans transition-all ${
                      selectedConversation.status === 'open'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                        : 'bg-forest-100 text-forest-700 border border-forest-200 hover:bg-forest-200'
                    }`}
                  >
                    {selectedConversation.status === 'open' ? 'Mbyll Bisedën' : 'Rihap'}
                  </button>
                </div>

                {/* Scrollable messages area */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0faf4] relative min-h-0"
                  style={{
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {loadingMessages ? (
                    <div className="text-sm text-forest-500 font-sans text-center pt-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-forest-200 border-t-forest-600 mx-auto mb-2"></div>
                      Duke ngarkuar mesazhet...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-forest-500 font-sans text-center pt-8">Nuk ka mesazhe ende.</div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 text-sm ${
                              message.sender === 'admin'
                                ? 'bg-forest-700 text-white rounded-2xl rounded-br-sm'
                                : 'bg-white text-forest-800 rounded-2xl rounded-bl-sm shadow-sm border border-forest-100'
                            }`}
                          >
                            <p className="font-sans leading-relaxed">{message.message}</p>
                            <p className={`text-[11px] mt-1 font-sans ${
                              message.sender === 'admin' ? 'text-white/60' : 'text-forest-400'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}

                  {/* Scroll to bottom button */}
                  {showScrollButton && (
                    <button
                      onClick={scrollToBottom}
                      className="absolute bottom-4 right-4 bg-forest-700 hover:bg-forest-800 text-white rounded-full p-2.5 shadow-lg transition-all z-20 hover:scale-110"
                      title="Shko në fund"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Fixed input form */}
                <form onSubmit={handleSendReply} className="border-t border-forest-100 p-4 bg-white flex-shrink-0 sticky bottom-0 z-10">
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Shkruani përgjigjen tuaj..."
                      className="flex-1 px-4 py-2.5 rounded-xl border-2 border-forest-100 bg-white focus:outline-none focus:border-forest-400 font-sans text-forest-900 transition-colors resize-none"
                      rows={2}
                      required
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        maxHeight: '120px',
                        overflowY: 'auto'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSending}
                      className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-forest-800 transition-all text-sm font-sans disabled:opacity-50 flex-shrink-0 h-fit"
                    >
                      {isSending ? '...' : 'Dërgo'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-forest-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-forest-500 font-sans">Zgjidhni një bisedë nga lista.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
