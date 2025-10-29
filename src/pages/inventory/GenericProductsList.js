  import React, { useState, useEffect, useMemo } from 'react';
  import { FiPlus, FiTrash, FiSearch, FiSave, FiChevronDown, FiChevronRight } from 'react-icons/fi';
  import Modal from '../../components/Modal';
  import SummaryApi from '../../common';
  import ConfirmationDialog from '../../components/ConfirmationDialog';
  import { useNotification } from '../../context/NotificationContext';
  import { useAuth } from '../../context/AuthContext';

  const GenericProductsList = ({ searchTerm = '' }) => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isViewStockModalOpen, setIsViewStockModalOpen] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [stockEntriesToSave, setStockEntriesToSave] = useState([]);
    const [activeStockTab, setActiveStockTab] = useState('current');
    const [currentStockData, setCurrentStockData] = useState(null);
    const [currentStockLoading, setCurrentStockLoading] = useState(false);
    const [currentStockError, setCurrentStockError] = useState(null);
    const [expandedHistoryGroups, setExpandedHistoryGroups] = useState({});
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({
      title: '',
      message: '',
      type: 'warning',
      confirmText: 'Confirm',
      onConfirm: () => {}
    });
    const [stockHistory, setStockHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // State to track which row is expanded
      const [expandedRowId, setExpandedRowId] = useState(null);
      const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

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

    // Stock entries state
    const [stockEntries, setStockEntries] = useState([
      {
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    const itemUnit = selectedStockItem?.unit || '';

    const formatDateTime = (value) => {
      if (!value) return '-';
      try {
        return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      } catch (err) {
        return '-';
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

        const response = await fetch(`${SummaryApi.getInventoryCurrentStock.url}/${itemIdentifier}`, {
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

    const getAvailableTotal = () => {
      if (currentStockData) {
        return (currentStockData.available?.generic || []).reduce(
          (sum, entry) => sum + (parseInt(entry.quantity, 10) || 0),
          0
        );
      }

      if (selectedStockItem?.stock) {
        return selectedStockItem.stock.reduce(
          (total, stockEntry) => total + parseInt(stockEntry.quantity, 10),
          0
        );
      }

      return currentStockData ? 0 : null;
    };

    const getAssignedTotal = () => {
      if (currentStockData) {
        return (currentStockData.assigned || []).reduce(
          (sum, entry) => sum + (entry.genericQuantity || 0),
          0
        );
      }

      return 0;
    };

    const groupedStockHistory = useMemo(() => {
      if (!stockHistory || stockHistory.length === 0) return [];

      const groups = new Map();

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
          const remarks = Array.from(
            new Set(value.entries.map(entry => entry.remark).filter(Boolean))
          );

          return {
            key: `${key}-${idx}`,
            dateKey: key,
            dateObj: value.dateObj,
            totalQuantity,
            remarks,
            entries: value.entries
          };
        })
        .sort((a, b) => {
          const aTime = a.dateObj ? a.dateObj.getTime() : 0;
          const bTime = b.dateObj ? b.dateObj.getTime() : 0;
          return bTime - aTime;
        });
    }, [stockHistory]);

    const toggleHistoryGroup = (key) => {
      setExpandedHistoryGroups(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    };
    
    // Fetch generic products
    useEffect(() => {
      fetchItems();
    }, []);
    
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${SummaryApi.getInventoryByType.url}/generic-product`, {
          method: SummaryApi.getInventoryByType.method,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setItems(data.items);
        } else {
          setError(data.message || 'Failed to fetch generic products');
        }
      } catch (err) {
        setError('Server error. Please try again later.');
        console.error('Error fetching generic products:', err);
      } finally {
        setLoading(false);
      }
    };

    const openViewStockModal = async (item) => {
      setSelectedStockItem(item);
      setIsViewStockModalOpen(true);
      setActiveStockTab('current');
      setCurrentStockData(null);
      setCurrentStockError(null);
      setExpandedHistoryGroups({});
      setLoadingHistory(true);
      setStockHistory([]);

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

    // Discard and close button handler
    const handleDiscardAndClose = () => {
      if (stockEntries.some(entry => entry.quantity > 1)) {
        showConfirmation(
          'Discard Changes?',
          'All unsaved changes will be lost. Are you sure you want to discard them?',
          'warning',
          'Discard',
          () => {
            resetStockEntriesForm();
            setStockEntriesToSave([]);
            setIsAddStockModalOpen(false);
          }
        );
      } else {
        resetStockEntriesForm();
        setStockEntriesToSave([]);
        setIsAddStockModalOpen(false);
      }
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
    
    // Open add stock modal for an item (manager only)
    const openAddStockModal = (item) => {
      resetStockEntriesForm();
      setStockEntriesToSave([]);
      
      setSelectedItem(item);
      setIsAddStockModalOpen(true);
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
      
      setStockEntriesToSave(validEntries);
      const totalQuantity = validEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0);
      
      // Instead of just showing notification, show the confirmation dialog
      setShowSaveConfirmation(true);
    };

    // 2. Add a function to handle cancellation of the save dialog
const handleCancelSave = () => {
  setShowSaveConfirmation(false);
};

    // Save stock entries
    const handleSaveStock = async () => {
      setError(null);
      
      try {
        setLoading(true);
        
        // Submit each stock entry
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
        
        showNotification('success', 'Stock added successfully');
        
        setShowSaveConfirmation(false);
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
    
    return (
      <div>
        {/* <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Generic Products</h1>
          <p className="text-gray-600">Manage products tracked by quantity</p>
        </div> */}
        
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
            <h2 className="text-lg font-semibold text-gray-700">Generic Products</h2>
          </div> */}
          
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {items.length === 0 ? 'No generic products found.' : 'No products match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BRANCH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UNIT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WARRANTY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SALE PRICE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STOCK</th>
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
                    openViewStockModal={openViewStockModal}
                    openAddStockModal={openAddStockModal}
                    isExpanded={expandedRowId === item.id}
                    toggleExpanded={() => toggleRowExpansion(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        
        {/* Add Stock Modal - For managers only */}
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
                          <FiTrash size={18} />
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
                          Enter the number of {selectedItem.unit.toLowerCase()} to add
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
                  Add Another Entry
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-between">
                <div>
                  <span className="text-sm text-gray-500">
                    Total: {stockEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)} {selectedItem.unit}
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
      disabled={loading || stockEntries.every(e => !e.quantity || e.quantity <= 0)}
      className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
    >
      <span className="flex items-center">
        <FiSave className="mr-2" />
        Prepare to Save
      </span>
          </button>
                </div>
              </div>
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

        {/* View Stock Modal */}
        <Modal
          isOpen={isViewStockModalOpen}
          onClose={() => {
            setIsViewStockModalOpen(false);
            setStockHistory([]);
            setCurrentStockData(null);
            setCurrentStockError(null);
            setExpandedHistoryGroups({});
            setActiveStockTab('current');
          }}
          title={`Stock Details - ${selectedStockItem?.name || ''}`}
          size="xl"
        >
          {selectedStockItem && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock Overview</h3>
                <p className="text-sm text-gray-500">
                  Current Available Stock:{' '}
                  {(() => {
                    const availableTotal = getAvailableTotal();
                    if (availableTotal === null || availableTotal === undefined) {
                      return '...';
                    }
                    return `${availableTotal} ${itemUnit}`.trim();
                  })()}
                </p>
                {(() => {
                  const assignedTotal = getAssignedTotal();
                  if (assignedTotal === null || assignedTotal === undefined) {
                    return null;
                  }
                  return (
                    <p className="text-sm text-gray-500">
                      Assigned to Technicians: {assignedTotal} {itemUnit}
                    </p>
                  );
                })()}
                <p className="text-sm text-gray-400 mt-1">
                  Switch between current allocation and stock history.
                </p>
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
                            return `Total Available: ${total !== null ? total : 0} ${itemUnit}`.trim();
                          })()}
                        </p>
                        {currentStockData.available?.generic?.length ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {currentStockData.available.generic.map((entry, index) => (
                              <div
                                key={`available-${index}`}
                                className="bg-white border border-gray-200 rounded-md p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">
                                    {entry.quantity} {itemUnit}
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
                        )}
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-base font-semibold text-gray-900">Assigned to Technicians</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          {(() => {
                            const total = getAssignedTotal();
                            return `Total Assigned: ${total !== null ? total : 0} ${itemUnit}`.trim();
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
                                    <p className="font-medium text-gray-900">{entry.technicianName}</p>
                                    {entry.username && (
                                      <p className="text-xs text-gray-500">@{entry.username}</p>
                                    )}
                                  </div>
                                  <div className="text-right text-sm font-semibold text-gray-700">
                                    {entry.genericQuantity || 0} {itemUnit}
                                  </div>
                                </div>
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
                              {isExpanded ? (
                                <FiChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <FiChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-3">
                                {group.entries.map((entry, idx) => (
                                  <div
                                    key={`${group.key}-entry-${idx}`}
                                    className="bg-white border border-gray-200 rounded p-3"
                                  >
                                    <div className="flex justify-between text-sm text-gray-600">
                                      <span>
                                        Quantity:{' '}
                                        <span className="font-medium text-gray-800">
                                          {entry.quantity} {itemUnit}
                                        </span>
                                      </span>
                                      <span>{entry.addedDate ? formatDateTime(entry.addedDate) : '-'}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                      Remark: {entry.remark || 'Not provided'}
                                    </p>
                                  </div>
                                ))}
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

        <Modal
  isOpen={showSaveConfirmation}
  onClose={handleCancelSave}
  title="Confirm Save"
  size="md"
>
  <div className="py-4">
    <div className="mb-6 flex items-center justify-center">
      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
        <FiSave size={32} className="text-blue-500" />
      </div>
    </div>
    
    <h3 className="text-xl font-medium text-center mb-4">Ready to Save</h3>
    
    <p className="text-center text-gray-600 mb-6">
      You are about to save <span className="font-bold">
        {stockEntriesToSave.reduce((sum, entry) => sum + Number(entry.quantity), 0)}
      </span> {selectedItem?.unit || 'items'} for item <span className="font-bold">{selectedItem?.name}</span>.
    </p>
    
    <div className="mt-8 flex justify-center space-x-4">
      <button
        type="button"
        onClick={handleCancelSave}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
      >
        Cancel
      </button>
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
    </div>
  </div>
</Modal>
      </div>
    );
  };

  // Add this component at the end of your file (before export default)
  const ClickableTableRow = ({ item, index, user, openViewStockModal, openAddStockModal, isExpanded, toggleExpanded }) => {
    // const [expanded, setExpanded] = useState(false);
    const totalStock = item.stock ? item.stock.reduce((total, stock) => total + parseInt(stock.quantity, 10), 0) : 0;
    
    return (
      <React.Fragment>
        <tr 
          className="hover:bg-gray-50 cursor-pointer"
          onClick={toggleExpanded}
        >
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium">
              {index + 1}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.branch?.name || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.warranty || 'No Warranty'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.mrp}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.salePrice}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {totalStock} {item.unit}
            </span>
          </td>
          {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button 
              className="text-blue-600 hover:text-blue-900"
              onClick={(e) => {
                e.stopPropagation();
                user.role === 'manager' ? openAddStockModal(item) : openViewStockModal(item);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </td> */}
        </tr>
        
        {/* Expandable row for action buttons */}
        {isExpanded && (
          <tr className="bg-gray-50">
            <td colSpan={9} className="px-6 py-4 border-b">
              <div className="flex space-x-3">
                <button
                  onClick={() => openViewStockModal(item)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Details
                </button>
                
                {user.role === 'manager' && (
                  <button
                    onClick={() => openAddStockModal(item)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600"
                  >
                    Add Stock
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  export default GenericProductsList;
