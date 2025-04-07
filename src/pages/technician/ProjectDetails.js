import React from 'react';
import { FiArrowLeft, FiPlay, FiUser, FiPhone, FiMapPin, FiCalendar, FiClipboard } from 'react-icons/fi';

const ProjectDetails = ({ assignment, onStartProject, onBack }) => {
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center mb-4">
        <button 
          onClick={onBack}
          className="text-blue-500 flex items-center hover:underline"
        >
          <FiArrowLeft className="mr-1" />
          Back to Assignments
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Project Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-3">Project Information</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <FiClipboard className="mr-2 text-gray-500" />
                <div>
                  <strong>Type:</strong> {assignment.projectType}
                </div>
              </div>
              
              <div className="flex items-center">
                <FiCalendar className="mr-2 text-gray-500" />
                <div>
                  <strong>Created:</strong> {formatDate(assignment.createdAt)}
                </div>
              </div>
              
              {assignment.projectId && (
                <div className="flex items-start">
                  <FiClipboard className="mr-2 text-gray-500 mt-1" />
                  <div>
                    <strong>Project ID:</strong> {assignment.projectId}
                  </div>
                </div>
              )}
              
              {assignment.instructions && (
                <div className="mt-3 border-t pt-2">
                  <h4 className="font-medium mb-1">Instructions:</h4>
                  <p className="text-gray-700">{assignment.instructions}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-3">Customer Information</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <FiUser className="mr-2 text-gray-500" />
                <div>
                  <strong>Name:</strong> {assignment.customerName}
                </div>
              </div>
              
              <div className="flex items-center">
                <FiPhone className="mr-2 text-gray-500" />
                <div>
                  <strong>Phone:</strong> {assignment.customerPhone}
                </div>
              </div>
              
              {assignment.customerEmail && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 text-gray-500 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <div>
                    <strong>Email:</strong> {assignment.customerEmail}
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <FiMapPin className="mr-2 text-gray-500 mt-1" />
                <div>
                  <strong>Address:</strong> {assignment.customerAddress}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-4">
        <button 
          onClick={() => onStartProject(assignment)}
          className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
        >
          <FiPlay className="mr-2" />
          Start Project
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails;