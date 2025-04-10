import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlusCircle, FiFilter, FiRefreshCw, FiUserPlus } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import AddContactForm from './AddContactForm';
import LeadDetailModal from '../leads/LeadDetail';
import CustomerDetailModal from './CustomerDetailModal';
import WorkOrderModal from '../customers/WorkOrderModal';

const statusColors = {
  positive: 'bg-green-100 border-green-500 text-green-800',
  negative: 'bg-red-100 border-red-500 text-red-800',
  neutral: 'bg-gray-100 border-gray-400 text-gray-800',
};

const customerColor = 'border-blue-500 bg-blue-50';

const ContactsPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'lead', 'customer'
    status: 'all'
  });
  
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [initialPhone, setInitialPhone] = useState('');
  const [initialType, setInitialType] = useState('lead');
  const [expandedRow, setExpandedRow] = useState(null);
  const [openInConvertMode, setOpenInConvertMode] = useState(false);

  const handleRowClick = (contactId) => {
    // अगर पहले से ही expanded है तो collapse करें, अन्यथा expand करें
    setExpandedRow(expandedRow === contactId ? null : contactId);
  };
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Include branch parameter if admin has selected a branch
      let branchParam = '';
      if (user.role === 'admin' && user.selectedBranch) {
        branchParam = `?branch=${user.selectedBranch}`;
      }
      
      // Fetch leads
      const leadsResponse = await fetch(`${SummaryApi.getAllLeads.url}${branchParam}`, {
        method: SummaryApi.getAllLeads.method,
        credentials: 'include'
      });
      
      const leadsData = await leadsResponse.json();
      
      // Fetch customers
      const customersResponse = await fetch(`${SummaryApi.getAllCustomers.url}${branchParam}`, {
        method: SummaryApi.getAllCustomers.method,
        credentials: 'include'
      });
      
      const customersData = await customersResponse.json();
      
      // Process leads data
      const processedLeads = leadsData.success ? leadsData.data.map(lead => ({
        ...lead,
        contactType: 'lead'
      })) : [];
      
      // Process customers data
      const processedCustomers = customersData.success ? customersData.data.map(customer => ({
        ...customer,
        contactType: 'customer',
        status: 'positive' // Customers are always marked as positive
      })) : [];
      
      // Combine data and sort by createdAt date (newest first)
      const combinedContacts = [...processedLeads, ...processedCustomers];
      combinedContacts.sort((a, b) => {
        const aDate = a.updatedAt || a.createdAt;
        const bDate = b.updatedAt || b.createdAt;
        return new Date(bDate) - new Date(aDate);
      });

      setContacts(combinedContacts);
      applyFilters(combinedContacts);
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContacts();
  }, [user.selectedBranch]);
  
  // Handle opening lead detail modal
  const handleViewLead = (leadId, convertMode = false) => {
    setSelectedLeadId(leadId);
    setOpenInConvertMode(convertMode);
    setShowLeadDetailModal(true);
  };
  
  // Handle opening customer detail modal
  const handleViewCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowCustomerDetailModal(true);
  };
  
  // Handle creating new project for a customer
  const handleCreateProject = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowWorkOrderModal(true);
  };

  // Handle work order success
  const handleWorkOrderSuccess = (data) => {
    // Refresh contacts data to get updated customer info
    fetchContacts();
    setShowWorkOrderModal(false);
  };
  
  // Handle view of a contact (either lead or customer)
  const handleViewContact = (contact) => {
    if (contact.contactType === 'lead') {
      handleViewLead(contact._id);
    } else {
      handleViewCustomer(contact._id);
    }
  };
  
  // Handle lead conversion success
  const handleLeadConverted = (leadId, newCustomer) => {
  // लीड को लिस्ट से हटाएं
  setContacts(prevContacts => {
    const updatedContacts = prevContacts.filter(
      contact => !(contact.contactType === 'lead' && contact._id === leadId)
    );
    
    // अगर नया कस्टमर डेटा है तो उसे लिस्ट के शुरू में जोड़ें
    if (newCustomer) {
      return [
        { ...newCustomer, contactType: 'customer' },
        ...updatedContacts
      ];
    }
    
    return updatedContacts;
  });
  
  // मॉडल बंद करें
  setShowLeadDetailModal(false);
};

// Customer update handler
const handleCustomerUpdated = (updatedCustomer) => {
  setContacts(prevContacts => {
    const contactIndex = prevContacts.findIndex(
      contact => contact.contactType === 'customer' && contact._id === updatedCustomer._id
    );
    
    if (contactIndex === -1) {
      return prevContacts;
    }
    
    const newContacts = [...prevContacts];
    
    const updatedContact = {
      ...updatedCustomer,
      contactType: 'customer'
    };
    
    newContacts.splice(contactIndex, 1);
    
    return [updatedContact, ...newContacts];
  });
};

// ModalForm के onSuccess हैंडलर
const handleContactAdded = (newContact) => {
  setShowAddModal(false);
  
  // एक additional contactType प्रॉपर्टी जोड़ें
  const contactTypeField = newContact.projectType ? 'customer' : 'lead';
  const contactWithType = {
    ...newContact,
    contactType: contactTypeField
  };
  
  // नए कॉन्टैक्ट को लिस्ट के शुरू में जोड़ें
  setContacts(prevContacts => [contactWithType, ...prevContacts]);
  
  // फिल्टर्स को फिर से लागू करें
  applyFilters([contactWithType, ...contacts]);
};

// LeadDetailModal से लीड अपडेट हैंडलिंग
const handleLeadUpdated = (updatedLead) => {
  // अपडेटेड लीड को फ़ाइंड और रिप्लेस करें
  setContacts(prevContacts => {
    const contactIndex = prevContacts.findIndex(
      contact => contact.contactType === 'lead' && contact._id === updatedLead._id
    );
    
    if (contactIndex === -1) {
      return prevContacts;
    }
    
    // नई कॉपी बनाएं
    const newContacts = [...prevContacts];
    
    // अपडेटेड लीड को contactType के साथ सेट करें
    const updatedContact = {
      ...updatedLead,
      contactType: 'lead'
    };
    
    // पहले लीड को हटाएं
    newContacts.splice(contactIndex, 1);
    
    // फिर सबसे पहले पोजीशन पर जोड़ें
    return [updatedContact, ...newContacts];
  });
};
  
  // Handle adding a new contact
  const handleAddNew = (phoneNumber = '', type = 'lead') => {
    setInitialPhone(phoneNumber);
    setInitialType(type);
    setShowAddModal(true);
  };
  
  // Apply filters to the contacts
  const applyFilters = (contactsToFilter) => {
    let filtered = contactsToFilter;
    
    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(contact => contact.contactType === filters.type);
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(contact => contact.status === filters.status);
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(contact => 
        (contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumber.includes(searchQuery) ||
        (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    
    setFilteredContacts(filtered);
  };
  
  // Handle search and filters
  useEffect(() => {
    applyFilters(contacts);
  }, [searchQuery, filters, contacts]);
  
  // Function to check if search might be a valid phone number
  const isValidPhoneSearch = (query) => {
    return /^\d{10}$/.test(query) || /^\+\d{2}\d{8,12}$/.test(query);
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
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Lead & Customer Management</h1>
          <p className="text-gray-600">Manage all your leads and customers</p>
        </div>
        <button
          onClick={() => handleAddNew()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlusCircle className="mr-2" />
          Add New Lead/Customer
        </button>
      </div>
      
      {/* Add Contact Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Lead/Customer"
        size="lg"
      >
        <AddContactForm 
          initialPhone={initialPhone}
          initialType={initialType}
          onSuccess={handleContactAdded}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
      
      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={showLeadDetailModal}
        onClose={() => {
          setShowLeadDetailModal(false);
          setOpenInConvertMode(false); // Reset the conversion mode state
        }}
        leadId={selectedLeadId}
        onLeadUpdated={handleLeadUpdated}
        onConvertSuccess={handleLeadConverted}
        initialConvertMode={openInConvertMode} // Pass the new prop
      />
      
      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={showCustomerDetailModal}
        onClose={() => setShowCustomerDetailModal(false)}
        customerId={selectedCustomerId}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* Work Order Modal for New Project */}
      <WorkOrderModal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        customerId={selectedCustomerId}
        onSuccess={handleWorkOrderSuccess}
      />
      
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
              onClick={fetchContacts}
              className="px-4 py-2 border rounded-md flex items-center hover:bg-gray-50"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
          
          {showFilter && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="mb-2 font-medium">Contact Type:</div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFilters({...filters, type: 'all'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.type === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilters({...filters, type: 'lead'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.type === 'lead' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Leads
                    </button>
                    <button
                      onClick={() => setFilters({...filters, type: 'customer'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.type === 'customer' ? 'bg-blue-500 text-white' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      Customers
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="mb-2 font-medium">Status:</div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFilters({...filters, status: 'all'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.status === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilters({...filters, status: 'positive'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.status === 'positive' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      Positive
                    </button>
                    <button
                      onClick={() => setFilters({...filters, status: 'neutral'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.status === 'neutral' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      Neutral
                    </button>
                    <button
                      onClick={() => setFilters({...filters, status: 'negative'})}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.status === 'negative' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Negative
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Remark/Project</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map(contact => (
                  <React.Fragment key={`${contact.contactType}-${contact._id}`}>
                  <tr 
                    className={`border-l-4 ${
                      contact.contactType === 'customer' 
                        ? customerColor 
                        : statusColors[contact.status]
                    } cursor-pointer hover:bg-gray-50`}
                    onClick={() => handleRowClick(`${contact.contactType}-${contact._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.email && <div className="text-sm text-gray-500">{contact.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{contact.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        contact.contactType === 'lead' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {contact.contactType === 'lead' ? 'Lead' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.contactType === 'lead' && (
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          contact.status === 'positive' ? 'bg-green-100 text-green-800' :
                          contact.status === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.status}
                        </span>
                      )}
                      {contact.contactType === 'customer' && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.contactType === 'lead' && contact.remarks && contact.remarks.length > 0 ? (
                        <div className="max-w-xs truncate">
                          {contact.remarks[contact.remarks.length - 1].text}
                        </div>
                      ) : contact.contactType === 'customer' ? (
                        <div className="max-w-xs truncate">
                          {contact.projects && contact.projects.length > 0 
                            ? contact.projects[0].projectType 
                            : contact.projectType || 'No information'}
                        </div>
                      ) : (
                        <span className="text-gray-400">No information</span>
                      )}
                    </td>
                  </tr>
                  {/* Expanded row */}
                  {expandedRow === `${contact.contactType}-${contact._id}` && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        <div className="flex gap-2">
                          {contact.contactType === 'lead' ? (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLead(contact._id);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Pass true to open directly in convert mode
                                  handleViewLead(contact._id, true); 
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                              >
                                Convert to Customer
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCustomer(contact._id);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // New Complaint function
                                  alert('New Complaint functionality will be implemented');
                                }}
                                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                              >
                                New Complaint
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // New Project function - now actually opens the WorkOrderModal
                                  handleCreateProject(contact._id);
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                              >
                                New Project
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            {searchQuery && (
              <div>
                <p className="text-gray-500 mb-4">
                  No contacts found matching "{searchQuery}"
                </p>
                {/* Only show the Add as New button when we have a valid phone format */}
                {isValidPhoneSearch(searchQuery) && (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => handleAddNew(searchQuery, 'lead')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                    >
                      <FiUserPlus className="mr-2" />
                      Add as New Lead
                    </button>
                    <button
                      onClick={() => handleAddNew(searchQuery, 'customer')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                    >
                      <FiUserPlus className="mr-2" />
                      Add as New Customer
                    </button>
                  </div>
                )}
              </div>
            )}
            {!searchQuery && (
              <p className="text-gray-500">
                {contacts.length > 0 ? 'Use the search bar to find contacts.' : 'No contacts found. Add a new lead or customer to get started.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;