// pages/technician/components/ActiveProject.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiArrowLeft, FiPhone, FiUser, FiMapPin, FiCalendar, 
  FiPause, FiPackage, FiPlus, FiMinus, FiCheck, FiX, FiDownload
} from 'react-icons/fi';
import SummaryApi from '../../common';
import { PiBarcodeLight } from "react-icons/pi";
import { useNotification } from '../../context/NotificationContext';

const ActiveProject = ({ project, inventory, onComplete, onBack }) => {
  const { showNotification } = useNotification();
  const [startTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [callStatus, setCallStatus] = useState(null);
  const [technicianRemark, setTechnicianRemark] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({
    amount: 0,
    amountReceived: 0,
    isComplete: false,
    transactionId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Handle call to customer
  const handleCallCustomer = () => {
    // In a real app, this would trigger the phone's calling functionality
    // For now, we'll just record that a call was attempted
    setCallStatus({
      startTime: new Date(),
      status: 'initiated'
    });
    
    showNotification('info', `Call initiated to ${project.customerPhone}`);
  };
  
  // Handle adding products to the bill
  const handleProductSelection = (product, serialNumber = null) => {
    // Check if product has a price, default to 0 if not
    const productPrice = product.salePrice || product.price || 0;
    
    setSelectedProducts(prev => {
      // Check if product exists in selection
      const existingProductIndex = prev.findIndex(p => p.itemId === product.itemId);
      
      if (existingProductIndex >= 0) {
        // Product exists, update quantity
        const updatedProducts = [...prev];
        
        if (serialNumber) {
          // Add to serialized list if not already added
          if (!updatedProducts[existingProductIndex].serialNumbers.includes(serialNumber)) {
            updatedProducts[existingProductIndex].serialNumbers.push(serialNumber);
            updatedProducts[existingProductIndex].quantity += 1;
          }
        } else {
          // Increment generic quantity
          updatedProducts[existingProductIndex].quantity += 1;
        }
        
        return updatedProducts;
      } else {
        // Add new product to selection with price
        return [...prev, {
          ...product,
          price: productPrice, // Ensure price is included
          quantity: 1,
          serialNumbers: serialNumber ? [serialNumber] : []
        }];
      }
    });
  };
  
  // Handle removing products from the bill
  const removeProduct = (productId, serialNumber = null) => {
    setSelectedProducts(prev => {
      const existingProductIndex = prev.findIndex(p => p.itemId === productId);
      
      if (existingProductIndex === -1) return prev;
      
      const updatedProducts = [...prev];
      const product = {...updatedProducts[existingProductIndex]};
      
      if (serialNumber) {
        // Remove specific serial number
        product.serialNumbers = product.serialNumbers.filter(sn => sn !== serialNumber);
        product.quantity = product.serialNumbers.length;
      } else {
        // Decrement generic quantity
        product.quantity -= 1;
      }
      
      if (product.quantity <= 0) {
        // Remove product completely
        updatedProducts.splice(existingProductIndex, 1);
      } else {
        // Update product
        updatedProducts[existingProductIndex] = product;
      }
      
      return updatedProducts;
    });
  };
  
  // Calculate bill total
  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      // Calculate price * quantity
      return total + (product.price || 0) * product.quantity;
    }, 0);
  };
  
  // Handle generate bill
  const handleGenerateBill = () => {
    setShowBillSummary(true);
  };
  
  // Handle payment method selection
  const handlePayment = (method, amount) => {
    setPaymentMethod(method);
    setPaymentStatus({
      ...paymentStatus,
      amount,
      amountReceived: method === 'cash' ? 0 : amount
    });
  };
  
  // Handle cash received
  const handleCashReceived = (received) => {
    setPaymentStatus({
      ...paymentStatus,
      amountReceived: received,
      isComplete: received >= paymentStatus.amount
    });
  };
  
  // Handle online payment completion
  const handleOnlinePaymentComplete = (transactionId) => {
    setPaymentStatus({
      ...paymentStatus,
      isComplete: true,
      transactionId
    });
  };
  
  // Handle pause project
  const handlePauseProject = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(SummaryApi.updateProjectStatus.url, {
        method: SummaryApi.updateProjectStatus.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: project.orderId,
          customerId: project.customerId,
          status: 'paused',
          remarks: technicianRemark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Project paused successfully');
        onBack(); // Go back to assignments
      } else {
        setError(data.message || 'Failed to pause project');
        showNotification('error', data.message || 'Failed to pause project');
      }
    } catch (err) {
      console.error('Error pausing project:', err);
      setError('Server error. Please try again later.');
      showNotification('error', 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle complete project
  const handleCompleteProject = async () => {
    try {
      setLoading(true);
      
      if (selectedProducts.length === 0) {
        showNotification('error', 'No products selected. Cannot complete project.');
        return;
      }
      
      if (!paymentStatus.isComplete) {
        showNotification('error', 'Payment is not complete. Cannot finish project.');
        return;
      }
      
      const response = await fetch(SummaryApi.completeProject.url, {
        method: SummaryApi.completeProject.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: project.orderId,
          customerId: project.customerId,
          products: selectedProducts,
          total: calculateTotal(),
          paymentMethod,
          paymentStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Project completed successfully');
        onComplete(); // Refresh assignments and go back
      } else {
        setError(data.message || 'Failed to complete project');
        showNotification('error', data.message || 'Failed to complete project');
      }
    } catch (err) {
      console.error('Error completing project:', err);
      setError('Server error. Please try again later.');
      showNotification('error', 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle scan serial number
  const handleSerialNumberScan = (serialNumber) => {
    if (!serialNumber.trim()) return;
    
    // Find the product with this serial number
    for (const item of inventory) {
      const serialItem = item.serializedItems?.find(si => 
        si.serialNumber === serialNumber.trim()
      );
      
      if (serialItem) {
        // Add to selected products
        handleProductSelection(item, serialNumber.trim());
        return;
      }
    }
    
    // Serial number not found
    showNotification('error', 'Serial number not found in your inventory');
  };
  
  // Format time display
  const formatTime = (date) => {
    return date.toLocaleTimeString();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-blue-500 flex items-center hover:underline"
        >
          <FiArrowLeft className="mr-1" />
          Back to Assignments
        </button>
        
        <div>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            Project Active
          </span>
        </div>
      </div>
      
      {error && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{project.projectType}</h2>
          <div className="text-sm text-gray-500">
            Project Started: {formatTime(startTime)} | Current Time: {formatTime(currentTime)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Customer details and call section */}
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-3">Customer Information</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center">
                <FiUser className="mr-2 text-gray-500" />
                <div>
                  <strong>Name:</strong> {project.customerName}
                </div>
              </div>
              
              <div className="flex items-center">
                <FiPhone className="mr-2 text-gray-500" />
                <div>
                  <strong>Phone:</strong> {project.customerPhone}
                </div>
              </div>
              
              <div className="flex items-start">
                <FiMapPin className="mr-2 text-gray-500 mt-1" />
                <div>
                  <strong>Address:</strong> {project.customerAddress}
                </div>
              </div>
            </div>
            
            {/* Call and remarks section */}
            <div className="border-t pt-3 mt-3">
              <button 
                onClick={handleCallCustomer}
                className="w-full bg-green-500 text-white py-2 rounded-md flex items-center justify-center mb-3"
              >
                <FiPhone className="mr-2" />
                Call Customer
              </button>
              
              {callStatus && (
                <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm">
                  Call initiated at {callStatus.startTime.toLocaleTimeString()}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Technician Remarks</label>
                <textarea 
                  value={technicianRemark}
                  onChange={(e) => setTechnicianRemark(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Add notes about customer availability or special instructions..."
                  rows="3"
                />
              </div>
            </div>
          </div>
          
          {/* Product checkout section */}
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-3">Product Checkout</h3>
            
            {/* Serial number scanning */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Scan Serial Number</label>
              <div className="flex">
                <input
                  type="text"
                  id="serialNumberInput"
                  className="flex-1 p-2 border rounded-l-md"
                  placeholder="Enter or scan serial number"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSerialNumberScan(e.target.value);
                      e.target.value = ''; // Clear input
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('serialNumberInput');
                    handleSerialNumberScan(input.value);
                    input.value = ''; // Clear input
                  }}
                  className="bg-blue-500 text-white px-3 rounded-r-md flex items-center"
                >
                  <PiBarcodeLight className="mr-1" />
                  Scan
                </button>
              </div>
            </div>
            
            {/* Products list */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Available Products</label>
              <div className="h-40 overflow-y-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Avail.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory
                      .filter(item => {
                        const availableQuantity = 
                          (item.serializedItems?.length || 0) + 
                          (item.genericQuantity || 0);
                        return availableQuantity > 0;
                      })
                      .map(item => {
                        const availableQuantity = 
                          (item.serializedItems?.length || 0) + 
                          (item.genericQuantity || 0);
                            
                        return (
                          <tr key={item._id || item.itemId}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{item.itemName}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{availableQuantity}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                              <button
                                onClick={() => handleProductSelection(item)}
                                className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Add
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Selected products */}
            {selectedProducts.length > 0 && (
  <div className="mb-4">
    <h4 className="font-medium mb-2">Selected Products</h4>
    <div className="border rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {selectedProducts.map(product => (
            <tr key={product.itemId}>
              <td className="px-3 py-2 text-sm">
                <div>{product.itemName}</div>
                {product.serialNumbers?.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {product.serialNumbers.length} serial number(s)
                  </div>
                )}
              </td>
              <td className="px-3 py-2 text-sm text-center">
                {product.serialNumbers?.length > 0 ? (
                  product.serialNumbers.length
                ) : (
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => removeProduct(product.itemId)}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="mx-2">{product.quantity}</span>
                    <button 
                      onClick={() => handleProductSelection(product)}
                      className="p-1 text-gray-500 hover:text-green-500"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                )}
              </td>
              <td className="px-3 py-2 text-sm text-right">
                ₹{(product.price || 0).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-sm text-right font-medium">
                ₹{((product.price || 0) * product.quantity).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-sm text-center">
                <button
                  onClick={() => removeProduct(product.itemId)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan="3" className="px-3 py-2 text-sm font-medium text-right">Total Amount:</td>
            <td className="px-3 py-2 text-sm font-medium text-right">₹{calculateTotal().toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)}
            
            {selectedProducts.length > 0 && (
              <div className="text-right">
                <button
                  onClick={handleGenerateBill}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Generate Bill
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={handlePauseProject}
            disabled={loading}
            className="px-4 py-2 flex items-center border border-red-500 text-red-500 rounded-md hover:bg-red-50 disabled:opacity-50"
          >
            <FiPause className="mr-2" />
            Pause Project
          </button>
          
          <button 
            onClick={handleGenerateBill}
            disabled={selectedProducts.length === 0 || loading}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedProducts.length > 0 && !loading
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FiCheck className="mr-2" />
            Complete & Generate Bill
          </button>
        </div>
      </div>
      
      {/* Bill Summary Modal */}
      {showBillSummary && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bill Summary</h3>
        {!paymentStatus.isComplete && (
          <button onClick={() => setShowBillSummary(false)} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        )}
      </div>
      
      <div className="p-4">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">INVOICE</h2>
          <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">Time: {new Date().toLocaleTimeString()}</p>
          <p className="text-sm text-gray-500">Customer: {project.customerName}</p>
          <p className="text-sm text-gray-500">Project: {project.projectType}</p>
        </div>
        
        <div className="mb-4 overflow-y-auto max-h-60">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedProducts.map((product, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-sm">{product.itemName}</td>
                  <td className="px-3 py-2 text-sm text-center">{product.quantity}</td>
                  <td className="px-3 py-2 text-sm text-right">₹{(product.price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-sm text-right">₹{((product.price || 0) * product.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan="3" className="px-3 py-2 text-sm font-medium text-right">Total</td>
                <td className="px-3 py-2 text-sm font-medium text-right">₹{calculateTotal().toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
                
                {paymentStatus.isComplete && (
                  <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                    <div className="font-medium">Payment Complete</div>
                    <div className="text-sm">
                      {paymentMethod === 'online' ? 
                        `Paid online. Transaction ID: ${paymentStatus.transactionId}` : 
                        `Paid via cash. Amount received: ₹${paymentStatus.amountReceived}`
                      }
                    </div>
                  </div>
                )}
              </div>
              
              {/* Payment Section */}
              {!paymentMethod && !paymentStatus.isComplete && (
                <div className="mb-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handlePayment('online', calculateTotal())}
                    className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Payment Online
                  </button>
                  <button
                    onClick={() => handlePayment('cash', calculateTotal())}
                    className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Payment via Cash
                  </button>
                </div>
              )}
              
              {/* Online Payment UI */}
              {paymentMethod === 'online' && !paymentStatus.isComplete && (
                <div className="mb-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 w-48 h-48 flex items-center justify-center">
                      <p className="text-gray-500">QR Code for Payment</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Transaction ID / UPI Reference</label>
                    <input
                      type="text"
                      id="transactionIdInput"
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter payment reference..."
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      const input = document.getElementById('transactionIdInput');
                      if (input.value.trim()) {
                        handleOnlinePaymentComplete(input.value.trim());
                      } else {
                        showNotification('error', 'Please enter a transaction ID');
                      }
                    }}
                    className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Confirm Payment
                  </button>
                </div>
              )}
              
              {/* Cash Payment UI */}
              {paymentMethod === 'cash' && !paymentStatus.isComplete && (
                <div className="mb-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Amount Received</label>
                    <input
                      type="number"
                      id="cashAmountInput"
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter amount received"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      const input = document.getElementById('cashAmountInput');
                      const amount = parseFloat(input.value);
                      if (amount > 0) {
                        handleCashReceived(amount);
                      } else {
                        showNotification('error', 'Please enter a valid amount');
                      }
                    }}
                    className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Confirm Payment
                  </button>
                  
                  {paymentStatus.amountReceived > 0 && paymentStatus.amountReceived < calculateTotal() && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-700 rounded-md text-sm">
                      <strong>Warning:</strong> Amount received is less than total bill amount.
                      Remaining balance: ₹{(calculateTotal() - paymentStatus.amountReceived).toFixed(2)}
                    </div>
                  )}
                  
                  {paymentStatus.amountReceived > calculateTotal() && (
                    <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-md text-sm">
                      Change to return: ₹{(paymentStatus.amountReceived - calculateTotal()).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              
              {/* Completion Section */}
              {paymentStatus.isComplete && (
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => {
                      // In a real app, this would generate and download a PDF
                      showNotification('info', 'PDF download would be initiated here');
                    }}
                    className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
                  >
                    <FiDownload className="mr-2" />
                    Download Invoice
                  </button>
                  
                  <button
                    onClick={handleCompleteProject}
                    disabled={loading}
                    className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Complete Project'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveProject;