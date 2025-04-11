import React, { useState, useEffect } from 'react';
import { FiClock, FiActivity, FiCheckCircle, FiSearch, FiRefreshCw, FiEye, FiFilter } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import ProjectDetailsModal from './ProjectDetailsModal';

const ManagerProjectDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for project data
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [inProgressProjects, setInProgressProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  
  // Filtered data
  const [filteredPendingApprovals, setFilteredPendingApprovals] = useState([]);
  const [filteredInProgressProjects, setFilteredInProgressProjects] = useState([]);
  const [filteredCompletedProjects, setFilteredCompletedProjects] = useState([]);
  
  // State for modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  
  // Selected tab
  const [activeTab, setActiveTab] = useState('pending');
  
  // Fetch projects data
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get branch parameter if needed
      let branchParam = '';
      if (user.selectedBranch) {
        branchParam = `?branch=${user.selectedBranch}`;
      }
      
      // Fetch manager projects
      const response = await fetch(`${SummaryApi.getManagerProjects.url}${branchParam}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Separate projects by status
        const pending = data.data.filter(project => project.status === 'pending-approval');
        const inProgress = data.data.filter(project => 
          ['assigned', 'in-progress', 'paused'].includes(project.status)
        );
        const completed = data.data.filter(project => project.status === 'completed');
        
        setPendingApprovals(pending);
        setInProgressProjects(inProgress);
        setCompletedProjects(completed);
        
        // Set filtered data initially
        setFilteredPendingApprovals(pending);
        setFilteredInProgressProjects(inProgress);
        setFilteredCompletedProjects(completed);
      } else {
        setError(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [user.selectedBranch]);
  
  // Filter data when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Reset to full list when search is empty
      setFilteredPendingApprovals(pendingApprovals);
      setFilteredInProgressProjects(inProgressProjects);
      setFilteredCompletedProjects(completedProjects);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Filter pending approvals
    setFilteredPendingApprovals(
      pendingApprovals.filter(project => 
        (project.customerName && project.customerName.toLowerCase().includes(query)) ||
        (project.projectType && project.projectType.toLowerCase().includes(query)) ||
        (project.technician && 
          (`${project.technician.firstName} ${project.technician.lastName}`).toLowerCase().includes(query)) ||
        (project.orderId && project.orderId.toLowerCase().includes(query))
      )
    );
    
    // Filter in-progress projects
    setFilteredInProgressProjects(
      inProgressProjects.filter(project => 
        (project.customerName && project.customerName.toLowerCase().includes(query)) ||
        (project.projectType && project.projectType.toLowerCase().includes(query)) ||
        (project.technician && 
          (`${project.technician.firstName} ${project.technician.lastName}`).toLowerCase().includes(query)) ||
        (project.orderId && project.orderId.toLowerCase().includes(query))
      )
    );
    
    // Filter completed projects
    setFilteredCompletedProjects(
      completedProjects.filter(project => 
        (project.customerName && project.customerName.toLowerCase().includes(query)) ||
        (project.projectType && project.projectType.toLowerCase().includes(query)) ||
        (project.technician && 
          (`${project.technician.firstName} ${project.technician.lastName}`).toLowerCase().includes(query)) ||
        (project.orderId && project.orderId.toLowerCase().includes(query)) ||
        (project.approvedBy && 
          (`${project.approvedBy.firstName} ${project.approvedBy.lastName}`).toLowerCase().includes(query))
      )
    );
  }, [searchQuery, pendingApprovals, inProgressProjects, completedProjects]);
  
  // Format date function
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
  
  // Handle viewing project details
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
        // Console log to debug the project details
        console.log('Project details received:', data.data);
        
        // Check whether assignedBy is properly populated
        if (data.data.assignedBy) {
          console.log('AssignedBy details:', data.data.assignedBy);
        }
        
        setSelectedProject(data.data);
        setShowDetailsModal(true);
      } else {
        console.error('API returned error:', data.message);
        // If API fails, use the basic project data we have
        setSelectedProject(project);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
      // Fall back to basic project data
      setSelectedProject(project);
      setShowDetailsModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle project approval
  const handleProjectApproved = (updatedProject) => {
    // Update local state
    setPendingApprovals(prev => prev.filter(p => 
      !(p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId)
    ));
    
    setCompletedProjects(prev => [updatedProject, ...prev]);
    
    // Apply filters again
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Update filtered pending approvals
      setFilteredPendingApprovals(prev => prev.filter(p => 
        !(p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId)
      ));
      
      // Check if updated project matches search
      const projectMatches = 
        (updatedProject.customerName && updatedProject.customerName.toLowerCase().includes(query)) ||
        (updatedProject.projectType && updatedProject.projectType.toLowerCase().includes(query)) ||
        (updatedProject.technician && 
          (`${updatedProject.technician.firstName} ${updatedProject.technician.lastName}`).toLowerCase().includes(query)) ||
        (updatedProject.orderId && updatedProject.orderId.toLowerCase().includes(query)) ||
        (updatedProject.approvedBy && 
          (`${updatedProject.approvedBy.firstName} ${updatedProject.approvedBy.lastName}`).toLowerCase().includes(query));
      
      if (projectMatches) {
        setFilteredCompletedProjects(prev => [updatedProject, ...prev]);
      }
    } else {
      // No search, just update filtered state
      setFilteredPendingApprovals(prev => prev.filter(p => 
        !(p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId)
      ));
      setFilteredCompletedProjects(prev => [updatedProject, ...prev]);
    }
    
    // Close modal
    setShowDetailsModal(false);
  };
  
  // Handle row click to expand/collapse details
  const handleRowClick = (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
    }
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
  
  if (loading && (!pendingApprovals.length && !inProgressProjects.length && !completedProjects.length)) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Project Dashboard</h1>
          <p className="text-gray-600">Manage and monitor all projects</p>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-white border rounded-md flex items-center hover:bg-gray-50"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="mb-6 border-b">
        <div className="flex space-x-6">
          <button
            className={`py-3 px-1 flex items-center ${
              activeTab === 'pending' 
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <FiClock className="mr-2" />
            Pending Approvals
            <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
              {filteredPendingApprovals.length}
            </span>
          </button>
          
          <button
            className={`py-3 px-1 flex items-center ${
              activeTab === 'in-progress' 
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('in-progress')}
          >
            <FiActivity className="mr-2" />
            In-Progress Projects
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              {filteredInProgressProjects.length}
            </span>
          </button>
          
          <button
            className={`py-3 px-1 flex items-center ${
              activeTab === 'completed' 
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            <FiCheckCircle className="mr-2" />
            Completed Projects
            <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
              {filteredCompletedProjects.length}
            </span>
          </button>
        </div>
      </div>
      
      {/* Project Details Modal */}
      {showDetailsModal && (
        <ProjectDetailsModal 
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectApproved={handleProjectApproved}
        />
      )}
      
      {/* Pending Approvals Section */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <FiClock className="mr-2 text-yellow-500" />
              Pending Approvals
            </h2>
          </div>
          
          {filteredPendingApprovals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPendingApprovals.map((project) => (
                    <React.Fragment key={`${project.customerId}-${project.orderId}`}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(`${project.customerId}-${project.orderId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.technician ? (
                            <div className="font-medium text-gray-900">
                              {project.technician.firstName} {project.technician.lastName}
                            </div>
                          ) : (
                            <span className="text-gray-500">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{project.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{project.projectType}</div>
                          <div className="text-sm text-gray-500">{project.orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.completedAt ? formatDate(project.completedAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(project.status)}`}>
                            Pending Approval
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expanded row */}
                      {expandedProject === `${project.customerId}-${project.orderId}` && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50">
                            <div className="text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProject(project);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center ml-auto"
                              >
                                <FiEye className="mr-2" /> View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No pending approvals found.
            </div>
          )}
        </div>
      )}
      
      {/* In-Progress Projects Section */}
      {activeTab === 'in-progress' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <FiActivity className="mr-2 text-blue-500" />
              In-Progress Projects
            </h2>
          </div>
          
          {filteredInProgressProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Update</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInProgressProjects.map((project) => (
                    <React.Fragment key={`${project.customerId}-${project.orderId}`}>
                      <tr 
                        className={`border-l-4 ${
                          project.status === 'assigned' ? 'border-blue-500' :
                          project.status === 'in-progress' ? 'border-purple-500' : 
                          'border-orange-500'
                        } hover:bg-gray-50 cursor-pointer`}
                        onClick={() => handleRowClick(`${project.customerId}-${project.orderId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.technician ? (
                            <div className="font-medium text-gray-900">
                              {project.technician.firstName} {project.technician.lastName}
                            </div>
                          ) : (
                            <span className="text-gray-500">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{project.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{project.projectType}</div>
                          <div className="text-sm text-gray-500">{project.orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.updatedAt ? formatDate(project.updatedAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(project.status)}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {project.statusHistory && project.statusHistory.length > 0 
                              ? project.statusHistory[0].remark || 'No message' 
                              : 'No updates'}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded row */}
                      {expandedProject === `${project.customerId}-${project.orderId}` && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <div className="text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProject(project);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center ml-auto"
                              >
                                <FiEye className="mr-2" /> View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No in-progress projects found.
            </div>
          )}
        </div>
      )}
      
      {/* Completed Projects Section */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              <FiCheckCircle className="mr-2 text-green-500" />
              Completed Projects
            </h2>
          </div>
          
          {filteredCompletedProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved On</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompletedProjects.map((project) => (
                    <React.Fragment key={`${project.customerId}-${project.orderId}`}>
                      <tr 
                        className="border-l-4 border-green-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(`${project.customerId}-${project.orderId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.technician ? (
                            <div className="font-medium text-gray-900">
                              {project.technician.firstName} {project.technician.lastName}
                            </div>
                          ) : (
                            <span className="text-gray-500">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{project.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{project.projectType}</div>
                          <div className="text-sm text-gray-500">{project.orderId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.completedAt ? formatDate(project.completedAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.approvedBy ? (
                            <div className="text-gray-900">
                              {project.approvedBy.firstName} {project.approvedBy.lastName}
                            </div>
                          ) : (
                            <span className="text-gray-500">Auto-approved</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.approvedAt ? formatDate(project.approvedAt) : 'N/A'}
                        </td>
                      </tr>
                      
                      {/* Expanded row */}
                      {expandedProject === `${project.customerId}-${project.orderId}` && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <div className="text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProject(project);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center ml-auto"
                              >
                                <FiEye className="mr-2" /> View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No completed projects found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerProjectDashboard;