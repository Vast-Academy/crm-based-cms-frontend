import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import SummaryApi from '../common';
import LoadingSpinner from './LoadingSpinner';
import { FiSearch, FiUser, FiPhone, FiCalendar, FiMail, FiMapPin, FiMessageSquare } from 'react-icons/fi';

const ExistingCustomerModal = ({ isOpen, onClose, leadData, matchedCustomer, onConvertSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  // Form data for the service
  const [formData, setFormData] = useState({
    projectType: '',
    installationDate: '',
    installedBy: '',
    remarks: ''
  });

  const services = useMemo(
    () => [
      { value: "", label: "Choose Service..." },
      { value: "CCTV Camera", label: "CCTV Camera" },
      { value: "Attendance System", label: "Attendance System" },
      { value: "Safe and Locks", label: "Safe and Locks" },
      { value: "Home/Office Automation", label: "Home/Office Automation" },
      { value: "IT & Networking Services", label: "IT & Networking Services" },
      { value: "Software & Website Development", label: "Software & Website Development" },
      { value: "Custom", label: "Custom" },
    ],
    []
  );

  const installedByOptions = [
    { value: "", label: "Choose..." },
    { value: "Our Company", label: "Our Company" },
    { value: "Others", label: "Others" },
  ];

  // Handle matched customer and fetch all customers when modal opens
  useEffect(() => {
    if (isOpen) {
      if (matchedCustomer) {
        // If we have a matched customer, use it directly and hide selector
        setSelectedCustomer(matchedCustomer);
        setShowCustomerSelector(false);
      } else {
        // If no matched customer, prepare for customer selection
        fetchCustomers();
        setShowCustomerSelector(true);
      }

      // Reset form when modal opens
      setSearchQuery('');
      setFormData({
        projectType: '',
        installationDate: '',
        installedBy: '',
        remarks: ''
      });
      setError(null);
    }
  }, [isOpen, matchedCustomer]);

  // Filter customers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phoneNumber.includes(searchQuery) ||
        (customer.firmName && customer.firmName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.getAllCustomers.url, {
        method: SummaryApi.getAllCustomers.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
        setFilteredCustomers(data.data);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (err) {
      setError('Server error while fetching customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedCustomer) {
      errors.customer = 'Please select a customer';
    }

    if (!formData.projectType) {
      errors.projectType = 'Service type is required';
    }

    if (!formData.installationDate) {
      errors.installationDate = 'Installation date is required';
    }

    if (!formData.installedBy) {
      errors.installedBy = 'Please specify who installed the service';
    }

    return errors;
  };

  const handleConvert = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);
      return;
    }

    setConverting(true);
    setError(null);

    try {
      const response = await fetch(`${SummaryApi.convertToExistingCustomer.url}/${leadData._id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          projectType: formData.projectType,
          installationDate: formData.installationDate,
          installedBy: formData.installedBy,
          remarks: formData.remarks
        })
      });

      const data = await response.json();

      if (data.success) {
        onConvertSuccess('existing_customer', data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to convert lead to existing customer');
      }
    } catch (err) {
      setError('Server error while converting lead. Please try again.');
      console.error('Conversion error:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setFormData({
      projectType: '',
      installationDate: '',
      installedBy: '',
      remarks: ''
    });
    setError(null);
    setShowCustomerSelector(false);
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Convert Lead to Existing Customer"
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left Panel - Lead Information */}
        <div className="bg-white rounded-lg border overflow-hidden border-t-4 border-blue-500">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{leadData?.name}</h2>
                <div className="text-sm text-gray-500 mt-1">
                  Converting this lead to existing customer
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Lead
              </span>
            </div>

            {/* Lead Contact Info */}
            <div className="space-y-4 mt-6">
              <div className="flex items-start">
                <FiPhone className="mt-1 mr-3 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Phone Number</div>
                  <div>{leadData?.phoneNumber}</div>
                </div>
              </div>

              {leadData?.whatsappNumber && (
                <div className="flex items-start">
                  <FiMessageSquare className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">WhatsApp</div>
                    <div>{leadData?.whatsappNumber}</div>
                  </div>
                </div>
              )}

              {leadData?.email && (
                <div className="flex items-start">
                  <FiMail className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div>{leadData?.email}</div>
                  </div>
                </div>
              )}

              {leadData?.firmName && (
                <div className="flex items-start">
                  <FiUser className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Firm Name</div>
                    <div>{leadData?.firmName}</div>
                  </div>
                </div>
              )}

              {leadData?.address && (
                <div className="flex items-start">
                  <FiMapPin className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Address</div>
                    <div>{leadData?.address}</div>
                  </div>
                </div>
              )}

              {leadData?.projectType && (
                <div className="flex items-start">
                  <div className="mt-1 mr-3 text-gray-500">💼</div>
                  <div>
                    <div className="text-sm text-gray-500">Inquiry For</div>
                    <div>{leadData?.projectType}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Customer Selection & Conversion Form */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6">
            {/* Customer Selection Section - Only show if we need to select a customer */}
            {!matchedCustomer && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {selectedCustomer ? 'Selected Customer' : 'Select Customer'}
                  </h3>
                  {selectedCustomer && !showCustomerSelector && (
                    <button
                      onClick={() => setShowCustomerSelector(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Change Customer
                    </button>
                  )}
                </div>

                {selectedCustomer && !showCustomerSelector ? (
                  /* Show Selected Customer */
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                        <FiUser size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-indigo-900">{selectedCustomer.name}</div>
                        <div className="text-sm text-indigo-700 space-y-1">
                          <div className="flex items-center">
                            <FiPhone size={12} className="mr-1" />
                            {selectedCustomer.phoneNumber}
                          </div>
                          {selectedCustomer.firmName && (
                            <div>{selectedCustomer.firmName}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-indigo-600 font-medium">✓ Selected</div>
                    </div>
                  </div>
                ) : showCustomerSelector ? (
                /* Show Customer Selector */
                <div className="mb-6">
                  {/* Search */}
                  <div className="relative mb-4">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Customer List */}
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer._id}
                            onClick={() => {
                              handleCustomerSelect(customer);
                              setShowCustomerSelector(false);
                            }}
                            className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                <FiUser size={14} />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">{customer.name}</div>
                                <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* No customer selected and not showing selector */
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-6">
                  <div className="text-sm text-yellow-700">
                    No matching customer found. Please select a customer manually.
                  </div>
                  <button
                    onClick={() => {
                      fetchCustomers();
                      setShowCustomerSelector(true);
                    }}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Select Customer
                  </button>
                </div>
              )}
              </div>
            )}

            {/* Matched Customer Info - Show when customer is auto-matched */}
            {matchedCustomer && selectedCustomer && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Converting to Customer</h3>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                      <FiUser size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-indigo-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-indigo-700 space-y-1">
                        <div className="flex items-center">
                          <FiPhone size={12} className="mr-1" />
                          {selectedCustomer.phoneNumber}
                        </div>
                        {selectedCustomer.firmName && (
                          <div>{selectedCustomer.firmName}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-indigo-600 font-medium">✓ Auto-Selected</div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Details Form */}
            {selectedCustomer && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Service Details</h4>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => handleFormChange('projectType', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  >
                    {services.map((service) => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Installation Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Date *
                  </label>
                  <input
                    type="date"
                    value={formData.installationDate}
                    onChange={(e) => handleFormChange('installationDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  />
                </div>

                {/* Installed By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installed By *
                  </label>
                  <select
                    value={formData.installedBy}
                    onChange={(e) => handleFormChange('installedBy', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  >
                    {installedByOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-2 resize-none"
                  />
                </div>

                {/* Note */}
                <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700">
                    <strong>Note:</strong> This service will be marked as "completed" automatically.
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={handleClose}
                disabled={converting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={!selectedCustomer || !formData.projectType || !formData.installationDate || !formData.installedBy || converting}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
              >
                {converting ? 'Converting...' : 'Convert to Existing Customer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExistingCustomerModal;