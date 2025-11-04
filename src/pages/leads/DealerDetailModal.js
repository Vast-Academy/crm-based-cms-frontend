import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiPhone, FiMapPin, FiMessageSquare, FiCalendar, FiFileText, FiDollarSign, FiCreditCard, FiCheck, FiAlertCircle, FiSmartphone, FiTrendingUp, FiArrowLeft, FiPrinter, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import BillHistoryTable from '../../components/BillHistoryTable';
import TransactionHistory from '../../components/TransactionHistory';
import { useNotification } from '../../context/NotificationContext';
import BillingModal from './BillingModal';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

export default function DealerDetailModal({ isOpen, onClose, dealerId, onDealerUpdated }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Modal registry setup
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(50); // z-50 from the modal div

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

  // Refresh states for each tab
  const [refreshingDetails, setRefreshingDetails] = useState(false);
  const [refreshingBills, setRefreshingBills] = useState(false);
  const [refreshingPayments, setRefreshingPayments] = useState(false);
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [transactionRefreshKey, setTransactionRefreshKey] = useState(0);
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

  // Bill detail view states
  const [billView, setBillView] = useState('list'); // 'list' or 'detail'
  const [selectedBill, setSelectedBill] = useState(null);
  const printRef = useRef();

  // Billing modal states
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedBillingCustomer, setSelectedBillingCustomer] = useState(null);

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
          onClose();
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
  }, [isOpen, onClose, escPressCount, escPressTimer, showNotification]);

  // Reset tab to details when modal opens
  useEffect(() => {
    if (isOpen && dealerId) {
      setActiveTab('details'); // Always reset to details tab
      setBillView('list'); // Reset bill view
      setSelectedBill(null); // Clear selected bill
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

  // Handle opening billing modal for dealer
  const handleCreateBill = (customer) => {
    // Add contactType property if not present
    const customerWithType = {
      ...customer,
      contactType: 'dealer'
    };
    setSelectedBillingCustomer(customerWithType);
    setShowBillingModal(true);
  };

  // Handle successful bill creation
  const handleBillCreated = (billData) => {
    console.log('Bill created successfully:', billData);
    setShowBillingModal(false);
    setSelectedBillingCustomer(null);
    // Refresh bills if on bills tab
    if (activeTab === 'bills' || activeTab === 'payment') {
      fetchDealerBills();
    }
  };

  // Refresh handlers for each tab
  const handleRefreshDetails = async () => {
    if (refreshingDetails) return;

    setRefreshingDetails(true);
    try {
      await fetchDealerDetails();
    } catch (err) {
      console.error('Error refreshing dealer details:', err);
    } finally {
      setRefreshingDetails(false);
    }
  };

  const handleRefreshBills = async () => {
    if (refreshingBills) return;

    setRefreshingBills(true);
    try {
      await fetchDealerBills();
    } catch (err) {
      console.error('Error refreshing bills:', err);
    } finally {
      setRefreshingBills(false);
    }
  };

  const handleRefreshPayments = async () => {
    if (refreshingPayments) return;

    setRefreshingPayments(true);
    try {
      await fetchDealerBills();
      setTransactionRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error refreshing payments:', err);
    } finally {
      setRefreshingPayments(false);
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
        
        // Refresh bills data and transaction history
        fetchDealerBills();
        setTransactionRefreshKey(prev => prev + 1);

        // Switch back to payment tab to show updated transaction history
        setShowPaymentForm(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setBillView('detail');
  };

  const handleBackToBills = () => {
    setBillView('list');
    setSelectedBill(null);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const WinPrint = window.open('', '', 'width=900,height=650');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Invoice ${selectedBill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .print-content { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .invoice-details { width: 45%; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #374151; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .text-right { text-align: right; }
            .totals { margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .final-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
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
      onClose();
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text('SyncVap CRM', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Your Business Address', 105, 28, { align: 'center' });
    doc.text('Phone: (000) 000-0000 | Email: info@syncvap.com', 105, 34, { align: 'center' });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 105, 50, { align: 'center' });

    // Bill Information - Left Side
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 65);
    doc.setFontSize(10);
    doc.text(selectedBill.customerName || dealer?.name || 'N/A', 20, 72);
    doc.text(dealer?.address || 'Address not available', 20, 78);
    doc.text(selectedBill.customerPhone || dealer?.phoneNumber || 'Phone not available', 20, 84);

    // Invoice Details - Right Side
    doc.setFontSize(10);
    doc.text(`Invoice #: ${selectedBill.billNumber}`, 130, 65);
    doc.text(`Date: ${formatDate(selectedBill.createdAt).split(',')[0]}`, 130, 71);

    const statusText = selectedBill.paymentStatus === 'completed' ? 'Paid'
                      : selectedBill.paymentStatus === 'partial' ? 'Partially Paid'
                      : 'Pending';
    doc.text(`Status: ${statusText}`, 130, 77);

    // Manual Table Header
    const tableStartY = 105;
    doc.setFillColor(243, 244, 246);
    doc.rect(20, tableStartY - 5, 170, 10, 'F');

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Item', 25, tableStartY);
    doc.text('Qty', 85, tableStartY, { align: 'center' });
    doc.text('Unit Price', 125, tableStartY, { align: 'center' });
    doc.text('Total', 170, tableStartY, { align: 'center' });

    // Table Content
    let currentY = tableStartY + 10;
    if (selectedBill.items && selectedBill.items.length > 0) {
      selectedBill.items.forEach((item, index) => {
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(20, currentY - 5, 170, 8, 'F');
        }

        doc.setTextColor(0, 0, 0);
        doc.text(item.itemName || 'N/A', 25, currentY);
        doc.text((item.quantity || 0).toString(), 85, currentY, { align: 'center' });
        doc.text('Rs.' + (item.unitPrice || 0).toString(), 125, currentY, { align: 'center' });
        doc.text('Rs.' + (item.totalPrice || 0).toString(), 170, currentY, { align: 'center' });

        currentY += 8;
      });
    } else {
      doc.text('No items found', 105, currentY, { align: 'center' });
      currentY += 8;
    }

    // Table border
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, tableStartY - 5, 170, currentY - tableStartY + 5);

    // Totals Section
    const totalsStartY = currentY + 20;
    const totalsX = 130;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text('Subtotal: Rs.' + (selectedBill.subtotal || 0).toString(), totalsX, totalsStartY);

    // Add black line above Total
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5);
    doc.line(totalsX, totalsStartY + 4, 190, totalsStartY + 4);

    doc.text('Total: Rs.' + (selectedBill.total || 0).toString(), totalsX, totalsStartY + 12);
    doc.text('Paid: Rs.' + (selectedBill.paidAmount || 0).toString(), totalsX, totalsStartY + 20);

    // Pending amount with color
    const pendingAmount = selectedBill.dueAmount || 0;
    if (pendingAmount > 0) {
      doc.setTextColor(220, 38, 38); // Red color for pending
    } else {
      doc.setTextColor(34, 197, 94); // Green color for fully paid
    }
    doc.text('Pending: Rs.' + pendingAmount.toString(), totalsX, totalsStartY + 28);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Save the PDF
    doc.save(`invoice_${selectedBill.billNumber}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
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
            <nav className="-mb-px flex justify-between items-center">
              <div className="flex space-x-8">
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
              </div>

              {/* Refresh Button for Active Tab */}
              <div className="py-2">
                {activeTab === 'details' && (
                  <button
                    onClick={handleRefreshDetails}
                    disabled={refreshingDetails}
                    className={`p-2 rounded-md transition-colors ${
                      refreshingDetails
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                    title="Refresh dealer details"
                  >
                    <FiRefreshCw
                      className={`w-4 h-4 ${refreshingDetails ? 'animate-spin' : ''}`}
                    />
                  </button>
                )}
                {activeTab === 'bills' && (
                  <button
                    onClick={handleRefreshBills}
                    disabled={refreshingBills}
                    className={`p-2 rounded-md transition-colors ${
                      refreshingBills
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                    title="Refresh bill history"
                  >
                    <FiRefreshCw
                      className={`w-4 h-4 ${refreshingBills ? 'animate-spin' : ''}`}
                    />
                  </button>
                )}
                {activeTab === 'payment' && (
                  <button
                    onClick={handleRefreshPayments}
                    disabled={refreshingPayments}
                    className={`p-2 rounded-md transition-colors ${
                      refreshingPayments
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                    title="Refresh payment history"
                  >
                    <FiRefreshCw
                      className={`w-4 h-4 ${refreshingPayments ? 'animate-spin' : ''}`}
                    />
                  </button>
                )}
              </div>
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
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <FiUser className="mr-2 text-orange-500" />
                            Basic Information
                          </h4>
                          {/* New Bill Button - Only show if manager */}
                          {user.role === 'manager' && (
                            <button
                              onClick={() => handleCreateBill(dealer)}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                            >
                              New Bill
                            </button>
                          )}
                        </div>
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
                    {billView === 'detail' && selectedBill ? (
                      /* Bill Detail View */
                      <div>
                        {/* Header Actions */}
                        <div className="flex justify-between items-center mb-6">
                          <button
                            onClick={handleBackToBills}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <FiArrowLeft size={20} />
                            Back to Bills
                          </button>
                          <div className="flex gap-3">
                            <button
                              onClick={handlePrint}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <FiPrinter size={20} />
                              Print
                            </button>
                            <button
                              onClick={handleDownloadPDF}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <FiDownload size={20} />
                              Download PDF
                            </button>
                          </div>
                        </div>

                        {/* Bill Detail */}
                        <div ref={printRef} className="print-content bg-white rounded-lg shadow-lg p-8">
                          {/* Company Header */}
                          <div className="header text-center mb-8 border-b-2 border-gray-800 pb-6">
                            <h1 className="company-name text-3xl font-bold text-blue-600 mb-2">SyncVap CRM</h1>
                            <p className="text-gray-600">Your Business Address</p>
                            <p className="text-gray-600">Phone: (000) 000-0000 | Email: info@syncvap.com</p>
                          </div>

                          <h2 className="invoice-title text-2xl font-bold text-center mb-8">INVOICE</h2>

                          {/* Bill Info */}
                          <div className="bill-info flex justify-between mb-8">
                            <div className="customer-info">
                              <h3 className="section-title text-lg font-semibold text-gray-700 mb-3">Bill To:</h3>
                              <p className="font-semibold text-lg">{selectedBill.customerName || dealer?.name}</p>
                              <p className="text-gray-600">{dealer?.address || 'Address not available'}</p>
                              <p className="text-gray-600">{selectedBill.customerPhone || dealer?.phoneNumber}</p>
                            </div>
                            <div className="invoice-details text-right">
                              <p className="mb-2"><span className="font-semibold">Invoice #:</span> {selectedBill.billNumber}</p>
                              <p className="mb-2"><span className="font-semibold">Date:</span> {formatDate(selectedBill.createdAt).split(',')[0]}</p>
                              <p className="mb-2">
                                <span className="font-semibold">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                                  selectedBill.paymentStatus === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : selectedBill.paymentStatus === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {selectedBill.paymentStatus === 'completed' ? 'Paid' : selectedBill.paymentStatus === 'partial' ? 'Partially Paid' : 'Pending'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Items Table */}
                          <table className="w-full border-collapse mb-8">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="text-left p-3 border-b border-gray-300 font-semibold">Item</th>
                                <th className="text-center p-3 border-b border-gray-300 font-semibold">Qty</th>
                                <th className="text-right p-3 border-b border-gray-300 font-semibold">Unit Price</th>
                                <th className="text-right p-3 border-b border-gray-300 font-semibold">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedBill.items?.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                  <td className="p-3">
                                    <div>
                                      <div className="font-medium">{item.itemName}</div>
                                      {item.serialNumber && (
                                        <div className="text-xs text-gray-500">S/N: {item.serialNumber}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-center p-3">{item.quantity}</td>
                                  <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                                  <td className="text-right p-3">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                              )) || (
                                <tr>
                                  <td colSpan="4" className="text-center py-8 text-gray-500">No items found</td>
                                </tr>
                              )}
                            </tbody>
                          </table>

                          {/* Totals */}
                          <div className="totals text-right max-w-sm ml-auto">
                            <div className="total-row flex justify-between py-2">
                              <span className="font-semibold">Subtotal:</span>
                              <span>{formatCurrency(selectedBill.subtotal || 0)}</span>
                            </div>
                            <div className="final-total flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
                              <span>Total:</span>
                              <span>{formatCurrency(selectedBill.total || 0)}</span>
                            </div>
                            <div className="total-row flex justify-between py-2">
                              <span className="font-semibold">Paid:</span>
                              <span className="text-green-600">{formatCurrency(selectedBill.paidAmount || 0)}</span>
                            </div>
                            <div className="total-row flex justify-between py-2">
                              <span className="font-semibold">Pending:</span>
                              <span className={(selectedBill.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatCurrency(selectedBill.dueAmount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Bills List View */
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
                              onViewBill={handleViewBill}
                            />
                          </>
                        ) : (
                          <p className="text-center py-8 text-gray-500">Click on Bills tab to load bill history</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Tab */}
                {activeTab === 'payment' && (
                  <div>
                    {!showPaymentForm ? (
                      // Transaction History Component
                      <TransactionHistory
                        key={transactionRefreshKey}
                        customerId={dealerId}
                        customerType="dealer"
                        billsSummary={billsSummary}
                        onPayDueClick={() => setShowPaymentForm(true)}
                        themeColor="orange"
                      />
                    ) : (
                      // Payment Form View
                      <div>
                        <div className="flex items-center mb-6">
                          <button
                            onClick={() => {
                              setShowPaymentForm(false);
                              // TransactionHistory component will automatically refresh when it becomes visible
                            }}
                            className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                          >
                            <FiArrowLeft size={20} />
                          </button>
                          <h4 className="font-medium text-gray-900 text-lg flex items-center">
                            <FiDollarSign className="mr-2 text-orange-500" />
                            Process Payment
                          </h4>
                        </div>

                        {billsSummary && billsSummary.totalDue > 0 ? (
                          <div className="max-w-md mx-auto">
                            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
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
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>


      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
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

      {/* Billing Modal */}
      <BillingModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        customer={selectedBillingCustomer}
        onBillCreated={handleBillCreated}
      />
    </div>
  );
}