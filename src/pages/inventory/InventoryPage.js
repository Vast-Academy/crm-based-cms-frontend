import React, { useState, useEffect, useRef } from 'react';
import { FiBox, FiX, FiSave, FiSearch, FiTrash2, FiUpload, FiFilter, FiChevronDown } from 'react-icons/fi';
import { LuArrowUpDown, LuArrowDownUp } from 'react-icons/lu';
import SummaryApi from '../../common';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ExportInventoryButton from '../../components/ExportInventoryButton';
import ImportInventoryModal from '../../components/ImportInventoryModal';

// Sample product units for selection
const productUnits = [
  'Piece', 'Kg', 'Meter', 'Liter', 'Box', 'Carton', 'Dozen', 'Pair', 'Roll'
];

// Warranty options
const warrantyOptions = [
  'No Warranty', '1 day', '6 months', '1 year', '1.5 years', '2 years', '3 years', '5 years'
];

const InventoryPage = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const [lastRefreshTime, setLastRefreshTime] = useState(0);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState(null);
const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sorting and filter states
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortField, setSortField] = useState('name');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // New item form state
  const [newItem, setNewItem] = useState({
    type: 'serialized-product',
    name: '',
    unit: 'Piece',
    warranty: '1 year',
    mrp: '',
    purchasePrice: '',
    customerPrice: '',
    dealerPrice: '',
    distributorPrice: ''
  });

  // Fetch inventory items on component mount
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all inventory items from API
  const fetchInventoryItems = async (forceFresh = false) => {
    try {
      // Check for cached data
      const cachedInventoryItems = localStorage.getItem('inventoryItems');
      
      // Use cached data if available and not forcing fresh data
      if (!forceFresh && cachedInventoryItems) {
        setInventoryItems(JSON.parse(cachedInventoryItems));
        // console.log("Using cached inventory data");
        
        // Fetch fresh data in background
        fetchFreshInventoryInBackground();
        setLoading(false);
        return;
      }
      
      // If no valid cache or force fresh, fetch new data
      setLoading(true);
      await fetchFreshInventoryData();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const cachedInventoryItems = localStorage.getItem('inventoryItems');
      if (cachedInventoryItems) {
        setInventoryItems(JSON.parse(cachedInventoryItems));
        console.log("Using cached inventory data after fetch error");
      } else {
        showNotification('error', 'Server error. Failed to fetch inventory items.');
        console.error('Error fetching inventory items:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshInventoryInBackground = async () => {
    try {
      await fetchFreshInventoryData(true);
    } catch (err) {
      console.error('Error fetching inventory data in background:', err);
    }
  };

  const fetchFreshInventoryData = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    
    try {
      // दो प्रकार के इंवेंटरी आइटम्स को पैरेलल में फेच करें
      const [serializedResponse, genericResponse] = await Promise.all([
        fetch(`${SummaryApi.getInventoryByType.url}/serialized-product`, {
          method: SummaryApi.getInventoryByType.method,
          credentials: 'include'
        }),
        fetch(`${SummaryApi.getInventoryByType.url}/generic-product`, {
          method: SummaryApi.getInventoryByType.method,
          credentials: 'include'
        })
      ]);

      // सभी रिस्पॉन्स पार्स करें
      const [serializedData, genericData] = await Promise.all([
        serializedResponse.json(),
        genericResponse.json()
      ]);

      // सभी आइटम्स को कम्बाइन करें और टाइप प्रॉपर्टी जोड़ें
      const combinedItems = [
        ...(serializedData.success ? serializedData.items : []),
        ...(genericData.success ? genericData.items : [])
      ];
      
      setInventoryItems(combinedItems);
      
      // Cache the inventory data
      localStorage.setItem('inventoryItems', JSON.stringify(combinedItems));
      
      // Update last refresh time for UI
      setLastRefreshTime(new Date().getTime());
    } catch (err) {
      if (!isBackground) {
        showNotification('error', 'Server error. Failed to fetch inventory items.');
        console.error('Error fetching inventory items:', err);
      }
      throw err;
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
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

// Function to open edit modal
const openEditModal = (item) => {
  setSelectedItem(item);
  setIsEditModalOpen(true);
};

// Add a function to handle the update
const handleUpdateItem = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log("Sending data to backend:", selectedItem);

    const response = await fetch(`${SummaryApi.updateInventoryItem.url}/${selectedItem.id}`, {
      method: SummaryApi.updateInventoryItem.method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selectedItem)
    });

    const data = await response.json();
    console.log("check API data:", data);
    
    if (data.success) {
      showNotification('success', 'Item updated successfully');
      setIsEditModalOpen(false);

      // Clear the inventory cache
      localStorage.removeItem('inventoryItems');

      // Update the local state immediately with the new values
      setInventoryItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedItem.id ? {...item, ...selectedItem} : item
        )
      );
      fetchFreshInventoryData(); // Refresh the list
    } else {
      showNotification('error', data.message || 'Failed to update item');
      setError(data.message || 'Failed to update item');
    }
  } catch (err) {
    showNotification('error', 'Server error. Please try again later.');
    setError('Server error. Please try again later.');
    console.error('Error updating item:', err);
  } finally {
    setLoading(false);
  }
};

// Add a function to handle edit form input changes
const handleEditItemChange = (e) => {
  const { name, value } = e.target;

  // Handle nested pricing fields
  if (name.startsWith('pricing.')) {
    const pricingField = name.split('.')[1];
    setSelectedItem({
      ...selectedItem,
      pricing: {
        ...selectedItem.pricing,
        [pricingField]: value
      }
    });
  } else {
    setSelectedItem({
      ...selectedItem,
      [name]: value
    });
  }
};

  // Handle input change for new item form
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;

    // If changing type to generic-product, set warranty to 'No Warranty'
    if (name === 'type' && value === 'generic-product') {
      setNewItem({
        ...newItem,
        [name]: value,
        warranty: 'No Warranty'
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };

  // Handle sort option selection
  const handleSortSelection = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setIsSortDropdownOpen(false);
  };

  // Get display text for sort field
  const getSortFieldLabel = (field) => {
    switch (field) {
      case 'name': return 'Name';
      case 'warranty': return 'Warranty';
      case 'mrp': return 'MRP';
      case 'purchasePrice': return 'Purchase Price';
      case 'customerPrice': return 'Customer Price';
      case 'dealerPrice': return 'Dealer Price';
      case 'distributorPrice': return 'Distributor Price';
      case 'stock': return 'Stock';
      default: return 'Name';
    }
  };

  // Get filter label
  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'All': return 'All';
      case 'Serialized': return 'Serialized';
      case 'Generic': return 'Generic';
      default: return 'All';
    }
  };

  // Validate new item form
  const validateNewItemForm = () => {
    setError(null);
    
    if (!newItem.name.trim()) {
      setError('Item name is required');
      return false;
    }
    
    if ((newItem.type === 'serialized-product' || newItem.type === 'generic-product') && !newItem.mrp) {
      setError('MRP is required for products');
      return false;
    }
    
    if ((newItem.type === 'serialized-product' || newItem.type === 'generic-product') && !newItem.purchasePrice) {
      setError('Purchase price is required for products');
      return false;
    }
    
    if (!newItem.customerPrice) {
      setError('Customer price is required');
      return false;
    }
    
    if (!newItem.dealerPrice) {
      setError('Dealer price is required');
      return false;
    }
    
    if (!newItem.distributorPrice) {
      setError('Distributor price is required');
      return false;
    }
    
    return true;
  };

  // Add a function to fetch the selected item details
const fetchItemDetails = async (itemId) => {
  try {
    setLoading(true);
    const response = await fetch(`${SummaryApi.getInventoryItemById.url}/${itemId}`, {
      method: SummaryApi.getInventoryItemById.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      setSelectedItem(data.item);
    } else {
      showNotification('error', data.message || 'Failed to fetch item details');
    }
  } catch (err) {
    showNotification('error', 'Server error. Failed to fetch item details.');
    console.error('Error fetching item details:', err);
  } finally {
    setLoading(false);
  }
};

// Calculate stock display for different item types
const getStockDisplay = (item) => {
  if (item.type === 'serialized-product') {
    return item.stock ? item.stock.length : 0;
  } else if (item.type === 'generic-product') {
    return item.stock ? item.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0;
  } else {
    return 'N/A'; // Services don't have stock
  }
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
        showNotification('success', 'Item added successfully');
        
        // Store current type
        const currentType = newItem.type;

        // Reset form but keep the selected type and appropriate warranty
        setNewItem({
          type: currentType,
          name: '',
          unit: 'Piece',
          warranty: currentType === 'generic-product' ? 'No Warranty' : '1 year',
          mrp: '',
          purchasePrice: '',
          customerPrice: '',
          dealerPrice: '',
          distributorPrice: ''
        });
        // Do not close the modal automatically
        
         // Clear the inventory cache
      localStorage.removeItem('inventoryItems');
        
        // Refresh inventory items
        fetchFreshInventoryData();
      } else {
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

  // Filter items based on active filter
  const filteredItems = inventoryItems.filter(item => {
    // First apply type filter
    if (activeFilter !== 'All') {
      // Convert from filter button names to actual type values in data
      const filterTypeMap = {
        'Serialized': 'serialized-product',
        'Generic': 'generic-product'
      };

      if (item.type !== filterTypeMap[activeFilter]) {
        return false;
      }
    }

    // Then apply search term filter
    if (searchTerm) {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return true;
  });

  // Sort filtered items
  const sortedAndFilteredItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'warranty':
        aValue = a.warranty || '';
        bValue = b.warranty || '';
        break;
      case 'mrp':
        aValue = parseFloat(a.mrp) || 0;
        bValue = parseFloat(b.mrp) || 0;
        break;
      case 'purchasePrice':
        aValue = parseFloat(a.purchasePrice) || 0;
        bValue = parseFloat(b.purchasePrice) || 0;
        break;
      case 'customerPrice':
        aValue = parseFloat(a.pricing?.customerPrice) || 0;
        bValue = parseFloat(b.pricing?.customerPrice) || 0;
        break;
      case 'dealerPrice':
        aValue = parseFloat(a.pricing?.dealerPrice) || 0;
        bValue = parseFloat(b.pricing?.dealerPrice) || 0;
        break;
      case 'distributorPrice':
        aValue = parseFloat(a.pricing?.distributorPrice) || 0;
        bValue = parseFloat(b.pricing?.distributorPrice) || 0;
        break;
      case 'stock':
        aValue = getStockDisplay(a);
        bValue = getStockDisplay(b);
        if (aValue === 'N/A') aValue = 0;
        if (bValue === 'N/A') bValue = 0;
        break;
      default:
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
  });

  // Get display type value
  const getDisplayType = (type) => {
    switch(type) {
      case 'serialized-product':
        return 'Serialized Product';
      case 'generic-product':
        return 'Generic Product';
      case 'service':
        return 'Service';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Inventory</h1>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
    {/* Add Inventory Button */}
    <button
      onClick={() => setIsModalOpen(true)}
      className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
    >
      <FiBox className="mr-2" />
      Add Inventory
    </button>

    {/* Export Inventory Button */}
    <ExportInventoryButton />

    {/* Import Inventory Button (Admin Only) */}
    {user.role === 'admin' && (
      <button
        onClick={() => setIsImportModalOpen(true)}
        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        title="Import inventory items from Excel file"
      >
        <FiUpload className="h-6 w-6" />
      </button>
    )}

    {/* Add Refresh Button */}
    <button
      onClick={() => fetchFreshInventoryData()}
      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
      title="Refresh Inventory"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
      </svg>
    </button>
  </div>

          {/* Filter and Sort Dropdowns */}
          <div className="flex space-x-2 items-center">
            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <FiFilter className="h-4 w-4 mr-2" />
                Filter: {getFilterLabel(activeFilter)}
                <FiChevronDown className="ml-2 h-4 w-4" />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => { setActiveFilter('All'); setIsFilterDropdownOpen(false); }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        activeFilter === 'All' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>All</span>
                      {activeFilter === 'All' && <span className="text-teal-600">✓</span>}
                    </button>
                    <button
                      onClick={() => { setActiveFilter('Serialized'); setIsFilterDropdownOpen(false); }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        activeFilter === 'Serialized' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Serialized</span>
                      {activeFilter === 'Serialized' && <span className="text-teal-600">✓</span>}
                    </button>
                    <button
                      onClick={() => { setActiveFilter('Generic'); setIsFilterDropdownOpen(false); }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        activeFilter === 'Generic' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Generic</span>
                      {activeFilter === 'Generic' && <span className="text-teal-600">✓</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {sortOrder === 'asc' ? (
                  <LuArrowDownUp className="h-4 w-4 mr-2" />
                ) : (
                  <LuArrowUpDown className="h-4 w-4 mr-2" />
                )}
                Sort
                <FiChevronDown className="ml-2 h-4 w-4" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="py-1">
                    {['name', 'warranty', 'mrp', 'purchasePrice', 'customerPrice', 'dealerPrice', 'distributorPrice', 'stock'].map(field => (
                      <button
                        key={field}
                        onClick={() => handleSortSelection(field)}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          sortField === field ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>{getSortFieldLabel(field)}</span>
                        {sortField === field && (
                          sortOrder === 'asc' ? (
                            <LuArrowDownUp className="h-4 w-4" />
                          ) : (
                            <LuArrowUpDown className="h-4 w-4" />
                          )
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FiSearch className="text-gray-400" />
          </div>
          <input 
            type="search" 
            className="w-full pl-10 pr-4 py-2 border rounded-lg" 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Inventory Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">S.NO</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">NAME</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">WARRANTY</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">MRP</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">PURCHASE PRICE</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">CUSTOMER PRICE</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">DEALER PRICE</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">DISTRIBUTOR PRICE</th>
                <th className="px-4 py-3 text-xs text-gray-600 font-medium">STOCK</th>
              </tr>
            </thead>
            <tbody>
  {sortedAndFilteredItems.map((item, index) => (
    <React.Fragment key={item.id}>
      <tr
        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
        onClick={() => toggleRowExpansion(item.id)}
      >
        <td className="px-4 py-3 border-t">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white ${
            item.type === 'serialized-product' ? 'bg-blue-500' : 'bg-teal-500'
          }`}>
            {index + 1}
          </div>
        </td>
        <td className={`px-4 py-3 border-t font-medium`}>{item.name}</td>
        <td className="px-4 py-3 border-t">{item.warranty || 'N/A'}</td>
        <td className="px-4 py-3 border-t">₹{item.mrp || 'N/A'}</td>
        <td className="px-4 py-3 border-t">₹{item.purchasePrice || 'N/A'}</td>
        <td className="px-4 py-3 border-t">₹{item.pricing?.customerPrice || 'N/A'}</td>
        <td className="px-4 py-3 border-t">₹{item.pricing?.dealerPrice || 'N/A'}</td>
        <td className="px-4 py-3 border-t">₹{item.pricing?.distributorPrice || 'N/A'}</td>
        <td className="px-4 py-3 border-t">
          {item.type !== 'service' ? (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.type === 'serialized-product' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {item.totalStock !== undefined ? item.totalStock : getStockDisplay(item)} {item.unit}
            </span>
          ) : (
            'N/A'
          )}
        </td>
      </tr>
      
      {/* Expandable row for action buttons */}
      {expandedRowId === item.id && (
        <tr className="bg-gray-50">
          <td colSpan={9} className="px-6 py-4 border-b">
            <div className="flex space-x-3">
              <button
                onClick={() => openEditModal(item)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  item.type === 'serialized-product' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-teal-500 hover:bg-teal-600'
                }`}
              >
                <FiSave className="mr-2" />
                Edit Item
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(item);
                  setIsDeleteDialogOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-red-500 bg-white hover:bg-red-500 hover:text-white"
              >
                <FiTrash2 className="mr-2" />
                Delete Item
              </button>
            </div>
          </td>
        </tr>
      )}
      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Confirm Delete"
        message={`${user.firstName} ${user.lastName || ''}, are you sure you want to delete the item "${itemToDelete ? itemToDelete.name : ''}"?`}
        confirmText="Yes, Delete"
        cancelText="No"
        onConfirm={async () => {
          if (!itemToDelete) {
            setIsDeleteDialogOpen(false);
            return;
          }
          const stock = itemToDelete.type === 'serialized-product'
            ? (itemToDelete.stock ? itemToDelete.stock.length : 0)
            : itemToDelete.type === 'generic-product'
              ? (itemToDelete.stock ? itemToDelete.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0)
              : 0;
          if (stock > 0) {
            showNotification('error', 'Item cannot be deleted because it has stock.');
            setIsDeleteDialogOpen(false);
            return;
          }
          try {
            setLoading(true);
            const response = await fetch(`${SummaryApi.deleteInventoryItem.url}/${itemToDelete.id}`, {
              method: SummaryApi.deleteInventoryItem.method,
              credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
              showNotification('success', 'Item deleted successfully.');
              setInventoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
              localStorage.removeItem('inventoryItems');
              fetchFreshInventoryData();
            } else {
              showNotification('error', data.message || 'Failed to delete item.');
            }
          } catch (err) {
            showNotification('error', 'Server error. Please try again later.');
            console.error('Error deleting item:', err);
          } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
      />
    </React.Fragment>
  ))}
  {sortedAndFilteredItems.length === 0 && (
    <tr>
      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
        {loading ? 'Loading inventory items...' : 'No inventory items found'}
      </td>
    </tr>
  )}
</tbody>
          </table>
        </div>
      </div>
      
      {/* Add Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-h-[600px] overflow-y-auto rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between bg-gray-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">Add New Inventory Item</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="serialized-product"
                        checked={newItem.type === 'serialized-product'}
                        onChange={handleItemInputChange}
                        className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <span className="ml-2">Serialized Product</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="generic-product"
                        checked={newItem.type === 'generic-product'}
                        onChange={handleItemInputChange}
                        className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <span className="ml-2">Generic Product</span>
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
                    autoComplete="off"
                  />
                </div>
                
                {(newItem.type === 'serialized-product' || newItem.type === 'generic-product') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <select
                        name="unit"
                        value={newItem.unit}
                        onChange={handleItemInputChange}
                        className="w-full p-2 border rounded-md bg-white"
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
                        className="w-full p-2 border rounded-md bg-white"
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="customerPrice"
                      value={newItem.customerPrice}
                      onChange={handleItemInputChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Customer Price"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dealer Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="dealerPrice"
                      value={newItem.dealerPrice}
                      onChange={handleItemInputChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Dealer Price"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distributor Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="distributorPrice"
                      value={newItem.distributorPrice}
                      onChange={handleItemInputChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Distributor Price"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none disabled:opacity-50"
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
        </div>
      )}

      {/* Edit Inventory Modal */}
{isEditModalOpen && selectedItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white max-h-[600px] overflow-y-auto rounded-lg shadow-xl w-full max-w-2xl">
      <div className="flex items-center justify-between bg-gray-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">Edit Item: {selectedItem.name}</h2>
        <button 
          onClick={() => setIsEditModalOpen(false)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <FiX size={24} />
        </button>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="serialized-product"
                  checked={selectedItem.type === 'serialized-product'}
                  onChange={handleEditItemChange}
                  disabled={selectedItem.type === 'serialized-product' || selectedItem.type === 'generic-product'}
                  className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2">Serialized Product</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="generic-product"
                  checked={selectedItem.type === 'generic-product'}
                  onChange={handleEditItemChange}
                  disabled={selectedItem.type === 'serialized-product' || selectedItem.type === 'generic-product'}
                  className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2">Generic Product</span>
              </label>
            </div>
            {(selectedItem.type === 'serialized-product' || selectedItem.type === 'generic-product') && (
              <p className="mt-1 text-xs text-gray-500">
                Product type cannot be changed after creation
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={selectedItem.name}
              onChange={handleEditItemChange}
              className={`w-full p-2 border rounded-md ${
                (selectedItem.type === 'serialized-product' || selectedItem.type === 'generic-product') 
              }`}
              placeholder="Item name"
            />
            {/* {(selectedItem.type === 'serialized-product' || selectedItem.type === 'generic-product') && (
              <p className="mt-1 text-xs text-gray-500">
                Product name cannot be changed after creation
              </p>
            )} */}
          </div>
          
          {(selectedItem.type === 'serialized-product' || selectedItem.type === 'generic-product') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={selectedItem.unit}
                  onChange={handleEditItemChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {productUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty
                </label>
                <select
                  name="warranty"
                  value={selectedItem.warranty}
                  onChange={handleEditItemChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {warrantyOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={selectedItem.mrp}
                  onChange={handleEditItemChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="MRP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price (₹)
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={selectedItem.purchasePrice}
                  onChange={handleEditItemChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Purchase Price"
                />
              </div>
            </>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Price (₹)
              </label>
              <input
                type="number"
                name="customerPrice"
                value={selectedItem.pricing?.customerPrice || ''}
                onChange={(e) => handleEditItemChange({
                  target: {
                    name: 'pricing.customerPrice',
                    value: e.target.value
                  }
                })}
                className="w-full p-2 border rounded-md"
                placeholder="Customer Price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dealer Price (₹)
              </label>
              <input
                type="number"
                name="dealerPrice"
                value={selectedItem.pricing?.dealerPrice || ''}
                onChange={(e) => handleEditItemChange({
                  target: {
                    name: 'pricing.dealerPrice',
                    value: e.target.value
                  }
                })}
                className="w-full p-2 border rounded-md"
                placeholder="Dealer Price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distributor Price (₹)
              </label>
              <input
                type="number"
                name="distributorPrice"
                value={selectedItem.pricing?.distributorPrice || ''}
                onChange={(e) => handleEditItemChange({
                  target: {
                    name: 'pricing.distributorPrice',
                    value: e.target.value
                  }
                })}
                className="w-full p-2 border rounded-md"
                placeholder="Distributor Price"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3">
        <button
          onClick={() => setIsEditModalOpen(false)}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateItem}
          disabled={loading}
          className="inline-flex justify-center items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            <span className="flex items-center">
              <FiSave className="mr-2" />
              Update Item
            </span>
          )}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Import Inventory Modal */}
      <ImportInventoryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          // Clear cache and refresh inventory data
          localStorage.removeItem('inventoryItems');
          fetchFreshInventoryData();
        }}
      />
    </div>
  );
};

export default InventoryPage;