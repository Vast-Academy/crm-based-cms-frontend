import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiSearch, FiRefreshCw, FiEye } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import TransferProjectModal from './TransferProjectModal';

const TRANSFERRED_PROJECTS_CACHE_KEY = 'transferredProjectsData';
const POLLING_INTERVAL_MS = 30000; // Poll every 30 seconds

const TransferredProjectsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferredProjects, setTransferredProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Refs for polling
  const transferredSignatureRef = useRef('');
  const pollingIntervalRef = useRef(null);

  // Build signature for change detection
  const buildTransferredSignature = (projects) => {
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
    const urlBranch = user.selectedBranch || '';
    return urlBranch ? `?branch=${urlBranch}` : '';
  };

  // Fetch transferred projects
  const fetchTransferredProjects = async (forceFresh = false) => {
    try {
      setError(null);

      // Step 1: Try to get cached data
      const cachedData = localStorage.getItem(TRANSFERRED_PROJECTS_CACHE_KEY);

      if (!forceFresh && cachedData) {
        const parsedData = JSON.parse(cachedData);

        setTransferredProjects(parsedData);
        setFilteredProjects(parsedData);
        transferredSignatureRef.current = buildTransferredSignature(parsedData);
        // console.log("Using cached transferred projects data");

        // Fetch fresh data in background
        fetchFreshTransferredProjectsInBackground();
        setLoading(false);
        return;
      }

      // Step 2: If no cache or forceFresh is true, fetch fresh data
      setLoading(true);
      await fetchFreshTransferredProjects();

    } catch (err) {
      // Step 3: On error, fallback to cache
      const cachedData = localStorage.getItem(TRANSFERRED_PROJECTS_CACHE_KEY);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setTransferredProjects(parsedData);
        setFilteredProjects(parsedData);
        console.warn("Using cached transferred projects data after fetch error");
      } else {
        setError('Server error. Please try again later.');
        console.error('Error fetching transferred projects:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshTransferredProjects = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }

    try {
      const branchParam = getBranchQueryParam();
      const statusParam = branchParam ? '&status=transferring' : '?status=transferring';

      const response = await fetch(`${SummaryApi.getManagerProjects.url}${branchParam}${statusParam}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch transferred projects');
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Unknown error');

      // Sort data by updatedAt ascending (oldest first)
      const sortedData = data.data.slice().sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

      setTransferredProjects(sortedData);
      setFilteredProjects(sortedData);

      // Update signature
      transferredSignatureRef.current = buildTransferredSignature(sortedData);

      // Cache the fetched data
      localStorage.setItem(TRANSFERRED_PROJECTS_CACHE_KEY, JSON.stringify(sortedData));
      // console.log("Fresh transferred projects data cached");

    } catch (err) {
      if (!isBackground) {
        setError(err.message || 'Server error. Please try again later.');
        console.error('Error fetching transferred projects:', err);
      }
      throw err;
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const fetchFreshTransferredProjectsInBackground = async () => {
    try {
      await fetchFreshTransferredProjects(true);
    } catch (err) {
      console.error('Background fetch failed:', err);
    }
  };


  // Initial data fetch
  useEffect(() => {
    fetchTransferredProjects();
  }, [user.selectedBranch]);

  // Polling system for automatic updates
  useEffect(() => {
    let isChecking = false;
    let isMounted = true;

    const checkForUpdates = async () => {
      if (isChecking || !isMounted) return;
      isChecking = true;

      try {
        const branchParam = getBranchQueryParam();
        const statusParam = branchParam ? '&status=transferring' : '?status=transferring';

        const response = await fetch(`${SummaryApi.getManagerProjects.url}${branchParam}${statusParam}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch transferred projects for updates');
        }

        const data = await response.json();
        if (!data.success || !Array.isArray(data.data)) {
          return;
        }

        // Sort data by updatedAt ascending (oldest first)
        const sortedData = data.data.slice().sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        const newSignature = buildTransferredSignature(sortedData);

        // Only update if there are changes
        if (newSignature !== transferredSignatureRef.current && isMounted) {
          setTransferredProjects(sortedData);
          setFilteredProjects(sortedData);
          transferredSignatureRef.current = newSignature;
          localStorage.setItem(TRANSFERRED_PROJECTS_CACHE_KEY, JSON.stringify(sortedData));
          // console.log('Transferred projects updated via polling');
        }
      } catch (err) {
        console.error('Error checking for transferred project updates:', err);
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
  }, [user.selectedBranch]);
  
  // Filter projects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(transferredProjects);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = transferredProjects.filter(project => 
      (project.customerName && project.customerName.toLowerCase().includes(lowercaseQuery)) ||
      (project.projectType && project.projectType.toLowerCase().includes(lowercaseQuery)) ||
      (project.technician && 
        (`${project.technician.firstName} ${project.technician.lastName}`).toLowerCase().includes(lowercaseQuery)) ||
      (project.orderId && project.orderId.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredProjects(filtered);
  }, [searchQuery, transferredProjects]);
  
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
  
  
  // Handle transferring project
  const handleTransferProject = async (project) => {
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
        setShowTransferModal(true);
      } else {
        console.error('API returned error:', data.message);
        // If API fails, use the basic project data we have
        setSelectedProject(project);
        setShowTransferModal(true);
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
      // Fall back to basic project data
      setSelectedProject(project);
      setShowTransferModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle project transfer completion
  const handleProjectTransferred = (updatedProject) => {
    // Update the project in the list - change status to transferred instead of removing
    setTransferredProjects(prev => {
      const updatedProjects = prev.map(p => {
        if (p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId) {
          return { ...p, status: 'transferred' };
        }
        return p;
      });

      // Update cache and signature
      localStorage.setItem(TRANSFERRED_PROJECTS_CACHE_KEY, JSON.stringify(updatedProjects));
      transferredSignatureRef.current = buildTransferredSignature(updatedProjects);

      return updatedProjects;
    });

    // Update filtered projects as well
    setFilteredProjects(prev =>
      prev.map(p => {
        if (p.orderId === updatedProject.orderId && p.customerId === updatedProject.customerId) {
          return { ...p, status: 'transferred' };
        }
        return p;
      })
    );

    // Close modal
    setShowTransferModal(false);
  };
  
  if (loading && !transferredProjects.length) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="">
      {/* Main Container with White Box */}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Transferred Projects</h1>
          
          <button
            onClick={() => fetchFreshTransferredProjects()}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            title="Refresh Transferred Projects"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STOP REQUESTED</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.map((project, index) => (
                    <React.Fragment key={`${project.customerId}-${project.orderId}`}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTransferProject(project)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-medium">
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
                          {formatDate(project.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs capitalize bg-red-100 text-red-800">
                            Transferring
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
                  No transferred projects matching "{searchQuery}" found.
                </p>
              ) : (
                <p className="text-gray-500">
                  No transferred projects found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Transfer Project Modal */}
      {showTransferModal && (
        <TransferProjectModal 
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectTransferred={handleProjectTransferred}
        />
      )}
    </div>
  );
};

export default TransferredProjectsPage;