import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
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

// Technician Users Management
import TechnicianUsers from './pages/users/TechnicianUsers';

// Branch Management
import BranchList from './pages/branches/BranchList';

import OwnershipTransferPage from './pages/users/OwnershipTransferPage';
import ContactsPage from './pages/leads/ContactsPage';
import WorkOrdersPage from './pages/workOrders/WorkOrdersPage';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import TransferHistoryTable from './pages/manager/TransferHistoryTable';
import ManagerProjectDashboard from './pages/manager/ManagerProjectDashboard';
import PendingApprovals from './pages/manager/PendingApprovals';
import InventoryManagement from './pages/inventory/InventoryManagement';
import TransferredProjectsPage from './pages/manager/TransferredProjectsPage';
import ReturnedInventoryTable from './pages/manager/ReturnedInventoryTable';
import ReplacementWarranty from './pages/manager/ReplacementWarranty';
import Test from './pages/test';
import ManagerDetail from './pages/users/ManagerDetail';
import BranchDetails from './pages/branches/BranchDetails';
import InventoryPage from './pages/inventory/InventoryPage';
import ServicesPage from './pages/services/ServicesPage';
import ResetDefaultPage from './pages/ResetDefaultPage';
import SettingsPage from './pages/SettingsPage';

// Settings Pages
import BankAccountsPage from './pages/settings/BankAccountsPage';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// React 19 metadata approach: render <title> & <link rel="icon"> anywhere.
// React hoists them to <head> automatically (no Helmet needed).
function RouteHead() {
  const { pathname } = useLocation();

  // Defaults
  let title = "3G Digital CRM";
  let icon  = "/favicon.ico";

  // Map your routes to panels — tweak to match your real paths
  if (
    pathname.startsWith("/branches") ||
    pathname.startsWith("/users/managers") ||
    pathname.startsWith("/users/branches/technicians") ||
    pathname.startsWith("/inventory-items")
  ) {
    title = "3G Digital - Admin Panel";
    icon  = "/admin.ico";
  } else if (
    pathname.startsWith("/users/manager/technicians") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/work-orders") ||
    pathname.startsWith("/manager-dashboard") ||
    pathname.startsWith("/pending-approvals") ||
    pathname.startsWith("/transferred-projects") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/returned-inventory") ||
    pathname.startsWith("/replacement-warranty") ||
    pathname.startsWith("/inventory-transfer-history")
  ) {
    title = "3G Digital - Manager Panel";
    icon  = "/manager.ico";
  } else if (
    pathname.startsWith("/technician-dashboard") ||
    pathname.startsWith("/work-orders") ||
    pathname.startsWith("/technician")
  ) {
    title = "3G Digital - Engineer Panel";
    icon  = "/engineer.ico";
  } 

  // Cache-bust so browsers don't stick to an old favicon
  const bust = Date.now();
  const href = `${icon}?v=${bust}`;

  // Return head tags directly — React 19 hoists them into <head>
  return (
    <>
      <title>{title}</title>
      <link rel="icon" href={href} />
      {/* optional for mobile/pinned tiles */}
      <link rel="apple-touch-icon" href={href} />
    </>
  );
}


function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
         <RouteHead /> 
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
            path="users/managers/:managerId" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManagerDetail />
              </ProtectedRoute>
            } 
          />
            
            {/* Technician Users */}
            <Route 
  path="users/branches/technicians" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <TechnicianUsers />
    </ProtectedRoute>
  } 
/>

         <Route 
  path="users/manager/technicians" 
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <TechnicianUsers />
    </ProtectedRoute>
  } 
/>

          <Route 
              path="reset-system" 
              element={
                <ProtectedRoute >
                  <ResetDefaultPage />
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
              path="branches/:branchId" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <BranchDetails />
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

                <Route
              path="inventory-items"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="services"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ServicesPage />
                </ProtectedRoute>
              }
            />

        <Route
          path="inventory"
          element={
            <ProtectedRoute>
              <InventoryManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="transferred-projects"
          element={
            <ProtectedRoute>
              <TransferredProjectsPage />
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
          path="returned-inventory"
          element={
            <ProtectedRoute>
              <ReturnedInventoryTable />
            </ProtectedRoute>
          }
        />

        <Route
          path="replacement-warranty"
          element={
            <ProtectedRoute>
              <ReplacementWarranty />
            </ProtectedRoute>
          }
        />

        <Route
          path="test"
          element={
            <ProtectedRoute>
              <Test />
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
            <ProtectedRoute>
              <ManagerProjectDashboard/>
            </ProtectedRoute>
          }
        />

        <Route
          path="pending-approvals"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <PendingApprovals/>
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

        {/* Settings Routes */}
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Settings Routes */}
        <Route
          path="admin-settings/bank-accounts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BankAccountsPage />
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