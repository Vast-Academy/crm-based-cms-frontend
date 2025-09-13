import React, { useState } from 'react';
import Modal from './Modal';
import SummaryApi from '../common';

const ConvertTypeModal = ({ isOpen, onClose, leadData, onConvertSuccess }) => {
  const [selectedType, setSelectedType] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);

  const handleTypeSelection = () => {
    if (!selectedType) return;

    if (selectedType === 'customer') {
      // For customer, close this modal and trigger existing customer conversion flow
      onClose();
      onConvertSuccess('customer');
    } else {
      // For dealer/distributor, show confirmation
      setShowConfirmation(true);
      setError(null);
    }
  };

  const handleConfirmConversion = async () => {
    setConverting(true);
    setError(null);

    try {
      let apiEndpoint;

      if (selectedType === 'dealer') {
        apiEndpoint = `${SummaryApi.convertToDealer.url}/${leadData._id}`;
      } else if (selectedType === 'distributor') {
        apiEndpoint = `${SummaryApi.convertToDistributor.url}/${leadData._id}`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        onConvertSuccess(selectedType, data.data);
        onClose();
      } else {
        setError(data.message || `Failed to convert lead to ${selectedType}`);
      }
    } catch (err) {
      setError(`Server error while converting to ${selectedType}. Please try again.`);
      console.error('Conversion error:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleClose = () => {
    setSelectedType('');
    setShowConfirmation(false);
    setConverting(false);
    setError(null);
    onClose();
  };

  const getTypeDisplayName = (type) => {
    switch(type) {
      case 'customer': return 'Customer';
      case 'dealer': return 'Dealer';
      case 'distributor': return 'Distributor';
      default: return type;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showConfirmation ? 'Confirm Conversion' : 'Convert Lead'}
      size="md"
    >
      <div className="p-6">
        {!showConfirmation ? (
          // Type selection screen
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Convert "{leadData?.name}" to:
              </h3>
              <p className="text-sm text-gray-500">
                Select the type you want to convert this lead into
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="convertType"
                  value="customer"
                  checked={selectedType === 'customer'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-purple-800">Customer</div>
                  <div className="text-sm text-gray-500">Convert to customer and start a project</div>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="convertType"
                  value="dealer"
                  checked={selectedType === 'dealer'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-orange-800">Dealer</div>
                  <div className="text-sm text-gray-500">Convert to dealer for business partnership</div>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="convertType"
                  value="distributor"
                  checked={selectedType === 'distributor'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-teal-800">Distributor</div>
                  <div className="text-sm text-gray-500">Convert to distributor for product distribution</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTypeSelection}
                disabled={!selectedType}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          // Confirmation screen for dealer/distributor
          <>
            <div className="mb-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirm Conversion
              </h3>
              <p className="text-center text-gray-500">
                Are you sure you want to convert "{leadData?.name}" to a {getTypeDisplayName(selectedType)}?
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Lead Information:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Name:</strong> {leadData?.name}</div>
                <div><strong>Phone:</strong> {leadData?.phoneNumber}</div>
                {leadData?.firmName && <div><strong>Firm:</strong> {leadData?.firmName}</div>}
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={converting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmConversion}
                disabled={converting}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {converting ? 'Converting...' : `Yes, Convert to ${getTypeDisplayName(selectedType)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ConvertTypeModal;