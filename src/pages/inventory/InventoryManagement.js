import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SerializedProductsList from './SerializedProductsList';
import GenericProductsList from './GenericProductsList';
import ServicesList from './ServicesList';
import AllInventoryItems from './AllInventoryItems';
import UnifiedInventoryAssignmentModal from './UnifiedInventoryAssignmentModal';
import SelectTechnicianModal from '../technician/SelectTechnicianModal';
import { FiSearch, FiPackage, FiChevronDown, FiFilter } from 'react-icons/fi';
import { LuArrowUpDown, LuArrowDownUp } from 'react-icons/lu';
import { useNotification } from '../../context/NotificationContext';
import ExportInventoryButton from '../../components/ExportInventoryButton';

const InventoryManagement = () => {
  const [searchParams] = useSearchParams();
  const branch = searchParams.get('branch') || '';

  // State to track which filter is currently selected
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification } = useNotification();

  // Sorting states
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortField, setSortField] = useState('name');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Filter dropdown state
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  
  // States for modals
  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
  const [isAssignInventoryModalOpen, setIsAssignInventoryModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Function to handle filter button clicks
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setIsFilterDropdownOpen(false);
  };

  // Get display text for active filter
  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'all': return 'All';
      case 'serialized': return 'Serialized';
      case 'generic': return 'Generic';
      case 'services': return 'Services';
      default: return 'All';
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle sort option selection
  const handleSortSelection = (field) => {
    if (sortField === field) {
      // Toggle order if same field selected
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with asc order
      setSortField(field);
      setSortOrder('asc');
    }
    setIsSortDropdownOpen(false);
  };

  // Get display text for sort field
  const getSortFieldLabel = (field) => {
    switch (field) {
      case 'name': return 'Name';
      case 'customerPrice': return 'Customer Price';
      case 'dealerPrice': return 'Dealer Price';
      case 'distributorPrice': return 'Distributor Price';
      case 'stock': return 'Stock';
      default: return 'Name';
    }
  };

  // Open technician selection modal
  const openAssignInventoryFlow = () => {
    setIsTechnicianModalOpen(true);
  };

  // Handle technician selection
  const handleTechnicianSelect = (technician) => {
    setSelectedTechnician(technician);
    setIsAssignInventoryModalOpen(true);
  };

  // Handle inventory assignment success
  const handleAssignmentSuccess = () => {
    showNotification('success', `Inventory successfully assigned to ${selectedTechnician.firstName} ${selectedTechnician.lastName}`);
    setIsAssignInventoryModalOpen(false);
    setSelectedTechnician(null);
    setRefreshCount(prev => prev + 1);
  };

  // Render the appropriate component based on activeFilter
  const renderContent = () => {
    switch (activeFilter) {
      case 'serialized':
        return <SerializedProductsList searchTerm={searchTerm} refreshTrigger={refreshCount} branch={branch} sortField={sortField} sortOrder={sortOrder} />;
      case 'generic':
        return <GenericProductsList searchTerm={searchTerm} refreshTrigger={refreshCount} branch={branch} sortField={sortField} sortOrder={sortOrder} />;
      case 'services':
        return <ServicesList searchTerm={searchTerm} refreshTrigger={refreshCount} branch={branch} />;
      default:
        return <AllInventoryItems searchTerm={searchTerm} refreshTrigger={refreshCount} branch={branch} sortField={sortField} sortOrder={sortOrder} />;
    }
  };

  return (
    <div>
      {/* Main container card with shadow */}
      <div className="px-6 bg-white rounded-lg shadow-md max-w-[1300px]">
        {/* Header section with title and search - Made sticky */}
        <div className="sticky top-[-18px] z-50 bg-white py-6 border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-2xl font-semibold text-gray-800">Inventory</h1>

          </div>

          {/* Filter and search row */}
          <div className="flex items-center justify-between mt-4">
             {/* Action Buttons */}
             <div className="flex items-center gap-2">
               <button
                onClick={openAssignInventoryFlow}
                className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 flex items-center"
              >
                <FiPackage className="mr-2" />
                Assign Inventory
              </button>

              {/* Export Inventory Button */}
              <ExportInventoryButton />
             </div>

            {/* Filter and Sort dropdowns */}
            <div className="flex space-x-2 mb-2 sm:mb-0 items-center">
              {/* Filter Dropdown */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <FiFilter className="h-4 w-4 mr-2" />
                  Filter: {getFilterLabel(activeFilter)}
                  <FiChevronDown className="ml-2 h-4 w-4" />
                </button>

                {/* Filter Dropdown Menu */}
                {isFilterDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={() => handleFilterChange('all')}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          activeFilter === 'all' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>All</span>
                        {activeFilter === 'all' && (
                          <span className="text-teal-600">✓</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleFilterChange('serialized')}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          activeFilter === 'serialized' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>Serialized</span>
                        {activeFilter === 'serialized' && (
                          <span className="text-teal-600">✓</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleFilterChange('generic')}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          activeFilter === 'generic' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>Generic</span>
                        {activeFilter === 'generic' && (
                          <span className="text-teal-600">✓</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleFilterChange('services')}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          activeFilter === 'services' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>Services</span>
                        {activeFilter === 'services' && (
                          <span className="text-teal-600">✓</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Dropdown - Only show for non-service filters */}
              {activeFilter !== 'services' && (
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    {sortOrder === 'asc' ? (
                      <LuArrowDownUp className="h-4 w-4 mr-2" />
                    ) : (
                      <LuArrowUpDown className="h-4 w-4 mr-2" />
                    )}
                    Sort
                    <FiChevronDown className="ml-2 h-4 w-4" />
                  </button>

                  {/* Sort Dropdown Menu */}
                  {isSortDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={() => handleSortSelection('name')}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                            sortField === 'name' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>Name</span>
                          {sortField === 'name' && (
                            sortOrder === 'asc' ? (
                              <LuArrowDownUp className="h-4 w-4" />
                            ) : (
                              <LuArrowUpDown className="h-4 w-4" />
                            )
                          )}
                        </button>
                        <button
                          onClick={() => handleSortSelection('customerPrice')}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                            sortField === 'customerPrice' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>Customer Price</span>
                          {sortField === 'customerPrice' && (
                            sortOrder === 'asc' ? (
                              <LuArrowDownUp className="h-4 w-4" />
                            ) : (
                              <LuArrowUpDown className="h-4 w-4" />
                            )
                          )}
                        </button>
                        <button
                          onClick={() => handleSortSelection('dealerPrice')}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                            sortField === 'dealerPrice' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>Dealer Price</span>
                          {sortField === 'dealerPrice' && (
                            sortOrder === 'asc' ? (
                              <LuArrowDownUp className="h-4 w-4" />
                            ) : (
                              <LuArrowUpDown className="h-4 w-4" />
                            )
                          )}
                        </button>
                        <button
                          onClick={() => handleSortSelection('distributorPrice')}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                            sortField === 'distributorPrice' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>Distributor Price</span>
                          {sortField === 'distributorPrice' && (
                            sortOrder === 'asc' ? (
                              <LuArrowDownUp className="h-4 w-4" />
                            ) : (
                              <LuArrowUpDown className="h-4 w-4" />
                            )
                          )}
                        </button>
                        <button
                          onClick={() => handleSortSelection('stock')}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                            sortField === 'stock' ? 'bg-gray-50 text-teal-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span>Stock</span>
                          {sortField === 'stock' && (
                            sortOrder === 'asc' ? (
                              <LuArrowDownUp className="h-4 w-4" />
                            ) : (
                              <LuArrowUpDown className="h-4 w-4" />
                            )
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

      {/* Select Technician Modal */}
      <SelectTechnicianModal
        isOpen={isTechnicianModalOpen}
        onClose={() => setIsTechnicianModalOpen(false)}
        onSelectTechnician={handleTechnicianSelect}
      />

      {/* Unified Inventory Assignment Modal */}
      {selectedTechnician && (
        <UnifiedInventoryAssignmentModal
          isOpen={isAssignInventoryModalOpen}
          onClose={() => setIsAssignInventoryModalOpen(false)}
          technician={selectedTechnician}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
};

export default InventoryManagement;
