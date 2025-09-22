import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import SummaryApi from '../common';
import { useNotification } from '../context/NotificationContext';

const ExportInventoryButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { showNotification } = useNotification();

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Make API call to export inventory
      const response = await fetch(SummaryApi.exportInventory.url, {
        method: SummaryApi.exportInventory.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export inventory');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'inventory_backup.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showNotification('success', 'Inventory exported successfully!');

    } catch (error) {
      console.error('Error exporting inventory:', error);
      showNotification('error', error.message || 'Failed to export inventory');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Export inventory items to Excel file"
    >
      {isExporting ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <FiDownload className="h-6 w-6" />
      )}
    </button>
  );
};

export default ExportInventoryButton;