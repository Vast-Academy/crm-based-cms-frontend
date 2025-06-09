import React, { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { useNotification } from '../../context/NotificationContext';

const EditCustomerModal = ({ isOpen, onClose, customerId, onSuccess }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    address: '',
    age: '',
    branch: '',
    status: 'active'
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomer();
    }
  }, [isOpen, customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${SummaryApi.getCustomer.url}/${customerId}`, {
        method: SummaryApi.getCustomer.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: data.data.name || '',
          phoneNumber: data.data.phoneNumber || '',
          whatsappNumber: data.data.whatsappNumber || '',
          email: data.data.email || '',
          address: data.data.address || '',
          age: data.data.age || '',
          branch: data.data.branch && data.data.branch._id ? data.data.branch._id : (data.data.branch || ''),
          status: data.data.status || 'active'
        });

        if (user.role === 'admin') {
          fetchBranches();
        }
      } else {
        setError(data.message || 'Failed to fetch customer data');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
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
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
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

      const response = await fetch(`${SummaryApi.updateCustomer.url}/${customerId}`, {
        method: SummaryApi.updateCustomer.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Customer updated successfully');
        onSuccess && onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to update customer');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error updating customer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Customer"
      size="lg"
    >
      <div className="p-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email*
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="whatsappNumber">
                WhatsApp Number
              </label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="text"
                value={formData.whatsappNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter WhatsApp number"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter age"
                min="0"
              />
            </div>

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
                  <FiSave className="mr-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditCustomerModal;
