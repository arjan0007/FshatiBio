export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    bio: 'bg-green-600 text-white font-bold',
    new: 'bg-purple-100 text-purple-800',
    sale: 'bg-red-600 text-white font-bold'
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span className={`inline-block rounded-full ${variants[variant]} ${sizes[size]} ${className} transition-transform hover:scale-105`}>
      {children}
    </span>
  );
}

