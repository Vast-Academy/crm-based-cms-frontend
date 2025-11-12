import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShoppingCart, FiSearch, FiPlus, FiMinus, FiTrash2, FiDollarSign } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ItemSelector from './ItemSelector';
import PaymentModal from './PaymentModal';
import Modal from '../../components/Modal';
import { SerializedStockForm, GenericStockForm } from '../inventory/AllInventoryItems';

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

  // Stock modal states
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockModalItem, setStockModalItem] = useState(null);
  const [stockEntriesToSave, setStockEntriesToSave] = useState([]);
  const [currentStockItem, setCurrentStockItem] = useState(null);
  const [showStockSaveConfirmation, setShowStockSaveConfirmation] = useState(false);
  const [stockSaveLoading, setStockSaveLoading] = useState(false);

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
      // Get branch ID from customer (dealer/distributor/customer)
      const branchId = customer?.branch?._id || customer?.branch;
      const url = branchId
        ? `${SummaryApi.getAllInventoryItems.url}?branch=${branchId}`
        : SummaryApi.getAllInventoryItems.url;

      const response = await fetch(url, {
        method: SummaryApi.getAllInventoryItems.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched inventory items:', data.items);

        // Filter out services and sort: serialized first, then generic
        const filteredAndSortedItems = data.items
          .filter(item => item.type !== 'service')
          .sort((a, b) => {
            // Serialized products first
            if (a.type === 'serialized-product' && b.type !== 'serialized-product') return -1;
            if (a.type !== 'serialized-product' && b.type === 'serialized-product') return 1;
            // Then generic products
            if (a.type === 'generic-product' && b.type !== 'generic-product') return -1;
            if (a.type !== 'generic-product' && b.type === 'generic-product') return 1;
            // Alphabetically within same type
            return (a.name || '').localeCompare(b.name || '');
          });

        setItems(filteredAndSortedItems);
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
    setShowAddStockModal(false);
    setStockModalItem(null);
  };

  const openAddStockModal = (item) => {
    const normalizedItem = {
      ...item,
      itemType: item.type === 'serialized-product' ? 'serialized' :
        item.type === 'generic-product' ? 'generic' : item.type
    };
    setStockModalItem(normalizedItem);
    setShowAddStockModal(true);
  };

  const closeAddStockModal = () => {
    setShowAddStockModal(false);
    setStockModalItem(null);
    setStockEntriesToSave([]);
    setCurrentStockItem(null);
    setShowStockSaveConfirmation(false);
  };

  const handlePrepareForSaving = (entries, item) => {
    setStockEntriesToSave(entries);
    setCurrentStockItem(item);
    setShowStockSaveConfirmation(true);
  };

  const handleSaveStock = async () => {
    if (!currentStockItem || stockEntriesToSave.length === 0) {
      setShowStockSaveConfirmation(false);
      return;
    }

    try {
      setStockSaveLoading(true);

      for (const entry of stockEntriesToSave) {
        const response = await fetch(SummaryApi.addInventoryStock.url, {
          method: SummaryApi.addInventoryStock.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: currentStockItem.id || currentStockItem._id,
            ...entry
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to add stock');
        }
      }

      showNotification('success', 'Stock added successfully');
      closeAddStockModal();
      await fetchInventoryItems();
    } catch (err) {
      showNotification('error', err.message || 'Failed to add stock');
    } finally {
      setStockSaveLoading(false);
      setShowStockSaveConfirmation(false);
    }
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
        <div className={`inline-block align-bottom bg-white rounded-lg text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-6xl mx-4 border ${colors.border} overflow-hidden border-t-4 ${colors.borderT}`}>
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
          
          {/* Content */}
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-4">
                {error}
              </div>
            ) : null}

            {/* Step 1: Item Selection */}
            {currentStep === 'items' && !loading && !error && (
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
                onProceedToSummary={handleProceedToSummary}
                openAddStockModal={openAddStockModal}
              />
            )}

            {/* Step 2: Bill Summary */}
            {currentStep === 'summary' && (
              <div className="p-4 space-y-6">
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
              <div className="p-4 space-y-6">
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

          {/* Footer Actions - Hidden on items step */}
          {currentStep !== 'items' && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
              <div className="flex items-center space-x-4">
                {cart.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {cart.length} item{cart.length > 1 ? 's' : ''} • Total: ₹{total}
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {currentStep === 'summary' && (
                  <>
                    <button
                      onClick={() => setCurrentStep('items')}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      className={`px-6 py-2 ${colors.button} text-white rounded-lg font-medium`}
                    >
                      Proceed to Payment
                    </button>
                  </>
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
          )}
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

      {/* Add Stock Modal */}
      {showAddStockModal && stockModalItem && (
        <Modal
          isOpen={showAddStockModal}
          onClose={closeAddStockModal}
          title={`Add Stock for ${stockModalItem?.name || ''}`}
          size="lg"
          zIndex="z-[80]"
          draggable={true}
        >
          {stockModalItem.itemType === 'serialized' ? (
            <SerializedStockForm
              item={stockModalItem}
              onClose={closeAddStockModal}
              showNotification={showNotification}
              onSuccess={async () => {
                closeAddStockModal();
                await fetchInventoryItems();
                showNotification('success', 'Stock added successfully');
              }}
              onPrepareForSaving={handlePrepareForSaving}
            />
          ) : stockModalItem.itemType === 'generic' ? (
            <GenericStockForm
              item={stockModalItem}
              onClose={closeAddStockModal}
              showNotification={showNotification}
              onSuccess={async () => {
                closeAddStockModal();
                await fetchInventoryItems();
                showNotification('success', 'Stock added successfully');
              }}
              onPrepareForSaving={handlePrepareForSaving}
            />
          ) : (
            <div className="text-center text-gray-500 py-4">
              Unsupported item type
            </div>
          )}
        </Modal>
      )}

      {/* Confirm Save Stock Modal */}
      {showStockSaveConfirmation && (
        <Modal
          isOpen={showStockSaveConfirmation}
          onClose={() => setShowStockSaveConfirmation(false)}
          title="Confirm Stock Save"
          size="md"
          zIndex="z-[90]"
          draggable={true}
        >
          <div className="py-4">
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to save this stock? This will add {stockEntriesToSave.length} {stockEntriesToSave.length === 1 ? 'entry' : 'entries'} to the inventory.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowStockSaveConfirmation(false)}
                disabled={stockSaveLoading}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                disabled={stockSaveLoading}
                className={`px-4 py-2 rounded-md text-white ${stockSaveLoading ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {stockSaveLoading ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
