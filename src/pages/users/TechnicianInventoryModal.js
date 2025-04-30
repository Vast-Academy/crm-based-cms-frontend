// components/technician/TechnicianInventoryModal.jsx
import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiFilter, FiX, FiDownload, FiPackage } from 'react-icons/fi';
import SummaryApi from '../../common';

const TechnicianInventoryModal = ({ isOpen, onClose, technician }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Fetch technician's inventory transfers
  useEffect(() => {
    if (isOpen && technician) {
      fetchTechnicianInventoryHistory();
    }
  }, [isOpen, technician]);

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
    if (filterType === 'all') return true;
    if (filterType === 'assigned') return transfer.to === `${technician.firstName} ${technician.lastName}`;
    if (filterType === 'returned') return transfer.from === `${technician.firstName} ${technician.lastName}`;
    return true;
  });
  
  // Calculate current inventory stats
  const calculateCurrentStock = () => {
    // Group transfers by item name
    const stockByItem = {};
    
    transfers.forEach(transfer => {
      const itemName = transfer.itemName;
      const itemId = transfer.itemId;
      const key = `${itemId}-${itemName}`;
      
      if (!stockByItem[key]) {
        stockByItem[key] = {
          name: itemName,
          id: itemId,
          quantity: 0,
          type: transfer.type,
          serialNumbers: new Set()
        };
      }
      
      // If assigned to technician, add to stock
      if (transfer.to === `${technician.firstName} ${technician.lastName}`) {
        stockByItem[key].quantity += transfer.quantity;
        if (transfer.serialNumber) {
          stockByItem[key].serialNumbers.add(transfer.serialNumber);
        }
      }
      
      // If returned from technician, subtract from stock
      if (transfer.from === `${technician.firstName} ${technician.lastName}`) {
        stockByItem[key].quantity -= transfer.quantity;
        if (transfer.serialNumber) {
          stockByItem[key].serialNumbers.delete(transfer.serialNumber);
        }
      }
    });
    
    // Convert to array and filter out items with zero quantity
    return Object.values(stockByItem).filter(item => item.quantity > 0);
  };
  
  // Get current stock
  const currentStock = calculateCurrentStock();

  // Export to CSV
  const exportToCsv = () => {
    // Create CSV header
    const header = [
      'Date', 'Item ID', 'Item Name', 'Type', 'From', 'To', 
      'Quantity', 'Serial Number', 'Transferred By'
    ].join(',');
    
    // Create CSV rows
    const rows = filteredTransfers.map(transfer => [
      formatDate(transfer.timestamp),
      transfer.itemId,
      transfer.itemName,
      transfer.type.replace('-product', ''),
      transfer.from,
      transfer.to,
      transfer.quantity,
      transfer.serialNumber || 'N/A',
      transfer.transferredBy
    ].join(','));
    
    // Combine header and rows
    const csv = [header, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `technician-inventory-${technician.firstName}-${technician.lastName}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Don't render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      {/* Modal content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
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

          {/* Modal body */}
          <div className="p-6">
            {/* Current Stock Summary */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-md text-white mb-6">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center shadow-lg mr-3">
                  <FiPackage size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold">{technician.firstName}'s Inventory</p>
                  <p className="text-sm text-purple-100">Current stock overview</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3 text-center mb-3">
                  <div className="bg-purple-700/40 p-3 rounded-lg">
                    <p className="text-2xl font-bold">
                      {currentStock.length}
                    </p>
                    <p className="text-xs text-purple-200">Item Types</p>
                  </div>
                  <div className="bg-purple-700/40 p-3 rounded-lg">
                    <p className="text-2xl font-bold">
                      {currentStock.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                    <p className="text-xs text-purple-200">Total Units</p>
                  </div>
                </div>
                
                {/* Current Stock Items */}
                {currentStock.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm mb-2 font-medium">Current Items:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {currentStock.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-purple-700/30 p-2 rounded-md">
                          <div className="text-sm truncate max-w-[70%]">{item.name}</div>
                          <div className="px-2 py-1 bg-purple-800/50 rounded-md text-xs">
                            {item.quantity} pcs
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                {/* Filter Buttons instead of dropdown */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      filterType === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterType('assigned')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
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
                
                <button 
                  onClick={exportToCsv}
                  className="bg-green-50 text-green-600 px-3 py-2 rounded-md flex items-center"
                >
                  <FiDownload className="mr-1" /> Export
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}
            
            {loading ? (
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
                <p className="text-gray-500">No transfer records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianInventoryModal;