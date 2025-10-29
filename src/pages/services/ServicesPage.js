import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiSearch, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';

const ServicesPage = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    customerPrice: ''
  });

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
        }
        if (isEditModalOpen) {
          setIsEditModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen, isEditModalOpen]);

  // Fetch all services from API
  const fetchServices = async (forceFresh = false) => {
    try {
      // Check for cached data
      const cachedServices = localStorage.getItem('servicesData');

      // Use cached data if available and not forcing fresh data
      if (!forceFresh && cachedServices) {
        setServices(JSON.parse(cachedServices));
        // Fetch fresh data in background
        fetchFreshServicesInBackground();
        setLoading(false);
        return;
      }

      // If no valid cache or force fresh, fetch new data
      setLoading(true);
      await fetchFreshServicesData();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const cachedServices = localStorage.getItem('servicesData');
      if (cachedServices) {
        setServices(JSON.parse(cachedServices));
        console.log("Using cached services data after fetch error");
      } else {
        showNotification('error', 'Server error. Failed to fetch services.');
        console.error('Error fetching services:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshServicesInBackground = async () => {
    try {
      await fetchFreshServicesData(true);
    } catch (err) {
      console.error('Error fetching services data in background:', err);
    }
  };

  const fetchFreshServicesData = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }

    try {
      const response = await fetch(`${SummaryApi.getInventoryByType.url}/service`, {
        method: SummaryApi.getInventoryByType.method,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setServices(data.items || []);
        // Cache the services data
        localStorage.setItem('servicesData', JSON.stringify(data.items || []));
      }
    } catch (err) {
      if (!isBackground) {
        showNotification('error', 'Server error. Failed to fetch services.');
        console.error('Error fetching services:', err);
      }
      throw err;
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  // Function to toggle expanded row
  const toggleRowExpansion = (serviceId) => {
    if (expandedRowId === serviceId) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(serviceId);
    }
  };

  // Function to open edit modal
  const openEditModal = (service) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  };

  // Handle update service
  const handleUpdateService = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SummaryApi.updateInventoryItem.url}/${selectedService.id}`, {
        method: SummaryApi.updateInventoryItem.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedService)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Service updated successfully');
        setIsEditModalOpen(false);

        // Clear the services cache
        localStorage.removeItem('servicesData');

        // Update the local state immediately
        setServices(prevServices =>
          prevServices.map(service =>
            service.id === selectedService.id ? {...service, ...selectedService} : service
          )
        );
        fetchFreshServicesData();
      } else {
        showNotification('error', data.message || 'Failed to update service');
        setError(data.message || 'Failed to update service');
      }
    } catch (err) {
      showNotification('error', 'Server error. Please try again later.');
      setError('Server error. Please try again later.');
      console.error('Error updating service:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit form input changes
  const handleEditServiceChange = (e) => {
    const { name, value } = e.target;

    // Handle nested pricing fields
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setSelectedService({
        ...selectedService,
        pricing: {
          ...selectedService.pricing,
          [pricingField]: value
        }
      });
    } else {
      setSelectedService({
        ...selectedService,
        [name]: value
      });
    }
  };

  // Handle input change for new service form
  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setNewService({
      ...newService,
      [name]: value
    });
  };

  // Validate new service form
  const validateNewServiceForm = () => {
    setError(null);

    if (!newService.name.trim()) {
      setError('Service name is required');
      return false;
    }

    // Allow 0 as a valid price (for AMC customers with free services)
    if (newService.customerPrice === undefined || newService.customerPrice === null || newService.customerPrice === '') {
      setError('Customer price is required');
      return false;
    }

    return true;
  };

  // Add new service
  const handleAddService = async () => {
    if (!validateNewServiceForm()) {
      return;
    }

    try {
      setLoading(true);

      // Generate a unique ID for the service
      const uniqueId = `SERVICE-${Date.now()}`;

      const requestData = {
        type: 'service',
        name: newService.name,
        customerPrice: newService.customerPrice,
        dealerPrice: null,  // Not used for services
        distributorPrice: null,  // Not used for services
        id: uniqueId
      };

      console.log('Sending service data:', requestData);
      console.log('API URL:', SummaryApi.addInventoryItem.url);

      const response = await fetch(SummaryApi.addInventoryItem.url, {
        method: SummaryApi.addInventoryItem.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        showNotification('success', 'Service added successfully');

        // Reset form
        setNewService({
          name: '',
          customerPrice: ''
        });

        // Clear the services cache
        localStorage.removeItem('servicesData');

        // Refresh services
        fetchFreshServicesData();
      } else {
        showNotification('error', data.message || 'Failed to add service');
        setError(data.message || 'Failed to add service');
      }
    } catch (err) {
      showNotification('error', 'Server error. Please try again later.');
      setError('Server error. Please try again later.');
      console.error('Error adding service:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on search term
  const filteredServices = services.filter(service => {
    if (searchTerm) {
      return service.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-purple-700">Services</h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            {/* Add Service Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              <FiPlusCircle className="mr-2" />
              Add Service
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchFreshServicesData()}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              title="Refresh Services"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="search"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Search services..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left bg-purple-50">
                <th className="px-4 py-3 text-xs text-purple-700 font-medium">S.NO</th>
                <th className="px-4 py-3 text-xs text-purple-700 font-medium">SERVICE NAME</th>
                <th className="px-4 py-3 text-xs text-purple-700 font-medium">CUSTOMER PRICE</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service, index) => (
                <React.Fragment key={service.id}>
                  <tr
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'} hover:bg-purple-100/50 cursor-pointer`}
                    onClick={() => toggleRowExpansion(service.id)}
                  >
                    <td className="px-4 py-3 border-t">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-t font-medium">{service.name}</td>
                    <td className="px-4 py-3 border-t">
                      <span className="text-purple-700 font-semibold">₹{service.pricing?.customerPrice || 0}</span>
                    </td>
                  </tr>

                  {/* Expandable row for action buttons */}
                  {expandedRowId === service.id && (
                    <tr className="bg-purple-50">
                      <td colSpan={3} className="px-6 py-4 border-b">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => openEditModal(service)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-500 hover:bg-purple-600"
                          >
                            <FiSave className="mr-2" />
                            Edit Service
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setServiceToDelete(service);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-red-500 bg-white hover:bg-red-500 hover:text-white"
                          >
                            <FiTrash2 className="mr-2" />
                            Delete Service
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                    {loading ? 'Loading services...' : 'No services found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white max-h-[600px] overflow-y-auto rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-purple-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-purple-800">Add New Service</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-purple-500 hover:text-purple-700 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newService.name}
                    onChange={handleServiceInputChange}
                    className="w-full p-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter service name"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="customerPrice"
                    value={newService.customerPrice}
                    onChange={handleServiceInputChange}
                    className="w-full p-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter customer price (0 for AMC customers)"
                    min="0"
                    step="any"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FiSave className="mr-2" />
                    Save Service
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {isEditModalOpen && selectedService && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white max-h-[600px] overflow-y-auto rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-purple-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-purple-800">Edit Service: {selectedService.name}</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-purple-500 hover:text-purple-700 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={selectedService.name}
                    onChange={handleEditServiceChange}
                    className="w-full p-2 border border-purple-300 rounded-md bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Service name cannot be changed after creation
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Price (₹)
                  </label>
                  <input
                    type="number"
                    name="customerPrice"
                    value={selectedService.pricing?.customerPrice !== undefined && selectedService.pricing?.customerPrice !== null ? selectedService.pricing.customerPrice : ''}
                    onChange={(e) => handleEditServiceChange({
                      target: {
                        name: 'pricing.customerPrice',
                        value: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Customer Price (0 for AMC customers)"
                    min="0"
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateService}
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FiSave className="mr-2" />
                    Update Service
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Confirm Delete"
        message={`${user.firstName} ${user.lastName || ''} Are you sure you want to delete the service "${serviceToDelete ? serviceToDelete.name : ''}"?`}
        confirmText="Yes, Delete"
        cancelText="No"
        onConfirm={async () => {
          if (!serviceToDelete) {
            setIsDeleteDialogOpen(false);
            return;
          }

          try {
            setLoading(true);
            const response = await fetch(`${SummaryApi.deleteInventoryItem.url}/${serviceToDelete.id}`, {
              method: SummaryApi.deleteInventoryItem.method,
              credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
              showNotification('success', 'Service deleted successfully.');
              setServices(prevServices => prevServices.filter(service => service.id !== serviceToDelete.id));
              localStorage.removeItem('servicesData');
              fetchFreshServicesData();
            } else {
              showNotification('error', data.message || 'Failed to delete service.');
            }
          } catch (err) {
            showNotification('error', 'Server error. Please try again later.');
            console.error('Error deleting service:', err);
          } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setServiceToDelete(null);
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setServiceToDelete(null);
        }}
      />
    </div>
  );
};

export default ServicesPage;
