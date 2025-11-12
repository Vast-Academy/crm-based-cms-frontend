import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUser, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { LuArrowDownUp, LuArrowUpDown } from "react-icons/lu";
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AssignTechnicianModal from './AssignTechnicianModal';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
};

const rowBackgroundColors = {
  pending: 'bg-yellow-50',
};

const WorkOrdersPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const managerName = `${user?.firstName || 'Manager'} ${user?.lastName || ''}`.trim();
  const canCancelWorkOrder = user?.role === 'manager' || user?.role === 'admin';

  // Modal registry setup for cancel modals
  const cancelModalId = useRef(Math.random().toString(36).substr(2, 9));
  const cancelConfirmModalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(50); // z-50 from the modal divs

  // Double ESC and double click states for cancel reason modal
  const [escPressCountReason, setEscPressCountReason] = useState(0);
  const [escPressTimerReason, setEscPressTimerReason] = useState(null);
  const [clickCountReason, setClickCountReason] = useState(0);
  const [clickTimerReason, setClickTimerReason] = useState(null);

  // Double ESC and double click states for cancel confirm modal
  const [escPressCountConfirm, setEscPressCountConfirm] = useState(0);
  const [escPressTimerConfirm, setEscPressTimerConfirm] = useState(null);
  const [clickCountConfirm, setClickCountConfirm] = useState(0);
  const [clickTimerConfirm, setClickTimerConfirm] = useState(null);

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

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // State for filters
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'installation', 'repair'
  
  // State for assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Sort dropdown states
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState('dateCreated'); // 'dateCreated', 'customerName', 'companyName'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const sortDropdownRef = useRef(null);
  
  const fetchWorkOrders = async (forceFresh = false) => {
    try {
      // Check for cached data
      const cachedWorkOrders = localStorage.getItem('workOrdersData');
      
      // Use cached data if available and not forcing fresh data
      if (!forceFresh && cachedWorkOrders) {
        const parsedWorkOrders = JSON.parse(cachedWorkOrders);
        setWorkOrders(parsedWorkOrders);
        applyFilters(parsedWorkOrders, categoryFilter);
        // console.log("Using cached work orders data");
        
        // Fetch fresh data in background
        fetchFreshWorkOrdersInBackground();
        setLoading(false);
        return;
      }
      
      // If no valid cache or force fresh, fetch new data
      setLoading(true);
      await fetchFreshWorkOrders();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const cachedWorkOrders = localStorage.getItem('workOrdersData');
      
      if (cachedWorkOrders) {
        const parsedWorkOrders = JSON.parse(cachedWorkOrders);
        setWorkOrders(parsedWorkOrders);
        applyFilters(parsedWorkOrders, categoryFilter);
        console.log("Using cached work orders data after fetch error");
      } else {
        setError('Server error. Please try again later.');
        console.error('Error fetching work orders:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch fresh data in background
const fetchFreshWorkOrdersInBackground = async () => {
  try {
    await fetchFreshWorkOrders(true);
  } catch (err) {
    console.error('Error fetching work orders in background:', err);
  }
};

// Function to fetch fresh data directly from API
const fetchFreshWorkOrders = async (isBackground = false) => {
  if (!isBackground) {
    setLoading(true);
    setError(null);
  }
  
  try {
    // Get branch from URL params first, then fallback to user.selectedBranch
    const urlParams = new URLSearchParams(window.location.search);
    const urlBranch = urlParams.get('branch') || (user.role === 'admin' ? user.selectedBranch : '');
    let branchParam = '';
    if (urlBranch) {
      branchParam = `?branch=${urlBranch}`;
    }
    
    // Always filter for pending status only
    const statusParam = branchParam ? '&' : '?';
    branchParam += `${statusParam}status=pending`;
    
    const response = await fetch(`${SummaryApi.getWorkOrders.url}${branchParam}`, {
      method: SummaryApi.getWorkOrders.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Only keep pending orders
      const pendingOrders = data.data.filter(order => 
        order.status === 'pending' || 
        order.status === 'Pending'
      );
      
      setWorkOrders(pendingOrders);
      if (!isBackground) {
        applyFilters(pendingOrders, categoryFilter);
      }
      
      // Cache the work orders
      localStorage.setItem('workOrdersData', JSON.stringify(pendingOrders));
      
      // Update last refresh time
      setLastRefreshTime(new Date().getTime());
    } else {
      if (!isBackground) {
        setError(data.message || 'Failed to fetch work orders');
      }
    }
  } catch (err) {
    if (!isBackground) {
      setError('Server error. Please try again later.');
      console.error('Error fetching work orders:', err);
    }
    throw err;
  } finally {
    if (!isBackground) {
      setLoading(false);
    }
  }
};
  
  useEffect(() => {
    fetchWorkOrders();
  }, [user.selectedBranch, window.location.search]);

  // Register/unregister cancel reason modal in global registry
  useEffect(() => {
    if (showCancelModal) {
      window.__modalRegistry.add({
        id: cancelModalId.current,
        zIndex: numericZIndex.current
      });
    } else {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === cancelModalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === cancelModalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    };
  }, [showCancelModal]);

  // Register/unregister cancel confirm modal in global registry
  useEffect(() => {
    if (showCancelConfirmModal) {
      window.__modalRegistry.add({
        id: cancelConfirmModalId.current,
        zIndex: numericZIndex.current
      });
    } else {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === cancelConfirmModalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === cancelConfirmModalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    };
  }, [showCancelConfirmModal]);

  // Reset ESC and click counters when modals open/close
  useEffect(() => {
    if (!showCancelModal) {
      setEscPressCountReason(0);
      setClickCountReason(0);
      if (escPressTimerReason) clearTimeout(escPressTimerReason);
      if (clickTimerReason) clearTimeout(clickTimerReason);
    }
  }, [showCancelModal]);

  useEffect(() => {
    if (!showCancelConfirmModal) {
      setEscPressCountConfirm(0);
      setClickCountConfirm(0);
      if (escPressTimerConfirm) clearTimeout(escPressTimerConfirm);
      if (clickTimerConfirm) clearTimeout(clickTimerConfirm);
    }
  }, [showCancelConfirmModal]);

  // Double ESC handler for cancel reason modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showCancelModal && isTopmostModal()) {
        if (escPressCountReason === 0) {
          setEscPressCountReason(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCountReason(0);
          }, 800);
          setEscPressTimerReason(timer);
        } else if (escPressCountReason === 1) {
          clearTimeout(escPressTimerReason);
          setEscPressCountReason(0);
          closeCancelModals();
        }
      }
    };

    if (showCancelModal) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (escPressTimerReason) clearTimeout(escPressTimerReason);
    };
  }, [showCancelModal, escPressCountReason, escPressTimerReason, showNotification]);

  // Double ESC handler for cancel confirm modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showCancelConfirmModal && isTopmostModal()) {
        if (escPressCountConfirm === 0) {
          setEscPressCountConfirm(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCountConfirm(0);
          }, 800);
          setEscPressTimerConfirm(timer);
        } else if (escPressCountConfirm === 1) {
          clearTimeout(escPressTimerConfirm);
          setEscPressCountConfirm(0);
          closeCancelModals();
        }
      }
    };

    if (showCancelConfirmModal) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (escPressTimerConfirm) clearTimeout(escPressTimerConfirm);
    };
  }, [showCancelConfirmModal, escPressCountConfirm, escPressTimerConfirm, showNotification]);

  const handleRowClick = (order) => {
    // Directly open AssignTechnicianModal when row is clicked
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleAssignTechnician = (order) => {
    console.log("Assigning order:", order);
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleCancelClick = (order) => {
    setSelectedCancelOrder(order);
    setCancelReason('');
    setCancelError('');
    setShowCancelModal(true);
    setShowCancelConfirmModal(false);
  };

  // Handle overlay click for cancel reason modal
  const handleOverlayClickReason = () => {
    if (!isTopmostModal()) return;

    if (clickCountReason === 0) {
      setClickCountReason(1);
      const timer = setTimeout(() => {
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCountReason(0);
      }, 800);
      setClickTimerReason(timer);
    } else if (clickCountReason === 1) {
      if (clickTimerReason) clearTimeout(clickTimerReason);
      setClickCountReason(0);
      closeCancelModals();
    }
  };

  // Handle overlay click for cancel confirm modal
  const handleOverlayClickConfirm = () => {
    if (!isTopmostModal()) return;

    if (clickCountConfirm === 0) {
      setClickCountConfirm(1);
      const timer = setTimeout(() => {
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCountConfirm(0);
      }, 800);
      setClickTimerConfirm(timer);
    } else if (clickCountConfirm === 1) {
      if (clickTimerConfirm) clearTimeout(clickTimerConfirm);
      setClickCountConfirm(0);
      closeCancelModals();
    }
  };

  const closeCancelModals = () => {
    setShowCancelModal(false);
    setShowCancelConfirmModal(false);
    setSelectedCancelOrder(null);
    setCancelReason('');
    setCancelError('');
    setCancelLoading(false);
  };

  const proceedToCancelConfirmation = () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a cancellation reason.');
      return;
    }
    setCancelError('');
    setShowCancelModal(false);
    setShowCancelConfirmModal(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedCancelOrder) return;

    try {
      setCancelLoading(true);
      setCancelError('');

      const response = await fetch(SummaryApi.cancelWorkOrder.url, {
        method: SummaryApi.cancelWorkOrder.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: selectedCancelOrder.customerId,
          orderId: selectedCancelOrder.orderId,
          reason: cancelReason.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to cancel work order');
      }

      const updatedOrders = workOrders.filter(order =>
        !(order.orderId === selectedCancelOrder.orderId && order.customerId === selectedCancelOrder.customerId)
      );

      setWorkOrders(updatedOrders);
      applyFilters(updatedOrders, categoryFilter);
      localStorage.setItem('workOrdersData', JSON.stringify(updatedOrders));
      closeCancelModals();
      await fetchFreshWorkOrders(true);
    } catch (error) {
      console.error('Error cancelling work order:', error);
      setCancelError(error.message || 'Server error. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };
  
  const handleAssignmentSuccess = (updatedOrder) => {
    // Remove the assigned order from the current list
    const updatedOrders = workOrders.filter(order => 
      !(order.orderId === updatedOrder.orderId && order.customerId === updatedOrder.customerId)
    );
    
    setWorkOrders(updatedOrders);
    
    // Apply filters again to update the filtered list
    applyFilters(updatedOrders, categoryFilter);
    
    // Update localStorage with the new orders list
    localStorage.setItem('workOrdersData', JSON.stringify(updatedOrders));
    
    // Close modal
    setShowAssignModal(false);
    
    // Fetch fresh data to ensure everything is up-to-date
    fetchFreshWorkOrders();
  };
  
  // Apply filters and search to the work orders
  const applyFilters = (ordersToFilter, category) => {
    let filtered = [...ordersToFilter];

    // Apply category filter
    if (category !== 'all') {
      if (category === 'installation') {
        filtered = filtered.filter(order =>
          order.projectCategory === 'New Installation' || !order.projectCategory
        );
      } else if (category === 'repair') {
        filtered = filtered.filter(order =>
          order.projectCategory === 'Repair'
        );
      }
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(order =>
        (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customerPhone && order.customerPhone.includes(searchQuery)) ||
        (order.orderId && order.orderId.includes(searchQuery)) ||
        (order.projectId && order.projectId.includes(searchQuery)) ||
        (order.projectType && order.projectType.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortField === 'dateCreated') {
      // Sort by creation date
      filtered.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
      });
    } else if (sortField === 'customerName') {
      // Sort by customer name
      filtered.sort((a, b) => {
        const nameA = (a.customerName || '').toLowerCase();
        const nameB = (b.customerName || '').toLowerCase();
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortField === 'companyName') {
      // Sort by company/firm name
      filtered.sort((a, b) => {
        const companyA = (a.customerFirmName || '').toLowerCase();
        const companyB = (b.customerFirmName || '').toLowerCase();
        const comparison = companyA.localeCompare(companyB);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredOrders(filtered);
  };
  
  // Handle filter change
  const handleFilterChange = (category) => {
    setCategoryFilter(category);
    applyFilters(workOrders, category);
  };
  
  // Handle search and sorting
  useEffect(() => {
    applyFilters(workOrders, categoryFilter);
  }, [searchQuery, workOrders, sortField, sortOrder]);

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

  // Handle sort selection
  const handleSortSelection = (field) => {
    if (sortField === field) {
      // Toggle order if same field selected
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default order
      setSortField(field);
      setSortOrder(field === 'dateCreated' ? 'desc' : 'asc');
    }
    setIsSortDropdownOpen(false);
  };
  
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
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="">
      {/* Main Container with White Box */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="pb-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Pending Work Orders</h1>

          <div className="flex items-center gap-3">
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
                      onClick={() => handleSortSelection('customerName')}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        sortField === 'customerName' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Customer Name</span>
                      {sortField === 'customerName' && (
                        sortOrder === 'asc' ? (
                          <LuArrowDownUp className="h-4 w-4" />
                        ) : (
                          <LuArrowUpDown className="h-4 w-4" />
                        )
                      )}
                    </button>
                    <button
                      onClick={() => handleSortSelection('companyName')}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        sortField === 'companyName' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Company Name</span>
                      {sortField === 'companyName' && (
                        sortOrder === 'asc' ? (
                          <LuArrowDownUp className="h-4 w-4" />
                        ) : (
                          <LuArrowUpDown className="h-4 w-4" />
                        )
                      )}
                    </button>
                    <button
                      onClick={() => handleSortSelection('dateCreated')}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        sortField === 'dateCreated' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Date Created</span>
                      {sortField === 'dateCreated' && (
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

            {/* Refresh Button */}
            <button
              onClick={() => fetchFreshWorkOrders()}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              title="Refresh Work Orders"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-1.5 rounded-full text-sm ${
                categoryFilter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('installation')}
              className={`px-4 py-1.5 rounded-full text-sm ${
                categoryFilter === 'installation' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              New Installations
            </button>
            <button
              onClick={() => handleFilterChange('repair')}
              className={`px-4 py-1.5 rounded-full text-sm ${
                categoryFilter === 'repair' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Complaints
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="py-2 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by customer name, phone, or order ID..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {error && (
          <div className="mx-4 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {/* Work Orders Table */}
        <div className="border-t">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECT TYPE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CREATED BY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE CREATED</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ENGINEER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <React.Fragment key={`${order.customerId}-${order.orderId}`}>
                      <tr
                        className={`cursor-pointer hover:bg-gray-50 ${
                          order.projectCategory === 'Repair'
                            ? 'bg-orange-50'
                            : 'bg-yellow-50'
                        }`}
                        onClick={() => handleRowClick(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                            order.projectCategory === 'Repair' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          {order.customerFirmName && (
                            <div className="text-xs text-gray-400">{order.customerFirmName}</div>
                          )}
                          {order.customerAddress && (
                            <div className="text-xs text-gray-400">{order.customerAddress}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {order.projectType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.projectCategory === 'Repair'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {order.projectCategory === 'Repair' ? 'Complaint' : 'New Installation'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.createdByName ? (
                            <div>
                              <div className="font-medium text-gray-900">{order.createdByName}</div>
                              {order.createdByRole && (
                                <div className={`text-xs ${
                                  order.createdByRole === 'admin' ? 'text-purple-600' : 'text-blue-600'
                                }`}>
                                  {order.createdByRole === 'admin' ? 'Admin' : 'Manager'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs capitalize bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="text-yellow-600">Not Assigned</span>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              {searchQuery && (
                <div>
                  <p className="text-gray-500 mb-4">
                    No pending work orders found matching "{searchQuery}"
                  </p>
                </div>
              )}
              {!searchQuery && categoryFilter !== 'all' && (
                <p className="text-gray-500">
                  No pending {categoryFilter === 'repair' ? 'complaints' : 'new installation work orders'} found.
                </p>
              )}
              {!searchQuery && categoryFilter === 'all' && (
                <p className="text-gray-500">
                  {workOrders.length > 0 ? 'No pending work orders found.' : 'No pending work orders found. Create a work order from the customer details page.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        workOrder={selectedOrder}
        onSuccess={handleAssignmentSuccess}
        canCancelWorkOrder={canCancelWorkOrder}
        onCancelClick={handleCancelClick}
      />

      {/* Cancel Work Order Reason Modal */}
      {canCancelWorkOrder && showCancelModal && selectedCancelOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleOverlayClickReason}>
          <div className="bg-white rounded-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Cancel Work Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancelling work order <strong>{selectedCancelOrder.orderId}</strong>.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason*
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Enter cancellation reason..."
            ></textarea>
            {cancelError && (
              <p className="text-sm text-red-600 mt-2">{cancelError}</p>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeCancelModals}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={proceedToCancelConfirmation}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Work Order Confirmation Modal */}
      {canCancelWorkOrder && showCancelConfirmModal && selectedCancelOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleOverlayClickConfirm}>
          <div className="bg-white rounded-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Confirm Cancellation</h3>
            <p className="mb-4 text-sm text-gray-700">
              {managerName}, are you sure you want to cancel work order{' '}
              <strong>{selectedCancelOrder.orderId}</strong> for {selectedCancelOrder.customerName}?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Reason: <span className="font-medium text-gray-800">{cancelReason}</span>
            </p>
            {cancelError && (
              <p className="text-sm text-red-600 mb-4">{cancelError}</p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeCancelModals}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={cancelLoading}
              >
                No
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className={`px-4 py-2 rounded-md text-white ${cancelLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersPage;
