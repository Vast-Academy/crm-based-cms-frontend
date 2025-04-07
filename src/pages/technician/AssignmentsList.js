import React from 'react';
import { FiMapPin, FiUser, FiPhone, FiEye, FiPlay } from 'react-icons/fi';

const AssignmentsList = ({ assignments, onViewDetails, onStartProject }) => {
  if (assignments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">No work assignments found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">My Work Assignments</h2>
      </div>
      
      <div className="divide-y">
        {assignments.map(assignment => (
          <div key={assignment._id || `${assignment.customerId}-${assignment.orderId}`} className="p-4">
            <div className="flex flex-col md:flex-row justify-between mb-3">
              <div>
                <h3 className="font-medium text-lg">{assignment.projectType || 'Project'}</h3>
                <div className="flex items-center text-gray-600 mt-1">
                  <FiUser className="mr-1" />
                  <span>{assignment.customerName}</span>
                </div>
                <div className="flex items-center text-gray-600 mt-1">
                  <FiPhone className="mr-1" />
                  <span>{assignment.customerPhone}</span>
                </div>
                <div className="flex items-start text-gray-600 mt-1">
                  <FiMapPin className="mr-1 mt-1 flex-shrink-0" />
                  <span>{assignment.customerAddress}</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                  assignment.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {assignment.status}
                </span>
                
                <div className="flex space-x-2 mt-2">
                  <button 
                    onClick={() => onViewDetails(assignment)}
                    className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <FiEye className="mr-1" />
                    View Details
                  </button>
                  
                  <button 
                    onClick={() => onStartProject(assignment)}
                    className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    <FiPlay className="mr-1" />
                    Start Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentsList;