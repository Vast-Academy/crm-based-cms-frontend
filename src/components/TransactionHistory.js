import React, { useState, useEffect } from 'react';
import { FiClock, FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import SummaryApi from '../common';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from '../context/NotificationContext';

const TransactionHistory = ({
  customerId,
  customerType,
  billsSummary,
  onPayDueClick,
  showPaymentForm = false,
  onBackToHistory = null,
  themeColor = 'teal' // 'teal', 'orange', 'purple' for different customer types
}) => {
  const { showNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Theme colors mapping
  const themeColors = {
    teal: {
      button: 'bg-teal-500 hover:bg-teal-600',
      card: 'bg-teal-50 border-teal-200',
      text: 'text-teal-900'
    },
    orange: {
      button: 'bg-orange-500 hover:bg-orange-600',
      card: 'bg-orange-50 border-orange-200',
      text: 'text-orange-900'
    },
    purple: {
      button: 'bg-purple-500 hover:bg-purple-600',
      card: 'bg-purple-50 border-purple-200',
      text: 'text-purple-900'
    }
  };

  const theme = themeColors[themeColor] || themeColors.teal;

  useEffect(() => {
    if (customerId && customerType) {
      fetchTransactionHistory();
    }
  }, [customerId, customerType]);

  const fetchTransactionHistory = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${SummaryApi.getTransactionHistory.url}/${customerId}?customerType=${customerType}`, {
        method: SummaryApi.getTransactionHistory.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data.transactions);
      } else {
        showNotification('error', data.message || 'Failed to fetch transaction history');
      }
    } catch (err) {
      showNotification('error', 'Server error while fetching transaction history');
      console.error('Error fetching transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getTransactionIcon = (transactionType) => {
    switch (transactionType) {
      case 'due_payment':
        return '💸';
      case 'partial_payment':
        return '💳';
      case 'full_payment':
        return '✅';
      default:
        return '💰';
    }
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      cash: 'Cash',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque'
    };
    return methods[method] || method;
  };

  if (showPaymentForm) {
    return (
      <div>
        <div className="flex items-center mb-6">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <FiArrowLeft size={20} />
            </button>
          )}
          <h4 className={`font-medium text-gray-900 text-lg flex items-center`}>
            <FiDollarSign className={`mr-2 text-${themeColor}-500`} />
            Process Payment
          </h4>
        </div>
        {/* Payment form will be rendered by parent component */}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className={`font-medium text-gray-900 text-lg flex items-center`}>
          <FiClock className={`mr-2 text-${themeColor}-500`} />
          Transaction History
        </h4>
        {/* Always show Pay Due button */}
        <button
          onClick={onPayDueClick}
          className={`${theme.button} text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center`}
        >
          ₹ Pay Due
        </button>
      </div>

      {/* Due Amount Summary */}
      {billsSummary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Total Amount</h5>
            <p className="text-xl font-bold text-blue-600">₹{billsSummary.totalAmount}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h5 className="font-medium text-green-900 mb-2">Paid Amount</h5>
            <p className="text-xl font-bold text-green-600">₹{billsSummary.totalPaid}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h5 className="font-medium text-red-900 mb-2">Due Amount</h5>
            <p className="text-xl font-bold text-red-600">₹{billsSummary.totalDue}</p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h5 className="font-medium text-gray-900">Recent Transactions</h5>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : transactions.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {transactions.map((transaction) => {
              const { date, time } = formatDate(transaction.date);

              return (
                <div key={transaction.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-lg mr-1">{getTransactionIcon(transaction.transactionType)}</span>
                        <p className="font-medium text-gray-900 text-sm">
                          {transaction.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{date} at {time}</span>
                        <span className="capitalize">
                          {getPaymentMethodDisplay(transaction.paymentMethod)}
                        </span>
                        {transaction.relatedBills && transaction.relatedBills.length > 0 && (
                          <span>
                            {transaction.relatedBills.map(bill => `#${bill.billNumber}`).join(', ')}
                          </span>
                        )}
                        {transaction.transactionId && (
                          <span className="text-blue-600">ID: {transaction.transactionId}</span>
                        )}
                      </div>
                      {transaction.notes && (
                        <p className="text-xs text-gray-600 mt-1">Note: {transaction.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +₹{transaction.amount}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiClock className="text-gray-400" size={20} />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h4>
            <p className="text-gray-600">Transaction history will appear here once payments are made</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;