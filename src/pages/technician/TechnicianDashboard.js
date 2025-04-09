import React, { useState, useEffect } from 'react';
import { FiPackage, FiClipboard, FiEye, FiCheckCircle, FiActivity, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import InventoryDetailsModal from './InventoryDetailsModal';
import WorkOrderDetailsModal from './WorkOrderDetailsModal';
import ReturnInventoryModal from './ReturnInventoryModal';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for modals
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  

  // Fetch technician inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getTechnicianInventory.url, {
        method: SummaryApi.getTechnicianInventory.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInventoryItems(data.data);
      } else {
        setError('Failed to load inventory: ' + data.message);
      }
    } catch (err) {
      setError('Error loading inventory. Please try again later.');
      console.error('Error fetching inventory:', err);
    }
  };

  // Add this handler
  const handleInventoryReturned = () => {
    // Reload inventory data
    fetchInventory();
  };

  // Fetch technician work orders
  const fetchWorkOrders = async () => {
    try {
      const response = await fetch(SummaryApi.getTechnicianWorkOrders.url, {
        method: SummaryApi.getTechnicianWorkOrders.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Separate active and completed work orders
        const active = [];
        const completed = [];
        
        data.data.forEach(order => {
          if (order.status === 'completed') {
            completed.push(order);
          } else {
            active.push(order);
          }
        });
        
        setWorkOrders(active);
        setCompletedOrders(completed);
      } else {
        setError('Failed to load work orders: ' + data.message);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error loading work orders. Please try again later.');
      console.error('Error fetching work orders:', err);
      setLoading(false);
    }
  };

  // Calculate total units across all inventory items
  const calculateTotalUnits = () => {
    return inventoryItems.reduce((total, item) => {
      if (item.type === 'serialized-product') {
        return total + item.serializedItems.length;
      } else {
        return total + item.genericQuantity;
      }
    }, 0);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchInventory();
      await fetchWorkOrders();
    };
    
    loadData();
  }, []);

  // Handle inventory item click
  const handleInventoryClick = (item) => {
    setSelectedInventory(item);
    setShowInventoryModal(true);
  };

  // Handle work order click
  const handleWorkOrderClick = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowWorkOrderModal(true);
  };

  // Handle work order status update
  const handleWorkOrderStatusUpdate = (updatedWorkOrder) => {
    // Update the work order in our state
    if (updatedWorkOrder.status === 'completed') {
      // Move to completed orders
      setWorkOrders(prevOrders => 
        prevOrders.filter(order => order.orderId !== updatedWorkOrder.orderId)
      );
      setCompletedOrders(prevOrders => [updatedWorkOrder, ...prevOrders]);
    } else {
      setWorkOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.orderId === updatedWorkOrder.orderId) {
            return { ...order, ...updatedWorkOrder };
          }
          return order;
        });
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 max-w-lg mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.firstName}</h1>
        <p className="text-gray-600">Here's your dashboard</p>
      </div>
      
      {/* Inventory Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FiPackage className="mr-2 text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-800">My Inventory</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
         <div className="flex justify-between items-center mb-4">
    <div>
      <p className="text-gray-600">Total Units</p>
      <p className="text-2xl font-bold text-blue-600">{calculateTotalUnits()}</p>
    </div>
    <div className="flex space-x-2">
      <button 
        onClick={() => setShowReturnModal(true)}
        className="bg-orange-50 text-orange-600 px-4 py-2 rounded-md flex items-center"
      >
        <FiArrowLeft className="mr-2" /> Return
      </button>
      <button 
        onClick={() => setShowInventoryModal(true)}
        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md flex items-center"
      >
        <FiEye className="mr-2" /> View All
      </button>
    </div>
  </div>
          
          <div className="space-y-3 mt-4">
          {inventoryItems.filter(item => {
  if (item.type === 'serialized-product') {
    return item.serializedItems.some(si => si.status === 'active');
  } else {
    return item.genericQuantity > 0;
  }
}).slice(0, 3).map((item) => (
  <div 
    key={item.id} 
    className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
    onClick={() => handleInventoryClick(item)}
  >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.type.replace('-product', '')}</p>
                  </div>
                  <div className="text-right">
                  <p className="font-medium">
          {item.type === 'serialized-product' 
            ? `${item.serializedItems.filter(serial => serial.status === 'active').length} ${item.unit || 'Piece'}` 
            : `${item.genericQuantity} ${item.unit || 'Piece'}`}
        </p>
                  </div>
                </div>
              </div>
            ))}
            
            {inventoryItems.filter(item => 
  (item.type === 'serialized-product' && 
   item.serializedItems.some(si => si.status === 'active')) ||
  (item.type === 'generic-product' && item.genericQuantity > 0)
).length > 3 && (
  <button
    onClick={() => setShowInventoryModal(true)}
    className="w-full text-blue-600 py-2 hover:underline"
  >
    Show all {inventoryItems.filter(item => 
      (item.type === 'serialized-product' && 
       item.serializedItems.some(si => si.status === 'active')) ||
      (item.type === 'generic-product' && item.genericQuantity > 0)
    ).length} items
  </button>
)}
            
            {inventoryItems.length === 0 && (
              <p className="text-center text-gray-500 py-2">No inventory items assigned yet</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Active Work Orders Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FiActivity className="mr-2 text-green-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-800">My Active Assignments</h2>
        </div>
        
        <div className="space-y-4">
          {workOrders.length > 0 ? (
            workOrders.map((order) => (
              <div 
                key={order.orderId} 
                className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                  order.status === 'assigned' ? 'border-blue-500' :
                  order.status === 'in-progress' ? 'border-purple-500' :
                  order.status === 'paused' ? 'border-orange-500' :
                  'border-green-500'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{order.projectType}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">Order ID: {order.orderId}</p>
                
                <button 
                  onClick={() => handleWorkOrderClick(order)}
                  className="w-full bg-green-50 text-green-600 py-2 rounded-md flex items-center justify-center"
                >
                  <FiEye className="mr-2" /> View Details
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No active work assignments</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Completed Work Orders Section */}
      <div>
        <div className="flex items-center mb-4">
          <FiCheckCircle className="mr-2 text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-800">Completed Projects</h2>
        </div>
        
        <div className="space-y-4">
          {completedOrders.length > 0 ? (
            completedOrders.map((order) => (
              <div 
                key={order.orderId} 
                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{order.projectType}</h3>
                  <span className="px-2 py-1 rounded-full text-xs capitalize bg-green-100 text-green-800">
                    {order.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">Order ID: {order.orderId}</p>
                
                <button 
                  onClick={() => handleWorkOrderClick(order)}
                  className="w-full bg-green-50 text-green-600 py-2 rounded-md flex items-center justify-center"
                >
                  <FiEye className="mr-2" /> View Details
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No completed projects yet</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Inventory Details Modal */}
      {showInventoryModal && (
        <InventoryDetailsModal 
          isOpen={showInventoryModal}
          onClose={() => {
            setShowInventoryModal(false);
            setSelectedInventory(null);
          }}
          inventory={inventoryItems}
          selectedItem={selectedInventory}
        />
      )}
      
      {/* Work Order Details Modal */}
      {showWorkOrderModal && (
        <WorkOrderDetailsModal 
          isOpen={showWorkOrderModal}
          onClose={() => {
            setShowWorkOrderModal(false);
            setSelectedWorkOrder(null);
          }}
          workOrder={selectedWorkOrder}
          onStatusUpdate={handleWorkOrderStatusUpdate}
        />
      )}

    {showReturnModal && (
    <ReturnInventoryModal 
      isOpen={showReturnModal}
      onClose={() => setShowReturnModal(false)}
      onInventoryReturned={handleInventoryReturned}
    />
  )}
    </div>
  );
};

export default TechnicianDashboard;