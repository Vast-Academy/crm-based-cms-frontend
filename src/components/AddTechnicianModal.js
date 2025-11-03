import React, { useState, useEffect } from 'react';  // useEffect जोड़ा
import { FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import Modal from '../components/Modal';
import SummaryApi from '../common';
import { useAuth } from '../context/AuthContext';

const AddTechnicianModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    branch: '',  // ब्रांच फील्ड जोड़ा
    status: 'active'
  });
  
  const [branches, setBranches] = useState([]);  // ब्रांचेज के लिए स्टेट जोड़ा
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // मॉडल खुलने पर फॉर्म रीसेट करें और ब्रांचेज फेच करें
  useEffect(() => {
    if (isOpen) {
      resetForm();
      
      // अगर एडमिन है तो ब्रांचेज फेच करें
      if (user.role === 'admin') {
        fetchBranches();
      }
    }
  }, [isOpen, user.role]);
  
  // फॉर्म रीसेट करने का फंक्शन
  const resetForm = () => {
    // भरे हुए फॉर्म को खाली करें
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      branch: '',
      status: 'active'
    });
    setError(null);
    setUsernameError(null);
    
    // ऑटोफिल समस्या को ठीक करने के लिए थोड़ी देर का टाइमआउट जोड़ें
    setTimeout(() => {
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      
      // ऑटोफिल वैल्यूज को क्लियर करें
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
      
      // फॉर्म स्टेट अपडेट करें
      setFormData(prev => ({
        ...prev,
        username: '',
        password: '',
        confirmPassword: ''
      }));
    }, 100);
  };
  
  // ब्रांचेज फेच करने का फंक्शन (एडमिन के लिए)
  const fetchBranches = async () => {
    try {
      // कैश्ड ब्रांच डेटा चेक करें
      const cachedBranchData = localStorage.getItem('technicianBranchesData');
      
      if (cachedBranchData) {
        setBranches(JSON.parse(cachedBranchData));
        return;
      }
      
      // अगर कैश नहीं है तो API से फेच करें
      const response = await fetch(SummaryApi.getBranches.url, {
        method: SummaryApi.getBranches.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBranches(data.data || []);
        
        // ब्रांच डेटा कैश करें
        localStorage.setItem('technicianBranchesData', JSON.stringify(data.data || []));
      } else {
        setError('Failed to fetch branches. Please try again.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching branches:', err);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear username error when user starts typing
    if (name === 'username' && usernameError) {
      setUsernameError(null);
    }
  };

  const validateUsername = (username) => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return 'Username is required';
    }

    const usernameRegex = /^[a-zA-Z0-9_.-@#]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return 'Username can only contain letters, numbers, and symbols (_ . - @ #). Spaces are not allowed.';
    }

    return null;
  };

  const handleUsernameBlur = () => {
    const error = validateUsername(formData.username);
    setUsernameError(error);
  };
  
  const validateForm = () => {
    // Check username validity first
    const usernameValidationError = validateUsername(formData.username);
    if (usernameValidationError) {
      setUsernameError(usernameValidationError);
      setError(usernameValidationError);
      return false;
    }

    // एडमिन के लिए ब्रांच वैलिडेशन जोड़ें
    if (user.role === 'admin' && !formData.branch) {
      setError('Please select a branch');
      return false;
    }

    if (!formData.firstName || !formData.username || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(formData.email)) {
    //   setError('Please enter a valid email address');
    //   return false;
    // }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);

      // confirmPassword हटा दें API कॉल से पहले
      const { confirmPassword, ...dataToSubmit } = formData;

      // Trim username to remove leading/trailing spaces
      dataToSubmit.username = dataToSubmit.username.trim();

      // मैनेजर के लिए उनके ब्रांच का उपयोग करें
      if (user.role === 'manager') {
        dataToSubmit.branch = user.branch;
      }
      // नोट: एडमिन के लिए फॉर्म से सिलेक्टेड ब्रांच ही जाएगा
      
      // अलग-अलग एंडपॉइंट्स का उपयोग करें यूजर रोल के आधार पर
      const endpoint = user.role === 'admin' 
        ? SummaryApi.addTechnicianUser
        : SummaryApi.addManagerTechnician;
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // कैश इनवैलिडेट करें ताकि फ्रेश डेटा लोड हो
        localStorage.removeItem('technicianUsersData');
        localStorage.removeItem('technicianUsersDataTimestamp');
        
        // फॉर्म रीसेट करें और मॉडल बंद करें
        resetForm();
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to add technician');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error adding technician:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Engineer" size="lg">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="firstName">
              First Name*
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter first name"
              autoComplete="off"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter last name"
              autoComplete="off"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="username">
              Username*
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleUsernameBlur}
              className={`w-full px-3 py-2 border ${usernameError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="Enter username"
              autoComplete="off"
              required
            />
            {usernameError && (
              <p className="mt-1 text-sm text-red-600">{usernameError}</p>
            )}
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter email"
              autoComplete="off"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password*
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                style={!showPassword ? { WebkitTextSecurity: 'disc' } : {}}
                placeholder="Enter password"
                autoComplete="off"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
              Confirm Password*
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="text"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                style={!showConfirmPassword ? { WebkitTextSecurity: 'disc' } : {}}
                placeholder="Confirm password"
                autoComplete="off"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
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
              autoComplete="off"
            />
          </div>
          
          {/* ब्रांच सिलेक्ट फील्ड सिर्फ एडमिन के लिए दिखाएं */}
          {user.role === 'admin' && (
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="branch">
                Branch*
              </label>
              <select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {branches.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No branches available. Please add a branch first.
                </p>
              )}
            </div>
          )}
          
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
            onClick={onClose}
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
                <FiSave className="mr-2" /> Save Engineer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTechnicianModal;