// pages/technician/components/ProductCheckout.jsx
import React, { useState } from 'react';
import { FiBarcode, FiPlus, FiMinus, FiSearch } from 'react-icons/fi';

const ProductCheckout = ({ 
  inventory, 
  selectedProducts, 
  onAddProduct, 
  onRemoveProduct, 
  total,
  onGenerateBill
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
  const handleSerialNumberScan = () => {
    if (!serialNumber.trim()) return;
    
    // Find the product with this serial number
    for (const item of inventory) {
      const serialItem = item.serializedItems?.find(si => 
        si.serialNumber === serialNumber.trim()
      );
      
      if (serialItem) {
        // Add to selected products
        onAddProduct(item, serialNumber.trim());
        setSerialNumber('');
        return;
      }
    }
    
    // Serial number not found
    alert('Serial number not found in your inventory');
  };
  
  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      {/* Serial number scanning */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Scan Serial Number</label>
        <div className="flex">
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSerialNumberScan()}
            className="flex-1 p-2 border rounded-l-md"
            placeholder="Enter or scan serial number"
          />
          <button
            onClick={handleSerialNumberScan}
            className="bg-blue-500 text-white px-3 rounded-r-md flex items-center"
          >
            <FiBarcode className="mr-1" />
            Scan
          </button>
        </div>
      </div>
      
      {/* Product search and selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Search Products</label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 border rounded-md"
            placeholder="Search product name..."
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      {/* Available Products */}
      <div className="mb-4 h-40 overflow-y-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avail.</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map(item => {
              const availableQuantity = 
                (item.serializedItems?.length || 0) + 
                (item.genericQuantity || 0);
                
              // Skip items with 0 quantity
              if (availableQuantity <= 0) return null;
              
              return (
                <tr key={item._id || item.itemId}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{item.itemName}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">{availableQuantity}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => onAddProduct(item)}
                      className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Selected Products</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedProducts.map(product => (
                  <tr key={product.itemId}>
                    <td className="px-3 py-2 text-sm">
                      <div>{product.itemName}</div>
                      {product.serialNumbers.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {product.serialNumbers.length} serial number(s)
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                      {product.serialNumbers.length > 0 ? (
                        product.serialNumbers.length
                      ) : (
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => onRemoveProduct(product.itemId)}
                            className="p-1 text-gray-500 hover:text-red-500"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="mx-2">{product.quantity}</span>
                          <button 
                            onClick={() => onAddProduct(product)}
                            className="p-1 text-gray-500 hover:text-green-500"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                      ₹{(product.price || 0) * product.quantity}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      <button
                        onClick={() => onRemoveProduct(product.itemId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan="2" className="px-3 py-2 text-sm font-medium">Total</td>
                  <td className="px-3 py-2 text-sm font-medium text-right">₹{total}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedProducts.length > 0 && (
        <div className="text-right">
          <button
            onClick={onGenerateBill}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Generate Bill
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCheckout;