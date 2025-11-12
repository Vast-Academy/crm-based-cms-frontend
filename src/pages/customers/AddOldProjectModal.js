import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker-custom.css";
import SummaryApi from '../../common';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

// Ensure global modal registry exists
if (!window.__modalRegistry) {
  window.__modalRegistry = new Set();
}

// Project types for customers
const projectTypes = [
  'CCTV Camera',
  'Attendance System',
  'Safe and Locks',
  'Lift & Elevator Solutions',
  'Home/Office Automation',
  'IT & Networking Services',
  'Software & Website Development',
  'Custom'
];

const AddOldProjectModal = ({ isOpen, onClose, customerId, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectType, setProjectType] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [installedBy, setInstalledBy] = useState('');
  const [installedByEngineer, setInstalledByEngineer] = useState('');
  const [engineerMobileNo, setEngineerMobileNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const { showNotification } = useNotification();

  // Engineer autocomplete states
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [showEngineerDropdown, setShowEngineerDropdown] = useState(false);

  // Modal registry setup
  const modalId = useRef(Math.random().toString(36).substr(2, 9));
  const numericZIndex = useRef(60); // z-[60] - higher than parent modals (50)

  // Double ESC and double click states
  const [escPressCount, setEscPressCount] = useState(0);
  const [escPressTimer, setEscPressTimer] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  // Check if this modal is the topmost modal
  const isTopmostModal = () => {
    if (!window.__modalRegistry || window.__modalRegistry.size === 0) return true;

    let highestZIndex = 0;
    window.__modalRegistry.forEach(modal => {
      if (modal.zIndex > highestZIndex) {
        highestZIndex = modal.zIndex;
      }
    });

    return numericZIndex.current >= highestZIndex;
  };

  // Register/unregister modal in global registry
  useEffect(() => {
    if (isOpen) {
      window.__modalRegistry.add({
        id: modalId.current,
        zIndex: numericZIndex.current
      });
    } else {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    }

    return () => {
      window.__modalRegistry.forEach(modal => {
        if (modal.id === modalId.current) {
          window.__modalRegistry.delete(modal);
        }
      });
    };
  }, [isOpen]);

  // Reset ESC and click counters when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEscPressCount(0);
      setClickCount(0);
      if (escPressTimer) clearTimeout(escPressTimer);
      if (clickTimer) clearTimeout(clickTimer);
    }
  }, [isOpen]);

  // Fetch technicians when modal opens
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await fetch(SummaryApi.getTechnicianUsers.url, {
          method: SummaryApi.getTechnicianUsers.method,
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setTechnicians(data.data);
        }
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    if (isOpen) {
      fetchTechnicians();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setProjectType('');
      setCompletionDate('');
      setSelectedDate(null);
      setInstalledBy('');
      setInstalledByEngineer('');
      setEngineerMobileNo('');
      setRemarks('');
      setError(null);
      setFilteredTechnicians([]);
      setShowEngineerDropdown(false);
    }
  }, [isOpen]);

  // Double ESC handler
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen && isTopmostModal()) {
        if (escPressCount === 0) {
          setEscPressCount(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          onClose();
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
      if (escPressTimer) clearTimeout(escPressTimer);
    };
  }, [isOpen, onClose, escPressCount, escPressTimer, showNotification]);

  // Handle overlay click - requires double click to close
  const handleOverlayClick = () => {
    if (!isTopmostModal()) return;

    if (clickCount === 0) {
      setClickCount(1);
      const timer = setTimeout(() => {
        showNotification('info', 'To close the popup, click twice on the background', 3000);
        setClickCount(0);
      }, 800);
      setClickTimer(timer);
    } else if (clickCount === 1) {
      if (clickTimer) clearTimeout(clickTimer);
      setClickCount(0);
      onClose();
    }
  };

  // Handle engineer name input and search
  const handleEngineerNameChange = (value) => {
    setInstalledByEngineer(value);

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
      setEngineerMobileNo(''); // Clear mobile number if name is cleared
    }
  };

  // Handle engineer selection from dropdown
  const handleEngineerSelect = (technician) => {
    const phoneNumber = technician.phoneNumber || technician.phone || technician.mobile || technician.mobileNumber || "";
    const fullName = `${technician.firstName} ${technician.lastName}`;
    setInstalledByEngineer(fullName);
    setEngineerMobileNo(phoneNumber);
    setShowEngineerDropdown(false);
    setFilteredTechnicians([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!projectType) {
      setError('Please select a project type');
      return;
    }

    if (!completionDate) {
      setError('Please select a completion date');
      return;
    }

    if (!installedBy) {
      setError('Please select who installed');
      return;
    }

    // Validate engineer fields if "Our Company" is selected
    if (installedBy === 'Our Company') {
      if (!installedByEngineer.trim()) {
        setError('Please enter engineer name');
        return;
      }
      if (!engineerMobileNo.trim()) {
        setError('Please enter engineer mobile number');
        return;
      }
    }

    try {
      setLoading(true);

      const requestBody = {
        customerId,
        projectType,
        completionDate,
        installedBy,
        initialRemark: remarks
      };

      // Add engineer fields if "Our Company" is selected
      if (installedBy === 'Our Company') {
        requestBody.installedByEngineer = installedByEngineer;
        requestBody.engineerMobileNo = engineerMobileNo;
      }

      const response = await fetch(SummaryApi.addOldProject.url, {
        method: SummaryApi.addOldProject.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        if (onSuccess) onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to add old project');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error adding old project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-indigo-600">
            Add Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type*
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Project Type</option>
              {projectTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completion Date*
            </label>
            <div className="relative">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  if (date) {
                    const formattedDate = date.toISOString().split('T')[0];
                    setCompletionDate(formattedDate);
                  } else {
                    setCompletionDate('');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                className="w-full p-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholderText="dd/mm/yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                autoComplete="off"
                required
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installed By*
            </label>
            <select
              value={installedBy}
              onChange={(e) => {
                setInstalledBy(e.target.value);
                // Clear engineer fields when changing selection
                if (e.target.value !== 'Our Company') {
                  setInstalledByEngineer('');
                  setEngineerMobileNo('');
                  setShowEngineerDropdown(false);
                }
              }}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Choose...</option>
              <option value="Our Company">Our Company</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Engineer fields - Only show when "Our Company" is selected */}
          {installedBy === 'Our Company' && (
            <div className="mb-4 space-y-4">
              {/* Engineer Name with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installed by Engineer*
                </label>
                <input
                  type="text"
                  value={installedByEngineer}
                  onChange={(e) => handleEngineerNameChange(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search engineer name..."
                  autoComplete="off"
                />

                {/* Engineer Dropdown */}
                {showEngineerDropdown && filteredTechnicians.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredTechnicians.map((tech) => (
                      <div
                        key={tech._id}
                        onClick={() => handleEngineerSelect(tech)}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                      >
                        <div className="font-medium">{tech.firstName} {tech.lastName}</div>
                        {(tech.phoneNumber || tech.phone) && (
                          <div className="text-sm text-gray-500">
                            {tech.phoneNumber || tech.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Engineer Mobile Number (Auto-filled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engineer Mobile No*
                </label>
                <input
                  type="text"
                  value={engineerMobileNo}
                  onChange={(e) => setEngineerMobileNo(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Engineer mobile number"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="Enter any remarks about this project..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOldProjectModal;
