import React, { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiMessageSquare, FiEdit2, FiUserPlus, FiCalendar, FiHome } from 'react-icons/fi';
import SummaryApi from '../../common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConvertTypeModal from '../../components/ConvertTypeModal';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  positive: 'bg-green-100 border-green-500 text-green-800',
  negative: 'bg-red-100 border-red-500 text-red-800',
  neutral: 'bg-gray-100 border-gray-400 text-gray-800'
};

// Project types for when converting to customer
const projectTypes = [
  'CCTV Camera',
  'Attendance System',
  'Safe and Locks',
  'Home/Office Automation',
  'IT & Networking Services',
  'Software & Website Development',
  'Custom'
];

const LeadDetailModal = ({ isOpen, onClose, leadId, onLeadUpdated, onConvertSuccess, initialConvertMode = false, conversionType = null, availableContacts = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkStatus, setRemarkStatus] = useState('neutral');
  const [addingRemark, setAddingRemark] = useState(false);
  const [converting, setConverting] = useState(false);
  const [remarkSuccess, setRemarkSuccess] = useState(false);
  
  // New state for the conversion form
  const [showConvertForm, setShowConvertForm] = useState(initialConvertMode);
  const [showExistingCustomerForm, setShowExistingCustomerForm] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [conversionRemark, setConversionRemark] = useState('');
  const [showConvertTypeModal, setShowConvertTypeModal] = useState(false);

  // Existing customer conversion form fields
  const [existingCustomerData, setExistingCustomerData] = useState({
    projectType: '',
    installationDate: '',
    installedBy: '',
    remarks: ''
  });
  
  const fetchLead = async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${SummaryApi.getLead.url}/${leadId}`, {
        method: SummaryApi.getLead.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLead(data.data);
      } else {
        setError(data.message || 'Failed to fetch lead details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching lead:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && leadId) {
      fetchLead();

      // Set the appropriate conversion form based on conversionType
      if (initialConvertMode && conversionType) {
        if (conversionType === 'new_customer') {
          setShowConvertForm(true);
          setShowExistingCustomerForm(false);
        } else if (conversionType === 'existing_customer') {
          setShowConvertForm(false);
          setShowExistingCustomerForm(true);
        }
      } else if (initialConvertMode) {
        // Default to new customer form if no conversionType specified
        setShowConvertForm(true);
        setShowExistingCustomerForm(false);
      }
    } else {
      // Reset state when modal closes
      setLead(null);
      setError(null);
      setRemarkText('');
      setRemarkSuccess(false);
      setShowConvertForm(false);
      setShowExistingCustomerForm(false);
      setProjectType('');
      setConversionRemark('');
      setExistingCustomerData({
        projectType: '',
        installationDate: '',
        installedBy: '',
        remarks: ''
      });
    }
  }, [isOpen, leadId, initialConvertMode, conversionType]);
  
  const handleAddRemark = async (e) => {
    e.preventDefault();
    
    if (!remarkText.trim()) {
      return;
    }
    
    try {
      setAddingRemark(true);
      
      const response = await fetch(`${SummaryApi.addRemark.url}/${leadId}`, {
        method: SummaryApi.addRemark.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: remarkText,
          status: remarkStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLead(data.data);
        setRemarkText('');
        setRemarkSuccess(true);
        
        // Notify parent component that lead was updated
        if (onLeadUpdated) {
          onLeadUpdated(data.data);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRemarkSuccess(false);
        }, 3000);
      } else {
        setError(data.message || 'Failed to add remark');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error adding remark:', err);
    } finally {
      setAddingRemark(false);
    }
  };
  
  // Start the conversion process
  const handleStartConversion = () => {
    setShowConvertTypeModal(true);
  };
  
  // Cancel the conversion process
  const handleCancelConversion = () => {
    setShowConvertForm(false);
    setShowExistingCustomerForm(false);
    setProjectType('');
    setConversionRemark('');
    setExistingCustomerData({
      projectType: '',
      installationDate: '',
      installedBy: '',
      remarks: ''
    });
  };
  
  // Handle convert type selection
  const handleConvertTypeSelected = (convertType, convertedData) => {
    if (convertType === 'new_customer') {
      // For new customer conversion, show the project selection form
      setShowConvertTypeModal(false);
      setShowConvertForm(true);
    } else if (convertType === 'existing_customer') {
      // For existing customer conversion, show the existing customer form
      setShowConvertTypeModal(false);
      setShowExistingCustomerForm(true);
    } else {
      // For dealer/distributor, close modal and notify parent
      if (onConvertSuccess) {
        onConvertSuccess(leadId, convertedData);
      }
      onClose();
    }
  };

  // Complete the conversion process
  const handleConvertToCustomer = async (e) => {
    e.preventDefault();
    
    if (!projectType) {
      setError("Please select a project type");
      return;
    }
    
    try {
      setConverting(true);
      
      // Enhanced API to include project type and remark
      const response = await fetch(`${SummaryApi.convertToCustomer.url}/${leadId}`, {
        method: SummaryApi.convertToCustomer.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectType,
          initialRemark: conversionRemark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Close modal and notify parent
        if (onConvertSuccess) {
          onConvertSuccess(leadId, data.data);
        }
        onClose();

        navigate('/work-orders');
      } else {
        setError(data.message || 'Failed to convert lead to customer');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error converting lead:', err);
    } finally {
      setConverting(false);
    }
  };

  // Complete the existing customer conversion process
  const handleConvertToExistingCustomer = async (e) => {
    e.preventDefault();

    if (!existingCustomerData.projectType) {
      setError("Please select a project type");
      return;
    }

    if (!existingCustomerData.installationDate) {
      setError("Please select installation date");
      return;
    }

    if (!existingCustomerData.installedBy) {
      setError("Please select who installed the service");
      return;
    }

    try {
      setConverting(true);

      // Convert lead directly to existing customer (like AddContactForm existing customer logic)
      const convertResponse = await fetch(`${SummaryApi.convertToExistingCustomer.url}/${leadId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectType: existingCustomerData.projectType,
          installationDate: existingCustomerData.installationDate,
          installedBy: existingCustomerData.installedBy,
          remarks: existingCustomerData.remarks,
          isExistingCustomer: true
        })
      });

      const convertData = await convertResponse.json();

      if (convertData.success) {
        // Close modal and notify parent
        if (onConvertSuccess) {
          onConvertSuccess(leadId, convertData.data);
        }
        onClose();
      } else {
        setError(convertData.message || 'Failed to convert lead to existing customer');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error converting lead to existing customer:', err);
    } finally {
      setConverting(false);
    }
  };

  // Helper function to update existing customer form data
  const updateExistingCustomerData = (field, value) => {
    setExistingCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Services and options for existing customer form
  const services = [
    { value: "", label: "Choose Service..." },
    { value: "CCTV Camera", label: "CCTV Camera" },
    { value: "Attendance System", label: "Attendance System" },
    { value: "Safe and Locks", label: "Safe and Locks" },
    { value: "Home/Office Automation", label: "Home/Office Automation" },
    { value: "IT & Networking Services", label: "IT & Networking Services" },
    { value: "Software & Website Development", label: "Software & Website Development" },
    { value: "Custom", label: "Custom" },
  ];

  const installedByOptions = [
    { value: "", label: "Choose..." },
    { value: "Our Company", label: "Our Company" },
    { value: "Others", label: "Others" },
  ];

  const handleEdit = () => {
    // This will be handled by parent component
    if (onClose) {
      onClose('edit', leadId);
    }
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
      onClose={onClose} 
      title="Lead Details"
      size="xl"
    >
      {loading ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      ) : lead ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
          {/* Lead info panel */}
          <div className={`lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden border-t-4 ${statusColors[lead.status]}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{lead.name}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    Added on {formatDate(lead.createdAt)}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm capitalize ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
              
              {/* Contact info */}
              <div className="space-y-4 mt-6">
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-3 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Phone Number</div>
                    <div>{lead.phoneNumber}</div>
                  </div>
                </div>
                
                {lead.whatsappNumber && (
                  <div className="flex items-start">
                    <FiMessageSquare className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">WhatsApp</div>
                      <div>{lead.whatsappNumber}</div>
                    </div>
                  </div>
                )}
                
                {lead.firmName && (
                  <div className="flex items-start">
                    <FiHome className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Firm Name</div>
                      <div>{lead.firmName}</div>
                    </div>
                  </div>
                )}
                
                {lead.address && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">📍</div>
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div>{lead.address}</div>
                    </div>
                  </div>
                )}
                
                {/* {lead.age && (
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Age</div>
                      <div>{lead.age} years</div>
                    </div>
                  </div>
                )} */}
                
                {lead.branch && (
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-gray-500">🏢</div>
                    <div>
                      <div className="text-sm text-gray-500">Branch</div>
                      <div>{lead.branch.name}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {user.role !== 'admin' && (
              <div className="mt-8 space-y-3">
                {/* <button
                  onClick={handleEdit}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Lead
                </button> */}
                
                {!showConvertForm && !showExistingCustomerForm && (
                  <button
                    onClick={handleStartConversion}
                    className="w-full py-2 px-4 bg-green-500 text-white rounded-md flex items-center justify-center hover:bg-green-600"
                  >
                    <FiUserPlus className="mr-2" />
                    Convert
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
          
          {/* Right panel - either remarks or conversion form */}
          <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              {!showConvertForm && !showExistingCustomerForm ? (
                /* Remarks & Follow-ups */
                <>
                  <h2 className="text-xl font-semibold mb-6">Remarks & Follow-ups</h2>
                  
                  {/* Add remark form */}
                  <form onSubmit={handleAddRemark} className="mb-8">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Add New Remark</label>
                      <textarea
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Enter your remark or follow-up notes..."
                        required
                      ></textarea>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="mb-4 sm:mb-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-md text-sm ${
                              remarkStatus === 'positive' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                            onClick={() => setRemarkStatus('positive')}
                          >
                            Positive
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-md text-sm ${
                              remarkStatus === 'neutral' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                            onClick={() => setRemarkStatus('neutral')}
                          >
                            Neutral
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-md text-sm ${
                              remarkStatus === 'negative' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                            onClick={() => setRemarkStatus('negative')}
                          >
                            Negative
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={addingRemark || !remarkText.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                      >
                        {addingRemark ? 'Adding...' : 'Add Remark'}
                      </button>
                    </div>
                    
                    {remarkSuccess && (
                      <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-md">
                        Remark added successfully!
                      </div>
                    )}
                  </form>
                  
                  {/* Remarks history */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-4">Remark History</h3>
                    
                    {lead.remarks && lead.remarks.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {lead.remarks.slice().reverse().map((remark, index) => (
                          <div 
                            key={remark._id || index} 
                            className={`p-4 rounded-lg border-l-4 ${
                              remark.status === 'positive' ? 'bg-green-50 border-green-500' : 
                              remark.status === 'negative' ? 'bg-red-50 border-red-500' : 
                              'bg-gray-50 border-gray-400'
                            }`}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium capitalize text-sm">
                                {remark.status}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(remark.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-800">{remark.text}</p>
                            {remark.createdBy && (
                              <div className="mt-2 text-xs text-gray-500">
                                Added by: {remark.createdBy.firstName} {remark.createdBy.lastName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        No remarks yet. Add your first remark above.
                      </div>
                    )}
                  </div>
                </>
              ) : showConvertForm ? (
                /* Convert to Customer Form */
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Convert to Customer</h2>
                    <button
                      onClick={handleCancelConversion}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Back to Lead Details
                    </button>
                  </div>
                  
                  <form onSubmit={handleConvertToCustomer}>
                    <div className="space-y-6 mb-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Project Type*</label>
                        <select
                          value={projectType}
                          onChange={(e) => setProjectType(e.target.value)}
                          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Choose a project type</option>
                          {projectTypes.map((type, index) => (
                            <option key={index} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Project Remark</label>
                        <textarea
                          value={conversionRemark}
                          onChange={(e) => setConversionRemark(e.target.value)}
                          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="4"
                          placeholder="Enter initial project requirements or details..."
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <div className="bg-blue-50 p-4 rounded-md mb-6">
                        <h3 className="font-medium text-blue-800 mb-2">Lead Information Summary</h3>
                        <p className="text-sm text-blue-700">
                          Converting <strong>{lead.name}</strong> to a customer with phone number <strong>{lead.phoneNumber}</strong>. 
                          All lead information will be transferred to the new customer record.
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                          <strong>Note:</strong> A new work order will be automatically created for this customer with the selected project type.
                        </p>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleCancelConversion}
                          className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        
                        <button
                          type="submit"
                          disabled={converting || !projectType}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                        >
                          {converting ? 'Converting...' : 'Complete Conversion'}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : showExistingCustomerForm ? (
                /* Convert to Existing Customer Form */
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Convert to Existing Customer</h2>
                    <button
                      onClick={handleCancelConversion}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Back to Lead Details
                    </button>
                  </div>

                  <form onSubmit={handleConvertToExistingCustomer}>
                    <div className="space-y-6 mb-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Type*</label>
                        <select
                          value={existingCustomerData.projectType}
                          onChange={(e) => updateExistingCustomerData('projectType', e.target.value)}
                          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          {services.map((service) => (
                            <option key={service.value} value={service.value}>
                              {service.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Installation Date*</label>
                        <input
                          type="date"
                          value={existingCustomerData.installationDate}
                          onChange={(e) => updateExistingCustomerData('installationDate', e.target.value)}
                          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Installed By*</label>
                        <select
                          value={existingCustomerData.installedBy}
                          onChange={(e) => updateExistingCustomerData('installedBy', e.target.value)}
                          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          {installedByOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                        <textarea
                          value={existingCustomerData.remarks}
                          onChange={(e) => updateExistingCustomerData('remarks', e.target.value)}
                          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows="4"
                          placeholder="Additional notes about the service..."
                        ></textarea>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="bg-indigo-50 p-4 rounded-md mb-6">
                        <h3 className="font-medium text-indigo-800 mb-2">Existing Customer Service Addition</h3>
                        <p className="text-sm text-indigo-700">
                          Converting <strong>{lead.name}</strong> ({lead.phoneNumber}) to an existing customer service.
                          The system will find the matching customer and add this service to their record.
                        </p>
                        <p className="text-sm text-indigo-700 mt-2">
                          <strong>Note:</strong> This service will be automatically marked as "completed" since it's for an existing customer.
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleCancelConversion}
                          className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={converting || !existingCustomerData.projectType || !existingCustomerData.installationDate || !existingCustomerData.installedBy}
                          className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
                        >
                          {converting ? 'Converting...' : 'Add Service to Existing Customer'}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          Lead not found
        </div>
      )}

      <ConvertTypeModal
        isOpen={showConvertTypeModal}
        onClose={() => setShowConvertTypeModal(false)}
        leadData={lead}
        onConvertSuccess={handleConvertTypeSelected}
      />
    </Modal>
  );
};

export default LeadDetailModal;