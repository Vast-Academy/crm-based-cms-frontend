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
    <div className="">
      {/* Main Container with White Box */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="mb-4">
  <h1 className="text-2xl font-semibold text-gray-800 mb-4">User Management</h1>
  
  {/* बटन और सर्च बार एक लाइन में */}
  <div className="flex items-center gap-2">
    {/* Add Technician बटन */}
    {user.role === 'admin' ? (
      <Link
        to="/users/technicians/add"
        className="px-4 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 flex items-center whitespace-nowrap"
      >
        <FiPlus className="mr-2" /> Add Technician
      </Link>
    ) : (
      <button
        onClick={() => setModalOpen(true)}
        className="px-4 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 flex items-center whitespace-nowrap"
      >
        <FiPlus className="mr-2" /> Add Technician
      </button>
    )}
    
    {/* फुल विड्थ सर्च बार */}
    <div className="relative flex-grow">
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
                        className={`hover:bg-gray-50 cursor-pointer ${
                          expandedTechnician === technician._id ? 'bg-gray-50' : ''
                        }`}
                        onClick={() => handleRowClick(technician._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 font-semibold">
                              {technician.firstName.charAt(0)}{technician.lastName.charAt(0)}
                            </div> */}
                            <div className="">
                              <div className="text-sm font-medium text-gray-900">
                                {technician.firstName} {technician.lastName}
                              </div>
                              {/* <div className="text-sm text-gray-500">
                                {technician.phone || 'No phone'}
                              </div> */}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{technician.username}</div>
                          {/* <div className="text-sm text-gray-500">{technician.email}</div> */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {technician.branch && typeof technician.branch === 'object' 
                              ? technician.branch.name 
                              : 'N/A'}
                          </div>
                          {/* <div className="text-sm text-gray-500">
                            {technician.branch && typeof technician.branch === 'object' 
                              ? technician.branch.location 
                              : ''}
                          </div> */}
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
                      
                      {/* Expanded row with action buttons */}
                      {expandedTechnician === technician._id && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50 border-b">
                            <div className="flex space-x-4">
                              <button 
                                className="px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center text-sm"
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
                                  className="px-4 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center text-sm"
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