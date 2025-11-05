import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker-custom.css";
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

export default function AddContactForm({ initialPhone = '', initialType = 'lead', onSuccess, onCancel, isOpen = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Double ESC and double click states
  const [escPressCount, setEscPressCount] = useState(0);
  const [escPressTimer, setEscPressTimer] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  const [form, setForm] = useState({
    customerName: "",
    companyName: "",
    phone: initialPhone ? initialPhone.replace(/^\+91/, "") : "",
    whatsapp: "",
    sameAsPhone: false,
    address: "",
    leadType: initialType, // Lead | Customer | Dealer | Distributor
    customerStatus: "", // New | Existing
    installDate: "",
    projectType: "",
    installedBy: "", // only for Existing customers
    installedByEngineer: "", // NEW: Engineer name
    engineerMobileNo: "", // NEW: Engineer mobile number
    remarks: "",
  });

  // Country code states
  const [countryCode, setCountryCode] = useState('+91');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+91');
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [showWhatsappDropdown, setShowWhatsappDropdown] = useState(false);

  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' },
    { code: '+86', country: 'China' },
    { code: '+49', country: 'Germany' },
  ];

  // Update phone field and leadType when modal opens
  useEffect(() => {
    if (isOpen) {
      // Update phone if initialPhone is provided
      if (initialPhone) {
        const phoneWithoutCode = initialPhone.replace(/^\+91/, "");
        setForm((f) => ({ ...f, phone: phoneWithoutCode, leadType: initialType || 'Lead' }));
      } else {
        // Reset phone field when modal opens without initial phone
        setForm((f) => ({ ...f, phone: "", leadType: initialType || 'Lead' }));
      }
    }
  }, [isOpen, initialPhone, initialType]);

  // Sync WhatsApp with phone if checkbox is ON
  useEffect(() => {
    if (form.sameAsPhone) {
      setForm((f) => ({ ...f, whatsapp: f.phone }));
      setWhatsappCountryCode(countryCode);
    }
  }, [form.sameAsPhone, form.phone, countryCode]);

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle branches for admin users
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Search results for existing contacts
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Engineer search states
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [showEngineerDropdown, setShowEngineerDropdown] = useState(false);

  // Handle Enter key to move to next input
  const handleKeyDown = (e, nextFieldId) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Special handling for remarks - submit form on Enter
      if (nextFieldId === 'submit') {
        onSubmit(e);
        return;
      }

      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        // For select/dropdown fields, trigger click to open dropdown
        if (nextField.tagName === 'SELECT') {
          nextField.focus();
          // Small delay to ensure focus is set before opening
          setTimeout(() => {
            // Simulate click to open dropdown
            const event = new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            nextField.dispatchEvent(event);
          }, 50);
        } else {
          nextField.focus();
        }
      }
    }
  };

  const services = useMemo(
    () => [
      { value: "CCTV Camera", label: "CCTV Camera" },
      { value: "Attendance System", label: "Attendance System" },
      { value: "Safe and Locks", label: "Safe and Locks" },
      { value: "Lift & Elevator Solutions", label: "Lift & Elevator Solutions" },
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

  // For admin users, fetch branches
  useEffect(() => {
    if (user.role === 'admin') {
      const fetchBranches = async () => {
        try {
          const response = await fetch(SummaryApi.getBranches.url, {
            method: SummaryApi.getBranches.method,
            credentials: 'include'
          });

          const data = await response.json();

          if (data.success) {
            setBranches(data.data);
            if (user.selectedBranch) {
              setSelectedBranch(user.selectedBranch);
            }
          }
        } catch (err) {
          console.error('Error fetching branches:', err);
        }
      };

      fetchBranches();
    }
  }, [user]);

  // Fetch technicians from current branch
  useEffect(() => {
    if (isOpen) {
      const fetchTechnicians = async () => {
        try {
          const response = await fetch(SummaryApi.getTechnicianUsers.url, {
            method: SummaryApi.getTechnicianUsers.method,
            credentials: 'include'
          });

          const data = await response.json();

          if (data.success) {
            // console.log("Fetched technicians:", data.data);
            setTechnicians(data.data || []);
          }
        } catch (err) {
          console.error('Error fetching technicians:', err);
        }
      };

      fetchTechnicians();
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.phone-dropdown')) {
        setShowPhoneDropdown(false);
      }
      if (!event.target.closest('.whatsapp-dropdown')) {
        setShowWhatsappDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function update(key, value) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "leadType" ? { customerStatus: "", installDate: "", installedBy: "", installedByEngineer: "", engineerMobileNo: "" } : {}),
      ...(key === "customerStatus" && value !== "Existing" ? { installDate: "", installedBy: "", installedByEngineer: "", engineerMobileNo: "" } : {}),
      ...(key === "sameAsPhone" && value === true ? { whatsapp: f.phone } : {}),
    }));
  }

  // Handle engineer name input and search
  const handleEngineerNameChange = (value) => {
    update("installedByEngineer", value);

    if (value.trim().length > 0) {
      // Filter technicians based on input
      const filtered = technicians.filter(tech =>
        `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredTechnicians(filtered);
      setShowEngineerDropdown(filtered.length > 0);
    } else {
      setFilteredTechnicians([]);
      setShowEngineerDropdown(false);
      update("engineerMobileNo", ""); // Clear mobile number if name is cleared
    }
  };

  // Handle engineer selection from dropdown
  const handleEngineerSelect = (technician) => {
    // console.log("Selected technician:", technician);

    // Try multiple possible field names for phone number
    const phoneNumber = technician.phoneNumber || technician.phone || technician.mobile || technician.mobileNumber || "";
    // console.log("Phone number:", phoneNumber);

    const fullName = `${technician.firstName} ${technician.lastName}`;
    update("installedByEngineer", fullName);
    update("engineerMobileNo", phoneNumber);
    setShowEngineerDropdown(false);
    setFilteredTechnicians([]);
  };

  // Check if phone number exists
  const checkPhoneNumber = async (phone) => {
    if (phone.length < 8) return;
    
    try {
      const response = await fetch(`${SummaryApi.search.url}?query=${phone}`, {
        method: SummaryApi.search.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        const allResults = [...data.data.leads, ...data.data.customers];
        setSearchResults(allResults);
        setShowSearchResults(allResults.length > 0);
      }
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  const handlePhoneChange = (value) => {
    update("phone", value);
    
    if (value.length >= 8) {
      checkPhoneNumber(countryCode + value);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleWhatsappChange = (value) => {
    update("whatsapp", value);
  };

  // Handle overlay click - requires double click to close
  const handleOverlayClick = () => {
    if (clickCount === 0) {
      // First click - start timer, NO notification yet
      setClickCount(1);

      // Set timer to reset after 800ms and show notification
      const timer = setTimeout(() => {
        // Timer expired - user didn't click twice, show guide notification
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCount(0);
      }, 800);
      setClickTimer(timer);
    } else if (clickCount === 1) {
      // Second click within time window - close popup, NO notification
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      setClickCount(0);
      onCancel();
    }
  };

  // Reset ESC and click counters when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEscPressCount(0);
      setClickCount(0);
      if (escPressTimer) clearTimeout(escPressTimer);
      if (clickTimer) clearTimeout(clickTimer);
    }
  }, [isOpen]);

  // Handle Escape key: 2 ESC = Reset form, 3 ESC = Close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        if (escPressCount === 0) {
          // First ESC press - start timer
          setEscPressCount(1);

          // Set timer to reset after 800ms
          const timer = setTimeout(() => {
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          // Second ESC press - Clear/Reset form fields
          clearTimeout(escPressTimer);
          setEscPressCount(2);

          // Reset all form fields
          setForm({
            customerName: "",
            companyName: "",
            phone: "",
            whatsapp: "",
            sameAsPhone: false,
            address: "",
            leadType: initialType,
            customerStatus: "",
            installDate: "",
            projectType: "",
            installedBy: "",
            installedByEngineer: "",
            engineerMobileNo: "",
            remarks: "",
          });
          setErrors({});
          showNotification('success', 'Form cleared! Press ESC once more to close', 2000);

          // Set timer for third ESC
          const timer = setTimeout(() => {
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 2) {
          // Third ESC press - Close popup
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          onCancel();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      // Clear timer on cleanup
      if (escPressTimer) {
        clearTimeout(escPressTimer);
      }
    };
  }, [isOpen, onCancel, escPressCount, escPressTimer, showNotification]);

  function validate() {
    const e = {};
    if (!form.customerName.trim()) e.customerName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (form.phone && !/^\+?[0-9\s-]{7,15}$/.test(form.phone)) e.phone = "Invalid";
    if (form.whatsapp && !/^\+?[0-9\s-]{7,15}$/.test(form.whatsapp)) e.whatsapp = "Invalid";

    if (!form.leadType) e.leadType = "Select one";
    if (form.leadType === "Customer" && !form.customerStatus) e.customerStatus = "Select one";
    if (form.leadType === "Customer" && form.customerStatus === "Existing" && !form.installDate) e.installDate = "Required";

    // Project type is not required for dealers, distributors, and billing customers
    const isBillingCustomer = form.leadType === "Customer" && form.customerStatus === "Billing";
    if (!form.projectType && !isDealer && !isDistributor && !isBillingCustomer) e.projectType = "Select a project";
    if (form.leadType === "Customer" && form.customerStatus === "Existing" && !form.installedBy) e.installedBy = "Select who installed";

    // Engineer fields are required only if "Our Company" is selected
    if (form.leadType === "Customer" && form.customerStatus === "Existing" && form.installedBy === "Our Company") {
      if (!form.installedByEngineer.trim()) e.installedByEngineer = "Engineer name is required";
      if (!form.engineerMobileNo.trim()) e.engineerMobileNo = "Engineer mobile number is required";
    }

    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    
    if (Object.keys(v).length === 0) {
      setLoading(true);
      
      try {
        // Prepare form data based on type
        const dataToSubmit = {
          name: form.customerName,
          phoneNumber: countryCode + form.phone,
          firmName: form.companyName,
          whatsappNumber: whatsappCountryCode + form.whatsapp,
          address: form.address,
        };

        // Add branch if admin and branch is selected
        if (user.role === 'admin' && selectedBranch) {
          dataToSubmit.branch = selectedBranch;
        }

        if (form.leadType === 'Lead') {
          // Lead creation
          dataToSubmit.projectType = form.projectType; // Store inquiry project type
          if (form.remarks) {
            dataToSubmit.initialRemark = {
              text: form.remarks,
              status: 'neutral'
            };
            dataToSubmit.status = 'neutral';
          }

          const response = await fetch(SummaryApi.createLead.url, {
            method: SummaryApi.createLead.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSubmit)
          });
          
          const data = await response.json();
          
          if (data.success) {
            setSubmitted(true);
            setTimeout(() => {
              if (onSuccess) onSuccess(data.data);
            }, 1500);
          } else {
            setErrors({ submit: data.message || 'Failed to add lead' });
          }
        } else if (form.leadType === 'Dealer') {
          // Dealer creation
          if (form.remarks) {
            dataToSubmit.initialRemark = form.remarks;
          }

          const response = await fetch(SummaryApi.createDealer.url, {
            method: SummaryApi.createDealer.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSubmit)
          });
          
          const data = await response.json();
          
          if (data.success) {
            setSubmitted(true);
            setTimeout(() => {
              if (onSuccess) onSuccess(data.data);
            }, 1500);
          } else {
            setErrors({ submit: data.message || 'Failed to add dealer' });
          }
        } else if (form.leadType === 'Distributor') {
          // Distributor creation
          if (form.remarks) {
            dataToSubmit.initialRemark = form.remarks;
          }

          const response = await fetch(SummaryApi.createDistributor.url, {
            method: SummaryApi.createDistributor.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSubmit)
          });
          
          const data = await response.json();
          
          if (data.success) {
            setSubmitted(true);
            setTimeout(() => {
              if (onSuccess) onSuccess(data.data);
            }, 1500);
          } else {
            setErrors({ submit: data.message || 'Failed to add distributor' });
          }
        } else {
          // Customer creation
          dataToSubmit.projectType = form.projectType;
          dataToSubmit.initialRemark = form.remarks;
          dataToSubmit.customerStatus = form.customerStatus;
          
          if (form.customerStatus === "Existing") {
            dataToSubmit.isExistingCustomer = true;
            dataToSubmit.completionDate = form.installDate;
            dataToSubmit.installedBy = form.installedBy;
            dataToSubmit.installedByEngineer = form.installedByEngineer;
            dataToSubmit.engineerMobileNo = form.engineerMobileNo;
          }

          const response = await fetch(SummaryApi.createCustomer.url, {
            method: SummaryApi.createCustomer.method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSubmit)
          });
          
          const data = await response.json();
          
          if (data.success) {
            setSubmitted(true);

            if (form.customerStatus === "Existing" || form.customerStatus === "Billing") {
              setTimeout(() => {
                if (onSuccess) onSuccess(data.data);
              }, 1500);
            } else {
              setTimeout(() => {
                navigate('/work-orders');
              }, 1500);
            }
          } else {
            setErrors({ submit: data.message || 'Failed to add customer' });
          }
        }
      } catch (err) {
        setErrors({ submit: 'Server error. Please try again later.' });
        console.error('Error adding contact:', err);
      } finally {
        setLoading(false);
      }
    }
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: -6, height: 0 },
    show: { opacity: 1, y: 0, height: "auto" },
    exit: { opacity: 0, y: -6, height: 0 },
  };

  const isExisting = form.leadType === "Customer" && form.customerStatus === "Existing";
  const isLead = form.leadType === "Lead";
  const isNewCustomer = form.leadType === "Customer" && form.customerStatus === "New";
  const isBillingCustomer = form.leadType === "Customer" && form.customerStatus === "Billing";
  const isDealer = form.leadType === "Dealer";
  const isDistributor = form.leadType === "Distributor";
  const isInstalledByOurCompany = form.installedBy === "Our Company";
  
  // Dynamic color schemes
  const getColorScheme = () => {
    if (isLead) {
      return {
        bg: 'from-white to-white',
        borderTop: 'border-t-blue-500',
        borderAll: 'border-blue-600',
        inputBorder: 'border-blue-300',
        inputRing: 'focus:ring-blue-300 focus:border-blue-400',
        button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        accent: 'from-blue-50 to-blue-100',
        text: 'text-blue-900'
      };
    } else if (isNewCustomer) {
      return {
        bg: 'from-white to-white',
        borderTop: 'border-t-purple-500',
        borderAll: 'border-purple-500',
        inputBorder: 'border-purple-300',
        inputRing: 'focus:ring-purple-300 focus:border-purple-400',
        button: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        accent: 'from-purple-50 to-purple-100',
        text: 'text-purple-900'
      };
    } else if (isBillingCustomer) {
      return {
        bg: 'from-white to-white',
        borderTop: 'border-t-pink-500',
        borderAll: 'border-pink-500',
        inputBorder: 'border-pink-300',
        inputRing: 'focus:ring-pink-300 focus:border-pink-400',
        button: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
        accent: 'from-pink-50 to-pink-100',
        text: 'text-pink-900'
      };
    } else if (isExisting) {
      return {
        bg: 'from-white to-white',
        borderTop: 'border-t-indigo-500',
        borderAll: 'border-indigo-500',
        inputBorder: 'border-indigo-300',
        inputRing: 'focus:ring-indigo-300 focus:border-indigo-400',
        button: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
        accent: 'from-indigo-50 to-indigo-100',
        text: 'text-indigo-900'
      };
    } else if (isDealer) {
      return {
        bg: 'from-white to-white',
        borderTop: 'border-t-orange-500',
        borderAll: 'border-orange-500',
        inputBorder: 'border-orange-300',
        inputRing: 'focus:ring-orange-300 focus:border-orange-400',
        button: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
        accent: 'from-orange-50 to-orange-100',
        text: 'text-orange-900'
      };
    } else if (isDistributor) {
      return {
        bg: 'from-white to-white',
        borderTop: 'border-t-teal-500',
        borderAll: 'border-teal-500',
        inputBorder: 'border-teal-300',
        inputRing: 'focus:ring-teal-300 focus:border-teal-400',
        button: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
        accent: 'from-teal-50 to-teal-100',
        text: 'text-teal-900'
      };
    }
    return {
      bg: 'from-white to-white',
      borderTop: 'border-t-gray-400',
      borderAll: 'border-gray-400',
      inputBorder: 'border-gray-300',
      inputRing: 'focus:ring-blue-300 focus:border-blue-400',
      button: 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
      accent: 'from-gray-50 to-gray-100',
      text: 'text-gray-900'
    };
  };
  
  const colorScheme = getColorScheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 opacity-75"
          aria-hidden="true"
          onClick={handleOverlayClick}
        />
        
        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-xl mx-4 border border-gray-200 overflow-hidden border-t-4 ${colorScheme.borderTop} ${colorScheme.borderAll} `}>
          {/* Header */}
          <div className="flex justify-between items-center bg-gray-100 px-4 py-3 border-b border-gray-400">
            <h3 className="text-lg font-medium">Add New Customer/Lead</h3>
            <button 
              onClick={onCancel} 
              className="text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          {/* Form Content */}
          <div className="p-4">
            <form onSubmit={onSubmit}>
          {/* Show errors */}
          {errors.submit && (
            <div className="mb-2 p-1 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-700 rounded text-xs">
              {errors.submit}
            </div>
          )}

          {/* Basic Details */}
          <div className="mb-6">
            <SectionTitle title="Basic Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="Customer Name"
              placeholder="Enter full name"
              value={form.customerName}
              onChange={(v) => update("customerName", v)}
              error={errors.customerName}
              colorScheme={colorScheme}
              id="customerName"
              onKeyDown={(e) => handleKeyDown(e, 'companyName')}
            />
            <TextField
              label="Company Name"
              placeholder="Optional"
              value={form.companyName}
              onChange={(v) => update("companyName", v)}
              colorScheme={colorScheme}
              id="companyName"
              onKeyDown={(e) => handleKeyDown(e, 'phone')}
            />

            <div>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</span>
                <div className="flex">
                  <div className="relative phone-dropdown">
                    <button
                      type="button"
                      className={`flex items-center justify-between w-14 p-1 h-[36px] border border-r-0 rounded-l-lg bg-gradient-to-r ${colorScheme.accent} hover:opacity-80 transition-colors text-xs`}
                      onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}
                    >
                      <span className="text-sm">{countryCode}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    
                    {showPhoneDropdown && (
                      <div className="absolute z-10 mt-1 bg-white border rounded-xl shadow-lg w-48">
                        {countryCodes.map(country => (
                          <div 
                            key={country.code} 
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setCountryCode(country.code);
                              setShowPhoneDropdown(false);
                            }}
                          >
                            <span className="font-medium">{country.code}</span> - {country.country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    id="phone"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'whatsapp')}
                    placeholder="Phone number"
                    size="12"
                    className={`w-full rounded-r-lg border ${errors.phone ? "border-red-400" : (colorScheme.inputBorder || "border-gray-300")} focus:outline-none focus:ring-2 ${colorScheme.inputRing} transition p-1 text-gray-900 placeholder:text-gray-400 text-sm`}
                    required
                  />
                </div>
                {errors.phone && <span className="text-xs text-red-600 mt-1 inline-block">{errors.phone}</span>}
              </label>
              
              {/* Existing records alert */}
              {showSearchResults && (
                <div className="mt-2 p-2 border rounded-xl bg-yellow-50 text-sm">
                  <p className="font-medium text-yellow-800">Existing records found:</p>
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <div key={idx} className="flex justify-between items-center p-1 border-b">
                        <div>
                          <span className="font-medium">{result.name}</span> - {result.phoneNumber}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          result.type === 'lead' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp with checkbox */}
            <div>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</span>
                <div className="flex">
                  <div className="relative whatsapp-dropdown">
                    <button
                      type="button"
                      className={`flex items-center justify-between w-14 p-1 h-[36px] border border-r-0 rounded-l-lg bg-gradient-to-r ${colorScheme.accent} hover:opacity-80 transition-colors text-xs`}
                      onClick={() => setShowWhatsappDropdown(!showWhatsappDropdown)}
                    >
                      <span className="text-sm">{whatsappCountryCode}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    
                    {showWhatsappDropdown && (
                      <div className="absolute z-10 mt-1 bg-white border rounded-xl shadow-lg w-48">
                        {countryCodes.map(country => (
                          <div 
                            key={country.code} 
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setWhatsappCountryCode(country.code);
                              setShowWhatsappDropdown(false);
                            }}
                          >
                            <span className="font-medium">{country.code}</span> - {country.country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'address')}
                    placeholder="WhatsApp number"
                    size="12"
                    disabled={form.sameAsPhone}
                    className={`w-full rounded-r-lg border ${errors.whatsapp ? "border-red-400" : (colorScheme.inputBorder || "border-gray-300")} focus:outline-none focus:ring-2 ${colorScheme.inputRing} transition p-1 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 text-sm`}
                  />
                </div>
                {errors.whatsapp && <span className="text-xs text-red-600 mt-1 inline-block">{errors.whatsapp}</span>}
              </label>
              
              <div className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  id="sameAsPhone" 
                  className="mr-2 h-4 w-4 rounded border-gray-300"
                  checked={form.sameAsPhone}
                  onChange={(e) => update("sameAsPhone", e.target.checked)}
                />
                <label htmlFor="sameAsPhone" className="text-xs text-gray-500">Same as phone number</label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Address</span>
                <textarea
                  id="address"
                  className={`w-full rounded-lg border ${colorScheme.inputBorder || "border-gray-300"} focus:outline-none focus:ring-2 ${colorScheme.inputRing} transition p-1 text-gray-900 placeholder:text-gray-400 text-sm`}
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'branch')}
                  rows="1"
                ></textarea>
              </label>
            </div>
            
            {user.role === 'admin' && (
              <SelectField
                label="Branch"
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={[
                  { value: "", label: "Select Branch" },
                  ...branches.map(branch => ({ value: branch._id, label: branch.name }))
                ]}
                colorScheme={colorScheme}
                id="branch"
                onKeyDown={(e) => handleKeyDown(e, 'leadType')}
              />
            )}
            </div>
          </div>

          {/* Lead / Customer */}
          <div className="mt-8 mb-6">
            <SectionTitle title="Lead / Customer" subtle />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField
                label="Select Type"
                value={form.leadType}
                onChange={(v) => update("leadType", v)}
                options={[
                  { value: "", label: "Choose..." },
                  { value: "Lead", label: "Lead" },
                  { value: "Customer", label: "Customer" },
                  { value: "Dealer", label: "Dealer" },
                  { value: "Distributor", label: "Distributor" }
                ]}
                error={errors.leadType}
                colorScheme={colorScheme}
                id="leadType"
                onKeyDown={(e) => handleKeyDown(e, 'customerStatus')}
              />

              <AnimatePresence initial={false}>
                {form.leadType === "Customer" && (
                  <motion.div key="customerStatus" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }}>
                    <SelectField
                      label="Customer Status"
                      value={form.customerStatus}
                      onChange={(v) => update("customerStatus", v)}
                      options={[
                        { value: "", label: "Choose..." },
                        { value: "Billing", label: "Billing" },
                        { value: "Existing", label: "Existing" },
                        { value: "New", label: "New" }
                      ]}
                      error={errors.customerStatus}
                      colorScheme={colorScheme}
                      id="customerStatus"
                      onKeyDown={(e) => handleKeyDown(e, 'projectType')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Project Type / Inquire For - Only show for Leads and Customers (except Billing) */}
          {!isDealer && !isDistributor && !isBillingCustomer && (
            <div className="mt-8 mb-6">
              <SectionTitle title={isLead ? "Inquire For" : "Project Type"} subtle />
              <div className="w-full">
                <SelectField
                  label={isLead ? "Inquire For" : "Choose Service"}
                  value={form.projectType}
                  onChange={(v) => update("projectType", v)}
                  options={[{ value: "", label: "Choose..." }, ...services]}
                  error={errors.projectType}
                  colorScheme={colorScheme}
                  id="projectType"
                  onKeyDown={(e) => handleKeyDown(e, 'installedBy')}
                />
              </div>
            </div>
          )}

          {/* Installed By (only when Existing Customer) */}
          <AnimatePresence initial={false}>
            {isExisting && (
              <motion.div key="installedBy" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="mt-2 w-full">
                <SelectField
                  label="Installed By"
                  value={form.installedBy}
                  onChange={(v) => update("installedBy", v)}
                  options={installedByOptions}
                  error={errors.installedBy}
                  colorScheme={colorScheme}
                  id="installedBy"
                  onKeyDown={(e) => handleKeyDown(e, 'installDate')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Installation Date (only when Existing Customer) */}
          <AnimatePresence initial={false}>
            {isExisting && (
              <motion.div key="installDate" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="mt-2 w-full">
                <DateField
                  label="Installation Date"
                  value={form.installDate}
                  onChange={(v) => update("installDate", v)}
                  error={errors.installDate}
                  colorScheme={colorScheme}
                  id="installDate"
                  onKeyDown={(e) => handleKeyDown(e, 'installedByEngineer')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Installed by Engineer (only when Existing Customer AND Our Company) - with autocomplete */}
          <AnimatePresence initial={false}>
            {isExisting && isInstalledByOurCompany && (
              <motion.div key="installedByEngineer" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="mt-2 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Engineer Name with Autocomplete */}
                  <div className="relative">
                    <label className={`block text-xs font-medium mb-1 ${colorScheme.label}`}>
                      Installed by Engineer *
                    </label>
                    <input
                      type="text"
                      id="installedByEngineer"
                      value={form.installedByEngineer}
                      onChange={(e) => handleEngineerNameChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'engineerMobileNo')}
                      className={`w-full rounded-lg border ${errors.installedByEngineer ? 'border-red-500' : colorScheme.inputBorder || "border-gray-300"} focus:outline-none focus:ring-2 ${colorScheme.inputRing} transition p-1 text-gray-900 placeholder:text-gray-400 text-sm`}
                      placeholder="Search engineer name..."
                      autoComplete="off"
                    />
                    {errors.installedByEngineer && (
                      <p className="text-red-500 text-xs mt-1">{errors.installedByEngineer}</p>
                    )}

                    {/* Engineer Dropdown */}
                    {showEngineerDropdown && filteredTechnicians.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTechnicians.map((tech) => {
                          const displayPhone = tech.phoneNumber || tech.phone || tech.mobile || tech.mobileNumber || "N/A";
                          return (
                            <div
                              key={tech._id}
                              onClick={() => handleEngineerSelect(tech)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                            >
                              <p className="font-medium text-sm text-gray-900">
                                {tech.firstName} {tech.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{displayPhone}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Engineer Mobile Number (Auto-filled) */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${colorScheme.label}`}>
                      Engineer Mobile No *
                    </label>
                    <input
                      type="text"
                      id="engineerMobileNo"
                      value={form.engineerMobileNo}
                      onChange={(e) => update("engineerMobileNo", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'remarks')}
                      className={`w-full rounded-lg border ${errors.engineerMobileNo ? 'border-red-500' : colorScheme.inputBorder || "border-gray-300"} focus:outline-none focus:ring-2 ${colorScheme.inputRing} transition p-1 text-gray-900 placeholder:text-gray-400 text-sm`}
                      placeholder="Engineer mobile number"
                      autoComplete="off"
                    />
                    {errors.engineerMobileNo && (
                      <p className="text-red-500 text-xs mt-1">{errors.engineerMobileNo}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remarks */}
          <div className="mt-8 mb-6">
            <SectionTitle title="Remarks" subtle />
            <textarea
              id="remarks"
              className={`w-full rounded-lg border ${colorScheme.inputBorder || "border-gray-300"} focus:outline-none focus:ring-2 ${colorScheme.inputRing} transition p-1 text-gray-900 placeholder:text-gray-400 text-sm min-h-[60px]`}
              placeholder="Notes..."
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'submit')}
            />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-white text-gray-700 px-6 py-2 h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:text-white"
              style={{
                '--hover-from': isLead ? '#3b82f6' : isNewCustomer ? '#a855f7' : isBillingCustomer ? '#ec4899' : isExisting ? '#6366f1' : isDealer ? '#f97316' : isDistributor ? '#14b8a6' : '#3b82f6',
                '--hover-to': isLead ? '#1d4ed8' : isNewCustomer ? '#9333ea' : isBillingCustomer ? '#db2777' : isExisting ? '#4f46e5' : isDealer ? '#ea580c' : isDistributor ? '#0f766e' : '#1d4ed8'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = `linear-gradient(to right, var(--hover-from), var(--hover-to))`;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'white';
                }
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-xl bg-white text-gray-700 px-6 py-2 h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 "
            >
              Cancel
            </button>
          </div>
        </form>

            <AnimatePresence>
              {submitted && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  exit={{ y: 20, opacity: 0 }} 
                  transition={{ duration: 0.25 }} 
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 shadow-lg ring-1 ring-gray-200 px-4 py-3 rounded-xl"
                >
                  Form submitted successfully ✅
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtle }) {
  return (
    <div className="mb-3">
      <h2 className={`text-sm font-medium ${subtle ? "text-gray-500" : "text-gray-800"}`}>{title}</h2>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, error, colorScheme, id, onKeyDown }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
      <input
        type="text"
        size="20"
        id={id}
        className={`w-full rounded-lg border ${error ? "border-red-400" : (colorScheme?.inputBorder || "border-gray-300")} focus:outline-none focus:ring-2 ${colorScheme?.inputRing || 'focus:ring-blue-300 focus:border-blue-400'} transition p-1 text-gray-900 placeholder:text-gray-400 text-sm`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {error && <span className="text-xs text-red-600 mt-1 inline-block">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, error, colorScheme, id, onKeyDown }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
      <select
        id={id}
        className={`w-full rounded-lg border ${error ? "border-red-400" : (colorScheme?.inputBorder || "border-gray-300")} bg-gradient-to-r from-white to-gray-50 focus:outline-none focus:ring-2 ${colorScheme?.inputRing || 'focus:ring-blue-300 focus:border-blue-400'} transition p-1 text-gray-900 text-sm`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600 mt-1 inline-block">{error}</span>}
    </label>
  );
}

function DateField({ label, value, onChange, error, colorScheme, id, onKeyDown }) {
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      // Format date as YYYY-MM-DD for backend
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
      <div className="relative">
        <DatePicker
          id={id}
          selected={selectedDate}
          onChange={handleDateChange}
          onKeyDown={onKeyDown}
          dateFormat="dd/MM/yyyy"
          className={`w-full rounded-lg border ${error ? "border-red-400" : (colorScheme?.inputBorder || "border-gray-300")} bg-gradient-to-r from-white to-gray-50 focus:outline-none focus:ring-2 ${colorScheme?.inputRing || 'focus:ring-green-300 focus:border-green-400'} transition p-1 pr-8 text-gray-900 text-sm`}
          placeholderText="dd/mm/yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          maxDate={new Date()}
          autoComplete="off"
        />
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {error && <span className="text-xs text-red-600 mt-1 inline-block">{error}</span>}
    </label>
  );
}