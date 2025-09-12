import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShoppingCart, FiSearch, FiPlus, FiMinus, FiTrash2, FiDollarSign, FiCheck, FiCreditCard } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import { QRCodeCanvas } from 'qrcode.react';
import ItemSelector from './ItemSelector';

export default function CustomerBillingModal({ isOpen, onClose, customer, onBillCreated }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState('items'); // 'items', 'summary', 'payment', 'confirmation', 'success'
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  
  // Bill totals
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  // Reset modal when opened/closed
  useEffect(() => {
    if (isOpen && customer) {
      fetchInventoryItems();
      resetModal();
    }
  }, [isOpen, customer]);

  const resetModal = () => {
    setCurrentStep('items');
    setCart([]);
    setError(null);
    setPaymentMethod('');
    setPaidAmount(0);
    setTransactionId('');
    setNotes('');
    setBillNumber('');
    setSearchQuery('');
  };

  // Calculate totals when cart changes
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal);
  }, [cart]);

  const fetchInventoryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(SummaryApi.getAllInventoryItems.url, {
        method: SummaryApi.getAllInventoryItems.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched inventory items:', data.items);
        setItems(data.items);
      } else {
        setError(data.message || 'Failed to fetch inventory items');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Blue color scheme for customer billing (matching ItemSelector expected format)
  const colors = {
    bg: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    borderT: 'border-t-blue-500',
    text: 'text-blue-900',
    textLight: 'text-blue-700',
    button: 'bg-blue-500 hover:bg-blue-600',
    buttonLight: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  };

  const getCustomerPrice = (item) => {
    if (item.pricing) {
      return item.pricing.customerPrice;
    }
    return item.salePrice; // Fallback to old pricing
  };

  const addToCart = (item, serialNumber = null, quantity = 1) => {
    const unitPrice = getCustomerPrice(item);
    const totalPrice = unitPrice * quantity;
    
    const cartItem = {
      itemId: item._id,
      itemName: item.name,
      serialNumber,
      quantity,
      unitPrice,
      totalPrice,
      item // Keep reference for display
    };

    // Check if item already exists in cart (for generic items)
    if (item.type === 'generic-product' && !serialNumber) {
      const existingIndex = cart.findIndex(cartItem => 
        cartItem.itemId === item._id && !cartItem.serialNumber
      );
      
      if (existingIndex >= 0) {
        updateCartItemQuantity(existingIndex, cart[existingIndex].quantity + quantity);
        return;
      }
    }

    setCart([...cart, cartItem]);
  };

  const updateCartItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].totalPrice = updatedCart[index].unitPrice * newQuantity;
    setCart(updatedCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleProceedToSummary = () => {
    if (cart.length === 0) {
      setError('Please add items to cart before proceeding');
      return;
    }
    setError(null);
    setCurrentStep('summary');
  };

  const handleProceedToPayment = () => {
    setError(null);
    setCurrentStep('payment');
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    if (method === 'cash') {
      setPaidAmount(total); // Default to full payment for cash
    }
  };

  const generateUpiString = () => {
    const upiId = 'itindia.asr@okicici';
    const amount = total;
    const purpose = `Customer-Bill-${customer.name}`;
    
    return `upi://pay?pa=${upiId}&pn=SyncVap%20Industries&am=${amount}&tn=${purpose}`;
  };

  const handleProceedToConfirmation = () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (paymentMethod === 'online' && !transactionId.trim()) {
      setError('Transaction ID is required for online payments');
      return;
    }

    if (paymentMethod === 'cash' && (paidAmount < 0 || paidAmount > total)) {
      setError('Please enter a valid paid amount');
      return;
    }

    setError(null);
    setCurrentStep('confirmation');
  };

  const handleCreateBill = async () => {
    setProcessingPayment(true);
    setError(null);

    try {
      const billItems = cart.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        serialNumber: item.serialNumber
      }));

      const response = await fetch(SummaryApi.createCustomerBill.url, {
        method: SummaryApi.createCustomerBill.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: customer._id,
          items: billItems,
          paymentMethod,
          paidAmount: paymentMethod === 'cash' ? paidAmount : total,
          transactionId: paymentMethod === 'online' ? transactionId : null,
          notes
        })
      });

      const data = await response.json();

      if (data.success) {
        setBillNumber(data.data.billNumber);
        setCurrentStep('success');
        showNotification('success', 'Customer bill created successfully!');
        
        // Auto close after showing success for 3 seconds and call onBillCreated
        setTimeout(() => {
          if (onBillCreated) onBillCreated(data.data.bill);
          handleClose();
        }, 3000);
      } else {
        setError(data.message || 'Failed to create bill');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error creating bill:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'summary') {
      setCurrentStep('items');
    } else if (currentStep === 'payment') {
      setCurrentStep('summary');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('payment');
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 opacity-75" 
          aria-hidden="true"
          onClick={handleClose}
        />
        
        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-6xl mx-4 border border-blue-200 overflow-hidden border-t-4 border-t-blue-500">
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <FiDollarSign className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {currentStep === 'items' && 'Select Items'}
                  {currentStep === 'summary' && 'Bill Summary'}
                  {currentStep === 'payment' && 'Payment Details'}
                  {currentStep === 'confirmation' && 'Confirm Payment'}
                  {currentStep === 'success' && 'Bill Created Successfully'}
                </h3>
                <p className="text-sm text-blue-700">
                  Customer: {customer?.name}
                </p>
              </div>
            </div>
            {currentStep !== 'success' && (
              <button 
                onClick={handleClose} 
                className="text-blue-500 hover:text-blue-700 focus:outline-none"
              >
                <FiX className="h-6 w-6" />
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Step 1: Item Selection */}
            {currentStep === 'items' && (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                <ItemSelector
                  items={items}
                  onAddToCart={addToCart}
                  customerType="customer"
                  cart={cart}
                  onUpdateQuantity={updateCartItemQuantity}
                  onRemoveItem={removeFromCart}
                  colors={colors}
                />
                
                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToSummary}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                    disabled={cart.length === 0}
                  >
                    Proceed to Summary
                    <FiShoppingCart className="ml-2" size={16} />
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Bill Summary */}
            {currentStep === 'summary' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Bill Summary</h4>
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.itemName}</span>
                          {item.serialNumber && (
                            <span className="text-xs text-gray-500 ml-2">S/N: {item.serialNumber}</span>
                          )}
                          <span className="text-gray-600 ml-2">× {item.quantity}</span>
                        </div>
                        <span className="font-medium">₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex justify-between space-x-3">
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Amount Due: ₹{total}</h4>
                  <p className="text-gray-600">Customer: {customer.name}</p>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Select Payment Method</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handlePaymentMethodSelect('cash')}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'cash' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <FiDollarSign className="mr-2" />
                      Cash Payment
                      {paymentMethod === 'cash' && <FiCheck className="ml-2 text-blue-500" />}
                    </button>
                    
                    <button
                      onClick={() => handlePaymentMethodSelect('online')}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'online' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <FiCreditCard className="mr-2" />
                      Online Payment
                      {paymentMethod === 'online' && <FiCheck className="ml-2 text-blue-500" />}
                    </button>
                  </div>
                </div>

                {/* Cash Payment Details */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={total}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter paid amount"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Due Amount: ₹{(total - paidAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Online Payment Details */}
                {paymentMethod === 'online' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h5 className="font-medium mb-3">Scan QR Code to Pay</h5>
                      <div className="inline-block p-4 bg-white rounded-lg border">
                        <QRCodeCanvas 
                          value={generateUpiString()} 
                          size={200} 
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Scan with any UPI app to pay ₹{total}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter UPI transaction ID"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Add any notes about this bill..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex justify-between space-x-3">
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={processingPayment}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProceedToConfirmation}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    disabled={!paymentMethod}
                  >
                    Review & Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 'confirmation' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Confirm Payment Details</h4>
                </div>

                {/* Customer Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Customer Information</h5>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><span className="font-medium">Name:</span> {customer.name}</p>
                    <p><span className="font-medium">Phone:</span> {customer.phoneNumber}</p>
                    {customer.address && <p><span className="font-medium">Address:</span> {customer.address}</p>}
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Bill Summary</h5>
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.itemName}</span>
                          {item.serialNumber && (
                            <span className="text-gray-500 ml-2">S/N: {item.serialNumber}</span>
                          )}
                          <span className="text-gray-600 ml-2">× {item.quantity}</span>
                        </div>
                        <span className="font-medium">₹{item.totalPrice}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>₹{total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3">Payment Details</h5>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium capitalize">{paymentMethod} Payment</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount {paymentMethod === 'cash' ? 'Received' : 'to Pay'}:</span>
                      <span className="font-medium">₹{paidAmount}</span>
                    </div>
                    {paymentMethod === 'cash' && paidAmount < total && (
                      <div className="flex justify-between text-yellow-700">
                        <span>Due Amount:</span>
                        <span className="font-medium">₹{(total - paidAmount).toFixed(2)}</span>
                      </div>
                    )}
                    {paymentMethod === 'online' && transactionId && (
                      <div className="flex justify-between">
                        <span>Transaction ID:</span>
                        <span className="font-medium font-mono text-xs">{transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Please confirm:</strong> Once you create this bill, inventory will be automatically reduced and the transaction will be recorded.
                  </p>
                </div>

                <div className="flex justify-between space-x-3">
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={processingPayment}
                  >
                    Back to Payment
                  </button>
                  <button
                    onClick={handleCreateBill}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                    disabled={processingPayment}
                  >
                    {processingPayment ? <LoadingSpinner size="sm" /> : <FiCheck className="mr-2" />}
                    {processingPayment ? 'Creating Bill...' : 'Confirm & Create Bill'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {currentStep === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FiCheck className="text-green-600" size={40} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-lg text-gray-700 mb-1">
                    Bill Created Successfully
                  </p>
                  <p className="text-gray-600">
                    Bill Number: <span className="font-mono font-semibold text-blue-600">{billNumber}</span>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-semibold">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">₹{total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Amount:</span>
                    <span className="font-semibold">₹{paidAmount}</span>
                  </div>
                  {paidAmount < total && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Due Amount:</span>
                      <span className="font-semibold">₹{(total - paidAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-semibold capitalize ${
                      paidAmount >= total ? 'text-green-600' : 
                      paidAmount > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {paidAmount >= total ? 'Completed' : paidAmount > 0 ? 'Partial' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    This window will close automatically in a few seconds
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}