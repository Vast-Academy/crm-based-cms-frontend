import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiArrowLeft } from 'react-icons/fi';
import SummaryApi from '../../common';

const ReturnInventoryModal = ({ isOpen, onClose, onInventoryReturned }) => {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedTab, setSelectedTab] = useState('serialized');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch technician's inventory
  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);
  
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getTechnicianInventory.url, {
        method: SummaryApi.getTechnicianInventory.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data);
        setFilteredInventory(data.data);
      } else {
        setError(data.message || 'Failed to load inventory');
      }
    } catch (err) {
      setError('Error loading inventory. Please try again.');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter inventory based on search and tab
  useEffect(() => {
    if (inventory.length > 0) {
      let filtered = [...inventory];
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.itemName.toLowerCase().includes(query) ||
          (item.type === 'serialized-product' && 
           item.serializedItems.some(s => s.serialNumber.toLowerCase().includes(query)))
        );
      }
      
      // Filter by tab selection
      if (selectedTab === 'serialized') {
        filtered = filtered.filter(item => 
          item.type === 'serialized-product' && item.serializedItems.some(s => s.status === 'active')
        );
      } else {
        filtered = filtered.filter(item => 
          item.type === 'generic-product' && item.genericQuantity > 0
        );
      }
      
      setFilteredInventory(filtered);
    }
  }, [inventory, searchQuery, selectedTab]);
  
  // Toggle item selection for serialized items
  const toggleSerialItemSelection = (item, serialNumber) => {
    console.log("Toggling selection for item:", item);
    
    // Make sure you're using the correct ID field from your item object
    // It could be item.id, item.itemId, or item._id depending on your data structure
    const itemId = item.id || item.itemId; 
    
    console.log("Using itemId:", itemId, "serial:", serialNumber);
    
    const existingIndex = selectedItems.findIndex(
      selected => selected.itemId === itemId && selected.serialNumber === serialNumber
    );
    
    if (existingIndex >= 0) {
      // Remove if already selected
      const newSelected = [...selectedItems];
      newSelected.splice(existingIndex, 1);
      setSelectedItems(newSelected);
    } else {
      // Add to selected with the correct itemId
      setSelectedItems([
        ...selectedItems,
        {
          itemId: itemId, // Make sure this is set correctly
          type: 'serialized-product',
          serialNumber
        }
      ]);
    }
  };
  
  // Handle generic item quantity change
  const handleQuantityChange = (itemId, value, maxQuantity) => {
    console.log("Toggling selection for item:", itemId);
    // Validate quantity
    const quantity = parseInt(value);
    if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
      return;
    }
    
    const existingIndex = selectedItems.findIndex(
      item => item.itemId === itemId && item.type === 'generic-product'
    );
    
    
    if (existingIndex >= 0) {
      // Update existing item
      const newSelected = [...selectedItems];
      newSelected[existingIndex].quantity = quantity;
      setSelectedItems(newSelected);
    } else {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          itemId,
          type: 'generic-product',
          quantity
        }
      ]);
    }
  };
  
  // Check if a serial item is selected
  const isSerialItemSelected = (itemId, serialNumber) => {
    return selectedItems.some(
      item => item.itemId === itemId && item.serialNumber === serialNumber
    );
  };
  
  // Get selected quantity for generic item
  const getSelectedQuantity = (itemId) => {
    const item = selectedItems.find(
      item => item.itemId === itemId && item.type === 'generic-product'
    );
    return item ? item.quantity : 0;
  };
  
  // Submit selected items to return
  const handleReturnItems = async () => {
    if (selectedItems.length === 0) {
      setError('No items selected for return');
      return;
    }
    
    try {
      setLoading(true);
      
      // Process each item separately
      for (const item of selectedItems) {
        console.log("Sending return request:", item);
        const response = await fetch(SummaryApi.returnInventoryToManager.url, {
          method: SummaryApi.returnInventoryToManager.method,
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(item)
        });
        
        const data = await response.json();
        
        if (!data.success) {
          setError(data.message || 'Failed to return some items');
          // Continue with other items
        }
      }
      
      // Refresh inventory after return
      await fetchInventory();
      
      // Notify parent component
      if (onInventoryReturned) {
        onInventoryReturned();
      }
      
      // Reset selections
      setSelectedItems([]);
      
      // Show success message
      alert('Selected items have been returned to manager successfully!');
      
      // Close modal
      onClose();
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error returning inventory:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Return Inventory to Manager</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search inventory items..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setSelectedTab('serialized')}
              className={`px-4 py-2 rounded-md ${
                selectedTab === 'serialized' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Serialized Items
            </button>
            <button 
              onClick={() => setSelectedTab('generic')}
              className={`px-4 py-2 rounded-md ${
                selectedTab === 'generic' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Generic Items
            </button>
          </div>
        </div>
        
        {error && (
          <div className="m-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="p-4 text-center">
              <p>Loading inventory...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {inventory.length === 0 ? 'No inventory items assigned to you.' : 'No items match your search.'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredInventory.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{item.itemName}</h3>
                      <p className="text-sm text-gray-500">{item.type.replace('-product', '')}</p>
                    </div>
                  </div>
                  
                  {item.type === 'serialized-product' ? (
                    <div>
                      <p className="text-sm mb-2">Select items to return:</p>
                      <div className="space-y-2 ml-2">
                        {item.serializedItems.filter(s => s.status === 'active').map((serialItem, idx) => (
                          <div 
                          key={`${item.id}-${serialItem.serialNumber}`}
                          className={`flex items-center p-2 rounded cursor-pointer ${
                            isSerialItemSelected(item.id, serialItem.serialNumber) 
                              ? 'bg-blue-100 border-2 border-blue-500' // Make selection more obvious
                              : 'hover:bg-gray-50 border'
                          }`}
                          onClick={() => toggleSerialItemSelection(item, serialItem.serialNumber)}
                        >
                          <input 
                            type="checkbox"
                            className="mr-2"
                            checked={isSerialItemSelected(item.id, serialItem.serialNumber)}
                            onChange={() => {}} // React requires onChange with checked
                          />
                          <span>{serialItem.serialNumber}</span>
                        </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mt-2">
                        <label className="text-sm mr-3">Quantity to return:</label>
                        <input 
                          type="number"
                          min="0"
                          max={item.genericQuantity}
                          className="w-20 px-2 py-1 border rounded-md"
                          value={getSelectedQuantity(item.itemId) || ''}
                          onChange={(e) => handleQuantityChange(item.itemId, e.target.value, item.genericQuantity)}
                        />
                        <span className="ml-2 text-sm text-gray-500">/ {item.genericQuantity} {item.unit || 'Piece'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white p-4 border-t flex justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleReturnItems}
            disabled={selectedItems.length === 0 || loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md flex items-center ${
              selectedItems.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            <FiArrowLeft className="mr-2" />
            {loading ? 'Processing...' : 'Return Selected Items'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnInventoryModal;