import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash, FiSearch, FiCamera, FiSave } from 'react-icons/fi';
import Modal from '../../components/Modal';
import SummaryApi from '../../common';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { useNotification } from '../../context/NotificationContext';

// Sample product units for selection
const productUnits = [
  'Piece', 'Kg', 'Meter', 'Liter', 'Box', 'Carton', 'Dozen', 'Pair'
];

// Warranty options
const warrantyOptions = [
  '6 months', '1 year', '1.5 years', '2 years', '3 years', '5 years'
];

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification } = useNotification();
  
  // Modal states
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewStockModalOpen, setIsViewStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [serialNumberStatus, setSerialNumberStatus] = useState({});
  const [stockEntriesToSave, setStockEntriesToSave] = useState([]);
  const [checkingSerial, setCheckingSerial] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState({
  title: '',
  message: '',
  type: 'warning',
  confirmText: 'Confirm',
  onConfirm: () => {}
});
  
  // New item form state
  const [newItem, setNewItem] = useState({
    type: 'product',
    name: '',
    unit: 'Piece',
    warranty: '1 year',
    mrp: '',
    purchasePrice: '',
    salePrice: ''
  });
  
  // Stock entries state
  const [stockEntries, setStockEntries] = useState([
    {
      serialNumber: '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0]
    }
  ]);
  const barcodeInputRef = useRef(null);
  
  // Fetch inventory items
  useEffect(() => {
    fetchItems();
  }, []);
  
  // Focus on barcode input when stock modal opens
  useEffect(() => {
    // जब मॉडल बंद होता है
    if (!isAddStockModalOpen) {
      // थोड़ा डिले के साथ फॉर्म रीसेट करें
      // ताकि फॉर्म अनिमेशन पूरा हो जाए
      const timer = setTimeout(() => {
        resetStockEntriesForm();
        setSerialNumberStatus({});
        setStockEntriesToSave([]);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAddStockModalOpen]);
  
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getAllInventoryItems.url, {
        method: SummaryApi.getAllInventoryItems.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setItems(data.items);
      } else {
        setError(data.message || 'Failed to fetch inventory items');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching inventory items:', err);
    } finally {
      setLoading(false);
    }
  };

  const openViewStockModal = (item) => {
    setSelectedStockItem(item);
    setIsViewStockModalOpen(true);
  };
  
  // Handle input change for new item form
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };
  
  // Reset new item form
  const resetNewItemForm = () => {
    setNewItem({
      type: 'product',
      name: '',
      unit: 'Piece',
      warranty: '1 year',
      mrp: '',
      purchasePrice: '',
      salePrice: ''
    });
  };
  
  // Reset stock entries form
  const resetStockEntriesForm = () => {
    setStockEntries([
      {
        serialNumber: '',
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    setError(null);
    
    // अन्य स्टेट्स भी रीसेट करें
    setSerialNumberStatus({});
    setStockEntriesToSave([]);
  };

  // कन्फर्मेशन डायलॉग दिखाने के लिए हेल्पर फंक्शन
const showConfirmation = (title, message, type, confirmText, onConfirm) => {
  setConfirmData({
    title,
    message,
    type,
    confirmText,
    onConfirm
  });
  setConfirmDialogOpen(true);
};

// डिस्कार्ड एंड क्लोज़ बटन हैंडलर
const handleDiscardAndClose = () => {
  // यदि कोई अनसेव्ड चेंजेस हैं, तो कन्फर्मेशन दिखाएं
  if (stockEntries.some(entry => entry.serialNumber.trim() !== '')) {
    showConfirmation(
      'Discard Changes?',
      'All unsaved changes will be lost. Are you sure you want to discard them?',
      'warning',
      'Discard',
      () => {
        // कन्फर्मेशन के बाद, सब कुछ रीसेट करके ही मॉडल बंद करें
        resetStockEntriesForm(); 
        setSerialNumberStatus({});
        setStockEntriesToSave([]);
        setIsAddStockModalOpen(false);
      }
    );
  } else {
    // अगर कोई चेंजेस नहीं हैं, तो सीधे बंद करें और रीसेट भी करें
    resetStockEntriesForm();
    setSerialNumberStatus({});
    setStockEntriesToSave([]);
    setIsAddStockModalOpen(false);
  }
};
  
  // Validate new item form
  const validateNewItemForm = () => {
    setError(null);
    
    if (!newItem.name.trim()) {
      setError('Item name is required');
      return false;
    }
    
    if (newItem.type === 'product') {
      if (!newItem.mrp) {
        setError('MRP is required for products');
        return false;
      }
      
      if (!newItem.purchasePrice) {
        setError('Purchase price is required for products');
        return false;
      }
    }
    
    if (!newItem.salePrice) {
      setError('Sale price is required');
      return false;
    }
    
    return true;
  };
  
  // Add new inventory item
  const handleAddItem = async () => {
    if (!validateNewItemForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate a unique ID for the item
      const uniqueId = `ITEM-${Date.now()}`;
      
      const response = await fetch(SummaryApi.addInventoryItem.url, {
        method: SummaryApi.addInventoryItem.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newItem,
          id: uniqueId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show success notification
        showNotification('success', 'Item added successfully');
        
        // Close the modal and refresh the list
        setIsAddItemModalOpen(false);
        resetNewItemForm();
        fetchItems();
      } else {
        // Show error notification
        showNotification('error', data.message || 'Failed to add inventory item');
        setError(data.message || 'Failed to add inventory item');
      }
    } catch (err) {
      showNotification('error', 'Server error. Please try again later.');
      setError('Server error. Please try again later.');
      console.error('Error adding inventory item:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSerialNumber = async (serialNumber, index) => {
    if (!serialNumber.trim()) return;
    
    // चेक करें कि यह सीरियल नंबर पहले से ही मौजूदा एंट्रियों में तो नहीं है
    const isDuplicateInCurrentEntries = stockEntries.some(
      (entry, i) => i !== index && entry.serialNumber === serialNumber
    );
    
    if (isDuplicateInCurrentEntries) {
      setSerialNumberStatus(prev => ({
        ...prev,
        [index]: {
          valid: false,
          message: 'Duplicate serial number in current entries'
        }
      }));
      return;
    }
    
    try {
      setCheckingSerial(true);
      
      const response = await fetch(`${SummaryApi.checkSerialNumber.url}/${serialNumber}`, {
        method: SummaryApi.checkSerialNumber.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.exists) {
        setSerialNumberStatus(prev => ({
          ...prev,
          [index]: {
            valid: false,
            message: `Serial number already exists for item: ${data.item.name}`
          }
        }));
      } else {
        setSerialNumberStatus(prev => ({
          ...prev,
          [index]: {
            valid: true,
            message: 'Serial number is valid'
          }
        }));
      }
    } catch (err) {
      console.error('Error checking serial number:', err);
      setSerialNumberStatus(prev => ({
        ...prev,
        [index]: {
          valid: false,
          message: 'Error checking serial number'
        }
      }));
    } finally {
      setCheckingSerial(false);
    }
  };
  
  // Delete an inventory item
  const handleDeleteItem = async (id) => {
    showConfirmation(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      'warning',
      'Delete',
      async () => {
        try {
          const response = await fetch(`${SummaryApi.deleteInventoryItem.url}/${id}`, {
            method: SummaryApi.deleteInventoryItem.method,
            credentials: 'include'
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Remove the item from state
            setItems(items.filter(item => item.id !== id));
            showNotification('success', 'Item deleted successfully');
          } else {
            showNotification('error', data.message || 'Failed to delete item');
            setError(data.message || 'Failed to delete item');
          }
        } catch (err) {
          showNotification('error', 'Server error. Please try again later.');
          setError('Server error. Please try again later.');
          console.error('Error deleting item:', err);
        }
      }
    );
  };
  
  // Open add stock modal for an item
  const openAddStockModal = (item) => {
    // पहले सब कुछ रीसेट करें
    resetStockEntriesForm();
    setSerialNumberStatus({});
    setStockEntriesToSave([]);
    
    // फिर नया आइटम सेट करें और मॉडल खोलें
    setSelectedItem(item);
    setIsAddStockModalOpen(true);
    
    // मॉडल खुलने के बाद पहले इनपुट पर फोकस करें
    setTimeout(() => {
      const firstInput = document.getElementById('barcode-input-0');
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
  };
  
  // Handle barcode input
  const handleBarcodeInput = (e, index) => {
    // जब Enter key दबाई जाए
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // स्कैन की गई वैल्यू प्राप्त करें
      const scannedValue = e.target.value.trim();
      
      // अगर वैल्यू खाली है तो रिटर्न
      if (!scannedValue) {
        return;
      }
      
      // सीरियल नंबर फील्ड अपडेट करें
      const updatedEntries = [...stockEntries];
      updatedEntries[index].serialNumber = scannedValue;
      setStockEntries(updatedEntries);
      
      // सीरियल नंबर की वैलिडिटी चेक करें
      checkSerialNumber(scannedValue, index);
      
      // चेकिंग के बाद थोड़ा डिले करें और फिर अगले इनपुट पर फोकस करें
      setTimeout(() => {
        // अगर यह आखिरी एंट्री है और (वैलिड है या वैलिडिटी अभी चेक नहीं हुई है)
        if (index === stockEntries.length - 1) {
          // नई एंट्री जोड़ें
          handleAddStockEntry();
        } else {
          // अगले इनपुट पर फोकस करें
          const nextInput = document.getElementById(`barcode-input-${index + 1}`);
          if (nextInput) {
            nextInput.focus();
          }
        }
      }, 100); // थोड़ा डिले ताकि UI अपडेट हो सके
    }
  };
  
  // Add a new stock entry
  const handleAddStockEntry = () => {
    // मौजूदा एंट्रीज़ का इंडेक्स स्टोर करें (नई एंट्री का इंडेक्स होगा)
    const newEntryIndex = stockEntries.length;
    
    // नई स्टॉक एंट्री जोड़ें
    setStockEntries([
      ...stockEntries,
      {
        serialNumber: '',
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    
    // रेंडरिंग के बाद नए इनपुट पर फोकस करें
    setTimeout(() => {
      const newInput = document.getElementById(`barcode-input-${newEntryIndex}`);
      if (newInput) {
        newInput.focus();
      }
    }, 100); // छोटा डिले जरूरी है क्योंकि DOM अपडेट हो जाए
  };
  
  // Remove a stock entry
  const handleRemoveStockEntry = (index) => {
    const updatedEntries = stockEntries.filter((_, i) => i !== index);
    setStockEntries(updatedEntries);
  };
  
  // Handle input change for stock entries
  const handleStockEntryChange = (index, field, value) => {
    // अगर क्वांटिटी फील्ड है तो अपडेट न करें
    if (field === 'quantity') {
      return;
    }
    
    const updatedEntries = [...stockEntries];
    updatedEntries[index][field] = value;
    setStockEntries(updatedEntries);
    
    // यदि सीरियल नंबर फील्ड है तो चेक करें
    if (field === 'serialNumber' && value.trim()) {
      // डी-बाउंस के लिए टाइमआउट
      if (window.serialCheckTimeout) {
        clearTimeout(window.serialCheckTimeout);
      }
      
      window.serialCheckTimeout = setTimeout(() => {
        checkSerialNumber(value, index);
      }, 500);
    }
  };

  const prepareForSaving = () => {
    // फ़िल्टर केवल वैध एंट्रियां और सुनिश्चित करें कि क्वांटिटी हमेशा 1 है
    const validEntries = stockEntries
      .filter(entry => 
        entry.serialNumber.trim() !== '' && 
        !stockEntries.some((e, i) => 
          e.serialNumber === entry.serialNumber && 
          stockEntries.indexOf(entry) > i
        ) &&
        serialNumberStatus[stockEntries.indexOf(entry)]?.valid === true
      )
      .map(entry => ({
        ...entry,
        quantity: 1 // हमेशा क्वांटिटी 1 सेट करें
      }));
    
    // यदि कोई वैलिड एंट्री नहीं है तो एरर
    if (validEntries.length === 0) {
      setError('No valid serial numbers to save');
      showNotification('error', 'No valid serial numbers to save');
      return;
    }
    
    // सेट वैलिड एंट्रीज़ फॉर सेविंग
    setStockEntriesToSave(validEntries);
    
    // शो सक्सेस नोटिफिकेशन
    showNotification('success', `${validEntries.length} serial numbers ready to save`);
  };

  // सेव स्टॉक एंट्रीज़
const handleSaveStock = async () => {
  setError(null);
  
  try {
    setLoading(true);
    
    // सबमिट प्रत्येक स्टॉक एंट्री
    for (const entry of stockEntriesToSave) {
      const response = await fetch(SummaryApi.addInventoryStock.url, {
        method: SummaryApi.addInventoryStock.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          ...entry
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        showNotification('error', data.message || 'Failed to add stock');
        setError(data.message || 'Failed to add stock');
        setLoading(false);
        return;
      }
    }
    
    // Show success notification
    showNotification('success', 'Stock added successfully');
    
    // Close the modal and refresh the list
    setIsAddStockModalOpen(false);
    resetStockEntriesForm();
    fetchItems();
  } catch (err) {
    showNotification('error', 'Server error. Please try again later.');
    setError('Server error. Please try again later.');
    console.error('Error adding stock:', err);
  } finally {
    setLoading(false);
  }
};
  
  // Submit stock entries
  const handleAddStock = async () => {
    setError(null);
    
    // Validate entries
    const emptySerialNumbers = stockEntries.some(entry => !entry.serialNumber.trim());
    if (emptySerialNumbers) {
      setError('All serial numbers are required');
      showNotification('error', 'All serial numbers are required');
      return;
    }
    
    // Check for duplicate serial numbers in current batch
    const serialNumbers = stockEntries.map(entry => entry.serialNumber);
    const uniqueSerialNumbers = new Set(serialNumbers);
    if (serialNumbers.length !== uniqueSerialNumbers.size) {
      setError('Duplicate serial numbers found in your entries');
      showNotification('error', 'Duplicate serial numbers found in your entries');
      return;
    }
    
    try {
      setLoading(true);
      
      // Submit each stock entry
      for (const entry of stockEntries) {
        const response = await fetch(SummaryApi.addInventoryStock.url, {
          method: SummaryApi.addInventoryStock.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: selectedItem.id,
            ...entry
          })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          // Show error notification instead of just setting error state
          showNotification('error', data.message || 'Failed to add stock');
          setError(data.message || 'Failed to add stock');
          setLoading(false);
          return;
        }
      }
      
      // Show success notification
      showNotification('success', 'Stock added successfully');
      
      // Close the modal and refresh the list
      setIsAddStockModalOpen(false);
      resetStockEntriesForm();
      fetchItems();
    } catch (err) {
      showNotification('error', 'Server error. Please try again later.');
      setError('Server error. Please try again later.');
      console.error('Error adding stock:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter items based on search term
  const filteredItems = items.filter(
    item => item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Inventory Management</h1>
        <p className="text-gray-600">Manage your products and services</p>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-between mb-6">
        <button 
          onClick={() => setIsAddItemModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Add New Item
        </button>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search items..."
            className="pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Items List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">Inventory Items</h2>
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {items.length === 0 ? 'No items in inventory. Add your first item.' : 'No items match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type === 'product' ? item.unit : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type === 'product' ? item.warranty : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.type === 'product' ? `₹${item.mrp}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.type === 'product' ? `₹${item.purchasePrice}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.salePrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type === 'product' ? (
                      <button
                        onClick={() => openViewStockModal(item)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {item.stock ? item.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0} {item.unit}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {item.type === 'product' && (
                          <button 
                            onClick={() => openAddStockModal(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Add Stock"
                          >
                            <FiPlus size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Item"
                        >
                          <FiTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add New Inventory Item"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Type *
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="product"
                  checked={newItem.type === 'product'}
                  onChange={handleItemInputChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2">Product</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="service"
                  checked={newItem.type === 'service'}
                  onChange={handleItemInputChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2">Service</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={handleItemInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Item name"
              required
            />
          </div>
          
          {newItem.type === 'product' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={newItem.unit}
                  onChange={handleItemInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {productUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty *
                </label>
                <select
                  name="warranty"
                  value={newItem.warranty}
                  onChange={handleItemInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {warrantyOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (₹) *
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={newItem.mrp}
                  onChange={handleItemInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="MRP"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (₹) *
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={newItem.purchasePrice}
                  onChange={handleItemInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Purchase Price"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Price (₹) *
            </label>
            <input
              type="number"
              name="salePrice"
              value={newItem.salePrice}
              onChange={handleItemInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Sale Price"
              required
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsAddItemModalOpen(false)}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={loading}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <FiSave className="mr-2" />
                  Save Item
                </span>
              )}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Add Stock Modal */}
      {/* Add Stock Modal - Updated UI with readonly quantity */}
<Modal
  isOpen={isAddStockModalOpen}
  onClose={() => handleDiscardAndClose()}
  title={`Add Stock for ${selectedItem?.name || ''}`}
  size="lg"
>
  {selectedItem && (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4">
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-medium text-gray-900">Stock Entry</h3>
    <div className="flex items-center">
      <span className="text-sm text-gray-500 mr-2">Scan barcode or type manually</span>
      <FiCamera className="text-gray-400" />
    </div>
  </div>
  <p className="text-sm text-gray-500">
    Connect your barcode scanner and scan directly into the Serial Number field.
    Serial numbers are checked in real-time as you enter them.
  </p>
  <p className="text-sm text-gray-600 mt-1">
    <span className="font-semibold">Pro Tip:</span> Press <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">Enter</kbd> after each serial number to automatically move to the next field.
  </p>
  <p className="text-sm text-gray-600 mt-1 font-semibold">
    Note: Quantity is fixed at 1 for each serial number entry.
  </p>
</div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {stockEntries.map((entry, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-md ${
              serialNumberStatus[index]?.valid === false 
                ? 'border-red-300 bg-red-50' 
                : serialNumberStatus[index]?.valid === true 
                  ? 'border-green-300 bg-green-50' 
                  : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Item #{index + 1}</h3>
              {stockEntries.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStockEntry(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FiTrash size={18} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number *
                </label>
                <div className="relative">
                                <input
                  id={`barcode-input-${index}`}
                  type="text"
                  value={entry.serialNumber}
                  onChange={(e) => handleStockEntryChange(index, 'serialNumber', e.target.value)}
                  onKeyDown={(e) => handleBarcodeInput(e, index)}
                  className={`w-full p-2 border rounded-md ${
                    serialNumberStatus[index]?.valid === false 
                      ? 'border-red-300 bg-red-50 pr-10' 
                      : serialNumberStatus[index]?.valid === true 
                        ? 'border-green-300 bg-green-50 pr-10' 
                        : 'bg-white'
                  }`}
                  placeholder="Scan or type serial number"
                  ref={index === 0 ? barcodeInputRef : null}
                  // इस एंट्री का इंडेक्स पीछे वाली से अधिक है तो autoFocus सेट करें
                  autoFocus={index > 0 && index === stockEntries.length - 1}
                  required
                />
                  {checkingSerial && entry.serialNumber.trim() && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {serialNumberStatus[index]?.valid === true && !checkingSerial && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                  {serialNumberStatus[index]?.valid === false && !checkingSerial && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {serialNumberStatus[index]?.message && (
                  <p className={`mt-1 text-xs ${
                    serialNumberStatus[index]?.valid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {serialNumberStatus[index].message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (Fixed)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value="1"
                    readOnly
                    className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Each serial number equals one unit
                </p>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => handleStockEntryChange(index, 'date', e.target.value)}
                  className="w-full p-2 border rounded-md bg-white"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 mb-6">
        <button
          type="button"
          onClick={handleAddStockEntry}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FiPlus className="mr-1" />
          Add Another Serial Number
        </button>
      </div>
      
      <div className="mt-6 pt-4 border-t flex justify-between">
        <div>
          <span className="text-sm text-gray-500">
            {stockEntries.filter(e => serialNumberStatus[stockEntries.indexOf(e)]?.valid).length} valid serial numbers
          </span>
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={handleDiscardAndClose}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Discard & Close
          </button>
          
          {stockEntriesToSave.length > 0 ? (
            <button
              type="button"
              onClick={handleSaveStock}
              disabled={loading}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <FiSave className="mr-2" />
                  Save & Close
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={prepareForSaving}
              disabled={loading || stockEntries.every(e => !e.serialNumber.trim() || serialNumberStatus[stockEntries.indexOf(e)]?.valid === false)}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              <span className="flex items-center">
                <FiSave className="mr-2" />
                Prepare to Save
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )}
</Modal>

{/* Confirmation Dialog - Add this at the end of the component return */}
<ConfirmationDialog
  isOpen={confirmDialogOpen}
  onClose={() => setConfirmDialogOpen(false)}
  title={confirmData.title}
  message={confirmData.message}
  confirmText={confirmData.confirmText}
  type={confirmData.type}
  onConfirm={confirmData.onConfirm}
/>

      {/* View Stock Modal */}
<Modal
  isOpen={isViewStockModalOpen}
  onClose={() => setIsViewStockModalOpen(false)}
  title={`Stock Details - ${selectedStockItem?.name || ''}`}
  size="lg"
>
  {selectedStockItem && (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Serial Numbers</h3>
        <p className="text-sm text-gray-500">
          Total Stock: {selectedStockItem.stock ? selectedStockItem.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0} {selectedStockItem.unit}
        </p>
      </div>
      
      {selectedStockItem.stock && selectedStockItem.stock.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedStockItem.stock.map((stockItem, index) => (
                <tr key={stockItem.serialNumber}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stockItem.serialNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stockItem.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(stockItem.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No stock entries found for this product.
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setIsViewStockModalOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  )}
</Modal>
    </div>
  );
};

export default InventoryPage;