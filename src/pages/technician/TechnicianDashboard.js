import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clipboard, 
  CheckSquare, 
  List, 
  Bell, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Sun, 
  Moon,
  ArrowLeft,
  Activity,
  Eye,
  Home
} from 'lucide-react';
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
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // States for modals
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  // Function to toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Function to handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

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

  // Handle inventory returned
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
        const activeCount = item.serializedItems?.filter(si => si.status === 'active').length || 0;
        return total + activeCount;
      } else {
        return total + (item.genericQuantity || 0);
      }
    }, 0);
  };

  // Get status color
  const getStatusColor = (status) => {
    if (darkMode) {
      switch(status) {
        case 'assigned': return 'bg-blue-500';
        case 'in-progress': return 'bg-purple-500';
        case 'paused': return 'bg-orange-500';
        case 'completed': return 'bg-green-500';
        default: return 'bg-blue-500';
      }
    } else {
      switch(status) {
        case 'assigned': return 'bg-blue-600';
        case 'in-progress': return 'bg-purple-600';
        case 'paused': return 'bg-orange-600';
        case 'completed': return 'bg-green-600';
        default: return 'bg-blue-600';
      }
    }
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
  const handleWorkOrderClick = async (workOrder) => {
    // अगर workOrder में पहले से billingInfo है, तो नवीनतम डेटा फेच करें
    if (workOrder.billingInfo && workOrder.billingInfo.length > 0) {
      try {
        const response = await fetch(`${SummaryApi.getWorkOrderDetails.url}/${workOrder.customerId}/${workOrder.orderId}`, {
          method: SummaryApi.getWorkOrderDetails.method,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // अपडेटेड वर्क ऑर्डर को सेट करें
          setSelectedWorkOrder(data.data);
        } else {
          // अगर फेच फेल होता है तो मूल वर्क ऑर्डर को सेट करें
          setSelectedWorkOrder(workOrder);
        }
      } catch (err) {
        console.error('Error fetching detailed work order:', err);
        setSelectedWorkOrder(workOrder);
      }
    } else {
      // अगर कोई पेमेंट नहीं है तो सीधे सेट करें
      setSelectedWorkOrder(workOrder);
    }
    
    setShowWorkOrderModal(true);
  };

  // Handle work order status update
  const handleWorkOrderStatusUpdate = (updatedWorkOrder) => {
    console.log("Work order updated:", updatedWorkOrder);
    
    // महत्वपूर्ण: selectedWorkOrder को भी अपडेट करें
    if (selectedWorkOrder && selectedWorkOrder.orderId === updatedWorkOrder.orderId) {
      setSelectedWorkOrder(updatedWorkOrder);
    }
    
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
            // महत्वपूर्ण: पूरा अपडेटेड ऑब्जेक्ट रिटर्न करें, न कि केवल स्प्रेड करके मर्ज करें
            // यह सुनिश्चित करेगा कि billingInfo जैसे नेस्टेड ऑब्जेक्ट भी सही से अपडेट हों
            return updatedWorkOrder;
          }
          return order;
        });
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  // Filter active inventory items (with quantity > 0 or active serial numbers)
  const activeInventoryItems = inventoryItems.filter(item => {
    if (item.type === 'serialized-product') {
      return item.serializedItems && item.serializedItems.some(si => si.status === 'active');
    } else {
      return item.genericQuantity > 0;
    }
  });

  // Combine active and completed work orders for tasks display
  const allWorkOrders = [...workOrders, ...completedOrders].sort((a, b) => {
    // Sort by most recently updated work orders
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
    return 0;
  });

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-gray-100 to-white text-gray-800'}`}>
      {/* Header */}
      <header className={`p-4 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'} rounded-b-xl mx-2 shadow-xl text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white p-1 overflow-hidden border-2 border-white shadow-lg">
              <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.firstName?.charAt(0) || 'T'}
              </div>
            </div>
            <div>
              <p className={`${darkMode ? 'text-blue-100' : 'text-blue-50'} text-xs font-medium tracking-wide`}>Welcome back,</p>
              <h1 className="font-bold text-xl">{user?.firstName || 'Technician'}</h1>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
            >
              {darkMode ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'home' && (
          <>
            {/* Date Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Today's Schedule</h2>
                <p className={`${darkMode ? 'text-white' : 'text-gray-800'} font-bold text-lg`}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button className={`${darkMode ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-400 to-purple-400'} p-2 rounded-lg shadow-lg flex items-center text-white`}>
                <Calendar size={18} className="mr-2" />
                <span className="text-sm font-medium">Calendar</span>
              </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`${darkMode ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-blue-400 to-blue-500'} rounded-2xl shadow-lg p-4 relative overflow-hidden text-white`}>
                <div className="absolute right-0 top-0 w-20 h-20 bg-blue-400 rounded-full opacity-20 -mt-10 -mr-10"></div>
                <div className="relative z-10">
                  <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                    <Clipboard size={20} />
                  </div>
                  <p className={`${darkMode ? 'text-blue-100' : 'text-blue-50'} text-xs font-medium mb-1`}>Today's Assignments</p>
                  <div className="flex items-end">
                    <p className="text-3xl font-bold">{workOrders.length}</p>
                    <p className={`${darkMode ? 'text-blue-200' : 'text-blue-100'} ml-2 mb-1 text-xs`}>tasks</p>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-green-400 to-green-500'} rounded-2xl shadow-lg p-4 relative overflow-hidden text-white`}>
                <div className="absolute right-0 top-0 w-20 h-20 bg-green-400 rounded-full opacity-20 -mt-10 -mr-10"></div>
                <div className="relative z-10">
                  <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                    <CheckSquare size={20} />
                  </div>
                  <p className={`${darkMode ? 'text-green-100' : 'text-green-50'} text-xs font-medium mb-1`}>Completed</p>
                  <div className="flex items-end">
                    <p className="text-3xl font-bold">{completedOrders.length}</p>
                    <p className={`${darkMode ? 'text-green-200' : 'text-green-100'} ml-2 mb-1 text-xs`}>tasks</p>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-purple-400 to-purple-500'} rounded-2xl shadow-lg p-4 relative overflow-hidden text-white`}>
                <div className="absolute right-0 top-0 w-20 h-20 bg-purple-400 rounded-full opacity-20 -mt-10 -mr-10"></div>
                <div className="relative z-10">
                  <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                    <Package size={20} />
                  </div>
                  <p className={`${darkMode ? 'text-purple-100' : 'text-purple-50'} text-xs font-medium mb-1`}>Inventory Items</p>
                  <div className="flex items-end">
                    <p className="text-3xl font-bold">{calculateTotalUnits()}</p>
                    <p className={`${darkMode ? 'text-purple-200' : 'text-purple-100'} ml-2 mb-1 text-xs`}>units</p>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-amber-400 to-amber-500'} rounded-2xl shadow-lg p-4 relative overflow-hidden text-white`}>
                <div className="absolute right-0 top-0 w-20 h-20 bg-amber-400 rounded-full opacity-20 -mt-10 -mr-10"></div>
                <div className="relative z-10">
                  <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                    <Activity size={20} />
                  </div>
                  <p className={`${darkMode ? 'text-amber-100' : 'text-amber-50'} text-xs font-medium mb-1`}>In Progress</p>
                  <div className="flex items-end">
                    <p className="text-3xl font-bold">
                      {workOrders.filter(order => order.status === 'in-progress').length}
                    </p>
                    <p className={`${darkMode ? 'text-amber-200' : 'text-amber-100'} ml-2 mb-1 text-xs`}>tasks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task List (All Work Orders) */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'} flex justify-between items-center`}>
                <h2 className="font-bold text-lg">Your Tasks</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowReturnModal(true)}
                    className={`text-xs ${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-3 py-1 rounded-full transition-colors flex items-center`}
                  >
                    <ArrowLeft size={14} className="mr-1" /> Return
                  </button>
                  <button 
                    onClick={() => setShowInventoryModal(true)}
                    className={`text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-full transition-colors`}
                  >
                    View Inventory
                  </button>
                </div>
              </div>
              <div>
                {allWorkOrders.length > 0 ? (
                  allWorkOrders.map((order, index) => (
                    <div
                      key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`}
                      className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center`}>
                          {index % 4 === 0 ? (
                            <Clipboard size={18} className="text-white" />
                          ) : index % 4 === 1 ? (
                            <Package size={18} className="text-white" />
                          ) : index % 4 === 2 ? (
                            <CheckSquare size={18} className="text-white" />
                          ) : (
                            <List size={18} className="text-white" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {order.projectType}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                              order.status === 'assigned' ? `${darkMode ? 'bg-blue-600/40' : 'bg-blue-100'} ${darkMode ? 'text-blue-100' : 'text-blue-800'}` :
                              order.status === 'in-progress' ? `${darkMode ? 'bg-purple-600/40' : 'bg-purple-100'} ${darkMode ? 'text-purple-100' : 'text-purple-800'}` :
                              order.status === 'paused' ? `${darkMode ? 'bg-orange-600/40' : 'bg-orange-100'} ${darkMode ? 'text-orange-100' : 'text-orange-800'}` :
                              `${darkMode ? 'bg-green-600/40' : 'bg-green-100'} ${darkMode ? 'text-green-100' : 'text-green-800'}`
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className={`inline-flex items-center ${darkMode ? 'text-gray-400 bg-gray-700/50' : 'text-gray-600 bg-gray-200/70'} text-xs px-2 py-1 rounded-full`}>
                              <Clock size={12} className="mr-1" />
                              Order ID: {order.orderId}
                            </div>
                            {order.customerName && (
                              <div className={`inline-flex items-center ${darkMode ? 'text-gray-400 bg-gray-700/50' : 'text-gray-600 bg-gray-200/70'} text-xs px-2 py-1 rounded-full`}>
                                <User size={12} className="mr-1" />
                                {order.customerName}
                              </div>
                            )}
                            {order.location && (
                              <div className={`inline-flex items-center ${darkMode ? 'text-gray-400 bg-gray-700/50' : 'text-gray-600 bg-gray-200/70'} text-xs px-2 py-1 rounded-full`}>
                                <MapPin size={12} className="mr-1" />
                                {order.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No tasks assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'inventory' && (
          <div className="flex flex-col space-y-6">
            {/* Inventory Summary */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-600'} p-6 rounded-2xl shadow-xl text-white`}>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-purple-700 rounded-full flex items-center justify-center shadow-xl mr-4">
                  <Package size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">My Inventory</p>
                  <p className={`${darkMode ? 'text-purple-200' : 'text-purple-100'}`}>Manage your stock</p>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`${darkMode ? 'text-purple-200' : 'text-purple-100'}`}>Total Units:</span>
                  <span className="text-white text-xl font-bold">{calculateTotalUnits()} items</span>
                </div>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => setShowReturnModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md mr-2 flex items-center"
                  >
                    <ArrowLeft size={16} className="mr-2" /> Return Items
                  </button>
                  <button 
                    onClick={() => setShowInventoryModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <Eye size={16} className="mr-2" /> View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory List */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <h2 className="font-bold text-lg">Inventory Items</h2>
              </div>
              
              <div className="space-y-1">
                {activeInventoryItems.length > 0 ? (
                  activeInventoryItems.map((item) => {
                    const itemKey = item._id || item.id || item.itemId || `item-${item.itemName}-${Date.now()}`;
                    
                    return (
                      <div 
                        key={itemKey} 
                        className={`p-4 ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'} cursor-pointer transition-colors`}
                        onClick={() => handleInventoryClick(item)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-purple-600' : 'bg-purple-500'} flex items-center justify-center mr-3`}>
                              <Package size={18} className="text-white" />
                            </div>
                            <div>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.itemName}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
                                {item.type.replace('-product', '')}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-purple-600/30 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                            {item.type === 'serialized-product' 
                              ? `${item.serializedItems.filter(serial => serial.status === 'active').length} ${item.unit || 'Piece'}` 
                              : `${item.genericQuantity} ${item.unit || 'Piece'}`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No inventory items assigned yet</p>
                  </div>
                )}
                
                {activeInventoryItems.length > 0 && (
                  <div className="p-4 flex justify-center">
                    <button
                      onClick={() => setShowInventoryModal(true)}
                      className={`text-sm ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white px-4 py-2 rounded-lg transition-colors w-full`}
                    >
                      View All Inventory
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'current-project' && (
          <div className="flex flex-col space-y-6">
            {/* In Progress Projects */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} p-6 rounded-2xl shadow-xl text-white`}>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center shadow-xl mr-4">
                  <Clipboard size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">Active Projects</p>
                  <p className={`${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>Current assignments</p>
                </div>
              </div>
              
              {workOrders.filter(order => order.status === 'in-progress').length > 0 ? (
                <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
                  {workOrders.filter(order => order.status === 'in-progress').slice(0, 1).map(order => (
                    <div key={order.orderId} className="mb-4">
                      <p className="text-lg font-medium mb-2">{order.projectType}</p>
                      <p className={`${darkMode ? 'text-blue-200' : 'text-blue-100'} mb-4`}>
                        Order ID: {order.orderId}
                      </p>
                      <button 
                        onClick={() => handleWorkOrderClick(order)}
                        className="bg-blue-700 hover:bg-blue-800 text-white w-full py-2 rounded-lg flex items-center justify-center"
                      >
                        <Eye size={16} className="mr-2" /> View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
                  <p className="text-center py-4">No in-progress projects</p>
                  {workOrders.length > 0 && (
                    <button 
                      onClick={() => handleWorkOrderClick(workOrders[0])}
                      className="bg-blue-700 hover:bg-blue-800 text-white w-full py-2 rounded-lg flex items-center justify-center mt-2"
                    >
                      <Eye size={16} className="mr-2" /> View Assigned Projects
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Work Orders List */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <h2 className="font-bold text-lg">All Assignments</h2>
              </div>
              
              <div>
                {workOrders.length > 0 ? (
                  workOrders.map((order) => (
                    <div 
                      key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
                      className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center mr-3`}>
                            <Clipboard size={18} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {order.projectType}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Order ID: {order.orderId}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          order.status === 'assigned' ? `${darkMode ? 'bg-blue-600/40' : 'bg-blue-100'} ${darkMode ? 'text-blue-100' : 'text-blue-800'}` :
                          order.status === 'in-progress' ? `${darkMode ? 'bg-purple-600/40' : 'bg-purple-100'} ${darkMode ? 'text-purple-100' : 'text-purple-800'}` :
                          order.status === 'paused' ? `${darkMode ? 'bg-orange-600/40' : 'bg-orange-100'} ${darkMode ? 'text-orange-100' : 'text-orange-800'}` :
                          `${darkMode ? 'bg-green-600/40' : 'bg-green-100'} ${darkMode ? 'text-green-100' : 'text-green-800'}`
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No active assignments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          
        {activeTab === 'all-projects' && (
          <div className="flex flex-col space-y-6">
            {/* Projects Summary */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-amber-600 to-amber-800' : 'bg-gradient-to-br from-amber-500 to-amber-600'} p-6 rounded-2xl shadow-xl text-white`}>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center shadow-xl mr-4">
                  <List size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">All Projects</p>
                  <p className={`${darkMode ? 'text-amber-200' : 'text-amber-100'}`}>Overview of your assignments</p>
                </div>
              </div>
              
              <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`${darkMode ? 'text-amber-200' : 'text-amber-100'}`}>Total Projects:</span>
                  <span className="text-white text-xl font-bold">{workOrders.length + completedOrders.length}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className={`${darkMode ? 'bg-amber-800/50' : 'bg-amber-700/50'} p-3 rounded-lg`}>
                    <p className="text-2xl font-bold">{workOrders.filter(order => order.status === 'assigned').length}</p>
                    <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-100'}`}>Assigned</p>
                  </div>
                  <div className={`${darkMode ? 'bg-amber-800/50' : 'bg-amber-700/50'} p-3 rounded-lg`}>
                    <p className="text-2xl font-bold">{workOrders.filter(order => order.status === 'in-progress').length}</p>
                    <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-100'}`}>In Progress</p>
                  </div>
                  <div className={`${darkMode ? 'bg-amber-800/50' : 'bg-amber-700/50'} p-3 rounded-lg`}>
                    <p className="text-2xl font-bold">{workOrders.filter(order => order.status === 'paused').length}</p>
                    <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-100'}`}>Paused</p>
                  </div>
                  <div className={`${darkMode ? 'bg-amber-800/50' : 'bg-amber-700/50'} p-3 rounded-lg`}>
                    <p className="text-2xl font-bold">{completedOrders.length}</p>
                    <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-100'}`}>Completed</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Work Orders */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden mb-4`}>
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <h2 className="font-bold text-lg">Active Assignments</h2>
              </div>
              
              <div>
                {workOrders.length > 0 ? (
                  workOrders.map((order) => (
                    <div 
                      key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
                      className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center mr-3`}>
                            <Clipboard size={18} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {order.projectType}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Order ID: {order.orderId}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          order.status === 'assigned' ? `${darkMode ? 'bg-blue-600/40' : 'bg-blue-100'} ${darkMode ? 'text-blue-100' : 'text-blue-800'}` :
                          order.status === 'in-progress' ? `${darkMode ? 'bg-purple-600/40' : 'bg-purple-100'} ${darkMode ? 'text-purple-100' : 'text-purple-800'}` :
                          order.status === 'paused' ? `${darkMode ? 'bg-orange-600/40' : 'bg-orange-100'} ${darkMode ? 'text-orange-100' : 'text-orange-800'}` :
                          `${darkMode ? 'bg-green-600/40' : 'bg-green-100'} ${darkMode ? 'text-green-100' : 'text-green-800'}`
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No active assignments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          
        {activeTab === 'completed' && (
          <div className="flex flex-col space-y-6">
            {/* Completed Summary */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} p-6 rounded-2xl shadow-xl text-white`}>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center shadow-xl mr-4">
                  <CheckSquare size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">Completed Projects</p>
                  <p className={`${darkMode ? 'text-green-200' : 'text-green-100'}`}>Your finished assignments</p>
                </div>
              </div>
              
              <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`${darkMode ? 'text-green-200' : 'text-green-100'}`}>Total completed:</span>
                  <span className="text-white text-xl font-bold">{completedOrders.length} projects</span>
                </div>
                
                {completedOrders.length > 0 && (
                  <button 
                    onClick={() => handleWorkOrderClick(completedOrders[0])}
                    className="bg-green-700 hover:bg-green-800 text-white w-full py-2 rounded-lg flex items-center justify-center mt-2"
                  >
                    <Eye size={16} className="mr-2" /> View Latest Completed
                  </button>
                )}
              </div>
            </div>
            
            {/* Completed Work Orders */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <h2 className="font-bold text-lg">Completed Assignments</h2>
              </div>
              
              <div>
                {completedOrders.length > 0 ? (
                  completedOrders.map((order) => (
                    <div 
                      key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
                      className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center mr-3`}>
                            <CheckSquare size={18} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {order.projectType}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Order ID: {order.orderId}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${darkMode ? 'bg-green-600/40 text-green-100' : 'bg-green-100 text-green-800'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No completed assignments yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Bottom Navigation */}
      <footer className={`${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'} p-1`}>
        <div className="flex justify-between px-2 pt-1">
          <button 
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 ${
              activeTab === 'home' 
                ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white shadow-lg` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            onClick={() => handleTabChange('inventory')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 ${
              activeTab === 'inventory' 
                ? `${darkMode ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-purple-500 to-purple-600'} text-white shadow-lg` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            }`}
          >
            <Package size={20} />
            <span className="text-xs mt-1">Inventory</span>
          </button>
          <button 
            onClick={() => handleTabChange('current-project')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 ${
              activeTab === 'current-project' 
                ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white shadow-lg` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            }`}
          >
            <Clipboard size={20} />
            <span className="text-xs mt-1">Current</span>
          </button>
          <button 
            onClick={() => handleTabChange('all-projects')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 ${
              activeTab === 'all-projects' 
                ? `${darkMode ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-amber-500 to-amber-600'} text-white shadow-lg` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            }`}
          >
            <List size={20} />
            <span className="text-xs mt-1">All</span>
          </button>
          <button 
            onClick={() => handleTabChange('completed')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 ${
              activeTab === 'completed' 
                ? `${darkMode ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-green-500 to-green-600'} text-white shadow-lg` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            }`}
          >
            <CheckSquare size={20} />
            <span className="text-xs mt-1">Done</span>
          </button>
        </div>
      </footer>
      
      {/* Modals */}
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
      
      {showWorkOrderModal && (
        <WorkOrderDetailsModal 
          isOpen={showWorkOrderModal}
          onClose={() => {
            setShowWorkOrderModal(false);
            if (selectedWorkOrder && selectedWorkOrder.billingInfo && selectedWorkOrder.billingInfo.length > 0) {
              fetchWorkOrders();
            }
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