import React from 'react';
import {
  X,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const ReturnLogsModal = ({ isOpen, onClose, returnRequests, onRequestClick, darkMode = false }) => {
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

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex justify-center items-center p-4`} style={{zIndex: 9000}}>
      <div className={`w-full max-w-4xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'} flex justify-between items-center`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center`}>
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Return Request Logs</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                All your return requests ({returnRequests.length} total)
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
            {returnRequests.length > 0 ? (
              <div className="space-y-2">
                {returnRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => onRequestClick(request)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      request.status === 'pending' ? 'bg-orange-500' :
                      request.status === 'confirmed' ? 'bg-green-500' :
                      request.status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}>
                      <Package size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800">
                        Return Request - {request.itemCount} item{request.itemCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        {request.totalQuantity} units • {formatDate(request.returnedAt)} • {
                          request.status === 'pending' ? 'Pending Review' :
                          request.status === 'confirmed' ? 'Confirmed' :
                          request.status === 'rejected' ? 'Rejected' :
                          request.status
                        }
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'pending' ? 'Pending' :
                       request.status === 'confirmed' ? 'Confirmed' :
                       request.status === 'rejected' ? 'Rejected' :
                       request.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No Return Requests Yet
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You haven't made any return requests yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 p-4 ${darkMode ? 'border-t border-gray-700 bg-gray-800' : 'border-t border-gray-200 bg-white'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnLogsModal;