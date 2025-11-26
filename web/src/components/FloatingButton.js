import Link from 'next/link';

export default function FloatingButton({ href, icon = '🛒', badge = null, onClick }) {
  const content = (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 transition-all transform hover:scale-110 z-40 flex items-center justify-center text-2xl group"
    >
      <span className="group-hover:scale-125 transition-transform">{icon}</span>
      {badge && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
          {badge}
        </span>
      )}
    </button>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

