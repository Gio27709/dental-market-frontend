import PropTypes from 'prop-types';

export default function LoadingSkeleton({ variant = 'default', count = 1 }) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'product-card':
        return (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex justify-between items-center mt-auto">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        );
      case 'order-card':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="animate-pulse space-y-3 w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        );
      case 'title':
        return <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3 mb-6"></div>;
      case 'spinner':
        return (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
              <p className="text-gray-500 font-medium animate-pulse">Cargando...</p>
            </div>
          </div>
        );
    }
  };

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="w-full">
            {renderSkeleton()}
          </div>
        ))}
      </>
    );
  }

  return renderSkeleton();
}

LoadingSkeleton.propTypes = {
  variant: PropTypes.oneOf(['product-card', 'order-card', 'text', 'title', 'spinner', 'default']),
  count: PropTypes.number,
};
