import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { LuArrowDownUp, LuArrowUpDown } from "react-icons/lu";
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

  // Sorting states
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first
  const [sortField, setSortField] = useState('date'); // 'date' or 'technician'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  const PROJECTS_CACHE_KEY = 'managerProjectsData';
  const POLLING_INTERVAL_MS = 30000;
  const pendingSignatureRef = useRef('');
  const pollingIntervalRef = useRef(null);

  const categorizeProjects = (projects) => {
    const pending = projects.filter(p => p.status === 'pending-approval');
    setPendingApprovals(pending);
    pendingSignatureRef.current = buildPendingSignature(pending);
  };

  const buildPendingSignature = (projects) => {
    if (!projects || projects.length === 0) return '';
    return projects
      .map((project) => {
        const projectId = project._id || project.id || '';
        const updatedAt =
          project.pendingApprovalDate ||
          project.updatedAt ||
          project.statusUpdatedAt ||
          project.createdAt ||
          '';
        return `${projectId}-${updatedAt}`;
      })
      .sort()
      .join('|');
  };

  const getBranchQueryParam = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlBranch = urlParams.get('branch') || user.selectedBranch || '';
    return urlBranch ? `?branch=${urlBranch}` : '';
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
      setLoading(true);
      const branchParam = getBranchQueryParam();

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
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshProjectsInBackground = async () => {
    try {
      await fetchFreshProjects();
    } catch (err) {
      console.error('Background fetch failed:', err);
    }
  };

  // Handle manual refresh button click
  const handleRefreshClick = async () => {
    try {
      await fetchFreshProjects();
    } catch (err) {
      console.error('Error refreshing projects:', err);
      setError('Failed to refresh projects. Please try again.');
      setLoading(false);
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
        (project.customerFirmName && project.customerFirmName.toLowerCase().includes(lowercaseQuery)) ||
        (project.projectType && project.projectType.toLowerCase().includes(lowercaseQuery)) ||
        (project.technician &&
          (`${project.technician.firstName} ${project.technician.lastName}`).toLowerCase().includes(lowercaseQuery)) ||
        (project.orderId && project.orderId.toLowerCase().includes(lowercaseQuery)) ||
        (project.approvedBy &&
          (`${project.approvedBy.firstName} ${project.approvedBy.lastName}`).toLowerCase().includes(lowercaseQuery))
      );
    }

    // Apply sorting based on sortField and sortOrder
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        // Sort by date
        const dateA = a.updatedAt || a.createdAt;
        const dateB = b.updatedAt || b.createdAt;

        const comparison = new Date(dateB) - new Date(dateA);
        return sortOrder === 'desc' ? comparison : -comparison;
      } else if (sortField === 'technician') {
        // Sort by technician name
        const nameA = a.technician
          ? `${a.technician.firstName || ''} ${a.technician.lastName || ''}`.toLowerCase().trim()
          : '';
        const nameB = b.technician
          ? `${b.technician.firstName || ''} ${b.technician.lastName || ''}`.toLowerCase().trim()
          : '';

        if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      } else if (sortField === 'customer') {
        // Sort by customer name
        const customerA = (a.customerName || '').toLowerCase().trim();
        const customerB = (b.customerName || '').toLowerCase().trim();

        if (customerA < customerB) return sortOrder === 'asc' ? -1 : 1;
        if (customerA > customerB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
      return 0;
    });

    setFilteredProjects(filtered);
  };

  useEffect(() => {
    pendingSignatureRef.current = buildPendingSignature(pendingApprovals);
  }, [pendingApprovals]);

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [user.selectedBranch, window.location.search]);

  // Filter data when search query changes
  useEffect(() => {
    applyFilter(allProjects, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    applyFilter(allProjects, searchQuery);
  }, [allProjects]);

  // Re-apply filter when sort changes
  useEffect(() => {
    applyFilter(allProjects, searchQuery);
  }, [sortField, sortOrder]);

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

  useEffect(() => {
    let isChecking = false;
    let isMounted = true;

    const checkForUpdates = async () => {
      if (isChecking || !isMounted) return;
      isChecking = true;

      try {
        const branchParam = getBranchQueryParam();
        const response = await fetch(`${SummaryApi.getManagerProjects.url}${branchParam}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects for updates');
        }

        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) {
          return;
        }

        const pendingProjects = data.data.filter(
          (project) => project.status === 'pending-approval'
        );
        const newSignature = buildPendingSignature(pendingProjects);

        if (newSignature !== pendingSignatureRef.current && isMounted) {
          setAllProjects(data.data);
          categorizeProjects(data.data);
          localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Error checking for new pending approvals:', err);
      } finally {
        isChecking = false;
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    pollingIntervalRef.current = setInterval(checkForUpdates, POLLING_INTERVAL_MS);

    if (!document.hidden) {
      checkForUpdates();
    }

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user.selectedBranch, window.location.search]);

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
        {/* Header with Sort Dropdown */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Pending Approvals</h1>
            <p className="text-gray-600 mt-1">Projects awaiting your approval</p>
          </div>

          <div className='flex items-center gap-3 mt-4'>
             {/* Refresh Button */}
                        <button
                          onClick={handleRefreshClick}
                          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                          title="Refresh Projects"
                        >
                          <FiRefreshCw className="w-5 h-5" />
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
                    onClick={() => handleSortSelection('technician')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                      sortField === 'technician' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Technician Name</span>
                    {sortField === 'technician' && (
                      sortOrder === 'asc' ? (
                        <LuArrowDownUp className="h-4 w-4" />
                      ) : (
                        <LuArrowUpDown className="h-4 w-4" />
                      )
                    )}
                  </button>
                  <button
                    onClick={() => handleSortSelection('customer')}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                      sortField === 'customer' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span>Customer Name</span>
                    {sortField === 'customer' && (
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
                    <span>Date</span>
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

         
        </div>

        {/* Search bar - full width below */}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-gray-900">{project.customerName}</div>
                          {project.customerFirmName && (
                            <div className="text-xs text-gray-400">{project.customerFirmName}</div>
                          )}
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
