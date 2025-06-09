import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiMapPin, FiInfo, FiFileText, FiCheckCircle, FiClock, FiEye, FiAlertCircle } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProjectDetailsModal = ({ isOpen, onClose, project, onProjectApproved }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvalRemark, setApprovalRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // New states for reject popup
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectConfirmPopup, setShowRejectConfirmPopup] = useState(false);

  const modalContentRef = useRef(null);

  useEffect(() => {
    if (project && project.billingInfo) {
      console.log('Debug: project.billingInfo:', project.billingInfo);
    }
  }, [project]);
  
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, project]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

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

  useEffect(() => {
    if (approvalRemark.trim()) {
      validateRemark(approvalRemark);
    } else {
      setRemarkError('');
    }
  }, [approvalRemark]);

  useEffect(() => {
    if (project) {
      console.log("Project in modal:", project);
      console.log("Billing info:", project.billingInfo);
      console.log("Project:", project);
      console.log("Assigned By:", project.assignedBy);
      console.log("Status History:", project.statusHistory);
    }
  }, [project]);
  
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
  
  const handleApproveProject = async () => {
    if (!validateRemark(approvalRemark)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(SummaryApi.approveWorkOrder.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: project.customerId,
          orderId: project.orderId,
          remark: approvalRemark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (onProjectApproved) {
          onProjectApproved(data.data);
        }
      } else {
        setError(data.message || 'Failed to approve project');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error approving project:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewBillSummary = async (billId) => {
    if (project.bills && project.bills.length > 0) {
      const bill = project.bills.find(b => b._id === billId || b.id === billId);
      if (bill) {
        setSelectedBill(bill);
        setShowBillSummary(true);
        return;
      }
    }
    
    try {
      const response = await fetch(`${SummaryApi.getBillDetails.url}/${billId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedBill(data.data);
        setShowBillSummary(true);
      } else {
        setError(data.message || 'Failed to load bill details');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error fetching bill details:', err);
    }
  };

  const getLatestRemark = () => {
    if (project.statusHistory && project.statusHistory.length > 0) {
      const latestEntry = project.statusHistory[0];
      return latestEntry.remark || 'No remark provided';
    }
    return 'No status updates available';
  };
  
  const getCompletionEntry = () => {
    if (project.statusHistory) {
      return project.statusHistory.find(entry => 
        entry.status === 'completed' || entry.status === 'pending-approval'
      );
    }
    return null;
  };
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-start z-50 p-2 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden my-4"
       ref={modalContentRef}>
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            Project Details 
            <span className={`ml-3 px-3 py-1 rounded-full text-sm capitalize ${getStatusBadge(project.status)}`}>
              {project.status === 'pending-approval' ? 'Pending Approval' : project.status}
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
          ref={modalContentRef}
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 70px)' }}
        >
          {error && (
            <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
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
                {project.updatedAt && (
                  <p className="flex items-center justify-end">
                    <FiClock className="mr-2" />
                    <span className="text-gray-500">Last Updated: </span>
                    <span className="ml-2">{formatDate(project.updatedAt)}</span>
                  </p>
                )}
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
          
          {/* Technician Information */}
          {project.technician && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-3">Technician Information</h3>
              
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">
                  {project.technician.firstName} {project.technician.lastName}
                </p>
                {project.assignedAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Assigned on: {formatDate(project.assignedAt)}
                  </p>
                )}
                {project.assignedBy && (
                  <p className="text-sm text-gray-600 mt-1">
                    Assigned by: {
                      project.assignedBy.firstName 
                        ? `${project.assignedBy.firstName} ${project.assignedBy.lastName || ''}`
                        : project.assignedBy._id 
                          ? `User (ID: ${project.assignedBy._id})` 
                          : 'System'
                    }
                  </p>
                )}
              </div>
            </div>
          )}
          
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
          
          {/* Status History */}
          {project.statusHistory && project.statusHistory.length > 0 && (
  <div className="mb-6">
    <h3 className="text-md font-medium mb-3">Status History</h3>
    
    <div className="bg-white border rounded-lg p-4">
      <div className="space-y-4">
        {/* Sort the statusHistory array by date (newest first) before rendering */}
        {[...project.statusHistory]
          .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
          .map((history, index) => (
            <div key={index} className="border-l-2 border-blue-500 pl-4 pb-4">
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(history.status)}`}>
                  {history.status}
                </span>
                <span className="text-sm text-gray-500">{formatDate(history.updatedAt)}</span>
              </div>
              {history.remark && (
                <p className="mt-2 text-sm">{history.remark}</p>
              )}
              {history.updatedBy && (
                <p className="mt-1 text-xs text-gray-500">
                  By: {
                    history.updatedBy.firstName
                      ? `${history.updatedBy.firstName} ${history.updatedBy.lastName || ''}`
                      : history.updatedBy._id
                        ? `User (ID: ${history.updatedBy._id})`
                        : 'System'
                  }
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  </div>
)}
          
          {/* Payment & Billing Information */}
{project.bills && project.bills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium flex items-center mb-3">
                <FiFileText className="mr-2" />
                Payment Information
              </h3>
              
              <div className="bg-white border rounded-lg p-4">
                {project.bills.map((bill, billIndex) => {
                  const totalAmount = bill.totalAmount || 0;
                  const amountPaid = bill.amountPaid || 0;
                  const amountDue = bill.amountDue || 0;
                  
                  let badgeText = '';
                  let badgeClass = '';
                  switch (bill.extendedPaymentStatus) {
                    case 'paid':
                      badgeText = 'Paid';
                      badgeClass = 'bg-green-100 text-green-800';
                      break;
                    case 'partial':
                      badgeText = 'Partial Payment';
                      badgeClass = 'bg-yellow-100 text-yellow-800';
                      break;
                    case 'unpaid':
                    default:
                      badgeText = 'Unpaid';
                      badgeClass = 'bg-red-100 text-red-800';
                      break;
                  }
                  
                  let statusBadgeText = '';
                  let statusBadgeClass = '';
                  switch (bill.status) {
                    case 'approved':
                      statusBadgeText = 'Approved';
                      statusBadgeClass = 'bg-green-200 text-green-900';
                      break;
                    case 'pending':
                      statusBadgeText = 'Pending';
                      statusBadgeClass = 'bg-yellow-200 text-yellow-900';
                      break;
                    case 'rejected':
                      statusBadgeText = 'Rejected';
                      statusBadgeClass = 'bg-red-200 text-red-900';
                      break;
                    default:
                      statusBadgeText = bill.status || 'Unknown';
                      statusBadgeClass = 'bg-gray-200 text-gray-900';
                      break;
                  }
                  
                  return (
                    <div key={billIndex} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Bill #{bill.billNumber}</h4>
                        <div className="flex space-x-2">
                          <span className={`${badgeClass} px-2 py-1 rounded-full text-xs`}>
                            {badgeText}
                          </span>
                          {statusBadgeText && (
                            <span className={`${statusBadgeClass} px-2 py-1 rounded-full text-xs`}>
                              {statusBadgeText}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Payment Method:</span>
                          <span className="font-medium capitalize">{bill.paymentMethod || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Total Amount:</span>
                          <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Paid Amount:</span>
                          <span className="font-medium">₹{amountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Due Amount:</span>
                          <span className="font-medium">₹{amountDue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payment Date:</span>
                          <span>{formatDate(bill.paidAt)}</span>
                        </div>
                        {bill.transactionId && (
                          <div className="flex justify-between text-sm mt-1">
                            <span>Transaction ID:</span>
                            <span className="font-medium">{bill.transactionId}</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleViewBillSummary(bill._id)}
                        className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 text-sm flex items-center"
                      >
                        <FiEye className="mr-1" /> View Bill Summary
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showBillSummary && selectedBill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Bill Summary</h3>
                  <button onClick={() => setShowBillSummary(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX size={24} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600">Bill #{selectedBill.billNumber}</p>
                  <p className="text-gray-600">Date: {formatDate(selectedBill.createdAt)}</p>
                </div>

                <div className="flex space-x-2 mb-4">
                  {selectedBill.extendedPaymentStatus && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBill.extendedPaymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedBill.extendedPaymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedBill.extendedPaymentStatus.charAt(0).toUpperCase() + selectedBill.extendedPaymentStatus.slice(1)}
                    </span>
                  )}
                  {selectedBill.status && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBill.status === 'approved' ? 'bg-green-200 text-green-900' :
                      selectedBill.status === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                      selectedBill.status === 'rejected' ? 'bg-red-200 text-red-900' :
                      'bg-gray-200 text-gray-900'
                    }`}>
                      {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
                    </span>
                  )}
                </div>
                
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Total Amount:</span>
                    <p>₹{selectedBill.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Paid Amount:</span>
                    <p>₹{selectedBill.amountPaid?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Due Amount:</span>
                    <p>₹{selectedBill.amountDue?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Payment Method:</span>
                    <p className="capitalize">{selectedBill.paymentMethod || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedBill.items && selectedBill.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div>{item.name}</div>
                            {item.serialNumber && (
                              <div className="text-xs text-gray-500">Serial: {item.serialNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            ₹{item.price?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            ₹{item.amount?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right font-medium">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ₹{selectedBill.totalAmount?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => setShowBillSummary(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Approval Section - For Pending Approval Projects */}
          {project.status === 'pending-approval' && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Project Approval</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Note* <span className="text-xs text-gray-500">(minimum 5 words required)</span>
                </label>
                <textarea
                  value={approvalRemark}
                  onChange={(e) => setApprovalRemark(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    remarkError ? 'border-red-300 focus:ring-red-300' : 'focus:ring-blue-500'
                  }`}
                  rows="3"
                  placeholder="Enter any notes for this approval (min 5 words)..."
                ></textarea>
                
                <div className="mt-1 flex justify-between">
                  <div className="text-xs text-gray-500">
                  Word Count: {countWords(approvalRemark)}
                  </div>
                  
                  {remarkError && (
                    <div className="text-xs text-red-500 flex items-center">
                      <FiAlertCircle className="mr-1" /> {remarkError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleApproveProject}
                  disabled={loading || remarkError || countWords(approvalRemark) < 5}
                  className={`px-6 py-2 text-white rounded-md flex items-center ${
                    loading || remarkError || countWords(approvalRemark) < 5
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" /> Approve Project
                    </>
                  )}
                </button>

                {/* Reject Project Button */}
                <button
                  onClick={() => {
                    setRejectReason('');
                    setRejectError('');
                    setShowRejectPopup(true);
                  }}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Reject Project
                </button>
              </div>
            </div>
          )}

          {/* Reject Project Popup */}
          {showRejectPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Reject Project</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reject Reason* <span className="text-xs text-gray-500">(minimum 5 words required)</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRejectReason(val);
                      const wordCount = val.trim().split(/\s+/).filter(word => word.length > 0).length;
                      if (wordCount < 5) {
                        setRejectError(`You must write at least 5 words. Current word count: ${wordCount}`);
                      } else {
                        setRejectError('');
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      rejectError ? 'border-red-300 focus:ring-red-300' : 'focus:ring-blue-500'
                    }`}
                    rows="4"
                    placeholder="Enter reason for rejecting the project..."
                  ></textarea>
                  {rejectError && (
                    <div className="text-xs text-red-500 flex items-center mt-1">
                      <FiAlertCircle className="mr-1" /> {rejectError}
                    </div>
                  )}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRejectPopup(false)}
                      className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!rejectError && rejectReason.trim().split(/\s+/).filter(word => word.length > 0).length >= 5) {
                          // For now, just close the popup. Backend integration will be done later.
                          setShowRejectPopup(false);
                          setShowRejectConfirmPopup(true);
                        }
                      }}
                      disabled={rejectError || rejectReason.trim().split(/\s+/).filter(word => word.length > 0).length < 5}
                      className={`px-4 py-2 text-white rounded-md ${
                        rejectError || rejectReason.trim().split(/\s+/).filter(word => word.length > 0).length < 5
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Reject Confirmation Popup */}
          {showRejectConfirmPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Confirm Rejection</h3>
                <p className="mb-6">
                  {user.firstName} {user.lastName ? user.lastName : ''}, are you sure you want to reject this project?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRejectConfirmPopup(false)}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    No
                  </button>
                  <button
                    onClick={async () => {
                      setRejectLoading(true);
                      setError(null);
                      try {
                        const response = await fetch(SummaryApi.rejectBill.url, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({
                            billId: project.bills && project.bills.length > 0 ? project.bills[0]._id : null,
                            rejectionReason: rejectReason
                          }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          if (onProjectApproved) {
                            onProjectApproved(data.data);
                          }
                          setShowRejectConfirmPopup(false);
                          setShowRejectPopup(false);
                          setRejectReason('');
                        } else {
                          setError(data.message || 'Failed to reject project');
                        }
                      } catch (err) {
                        setError('Server error. Please try again.');
                        console.error('Error rejecting project:', err);
                      } finally {
                        setRejectLoading(false);
                      }
                    }}
                    disabled={rejectLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                  >
                    {rejectLoading ? (
                      <LoadingSpinner size={20} />
                    ) : (
                      'Yes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;