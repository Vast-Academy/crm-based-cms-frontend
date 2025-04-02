// src/pages/customers/CustomerList.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiPlusCircle, FiFilter, FiRefreshCw } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const CustomerList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    convertedOnly: false
  });
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Include branch parameter if admin has selected a branch
      let url = SummaryApi.getAllCustomers.url;
      if (user.role === 'admin' && user.selectedBranch) {
        url += `?branch=${user.selectedBranch}`;
      }
      
      const response = await fetch(url, {
        method: SummaryApi.getAllCustomers.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCustomers(data.data);
        setFilteredCustomers(data.data);
      } else {
        setError(data.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCustomers();
  }, [user.selectedBranch]);
  
  // Handle search and filtering
  useEffect(() => {
    let results = [...customers];
    
    // Apply converted filter if selected
    if (filters.convertedOnly) {
      results = results.filter(customer => customer.convertedFromLead);
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      results = results.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.phoneNumber.includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query))
      );
    }
    
    setFilteredCustomers(results);
  }, [searchQuery, customers, filters]);
  
  const handleViewCustomer = (customerId) => {
    navigate(`/customers/${customerId}`);
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Customer Management</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Link
          to="/customers/add"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlusCircle className="mr-2" />
          Add New Customer
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="px-4 py-2 border rounded-md flex items-center hover:bg-gray-50"
            >
              <FiFilter className="mr-2" />
              Filter
            </button>
            
            <button
              onClick={fetchCustomers}
              className="px-4 py-2 border rounded-md flex items-center hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
          
          {showFilter && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="convertedOnly"
                  checked={filters.convertedOnly}
                  onChange={() => setFilters({...filters, convertedOnly: !filters.convertedOnly})}
                  className="mr-2"
                />
                <label htmlFor="convertedOnly" className="text-sm font-medium text-gray-700">
                  Show only customers converted from leads
                </label>
              </div>
            </div>
          )}
        </div>
        
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map(customer => (
                  <tr key={customer._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{customer.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.convertedFromLead 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {customer.convertedFromLead ? 'Converted Lead' : 'Direct Entry'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleViewCustomer(customer._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {customers.length > 0 
              ? 'No customers match your search criteria.' 
              : 'No customers found. Add a new customer or convert leads to get started.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;