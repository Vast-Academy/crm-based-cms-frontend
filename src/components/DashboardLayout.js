import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiUsers, FiSettings, 
  FiPackage, FiClipboard, FiMenu, 
  FiBell, FiLogOut, FiChevronDown,
  FiBriefcase, FiFileText, FiTool, FiRefreshCw,
  FiActivity,
  FiArrowLeft
} from 'react-icons/fi';
import ManagerStatusChecker from './ManagerStatusChecker';
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
  const [showTransferOption, setShowTransferOption] = useState(false);
  
  useEffect(() => {
    // Check if user is a manager and has activeManagerStatus='active'
    if (user && user.role === 'manager' && user.activeManagerStatus === 'active') {
      setShowTransferOption(true);
    } else {
      setShowTransferOption(false);
    }
  }, [user]);

  useEffect(() => {
    // If the user is technician, immediately redirect to technician dashboard
    if (user && user.role === 'technician') {
      navigate('/technician-dashboard');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Function to toggle dropdowns and close others
  const toggleDropdown = (dropdownName) => {
    // Check if the clicked dropdown is already open
    let isCurrentlyOpen = false;
    
    switch(dropdownName) {
      case 'users':
        isCurrentlyOpen = usersDropdownOpen;
        break;
      case 'branches':
        isCurrentlyOpen = branchesDropdownOpen;
        break;
      case 'inventory':
        isCurrentlyOpen = inventoryDropdownOpen;
        break;
      case 'leads':
        isCurrentlyOpen = leadsDropdownOpen;
        break;
      default:
        break;
    }
    
    // Close all dropdowns first
    setUsersDropdownOpen(false);
    setBranchesDropdownOpen(false);
    setInventoryDropdownOpen(false);
    setLeadsDropdownOpen(false);
    
    // If the clicked dropdown wasn't already open, then open it
    // If it was open, leave it closed
    if (!isCurrentlyOpen) {
      switch(dropdownName) {
        case 'users':
          setUsersDropdownOpen(true);
          break;
        case 'branches':
          setBranchesDropdownOpen(true);
          break;
        case 'inventory':
          setInventoryDropdownOpen(true);
          break;
        case 'leads':
          setLeadsDropdownOpen(true);
          break;
        default:
          break;
      }
    }
  };
  
  // Define navigation items by role
  const getNavItemsByRole = () => {
    // Default items that show for everyone - empty for now
    let navItems = [];
    
    if (user) {
      // Common item for Admin and Manager
      if (user.role === 'admin' || user.role === 'manager') {
        navItems.push({ name: 'Dashboard', path: '/dashboard', icon: FiHome });
      }
      
      // Admin specific items
      if (user.role === 'admin') {
        navItems = [
          ...navItems,
          {
            name: 'User Management',
            icon: FiUsers,
            dropdown: true,
            isOpen: usersDropdownOpen,
            toggle: () => toggleDropdown('users'),
            items: [
              { name: 'Admin Users', path: '/users/admin' },
              { name: 'Managers', path: '/users/managers' },
              { name: 'Technicians', path: '/users/technicians' },
            ]
          },
          {
            name: 'Branch Management',
            icon: FiBriefcase,
            dropdown: true,
            isOpen: branchesDropdownOpen,
            toggle: () => toggleDropdown('branches'),
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
            toggle: () => toggleDropdown('inventory'),
            items: [
              { name: 'Add Inventory', path: '/inventory/add' },
              { name: 'Serialized Products', path: '/inventory/serialized' },
              { name: 'Generic Products', path: '/inventory/generic' },
              { name: 'Services', path: '/inventory/services' }
            ]
          }
        ];
      }
      
      // Manager specific items
      if (user.role === 'manager') {
        navItems = [
          ...navItems,
          // Only show ownership transfer for active managers
          // showTransferOption && {
          //   name: 'Ownership Transfer',
          //   path: '/ownership-transfer',
          //   icon: FiRefreshCw
          // },
          {
            name: 'User Management',
            path: '/users/technicians',
            icon: FiUsers
          },
          {
            name: 'Inventory',
            path: '/inventory',
            icon: FiPackage
          },
          {
            name: 'Customers',
            path: '/contacts',
            icon: FiUsers
          },
          // { 
          //   name: 'Customer', 
          //   icon: FiUsers, 
          //   dropdown: true,
          //   isOpen: leadsDropdownOpen,
          //   toggle: () => toggleDropdown('leads'),
          //   items: [
          //     { name: 'Customer & Leads', path: '/contacts' },
          //     { name: 'All Leads', path: '/leads' },
          //     { name: 'All Customers', path: '/customers' },
          //   ]
          // },
          { name: 'Work Orders', path: '/work-orders', icon: FiTool },
          { name: 'Transferred Projects', path: '/transferred-projects', icon: FiArrowLeft },
          { name: 'Projects', path: '/manager-dashboard', icon: FiActivity },
          { name: 'Returned Inventory', path: '/returned-inventory', icon: FiRefreshCw },
          { name: 'Logs', path: '/inventory-transfer-history', icon: FiRefreshCw },
        ];
      }
      
      // Technician specific items
      if (user.role === 'technician') {
        navItems = [
          { name: 'Technician Dashboard', path: '/technician-dashboard', icon: FiTool }
        ];
      }
    }
    
    // Filter out undefined items (from conditional rendering)
    return navItems.filter(item => item);
  };
  
  const filteredNavItems = getNavItemsByRole();
  
  return (
    <div className={`${user?.role === 'technician' ? '' : 'flex'} h-screen bg-gray-100`}>
      <ManagerStatusChecker/>

      {user?.role !== 'technician' && (
      <>
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
      </>
    )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
       {/* Conditionally show header for non-technicians */}
      {user?.role !== 'technician' ? (
        <header className="flex items-center justify-between h-16 px-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-gray-600 focus:outline-none md:hidden"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4 flex items-center">
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
         ) : null}
        
        {/* Page content */}
      <main className={`flex-1 overflow-auto ${user?.role !== 'technician' ? 'p-4' : 'p-0'}`}>
        <Outlet /> {/* This is where page components will be rendered */}
      </main>
    </div>
  </div>
);
};

export default DashboardLayout;