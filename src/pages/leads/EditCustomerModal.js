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
    firmName: '',
    phoneNumber: '',
    whatsappNumber: '',
    address: '',
    contactPersonName: '',
    contactPersonPhone: '',
    showOwnerDetailsToTechnician: false,
    branch: '',
    status: 'active'
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Duplicate contact person confirmation states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCustomerInfo, setDuplicateCustomerInfo] = useState(null);
  const [managerPassword, setManagerPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [originalContactPhone, setOriginalContactPhone] = useState('');

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
        const contactPhone = data.data.contactPersonPhone || '';
        setOriginalContactPhone(contactPhone); // Store original for comparison

        setFormData({
          name: data.data.name || '',
          firmName: data.data.firmName || '',
          phoneNumber: data.data.phoneNumber || '',
          whatsappNumber: data.data.whatsappNumber || '',
          address: data.data.address || '',
          contactPersonName: data.data.contactPersonName || '',
          contactPersonPhone: contactPhone,
          showOwnerDetailsToTechnician: data.data.showOwnerDetailsToTechnician || false,
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

  // Check if contact person phone number already exists
  const checkDuplicateContactPerson = async (contactPhone) => {
    if (!contactPhone) return null;

    try {
      const response = await fetch(`${SummaryApi.checkDuplicateContactPerson.url}?phone=${encodeURIComponent(contactPhone)}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.exists) {
        return data.customer;
      }
      return null;
    } catch (err) {
      console.error('Error checking duplicate contact person:', err);
      return null;
    }
  };

  // Verify manager password
  const verifyManagerPassword = async () => {
    if (!managerPassword) {
      setPasswordError('Password is required');
      return false;
    }

    try {
      const response = await fetch(SummaryApi.verifyPassword.url, {
        method: SummaryApi.verifyPassword.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: managerPassword })
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setPasswordError(data.message || 'Invalid password');
        return false;
      }
    } catch (err) {
      setPasswordError('Server error. Please try again.');
      return false;
    }
  };

  // Handle duplicate confirmation with password
  const handleDuplicateConfirmation = async () => {
    setPasswordError('');

    // Verify password
    const isPasswordValid = await verifyManagerPassword();

    if (isPasswordValid) {
      // Close modal and proceed with submission
      setShowDuplicateModal(false);
      setManagerPassword('');
      await submitUpdate();
    }
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Please fill in all required fields');
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

    // Check if contact person phone has changed and if it's a duplicate
    if (formData.contactPersonPhone && formData.contactPersonPhone !== originalContactPhone) {
      const duplicate = await checkDuplicateContactPerson(formData.contactPersonPhone);
      if (duplicate) {
        // Show duplicate confirmation modal
        setDuplicateCustomerInfo(duplicate);
        setShowDuplicateModal(true);
        return; // Stop here and wait for user confirmation
      }
    }

    // Proceed with submission
    await submitUpdate();
  };

  const submitUpdate = async () => {
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
                Customer Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="firmName">
                Company Name
              </label>
              <input
                id="firmName"
                name="firmName"
                type="text"
                value={formData.firmName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter company name"
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

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter address"
              />
            </div>

            {/* Contact Person Details Section */}
            <div className="md:col-span-2">
              <h3 className="text-md font-semibold text-gray-800 mb-3 mt-2 border-t pt-4">Contact Person Details</h3>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="contactPersonName">
                Contact Person Name
              </label>
              <input
                id="contactPersonName"
                name="contactPersonName"
                type="text"
                value={formData.contactPersonName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="contactPersonPhone">
                Contact Person Mobile
              </label>
              <input
                id="contactPersonPhone"
                name="contactPersonPhone"
                type="text"
                value={formData.contactPersonPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter contact person mobile"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="showOwnerDetailsToTechnician"
                  name="showOwnerDetailsToTechnician"
                  checked={formData.showOwnerDetailsToTechnician}
                  onChange={(e) => setFormData(prev => ({ ...prev, showOwnerDetailsToTechnician: e.target.checked }))}
                  className="mr-3 h-5 w-5 rounded border-gray-300"
                />
                <label htmlFor="showOwnerDetailsToTechnician" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-semibold">Show Owner's Phone Number to Technician</span>
                  <p className="text-xs text-gray-600 mt-1">
                    If checked, technician will see both owner and contact person details
                  </p>
                </label>
              </div>
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

      {/* Duplicate Contact Person Confirmation Modal */}
      {showDuplicateModal && duplicateCustomerInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Duplicate Contact Person</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                This contact person phone number is already added for:
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-semibold text-gray-900">{duplicateCustomerInfo.name}</p>
                {duplicateCustomerInfo.firmName && (
                  <p className="text-sm text-gray-600">Company: {duplicateCustomerInfo.firmName}</p>
                )}
                <p className="text-sm text-gray-600">Phone: {duplicateCustomerInfo.phoneNumber}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 font-medium mb-2">
                Do you still want to update this contact person?
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Please enter your password to confirm:
              </p>
              <input
                type="password"
                value={managerPassword}
                onChange={(e) => {
                  setManagerPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleDuplicateConfirmation()}
                autoComplete="new-password"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-2">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setManagerPassword('');
                  setPasswordError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateConfirmation}
                disabled={!managerPassword}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  managerPassword
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditCustomerModal;
