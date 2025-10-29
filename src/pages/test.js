import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

const ProductStockUI = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});

  // Sample data
  const product = {
    id: 9,
    name: 'TIANDY IP-2MP 2.8MM BULLET TC-C32JS',
    price: '₹2950',
    discountPrice: '₹2700',
    finalPrice: '₹2600',
    stock: '13 Piece'
  };

  const currentStock = {
    total: 13,
    serialNumbers: ['SN001234', 'SN001235', 'SN001236', 'SN001237']
  };

  const userStock = [
    {
      name: 'Rajesh Kumar',
      count: 5,
      serialNumbers: ['SN001234', 'SN001235', 'SN001236', 'SN001237', 'SN001238']
    },
    {
      name: 'Priya Sharma',
      count: 4,
      serialNumbers: ['SN001239', 'SN001240', 'SN001241', 'SN001242']
    },
    {
      name: 'Amit Patel',
      count: 4,
      serialNumbers: ['SN001243', 'SN001244', 'SN001245', 'SN001246']
    }
  ];

  const stockHistory = [
    {
      date: '2025-10-25',
      serialNumbers: ['SN001243', 'SN001244', 'SN001245'],
      remark: 'New shipment received from warehouse'
    },
    {
      date: '2025-10-20',
      serialNumbers: ['SN001239', 'SN001240', 'SN001241', 'SN001242'],
      remark: 'Restocking after customer orders'
    },
    {
      date: '2025-10-15',
      serialNumbers: ['SN001234', 'SN001235', 'SN001236'],
      remark: 'Initial stock addition'
    }
  ];

  const toggleUserExpand = (index) => {
    setExpandedUsers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleHistoryExpand = (index) => {
    setExpandedHistory(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Product Inventory</h1>
        
        {/* Product List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 items-center p-4 border-b border-gray-100">
            <div className="col-span-1 flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                {product.id}
              </div>
            </div>
            <div className="col-span-4 font-medium text-gray-700">
              {product.name}
            </div>
            <div className="col-span-2 text-center text-gray-500 line-through">
              {product.price}
            </div>
            <div className="col-span-2 text-center text-gray-600 font-medium">
              {product.discountPrice}
            </div>
            <div className="col-span-2 text-center text-green-600 font-semibold">
              {product.finalPrice}
            </div>
            <div className="col-span-1 text-center">
              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {product.stock}
              </span>
            </div>
          </div>

          <div className="p-4 flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
            <button className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
              Add Stock
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Stock Details - {product.name}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-6">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-6 py-3 font-medium transition-colors relative ${
                    activeTab === 'current'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Current Stock
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-3 font-medium transition-colors relative ${
                    activeTab === 'history'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Stock History
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'current' && (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Side - Current Stock */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Stock: {currentStock.total} Pieces</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3">Serial Numbers:</h4>
                        <div className="space-y-2">
                          {currentStock.serialNumbers.map((sn, idx) => (
                            <div key={idx} className="bg-white px-4 py-2 rounded border border-gray-200 text-gray-700 font-mono text-sm">
                              {sn}
                            </div>
                          ))}
                          <div className="text-center text-gray-500 text-sm mt-3">
                            +{currentStock.total - currentStock.serialNumbers.length} more items
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - User Stock Distribution */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Distribution by User</h3>
                      <div className="space-y-3">
                        {userStock.map((user, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div
                              onClick={() => toggleUserExpand(idx)}
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-semibold">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{user.name}</p>
                                  <p className="text-sm text-gray-500">{user.count} pieces</p>
                                </div>
                              </div>
                              {expandedUsers[idx] ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            {expandedUsers[idx] && (
                              <div className="px-4 pb-4 space-y-2">
                                {user.serialNumbers.map((sn, snIdx) => (
                                  <div key={snIdx} className="bg-white px-3 py-2 rounded border border-gray-200 text-gray-600 font-mono text-sm">
                                    {sn}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Addition History</h3>
                    <div className="space-y-3">
                      {stockHistory.map((entry, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div
                            onClick={() => toggleHistoryExpand(idx)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-gray-800">{entry.date}</span>
                                <span className="text-sm bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                                  +{entry.serialNumbers.length} items
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{entry.remark}</p>
                            </div>
                            {expandedHistory[idx] ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          {expandedHistory[idx] && (
                            <div className="px-4 pb-4">
                              <h4 className="font-medium text-gray-700 mb-2 text-sm">Serial Numbers Added:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {entry.serialNumbers.map((sn, snIdx) => (
                                  <div key={snIdx} className="bg-white px-3 py-2 rounded border border-gray-200 text-gray-600 font-mono text-sm">
                                    {sn}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStockUI;