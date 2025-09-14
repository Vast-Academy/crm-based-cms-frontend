import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCreditCard, FiDollarSign, FiCheck, FiSmartphone } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import QRCodeDisplay from './QRCodeDisplay';
import { QRCodeCanvas } from 'qrcode.react';

export default function PaymentModal({
  isOpen,
  onClose,
  customer,
  cart,
  total,
  onPaymentSuccess,
  colors
}) {
  const [currentStep, setCurrentStep] = useState('method'); // 'method', 'bank-selection', 'details', 'qr', 'success'
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash', 'online'
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [fetchingBankAccounts, setFetchingBankAccounts] = useState(false);
  const [paidAmount, setPaidAmount] = useState(total);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billData, setBillData] = useState(null);
  const [qrData, setQrData] = useState(null);

  const dueAmount = Math.max(0, total - paidAmount);
  const isFullPayment = paidAmount >= total;

  // Fetch bank accounts for online payment
  const fetchBankAccounts = async () => {
    setFetchingBankAccounts(true);
    setError(null);

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
        setError(data.message || 'Failed to fetch bank accounts');
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError('Failed to load bank accounts. Please try again later.');
    } finally {
      setFetchingBankAccounts(false);
    }
  };

  const handleMethodSelection = (method) => {
    setPaymentMethod(method);

    if (method === 'online') {
      setPaidAmount(total); // Online payments should be full
      setCurrentStep('bank-selection');
      fetchBankAccounts();
    } else {
      setCurrentStep('details');
    }
  };

  const handleBankAccountSelection = (account) => {
    setSelectedBankAccount(account);
    setCurrentStep('details');
  };

  const handleCreateBill = async () => {
    setLoading(true);
    setError(null);

    try {
      const billPayload = {
        customerType: customer.contactType,
        customerId: customer._id,
        items: cart.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          serialNumber: item.serialNumber || undefined
        })),
        paymentMethod,
        paidAmount: parseFloat(paidAmount),
        transactionId: transactionId || undefined,
        notes: `Bill created for ${customer.name}`
      };

      const response = await fetch(SummaryApi.createSalesBill.url, {
        method: SummaryApi.createSalesBill.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billPayload)
      });

      const data = await response.json();

      if (data.success) {
        setBillData(data.data);
        
        if (paymentMethod === 'online' && dueAmount > 0) {
          // Generate QR code for online payment
          await generateQRCode(data.data._id);
        } else {
          setCurrentStep('success');
        }
      } else {
        setError(data.message || 'Failed to create bill');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error creating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (billId) => {
    try {
      const response = await fetch(`${SummaryApi.generateQRCode.url}/${billId}?amount=${dueAmount}`, {
        method: SummaryApi.generateQRCode.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setQrData(data.data);
        setCurrentStep('qr');
      } else {
        setError(data.message || 'Failed to generate QR code');
        setCurrentStep('success'); // Fallback to success without QR
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
      setCurrentStep('success'); // Fallback to success without QR
    }
  };

  const handlePaymentConfirmation = () => {
    setCurrentStep('success');
    setTimeout(() => {
      if (onPaymentSuccess) onPaymentSuccess(billData);
    }, 2000);
  };

  const handleClose = () => {
    // If we're on success step and have billData, trigger payment success callback
    if (currentStep === 'success' && billData && onPaymentSuccess) {
      onPaymentSuccess(billData);
    }

    // Reset all states
    setCurrentStep('method');
    setPaymentMethod('');
    setSelectedBankAccount(null);
    setBankAccounts([]);
    setPaidAmount(total);
    setTransactionId('');
    setError(null);
    setBillData(null);
    setQrData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 opacity-80" 
          aria-hidden="true"
          onClick={currentStep === 'success' ? handleClose : undefined}
        />
        
        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-md mx-4 border ${colors.border} overflow-hidden border-t-4 ${colors.borderT}`} style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className={`flex justify-between items-center bg-gradient-to-r ${colors.bg} px-6 py-4 border-b ${colors.border}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full ${colors.button} flex items-center justify-center`}>
                <FiCreditCard className="text-white" size={16} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${colors.text}`}>Payment</h3>
                <p className={`text-sm ${colors.textLight}`}>Total: ₹{total}</p>
              </div>
            </div>
            {currentStep !== 'success' && (
              <button 
                onClick={handleClose} 
                className={`${colors.textLight} hover:${colors.text} focus:outline-none`}
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {!loading && (
              <AnimatePresence mode="wait">
                {/* Step 1: Payment Method Selection */}
                {currentStep === 'method' && (
                  <motion.div
                    key="method"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 text-center mb-6">
                      Select Payment Method
                    </h4>
                    
                    <button
                      onClick={() => handleMethodSelection('cash')}
                      className="w-full p-4 border-2 border-gray-200 hover:border-green-400 rounded-xl flex items-center space-x-4 transition-colors"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FiDollarSign className="text-green-600" size={24} />
                      </div>
                      <div className="text-left">
                        <h5 className="font-semibold text-gray-900">Cash Payment</h5>
                        <p className="text-sm text-gray-600">Pay with cash (partial payments allowed)</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleMethodSelection('online')}
                      className="w-full p-4 border-2 border-gray-200 hover:border-blue-400 rounded-xl flex items-center space-x-4 transition-colors"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiSmartphone className="text-blue-600" size={24} />
                      </div>
                      <div className="text-left">
                        <h5 className="font-semibold text-gray-900">Online Payment</h5>
                        <p className="text-sm text-gray-600">Pay via UPI/QR Code</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Bank Account Selection (for Online Payment) */}
                {currentStep === 'bank-selection' && (
                  <motion.div
                    key="bank-selection"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Select Bank Account
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Choose which account to receive payment
                      </p>
                    </div>

                    {fetchingBankAccounts ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                        <span className="ml-2 text-gray-600">Loading bank accounts...</span>
                      </div>
                    ) : bankAccounts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiCreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bank Accounts Found</h3>
                        <p className="text-gray-600 mb-4">
                          Please add a bank account first to receive online payments.
                        </p>
                        <button
                          onClick={() => setCurrentStep('method')}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                          Go Back
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bankAccounts.map((account) => (
                          <button
                            key={account._id}
                            onClick={() => handleBankAccountSelection(account)}
                            className={`w-full p-4 border-2 rounded-xl flex items-center justify-between transition-colors ${
                              selectedBankAccount?._id === account._id
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                account.isPrimary ? 'bg-yellow-100' : 'bg-blue-100'
                              }`}>
                                <FiCreditCard className={`text-lg ${
                                  account.isPrimary ? 'text-yellow-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div className="text-left">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-semibold text-gray-900">{account.bankName}</h5>
                                  {account.isPrimary && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {account.accountHolderName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  •••• •••• •••• {account.accountNumber.slice(-4)}
                                </p>
                                {account.upiId ? (
                                  <p className="text-xs text-green-600 font-medium">
                                    UPI: {account.upiId}
                                  </p>
                                ) : (
                                  <p className="text-xs text-orange-600 font-medium">
                                    ⚠ No UPI ID - QR will use account number
                                  </p>
                                )}
                              </div>
                            </div>
                            {selectedBankAccount?._id === account._id && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <FiCheck className="text-white text-sm" />
                              </div>
                            )}
                          </button>
                        ))}

                        <div className="flex space-x-3 mt-6">
                          <button
                            onClick={() => setCurrentStep('method')}
                            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => handleBankAccountSelection(selectedBankAccount)}
                            disabled={!selectedBankAccount}
                            className={`flex-1 py-3 ${colors.button} disabled:bg-gray-300 text-white rounded-lg font-medium`}
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Payment Details */}
                {currentStep === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {paymentMethod === 'cash' ? 'Cash Payment' : 'Online Payment'}
                      </h4>
                      <p className="text-gray-600">Bill Amount: ₹{total}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {paymentMethod === 'cash' ? 'Amount Received' : 'Payment Amount'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            min="0"
                            max={paymentMethod === 'online' ? total : undefined}
                            step="0.01"
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                            placeholder="0.00"
                            disabled={paymentMethod === 'online'}
                          />
                        </div>
                      </div>

                      {paymentMethod === 'cash' && dueAmount > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Due Amount: ₹{dueAmount}</strong>
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            This will be recorded as a partial payment
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'online' && selectedBankAccount && (
                        <div className="space-y-4">
                          {/* Selected Bank Account Info */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <FiCreditCard className="text-blue-600 text-sm" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">
                                  {selectedBankAccount.bankName}
                                </p>
                                <p className="text-xs text-blue-700">
                                  {selectedBankAccount.accountHolderName}
                                </p>
                              </div>
                              {selectedBankAccount.isPrimary && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>

                          {/* QR Code Display */}
                          <div className="text-center">
                            <h5 className="font-medium mb-3">Scan QR Code to Pay</h5>
                            <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                              <QRCodeCanvas
                                value={selectedBankAccount.upiId ?
                                  `upi://pay?pa=${selectedBankAccount.upiId}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${total}&tn=Bill-Payment-${encodeURIComponent(customer.name)}` :
                                  `upi://pay?pa=${selectedBankAccount.accountNumber}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${total}&tn=Bill-Payment-${encodeURIComponent(customer.name)}`
                                }
                                size={200}
                                level="H"
                                includeMargin={true}
                              />
                            </div>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-900">
                                Pay ₹{total} to {selectedBankAccount.accountHolderName}
                              </p>
                              {selectedBankAccount.upiId && (
                                <p className="text-xs text-green-600 font-medium">
                                  UPI ID: {selectedBankAccount.upiId}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Scan with any UPI app like PhonePe, Google Pay, Paytm
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Transaction ID (Enter after payment)
                            </label>
                            <input
                              type="text"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                              placeholder="Enter UPI transaction ID after successful payment"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          if (paymentMethod === 'online') {
                            setCurrentStep('bank-selection');
                          } else {
                            setCurrentStep('method');
                          }
                        }}
                        className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreateBill}
                        disabled={paidAmount <= 0}
                        className={`flex-1 py-3 ${colors.button} disabled:bg-gray-300 text-white rounded-lg font-medium`}
                      >
                        Confirm Payment
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: QR Code Display */}
                {currentStep === 'qr' && qrData && (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <QRCodeDisplay 
                      qrData={qrData} 
                      amount={dueAmount}
                      onPaymentConfirmed={handlePaymentConfirmation}
                      colors={colors}
                    />
                  </motion.div>
                )}

                {/* Step 4: Success */}
                {currentStep === 'success' && billData && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <FiCheck className="text-green-600" size={32} />
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Bill Created Successfully!
                      </h4>
                      <p className="text-gray-600">
                        Bill Number: <span className="font-mono font-semibold">{billData.billNumber}</span>
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">₹{billData.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Amount:</span>
                        <span className="font-semibold">₹{billData.paidAmount}</span>
                      </div>
                      {billData.dueAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Due Amount:</span>
                          <span className="font-semibold">₹{billData.dueAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className={`font-semibold capitalize ${
                          billData.paymentStatus === 'completed' ? 'text-green-600' : 
                          billData.paymentStatus === 'partial' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {billData.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className={`w-full py-3 ${colors.button} text-white rounded-lg font-medium`}
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}