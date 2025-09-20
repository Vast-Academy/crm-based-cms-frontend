import React, { useState } from 'react';
import { Home, List, Check, FileText, Calendar, User, Bell, Settings, Phone, MessageCircle, Eye, Package, ChevronDown, ArrowLeft, MoreVertical } from 'lucide-react';

const TaskManagerApp = () => {
  const [currentView, setCurrentView] = useState('home');

  // Home Screen Component
  const HomeScreen = () => (
    <div className="flex-1 px-4 py-2 overflow-y-auto">
      {/* Today's Schedule Card */}
      <div className="bg-white rounded-lg shadow-md p-3 mb-3">
        <div className="text-gray-600 text-xs mb-1">Today's Schedule</div>
        <div className="text-base font-bold text-gray-800 mb-3">September 19, 2025</div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Active Assignments */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-2">
            <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center mb-1">
              <FileText size={12} className="text-white" />
            </div>
            <div className="text-xs text-slate-600 mb-1">Active Assignments</div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl font-bold text-slate-800">0</div>
              <div className="text-xs text-slate-600">tasks</div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 cursor-pointer" onClick={() => setCurrentView('approvals')}>
            <div className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center mb-1">
              <Calendar size={12} className="text-white" />
            </div>
            <div className="text-xs text-orange-700 mb-1">Pending Approvals</div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl font-bold text-orange-800">4</div>
              <div className="text-xs text-orange-700">tasks</div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center mb-1">
              <Check size={12} className="text-white" />
            </div>
            <div className="text-xs text-green-700 mb-1">Completed</div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl font-bold text-green-800">5</div>
              <div className="text-xs text-green-700">tasks</div>
            </div>
          </div>

          {/* Inventory Items */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 cursor-pointer" onClick={() => setCurrentView('inventory')}>
            <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center mb-1">
              <div className="w-3 h-3 border-2 border-white rounded"></div>
            </div>
            <div className="text-xs text-slate-600 mb-1">Inventory Items</div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl font-bold text-slate-800">5</div>
              <div className="text-xs text-slate-600">units</div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Tasks Section */}
      <div className="bg-white rounded-lg shadow-md p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Your Tasks</h3>
          <div className="flex gap-1">
            <button className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200 hover:bg-orange-200">
              Return
            </button>
            <button 
              className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 hover:bg-slate-200"
              onClick={() => setCurrentView('inventory')}
            >
              View Inventory
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {/* CCTV Camera Task */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200 cursor-pointer" onClick={() => setCurrentView('active')}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">CCTV Camera</div>
              <div className="text-xs text-slate-700 bg-slate-200 inline-block px-2 py-0.5 rounded mt-0.5">
                New Installation
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                <User size={10} />
                <span>Harpreet Singh</span>
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending
            </div>
          </div>

          {/* Attendance System Task 1 */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">Attendance System</div>
              <div className="text-xs text-slate-700 bg-slate-200 inline-block px-2 py-0.5 rounded mt-0.5">
                New Installation
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                <User size={10} />
                <span>Angrej Singh</span>
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending
            </div>
          </div>

          {/* Attendance System Task 2 */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white rounded"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">Attendance System</div>
              <div className="text-xs text-slate-700 bg-slate-200 inline-block px-2 py-0.5 rounded mt-0.5">
                Repair
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                <User size={10} />
                <span>Harpreet Singh</span>
              </div>
            </div>
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium border border-red-200">
              Rejected
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // All Projects Screen Component
  const AllProjectsScreen = () => (
    <div className="flex-1 px-4 py-2 overflow-y-auto">
      {/* All Projects Card */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
            <List size={16} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">All Projects</div>
            <div className="text-sm text-slate-600">Overview of your assignments</div>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total Projects:</span>
            <span className="text-xl font-bold text-slate-800">15</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Assigned */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold text-slate-800">0</div>
            <div className="text-xs text-slate-600">Assigned</div>
          </div>

          {/* Approval */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center cursor-pointer" onClick={() => setCurrentView('approvals')}>
            <div className="text-2xl font-bold text-orange-800">4</div>
            <div className="text-xs text-orange-700">Approval</div>
          </div>

          {/* Paused */}
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold text-slate-800">0</div>
            <div className="text-xs text-slate-600">Paused</div>
          </div>

          {/* Completed */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold text-green-800">5</div>
            <div className="text-xs text-green-700">Completed</div>
          </div>
        </div>
      </div>

      {/* Active Assignments Section */}
      <div className="bg-white rounded-lg shadow-md p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Active Assignments</h3>

        {/* Assignment List */}
        <div className="space-y-2">
          {/* Attendance System */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">Attendance System</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250609-0004
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending-Approval
            </div>
          </div>

          {/* IT & Networking */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">IT & Networking ...</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250608-0004
              </div>
            </div>
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium border border-red-200">
              Rejected
            </div>
          </div>

          {/* Software & Website */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">Software & Websi...</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250608-0003
              </div>
            </div>
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium border border-red-200">
              Rejected
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Pending Approvals Screen Component
  const PendingApprovalsScreen = () => (
    <div className="flex-1 px-4 py-2 overflow-y-auto">
      {/* Pending Approvals Card */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-md p-4 mb-3 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-700 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">Pending Approvals</div>
            <div className="text-sm opacity-90">Projects awaiting approval</div>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-orange-300/30 rounded-lg p-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-90">Total Pending:</span>
            <span className="text-xl font-bold">4 projects</span>
          </div>
        </div>

        {/* Back to Home Button */}
        <button 
          className="w-full bg-orange-700 hover:bg-orange-800 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm"
          onClick={() => setCurrentView('home')}
        >
          <Home size={16} />
          Back to Home
        </button>
      </div>

      {/* Pending Approval Projects Section */}
      <div className="bg-white rounded-lg shadow-md p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Pending Approval Projects</h3>

        {/* Project List */}
        <div className="space-y-2">
          {/* Attendance System */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">Attendance System</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250609-0004
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending-Approval
            </div>
          </div>

          {/* CCTV Camera 1 */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">CCTV Camera</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250608-0002
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending-Approval
            </div>
          </div>

          {/* CCTV Camera 2 */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">CCTV Camera</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250527-0001
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending-Approval
            </div>
          </div>

          {/* CCTV Camera 3 */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-slate-200">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800">CCTV Camera</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Order ID: WO-20250423-0001
              </div>
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">
              Pending-Approval
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Active Project Screen Component
  const ActiveProjectScreen = () => (
    <div className="flex-1 px-4 py-2 overflow-y-auto">
      {/* Active Projects Card */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-md p-4 mb-3 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">Active Projects</div>
            <div className="text-sm opacity-90">Current assignment</div>
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-4">
          <div className="text-lg font-bold mb-1">CCTV Camera</div>
          <div className="text-sm opacity-90">Type: Repair</div>
        </div>

        {/* Generate Bill Button */}
        <button className="w-full bg-blue-700 hover:bg-blue-800 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm">
          <FileText size={16} />
          Generate Bill
        </button>
      </div>

      {/* Contact Cards */}
      <div className="space-y-3">
        {/* Harpreet Singh Contact */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Harpreet Singh</h3>
          <p className="text-xs text-gray-600 mb-3">happo gali sahmne khanbe nal baneya</p>
          
          <div className="flex gap-2">
            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium">
              <MessageCircle size={14} />
              Message
            </button>
            <button className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium">
              <Phone size={14} />
              Call
            </button>
          </div>
        </div>

        {/* Setup Technician */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <h3 className="text-sm font-bold text-purple-600 mb-1">Setup Technician</h3>
          <p className="text-sm text-gray-800 mb-1">Arveet Singh</p>
          <p className="text-xs text-gray-600 mb-3">Installation date: 18 May 2025, 08:57 pm</p>
          
          <button className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium">
            <Phone size={14} />
            Call Original Technician
          </button>
        </div>

        {/* Report History */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Report History</h3>
          <p className="text-xs text-gray-600 mb-3">Recent updates</p>
          
          {/* Status Update */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="w-1 h-full bg-blue-400 rounded-full mr-3 float-left mt-1"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">Technician</p>
                <p className="text-xs text-gray-600">Status changed to in-progress</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div>19 Sept 2025, 03:51 pm</div>
            </div>
          </div>
          
          <button className="w-full bg-slate-100 hover:bg-slate-200 text-blue-500 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-medium border border-slate-200">
            <Eye size={14} />
            View Complete History
          </button>
        </div>
      </div>
    </div>
  );

  // Inventory Screen Component
  const InventoryScreen = () => (
    <div className="flex-1 px-4 py-2 overflow-y-auto">
      {/* My Inventory Card */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg shadow-md p-4 mb-3 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">My Inventory</div>
            <div className="text-sm opacity-90">Manage your stock</div>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-teal-300/30 rounded-lg p-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-90">Total Units:</span>
            <span className="text-xl font-bold">5 items</span>
          </div>
        </div>

        {/* Return Items Button */}
        <button className="w-full bg-teal-700 hover:bg-teal-800 rounded-lg p-2 flex items-center justify-center gap-2 text-white font-medium text-sm">
          <ArrowLeft size={16} />
          Return Items
        </button>
      </div>

      {/* Inventory Items Section */}
      <div className="bg-white rounded-lg shadow-md p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Inventory Items</h3>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3">
          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Serialized
          </button>
          <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200">
            Generic
          </button>
          <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200">
            Services
          </button>
        </div>

        {/* Inventory List */}
        <div className="space-y-2">
          {/* IP Cameras */}
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-slate-800">IP Cameras</span>
                <ChevronDown size={12} className="text-slate-600" />
              </div>
              <div className="text-xs text-slate-600">Serialized</div>
            </div>
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
              1 Piece
            </div>
          </div>

          {/* TIANDY 2MP 2.8MM DOME */}
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-slate-800">TIANDY 2MP 2.8MM DOME</span>
                <ChevronDown size={12} className="text-slate-600" />
              </div>
              <div className="text-xs text-slate-600">Serialized</div>
            </div>
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
              1 Piece
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen />;
      case 'all':
        return <AllProjectsScreen />;
      case 'approvals':
        return <PendingApprovalsScreen />;
      case 'active':
        return <ActiveProjectScreen />;
      case 'inventory':
        return <InventoryScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const getInventoryCount = () => {
    return currentView === 'inventory' ? '5' : '0';
  };

  return (
    <div className="max-w-sm mx-auto bg-white h-screen flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="bg-slate-800 text-white px-4 py-2 text-sm flex justify-between items-center">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <div className="w-1 h-1 bg-white rounded-full"></div>
          <span className="ml-2 text-xs">Airtel</span>
        </div>
        <div className="text-xs font-medium">9:41 AM</div>
        <div className="flex items-center gap-1">
          <div className="text-xs">100%</div>
          <div className="w-6 h-3 border border-white rounded-sm">
            <div className="w-full h-full bg-white rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-3 rounded-b-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                alt="Arveet Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs text-slate-300">Welcome back,</div>
              <div className="text-sm font-semibold">Arveet</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600">
              <Bell size={14} />
            </button>
            <button className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-600">
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderCurrentView()}

      {/* Bottom Navigation */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <button 
            className={`flex flex-col items-center gap-0.5 ${currentView === 'home' ? 'text-white' : 'text-slate-400'}`}
            onClick={() => setCurrentView('home')}
          >
            <div className={`w-8 h-8 ${currentView === 'home' ? 'bg-slate-700' : ''} rounded-lg flex items-center justify-center`}>
              <Home size={16} className={currentView === 'home' ? 'text-white' : 'text-slate-400'} />
            </div>
            <span className={`text-xs ${currentView === 'home' ? 'font-medium' : ''}`}>Home</span>
          </button>
          
          <button 
            className={`flex flex-col items-center gap-0.5 ${currentView === 'inventory' ? 'text-white' : 'text-slate-400'}`}
            onClick={() => setCurrentView('inventory')}
          >
            <div className={`w-8 h-8 ${currentView === 'inventory' ? 'bg-teal-500' : ''} rounded-lg flex items-center justify-center`}>
              <span className={`text-sm font-bold ${currentView === 'inventory' ? 'text-white' : 'text-slate-400'}`}>{getInventoryCount()}</span>
            </div>
            <span className={`text-xs ${currentView === 'inventory' ? 'font-medium' : ''}`}>{getInventoryCount()}</span>
          </button>
          
          <button 
            className={`flex flex-col items-center gap-0.5 ${currentView === 'all' ? 'text-white' : 'text-slate-400'}`}
            onClick={() => setCurrentView('all')}
          >
            <div className={`w-8 h-8 ${currentView === 'all' ? 'bg-orange-500' : ''} rounded-lg flex items-center justify-center`}>
              <List size={16} className={currentView === 'all' ? 'text-white' : 'text-slate-400'} />
            </div>
            <span className={`text-xs ${currentView === 'all' ? 'font-medium' : ''}`}>All</span>
          </button>
          
          <button 
            className={`flex flex-col items-center gap-0.5 ${currentView === 'approvals' ? 'text-white' : 'text-slate-400'}`}
            onClick={() => setCurrentView('approvals')}
          >
            <div className={`w-8 h-8 ${currentView === 'approvals' ? 'bg-orange-500' : ''} rounded-lg flex items-center justify-center`}>
              <Check size={16} className={currentView === 'approvals' ? 'text-white' : 'text-slate-400'} />
            </div>
            <span className={`text-xs ${currentView === 'approvals' ? 'font-medium' : ''}`}>Approval</span>
          </button>
          
          <button 
            className={`flex flex-col items-center gap-0.5 ${currentView === 'active' ? 'text-white' : 'text-slate-400'}`}
            onClick={() => setCurrentView('active')}
          >
            <div className={`w-8 h-8 ${currentView === 'active' ? 'bg-blue-500' : ''} rounded-lg flex items-center justify-center`}>
              <Calendar size={16} className={currentView === 'active' ? 'text-white' : 'text-slate-400'} />
            </div>
            <span className={`text-xs ${currentView === 'active' ? 'font-medium' : ''}`}>Current</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskManagerApp;