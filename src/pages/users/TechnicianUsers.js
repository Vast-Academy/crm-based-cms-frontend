import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiPackage, FiList, FiChevronDown } from 'react-icons/fi';
import { LuArrowDownUp, LuArrowUpDown } from "react-icons/lu";
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import AddTechnicianModal from '../../components/AddTechnicianModal'; // Updated import path
import AssignInventoryModal from '../inventory/AssignInventoryModal';
import UnifiedInventoryAssignmentModal from '../inventory/UnifiedInventoryAssignmentModal';
import TechnicianDetailModal from '../technician/TechnicianDetailModal';
import TechnicianInventoryModal from './TechnicianInventoryModal';

const TechnicianUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);
  
  // States for inventory assignment
  const [showAssignInventoryModal, setShowAssignInventoryModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  // New state for technician inventory modal
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedTechnicianForInventory, setSelectedTechnicianForInventory] = useState(null);

  // Refresh trigger for TechnicianInventoryModal
  const [inventoryRefreshTrigger, setInventoryRefreshTrigger] = useState(0);

  // Last refresh time tracking
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Cache staleness time - 15 minutes
  const CACHE_STALENESS_TIME = 15 * 60 * 1000;

  // Sorting states
  const [sortOrder, setSortOrder] = useState('asc'); // asc = A to Z for names
  const [sortField, setSortField] = useState('name'); // 'date' or 'name'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  const fetchTechnicians = async (forceFresh = false) => {
    try {
      // Get branch from URL params first, then fallback to user.selectedBranch
      const urlParams = new URLSearchParams(window.location.search);
      const urlBranch = urlParams.get('branch') || (user.role === 'admin' ? user.selectedBranch : '');
      const cacheKey = `technicianUsersData_${urlBranch || 'all'}`;

      // Check for cached data
      const cachedTechnicians = localStorage.getItem(cacheKey);

      // Use cached data if available and not forcing fresh data (instant load!)
      if (!forceFresh && cachedTechnicians) {
        const parsedTechnicians = JSON.parse(cachedTechnicians);
        setTechnicians(parsedTechnicians);
        // console.log("Using cached technician data");

        // Fetch fresh data in background silently
        fetchFreshTechniciansInBackground();
        setLoading(false);
        return;
      }

      // If no cache or force fresh, show loading and fetch new data
      setLoading(true);
      await fetchFreshTechnicians();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const urlParams = new URLSearchParams(window.location.search);
      const urlBranch = urlParams.get('branch') || (user.role === 'admin' ? user.selectedBranch : '');
      const cacheKey = `technicianUsersData_${urlBranch || 'all'}`;

      const cachedTechnicians = localStorage.getItem(cacheKey);

      if (cachedTechnicians) {
        const parsedTechnicians = JSON.parse(cachedTechnicians);
        setTechnicians(parsedTechnicians);
        console.log("Using cached technician data after fetch error");
      } else {
        setError('Server error. Please try again later.');
        console.error('Error fetching technicians:', err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch fresh data in background
  const fetchFreshTechniciansInBackground = async () => {
    try {
      await fetchFreshTechnicians(true);
    } catch (err) {
      console.error('Error fetching technician data in background:', err);
    }
  };
  
  // Function to fetch fresh data directly from API
  const fetchFreshTechnicians = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    
    try {
      // Get branch from URL params first, then fallback to user.selectedBranch
      const urlParams = new URLSearchParams(window.location.search);
      const urlBranch = urlParams.get('branch') || (user.role === 'admin' ? user.selectedBranch : '');
      console.log('Fetching technicians for branch:', urlBranch);
      let branchParam = '';
      if (urlBranch) {
        branchParam = `?branch=${urlBranch}`;
      }
      
      // We'll use different endpoints based on user role
      const baseEndpoint = user.role === 'admin' 
        ? SummaryApi.getTechnicianUsers.url 
        : SummaryApi.getManagerTechnician.url;
      
      const endpoint = baseEndpoint + branchParam;
      console.log('Fetch endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        const techniciansData = data.data || [];
        setTechnicians(techniciansData);

        // Cache the technicians data with branch-specific key
        const cacheKey = `technicianUsersData_${urlBranch || 'all'}`;
        localStorage.setItem(cacheKey, JSON.stringify(techniciansData));

        // Update last refresh time
        setLastRefreshTime(new Date().getTime());
        // console.log("Fresh technician data cached");
      } else {
        if (!isBackground) {
          setError('Failed to fetch technicians');
        }
      }
    } catch (err) {
      if (!isBackground) {
        setError('Server error. Please try again later.');
        console.error('Error fetching technicians:', err);
      }
      throw err;
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Don't clear cache on mount - let it serve instantly
    fetchTechnicians();
  }, [user.role, user.selectedBranch, window.location.search]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredTechnicians = technicians
    .filter(tech => {
      const fullName = `${tech.firstName} ${tech.lastName}`.toLowerCase();
      const term = searchTerm.toLowerCase();

      return (
        fullName.includes(term) ||
        tech.username.toLowerCase().includes(term) ||
        tech.email.toLowerCase().includes(term) ||
        (tech.branch && typeof tech.branch === 'object' && tech.branch.name.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        // Sort by creation date (createdAt)
        const dateA = a.createdAt || a.updatedAt || '';
        const dateB = b.createdAt || b.updatedAt || '';

        const comparison = new Date(dateB) - new Date(dateA);
        return sortOrder === 'desc' ? comparison : -comparison;
      } else if (sortField === 'name') {
        // Sort by technician name
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase().trim();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase().trim();

        if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      return 0;
    });
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this technician?')) {
      return;
    }

    try {
      const response = await fetch(`${SummaryApi.deleteUser.url}/${userId}`, {
        method: SummaryApi.deleteUser.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Clear all branch-specific caches
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('technicianUsersData_')) {
            localStorage.removeItem(key);
          }
        });

        // Update technicians list
        fetchFreshTechnicians();
      } else {
        setError(data.message || 'Failed to delete technician');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error deleting technician:', err);
    }
  };
  
  const handleViewDetails = (technicianId) => {
    setSelectedTechnicianId(technicianId);
    setShowDetailModal(true);
  };
  
  const handleAssignInventory = (technician) => {
    setSelectedTechnician(technician);
    setShowAssignInventoryModal(true);
  };
  
  // New handler for viewing inventory
  const handleViewInventory = (technician) => {
    setSelectedTechnicianForInventory(technician);
    setShowInventoryModal(true);
  };
  
  // Handle successful technician addition
  const handleTechnicianSuccess = () => {
    // Clear all branch-specific caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('technicianUsersData_')) {
        localStorage.removeItem(key);
      }
    });

    // Fetch fresh data
    fetchFreshTechnicians();
  };

  // Handle sort option selection
  const handleSortSelection = (field) => {
    if (sortField === field) {
      // Toggle order if same field selected
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default order
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc'); // date defaults to desc (newest first), name to asc
    }
    setIsSortDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="">
      {/* Main Container with White Box */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
              <p className="text-gray-600 mt-1">Manage your engineers</p>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => fetchFreshTechnicians()}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              title="Refresh Technicians"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
          </div>

          {/* Add Engineer button and Sort Dropdown */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 flex items-center whitespace-nowrap"
            >
              <FiPlus className="mr-2" /> Add Engineer
            </button>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {sortOrder === 'asc' ? (
                  <LuArrowDownUp className="h-4 w-4 mr-2" />
                ) : (
                  <LuArrowUpDown className="h-4 w-4 mr-2" />
                )}
                Sort
                <FiChevronDown className="ml-2 h-4 w-4" />
              </button>

              {/* Sort Dropdown Menu */}
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => handleSortSelection('name')}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        sortField === 'name' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Technician Name</span>
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? (
                          <LuArrowDownUp className="h-4 w-4" />
                        ) : (
                          <LuArrowUpDown className="h-4 w-4" />
                        )
                      )}
                    </button>
                    <button
                      onClick={() => handleSortSelection('date')}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                        sortField === 'date' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>Date Added</span>
                      {sortField === 'date' && (
                        sortOrder === 'asc' ? (
                          <LuArrowDownUp className="h-4 w-4" />
                        ) : (
                          <LuArrowUpDown className="h-4 w-4" />
                        )
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative flex-grow mt-4">
            <input
              type="text"
              placeholder="Search engineers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mx-4 mb-4 bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}
        
        {/* Technicians table */}
        <div className="border-t">
          {loading ? (
            <div className="p-4 text-center">Loading technicians...</div>
          ) : technicians.length === 0 ? (
            <div className="p-4 text-center">No technicians found</div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="p-4 text-center">No technicians match your search</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.NO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      USERNAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BRANCH
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTechnicians.map((technician, index) => (
                    <React.Fragment key={technician._id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetails(technician._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="">
                              <div className="text-sm font-medium text-gray-900">
                                {technician.firstName} {technician.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{technician.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {technician.branch && typeof technician.branch === 'object' 
                              ? technician.branch.name 
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              technician.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {technician.status}
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add the TechnicianDetailModal */}
      <TechnicianDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        technicianId={selectedTechnicianId}
        onTechnicianUpdated={() => {
          // Clear all branch-specific caches
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('technicianUsersData_')) {
              localStorage.removeItem(key);
            }
          });
          fetchFreshTechnicians();
        }}
        onAssignInventory={(technician) => {
          // Don't close detail modal, just open assign inventory modal
          handleAssignInventory(technician);
        }}
        onViewInventory={(technician) => {
          // Don't close detail modal, just open view inventory modal
          handleViewInventory(technician);
        }}
      />
      
      {/* Add Technician Modal for both admin and managers */}
      <AddTechnicianModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={handleTechnicianSuccess}
      />
      
      {/* Assign Inventory Modal */}
      {selectedTechnician && (
        <UnifiedInventoryAssignmentModal
          isOpen={showAssignInventoryModal}
          onClose={() => setShowAssignInventoryModal(false)}
          technician={selectedTechnician}
          onSuccess={() => {
            // Refresh the technicians list after successful assignment
            fetchFreshTechnicians();
            // Trigger refresh of TechnicianInventoryModal
            setInventoryRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      
      {/* Technician Inventory Modal */}
      {selectedTechnicianForInventory && (
        <TechnicianInventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          technician={selectedTechnicianForInventory}
          refreshTrigger={inventoryRefreshTrigger}
          onAssignInventory={(technician) => {
            // Open assign inventory modal when button is clicked in inventory modal
            handleAssignInventory(technician);
          }}
        />
      )}
    </div>
  );
};

export default TechnicianUsers;
