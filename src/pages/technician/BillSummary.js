import React, { useState, useRef } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';

const BillSummary = ({ 
  products, 
  total, 
  paymentMethod, 
  paymentStatus,
  onSelectPaymentMethod, 
  onCashReceived,
  onOnlinePaymentComplete,
  onClose, 
  onComplete 
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const billRef = useRef(null);
  
  // Handle cash payment
  const handleCashPayment = () => {
    if (!cashAmount) return;
    onCashReceived(parseFloat(cashAmount));
  };
  
  // Handle online payment
  const handleOnlinePayment = () => {
    if (!transactionId.trim()) return;
    onOnlinePaymentComplete(transactionId);
  };
  
  // Generate PDF
  const handleDownloadPDF = () => {
    // In a real app, this would generate a PDF of the bill
    alert('PDF download would be initiated here');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Bill Summary</h3>
          {!paymentStatus.isComplete && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={20} />
            </button>
          )}
        </div>
        
        <div className="p-4" ref={billRef}>
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">INVOICE</h2>
            <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Time: {new Date().toLocaleTimeString()}</p>
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
                {products.map((product, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-sm">{product.itemName}</td>
                    <td className="px-3 py-2 text-sm text-center">{product.quantity}</td>
                    <td className="px-3 py-2 text-sm text-right">₹{product.price || 0}</td>
                    <td className="px-3 py-2 text-sm text-right">₹{(product.price || 0) * product.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan="3" className="px-3 py-2 text-sm font-medium text-right">Total</td>
                  <td className="px-3 py-2 text-sm font-medium text-right">₹{total}</td>
                </tr>
              </tfoot>
            </table>
            
            {paymentStatus.isComplete && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                <div className="font-medium">Payment Complete</div>
                <div className="text-sm">
                  {paymentMethod === 'online' ? 
                    `Paid online. Transaction ID: ${paymentStatus.transactionId || transactionId}` : 
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
                onClick={() => onSelectPaymentMethod('online', total)}
                className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Payment Online
              </button>
              <button
                onClick={() => onSelectPaymentMethod('cash', total)}
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
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter payment reference..."
                />
              </div>
              
              <button
                onClick={handleOnlinePayment}
                disabled={!transactionId.trim()}
                className={`w-full py-2 rounded-md ${
                  transactionId.trim() ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
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
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter amount received"
                />
              </div>
              
              <button
                onClick={handleCashPayment}
                disabled={!cashAmount || parseFloat(cashAmount) <= 0}
                className={`w-full py-2 rounded-md ${
                  cashAmount && parseFloat(cashAmount) > 0 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Payment
              </button>
              
              {cashAmount && parseFloat(cashAmount) < total && (
                <div className="mt-2 p-2 bg-yellow-100 text-yellow-700 rounded-md text-sm">
                  <strong>Warning:</strong> Amount received is less than total bill amount.
                  Remaining balance: ₹{(total - parseFloat(cashAmount)).toFixed(2)}
                </div>
              )}
              
              {cashAmount && parseFloat(cashAmount) > total && (
                <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-md text-sm">
                  Change to return: ₹{(parseFloat(cashAmount) - total).toFixed(2)}
                </div>
              )}
            </div>
          )}
          
          {/* Completion Section */}
          {paymentStatus.isComplete && (
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDownloadPDF}
                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Download Invoice
              </button>
              
              <button
                onClick={onComplete}
                className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Complete Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillSummary;