import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import StoresList from './pages/Stores/StoresList';

// Temporary dashboard components
const DashboardHome = () => <div style={{ padding: 20 }}><h1>Dashboard Overview</h1></div>;
const SubscriptionsPage = () => <div style={{ padding: 20 }}><h1>Subscriptions</h1></div>;
const SettingsPage = () => <div style={{ padding: 20 }}><h1>Settings</h1></div>;
const InventoryPage = () => <div style={{ padding: 20 }}><h1>Inventory Management</h1></div>;
const CustomersPage = () => <div style={{ padding: 20 }}><h1>Customers</h1></div>;
const RolesPage = () => <div style={{ padding: 20 }}><h1>Role Management</h1></div>;

const App = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Keep theme consistent
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes wrapped in DashboardLayout */}
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<DashboardHome />} />
          
          {/* Super Admin Routes */}
          {user?.role === 'SUPER_ADMIN' && (
            <>
              <Route path="stores" element={<StoresList />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
            </>
          )}

          {/* Store Admin Routes */}
          {user?.role !== 'SUPER_ADMIN' && (
            <>
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="customers" element={<CustomersPage />} />
            </>
          )}

          {/* Shared Routes */}
          <Route path="roles" element={<RolesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
