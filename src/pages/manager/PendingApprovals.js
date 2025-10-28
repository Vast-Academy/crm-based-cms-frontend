import React, { useState, useEffect } from 'react';
import { FiClock, FiActivity, FiCheckCircle, FiSearch, FiRefreshCw, FiEye, FiFilter } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import ProjectDetailsModal from './ProjectDetailsModal';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State for project data
  const [allProjects, setAllProjects] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Filtered data
  const [filteredProjects, setFilteredProjects] = useState([]);

  // State for modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const PROJECTS_CACHE_KEY = 'managerProjectsData';

  const categorizeProjects = (projects) => {
    const pending = projects.filter(p => p.status === 'pending-approval');
    setPendingApprovals(pending);
  };


  // Fetch projects data
  const fetchProjects = async (forceFresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Try to get cached data
      const cachedData = localStorage.getItem(PROJECTS_CACHE_KEY);

      if (!forceFresh && cachedData) {
        const parsedData = JSON.parse(cachedData);

        setAllProjects(parsedData);
        categorizeProjects(parsedData);
        applyFilter(parsedData, searchQuery);

        // Fetch fresh data in background
        fetchFreshProjectsInBackground();
        setLoading(false);
        return;
      }

      // Step 2: If no cache or forceFresh is true, fetch fresh data
      await fetchFreshProjects();

    } catch (err) {
      // Step 3: On error, fallback to cache
      const cachedData = localStorage.getItem(PROJECTS_CACHE_KEY);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setAllProjects(parsedData);
        categorizeProjects(parsedData);
        applyFilter(parsedData, searchQuery);
        console.warn("Using cached projects data after fetch error");
      } else {
        setError('Server error. Please try again later.');
        console.error('Error fetching projects:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshProjects = async () => {
    try {
      // Get branch from URL params first, then fallback to user.selectedBranch
      const urlParams = new URLSearchParams(window.location.search);
      const urlBranch = urlParams.get('branch') || user.selectedBranch || '';
      let branchParam = '';
      if (urlBranch) {
        branchParam = `?branch=${urlBranch}`;
      }

      const response = await fetch(`${SummaryApi.getManagerProjects.url}${branchParam}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Unknown error');

      // Save to state
      setAllProjects(data.data);
      categorizeProjects(data.data);

      // Apply filtering
      applyFilter(data.data, searchQuery);

      // Save to cache
      localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(data.data));

    } catch (err) {
      throw err; // This is handled by the caller
    }
  };

  const fetchFreshProjectsInBackground = async () => {
    try {
      await fetchFreshProjects();
    } catch (err) {
      console.error('Background fetch failed:', err);
    }
  };


  // Apply filter - only show pending approval projects
  const applyFilter = (projects = allProjects, query = searchQuery) => {
    let filtered = [];

    // First, filter for only pending-approval projects and remove "not-assigned" projects
    const pendingProjects = projects.filter(project => {
      // Must be pending-approval status
      if (project.status !== 'pending-approval') return false;

      // Check if technician exists AND it's not a placeholder
      return project.technician &&
             (project.technician.firstName || project.technician.lastName ||
              (typeof project.technician === 'string' && project.technician.length > 0));
    });

    filtered = [...pendingProjects];

    // Apply search query if needed
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

    // Sort by most recent (updatedAt or createdAt)
    filtered.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;

      // Sort descending (newest first)
      return new Date(dateB) - new Date(dateA);
    });

    setFilteredProjects(filtered);
  };

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [user.selectedBranch, window.location.search]);

  // Filter data when search query changes
  useEffect(() => {
    applyFilter(allProjects, searchQuery);
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
    // Find original project to preserve important fields that might be missing in the API response
    const originalProject = allProjects.find(p =>
      p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId
    );

    // Preserve category and other important fields that might be missing in the API response
    if (originalProject) {
      // Make sure category is preserved
      if (originalProject.projectCategory && !updatedProject.projectCategory) {
        updatedProject.projectCategory = originalProject.projectCategory;
      }

      // Preserve other important fields if needed
      if (originalProject.customerName && !updatedProject.customerName) {
        updatedProject.customerName = originalProject.customerName;
      }

      if (originalProject.projectType && !updatedProject.projectType) {
        updatedProject.projectType = originalProject.projectType;
      }
    }

    // Update pending approvals state - remove the approved project
    setPendingApprovals(prev => prev.filter(p =>
      !(p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId)
    ));

    // Update all projects state
    setAllProjects(prev => {
      const updatedProjects = prev.map(p => {
        if (p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId) {
          // Merge the original project with updates to ensure no data is lost
          return { ...p, ...updatedProject };
        }
        return p;
      });

      // Re-apply filtering
      applyFilter(updatedProjects, searchQuery);

      return updatedProjects;
    });

    // Close modal
    setShowDetailsModal(false);
  };


  // Get status badge style
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get row border color
  const getRowBorder = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'border-yellow-500';
      default:
        return 'border-gray-300';
    }
  };

  // Get status circle colors for S.NO
  const getStatusCircleColor = (status) => {
    switch(status) {
      case 'pending-approval':
        return 'bg-yellow-500';
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
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">Projects awaiting your approval</p>
        </div>

        {/* Search */}
        <div className="mb-4">
           <div className="relative">
              <input
                type="text"
                placeholder="Search pending approvals..."
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ENGINEER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LAST UPDATED</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.map((project, index) => (
                    <React.Fragment key={`${project.customerId}-${project.orderId}`}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewProject(project)}
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
                          )
                          : (
                            <span className="text-gray-500">Not Assigned</span>
                          )
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {project.projectType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            project.projectCategory === 'Repair'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {project.projectCategory === 'Repair' ? 'Complaint' : 'New Installation'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.updatedAt ? formatDate(project.updatedAt) : formatDate(project.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(project.status)}`}>
                            Pending Approval
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              {searchQuery ? (
                <p className="text-gray-500">
                  No pending approvals matching "{searchQuery}" found.
                </p>
              ) : (
                <p className="text-gray-500">
                  No pending approvals found.
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

export default PendingApprovals;