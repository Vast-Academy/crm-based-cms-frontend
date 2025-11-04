import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiPackage, FiHash, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';

export default function ItemSelector({
  items,
  onAddToCart,
  customerType,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  colors,
  onRefreshItems,
  isRefreshing = false,
  onProceedToSummary,
  openAddStockModal
}) {
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items || []);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState({});
  const [quantities, setQuantities] = useState({});
  const [inputValues, setInputValues] = useState({}); // For temporary input values
  const [cartInputValues, setCartInputValues] = useState({}); // For cart input values

  // Serial number dropdown states
  const [matchingSerialNumbers, setMatchingSerialNumbers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  // Filter serial numbers as user types for dropdown
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      // Check if search term looks like a serial number (alphanumeric with 3+ chars)
      const isSerialSearch = /^[A-Za-z0-9]{3,}$/.test(searchQuery.trim());

      if (isSerialSearch) {
        // Get all already added serial numbers from cart
        const usedSerials = cart
          .filter(item => item.serialNumber)
          .map(item => item.serialNumber);

        // Get all matching serial numbers from serialized products
        const allSerialNumbers = [];
        items.forEach(product => {
          if (product.type === 'serialized-product' && product.stock && Array.isArray(product.stock)) {
            product.stock.forEach(stockItem => {
              if (stockItem.serialNumber &&
                  stockItem.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
                  !usedSerials.includes(stockItem.serialNumber)) {
                allSerialNumbers.push({
                  serialNumber: stockItem.serialNumber,
                  productId: product._id,
                  productName: product.name
                });
              }
            });
          }
        });

        setMatchingSerialNumbers(allSerialNumbers);
        setIsDropdownOpen(allSerialNumbers.length > 0);
        setHighlightedIndex(allSerialNumbers.length > 0 ? 0 : -1);
      } else {
        setMatchingSerialNumbers([]);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    } else {
      setMatchingSerialNumbers([]);
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  }, [searchQuery, items, cart]);

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
    const stock = getAvailableStock(item);

    // Check if item is out of stock
    if (stock === 0) {
      showNotification('error', 'This product is out of stock and cannot be added');
      return;
    }

    const quantity = quantities[item._id] === '' || !quantities[item._id] ? 1 : quantities[item._id];
    const serialNumber = selectedSerialNumbers[item._id] || null;

    if (item.type === 'serialized-product' && !serialNumber) {
      showNotification('error', 'Please select a serial number for this item');
      return;
    }

    onAddToCart(item, serialNumber, quantity);

    // Reset selections
    setQuantities(prev => ({ ...prev, [item._id]: 1 }));
    if (item.type === 'serialized-product') {
      setSelectedSerialNumbers(prev => ({ ...prev, [item._id]: '' }));
    }
  };

  const handleAddStock = (item) => {
    if (openAddStockModal) {
      openAddStockModal(item);
    } else {
      showNotification('info', 'Please add stock from Inventory Management page');
    }
  };

  const handleUpdateQuantity = (index, newQuantity, cartItem) => {
    if (newQuantity <= 0) {
      onRemoveItem(index);
      return;
    }

    // Get the original item from items list
    const originalItem = items.find(item => item._id === cartItem.itemId);
    if (!originalItem) {
      onUpdateQuantity(index, newQuantity);
      return;
    }

    // Check available stock for generic products
    if (originalItem.type === 'generic-product') {
      const availableStock = originalItem.stock?.reduce((total, stock) => total + stock.quantity, 0) || 0;

      if (newQuantity > availableStock) {
        showNotification('warning', `Only ${availableStock} items available in stock`);
        return;
      }
    }

    // Update quantity
    onUpdateQuantity(index, newQuantity);
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

  // Group cart items by product ID (for display purposes)
  const getGroupedCartItems = () => {
    if (!cart || cart.length === 0) return [];

    const grouped = {};

    cart.forEach((cartItem, index) => {
      const key = cartItem.itemId;

      if (!grouped[key]) {
        // Find the original product from items
        const product = items.find(p => p._id === key);

        grouped[key] = {
          itemId: key,
          itemName: cartItem.itemName,
          unitPrice: cartItem.unitPrice,
          item: cartItem.item,
          type: product?.type || (cartItem.serialNumber ? 'serialized-product' : 'generic-product'),
          serialNumbers: [],
          genericEntries: [],
          totalPrice: 0,
          totalQuantity: 0
        };
      }

      if (cartItem.serialNumber) {
        // Serialized product
        grouped[key].serialNumbers.push({
          serialNumber: cartItem.serialNumber,
          cartIndex: index,
          price: cartItem.totalPrice
        });
      } else {
        // Generic product
        grouped[key].genericEntries.push({
          cartIndex: index,
          quantity: cartItem.quantity,
          price: cartItem.totalPrice
        });
        grouped[key].totalQuantity += cartItem.quantity;
      }

      grouped[key].totalPrice += cartItem.totalPrice;
    });

    return Object.values(grouped);
  };

  // Handle keyboard navigation for serial number dropdown
  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < matchingSerialNumbers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < matchingSerialNumbers.length) {
          const selected = matchingSerialNumbers[highlightedIndex];
          handleSelectSerialNumber(selected);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        break;
      default:
        break;
    }
  };

  // Handle select serial number from dropdown
  const handleSelectSerialNumber = (serialData) => {
    // Find the product
    const product = items.find(p => p._id === serialData.productId);

    if (product) {
      // Add to cart with this serial number
      const unitPrice = getCustomerPrice(product);
      onAddToCart(product, serialData.serialNumber, 1);

      setSearchQuery(''); // Clear search input
      setIsDropdownOpen(false); // Close dropdown
      setHighlightedIndex(-1); // Reset highlighted index
    } else {
      showNotification('error', 'Product not found for this serial number');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[70vh]">
      {/* Left side - Product list */}
      <div className="w-full md:w-2/3 flex flex-col border-r ml-6">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by item name or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-3 border rounded pl-10"
              />
              <FiSearch className="absolute left-3 top-[14px] text-gray-400" />

              {/* Serial Number Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-10 left-0 right-20 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {matchingSerialNumbers.map((item, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                        highlightedIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleSelectSerialNumber(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="font-medium text-gray-800">{item.serialNumber}</div>
                      <div className="text-xs text-gray-500">{item.productName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {onRefreshItems && (
              <button
                onClick={handleRefreshItems}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex-shrink-0"
                title="Refresh Products"
                disabled={isRefreshing}
              >
                <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-medium mb-2">Available Products</h3>
          <div className="grid grid-cols-1 gap-2">
            {filteredItems?.map((item) => {
              const price = getCustomerPrice(item);
              const stock = getAvailableStock(item);
              const availableSerials = getAvailableSerialNumbers(item);
              const selectedSerial = selectedSerialNumbers[item._id];
              const quantity = quantities[item._id] || 1;

              return (
                <div
                  key={item._id}
                  className="border p-3 rounded hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Type: {item.type.replace('-', ' ')} | Available: {stock}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ₹{price}
                      </div>
                    </div>
                  </div>

                  {/* For serialized products, show dropdown and buttons */}
                  {item.type === 'serialized-product' && (
                    <div className="mt-3 space-y-2">
                      {stock > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Choose Serial Number
                          </label>
                          <select
                            value={selectedSerial || ''}
                            onChange={(e) => handleSerialNumberChange(item._id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                          >
                            <option value="">Select serial number...</option>
                            {availableSerials.map(serial => (
                              <option key={serial} value={serial}>{serial}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddStock(item)}
                          className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
                        >
                          Add Stock
                        </button>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={stock === 0 || !selectedSerial}
                          className={`flex-1 py-2 px-4 ${colors.button} hover:opacity-90 disabled:bg-gray-300 text-white rounded font-medium`}
                        >
                          Add
                        </button>
                      </div>
                      {stock === 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <FiAlertCircle size={12} />
                          <span>Out of stock - Add stock to continue</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* For generic products, show buttons */}
                  {item.type === 'generic-product' && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddStock(item)}
                          className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
                        >
                          Add Stock
                        </button>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={stock === 0}
                          className={`flex-1 py-2 px-4 ${colors.button} hover:opacity-90 disabled:bg-gray-300 text-white rounded font-medium`}
                        >
                          Add
                        </button>
                      </div>
                      {stock === 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <FiAlertCircle size={12} />
                          <span>Out of stock - Add stock to continue</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* For service items, show add button only */}
                  {item.type === 'service' && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`w-full py-2 px-4 ${colors.button} hover:opacity-90 text-white rounded font-medium`}
                      >
                        Add
                      </button>
                    </div>
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
      </div>

      {/* Right side - Selected items */}
      <div className="w-full md:w-1/3 flex flex-col" style={{ height: '70vh' }}>
        <div className="p-4 bg-gray-50 border-b flex-shrink-0">
          <h3 className="font-bold">Selected Items ({cart?.length || 0})</h3>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {(!cart || cart.length === 0) ? (
            <div className="text-center text-gray-500 py-8">
              No items selected. Search and select products.
            </div>
          ) : (
            getGroupedCartItems().map((groupedItem) => (
              <div key={groupedItem.itemId} className="mb-4 border-b pb-2">
                <div className="flex justify-between">
                  <div className="font-medium">{groupedItem.itemName}</div>
                  {/* Only show remove button for single entries */}
                  {(groupedItem.serialNumbers.length === 1 || groupedItem.genericEntries.length === 1) && (
                    <button
                      onClick={() => onRemoveItem(groupedItem.serialNumbers[0]?.cartIndex || groupedItem.genericEntries[0]?.cartIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  Type: {groupedItem.type === 'serialized-product' ? 'Serialized' : 'Generic'}
                </div>

                {/* Pricing Information - Show only relevant price based on customer type */}
                {groupedItem.item?.pricing && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className={`font-medium ${
                        customerType === 'customer' ? 'text-green-700' :
                        customerType === 'dealer' ? 'text-blue-700' :
                        'text-purple-700'
                      }`}>
                        ₹{
                          customerType === 'customer' ? (groupedItem.item.pricing.customerPrice || 0) :
                          customerType === 'dealer' ? (groupedItem.item.pricing.dealerPrice || 0) :
                          (groupedItem.item.pricing.distributorPrice || 0)
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* For serialized products, show serial numbers */}
                {groupedItem.type === 'serialized-product' && groupedItem.serialNumbers.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Serial Numbers:</div>
                    {groupedItem.serialNumbers.map((sn, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm mt-1"
                      >
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {sn.serialNumber}
                        </span>
                        <button
                          onClick={() => onRemoveItem(sn.cartIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* For generic products, show quantity controls */}
                {groupedItem.type === 'generic-product' && groupedItem.genericEntries.length > 0 && (
                  <div className="mt-2">
                    {groupedItem.genericEntries.map((entry, idx) => (
                      <div key={idx} className="flex items-center mt-1">
                        <button
                          onClick={() => handleUpdateQuantity(entry.cartIndex, entry.quantity - 1, cart[entry.cartIndex])}
                          className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-l flex items-center justify-center"
                        >
                          <FiMinus />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(e) => handleUpdateQuantity(entry.cartIndex, parseInt(e.target.value) || 0, cart[entry.cartIndex])}
                          className="w-12 h-8 text-center border-t border-b"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(entry.cartIndex, entry.quantity + 1, cart[entry.cartIndex])}
                          className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-r flex items-center justify-center"
                        >
                          <FiPlus />
                        </button>
                        <span className="ml-2 text-sm text-gray-500">
                          @ ₹{groupedItem.unitPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 font-semibold text-gray-900">
                  Total: ₹{groupedItem.totalPrice}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onProceedToSummary}
            disabled={!cart || cart.length === 0}
            className={`w-full py-2 rounded-md ${
              !cart || cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : `${colors.button} text-white`
            }`}
          >
            Review Bill ({cart?.length || 0})
          </button>
        </div>
      </div>
    </div>
  );
}
