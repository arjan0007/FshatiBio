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
        // 1. Nëse është ngarkim fillestar (!silent) - gjithmonë shko në fund
        // 2. Nëse forceScroll (pas dërgimit të mesazhit) - gjithmonë shko në fund
        // 3. Nëse është update i heshtur (polling) dhe ishe në fund dhe ka mesazhe të reja - shko në fund
        // 4. Nëse ishe duke parë mesazhet e vjetra (jo në fund) - mos scrollo, ruaj pozicionin
        if (forceScroll) {
          // Pas dërgimit të mesazhit - gjithmonë shko në fund (si WhatsApp)
          setTimeout(() => scrollToBottom(false), 100);
        } else if (!silent) {
          // Ngarkim fillestar - gjithmonë shko në fund
          setTimeout(() => scrollToBottom(false), 150);
        } else if (silent && wasAtBottom && hasNewMessages) {
          // Update i heshtur, ishe në fund, dhe ka mesazhe të reja - shko në fund për t'i parë
          setTimeout(() => scrollToBottom(false), 100);
        }
        // Nëse ishe duke parë mesazhet e vjetra (jo në fund), mos scrollo - lejo përdoruesin të vazhdojë leximin
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
        <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white shadow rounded-2xl overflow-hidden flex flex-col lg:flex-row min-h-[70vh]">
          {/* Conversations list */}
          <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col relative">
            <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-white z-10">
              <h2 className="text-lg font-semibold">Bisedat</h2>
              <button onClick={fetchConversations} className="text-sm text-blue-600 hover:text-blue-800">
                Rifresko
              </button>
            </div>
            <div 
              ref={conversationsContainerRef}
              onScroll={handleConversationsScroll}
              className="flex-1 overflow-y-auto relative"
            >
              {loadingConversations ? (
                <div className="p-4 text-sm text-gray-500">Duke ngarkuar bisedat...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Nuk ka mesazhe për momentin.</div>
              ) : (
                conversations.map((conv) => {
                  const unreadCount = parseInt(conv.unread_count) || 0;
                  const hasUnreadMessages = unreadCount > 0 && 
                                           (!selectedConversation || selectedConversation.id !== conv.id);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left px-4 py-3 border-t border-gray-100 hover:bg-gray-50 transition relative ${
                        selectedConversation?.id === conv.id ? 'bg-gray-100' : ''
                      } ${hasUnreadMessages ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm ${hasUnreadMessages ? 'text-blue-700' : ''}`}>
                              {conv.user_name}
                            </p>
                            {hasUnreadMessages && (
                              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{conv.user_email}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            conv.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {conv.status === 'open' ? 'Aktive' : 'Mbyllur'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {conv.last_message_sender === 'user' && (
                          <span className={`text-xs font-semibold ${hasUnreadMessages ? 'text-blue-700' : 'text-blue-600'}`}>
                            Përdoruesi:
                          </span>
                        )}
                        {conv.last_message_sender === 'admin' && (
                          <span className="text-xs font-semibold text-green-600">Ju:</span>
                        )}
                        <p className={`text-xs flex-1 ${hasUnreadMessages ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                          {conv.last_message ? conv.last_message.slice(0, 50) : '—'}
                          {conv.last_message && conv.last_message.length > 50 ? '...' : ''}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </p>
                    </button>
                  );
                })
              )}
              
              {/* Scroll buttons for conversations list */}
              {showConversationsScrollButton && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
                  <button
                    onClick={scrollConversationsToTop}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-all duration-300 flex items-center justify-center"
                    title="Shko në fillim"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={scrollConversationsToBottom}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-all duration-300 flex items-center justify-center"
                    title="Shko në fund"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                {/* Fixed header - mbetet shfaqur by default, si WhatsApp */}
                <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white flex-shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedConversation.user_name}</h3>
                    <p className="text-sm text-gray-500">{selectedConversation.user_email}</p>
                  </div>
                  <button
                    onClick={toggleStatus}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      selectedConversation.status === 'open'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {selectedConversation.status === 'open' ? 'Mbyll Bisedën' : 'Rihap'}
                  </button>
                </div>

                {/* Scrollable messages area - si WhatsApp: vetëm kjo scrollon, header dhe input mbeten statik */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 relative min-h-0"
                  style={{ 
                    WebkitOverflowScrolling: 'touch' // Smooth scrolling në mobile (si WhatsApp)
                  }}
                >
                  {loadingMessages ? (
                    <div className="text-sm text-gray-500">Duke ngarkuar mesazhet...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-gray-500">Nuk ka mesazhe ende.</div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              message.sender === 'admin'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-800 shadow'
                            }`}
                          >
                            <p>{message.message}</p>
                            <p
                              className={`text-[11px] mt-1 ${
                                message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                  
                  {/* Ashensor jeshil - vetëm në fushën e mesazheve */}
                  {showScrollButton && (
                    <button
                      onClick={scrollToBottom}
                      className="absolute bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-20 flex items-center justify-center hover:scale-110"
                      title="Shko në fund"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Fixed input form - statik në fund, nuk lëviz, nuk zgjerohet poshtë */}
                <form onSubmit={handleSendReply} className="border-t border-gray-200 p-4 bg-white flex-shrink-0 sticky bottom-0 z-10">
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Shkruani përgjigjen tuaj..."
                      className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
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
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex-shrink-0 h-fit"
                    >
                      {isSending ? '...' : 'Dërgo'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Zgjidhni një bisedë nga lista.
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
    </AdminLayout>
  );
}

