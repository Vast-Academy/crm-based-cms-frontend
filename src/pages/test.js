import { useState } from 'react';
import { Home, Briefcase, Users, Layers, PieChart, Package, Settings, Search } from 'lucide-react';

// Mock data
const mockData = {
  branches: [
    {
      id: 1,
      name: 'Amritsar',
      manager: { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '9876543210', active: true },
      technicians: [
        { id: 1, name: 'Amit Singh', email: 'amit@example.com', phone: '9876543211', tasksCompleted: 45, tasksInProgress: 5 },
        { id: 2, name: 'Sunita Verma', email: 'sunita@example.com', phone: '9876543212', tasksCompleted: 38, tasksInProgress: 7 },
        { id: 3, name: 'Prakash Joshi', email: 'prakash@example.com', phone: '9876543213', tasksCompleted: 42, tasksInProgress: 3 }
      ],
      customers: 85,
      completedProjects: 125,
      ongoingProjects: 15,
      inventory: 250
    },
    {
      id: 2,
      name: 'Himachal',
      manager: { id: 2, name: 'Meena Sharma', email: 'meena@example.com', phone: '9876543220', active: true },
      technicians: [
        { id: 4, name: 'Vikram Thakur', email: 'vikram@example.com', phone: '9876543221', tasksCompleted: 39, tasksInProgress: 6 },
        { id: 5, name: 'Neha Kapoor', email: 'neha@example.com', phone: '9876543222', tasksCompleted: 41, tasksInProgress: 4 },
        { id: 6, name: 'Ravi Kumar', email: 'ravi@example.com', phone: '9876543223', tasksCompleted: 33, tasksInProgress: 8 },
        { id: 7, name: 'Anjali Gupta', email: 'anjali@example.com', phone: '9876543224', tasksCompleted: 37, tasksInProgress: 5 }
      ],
      customers: 92,
      completedProjects: 138,
      ongoingProjects: 18,
      inventory: 320
    }
  ],
  inactiveManagers: [
    { id: 3, name: 'Vijay Malhotra', email: 'vijay@example.com', phone: '9876543225', active: false },
    { id: 4, name: 'Priya Patel', email: 'priya@example.com', phone: '9876543226', active: false }
  ]
};

// Combine active and inactive managers
const allManagers = [
  ...mockData.branches.map(branch => branch.manager),
  ...mockData.inactiveManagers
];

// Get all technicians from all branches
const allTechnicians = mockData.branches.flatMap(branch => 
  branch.technicians.map(tech => ({...tech, branchName: branch.name}))
);

export default function AdminPanel() {
  const [selectedView, setSelectedView] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const handleViewChange = (view) => {
    setSelectedView(view);
    setSelectedBranch(null);
    setSelectedManager(null);
    setSelectedTechnician(null);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setSelectedView('branch');
    setSelectedManager(null);
    setSelectedTechnician(null);
  };

  const handleManagerSelect = (manager) => {
    setSelectedManager(manager);
    setSelectedView('manager');
    setSelectedBranch(null);
    setSelectedTechnician(null);
  };

  const handleTechnicianSelect = (tech) => {
    setSelectedTechnician(tech);
    setSelectedView('technician');
    setSelectedBranch(null);
  };

  const renderContent = () => {
    switch (selectedView) {
      case 'dashboard':
        return <Dashboard branches={mockData.branches} />;
      case 'branches':
        return <BranchesView branches={mockData.branches} onBranchSelect={handleBranchSelect} />;
      case 'branch':
        return selectedBranch ? <BranchDetails branch={selectedBranch} /> : <div>Please select a branch</div>;
      case 'managers':
        return <ManagersView managers={allManagers} onManagerSelect={handleManagerSelect} />;
      case 'manager':
        return selectedManager ? <ManagerDetails manager={selectedManager} /> : <div>Please select a manager</div>;
      case 'technicians':
        return <TechniciansView technicians={allTechnicians} onTechnicianSelect={handleTechnicianSelect} />;
      case 'technician':
        return selectedTechnician ? <TechnicianDetails technician={selectedTechnician} /> : <div>Please select a technician</div>;
      default:
        return <Dashboard branches={mockData.branches} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          <button 
            onClick={() => handleViewChange('dashboard')} 
            className={`flex items-center px-4 py-3 w-full text-left ${selectedView === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            <Home size={20} className="mr-3" />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => handleViewChange('branches')} 
            className={`flex items-center px-4 py-3 w-full text-left ${selectedView === 'branches' || selectedView === 'branch' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            <Briefcase size={20} className="mr-3" />
            <span>Branches</span>
          </button>

          <button 
            onClick={() => handleViewChange('managers')} 
            className={`flex items-center px-4 py-3 w-full text-left ${selectedView === 'managers' || selectedView === 'manager' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            <Users size={20} className="mr-3" />
            <span>Managers</span>
          </button>

          <button 
            onClick={() => handleViewChange('technicians')} 
            className={`flex items-center px-4 py-3 w-full text-left ${selectedView === 'technicians' || selectedView === 'technician' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            <Layers size={20} className="mr-3" />
            <span>Technicians</span>
          </button>

          <button className="flex items-center px-4 py-3 w-full text-left hover:bg-gray-700">
            <PieChart size={20} className="mr-3" />
            <span>Reports</span>
          </button>
          
          <button className="flex items-center px-4 py-3 w-full text-left hover:bg-gray-700">
            <Package size={20} className="mr-3" />
            <span>Inventory</span>
          </button>
          
          <button className="flex items-center px-4 py-3 w-full text-left hover:bg-gray-700">
            <Settings size={20} className="mr-3" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <div className="flex items-center bg-gray-100 px-4 py-2 rounded-md w-64">
            <Search size={18} className="text-gray-500 mr-2" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full" />
          </div>
          <div className="flex items-center">
            <div className="mr-2 text-right">
              <div className="text-sm font-medium">Admin User</div>
              <div className="text-xs text-gray-500">admin@example.com</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Dashboard Component (Unchanged)
function Dashboard({ branches }) {
  const totalCustomers = branches.reduce((sum, branch) => sum + branch.customers, 0);
  const totalCompletedProjects = branches.reduce((sum, branch) => sum + branch.completedProjects, 0);
  const totalOngoingProjects = branches.reduce((sum, branch) => sum + branch.ongoingProjects, 0);
  const totalInventory = branches.reduce((sum, branch) => sum + branch.inventory, 0);
  const totalTechnicians = branches.reduce((sum, branch) => sum + branch.technicians.length, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Total Branches</h3>
          <p className="text-3xl font-bold">{branches.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Total Managers</h3>
          <p className="text-3xl font-bold">{branches.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Total Technicians</h3>
          <p className="text-3xl font-bold">{totalTechnicians}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Total Customers</h3>
          <p className="text-3xl font-bold">{totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Completed Projects</h3>
          <p className="text-3xl font-bold">{totalCompletedProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Ongoing Projects</h3>
          <p className="text-3xl font-bold">{totalOngoingProjects}</p>
        </div>
      </div>

      {/* Branch Comparison */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Branch Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Branch</th>
                <th className="py-2 px-4 text-left">Customers</th>
                <th className="py-2 px-4 text-left">Completed Projects</th>
                <th className="py-2 px-4 text-left">Ongoing Projects</th>
                <th className="py-2 px-4 text-left">Technicians</th>
                <th className="py-2 px-4 text-left">Inventory Items</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{branch.name}</td>
                  <td className="py-2 px-4">{branch.customers}</td>
                  <td className="py-2 px-4">{branch.completedProjects}</td>
                  <td className="py-2 px-4">{branch.ongoingProjects}</td>
                  <td className="py-2 px-4">{branch.technicians.length}</td>
                  <td className="py-2 px-4">{branch.inventory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Branches View Component (New)
function BranchesView({ branches, onBranchSelect }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Branches</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map(branch => (
          <div 
            key={branch.id} 
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onBranchSelect(branch)}
          >
            <h3 className="text-xl font-semibold mb-3">{branch.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Manager</p>
                <p className="font-medium">{branch.manager.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Technicians</p>
                <p className="font-medium">{branch.technicians.length}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Customers</p>
                <p className="font-medium">{branch.customers}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Projects</p>
                <p className="font-medium">{branch.completedProjects + branch.ongoingProjects}</p>
              </div>
            </div>
            <div className="mt-4 text-blue-600 text-sm">Click to view details</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Managers View Component (New)
function ManagersView({ managers, onManagerSelect }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Managers</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {managers.map(manager => (
              <tr key={manager.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">{manager.name}</td>
                <td className="py-3 px-4">{manager.email}</td>
                <td className="py-3 px-4">{manager.phone}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${manager.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {manager.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button 
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => onManagerSelect(manager)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Technicians View Component (New)
function TechniciansView({ technicians, onTechnicianSelect }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Technicians</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Branch</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Tasks</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {technicians.map(tech => (
              <tr key={tech.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">{tech.name}</td>
                <td className="py-3 px-4">{tech.branchName}</td>
                <td className="py-3 px-4">{tech.email}</td>
                <td className="py-3 px-4">{tech.phone}</td>
                <td className="py-3 px-4">{tech.tasksCompleted} completed, {tech.tasksInProgress} in progress</td>
                <td className="py-3 px-4">
                  <button 
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => onTechnicianSelect(tech)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Branch Details Component (Modified - removed percentages)
function BranchDetails({ branch }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{branch.name} Branch Details</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Customers</h3>
          <p className="text-3xl font-bold">{branch.customers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Completed Projects</h3>
          <p className="text-3xl font-bold">{branch.completedProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Ongoing Projects</h3>
          <p className="text-3xl font-bold">{branch.ongoingProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm mb-1">Total Projects</h3>
          <p className="text-3xl font-bold">{branch.completedProjects + branch.ongoingProjects}</p>
        </div>
      </div>

      {/* Manager Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Branch Manager</h3>
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-4">
            {branch.manager.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{branch.manager.name}</p>
            <p className="text-sm text-gray-600">{branch.manager.email}</p>
            <p className="text-sm text-gray-600">{branch.manager.phone}</p>
          </div>
        </div>
      </div>

      {/* Technicians Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Technicians ({branch.technicians.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Phone</th>
                <th className="py-2 px-4 text-left">Tasks Completed</th>
                <th className="py-2 px-4 text-left">Tasks In Progress</th>
                <th className="py-2 px-4 text-left">Total Tasks</th>
              </tr>
            </thead>
            <tbody>
              {branch.technicians.map(tech => (
                <tr key={tech.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{tech.name}</td>
                  <td className="py-2 px-4">{tech.email}</td>
                  <td className="py-2 px-4">{tech.phone}</td>
                  <td className="py-2 px-4">{tech.tasksCompleted}</td>
                  <td className="py-2 px-4">{tech.tasksInProgress}</td>
                  <td className="py-2 px-4">{tech.tasksCompleted + tech.tasksInProgress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Inventory</h3>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {branch.inventory} items
          </span>
        </div>
        <p className="text-gray-600 text-sm">
          Click on "Inventory" in the sidebar to view detailed inventory reports for this branch.
        </p>
      </div>
    </div>
  );
}

// Manager Details Component (Updated - removed percentages)
function ManagerDetails({ manager }) {
  // Find the branch for active managers
  const branch = manager.active 
    ? mockData.branches.find(b => b.manager.id === manager.id) 
    : null;
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manager Details</h2>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
            {manager.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{manager.name}</h3>
            {branch ? (
              <p className="text-gray-600">Manager at {branch.name} Branch</p>
            ) : (
              <p className="text-gray-600">Inactive Manager</p>
            )}
            <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${manager.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {manager.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Contact Information</h4>
            <p className="text-gray-600">Email: {manager.email}</p>
            <p className="text-gray-600">Phone: {manager.phone}</p>
          </div>
          
          {branch && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Branch Performance</h4>
              <p className="text-gray-600">Team Size: {branch.technicians.length} technicians</p>
              <p className="text-gray-600">Completed Projects: {branch.completedProjects}</p>
              <p className="text-gray-600">Ongoing Projects: {branch.ongoingProjects}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Team Overview - only show if manager is active */}
      {branch && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Tasks Completed</th>
                  <th className="py-2 px-4 text-left">Tasks In Progress</th>
                  <th className="py-2 px-4 text-left">Total Tasks</th>
                </tr>
              </thead>
              <tbody>
                {branch.technicians.map(tech => (
                  <tr key={tech.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4">{tech.name}</td>
                    <td className="py-2 px-4">{tech.tasksCompleted}</td>
                    <td className="py-2 px-4">{tech.tasksInProgress}</td>
                    <td className="py-2 px-4">{tech.tasksCompleted + tech.tasksInProgress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Branch Summary - only show if manager is active */}
      {branch && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Branch Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm text-gray-500">Total Customers</h4>
              <div className="mt-2 text-2xl font-bold">{branch.customers}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm text-gray-500">Total Inventory</h4>
              <div className="mt-2 text-2xl font-bold">{branch.inventory} items</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm text-gray-500">Total Projects</h4>
              <div className="mt-2 text-2xl font-bold">{branch.completedProjects + branch.ongoingProjects}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* For inactive managers */}
      {!manager.active && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Manager Status</h3>
          <p className="text-gray-600">This manager is currently inactive and not assigned to any branch.</p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Inactive Manager Information</h4>
            <p className="text-yellow-700">This manager is currently not assigned to any active branch. They may be on leave, between assignments, or no longer with the company.</p>
            <button className="mt-3 bg-yellow-100 text-yellow-800 px-4 py-2 rounded hover:bg-yellow-200">
              Reactivate Manager
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Technician Details Component (Modified - removed percentages)
function TechnicianDetails({ technician }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Technician Details</h2>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
            {technician.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{technician.name}</h3>
            <p className="text-gray-600">Technician at {technician.branchName} Branch</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Contact Information</h4>
            <p className="text-gray-600">Email: {technician.email}</p>
            <p className="text-gray-600">Phone: {technician.phone}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Performance Summary</h4>
            <p className="text-gray-600">Tasks Completed: {technician.tasksCompleted}</p>
            <p className="text-gray-600">Tasks In Progress: {technician.tasksInProgress}</p>
            <p className="text-gray-600">Total Tasks: {technician.tasksCompleted + technician.tasksInProgress}</p>
          </div>
        </div>
      </div>
      
      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Task Summary</h3>
          <div className="mt-2">
            <div className="flex justify-between text-gray-600 mb-3 text-lg">
              <span>Completed Tasks</span>
              <span className="font-bold">{technician.tasksCompleted}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-3 text-lg">
              <span>Tasks In Progress</span>
              <span className="font-bold">{technician.tasksInProgress}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-3 text-lg border-t pt-3">
              <span>Total Tasks</span>
              <span className="font-bold">{technician.tasksCompleted + technician.tasksInProgress}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Current Workload</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">Active Tasks</span>
              <span className="text-lg font-bold">{technician.tasksInProgress}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-2">Recent Activity</h4>
              <ul className="space-y-2">
                <li className="text-gray-600">Last task completed: Apr 18, 2025</li>
                <li className="text-gray-600">Next scheduled visit: Apr 24, 2025</li>
                <li className="text-gray-600">Assigned to {technician.branchName} branch</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Tasks */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Task ID</th>
                <th className="py-2 px-4 text-left">Customer</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">T-{technician.id}001</td>
                <td className="py-2 px-4">Sharma Electronics</td>
                <td className="py-2 px-4">Equipment installation</td>
                <td className="py-2 px-4">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Completed</span>
                </td>
                <td className="py-2 px-4">Apr 18, 2025</td>
              </tr>
              <tr className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">T-{technician.id}002</td>
                <td className="py-2 px-4">Gupta Stores</td>
                <td className="py-2 px-4">System maintenance</td>
                <td className="py-2 px-4">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Completed</span>
                </td>
                <td className="py-2 px-4">Apr 15, 2025</td>
              </tr>
              <tr className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">T-{technician.id}003</td>
                <td className="py-2 px-4">Patel Industries</td>
                <td className="py-2 px-4">Network troubleshooting</td>
                <td className="py-2 px-4">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">In Progress</span>
                </td>
                <td className="py-2 px-4">Apr 20, 2025</td>
              </tr>
              <tr className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">T-{technician.id}004</td>
                <td className="py-2 px-4">Singh Enterprises</td>
                <td className="py-2 px-4">Software update</td>
                <td className="py-2 px-4">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">In Progress</span>
                </td>
                <td className="py-2 px-4">Apr 21, 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}