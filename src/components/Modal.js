import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import Draggable from 'react-draggable';

const Modal = ({ isOpen, onClose, title, children, size = 'md', zIndex = 'z-50', draggable = false }) => {
  const nodeRef = useRef(null);
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    // यदि मॉडल बंद हो रहा है, तो एक कस्टम इवेंट ट्रिगर करें
    // जिसे पेरेंट कंपोनेंट सुन सकता है
    if (!isOpen) {
      const event = new CustomEvent('modalClosed');
      window.dispatchEvent(event);
    }
  };
}, [isOpen, onClose]);
  
  // Prevent scrolling on the background when modal is open
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
  
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg md:max-w-2xl',
    lg: 'sm:max-w-lg md:max-w-3xl lg:max-w-4xl',
    xl: 'sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl'
  };
  
  const modalContent = (
    <div
      ref={nodeRef}
      className={`relative bg-white rounded-lg shadow-xl transform transition-all w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* Modal header */}
      <div className={`flex justify-between items-center bg-gray-50 px-6 py-4 border-b flex-shrink-0 ${draggable ? 'cursor-move modal-drag-handle' : ''}`}>
        <h3
          className="text-lg font-medium text-gray-900 select-none"
          id="modal-headline"
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
        >
          <FiX className="h-6 w-6" />
        </button>
      </div>

      {/* Modal content with scroll */}
      <div className="px-6 py-4 overflow-y-auto flex-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={() => {
          // मॉडल को बंद करें, और onClose कॉल करें
          onClose();
        }}
      />

      {/* Modal panel - wrapped with Draggable if draggable prop is true */}
      {draggable ? (
        <Draggable
          nodeRef={nodeRef}
          handle=".modal-drag-handle"
          bounds="parent"
          defaultPosition={{ x: 0, y: 0 }}
        >
          {modalContent}
        </Draggable>
      ) : (
        modalContent
      )}
    </div>
  );
};

export default Modal;