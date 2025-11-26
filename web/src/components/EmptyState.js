export default function EmptyState({ 
  icon = '📦', 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionIcon = '→'
}) {
  return (
    <div className="text-center py-12 sm:py-16 md:py-20 px-4">
      <div className="inline-block mb-6 animate-bounce">
        <div className="text-6xl sm:text-7xl md:text-8xl">{icon}</div>
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto">
        {description}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <span>{actionLabel}</span>
          <span className="text-xl">{actionIcon}</span>
        </button>
      )}
    </div>
  );
}

