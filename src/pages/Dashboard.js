import React, { useEffect, useState } from 'react';
import { FiUsers, FiPackage, FiTool, FiDollarSign, FiFileText, FiCheckCircle } from 'react-icons/fi';
import SummaryApi from '../common';

const Dashboard = () => {
  // This will be replaced with actual data from your API
  const[stats, setStats] = useState ([
    { name: 'Total Branches', value: '0', icon: FiUsers, bgColor: 'bg-blue-500', path: '/branches' },
    { name: 'Total Staff', value: '0', icon: FiUsers, bgColor: 'bg-green-500', path: '/users/managers' },
    { name: 'Inventory Items', value: '0', icon: FiPackage, bgColor: 'bg-yellow-500', path: '/inventory' },
    { name: 'Work Orders', value: '0', icon: FiTool, bgColor: 'bg-purple-500', path: '/work-orders' },
    { name: 'Active Leads', value: '0', icon: FiUsers, bgColor: 'bg-blue-500', path: '/leads' },
    { name: 'Customers', value: '0', icon: FiUsers, bgColor: 'bg-green-500', path: '/customers' },
  ]);
  
  // Add this to fetch lead and customer counts
useEffect(() => {
  const fetchStats = async () => {
    try {
      // Fetch leads count
      const leadsResponse = await fetch(SummaryApi.getAllLeads.url, {
        method: SummaryApi.getAllLeads.method,
        credentials: 'include'
      });
      const leadsData = await leadsResponse.json();
      
      // Fetch customers count
      const customersResponse = await fetch(SummaryApi.getAllCustomers.url, {
        method: SummaryApi.getAllCustomers.method,
        credentials: 'include'
      });
      const customersData = await customersResponse.json();
      
      // Update stats with actual counts
      setStats(prevStats => {
        const newStats = [...prevStats];
        const leadStat = newStats.find(stat => stat.name === 'Active Leads');
        const customerStat = newStats.find(stat => stat.name === 'Customers');
        
        if (leadStat) {
          leadStat.value = leadsData.count || '0';
        }
        
        if (customerStat) {
          customerStat.value = customersData.count || '0';
        }
        
        return newStats;
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  fetchStats();
}, []);

  const recentOrders = [
    // This will be populated with real data later
  ];
  
  const inventoryStatus = [
    // This will be populated with real data later
  ];

  const customerSummary = {
    total: 0,
    active: 0,
    pending: 0
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your CRM dashboard</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300`}>
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
      
      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Customer Summary */}
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
          
          <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
            View All Customers
          </button>
        </div>
        
        {/* Sales Summary */}
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
        
        {/* Recent Work Orders */}
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
          
          <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
            View All Orders
          </button>
        </div>
      </div>
      
      {/* Inventory Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Inventory Status</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-800">View All</button>
        </div>
        
        {inventoryStatus.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryStatus.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{item.stock}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                        item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <FiPackage className="w-12 h-12 mb-3" />
            <p>No inventory items found</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
              Add Inventory Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;