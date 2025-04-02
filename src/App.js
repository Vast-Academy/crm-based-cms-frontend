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
import LeadDetail from './pages/leads/LeadDetail';
import AddLead from './pages/leads/AddLead'

import CustomerList from './pages/customers/CustomerList'
import LeadDetailRedirect from './pages/leads/LeadDetailRedirect';
import InventoryPage from './pages/inventory/InventoryPage';

// Inventory Management - Will be implemented later
// import Inventory from './pages/inventory/Inventory';
// import AddInventoryItem from './pages/inventory/AddInventoryItem';
// import AssignInventory from './pages/inventory/AssignInventory';

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
            <Route 
              path="users/technicians/add" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AddTechnician />
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
              path="leads" 
              element={
                <ProtectedRoute>
                  <LeadList />
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="leads/add" 
              element={
                <ProtectedRoute>
                  <AddLead />
                </ProtectedRoute>
              } 
            /> */}
            <Route 
              path="leads/:id" 
              element={
                <ProtectedRoute>
                  <LeadDetailRedirect />
                </ProtectedRoute>
              } 
            />

            {/* Customer Management Routes */}
            <Route 
              path="customers" 
              element={
                <ProtectedRoute>
                  <CustomerList />
                </ProtectedRoute>
              } 
            />
            
            {/* Placeholder routes for future implementation */}
              <Route 
              path="inventory" 
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } 
            />
            <Route path="inventory/add" element={<div>Add Inventory Item (Coming Soon)</div>} />
            <Route path="inventory/assign" element={<div>Assign Inventory (Coming Soon)</div>} />
            <Route path="customers" element={<div>Customer Management (Coming Soon)</div>} />
            <Route path="work-orders" element={<div>Work Orders (Coming Soon)</div>} />
            <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
            <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
            
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