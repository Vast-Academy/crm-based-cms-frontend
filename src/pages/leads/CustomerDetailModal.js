import React, { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiMessageSquare, FiEdit2, FiClipboard, FiCalendar, FiDollarSign, FiFileText, FiUser, FiCheck, FiAlertCircle } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import WorkOrderModal from '../customers/WorkOrderModal';
import ComplaintModal from '../customers/ComplaintModal';
import ProjectDetailsModal from '../manager/ProjectDetailsModal';
import EditCustomerModal from './EditCustomerModal';
import CustomerBillingModal from './CustomerBillingModal';

const CustomerDetailModal = ({ isOpen, onClose, customerId, onCustomerUpdated }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [initialProjectCategory, setInitialProjectCategory] = useState('New Installation');
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
const [selectedProject, setSelectedProject] = useState(null);
const [expandedRow, setExpandedRow] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
const [showBillingModal, setShowBillingModal] = useState(false);

  // Bill history states
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'bills', 'payment'
  const [bills, setBills] = useState([]);
  const [billsSummary, setBillsSummary] = useState(null);
  const [loadingBills, setLoadingBills] = useState(false);
  
  // Payment states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const fetchCustomer = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${SummaryApi.getCustomer.url}/${customerId}`, {
        method: SummaryApi.getCustomer.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCustomer(data.data);
      } else {
        setError(data.message || 'Failed to fetch customer details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Project details देखने के लिए handler function
const handleViewProjectDetails = async (project) => {
  try {
    setLoading(true);
    
    // Fetch full project details
    const response = await fetch(`${SummaryApi.getWorkOrderDetails.url}/${customer._id}/${project.orderId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      setSelectedProject(data.data);
      setShowProjectDetailsModal(true);
    } else {
      console.error('API returned error:', data.message);
      // If API fails, use the basic project data we have
      setSelectedProject(project);
      setShowProjectDetailsModal(true);
    }
  } catch (err) {
    console.error('Error fetching project details:', err);
    // Fall back to basic project data
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  } finally {
    setLoading(false);
  }
};
  
  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomer();
      if (activeTab === 'bills') {
        fetchCustomerBills();
      }
    } else {
      // Reset state when modal closes
      setCustomer(null);
      setError(null);
    }
  }, [isOpen, customerId, activeTab]);

  const fetchCustomerBills = async () => {
    setLoadingBills(true);
    
    try {
      const response = await fetch(`${SummaryApi.getCustomerBills.url}/${customerId}`, {
        method: SummaryApi.getCustomerBills.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBills(data.data.bills);
        setBillsSummary(data.data.summary);
      } else {
        console.error('Failed to fetch customer bills:', data.message);
      }
    } catch (err) {
      console.error('Error fetching customer bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentAmount) > billsSummary.totalDue) {
      alert('Payment amount cannot exceed total due amount');
      return;
    }

    if (paymentMethod === 'online' && !transactionId.trim()) {
      alert('Transaction ID is required for online payments');
      return;
    }

    setProcessingPayment(true);
    
    try {
      const response = await fetch(SummaryApi.processCustomerBulkPayment.url, {
        method: SummaryApi.processCustomerBulkPayment.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: customerId,
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod,
          transactionId: paymentMethod === 'online' ? transactionId.trim() : undefined,
          notes: paymentNotes.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Payment of ₹${paymentAmount} processed successfully`);
        
        // Reset payment form
        setPaymentAmount('');
        setPaymentMethod('cash');
        setTransactionId('');
        setPaymentNotes('');
        setShowPaymentModal(false);
        
        // Refresh bills data
        fetchCustomerBills();
        
        // Switch to bills tab to show updated status
        setActiveTab('bills');
      } else {
        alert(data.message || 'Failed to process payment');
      }
    } catch (err) {
      alert('Server error while processing payment');
      console.error('Error processing payment:', err);
    } finally {
      setProcessingPayment(false);
    }
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

  const handleWorkOrderSuccess = (data) => {
    // Refresh customer data after adding new project/work order
    fetchCustomer();
    setShowWorkOrderModal(false);
    
    // Notify parent component of the update
    if (onCustomerUpdated) {
      onCustomerUpdated(data.customer);
    }
  };

  const handleComplaintSuccess = (data) => {
    // Refresh customer data after adding new complaint
    fetchCustomer();
    setShowComplaintModal(false);
    
    // Notify parent component of the update
    if (onCustomerUpdated) {
      onCustomerUpdated(data.customer);
    }
  };
  
  const handleNewComplaint = () => {
    // Check if customer has any projects
    if (customer?.projects?.length > 0) {
      setShowComplaintModal(true);
    } else {
      alert('Customer must have at least one project before filing a complaint');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Customer Details"
      size="xl"
    >
      {loading ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      ) : customer ? (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-purple-50 px-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-purple-700 hover:text-purple-800 hover:border-purple-300'
                }`}
              >
                Customer Details
              </button>
              <button
                onClick={() => setActiveTab('bills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bills'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-purple-700 hover:text-purple-800 hover:border-purple-300'
                }`}
              >
                Bill History
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-purple-700 hover:text-purple-800 hover:border-purple-300'
                }`}
              >
                Payment
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
          {/* Customer info panel */}
          <div className="lg:col-span-1 bg-white rounded-lg border overflow-hidden border-t-4 border-purple-500">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{customer.name}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    Added on {formatDate(customer.createdAt)}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  Customer
                </span>
              </div>
              
              {/* Contact info */}
              <div className="space-y-4 mt-6">
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Phone Number</div>
                    <div>{customer.phoneNumber}</div>
                  </div>
                </div>
                
                {customer.whatsappNumber && (
                  <div className="flex items-start">
                    <FiMessageSquare className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">WhatsApp</div>
                      <div>{customer.whatsappNumber}</div>
                    </div>
                  </div>
                )}
                
                {customer.firmName && (
                  <div className="flex items-start">
                    <FiMail className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Firm Name</div>
                      <div>{customer.firmName}</div>
                    </div>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">📍</div>
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div>{customer.address}</div>
                    </div>
                  </div>
                )}
                
                {/* {customer.age && (
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Age</div>
                      <div>{customer.age} years</div>
                    </div>
                  </div>
                )} */}
                
                {customer.branch && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">🏢</div>
                    <div>
                      <div className="text-sm text-gray-500">Branch</div>
                      <div>{customer.branch.name}</div>
                    </div>
                  </div>
                )}
                
                {customer.convertedFromLead && (
                  <div className="flex items-start">
                    <FiClipboard className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Origin</div>
                      <div>Converted from Lead</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 space-y-3">
              {user.role !== 'admin' && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Customer
                </button>
              )}
              </div>
            </div>
          </div>
          
          {/* Projects and Activity panel */}
          <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Work Orders & Complaints</h2>
                
                {user.role !== 'admin' && (
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    onClick={handleNewComplaint}
                  >
                    New Complaint
                  </button>
                  
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    onClick={() => setShowWorkOrderModal(true)}
                  >
                    New Project
                  </button>
                  
                  {user.role === 'manager' && (
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      onClick={() => setShowBillingModal(true)}
                    >
                      <FiDollarSign className="mr-1" size={16} />
                      New Bill
                    </button>
                  )}
                </div>
                )}
              </div>
              
              {/* Work Order/Complaint Status */}
              {(() => {
                // Combine work orders and completed projects for display
                const allItems = [];
                
                // Add work orders
                if (customer.workOrders && customer.workOrders.length > 0) {
                  customer.workOrders.forEach(order => {
                    allItems.push({
                      ...order,
                      type: 'workOrder',
                      displayType: order.projectCategory === 'Repair' ? 'Complaint' : 'New Installation'
                    });
                  });
                }
                
                // Add completed projects (especially for existing customers)
                if (customer.projects && customer.projects.length > 0) {
                  customer.projects.forEach(project => {
                    // Always show completed projects in history
                    if (project.status === 'completed') {
                      allItems.push({
                        ...project,
                        type: 'completedProject',
                        displayType: 'Completed Project',
                        status: 'completed',
                        orderId: null, // No order ID for completed projects
                        isHistorical: true // Mark as historical entry
                      });
                    }
                  });
                }
                
                // Sort items: completed projects first (historical), then workOrders by date
                allItems.sort((a, b) => {
                  // Completed projects (historical) should appear first
                  if (a.type === 'completedProject' && b.type === 'workOrder') return -1;
                  if (a.type === 'workOrder' && b.type === 'completedProject') return 1;
                  
                  // Within same type, sort by date
                  return new Date(a.createdAt) - new Date(b.createdAt);
                });
                
                return allItems.length > 0 ? (
  <div className="mb-6 max-h-[400px] overflow-y-auto">
    <div className="overflow-visible">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sr.No
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project Type
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {allItems.map((item, index) => (
              <React.Fragment key={index}>
            <tr 
            onClick={() => setExpandedRow(expandedRow === (item._id || item.projectId) ? null : (item._id || item.projectId))}
            className={`hover:bg-gray-50 cursor-pointer ${
              expandedRow === (item._id || item.projectId) ? 'bg-gray-50' : ''
            } ${item.isHistorical ? 'bg-purple-25 border-l-4 border-purple-400' : ''}`}
            >
              <td className="px-2 py-3 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                <div style={{ width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.projectType}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.type === 'completedProject'
                              ? 'bg-purple-100 text-purple-800'
                              : item.projectCategory === 'Repair' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {item.displayType}
                          </span>
                        </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              <div style={{ width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {formatDate(item.createdAt)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </td>
            </tr>
            {/* Expanded row with buttons */}
            {expandedRow === (item._id || item.projectId) && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex space-x-3">
                      {item.type === 'workOrder' ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProjectDetails(item);
                          }}
                          className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                        >
                          View Details
                        </button>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p><strong>Installed by:</strong> {item.installedBy}</p>
                          <p><strong>Completion Date:</strong> {item.completionDate ? formatDate(item.completionDate) : 'N/A'}</p>
                          {item.initialRemark && <p><strong>Remarks:</strong> {item.initialRemark}</p>}
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
  </div>
                ) : (
                  <div className="mb-6 p-6 text-center border rounded-md bg-gray-50">
                    <p className="text-gray-500">No Project and Complaints found for this customer.</p>
                  </div>
                );
              })()}
              
              {/* Lead History */}
              {customer.convertedFromLead && customer.leadId && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Lead History</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {customer.leadId.remarks && customer.leadId.remarks.length > 0 ? (
                      <div className="space-y-3">
                        {customer.leadId.remarks.map((remark, index) => (
                          <div 
                            key={index} 
                            className="p-3 border-l-4 rounded-md bg-white"
                            style={{
                              borderColor: 
                                remark.status === 'positive' ? '#10B981' : 
                                remark.status === 'negative' ? '#EF4444' : 
                                '#9CA3AF'
                            }}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-sm capitalize">{remark.status}</span>
                              <span className="text-sm text-gray-500">{formatDate(remark.createdAt)}</span>
                            </div>
                            <p className="text-gray-700">{remark.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No lead history available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className="p-6">
              {loadingBills ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : billsSummary ? (
                <>
                  {/* Bills Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-2">Total Bills</h4>
                      <p className="text-2xl font-bold text-purple-600">{billsSummary.totalBills}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Total Amount</h4>
                      <p className="text-2xl font-bold text-blue-600">₹{billsSummary.totalAmount}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Paid Amount</h4>
                      <p className="text-2xl font-bold text-green-600">₹{billsSummary.totalPaid}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Due Amount</h4>
                      <p className="text-2xl font-bold text-red-600">₹{billsSummary.totalDue}</p>
                    </div>
                  </div>

                  {/* Bills List */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FiFileText className="mr-2 text-purple-500" />
                      Bills History
                    </h4>
                    
                    {bills && bills.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {bills.map((bill, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-purple-100">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold text-gray-900">{bill.billNumber}</h5>
                                <p className="text-sm text-gray-600">{formatDate(bill.createdAt)}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                bill.paymentStatus === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : bill.paymentStatus === 'partial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {bill.paymentStatus === 'completed' ? 'Paid' : 
                                 bill.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                              </span>
                            </div>
                            
                            {/* Bill Items */}
                            <div className="mb-3">
                              <h6 className="text-sm font-medium text-gray-700 mb-2">Items:</h6>
                              <div className="space-y-1">
                                {bill.items.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between text-sm text-gray-600">
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-800">{item.itemName}</span>
                                      <span className="text-gray-500"> × {item.quantity}</span>
                                      <span className="text-xs text-gray-500 ml-2">@ ₹{item.unitPrice}</span>
                                    </div>
                                    <span className="font-semibold text-gray-800">₹{item.totalPrice}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Bill Amounts */}
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                              <div>
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="font-semibold text-gray-900">₹{bill.total}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Paid Amount</p>
                                <p className="font-semibold text-green-600">₹{bill.paidAmount}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Due Amount</p>
                                <p className="font-semibold text-red-600">₹{bill.dueAmount}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">No bills found</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-gray-500">Click on Bills tab to load bill history</p>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="p-6">
              {billsSummary && billsSummary.totalDue > 0 ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-4 flex items-center">
                      <FiDollarSign className="mr-2 text-purple-500" />
                      Process Payment
                    </h4>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Total Due Amount</p>
                      <p className="text-2xl font-bold text-red-600">₹{billsSummary.totalDue}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {billsSummary.pendingBillsCount} pending bill(s)
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Amount
                        </label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount..."
                          max={billsSummary.totalDue}
                          className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3"
                        >
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                      
                      {paymentMethod === 'online' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction ID
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter transaction ID..."
                            className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="Enter payment notes..."
                          rows={3}
                          className="w-full rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition p-3 resize-none"
                        />
                      </div>
                      
                      <button
                        onClick={handleProcessPayment}
                        disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        {processingPayment ? 'Processing...' : 'Process Payment'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="text-green-600" size={24} />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Pending Payments</h4>
                  <p className="text-gray-600">All bills have been paid in full</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="p-6 text-center text-gray-500">
          Customer not found
        </div>
      )}
      
      {/* Work Order Modal */}
      <WorkOrderModal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        customerId={customerId}
        initialProjectCategory="New Installation"
        onSuccess={handleWorkOrderSuccess}
      />
      
      {/* Complaint Modal - new component */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        customerId={customerId}
        onSuccess={handleComplaintSuccess}
      />

      {showProjectDetailsModal && selectedProject && (
        <ProjectDetailsModal 
          isOpen={showProjectDetailsModal}
          onClose={() => {
            setShowProjectDetailsModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectApproved={(updatedProject) => {
            // If project is approved, refresh customer data
            fetchCustomer();
            setShowProjectDetailsModal(false);
          }}
        />
      )}

      {showEditModal && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          customerId={customerId}
          onSuccess={(updatedCustomer) => {
            fetchCustomer();
            setShowEditModal(false);
            onCustomerUpdated && onCustomerUpdated(updatedCustomer);
          }}
        />
      )}

    </Modal>

    {/* Customer Billing Modal - Outside main modal for proper z-index */}
    <CustomerBillingModal
      isOpen={showBillingModal}
      onClose={() => setShowBillingModal(false)}
      customer={customer}
      onBillCreated={(bill) => {
        setShowBillingModal(false);
        // Could refresh customer data here if needed
        fetchCustomer();
      }}
    />
    </>
  );
};

export default CustomerDetailModal;
