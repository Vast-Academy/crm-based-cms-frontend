import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Trash2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SummaryApi from '../common';
import { compressImage } from '../utils/imageCompression';

const ChangeProfilePictureModal = ({ isOpen, onClose }) => {
  const { user, updateUserContext } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('');
      setUploadSuccess(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size allowed is 5MB.');
      return;
    }

    setError('');

    try {
      // Compress the image automatically
      const compressedFile = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        maxSizeKB: 300
      });

      setSelectedFile(compressedFile);

      // Create preview URL for compressed file
      const url = URL.createObjectURL(compressedFile);
      setPreviewUrl(url);

      // Show compression info if significant reduction
      if (file.size > compressedFile.size * 1.2) {
        console.log(`Image compressed from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`);
      }

    } catch (compressionError) {
      console.error('Image compression failed:', compressionError);
      // Fall back to original file if compression fails
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError('');

      // Create FormData
      const formData = new FormData();
      formData.append('profileImage', selectedFile);

      // Upload to backend
      const response = await fetch(SummaryApi.uploadProfilePicture.url, {
        method: SummaryApi.uploadProfilePicture.method,
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Update user context with new profile image
        if (updateUserContext) {
          updateUserContext(data.data.user);
        }

        setUploadSuccess(true);

        // Close modal after success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.profileImage) return;

    try {
      setIsUploading(true);
      setError('');

      const response = await fetch(SummaryApi.deleteProfilePicture.url, {
        method: SummaryApi.deleteProfilePicture.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Update user context
        if (updateUserContext) {
          updateUserContext(data.data.user);
        }

        setUploadSuccess(true);

        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Change Profile Picture</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isUploading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {uploadSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Success!</h4>
              <p className="text-gray-600">Your profile picture has been updated.</p>
            </div>
          ) : (
            <>
              {/* Current Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Current Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-2xl font-medium text-gray-600">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">Current Profile Picture</p>
              </div>

              {/* File Upload Area */}
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Upload New Picture
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Drag and drop an image here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPEG, PNG, WebP • Max size: 5MB
                  </p>
                </div>
              ) : (
                /* Image Preview */
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                    />
                    <button
                      onClick={clearSelection}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={isUploading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                {selectedFile ? (
                  <>
                    <button
                      onClick={clearSelection}
                      disabled={isUploading}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Picture
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="w-full">
                    {user?.profileImage && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                        className="w-full mb-3 px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2"></div>
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Current Picture
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Photo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default ChangeProfilePictureModal;