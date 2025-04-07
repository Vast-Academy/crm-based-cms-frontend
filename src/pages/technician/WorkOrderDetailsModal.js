import React from 'react';
import { FiX, FiUser, FiMapPin, FiPhone, FiMail, FiCalendar, FiInfo } from 'react-icons/fi';

const WorkOrderDetailsModal = ({ isOpen, onClose, workOrder }) => {
  if (!isOpen || !workOrder) return null;
  
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
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Work Order Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-4">
          {/* Status Badge */}
          <div className="mb-4 flex justify-between items-center">
            <span className={`px-3 py-1 rounded-full text-sm capitalize ${
              workOrder.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
              workOrder.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'
            }`}>
              {workOrder.status}
            </span>
            
            <div className="text-sm text-gray-500">
              <FiCalendar className="inline mr-1" />
              {formatDate(workOrder.createdAt)}
            </div>
          </div>
          
          {/* Basic Work Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-lg mb-2">{workOrder.projectType}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Order ID:</span> {workOrder.orderId}</p>
              <p><span className="text-gray-500">Project ID:</span> {workOrder.projectId}</p>
              {workOrder.branchName && (
                <p><span className="text-gray-500">Branch:</span> {workOrder.branchName}</p>
              )}
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="mb-4">
            <h3 className="text-md font-medium flex items-center mb-3">
              <FiUser className="mr-2" />
              Customer Information
            </h3>
            
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <p className="font-medium">{workOrder.customerName}</p>
              
              {workOrder.customerPhone && (
                <p className="flex items-center text-sm">
                  <FiPhone className="mr-2 text-gray-500" />
                  {workOrder.customerPhone}
                </p>
              )}
              
              {workOrder.customerEmail && (
                <p className="flex items-center text-sm">
                  <FiMail className="mr-2 text-gray-500" />
                  {workOrder.customerEmail}
                </p>
              )}
              
              {workOrder.customerAddress && (
                <p className="flex items-start text-sm">
                  <FiMapPin className="mr-2 text-gray-500 mt-1" />
                  <span>{workOrder.customerAddress}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Project Requirements */}
          {workOrder.initialRemark && (
            <div className="mb-4">
              <h3 className="text-md font-medium flex items-center mb-3">
                <FiInfo className="mr-2" />
                Project Requirements
              </h3>
              
              <div className="bg-white border rounded-lg p-3">
                <p className="text-sm">{workOrder.initialRemark}</p>
              </div>
            </div>
          )}
          
          {/* Instructions */}
          {workOrder.instructions && (
            <div className="mb-4">
              <h3 className="text-md font-medium flex items-center mb-3">
                <FiInfo className="mr-2" />
                Instructions
              </h3>
              
              <div className="bg-white border rounded-lg p-3">
                <p className="text-sm">{workOrder.instructions}</p>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <button 
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md"
              onClick={() => {
                // Update status to in-progress (implement this functionality)
                alert('Status update feature will be implemented');
              }}
            >
              {workOrder.status === 'assigned' ? 'Start Work' : 
               workOrder.status === 'in-progress' ? 'Mark as Complete' : 
               'View Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailsModal;