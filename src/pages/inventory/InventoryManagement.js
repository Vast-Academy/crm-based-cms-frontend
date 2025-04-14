import React, { useState } from 'react';
import SerializedProductsList from './SerializedProductsList';
import GenericProductsList from './GenericProductsList';
import ServicesList from './ServicesList';
import AllInventoryItems from './AllInventoryItems';

const InventoryManagement = () => {
  // State to track which filter is currently selected
  const [activeFilter, setActiveFilter] = useState('all');

  // Function to handle filter button clicks
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Render the appropriate component based on activeFilter
  const renderContent = () => {
    switch (activeFilter) {
      case 'serialized':
        return <SerializedProductsList />;
      case 'generic':
        return <GenericProductsList />;
      case 'services':
        return <ServicesList />;
      default:
        return <AllInventoryItems />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Inventory Management</h1>
        <p className="text-gray-600">Manage all inventory items in one place</p>
      </div>

      {/* Filter buttons */}
      <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => handleFilterChange('all')}
          className={`py-4 px-1 ${
            activeFilter === 'all'
              ? 'border-b-2 border-teal-500 text-teal-600 font-medium'
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } transition-colors duration-200 ease-in-out`}>
          All
        </button>
        <button
          onClick={() => handleFilterChange('serialized')}
          className={`py-4 px-1 ${
            activeFilter === 'serialized'
              ? 'border-b-2 border-teal-500 text-teal-600 font-medium'
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } transition-colors duration-200 ease-in-out`}
        >
          Serialized
        </button>
        <button
          onClick={() => handleFilterChange('generic')}
          className={`py-4 px-1 ${
            activeFilter === 'generic'
              ? 'border-b-2 border-teal-500 text-teal-600 font-medium'
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } transition-colors duration-200 ease-in-out`}
        >
          Generic
        </button>
        <button
          onClick={() => handleFilterChange('services')}
          className={`py-4 px-1 ${
        activeFilter === 'services'
          ? 'border-b-2 border-teal-500 text-teal-600 font-medium'
          : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } transition-colors duration-200 ease-in-out`}
    >
          Services
        </button>
        </nav>
      </div>

      {/* Render the content based on selected filter */}
      {renderContent()}
    </div>
  );
};

export default InventoryManagement;