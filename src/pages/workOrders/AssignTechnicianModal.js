// components/AssignTechnicianModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSave, FiX, FiRefreshCw } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

const AssignTechnicianModal = ({ isOpen, onClose, workOrder, onSuccess, canCancelWorkOrder, onCancelClick }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Modal registry setup
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(50); // z-50 from the modal div

  // Double ESC and double click states
  const [escPressCount, setEscPressCount] = useState(0);
  const [escPressTimer, setEscPressTimer] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  // Check if this modal is the topmost modal
  const isTopmostModal = () => {
    if (!window.__modalRegistry || window.__modalRegistry.size === 0) return true;

    let highestZIndex = 0;
    window.__modalRegistry.forEach(modal => {
      if (modal.zIndex > highestZIndex) {
        highestZIndex = modal.zIndex;
      }
    });

    return numericZIndex.current >= highestZIndex;
  };

  const [loading, setLoading] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [error, setError] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [instructions, setInstructions] = useState('');
  
  // Fetch technicians based on user role
  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);

      // Use different endpoint based on role
      const endpoint = user.role === 'admin'
        ? SummaryApi.getTechnicianUsers.url
        : SummaryApi.getManagerTechnician.url;

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        let filteredTechnicians = data.data;

        // For admin, filter technicians by branch from work order
        if (user.role === 'admin' && workOrder && workOrder.branchId) {
          filteredTechnicians = data.data.filter(tech => {
            const techBranchId = tech.branch?._id || tech.branch;
            const workOrderBranchId = workOrder.branchId;
            return techBranchId === workOrderBranchId;
          });
        }

        setTechnicians(filteredTechnicians);
      } else {
        setError('Failed to load technicians');
      }
    } catch (err) {
      setError('Server error while loading technicians');
      console.error('Error fetching technicians:', err);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleRefreshTechnicians = () => {
    if (loadingTechnicians) return;
    setError(null);
    fetchTechnicians();
  };

  // Register/unregister modal in global registry
  useEffect(() => {
    if (isOpen) {
      window.__modalRegistry.add({
        id: modalId.current,
        zIndex: numericZIndex.current
      });
    } else {
      // Remove this modal from registry
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
      // Cleanup on unmount
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    };
  }, [isOpen]);

  // Reset ESC and click counters when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEscPressCount(0);
      setClickCount(0);
      if (escPressTimer) clearTimeout(escPressTimer);
      if (clickTimer) clearTimeout(clickTimer);
    }
  }, [isOpen]);

  // Close modal when Escape key is pressed twice within 800ms
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen && isTopmostModal()) {
        if (escPressCount === 0) {
          // First ESC press - start timer, NO notification yet
          setEscPressCount(1);

          // Set timer to reset after 800ms and show notification
          const timer = setTimeout(() => {
            // Timer expired - user didn't press twice, show guide notification
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          // Second ESC press within time window - close popup, NO notification
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      // Clear timer on cleanup
      if (escPressTimer) {
        clearTimeout(escPressTimer);
      }
    };
  }, [isOpen, onClose, escPressCount, escPressTimer, showNotification]);

  useEffect(() => {
    if (isOpen) {
      fetchTechnicians();
      // Reset form state
      setSelectedTechnician('');
      setInstructions('');
      setError(null);
    }
  }, [isOpen]);

  // कहीं useEffect imports के बाद और component के अंदर
useEffect(() => {
  if (isOpen && workOrder) {
    console.log("Modal workOrder:", workOrder); // यह console में दिखाएगा कि क्या initialRemark मिल रहा है
  }
}, [isOpen, workOrder]);
  
  // Handle overlay click - requires double click to close
  const handleOverlayClick = () => {
    // Only handle click if this is the topmost modal
    if (!isTopmostModal()) return;

    if (clickCount === 0) {
      // First click - start timer, NO notification yet
      setClickCount(1);

      // Set timer to reset after 800ms and show notification
      const timer = setTimeout(() => {
        // Timer expired - user didn't click twice, show guide notification
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCount(0);
      }, 800);
      setClickTimer(timer);
    } else if (clickCount === 1) {
      // Second click within time window - close popup, NO notification
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      setClickCount(0);
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedTechnician) {
      setError('Please select a technician');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(SummaryApi.assignTechnician.url, {
        method: SummaryApi.assignTechnician.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: workOrder.customerId,
          orderId: workOrder.orderId,
          technicianId: selectedTechnician,
          instructions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (onSuccess) onSuccess(data.data);
      } else {
        setError(data.message || 'Failed to assign technician');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error assigning technician:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen || !workOrder) return null;
  
  const isComplaint = workOrder.projectCategory === 'Repair';
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      {/* Added max-height and overflow-y-auto for scrolling */}
      <div
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isComplaint ? 'Assign Engineer to Complaint' : 'Assign Engineer'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshTechnicians}
              disabled={loadingTechnicians}
              title="Refresh technicians"
              aria-label="Refresh technicians list"
              className={`p-2 rounded-full transition-colors ${
                loadingTechnicians
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiRefreshCw size={20} className={loadingTechnicians ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close assign technician modal"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
        
        {/* Added overflow-y-auto to make only the content area scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700">
              {isComplaint ? 'Complaint Details:' : 'Work Order Details:'}
            </h3>
            <div className={`mt-2 p-3 rounded-md ${isComplaint ? 'bg-orange-50' : 'bg-gray-50'}`}>
              {isComplaint ? (
                <div className="mb-2 p-2 bg-white rounded border border-orange-200">
                  <p className="font-medium text-orange-700 mb-1">Project Information:</p>
                  <p><span className="font-medium">Type:</span> {workOrder.projectType}</p>
                  <p><span className="font-medium">Category:</span> {workOrder.projectCategory === 'Repair' ? 'Complaint' : 'New Installation'}</p>
                  <p><span className="font-medium">Created:</span> {
                    workOrder.projectCreatedAt
                      ? new Date(workOrder.projectCreatedAt).toLocaleDateString()
                      : new Date(workOrder.createdAt).toLocaleDateString()
                  }</p>
                </div>
              ) : (
                <>
                  <p><span className="font-medium">Project:</span> {workOrder.projectType}</p>
                  <p><span className="font-medium">Category:</span> {workOrder.projectCategory === 'Repair' ? 'Complaint' : 'New Installation'}</p>
                </>
              )}
              <p><span className="font-medium">Customer:</span> {workOrder.customerName}</p>
              {workOrder.customerFirmName && (
                <p className="text-sm text-gray-600"><span className="font-medium">Company:</span> {workOrder.customerFirmName}</p>
              )}
              {workOrder.customerAddress && (
                <p className="text-sm text-gray-600"><span className="font-medium">Address:</span> {workOrder.customerAddress}</p>
              )}

              {workOrder.initialRemark && (
                <p className="mt-2">
                  <span className="font-medium">
                    {isComplaint ? 'Complaint Remark:' : 'Project Remark:'}
                  </span>
                  <br />
                  <span className="text-gray-700">{workOrder.initialRemark}</span>
                </p>
              )}

              {/* Show Created By Information */}
              {workOrder.createdByName && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm">
                    <span className="font-medium">Created By:</span>{' '}
                    <span className="text-gray-700">{workOrder.createdByName}</span>
                    {workOrder.createdByRole && (
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        workOrder.createdByRole === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {workOrder.createdByRole === 'admin' ? 'Admin' : 'Manager'}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add this block to display original technician info for repair category */}
          {isComplaint && workOrder.originalTechnician && (
            <div className="mb-4">
              <h3 className="font-medium text-orange-700 mb-1">Setup Engineer:</h3>
              <div className="mt-2 p-2 bg-white rounded border border-orange-200">
                <p><span className="font-medium">Name:</span> {workOrder.originalTechnician.firstName} {workOrder.originalTechnician.lastName}</p>
                {workOrder.originalTechnician.phoneNumber && (
                  <p><span className="font-medium">Phone:</span> {workOrder.originalTechnician.phoneNumber}</p>
                )}
                {workOrder.projectCreatedAt && (
                  <p><span className="font-medium">Project Completed on:</span> {new Date(workOrder.projectCreatedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}
          
          {loadingTechnicians ? (
            <div className="py-4 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Engineer*
                </label>
                {technicians.length > 0 ? (
                  <select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an Engineer</option>
                    {technicians.map(tech => (
                      <option key={tech._id} value={tech._id}>
                        {tech.firstName} {tech.lastName} - {tech.branch?.name || 'No Branch'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-yellow-600">No Engineers available</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for Engineer
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder={`Enter instructions for the engineer ${isComplaint ? 'handling this complaint' : ''}...`}
                ></textarea>
              </div>
            </form>
          )}
        </div>
        
        {/* Fixed footer for buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end items-center space-x-3">
            {canCancelWorkOrder && onCancelClick && (
              <button
                type="button"
                onClick={() => {
                  onCancelClick(workOrder);
                  onClose(); // Close the assign modal when opening cancel modal
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                {isComplaint ? 'Cancel Complaint' : 'Cancel Work Order'}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || technicians.length === 0 || !selectedTechnician}
              className={`px-4 py-2 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 ${
                isComplaint ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Assigning...' : 'Assign Engineer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTechnicianModal;
