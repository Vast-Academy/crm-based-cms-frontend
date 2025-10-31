// In WorkOrderModal.js
import React, { useState, useEffect, useRef } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

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

const WorkOrderModal = ({ isOpen, onClose, customerId, initialProjectCategory = 'New Installation', onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [projectType, setProjectType] = useState('');
  const [projectCategory, setProjectCategory] = useState(initialProjectCategory);
  const [initialRemark, setInitialRemark] = useState('');
  const { showNotification } = useNotification();

  // States for existing project check and confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [existingProjects, setExistingProjects] = useState([]);
  const [checkingProjects, setCheckingProjects] = useState(false);

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

  // Update project category when initialProjectCategory changes
  useEffect(() => {
    setProjectCategory(initialProjectCategory);
  }, [initialProjectCategory]);

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
          // Handle confirmation popup or main modal
          if (showConfirmation) {
            handleConfirmCancel();
          } else {
            onClose();
          }
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
  }, [isOpen, onClose, escPressCount, escPressTimer, showNotification, showConfirmation]);

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
      // Handle confirmation popup or main modal
      if (showConfirmation) {
        handleConfirmCancel();
      } else {
        onClose();
      }
    }
  };

  // Check for existing active projects
  const checkExistingProjects = async () => {
    try {
      setCheckingProjects(true);
      
      // Get all work orders and filter for this customer's active projects
      const response = await fetch(SummaryApi.getWorkOrders.url, {
        method: SummaryApi.getWorkOrders.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter active projects for this specific customer only
        const activeProjects = data.data.filter(project =>
          project.customerId === customerId &&
          !['completed', 'rejected', 'job-closed', 'cancelled'].includes(project.status)
        );
        
        if (activeProjects.length > 0) {
          setExistingProjects(activeProjects);
          setShowConfirmation(true);
          return false; // Don't proceed with creation
        }
      }
      
      return true; // No active projects found, can proceed
    } catch (err) {
      console.error('Error checking existing projects:', err);
      // If check fails, allow creation to proceed
      return true;
    } finally {
      setCheckingProjects(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!projectType) {
      setError('Please select a project type');
      return;
    }
    
    // Check for existing active projects first
    const canProceed = await checkExistingProjects();
    if (!canProceed) {
      return; // Show confirmation popup instead
    }
    
    await createWorkOrder();
  };

  // Create work order function
  const createWorkOrder = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(SummaryApi.createWorkOrder.url, {
        method: SummaryApi.createWorkOrder.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          projectType,
          projectCategory, // This is set automatically from initialProjectCategory
          initialRemark
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (onSuccess) onSuccess(data.data);
        onClose();
        
        // Reset states
        setShowConfirmation(false);
        setExistingProjects([]);

         // Use navigate instead of window.location
        navigate('/work-orders');
      } else {
        setError(data.message || 'Failed to create work order');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error creating work order:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmation - user wants to proceed despite existing projects
  const handleConfirmProceed = async () => {
    setShowConfirmation(false);
    await createWorkOrder();
  };

  // Handle confirmation - user cancels
  const handleConfirmCancel = () => {
    setShowConfirmation(false);
    setExistingProjects([]);
  };
  
  if (!isOpen) return null;

  // Confirmation popup for existing projects
  if (showConfirmation) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white rounded-lg w-full max-w-lg p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">
              Active Project Found!
            </h2>
            <button
              onClick={handleConfirmCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This customer already has active project(s). Are you sure you want to create a new work order?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Existing Active Projects:</h3>
              {existingProjects.map((project, index) => (
                <div key={project._id || index} className="text-sm text-yellow-700 mb-1">
                  • {project.projectType} - Status: {project.status}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleConfirmCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              No, Cancel
            </button>
            <button
              onClick={handleConfirmProceed}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Yes, Create New Work Order'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {projectCategory === 'Repair' ? 'Create Complaint' : 'Create Work Order'}
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
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          
          {/* Project Category is hidden and set automatically */}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Remarks
            </label>
            <textarea
              value={initialRemark}
              onChange={(e) => setInitialRemark(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder={projectCategory === 'Repair' ? "Enter details about the complaint..." : "Enter details about the project..."}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || checkingProjects}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {checkingProjects ? 'Checking...' : loading ? 'Creating...' : projectCategory === 'Repair' ? 'Create Complaint' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkOrderModal;