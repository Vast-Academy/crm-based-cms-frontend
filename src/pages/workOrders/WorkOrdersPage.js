import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw, FiUserPlus, FiUser } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import AssignTechnicianModal from './AssignTechnicianModal';

const statusColors = {
  pending: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  assigned: 'bg-blue-100 border-blue-500 text-blue-800',
  'in-progress': 'bg-purple-100 border-purple-500 text-purple-800',
  completed: 'bg-green-100 border-green-500 text-green-800',
};

const WorkOrdersPage = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
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
      
      // Status filter
      if (filters.status !== 'all') {
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
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Work Orders</h1>
          <p className="text-gray-600">Manage all customer work orders</p>
        </div>
      </div>
      
      {/* Assign Technician Modal */}
      <AssignTechnicianModal 
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        workOrder={selectedOrder}
        onSuccess={handleAssignmentSuccess}
      />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by customer name, phone, or order ID..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="px-4 py-2 border rounded-md flex items-center hover:bg-gray-50"
            >
              <FiFilter className="mr-2" />
              Filter
            </button>
            
            <button
              onClick={fetchWorkOrders}
              className="px-4 py-2 border rounded-md flex items-center hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
          
          {showFilter && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <div>
                <div className="mb-2 font-medium">Status:</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFilters({...filters, status: 'all'})}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.status === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilters({...filters, status: 'pending'})}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilters({...filters, status: 'assigned'})}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.status === 'assigned' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Assigned
                  </button>
                  <button
                    onClick={() => setFilters({...filters, status: 'in-progress'})}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.status === 'in-progress' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setFilters({...filters, status: 'completed'})}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.status === 'completed' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <React.Fragment key={`${order.customerId}-${order.orderId}`}>
                    <tr 
                      className={`border-l-4 ${statusColors[order.status]} cursor-pointer hover:bg-gray-50`}
                      onClick={() => handleRowClick(`${order.customerId}-${order.orderId}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.orderId}</div>
                        <div className="text-sm text-gray-500">{order.projectId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
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
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status}
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
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Project details */}
                            <div>
                              <h4 className="font-semibold">Project Details:</h4>
                              <p className="mt-1 text-gray-600">{order.projectType} (ID: {order.projectId})</p>
                            </div>
                            
                            {/* Branch info if available */}
                            {order.branchName && (
                              <div>
                                <h4 className="font-semibold">Branch:</h4>
                                <p className="mt-1 text-gray-600">{order.branchName}</p>
                              </div>
                            )}
                            
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
                                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                  <FiUser className="mr-2 inline" />
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
                {workOrders.length > 0 ? 'Use the search bar to find work orders.' : 'No work orders found. Create a work order from the customer details page.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrdersPage;