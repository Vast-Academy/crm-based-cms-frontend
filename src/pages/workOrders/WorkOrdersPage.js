import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import AssignTechnicianModal from './AssignTechnicianModal';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
};

const rowBackgroundColors = {
  pending: 'bg-yellow-50',
};

const WorkOrdersPage = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  
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
        applySearch(pendingOrders);
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
  }, [user.selectedBranch]);
  
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
      return prevOrders.filter(order => 
        !(order.orderId === updatedOrder.orderId && order.customerId === updatedOrder.customerId)
      );
    });
    
    // Apply search again
    applySearch(workOrders);
    
    // Close modal
    setShowAssignModal(false);
  };
  
  // Apply search to the work orders
  const applySearch = (ordersToFilter) => {
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
  
  // Handle search
  useEffect(() => {
    applySearch(workOrders);
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
    <div className="">
      {/* Main Container with White Box */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="">
          <h1 className="text-2xl font-semibold text-gray-800">Pending Work Orders</h1>
        </div>
        
        {/* Search Bar Only */}
        <div className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
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
                        className={`cursor-pointer hover:bg-gray-50 ${expandedRow === `${order.customerId}-${order.orderId}` ? 'bg-gray-50' : 'bg-yellow-50'}`}
                        onClick={() => handleRowClick(`${order.customerId}-${order.orderId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-xs text-gray-400">{order.orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {order.projectType}
                          </span>
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
                      
                      {/* Expanded row */}
                      {expandedRow === `${order.customerId}-${order.orderId}` && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50 border-b">
                            <div className="space-y-4">
                              {/* Technical details / Remarks */}
                              {order.initialRemark && (
                                <div>
                                  <h4 className="font-semibold">Initial Requirements:</h4>
                                  <p className="mt-1 text-gray-600">{order.initialRemark}</p>
                                </div>
                              )}
                              
                              {/* Assignment button */}
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
                    No pending work orders found matching "{searchQuery}"
                  </p>
                </div>
              )}
              {!searchQuery && (
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
      />
    </div>
  );
};

export default WorkOrdersPage;