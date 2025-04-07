import React, { useRef, useEffect, useState } from 'react';
import { FiX, FiUser, FiMapPin, FiCalendar, FiInfo, FiPlay, FiPause } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';

const WorkOrderDetailsModal = ({ isOpen, onClose, workOrder, onStatusUpdate }) => {
  const modalContentRef = useRef(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Reset remark when modal opens with a different work order
  useEffect(() => {
    setRemark('');
    setError(null);
  }, [workOrder?.orderId]);
  
  // Set up a scrollable container to ensure visibility of all content
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, workOrder]);
  
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

  // Function to check if technician already has an active project
  const checkActiveProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getTechnicianActiveProject.url, {
        method: SummaryApi.getTechnicianActiveProject.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.hasActiveProject && data.activeProject.orderId !== workOrder.orderId) {
          setError(`You already have an active project: ${data.activeProject.projectType}. Please pause it before starting a new one.`);
          return true;
        }
        return false;
      } else {
        setError(data.message || 'Failed to check active projects');
        return true;
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error checking active project:', err);
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Function to update the work order status
  const updateStatus = async (newStatus) => {
    // For starting a project, check if there's an active project first
    if (newStatus === 'in-progress') {
      const hasActiveProject = await checkActiveProject();
      if (hasActiveProject) return;
    }
    
    // For resume, also check for active projects
    if (newStatus === 'in-progress' && workOrder.status === 'paused') {
      const hasActiveProject = await checkActiveProject();
      if (hasActiveProject) return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
        method: SummaryApi.updateWorkOrderStatus.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: workOrder.customerId,
          orderId: workOrder.orderId,
          status: newStatus,
          remark: remark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Call the parent component's onStatusUpdate to refresh data
        if (onStatusUpdate) {
          onStatusUpdate(data.data);
        }
        
        // Close the modal for pause action
        if (newStatus === 'paused') {
          onClose();
        }
        
        // Reset remark field
        setRemark('');
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error updating work order status:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-start z-50 p-2 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden my-4">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Work Order Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div 
          ref={modalContentRef}
          className="overflow-y-auto p-4"
          style={{ maxHeight: 'calc(90vh - 60px)' }}
        >
          {/* Status Badge */}
          <div className="mb-4 flex justify-between items-center">
            <span className={`px-3 py-1 rounded-full text-sm capitalize ${
              workOrder.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
              workOrder.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
              workOrder.status === 'paused' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              {workOrder.status}
            </span>
            
            <div className="text-sm text-gray-500">
              <FiCalendar className="inline mr-1" />
              {formatDate(workOrder.createdAt)}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Basic Work Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-lg mb-2">
              Project Type: {workOrder.projectType}
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Order ID:</span> {workOrder.orderId}</p>
              <p><span className="text-gray-500">Project ID:</span> {workOrder.projectId}</p>
              {workOrder.branchName && (
                <p><span className="text-gray-500">Branch:</span> {workOrder.branchName}</p>
              )}
            </div>
          </div>
          
          {/* Customer Information - Show only address for simplicity */}
          <div className="mb-4">
            <h3 className="text-md font-medium flex items-center mb-3">
              <FiUser className="mr-2" />
              Customer Information
            </h3>
            
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <p className="font-medium">{workOrder.customerName}</p>
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
          
          {/* Status History (if any) */}
          {workOrder.statusHistory && workOrder.statusHistory.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-3">Status History</h3>
              
              <div className="bg-white border rounded-lg p-3">
                <div className="space-y-3">
                  {workOrder.statusHistory.map((history, index) => (
                    <div key={index} className="text-sm border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{history.status}</span>
                        <span className="text-gray-500">{formatDate(history.updatedAt)}</span>
                      </div>
                      {history.remark && <p className="mt-1 text-gray-600">{history.remark}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Action Area */}
          <div className="mt-6 space-y-4">
            {/* For assigned work orders - show Start Project button */}
            {workOrder.status === 'assigned' && (
              <button 
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center"
                onClick={() => updateStatus('in-progress')}
                disabled={loading}
              >
                <FiPlay className="mr-2" /> Start Project
              </button>
            )}
            
            {/* For in-progress work orders - show Pause Project with remark input */}
            {workOrder.status === 'in-progress' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for pausing
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter reason for pausing this project..."
                  ></textarea>
                </div>
                
                <button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md flex items-center justify-center"
                  onClick={() => updateStatus('paused')}
                  disabled={loading || !remark.trim()}
                >
                  <FiPause className="mr-2" /> Pause Project
                </button>
              </>
            )}
            
            {/* For paused work orders - show Resume Project with remark input */}
            {workOrder.status === 'paused' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for resuming
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter reason for resuming this project..."
                  ></textarea>
                </div>
                
                <button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center"
                  onClick={() => updateStatus('in-progress')}
                  disabled={loading || !remark.trim()}
                >
                  <FiPlay className="mr-2" /> Resume Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailsModal;