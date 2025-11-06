import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiTrash, FiPlus, FiSearch, FiChevronDown, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import SummaryApi from '../../common';
import { LuArrowUpDown } from "react-icons/lu";
import { LuArrowDownUp } from "react-icons/lu";
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Modal from '../../components/Modal';

const AllInventoryItems = ({ searchTerm = '', refreshTrigger = 0, branch = '', sortField = 'name', sortOrder = 'asc' }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const CACHE_STALENESS_TIME = 15 * 60 * 1000;
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  // Modal states
  const [isViewStockModalOpen, setIsViewStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [activeStockTab, setActiveStockTab] = useState('current');
  const [currentStockData, setCurrentStockData] = useState(null);
  const [currentStockLoading, setCurrentStockLoading] = useState(false);
  const [currentStockError, setCurrentStockError] = useState(null);
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState({});
  const [refreshingStock, setRefreshingStock] = useState(false);
const [stockEntriesToSave, setStockEntriesToSave] = useState([]);
const [currentSavingItem, setCurrentSavingItem] = useState(null);
const [saveLoading, setSaveLoading] = useState(false);
  const [confirmData, setConfirmData] = useState({
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  // State to track which row is expanded
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Fetch all inventory items
  useEffect(() => {
    fetchAllItems();
  }, [refreshTrigger]);
  
  const fetchAllItems = async (forceFresh = false) => {
    try {
      // Check for cached data
      const cachedItems = localStorage.getItem('inventoryItems');
      
      // Use cached data if available and not forcing fresh data
      if (cachedItems && !forceFresh) {
        setItems(JSON.parse(cachedItems));
        
        // Fetch fresh data in background
        fetchFreshItemsInBackground();
        setLoading(false);
        return;
      }
      
      // If no valid cache or force fresh, fetch new data
      setLoading(true);
      await fetchFreshItems();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const cachedItems = localStorage.getItem('inventoryItems');
      
      if (cachedItems) {
        setItems(JSON.parse(cachedItems));
        console.log("Using cached inventory items after fetch error");
      } else {
        setError('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

 // बैकग्राउंड में ताज़ा डेटा फेच करने का फंक्शन
const fetchFreshItemsInBackground = async () => {
  try {
    // दो प्रकार के इन्वेंटरी आइटम्स को पैरेलल में फेच करें (services को छोड़कर)
    const branchQuery = branch ? `?branch=${branch}` : '';
    const [serializedResponse, genericResponse] = await Promise.all([
      fetch(`${SummaryApi.getInventoryByType.url}/serialized-product${branchQuery}`, {
        method: SummaryApi.getInventoryByType.method,
        credentials: 'include'
      }),
      fetch(`${SummaryApi.getInventoryByType.url}/generic-product${branchQuery}`, {
        method: SummaryApi.getInventoryByType.method,
        credentials: 'include'
      })
    ]);

    // सभी रिस्पांस को पार्स करें
    const [serializedData, genericData] = await Promise.all([
      serializedResponse.json(),
      genericResponse.json()
    ]);

    // सभी आइटम्स को कम्बाइन करें और टाइप प्रॉपर्टी जोड़ें (services को छोड़कर)
    const combinedItems = [
      ...(serializedData.success ? serializedData.items.map(item => ({ ...item, itemType: 'serialized' })) : []),
      ...(genericData.success ? genericData.items.map(item => ({ ...item, itemType: 'generic' })) : [])
    ];
    
    // नया टाइमस्टैम्प सेट करें
    const newTimestamp = new Date().getTime();
    
    // डेटा को localStorage में सेव करें
    localStorage.setItem('inventoryItems', JSON.stringify(combinedItems));
    
    // अगर नया डेटा पुराने से अलग है, तो UI अपडेट करें
    if (JSON.stringify(combinedItems) !== JSON.stringify(items)) {
      setItems(combinedItems);
      setLastRefreshTime(newTimestamp);
    }
  } catch (err) {
    console.error('Error fetching inventory items in background:', err);
  }
};

// ताज़ा डेटा फेच करने का मुख्य फंक्शन
const fetchFreshItems = async () => {
  try {
    const branchQuery = branch ? `?branch=${branch}` : '';
    // दो प्रकार के इन्वेंटरी आइटम्स को पैरेलल में फेच करें (services को छोड़कर)
    const [serializedResponse, genericResponse] = await Promise.all([
      fetch(`${SummaryApi.getInventoryByType.url}/serialized-product${branchQuery}`, {
        method: SummaryApi.getInventoryByType.method,
        credentials: 'include'
      }),
      fetch(`${SummaryApi.getInventoryByType.url}/generic-product${branchQuery}`, {
        method: SummaryApi.getInventoryByType.method,
        credentials: 'include'
      })
    ]);

    // सभी रिस्पांस को पार्स करें
    const [serializedData, genericData] = await Promise.all([
      serializedResponse.json(),
      genericResponse.json()
    ]);

    // सभी आइटम्स को कम्बाइन करें और टाइप प्रॉपर्टी जोड़ें (services को छोड़कर)
    const combinedItems = [
      ...(serializedData.success ? serializedData.items.map(item => ({ ...item, itemType: 'serialized' })) : []),
      ...(genericData.success ? genericData.items.map(item => ({ ...item, itemType: 'generic' })) : [])
    ];
    
    // नया टाइमस्टैम्प सेट करें
    const newTimestamp = new Date().getTime();
    
    // डेटा को स्टेट और localStorage में सेव करें
    setItems(combinedItems);
    setLastRefreshTime(newTimestamp);
    localStorage.setItem('inventoryItems', JSON.stringify(combinedItems));
  } catch (err) {
    throw err; // पेरेंट try-catch ब्लॉक में एरर को हैंडल करने दें
  }
};


// रिफ्रेश बटन हैंडलर
const handleRefresh = () => {
  fetchAllItems(true); // फोर्स फ्रेश डेटा फेच
};

  const handlePrepareForSaving = (entries, item) => {
    setStockEntriesToSave(entries);
    setCurrentSavingItem(item);
    setShowSaveConfirmation(true);
  };
  
  const handleSaveStock = async () => {
    try {
      setSaveLoading(true);
      
      // Submit each stock entry
      for (const entry of stockEntriesToSave) {
        const response = await fetch(SummaryApi.addInventoryStock.url, {
          method: SummaryApi.addInventoryStock.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: currentSavingItem.id,
            ...entry
          })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          showNotification('error', data.message || 'Failed to add stock');
          setSaveLoading(false);
          return;
        }
      }
      
      showNotification('success', 'Stock added successfully');
      setShowSaveConfirmation(false);

      // localStorage से कैश को हटा दें
      localStorage.removeItem('inventoryItems');
      fetchAllItems(); // Refresh the data

      // Refresh View Details modal data if it's open
      if (selectedStockItem && isViewStockModalOpen) {
        loadCurrentStockData(selectedStockItem);
      }

      setIsAddStockModalOpen(false);
    } catch (err) {
      showNotification('error', 'Server error. Please try again later.');
      console.error('Error adding stock:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // State for stock history
  const [stockHistory, setStockHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Open view stock modal and fetch complete stock history
  const openViewStockModal = async (item) => {
    setSelectedStockItem(item);
    setIsViewStockModalOpen(true);
    setActiveStockTab('current');
    setCurrentStockData(null);
    setCurrentStockError(null);
    setLoadingHistory(true);

    loadCurrentStockData(item);

    try {
      const response = await fetch(`${SummaryApi.getStockHistory.url}/${item.id}`, {
        method: SummaryApi.getStockHistory.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setStockHistory(data.history || []);
      } else {
        showNotification('error', data.message || 'Failed to fetch stock history');
        setStockHistory([]);
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
      showNotification('error', 'Failed to fetch stock history');
      setStockHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadCurrentStockData = async (item) => {
    try {
      setCurrentStockLoading(true);
      setCurrentStockError(null);

      const itemIdentifier = item.id || item._id;

      if (!itemIdentifier) {
        setCurrentStockError('Invalid item identifier');
        setCurrentStockLoading(false);
        return;
      }

      const queryString = branch ? `?branch=${branch}` : '';
      const response = await fetch(`${SummaryApi.getInventoryCurrentStock.url}/${itemIdentifier}${queryString}`, {
        method: SummaryApi.getInventoryCurrentStock.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStockData(data.data);
      } else {
        setCurrentStockError(data.message || 'Failed to fetch current stock details');
        setCurrentStockData(null);
      }
    } catch (err) {
      console.error('Error fetching current stock status:', err);
      setCurrentStockError('Failed to fetch current stock details');
      setCurrentStockData(null);
    } finally {
      setCurrentStockLoading(false);
    }
  };

  // Refresh handler for stock modal
  const handleRefreshStockData = async () => {
    if (!selectedStockItem || refreshingStock) return;

    setRefreshingStock(true);
    try {
      // Refresh current stock data
      await loadCurrentStockData(selectedStockItem);

      // Refresh stock history
      setLoadingHistory(true);
      const response = await fetch(`${SummaryApi.getStockHistory.url}/${selectedStockItem.id}`, {
        method: SummaryApi.getStockHistory.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setStockHistory(data.history || []);
      }
      setLoadingHistory(false);

      showNotification('success', 'Stock data refreshed successfully', 3000);
    } catch (err) {
      console.error('Error refreshing stock data:', err);
      showNotification('error', 'Failed to refresh stock data', 3000);
    } finally {
      setRefreshingStock(false);
    }
  };

  const isSerializedItem = (item) => item?.itemType === 'serialized';
  const isGenericItem = (item) => item?.itemType === 'generic';
  const itemUnit = selectedStockItem?.unit || (isSerializedItem(selectedStockItem) ? 'pcs' : '');

  const formatDateTime = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (err) {
      return '-';
    }
  };

  const getAvailableTotal = () => {
    if (!selectedStockItem) {
      return null;
    }

    if (isSerializedItem(selectedStockItem)) {
      if (currentStockData) {
        return currentStockData.available?.serialized?.length ?? 0;
      }
      return selectedStockItem.stock ? selectedStockItem.stock.length : 0;
    }

    if (isGenericItem(selectedStockItem)) {
      if (currentStockData) {
        return (currentStockData.available?.generic || []).reduce(
          (sum, entry) => sum + (parseInt(entry.quantity, 10) || 0),
          0
        );
      }

      return selectedStockItem.stock
        ? selectedStockItem.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0)
        : 0;
    }

    return currentStockData ? 0 : null;
  };

  const getAssignedTotal = () => {
    if (!selectedStockItem) {
      return null;
    }

    if (currentStockData) {
      if (isSerializedItem(selectedStockItem)) {
        return (currentStockData.assigned || []).reduce(
          (sum, entry) => sum + (entry.serializedItems?.length || 0),
          0
        );
      }

      if (isGenericItem(selectedStockItem)) {
        return (currentStockData.assigned || []).reduce(
          (sum, entry) => sum + (entry.genericQuantity || 0),
          0
        );
      }

      return 0;
    }

    return isSerializedItem(selectedStockItem) || isGenericItem(selectedStockItem) ? 0 : null;
  };

  const groupedStockHistory = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0 || !selectedStockItem) return [];

    const groups = new Map();
    const serializedView = isSerializedItem(selectedStockItem);

    stockHistory.forEach((entry, index) => {
      const dateObj = entry.addedDate ? new Date(entry.addedDate) : null;
      const dateKey = dateObj ? dateObj.toISOString().split('T')[0] : `unknown-${index}`;

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { entries: [], dateObj });
      }
      groups.get(dateKey).entries.push(entry);
    });

    return Array.from(groups.entries())
      .map(([key, value], idx) => {
        const totalQuantity = value.entries.reduce(
          (sum, entry) => sum + (Number(entry.quantity) || 0),
          0
        );
        const serialNumbers = serializedView
          ? value.entries.map(entry => entry.serialNumber).filter(Boolean)
          : [];
        const remarks = Array.from(
          new Set(value.entries.map(entry => entry.remark).filter(Boolean))
        );

        return {
          key: `${key}-${idx}`,
          dateKey: key,
          dateObj: value.dateObj,
          totalQuantity,
          serialNumbers,
          remarks,
          entries: value.entries
        };
      })
      .sort((a, b) => {
        const aTime = a.dateObj ? a.dateObj.getTime() : 0;
        const bTime = b.dateObj ? b.dateObj.getTime() : 0;
        return bTime - aTime;
      });
  }, [stockHistory, selectedStockItem]);

  const toggleHistoryGroup = (key) => {
    setExpandedHistoryGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Open add stock modal
  const openAddStockModal = (item) => {
    setSelectedStockItem(item);
    setIsAddStockModalOpen(true);
  };

  // Show confirmation dialog helper function
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

  // Delete an inventory item (admin only)
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
            const updatedItems = items.filter(item => item.id !== id);
            setItems(updatedItems);
            
            // localStorage में भी अपडेट करें
            localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
            
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
  
  // Filter and sort items based on search term and sort order
  const filteredItems = React.useMemo(() => {
    // Filter by search term
    const filtered = items.filter(
      item => item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by itemType
    const serializedItems = filtered.filter(item => item.itemType === 'serialized');
    const genericItems = filtered.filter(item => item.itemType === 'generic');
    const serviceItems = filtered.filter(item => item.itemType === 'service');

  // Sort functions
  const sortByName = (a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return sortOrder === 'asc' ? -1 : 1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  };

  const sortByCustomerPrice = (a, b) => {
    const priceA = a.pricing?.customerPrice || 0;
    const priceB = b.pricing?.customerPrice || 0;
    if (priceA < priceB) return sortOrder === 'asc' ? -1 : 1;
    if (priceA > priceB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  };

  const sortByDealerPrice = (a, b) => {
    const priceA = a.pricing?.dealerPrice || 0;
    const priceB = b.pricing?.dealerPrice || 0;
    if (priceA < priceB) return sortOrder === 'asc' ? -1 : 1;
    if (priceA > priceB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  };

  const sortByDistributorPrice = (a, b) => {
    const priceA = a.pricing?.distributorPrice || 0;
    const priceB = b.pricing?.distributorPrice || 0;
    if (priceA < priceB) return sortOrder === 'asc' ? -1 : 1;
    if (priceA > priceB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  };

  const sortByStock = (a, b) => {
    const stockA = a.itemType === 'serialized' ? (a.stock ? a.stock.length : 0) : a.itemType === 'generic' ? (a.stock ? a.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0) : -1;
    const stockB = b.itemType === 'serialized' ? (b.stock ? b.stock.length : 0) : b.itemType === 'generic' ? (b.stock ? b.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0) : -1;
    if (stockA < stockB) return sortOrder === 'asc' ? -1 : 1;
    if (stockA > stockB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  };

  // Choose sort function based on sortField
  const sortFunction = sortField === 'customerPrice' ? sortByCustomerPrice : sortField === 'dealerPrice' ? sortByDealerPrice : sortField === 'distributorPrice' ? sortByDistributorPrice : sortField === 'stock' ? sortByStock : sortByName;

    // Sort each group
    serializedItems.sort(sortFunction);
    genericItems.sort(sortFunction);
    serviceItems.sort(sortFunction);

    // Concatenate groups in order: serialized, generic, service
    return [...serializedItems, ...genericItems, ...serviceItems];
  }, [items, searchTerm, sortOrder, sortField]);

  // Calculate stock display for different item types
  const getStockDisplay = (item) => {
    if (item.itemType === 'serialized') {
      return item.stock ? item.stock.length : 0;
    } else if (item.itemType === 'generic') {
      return item.stock ? item.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0;
    } else {
      return 'N/A'; // Services don't have stock
    }
  };

  // Get human-readable item type
  const getItemTypeDisplay = (type) => {
    switch (type) {
      case 'serialized':
        return 'Serialized Product';
      case 'generic':
        return 'Generic Product';
      case 'service':
        return 'Service';
      default:
        return type;
    }
  };

   // Function to toggle expanded row
   const toggleRowExpansion = (itemId) => {
    if (expandedRowId === itemId) {
      // If clicking the same row that's already expanded, collapse it
      setExpandedRowId(null);
    } else {
      // Otherwise expand the clicked row (and collapse any previously expanded row)
      setExpandedRowId(itemId);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Search */}
      {/* <div className="flex justify-end mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div> */}
      
      {/* Items List */}
      <div className="bg-white rounded-lg overflow-hidden">
        {/* <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">All Inventory Items</h2>
        </div> */}
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading inventory items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {items.length === 0 ? 'No inventory items found.' : 'No items match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NAME
              </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th> */}
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BRANCH</th> */}
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UNIT</th> */}
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ₹ CUSTOMER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ₹ DEALER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ₹ DISTRIBUTOR
                  </th>
                  {user.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PURCHASE PRICE</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STOCK
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <ClickableTableRow
                    key={item.id}
                    item={item}
                    index={index}
                    user={user}
                    handleDeleteItem={handleDeleteItem}
                    getItemTypeDisplay={getItemTypeDisplay}
                    getStockDisplay={getStockDisplay}
                    openViewStockModal={() => openViewStockModal(item)}
                    openAddStockModal={() => openAddStockModal(item)}
                  />
                ))}
              </tbody>
            </table>

            
          </div>
        )}
      </div>
      
      {/* View Stock Modal */}
      <Modal
        isOpen={isViewStockModalOpen}
        onClose={() => setIsViewStockModalOpen(false)}
        title={`Stock Details - ${selectedStockItem?.name || ''}`}
        size="xl"
      >
        {selectedStockItem && (
          <div>
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Stock Overview
                </h3>
                <p className="text-sm text-gray-500">
                Current Available Stock:{' '}
                {(() => {
                  const availableTotal = getAvailableTotal();
                  if (availableTotal === null || availableTotal === undefined) {
                    return '...';
                  }
                  const unitLabel = selectedStockItem.unit || (isSerializedItem(selectedStockItem) ? 'pcs' : '');
                  return `${availableTotal} ${unitLabel}`.trim();
                })()}
              </p>
              {(() => {
                const assignedTotal = getAssignedTotal();
                if (assignedTotal === null || assignedTotal === undefined) {
                  return null;
                }
                const unitLabel = selectedStockItem.unit || (isSerializedItem(selectedStockItem) ? 'pcs' : '');
                return (
                  <p className="text-sm text-gray-500">
                    Assigned to Technicians: {assignedTotal} {unitLabel}
                  </p>
                );
              })()}
                <p className="text-sm text-gray-400 mt-1">
                  Switch between current allocation and stock addition history.
                </p>
              </div>

              {/* Refresh and Add Stock Buttons */}
              <div className="flex items-center space-x-2">
                {/* Refresh Button */}
                <button
                  onClick={handleRefreshStockData}
                  disabled={refreshingStock}
                  className={`p-2 rounded-md transition-colors ${
                    refreshingStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                  }`}
                  title="Refresh stock data"
                >
                  <FiRefreshCw
                    className={`w-4 h-4 ${refreshingStock ? 'animate-spin' : ''}`}
                  />
                </button>

                {/* Add Stock Button */}
                {user.role === 'manager' && selectedStockItem.itemType !== 'service' && (
                  <button
                    onClick={() => {
                      openAddStockModal(selectedStockItem);
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium flex items-center gap-2"
                  >
                    <FiPlus size={18} />
                    Add Stock
                  </button>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveStockTab('current')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeStockTab === 'current'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Current Stock
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStockTab('history')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeStockTab === 'history'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Stock History
                </button>
              </nav>
            </div>

            {activeStockTab === 'current' ? (
              <div>
                {currentStockLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading current stock details...
                  </div>
                ) : currentStockError ? (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                    {currentStockError}
                  </div>
                ) : currentStockData ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900">Available in Branch</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        {(() => {
                          const total = getAvailableTotal();
                          const unitLabel = selectedStockItem.unit || (isSerializedItem(selectedStockItem) ? 'pcs' : '');
                          return `Total Available: ${total !== null ? total : 0} ${unitLabel}`.trim();
                        })()}
                      </p>
                      {isSerializedItem(selectedStockItem) ? (
                        currentStockData.available?.serialized?.length ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {currentStockData.available.serialized.map((entry, index) => (
                              <div
                                key={`${entry.serialNumber || 'serial'}-${index}`}
                                className="bg-white border border-gray-200 rounded-md p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">S/N: {entry.serialNumber}</span>
                                  <span className="text-xs text-gray-500">
                                    {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                                  </span>
                                </div>
                                {entry.remark && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Remark: {entry.remark}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No serialized stock currently available in branch.
                          </p>
                        )
                      ) : (
                        currentStockData.available?.generic?.length ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {currentStockData.available.generic.map((entry, index) => (
                              <div
                                key={`generic-${index}`}
                                className="bg-white border border-gray-200 rounded-md p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">
                                    {entry.quantity} {selectedStockItem.unit}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                                  </span>
                                </div>
                                {entry.remark && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Remark: {entry.remark}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No generic stock currently available in branch.
                          </p>
                        )
                      )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900">Assigned to Technicians</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        {(() => {
                          const assigned = getAssignedTotal();
                          const unitLabel = selectedStockItem.unit || (isSerializedItem(selectedStockItem) ? 'pcs' : '');
                          return `Total Assigned: ${assigned !== null ? assigned : 0} ${unitLabel}`.trim();
                        })()}
                      </p>
                      {currentStockData.assigned?.length ? (
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {currentStockData.assigned.map((entry, index) => (
                            <div
                              key={entry.technicianId || index}
                              className="bg-white border border-gray-200 rounded-md p-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {entry.technicianName}
                                  </p>
                                  {entry.username && (
                                    <p className="text-xs text-gray-500">@{entry.username}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm font-semibold text-gray-700">
                                  {isSerializedItem(selectedStockItem)
                                    ? `${entry.serializedItems?.length || 0} pcs`
                                    : `${entry.genericQuantity || 0} ${selectedStockItem.unit || ''}`
                                  }
                                </div>
                              </div>
                              {isSerializedItem(selectedStockItem) && entry.serializedItems?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {entry.serializedItems.map((serialItem, serialIndex) => (
                                    <div
                                      key={`${entry.technicianId || index}-${serialItem.serialNumber || serialIndex}`}
                                      className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded px-2 py-1"
                                    >
                                      <span>S/N: {serialItem.serialNumber}</span>
                                      <span>
                                        {serialItem.assignedAt
                                          ? formatDateTime(serialItem.assignedAt)
                                          : '-'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No stock is currently assigned to technicians.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">
                    No current stock data available.
                  </p>
                )}
              </div>
            ) : (
              <div>
                {loadingHistory ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading stock history...
                  </div>
                ) : groupedStockHistory.length > 0 ? (
                  <div className="space-y-3">
                      {groupedStockHistory.map(group => {
                        const isExpanded = !!expandedHistoryGroups[group.key];
                        const dateLabel = group.dateObj
                          ? group.dateObj.toLocaleDateString(undefined, { dateStyle: 'medium' })
                          : group.dateKey.replace('unknown-', 'Unknown Date ');
                        const primaryRemark = group.remarks[0] || 'No remark recorded.';

                      return (
                        <div
                          key={group.key}
                          className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleHistoryGroup(group.key)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-gray-800">{dateLabel}</span>
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                  +{group.totalQuantity} {itemUnit}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {primaryRemark}
                              </p>
                            </div>
                            {expandedHistoryGroups[group.key] ? (
                              <FiChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <FiChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3">
                              {isSerializedItem(selectedStockItem) ? (
                                <div>
                                  {group.serialNumbers.length > 0 ? (
                                    <>
                                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                        Serial Numbers
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {group.serialNumbers.map((sn, idx) => (
                                          <div
                                            key={`${group.key}-serial-${idx}`}
                                            className="bg-white border border-gray-200 rounded px-3 py-2 text-gray-700 font-mono text-sm"
                                          >
                                            {sn}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-500">No serial numbers recorded for this entry.</p>
                                  )}
                                </div>
                              ) : (
                                group.entries.map((entry, idx) => (
                                  <div
                                    key={`${group.key}-generic-${idx}`}
                                    className="bg-white border border-gray-200 rounded p-3"
                                  >
                                    <div className="flex justify-between text-sm text-gray-600">
                                      <span>
                                        Quantity:{' '}
                                        <span className="font-medium text-gray-800">
                                          {entry.quantity} {itemUnit}
                                        </span>
                                      </span>
                                      <span>
                                        {entry.addedDate
                                          ? new Date(entry.addedDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                          : '-'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                      Remark: {entry.remark || 'Not provided'}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No stock additions found for this product in your branch.
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsViewStockModalOpen(false);
                  setStockHistory([]);
                  setCurrentStockData(null);
                  setCurrentStockError(null);
                  setExpandedHistoryGroups({});
                  setActiveStockTab('current');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Stock Modal */}
      <Modal
  isOpen={isAddStockModalOpen}
  onClose={() => setIsAddStockModalOpen(false)}
  title={`Add Stock for ${selectedStockItem?.name || ''}`}
  size="lg"
  zIndex="z-[60]"
>
  {selectedStockItem && (
    <div>
      {/* Use different forms based on item type */}
      {selectedStockItem.itemType === 'serialized' ? (
        <SerializedStockForm 
          item={selectedStockItem} 
          onClose={() => setIsAddStockModalOpen(false)} 
          showNotification={showNotification}
          onSuccess={() => {
            setIsAddStockModalOpen(false);
            fetchAllItems(); // Refresh the data
          }}
          onPrepareForSaving={handlePrepareForSaving}
        />
      ) : selectedStockItem.itemType === 'generic' ? (
        <GenericStockForm 
          item={selectedStockItem} 
          onClose={() => setIsAddStockModalOpen(false)} 
          showNotification={showNotification}
          onSuccess={() => {
            setIsAddStockModalOpen(false);
            fetchAllItems(); // Refresh the data
          }}
          onPrepareForSaving={handlePrepareForSaving}
        />
      ) : (
        <div className="p-6 text-center text-gray-500">
          Stock cannot be added to service items.
        </div>
      )}
    </div>
  )}
</Modal>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        type={confirmData.type}
        onConfirm={confirmData.onConfirm}
      />

      {/* Confirm Save Modal */}
<Modal
  isOpen={showSaveConfirmation}
  onClose={() => setShowSaveConfirmation(false)}
  title="Confirm Save"
  size="md"
  zIndex="z-[70]"
>
  <div className="py-4">
    <div className="mb-6 flex items-center justify-center">
      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    
    <h3 className="text-xl font-medium text-center mb-4">Ready to Save</h3>
    
    <p className="text-center text-gray-600 mb-6">
      {currentSavingItem?.itemType === 'serialized' ? (
        <>You are about to save <span className="font-bold">{stockEntriesToSave.length}</span> serial number{stockEntriesToSave.length !== 1 ? 's' : ''} for item <span className="font-bold">{currentSavingItem?.name}</span>.</>
      ) : (
        <>You are about to save <span className="font-bold">
          {stockEntriesToSave.reduce((sum, entry) => sum + Number(entry.quantity), 0)}
        </span> {currentSavingItem?.unit || 'items'} for item <span className="font-bold">{currentSavingItem?.name}</span>.</>
      )}
    </p>
    
    <div className="mt-8 flex justify-center space-x-4">
      <button
        type="button"
        onClick={() => setShowSaveConfirmation(false)}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSaveStock}
        disabled={saveLoading}
        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none disabled:opacity-50"
      >
        {saveLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : (
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Save & Close
          </span>
        )}
      </button>
    </div>
  </div>
</Modal>
    </div>
  );
};

// Form for adding serialized product stock
export const SerializedStockForm = ({ item, onClose, showNotification, onSuccess, onPrepareForSaving }) => {
    const [error, setError] = useState(null);
    const [remark, setRemark] = useState('');
    const [stockEntries, setStockEntries] = useState([
      {
        serialNumber: '',
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    const [serialNumberStatus, setSerialNumberStatus] = useState({});
    const [stockEntriesToSave, setStockEntriesToSave] = useState([]);
    const [checkingSerial, setCheckingSerial] = useState(false);
    const [loading, setLoading] = useState(false);
    const barcodeInputRef = useRef(null);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
    useEffect(() => {
      // Focus on first input when form opens
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, []);
  
    // Reset stock entries form
    const resetStockEntriesForm = () => {
      setStockEntries([
        {
          serialNumber: '',
          quantity: 1,
          date: new Date().toISOString().split('T')[0]
        }
      ]);
      setRemark(''); // Reset single remark
      setError(null);
      setSerialNumberStatus({});
      setStockEntriesToSave([]);
    };
  
    // Handle barcode input
    const handleBarcodeInput = (e, index) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        const scannedValue = e.target.value.trim();
        
        if (!scannedValue) {
          return;
        }
        
        const updatedEntries = [...stockEntries];
        updatedEntries[index].serialNumber = scannedValue;
        setStockEntries(updatedEntries);
        
        checkSerialNumber(scannedValue, index);
        
        setTimeout(() => {
          if (index === stockEntries.length - 1) {
            handleAddStockEntry();
          } else {
            const nextInput = document.getElementById(`barcode-input-${index + 1}`);
            if (nextInput) {
              nextInput.focus();
            }
          }
        }, 100);
      }
    };
    
    // Add a new stock entry
    const handleAddStockEntry = () => {
      const newEntryIndex = stockEntries.length;
      
        setStockEntries([
          ...stockEntries,
          {
            serialNumber: '',
            quantity: 1,
            date: new Date().toISOString().split('T')[0]
          }
        ]);
      
      setTimeout(() => {
        const newInput = document.getElementById(`barcode-input-${newEntryIndex}`);
        if (newInput) {
          newInput.focus();
        }
      }, 100);
    };
    
    // Remove a stock entry
    const handleRemoveStockEntry = (index) => {
      const updatedEntries = stockEntries.filter((_, i) => i !== index);
      setStockEntries(updatedEntries);
    };
    
    // Handle input change for stock entries
    const handleStockEntryChange = (index, field, value) => {
      const updatedEntries = [...stockEntries];
      updatedEntries[index][field] = value;
      setStockEntries(updatedEntries);
      
      // Check serial number if changed
      if (field === 'serialNumber' && value.trim()) {
        if (window.serialCheckTimeout) {
          clearTimeout(window.serialCheckTimeout);
        }
        
        window.serialCheckTimeout = setTimeout(() => {
          checkSerialNumber(value, index);
        }, 500);
      }
    };
  
    // Check serial number validity
    const checkSerialNumber = async (serialNumber, index) => {
      if (!serialNumber.trim()) return;
      
      // Check if this serial number already exists in current entries
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
          // Build appropriate error message based on the type of conflict
          let errorMessage = '';

          if (data.assignedToTechnician) {
            // Serial number assigned to technician
            errorMessage = data.message || `Serial number is assigned to technician: ${data.technicianName}`;
          } else if (data.usedInBill) {
            // Serial number used in a bill
            if (data.customerName) {
              errorMessage = data.message || `Serial number used in bill for customer: ${data.customerName}`;
            } else if (data.entityName) {
              errorMessage = data.message || `Serial number used in bill for ${data.entityType}: ${data.entityName}`;
            } else {
              errorMessage = data.message || 'Serial number has been used in a bill';
            }
          } else if (data.item) {
            // Serial number exists in inventory stock
            errorMessage = `Serial number already exists for item: ${data.item.name}`;
          } else {
            // Fallback message
            errorMessage = data.message || 'Serial number is not available';
          }

          setSerialNumberStatus(prev => ({
            ...prev,
            [index]: {
              valid: false,
              message: errorMessage
            }
          }));
        } else {
          setSerialNumberStatus(prev => ({
            ...prev,
            [index]: {
              valid: true,
              message: data.message || 'Serial number is valid'
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
  
    const prepareForSaving = () => {
      // Check if remark is provided
      if (!remark.trim()) {
        setError('Please provide a remark');
        showNotification('error', 'Please provide a remark');
        return;
      }

      // For serial products, filter valid entries with serial numbers
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
          quantity: 1, // Always 1 for serial products
          remark: remark // Add the single remark to each entry
        }));
      
      if (validEntries.length === 0) {
        setError('No valid serial numbers to save');
        showNotification('error', 'No valid serial numbers to save');
        return;
      }
      
      // Call parent component function instead of showing modal
      onPrepareForSaving(validEntries, item);
    };

  
    // Discard and close button handler
    const handleDiscardAndClose = () => {
      if (stockEntries.some(entry => entry.serialNumber.trim() !== '') || remark.trim() !== '') {
        // Confirm before discarding
        if (window.confirm('All unsaved changes will be lost. Are you sure you want to discard them?')) {
          resetStockEntriesForm();
          onClose();
        }
      } else {
        resetStockEntriesForm();
        onClose();
      }
    };
  
    return (
      <div>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Serial Number Entry</h3>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Scan barcode or type manually</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Connect your barcode scanner and scan directly into the Serial Number field.
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
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
  autoFocus={index > 0 && index === stockEntries.length - 1}
  autoComplete="off"
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Another Serial Number
          </button>
        </div>

        {/* Single Remark Section */}
        <div className="mt-6 p-4 border rounded-md bg-blue-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remark for All Serial Numbers *
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full p-3 border rounded-md bg-white h-24 resize-none"
            placeholder="Enter a common remark for all serial numbers above"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            This remark will be applied to all serial numbers entered above.
          </p>
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
            
            <button
      type="button"
      onClick={prepareForSaving}
      disabled={loading || stockEntries.every(e => !e.serialNumber.trim() || serialNumberStatus[stockEntries.indexOf(e)]?.valid === false) || !remark.trim()}
      className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none disabled:opacity-50"
    >
      <span className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Prepare to Save
      </span>
    </button>
          </div>

        </div>
      </div>
    );
  };

  // Form for adding generic product stock
export const GenericStockForm = ({ item, onClose, showNotification, onSuccess, onPrepareForSaving  }) => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stockEntries, setStockEntries] = useState([
      {
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
        remark: ''
      }
    ]);
    const [stockEntriesToSave, setStockEntriesToSave] = useState([]);

    // Add a function to handle cancellation of the save dialog


    // Reset stock entries form
    const resetStockEntriesForm = () => {
      setStockEntries([
        {
          quantity: 1,
          date: new Date().toISOString().split('T')[0]
        }
      ]);
      setError(null);
      setStockEntriesToSave([]);
    };
  
    // Discard and close button handler
    const handleDiscardAndClose = () => {
      if (stockEntries.some(entry => entry.quantity > 1)) {
        // Confirm before discarding
        if (window.confirm('All unsaved changes will be lost. Are you sure you want to discard them?')) {
          resetStockEntriesForm();
          onClose();
        }
      } else {
        resetStockEntriesForm();
        onClose();
      }
    };
  
    // Add a new stock entry
    const handleAddStockEntry = () => {
      setStockEntries([
        ...stockEntries,
        {
          quantity: 1,
          date: new Date().toISOString().split('T')[0]
        }
      ]);
    };
    
    // Remove a stock entry
    const handleRemoveStockEntry = (index) => {
      const updatedEntries = stockEntries.filter((_, i) => i !== index);
      setStockEntries(updatedEntries);
    };
    
    // Handle input change for stock entries
    const handleStockEntryChange = (index, field, value) => {
      const updatedEntries = [...stockEntries];
      updatedEntries[index][field] = value;
      setStockEntries(updatedEntries);
    };
  
    const prepareForSaving = () => {
      // Validate quantities
      const validEntries = stockEntries
        .filter(entry => entry.quantity > 0)
        .map(entry => ({
          ...entry,
          serialNumber: '' // No serial number for generic products
        }));
      
      if (validEntries.length === 0) {
        setError('No valid quantities to save');
        showNotification('error', 'No valid quantities to save');
        return;
      }
      
      // Call parent component function instead of showing modal
      onPrepareForSaving(validEntries, item);
    };
  
  
    return (
      <div>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Quantity Entry</h3>
          </div>
          <p className="text-sm text-gray-500">
            Add quantities of items to inventory. Each entry will be added as a separate stock entry.
          </p>
        </div>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {stockEntries.map((entry, index) => (
            <div 
              key={index} 
              className="p-4 border rounded-md bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Entry #{index + 1}</h3>
                {stockEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStockEntry(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={entry.quantity}
                  onChange={(e) => handleStockEntryChange(index, 'quantity', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the number of {item.unit?.toLowerCase() || 'units'} to add
                </p>
              </div>
              
              <div>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remark *
                </label>
                <textarea
                  value={entry.remark}
                  onChange={(e) => handleStockEntryChange(index, 'remark', e.target.value)}
                  className="w-full p-2 border rounded-md bg-white h-20 resize-none"
                  placeholder="Enter remark for this stock entry"
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Another Entry
        </button>
      </div>
      
      <div className="mt-6 pt-4 border-t flex justify-between">
  <div>
    <span className="text-sm text-gray-500">
      Total: {stockEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)} {item.unit || 'units'}
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
    
    <button
      type="button"
      onClick={prepareForSaving}
      disabled={loading || stockEntries.every(e => !e.quantity || e.quantity <= 0 || !e.remark.trim())}
      className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 focus:outline-none disabled:opacity-50"
    >
      <span className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Prepare to Save
      </span>
    </button>
  </div>
  
</div>
    </div>
  );
};


// Add this component at the end of your file (before export default)
const ClickableTableRow = ({ item, index, user, handleDeleteItem, getItemTypeDisplay, getStockDisplay, openViewStockModal, openAddStockModal }) => {
  
  return (
    <React.Fragment>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => openViewStockModal(item)}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center  font-medium ${
            item.itemType === 'serialized' 
              ? 'bg-blue-200 text-blue-800' 
              : item.itemType === 'generic'
                ? 'bg-emerald-200 text-emerald-800'
                : 'bg-purple-100 text-purple-800'
          }`}>
            {index + 1}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.itemType === 'serialized' 
              ? 'bg-blue-100 text-blue-800' 
              : item.itemType === 'generic'
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
          }`}>
            {getItemTypeDisplay(item.itemType)}
          </span>
        </td> */}
        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.branch?.name || '-'}
        </td> */}
        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit || '-'}</td> */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
          ₹{item.pricing?.customerPrice || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
          ₹{item.pricing?.dealerPrice || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
          ₹{item.pricing?.distributorPrice || 0}
        </td>
        {user.role === 'admin' && (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.purchasePrice || '-'}</td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.itemType !== 'service' ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.itemType === 'serialized' 
              ? 'bg-blue-200 text-blue-800' 
              : item.itemType === 'generic'
                ? 'bg-emerald-200 text-emerald-800'
                : 'bg-purple-100 text-purple-800'
          }`}>
              {getStockDisplay(item)} {item.unit || ''}
            </span>
          ) : (
            '-'
          )}
        </td>
        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex space-x-2">
            {user.role === 'manager' && item.itemType !== 'service' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openAddStockModal();
                }}
                className="text-blue-600 hover:text-blue-900"
                title="Add Stock"
              >
                <FiPlus size={18} />
              </button>
            )}
            {user.role === 'admin' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="text-red-600 hover:text-red-900"
                title="Delete Item"
              >
                <FiTrash size={18} />
              </button>
            )}
          </div>
        </td> */}
      </tr>
    </React.Fragment>
  );
};

export default AllInventoryItems;
