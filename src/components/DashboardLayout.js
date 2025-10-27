import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUsers, FiSettings,
  FiPackage, FiClipboard, FiMenu,
  FiBell, FiLogOut, FiChevronDown,
  FiBriefcase, FiFileText, FiTool, FiRefreshCw,
  FiActivity,
  FiArrowLeft,
  FiRepeat, FiShield,
  FiClock
} from 'react-icons/fi';
import { Replace, Layers, Users, Building, X, User, Camera, ChevronDown } from 'lucide-react';
import ManagerStatusChecker from './ManagerStatusChecker';
import UserSettingsModal from '../pages/users/UserSettingsModal';
import ChangeProfilePictureModal from './ChangeProfilePictureModal';
import ImagePreviewModal from './ImagePreviewModal';
// import GlobalSearch from './GlobalSearch';
import usePushNotifications from '../hooks/usePushNotifications';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  usePushNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersDropdownOpen, setUsersDropdownOpen] = useState(false);
  const [branchesDropdownOpen, setBranchesDropdownOpen] = useState(false);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const [leadsDropdownOpen, setLeadsDropdownOpen] = useState(false);
  const [showTransferOption, setShowTransferOption] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showChangeProfilePictureModal, setShowChangeProfilePictureModal] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  
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
    setShowLogoutPopup(false); // Close popup first
    logout(); // Call the logout function from AuthContext
  };

  // Toggle profile popup
  const toggleLogoutPopup = () => {
    setShowLogoutPopup(!showLogoutPopup);
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
  
  // Add this useEffect in your component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.relative')) {
        setProfileDropdownOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

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
            name: 'Branches',
            icon: Building,
            path: '/branches'
          },
          {
            name: 'Managers',
            icon: Users,
            path: '/users/managers'
          },
          {
            name: 'Engineers',
            icon: Layers,
            path: '/users/branches/technicians'
          },
          {
            name: 'Inventory',
            icon: FiPackage,
            path: '/inventory-items'
          },
          {
            name: 'Services',
            icon: FiPackage,
            path: '/services',
            color: 'text-purple-500'
          },
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
            path: '/users/manager/technicians',
            icon: FiUsers
          },
          {
            name: 'Customers',
            path: '/contacts',
            icon: FiUsers
          },
          { name: 'Work Orders', path: '/work-orders', icon: FiTool },
          { name: 'Projects', path: '/manager-dashboard', icon: FiActivity },
          { name: 'Pending Approvals', path: '/pending-approvals', icon: FiClock },
          { name: 'Transferring Requests', path: '/transferred-projects', icon: FiArrowLeft },
          {
            name: 'Inventory',
            path: '/inventory',
            icon: FiPackage
          },
          {
            name: 'Services',
            icon: FiPackage,
            path: '/services',
            color: 'text-purple-500'
          },
          { name: 'Returned Inventory', path: '/returned-inventory', icon: FiRepeat },
          { name: 'Replacement Warranty', path: '/replacement-warranty', icon: FiShield  },
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
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-gray-800 text-white transition-transform duration-200 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:inset-0`}
      >
        <div className="flex p-4 h-16">
          <h1 className="text-2xl font-bold text-white">CMS Panel</h1>
        </div>
        
        <nav className="mt-5">
          <ul>
            {filteredNavItems.map((item, index) => (
              <li key={index}>
                {item.dropdown ? (
                  <div>
                    <button
                      onClick={item.toggle}
                      className={`w-full flex items-center justify-between px-4 py-3 text-white hover:bg-indigo-50 hover:text-indigo-700`}
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
                          className={`flex pl-12 py-2 text-sm text-white hover:bg-indigo-50 hover:text-indigo-700 ${
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
                    className={`flex items-center px-4 py-3 text-white hover:bg-gray-700 ${
                      location.pathname === item.path ? 'bg-blue-600 border-indigo-700' : ''
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
        <header className="flex items-center justify-between h-[85px] px-4 inset-y-0 left-0 bg-gray-800 ">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-gray-600 focus:outline-none md:hidden"
          >
            <FiMenu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-2 flex items-center">
            {/* Branch Information - Only for Managers */}
            {user?.role === 'manager' && (
              <div className="flex flex-col items-start">
                 <span className="text-xs text-gray-300">
                  Branch
                </span>
                <span className="text-2xl font-semibold text-white capitalize">
                  {user?.branch?.name || 'Main Branch'}
                </span>
              </div>
            )}
          </div>

          {/* New Profile Button UI */}
          <div className="relative mr-4">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 rounded-lg border border-gray-700 h-[65px]"
            >
              {/* Profile Picture with Online Status */}
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                )}
                {/* Online Status Dot */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                  <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Name and Role */}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white capitalize">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-gray-200 capitalize">
                  {user?.role || 'User'}
                </span>
              </div>

              {/* Dropdown Arrow */}
              <ChevronDown className={`w-4 h-4 text-gray-200 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Profile Info in Dropdown */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowImagePreviewModal(true);
                            setProfileDropdownOpen(false);
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium text-lg">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                      )}
                      {/* Online Status Dot */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                        <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-white capitalize">{user?.firstName} {user?.lastName}</span>
                      <span className="text-sm text-gray-200 capitalize">{user?.role || 'User'}</span>
                      {/* <span className="text-xs text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Online
                      </span> */}
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowChangeProfilePictureModal(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors duration-150"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Change Profile Picture</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors duration-150"
                  >
                    <FiSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <hr className="my-1 border-gray-200" />

                  <button
                    onClick={() => {
                      toggleLogoutPopup();
                      setProfileDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-600 transition-colors duration-150"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}

            {/* Backdrop to close dropdown */}
            {profileDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              ></div>
            )}
          </div>

            {/* Settings button for Admin only */}
          {/* <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <Link
                to="/admin-settings/bank-accounts"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <FiSettings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            )}
          </div> */}
        </header>
         ) : null}
        
        {/* Page content */}
      <main className={`flex-1 overflow-auto ${user?.role !== 'technician' ? 'p-4' : 'p-0'}`}>
        <Outlet /> {/* This is where page components will be rendered */}
      </main>
    </div>

    {/* Logout Confirmation Popup */}
{showLogoutPopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className={` bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-auto`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold text-lg text-gray-800`}>Confirm Logout</h3>
        <button
          onClick={() => setShowLogoutPopup(false)}
          className={`p-1 rounded-full hover:bg-gray-100`}
        >
          <X size={20} className={'text-gray-500'} />
        </button>
      </div>
      <p className={`mb-6 text-gray-600`}>
        Are you sure you want to logout from your account?
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowLogoutPopup(false)}
          className={`px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800`}
        >
          Cancel
        </button>
        <button
          onClick={handleLogout}
          className={`px-4 py-2 rounded-lg flex items-center bg-red-600 hover:bg-red-700 text-white`}
        >
          <FiLogOut size={16} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  </div>
)}

    {/* Settings Modal */}
<UserSettingsModal
  isOpen={showSettingsModal}
  onClose={() => setShowSettingsModal(false)}
/>

{/* Change Profile Picture Modal */}
<ChangeProfilePictureModal
  isOpen={showChangeProfilePictureModal}
  onClose={() => setShowChangeProfilePictureModal(false)}
/>

{/* Image Preview Modal */}
<ImagePreviewModal
  isOpen={showImagePreviewModal}
  onClose={() => setShowImagePreviewModal(false)}
  imageUrl={user?.profileImage}
  userName={`${user?.firstName} ${user?.lastName}`}
/>
  </div>
);
};

export default DashboardLayout;
