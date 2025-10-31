import React, { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import Draggable from 'react-draggable';
import { useNotification } from '../context/NotificationContext';

// Global modal registry to track open modals and their priorities
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

// Helper function to extract numeric zIndex from Tailwind class
const getNumericZIndex = (zIndexClass) => {
  const match = zIndexClass.match(/z-\[?(\d+)\]?/);
  return match ? parseInt(match[1]) : parseInt(zIndexClass.replace('z-', '')) || 50;
};

const Modal = ({ isOpen, onClose, title, children, size = 'md', zIndex = 'z-50', draggable = false }) => {
  const nodeRef = useRef(null);
  const { showNotification } = useNotification();
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(getNumericZIndex(zIndex));

  // Double ESC and double click states
  const [escPressCount, setEscPressCount] = useState(0);
  const [escPressTimer, setEscPressTimer] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  // Check if this modal is the topmost modal
  const isTopmostModal = () => {
    if (!window.__modalRegistry || window.__modalRegistry.size === 0) return true;

    let highestZIndex = 0;
    window.__modalRegistry.forEach(modal => {
      if (modal.zIndex > highestZIndex) {
        highestZIndex = modal.zIndex;
      }
    });

    return numericZIndex.current >= highestZIndex;
  };

  // Register/unregister modal in global registry
  useEffect(() => {
    if (isOpen) {
      window.__modalRegistry.add({
        id: modalId.current,
        zIndex: numericZIndex.current
      });
    } else {
      // Remove this modal from registry
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
      // Cleanup on unmount
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    };
  }, [isOpen]);

  // Close modal when Escape key is pressed twice within 800ms
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen && isTopmostModal()) {
        if (escPressCount === 0) {
          // First ESC press - start timer, NO notification yet
          setEscPressCount(1);

          // Set timer to reset after 800ms and show notification
          const timer = setTimeout(() => {
            // Timer expired - user didn't press twice, show guide notification
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          // Second ESC press within time window - close popup, NO notification
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Clear timer on cleanup
      if (escPressTimer) {
        clearTimeout(escPressTimer);
      }
      // यदि मॉडल बंद हो रहा है, तो एक कस्टम इवेंट ट्रिगर करें
      // जिसे पेरेंट कंपोनेंट सुन सकता है
      if (!isOpen) {
        const event = new CustomEvent('modalClosed');
        window.dispatchEvent(event);
      }
    };
  }, [isOpen, onClose, escPressCount, escPressTimer, showNotification]);

  // Reset ESC and click counters when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEscPressCount(0);
      setClickCount(0);
      if (escPressTimer) clearTimeout(escPressTimer);
      if (clickTimer) clearTimeout(clickTimer);
    }
  }, [isOpen]);

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

  // Handle overlay click - requires double click to close
  const handleOverlayClick = () => {
    // Only handle click if this is the topmost modal
    if (!isTopmostModal()) return;

    if (clickCount === 0) {
      // First click - start timer, NO notification yet
      setClickCount(1);

      // Set timer to reset after 800ms and show notification
      const timer = setTimeout(() => {
        // Timer expired - user didn't click twice, show guide notification
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCount(0);
      }, 800);
      setClickTimer(timer);
    } else if (clickCount === 1) {
      // Second click within time window - close popup, NO notification
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      setClickCount(0);
      onClose();
    }
  };
  
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
        onClick={handleOverlayClick}
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