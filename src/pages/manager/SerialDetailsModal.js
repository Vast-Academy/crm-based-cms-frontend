import React, { useState } from 'react';
import { FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

const SerialDetailsModal = ({ isOpen, onClose, productDetails, onRegisterWarranty  }) => {
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !productDetails) return null;

  // Calculate warranty status
  const calculateWarrantyStatus = () => {
    if (!productDetails.installationDate || !productDetails.warranty) {
      return { isUnderWarranty: false, message: 'Unknown' };
    }

    const installDate = new Date(productDetails.installationDate);
    const today = new Date();
    
    // Parse warranty period (e.g., "1 year", "6 months")
    let warrantyPeriodInDays = 0;
    const warrantyText = productDetails.warranty.toLowerCase();
    
    if (warrantyText.includes('year')) {
      const years = parseInt(warrantyText.match(/\d+/)[0]);
      warrantyPeriodInDays = years * 365;
    } else if (warrantyText.includes('month')) {
      const months = parseInt(warrantyText.match(/\d+/)[0]);
      warrantyPeriodInDays = months * 30;
    } else if (warrantyText.includes('day')) {
      warrantyPeriodInDays = parseInt(warrantyText.match(/\d+/)[0]);
    }
    
    // If no warranty or "No Warranty"
    if (warrantyPeriodInDays === 0 || warrantyText.includes('no warranty')) {
      return { isUnderWarranty: false, message: 'No Warranty' };
    }
    
    const warrantyEndDate = new Date(installDate);
    warrantyEndDate.setDate(installDate.getDate() + warrantyPeriodInDays);
    
    const isUnderWarranty = today <= warrantyEndDate;
    
    // Calculate remaining days
    const remainingDays = Math.ceil((warrantyEndDate - today) / (1000 * 60 * 60 * 24));
    
    if (isUnderWarranty) {
      return { 
        isUnderWarranty: true, 
        message: `Under Warranty (${remainingDays} days remaining)`,
        endDate: warrantyEndDate.toLocaleDateString()
      };
    } else {
      return { 
        isUnderWarranty: false, 
        message: `Warranty Expired (${Math.abs(remainingDays)} days ago)`,
        endDate: warrantyEndDate.toLocaleDateString()
      };
    }
  };

  const warrantyStatus = calculateWarrantyStatus();

  // Handle register warranty
  const handleRegisterWarranty = () => {
    // Validate
    if (!issueDescription.trim()) {
      setError('Please describe the issue to register warranty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Call the parent handler with the data
    onRegisterWarranty({
      serialNumber: productDetails.serialNumber,
      productName: productDetails.productName,
      customerName: productDetails.customerName,
      customerPhone: productDetails.customerPhone, 
      workOrderId: productDetails.workOrderId,
      issueDescription: issueDescription,
      registrationDate: new Date()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white max-h-[500px] overflow-y-auto rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Product Warranty Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {/* Serial Number */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-500">Serial Number</h3>
            <p className="font-medium">{productDetails.serialNumber}</p>
          </div>
          
          {/* Product Details */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-500">Product</h3>
            <p className="font-medium">{productDetails.productName}</p>
            {productDetails.price && (
              <p className="text-sm text-gray-700">Price: ₹{productDetails.price.toFixed(2)}</p>
            )}
          </div>
          
          {/* Customer Details */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-500">Customer</h3>
            <p className="font-medium">{productDetails.workOrderId}</p>
            <p className="font-medium">{productDetails.customerName}</p>
            {productDetails.customerPhone && (
              <p className="text-sm text-gray-700">Phone: {productDetails.customerPhone}</p>
            )}
          </div>
          
          {/* Installation Details */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-500">Installation Details</h3>
            <p className="text-sm">
              <span className="font-medium">Date: </span>
              {productDetails.installationDate 
                ? new Date(productDetails.installationDate).toLocaleDateString()
                : 'Unknown'
              }
            </p>
            <p className="text-sm">
              <span className="font-medium">Technician: </span>
              {productDetails.technicianName || 'Unknown'}
            </p>
          </div>
          
          {/* Warranty Information */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-500">Warranty</h3>
            <p className="text-sm">
              <span className="font-medium">Period: </span>
              {productDetails.warranty || 'Unknown'}
            </p>
            {warrantyStatus.endDate && (
              <p className="text-sm">
                <span className="font-medium">End Date: </span>
                {warrantyStatus.endDate}
              </p>
            )}
          </div>
          
          {/* Warranty Status Box */}
          <div className={`p-3 rounded-md flex items-center ${
            warrantyStatus.isUnderWarranty
              ? 'bg-green-100'
              : 'bg-red-100'
          }`}>
            {warrantyStatus.isUnderWarranty ? (
              <FiCheck className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <FiAlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <span className={warrantyStatus.isUnderWarranty ? 'text-green-800' : 'text-red-800'}>
              {warrantyStatus.message}
            </span>
          </div>

           {/* Issue Description Field - Only show if under warranty */}
           {warrantyStatus.isUnderWarranty && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description *
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue with this product..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              ></textarea>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>

          {/* Only show Register Warranty button if under warranty */}
          {warrantyStatus.isUnderWarranty && (
            <button 
              onClick={handleRegisterWarranty}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Register Warranty'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SerialDetailsModal;