import React, { useState, useEffect } from 'react';
import { X, Search, Camera, FileText, ArrowRight, CheckCircle, ArrowLeft, AlertCircle, DollarSign, Smartphone, TrendingUp, FileCheck, CreditCard, Share } from 'lucide-react';
import SummaryApi from '../../common';
import { QRCodeCanvas } from 'qrcode.react';
import LoadingSpinner from '../../components/LoadingSpinner';

// List of Indian Banks
const INDIAN_BANKS = [
  'State Bank of India (SBI)', 'Punjab National Bank (PNB)', 'Bank of Baroda (BoB)',
  'Canara Bank', 'Union Bank of India', 'Indian Bank', 'Bank of India (BOI)',
  'Central Bank of India', 'UCO Bank', 'Bank of Maharashtra', 'Punjab & Sind Bank',
  'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank',
  'Yes Bank', 'IDFC FIRST Bank', 'Federal Bank', 'City Union Bank', 'DCB Bank',
  'RBL Bank', 'Bandhan Bank'
];

const GenerateBillModal = ({ isOpen, onClose, workOrder, onBillGenerated, onDone }) => {
  // Main state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianInventory, setTechnicianInventory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billId, setBillId] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'services'
  
  // Payment related states
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [availableServices, setAvailableServices] = useState([]);

  // Enhanced payment states for multiple payment methods
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [fetchingBankAccounts, setFetchingBankAccounts] = useState(false);
  const [showBankSelection, setShowBankSelection] = useState(false);
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
  
  // Navigation and view states - key change for single modal approach
  const [currentStep, setCurrentStep] = useState('select-items'); // Possible values: select-items, bill-summary, payment-options, payment-success
  const [showQRCode, setShowQRCode] = useState(false);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('GenerateBillModal workOrder:', workOrder);
      console.log('Customer Firm Name:', workOrder?.customerFirmName);
      resetAllStates();
      fetchTechnicianInventory();
    }
  }, [isOpen]);
  
  // Reset all states function
  const resetAllStates = () => {
    setSearchQuery('');
    setSelectedItems([]);
    setError(null);
    setCurrentStep('select-items');
    setActiveTab('products');
    setPaymentMethod('');
    setTransactionId('');
    setCashAmount(0);
    setPaidAmount(0);
    setDueAmount(0);
    setShowQRCode(false);
    setManualEntryMode(false);
    setManualCode('');
    setBillId(null);
    // Reset enhanced payment states
    setSelectedBankAccount(null);
    setBankAccounts([]);
    setShowBankSelection(false);
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
  };
  
  // Fetch technician's inventory
  const fetchTechnicianInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getTechnicianInventory.url, {
        method: SummaryApi.getTechnicianInventory.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Ensure all items have a proper salePrice value (backend now sends customerPrice as salePrice)
        const inventoryWithPrices = data.data.map(item => ({
          ...item,
          salePrice: item.salePrice || 0 // Backend already provides customerPrice as salePrice
        }));
        setTechnicianInventory(inventoryWithPrices);
      } else {
        setError('Failed to load inventory: ' + data.message);
      }
    } catch (err) {
      setError('Error loading inventory. Please try again later.');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to react to changes in technicianInventory
useEffect(() => {
  // Only fetch services when inventory is loaded and has items
  if (technicianInventory && technicianInventory.length > 0) {
    fetchAvailableServices();
  }
}, [technicianInventory]); 

  // Add this new function
const fetchAvailableServices = async () => {
  try {
    const servicesFromInventory = technicianInventory.filter(item => item.type === 'service');
    setAvailableServices(servicesFromInventory);
  } catch (err) {
    console.error('Error fetching services:', err);
  }
};
  
  // Get filtered items based on active tab and search query
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase().trim();
    const addedSerialNumbers = new Set();

    // Collect already selected serial numbers
    selectedItems.forEach(item => {
      if (item.type === 'serialized-product' && item.selectedSerialNumber) {
        addedSerialNumbers.add(item.selectedSerialNumber);
      }
    });

    if (activeTab === 'products') {
      // Filter products (serialized + generic)
      const products = technicianInventory.filter(item =>
        item.type === 'serialized-product' || item.type === 'generic-product'
      );

      if (!query) {
        // Show all products when no search query
        const allProducts = [];
        products.forEach(item => {
          if (item.type === 'serialized-product') {
            const activeSerials = item.serializedItems?.filter(
              serial => serial.status === 'active' && !addedSerialNumbers.has(serial.serialNumber)
            ) || [];
            activeSerials.forEach(serialItem => {
              allProducts.push({
                ...item,
                selectedSerialNumber: serialItem.serialNumber,
                quantity: 1,
                unit: item.unit || 'Piece'
              });
            });
          } else if (item.type === 'generic-product' && item.genericQuantity > 0) {
            allProducts.push({
              ...item,
              quantity: 1,
              unit: item.unit || 'Piece'
            });
          }
        });
        return allProducts;
      }

      // Search in products
      const results = [];
      products.forEach(item => {
        if (item.type === 'serialized-product') {
          const activeSerials = item.serializedItems?.filter(
            serial => serial.status === 'active' && !addedSerialNumbers.has(serial.serialNumber)
          ) || [];

          const serialMatches = activeSerials.filter(serial =>
            serial.serialNumber.toLowerCase().includes(query)
          );
          const nameMatch = item.itemName.toLowerCase().includes(query);

          if (nameMatch || serialMatches.length > 0) {
            (nameMatch ? activeSerials : serialMatches).forEach(serialItem => {
              results.push({
                ...item,
                selectedSerialNumber: serialItem.serialNumber,
                quantity: 1,
                unit: item.unit || 'Piece'
              });
            });
          }
        } else if (item.type === 'generic-product' && item.genericQuantity > 0) {
          if (item.itemName.toLowerCase().includes(query)) {
            results.push({
              ...item,
              quantity: 1,
              unit: item.unit || 'Piece'
            });
          }
        }
      });
      return results;
    } else {
      // Filter services
      if (!query) {
        return availableServices; // Show all services
      }
      return availableServices.filter(service =>
        (service.itemName || service.name).toLowerCase().includes(query)
      );
    }
  };

// Fetch bank accounts for UPI payment
const fetchBankAccounts = async () => {
  setFetchingBankAccounts(true);
  setError(null);

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
      setError(data.message || 'Failed to fetch bank accounts');
    }
  } catch (err) {
    console.error('Error fetching bank accounts:', err);
    setError('Failed to load bank accounts. Please try again later.');
  } finally {
    setFetchingBankAccounts(false);
  }
};

// Handle payment method selection
const handlePaymentMethodSelect = (method) => {
  setPaymentMethod(method);
  setShowQRCode(false);
  setShowBankSelection(false);
  setSelectedBankAccount(null);

  if (method === 'upi' || method === 'bank_transfer') {
    setShowBankSelection(true);
    fetchBankAccounts();
  } else if (method === 'no_payment') {
    // For no payment, set paid amount to 0 and go directly to confirmation
    setPaidAmount(0);
    setDueAmount(calculateTotal());
    setCurrentStep('payment-confirmation');
  }
};

// Handle UPI/Bank Transfer continue after bank selection
const handleUPIContinue = () => {
  if (selectedBankAccount) {
    setShowBankSelection(false);
    if (paymentMethod === 'upi') {
      setShowQRCode(true);
    }
    // For bank_transfer, just proceed to form (no QR code)
  }
};

// Show payment confirmation screen
const showPaymentConfirmation = () => {
  // Validate before showing confirmation
  if (paymentMethod === 'upi') {
    if (!paymentFormData.upiTransactionId.trim()) {
      setError('UPI Transaction ID is required');
      return;
    }
    if (paymentFormData.upiTransactionId.trim().length < 12) {
      setError('Please enter a valid UPI Transaction ID (minimum 12 characters)');
      return;
    }
    // Set paid amount for UPI (always full payment)
    setPaidAmount(calculateTotal());
  }

  if (paymentMethod === 'bank_transfer') {
    if (!paymentFormData.utrNumber.trim()) {
      setError('UTR Number is required');
      return;
    }
    if (!paymentFormData.receivedAmount || parseFloat(paymentFormData.receivedAmount) <= 0) {
      setError('Please enter the received amount');
      return;
    }
    // Set paid amount from received amount
    setPaidAmount(parseFloat(paymentFormData.receivedAmount));
  }

  if (paymentMethod === 'cheque') {
    if (!paymentFormData.chequeNumber.trim()) {
      setError('Cheque number is required');
      return;
    }
    if (!paymentFormData.chequeAmount || parseFloat(paymentFormData.chequeAmount) <= 0) {
      setError('Please enter the cheque amount');
      return;
    }
    // Set paid amount from cheque amount
    setPaidAmount(parseFloat(paymentFormData.chequeAmount));
  }

  if (paymentMethod === 'cash' && paidAmount < 0) {
    setError('Please enter a valid paid amount');
    return;
  }

  // Move to confirmation step
  setCurrentStep('payment-confirmation');
  setError(null);
};

  // Update work order status to pending-approval after payment
const updateWorkOrderStatus = async () => {
    try {
      const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
        method: SummaryApi.updateWorkOrderStatus.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: workOrder.customerId,
          orderId: workOrder.orderId,
          status: 'pending-approval',
          remark: 'Payment collected and project completed'
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to update work order status:', data.message);
      }
    } catch (err) {
      console.error('Error updating work order status:', err);
    }
  };
  
  // Add item to the selected items list
  // Add item to the selected items list
const addItemToSelection = (item) => {
  // Ensure the item has a price and quantity
  const itemWithPrice = {
    ...item,
    salePrice: item.salePrice || 0,  // Default to 0 if not present
    quantity: item.quantity || 1,  // Ensure quantity is always set
    // Add available quantity for generic products
    availableQuantity: item.type === 'generic-product' ? item.genericQuantity :
                       item.type === 'service' ? 1 : 1
  };
  
  // Handle services like generic items - allow multiple additions
  if (item.type === 'service') {
    // Check if this service already exists
    const existingIndex = selectedItems.findIndex(
      selectedItem => selectedItem.type === 'service' &&
      selectedItem.itemId === item.itemId
    );

    if (existingIndex >= 0) {
      // Increment the quantity
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Add new service
      setSelectedItems([...selectedItems, itemWithPrice]);
    }
  }
  // Check if this item is already in the list (for serialized items)
  else if (item.type === 'serialized-product') {
    const exists = selectedItems.some(
      selectedItem => selectedItem.type === 'serialized-product' && 
      selectedItem.selectedSerialNumber === item.selectedSerialNumber
    );
    
    if (exists) {
      setError('This serialized item is already added');
      return;
    }
    
    setSelectedItems([...selectedItems, itemWithPrice]);
  } else {
    // For generic items, check if it exists and update quantity
    const existingIndex = selectedItems.findIndex(
      selectedItem => selectedItem.type === 'generic-product' && 
      selectedItem.itemId === item.itemId
    );
    
    if (existingIndex >= 0) {
      // Check if we can increment the quantity
      const currentQuantity = selectedItems[existingIndex].quantity;
      const availableQuantity = selectedItems[existingIndex].availableQuantity;
      
      if (currentQuantity < availableQuantity) {
        const updatedItems = [...selectedItems];
        updatedItems[existingIndex].quantity += 1;
        setSelectedItems(updatedItems);
      } else {
        setError(`Maximum available quantity (${availableQuantity}) reached for this item`);
      }
    } else {
      setSelectedItems([...selectedItems, itemWithPrice]);
    }
  }
};
  
  // Update item quantity
const updateItemQuantity = (index, newQuantity) => {
  const item = selectedItems[index];

  // Allow 0 quantity internally to enable clearing input, but do not set error
  if (newQuantity < 0) {
    setError('Quantity cannot be less than 0');
    return;
  }

  // For generic products, check available quantity
  if (item.type === 'generic-product' && newQuantity > item.availableQuantity) {
    setError(`Maximum available quantity (${item.availableQuantity}) reached for this item`);
    return;
  }

  // For services, no maximum limit - technician can add as many as needed
  // Update the quantity
  const updatedItems = [...selectedItems];
  updatedItems[index].quantity = newQuantity;
  setSelectedItems(updatedItems);
};
  
  // Remove item from selection
  const removeItem = (index) => {
    const newSelectedItems = [...selectedItems];
    newSelectedItems.splice(index, 1);
    setSelectedItems(newSelectedItems);
  };
  
  // Handle scanner toggle
  const handleScanToggle = () => {
    setManualEntryMode(true);
  };
  
  // Handle scan result
  const handleScanResult = (result) => {
    if (result) {
      setManualEntryMode(false);
      setSearchQuery(result);
      setManualCode('');
    }
  };
  
  // Move to bill summary view
  const goToBillSummary = () => {
    if (selectedItems.length === 0) {
      setError('No items selected for billing');
      return;
    }
    
    setCurrentStep('bill-summary');
    setError(null);
  };
  
  // Calculate total bill amount
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.salePrice || 0) * item.quantity;
    }, 0);
  };
  
 // Group selected items for display (for serialized items with same name)
const getGroupedItems = () => {
  const grouped = {};
  
  selectedItems.forEach(item => {
    const key = item.itemId || item._id;
    
    if (!grouped[key]) {
      grouped[key] = {
        name: item.itemName || item.name,
        type: item.type,
        unit: item.unit || (item.type === 'service' ? 'Service' : 'Piece'),
        price: item.salePrice || 0,
        quantity: 0,
        serialNumbers: []
      };
    }
    
    grouped[key].quantity += item.quantity;
    
    if (item.type === 'serialized-product' && item.selectedSerialNumber) {
      grouped[key].serialNumbers.push(item.selectedSerialNumber);
    }
  });
  
  return Object.values(grouped);
};

  // Handle bill confirmation and proceed to payment
  const handleConfirmBill = async () => {
    try {
      setLoading(true);
      setError(null);

      // Just move to payment options step without creating bill
      setCurrentStep('payment-options');
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error creating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate UPI payment string for QR code
  const generateUpiString = () => {
    // This is a simplified example - in production, you'd use your company's UPI ID
    const upiId = 'itindia.asr@okicici';
    const amount = calculateTotal();
    const purpose = `Bill-${workOrder.orderId}`;

    return `upi://pay?pa=${upiId}&pn=Your%20Company&am=${amount}&tn=${purpose}`;
  };

  // Handle Share QR Code - Auto-copy message + Share QR image
  const handleShareQR = async () => {
    try {
      const canvas = document.getElementById('qr-code-canvas');
      if (!canvas) {
        setError('QR Code not found');
        return;
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Failed to generate QR image');
          return;
        }

        // Create file from blob
        const file = new File([blob], `payment-qr-${workOrder.orderId}.png`, { type: 'image/png' });

        // Create formatted message
        const message = `🔔 Payment Request\n\n` +
          `Amount: ₹${calculateTotal().toFixed(2)}\n` +
          `Account: ${selectedBankAccount.accountHolderName}\n` +
          `${selectedBankAccount.upiId ? `UPI ID: ${selectedBankAccount.upiId}\n` : ''}` +
          `Order ID: ${workOrder.orderId}\n\n` +
          `Please scan the QR code to complete the payment.`;

        // STEP 1: Copy message to clipboard FIRST
        let messageCopied = false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(message);
            messageCopied = true;
            console.log('✅ Message copied to clipboard');
          } catch (err) {
            console.error('Clipboard copy failed:', err);
          }
        }

        // STEP 2: Share QR image
        if (navigator.share) {
          try {
            // Check if we can share files
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              // Share QR image (with text attempt, but might be ignored)
              await navigator.share({
                title: 'Payment QR Code',
                text: message,
                files: [file]
              });

              // Show helpful message after share
              if (messageCopied) {
                setTimeout(() => {
                  alert('✅ QR shared!\n💡 Message copied to clipboard - just PASTE it!');
                }, 300);
              }
            } else {
              // Can't share files, fallback to download
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `payment-qr-${workOrder.orderId}.png`;
              link.href = url;
              link.click();

              await navigator.share({
                title: 'Payment QR Code',
                text: message
              });

              if (messageCopied) {
                alert('✅ Message shared!\n💡 QR downloaded - please attach it manually.');
              }
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Share failed:', err);
              // Fallback - download QR
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `payment-qr-${workOrder.orderId}.png`;
              link.href = url;
              link.click();

              if (messageCopied) {
                alert('✅ Message copied!\n✅ QR downloaded!\n💡 Paste message and attach QR manually.');
              }
            }
          }
        } else {
          // No Web Share API - download QR
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `payment-qr-${workOrder.orderId}.png`;
          link.href = url;
          link.click();

          if (messageCopied) {
            alert('✅ Message copied to clipboard!\n✅ QR downloaded!\n💡 Paste message and attach QR manually.');
          } else {
            alert('✅ QR downloaded!\n⚠️ Please copy the payment message manually.');
          }
        }
      });
    } catch (err) {
      console.error('Error sharing QR:', err);
      setError('Failed to share QR code');
    }
  };

  // Download QR Code (Fallback)
  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `payment-qr-${workOrder.orderId}.png`;
    link.href = url;
    link.click();
  };

  // Share Bank Details
  const shareBankDetails = async () => {
    try {
      if (!selectedBankAccount) {
        setError('Please select a bank account first');
        return;
      }

      // Format bank details - Simple and clean
      const bankDetails = `${selectedBankAccount.bankName}\n` +
        `Account Holder: ${selectedBankAccount.accountHolderName}\n` +
        `Account Number: ${selectedBankAccount.accountNumber}\n` +
        `IFSC Code: ${selectedBankAccount.ifscCode}` +
        `${selectedBankAccount.upiId ? `\nUPI ID: ${selectedBankAccount.upiId}` : ''}` +
        `${selectedBankAccount.branchName ? `\nBranch: ${selectedBankAccount.branchName}` : ''}`;

      // Check if Web Share API is supported
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Bank Account Details',
            text: bankDetails
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            // Fallback - copy to clipboard
            copyBankDetailsToClipboard(bankDetails);
          }
        }
      } else {
        // Fallback - copy to clipboard
        copyBankDetailsToClipboard(bankDetails);
      }
    } catch (err) {
      console.error('Error sharing bank details:', err);
      setError('Failed to share bank details');
    }
  };

  // Copy bank details to clipboard (Fallback)
  const copyBankDetailsToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Bank details copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          setError('Failed to copy bank details');
        });
    } else {
      // Old browser fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Bank details copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        setError('Failed to copy bank details');
      }
      document.body.removeChild(textArea);
    }
  };

  // Handle processing payment
  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Enhanced validation for each payment method
      if (paymentMethod === 'upi') {
        if (!paymentFormData.upiTransactionId.trim()) {
          setError('UPI Transaction ID is required');
          setLoading(false);
          return;
        }
        if (paymentFormData.upiTransactionId.trim().length < 12) {
          setError('Please enter a valid UPI Transaction ID (minimum 12 characters)');
          setLoading(false);
          return;
        }
        if (!selectedBankAccount) {
          setError('Please select a bank account for UPI payment');
          setLoading(false);
          return;
        }
      }

      if (paymentMethod === 'bank_transfer') {
        if (!paymentFormData.utrNumber.trim()) {
          setError('UTR Number is required for bank transfer');
          setLoading(false);
          return;
        }
        if (!paymentFormData.receivedAmount || parseFloat(paymentFormData.receivedAmount) <= 0) {
          setError('Please enter the received amount');
          setLoading(false);
          return;
        }
      }

      if (paymentMethod === 'cheque') {
        if (!paymentFormData.chequeNumber.trim()) {
          setError('Cheque number is required');
          setLoading(false);
          return;
        }
        if (!paymentFormData.chequeAmount || parseFloat(paymentFormData.chequeAmount) <= 0) {
          setError('Please enter the cheque amount');
          setLoading(false);
          return;
        }
      }

      if (paymentMethod === 'cash' && paidAmount < 0) {
        setError('Please enter a valid paid amount');
        setLoading(false);
        return;
      }

      // Build payment details based on method
      let paymentDetails = {};
      let receivedAmount = paidAmount;

      switch(paymentMethod) {
        case 'upi':
          paymentDetails.upiTransactionId = paymentFormData.upiTransactionId;
          if (selectedBankAccount) {
            paymentDetails.selectedBankAccount = selectedBankAccount._id;
          }
          receivedAmount = calculateTotal(); // UPI always full payment
          break;
        case 'bank_transfer':
          paymentDetails.utrNumber = paymentFormData.utrNumber;
          paymentDetails.bankName = paymentFormData.bankName;
          paymentDetails.transferDate = paymentFormData.transferDate;
          if (selectedBankAccount) {
            paymentDetails.selectedBankAccount = selectedBankAccount._id;
          }
          receivedAmount = parseFloat(paymentFormData.receivedAmount);
          break;
        case 'cheque':
          paymentDetails.chequeNumber = paymentFormData.chequeNumber;
          paymentDetails.chequeBank = paymentFormData.chequeBank;
          paymentDetails.chequeIfsc = paymentFormData.chequeIfsc;
          paymentDetails.chequeDate = paymentFormData.chequeDate;
          paymentDetails.chequeAmount = parseFloat(paymentFormData.chequeAmount);
          paymentDetails.drawerName = paymentFormData.drawerName || workOrder.customerName;
          receivedAmount = parseFloat(paymentFormData.chequeAmount);
          break;
        case 'cash':
          // Cash uses paidAmount directly
          break;
      }

      // Create bill items array for API
      const billItems = selectedItems.map(item => {
        return {
          itemId: item.itemId || item.id || item._id,
          name: item.itemName || item.name,
          quantity: item.quantity,
          serialNumber: item.selectedSerialNumber || null,
          price: item.salePrice || 0,
          amount: (item.salePrice || 0) * item.quantity,
          type: item.type
        };
      });

      // Create the bill in the database
      const createResponse = await fetch(SummaryApi.createWorkOrderBill.url, {
        method: SummaryApi.createWorkOrderBill.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: workOrder.customerId,
          orderId: workOrder.orderId,
          items: billItems
        })
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        setError(createData.message || 'Failed to create bill');
        setLoading(false);
        return;
      }

      // Set the bill ID for later use
      const newBillId = createData.data.billId || createData.data._id;
      setBillId(newBillId);

      // API call to confirm payment with enhanced payload
      const confirmResponse = await fetch(SummaryApi.confirmWorkOrderBill.url, {
        method: SummaryApi.confirmWorkOrderBill.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          billId: newBillId,
          paymentMethod,
          paidAmount: receivedAmount,
          receivedAmount: receivedAmount,
          transactionId: paymentMethod === 'upi' ? paymentFormData.upiTransactionId :
                        (paymentMethod === 'bank_transfer' ? paymentFormData.utrNumber : undefined),
          paymentDetails: Object.keys(paymentDetails).length > 0 ? paymentDetails : undefined
        })
      });

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        await updateSerializedItems();
        await updateWorkOrderStatus();
        // Move to payment success step
        setCurrentStep('payment-success');
      } else {
        setError(confirmData.message || 'Failed to process payment');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error processing payment:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to update serialized items
  const updateSerializedItems = async () => {
    try {
      // Filter only serialized items with serial numbers
      const serializedItems = selectedItems.filter(
        item => item.type === 'serialized-product' && item.selectedSerialNumber
      );
      
      if (serializedItems.length === 0) return;
      
      // Create array of just the serial number strings
      const serialNumbers = serializedItems.map(item => item.selectedSerialNumber);
    
    // Call API to update serialized items
    const response = await fetch(SummaryApi.updateUsedSerialNumbers.url, {
      method: SummaryApi.updateUsedSerialNumbers.method || 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        serialNumbers: serialNumbers,
        workOrderId: workOrder.orderId,
        customerId: workOrder.customerId
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Warning: Failed to update serial numbers:', data.message);
    }
  } catch (err) {
    console.error('Error updating serial numbers:', err);
  }
};

  
  // Handle closing the modal with different behaviors based on current step
  const handleModalClose = async () => {
    // Just close the modal without additional actions
    onClose();
  };

  // Handle done button click (for payment success)
  const handleDone = async () => {
    if (onDone) {
      onDone();
    } else {
      onClose();
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    setError(null);

    if (currentStep === 'bill-summary') {
      setCurrentStep('select-items');
    } else if (currentStep === 'payment-options') {
      // If payment method is selected, go back to method selection
      if (paymentMethod && !showBankSelection) {
        setPaymentMethod('');
        setShowQRCode(false);
      } else if (showBankSelection) {
        // If in bank selection for UPI, go back to method selection
        setShowBankSelection(false);
        setPaymentMethod('');
      } else {
        // No payment method selected, go back to bill summary
        setCurrentStep('bill-summary');
      }
    }
    else if (currentStep === 'payment-confirmation') {
        setCurrentStep('payment-options');
      }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString || Date.now()).toLocaleDateString(undefined, options);
  };

  if (!isOpen) return null;

  // This modal contains all steps in one container with conditional rendering based on currentStep
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header - Dynamic based on current step */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            {currentStep !== 'select-items' && (
              <button 
                onClick={handleBack}
                className="mr-2 p-1 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {currentStep === 'select-items' && 'Generate Bill'}
              {currentStep === 'bill-summary' && 'Bill Summary'}
              {currentStep === 'payment-options' && 'Select Payment Method'}
              {currentStep === 'payment-success' && 'Payment Complete'}
            </h2>
          </div>
          <button 
            onClick={handleModalClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Dynamic content based on current step */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {/* Step 1: Select Items */}
          {currentStep === 'select-items' && (
            <div className="p-4">
              {manualEntryMode ? (
                <div className="mb-4">
                  <div className="text-center py-4">
                    <Camera size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Enter the serial number manually:</p>
                    
                    <div className="mt-4">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md mb-3"
                        placeholder="Enter serial number"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setManualEntryMode(false)}
                          className="flex-1 px-4 py-2 border rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleScanResult(manualCode)}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md"
                          disabled={!manualCode.trim()}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-md font-medium mb-3">Select Items for Billing</h3>

                  {/* Basic info */}
                  <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
                    <p><span className="font-medium">Customer:</span> {workOrder.customerName}</p>
                    {workOrder.customerFirmName && workOrder.customerFirmName.trim() !== '' && (
                      <p><span className="font-medium">Company:</span> {workOrder.customerFirmName}</p>
                    )}
                    <p><span className="font-medium">Project:</span> {workOrder.projectType}</p>
                  </div>

                  {/* Tab Buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => {
                        setActiveTab('products');
                        setSearchQuery('');
                      }}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'products'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Products
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('services');
                        setSearchQuery('');
                      }}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'services'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Services
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder={activeTab === 'products' ? 'Search products by name or serial number...' : 'Search services by name...'}
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="mb-3 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  {/* Available Items Display */}
                  <div className="mb-3 border rounded-md overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {activeTab === 'products' ? (
                        <>
                          {getFilteredItems().length > 0 ? (
                            <>
                              {/* Serialized Products */}
                              {getFilteredItems().filter(item => item.type === 'serialized-product').length > 0 && (
                                <div>
                                  <div className="bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 sticky top-0">
                                    Serialized Products
                                  </div>
                                  {getFilteredItems().filter(item => item.type === 'serialized-product').map((item, index) => (
                                    <div
                                      key={`serial-${index}`}
                                      className="flex justify-between items-center p-3 hover:bg-gray-50 border-b last:border-b-0"
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{item.itemName}</p>
                                        <p className="text-xs text-gray-500">
                                          S/N: {item.selectedSerialNumber} | ₹{item.salePrice?.toFixed(2) || '0.00'}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => addItemToSelection(item)}
                                        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                                      >
                                        Add +
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Generic Products */}
                              {getFilteredItems().filter(item => item.type === 'generic-product').length > 0 && (
                                <div>
                                  <div className="bg-green-50 px-3 py-2 text-xs font-medium text-green-700 sticky top-0">
                                    Generic Products
                                  </div>
                                  {getFilteredItems().filter(item => item.type === 'generic-product').map((item, index) => (
                                    <div
                                      key={`generic-${index}`}
                                      className="flex justify-between items-center p-3 hover:bg-gray-50 border-b last:border-b-0"
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{item.itemName}</p>
                                        <p className="text-xs text-gray-500">
                                          Stock: {item.genericQuantity} {item.unit || 'pcs'} | ₹{item.salePrice?.toFixed(2) || '0.00'} each
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => addItemToSelection(item)}
                                        className="ml-2 px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                                      >
                                        Add +
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              {searchQuery ? 'No products found matching your search' : 'No products available'}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Services */}
                          {getFilteredItems().length > 0 ? (
                            <div>
                              {getFilteredItems().map((service, index) => (
                                <div
                                  key={`service-${index}`}
                                  className="flex justify-between items-center p-3 hover:bg-purple-50 border-b last:border-b-0"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{service.itemName || service.name}</p>
                                    <p className="text-lg font-semibold text-gray-700 mt-1">
                                      ₹{service.salePrice?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => addItemToSelection(service)}
                                    className="ml-2 px-3 py-1 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600"
                                  >
                                    Add +
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              {searchQuery ? 'No services found matching your search' : 'No services available'}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Selected Items List */}
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Selected Items:</p>
                    {selectedItems.length > 0 ? (
                      <div className="border rounded-md divide-y">
                        {selectedItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2">
                            <div className="flex-1">
                              <p className="font-medium">{item.itemName}</p>
                              {item.type === 'serialized-product' ? (
                                <p className="text-xs text-gray-500">
                                  S/N: {item.selectedSerialNumber} - ₹{item.salePrice?.toFixed(2) || '0.00'}
                                </p>
                              ) : item.type === 'service' ? (
                                <div>
                                  <p className="text-xs text-gray-500">
                                    ₹{item.salePrice?.toFixed(2) || '0.00'} per Service
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Quantity: {item.quantity} Service{item.quantity > 1 ? 's' : ''}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs text-gray-500">
                                    ₹{item.salePrice?.toFixed(2) || '0.00'} per {item.unit || 'Piece'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Available: {item.availableQuantity} {item.unit || 'Piece'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Quantity controls for generic products and services */}
{(item.type === 'generic-product' || item.type === 'service') && (
  <div className="flex items-center mr-2">
    <button 
      onClick={() => updateItemQuantity(index, item.quantity - 1)}
      className="w-8 h-8 flex items-center justify-center border rounded-l-md"
      disabled={item.quantity <= 0}
    >
      -
    </button>
    <input
      type="number"
      min={0}
      max={item.type === 'service' ? undefined : item.availableQuantity}
      value={item.quantity}
      onChange={(e) => {
        const val = e.target.value;
        const numVal = Number(val);
        if (val === '') {
          // Allow empty input temporarily
          updateItemQuantity(index, 0);
        } else if (!isNaN(numVal)) {
          updateItemQuantity(index, numVal);
        }
      }}
      className="w-12 h-8 text-center border-t border-b outline-none"
    />
    <button
      onClick={() => updateItemQuantity(index, item.quantity + 1)}
      className="w-8 h-8 flex items-center justify-center border rounded-r-md"
      disabled={item.type === 'generic-product' && item.quantity >= item.availableQuantity}
    >
      +
    </button>
  </div>
)}
                            
                            <button 
                              onClick={() => removeItem(index)}
                              className="text-red-500 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 rounded-md text-gray-500">
                        No items selected
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Step 2: Bill Summary */}
          {currentStep === 'bill-summary' && (
            <div className="p-4">
              <div className="border-b pb-2 mb-4">
                <p className="text-sm text-gray-600">Customer: {workOrder.customerName}</p>
                <p className="text-sm text-gray-600">Order ID: {workOrder.orderId}</p>
                <p className="text-sm text-gray-600">Date: {formatDate(new Date())}</p>
              </div>
              
              <table className="w-full mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getGroupedItems().map((item, index) => (
                    <tr key={index}>
                      <td className="py-3">
                        <p className="font-medium">{item.name}</p>
                        {item.serialNumbers.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            <p>Serial Numbers:</p>
                            <ul className="list-disc pl-4">
                              {item.serialNumbers.map((serial, idx) => (
                                <li key={idx}>{serial}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {item.quantity} {item.type === 'service' ? (item.quantity > 1 ? 'Services' : 'Service') : item.unit}
                      </td>
                      <td className="py-3 text-right">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300">
                  <tr>
                    <td colSpan="3" className="py-3 text-right font-bold">Total:</td>
                    <td className="py-3 text-right font-bold">₹{calculateTotal().toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Payment Options - Method Selection */}
          {currentStep === 'payment-options' && !paymentMethod && (
            <div className="p-4">
              <h4 className="text-lg font-semibold text-gray-900 text-center mb-4">
                Select Payment Method
              </h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Total Amount: ₹{calculateTotal().toFixed(2)}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Cash Payment */}
                <button
                  onClick={() => handlePaymentMethodSelect('cash')}
                  className="p-4 border-2 border-gray-200 hover:border-green-400 rounded-xl flex flex-col items-center space-y-2 transition-colors"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <div className="text-center">
                    <h5 className="font-semibold text-gray-900 text-sm">Cash</h5>
                    <p className="text-xs text-gray-600">Partial allowed</p>
                  </div>
                </button>

                {/* UPI Payment */}
                <button
                  onClick={() => handlePaymentMethodSelect('upi')}
                  className="p-4 border-2 border-gray-200 hover:border-blue-400 rounded-xl flex flex-col items-center space-y-2 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="text-blue-600" size={24} />
                  </div>
                  <div className="text-center">
                    <h5 className="font-semibold text-gray-900 text-sm">UPI</h5>
                    <p className="text-xs text-gray-600">QR Code scan</p>
                  </div>
                </button>

                {/* Bank Transfer */}
                <button
                  onClick={() => handlePaymentMethodSelect('bank_transfer')}
                  className="p-4 border-2 border-gray-200 hover:border-purple-400 rounded-xl flex flex-col items-center space-y-2 transition-colors"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="text-purple-600" size={24} />
                  </div>
                  <div className="text-center">
                    <h5 className="font-semibold text-gray-900 text-sm">Bank Transfer</h5>
                    <p className="text-xs text-gray-600">IMPS/NEFT</p>
                  </div>
                </button>

                {/* Cheque Payment */}
                <button
                  onClick={() => handlePaymentMethodSelect('cheque')}
                  className="p-4 border-2 border-gray-200 hover:border-orange-400 rounded-xl flex flex-col items-center space-y-2 transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileCheck className="text-orange-600" size={24} />
                  </div>
                  <div className="text-center">
                    <h5 className="font-semibold text-gray-900 text-sm">Cheque</h5>
                    <p className="text-xs text-gray-600">Bank cheque</p>
                  </div>
                </button>
              </div>

              {/* Create Bill Without Payment - Full Width Button */}
              <div className="mt-4">
                <button
                  onClick={() => handlePaymentMethodSelect('no_payment')}
                  className="w-full p-4 border-2 border-gray-300 hover:border-red-400 rounded-xl flex items-center justify-center space-x-3 transition-colors bg-gray-50 hover:bg-red-50"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FileText className="text-red-600" size={24} />
                  </div>
                  <div className="text-center">
                    <h5 className="font-semibold text-gray-900">Create Bill Without Payment</h5>
                    <p className="text-xs text-gray-600">Full amount will be marked as due</p>
                  </div>
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3.1: Bank Selection for UPI and Bank Transfer */}
          {currentStep === 'payment-options' && (paymentMethod === 'upi' || paymentMethod === 'bank_transfer') && showBankSelection && (
            <div className="p-4">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Bank Account
                </h4>
                <p className="text-gray-600 text-sm">
                  Choose which account to receive payment
                </p>
              </div>

              {fetchingBankAccounts ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2 text-gray-600">Loading bank accounts...</span>
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bank Accounts Found</h3>
                  <p className="text-gray-600 mb-4">
                    Please contact admin to add bank accounts for receiving online payments.
                  </p>
                  <button
                    onClick={() => {
                      setPaymentMethod('');
                      setShowBankSelection(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Go Back
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bank Account
                    </label>
                    <select
                      value={selectedBankAccount?._id || ''}
                      onChange={(e) => {
                        const account = bankAccounts.find(acc => acc._id === e.target.value);
                        setSelectedBankAccount(account);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                    >
                      <option value="">Choose a bank account...</option>
                      {bankAccounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.bankName} - {account.accountHolderName}
                          {account.isPrimary ? ' (Primary)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBankAccount && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedBankAccount.isPrimary ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <CreditCard className={`${
                            selectedBankAccount.isPrimary ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-semibold text-blue-900">{selectedBankAccount.bankName}</h5>
                            {selectedBankAccount.isPrimary && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-700">
                            {selectedBankAccount.accountHolderName}
                          </p>
                        </div>
                      </div>

                      {selectedBankAccount.upiId ? (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-xs text-green-700 font-medium">
                            ✓ UPI ID: {selectedBankAccount.upiId}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <p className="text-xs text-orange-700 font-medium">
                            ⚠ No UPI ID configured
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setPaymentMethod('');
                        setShowBankSelection(false);
                      }}
                      className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleUPIContinue}
                      disabled={!selectedBankAccount}
                      className="flex-1 py-3 bg-blue-500 disabled:bg-gray-300 text-white rounded-lg font-medium"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3.2: Payment Details for Selected Method */}
          {currentStep === 'payment-options' && paymentMethod && !showBankSelection && (
            <div className="p-4 space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {paymentMethod === 'cash' ? 'Cash Payment' :
                   paymentMethod === 'upi' ? 'UPI Payment' :
                   paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                   paymentMethod === 'cheque' ? 'Cheque Payment' : 'Payment'}
                </h4>
                <p className="text-gray-600">Total Amount: ₹{calculateTotal().toFixed(2)}</p>
              </div>

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPaidAmount(Math.max(0, val));
                          setDueAmount(calculateTotal() - Math.max(0, val));
                        }}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {dueAmount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Due Amount: ₹{dueAmount.toFixed(2)}</strong>
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This will be recorded as a partial payment
                      </p>
                    </div>
                  )}

                  {dueAmount === 0 && paidAmount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>✓ Fully Paid</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* UPI Payment with QR Code */}
              {paymentMethod === 'upi' && selectedBankAccount && showQRCode && (
                <div className="space-y-4">
                  {/* Selected Bank Account Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          {selectedBankAccount.bankName}
                        </p>
                        <p className="text-xs text-blue-700">
                          {selectedBankAccount.accountHolderName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  <div className="text-center">
                    <h5 className="font-medium mb-3">Scan QR Code to Pay</h5>
                    <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                      <QRCodeCanvas
                        id="qr-code-canvas"
                        value={selectedBankAccount.upiId ?
                          `upi://pay?pa=${selectedBankAccount.upiId}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${calculateTotal()}&tn=Work-Order-Bill-${workOrder.orderId}` :
                          `upi://pay?pa=${selectedBankAccount.accountNumber}&pn=${encodeURIComponent(selectedBankAccount.accountHolderName)}&am=${calculateTotal()}&tn=Work-Order-Bill-${workOrder.orderId}`
                        }
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900">
                        Pay ₹{calculateTotal().toFixed(2)} to {selectedBankAccount.accountHolderName}
                      </p>
                      {selectedBankAccount.upiId && (
                        <p className="text-xs text-green-600 font-medium">
                          UPI ID: {selectedBankAccount.upiId}
                        </p>
                      )}
                    </div>

                    {/* Share QR Code Button */}
                    <div className="mt-4">
                      <button
                        onClick={handleShareQR}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        type="button"
                      >
                        <Share size={18} />
                        Share QR Code
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI Transaction ID (Enter after payment) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentFormData.upiTransactionId}
                      onChange={(e) => setPaymentFormData(prev => ({...prev, upiTransactionId: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Enter UPI transaction ID (min 12 characters)"
                      minLength={12}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Transaction ID must be at least 12 characters long
                    </p>
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

              {/* Bank Transfer */}
              {paymentMethod === 'bank_transfer' && selectedBankAccount && !showBankSelection && (
                <div className="space-y-4">
                  {/* Selected Bank Account Info */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <CreditCard className="text-purple-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900">
                          {selectedBankAccount.bankName}
                        </p>
                        <p className="text-xs text-purple-700">
                          {selectedBankAccount.accountHolderName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Share Bank Details Button */}
                  <div>
                    <button
                      onClick={shareBankDetails}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                      type="button"
                    >
                      <Share size={18} />
                      Share Bank Details
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentFormData.utrNumber}
                      onChange={(e) => setPaymentFormData(prev => ({...prev, utrNumber: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="Enter UTR/Reference number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Bank Name
                    </label>
                    <select
                      value={paymentFormData.bankName}
                      onChange={(e) => setPaymentFormData(prev => ({...prev, bankName: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                      <option value="">Select sender bank</option>
                      {INDIAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Date
                    </label>
                    <input
                      type="date"
                      value={paymentFormData.transferDate}
                      onChange={(e) => setPaymentFormData(prev => ({...prev, transferDate: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Received Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={paymentFormData.receivedAmount}
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          setPaymentFormData(prev => ({...prev, receivedAmount: e.target.value}));
                          setPaidAmount(amount);
                          setDueAmount(calculateTotal() - amount);
                        }}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                        placeholder="Amount received in your account"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This may differ from transfer amount due to bank charges
                    </p>
                  </div>

                  {dueAmount > 0 && paidAmount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Due Amount: ₹{dueAmount.toFixed(2)}</strong>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowBankSelection(true);
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Change Bank Account
                  </button>
                </div>
              )}

              {/* Cheque Payment */}
              {paymentMethod === 'cheque' && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h5 className="font-medium text-orange-900 mb-1">Cheque Payment</h5>
                    <p className="text-sm text-orange-700">Enter cheque details for record keeping</p>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="Cheque number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cheque Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={paymentFormData.chequeAmount}
                          onChange={(e) => {
                            const amount = parseFloat(e.target.value) || 0;
                            setPaymentFormData(prev => ({...prev, chequeAmount: e.target.value}));
                            setPaidAmount(amount);
                            setDueAmount(calculateTotal() - amount);
                          }}
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <select
                      value={paymentFormData.chequeBank}
                      onChange={(e) => setPaymentFormData(prev => ({...prev, chequeBank: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="">Select bank name on cheque</option>
                      {INDIAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                        placeholder="IFSC Code"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder={`Name on cheque (default: ${workOrder.customerName})`}
                    />
                  </div>

                  {dueAmount > 0 && paidAmount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Due Amount: ₹{dueAmount.toFixed(2)}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

{/* Step 3.5: Payment Confirmation */}
{currentStep === 'payment-confirmation' && (
  <div className="p-4">
    <div className="mb-6 flex items-center justify-center">
      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
        paymentMethod === 'no_payment' ? 'bg-red-100' : 'bg-yellow-100'
      }`}>
        <AlertCircle size={32} className={paymentMethod === 'no_payment' ? 'text-red-500' : 'text-yellow-500'} />
      </div>
    </div>

    <h3 className="text-xl font-medium text-center mb-4">
      {paymentMethod === 'no_payment'
        ? 'Confirm Bill Creation Without Payment'
        : 'Please Verify Payment Details'}
    </h3>

    {paymentMethod === 'no_payment' && (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
        <p className="text-center text-red-800 font-medium">
          You are creating a bill without collecting any payment. The full amount of ₹{calculateTotal().toFixed(2)} will be marked as due.
        </p>
      </div>
    )}

    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="mb-3">
        <p className="text-sm text-gray-600">Payment Method:</p>
        <p className="font-medium capitalize">
          {paymentMethod === 'upi' ? 'UPI' :
           paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
           paymentMethod === 'cheque' ? 'Cheque' :
           paymentMethod === 'cash' ? 'Cash' :
           paymentMethod === 'no_payment' ? 'No Payment - Bill Created' : paymentMethod}
        </p>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600">Total Bill Amount:</p>
        <p className="font-medium">₹{calculateTotal().toFixed(2)}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600">Paid Amount:</p>
        <p className="font-medium">₹{paidAmount.toFixed(2)}</p>
      </div>

      {(calculateTotal() - paidAmount) > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">Due Amount:</p>
          <p className="font-medium text-red-600">₹{(calculateTotal() - paidAmount).toFixed(2)}</p>
        </div>
      )}

      {/* UPI Details */}
      {paymentMethod === 'upi' && (
        <>
          <div className="mb-3">
            <p className="text-sm text-gray-600">Bank Account:</p>
            <p className="font-medium">{selectedBankAccount?.bankName} - {selectedBankAccount?.accountHolderName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">UPI Transaction ID:</p>
            <p className="font-medium break-all">{paymentFormData.upiTransactionId}</p>
          </div>
        </>
      )}

      {/* Bank Transfer Details */}
      {paymentMethod === 'bank_transfer' && (
        <>
          <div className="mb-3">
            <p className="text-sm text-gray-600">UTR Number:</p>
            <p className="font-medium break-all">{paymentFormData.utrNumber}</p>
          </div>
          {paymentFormData.bankName && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Sender Bank:</p>
              <p className="font-medium">{paymentFormData.bankName}</p>
            </div>
          )}
          {paymentFormData.transferDate && (
            <div>
              <p className="text-sm text-gray-600">Transfer Date:</p>
              <p className="font-medium">{paymentFormData.transferDate}</p>
            </div>
          )}
        </>
      )}

      {/* Cheque Details */}
      {paymentMethod === 'cheque' && (
        <>
          <div className="mb-3">
            <p className="text-sm text-gray-600">Cheque Number:</p>
            <p className="font-medium">{paymentFormData.chequeNumber}</p>
          </div>
          {paymentFormData.chequeBank && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Bank Name:</p>
              <p className="font-medium">{paymentFormData.chequeBank}</p>
            </div>
          )}
          {paymentFormData.chequeDate && (
            <div>
              <p className="text-sm text-gray-600">Cheque Date:</p>
              <p className="font-medium">{paymentFormData.chequeDate}</p>
            </div>
          )}
        </>
      )}
    </div>

    <p className="text-center text-sm text-gray-600 mb-4">
      Please confirm that all payment details are correct before proceeding.
    </p>
  </div>
)}
          
          {/* Step 4: Payment Success*/}
          {currentStep === 'payment-success' && (
  <div className="p-4">
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="text-green-500" size={32} />
      </div>
      <h2 className="text-xl font-semibold mb-2">
        {paymentMethod === 'no_payment' ? 'Bill Created Successfully!' : 'Payment Successful!'}
      </h2>

      {/* Different messages based on payment method */}
      {paymentMethod === 'no_payment' ? (
        <p className="text-gray-600 mb-4">
          Bill has been created without payment collection. The full amount has been marked as due and will need to be collected later.
        </p>
      ) : paymentMethod === 'upi' || paymentMethod === 'bank_transfer' ? (
        <p className="text-gray-600 mb-4">
          Your payment has been initiated successfully. We are currently verifying it from our end. You will receive a confirmation shortly.
        </p>
      ) : paymentMethod === 'cheque' ? (
        <p className="text-gray-600 mb-4">
          Cheque details have been recorded successfully. Payment will be updated after cheque clearance.
        </p>
      ) : (
        <p className="text-gray-600 mb-4">
          Thanks! We've received your cash payment through our technician. It will be updated shortly.
        </p>
      )}

      <div className="bg-gray-50 p-4 rounded-lg text-left mb-4">
        <p className="text-sm mb-1"><span className="font-medium">Customer:</span> {workOrder.customerName}</p>
        <p className="text-sm mb-1"><span className="font-medium">Project:</span> {workOrder.projectType}</p>
        <p className="text-sm mb-1">
          <span className="font-medium">Payment Method:</span> {
            paymentMethod === 'upi' ? 'UPI' :
            paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
            paymentMethod === 'cheque' ? 'Cheque' :
            paymentMethod === 'cash' ? 'Cash' :
            paymentMethod === 'no_payment' ? 'No Payment - Bill Created' : paymentMethod
          }
        </p>
        <p className="text-sm mb-1"><span className="font-medium">Amount Paid:</span> ₹{paidAmount.toFixed(2)}</p>
        {(calculateTotal() - paidAmount) > 0 && (
          <p className="text-sm mb-1"><span className="font-medium">Due Amount:</span> ₹{(calculateTotal() - paidAmount).toFixed(2)}</p>
        )}
        {paymentMethod === 'upi' && paymentFormData.upiTransactionId && (
          <p className="text-sm"><span className="font-medium">Transaction ID:</span> {paymentFormData.upiTransactionId}</p>
        )}
        {paymentMethod === 'bank_transfer' && paymentFormData.utrNumber && (
          <p className="text-sm"><span className="font-medium">UTR Number:</span> {paymentFormData.utrNumber}</p>
        )}
        {paymentMethod === 'cheque' && paymentFormData.chequeNumber && (
          <p className="text-sm"><span className="font-medium">Cheque Number:</span> {paymentFormData.chequeNumber}</p>
        )}
      </div>
    </div>
  </div>
)}
          </div>

          {/* Footer with action buttons - Dynamic based on current step */}
<div className="border-t p-4">
  {currentStep === 'select-items' && (
    <button
      onClick={goToBillSummary}
      className="w-full py-2 bg-blue-500 text-white rounded-md flex items-center justify-center"
      disabled={selectedItems.length === 0}
    >
      <FileText className="mr-2" size={18} /> Generate Bill
    </button>
  )}
  
  {currentStep === 'bill-summary' && (
    <div className="flex space-x-3">
      <button 
        className="flex-1 py-2 bg-gray-200 rounded-md"
        onClick={handleBack}
      >
        Back
      </button>
      <button 
        className="flex-1 py-2 bg-blue-500 text-white rounded-md flex items-center justify-center"
        onClick={handleConfirmBill}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </div>
  )}
  
 {/* Updated payment-options buttons - Only show when payment details are filled */}
{currentStep === 'payment-options' &&
 paymentMethod &&
 ((paymentMethod === 'cash' && paidAmount >= 0) ||
  (paymentMethod === 'upi' && showQRCode && paymentFormData.upiTransactionId) ||
  (paymentMethod === 'bank_transfer' && selectedBankAccount && paymentFormData.utrNumber && paymentFormData.receivedAmount) ||
  (paymentMethod === 'cheque' && paymentFormData.chequeNumber && paymentFormData.chequeAmount)) && (
  <div className="flex space-x-3">
    <button
      className="flex-1 py-2 bg-gray-200 rounded-md"
      onClick={handleBack}
      disabled={loading}
    >
      Back
    </button>
    <button
      className="flex-1 py-2 bg-green-500 text-white rounded-md flex items-center justify-center disabled:bg-gray-400"
      onClick={showPaymentConfirmation}
      disabled={loading}
    >
      {loading ? 'Processing...' : (
        <>
          Review Payment <ArrowRight className="ml-1" size={18} />
        </>
      )}
    </button>
  </div>
)}

{/* Add new buttons for payment-confirmation step */}
{currentStep === 'payment-confirmation' && (
  <div className="flex space-x-3">
    <button 
      className="flex-1 py-2 bg-gray-200 rounded-md"
      onClick={handleBack}
      disabled={loading}
    >
      Back
    </button>
    <button 
      className="flex-1 py-2 bg-green-500 text-white rounded-md flex items-center justify-center"
      onClick={handleProcessPayment}
      disabled={loading}
    >
      {loading ? 'Processing...' : 'Confirm & Submit'}
    </button>
  </div>
)}
  
  {currentStep === 'payment-success' && (
    <button
      className="w-full py-2 bg-green-500 text-white rounded-md"
      onClick={handleDone}
    >
      Done
    </button>
  )}
        </div>
    </div>
  </div>
  );
};

export default GenerateBillModal;