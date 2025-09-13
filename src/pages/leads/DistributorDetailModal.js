import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiPhone, FiMapPin, FiMessageSquare, FiCalendar, FiFileText, FiDollarSign, FiCreditCard, FiCheck, FiAlertCircle } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';

export default function DistributorDetailModal({ isOpen, onClose, distributorId, onDistributorUpdated }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [distributor, setDistributor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);
  
  // Bill history states
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'bills', 'payment'
  const [bills, setBills] = useState([]);
  const [billsSummary, setBillsSummary] = useState(null);
  const [loadingBills, setLoadingBills] = useState(false);
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Reset tab to details when modal opens
  useEffect(() => {
    if (isOpen && distributorId) {
      setActiveTab('details'); // Always reset to details tab
      fetchDistributorDetails();
    }
  }, [isOpen, distributorId]);

  // Fetch bills when tab changes or bills/payment tab is active
  useEffect(() => {
    if (isOpen && distributorId && (activeTab === 'bills' || activeTab === 'payment')) {
      fetchDistributorBills();
    }
  }, [isOpen, distributorId, activeTab]);

  const fetchDistributorDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SummaryApi.getDistributor.url}/${distributorId}`, {
        method: SummaryApi.getDistributor.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDistributor(data.data);
      } else {
        setError(data.message || 'Failed to fetch distributor details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching distributor:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributorBills = async () => {
    setLoadingBills(true);
    
    try {
      const response = await fetch(`${SummaryApi.getDistributorBills.url}/${distributorId}`, {
        method: SummaryApi.getDistributorBills.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBills(data.data.bills);
        setBillsSummary(data.data.summary);
      } else {
        showNotification('error', data.message || 'Failed to fetch bills');
      }
    } catch (err) {
      showNotification('error', 'Server error while fetching bills');
      console.error('Error fetching bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    setAddingRemark(true);
    
    try {
      const response = await fetch(`${SummaryApi.addDistributorRemark.url}/${distributorId}`, {
        method: SummaryApi.addDistributorRemark.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newRemark.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDistributor(data.data);
        setNewRemark('');
        if (onDistributorUpdated) onDistributorUpdated(data.data);
      } else {
        setError(data.message || 'Failed to add remark');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error adding remark:', err);
    } finally {
      setAddingRemark(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showNotification('error', 'Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentAmount) > billsSummary.totalDue) {
      showNotification('error', 'Payment amount cannot exceed total due amount');
      return;
    }

    if (paymentMethod === 'online' && !transactionId.trim()) {
      showNotification('error', 'Transaction ID is required for online payments');
      return;
    }

    setProcessingPayment(true);
    
    try {
      const response = await fetch(SummaryApi.processBulkPayment.url, {
        method: SummaryApi.processBulkPayment.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: distributorId,
          customerType: 'distributor',
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod,
          transactionId: paymentMethod === 'online' ? transactionId.trim() : undefined,
          notes: paymentNotes.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', `Payment of ₹${paymentAmount} processed successfully`);
        
        // Reset payment form
        setPaymentAmount('');
        setPaymentMethod('cash');
        setTransactionId('');
        setPaymentNotes('');
        setShowPaymentModal(false);
        
        // Refresh bills data
        fetchDistributorBills();
        
        // Switch to bills tab to show updated status
        setActiveTab('bills');
      } else {
        showNotification('error', data.message || 'Failed to process payment');
      }
    } catch (err) {
      showNotification('error', 'Server error while processing payment');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 opacity-75" 
          aria-hidden="true"
          onClick={onClose}
        />
        
        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-4xl mx-4 border border-teal-200 overflow-hidden border-t-4 border-t-teal-500">
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <FiUser className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900">Distributor Details</h3>
                <p className="text-sm text-teal-700">View and manage distributor information</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-teal-500 hover:text-teal-700 focus:outline-none"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-teal-200 bg-teal-50 px-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-teal-700 hover:text-teal-800 hover:border-teal-300'
                }`}
              >
                Distributor Details
              </button>
              <button
                onClick={() => setActiveTab('bills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bills'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-teal-700 hover:text-teal-800 hover:border-teal-300'
                }`}
              >
                Bill History
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-teal-700 hover:text-teal-800 hover:border-teal-300'
                }`}
              >
                Payment
              </button>
            </nav>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : distributor ? (
              <>
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FiUser className="mr-2 text-teal-500" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-gray-900">{distributor.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                        <p className="text-gray-900">{distributor.firmName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-gray-900 flex items-center">
                          <FiPhone className="mr-2 text-teal-500" size={16} />
                          {distributor.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                        <p className="text-gray-900">{distributor.whatsappNumber || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-gray-900 flex items-start">
                          <FiMapPin className="mr-2 text-teal-500 mt-1" size={16} />
                          {distributor.address || 'Not provided'}
                        </p>
                      </div>
                      {distributor.branch && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                          <p className="text-gray-900">{distributor.branch.name}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                        <p className="text-gray-900 flex items-center">
                          <FiCalendar className="mr-2 text-teal-500" size={16} />
                          {formatDate(distributor.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Remark Section */}
                  <div className="bg-teal-50 rounded-lg p-4">
                    <h4 className="font-medium text-teal-900 mb-3 flex items-center">
                      <FiMessageSquare className="mr-2 text-teal-500" />
                      Add New Remark
                    </h4>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        placeholder="Enter remark..."
                        className="flex-1 rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition p-3 text-gray-900 placeholder:text-gray-400"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddRemark()}
                      />
                      <button
                        onClick={handleAddRemark}
                        disabled={addingRemark || !newRemark.trim()}
                        className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        {addingRemark ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Remarks History */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FiMessageSquare className="mr-2 text-teal-500" />
                      Remarks History
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {distributor.remarks && distributor.remarks.length > 0 ? (
                        distributor.remarks.map((remark, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-teal-100">
                            <p className="text-gray-900 text-sm mb-2">{remark.text}</p>
                            <div className="text-xs text-gray-500 flex justify-between items-center">
                              <span>By: {remark.createdBy?.firstName} {remark.createdBy?.lastName}</span>
                              <span>{formatDate(remark.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No remarks yet</p>
                      )}
                    </div>
                  </div>
                </div>
                  </div>
                )}

                {/* Bills Tab */}
                {activeTab === 'bills' && (
                  <div>
                    {loadingBills ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    ) : billsSummary ? (
                      <>
                        {/* Bills Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                            <h4 className="font-medium text-teal-900 mb-2">Total Bills</h4>
                            <p className="text-2xl font-bold text-teal-600">{billsSummary.totalBills}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-medium text-blue-900 mb-2">Total Amount</h4>
                            <p className="text-2xl font-bold text-blue-600">₹{billsSummary.totalAmount}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h4 className="font-medium text-green-900 mb-2">Paid Amount</h4>
                            <p className="text-2xl font-bold text-green-600">₹{billsSummary.totalPaid}</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <h4 className="font-medium text-red-900 mb-2">Due Amount</h4>
                            <p className="text-2xl font-bold text-red-600">₹{billsSummary.totalDue}</p>
                          </div>
                        </div>

                        {/* Bills List */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                            <FiFileText className="mr-2 text-teal-500" />
                            Bills History
                          </h4>
                          
                          {bills && bills.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {bills.map((bill, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 border border-teal-100">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h5 className="font-semibold text-gray-900">{bill.billNumber}</h5>
                                      <p className="text-sm text-gray-600">{formatDate(bill.createdAt)}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      bill.paymentStatus === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : bill.paymentStatus === 'partial'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {bill.paymentStatus === 'completed' ? 'Paid' : 
                                       bill.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                                    </span>
                                  </div>
                                  
                                  {/* Bill Items */}
                                  <div className="mb-3">
                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Items:</h6>
                                    <div className="space-y-1">
                                      {bill.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex justify-between text-sm text-gray-600">
                                          <div className="flex-1">
                                            <span className="font-medium text-gray-800">{item.itemName}</span>
                                            <span className="text-gray-500"> × {item.quantity}</span>
                                            <span className="text-xs text-gray-500 ml-2">@ ₹{item.unitPrice}</span>
                                          </div>
                                          <span className="font-semibold text-gray-800">₹{item.totalPrice}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Bill Amounts */}
                                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                                    <div>
                                      <p className="text-xs text-gray-500">Total Amount</p>
                                      <p className="font-semibold text-gray-900">₹{bill.total}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Paid Amount</p>
                                      <p className="font-semibold text-green-600">₹{bill.paidAmount}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Due Amount</p>
                                      <p className="font-semibold text-red-600">₹{bill.dueAmount}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm text-center py-8">No bills found</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-center py-8 text-gray-500">Click on Bills tab to load bill history</p>
                    )}
                  </div>
                )}

                {/* Payment Tab */}
                {activeTab === 'payment' && (
                  <div>
                    {billsSummary && billsSummary.totalDue > 0 ? (
                      <div className="max-w-md mx-auto">
                        <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                          <h4 className="font-medium text-teal-900 mb-4 flex items-center">
                            <FiDollarSign className="mr-2 text-teal-500" />
                            Process Payment
                          </h4>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Total Due Amount</p>
                            <p className="text-2xl font-bold text-red-600">₹{billsSummary.totalDue}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {billsSummary.pendingBillsCount} pending bill(s)
                            </p>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Amount
                              </label>
                              <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter amount..."
                                max={billsSummary.totalDue}
                                className="w-full rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition p-3"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                              </label>
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition p-3"
                              >
                                <option value="cash">Cash</option>
                                <option value="online">Online</option>
                              </select>
                            </div>
                            
                            {paymentMethod === 'online' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Transaction ID
                                </label>
                                <input
                                  type="text"
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  placeholder="Enter transaction ID..."
                                  className="w-full rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition p-3"
                                />
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                              </label>
                              <textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Enter payment notes..."
                                rows={3}
                                className="w-full rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition p-3 resize-none"
                              />
                            </div>
                            
                            <button
                              onClick={() => setShowPaymentModal(true)}
                              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
                              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                            >
                              {processingPayment ? 'Processing...' : 'Process Payment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiCheck className="text-green-600" size={24} />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Pending Payments</h4>
                        <p className="text-gray-600">All bills have been paid in full</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 opacity-75" 
              onClick={() => !processingPayment && setShowPaymentModal(false)}
            />
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:max-w-lg sm:w-full mx-4 border border-teal-200 overflow-hidden">
              <div className="bg-teal-50 px-6 py-4 border-b border-teal-200">
                <h3 className="text-lg font-semibold text-teal-900 flex items-center">
                  <FiAlertCircle className="mr-2 text-teal-500" />
                  Confirm Payment
                </h3>
              </div>
              
              <div className="px-6 py-4">
                <div className="mb-4">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to process this payment?
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Amount:</span>
                      <span className="font-semibold text-gray-900">₹{paymentAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold text-gray-900 capitalize">{paymentMethod}</span>
                    </div>
                    {paymentMethod === 'online' && transactionId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-semibold text-gray-900">{transactionId}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Due:</span>
                      <span className="font-semibold text-red-600">₹{billsSummary?.totalDue}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Remaining Due:</span>
                      <span className="font-semibold text-teal-600">
                        ₹{Math.max(0, (billsSummary?.totalDue || 0) - parseFloat(paymentAmount || 0))}
                      </span>
                    </div>
                  </div>
                  
                  {paymentNotes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Notes:</p>
                      <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">{paymentNotes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={processingPayment}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={processingPayment}
                    className="px-6 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 rounded-lg transition-colors flex items-center"
                  >
                    {processingPayment && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                    {processingPayment ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}