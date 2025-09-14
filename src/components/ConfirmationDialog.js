import React from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
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
