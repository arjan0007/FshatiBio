export default function SkeletonLoader({ type = 'product', count = 1 }) {
  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="bg-white p-8 rounded-2xl shadow-lg animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
    </div>
  );

  const CardSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return <ProductSkeleton />;
      case 'category':
        return <CategorySkeleton />;
      case 'card':
        return <CardSkeleton />;
      default:
        return <ProductSkeleton />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

