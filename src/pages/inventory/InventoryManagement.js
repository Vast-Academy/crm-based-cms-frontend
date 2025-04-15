import React, { useState } from 'react';
import SerializedProductsList from './SerializedProductsList';
import GenericProductsList from './GenericProductsList';
import ServicesList from './ServicesList';
import AllInventoryItems from './AllInventoryItems';
import { FiSearch } from 'react-icons/fi';

const InventoryManagement = () => {
  // State to track which filter is currently selected
  const [activeFilter, setActiveFilter] = useState('all');
   const [searchTerm, setSearchTerm] = useState('');

  // Function to handle filter button clicks
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Render the appropriate component based on activeFilter
  const renderContent = () => {
    switch (activeFilter) {
      case 'serialized':
        return <SerializedProductsList searchTerm={searchTerm} />;
      case 'generic':
        return <GenericProductsList searchTerm={searchTerm} />;
      case 'services':
        return <ServicesList searchTerm={searchTerm} />;
      default:
        return <AllInventoryItems searchTerm={searchTerm} />;
    }
  };

  return (
    <div>
    {/* Main container card with shadow */}
    <div className="px-6 bg-white rounded-lg shadow-md overflow-hidden w-[1000px] max-w-[1500px]">
      {/* Header section with title and search */}
      <div className="py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Inventory</h1>
        
        {/* Filter and search row */}
        <div className="flex items-center justify-end mt-4">

          {/* Filter buttons */}
          <div className="flex space-x-2 mb-2 sm:mb-0">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === 'all'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('serialized')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === 'serialized'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Serialized
            </button>
            <button
              onClick={() => handleFilterChange('generic')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === 'generic'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Generic
            </button>
            <button
              onClick={() => handleFilterChange('services')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === 'services'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Services
            </button>
          </div>
          
        </div>

        {/* Search bar */}
        <div className="relative mt-4 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>
      
      {/* Content section */}
      <div className="p-0">
        {renderContent()}
      </div>
    </div>
  </div>
);
};

export default InventoryManagement;