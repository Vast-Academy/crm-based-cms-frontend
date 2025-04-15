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
  const [allProjects, setAllProjects] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [inProgressProjects, setInProgressProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  
  // Filtered data
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // State for modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  
  // Selected tab
  const [activeTab, setActiveTab] = useState('all');
  
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
        // Store all projects
        setAllProjects(data.data);
        
        // Separate projects by status
        const pending = data.data.filter(project => project.status === 'pending-approval');
        const inProgress = data.data.filter(project => 
          ['assigned', 'in-progress', 'paused'].includes(project.status)
        );
        const completed = data.data.filter(project => project.status === 'completed');
        
        setPendingApprovals(pending);
        setInProgressProjects(inProgress);
        setCompletedProjects(completed);
        
        // Set initial filtered projects based on active tab
        applyTabFilter(activeTab, data.data, searchQuery);
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
  
  // Apply tab filter
  const applyTabFilter = (tab, projects = allProjects, query = searchQuery) => {
    let filtered = [];
    
    // First filter by tab/status
    switch(tab) {
      case 'all':
        filtered = [...projects];
        break;
      case 'pending-approval':
        filtered = projects.filter(project => project.status === 'pending-approval');
        break;
      case 'in-progress':
        filtered = projects.filter(project => 
          ['assigned', 'in-progress', 'paused'].includes(project.status)
        );
        break;
      case 'completed':
        filtered = projects.filter(project => project.status === 'completed');
        break;
      default:
        filtered = [...projects];
    }
    
    // Then apply search query if needed
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(project => 
        (project.customerName && project.customerName.toLowerCase().includes(lowercaseQuery)) ||
        (project.projectType && project.projectType.toLowerCase().includes(lowercaseQuery)) ||
        (project.technician && 
          (`${project.technician.firstName} ${project.technician.lastName}`).toLowerCase().includes(lowercaseQuery)) ||
        (project.orderId && project.orderId.toLowerCase().includes(lowercaseQuery)) ||
        (project.approvedBy && 
          (`${project.approvedBy.firstName} ${project.approvedBy.lastName}`).toLowerCase().includes(lowercaseQuery))
      );
    }
    
    setFilteredProjects(filtered);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [user.selectedBranch]);
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    applyTabFilter(tab);
  };
  
  // Filter data when search query changes
  useEffect(() => {
    applyTabFilter(activeTab, allProjects, searchQuery);
  }, [searchQuery]);
  
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
    
    // Update all projects
    setAllProjects(prev => {
      const updatedProjects = prev.map(p => {
        if (p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId) {
          return updatedProject;
        }
        return p;
      });
      
      // Re-apply filtering
      applyTabFilter(activeTab, updatedProjects, searchQuery);
      
      return updatedProjects;
    });
    
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
  
  // Get row border color
  const getRowBorder = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'border-yellow-500';
      case 'assigned':
        return 'border-blue-500';
      case 'in-progress':
        return 'border-purple-500';
      case 'paused':
        return 'border-orange-500';
      case 'completed':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };
  
  // Get status circle colors for S.NO
  const getStatusCircleColor = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'bg-yellow-500';
      case 'assigned':
      case 'in-progress':
      case 'paused':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  if (loading && !allProjects.length) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="">
      {/* Main Container with White Box */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">Projects</h1>
        </div>
        
        {/* Tabs and Search */}
        <div className="px-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-4 py-1.5 rounded-full text-sm ${
                  activeTab === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleTabChange('pending-approval')}
                className={`px-4 py-1.5 rounded-full text-sm ${
                  activeTab === 'pending-approval' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                Pending Approval
                <span className="ml-2 bg-white text-yellow-800 px-1.5 py-0.5 rounded-full text-xs">
                  {pendingApprovals.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('in-progress')}
                className={`px-4 py-1.5 rounded-full text-sm ${
                  activeTab === 'in-progress' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                In Progress
                <span className="ml-2 bg-white text-blue-800 px-1.5 py-0.5 rounded-full text-xs">
                  {inProgressProjects.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('completed')}
                className={`px-4 py-1.5 rounded-full text-sm ${
                  activeTab === 'completed' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-green-100 text-green-800'
                }`}
              >
                Completed
                <span className="ml-2 bg-white text-green-800 px-1.5 py-0.5 rounded-full text-xs">
                  {completedProjects.length}
                </span>
              </button>
            </div>
            
            {/* Search */}
            <div className="relative ml-auto">
              <input
                type="text"
                placeholder="Search projects..."
                className="w-60 pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mx-4 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {/* Projects Table */}
        <div className="border-t">
          {filteredProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TECHNICIAN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LAST UPDATED</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.map((project, index) => (
                    <React.Fragment key={`${project.customerId}-${project.orderId}`}>
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          expandedProject === `${project.customerId}-${project.orderId}` ? 'bg-gray-50' : ''
                        }`}
                        onClick={() => handleRowClick(`${project.customerId}-${project.orderId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full ${getStatusCircleColor(project.status)} flex items-center justify-center text-white font-medium`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.technician ? (
                            <div className="font-medium text-gray-900">
                              {project.technician.firstName} {project.technician.lastName}
                            </div>
                          ) : (
                            <span className="text-gray-500">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {project.projectType}
                          </span>
                          {/* <div className="text-xs text-gray-500 mt-1">{project.orderId}</div> */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.updatedAt ? formatDate(project.updatedAt) : formatDate(project.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(project.status)}`}>
                            {project.status === 'pending-approval' ? 'Pending Approval' : project.status}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expanded row */}
                      {expandedProject === `${project.customerId}-${project.orderId}` && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50 border-b">
                            <div className="flex">
                              {/* <div className="flex-1">
                                {project.status === 'completed' && (
                                  <div className="mb-2">
                                    <span className="font-medium">Approved by:</span>{' '}
                                    {project.approvedBy ? (
                                      <span>{project.approvedBy.firstName} {project.approvedBy.lastName}</span>
                                    ) : (
                                      <span>Auto-approved</span>
                                    )}
                                    {project.approvedAt && (
                                      <span> on {formatDate(project.approvedAt)}</span>
                                    )}
                                  </div>
                                )}
                                
                                {project.completedAt && (
                                  <div className="mb-2">
                                    <span className="font-medium">Completed:</span> {formatDate(project.completedAt)}
                                  </div>
                                )}
                              </div> */}
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProject(project);
                                }}
                                className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
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
            <div className="p-8 text-center">
              {searchQuery ? (
                <p className="text-gray-500">
                  No projects matching "{searchQuery}" found.
                </p>
              ) : (
                <p className="text-gray-500">
                  {activeTab === 'all' ? 'No projects found.' : 
                   activeTab === 'pending-approval' ? 'No pending approvals found.' :
                   activeTab === 'in-progress' ? 'No in-progress projects found.' :
                   'No completed projects found.'}
                </p>
              )}
            </div>
          )}
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
    </div>
  );
};

export default ManagerProjectDashboard;