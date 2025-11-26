import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Try to detect the correct API URL
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Try port 4000 first (current backend), fallback to 3000
  return 'http://localhost:4000/api';
};

const API_URL = getApiUrl();

// Helper function to validate email
const isValidEmail = (email) => {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessage = (message) => ({
    ...message,
    timestamp: new Date(message.created_at || message.timestamp || new Date())
  });

  const loadLocalData = () => {
    const storedConversation = localStorage.getItem('chat_conversation_id');
    const storedUser = localStorage.getItem('chat_user_info');
    if (storedConversation) {
      setConversationId(storedConversation);
    }
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Validate that we have valid name and email
        if (parsed.name && parsed.email) {
          // Validate email format
          if (isValidEmail(parsed.email)) {
            setUserInfo(parsed);
            setIsChatStarted(true);
          } else {
            // Invalid email in storage, clear it
            localStorage.removeItem('chat_user_info');
            localStorage.removeItem('chat_conversation_id');
          }
        } else {
          // Missing required fields, clear storage
          localStorage.removeItem('chat_user_info');
          localStorage.removeItem('chat_conversation_id');
        }
      } catch (e) {
        console.error('Failed to parse stored user info', e);
        localStorage.removeItem('chat_user_info');
        localStorage.removeItem('chat_conversation_id');
      }
    }
  };

  useEffect(() => {
    loadLocalData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval;
    if (isOpen && conversationId) {
      fetchMessages();
      interval = setInterval(fetchMessages, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, conversationId]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      setLoadingMessages(true);
      const response = await axios.get(`${API_URL}/chat/conversations/${conversationId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages.map(formatMessage));
      }
    } catch (error) {
      console.error('Error fetching chat messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!userInfo.name.trim() || !userInfo.email.trim()) {
      alert('Ju lutem plotësoni të gjitha fushat');
      return;
    }
    
    // Validate email format
    if (!isValidEmail(userInfo.email)) {
      alert('Ju lutem shkruani një email të vlefshëm');
      return;
    }
    
    localStorage.setItem('chat_user_info', JSON.stringify(userInfo));
    setIsChatStarted(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !userInfo.name || !userInfo.email) {
      alert('Ju lutem plotësoni të gjitha fushat');
      return;
    }
    
    // Validate email format
    if (!isValidEmail(userInfo.email)) {
      alert('Ju lutem shkruani një email të vlefshëm');
      return;
    }
    
    setIsSending(true);
    try {
      console.log('Sending message to:', `${API_URL}/chat/messages`);
      console.log('Payload:', {
        conversationId,
        name: userInfo.name,
        email: userInfo.email,
        message: inputMessage
      });
      const payload = {
        name: userInfo.name,
        email: userInfo.email,
        message: inputMessage
      };
      
      // Only include conversationId if it exists
      if (conversationId) {
        payload.conversationId = conversationId;
      }
      
      const response = await axios.post(`${API_URL}/chat/messages`, payload);

      if (response.data.success) {
        const { conversation, message } = response.data.data;
        if (!conversationId) {
          setConversationId(conversation.id);
          localStorage.setItem('chat_conversation_id', conversation.id);
        }
        setMessages((prev) => [...prev, formatMessage(message)]);
        setInputMessage('');
      }
    } catch (error) {
      console.error('Error sending message', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${API_URL}/chat/messages`
      });
      
      let errorMessage = 'Nuk u dërgua mesazhi. Ju lutem provoni sërish.';
      
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          // Map validation errors to Albanian
          const errorMessages = errorData.details.map(d => {
            const msg = d.msg || d.message || '';
            // Translate common validation messages
            if (msg.includes('email') || msg.includes('Email')) {
              return 'Email i pavlefshëm';
            }
            if (msg.includes('required') || msg.includes('notEmpty')) {
              return 'Kjo fushë është e detyrueshme';
            }
            if (msg.includes('UUID') || msg.includes('uuid') || msg.includes('Invalid value')) {
              return 'ID e pavlefshme e bisedës';
            }
            if (msg.includes('Mesazhi') || msg.includes('message')) {
              return 'Mesazhi është i detyrueshëm';
            }
            if (msg.includes('Emri') || msg.includes('name')) {
              return 'Emri është i detyrueshëm';
            }
            return msg;
          });
          errorMessage = `Gabim validimi: ${errorMessages.join(', ')}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 z-40 flex items-center justify-center text-2xl group"
      >
        {isOpen ? (
          <span className="group-hover:rotate-90 transition-transform">✕</span>
        ) : (
          <>
            <span className="group-hover:scale-110 transition-transform">💬</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              !
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[420px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border-2 border-blue-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">💬 Chat Live</h3>
              <p className="text-xs opacity-90">Përgjigje në pak minuta</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {!isChatStarted ? (
              <form onSubmit={handleStartChat} className="bg-white rounded-xl p-4 space-y-3 shadow">
                <p className="text-sm text-gray-600">Na tregoni si t'ju kontaktojmë:</p>
                <input
                  type="text"
                  placeholder="Emri"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Email (p.sh., test@example.com)"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                >
                  Fillo Chatin
                </button>
              </form>
            ) : loadingMessages && messages.length === 0 ? (
              <div className="text-center text-sm text-gray-500">Duke ngarkuar bisedën...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-gray-500">
                Filloni bisedën tuaj dhe ekipi ynë do t'ju përgjigjet sa më shpejt.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 shadow'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.message}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isChatStarted && (
            <form onSubmit={handleSend} className="p-4 border-t bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Shkruani mesazhin tuaj..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={isSending}
                >
                  {isSending ? '...' : '📤'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}

