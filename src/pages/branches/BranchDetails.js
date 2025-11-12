import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiLoader, FiMail, FiPhone, FiUserCheck } from 'react-icons/fi';
import { Building, Package, Users, Clipboard, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import SummaryApi from '../../common';
import LeadDetailModal from '../leads/LeadDetail';
import CustomerDetailModal from '../leads/CustomerDetailModal';
import DealerDetailModal from '../leads/DealerDetailModal';
import DistributorDetailModal from '../leads/DistributorDetailModal';
import { useAuth } from '../../context/AuthContext';

const BranchDetails = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [showDealerDetailModal, setShowDealerDetailModal] = useState(false);
  const [showDistributorDetailModal, setShowDistributorDetailModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedDealerId, setSelectedDealerId] = useState(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState(null);
  // Add this to your state declarations
const [technicianPerformance, setTechnicianPerformance] = useState([]);
const [technicianTotals, setTechnicianTotals] = useState({
  assigned: 0,
  inProgress: 0,
  pendingApproval: 0,
  completed: 0,
  transferring: 0,
  transferred: 0
});

  // Performance metrics
  const [branchPerformance, setBranchPerformance] = useState({
    leads: 0,
    customers: 0,
    stock: 0,
    technicians: 0,
    workOrders: 0,
    assigned: 0
  });

  useEffect(() => {
    fetchBranchData();
  }, [branchId]);

  const fetchBranchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all branches and filter to get the current one
      const branchResponse = await fetch(SummaryApi.getBranches.url, {
        method: SummaryApi.getBranches.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const branchData = await branchResponse.json();
      
      if (!branchData.success) {
        throw new Error(branchData.message || 'Failed to fetch branch details');
      }
      
      // Find the branch with matching ID
      const currentBranch = branchData.data.find(b => b._id === branchId);
      
      if (!currentBranch) {
        throw new Error('Branch not found');
      }
      
      setBranch(currentBranch);
      
      // Get branch manager
      try {
        const managersResponse = await fetch(SummaryApi.getManagerUsers.url, {
          method: SummaryApi.getManagerUsers.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const managersData = await managersResponse.json();
        
        if (managersData.success) {
          const branchManager = managersData.data.find(m => 
            m.branch && m.branch._id === branchId && m.status === 'active'
          );
          
          if (branchManager) {
            setManager(branchManager);
          }
        }
      } catch (err) {
        console.error('Error fetching branch manager:', err);
      }
      
      // Fetch branch performance metrics
      fetchBranchPerformance(branchId);
      
    } catch (err) {
      setError(err.message || 'Server error. Please try again later.');
      console.error('Error fetching branch details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBranchPerformance = async (branchId) => {
    try {
      // 1. Fetch leads count
      try {
        const leadsResponse = await fetch(`${SummaryApi.getAllLeads.url}?branch=${branchId}`, {
          method: 'GET',
          credentials: 'include',
        });
        
        const leadsData = await leadsResponse.json();
        
        if (leadsData.success) {
          setBranchPerformance(prev => ({
            ...prev,
            leads: leadsData.data?.length || 0
          }));
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
      
      // 2. Fetch customers count
      try {
        const customersResponse = await fetch(`${SummaryApi.getAllCustomers.url}?branch=${branchId}`, {
          method: 'GET',
          credentials: 'include',
        });
        
        const customersData = await customersResponse.json();
        
        if (customersData.success) {
          setBranchPerformance(prev => ({
            ...prev,
            customers: customersData.data?.length || 0
          }));
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
      
      // 3. Fetch stock count (all types combined)
      try {
        const [serializedResponse, genericResponse] = await Promise.all([
          fetch(`${SummaryApi.getInventoryByType.url}/serialized-product?branch=${branchId}`, {
            method: 'GET',
            credentials: 'include',
          }),
          fetch(`${SummaryApi.getInventoryByType.url}/generic-product?branch=${branchId}`, {
            method: 'GET',
            credentials: 'include',
          })
        ]);
        
        const [serializedData, genericData] = await Promise.all([
          serializedResponse.json(),
          genericResponse.json()
        ]);
        
        let stockCount = 0;
        
        if (serializedData.success) {
          stockCount += serializedData.items.reduce((total, item) => 
            total + (item.stock?.length || 0), 0);
        }
        
        if (genericData.success) {
          stockCount += genericData.items.reduce((total, item) => 
            total + (item.stock?.reduce((sum, stock) => sum + parseInt(stock.quantity || 0, 10), 0) || 0), 0);
        }
        
        setBranchPerformance(prev => ({
          ...prev,
          stock: stockCount
        }));
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }
      
      // 4. Fetch technicians count
      try {
        const techniciansResponse = await fetch(`${SummaryApi.getManagerTechnician.url}?branch=${branchId}`, {
          method: 'GET',
          credentials: 'include',
        });
        
        const techniciansData = await techniciansResponse.json();
        
        if (techniciansData.success) {
          // Apply the same filtering - be consistent with active status
          const activeTechnicians = techniciansData.data.filter(
            tech => tech.status === 'active'
          );
          
          // Update the state instead of returning the value
    setBranchPerformance(prev => ({
        ...prev,
        technicians: activeTechnicians.length
      }));
    }
  } catch (err) {
    console.error('Error fetching technicians:', err);
  }
      
      // 5. Fetch pending work orders count
      try {
        const workOrdersResponse = await fetch(`${SummaryApi.getWorkOrders.url}?branch=${branchId}&status=pending`, {
          method: 'GET',
          credentials: 'include',
        });
        
        const workOrdersData = await workOrdersResponse.json();
        
        if (workOrdersData.success) {
          // Filter to only include orders with no technician assigned
          const pendingWorkOrders = workOrdersData.data.filter(order => 
            (order.status === 'pending' || order.status === 'Pending') && 
            (!order.technician || 
             (typeof order.technician === 'object' && !order.technician.firstName && !order.technician.lastName) ||
             (typeof order.technician === 'string' && order.technician.trim() === ''))
          );
          
          setBranchPerformance(prev => ({
            ...prev,
            workOrders: pendingWorkOrders.length
          }));
        }
      } catch (err) {
        console.error('Error fetching work orders:', err);
      }
      
      // 6. Fetch assigned projects count
      try {
        const projectsResponse = await fetch(`${SummaryApi.getManagerProjects.url}?branch=${branchId}`, {
          method: 'GET',
          credentials: 'include',
        });
        
        const projectsData = await projectsResponse.json();
        
        if (projectsData.success) {
          const assignedProjects = projectsData.data.filter(project => 
            ['assigned', 'in-progress'].includes(project.status)
          );
          
          setBranchPerformance(prev => ({
            ...prev,
            assigned: assignedProjects.length
          }));
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
      
    } catch (err) {
      console.error('Error fetching branch performance:', err);
    }
  };

  // Add this function to fetch recent contacts
const fetchRecentContacts = async (branchId) => {
    try {
      // Fetch all 4 types of contacts
      const leadsResponse = await fetch(`${SummaryApi.getAllLeads.url}?branch=${branchId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const customersResponse = await fetch(`${SummaryApi.getAllCustomers.url}?branch=${branchId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const dealersResponse = await fetch(`${SummaryApi.getAllDealers.url}?branch=${branchId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const distributorsResponse = await fetch(`${SummaryApi.getAllDistributors.url}?branch=${branchId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const [leadsData, customersData, dealersData, distributorsData] = await Promise.all([
        leadsResponse.json(),
        customersResponse.json(),
        dealersResponse.json(),
        distributorsResponse.json()
      ]);

      // Process leads
      const processedLeads = leadsData.success
        ? leadsData.data.map(lead => ({
            ...lead,
            contactType: 'lead'
          }))
        : [];

      // Process customers
      const processedCustomers = customersData.success
        ? customersData.data.map(customer => ({
            ...customer,
            contactType: 'customer',
            status: 'positive' // Customers are always marked as positive
          }))
        : [];

      // Process dealers
      const processedDealers = dealersData.success
        ? dealersData.data.map(dealer => ({
            ...dealer,
            contactType: 'dealer'
          }))
        : [];

      // Process distributors
      const processedDistributors = distributorsData.success
        ? distributorsData.data.map(distributor => ({
            ...distributor,
            contactType: 'distributor'
          }))
        : [];

      // Combine all contacts and sort by most recently updated or created
      const combinedContacts = [...processedLeads, ...processedCustomers, ...processedDealers, ...processedDistributors];
      combinedContacts.sort((a, b) => {
        const aDate = a.updatedAt || a.createdAt;
        const bDate = b.updatedAt || b.createdAt;
        return new Date(bDate) - new Date(aDate);
      });

      // Take only the 6 most recent contacts
      const recentSix = combinedContacts.slice(0, 6);
      setRecentContacts(recentSix);

    } catch (err) {
      console.error('Error fetching recent contacts:', err);
    }
  };

  // Add this function after fetchBranchPerformance
const fetchTechnicianPerformance = async (branchId) => {
  if (!branchId) return;
  
  try {
    // Fetch technicians in this branch
    const techResponse = await fetch(`${SummaryApi.getManagerTechnician.url}?branch=${branchId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const techData = await techResponse.json();
    
    if (techData.success && techData.data.length > 0) {
      const technicians = techData.data;
      
      // For each technician, fetch their projects
      const technicianWithProjects = await Promise.all(
        technicians.map(async (tech) => {
          try {
            const projectsResponse = await fetch(`${SummaryApi.getTechnicianProjects.url}/${tech._id}`, {
              method: 'GET',
              credentials: 'include'
            });
            
            const projectsData = await projectsResponse.json();
            
            if (projectsData.success) {
              const projects = projectsData.data || [];
              
              // Count projects by status
              const assigned = projects.filter(p => p.status === 'assigned').length;
              const inProgress = projects.filter(p => p.status === 'in-progress').length;
              const pendingApproval = projects.filter(p => p.status === 'pending-approval').length;
              const completed = projects.filter(p => p.status === 'completed').length;
              const transferring = projects.filter(p => p.status === 'transferring').length;
              const transferred = projects.filter(p => p.status === 'transferred').length;
              
              return {
                ...tech,
                performance: {
                  assigned,
                  inProgress,
                  pendingApproval,
                  completed,
                  transferring,
                  transferred
                }
              };
            }
            
            return {
              ...tech,
              performance: {
                assigned: 0,
                inProgress: 0,
                pendingApproval: 0,
                completed: 0,
                transferring: 0,
                transferred: 0
              }
            };
          } catch (err) {
            console.error(`Error fetching projects for technician ${tech._id}:`, err);
            return {
              ...tech,
              performance: {
                assigned: 0,
                inProgress: 0,
                pendingApproval: 0,
                completed: 0,
                transferring: 0,
                transferred: 0
              }
            };
          }
        })
      );
      
      setTechnicianPerformance(technicianWithProjects);
      
      // Calculate totals
      const totals = technicianWithProjects.reduce(
        (acc, tech) => {
          return {
            assigned: acc.assigned + tech.performance.assigned,
            inProgress: acc.inProgress + tech.performance.inProgress,
            pendingApproval: acc.pendingApproval + tech.performance.pendingApproval,
            completed: acc.completed + tech.performance.completed,
            transferring: acc.transferring + tech.performance.transferring,
            transferred: acc.transferred + tech.performance.transferred
          };
        },
        {
          assigned: 0,
          inProgress: 0,
          pendingApproval: 0,
          completed: 0,
          transferring: 0,
          transferred: 0
        }
      );
      
      setTechnicianTotals(totals);
    }
  } catch (err) {
    console.error('Error fetching technician performance:', err);
  }
};

  useEffect(() => {
    if (branchId) {
      fetchBranchData();
      fetchRecentContacts(branchId);
      fetchTechnicianPerformance(branchId);
    }
  }, [branchId]);

  // Add this helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Format as "Month DD, YYYY HH:MM AM/PM"
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString(undefined, options);
  };
  
  // Handle row click to expand/collapse
  const handleRowClick = (contactId) => {
    if (expandedContactId === contactId) {
      setExpandedContactId(null);
    } else {
      setExpandedContactId(contactId);
    }
  };

  // Add handlers for lead and customer updates
const handleLeadUpdated = (updatedLead) => {
    // Refresh data after lead update
    fetchRecentContacts(branchId);
    setShowLeadDetailModal(false);
  };
  
  const handleLeadConverted = (leadId, newCustomer) => {
    // Refresh data after lead conversion
    fetchRecentContacts(branchId);
    fetchBranchPerformance(branchId);
    setShowLeadDetailModal(false);
  };
  
  const handleCustomerUpdated = (updatedCustomer) => {
    // Refresh data after customer update  
    fetchRecentContacts(branchId);
    setShowCustomerDetailModal(false);
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-md">
        <p className="font-medium text-lg mb-2">Error</p>
        <p>{error || 'Branch not found'}</p>
        <button 
          onClick={() => navigate('/branches')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Back to Branches
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Branch Details</h1>
      
      {/* Branch details card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
  <div className="flex flex-col md:flex-row gap-6">
    {/* Left side - Branch info in its own box */}
    <div className="md:w-1/3">
      <div className="bg-gray-50 rounded-lg shadow p-5 cursor-pointer hover:bg-gray-100
       transition-colors duration-200"
       onClick={() => navigate(`/users/managers/${manager._id}`)}>
        <div className="flex items-start">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-semibold mr-4">
            {branch.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{branch.name}</h2>
            <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
              <Building size={18}/>
              {branch.location || 'No location specified'}
            </div>
            {branch.createdBy && (
              <div className="text-xs text-gray-500 mt-2">
                Created by: {branch.createdBy.firstName} {branch.createdBy.lastName}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium text-gray-700 mb-3">Branch Manager</h3>
          
          {manager ? (
            <div 
            >
              <div className="font-medium text-gray-800">Manager: {manager.firstName} {manager.lastName}</div>
              <div className="flex items-center mt-2">
                <FiMail className="text-gray-500 mr-2" />
                <a 
                  href={`mailto:${manager.email}`} 
                  className="text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {manager.email}
                </a>
              </div>
              {manager.phone && (
                <div className="flex items-center mt-2">
                  <FiPhone className="text-gray-500 mr-2" />
                  <span>{manager.phone}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No manager assigned</div>
          )}
        </div>
      </div>
    </div>
          
          {/* Right side - Branch Performance */}
          <div className="md:w-2/3 mt-6 md:mt-0">
            <h3 className="font-medium text-gray-700 mb-4">Branch Performance</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div
                className="bg-blue-50 p-3 rounded-md cursor-pointer hover:bg-blue-100"
                onClick={() => navigate(`/contacts?branch=${branchId}`)}
              >
                <div className="text-sm text-gray-600 mb-1">Leads</div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-xl font-bold">{branchPerformance.leads}</span>
                </div>
              </div>
              
              <div
                className="bg-green-50 p-3 rounded-md cursor-pointer hover:bg-green-100"
                onClick={() => navigate(`/contacts?branch=${branchId}`)}
              >
                <div className="text-sm text-gray-600 mb-1">Customers</div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  <span className="text-xl font-bold">{branchPerformance.customers}</span>
                </div>
              </div>
              
              <div
                className="bg-purple-50 p-3 rounded-md cursor-pointer hover:bg-purple-100"
                onClick={() => navigate(`/inventory?branch=${branchId}`)}
              >
                <div className="text-sm text-gray-600 mb-1">Stock</div>
                <div className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-xl font-bold">{branchPerformance.stock}</span>
                </div>
              </div>
              
              <div
                className="bg-orange-50 p-3 rounded-md hover:bg-orange-100"

              >
                <div className="text-sm text-gray-600 mb-1">Technicians</div>
                <div className="flex items-center">
                  <FiUserCheck className="w-5 h-5 mr-2 text-orange-600" />
                  <span className="text-xl font-bold">{branchPerformance.technicians}</span>
                </div>
              </div>
              
              <div
                className="bg-yellow-50 p-3 rounded-md cursor-pointer hover:bg-yellow-100"
                onClick={() => navigate(`/work-orders?branch=${branchId}`)}
              >
                <div className="text-sm text-gray-600 mb-1">Work Orders</div>
                <div className="flex items-center">
                  <Clipboard className="w-5 h-5 mr-2 text-yellow-600" />
                  <span className="text-xl font-bold">{branchPerformance.workOrders}</span>
                </div>
              </div>
              
              <div
                className="bg-indigo-50 p-3 rounded-md cursor-pointer hover:bg-indigo-100"
                onClick={() => navigate(`/manager-dashboard?branch=${branchId}`)}
              >
                <div className="text-sm text-gray-600 mb-1">Assigned</div>
                <div className="flex items-center">
                  <ClipboardCheck className="w-5 h-5 mr-2 text-indigo-600" />
                  <span className="text-xl font-bold">{branchPerformance.assigned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional sections could be added here as needed */}
      {/* Contacts Overview Section */}
<div className="mt-8 bg-white rounded-lg shadow-md p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-800">Contacts Overview</h2>
    <Link
      to={`/contacts?branch=${branchId}`}
      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
    >
      View All
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </Link>
  </div>
  
  {recentContacts.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE ADDED</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {recentContacts.map((contact, index) => {
            // Determine badge color and serial number color based on contact type
            let badgeClasses = '';
            let typeLabel = '';
            let serialBgColor = '';
            let hoverBgColor = '';
            let rowBgColor = '';

            switch(contact.contactType) {
              case 'lead':
                badgeClasses = 'bg-blue-100 text-blue-800';
                typeLabel = 'Lead';
                serialBgColor = 'bg-blue-500';
                hoverBgColor = 'hover:bg-blue-50/50';
                rowBgColor = 'bg-blue-50/20';
                break;
              case 'customer':
                badgeClasses = 'bg-purple-100 text-purple-800';
                typeLabel = 'Customer';
                serialBgColor = 'bg-purple-500';
                hoverBgColor = 'hover:bg-purple-50/50';
                rowBgColor = 'bg-purple-50/20';
                break;
              case 'dealer':
                badgeClasses = 'bg-orange-100 text-orange-800';
                typeLabel = 'Dealer';
                serialBgColor = 'bg-orange-500';
                hoverBgColor = 'hover:bg-orange-50/50';
                rowBgColor = 'bg-orange-50/20';
                break;
              case 'distributor':
                badgeClasses = 'bg-teal-100 text-teal-800';
                typeLabel = 'Distributor';
                serialBgColor = 'bg-teal-500';
                hoverBgColor = 'hover:bg-teal-50/50';
                rowBgColor = 'bg-teal-50/20';
                break;
              default:
                badgeClasses = 'bg-gray-100 text-gray-800';
                typeLabel = 'Unknown';
                serialBgColor = 'bg-gray-500';
                hoverBgColor = 'hover:bg-gray-50';
                rowBgColor = 'bg-gray-50/20';
            }

            return (
              <tr
                key={`${contact.contactType}-${contact._id}`}
                className={`cursor-pointer ${hoverBgColor} ${rowBgColor} transition-colors`}
                onClick={() => {
                  // Directly open the appropriate modal based on contact type
                  if (contact.contactType === 'lead') {
                    setSelectedLeadId(contact._id);
                    setShowLeadDetailModal(true);
                  } else if (contact.contactType === 'customer') {
                    setSelectedCustomerId(contact._id);
                    setShowCustomerDetailModal(true);
                  } else if (contact.contactType === 'dealer') {
                    setSelectedDealerId(contact._id);
                    setShowDealerDetailModal(true);
                  } else if (contact.contactType === 'distributor') {
                    setSelectedDistributorId(contact._id);
                    setShowDistributorDetailModal(true);
                  }
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`w-8 h-8 rounded-full ${serialBgColor} flex items-center justify-center text-white font-medium`}>
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.name}
                  {contact.firmName && <div className="text-xs text-gray-500">{contact.firmName}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.phoneNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                    {typeLabel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(contact.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="py-8 text-center text-gray-500">
      No contacts found for this branch.
    </div>
  )}
</div>

{/* Technicians Overview Section */}
<div className="mt-8 bg-white rounded-lg shadow-md p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-800">Technicians Overview</h2>
    <Link 
      to={`/users/technicians?branch=${branchId}`} 
      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
    >
      View All
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </Link>
  </div>
  
  {technicianPerformance.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      No technicians found for this branch.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase " 
            >
              In Progress
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Pending Approval
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Completed
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transferring
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transferred
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {technicianPerformance.map((tech) => (
            <tr key={tech._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  {tech.firstName} {tech.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tech.performance.assigned}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tech.performance.inProgress}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tech.performance.pendingApproval}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tech.performance.completed}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tech.performance.transferring}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {tech.performance.transferred}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tech.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tech.status}
                </span>
              </td>
            </tr>
          ))}
          
          {/* Totals row */}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-6 py-4 whitespace-nowrap">
              Total
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {technicianTotals.assigned}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {technicianTotals.inProgress}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {technicianTotals.pendingApproval}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {technicianTotals.completed}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {technicianTotals.transferring}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {technicianTotals.transferred}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {/* Leave this cell empty for the status column in the totals row */}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )}
</div>

{/* Modal components */}
<LeadDetailModal
  isOpen={showLeadDetailModal}
  onClose={() => setShowLeadDetailModal(false)}
  leadId={selectedLeadId}
  onLeadUpdated={handleLeadUpdated}
  onConvertSuccess={handleLeadConverted}
/>

<CustomerDetailModal
  isOpen={showCustomerDetailModal}
  onClose={() => setShowCustomerDetailModal(false)}
  customerId={selectedCustomerId}
  onCustomerUpdated={handleCustomerUpdated}
/>

<DealerDetailModal
  isOpen={showDealerDetailModal}
  onClose={() => setShowDealerDetailModal(false)}
  dealerId={selectedDealerId}
  onDealerUpdated={() => {
    fetchRecentContacts(branchId);
    setShowDealerDetailModal(false);
  }}
/>

<DistributorDetailModal
  isOpen={showDistributorDetailModal}
  onClose={() => setShowDistributorDetailModal(false)}
  distributorId={selectedDistributorId}
  onDistributorUpdated={() => {
    fetchRecentContacts(branchId);
    setShowDistributorDetailModal(false);
  }}
/>
    </div>
  );
};

export default BranchDetails;