import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="relative">
        <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-indigo-500 border-t-transparent"></div>
      </div>
      <span className="ml-4 text-gray-500 text-lg">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;