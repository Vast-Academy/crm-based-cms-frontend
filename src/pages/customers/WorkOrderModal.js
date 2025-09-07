// In WorkOrderModal.js
import React, { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useNavigate } from 'react-router-dom';

// Project types for customers
const projectTypes = [
  'CCTV Camera',
  'Attendance System',
  'Safe and Locks',
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
  
  // States for existing project check and confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [existingProjects, setExistingProjects] = useState([]);
  const [checkingProjects, setCheckingProjects] = useState(false);
  
  // Update project category when initialProjectCategory changes
  useEffect(() => {
    setProjectCategory(initialProjectCategory);
  }, [initialProjectCategory]);
  
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
          !['completed', 'rejected'].includes(project.status)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg w-full max-w-lg p-6">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
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