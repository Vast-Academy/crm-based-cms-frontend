import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiPackage, FiHash, FiRefreshCw } from 'react-icons/fi';

export default function ItemSelector({ 
  items, 
  onAddToCart, 
  customerType, 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  colors,
  onRefreshItems,
  isRefreshing = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items || []);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState({});
  const [quantities, setQuantities] = useState({});
  const [inputValues, setInputValues] = useState({}); // For temporary input values
  const [cartInputValues, setCartInputValues] = useState({}); // For cart input values

  // Filter items based on search query
  useEffect(() => {
    if (!items || !Array.isArray(items)) {
      setFilteredItems([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const serialMatch = item.stock?.some(stock =>
        stock.serialNumber?.toLowerCase().includes(query)
      );
      return nameMatch || serialMatch;
    });

    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const getCustomerPrice = (item) => {
    if (item.pricing) {
      if (customerType === 'dealer') {
        return item.pricing.dealerPrice;
      } else if (customerType === 'distributor') {
        return item.pricing.distributorPrice;
      } else if (customerType === 'customer') {
        return item.pricing.customerPrice;
      }
    }
    return item.salePrice;
  };

  const getAvailableStock = (item) => {
    if (item.type === 'serialized-product') {
      return item.stock?.filter(stock => stock.serialNumber)?.length || 0;
    } else if (item.type === 'generic-product') {
      return item.stock?.reduce((total, stock) => total + stock.quantity, 0) || 0;
    }
    return 1; // Services are always available
  };

  const getAvailableSerialNumbers = (item) => {
    if (item.type !== 'serialized-product') return [];
    
    const usedSerials = (cart || [])
      .filter(cartItem => cartItem.itemId === item._id && cartItem.serialNumber)
      .map(cartItem => cartItem.serialNumber);
    
    return item.stock
      ?.filter(stock => stock.serialNumber && !usedSerials.includes(stock.serialNumber))
      ?.map(stock => stock.serialNumber) || [];
  };

  const handleSerialNumberChange = (itemId, serialNumber) => {
    setSelectedSerialNumbers(prev => ({
      ...prev,
      [itemId]: serialNumber
    }));
  };

  const handleQuantityChange = (itemId, quantity) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: quantity === '' ? '' : Math.max(1, quantity)
    }));

    // Sync input values when using buttons
    if (quantity !== '') {
      setInputValues(prev => ({
        ...prev,
        [itemId]: Math.max(1, quantity)
      }));
    }
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item._id] === '' || !quantities[item._id] ? 1 : quantities[item._id];
    const serialNumber = selectedSerialNumbers[item._id] || null;

    if (item.type === 'serialized-product' && !serialNumber) {
      alert('Please select a serial number for this item');
      return;
    }

    onAddToCart(item, serialNumber, quantity);

    // Reset selections
    setQuantities(prev => ({ ...prev, [item._id]: 1 }));
    if (item.type === 'serialized-product') {
      setSelectedSerialNumbers(prev => ({ ...prev, [item._id]: '' }));
    }
  };

  const isItemInCart = (item, serialNumber = null) => {
    return cart?.some(cartItem => 
      cartItem.itemId === item._id && 
      (cartItem.serialNumber === serialNumber || (!cartItem.serialNumber && !serialNumber))
    );
  };

  const getCartItemQuantity = (item, serialNumber = null) => {
    const cartItem = cart?.find(cartItem => 
      cartItem.itemId === item._id && 
      (cartItem.serialNumber === serialNumber || (!cartItem.serialNumber && !serialNumber))
    );
    return cartItem?.quantity || 0;
  };

  const handleRefreshItems = () => {
    if (!onRefreshItems || isRefreshing) return;
    onRefreshItems();
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by item name or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
              />
            </div>
          </div>
          {onRefreshItems && (
            <button
              type="button"
              onClick={handleRefreshItems}
              className={`p-2.5 rounded-lg transition-colors ${
                isRefreshing
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              aria-label="Refresh items"
              title="Refresh items"
              disabled={isRefreshing}
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Available Items */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiPackage className="mr-2" />
            Available Items ({filteredItems?.length || 0})
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredItems?.map((item) => {
              const price = getCustomerPrice(item);
              const stock = getAvailableStock(item);
              const availableSerials = getAvailableSerialNumbers(item);
              const selectedSerial = selectedSerialNumbers[item._id];
              const quantity = quantities[item._id] || 1;

              return (
                <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.name}</h5>
                      <p className="text-sm text-gray-600">Type: {item.type.replace('-', ' ')}</p>
                      <p className="text-lg font-semibold text-green-600">₹{price}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {stock}
                      </span>
                    </div>
                  </div>

                  {stock > 0 && (
                    <>
                      {/* Serial Number Selection for Serialized Products */}
                      {item.type === 'serialized-product' && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Serial Number
                          </label>
                          <select
                            value={selectedSerial || ''}
                            onChange={(e) => handleSerialNumberChange(item._id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                          >
                            <option value="">Choose serial number...</option>
                            {availableSerials.map(serial => (
                              <option key={serial} value={serial}>{serial}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity Selection for Generic Products */}
                      {item.type === 'generic-product' && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item._id, quantity - 1)}
                              disabled={quantity <= 1}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
                            >
                              <FiMinus size={16} />
                            </button>
                            <input
                              type="number"
                              value={inputValues[item._id] !== undefined ? inputValues[item._id] : quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                setInputValues(prev => ({
                                  ...prev,
                                  [item._id]: value
                                }));

                                if (value !== '' && !isNaN(parseInt(value))) {
                                  handleQuantityChange(item._id, Math.max(1, parseInt(value)));
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (value === '' || parseInt(value) < 1 || isNaN(parseInt(value))) {
                                  handleQuantityChange(item._id, 1);
                                  setInputValues(prev => ({
                                    ...prev,
                                    [item._id]: 1
                                  }));
                                } else {
                                  setInputValues(prev => ({
                                    ...prev,
                                    [item._id]: parseInt(value)
                                  }));
                                }
                              }}
                              onFocus={(e) => {
                                e.target.select(); // Select all text on focus for easy editing
                              }}
                              min="1"
                              max={stock}
                              className="w-16 text-center font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <button
                              onClick={() => handleQuantityChange(item._id, quantity + 1)}
                              disabled={quantity >= stock}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Available: {stock}</p>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={
                          (item.type === 'serialized-product' && !selectedSerial) ||
                          (item.type === 'serialized-product' && isItemInCart(item, selectedSerial))
                        }
                        className={`w-full py-2 px-4 rounded-lg font-medium ${colors.button} disabled:bg-gray-300 text-white`}
                      >
                        {item.type === 'serialized-product' && isItemInCart(item, selectedSerial)
                          ? 'Already in Cart'
                          : `Add to Cart - ₹${price * quantity}`
                        }
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            
            {(!filteredItems || filteredItems.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No items found matching your search' : 'No items available'}
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiHash className="mr-2" />
            Shopping Cart ({cart?.length || 0})
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 min-h-96">
            {(!cart || cart.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <FiPackage className="mx-auto mb-2" size={32} />
                <p>Your cart is empty</p>
                <p className="text-sm">Add items from the list to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart?.map((cartItem, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900">{cartItem.itemName}</h6>
                        {cartItem.serialNumber && (
                          <p className="text-xs text-gray-500">Serial: {cartItem.serialNumber}</p>
                        )}
                        <p className="text-sm text-gray-600">₹{cartItem.unitPrice} each</p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUpdateQuantity(index, cartItem.quantity - 1)}
                          disabled={cartItem.quantity <= 1 || !!cartItem.serialNumber}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
                        >
                          <FiMinus size={12} />
                        </button>
                        {!!cartItem.serialNumber ? (
                          <span className="w-12 text-center text-sm font-medium">{cartItem.quantity}</span>
                        ) : (
                          <input
                            type="number"
                            value={cartInputValues[index] !== undefined ? cartInputValues[index] : cartItem.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCartInputValues(prev => ({
                                ...prev,
                                [index]: value
                              }));

                              if (value !== '' && !isNaN(parseInt(value))) {
                                onUpdateQuantity(index, Math.max(1, parseInt(value)));
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value === '' || parseInt(value) < 1 || isNaN(parseInt(value))) {
                                onUpdateQuantity(index, 1);
                                setCartInputValues(prev => ({
                                  ...prev,
                                  [index]: 1
                                }));
                              } else {
                                setCartInputValues(prev => ({
                                  ...prev,
                                  [index]: parseInt(value)
                                }));
                              }
                            }}
                            onFocus={(e) => {
                              e.target.select(); // Select all text on focus for easy editing
                            }}
                            min="1"
                            className="w-12 text-center text-sm font-medium border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        )}
                        <button
                          onClick={() => onUpdateQuantity(index, cartItem.quantity + 1)}
                          disabled={!!cartItem.serialNumber}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{cartItem.totalPrice}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{cart?.reduce((sum, item) => sum + item.totalPrice, 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
