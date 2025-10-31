import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShoppingCart, FiSearch, FiPlus, FiMinus, FiTrash2, FiDollarSign } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ItemSelector from './ItemSelector';
import PaymentModal from './PaymentModal';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

export default function BillingModal({ isOpen, onClose, customer, onBillCreated }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Modal registry setup
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(60); // z-[60] - higher than parent modals (50)

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
  const [currentStep, setCurrentStep] = useState('items'); // 'items', 'summary', 'payment'
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Bill totals
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

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
          handleClose();
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
  }, [isOpen, escPressCount, escPressTimer, showNotification]);

  // Fetch inventory items on modal open and reset state
  useEffect(() => {
    if (isOpen && customer) {
      fetchInventoryItems();
    } else if (!isOpen) {
      // Reset all states when modal closes
      resetModal();
    }
  }, [isOpen, customer]);

  // Calculate totals when cart changes
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal); // Can add taxes/discounts later
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
      console.log('Response status:', err.status);
      console.log('Response text:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerPrice = (item) => {
    if (item.pricing) {
      return customer.contactType === 'dealer' 
        ? item.pricing.dealerPrice 
        : item.pricing.distributorPrice;
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

    setCart(prev => [...prev, cartItem]);
  };

  const updateCartItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const totalPrice = item.unitPrice * newQuantity;
        return { ...item, quantity: newQuantity, totalPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleProceedToSummary = () => {
    if (cart.length === 0) {
      setError('Please add at least one item to the cart');
      return;
    }
    setCurrentStep('summary');
  };

  const handleProceedToPayment = () => {
    setCurrentStep('payment');
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (billData) => {
    if (onBillCreated) onBillCreated(billData);
    setShowPaymentModal(false);
    onClose();
    // Reset state
    setCart([]);
    setCurrentStep('items');
  };

  const resetModal = () => {
    setCart([]);
    setCurrentStep('items');
    setError(null);
    setShowItemSelector(false);
    setShowPaymentModal(false);
    setSubtotal(0);
    setTotal(0);
  };

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
      handleClose();
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !customer) return null;

  const customerTypeColor = customer.contactType === 'dealer' ? 'orange' : 'teal';
  const colorClasses = {
    orange: {
      bg: 'from-orange-50 to-orange-100',
      border: 'border-orange-200',
      borderT: 'border-t-orange-500',
      text: 'text-orange-900',
      textLight: 'text-orange-700',
      button: 'bg-orange-500 hover:bg-orange-600',
      buttonLight: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    },
    teal: {
      bg: 'from-teal-50 to-teal-100',
      border: 'border-teal-200',
      borderT: 'border-t-teal-500',
      text: 'text-teal-900',
      textLight: 'text-teal-700',
      button: 'bg-teal-500 hover:bg-teal-600',
      buttonLight: 'bg-teal-100 text-teal-800 hover:bg-teal-200'
    }
  };

  const colors = colorClasses[customerTypeColor];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 opacity-75"
          aria-hidden="true"
          onClick={handleOverlayClick}
        />
        
        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-6xl mx-4 border ${colors.border} overflow-hidden border-t-4 ${colors.borderT}`}>
          {/* Header */}
          <div className={`flex justify-between items-center bg-gradient-to-r ${colors.bg} px-6 py-4 border-b ${colors.border}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${colors.button} flex items-center justify-center`}>
                <FiShoppingCart className="text-white" size={20} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${colors.text}`}>
                  Create Bill - {customer.contactType.charAt(0).toUpperCase() + customer.contactType.slice(1)}
                </h3>
                <p className={`text-sm ${colors.textLight}`}>
                  {customer.name} {customer.firmName && `(${customer.firmName})`}
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className={`${colors.textLight} hover:${colors.text} focus:outline-none`}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center ${currentStep === 'items' ? colors.text : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'items' ? colors.button + ' text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="ml-2 font-medium">Select Items</span>
              </div>
              <div className={`w-16 h-0.5 ${currentStep === 'summary' || currentStep === 'payment' ? colors.button : 'bg-gray-200'}`} />
              <div className={`flex items-center ${currentStep === 'summary' || currentStep === 'payment' ? colors.text : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'summary' || currentStep === 'payment' ? colors.button + ' text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="ml-2 font-medium">Bill Summary</span>
              </div>
              <div className={`w-16 h-0.5 ${currentStep === 'payment' ? colors.button : 'bg-gray-200'}`} />
              <div className={`flex items-center ${currentStep === 'payment' ? colors.text : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'payment' ? colors.button + ' text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6" style={{ minHeight: '500px', maxHeight: '70vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            ) : null}

            {/* Step 1: Item Selection */}
            {currentStep === 'items' && (
              <ItemSelector
                items={items}
                onAddToCart={addToCart}
                customerType={customer.contactType}
                cart={cart}
                onUpdateQuantity={updateCartItemQuantity}
                onRemoveItem={removeFromCart}
                colors={colors}
                onRefreshItems={fetchInventoryItems}
                isRefreshing={loading}
              />
            )}

            {/* Step 2: Bill Summary */}
            {currentStep === 'summary' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-semibold text-gray-900">Bill Summary</h4>
                  <button
                    onClick={() => setCurrentStep('items')}
                    className={`px-4 py-2 rounded-lg ${colors.buttonLight} font-medium`}
                  >
                    Edit Items
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          {item.serialNumber && (
                            <p className="text-sm text-gray-500">Serial: {item.serialNumber}</p>
                          )}
                          <p className="text-sm text-gray-600">₹{item.unitPrice} × {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{item.totalPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-semibold">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-semibold text-gray-900">Payment</h4>
                  <button
                    onClick={() => setCurrentStep('summary')}
                    className={`px-4 py-2 rounded-lg ${colors.buttonLight} font-medium`}
                  >
                    Back to Summary
                  </button>
                </div>

                {/* Payment Status */}
                <div className="bg-blue-50 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Processing</h3>
                  <p className="text-gray-600 mb-4">
                    Complete your payment of ₹{total} for {customer?.name}
                  </p>

                  {/* Payment Modal Launch Button */}
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className={`px-6 py-3 ${colors.button} text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow`}
                  >
                    Open Payment Options
                  </button>

                  <p className="text-sm text-gray-500 mt-3">
                    Click above to open payment options dialog
                  </p>
                </div>

                {/* Bill Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Order Summary</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>{cart.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <div className="flex items-center space-x-4">
              {cart.length > 0 && (
                <div className="text-sm text-gray-600">
                  {cart.length} item{cart.length > 1 ? 's' : ''} • Total: ₹{total}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              {currentStep === 'items' && (
                <button
                  onClick={handleProceedToSummary}
                  disabled={cart.length === 0}
                  className={`px-6 py-2 ${colors.button} disabled:bg-gray-300 text-white rounded-lg font-medium`}
                >
                  Review Bill ({cart.length})
                </button>
              )}
              {currentStep === 'summary' && (
                <button
                  onClick={handleProceedToPayment}
                  className={`px-6 py-2 ${colors.button} text-white rounded-lg font-medium`}
                >
                  Proceed to Payment
                </button>
              )}
              {currentStep === 'payment' && (
                <button
                  onClick={() => setCurrentStep('summary')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Back to Summary
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setCurrentStep('summary'); // Go back to summary step
          }}
          customer={customer}
          cart={cart}
          total={total}
          onPaymentSuccess={handlePaymentSuccess}
          colors={colors}
        />
      )}
    </div>
  );
}
