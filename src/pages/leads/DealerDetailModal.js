import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiPhone, FiMapPin, FiMessageSquare, FiCalendar, FiFileText, FiDollarSign, FiCreditCard, FiCheck, FiAlertCircle, FiSmartphone, FiTrendingUp } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import BillHistoryTable from '../../components/BillHistoryTable';
import ViewBillModal from '../../components/ViewBillModal';
import { useNotification } from '../../context/NotificationContext';

export default function DealerDetailModal({ isOpen, onClose, dealerId, onDealerUpdated }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [dealer, setDealer] = useState(null);
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

  // Enhanced payment states
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [fetchingBankAccounts, setFetchingBankAccounts] = useState(false);
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    // Bank Transfer
    utrNumber: '',
    bankName: '',
    transferDate: '',
    receivedAmount: '',
    // Cheque
    chequeNumber: '',
    chequeBank: '',
    chequeIfsc: '',
    chequeDate: '',
    chequeAmount: '',
    drawerName: '',
    // UPI
    upiTransactionId: ''
  });

  // View Bill Modal states
  const [showViewBillModal, setShowViewBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Reset tab to details when modal opens
  useEffect(() => {
    if (isOpen && dealerId) {
      setActiveTab('details'); // Always reset to details tab
      fetchDealerDetails();
    }
  }, [isOpen, dealerId]);

  // Fetch bills when tab changes or bills tab is active
  useEffect(() => {
    if (isOpen && dealerId && (activeTab === 'bills' || activeTab === 'payment')) {
      fetchDealerBills();
    }
  }, [isOpen, dealerId, activeTab]);

  const fetchDealerDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SummaryApi.getDealer.url}/${dealerId}`, {
        method: SummaryApi.getDealer.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDealer(data.data);
      } else {
        setError(data.message || 'Failed to fetch dealer details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching dealer:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealerBills = async () => {
    setLoadingBills(true);

    try {
      const response = await fetch(`${SummaryApi.getDealerBills.url}/${dealerId}`, {
        method: SummaryApi.getDealerBills.method,
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

  // Fetch bank accounts for UPI payment
  const fetchBankAccounts = async () => {
    setFetchingBankAccounts(true);

    try {
      const response = await fetch(SummaryApi.getBankAccounts.url, {
        method: SummaryApi.getBankAccounts.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.data);
        // Auto-select primary account if available
        const primaryAccount = data.data.find(account => account.isPrimary);
        if (primaryAccount) {
          setSelectedBankAccount(primaryAccount);
        }
      } else {
        showNotification('error', data.message || 'Failed to fetch bank accounts');
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      showNotification('error', 'Failed to load bank accounts. Please try again later.');
    } finally {
      setFetchingBankAccounts(false);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setShowBankSelection(false);
    setShowQRCode(false);
    setSelectedBankAccount(null);

    if (method === 'upi') {
      setShowBankSelection(true);
      fetchBankAccounts();
    }
  };

  // Handle UPI continue after bank selection
  const handleUPIContinue = () => {
    if (selectedBankAccount) {
      setShowBankSelection(false);
      setShowQRCode(true);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    setAddingRemark(true);
    
    try {
      const response = await fetch(`${SummaryApi.addDealerRemark.url}/${dealerId}`, {
        method: SummaryApi.addDealerRemark.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newRemark.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDealer(data.data);
        setNewRemark('');
        if (onDealerUpdated) onDealerUpdated(data.data);
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

    // Enhanced validation for each payment method
    if (paymentMethod === 'upi') {
      if (!paymentFormData.upiTransactionId.trim()) {
        showNotification('error', 'UPI Transaction ID is required');
        return;
      }
      if (!selectedBankAccount) {
        showNotification('error', 'Please select a bank account for UPI payment');
        return;
      }
    }

    if (paymentMethod === 'bank_transfer') {
      if (!paymentFormData.utrNumber.trim()) {
        showNotification('error', 'UTR Number is required for bank transfer');
        return;
      }
      if (!paymentFormData.receivedAmount || parseFloat(paymentFormData.receivedAmount) <= 0) {
        showNotification('error', 'Please enter the received amount');
        return;
      }
    }

    if (paymentMethod === 'cheque') {
      if (!paymentFormData.chequeNumber.trim()) {
        showNotification('error', 'Cheque number is required');
        return;
      }
      if (!paymentFormData.chequeAmount || parseFloat(paymentFormData.chequeAmount) <= 0) {
        showNotification('error', 'Please enter the cheque amount');
        return;
      }
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
          customerId: dealerId,
          customerType: 'dealer',
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod,
          receivedAmount: paymentMethod === 'bank_transfer' ? parseFloat(paymentFormData.receivedAmount) : parseFloat(paymentAmount),
          transactionId: paymentMethod === 'upi' ? paymentFormData.upiTransactionId.trim() :
                       (paymentMethod === 'bank_transfer' ? paymentFormData.utrNumber.trim() : undefined),
          paymentDetails: paymentMethod !== 'cash' ? {
            // UPI details
            ...(paymentMethod === 'upi' && {
              upiTransactionId: paymentFormData.upiTransactionId,
              selectedBankAccount: selectedBankAccount?._id
            }),
            // Bank Transfer details
            ...(paymentMethod === 'bank_transfer' && {
              utrNumber: paymentFormData.utrNumber,
              bankName: paymentFormData.bankName,
              transferDate: paymentFormData.transferDate,
              receivedAmount: parseFloat(paymentFormData.receivedAmount)
            }),
            // Cheque details
            ...(paymentMethod === 'cheque' && {
              chequeNumber: paymentFormData.chequeNumber,
              chequeBank: paymentFormData.chequeBank,
              chequeIfsc: paymentFormData.chequeIfsc,
              chequeDate: paymentFormData.chequeDate,
              chequeAmount: parseFloat(paymentFormData.chequeAmount),
              drawerName: paymentFormData.drawerName || dealer?.name
            })
          } : undefined,
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

        // Reset enhanced payment states
        setSelectedBankAccount(null);
        setBankAccounts([]);
        setShowBankSelection(false);
        setShowQRCode(false);
        setPaymentFormData({
          utrNumber: '',
          bankName: '',
          transferDate: '',
          receivedAmount: '',
          chequeNumber: '',
          chequeBank: '',
          chequeIfsc: '',
          chequeDate: '',
          chequeAmount: '',
          drawerName: '',
          upiTransactionId: ''
        });
        
        // Refresh bills data
        fetchDealerBills();
        
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
        <div className="inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-4xl mx-4 border border-orange-200 overflow-hidden border-t-4 border-t-orange-500">
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <FiUser className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-900">Dealer Details</h3>
                <p className="text-sm text-orange-700">View and manage dealer information</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-orange-500 hover:text-orange-700 focus:outline-none"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-orange-200 bg-orange-50 px-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-orange-700 hover:text-orange-800 hover:border-orange-300'
                }`}
              >
                Dealer Details
              </button>
              <button
                onClick={() => setActiveTab('bills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bills'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-orange-700 hover:text-orange-800 hover:border-orange-300'
                }`}
              >
                Bill History
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-orange-700 hover:text-orange-800 hover:border-orange-300'
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
            ) : dealer ? (
              <>
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="lg:col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <FiUser className="mr-2 text-orange-500" />
                          Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <p className="text-gray-900">{dealer.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                            <p className="text-gray-900">{dealer.firmName || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p className="text-gray-900 flex items-center">
                              <FiPhone className="mr-2 text-orange-500" size={16} />
                              {dealer.phoneNumber}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <p className="text-gray-900">{dealer.whatsappNumber || 'Not provided'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900 flex items-start">
                              <FiMapPin className="mr-2 text-orange-500 mt-1" size={16} />
                              {dealer.address || 'Not provided'}
                            </p>
                          </div>
                          {dealer.branch && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                              <p className="text-gray-900">{dealer.branch.name}</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                            <p className="text-gray-900 flex items-center">
                              <FiCalendar className="mr-2 text-orange-500" size={16} />
                              {formatDate(dealer.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Add Remark Section */}
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                          <FiMessageSquare className="mr-2 text-orange-500" />
                          Add New Remark
                        </h4>
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            value={newRemark}
                            onChange={(e) => setNewRemark(e.target.value)}
                            placeholder="Enter remark..."
                            className="flex-1 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3 text-gray-900 placeholder:text-gray-400"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddRemark()}
                          />
                          <button
                            onClick={handleAddRemark}
                            disabled={addingRemark || !newRemark.trim()}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
                          <FiMessageSquare className="mr-2 text-orange-500" />
                          Remarks History
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {dealer.remarks && dealer.remarks.length > 0 ? (
                            dealer.remarks.map((remark, index) => (
                              <div key={index} className="bg-white rounded-lg p-3 border border-orange-100">
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
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <h4 className="font-medium text-orange-900 mb-2">Total Bills</h4>
                            <p className="text-2xl font-bold text-orange-600">{billsSummary.totalBills}</p>
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
                        <BillHistoryTable
                          bills={bills}
                          loading={loadingBills}
                          onViewBill={(bill) => {
                            setSelectedBill(bill);
                            setShowViewBillModal(true);
                          }}
                        />
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
                        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                          <h4 className="font-medium text-orange-900 mb-4 flex items-center">
                            <FiDollarSign className="mr-2 text-orange-500" />
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
                                className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                              </label>
                              <select
                                value={paymentMethod}
                                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                                className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                              >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                              </select>
                            </div>
                            
                            {/* UPI Payment Method */}
                            {paymentMethod === 'upi' && (
                              <div className="space-y-4">
                                {showBankSelection && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Select Bank Account
                                    </label>
                                    {fetchingBankAccounts ? (
                                      <div className="flex items-center justify-center py-4">
                                        <LoadingSpinner />
                                        <span className="ml-2 text-gray-600">Loading bank accounts...</span>
                                      </div>
                                    ) : bankAccounts.length === 0 ? (
                                      <div className="text-center py-4">
                                        <p className="text-gray-600 mb-2">No bank accounts found</p>
                                        <p className="text-sm text-gray-500">Please add a bank account first</p>
                                      </div>
                                    ) : (
                                      <>
                                        <select
                                          value={selectedBankAccount?._id || ''}
                                          onChange={(e) => {
                                            const account = bankAccounts.find(acc => acc._id === e.target.value);
                                            setSelectedBankAccount(account);
                                          }}
                                          className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                        >
                                          <option value="">Choose a bank account...</option>
                                          {bankAccounts.map((account) => (
                                            <option key={account._id} value={account._id}>
                                              {account.bankName} - {account.accountHolderName}
                                              {account.isPrimary ? ' (Primary)' : ''}
                                            </option>
                                          ))}
                                        </select>

                                        {selectedBankAccount && (
                                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <FiCreditCard className="text-orange-500" />
                                              <span className="font-medium text-orange-900">
                                                {selectedBankAccount.bankName}
                                              </span>
                                              {selectedBankAccount.isPrimary && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                  Primary
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-orange-700">
                                              {selectedBankAccount.accountHolderName}
                                            </p>
                                            {selectedBankAccount.upiId && (
                                              <p className="text-xs text-green-600 mt-1">
                                                UPI ID: {selectedBankAccount.upiId}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        <button
                                          onClick={handleUPIContinue}
                                          disabled={!selectedBankAccount}
                                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 px-4 rounded-lg font-medium"
                                        >
                                          Continue to QR Code
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}

                                {showQRCode && selectedBankAccount && (
                                  <div className="space-y-4">
                                    <div className="text-center">
                                      <h5 className="font-medium mb-3 text-orange-900">Scan QR Code to Pay</h5>
                                      <div className="inline-block p-4 bg-white rounded-lg border-2 border-orange-200">
                                        <QRCodeCanvas
                                          value={selectedBankAccount.upiId ?
                                            `upi://pay?pa=${selectedBankAccount.upiId}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${paymentAmount}&tn=Dealer-Payment-${encodeURIComponent(dealer?.name || '')}` :
                                            `upi://pay?pa=${selectedBankAccount.accountNumber}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${paymentAmount}&tn=Dealer-Payment-${encodeURIComponent(dealer?.name || '')}`
                                          }
                                          size={200}
                                          level="H"
                                          includeMargin={true}
                                        />
                                      </div>
                                      <p className="text-sm text-gray-600 mt-2">
                                        Pay ₹{paymentAmount} to {selectedBankAccount.accountHolderName}
                                      </p>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        UPI Transaction ID (Enter after payment)
                                      </label>
                                      <input
                                        type="text"
                                        value={paymentFormData.upiTransactionId}
                                        onChange={(e) => setPaymentFormData(prev => ({...prev, upiTransactionId: e.target.value}))}
                                        placeholder="Enter UPI transaction ID after successful payment"
                                        className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                      />
                                    </div>

                                    <button
                                      onClick={() => {
                                        setShowQRCode(false);
                                        setShowBankSelection(true);
                                      }}
                                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                                    >
                                      Change Bank Account
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Bank Transfer Payment Method */}
                            {paymentMethod === 'bank_transfer' && (
                              <div className="space-y-4">
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                  <h5 className="font-medium text-purple-900 mb-1">Bank Transfer (IMPS/NEFT)</h5>
                                  <p className="text-sm text-purple-700">Transfer money and enter the details below</p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    UTR Number <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentFormData.utrNumber}
                                    onChange={(e) => setPaymentFormData(prev => ({...prev, utrNumber: e.target.value}))}
                                    placeholder="Enter UTR/Reference number"
                                    className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sender Bank Name
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentFormData.bankName}
                                    onChange={(e) => setPaymentFormData(prev => ({...prev, bankName: e.target.value}))}
                                    placeholder="Name of the bank from which transfer was made"
                                    className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transfer Date
                                  </label>
                                  <input
                                    type="date"
                                    value={paymentFormData.transferDate}
                                    onChange={(e) => setPaymentFormData(prev => ({...prev, transferDate: e.target.value}))}
                                    className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Received Amount <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    value={paymentFormData.receivedAmount}
                                    onChange={(e) => setPaymentFormData(prev => ({...prev, receivedAmount: e.target.value}))}
                                    placeholder="Amount received in your account"
                                    className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    This may differ from payment amount due to bank charges
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Cheque Payment Method */}
                            {paymentMethod === 'cheque' && (
                              <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <h5 className="font-medium text-green-900 mb-1">Cheque Payment</h5>
                                  <p className="text-sm text-green-700">Enter cheque details for record keeping</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Cheque Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={paymentFormData.chequeNumber}
                                      onChange={(e) => setPaymentFormData(prev => ({...prev, chequeNumber: e.target.value}))}
                                      placeholder="Cheque number"
                                      className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Cheque Amount <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      value={paymentFormData.chequeAmount}
                                      onChange={(e) => setPaymentFormData(prev => ({...prev, chequeAmount: e.target.value}))}
                                      placeholder="Amount on cheque"
                                      className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bank Name
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentFormData.chequeBank}
                                    onChange={(e) => setPaymentFormData(prev => ({...prev, chequeBank: e.target.value}))}
                                    placeholder="Bank name on cheque"
                                    className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      IFSC Code
                                    </label>
                                    <input
                                      type="text"
                                      value={paymentFormData.chequeIfsc}
                                      onChange={(e) => setPaymentFormData(prev => ({...prev, chequeIfsc: e.target.value.toUpperCase()}))}
                                      placeholder="IFSC Code"
                                      className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Cheque Date
                                    </label>
                                    <input
                                      type="date"
                                      value={paymentFormData.chequeDate}
                                      onChange={(e) => setPaymentFormData(prev => ({...prev, chequeDate: e.target.value}))}
                                      className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Drawer Name
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentFormData.drawerName}
                                    onChange={(e) => setPaymentFormData(prev => ({...prev, drawerName: e.target.value}))}
                                    placeholder={`Name on cheque (default: ${dealer?.name || 'Dealer name'})`}
                                    className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3"
                                  />
                                </div>
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
                                className="w-full rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition p-3 resize-none"
                              />
                            </div>
                            
                            <button
                              onClick={() => setShowPaymentModal(true)}
                              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
                              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
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

      {/* View Bill Modal */}
      <ViewBillModal
        isOpen={showViewBillModal}
        onClose={() => {
          setShowViewBillModal(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        customerInfo={dealer}
      />

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
            <div className="inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:max-w-lg sm:w-full mx-4 border border-orange-200 overflow-hidden">
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                  <FiAlertCircle className="mr-2 text-orange-500" />
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
                      <span className="font-semibold text-orange-600">
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
                    className="px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-lg transition-colors flex items-center"
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