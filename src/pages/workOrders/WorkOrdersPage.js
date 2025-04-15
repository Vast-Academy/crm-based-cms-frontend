import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiUserPlus, FiUser } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import AssignTechnicianModal from './AssignTechnicianModal';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  'pending-approval': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
};

const rowBackgroundColors = {
  pending: 'bg-yellow-50',
  assigned: 'bg-blue-50',
  'in-progress': 'bg-purple-50',
  'pending-approval': 'bg-orange-50',
  completed: 'bg-green-50',
};

const WorkOrdersPage = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all'
  });
  
  // State for assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Include branch parameter if admin has selected a branch
      let branchParam = '';
      if (user.role === 'admin' && user.selectedBranch) {
        branchParam = `?branch=${user.selectedBranch}`;
      }
      
      // Status filter for backend API - only if it's a standard status
      if (filters.status !== 'all' && filters.status !== 'pending-approval') {
        const statusParam = branchParam ? '&' : '?';
        branchParam += `${statusParam}status=${filters.status}`;
      }
      
      const response = await fetch(`${SummaryApi.getWorkOrders.url}${branchParam}`, {
        method: SummaryApi.getWorkOrders.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkOrders(data.data);
        applyFilters(data.data);
      } else {
        setError(data.message || 'Failed to fetch work orders');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching work orders:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchWorkOrders();
  }, [user.selectedBranch, filters.status]);
  
  const handleRowClick = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };
  
  const handleAssignTechnician = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };
  
  const handleAssignmentSuccess = (updatedOrder) => {
    // Update the order in the list
    setWorkOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.orderId === updatedOrder.orderId && order.customerId === updatedOrder.customerId) {
          return { ...order, ...updatedOrder };
        }
        return order;
      });
    });
    
    // Apply filters again
    applyFilters(workOrders);
    
    // Close modal
    setShowAssignModal(false);
  };
  
  // Apply filters to the work orders
  const applyFilters = (ordersToFilter) => {
    let filtered = ordersToFilter;
    
    // Filter by status
    if (filters.status !== 'all') {
      // Handle special case for "pending-approval"
      if (filters.status === 'pending-approval') {
        filtered = filtered.filter(order => order.status === 'pending-approval' || order.status === 'Pending-Approval');
      } else {
        filtered = filtered.filter(order => 
          order.status === filters.status || 
          order.status === filters.status.charAt(0).toUpperCase() + filters.status.slice(1)
        );
      }
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(order => 
        (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customerPhone && order.customerPhone.includes(searchQuery)) ||
        (order.orderId && order.orderId.includes(searchQuery)) ||
        (order.projectId && order.projectId.includes(searchQuery))
      );
    }
    
    setFilteredOrders(filtered);
  };
  
  // Handle search and filters
  useEffect(() => {
    applyFilters(workOrders);
  }, [searchQuery, workOrders]);
  
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
  
  // Helper function to normalize status for display
  const normalizeStatus = (status) => {
    if (!status) return '';
    
    // Handle special case for "pending-approval"
    if (status.toLowerCase() === 'pending-approval') {
      return 'Pending-Approval';
    }
    
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Helper function to get status color class
  const getStatusColorClass = (status) => {
    if (!status) return '';
    const normalizedStatus = status.toLowerCase().replace(' ', '-');
    return statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800';
  };
  
  // Helper function to get row background color
  const getRowBackgroundColor = (status) => {
    if (!status) return '';
    const normalizedStatus = status.toLowerCase().replace(' ', '-');
    return rowBackgroundColors[normalizedStatus] || 'bg-white';
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="">
      {/* Main Container with White Box */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-4 pt-4">
          <h1 className="text-2xl font-semibold text-gray-800">Work Orders</h1>
        </div>
        
        {/* Filter Tabs and Search */}
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs */}
            <button
              onClick={() => setFilters({...filters, status: 'all'})}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filters.status === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilters({...filters, status: 'pending'})}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filters.status === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilters({...filters, status: 'assigned'})}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filters.status === 'assigned' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              Assigned
            </button>
            <button
              onClick={() => setFilters({...filters, status: 'in-progress'})}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filters.status === 'in-progress' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilters({...filters, status: 'pending-approval'})}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filters.status === 'pending-approval' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              Pending-Approval
            </button>
            <button
              onClick={() => setFilters({...filters, status: 'completed'})}
              className={`px-4 py-1.5 rounded-full text-sm ${
                filters.status === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-100 text-green-800'
              }`}
            >
              Completed
            </button>
            
            {/* Search Bar */}
            <div className="relative flex-grow ml-auto">
              <input
                type="text"
                placeholder="Search by customer name, phone, or order ID..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE CREATED</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TECHNICIAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <React.Fragment key={`${order.customerId}-${order.orderId}`}>
                      <tr 
                        className={`cursor-pointer hover:bg-gray-50 ${expandedRow === `${order.customerId}-${order.orderId}` ? 'bg-gray-50' : getRowBackgroundColor(order.status)}`}
                        onClick={() => handleRowClick(`${order.customerId}-${order.orderId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-8 h-8 rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-500' :
                      order.status === 'assigned' ? 'bg-blue-500' :
                      order.status === 'in-progress' ? 'bg-purple-500' :
                      order.status === 'pending-approval' ? 'bg-orange-500' :
                      order.status === 'completed' ? 'bg-green-500' :
                      'bg-blue-500'
                    } flex items-center justify-center text-white font-medium`}>
                      {index + 1}
                    </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-xs text-gray-400">{order.orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800`}>
                            {order.projectType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColorClass(order.status)}`}>
                            {normalizeStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.technician ? (
                            <div>
                              {order.technician.firstName} {order.technician.lastName}
                            </div>
                          ) : (
                            <span className="text-yellow-600">Not Assigned</span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded row */}
                      {expandedRow === `${order.customerId}-${order.orderId}` && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50 border-b">
                            <div className="space-y-4">
                              {/* Project details */}
                              {/* <div>
                                <h4 className="font-semibold">Project Details:</h4>
                                <p className="mt-1 text-gray-600">{order.projectType} (ID: {order.projectId})</p>
                              </div> */}
                              
                              {/* Branch info if available */}
                              {/* {order.branchName && (
                                <div>
                                  <h4 className="font-semibold">Branch:</h4>
                                  <p className="mt-1 text-gray-600">{order.branchName}</p>
                                </div>
                              )} */}
                              
                              {/* Technical details / Remarks */}
                              {order.initialRemark && (
                                <div>
                                  <h4 className="font-semibold">Initial Requirements:</h4>
                                  <p className="mt-1 text-gray-600">{order.initialRemark}</p>
                                </div>
                              )}
                              
                              {/* Assignment details */}
                              {order.technician ? (
                                <div>
                                  <h4 className="font-semibold">Assignment Details:</h4>
                                  <p className="mt-1 text-gray-600">
                                    Assigned to {order.technician.firstName} {order.technician.lastName} 
                                    {order.assignedAt && ` on ${formatDate(order.assignedAt)}`}
                                    {order.assignedBy && ` by ${order.assignedBy.firstName} ${order.assignedBy.lastName}`}
                                  </p>
                                  
                                  {order.instructions && (
                                    <div className="mt-2">
                                      <h4 className="font-semibold">Instructions:</h4>
                                      <p className="mt-1 text-gray-600">{order.instructions}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssignTechnician(order);
                                    }}
                                    className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                                  >
                                    <FiUser className="mr-2" />
                                    Assign Technician
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
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
                    No work orders found matching "{searchQuery}"
                  </p>
                </div>
              )}
              {!searchQuery && (
                <p className="text-gray-500">
                  {workOrders.length > 0 ? 'No work orders match the selected filter.' : 'No work orders found. Create a work order from the customer details page.'}
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
      />
    </div>
  );
};

export default WorkOrdersPage;