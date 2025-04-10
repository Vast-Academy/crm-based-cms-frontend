import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiPackage } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import AddTechnicianModal from '../../components/AddTechnicianModal';
import AssignInventoryModal from '../inventory/AssignInventoryModal';
import UnifiedInventoryAssignmentModal from '../inventory/UnifiedInventoryAssignmentModal';
import TechnicianDetailModal from '../technician/TechnicianDetailModal';

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
  
  // States for expanded rows and inventory assignment
  const [expandedTechnician, setExpandedTechnician] = useState(null);
  const [showAssignInventoryModal, setShowAssignInventoryModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);


  const handleRowClick = (technicianId) => {
    setExpandedTechnician(expandedTechnician === technicianId ? null : technicianId);
  };
  
  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      // We'll use different endpoints based on user role
      const endpoint = user.role === 'admin' 
        ? SummaryApi.getTechnicianUsers.url 
        : SummaryApi.getManagerTechnician.url;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTechnicians(data.data || []);
      } else {
        setError('Failed to fetch technicians');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching technicians:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTechnicians();
  }, [user.role]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredTechnicians = technicians.filter(tech => {
    const fullName = `${tech.firstName} ${tech.lastName}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return (
      fullName.includes(term) ||
      tech.username.toLowerCase().includes(term) ||
      tech.email.toLowerCase().includes(term) ||
      (tech.branch && typeof tech.branch === 'object' && tech.branch.name.toLowerCase().includes(term))
    );
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
        // Update technicians list
        fetchTechnicians();
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Technician Management</h1>
        
        {/* Conditional rendering based on user role */}
        {user.role === 'admin' ? (
          <Link
            to="/users/technicians/add"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <FiPlus className="mr-2" /> Add Technician
          </Link>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <FiPlus className="mr-2" /> Add Technician
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search technicians..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Technicians table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Loading technicians...</div>
        ) : technicians.length === 0 ? (
          <div className="p-4 text-center">No technicians found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username/Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTechnicians.map(technician => (
                  <React.Fragment key={technician._id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(technician._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 font-semibold">
                            {technician.firstName.charAt(0)}{technician.lastName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {technician.firstName} {technician.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {technician.phone || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{technician.username}</div>
                        <div className="text-sm text-gray-500">{technician.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {technician.branch && typeof technician.branch === 'object' 
                            ? technician.branch.name 
                            : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {technician.branch && typeof technician.branch === 'object' 
                            ? technician.branch.location 
                            : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            technician.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {technician.status}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Expanded row with action buttons */}
                    {expandedTechnician === technician._id && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 bg-gray-50">
                          <div className="flex space-x-4">
                            <button 
                              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(technician._id);
                              }}
                            >
                              <FiUser className="mr-2" />
                              View Details
                            </button>
                            
                            {user.role === 'manager' && (
                              <button 
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignInventory(technician);
                                }}
                              >
                                <FiPackage className="mr-2" />
                                Assign Inventory
                              </button>
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
        )}
      </div>

      {/* Add the TechnicianDetailModal */}
      <TechnicianDetailModal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        technicianId={selectedTechnicianId}
        onTechnicianUpdated={() => fetchTechnicians()}
      />
      
      {/* Add Technician Modal for managers */}
      <AddTechnicianModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={fetchTechnicians}
      />
      
      {/* Assign Inventory Modal */}
      {selectedTechnician && (
  <UnifiedInventoryAssignmentModal
    isOpen={showAssignInventoryModal}
    onClose={() => setShowAssignInventoryModal(false)}
    technician={selectedTechnician}
    onSuccess={() => {
      // Refresh the technicians list after successful assignment
      fetchTechnicians();
    }}
  />
)}
    </div>
  );
};

export default TechnicianUsers;