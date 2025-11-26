import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 50));
          if (newProgress <= 0) {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
            return 0;
          }
          return newProgress;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      icon: '✅',
      border: 'border-green-400'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      icon: '❌',
      border: 'border-red-400'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      icon: '⚠️',
      border: 'border-yellow-400'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: 'ℹ️',
      border: 'border-blue-400'
    }
  };

  const style = styles[type];

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 ${style.bg} text-white px-5 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 min-w-[300px] max-w-md border-2 ${style.border} transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="flex-shrink-0 text-2xl animate-bounce">{style.icon}</div>
      <div className="flex-1">
        <p className="font-semibold">{message}</p>
        <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(), 300);
        }}
        className="flex-shrink-0 text-white hover:text-gray-200 font-bold text-xl transition-transform hover:scale-125"
      >
        ×
      </button>
    </div>
  );
}

