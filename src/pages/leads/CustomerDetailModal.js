import React, { useState, useEffect, useRef } from 'react';
import { FiPhone, FiMail, FiMessageSquare, FiEdit2, FiClipboard, FiCalendar, FiDollarSign, FiFileText, FiUser, FiCheck, FiAlertCircle, FiCreditCard, FiSmartphone, FiTrendingUp, FiArrowLeft, FiPrinter, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import WorkOrderModal from '../customers/WorkOrderModal';
import ComplaintModal from '../customers/ComplaintModal';
import AddOldProjectModal from '../customers/AddOldProjectModal';
import ProjectDetailsModal from '../manager/ProjectDetailsModal';
import EditCustomerModal from './EditCustomerModal';
import CustomerBillingModal from './CustomerBillingModal';
import BillHistoryTable from '../../components/BillHistoryTable';
import TransactionHistory from '../../components/TransactionHistory';

const CustomerDetailModal = ({ isOpen, onClose, customerId, onCustomerUpdated }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showOldProjectModal, setShowOldProjectModal] = useState(false);
  const [initialProjectCategory, setInitialProjectCategory] = useState('New Installation');
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
const [selectedProject, setSelectedProject] = useState(null);
const [expandedRow, setExpandedRow] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
const [showBillingModal, setShowBillingModal] = useState(false);

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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [transactionRefreshKey, setTransactionRefreshKey] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Bill detail view states
  const [billView, setBillView] = useState('list'); // 'list' or 'detail'
  const [selectedBill, setSelectedBill] = useState(null);
  const printRef = useRef();

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
  
  const fetchCustomer = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${SummaryApi.getCustomer.url}/${customerId}`, {
        method: SummaryApi.getCustomer.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCustomer(data.data);
      } else {
        setError(data.message || 'Failed to fetch customer details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Project details देखने के लिए handler function
const handleViewProjectDetails = async (project) => {
  try {
    setLoading(true);
    
    // Fetch full project details
    const response = await fetch(`${SummaryApi.getWorkOrderDetails.url}/${customer._id}/${project.orderId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      setSelectedProject(data.data);
      setShowProjectDetailsModal(true);
    } else {
      console.error('API returned error:', data.message);
      // If API fails, use the basic project data we have
      setSelectedProject(project);
      setShowProjectDetailsModal(true);
    }
  } catch (err) {
    console.error('Error fetching project details:', err);
    // Fall back to basic project data
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  } finally {
    setLoading(false);
  }
};
  
  // Reset tab to details when modal opens
  useEffect(() => {
    if (isOpen && customerId) {
      setActiveTab('details'); // Always reset to details tab
      setBillView('list'); // Reset bill view
      setSelectedBill(null); // Clear selected bill
      fetchCustomer();
    } else {
      // Reset state when modal closes
      setCustomer(null);
      setError(null);
    }
  }, [isOpen, customerId]);

  // Fetch bills when tab changes or bills/payment tab is active
  useEffect(() => {
    if (isOpen && customerId && (activeTab === 'bills' || activeTab === 'payment')) {
      fetchCustomerBills();
    }
  }, [isOpen, customerId, activeTab]);

  const fetchCustomerBills = async () => {
    setLoadingBills(true);
    
    try {
      const response = await fetch(`${SummaryApi.getCustomerBills.url}/${customerId}`, {
        method: SummaryApi.getCustomerBills.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBills(data.data.bills);
        setBillsSummary(data.data.summary);
      } else {
        console.error('Failed to fetch customer bills:', data.message);
      }
    } catch (err) {
      console.error('Error fetching customer bills:', err);
    } finally {
      setLoadingBills(false);
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
    WinPrint.document.write(
      '<html>' +
        '<head>' +
          '<title>Invoice ' + selectedBill.billNumber + '</title>' +
          '<style>' +
            'body { font-family: Arial, sans-serif; margin: 20px; color: #333; }' +
            '.print-content { max-width: 800px; margin: 0 auto; }' +
            '.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }' +
            '.company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }' +
            '.invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }' +
            '.bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }' +
            '.customer-info, .invoice-details { width: 45%; }' +
            '.section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #374151; }' +
            'table { width: 100%; border-collapse: collapse; margin: 20px 0; }' +
            'th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }' +
            'th { background-color: #f3f4f6; font-weight: bold; }' +
            '.text-right { text-align: right; }' +
            '.totals { margin-top: 20px; }' +
            '.total-row { display: flex; justify-content: space-between; padding: 5px 0; }' +
            '.final-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }' +
            '@media print { body { margin: 0; } }' +
          '</style>' +
        '</head>' +
        '<body>' +
          printContent.innerHTML +
        '</body>' +
      '</html>'
    );
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
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
    doc.text(selectedBill.customerName || customer?.name || 'N/A', 20, 72);
    doc.text(customer?.address || 'Address not available', 20, 78);
    doc.text(selectedBill.customerPhone || customer?.phoneNumber || 'Phone not available', 20, 84);

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
        alert(data.message || 'Failed to fetch bank accounts');
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      alert('Failed to load bank accounts. Please try again later.');
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

  const handleProcessPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentAmount) > billsSummary.totalDue) {
      alert('Payment amount cannot exceed total due amount');
      return;
    }

    // Enhanced validation for each payment method
    if (paymentMethod === 'upi') {
      if (!paymentFormData.upiTransactionId.trim()) {
        alert('UPI Transaction ID is required');
        return;
      }
      if (!selectedBankAccount) {
        alert('Please select a bank account for UPI payment');
        return;
      }
    }

    if (paymentMethod === 'bank_transfer') {
      if (!paymentFormData.utrNumber.trim()) {
        alert('UTR Number is required for bank transfer');
        return;
      }
      if (!paymentFormData.receivedAmount || parseFloat(paymentFormData.receivedAmount) <= 0) {
        alert('Please enter the received amount');
        return;
      }
    }

    if (paymentMethod === 'cheque') {
      if (!paymentFormData.chequeNumber.trim()) {
        alert('Cheque number is required');
        return;
      }
      if (!paymentFormData.chequeAmount || parseFloat(paymentFormData.chequeAmount) <= 0) {
        alert('Please enter the cheque amount');
        return;
      }
    }

    setProcessingPayment(true);
    
    try {
      const response = await fetch(SummaryApi.processCustomerBulkPayment.url, {
        method: SummaryApi.processCustomerBulkPayment.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: customerId,
          paymentAmount: parseFloat(paymentAmount),
          receivedAmount: paymentMethod === 'bank_transfer' ? parseFloat(paymentFormData.receivedAmount) : parseFloat(paymentAmount),
          paymentMethod,
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
              drawerName: paymentFormData.drawerName || customer?.name
            })
          } : undefined,
          notes: paymentNotes.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Payment of ₹${paymentAmount} processed successfully`);
        
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
        fetchCustomerBills();
        setTransactionRefreshKey(prev => prev + 1);

        // Switch back to payment tab to show updated transaction history
        setShowPaymentForm(false);
      } else {
        alert(data.message || 'Failed to process payment');
      }
    } catch (err) {
      alert('Server error while processing payment');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Refresh handlers for each tab
  const handleRefreshDetails = async () => {
    if (refreshingDetails) return;

    setRefreshingDetails(true);
    try {
      await fetchCustomer();
    } catch (err) {
      console.error('Error refreshing customer details:', err);
    } finally {
      setRefreshingDetails(false);
    }
  };

  const handleRefreshBills = async () => {
    if (refreshingBills) return;

    setRefreshingBills(true);
    try {
      await fetchCustomerBills();
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
      await fetchCustomerBills();
      setTransactionRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error refreshing payments:', err);
    } finally {
      setRefreshingPayments(false);
    }
  };

  const handleWorkOrderSuccess = (data) => {
    // Refresh customer data after adding new project/work order
    fetchCustomer();
    setShowWorkOrderModal(false);

    // Notify parent component of the update
    if (onCustomerUpdated) {
      onCustomerUpdated(data.customer);
    }
  };

  const handleComplaintSuccess = (data) => {
    // Refresh customer data after adding new complaint
    fetchCustomer();
    setShowComplaintModal(false);

    // Notify parent component of the update
    if (onCustomerUpdated) {
      onCustomerUpdated(data.customer);
    }
  };

  const handleOldProjectSuccess = (data) => {
    // Refresh customer data after adding old project
    fetchCustomer();
    setShowOldProjectModal(false);

    // Notify parent component of the update
    if (onCustomerUpdated) {
      onCustomerUpdated(data.customer);
    }
  };
  
  const handleNewComplaint = () => {
    // Check if customer has any projects
    if (customer?.projects?.length > 0) {
      setShowComplaintModal(true);
    } else {
      alert('Customer must have at least one project before filing a complaint');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Customer Details"
      size="xl"
    >
      {loading ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      ) : customer ? (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-purple-50 px-6">
            <nav className="-mb-px flex justify-between items-center">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-purple-700 hover:text-purple-800 hover:border-purple-300'
                  }`}
                >
                  Customer Details
                </button>
                <button
                  onClick={() => setActiveTab('bills')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'bills'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-purple-700 hover:text-purple-800 hover:border-purple-300'
                  }`}
                >
                  Bill History
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payment'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-purple-700 hover:text-purple-800 hover:border-purple-300'
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
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    }`}
                    title="Refresh customer details"
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
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
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
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
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

          {/* Tab Content */}
          {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
          {/* Customer info panel */}
          <div className="lg:col-span-1 bg-white rounded-lg border overflow-hidden border-t-4 border-purple-500">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{customer.name}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    Added on {formatDate(customer.createdAt)}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  Customer
                </span>
              </div>
              
              {/* Contact info */}
              <div className="space-y-4 mt-6">
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Phone Number</div>
                    <div>{customer.phoneNumber}</div>
                  </div>
                </div>
                
                {customer.whatsappNumber && (
                  <div className="flex items-start">
                    <FiMessageSquare className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">WhatsApp</div>
                      <div>{customer.whatsappNumber}</div>
                    </div>
                  </div>
                )}
                
                {customer.firmName && (
                  <div className="flex items-start">
                    <FiMail className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Firm Name</div>
                      <div>{customer.firmName}</div>
                    </div>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">📍</div>
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div>{customer.address}</div>
                    </div>
                  </div>
                )}
                
                {/* {customer.age && (
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Age</div>
                      <div>{customer.age} years</div>
                    </div>
                  </div>
                )} */}
                
                {customer.branch && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">🏢</div>
                    <div>
                      <div className="text-sm text-gray-500">Branch</div>
                      <div>{customer.branch.name}</div>
                    </div>
                  </div>
                )}
                
                {customer.convertedFromLead && (
                  <div className="flex items-start">
                    <FiClipboard className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Origin</div>
                      <div>Converted from Lead</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 space-y-3">
              {user.role !== 'admin' && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Customer
                </button>
              )}
              </div>
            </div>
          </div>
          
          {/* Projects and Activity panel */}
          <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Work Orders & Complaints</h2>
                </div>

                {user.role !== 'admin' && (
                <div className="flex gap-2 mb-4">
                  <button
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    onClick={handleNewComplaint}
                  >
                    New Complaint
                  </button>

                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    onClick={() => setShowWorkOrderModal(true)}
                  >
                    New Project
                  </button>

                  <button
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                    onClick={() => setShowOldProjectModal(true)}
                  >
                    Add Project
                  </button>

                  {user.role === 'manager' && (
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      onClick={() => setShowBillingModal(true)}
                    >
                      New Bill
                    </button>
                  )}
                </div>
                )}
              
              
              {/* Work Order/Complaint Status */}
              {(() => {
                // Combine work orders and completed projects for display
                const allItems = [];
                
                // Add work orders
                if (customer.workOrders && customer.workOrders.length > 0) {
                  customer.workOrders.forEach(order => {
                    allItems.push({
                      ...order,
                      type: 'workOrder',
                      displayType: order.projectCategory === 'Repair' ? 'Complaint' : 'New Installation'
                    });
                  });
                }
                
                // Add completed projects (especially for existing customers)
                if (customer.projects && customer.projects.length > 0) {
                  customer.projects.forEach(project => {
                    // Always show completed projects in history
                    if (project.status === 'completed') {
                      allItems.push({
                        ...project,
                        type: 'completedProject',
                        displayType: 'Completed Project',
                        status: 'completed',
                        orderId: null, // No order ID for completed projects
                        isHistorical: true // Mark as historical entry
                      });
                    }
                  });
                }
                
                // Sort items: completed projects first (historical), then workOrders by date
                allItems.sort((a, b) => {
                  // Completed projects (historical) should appear first
                  if (a.type === 'completedProject' && b.type === 'workOrder') return -1;
                  if (a.type === 'workOrder' && b.type === 'completedProject') return 1;
                  
                  // Within same type, sort by date
                  return new Date(a.createdAt) - new Date(b.createdAt);
                });
                
                return allItems.length > 0 ? (
  <div className="mb-6 max-h-[400px] overflow-y-auto">
    <div className="overflow-visible">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sr.No
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project Type
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {allItems.map((item, index) => (
              <React.Fragment key={index}>
            <tr
            onClick={() => {
              // If it's a workOrder, open ProjectDetailsModal directly
              if (item.type === 'workOrder') {
                handleViewProjectDetails(item);
              } else {
                // For completed projects, toggle expanded row
                setExpandedRow(expandedRow === (item._id || item.projectId) ? null : (item._id || item.projectId));
              }
            }}
            className={`hover:bg-gray-100 cursor-pointer ${
              expandedRow === (item._id || item.projectId) ? 'bg-gray-50' : ''
            } ${item.isHistorical ? 'bg-purple-25 border-l-4 border-purple-400' : ''}`}
            >
              <td className="px-2 py-3 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                <div style={{ width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.projectType}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.type === 'completedProject'
                              ? 'bg-purple-100 text-purple-800'
                              : item.projectCategory === 'Repair' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {item.displayType}
                          </span>
                        </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              <div style={{ width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {formatDate(item.createdAt)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </td>
            </tr>
            {/* Expanded row with buttons */}
            {expandedRow === (item._id || item.projectId) && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex space-x-3">
                      {item.type === 'workOrder' ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProjectDetails(item);
                          }}
                          className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                        >
                          View Details
                        </button>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p><strong>Installed by:</strong> {item.installedBy}</p>
                          <p><strong>Completion Date:</strong> {item.completionDate ? formatDate(item.completionDate) : 'N/A'}</p>
                          {item.initialRemark && <p><strong>Remarks:</strong> {item.initialRemark}</p>}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </div>
                ) : (
                  <div className="mb-6 p-6 text-center border rounded-md bg-gray-50">
                    <p className="text-gray-500">No Project and Complaints found for this customer.</p>
                  </div>
                );
              })()}
              
              {/* Lead History */}
              {customer.convertedFromLead && customer.leadId && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Lead History</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {customer.leadId.remarks && customer.leadId.remarks.length > 0 ? (
                      <div className="space-y-3">
                        {customer.leadId.remarks.map((remark, index) => (
                          <div 
                            key={index} 
                            className="p-3 border-l-4 rounded-md bg-white"
                            style={{
                              borderColor: 
                                remark.status === 'positive' ? '#10B981' : 
                                remark.status === 'negative' ? '#EF4444' : 
                                '#9CA3AF'
                            }}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-sm capitalize">{remark.status}</span>
                              <span className="text-sm text-gray-500">{formatDate(remark.createdAt)}</span>
                            </div>
                            <p className="text-gray-700">{remark.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No lead history available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className="p-6">
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
                        <p className="font-semibold text-lg">{selectedBill.customerName || customer?.name}</p>
                        <p className="text-gray-600">{customer?.address || 'Address not available'}</p>
                        <p className="text-gray-600">{selectedBill.customerPhone || customer?.phoneNumber}</p>
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
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <h4 className="font-medium text-purple-900 mb-2">Total Bills</h4>
                          <p className="text-2xl font-bold text-purple-600">{billsSummary.totalBills}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">Total Amount</h4>
                          <p className="text-2xl font-bold text-blue-600">₹{billsSummary.totalAmount}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-blue-200">
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
            <div className="p-6">
              {!showPaymentForm ? (
                // Transaction History Component
                <TransactionHistory
                  key={transactionRefreshKey}
                  customerId={customerId}
                  customerType="customer"
                  billsSummary={billsSummary}
                  onPayDueClick={() => setShowPaymentForm(true)}
                  themeColor="purple"
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
                      <FiDollarSign className="mr-2 text-purple-500" />
                      Process Payment
                    </h4>
                  </div>

                  {billsSummary && billsSummary.totalDue > 0 ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-4 flex items-center">
                      <FiDollarSign className="mr-2 text-purple-500" />
                      Process Payment
                    </h4>
                    
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
                          className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => handlePaymentMethodChange(e.target.value)}
                          className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3"
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
                                    className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <FiCreditCard className="text-blue-500" />
                                        <span className="font-medium text-blue-900">
                                          {selectedBankAccount.bankName}
                                        </span>
                                        {selectedBankAccount.isPrimary && (
                                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-blue-700">
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
                                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium"
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
                                <h5 className="font-medium mb-3 text-blue-900">Scan QR Code to Pay</h5>
                                <div className="inline-block p-4 bg-white rounded-lg border-2 border-blue-200">
                                  <QRCodeCanvas
                                    value={selectedBankAccount.upiId ?
                                      `upi://pay?pa=${selectedBankAccount.upiId}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${paymentAmount}&tn=Customer-Payment-${encodeURIComponent(customer?.name || '')}` :
                                      `upi://pay?pa=${selectedBankAccount.accountNumber}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${paymentAmount}&tn=Customer-Payment-${encodeURIComponent(customer?.name || '')}`
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
                                  className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                              className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                              className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                              className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                              className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                                className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                                className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                              className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                                className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                                className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                              placeholder={`Name on cheque (default: ${customer?.name || 'Customer name'})`}
                              className="w-full rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition p-3"
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
                          className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3 resize-none"
                        />
                      </div>
                      
                      <button
                        onClick={handleProcessPayment}
                        disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
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
      ) : (
        <div className="p-6 text-center text-gray-500">
          Customer not found
        </div>
      )}
      
      {/* Work Order Modal */}
      <WorkOrderModal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        customerId={customerId}
        initialProjectCategory="New Installation"
        onSuccess={handleWorkOrderSuccess}
      />
      
      {/* Complaint Modal - new component */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        customerId={customerId}
        onSuccess={handleComplaintSuccess}
      />

      {/* Old Project Modal */}
      <AddOldProjectModal
        isOpen={showOldProjectModal}
        onClose={() => setShowOldProjectModal(false)}
        customerId={customerId}
        onSuccess={handleOldProjectSuccess}
      />

      {showProjectDetailsModal && selectedProject && (
        <ProjectDetailsModal 
          isOpen={showProjectDetailsModal}
          onClose={() => {
            setShowProjectDetailsModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectApproved={(updatedProject) => {
            // If project is approved, refresh customer data
            fetchCustomer();
            setShowProjectDetailsModal(false);
          }}
        />
      )}

      {showEditModal && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          customerId={customerId}
          onSuccess={(updatedCustomer) => {
            fetchCustomer();
            setShowEditModal(false);
            onCustomerUpdated && onCustomerUpdated(updatedCustomer);
          }}
        />
      )}

    </Modal>


    {/* Customer Billing Modal - Outside main modal for proper z-index */}
    <CustomerBillingModal
      isOpen={showBillingModal}
      onClose={() => setShowBillingModal(false)}
      customer={customer}
      onBillCreated={(bill) => {
        setShowBillingModal(false);
        // Could refresh customer data here if needed
        fetchCustomer();
      }}
    />
    </>
  );
};

export default CustomerDetailModal;
