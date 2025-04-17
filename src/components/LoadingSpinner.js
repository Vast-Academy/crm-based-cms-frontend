import React from 'react';

const LoadingSpinner = () => {
  return (
    <>
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50">
        <div className="h-full bg-indigo-500 animate-progressBar"></div>
      </div>
     
      {/* Absolutely centered circle using calc */}
      <div className="fixed w-full h-full bg-white bg-opacity-80 z-40">
        <div
          className="absolute"
          style={{
            top: 'calc(50% - 32px)',
             left: 'calc(50% - 32px)'
          }}
        >
          <div className="w-16 h-16 rounded-full absolute border-8 border-gray-200"></div>
          <div className="w-16 h-16 rounded-full animate-spin absolute border-8 border-indigo-500 border-t-transparent"></div>
        </div>
      </div>
    </>
  );
};
export default LoadingSpinner;