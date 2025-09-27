import React from 'react';
import {
  X,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const ReturnRequestDetailsModal = ({ isOpen, onClose, requestData, darkMode = false }) => {

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status color and icon
  const getStatusDetails = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: <Clock size={16} className="mr-1" />,
          text: 'Pending Review'
        };
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle size={16} className="mr-1" />,
          text: 'Confirmed'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircle size={16} className="mr-1" />,
          text: 'Rejected'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle size={16} className="mr-1" />,
          text: status
        };
    }
  };


  if (!isOpen || !requestData) return null;

  const statusDetails = getStatusDetails(requestData.status);

  return (
    <div className={`fixed inset-0 bg-black/70 flex justify-center items-center p-4`} style={{zIndex: 9999}}>
      <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'} flex justify-between items-center`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-teal-600' : 'bg-teal-500'} flex items-center justify-center`}>
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Return Request Details</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Submitted on {formatDate(requestData.returnedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          <div className="p-4">
            {/* Status Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Request Status
                </h3>
                <div className={`px-3 py-1 rounded-full flex items-center ${statusDetails.color}`}>
                  {statusDetails.icon}
                  {statusDetails.text}
                </div>
              </div>

              {/* Status Timeline */}
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                {requestData.status === 'confirmed' && requestData.confirmedBy && (
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Confirmed by:</strong> {requestData.confirmedBy.name} ({requestData.confirmedBy.username})
                    <br />
                    <strong>Confirmed on:</strong> {formatDate(requestData.confirmedAt)}
                  </p>
                )}
                {requestData.status === 'rejected' && (
                  <div>
                    {requestData.rejectedBy && (
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        <strong>Rejected by:</strong> {requestData.rejectedBy.name} ({requestData.rejectedBy.username})
                        <br />
                        <strong>Rejected on:</strong> {formatDate(requestData.rejectedAt)}
                      </p>
                    )}
                    {requestData.rejectionReason && (
                      <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                          Rejection Reason:
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'} italic mt-1`}>
                          "{requestData.rejectionReason}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-6">
              <h3 className={`text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Returned Items ({requestData.itemCount} items, {requestData.totalQuantity} units)
              </h3>

              <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Item Name
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Type
                      </th>
                      <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Quantity
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Serial Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {requestData.items.map((item) => (
                      <tr key={item.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'serialized-product'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type === 'serialized-product' ? 'Serialized' : 'Generic'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          {item.quantity} {item.unit || 'units'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          {item.serialNumber ? (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                              {item.serialNumber}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-4 ${darkMode ? 'border-t border-gray-700 bg-gray-800' : 'border-t border-gray-200 bg-white'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestDetailsModal;