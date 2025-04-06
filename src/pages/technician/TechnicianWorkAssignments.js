import React, { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiHome, FiClipboard } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';

const TechnicianWorkAssignments = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Fetch work orders assigned to the technician
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(SummaryApi.getTechnicianWorkOrders.url, {
          method: 'GET',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setWorkOrders(data.data);
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
    
    fetchWorkOrders();
  }, []);
  
  const handleRowClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Work Assignments</h1>
        <p className="text-gray-600">View all assigned customer work orders</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {workOrders.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No work orders assigned to you yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {workOrders.map(order => (
            <div 
              key={`${order.customerId}-${order.orderId}`}
              className="border-b last:border-b-0"
            >
              <div 
                className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                  order.status === 'assigned' ? 'border-blue-500' : 
                  order.status === 'in-progress' ? 'border-purple-500' : 'border-green-500'
                }`}
                onClick={() => handleRowClick(`${order.customerId}-${order.orderId}`)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-lg">{order.customerName}</h3>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.orderId} | Project: {order.projectType}
                    </p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
              
              {expandedOrder === `${order.customerId}-${order.orderId}` && (
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Customer Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FiUser className="mr-2 text-gray-500" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center">
                          <FiPhone className="mr-2 text-gray-500" />
                          <span>{order.customerPhone}</span>
                        </div>
                        {order.customerEmail && (
                          <div className="flex items-center">
                            <FiMail className="mr-2 text-gray-500" />
                            <span>{order.customerEmail}</span>
                          </div>
                        )}
                        {order.customerAddress && (
                          <div className="flex items-center">
                            <FiHome className="mr-2 text-gray-500" />
                            <span>{order.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Project Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Project Type:</span> {order.projectType}
                        </div>
                        <div>
                          <span className="font-medium">Project ID:</span> {order.projectId}
                        </div>
                        <div>
                          <span className="font-medium">Branch:</span> {order.branchName || 'N/A'}
                        </div>
                        {order.instructions && (
                          <div>
                            <span className="font-medium">Instructions:</span>
                            <div className="mt-1 p-3 bg-white border rounded">
                              {order.instructions}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    {order.status === 'assigned' && (
                      <button 
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                        onClick={async () => {
                          // Update status to in-progress
                          try {
                            const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                customerId: order.customerId,
                                orderId: order.orderId,
                                status: 'in-progress'
                              })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                              // Update local state
                              setWorkOrders(prev => 
                                prev.map(o => 
                                  o.orderId === order.orderId ? { ...o, status: 'in-progress' } : o
                                )
                              );
                            }
                          } catch (err) {
                            console.error('Error updating status:', err);
                          }
                        }}
                      >
                        Start Work
                      </button>
                    )}
                    
                    {order.status === 'in-progress' && (
                      <button 
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        onClick={async () => {
                          // Update status to completed
                          try {
                            const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                customerId: order.customerId,
                                orderId: order.orderId,
                                status: 'completed'
                              })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                              // Update local state
                              setWorkOrders(prev => 
                                prev.map(o => 
                                  o.orderId === order.orderId ? { ...o, status: 'completed' } : o
                                )
                              );
                            }
                          } catch (err) {
                            console.error('Error updating status:', err);
                          }
                        }}
                      >
                        Complete Work
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianWorkAssignments;