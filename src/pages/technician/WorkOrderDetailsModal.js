import React, { useRef, useEffect, useState } from 'react';
import { FiX, FiUser, FiMapPin, FiCalendar, FiInfo, FiPlay, FiPause, FiSearch, FiCamera, FiFileText } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';

// For more basic projects, a simpler scan simulation approach might be better
const SimpleScanner = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  
  return (
    <div className="p-4">
      <div className="text-center py-4">
        <FiCamera size={64} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Camera access is not enabled in this version</p>
        <p className="text-sm text-gray-500 mt-2">Please enter the serial number manually:</p>
        
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
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => onScan(manualCode)}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md"
              disabled={!manualCode.trim()}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkOrderDetailsModal = ({ isOpen, onClose, workOrder, onStatusUpdate }) => {
  const modalContentRef = useRef(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // States for inventory management
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianInventory, setTechnicianInventory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showBillSummary, setShowBillSummary] = useState(false);
  
  // Reset states when modal opens with a different work order
  useEffect(() => {
    setRemark('');
    setError(null);
    setSearchQuery('');
    setSelectedItems([]);
    setSearchResults([]);
    setShowCameraScanner(false);
    setShowBillSummary(false);
    
    // Load technician inventory if work order is in-progress
    if (workOrder?.status === 'in-progress') {
      fetchTechnicianInventory();
    }
  }, [workOrder?.orderId]);
  
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
        // Ensure all items have a proper salePrice value
        const inventoryWithPrices = data.data.map(item => ({
          ...item,
          salePrice: item.salePrice || 0
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
  
  // Real-time search as user types
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  // Set up a scrollable container to ensure visibility of all content
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, workOrder]);
  
  if (!isOpen || !workOrder) return null;
  
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

  // Function to check if technician already has an active project
  const checkActiveProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getTechnicianActiveProject.url, {
        method: SummaryApi.getTechnicianActiveProject.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.hasActiveProject && data.activeProject.orderId !== workOrder.orderId) {
          setError(`You already have an active project: ${data.activeProject.projectType}. Please pause it before starting a new one.`);
          return true;
        }
        return false;
      } else {
        setError(data.message || 'Failed to check active projects');
        return true;
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error checking active project:', err);
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Function to update the work order status
  const updateStatus = async (newStatus) => {
    // For starting a project, check if there's an active project first
    if (newStatus === 'in-progress') {
      const hasActiveProject = await checkActiveProject();
      if (hasActiveProject) return;
    }
    
    // For resume, also check for active projects
    if (newStatus === 'in-progress' && workOrder.status === 'paused') {
      const hasActiveProject = await checkActiveProject();
      if (hasActiveProject) return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
        method: SummaryApi.updateWorkOrderStatus.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          customerId: workOrder.customerId,
          orderId: workOrder.orderId,
          status: newStatus,
          remark: remark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Call the parent component's onStatusUpdate to refresh data
        if (onStatusUpdate) {
          onStatusUpdate(data.data);
        }
        
        // Close the modal for pause action
        if (newStatus === 'paused') {
          onClose();
        }
        
        // If project is started, load inventory
        if (newStatus === 'in-progress') {
          fetchTechnicianInventory();
        }
        
        // Reset remark field
        setRemark('');
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Error updating work order status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search inventory based on serial number or name
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = [];
    const query = searchQuery.toLowerCase();
    
    // Search in serialized items
    technicianInventory.forEach(item => {
      // Match by item name first
      const nameMatch = item.itemName.toLowerCase().includes(query);
      
      if (item.type === 'serialized-product') {
        // For serialized items, also check serial numbers
        const matchingSerials = item.serializedItems.filter(
          serial => serial.serialNumber.toLowerCase().includes(query) || nameMatch
        );
        
        if (matchingSerials.length > 0) {
          matchingSerials.forEach(serialItem => {
            results.push({
              ...item,
              selectedSerialNumber: serialItem.serialNumber,
              quantity: 1,
              unit: item.unit || 'Piece'
            });
          });
        }
      } else if (nameMatch) {
        // For generic items, match by name
        results.push({
          ...item,
          quantity: 1,
          unit: item.unit || 'Piece'
        });
      }
    });
    
    setSearchResults(results);
  };

  // Add item to the selected items list
  const addItemToSelection = (item) => {
    // Ensure the item has a price
    const itemWithPrice = {
      ...item,
      salePrice: item.salePrice || 0  // Default to 0 if not present
    };
    
    // Check if this item is already in the list (for serialized items)
    if (item.type === 'serialized-product') {
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
        const updatedItems = [...selectedItems];
        updatedItems[existingIndex].quantity += 1;
        setSelectedItems(updatedItems);
      } else {
        setSelectedItems([...selectedItems, itemWithPrice]);
      }
    }
    
    // Clear search results and query
    setSearchResults([]);
    setSearchQuery('');
  };

  // Remove item from selection
  const removeItem = (index) => {
    const newSelectedItems = [...selectedItems];
    newSelectedItems.splice(index, 1);
    setSelectedItems(newSelectedItems);
  };

  // Handle scanning
  const handleScan = () => {
    setShowCameraScanner(true);
  };

  // Handle scan result (when a barcode is detected)
  const handleScanResult = (result) => {
    if (result) {
      setShowCameraScanner(false);
      setSearchQuery(result);
      handleSearch();
    }
  };

  // Generate bill summary only (no inventory reduction)
  const generateBill = () => {
    if (selectedItems.length === 0) {
      setError('No items selected for billing');
      return;
    }
    
    setShowBillSummary(true);
  };
  
  // Calculate total bill amount
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.salePrice || 0) * item.quantity;
    }, 0);
  };

  // Group selected items by name for bill display
  const getGroupedItems = () => {
    const grouped = {};
    
    selectedItems.forEach(item => {
      const key = item.itemId;
      
      if (!grouped[key]) {
        grouped[key] = {
          name: item.itemName,
          type: item.type,
          unit: item.unit || 'Piece',
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
  
  // Handle confirming the bill (this will be implemented later)
  const handleConfirmBill = () => {
    // This will be implemented later - for now just close the summary
    setShowBillSummary(false);
    
    // You will add actual bill confirmation logic here later
    // For now, just show a message
    alert('Bill confirmation feature will be implemented in the next phase');
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-start z-50 p-2 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden my-4">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Work Order Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Bill Summary Modal */}
        {showBillSummary && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Bill Summary</h2>
                <button 
                  onClick={() => setShowBillSummary(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX size={20} />
                </button>
              </div>
              
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
                        {item.quantity} {item.unit}
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
              
              <div className="mt-4 flex justify-between">
                <button 
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
                  onClick={() => setShowBillSummary(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-green-500 text-white rounded-md"
                  onClick={handleConfirmBill}
                >
                  Confirm Bill
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Simple Scanner Modal */}
        {showCameraScanner && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Scan Barcode</h2>
                <button 
                  onClick={() => setShowCameraScanner(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <SimpleScanner 
                onScan={handleScanResult}
                onClose={() => setShowCameraScanner(false)}
              />
            </div>
          </div>
        )}
        
        <div 
          ref={modalContentRef}
          className="overflow-y-auto p-4"
          style={{ maxHeight: 'calc(90vh - 60px)' }}
        >
          {/* Status Badge */}
          <div className="mb-4 flex justify-between items-center">
            <span className={`px-3 py-1 rounded-full text-sm capitalize ${
              workOrder.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
              workOrder.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
              workOrder.status === 'paused' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              {workOrder.status}
            </span>
            
            <div className="text-sm text-gray-500">
              <FiCalendar className="inline mr-1" />
              {formatDate(workOrder.createdAt)}
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Basic Work Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-lg mb-2">
              Project Type: {workOrder.projectType}
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Order ID:</span> {workOrder.orderId}</p>
              <p><span className="text-gray-500">Project ID:</span> {workOrder.projectId}</p>
              {workOrder.branchName && (
                <p><span className="text-gray-500">Branch:</span> {workOrder.branchName}</p>
              )}
            </div>
          </div>
          
          {/* Customer Information - Show only address for simplicity */}
          <div className="mb-4">
            <h3 className="text-md font-medium flex items-center mb-3">
              <FiUser className="mr-2" />
              Customer Information
            </h3>
            
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <p className="font-medium">{workOrder.customerName}</p>
              {workOrder.customerAddress && (
                <p className="flex items-start text-sm">
                  <FiMapPin className="mr-2 text-gray-500 mt-1" />
                  <span>{workOrder.customerAddress}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Project Requirements */}
          {workOrder.initialRemark && (
            <div className="mb-4">
              <h3 className="text-md font-medium flex items-center mb-3">
                <FiInfo className="mr-2" />
                Project Requirements
              </h3>
              
              <div className="bg-white border rounded-lg p-3">
                <p className="text-sm">{workOrder.initialRemark}</p>
              </div>
            </div>
          )}
          
          {/* Status History (if any) */}
          {workOrder.statusHistory && workOrder.statusHistory.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-3">Status History</h3>
              
              <div className="bg-white border rounded-lg p-3">
                <div className="space-y-3">
                  {workOrder.statusHistory.map((history, index) => (
                    <div key={index} className="text-sm border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{history.status}</span>
                        <span className="text-gray-500">{formatDate(history.updatedAt)}</span>
                      </div>
                      {history.remark && <p className="mt-1 text-gray-600">{history.remark}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Inventory Management Section - Only show if work order is in-progress */}
          {workOrder.status === 'in-progress' && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-3">Inventory Management</h3>
              
              <div className="bg-white border rounded-lg p-3">
                {/* Search and Scan */}
                <div className="flex mb-3">
                  <div className="relative flex-1 mr-2">
                    <input
                      type="text"
                      placeholder="Search by name or serial number"
                      className="w-full pl-10 pr-2 py-2 border rounded-md"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  <button
                    onClick={handleScan}
                    className="px-3 py-2 bg-green-500 text-white rounded-md"
                  >
                    Scan
                  </button>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mb-3 border rounded-md p-2 bg-gray-50">
                    <p className="text-sm font-medium mb-2">Search Results:</p>
                    {searchResults.map((item, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                        onClick={() => addItemToSelection(item)}
                      >
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-xs text-gray-500">
                            {item.type === 'serialized-product' 
                              ? `S/N: ${item.selectedSerialNumber} - ₹${item.salePrice?.toFixed(2) || '0.00'}` 
                              : `Generic Item - ₹${item.salePrice?.toFixed(2) || '0.00'}`}
                          </p>
                        </div>
                        <button className="text-blue-500 text-sm">Add</button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Selected Items List */}
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Selected Items:</p>
                  {selectedItems.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2">
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-xs text-gray-500">
                              {item.type === 'serialized-product'
                                ? `S/N: ${item.selectedSerialNumber} - ₹${item.salePrice?.toFixed(2) || '0.00'}`
                                : `${item.quantity} ${item.unit || 'Piece'} - ₹${item.salePrice?.toFixed(2) || '0.00'}`}
                            </p>
                          </div>
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
                
                {/* Generate Bill Button */}
                {selectedItems.length > 0 && (
                  <button
                    onClick={generateBill}
                    className="w-full py-2 bg-blue-500 text-white rounded-md flex items-center justify-center"
                  >
                    <FiFileText className="mr-2" /> Generate Bill
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            {/* For assigned work orders - show Start Project button */}
            {workOrder.status === 'assigned' && (
              <button 
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center"
                onClick={() => updateStatus('in-progress')}
                disabled={loading}
              >
                <FiPlay className="mr-2" /> Start Project
              </button>
            )}
            
            {/* For in-progress work orders - show Pause Project with remark input */}
            {workOrder.status === 'in-progress' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for pausing
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter reason for pausing this project..."
                  ></textarea>
                </div>
                
                <button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md flex items-center justify-center"
                  onClick={() => updateStatus('paused')}
                  disabled={loading || !remark.trim()}
                >
                  <FiPause className="mr-2" /> Pause Project
                </button>
              </>
            )}
            
            {/* For paused work orders - show Resume Project with remark input */}
            {workOrder.status === 'paused' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for resuming
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter reason for resuming this project..."
                  ></textarea>
                </div>
                
                <button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center"
                  onClick={() => updateStatus('in-progress')}
                  disabled={loading || !remark.trim()}
                >
                  <FiPlay className="mr-2" /> Resume Project
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailsModal;