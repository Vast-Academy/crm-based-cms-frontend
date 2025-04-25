import React, { useEffect, useState } from 'react';
import { 
  FiUsers, FiPackage, FiTool, FiDollarSign, 
  FiFileText, FiCheckCircle, FiActivity, 
  FiClock, FiUserPlus, FiClipboard 
} from 'react-icons/fi';
import SummaryApi from '../common';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicianStats, setTechnicianStats] = useState([]);

  // Stats state with initial values
  const [stats, setStats] = useState({
    leads: 0,
    customers: 0,
    technicians: 0, 
    inventory: 0,
    workOrders: 0,
    assignedProjects: 0,
    pendingApprovals: 0,
    completedProjects: 0
  });

  // Customer summary data
  const [customerSummary, setCustomerSummary] = useState({
    total: 0,
    active: 0,
    pending: 0
  });

  // Other dashboard data
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Include branch parameter if admin has selected a branch
        let branchParam = '';
        if (user.role === 'admin' && user.selectedBranch) {
          branchParam = `?branch=${user.selectedBranch}`;
        }
        
        // Fetch data in parallel to improve performance
        const [
          leadsResponse,
          customersResponse,
          techniciansResponse,
          inventoryResponse,
          workOrdersResponse,
          projectsResponse
        ] = await Promise.all([
          // 1. Fetch leads data
          fetch(`${SummaryApi.getAllLeads.url}${branchParam}`, {
            method: SummaryApi.getAllLeads.method,
            credentials: 'include'
          }),
          
          // 2. Fetch customers data
          fetch(`${SummaryApi.getAllCustomers.url}${branchParam}`, {
            method: SummaryApi.getAllCustomers.method,
            credentials: 'include'
          }),
          
          // 3. Fetch technicians data
          fetch(user.role === 'admin' 
            ? SummaryApi.getTechnicianUsers.url 
            : SummaryApi.getManagerTechnician.url, {
              method: 'GET',
              credentials: 'include'
          }),
          
          // 4. Fetch inventory data (combining serialized and generic)
          Promise.all([
            fetch(`${SummaryApi.getInventoryByType.url}/serialized-product`, {
              method: SummaryApi.getInventoryByType.method,
              credentials: 'include'
            }),
            fetch(`${SummaryApi.getInventoryByType.url}/generic-product`, {
              method: SummaryApi.getInventoryByType.method,
              credentials: 'include'
            })
          ]),
          
          // 5. Fetch pending work orders
          fetch(`${SummaryApi.getWorkOrders.url}${branchParam ? branchParam : '?'}status=pending`, {
            method: SummaryApi.getWorkOrders.method,
            credentials: 'include'
          }),
          
          // 6. Fetch all manager projects
          fetch(`${SummaryApi.getManagerProjects.url}${branchParam}`, {
            method: 'GET',
            credentials: 'include'
          })
        ]);

        // Parse all responses
        const leadsData = await leadsResponse.json();
        const customersData = await customersResponse.json();
        const techniciansData = await techniciansResponse.json();
        
        // Parse inventory responses
        const [serializedResponse, genericResponse] = inventoryResponse;
        const serializedData = await serializedResponse.json();
        const genericData = await genericResponse.json();
        
        const workOrdersData = await workOrdersResponse.json();
        const projectsData = await projectsResponse.json();

        // Calculate counts
        const leadsCount = leadsData.success ? leadsData.data.length : 0;
        const customersCount = customersData.success ? customersData.data.length : 0;
        const techniciansCount = techniciansData.success ? techniciansData.data.length : 0;
        
        // Calculate inventory total
        let inventoryTotal = 0;
        if (serializedData.success) {
          // For serialized products, count each serial number
          serializedData.items.forEach(item => {
            if (item.stock) {
              inventoryTotal += item.stock.length;
            }
          });
        }
        
        if (genericData.success) {
          // For generic products, sum up quantities
          genericData.items.forEach(item => {
            if (item.stock) {
              item.stock.forEach(stock => {
                inventoryTotal += parseInt(stock.quantity || 0, 10);
              });
            }
          });
        }

        // Calculate work orders count
        const pendingWorkOrdersCount = workOrdersData.success ? 
          workOrdersData.data.filter(order => order.status === 'pending').length : 0;
        
        // Calculate project counts from manager projects
        let assignedCount = 0;
        let pendingApprovalCount = 0;
        let completedCount = 0;
        
        if (projectsData.success) {
          // Only count projects that have technicians assigned
          const validProjects = projectsData.data.filter(project => {
            return project.technician && 
                  (project.technician.firstName || project.technician.lastName || 
                   (typeof project.technician === 'string' && project.technician.length > 0));
          });
          
          assignedCount = validProjects.filter(project => 
            ['assigned', 'in-progress', 'paused'].includes(project.status)
          ).length;
          
          pendingApprovalCount = validProjects.filter(project => 
            project.status === 'pending-approval'
          ).length;
          
          completedCount = validProjects.filter(project => 
            project.status === 'completed'
          ).length;
        }

        // fetch technician status
        try {
          const techResponse = await fetch(user.role === 'admin' 
            ? SummaryApi.getTechnicianUsers.url 
            : SummaryApi.getManagerTechnician.url, {
              method: 'GET',
              credentials: 'include'
          });
          
          const techData = await techResponse.json();
          
          if (techData.success) {
            // Map technicians to get their names
            const technicians = techData.data.map(tech => ({
              id: tech._id,
              name: `${tech.firstName} ${tech.lastName}`,
              assigned: 0,
              inProgress: 0,
              pendingApproval: 0,
              completed: 0,
              transferring: 0,
              transferred: 0
            }));
            
            // If we have project data, count projects for each technician
            if (projectsData.success) {
              projectsData.data.forEach(project => {
                if (project.technician && project.technician._id) {
                  const techIndex = technicians.findIndex(t => t.id === project.technician._id);
                  if (techIndex !== -1) {
                    // Update the appropriate counter based on project status
                    if (project.status === 'assigned') {
                      technicians[techIndex].assigned++;
                    } else if (project.status === 'in-progress') {
                      technicians[techIndex].inProgress++;
                    } else if (project.status === 'pending-approval') {
                      technicians[techIndex].pendingApproval++;
                    } else if (project.status === 'completed') {
                      technicians[techIndex].completed++;
                    } else if (project.status === 'transferring') {
                      technicians[techIndex].transferring++;
                    } else if (project.status === 'transferred') {
                      technicians[techIndex].transferred++;
                    }
                  }
                }
              });
            }
            
            setTechnicianStats(technicians);
          }
        } catch (err) {
          console.error('Error fetching technician stats:', err);
        }

        // Set all the stats
        setStats({
          leads: leadsCount,
          customers: customersCount,
          technicians: techniciansCount,
          inventory: inventoryTotal,
          workOrders: pendingWorkOrdersCount,
          assignedProjects: assignedCount,
          pendingApprovals: pendingApprovalCount,
          completedProjects: completedCount
        });

        // Set customer summary data
        setCustomerSummary({
          total: customersCount,
          active: customersCount, // Could refine this based on actual customer status if available
          pending: 0 // Could calculate from payment data if available
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Server error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role, user.selectedBranch]);

  // Define the dashboard stat boxes based on the data
  const dashboardStats = [
    { name: 'Active Leads', value: stats.leads, icon: FiUsers, bgColor: 'bg-blue-500', path: '/contacts' },
    { name: 'Customers', value: stats.customers, icon: FiUsers, bgColor: 'bg-green-500', path: '/contacts' },
    { name: 'Technicians', value: stats.technicians, icon: FiUsers, bgColor: 'bg-purple-500', path: '/users/technicians' },
    { name: 'Inventory Items', value: stats.inventory, icon: FiPackage, bgColor: 'bg-yellow-500', path: '/inventory' },
    { name: 'Pending Work Orders', value: stats.workOrders, icon: FiTool, bgColor: 'bg-red-500', path: '/work-orders' },
    { name: 'Assigned Projects', value: stats.assignedProjects, icon: FiActivity, bgColor: 'bg-indigo-500', path: '/manager-dashboard' },
    { name: 'Pending Approvals', value: stats.pendingApprovals, icon: FiClock, bgColor: 'bg-amber-500', path: '/manager-dashboard' },
    { name: 'Completed Projects', value: stats.completedProjects, icon: FiCheckCircle, bgColor: 'bg-emerald-500', path: '/manager-dashboard' }
  ];
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your CRM dashboard</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashboardStats.map((stat, index) => (
          <div 
            key={index} 
            className={`${stat.bgColor} text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer`}
            onClick={() => window.location.href = stat.path}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-white text-opacity-80">{stat.name}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <stat.icon className="w-10 h-10 text-white text-opacity-75" />
            </div>
          </div>
        ))}
      </div>

      {/* Technician Overview */}
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Technicians Overview</h2>
  
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASSIGNED</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IN PROGRESS</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PENDING APPROVAL</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMPLETED</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TRANSFERRING</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TRANSFERRED</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {technicianStats.map((tech, index) => (
          <tr key={tech.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tech.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.assigned}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.inProgress}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.pendingApproval}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.completed}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.transferring}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tech.transferred}</td>
          </tr>
        ))}
        
        {/* Add a total row at the bottom */}
        <tr className="bg-gray-50 font-semibold">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">Total</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {technicianStats.reduce((sum, tech) => sum + tech.assigned, 0)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {technicianStats.reduce((sum, tech) => sum + tech.inProgress, 0)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {technicianStats.reduce((sum, tech) => sum + tech.pendingApproval, 0)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {technicianStats.reduce((sum, tech) => sum + tech.completed, 0)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {technicianStats.reduce((sum, tech) => sum + tech.transferring, 0)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {technicianStats.reduce((sum, tech) => sum + tech.transferred, 0)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
      
      {/* If you wish to keep the sections below, you can uncomment them */}
      {/* 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Customer Summary</h2>
            <FiUsers className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Customers</span>
              <span className="font-medium">{customerSummary.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Customers</span>
              <span className="font-medium text-green-600">{customerSummary.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Payments</span>
              <span className="font-medium text-orange-500">{customerSummary.pending}</span>
            </div>
          </div>
          
          <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  onClick={() => window.location.href = '/contacts'}>
            View All Customers
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Sales Summary</h2>
            <FiDollarSign className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="h-40 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">₹0</p>
              <p className="text-gray-600 mt-1">Total Revenue</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-lg font-medium text-green-600">₹0</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">Last Month</p>
              <p className="text-lg font-medium text-blue-600">₹0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Recent Work Orders</h2>
            <FiFileText className="w-5 h-5 text-gray-500" />
          </div>
          
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-gray-600">{order.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <FiFileText className="w-10 h-10 mb-2" />
              <p>No recent work orders</p>
            </div>
          )}
          
          <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  onClick={() => window.location.href = '/work-orders'}>
            View All Orders
          </button>
        </div>
      </div>
      */}
    </div>
  );
};

export default Dashboard;