// components/technician/TechnicianInventoryModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiArrowRight, FiX, FiPackage } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useNotification } from '../../context/NotificationContext';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

const TechnicianInventoryModal = ({ isOpen, onClose, technician, onAssignInventory, refreshTrigger = 0 }) => {
  const { showNotification } = useNotification();

  // Modal registry setup
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(60); // z-[60] from the modal div

  const [transfers, setTransfers] = useState([]);
  const [currentInventory, setCurrentInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('current'); // Default to current

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

  // Reference to the most recent timestamp for each serial number or item
  const [latestTransfers, setLatestTransfers] = useState({});

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

  // Fetch technician's inventory transfers and current inventory
  useEffect(() => {
    if (isOpen && technician) {
      fetchTechnicianInventoryHistory();
      fetchTechnicianCurrentInventory();
    }
  }, [isOpen, technician, refreshTrigger]);

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

  const fetchTechnicianInventoryHistory = async () => {
    try {
      setLoading(true);

      // Call backend API for technician's inventory
      const response = await fetch(`${SummaryApi.getTechnicianInventoryHistory.url}/${technician._id}`, {
        method: SummaryApi.getTechnicianInventoryHistory.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setTransfers(data.data);

        // Calculate latest transfers for each item/serial
        calculateLatestTransfers(data.data);
      } else {
        setError(data.message || 'Failed to load inventory history');
      }
    } catch (err) {
      setError('Error loading inventory history. Please try again.');
      console.error('Error fetching inventory history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch technician's current inventory from TechnicianInventory model
  const fetchTechnicianCurrentInventory = async () => {
    try {
      // Create a temporary auth token for the technician to fetch their inventory
      // We'll use a different approach - pass technician ID to a manager endpoint
      const response = await fetch(`${SummaryApi.getTechnicianInventory.url}?technicianId=${technician._id}`, {
        method: SummaryApi.getTechnicianInventory.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setCurrentInventory(data.data);
      } else {
        console.error('Failed to load current inventory:', data.message);
      }
    } catch (err) {
      console.error('Error fetching current inventory:', err);
    }
  };
  
  // Calculate the latest transfer for each item/serial number
  const calculateLatestTransfers = (transferData) => {
    const latest = {};
    const technicianFullName = `${technician.firstName} ${technician.lastName}`;
    
    // Sort transfers by timestamp (newest first)
    const sortedTransfers = [...transferData].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Create a serialNumber tracking object to know the current status of each serial number
    const serialNumberStatus = {};
    
    // First pass: process all transfers in chronological order (oldest to newest)
    // This helps us build a complete picture of where each item is now
    [...sortedTransfers].reverse().forEach(transfer => {
      // For serialized items, track the current location of each serial number
      if (transfer.type === 'serialized-product' && transfer.serialNumber) {
        const serialKey = `${transfer.itemId}-${transfer.serialNumber}`;
        
        // If item is transferred TO this technician, it's with them
        if (transfer.to === technicianFullName) {
          serialNumberStatus[serialKey] = 'with-technician';
        }
        // If item is transferred FROM this technician to anywhere else, it's not with them
        else if (transfer.from === technicianFullName) {
          serialNumberStatus[serialKey] = 'not-with-technician';
        }
      }
      
      // Also track generic items by maintaining running quantities
      if (transfer.type === 'generic-product') {
        const genericKey = `generic-${transfer.itemId}`;
        
        if (!serialNumberStatus[genericKey]) {
          serialNumberStatus[genericKey] = { quantity: 0 };
        }
        
        // If item is transferred TO this technician, add to quantity
        if (transfer.to === technicianFullName) {
          serialNumberStatus[genericKey].quantity += transfer.quantity;
        }
        // If item is transferred FROM this technician, subtract from quantity
        else if (transfer.from === technicianFullName) {
          serialNumberStatus[genericKey].quantity -= transfer.quantity;
        }
      }
    });
    
    // Second pass: Build latest transfers map based on current status
    // Only include items that are currently with the technician

    // For serialized products
    Object.keys(serialNumberStatus).forEach(statusKey => {
      if (statusKey.includes('-') && serialNumberStatus[statusKey] === 'with-technician') {
        // This is a serialized item key: itemId-serialNumber
        const [itemId, serialNumber] = statusKey.split('-');

        // Find the most recent transfer for this serial number
        const relevantTransfers = sortedTransfers.filter(t =>
          t.type === 'serialized-product' &&
          t.itemId === itemId &&
          t.serialNumber === serialNumber
        );

        if (relevantTransfers.length > 0) {
          const latestTransfer = relevantTransfers[0]; // Already sorted newest first

          latest[statusKey] = {
            transfer: latestTransfer,
            isWithTechnician: true,
            isReturnedByTechnician: false
          };
        }
      }
    });

    // For generic products
    Object.keys(serialNumberStatus).forEach(statusKey => {
      if (statusKey.startsWith('generic-') && serialNumberStatus[statusKey].quantity > 0) {
        // This is a generic item key: generic-itemId
        const itemId = statusKey.replace('generic-', '');

        // Find the most recent transfer for this item
        const relevantTransfers = sortedTransfers.filter(t =>
          t.type === 'generic-product' &&
          t.itemId === itemId
        );

        if (relevantTransfers.length > 0) {
          const latestTransfer = relevantTransfers[0]; // Already sorted newest first

          // Create transfer with current quantity
          const modifiedTransfer = {
            ...latestTransfer,
            quantity: serialNumberStatus[statusKey].quantity
          };

          latest[itemId] = {
            transfer: modifiedTransfer,
            isWithTechnician: true,
            isReturnedByTechnician: false
          };
        }
      }
    });
    
    setLatestTransfers(latest);
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

  // Filter transfers based on selection
  const filteredTransfers = transfers.filter(transfer => {
    if (filterType === 'current') return true;
    if (filterType === 'assigned') return transfer.to === `${technician.firstName} ${technician.lastName}`;
    if (filterType === 'returned') return transfer.from === `${technician.firstName} ${technician.lastName}`;
    return true;
  });
  
  // Calculate current inventory using actual TechnicianInventory data
  const calculateCurrentStock = () => {
    const stock = [];

    // Process current inventory items
    currentInventory.forEach(item => {
      if (item.type === 'serialized-product') {
        // For serialized products, count active serial numbers
        const activeSerials = item.serializedItems?.filter(si => si.status === 'active') || [];

        if (activeSerials.length > 0) {
          stock.push({
            id: item.itemId,
            name: item.itemName,
            type: item.type,
            unit: item.unit || 'Piece',
            serialNumbers: activeSerials.map(si => si.serialNumber),
            quantity: activeSerials.length
          });
        }
      } else if (item.type === 'generic-product') {
        // For generic products, use the quantity
        if (item.genericQuantity > 0) {
          stock.push({
            id: item.itemId,
            name: item.itemName,
            type: item.type,
            unit: item.unit || 'Piece',
            quantity: item.genericQuantity,
            serialNumbers: []
          });
        }
      }
    });

    return stock;
  };
  
  // Get current stock
  const currentStock = calculateCurrentStock();
  
  // Get total units from current stock
  const getTotalUnits = () => {
    return currentStock.reduce((sum, item) => sum + item.quantity, 0);
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

  // Don't render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={handleOverlayClick}></div>

      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          {/* Modal header */}
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              {technician ? `${technician.firstName} ${technician.lastName}'s Inventory History` : 'Inventory History'}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Buttons at top */}
          <div className="border-b flex-shrink-0">
            <div className="flex justify-between items-center px-6 py-2">
              {/* Left side - Filter buttons */}
              <div className="flex">
                <button
                  onClick={() => setFilterType('current')}
                  className={`px-4 py-2 rounded-full text-sm font-medium mr-2 ${
                    filterType === 'current'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Current Stock
                </button>
                <button
                  onClick={() => setFilterType('assigned')}
                  className={`px-4 py-2 rounded-full text-sm font-medium mr-2 ${
                    filterType === 'assigned'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setFilterType('returned')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    filterType === 'returned'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Returned
                </button>
              </div>

              {/* Right side - Assign Inventory button */}
              <button
                onClick={() => onAssignInventory && onAssignInventory(technician)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center text-sm font-medium"
              >
                <FiPackage className="mr-2" />
                Assign Inventory
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Current Stock Content - Only show when filter is current */}
            {filterType === 'current' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-md text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold">{currentStock.length}</p>
                        <p className="text-sm text-blue-100 mt-1">Item Types</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                        <FiPackage size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-md text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold">{getTotalUnits()}</p>
                        <p className="text-sm text-green-100 mt-1">Total Units</p>
                      </div>
                      <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                        <FiPackage size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Items List */}
                {currentStock.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase">Current Inventory Items</h4>
                    </div>

                    <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                      {currentStock.map((item, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          {/* Item Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start flex-1">
                              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-semibold text-gray-900">{item.name}</h5>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.type === 'serialized-product' ? 'Serialized Product' : 'Generic Product'}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                                {item.quantity} {item.unit || 'pcs'}
                              </span>
                            </div>
                          </div>

                          {/* Serial Numbers Section */}
                          {item.type === 'serialized-product' && item.serialNumbers && item.serialNumbers.length > 0 && (
                            <div className="ml-11 mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                <span className="text-xs font-semibold text-gray-700 uppercase">Serial Numbers</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1.5">
                                {item.serialNumbers.map((serial, idx) => (
                                  <div key={idx} className="flex items-center text-xs">
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-700 rounded mr-2 font-medium">
                                      {idx + 1}
                                    </span>
                                    <span className="text-gray-800 font-mono bg-white px-2 py-1 rounded border border-gray-200 flex-1">
                                      {serial}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">No items currently assigned</p>
                    <p className="text-gray-500 text-sm mt-1">This technician doesn't have any inventory items at the moment</p>
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}
            
            {/* Show transaction table for assigned/returned filters */}
            {(filterType === 'assigned' || filterType === 'returned') && (
              loading ? (
                <div className="text-center py-4">
                  <p>Loading inventory history...</p>
                </div>
              ) : filteredTransfers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransfers.map((transfer, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {formatDate(transfer.timestamp)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">{transfer.itemName}</div>
                            <div className="text-xs text-gray-500">ID: {transfer.itemId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <div className="flex items-center justify-center">
                              <span>{transfer.from}</span>
                              <FiArrowRight className="mx-2 text-blue-500" />
                              <span>{transfer.to}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">
                              {transfer.quantity} {transfer.unit}
                              {transfer.type === 'serialized-product' && transfer.serialNumber && (
                                <div className="text-xs text-gray-500">
                                  S/N: {transfer.serialNumber}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {transfer.transferredBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No {filterType} records found</p>
                </div>
              )
            )}
          </div>
        </div>
    </div>
  );
};

export default TechnicianInventoryModal;
