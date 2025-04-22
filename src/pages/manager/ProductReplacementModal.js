import React, { useState } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

const ProductReplacementModal = ({ isOpen, onClose, replacementData, onCompleteReplacement }) => {
  const [step, setStep] = useState('details'); // 'details' or 'replace'
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [replacementRemarks, setReplacementRemarks] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !replacementData) return null;

  const { productDetails } = replacementData;

  // Handle replace product button click
  const handleReplaceProduct = () => {
    setStep('replace');
  };

  // Handle back button click
  const handleBack = () => {
    setStep('details');
  };

  // Handle complete replacement
  const handleCompleteReplacement = () => {
    // Validate inputs
    if (!newSerialNumber.trim()) {
      setError('New serial number is required');
      return;
    }

    if (!replacementRemarks.trim()) {
      setError('Replacement remarks are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Call the parent handler to complete the replacement
    onCompleteReplacement({
      replacementId: replacementData._id,
      originalSerialNumber: replacementData.serialNumber,
      newSerialNumber: newSerialNumber.trim(),
      remarks: replacementRemarks.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            {step === 'replace' && (
              <button 
                onClick={handleBack}
                className="mr-2 p-1 rounded-full hover:bg-gray-100"
              >
                <FiArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 'details' ? 'Product Warranty Details' : 'Product Replacement'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX size={20} />
          </button>
        </div>
        
        {/* Details View */}
        {step === 'details' && (
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
            
            {/* Issue Description */}
            <div className="mb-4">
              <h3 className="text-sm text-gray-500">Issue Description</h3>
              <p className="text-sm border p-2 rounded bg-gray-50">
                {replacementData.issueDescription}
              </p>
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              
              {replacementData.status === 'pending' && (
                <button 
                  onClick={handleReplaceProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Replace Product
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Replacement View */}
        {step === 'replace' && (
          <div className="p-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Replacing product: <span className="font-medium">{productDetails.productName}</span> with serial number <span className="font-medium">{productDetails.serialNumber}</span>
              </p>
            </div>
            
            {/* New Serial Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Product Serial Number *
              </label>
              <input
                type="text"
                value={newSerialNumber}
                onChange={(e) => setNewSerialNumber(e.target.value)}
                placeholder="Enter new product serial number"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Replacement Remarks */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replacement Remarks *
              </label>
              <textarea
                value={replacementRemarks}
                onChange={(e) => setReplacementRemarks(e.target.value)}
                placeholder="Enter reason for replacement"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="p-4 border-t flex justify-end space-x-3">
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              
              <button 
                onClick={handleCompleteReplacement}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Complete Replacement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReplacementModal;