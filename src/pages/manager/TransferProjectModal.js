import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiMapPin, FiInfo, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

const TransferProjectModal = ({ isOpen, onClose, project, onProjectTransferred }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

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
  const [error, setError] = useState(null);
  const [transferRemark, setTransferRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');

  const [showReasonPopup, setShowReasonPopup] = useState(false);
  const [reasonType, setReasonType] = useState(''); // 'accept' or 'reject'
  const [reasonText, setReasonText] = useState('');
  const [showConfirmAccept, setShowConfirmAccept] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [showAcceptOptions, setShowAcceptOptions] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  const modalContentRef = useRef(null);
  
  // Set up a scrollable container to ensure visibility of all content
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, project]);

  // Register/unregister modal in global registry
  useEffect(() => {
    if (isOpen) {
      window.__modalRegistry.add({
        id: modalId.current,
        zIndex: numericZIndex.current
      });
    } else {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
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

  // Double ESC handler
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen && isTopmostModal()) {
        if (escPressCount === 0) {
          setEscPressCount(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
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
      if (escPressTimer) clearTimeout(escPressTimer);
    };
  }, [isOpen, onClose, escPressCount, escPressTimer, showNotification]);

  // Handle overlay click - requires double click to close
  const handleOverlayClick = (e) => {
    // Only handle if clicked directly on overlay (not on modal content)
    if (e.target === e.currentTarget) {
      if (!isTopmostModal()) return;

      if (clickCount === 0) {
        setClickCount(1);
        const timer = setTimeout(() => {
          showNotification('info', 'To close the popup, click twice on the background', 3000);
          setClickCount(0);
        }, 800);
        setClickTimer(timer);
      } else if (clickCount === 1) {
        if (clickTimer) clearTimeout(clickTimer);
        setClickCount(0);
        onClose();
      }
    }
  };

  // Handlers for reason popup
  const openReasonPopup = (type) => {
    setReasonType(type);
    setReasonText('');
    setShowReasonPopup(true);
  };

  const closeReasonPopup = () => {
    setShowReasonPopup(false);
    setReasonText('');
    setReasonType('');
  };

  const handleConfirmReason = () => {
    if (!reasonText.trim()) {
      setError('Reject reason cannot be empty');
      return;
    }
    // Show confirmation popup before API call
    setShowConfirmReject(true);
  };

  const handleRejectTransfer = async () => {
    if (!project?.customerId || !project?.orderId) {
      setError('Invalid project data');
      setShowConfirmReject(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SummaryApi.rejectTechnicianProjectTransfer.url, {
        method: SummaryApi.rejectTechnicianProjectTransfer.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: project.customerId,
          orderId: project.orderId,
          rejectReason: reasonText
        })
      });
      const data = await response.json();
      if (data.success) {
        // Clear cache and reload page
        localStorage.removeItem('transferredProjectsData');
        window.location.reload();
      } else {
        setError(data.message || 'Failed to reject transfer request');
        setShowConfirmReject(false);
      }
    } catch (err) {
      setError('Server error. Please try again.');
      setShowConfirmReject(false);
      console.error('Error rejecting transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  // New handler for accept transfer with default remark
  const handleAcceptTransferWithDefaultRemark = async () => {
    setShowConfirmAccept(false);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(SummaryApi.acceptTechnicianProjectTransfer.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: project.customerId,
          orderId: project.orderId,
          remark: `Project transferred by ${user.firstName} ${user.lastName}`
        })
      });

      const data = await response.json();

      if (data.success) {
        // Clear cache and reload page
        localStorage.removeItem('transferredProjectsData');
        window.location.reload();
      } else {
        setError(data.message || 'Failed to accept transfer request');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error accepting transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler for closing project
  const handleCloseProject = async () => {
    setShowCloseConfirm(false);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(SummaryApi.closeProject.url, {
        method: SummaryApi.closeProject.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: project.customerId,
          orderId: project.orderId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Clear cache and reload page
        localStorage.removeItem('transferredProjectsData');
        window.location.reload();
      } else {
        setError(data.message || 'Failed to close project');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error closing project:', err);
    } finally {
      setLoading(false);
    }
  };

  // Validate remark
  const validateRemark = (text) => {
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 5) {
      setRemarkError(`You must write at least 5 words. Current word count: ${wordCount}`);
      return false;
    } else {
      setRemarkError('');
      return true;
    }
  };

  // Validate remark when it changes
  useEffect(() => {
    if (transferRemark.trim()) {
      validateRemark(transferRemark);
    } else {
      setRemarkError('');
    }
  }, [transferRemark]);

  if (!isOpen || !project) return null;
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Find the stop request entry in status history
  const getStopRequestEntry = () => {
    if (project.statusHistory) {
      return project.statusHistory.find(entry => 
        entry.status === 'transferring'
      );
    }
    return null;
  };

  // Function to handle project transfer acceptance
  const handleAcceptTransfer = async () => {
    // Validate remark
    if (!validateRemark(transferRemark)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      
      // API call to accept transfer
      const response = await fetch(SummaryApi.acceptTechnicianProjectTransfer.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: project.customerId,
          orderId: project.orderId,
          remark: transferRemark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Call parent component's handler with the updated project
      if (onProjectTransferred) {
        // Pass the updated project with new status
        const updatedProject = {
          ...project,
          status: 'transferred'
        };
        onProjectTransferred(updatedProject);
      }

      // Navigate to work orders page to show the newly created work order
      navigate('/work-orders');
      } else {
        setError(data.message || 'Failed to accept transfer request');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error accepting transfer:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Count words in text
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const stopRequest = getStopRequestEntry();
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-2 overflow-auto" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
       ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            Transfer Request
            <span className="ml-3 px-3 py-1 rounded-full text-xs capitalize bg-red-100 text-red-800">
              Transferring
            </span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div 
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 70px)' }}
        >
          {error && (
            <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Stop Request Information */}
          <div className="mb-6 bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <h3 className="text-lg font-medium mb-2">Transfer Request</h3>
            
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-1">Requested by:</p>
              <p className="font-medium">
                {project.technician ? `${project.technician.firstName} ${project.technician.lastName}` : 'Technician'}
              </p>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-1">Requested on:</p>
              <p className="font-medium">{formatDate(project.updatedAt)}</p>
            </div>
            
            {stopRequest && (
              <div>
                <p className="text-sm text-gray-700 mb-1">Reason for transfer:</p>
                <p className="p-3 bg-white rounded border border-red-200">{stopRequest.remark || 'No reason provided'}</p>
              </div>
            )}
          </div>
          
          {/* Basic Project Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-lg mb-3">
              {project.projectType}
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="text-gray-500">Order ID:</span> {project.orderId}</p>
                <p><span className="text-gray-500">Project ID:</span> {project.projectId}</p>
                {project.branchName && (
                  <p><span className="text-gray-500">Branch:</span> {project.branchName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end">
                  <FiCalendar className="mr-2" />
                  <span className="text-gray-500">Created: </span>
                  <span className="ml-2">{formatDate(project.createdAt)}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-md font-medium flex items-center mb-3">
              <FiUser className="mr-2" />
              Customer Information
            </h3>
            
            <div className="bg-white border rounded-lg p-4">
              <p className="font-medium">{project.customerName}</p>
              {project.customerPhone && (
                <p className="text-sm mt-1">Phone: {project.customerPhone}</p>
              )}
              {project.customerAddress && (
                <p className="flex items-start text-sm mt-2">
                  <FiMapPin className="mr-2 text-gray-500 mt-1 flex-shrink-0" />
                  <span>{project.customerAddress}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Initial Requirements */}
          {project.initialRemark && (
            <div className="mb-6">
              <h3 className="text-md font-medium flex items-center mb-3">
                <FiInfo className="mr-2" />
                Initial Requirements
              </h3>
              
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm">{project.initialRemark}</p>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {project.instructions && (
            <div className="mb-6">
              <h3 className="text-md font-medium flex items-center mb-3">
                <FiInfo className="mr-2" />
                Special Instructions
              </h3>
              
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm">{project.instructions}</p>
              </div>
            </div>
          )}
          
          
          {/* Transfer Acceptance Section */}
          {project.status === 'transferring' ? (
            <>
              {/* Buttons for Reject and Accept Transfer Request */}
              <div className="mt-8 border-t pt-6 flex space-x-4 justify-end">
                <button
                  onClick={() => openReasonPopup('reject')}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                   Reject Job Stop Request
                </button>
                <button
                  onClick={() => setShowAcceptOptions(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Accept Job Stop Request
                </button>
              </div>

              {/* Reject Reason Popup Modal */}
              {showReasonPopup && reasonType === 'reject' && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-60 p-2 overflow-auto">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-semibold">
                        Reject Reason
                      </h2>
                      <button
                        onClick={closeReasonPopup}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 70px)' }}>
                      <textarea
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="5"
                        placeholder="Enter your reject reason here..."
                      ></textarea>
                      <div className="mt-4 flex justify-end space-x-4">
                        <button
                          onClick={closeReasonPopup}
                          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmReason}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Accept Confirmation Popup */}
              {showConfirmAccept && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-60 p-2 overflow-auto">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[30vh] overflow-hidden">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-semibold">
                        Confirm Accept Transfer
                      </h2>
                      <button
                        onClick={() => setShowConfirmAccept(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="mb-4">{user.firstName} {user.lastName}, are you sure you want to approve this project?</p>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowConfirmAccept(false)}
                          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        >
                          No
                        </button>
                        <button
                          onClick={handleAcceptTransferWithDefaultRemark}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Reject Confirmation Popup */}
              {showConfirmReject && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-60 p-2 overflow-auto">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[30vh] overflow-hidden">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-semibold">
                        Confirm Reject Transfer
                      </h2>
                      <button
                        onClick={() => setShowConfirmReject(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="mb-4">{user.firstName} {user.lastName}, are you sure you want to reject this project?</p>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowConfirmReject(false)}
                          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        >
                          No
                        </button>
                        <button
                          onClick={handleRejectTransfer}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Accept Options Popup */}
              {showAcceptOptions && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-60 p-2 overflow-auto">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-semibold">
                        Choose Action
                      </h2>
                      <button
                        onClick={() => setShowAcceptOptions(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="mb-6 text-gray-700">What would you like to do with this transfer request?</p>
                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            setShowAcceptOptions(false);
                            setShowConfirmAccept(true);
                          }}
                          className="w-full p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 text-left transition-colors"
                        >
                          <div className="font-semibold text-blue-600 mb-1">Accept Transfer</div>
                          <div className="text-sm text-gray-600">Create a new work order for reassignment to another technician</div>
                        </button>
                        <button
                          onClick={() => {
                            setShowAcceptOptions(false);
                            setShowCloseConfirm(true);
                          }}
                          className="w-full p-4 border-2 border-orange-500 rounded-lg hover:bg-orange-50 text-left transition-colors"
                        >
                          <div className="font-semibold text-orange-600 mb-1">Close Project</div>
                          <div className="text-sm text-gray-600">Mark this project as closed. No further work will be done.</div>
                        </button>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setShowAcceptOptions(false)}
                          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Project Confirmation Popup */}
              {showCloseConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-60 p-2 overflow-auto">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                      <h2 className="text-xl font-semibold flex items-center">
                        <FiAlertCircle className="mr-2 text-orange-500" />
                        Confirm Close Project
                      </h2>
                      <button
                        onClick={() => setShowCloseConfirm(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="mb-4 text-gray-700">
                        {user.firstName} {user.lastName}, are you sure you want to close this project?
                      </p>
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-orange-800">
                          <strong>Warning:</strong> This action will mark the project as closed and no further work will be done on it.
                        </p>
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowCloseConfirm(false)}
                          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        >
                          No, Go Back
                        </button>
                        <button
                          onClick={handleCloseProject}
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                        >
                          Yes, Close Project
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // For already transferred projects, just show a close button
            <div className="mt-8 border-t pt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default TransferProjectModal;
