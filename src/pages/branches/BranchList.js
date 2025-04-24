import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiLoader, FiSearch } from 'react-icons/fi';
import SummaryApi from '../../common';

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [branchData, setBranchData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchBranchesWithData();
  }, []);
  
  const fetchBranchesWithData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch all branches
      const branchResponse = await fetch(SummaryApi.getBranches.url, {
        method: SummaryApi.getBranches.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const branchData = await branchResponse.json();
      
      if (!branchData.success) {
        throw new Error(branchData.message || 'Failed to fetch branches');
      }
      
      const allBranches = branchData.data || [];
      setBranches(allBranches);
      
      // Initialize branch data with default values
      const defaultBranchData = {};
      allBranches.forEach(branch => {
        defaultBranchData[branch._id] = {
          manager: 'None',
          techniciansCount: 0,
          customersCount: 0,
          projectsCount: 0
        };
      });
      
      setBranchData(defaultBranchData);
      
      // 2. Try to fetch managers if endpoint exists
      if (SummaryApi.getManagerUsers) {
        try {
          const managersResponse = await fetch(SummaryApi.getManagerUsers.url, {
            method: SummaryApi.getManagerUsers.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const managersData = await managersResponse.json();
          console.log('Managers API response:', managersData);
          
          if (managersData.success) {
            const managers = managersData.data || [];
            console.log("Managers data:", managers);
            
            // Update branch data with managers
            const updatedBranchData = { ...defaultBranchData };
            
            allBranches.forEach(branch => {
              // Convert IDs to strings for safer comparison
              const branchId = branch._id.toString();
              console.log(`Looking for manager for branch: ${branch.name} (${branchId})`);
              
              const branchManager = managers.find(m => {
                // Safely check if branch exists and convert IDs to strings
                const managerBranchId = m.branch && typeof m.branch._id === 'object' 
                  ? m.branch._id.toString() 
                  : (m.branch && m.branch._id);
                  
                console.log(`Comparing with manager ${m.firstName} ${m.lastName}, branch ID: ${managerBranchId}`);
                return managerBranchId === branchId && m.status === 'active';
              });
              
              if (branchManager) {
                console.log(`Found manager for branch ${branch.name}: ${branchManager.firstName} ${branchManager.lastName}`);
                updatedBranchData[branchId] = {
                  ...updatedBranchData[branchId],
                  manager: `${branchManager.firstName} ${branchManager.lastName}`
                };
              }
            });
            
            console.log("Updated branch data with managers:", updatedBranchData);
            setBranchData(updatedBranchData);
          }
        } catch (err) {
          console.log('Could not fetch managers:', err);
        }
      }
      
      // 3. Try to fetch technicians if endpoint exists
      if (SummaryApi.getTechnicianUsers) {
        try {
          const techniciansResponse = await fetch(SummaryApi.getTechnicianUsers.url, {
            method: SummaryApi.getTechnicianUsers.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const techniciansData = await techniciansResponse.json();
          console.log('API Response for technicians:', techniciansData);
          if (techniciansData.success) {
            const technicians = techniciansData.data || [];
            
            // Update branch data with technician counts
            setBranchData(prevData => {
              const newData = { ...prevData };
              allBranches.forEach(branch => {
                const branchTechnicians = technicians.filter(t => 
                  t.branch && t.branch._id === branch._id && t.status === 'active'
                );
                
                if (newData[branch._id]) {
                  newData[branch._id].techniciansCount = branchTechnicians.length;
                }
              });
              return newData;
            });
          }
        } catch (err) {
          console.log('Could not fetch technicians:', err);
          // Continue without technicians data
        }
      }
      
      // 4. Try to fetch customers if endpoint exists
      if (SummaryApi.getAllCustomers) {
        try {
          const customersResponse = await fetch(SummaryApi.getAllCustomers.url, {
            method: SummaryApi.getAllCustomers.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const customersData = await customersResponse.json();
          if (customersData.success) {
            const customers = customersData.data || [];
            
            // Update branch data with customer counts
            setBranchData(prevData => {
              const newData = { ...prevData };
              allBranches.forEach(branch => {
                const branchCustomers = customers.filter(c => 
                  c.branch && c.branch._id === branch._id
                );
                
                if (newData[branch._id]) {
                  newData[branch._id].customersCount = branchCustomers.length;
                }
              });
              return newData;
            });
          }
        } catch (err) {
          console.log('Could not fetch customers:', err);
          // Continue without customers data
        }
      }
      
      // 5. Try to fetch projects from manager projects API
      if (SummaryApi.getManagerProjects) {
        try {
          const projectsResponse = await fetch(SummaryApi.getManagerProjects.url, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const projectsData = await projectsResponse.json();
          if (projectsData.success) {
            const projects = projectsData.data || [];
            
            // Update branch data with project counts
            setBranchData(prevData => {
              const newData = { ...prevData };
              allBranches.forEach(branch => {
                // Count projects for this branch (completed ones)
                const branchProjects = projects.filter(p => 
                  p.branch && p.branch._id === branch._id && p.status === 'completed'
                );
                
                if (newData[branch._id]) {
                  newData[branch._id].projectsCount = branchProjects.length;
                }
              });
              return newData;
            });
          }
        } catch (err) {
          console.log('Could not fetch projects:', err);
          // Continue without projects data
        }
      }
      
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching branch data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Branches</h1>
        <Link
          to="/branches/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" /> Add Branch
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredBranches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBranches.map((branch) => (
            <Link 
            key={branch._id}
            to={`/branches/${branch._id}`} 
            className='cursor-pointer'>
            <div key={branch._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="text-xl font-semibold text-gray-800">{branch.name}</h2>
              </div>
              
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Manager</p>
                  <p className="text-base font-medium">
                    {branchData[branch._id]?.manager || 'None'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Technicians</p>
                  <p className="text-base font-medium">
                    {branchData[branch._id]?.techniciansCount || 0}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Customers</p>
                  <p className="text-base font-medium">
                    {branchData[branch._id]?.customersCount || 0}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Projects</p>
                  <p className="text-base font-medium">
                    {branchData[branch._id]?.projectsCount || 0}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 text-center">
                <div 
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Click to view details
                </div>
              </div>
            </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No branches found.</p>
          <Link
            to="/branches/add"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Add Your First Branch
          </Link>
        </div>
      )}
    </div>
  );
};

export default BranchList;