import React, { useState, useEffect } from 'react';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ProjectDetailsModal from '../manager/ProjectDetailsModal';

const TechnicianDetailModal = ({ isOpen, onClose, technicianId, onTechnicianUpdated }) => {
  const { user } = useAuth();
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectsData, setProjectsData] = useState({
    inProgressProjects: [],
    pendingApprovalProjects: [],
    completedProjects: []
  });
  
  // Project details modal state
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchTechnician = async () => {
    if (!technicianId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${SummaryApi.getUser.url}/${technicianId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTechnician(data.data);
        // Fetch the technician's projects
        fetchTechnicianProjects(technicianId);
      } else {
        setError(data.message || 'Failed to fetch technician details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching technician:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTechnicianProjects = async (id) => {
    try {
      const response = await fetch(`${SummaryApi.getTechnicianProjects.url}/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Separate projects by status
        const inProgress = data.data.filter(project => 
          ['assigned', 'in-progress', 'paused'].includes(project.status)
        );
        const pendingApproval = data.data.filter(project => 
          project.status === 'pending-approval'
        );
        const completed = data.data.filter(project => 
          project.status === 'completed'
        );
        
        setProjectsData({
          inProgressProjects: inProgress,
          pendingApprovalProjects: pendingApproval,
          completedProjects: completed
        });
      } else {
        console.error('Failed to fetch technician projects:', data.message);
      }
    } catch (err) {
      console.error('Error fetching technician projects:', err);
    }
  };
  
  useEffect(() => {
    if (isOpen && technicianId) {
      fetchTechnician();
    } else {
      // Reset state when modal closes
      setTechnician(null);
      setError(null);
      setProjectsData({
        inProgressProjects: [],
        pendingApprovalProjects: [],
        completedProjects: []
      });
    }
  }, [isOpen, technicianId]);
  
  const handleViewProject = async (project) => {
    try {
      setLoading(true);
      
      // Fetch full project details
      const response = await fetch(`${SummaryApi.getWorkOrderDetails.url}/${project.customerId}/${project.orderId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedProject(data.data);
        setShowProjectDetailsModal(true);
      } else {
        // If API fails, use the basic project data we have
        setSelectedProject(project);
        setShowProjectDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
      // Fall back to basic project data
      setSelectedProject(project);
      setShowProjectDetailsModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Function to navigate to edit page
  const handleEditTechnician = () => {
    window.location.href = `/users/technicians/edit/${technicianId}`;
  };
  
  // Get status badge style
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Technician Details"
      size="xl"
    >
      {loading && !technician ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      ) : technician ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
          {/* Technician info panel - Left side */}
          <div className="lg:col-span-1 bg-white rounded-lg border overflow-hidden border-t-4 border-indigo-500">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{technician.firstName} {technician.lastName}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(technician.createdAt)}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  technician.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {technician.status}
                </span>
              </div>
              
              {/* Technician info */}
              <div className="space-y-4 mt-6">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 text-gray-500">👤</div>
                  <div>
                    <div className="text-sm text-gray-500">Username</div>
                    <div>{technician.username}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 mr-3 text-gray-500">📧</div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div>{technician.email}</div>
                  </div>
                </div>
                
                {technician.phone && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">📱</div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div>{technician.phone}</div>
                    </div>
                  </div>
                )}
                
                {technician.branch && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">🏢</div>
                    <div>
                      <div className="text-sm text-gray-500">Branch</div>
                      <div>{typeof technician.branch === 'object' ? technician.branch.name : 'Unknown'}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleEditTechnician}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Technician
                </button>
              </div>
            </div>
          </div>
          
          {/* Projects panel - Right side */}
          <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Projects</h2>
              
              {/* In-Progress & Pending Approval Projects */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">In-Progress & Pending Approval Projects</h3>
                {projectsData.inProgressProjects.length === 0 && projectsData.pendingApprovalProjects.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    No active projects found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* In-Progress Projects */}
                    {projectsData.inProgressProjects.map((project, index) => (
                      <div 
                        key={`in-progress-${index}`}
                        className={`border-l-4 rounded-md p-3 bg-white shadow-sm hover:bg-gray-50 cursor-pointer ${
                          project.status === 'assigned' ? 'border-blue-500' :
                          project.status === 'in-progress' ? 'border-purple-500' : 
                          'border-orange-500'
                        }`}
                        onClick={() => handleViewProject(project)}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{project.projectType}</span>
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadge(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Customer: {project.customerName}</p>
                        <p className="text-sm text-gray-500">Order ID: {project.orderId}</p>
                        <div className="mt-2 flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProject(project);
                            }}
                            className="text-blue-600 text-sm flex items-center"
                          >
                            <FiEye className="mr-1" /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pending Approval Projects */}
                    {projectsData.pendingApprovalProjects.map((project, index) => (
                      <div 
                        key={`pending-${index}`}
                        className="border-l-4 border-yellow-500 rounded-md p-3 bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewProject(project)}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{project.projectType}</span>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-full">
                            Pending Approval
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Customer: {project.customerName}</p>
                        <p className="text-sm text-gray-500">Order ID: {project.orderId}</p>
                        <div className="mt-2 flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProject(project);
                            }}
                            className="text-blue-600 text-sm flex items-center"
                          >
                            <FiEye className="mr-1" /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Completed Projects */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Completed Projects</h3>
                {projectsData.completedProjects.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    No completed projects found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectsData.completedProjects.map((project, index) => (
                      <div 
                        key={`completed-${index}`}
                        className="border-l-4 border-green-500 rounded-md p-3 bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewProject(project)}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{project.projectType}</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                            Completed
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Customer: {project.customerName}</p>
                        <p className="text-sm text-gray-500">Order ID: {project.orderId}</p>
                        <p className="text-sm text-gray-500">
                          Completed on: {formatDate(project.completedAt)}
                        </p>
                        <div className="mt-2 flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProject(project);
                            }}
                            className="text-blue-600 text-sm flex items-center"
                          >
                            <FiEye className="mr-1" /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          Technician not found
        </div>
      )}
      
      {/* Project Details Modal */}
      {showProjectDetailsModal && (
        <ProjectDetailsModal 
          isOpen={showProjectDetailsModal}
          onClose={() => {
            setShowProjectDetailsModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectApproved={() => {
            // Refresh projects after approval
            fetchTechnicianProjects(technicianId);
            setShowProjectDetailsModal(false);
          }}
        />
      )}
    </Modal>
  );
};

export default TechnicianDetailModal;