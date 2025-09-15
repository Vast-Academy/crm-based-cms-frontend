import React, { useState } from 'react';
import { User, Settings, LogOut, Camera, ChevronDown } from 'lucide-react';

const ManagerProfileButton = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="flex justify-end p-4 bg-gray-100">
      <div className="relative">
        {/* Profile Button */}
        <button 
          onClick={toggleDropdown}
          className="flex items-center space-x-3 px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-200 rounded-lg border border-gray-300"
        >
          {/* Profile Picture with Online Status */}
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format"
              alt="Sandeep Singh"
              className="w-10 h-10 rounded-full object-cover"
            />
            {/* Online Status Dot */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
              <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Name and Role */}
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">
              Sandeep Singh
            </span>
            <span className="text-xs text-gray-800">
              Manager Panel
            </span>
          </div>

          {/* Dropdown Arrow */}
          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* Profile Info in Dropdown */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format"
                    alt="Sandeep Singh"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {/* Online Status Dot */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                    <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">Sandeep Singh</span>
                  <span className="text-sm text-gray-600">Manager</span>
                  <span className="text-xs text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="py-1">
              <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Camera className="w-4 h-4" />
                <span>Change Profile Picture</span>
              </button>
              
              <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Backdrop to close dropdown */}
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
};

export default ManagerProfileButton;