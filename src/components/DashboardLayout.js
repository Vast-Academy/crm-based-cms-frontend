import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiUsers, FiSettings, 
  FiPackage, FiClipboard, FiMenu, 
  FiBell, FiLogOut, FiChevronDown,
  FiBriefcase, FiFileText, FiTool
} from 'react-icons/fi';
// import GlobalSearch from './GlobalSearch';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersDropdownOpen, setUsersDropdownOpen] = useState(false);
  const [branchesDropdownOpen, setBranchesDropdownOpen] = useState(false);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const [leadsDropdownOpen, setLeadsDropdownOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Main navigation items with conditional rendering based on user role
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    {
      name: 'User Management',
      icon: FiUsers,
      dropdown: true,
      isOpen: usersDropdownOpen,
      toggle: () => setUsersDropdownOpen(!usersDropdownOpen),
      items: user?.role === 'admin' ? [
        { name: 'Admin Users', path: '/users/admin' },
        { name: 'Managers', path: '/users/managers' },
        { name: 'Technicians', path: '/users/technicians' },
      ] : [
        { name: 'Technicians', path: '/users/technicians' },
      ]
    },
    user?.role === 'admin' && {
      name: 'Branch Management',
      icon: FiBriefcase,
      dropdown: true,
      isOpen: branchesDropdownOpen,
      toggle: () => setBranchesDropdownOpen(!branchesDropdownOpen),
      items: [
        { name: 'All Branches', path: '/branches' },
        { name: 'Add Branch', path: '/branches/add' },
      ]
    },
    {
      name: 'Inventory',
      icon: FiPackage,
      dropdown: true,
      isOpen: inventoryDropdownOpen,
      toggle: () => setInventoryDropdownOpen(!inventoryDropdownOpen),
      items: [
        { name: 'View Inventory', path: '/inventory' },
        { name: 'Add Items', path: '/inventory/add' },
        { name: 'Assign to Technician', path: '/inventory/assign' },
      ]
    },
    { 
      name: 'Lead Management', 
      icon: FiUsers, 
      dropdown: true,
      isOpen: leadsDropdownOpen,
      toggle: () => setLeadsDropdownOpen(!leadsDropdownOpen),
      items: [
        { name: 'All Leads', path: '/leads' },
      ]
    },
    { name: 'Customer Management', path: '/customers', icon: FiFileText },
    { name: 'Work Orders', path: '/work-orders', icon: FiTool },
    { name: 'Reports', path: '/reports', icon: FiClipboard },
    { name: 'Settings', path: '/settings', icon: FiSettings },
  ];
  
  // Filter out undefined items (from conditional rendering)
  const filteredNavItems = navItems.filter(item => item);
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar overlay for mobile */}
      <div 
        className={`md:hidden fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Sidebar */}
      <div 
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-lg transition-transform duration-200 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:inset-0`}
      >
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-gray-800">CRM System</h1>
        </div>
        
        <nav className="mt-5">
          <ul>
            {filteredNavItems.map((item, index) => (
              <li key={index}>
                {item.dropdown ? (
                  <div>
                    <button
                      onClick={item.toggle}
                      className={`w-full flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                      </div>
                      <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${item.isOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`bg-gray-50 transition-all duration-200 overflow-hidden ${item.isOpen ? 'max-h-60' : 'max-h-0'}`}>
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`flex pl-12 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 ${
                            location.pathname === subItem.path ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700' : ''
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 ${
                      location.pathname === item.path ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700' : ''
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-gray-600 focus:outline-none md:hidden"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4 flex items-center">
          {/* <GlobalSearch /> */}

            {user && user.role === 'admin' && (
              <select className="px-4 py-2 border rounded-md">
                <option value="">All Branches</option>
                {/* Branches will be populated dynamically */}
              </select>
            )}
          </div>
          
          <div className="flex items-center">
            <button className="p-1 mr-4 text-gray-500 hover:text-gray-600 relative">
              <FiBell className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-white text-xs flex items-center justify-center">
                0
              </span>
            </button>
            
            <div className="relative flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium mr-2">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700 mr-2">
                {user?.firstName || 'User'} ({user?.role || 'user'})
              </span>
              <button 
                onClick={handleLogout}
                className="p-1 text-gray-500 hover:text-gray-600"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet /> {/* This is where page components will be rendered */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;