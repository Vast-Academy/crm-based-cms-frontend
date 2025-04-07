import React from 'react';
import { FiPhone } from 'react-icons/fi';

const CustomerCallSection = ({ 
  customerPhone, 
  callStatus, 
  onCallCustomer, 
  technicianRemark, 
  onRemarkChange 
}) => {
  return (
    <div className="border-t pt-3 mt-3">
      <button 
        onClick={onCallCustomer}
        className="w-full bg-green-500 text-white py-2 rounded-md flex items-center justify-center mb-3"
      >
        <FiPhone className="mr-2" />
        Call Customer
      </button>
      
      {callStatus && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-sm">
          Call initiated at {callStatus.startTime.toLocaleTimeString()}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">Technician Remarks</label>
        <textarea 
          value={technicianRemark}
          onChange={(e) => onRemarkChange(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Add notes about customer availability or special instructions..."
          rows="3"
        />
      </div>
    </div>
  );
};

export default CustomerCallSection;