import React, { useState } from 'react';
import { FiDownload, FiUpload, FiAlertTriangle, FiCheckCircle, FiDatabase, FiX, FiInfo } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useNotification } from '../../context/NotificationContext';

const SoftwareBackupSettings = () => {
  const { showNotification } = useNotification();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle Export/Download Full Backup
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);

      const response = await fetch(SummaryApi.exportFullBackup.url, {
        method: SummaryApi.exportFullBackup.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export backup');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'software_full_backup.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert to blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showNotification('success', 'Software backup exported successfully!');

    } catch (error) {
      console.error('Error exporting backup:', error);
      showNotification('error', error.message || 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  // File selection handling
  const handleFileSelect = (file) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB limit
    if (file.size > maxSize) {
      showNotification('error', 'File size too large. Maximum size allowed is 50MB.');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
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

  // Handle Import/Restore
  const handleImportBackup = async () => {
    if (!selectedFile) {
      showNotification('error', 'Please select a backup file first');
      return;
    }

    try {
      setIsImporting(true);

      const formData = new FormData();
      formData.append('backup', selectedFile);

      const response = await fetch(SummaryApi.importFullBackup.url, {
        method: SummaryApi.importFullBackup.method,
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setImportResult({
          success: true,
          message: data.message,
          stats: data.stats,
          totalImported: data.totalImported
        });

        showNotification('success', data.message);

        // Close confirmation dialog
        setShowConfirmDialog(false);

        // Reload after 3 seconds to reflect new data
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } else {
        setImportResult({
          success: false,
          message: data.message,
          error: data.error
        });

        showNotification('error', data.message);
        setShowConfirmDialog(false);
      }

    } catch (error) {
      console.error('Error importing backup:', error);
      setImportResult({
        success: false,
        message: 'Network error. Please try again.',
        error: error.message
      });
      showNotification('error', 'Network error. Please try again.');
      setShowConfirmDialog(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setImportResult(null);
    setShowConfirmDialog(false);
  };

  const handleProceedToConfirm = () => {
    if (!selectedFile) {
      showNotification('error', 'Please select a backup file first');
      return;
    }
    setShowConfirmDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiDatabase className="text-blue-600" />
          Software Backup & Restore
        </h2>
        <p className="text-gray-600 mt-2">
          Manage complete system backups and restore data when needed
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <FiAlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Important Information</h3>
          <ul className="text-sm text-amber-800 mt-2 space-y-1">
            <li>• Backup includes all branches, users, customers, inventory, bills, and transaction data</li>
            <li>• Restoring will REPLACE all existing data with the backup data</li>
            <li>• Always create a backup before restoring to avoid data loss</li>
            <li>• Only administrators can perform backup and restore operations</li>
          </ul>
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiDownload className="text-green-600" />
              Download Complete Backup
            </h3>
            <p className="text-gray-600 mt-2 text-sm">
              Export all software data including users, branches, customers, inventory, bills, and transactions to an Excel file.
            </p>
            <div className="mt-4 bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600 font-medium mb-2">Backup includes:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-700">
                <div>• Branches</div>
                <div>• Users</div>
                <div>• Inventory Items</div>
                <div>• Customers</div>
                <div>• Leads</div>
                <div>• Dealers</div>
                <div>• Distributors</div>
                <div>• Sales Bills</div>
                <div>• Bills</div>
                <div>• Bank Accounts</div>
                <div>• Transfer History</div>
                <div>• Warranty Records</div>
                <div>• Stock History</div>
                <div>• Transactions</div>
                <div>• And more...</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="ml-4 flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload className="mr-2" size={20} />
                Download Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiUpload className="text-blue-600" />
              Restore from Backup
            </h3>
            <p className="text-gray-600 mt-2 text-sm">
              Upload a previously downloaded backup file to restore all software data.
            </p>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <FiAlertTriangle className="flex-shrink-0" />
                Warning: This will DELETE all existing data and replace it with the backup data!
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenImportModal}
            className="ml-4 flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiUpload className="mr-2" size={20} />
            Restore Backup
          </button>
        </div>
      </div>

      {/* Import/Restore Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FiUpload />
                Restore Software Backup
              </h2>
              <button
                onClick={handleCloseImportModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!showConfirmDialog ? (
                <>
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
                        <div className="flex items-center justify-center gap-2">
                          <FiCheckCircle className="text-green-600" size={20} />
                          <p className="text-sm text-green-600 font-medium">
                            File selected: {selectedFile.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg text-gray-600">
                          Drop your backup file here, or{' '}
                          <label className="text-blue-500 hover:text-blue-700 cursor-pointer font-medium">
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
                          Supports: .xlsx, .xls files (Max 50MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Important Instructions */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Before You Restore:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Make sure you have a recent backup of current data</li>
                          <li>• All users will need to re-login after restore</li>
                          <li>• The restore process may take a few minutes</li>
                          <li>• Do not close the browser during restore</li>
                          <li>• Verify the backup file is from a trusted source</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Import Result */}
                  {importResult && (
                    <div className={`mt-6 p-4 rounded-lg border ${
                      importResult.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {importResult.success ? (
                          <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                        ) : (
                          <FiAlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${
                            importResult.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {importResult.message}
                          </p>

                          {importResult.success && importResult.stats && (
                            <div className="mt-3 text-sm text-green-800">
                              <p className="font-medium mb-2">Import Summary:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(importResult.stats).map(([key, count]) => (
                                  count > 0 && (
                                    <div key={key} className="flex justify-between">
                                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                      <span className="font-semibold">{count}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-green-300 flex justify-between font-semibold">
                                <span>Total Imported:</span>
                                <span>{importResult.totalImported}</span>
                              </div>
                            </div>
                          )}

                          {!importResult.success && importResult.error && (
                            <div className="mt-2 text-sm text-red-700">
                              <p className="font-medium">Error details:</p>
                              <p className="mt-1">{importResult.error}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Confirmation Dialog */
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <FiAlertTriangle className="text-red-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Are you absolutely sure?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    This action will <span className="font-bold text-red-600">DELETE ALL EXISTING DATA</span> and replace it with the backup data from:
                  </p>
                  <div className="bg-gray-100 rounded-lg p-3 mb-6 inline-block">
                    <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 font-medium">
                      This action CANNOT be undone!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              {!showConfirmDialog ? (
                <>
                  <button
                    onClick={handleCloseImportModal}
                    className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>

                  {!importResult?.success && (
                    <button
                      onClick={handleProceedToConfirm}
                      disabled={!selectedFile}
                      className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={isImporting}
                    className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Go Back
                  </button>

                  <button
                    onClick={handleImportBackup}
                    disabled={isImporting}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isImporting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Restoring...
                      </span>
                    ) : (
                      'Yes, Restore Backup'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareBackupSettings;
