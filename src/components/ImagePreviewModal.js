import React from 'react';
import { X } from 'lucide-react';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {userName}'s Profile Picture
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex items-center justify-center p-4 bg-gray-50">
          <img
            src={imageUrl}
            alt="Profile Preview"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            style={{ maxWidth: '600px', maxHeight: '600px' }}
          />
        </div>
      </div>

      {/* Backdrop to close modal */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      ></div>
    </div>
  );
};

export default ImagePreviewModal;