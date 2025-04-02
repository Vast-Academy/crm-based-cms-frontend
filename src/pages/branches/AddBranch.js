import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import SummaryApi from '../../common';

const AddBranch = () => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    status: 'active'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!formData.name || !formData.location) {
      setError('Branch name and location are required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(SummaryApi.addBranch.url, {
        method: SummaryApi.addBranch.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to branch list on success
        navigate('/branches');
      } else {
        setError(data.message || 'Failed to add branch');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error adding branch:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/branches')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Add New Branch</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Branch Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter branch name"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="location">
                Location*
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter location"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter complete address"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/branches')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <FiSave className="mr-2" /> Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" /> Save Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranch;