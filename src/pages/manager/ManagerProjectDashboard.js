import React, { useState, useEffect, useRef } from 'react';
import { FiFilter, FiSearch, FiChevronDown, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { LuArrowDownUp, LuArrowUpDown } from 'react-icons/lu';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import ProjectDetailsModal from './ProjectDetailsModal';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Projects' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'job-closed', label: 'Job Closed' },
  { value: 'paused', label: 'Paused' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'transferring', label: 'Transferring' }
];

const SORT_OPTIONS = [
  { value: 'engineer', label: 'Engineer Name' },
  { value: 'customer', label: 'Customer Name' },
  { value: 'date', label: 'Date' }
];

const getStatusFilterLabel = (value) => {
  const option = STATUS_FILTER_OPTIONS.find(item => item.value === value);
  return option ? option.label : 'All Projects';
};

const getEngineerName = (project = {}) => {
  if (!project) return '';
  const { technician } = project;
  if (!technician) return '';
  if (typeof technician === 'string') {
    return technician;
  }
  const firstName = technician.firstName || '';
  const lastName = technician.lastName || '';
  return `${firstName} ${lastName}`.trim();
};

const ManagerProjectDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for project data
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // State for modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const PROJECTS_CACHE_KEY = 'managerProjectsData';
  const POLLING_INTERVAL_MS = 30000; // Poll every 30 seconds
  const projectsSignatureRef = useRef('');
  const pollingIntervalRef = useRef(null);

  // Build signature for change detection
  const buildProjectsSignature = (projects) => {
    if (!projects || projects.length === 0) return '';
    return projects
      .map((project) => {
        const projectId = project._id || project.id || '';
        const updatedAt = project.updatedAt || project.createdAt || '';
        const status = project.status || '';
        return `${projectId}-${updatedAt}-${status}`;
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
        projectsSignatureRef.current = buildProjectsSignature(parsedData);

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

      // Update signature for polling
      projectsSignatureRef.current = buildProjectsSignature(data.data);

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
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
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
    const assignedProjects = allProjects.filter(project => {
      return project.technician &&
        (project.technician.firstName || project.technician.lastName ||
          (typeof project.technician === 'string' && project.technician.length > 0));
    });

    let filtered = [...assignedProjects];

    if (statusFilter === 'all') {
      filtered = filtered.filter(project => project.status !== 'pending-approval');
    } else if (statusFilter === 'transferred') {
      filtered = filtered.filter(project => ['transferred', 'transferring'].includes(project.status));
    } else {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        (project.customerName && project.customerName.toLowerCase().includes(lowercaseQuery)) ||
        (project.customerFirmName && project.customerFirmName.toLowerCase().includes(lowercaseQuery)) ||
        (project.projectType && project.projectType.toLowerCase().includes(lowercaseQuery)) ||
        (getEngineerName(project) && getEngineerName(project).toLowerCase().includes(lowercaseQuery)) ||
        (project.orderId && project.orderId.toLowerCase().includes(lowercaseQuery)) ||
        (project.approvedBy &&
          (`${project.approvedBy.firstName} ${project.approvedBy.lastName}`).toLowerCase().includes(lowercaseQuery))
      );
    }

    const direction = sortOrder === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'engineer') {
        comparison = getEngineerName(a).localeCompare(getEngineerName(b), undefined, { sensitivity: 'base' });
      } else if (sortField === 'customer') {
        comparison = (a.customerName || '').localeCompare(b.customerName || '', undefined, { sensitivity: 'base' });
      } else {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      }

      if (comparison === 0) {
        comparison = (a.orderId || '').localeCompare(b.orderId || '', undefined, { sensitivity: 'base' });
      }

      return comparison * direction;
    });

    setFilteredProjects(filtered);
  }, [allProjects, searchQuery, statusFilter, sortField, sortOrder]);

  const handleFilterSelection = (value) => {
    setStatusFilter(value);
    setIsFilterDropdownOpen(false);
  };

  const handleSortSelection = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
    setIsSortDropdownOpen(false);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [user.selectedBranch, window.location.search]);

  // Polling system for automatic updates
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

        const newSignature = buildProjectsSignature(data.data);

        // Only update if there are changes
        if (newSignature !== projectsSignatureRef.current && isMounted) {
          setAllProjects(data.data);
          projectsSignatureRef.current = newSignature;
          localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(data.data));
          // console.log('Projects updated via polling');
        }
      } catch (err) {
        console.error('Error checking for project updates:', err);
      } finally {
        isChecking = false;
      }
    };

    // Check for updates when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling interval
    pollingIntervalRef.current = setInterval(checkForUpdates, POLLING_INTERVAL_MS);

    // Initial check if tab is visible
    if (!document.hidden) {
      checkForUpdates();
    }

    // Cleanup
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user.selectedBranch, window.location.search]);
  
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
    const originalProject = allProjects.find(p =>
      p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId
    );

    if (originalProject) {
      if (originalProject.projectCategory && !updatedProject.projectCategory) {
        updatedProject.projectCategory = originalProject.projectCategory;
      }

      if (originalProject.customerName && !updatedProject.customerName) {
        updatedProject.customerName = originalProject.customerName;
      }

      if (originalProject.projectType && !updatedProject.projectType) {
        updatedProject.projectType = originalProject.projectType;
      }
    }

    setAllProjects(prev => {
      let matchFound = false;
      const updatedProjects = prev.map(p => {
        if (p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId) {
          matchFound = true;
          return { ...p, ...updatedProject };
        }
        return p;
      });

      if (!matchFound) {
        updatedProjects.unshift(updatedProject);
      }

      // Update cache and signature
      localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(updatedProjects));
      projectsSignatureRef.current = buildProjectsSignature(updatedProjects);

      return updatedProjects;
    });

    setShowDetailsModal(false);
    setSelectedProject(null);
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
        case 'transferring':
      return 'bg-red-100 text-red-800';
    case 'transferred':
      return 'bg-red-200 text-red-800';
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
        case 'transferring':
    case 'transferred':
      return 'bg-red-500';
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
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-800">Projects</h1>
            {/* Refresh Button */}
            <button
              onClick={() => fetchFreshProjects()}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              title="Refresh Projects"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <FiFilter className="h-4 w-4 mr-2" />
                {getStatusFilterLabel(statusFilter)}
                <FiChevronDown className="ml-2 h-4 w-4" />
              </button>
              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="py-1">
                    {STATUS_FILTER_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterSelection(option.value)}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          statusFilter === option.value ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>{option.label}</span>
                        {statusFilter === option.value && <FiCheck className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortDropdownOpen(prev => !prev)}
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
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="py-1">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleSortSelection(option.value)}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          sortField === option.value ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>{option.label}</span>
                        {sortField === option.value && (
                          sortOrder === 'asc' ? (
                            <LuArrowDownUp className="h-4 w-4" />
                          ) : (
                            <LuArrowUpDown className="h-4 w-4" />
                          )
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
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
                          {/* <div className="text-xs text-gray-500 mt-1">{project.orderId}</div> */}
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
                            {project.status === 'pending-approval' ? 'Pending Approval' : project.status}
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
                  No projects matching "{searchQuery}" found.
                </p>
              ) : (
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? 'No projects found.'
                    : `No ${getStatusFilterLabel(statusFilter)} projects found.`}
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



