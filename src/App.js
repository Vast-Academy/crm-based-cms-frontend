import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout';

// Admin Users Management
import AdminUsers from './pages/users/AdminUsers';
import AddAdmin from './pages/users/AddAdmin';

// Manager Users Management
import ManagerUsers from './pages/users/ManagerUsers';
import AddManager from './pages/users/AddManager';

// Technician Users Management
import TechnicianUsers from './pages/users/TechnicianUsers';
import AddTechnician from './pages/users/AddTechnician';

// Branch Management
import BranchList from './pages/branches/BranchList';
import AddBranch from './pages/branches/AddBranch';
import LeadList from './pages/leads/LeadList';


import CustomerList from './pages/customers/CustomerList'
import LeadDetailRedirect from './pages/leads/LeadDetailRedirect';
import EditTechnician from './pages/users/EditTechnician';
import AddInventoryItem from './pages/inventory/AddInventoryItem';
import SerializedProductsList from './pages/inventory/SerializedProductsList';
import GenericProductsList from './pages/inventory/GenericProductsList';
import ServicesList from './pages/inventory/ServicesList';
import OwnershipTransferPage from './pages/users/OwnershipTransferPage';
import ContactsPage from './pages/leads/ContactsPage';
import WorkOrdersPage from './pages/workOrders/WorkOrdersPage';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import TransferHistoryTable from './pages/manager/TransferHistoryTable';
import ManagerProjectDashboard from './pages/manager/ManagerProjectDashboard';
import InventoryManagement from './pages/inventory/InventoryManagement';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If allowedRoles is empty array, allow any authenticated user
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes with dashboard layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route 
          path="ownership-transfer" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <OwnershipTransferPage />
            </ProtectedRoute>
          } 
        />
            
            {/* User Management Routes */}
            {/* Admin Users */}
            <Route 
              path="users/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/admin/add" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AddAdmin />
                </ProtectedRoute>
              } 
            />
            
            {/* Manager Users */}
            <Route 
              path="users/managers" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManagerUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/managers/add" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AddManager />
                </ProtectedRoute>
              } 
            />
            
            {/* Technician Users */}
            <Route 
  path="users/technicians" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <TechnicianUsers />
    </ProtectedRoute>
  } 
/>
{/* Only admin can access the dedicated add technician page */}
<Route 
  path="users/technicians/add" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AddTechnician />
    </ProtectedRoute>
  } 
/>
{/* Edit technician route accessible to both */}
<Route 
  path="users/technicians/edit/:id" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'manager']}>
      <EditTechnician />
    </ProtectedRoute>
  } 
/>
            
            {/* Branch Management Routes */}
            <Route 
              path="branches" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <BranchList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="branches/add" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AddBranch />
                </ProtectedRoute>
              } 
            />

              <Route 
                path="contacts" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <ContactsPage />
                  </ProtectedRoute>
                } 
              />

            {/* <Route 
              path="leads" 
              element={
                <ProtectedRoute>
                  <LeadList />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="leads/add" 
              element={
                <ProtectedRoute>
                  <AddLead />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="leads/:id" 
              element={
                <ProtectedRoute>
                  <LeadDetailRedirect />
                </ProtectedRoute>
              } 
            /> */}

            {/* Customer Management Routes */}
            {/* <Route 
              path="customers" 
              element={
                <ProtectedRoute>
                  <CustomerList />
                </ProtectedRoute>
              } 
            /> */}
            

            <Route
              path="inventory/add"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AddInventoryItem />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="inventory/serialized"
              element={
                <ProtectedRoute>
                  <SerializedProductsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory/generic"
              element={
                <ProtectedRoute>
                  <GenericProductsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory/services"
              element={
                <ProtectedRoute>
                  <ServicesList />
                </ProtectedRoute>
              }
            /> */}

        <Route
          path="inventory"
          element={
            <ProtectedRoute>
              <InventoryManagement />
            </ProtectedRoute>
          }
        />

            <Route 
              path="work-orders" 
              element={
                <ProtectedRoute>
                  <WorkOrdersPage />
                </ProtectedRoute>
              } 
            />

        <Route 
          path="inventory-transfer-history" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <TransferHistoryTable />
            </ProtectedRoute>
          }
        />

        <Route 
          path="manager-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerProjectDashboard/>
            </ProtectedRoute>
          }
        />

        <Route 
          path="technician-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />

            {/* 404 Not Found */}
            <Route path="*" element={<div>Page Not Found</div>} />
          </Route>
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;