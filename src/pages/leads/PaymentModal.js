import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCreditCard, FiDollarSign, FiCheck, FiSmartphone } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import QRCodeDisplay from './QRCodeDisplay';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  customer, 
  cart, 
  total, 
  onPaymentSuccess, 
  colors 
}) {
  const [currentStep, setCurrentStep] = useState('method'); // 'method', 'details', 'qr', 'success'
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash', 'online'
  const [paidAmount, setPaidAmount] = useState(total);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billData, setBillData] = useState(null);
  const [qrData, setQrData] = useState(null);

  const dueAmount = Math.max(0, total - paidAmount);
  const isFullPayment = paidAmount >= total;

  const handleMethodSelection = (method) => {
    setPaymentMethod(method);
    setCurrentStep('details');
    if (method === 'online') {
      setPaidAmount(total); // Online payments should be full
    }
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
        <div className={`inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-md mx-4 border ${colors.border} overflow-hidden border-t-4 ${colors.borderT}`}>
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
          <div className="p-6">
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

                {/* Step 2: Payment Details */}
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

                      {paymentMethod === 'online' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction ID (Optional)
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                            placeholder="Enter transaction ID if available"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setCurrentStep('method')}
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