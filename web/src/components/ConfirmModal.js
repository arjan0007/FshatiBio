import { useEffect } from 'react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Konfirmo Veprimin',
  message = 'A jeni të sigurt që dëshironi të vazhdoni?',
  confirmText = 'Konfirmo',
  cancelText = 'Anulo',
  type = 'warning',
  loading = false
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirmBg: 'bg-gradient-to-r from-red-500 to-rose-600',
      confirmHover: 'hover:from-red-600 hover:to-rose-700',
      borderColor: 'border-yellow-200'
    },
    danger: {
      icon: '🗑️',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBg: 'bg-gradient-to-r from-red-500 to-rose-600',
      confirmHover: 'hover:from-red-600 hover:to-rose-700',
      borderColor: 'border-red-200'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      confirmHover: 'hover:from-blue-600 hover:to-blue-700',
      borderColor: 'border-blue-200'
    }
  };

  const style = typeStyles[type] || typeStyles.warning;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-fade-in border-2 border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b-2 ${style.borderColor} bg-gradient-to-r from-gray-50 to-white`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${style.iconBg} rounded-full flex items-center justify-center text-2xl animate-pulse-ring`}>
              <span>{style.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 flex-1">{title}</h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl font-light">×</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-700 text-base leading-relaxed mb-6">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-5 py-3 ${style.confirmBg} ${style.confirmHover} text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Duke procesuar...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

