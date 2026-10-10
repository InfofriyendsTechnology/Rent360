import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import StoresList from './pages/Stores/StoresList';
import BucketExplorer from './pages/Bucket/BucketExplorer';
import PlansList from './pages/Plans/PlansList';
import SubscriptionsList from './pages/Subscriptions/SubscriptionsList';
import DashboardHome from './pages/Dashboard/DashboardHome';
import RolesList from './pages/Roles/RolesList';
import UsersList from './pages/Users/UsersList';
import CustomersList from './pages/Customers/CustomersList';
import Profile from './pages/Profile/Profile';

// Temporary placeholder components for remaining routes
const SettingsPage = () => <div style={{ padding: 20 }}><h1>Settings</h1></div>;
const InventoryPage = () => <div style={{ padding: 20 }}><h1>Inventory Management</h1></div>;

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
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          className: 'brutal-toast'
        }} 
      />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes wrapped in DashboardLayout */}
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<DashboardHome />} />
          
          {/* Super Admin Routes */}
          {(user?.role === 'SUPER_ADMIN' || !user?.role) && (
            <>
              <Route path="stores" element={<StoresList />} />
              <Route path="bucket" element={<BucketExplorer />} />
              <Route path="plans" element={<PlansList />} />
              <Route path="subscriptions" element={<SubscriptionsList />} />
              <Route path="staff" element={<UsersList />} />
              <Route path="roles" element={<RolesList />} />
            </>
          )}

          {/* Store Admin Routes */}
          {(user?.role !== 'SUPER_ADMIN' && user?.role) && (
            <>
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="customers" element={<CustomersList />} />
              <Route path="staff" element={<UsersList />} />
              <Route path="roles" element={<RolesList />} />
            </>
          )}

          {/* Shared Routes */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
