import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import SummaryApi from '../../common';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectType, setProjectType] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [installedBy, setInstalledBy] = useState('');
  const [remarks, setRemarks] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setProjectType('');
      setCompletionDate('');
      setInstalledBy('');
      setRemarks('');
      setError(null);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

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

    try {
      setLoading(true);

      const response = await fetch(SummaryApi.addOldProject.url, {
        method: SummaryApi.addOldProject.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          projectType,
          completionDate,
          installedBy,
          initialRemark: remarks
        })
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md p-6"
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
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Allow only past dates
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installed By*
            </label>
            <select
              value={installedBy}
              onChange={(e) => setInstalledBy(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Choose...</option>
              <option value="Our Company">Our Company</option>
              <option value="Others">Others</option>
            </select>
          </div>

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
