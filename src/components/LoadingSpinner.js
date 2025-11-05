import React from 'react';

const LoadingSpinner = ({ size = 30, text = '', inline = false }) => {
  // Windows-style spinning dots in a circle
  const dots = Array.from({ length: 8 });

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: size * 2, height: size * 2 }}>
        <style>{`
          @keyframes windowsSpinner {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
        `}</style>
        {dots.map((_, index) => {
          const angle = (index * 360) / 8;
          const delay = (index * 0.125);

          return (
            <div
              key={index}
              className="absolute bg-indigo-600 rounded-full"
              style={{
                width: size / 4,
                height: size / 4,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${size * 0.8}px)`,
                animation: `windowsSpinner 1s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>
      {text && (
        <p className="text-sm text-gray-700 font-medium">{text}</p>
      )}
    </div>
  );

  // Inline mode (for buttons, etc.)
  if (inline) {
    return spinner;
  }

  // Full screen overlay mode (default)
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;