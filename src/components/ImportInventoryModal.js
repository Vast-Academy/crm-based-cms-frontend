import React, { useState } from 'react';
import { FiX, FiUpload, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import SummaryApi from '../common';
import { useNotification } from '../context/NotificationContext';

const ImportInventoryModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { showNotification } = useNotification();

  const resetState = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setIsUploading(false);
    setDragOver(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showNotification('error', 'File size too large. Maximum size allowed is 10MB.');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showNotification('error', 'Please select a file first');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('inventory', selectedFile);

      const response = await fetch(SummaryApi.importInventory.url, {
        method: SummaryApi.importInventory.method,
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult({
          success: true,
          message: data.message,
          importedCount: data.importedCount,
          totalProcessed: data.totalProcessed,
          importedItems: data.importedItems
        });

        showNotification('success', data.message);

        // Call success callback to refresh inventory list
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setUploadResult({
          success: false,
          message: data.message,
          errors: data.errors,
          totalErrors: data.totalErrors,
          existingIds: data.existingIds,
          duplicateIds: data.duplicateIds
        });

        showNotification('error', data.message);
      }

    } catch (error) {
      console.error('Error importing inventory:', error);
      setUploadResult({
        success: false,
        message: 'Network error. Please try again.',
        errors: [error.message]
      });
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Import Inventory</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FiUpload className="mx-auto text-gray-400 mb-4" size={48} />

            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  ✓ File selected: {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg text-gray-600">
                  Drop your Excel file here, or{' '}
                  <label className="text-blue-500 hover:text-blue-700 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={handleFileInputChange}
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500">
                  Supports: .xlsx, .xls files (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Important Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Excel file should contain columns: ID, Name, Type, Unit, Warranty, MRP, Purchase Price, Customer Price, Dealer Price, Distributor Price</li>
              <li>• Type must be: 'serialized-product', 'generic-product', or 'service'</li>
              <li>• All pricing fields are required and must be greater than 0</li>
              <li>• Each item ID must be unique</li>
              <li>• Stock will be empty after import - managers can add stock separately</li>
            </ul>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`mt-6 p-4 rounded-lg ${
              uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {uploadResult.success ? (
                  <FiCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <FiAlertTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                )}

                <div className="flex-1">
                  <p className={`font-medium ${
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {uploadResult.message}
                  </p>

                  {uploadResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>Imported: {uploadResult.importedCount} items</p>
                      <p>Total processed: {uploadResult.totalProcessed} rows</p>

                      {uploadResult.importedItems && uploadResult.importedItems.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Imported items:</p>
                          <div className="max-h-32 overflow-y-auto">
                            {uploadResult.importedItems.slice(0, 10).map((item, index) => (
                              <p key={index} className="text-xs">
                                • {item.id} - {item.name} ({item.type})
                              </p>
                            ))}
                            {uploadResult.importedItems.length > 10 && (
                              <p className="text-xs">... and {uploadResult.importedItems.length - 10} more</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!uploadResult.success && (
                    <div className="mt-2 text-sm text-red-700">
                      {uploadResult.errors && (
                        <div>
                          <p className="font-medium">Errors found:</p>
                          <div className="max-h-32 overflow-y-auto">
                            {uploadResult.errors.map((error, index) => (
                              <p key={index} className="text-xs">• {error}</p>
                            ))}
                          </div>
                          {uploadResult.totalErrors > uploadResult.errors.length && (
                            <p className="text-xs mt-1">
                              ... and {uploadResult.totalErrors - uploadResult.errors.length} more errors
                            </p>
                          )}
                        </div>
                      )}

                      {uploadResult.existingIds && (
                        <div className="mt-2">
                          <p className="font-medium">Existing IDs found:</p>
                          <p className="text-xs">{uploadResult.existingIds.join(', ')}</p>
                        </div>
                      )}

                      {uploadResult.duplicateIds && (
                        <div className="mt-2">
                          <p className="font-medium">Duplicate IDs in file:</p>
                          <p className="text-xs">{uploadResult.duplicateIds.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
          >
            {uploadResult?.success ? 'Close' : 'Cancel'}
          </button>

          {!uploadResult?.success && (
            <button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
              className="inline-flex justify-center items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <FiUpload className="mr-2" />
                  Import Inventory
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportInventoryModal;