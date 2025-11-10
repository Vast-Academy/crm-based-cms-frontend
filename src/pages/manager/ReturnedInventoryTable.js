import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiUser, FiPackage, FiX, FiSearch, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { LuArrowDownUp, LuArrowUpDown } from 'react-icons/lu';
import SummaryApi from '../../common';
import { useNotification } from '../../context/NotificationContext';
import ConfirmReturnModal from './ConfirmReturnModal';
import RejectReturnModal from './RejectReturnModal';

const ReturnedInventoryTable = () => {
  const { showNotification } = useNotification();
  const [returnedItems, setReturnedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Sort dropdown states
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState('date'); // 'technician', 'date', 'quantity'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const sortDropdownRef = useRef(null);

  // Double ESC and double click states for details modal
  const [escPressCount, setEscPressCount] = useState(0);
  const [escPressTimer, setEscPressTimer] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  // Fetch returned inventory
  useEffect(() => {
    fetchReturnedInventory();
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchReturnedInventory = async (forceFresh = false) => {
    try {
      // Check for cached data
      const cachedReturnedItems = localStorage.getItem('returnedInventoryData');
      
      // Use cached data if available and not forcing fresh data
      if (!forceFresh && cachedReturnedItems) {
        const parsedReturnedItems = JSON.parse(cachedReturnedItems);
        setReturnedItems(parsedReturnedItems);
        
        // Fetch fresh data in background
        fetchFreshReturnedInventoryInBackground();
        setLoading(false);
        return;
      }
      
      // If no valid cache or force fresh, fetch new data
      setLoading(true);
      await fetchFreshReturnedInventory();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const cachedReturnedItems = localStorage.getItem('returnedInventoryData');
      
      if (cachedReturnedItems) {
        const parsedReturnedItems = JSON.parse(cachedReturnedItems);
        setReturnedItems(parsedReturnedItems);
        console.log("Using cached returned inventory data after fetch error");
      } else {
        setError('Error loading returned inventory. Please try again.');
        console.error('Error fetching returned inventory:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch fresh data in background
const fetchFreshReturnedInventoryInBackground = async () => {
  try {
    await fetchFreshReturnedInventory(true);
  } catch (err) {
    console.error('Error fetching returned inventory in background:', err);
  }
};

// Function to fetch fresh data directly from API
const fetchFreshReturnedInventory = async (isBackground = false) => {
  if (!isBackground) {
    setLoading(true);
    setError(null);
  }
  
  try {
    const response = await fetch(SummaryApi.getReturnedInventory.url, {
      method: SummaryApi.getReturnedInventory.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      setReturnedItems(data.data);
      
      // Cache the returned inventory data
      localStorage.setItem('returnedInventoryData', JSON.stringify(data.data));
      
      // Update last refresh time for UI
      setLastRefreshTime(new Date().getTime());
    } else {
      if (!isBackground) {
        setError(data.message || 'Failed to load returned inventory');
      }
    }
  } catch (err) {
    if (!isBackground) {
      setError('Error loading returned inventory. Please try again.');
      console.error('Error fetching returned inventory:', err);
    }
    throw err;
  } finally {
    if (!isBackground) {
      setLoading(false);
    }
  }
};

  // Handle manual refresh button click
  const handleRefreshClick = async () => {
    try {
      await fetchFreshReturnedInventory();
    } catch (err) {
      console.error('Error refreshing returned inventory:', err);
      setError('Failed to refresh returned inventory. Please try again.');
      setLoading(false);
    }
  };

  // Handle sort selection
  const handleSortSelection = (field) => {
    if (sortField === field) {
      // Toggle order if same field selected
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default order
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
    setIsSortDropdownOpen(false);
  };

  // Format date
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

  // Filter items based on search query
  const filterItems = (items) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      // Search by item name
      const nameMatch = item.name.toLowerCase().includes(query);

      // Search by serial number
      const serialMatch = item.serialNumber &&
        item.serialNumber.toLowerCase().includes(query);

      return nameMatch || serialMatch;
    });
  };

  // Handle search input Enter key - Select all text like Ctrl+A
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchInputRef.current) {
      e.preventDefault();
      searchInputRef.current.select();
    }
  };

  // Highlight search term in text (like ReturnInventoryModal)
  const highlightSearchTerm = (text) => {
    if (!searchQuery.trim() || !text) return text;

    const searchLower = searchQuery.toLowerCase();
    const textLower = text.toLowerCase();

    if (!textLower.includes(searchLower)) return text;

    const index = textLower.indexOf(searchLower);
    const before = text.substring(0, index);
    const match = text.substring(index, index + searchQuery.length);
    const after = text.substring(index + searchQuery.length);

    return (
      <>
        {before}
        <span className="bg-yellow-200 text-gray-900">
          {match}
        </span>
        {after}
      </>
    );
  };

  // Reset search when modal closes
  const resetSearch = () => {
    setSearchQuery('');
  };

  // Open details modal
  const handleOpenDetailsModal = (returnItem) => {
    setSelectedReturn(returnItem);
    setDetailsModalOpen(true);
    resetSearch();
  };

  // Open confirm modal
  const handleOpenConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  // Open reject modal
  const handleOpenRejectModal = () => {
    setRejectModalOpen(true);
  };

  // Handle successful confirmation
  const handleReturnConfirmed = () => {
    // Close details modal and reset
    setDetailsModalOpen(false);
    setSelectedReturn(null);
    fetchReturnedInventory();
    showNotification('success', 'Inventory return confirmed successfully');
  };

  // Handle successful rejection
  const handleReturnRejected = () => {
    // Close details modal and reset
    setDetailsModalOpen(false);
    setSelectedReturn(null);
    fetchReturnedInventory();
    showNotification('success', 'Inventory return rejected successfully');
  };

  // Reset ESC and click counters for details modal
  useEffect(() => {
    if (!detailsModalOpen) {
      setEscPressCount(0);
      setClickCount(0);
      if (escPressTimer) clearTimeout(escPressTimer);
      if (clickTimer) clearTimeout(clickTimer);
      resetSearch();
    }
  }, [detailsModalOpen]);

  // Double ESC handler for details modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && detailsModalOpen) {
        if (escPressCount === 0) {
          setEscPressCount(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          setDetailsModalOpen(false);
        }
      }
    };

    if (detailsModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (escPressTimer) clearTimeout(escPressTimer);
    };
  }, [detailsModalOpen, escPressCount, escPressTimer, showNotification]);

  // Handle overlay click for details modal - requires double click to close
  const handleOverlayClick = () => {
    if (clickCount === 0) {
      setClickCount(1);
      const timer = setTimeout(() => {
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCount(0);
      }, 800);
      setClickTimer(timer);
    } else if (clickCount === 1) {
      if (clickTimer) clearTimeout(clickTimer);
      setClickCount(0);
      setDetailsModalOpen(false);
    }
  };

  // Get sorted items
  const getSortedItems = () => {
    let sorted = [...returnedItems];

    // Apply sorting
    sorted.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'technician') {
        // Sort by technician name
        const nameA = (a.technician?.name || '').toLowerCase();
        const nameB = (b.technician?.name || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'date') {
        // Sort by return date
        const dateA = new Date(a.returnedAt).getTime();
        const dateB = new Date(b.returnedAt).getTime();
        comparison = dateA - dateB;
      } else if (sortField === 'quantity') {
        // Sort by total quantity
        const qtyA = a.totalQuantity || 0;
        const qtyB = b.totalQuantity || 0;
        comparison = qtyA - qtyB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Pending Returned Inventory</h2>

        {/* Refresh and Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            title="Refresh Returned Inventory"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>

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

            {/* Sort Dropdown Menu */}
            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handleSortSelection('technician')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                      sortField === 'technician' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Technician Name</span>
                    {sortField === 'technician' && (
                      sortOrder === 'asc' ? (
                        <LuArrowDownUp className="h-4 w-4" />
                      ) : (
                        <LuArrowUpDown className="h-4 w-4" />
                      )
                    )}
                  </button>
                  <button
                    onClick={() => handleSortSelection('date')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                      sortField === 'date' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Date Added</span>
                    {sortField === 'date' && (
                      sortOrder === 'asc' ? (
                        <LuArrowDownUp className="h-4 w-4" />
                      ) : (
                        <LuArrowUpDown className="h-4 w-4" />
                      )
                    )}
                  </button>
                  <button
                    onClick={() => handleSortSelection('quantity')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                      sortField === 'quantity' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Items Quantity</span>
                    {sortField === 'quantity' && (
                      sortOrder === 'asc' ? (
                        <LuArrowDownUp className="h-4 w-4" />
                      ) : (
                        <LuArrowUpDown className="h-4 w-4" />
                      )
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">
          <p>Loading returned inventory...</p>
        </div>
      ) : returnedItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedItems().map((returnItem, index) => (
                <tr
                  key={returnItem.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenDetailsModal(returnItem)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiUser className="mr-2 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {returnItem.technician.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {returnItem.technician.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiClock className="mr-2 text-gray-500" />
                      <div className="text-sm text-gray-900">
                        {formatDate(returnItem.returnedAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiPackage className="mr-2 text-gray-500" />
                      <div className="text-sm text-gray-900">
                        {returnItem.itemCount} items ({returnItem.totalQuantity} units)
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No pending returned inventory items</p>
        </div>
      )}

      {/* Return Details Modal */}
      {detailsModalOpen && selectedReturn && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-indigo-100 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-indigo-800">
                Return Details
              </h2>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-indigo-500 hover:text-indigo-700 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Technician and Date Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FiUser className="mr-3 text-gray-500" size={20} />
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Technician</div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedReturn.technician.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedReturn.technician.username}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-3 text-gray-500" size={20} />
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Return Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(selectedReturn.returnedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" size={20} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Search by item name or serial number..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FiX size={16} className="text-gray-500 hover:text-gray-700" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-2 text-xs text-gray-600">
                    Found {filterItems(selectedReturn.items).length} item{filterItems(selectedReturn.items).length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Returned Items Table */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FiPackage className="mr-2" />
                  Returned Items ({filterItems(selectedReturn.items).length} of {selectedReturn.itemCount} items showing)
                </h3>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filterItems(selectedReturn.items).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {highlightSearchTerm(item.name)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'serialized-product'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type === 'serialized-product' ? 'Serialized' : 'Generic'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {item.quantity} {item.unit || 'units'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.serialNumber ? (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                                {highlightSearchTerm(item.serialNumber)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filterItems(selectedReturn.items).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No items found matching your search.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                type="button"
                onClick={handleOpenRejectModal}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none font-medium"
              >
                Reject Return
              </button>
              <button
                type="button"
                onClick={handleOpenConfirmModal}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none font-medium"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Return Modal */}
      {selectedReturn && (
        <ConfirmReturnModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          returnData={selectedReturn}
          onConfirmed={handleReturnConfirmed}
        />
      )}

      {/* Reject Return Modal */}
      {selectedReturn && (
        <RejectReturnModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          returnData={selectedReturn}
          onRejected={handleReturnRejected}
        />
      )}
    </div>
  );
};

export default ReturnedInventoryTable;