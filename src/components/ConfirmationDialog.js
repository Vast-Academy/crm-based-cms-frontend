import React, { useEffect, useState, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
  isLoading = false,
  variant = 'default'
}) => {
  const { showNotification } = useNotification();

  // Modal registry setup
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(50); // z-50 from the modal div

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
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    };
  }, [isOpen]);

  // Reset ESC and click counters when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEscPressCount(0);
      setClickCount(0);
      if (escPressTimer) clearTimeout(escPressTimer);
      if (clickTimer) clearTimeout(clickTimer);
    }
  }, [isOpen]);

  // Double ESC handler
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen && isTopmostModal()) {
        if (escPressCount === 0) {
          setEscPressCount(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          onCancel();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      if (escPressTimer) clearTimeout(escPressTimer);
    };
  }, [isOpen, onCancel, escPressCount, escPressTimer, showNotification]);

  // Handle overlay click - requires double click to close
  const handleOverlayClick = () => {
    if (!isTopmostModal()) return;

    if (clickCount === 0) {
      setClickCount(1);
      const timer = setTimeout(() => {
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCount(0);
      }, 800);
      setClickTimer(timer);
    } else if (clickCount === 1) {
      if (clickTimer) clearTimeout(clickTimer);
      setClickCount(0);
      onCancel();
    }
  };

  if (!isOpen) return null;

  const getConfirmButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center';
      default:
        return 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${getConfirmButtonStyle()} ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
