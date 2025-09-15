import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiUser, FiPhone, FiMapPin, FiDollarSign, FiCreditCard, FiFileText, FiPrinter, FiDownload } from 'react-icons/fi';

export default function ViewBillModal({ isOpen, onClose, bill, customerInfo }) {
  // Hide parent modal background when this modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Add class to body to hide parent modal overlays
      document.body.classList.add('view-bill-modal-open');
    } else {
      document.body.classList.remove('view-bill-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('view-bill-modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !bill) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getPaymentStatusConfig = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', label: 'Fully Paid' },
      partial: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', label: 'Partially Paid' },
      pending: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: 'Payment Pending' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const getPaymentMethodInfo = (method) => {
    const methodConfig = {
      cash: { icon: '💵', label: 'Cash Payment', color: 'text-green-700' },
      upi: { icon: '📱', label: 'UPI Payment', color: 'text-blue-700' },
      bank_transfer: { icon: '🏦', label: 'Bank Transfer', color: 'text-purple-700' },
      cheque: { icon: '🧾', label: 'Cheque Payment', color: 'text-orange-700' }
    };
    return methodConfig[method] || { icon: '💳', label: 'Unknown', color: 'text-gray-700' };
  };

  const statusConfig = getPaymentStatusConfig(bill.paymentStatus);
  const paymentMethod = getPaymentMethodInfo(bill.paymentMethod);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // This would typically generate and download a PDF
    console.log('Download bill:', bill.billNumber);
  };

  return createPortal(
    <>
      {/* CSS to hide parent modal overlays */}
      <style>{`
        .view-bill-modal-open .fixed.z-60 {
          display: none !important;
        }
      `}</style>
      <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className=""
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-4xl mx-4 overflow-hidden"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiFileText size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Bill Details</h3>
                <p className="text-blue-100 text-sm">{bill.billNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                title="Print Bill"
              >
                <FiPrinter size={18} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                title="Download Bill"
              >
                <FiDownload size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bill Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bill Header */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiFileText className="mr-2 text-blue-500" />
                        Bill Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Bill Number</label>
                          <p className="text-lg font-mono font-semibold text-gray-900">{bill.billNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date & Time</label>
                          <p className="text-gray-900 flex items-center">
                            <FiCalendar className="mr-1 text-gray-400" size={14} />
                            {formatDate(bill.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Created By</label>
                          <p className="text-gray-900">{bill.createdBy?.firstName} {bill.createdBy?.lastName || 'System'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiUser className="mr-2 text-green-500" />
                        Customer Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-gray-900 font-medium">{bill.customerName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900 flex items-center">
                            <FiPhone className="mr-1 text-gray-400" size={14} />
                            {bill.customerPhone}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Type</label>
                          <p className="text-gray-900 capitalize">{bill.customerType}</p>
                        </div>
                        {bill.branch && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Branch</label>
                            <p className="text-gray-900 flex items-center">
                              <FiMapPin className="mr-1 text-gray-400" size={14} />
                              {bill.branch.name || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Items</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bill.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                                {item.serialNumber && (
                                  <div className="text-xs text-gray-500">S/N: {item.serialNumber}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {bill.notes && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{bill.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Summary Sidebar */}
              <div className="space-y-6">
                {/* Payment Status */}
                <div className={`rounded-xl p-6 ${statusConfig.bg} ${statusConfig.border} border`}>
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <FiCreditCard className="mr-2 text-blue-500" />
                    Payment Status
                  </h4>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusConfig.text} bg-white border-2 ${statusConfig.border}`}>
                      {statusConfig.label}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{paymentMethod.icon}</span>
                    <div>
                      <p className={`font-medium ${paymentMethod.color}`}>{paymentMethod.label}</p>
                      {bill.transactionId && (
                        <p className="text-xs text-gray-500 font-mono">ID: {bill.transactionId}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  {bill.paymentDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        {bill.paymentDetails.upiTransactionId && (
                          <div>
                            <span className="font-medium">UPI Transaction:</span> {bill.paymentDetails.upiTransactionId}
                          </div>
                        )}
                        {bill.paymentDetails.utrNumber && (
                          <div>
                            <span className="font-medium">UTR Number:</span> {bill.paymentDetails.utrNumber}
                          </div>
                        )}
                        {bill.paymentDetails.bankName && (
                          <div>
                            <span className="font-medium">Bank:</span> {bill.paymentDetails.bankName}
                          </div>
                        )}
                        {bill.paymentDetails.chequeNumber && (
                          <div>
                            <span className="font-medium">Cheque Number:</span> {bill.paymentDetails.chequeNumber}
                          </div>
                        )}
                        {bill.paymentDetails.chequeBank && (
                          <div>
                            <span className="font-medium">Cheque Bank:</span> {bill.paymentDetails.chequeBank}
                          </div>
                        )}
                        {bill.paymentDetails.chequeStatus && (
                          <div>
                            <span className="font-medium">Cheque Status:</span>
                            <span className={`ml-1 capitalize ${
                              bill.paymentDetails.chequeStatus === 'cleared' ? 'text-green-600' :
                              bill.paymentDetails.chequeStatus === 'bounced' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {bill.paymentDetails.chequeStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiDollarSign className="mr-2 text-green-500" />
                    Amount Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(bill.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 text-lg font-semibold">
                      <span className="text-gray-900">Total Amount</span>
                      <span className="text-gray-900">{formatCurrency(bill.total)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-600">Paid Amount</span>
                      <span className="font-semibold text-green-600">{formatCurrency(bill.paidAmount)}</span>
                    </div>
                    {bill.receivedAmount !== bill.paidAmount && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-blue-600">Received Amount</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(bill.receivedAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className={`${bill.dueAmount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        Due Amount
                      </span>
                      <span className={`font-semibold ${bill.dueAmount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatCurrency(bill.dueAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Created</label>
                      <p className="text-gray-600">{formatDate(bill.createdAt)}</p>
                    </div>
                    {bill.updatedAt && bill.updatedAt !== bill.createdAt && (
                      <div>
                        <label className="font-medium text-gray-700">Last Updated</label>
                        <p className="text-gray-600">{formatDate(bill.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>,
    document.body
  );
}