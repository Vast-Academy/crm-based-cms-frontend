import React from 'react';
import { FiPackage } from 'react-icons/fi';

const TechnicianInventoryOverview = ({ inventory }) => {
  // Calculate total items across all inventory
  const totalItems = inventory.reduce((total, item) => {
    // Count serialized items
    const serializedCount = item.serializedItems?.length || 0;
    // Count generic items
    const genericCount = item.genericQuantity || 0;
    
    return total + serializedCount + genericCount;
  }, 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center mb-3">
        <FiPackage className="text-blue-500 mr-2 text-xl" />
        <h2 className="text-lg font-semibold">My Inventory</h2>
      </div>
      
      <div className="mb-3">
        <p className="text-lg">Total Items: <span className="font-bold">{totalItems}</span></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {inventory.map(item => (
          <div key={item._id || item.itemId} className="border p-3 rounded-md">
            <h3 className="font-medium">{item.itemName}</h3>
            <div className="flex justify-between text-sm mt-1">
              <span>Quantity:</span>
              <span className="font-semibold">
                {(item.serializedItems?.length || 0) + (item.genericQuantity || 0)} {item.unit || 'units'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {item.serializedItems?.length > 0 && (
                <div className="mt-1">
                  <span className="font-medium">Serial Numbers:</span> {item.serializedItems.length}
                </div>
              )}
              {item.genericQuantity > 0 && (
                <div className="mt-1">
                  <span className="font-medium">Generic:</span> {item.genericQuantity} {item.unit || 'units'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicianInventoryOverview;