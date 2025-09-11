import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiPhone, FiMapPin, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import SummaryApi from '../../common';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DistributorDetailModal({ isOpen, onClose, distributorId, onDistributorUpdated }) {
  const { user } = useAuth();
  const [distributor, setDistributor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);

  // Fetch distributor details
  useEffect(() => {
    if (isOpen && distributorId) {
      fetchDistributorDetails();
    }
  }, [isOpen, distributorId]);

  const fetchDistributorDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SummaryApi.getDistributor.url}/${distributorId}`, {
        method: SummaryApi.getDistributor.method,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDistributor(data.data);
      } else {
        setError(data.message || 'Failed to fetch distributor details');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching distributor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    setAddingRemark(true);
    
    try {
      const response = await fetch(`${SummaryApi.addDistributorRemark.url}/${distributorId}`, {
        method: SummaryApi.addDistributorRemark.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newRemark.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDistributor(data.data);
        setNewRemark('');
        if (onDistributorUpdated) onDistributorUpdated(data.data);
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 opacity-75" 
          aria-hidden="true"
          onClick={onClose}
        />
        
        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform transition-all sm:my-12 sm:align-middle sm:w-full sm:max-w-4xl mx-4 border border-teal-200 overflow-hidden border-t-4 border-t-teal-500">
          {/* Header */}
          <div className="flex justify-between items-center bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <FiUser className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900">Distributor Details</h3>
                <p className="text-sm text-teal-700">View and manage distributor information</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-teal-500 hover:text-teal-700 focus:outline-none"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : distributor ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FiUser className="mr-2 text-teal-500" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-gray-900">{distributor.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                        <p className="text-gray-900">{distributor.firmName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-gray-900 flex items-center">
                          <FiPhone className="mr-2 text-teal-500" size={16} />
                          {distributor.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                        <p className="text-gray-900">{distributor.whatsappNumber || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-gray-900 flex items-start">
                          <FiMapPin className="mr-2 text-teal-500 mt-1" size={16} />
                          {distributor.address || 'Not provided'}
                        </p>
                      </div>
                      {distributor.branch && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                          <p className="text-gray-900">{distributor.branch.name}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                        <p className="text-gray-900 flex items-center">
                          <FiCalendar className="mr-2 text-teal-500" size={16} />
                          {formatDate(distributor.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Remark Section */}
                  <div className="bg-teal-50 rounded-lg p-4">
                    <h4 className="font-medium text-teal-900 mb-3 flex items-center">
                      <FiMessageSquare className="mr-2 text-teal-500" />
                      Add New Remark
                    </h4>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        placeholder="Enter remark..."
                        className="flex-1 rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition p-3 text-gray-900 placeholder:text-gray-400"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddRemark()}
                      />
                      <button
                        onClick={handleAddRemark}
                        disabled={addingRemark || !newRemark.trim()}
                        className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        {addingRemark ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Remarks History */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FiMessageSquare className="mr-2 text-teal-500" />
                      Remarks History
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {distributor.remarks && distributor.remarks.length > 0 ? (
                        distributor.remarks.map((remark, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-teal-100">
                            <p className="text-gray-900 text-sm mb-2">{remark.text}</p>
                            <div className="text-xs text-gray-500 flex justify-between items-center">
                              <span>By: {remark.createdBy?.firstName} {remark.createdBy?.lastName}</span>
                              <span>{formatDate(remark.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No remarks yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}