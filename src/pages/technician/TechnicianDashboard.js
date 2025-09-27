import React, { useState, useEffect } from 'react';
import {
  Package,
  Camera,
  Clipboard,
  CheckSquare,
  List,
  Bell,
  Calendar,
  Clock,
  MapPin,
  User,
  Sun,
  Moon,
  ArrowLeft,
  Activity,
  Eye,
  Home,
  LogOut,
  X,
  Phone,
  MessageSquare,
  ChevronDown,
  FileText,
  Settings,
  Check
} from 'lucide-react';
import { LuCctv } from "react-icons/lu";
import { useAuth } from '../../context/AuthContext';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import InventoryDetailsModal from './InventoryDetailsModal';
import WorkOrderDetailsModal from './WorkOrderDetailsModal';
import ReturnInventoryModal from './ReturnInventoryModal';
import ReturnRequestDetailsModal from './ReturnRequestDetailsModal';
import ReturnLogsModal from './ReturnLogsModal';
import GenerateBillModal from './GenerateBillModal';
import { FiPause } from 'react-icons/fi';
import UserSettingsModal from '../users/UserSettingsModal';
import ChangeProfilePictureModal from '../../components/ChangeProfilePictureModal';
import ImagePreviewModal from '../../components/ImagePreviewModal';

const TechnicianDashboard = () => {
  const { user, logout } = useAuth();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // Default light mode
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize with value from sessionStorage, default to 'home' if not set
    return sessionStorage.getItem('technicianDashboardActiveTab') || 'home';
  });
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState({
    inventory: 0,
    workOrders: 0
  });
  
  
  // States for modals
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnRequestModal, setShowReturnRequestModal] = useState(false);
  const [showReturnLogsModal, setShowReturnLogsModal] = useState(false);
  const [selectedReturnRequest, setSelectedReturnRequest] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
const [inventoryFilter, setInventoryFilter] = useState('Serialized');
  const [expandedItems, setExpandedItems] = useState([]);
  // Add these state variables
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showStopProjectModal, setShowStopProjectModal] = useState(false);
  const [pauseProjectRemark, setPauseProjectRemark] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPauseConfirmationModal, setShowPauseConfirmationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStopConfirmationModal, setShowStopConfirmationModal] = useState(false);
  const [transferRemark, setTransferRemark] = useState('');
  const [transferredProjects, setTransferredProjects] = useState([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChangeProfilePictureModal, setShowChangeProfilePictureModal] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);

  // नया कॉन्स्टेंट जोड़ें
const CACHE_STALENESS_TIME = 15 * 1000;

  // Function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  // Function to display role
  const getDisplayRole = (role) => {
    if (role === 'technician') {
      return 'Engineer';
    }
    return role;
  };

  // Handle logout
  const handleLogout = () => {
    setShowLogoutPopup(false); // Close popup first
    sessionStorage.removeItem('technicianDashboardActiveTab');
    logout(); // Call the logout function from AuthContext
    // Redirect to login page will be handled by AuthContext/Router
  };

  // Add these functions to handle customer interactions
const handleCallCustomer = (project) => {
  if (project.customerPhone) {
    // Record this action in status history
    addActivityToHistory(project, `Call initiated to customer`);
    
    // Actually make the call
    window.location.href = `tel:${project.customerPhone}`;
  } else {
    alert('Customer phone number not available');
  }
};

const handleMessageCustomer = (project) => {
  if (project.customerWhatsapp || project.customerPhone) {
    // Record this action in status history
    addActivityToHistory(project, `WhatsApp message initiated to customer`);
    
    // Open WhatsApp with the number
    const phoneNumber = project.customerWhatsapp || project.customerPhone;
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`, '_blank');
  } else {
    alert('Customer contact number not available');
  }
};

// Add this function with your other customer interaction functions
const handleCallOriginalTechnician = (project) => {
  if (project.originalTechnician && project.originalTechnician.phoneNumber) {
    // Record this action in status history
    addActivityToHistory(project, `Call initiated to setup technician (${project.originalTechnician.firstName} ${project.originalTechnician.lastName})`);
    
    // Actually make the call
    window.location.href = `tel:${project.originalTechnician.phoneNumber}`;
  } else {
    alert('Original technician phone number not available');
  }
};

// Function to add activity to history
const addActivityToHistory = async (project, activityText) => {
  try {
    const response = await fetch(SummaryApi.addWorkOrderRemark.url, {
      method: SummaryApi.addWorkOrderRemark.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        customerId: project.customerId,
        orderId: project.orderId,
        remark: activityText,
        activityType: 'communication'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update the work order in our state
      setWorkOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.orderId === project.orderId) {
            const updatedOrder = {
              ...order,
              statusHistory: [
                ...order.statusHistory || [],
                {
                  status: 'communication',
                  remark: activityText,
                  updatedBy: user._id,
                  updatedAt: new Date()
                }
              ]
            };
            return updatedOrder;
          }
          return order;
        });
      });
    }
  } catch (err) {
    console.error('Error recording activity:', err);
  }
};
  
// Function to stop/pause the project
// पॉज़ प्रोजेक्ट फंक्शन को अपडेट करें
const handleStopProject = (project) => {
  if (!pauseProjectRemark.trim()) {
    return;
  }
  
  // पहले कन्फर्मेशन दिखाएं बजाय सीधे पॉज़ करने के
  setShowPauseConfirmationModal(true);
};

// कन्फर्मेशन के बाद पॉज़ का लॉजिक
const confirmPauseProject = async (project) => {
  try {
    setLoading(true);
    
    const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
      method: SummaryApi.updateWorkOrderStatus.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        customerId: project.customerId,
        orderId: project.orderId,
        status: 'paused',
        remark: pauseProjectRemark
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update the work orders state
      setWorkOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === project.orderId ? {...order, status: 'paused'} : order
        )
      );
      
      // Close the modals
      setShowStopProjectModal(false);
      setShowPauseConfirmationModal(false);
      
      // Clear the remark
      setPauseProjectRemark('');
      
      // Navigate back to home
      handleTabChange('home');
    } else {
      alert(data.message || 'Failed to pause project');
    }
  } catch (err) {
    console.error('Error pausing project:', err);
    alert('Server error. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Function to show stop project confirmation (step 1)
const handleTransferProject = (project) => {
  if (!transferRemark.trim()) {
    return;
  }

  // पहले कन्फर्मेशन दिखाएं बजाय सीधे स्टॉप करने के
  setShowStopConfirmationModal(true);
};

// कन्फर्मेशन के बाद स्टॉप का लॉजिक (step 2)
const confirmStopProject = async (project) => {
  try {
    setLoading(true);

    const response = await fetch(SummaryApi.updateWorkOrderStatus.url, {
      method: SummaryApi.updateWorkOrderStatus.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        customerId: project.customerId,
        orderId: project.orderId,
        status: 'transferring',
        remark: transferRemark
      })
    });

    const data = await response.json();

    if (data.success) {
      // Update the work orders state - don't remove yet, just update status
      setWorkOrders(prevOrders =>
        prevOrders.map(order =>
          order.orderId === project.orderId ? {...order, status: 'transferring'} : order
        )
      );

      // Close all modals
      setShowTransferModal(false);
      setShowStopConfirmationModal(false);

      // Clear the remark
      setTransferRemark('');

      // Navigate back to home
      handleTabChange('home');
    } else {
      alert(data.message || 'Failed to stop project');
    }
  } catch (err) {
    console.error('Error stopping project:', err);
    alert('Server error. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Add a handler for bill generation completion
const handleBillGenerated = async (selectedItems, paymentCompleted = false, info = {}) => {
  console.log('Bill items:', selectedItems, 'Payment completed:', paymentCompleted, 'info:', info);

  if (!paymentCompleted) {
    return;
  }

  const targetOrderId = info.orderId || (selectedWorkOrder ? selectedWorkOrder.orderId : undefined);

  if (!targetOrderId) {
    console.warn('No orderId available for bill update');
    return;
  }

  try {
    setWorkOrders(prevOrders => {
      const hasOrder = prevOrders.some(order => order.orderId === targetOrderId);
      if (!hasOrder) {
        return prevOrders;
      }

      return prevOrders.map(order => {
        if (order.orderId === targetOrderId) {
          return { ...order, status: 'pending-approval' };
        }
        return order;
      });
    });

    setSelectedWorkOrder(prev => {
      if (prev && prev.orderId === targetOrderId) {
        return { ...prev, status: 'pending-approval' };
      }
      return prev;
    });

    const cachedOrders = localStorage.getItem('technicianWorkOrders');
    if (cachedOrders) {
      try {
        const parsedOrders = JSON.parse(cachedOrders);
        if (Array.isArray(parsedOrders)) {
          const updatedCachedOrders = parsedOrders.map(order => {
            if (order.orderId === targetOrderId) {
              return { ...order, status: 'pending-approval' };
            }
            return order;
          });

          localStorage.setItem('technicianWorkOrders', JSON.stringify(updatedCachedOrders));
          localStorage.setItem(
            'technicianWorkOrdersTimestamp',
            new Date().getTime().toString()
          );
        }
      } catch (cacheErr) {
        console.error('Failed to update cached work orders:', cacheErr);
      }
    }

    handleTabChange('home');
  } catch (err) {
    console.error('Error updating project status:', err);
  }

  fetchWorkOrders();
  fetchInventory(true);
};

// Update the handleWorkOrderClick function to handle bill generation separately
const handleGenerateBill = (activeProject) => {
  setSelectedWorkOrder(activeProject);
  setShowBillModal(true);
};

const handleBillModalClose = () => {
  setShowBillModal(false);
  setSelectedWorkOrder(null);
};

const handleBillDone = async () => {
  setShowBillModal(false);
  setSelectedWorkOrder(null);

  // Force fetch fresh work orders to reflect status changes
  await fetchWorkOrders(true);

  handleTabChange('home');
};

// Add a helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

  // Toggle profile popup
  const toggleLogoutPopup = () => {
    setShowLogoutPopup(!showLogoutPopup);
  };

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


   // Function to handle tab changes
   const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Store the active tab in sessionStorage
    sessionStorage.setItem('technicianDashboardActiveTab', tab);
  };
  
  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('technicianDashboardTheme');
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newThemeValue = !darkMode;
    setDarkMode(newThemeValue);
    localStorage.setItem('technicianDashboardTheme', newThemeValue ? 'dark' : 'light');
  };
  
const getActiveWorkOrders = () => {
  // Filter by required statuses including 'rejected' and 'pending-approval'
  return workOrders.filter(order => 
    order.status === 'assigned' || 
    order.status === 'in-progress' || 
    order.status === 'paused' ||
    order.status === 'transferring' ||
    order.status === 'rejected' ||
    order.status === 'pending-approval'
  ).sort((a, b) => {
    // Sort by most recently updated
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
    return 0;
  });
};

  // Add a helper function to check status text
const getStatusDisplayText = (status) => {
  switch(status) {
    case 'transferring': return 'Transfer Pending';
    case 'transferred': return 'Transferred';
    default: return status;
  }
};

  // Get quantity of an item (for sorting and display)
const getItemQuantity = (item) => {
  if (item.type === 'serialized-product') {
    return item.serializedItems?.filter(si => si.status === 'active').length || 0;
  } else {
    return item.genericQuantity || 0;
  }
};

// Handle expanding/collapsing items
const handleItemExpand = (itemKey, item) => {
  if (item.type === 'serialized-product') {
    if (expandedItems.includes(itemKey)) {
      setExpandedItems(expandedItems.filter(id => id !== itemKey));
    } else {
      setExpandedItems([...expandedItems, itemKey]);
    }
  }
};

// Filter and sort inventory items
const getFilteredInventoryItems = () => {
  // First filter based on active items
  let filteredItems = inventoryItems;
  
  // Then apply type filter
  if (inventoryFilter === 'Serialized') {
    filteredItems = filteredItems.filter(item => item.type === 'serialized-product');
    // Sort by quantity descending to ascending
    filteredItems = filteredItems.sort((a, b) => getItemQuantity(b) - getItemQuantity(a));
  } else if (inventoryFilter === 'Generic') {
    filteredItems = filteredItems.filter(item => item.type === 'generic-product');
    // Sort by quantity descending to ascending
    filteredItems = filteredItems.sort((a, b) => getItemQuantity(b) - getItemQuantity(a));
  } else if (inventoryFilter === 'Services') {
    filteredItems = filteredItems.filter(item => item.type === 'service');
    // Sort services by name ascending
    filteredItems = filteredItems.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }
  
  return filteredItems;
};

// Computed property for filtered items
const filteredInventoryItems = getFilteredInventoryItems();

  // Fetch technician inventory
  const fetchInventory = async (forceFresh = false) => {
    try {
      setLoading(true);

      // If forceFresh is true, clear any cached inventory data
    if (forceFresh) {
      localStorage.removeItem('technicianInventory');
      // The timestamp can also be removed or reset
      setLastRefreshTime(prev => ({...prev, inventory: 0}));
    }
      
      // चेक करें अगर कैश डेटा है और स्टेल नहीं है
      const cachedInventory = localStorage.getItem('technicianInventory');
      const currentTime = new Date().getTime();
      
      // कैश चेक केवल तभी करें जब forceFresh false हो
      if (!forceFresh && cachedInventory) {
        setInventoryItems(JSON.parse(cachedInventory));
        console.log("Using cached inventory data");
        
        // एक हिडन API कॉल करें जो डेटा को बैकग्राउंड में अपडेट करेगा
        fetchFreshInventoryInBackground();
      } else {
        // ताज़ा डेटा फेच करें
        await fetchFreshInventory();
      }
    } catch (err) {
      // अगर एरर है लेकिन कैश्ड डेटा है, तो उसे फॉलबैक के रूप में इस्तेमाल करें
      const cachedInventory = localStorage.getItem('technicianInventory');
      if (cachedInventory) {
        setInventoryItems(JSON.parse(cachedInventory));
        console.log("Using cached inventory data after fetch error");
      } else {
        setError('Error loading inventory. Please try again later.');
        console.error('Error fetching inventory:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // बैकग्राउंड में ताजा इन्वेंटरी डेटा फेच करें
const fetchFreshInventoryInBackground = async () => {
  try {
    const response = await fetch(SummaryApi.getTechnicianInventory.url, {
      method: SummaryApi.getTechnicianInventory.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // डेटा कैश करें
      localStorage.setItem('technicianInventory', JSON.stringify(data.data));
      
      // स्टेट अपडेट करें, केवल अगर कुछ अलग है
      if (JSON.stringify(data.data) !== JSON.stringify(inventoryItems)) {
        setInventoryItems(data.data);
        console.log("Inventory data updated in background");
      }
      
      // रिफ्रेश टाइम अपडेट करें
      setLastRefreshTime(prev => ({...prev, inventory: new Date().getTime()}));
    }
  } catch (err) {
    console.error('Error fetching inventory in background:', err);
  }
};

// नया फंक्शन जो डायरेक्ट API से ताज़ा डेटा प्राप्त करता है
const fetchFreshInventory = async () => {
  try {
    const response = await fetch(SummaryApi.getTechnicianInventory.url, {
      method: SummaryApi.getTechnicianInventory.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      setInventoryItems(data.data);
      
      // कैश अपडेट करें
      localStorage.setItem('technicianInventory', JSON.stringify(data.data));
      
      // रिफ्रेश टाइम अपडेट करें
      setLastRefreshTime(prev => ({...prev, inventory: new Date().getTime()}));
    } else {
      setError('Failed to load inventory: ' + data.message);
    }
  } catch (err) {
    throw err;
  }
};

  // Handle inventory returned
  const handleInventoryReturned = () => {
    // Clear inventory cache to force a refresh
    localStorage.removeItem('technicianInventory');
    localStorage.removeItem('technicianInventoryTimestamp');
    // Reload inventory data
    fetchInventory();
    // Also refresh return requests
    fetchReturnRequests();
  };

  // Fetch technician's return requests
  const fetchReturnRequests = async () => {
    try {
      const response = await fetch(SummaryApi.getTechnicianReturnRequests.url, {
        method: SummaryApi.getTechnicianReturnRequests.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setReturnRequests(data.data);
      } else {
        console.error('Error fetching return requests:', data.message);
      }
    } catch (err) {
      console.error('Error fetching return requests:', err);
    }
  };

  // Handle return request click
  const handleReturnRequestClick = (returnRequest) => {
    setSelectedReturnRequest(returnRequest);
    setShowReturnRequestModal(true);
  };

  // Handle return request click from logs modal (keeps logs modal open)
  const handleReturnRequestClickFromLogs = (returnRequest) => {
    setSelectedReturnRequest(returnRequest);
    setShowReturnRequestModal(true);
    // Keep showReturnLogsModal true for popup-over-popup
  };


  // Filter today's return requests
  const getTodaysReturnRequests = () => {
    const today = new Date();
    const todayString = today.toDateString();

    return returnRequests.filter(request => {
      const requestDate = new Date(request.returnedAt);
      return requestDate.toDateString() === todayString;
    });
  };

 // fetchWorkOrders फंक्शन को अपडेट करें
const fetchWorkOrders = async (forceFresh = false) => {
  try {
    // कैश चेक केवल तभी करें जब forceFresh false हो
    const cachedOrders = localStorage.getItem('technicianWorkOrders');
    
    if (!forceFresh && cachedOrders) {
      const parsedData = JSON.parse(cachedOrders);
      
      // सक्रिय और पूरे किए गए वर्क ऑर्डर्स को अलग करें
      const active = [];
      const completed = [];
      const transferred = [];
      
      parsedData.forEach(order => {
        if (order.status === 'completed') {
          completed.push(order);
        } else if (order.status === 'transferring' || order.status === 'transferred') {
          transferred.push(order);
        } else {
          active.push(order);
        }
      });
      
      setWorkOrders(active);
      setCompletedOrders(completed);
      setTransferredProjects(transferred);
      console.log("Using cached work orders data");
      
      // बैकग्राउंड में फ्रेश डेटा फेच करें
      fetchFreshWorkOrdersInBackground();
    } else {
      // ताज़ा डेटा फेच करें
      await fetchFreshWorkOrders();
    }
  } catch (err) {
    // फॉलबैक के रूप में कैश का उपयोग करें
    const cachedOrders = localStorage.getItem('technicianWorkOrders');
    if (cachedOrders) {
      const parsedData = JSON.parse(cachedOrders);
      
      // सक्रिय और पूरे किए गए वर्क ऑर्डर्स को अलग करें
      const active = [];
      const completed = [];
      
      parsedData.forEach(order => {
        if (order.status === 'completed') {
          completed.push(order);
        } else {
          active.push(order);
        }
      });
      
      setWorkOrders(active);
      setCompletedOrders(completed);
      console.log("Using cached work orders data after fetch error");
    } else {
      setError('Error loading work orders. Please try again later.');
      console.error('Error fetching work orders:', err);
    }
  } finally {
    setLoading(false);
  }
};

// बैकग्राउंड में ताजा वर्क ऑर्डर डेटा फेच करें
const fetchFreshWorkOrdersInBackground = async () => {
  try {
    const response = await fetch(SummaryApi.getTechnicianWorkOrders.url, {
      method: SummaryApi.getTechnicianWorkOrders.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // डेटा कैश करें
      localStorage.setItem('technicianWorkOrders', JSON.stringify(data.data));
      
      // सक्रिय और पूरे किए गए वर्क ऑर्डर्स को अलग करें
      const active = [];
      const completed = [];
      
      data.data.forEach(order => {
        if (order.status === 'completed') {
          completed.push(order);
        } else {
          active.push(order);
        }
      });
      
      // चेक करें कि क्या डेटा अलग है, अगर हां तो ही स्टेट अपडेट करें
      if (JSON.stringify(active) !== JSON.stringify(workOrders) || 
          JSON.stringify(completed) !== JSON.stringify(completedOrders)) {
        setWorkOrders(active);
        setCompletedOrders(completed);
        console.log("Work orders updated in background");
      }
      
      // रिफ्रेश टाइम अपडेट करें
      setLastRefreshTime(prev => ({...prev, workOrders: new Date().getTime()}));
    }
  } catch (err) {
    console.error('Error fetching work orders in background:', err);
  }
};

// Then add this function to your TechnicianDashboard component
const handleProjectStarted = () => {
  console.log("Project started callback received");
  
  // Dispatch event to ensure all components are updated
  if (selectedWorkOrder) {
    const isComplaint = selectedWorkOrder.projectCategory === 'Repair' || 
                       selectedWorkOrder.projectType?.toLowerCase().includes('repair') ||
                       selectedWorkOrder.projectType?.toLowerCase().includes('complaint');
    
    if (isComplaint) {
      // Set the flag for complaint initiated
      sessionStorage.setItem('newComplaintInitiated', 'true');
      
      // Force refresh of work orders
      fetchWorkOrders(true);
      
      // Navigate to current-project tab
      handleTabChange('current-project');
    }
  }
};

// Add this to handle complaint initialization event
useEffect(() => {
  const handleComplaintInitiated = (event) => {
    console.log("Complaint initiated event received:", event.detail);
    
    // Force a refresh of work orders data
    fetchWorkOrders(true);
    
    // For immediate UI update, we can also directly update the state
    // This way we don't need to wait for fetchWorkOrders to complete
    if (event.detail) {
      const { orderId, projectType } = event.detail;
      
      // Update any matching work order in the state
      setWorkOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.orderId === orderId) {
            return {
              ...order,
              projectCategory: 'Repair', // Ensure this is set correctly
              status: 'in-progress',
              // Add placeholder for originalTechnician until full refresh happens
              originalTechnician: order.originalTechnician || {
                firstName: 'Loading...',
                lastName: ''
              }
            };
          }
          return order;
        });
      });
      
      // Navigate to current-project tab
      handleTabChange('current-project');
    }
  };
  
  // Add event listener
  window.addEventListener('complaintInitiated', handleComplaintInitiated);
  
  // Cleanup
  return () => {
    window.removeEventListener('complaintInitiated', handleComplaintInitiated);
  };
}, []);

// नया फंक्शन जो सीधे API से ताज़ा डेटा प्राप्त करता है
const fetchFreshWorkOrders = async () => {
  try {
    const response = await fetch(SummaryApi.getTechnicianWorkOrders.url, {
      method: SummaryApi.getTechnicianWorkOrders.method,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Process the data to ensure project categories are properly set
      const processedData = data.data.map(order => {
        let updatedOrder = { ...order };
        
        // If projectType contains repair-related keywords but category is not set
        if ((order.projectType?.toLowerCase().includes('repair') || 
             order.projectType?.toLowerCase().includes('complaint')) && 
            !order.projectCategory) {
          updatedOrder.projectCategory = 'Repair';
        }
        
        // Ensure we keep any originalTechnician data if it was already in state
        if (!updatedOrder.originalTechnician) {
          const existingOrder = workOrders.find(o => o.orderId === order.orderId);
          if (existingOrder && existingOrder.originalTechnician) {
            updatedOrder.originalTechnician = existingOrder.originalTechnician;
          }
        }
        
        return updatedOrder;
      });
      
      // Split active and completed work orders
      const active = [];
      const completed = [];
      const transferred = [];
      
      processedData.forEach(order => {
        if (order.status === 'completed') {
          completed.push(order);
        } else if (order.status === 'transferring' || order.status === 'transferred') {
          transferred.push(order);
        } else {
          active.push(order);
        }
      });
      
      setWorkOrders(active);
      setCompletedOrders(completed);
      setTransferredProjects(transferred);
      
      // Update cache
      localStorage.setItem('technicianWorkOrders', JSON.stringify(processedData));
      
      // Update refresh time
      setLastRefreshTime(prev => ({...prev, workOrders: new Date().getTime()}));
    } else {
      setError('Failed to load work orders: ' + data.message);
    }
  } catch (err) {
    throw err;
  }
};

  // Calculate total units across all inventory items
  const calculateTotalUnits = () => {
    return inventoryItems.reduce((total, item) => {
      if (item.type === 'serialized-product') {
        const activeCount = item.serializedItems?.filter(si => si.status === 'active').length || 0;
        return total + activeCount;
      } else {
        return total + (item.genericQuantity || 0);
      }
    }, 0);
  };



  const getCategoryColorClass = (category) => {
    if (category === 'Repair') {
      return darkMode ? 'bg-purple-600' : 'bg-purple-500';
    }
    // Default to blue for 'New Installation'
    return darkMode ? 'bg-blue-600' : 'bg-blue-500';
  };

  // Get status color
  const getStatusColor = (status) => {
    if (darkMode) {
      switch(status) {
        case 'assigned': return 'bg-blue-500';
        case 'in-progress': return 'bg-purple-500';
        case 'pending-approval': return 'bg-amber-500';
        case 'paused': return 'bg-orange-500';
        case 'completed': return 'bg-green-500';
        default: return 'bg-blue-500';
      }
    } else {
      switch(status) {
        case 'assigned': return 'bg-blue-600';
        case 'in-progress': return 'bg-purple-600';
        case 'pending-approval': return 'bg-amber-600';
        case 'paused': return 'bg-orange-600';
        case 'completed': return 'bg-green-600';
        default: return 'bg-blue-600';
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchInventory();
      await fetchReturnRequests();
      await fetchWorkOrders();
    };
    
    loadData();
  }, []);

  // Handle inventory item click
  const handleInventoryClick = (item) => {
    setSelectedInventory(item);
    setShowInventoryModal(true);
  };

  // Handle work order click
  const handleWorkOrderClick = async (workOrder) => {
    // Check the status and redirect or open modal based on it
  if (workOrder.status === 'in-progress') {
    // Redirect to current-project tab
    handleTabChange('current-project');
    return;
  } else if (workOrder.status === 'pending-approval') {
    // Redirect to pending-approval-projects tab
    handleTabChange('pending-approval-projects');
    return;
  } else if (workOrder.status === 'completed') {
    // Redirect to pending-approval-projects tab
    handleTabChange('completed');
    return;
  } else if (workOrder.status === 'paused') {
    // For paused projects, open the modal
    // Logic to fetch data and show modal
  } else if (workOrder.status === 'assigned') {
    // For assigned projects, open the modal
    // Logic to fetch data and show modal
  }

    // अगर workOrder में पहले से billingInfo है, तो नवीनतम डेटा फेच करें
    if (workOrder.billingInfo && workOrder.billingInfo.length > 0) {
      try {
        const response = await fetch(`${SummaryApi.getWorkOrderDetails.url}/${workOrder.customerId}/${workOrder.orderId}`, {
          method: SummaryApi.getWorkOrderDetails.method,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // अपडेटेड वर्क ऑर्डर को सेट करें
          setSelectedWorkOrder(data.data);
        } else {
          // अगर फेच फेल होता है तो मूल वर्क ऑर्डर को सेट करें
          setSelectedWorkOrder(workOrder);
        }
      } catch (err) {
        console.error('Error fetching detailed work order:', err);
        setSelectedWorkOrder(workOrder);
      }
    } else {
      // अगर कोई पेमेंट नहीं है तो सीधे सेट करें
      setSelectedWorkOrder(workOrder);
    }
    
    setShowWorkOrderModal(true);
  };

  // Handle work order status update
  const handleWorkOrderStatusUpdate = (updatedWorkOrder) => {
    console.log("Work order updated:", updatedWorkOrder);
    
    // Update the selected work order
    if (selectedWorkOrder && selectedWorkOrder.orderId === updatedWorkOrder.orderId) {
      setSelectedWorkOrder(updatedWorkOrder);
    }
    
    // Update the work order in our state
    if (updatedWorkOrder.status === 'completed') {
      // Move to completed orders
      setWorkOrders(prevOrders => 
        prevOrders.filter(order => order.orderId !== updatedWorkOrder.orderId)
      );
      setCompletedOrders(prevOrders => [updatedWorkOrder, ...prevOrders]);
    } else {
      setWorkOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.orderId === updatedWorkOrder.orderId) {
            return updatedWorkOrder;
          }
          return order;
        });
      });
    }
    
    // Update localStorage cache
    const cachedOrders = localStorage.getItem('technicianWorkOrders');
    if (cachedOrders) {
      const parsedOrders = JSON.parse(cachedOrders);
      const updatedOrders = parsedOrders.map(order => {
        if (order.orderId === updatedWorkOrder.orderId) {
          return updatedWorkOrder;
        }
        return order;
      });
      
      localStorage.setItem('technicianWorkOrders', JSON.stringify(updatedOrders));
      localStorage.setItem('technicianWorkOrdersTimestamp', new Date().getTime().toString());
    }

    // Agar project resumed hua hai, to current-project tab par switch kar do
  if (updatedWorkOrder.status === 'in-progress') {
    handleTabChange('current-project');
  }
  };

  if (loading) return <LoadingSpinner />;

  // Filter active inventory items (with quantity > 0 or active serial numbers)
  const activeInventoryItems = inventoryItems.filter(item => {
    if (item.type === 'serialized-product') {
      return item.serializedItems && item.serializedItems.some(si => si.status === 'active');
    } else {
      return item.genericQuantity > 0;
    }
  });

  // Get work orders from the last 2 days for tasks display
  const activeWorkOrders = getActiveWorkOrders();

  return (
    <div className="w-full sm:max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header - Fixed */}
      <div className="bg-slate-800 text-white px-4 py-3 flex-shrink-0 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div>
              <div className="text-md text-slate-300">{getGreeting()},</div>
              <div className="text-lg capitalize font-semibold">{user?.firstName || 'Engineer'}</div>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-3 px-3 py-2 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 rounded-lg border border-gray-700 h-[50px]"
            >
              {/* Profile Picture with Online Status */}
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                )}
                {/* Online Status Dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white">
                  <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Name and Role */}
              <div className="flex flex-col items-start">
                {/* <span className="text-xs font-medium text-white capitalize">
                  {user?.firstName}
                </span> */}
                <span className="text-sm text-gray-200 capitalize">
                  {getDisplayRole(user?.role) || 'User'}
                </span>
              </div>

              {/* Dropdown Arrow */}
              <ChevronDown className={`w-3 h-3 text-gray-200 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
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
                      <span className="text-sm text-gray-200 capitalize">{getDisplayRole(user?.role) || 'User'}</span>
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
                      setShowSettingsModal(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors duration-150"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <hr className="my-1 border-gray-200" />

                  <button
                    onClick={() => {
                      setShowLogoutPopup(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-600 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
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
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto p-2 min-h-0">
        {activeTab === 'home' && (
          <div className="px-1 py-2">
            {/* Today's Schedule Card */}
            <div className="bg-white rounded-lg shadow-md p-3 mb-3">
              <div className="text-gray-600 text-xs mb-1">Today's Schedule</div>
              <div className="text-base font-bold text-gray-800 mb-3">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Active Assignments */}
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-2">
                  <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center mb-1">
                    <FileText size={12} className="text-white" />
                  </div>
                  <div className="text-xs text-slate-600 mb-1">Active Assignments</div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-xl font-bold text-slate-800">
                      {workOrders.filter(order => order.status === 'assigned' || order.status === 'in-progress').length}
                    </div>
                    <div className="text-xs text-slate-600">tasks</div>
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 cursor-pointer" onClick={() => handleTabChange('pending-approval-projects')}>
                  <div className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center mb-1">
                    <Calendar size={12} className="text-white" />
                  </div>
                  <div className="text-xs text-orange-700 mb-1">Pending Approvals</div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-xl font-bold text-orange-800">
                      {workOrders.filter(order => order.status === 'pending-approval').length}
                    </div>
                    <div className="text-xs text-orange-700">tasks</div>
                  </div>
                </div>

                {/* Completed */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center mb-1">
                    <Check size={12} className="text-white" />
                  </div>
                  <div className="text-xs text-green-700 mb-1">Completed</div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-xl font-bold text-green-800">{completedOrders.length}</div>
                    <div className="text-xs text-green-700">tasks</div>
                  </div>
                </div>

                {/* Inventory Items */}
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 cursor-pointer" onClick={() => handleTabChange('inventory')}>
                  <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center mb-1">
                    <div className="w-3 h-3 border-2 border-white rounded"></div>
                  </div>
                  <div className="text-xs text-slate-600 mb-1">Inventory Items</div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-xl font-bold text-slate-800">{calculateTotalUnits()}</div>
                    <div className="text-xs text-slate-600">units</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Tasks Section */}
            <div className="bg-white rounded-lg shadow-md p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Your Tasks</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200 hover:bg-orange-200"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => handleTabChange('inventory')}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 hover:bg-slate-200"
                  >
                    View Inventory
                  </button>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {/* Today's Return Requests */}
                {getTodaysReturnRequests().map((request, index) => (
                  <div
                    key={`return-${request.id}`}
                    className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200 cursor-pointer"
                    onClick={() => handleReturnRequestClick(request)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      request.status === 'pending' ? 'bg-orange-500' :
                      request.status === 'confirmed' ? 'bg-green-500' :
                      request.status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}>
                      <Package size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800">
                        Return Request - {request.itemCount} item{request.itemCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        {request.totalQuantity} units • {
                          request.status === 'pending' ? 'Pending Review' :
                          request.status === 'confirmed' ? 'Confirmed' :
                          request.status === 'rejected' ? 'Rejected' :
                          request.status
                        }
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'pending' ? 'Pending' :
                       request.status === 'confirmed' ? 'Confirmed' :
                       request.status === 'rejected' ? 'Rejected' :
                       request.status}
                    </div>
                  </div>
                ))}

                {/* Work Orders */}
                {activeWorkOrders.length > 0 ? (
                  activeWorkOrders.map((order, index) => (
                    <div
                      key={order.orderId || `order-${index}`}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200 cursor-pointer"
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                        {order.projectCategory === 'Repair' ? (
                          <div className="w-3 h-3 border-2 border-white rounded"></div>
                        ) : (
                          <FileText size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-800">{order.projectType}</div>
                        <div className="text-xs text-slate-700 bg-slate-200 inline-block px-2 py-0.5 rounded mt-0.5">
                          {order.projectCategory || 'New Installation'}
                        </div>
                        {order.customerName && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                            <User size={10} />
                            <span>{order.customerName}</span>
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${
                        order.status === 'assigned' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        order.status === 'in-progress' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        order.status === 'pending-approval' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        order.status === 'paused' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        order.status === 'transferring' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        {order.status === 'pending-approval' ? 'Pending-Approval' :
                         order.status === 'in-progress' ? 'In Progress' :
                         order.status === 'paused' ? 'Paused' :
                         order.status}
                      </div>
                    </div>
                  ))
                ) : getTodaysReturnRequests().length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No tasks assigned yet</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

{/* Modify the inventory tab section in TechnicianDashboard.jsx */}

{activeTab === 'inventory' && (
  <div className="px-1 py-2">
    {/* My Inventory Card */}
    <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg shadow-md p-4 mb-3 text-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
          <Package size={16} className="text-white" />
        </div>
        <div>
          <div className="text-lg font-bold">My Inventory</div>
          <div className="text-sm opacity-90">Manage your stock</div>
        </div>
      </div>

      {/* Total Units */}
      <div className="bg-teal-300/30 rounded-lg p-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-90">Total Units:</span>
          <span className="text-xl font-bold">{calculateTotalUnits()} items</span>
        </div>
      </div>

      {/* Return Items and View Logs Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowReturnModal(true)}
          className="flex-1 bg-teal-700 hover:bg-teal-600 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Return Items
        </button>
        <button
          onClick={() => setShowReturnLogsModal(true)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm"
        >
          <Clock size={16} />
          View Logs
        </button>
      </div>
    </div>

    {/* Inventory Items Section */}
    <div className="bg-white rounded-lg shadow-md p-3">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Inventory Items</h3>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setInventoryFilter('Serialized')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            inventoryFilter === 'Serialized'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Serialized
        </button>
        <button
          onClick={() => setInventoryFilter('Generic')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            inventoryFilter === 'Generic'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Generic
        </button>
        <button
          onClick={() => setInventoryFilter('Services')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            inventoryFilter === 'Services'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Services
        </button>
      </div>

      {/* Inventory List */}
      <div className="space-y-2">
        {filteredInventoryItems.length > 0 ? (
          filteredInventoryItems.map((item, index) => {
            const itemKey = item._id || item.id || item.itemId || `item-${item.itemName}-${Date.now()}`;
            const itemCount = item.type === 'service' ? 'N/A' : getItemQuantity(item);
            const isExpanded = expandedItems.includes(itemKey);

            return (
              <div key={itemKey}>
                <div
                  className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                  onClick={() => handleItemExpand(itemKey, item)}
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm text-slate-800">{item.itemName}</span>
                      {item.type === 'serialized-product' && (
                        <ChevronDown size={12} className={`text-slate-600 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`} />
                      )}
                    </div>
                    <div className="text-xs text-slate-600 capitalize">
                      {item.type === 'service' ? 'Service' : item.type.replace('-product', '')}
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                    {item.type === 'service' ? `₹${item.salePrice}` : `${itemCount} ${item.unit || 'Piece'}`}
                  </div>
                </div>

                {/* Expanded view for serialized items */}
                {item.type === 'serialized-product' && isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <div className="ml-8 border-l-2 border-blue-500 pl-4 space-y-2">
                      {item.serializedItems && item.serializedItems.filter(serial => serial.status === 'active').map((serial, idx) => (
                        <div
                          key={serial.serialNumber || idx}
                          className="p-2 rounded bg-white text-sm border border-blue-100"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Serial Number:</span>
                            <span className="text-gray-600">{serial.serialNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              {inventoryFilter === 'All'
                ? 'No inventory items assigned yet'
                : `No ${inventoryFilter.toLowerCase()} items found`}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'current-project' && (
  <div className="px-1 py-2">
    {(() => {
      const activeProject = workOrders.find(order => order.status === 'in-progress');

      if (!activeProject) {
        return (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clipboard size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Active Project</h3>
            <p className="text-gray-500 mb-4">
              You don't have any in-progress project at the moment.
            </p>
            <button
              onClick={() => handleTabChange('home')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Go to Home
            </button>
          </div>
        );
      }

      // Get most recent status update for brief history
      const recentUpdate = activeProject.statusHistory &&
        activeProject.statusHistory.length > 0 ?
        activeProject.statusHistory[activeProject.statusHistory.length - 1] : null;

      return (
        <>
          {/* Active Projects Card */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-md p-4 mb-3 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">Active Projects</div>
                <div className="text-sm opacity-90">Current assignment</div>
              </div>
            </div>

            {/* Project Details */}
            <div className="mb-4">
              <div className="text-lg font-bold mb-1">{activeProject.projectType}</div>
              <div className="text-sm opacity-90">Type: {activeProject.projectCategory || 'New Installation'}</div>
            </div>

            {/* Generate Bill Button */}
            <button
              onClick={() => handleGenerateBill(activeProject)}
              className="w-full bg-blue-700 hover:bg-blue-800 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm"
            >
              <FileText size={16} />
              Generate Bill
            </button>
          </div>

          {/* Contact Cards */}
          <div className="space-y-3">
            {/* Customer Contact */}
            <div className="bg-white rounded-lg shadow-md p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-1">{activeProject.customerName}</h3>
              {activeProject.customerAddress && (
                <p className="text-xs text-gray-600 mb-3">{activeProject.customerAddress}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleMessageCustomer(activeProject)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <MessageSquare size={14} />
                  Message
                </button>
                <button
                  onClick={() => handleCallCustomer(activeProject)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Phone size={14} />
                  Call
                </button>
              </div>
            </div>

            {/* Setup Technician - Only show for Repair/Complaint projects */}
            {(activeProject.projectCategory === 'Repair' ||
              activeProject.projectType?.toLowerCase().includes('repair') ||
              activeProject.projectType?.toLowerCase().includes('complaint')) &&
              activeProject.originalTechnician && (
              <div className="bg-white rounded-lg shadow-md p-3">
                <h3 className="text-sm font-bold text-purple-600 mb-1">Setup Technician</h3>
                <p className="text-sm text-gray-800 mb-1">
                  {activeProject.originalTechnician.firstName} {activeProject.originalTechnician.lastName}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Installation date: {activeProject.projectCreatedAt ? formatDate(activeProject.projectCreatedAt) : 'N/A'}
                </p>

                <button
                  onClick={() => handleCallOriginalTechnician(activeProject)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Phone size={14} />
                  Call Original Technician
                </button>
              </div>
            )}

            {/* Report History */}
            <div className="bg-white rounded-lg shadow-md p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Report History</h3>
              <p className="text-xs text-gray-600 mb-3">Recent updates</p>

              {/* Status Update */}
              {recentUpdate && (
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="w-1 h-full bg-blue-400 rounded-full mr-3 float-left mt-1"></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-800">
                        {recentUpdate.updatedBy && recentUpdate.updatedBy.toString() === user._id.toString() ? 'Technician' : 'Manager'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {recentUpdate.remark || `Status changed to ${recentUpdate.status}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{formatDate(recentUpdate.updatedAt)}</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowFullHistory(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-blue-500 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium border border-slate-200"
              >
                <Eye size={14} />
                View Complete History
              </button>
            </div>

            {/* Pause and Stop Project Buttons - Your existing functionality */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowStopProjectModal(true)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <FiPause size={14} />
                Pause Project
              </button>

              <button
                onClick={() => setShowTransferModal(true)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <ArrowLeft size={14} />
                Stop Project
              </button>
            </div>
          </div>

            {/* Full History Modal */}
            {showFullHistory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
    <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-bold text-lg">Report History</h3>
        <button
          onClick={() => setShowFullHistory(false)}
          className="p-1"
        >
          <X size={20} />
        </button>
      </div>
     
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {/* Manager's initial instruction */}
        <div className="mb-3">
          <div className={`rounded-lg p-3 max-w-xs mb-2 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <div className="flex justify-between mb-1">
              <p className="font-medium text-sm">Manager</p>
              <p className="text-xs opacity-70">
                {formatDate(activeProject.assignedAt || activeProject.createdAt).split(',')[0]}
              </p>
            </div>
            <p className="text-sm">
              {activeProject.initialRemark || 'Assignment created for ' + activeProject.projectType}
            </p>
            <span className="text-xs opacity-70 flex justify-end">
              {formatDate(activeProject.assignedAt || activeProject.createdAt).split(',')[1]}
            </span>
          </div>
          
          {activeProject.instructions && (
          <div className={`rounded-lg p-3 max-w-xs ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <div className="flex justify-between mb-1">
              <p className="font-medium text-sm">Manager</p>
              <p className="text-xs opacity-70">
                {formatDate(activeProject.assignedAt || activeProject.createdAt).split(',')[0]}
              </p>
            </div>
            <p className="text-sm">
              {activeProject.instructions}
            </p>
            <span className="text-xs opacity-70 flex justify-end">
              {formatDate(activeProject.assignedAt || activeProject.createdAt).split(',')[1]}
            </span>
          </div>
          )}

        </div>
       
        {/* Status history as chat messages */}
        {activeProject.statusHistory && activeProject.statusHistory.map((history, index) => {
          const isTechnician = history.updatedBy && history.updatedBy.toString() === user._id.toString();
          return (
            <div
              key={index}
              className={`mb-3 ${isTechnician ? 'flex justify-end' : ''}`}
            >
              <div className={`rounded-lg p-3 max-w-xs ${
                isTechnician
                  ? `${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`
                  : `${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`
              }`}>
                <div className="flex justify-between mb-1">
                  <p className="font-medium text-sm">
                    {isTechnician ? 'Technician' : 'Manager'}
                  </p>
                  <p className="text-xs opacity-70">
                    {formatDate(history.updatedAt).split(',')[0]}
                  </p>
                </div>
                <p className="text-sm">
                  {history.remark || `Status changed to ${history.status}`}
                </p>
                <span className="text-xs opacity-70 flex justify-end">
                  {formatDate(history.updatedAt).split(',')[1]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t">
        <button 
          onClick={() => setShowFullHistory(false)} 
          className={`w-full py-2 ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded-lg`}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

          {/* Stop Project Modal */}
          {showStopProjectModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl`}>
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-bold text-lg">Pause Project</h3>
                  <button
                    onClick={() => setShowStopProjectModal(false)}
                    className="p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <p className="mb-4">Are you sure you want to pause this project? Please provide a reason:</p>
                  <textarea
                    value={pauseProjectRemark}
                    onChange={(e) => setPauseProjectRemark(e.target.value)}
                    placeholder="Enter reason for pausing..."
                    className={`w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    rows={3}
                  />
                  <div className="flex mt-4">
                    <button
                      onClick={() => setShowStopProjectModal(false)}
                      className="flex-1 py-2 bg-gray-500 text-white rounded-lg mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleStopProject(activeProject)}
                      className="flex-1 ml-2 py-2 bg-red-500 text-white rounded-lg"
                      disabled={!pauseProjectRemark.trim()}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pause Confirmation Modal */}
          {showPauseConfirmationModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl`}>
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-bold text-lg">Confirm Pause</h3>
                  <button
                    onClick={() => setShowPauseConfirmationModal(false)}
                    className="p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-center mb-4">
                    You are about to pause your project with the following reason:
                  </p>
                  <div className={`p-3 rounded-md mb-4 text-gray-700 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100'}`}>
                    "{pauseProjectRemark}"
                  </div>
                  <p className="text-center mb-6 font-medium">
                    Are you sure you want to pause this project?
                  </p>

                  <div className="flex p-4 border-t">
                    <button
                      onClick={() => setShowPauseConfirmationModal(false)}
                      className="flex-1 mr-2 py-2 border border-gray-300 rounded-lg text-gray-700"
                    >
                      No
                    </button>
                    <button
                      onClick={() => confirmPauseProject(activeProject)}
                      className="flex-1 ml-2 py-2 bg-red-500 text-white rounded-lg"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer/Stop Project Modal */}
          {showTransferModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl`}>
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-bold text-lg">Stop Project</h3>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-gray-600 mb-4">
                    Stopping a project will transfer it back to the manager for reassignment.
                    Please provide a detailed reason for stopping this project.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Stopping Project*
                  </label>
                  <textarea
                    className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'} border mb-4`}
                    rows="4"
                    placeholder="Enter detailed reason for stopping this project..."
                    value={transferRemark}
                    onChange={(e) => setTransferRemark(e.target.value)}
                  />

                  <div className="flex p-4 border-t">
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="flex-1 mr-2 py-2 border border-gray-300 rounded-lg text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleTransferProject(activeProject)}
                      className="flex-1 ml-2 py-2 bg-red-500 text-white rounded-lg"
                      disabled={!transferRemark.trim()}
                    >
                      Stop Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stop Project Confirmation Modal */}
          {showStopConfirmationModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl`}>
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-bold text-lg">Confirm Stop Project</h3>
                  <button
                    onClick={() => setShowStopConfirmationModal(false)}
                    className="p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-center mb-4">
                    You are about to stop your project with the following reason:
                  </p>
                  <div className={`p-3 rounded-md mb-4 text-gray-700 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100'}`}>
                    "{transferRemark}"
                  </div>
                  <p className="text-center mb-6 font-medium text-red-600">
                    Are you sure you want to stop this project? This will transfer it back to the manager.
                  </p>

                  <div className="flex p-4 border-t">
                    <button
                      onClick={() => setShowStopConfirmationModal(false)}
                      className="flex-1 mr-2 py-2 border border-gray-300 rounded-lg text-gray-700"
                    >
                      No
                    </button>
                    <button
                      onClick={() => confirmStopProject(activeProject)}
                      className="flex-1 ml-2 py-2 bg-red-500 text-white rounded-lg"
                    >
                      Yes, Stop Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}


        {activeTab === 'all-projects' && (
          <div className="px-1 py-2">
            {/* All Projects Card */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                  <List size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">All Projects</div>
                  <div className="text-sm text-slate-600">Overview of your assignments</div>
                </div>
              </div>

              {/* Total Projects */}
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Projects:</span>
                  <span className="text-xl font-bold text-slate-800">{workOrders.length + completedOrders.length}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Assigned */}
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
                  <div className="text-2xl font-bold text-slate-800">{workOrders.filter(order => order.status === 'assigned').length}</div>
                  <div className="text-xs text-slate-600">Assigned</div>
                </div>

                {/* Approval */}
                <div
                  className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center cursor-pointer"
                  onClick={() => handleTabChange('pending-approval-projects')}
                >
                  <div className="text-2xl font-bold text-orange-800">{workOrders.filter(order => order.status === 'pending-approval').length}</div>
                  <div className="text-xs text-orange-700">Approval</div>
                </div>

                {/* Paused */}
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
                  <div className="text-2xl font-bold text-slate-800">{workOrders.filter(order => order.status === 'paused').length}</div>
                  <div className="text-xs text-slate-600">Paused</div>
                </div>

                {/* Completed */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <div className="text-2xl font-bold text-green-800">{completedOrders.length}</div>
                  <div className="text-xs text-green-700">Completed</div>
                </div>
              </div>
            </div>

            {/* Active Assignments Section */}
            <div className="bg-white rounded-lg shadow-md p-3">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Active Assignments</h3>

              {/* Assignment List */}
              <div className="space-y-2">
                {workOrders.length > 0 ? (
                  workOrders.map((order) => (
                    <div
                      key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200 cursor-pointer"
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        order.status === 'pending-approval' ? 'bg-orange-500' :
                        order.status === 'in-progress' ? 'bg-blue-500' :
                        order.status === 'assigned' ? 'bg-blue-500' :
                        order.status === 'paused' ? 'bg-yellow-500' :
                        order.status === 'rejected' ? 'bg-red-500' :
                        'bg-slate-600'
                      }`}>
                        <FileText size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-800">{order.projectType}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Order ID: {order.orderId}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${
                        order.status === 'pending-approval' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        order.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        order.status === 'assigned' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        order.status === 'paused' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        order.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {order.status === 'pending-approval' ? 'Pending-Approval' :
                         order.status === 'in-progress' ? 'In Progress' :
                         order.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No active assignments</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'completed' && (
          <div className="flex flex-col space-y-6 px-1 py-2">
            {/* Completed Summary */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} p-6 rounded-2xl shadow-xl text-white`}>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center shadow-xl mr-4">
                  <CheckSquare size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">Completed Projects</p>
                  <p className={`${darkMode ? 'text-green-200' : 'text-green-100'}`}>Your finished assignments</p>
                </div>
              </div>
              
              <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`${darkMode ? 'text-green-200' : 'text-green-100'}`}>Total completed:</span>
                  <span className="text-white text-xl font-bold">{completedOrders.length} projects</span>
                </div>
                
                {completedOrders.length > 0 && (
                  <button 
                    onClick={() => handleWorkOrderClick(completedOrders[0])}
                    className="bg-green-700 hover:bg-green-800 text-white w-full py-2 rounded-lg flex items-center justify-center mt-2"
                  >
                    <Eye size={16} className="mr-2" /> View Latest Completed
                  </button>
                )}
              </div>
            </div>
            
            {/* Completed Work Orders */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
              <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <h2 className="font-bold text-lg">Completed Assignments</h2>
              </div>
              
              <div>
                {completedOrders.length > 0 ? (
                  completedOrders.map((order) => (
                    <div 
                      key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
                      className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
                      onClick={() => handleWorkOrderClick(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center mr-3`}>
                            <CheckSquare size={18} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-medium truncate max-w-[140px] ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {order.projectType}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Order ID: {order.orderId}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${darkMode ? 'bg-green-600/40 text-green-100' : 'bg-green-100 text-green-800'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No completed assignments yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

{activeTab === 'pending-approval-projects' && (
  <div className="px-1 py-2">
    {/* Pending Approvals Card */}
    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-md p-4 mb-3 text-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-orange-700 rounded-lg flex items-center justify-center">
          <Calendar size={16} className="text-white" />
        </div>
        <div>
          <div className="text-lg font-bold">Pending Approvals</div>
          <div className="text-sm opacity-90">Projects awaiting approval</div>
        </div>
      </div>

      {/* Total Pending */}
      <div className="bg-orange-300/30 rounded-lg p-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-90">Total Pending:</span>
          <span className="text-xl font-bold">{workOrders.filter(order => order.status === 'pending-approval').length} projects</span>
        </div>
      </div>

      {/* Back to Home Button */}
      <button
        className="w-full bg-orange-700 hover:bg-orange-800 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm"
        onClick={() => handleTabChange('home')}
      >
        <Home size={16} />
        Back to Home
      </button>
    </div>

    {/* Pending Approval Projects Section */}
    <div className="bg-white rounded-lg shadow-md p-3">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Pending Approval Projects</h3>

      {/* Project List */}
      <div className="space-y-2">
        {workOrders.filter(order => order.status === 'pending-approval').length > 0 ? (
          workOrders.filter(order => order.status === 'pending-approval').map((order) => (
            <div
              key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`}
              className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200 cursor-pointer"
              onClick={() => handleWorkOrderClick(order)}
            >
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Calendar size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800">{order.projectType}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Order ID: {order.orderId}
                </div>
              </div>
              <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
                Pending-Approval
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No pending approval projects</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'paused-projects' && (
  <div className="flex flex-col space-y-6 px-1 py-2">
    {/* Paused Projects Summary */}
    <div className={`${darkMode ? 'bg-gradient-to-br from-orange-600 to-orange-800' : 'bg-gradient-to-br from-orange-500 to-orange-600'} p-6 rounded-2xl shadow-xl text-white`}>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-orange-700 rounded-full flex items-center justify-center shadow-xl mr-4">
          <Clock size={32} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold mb-1">Paused Projects</p>
          <p className={`${darkMode ? 'text-orange-200' : 'text-orange-100'}`}>Temporarily stopped assignments</p>
        </div>
      </div>
      
      <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
        <div className="flex justify-between items-center mb-4">
          <span className={`${darkMode ? 'text-orange-200' : 'text-orange-100'}`}>Total Paused:</span>
          <span className="text-white text-xl font-bold">{workOrders.filter(order => order.status === 'paused').length} projects</span>
        </div>
        
        <button 
          onClick={() => handleTabChange('home')}
          className="bg-orange-700 hover:bg-orange-800 text-white w-full py-2 rounded-lg flex items-center justify-center mt-2"
        >
          <Home size={16} className="mr-2" /> Back to Home
        </button>
      </div>
    </div>
    
    {/* Paused Projects List */}
    <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
      <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
        <h2 className="font-bold text-lg">Paused Projects</h2>
      </div>
      
      <div>
        {workOrders.filter(order => order.status === 'paused').length > 0 ? (
          workOrders.filter(order => order.status === 'paused').map((order) => (
            <div 
              key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
              className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
              onClick={() => handleWorkOrderClick(order)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center max-w-[200px]">
                  <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-orange-600' : 'bg-orange-500'} flex items-center justify-center mr-3`}>
                    <Clock size={18} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-medium truncate max-w-[140px] ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {order.projectType}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Order ID: {order.orderId}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${darkMode ? 'bg-orange-600/40 text-orange-100' : 'bg-orange-100 text-orange-800'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No paused projects</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'assigned-projects' && (
  <div className="flex flex-col space-y-6 px-1 py-2">
    {/* Assigned Projects Summary */}
    <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} p-6 rounded-2xl shadow-xl text-white`}>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center shadow-xl mr-4">
          <Clipboard size={32} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold mb-1">Assigned Projects</p>
          <p className={`${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>New assignments ready to start</p>
        </div>
      </div>
      
      <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
        <div className="flex justify-between items-center mb-4">
          <span className={`${darkMode ? 'text-blue-200' : 'text-blue-100'}`}>Total Assigned:</span>
          <span className="text-white text-xl font-bold">{workOrders.filter(order => order.status === 'assigned').length} projects</span>
        </div>
        
        <button 
          onClick={() => handleTabChange('home')}
          className="bg-blue-700 hover:bg-blue-800 text-white w-full py-2 rounded-lg flex items-center justify-center mt-2"
        >
          <Home size={16} className="mr-2" /> Back to Home
        </button>
      </div>
    </div>
    
    {/* Assigned Projects List */}
    <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
      <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
        <h2 className="font-bold text-lg">Assigned Projects</h2>
      </div>
      
      <div>
        {workOrders.filter(order => order.status === 'assigned').length > 0 ? (
          workOrders.filter(order => order.status === 'assigned').map((order) => (
            <div 
              key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
              className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
              onClick={() => handleWorkOrderClick(order)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center max-w-[200px]">
                  <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center mr-3`}>
                    <Clipboard size={18} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-medium truncate max-w-[140px] ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {order.projectType}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Order ID: {order.orderId}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${darkMode ? 'bg-blue-600/40 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No assigned projects</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'transferred-projects' && (
  <div className="flex flex-col space-y-6 px-1 py-2">
    {/* Transferred Projects Summary */}
    <div className={`${darkMode ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-red-500 to-red-600'} p-6 rounded-2xl shadow-xl text-white`}>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center shadow-xl mr-4">
          <ArrowLeft size={32} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold mb-1">Transferred Projects</p>
          <p className={`${darkMode ? 'text-red-200' : 'text-red-100'}`}>Projects transferred to others</p>
        </div>
      </div>
      
      <div className={`${darkMode ? 'bg-white/10' : 'bg-white/20'} rounded-xl p-4 backdrop-blur-sm`}>
        <div className="flex justify-between items-center mb-4">
          <span className={`${darkMode ? 'text-red-200' : 'text-red-100'}`}>Total Transferred:</span>
          <span className="text-white text-xl font-bold">{transferredProjects.length} projects</span>
        </div>
      </div>
    </div>
    
    {/* Transferred Projects List */}
    <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} rounded-2xl shadow-xl overflow-hidden`}>
      <div className={`p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
        <h2 className="font-bold text-lg">Transferred Projects</h2>
      </div>
      
      <div>
        {transferredProjects.length > 0 ? (
          transferredProjects.map((order) => (
            <div 
              key={order.orderId || `order-${Math.random().toString(36).substr(2, 9)}`} 
              className={`p-4 ${darkMode ? 'border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50' : 'border-b border-gray-200 last:border-b-0 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
              onClick={() => handleWorkOrderClick(order)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center max-w-[200px]">
                  <div className={`w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mr-3`}>
                    <ArrowLeft size={18} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-medium truncate max-w-[140px] ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {order.projectType}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Order ID: {order.orderId}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs capitalize bg-red-100 text-red-800`}>
                  {order.status === 'transferred' ? 'Transferred' : 'Transfer Pending'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No transferred projects</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
      </main>

      {/* Add bottom padding to prevent content from being hidden behind fixed footer */}
      <div className="pb-20"></div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-gray-700 border-t p-1 text-white z-50 w-full">
        <div className="grid grid-cols-5 gap-1 px-2 pt-1">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 h-14 ${
              activeTab === 'home'
                ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white shadow-lg`
                : `${darkMode ? 'text-gray-400' : 'text-white'}`
            }`}
          >
            <div className="h-5 flex items-center">
              <Home size={22} />
            </div>
            <div className="h-5 flex items-center">
              <span className="text-xs mt-2">Home</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('inventory')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 h-14 ${
              activeTab === 'inventory'
                ? `${darkMode ? 'bg-gradient-to-r from-teal-600 to-teal-700' : 'bg-gradient-to-r from-teal-500 to-teal-600'} text-white shadow-lg`
                : `${darkMode ? 'text-gray-400' : 'text-white'}`
            }`}
          >
            <div className="h-5 flex items-center">
              <span className="text-lg font-bold">{calculateTotalUnits()}</span>
            </div>
            <div className="h-5 flex items-center">
              <span className="text-xs mt-2">{calculateTotalUnits()}</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('all-projects')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 h-14 ${
              activeTab === 'all-projects'
                ? `${darkMode ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-amber-500 to-amber-600'} text-white shadow-lg`
                : `${darkMode ? 'text-gray-400' : 'text-white'}`
            }`}
          >
            <div className="h-5 flex items-center">
              <List size={22} />
            </div>
            <div className="h-5 flex items-center">
              <span className="text-xs mt-2">All</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('pending-approval-projects')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 h-14 ${
              activeTab === 'pending-approval-projects'
                ? `${darkMode ? 'bg-gradient-to-br from-amber-600 to-amber-800' : 'bg-gradient-to-br from-amber-500 to-amber-600'} text-white shadow-lg`
                : `${darkMode ? 'text-gray-400' : 'text-white'}`
            }`}
          >
            <div className="h-5 flex items-center">
              <Check size={22} />
            </div>
            <div className="h-5 flex items-center">
              <span className="text-xs mt-2">Approval</span>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('current-project')}
            className={`flex flex-col items-center py-2 px-4 rounded-xl flex-1 mx-1 h-14 ${
              activeTab === 'current-project'
                ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white shadow-lg`
                : `${darkMode ? 'text-gray-400' : 'text-white'}`
            }`}
          >
            <div className="h-5 flex items-center">
              <Calendar size={22} />
            </div>
            <div className="h-5 flex items-center">
              <span className="text-xs mt-2">Current</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Add bottom padding to prevent content from being hidden behind fixed footer */}
      {/* <div className="pb-16"></div> */}

      {/* Logout Confirmation Popup */}
{showLogoutPopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl shadow-2xl p-6 max-w-sm w-full mx-auto`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Confirm Logout</h3>
        <button 
          onClick={() => setShowLogoutPopup(false)}
          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        </button>
      </div>
      <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Are you sure you want to logout from your account?
      </p>
      <div className="flex justify-end space-x-3">
        <button 
          onClick={() => setShowLogoutPopup(false)}
          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
        >
          Cancel
        </button>
        <button 
          onClick={handleLogout}
          className={`px-4 py-2 rounded-lg flex items-center ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  </div>
)}
      
      {/* Modals */}
      {showInventoryModal && (
        <InventoryDetailsModal 
          isOpen={showInventoryModal}
          onClose={() => {
            setShowInventoryModal(false);
            setSelectedInventory(null);
          }}
          inventory={inventoryItems}
          selectedItem={selectedInventory}
        />
      )}
      
{showWorkOrderModal && (
  <WorkOrderDetailsModal 
    isOpen={showWorkOrderModal}
    onClose={() => {
      setShowWorkOrderModal(false);
      if (selectedWorkOrder && selectedWorkOrder.billingInfo && selectedWorkOrder.billingInfo.length > 0) {
        fetchWorkOrders();
      }
      setSelectedWorkOrder(null);
    }}
    workOrder={selectedWorkOrder}
    onStatusUpdate={handleWorkOrderStatusUpdate}
    onProjectStarted={handleProjectStarted}
    darkMode={darkMode}
  />
)}

      {showReturnModal && (
        <ReturnInventoryModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onInventoryReturned={handleInventoryReturned}
        />
      )}

      {showReturnRequestModal && selectedReturnRequest && (
        <ReturnRequestDetailsModal
          isOpen={showReturnRequestModal}
          onClose={() => setShowReturnRequestModal(false)}
          requestData={selectedReturnRequest}
          darkMode={darkMode}
        />
      )}

      {showReturnLogsModal && (
        <ReturnLogsModal
          isOpen={showReturnLogsModal}
          onClose={() => setShowReturnLogsModal(false)}
          returnRequests={returnRequests}
          onRequestClick={handleReturnRequestClickFromLogs}
          darkMode={darkMode}
        />
      )}

{showBillModal && (
  <GenerateBillModal
    isOpen={showBillModal}
    onClose={handleBillModalClose}
    workOrder={selectedWorkOrder}
    onBillGenerated={handleBillGenerated}
    onDone={handleBillDone}
  />
)}

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

export default TechnicianDashboard;

