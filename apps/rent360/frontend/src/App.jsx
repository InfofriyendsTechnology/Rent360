import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { logout } from './store/authSlice';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import StoresList from './pages/Stores/StoresList';
import BucketExplorer from './pages/Bucket/BucketExplorer';
import PlansList from './pages/Plans/PlansList';
import SubscriptionsList from './pages/Subscriptions/SubscriptionsList';
import DashboardHome from './pages/Dashboard/DashboardHome';
import RolesList from './pages/Roles/RolesList';
import UsersList from './pages/Users/UsersList';
import UserFormPage from './pages/Users/UserFormPage';
import CustomersList from './pages/Customers/CustomersList';
import Profile from './pages/Profile/Profile';
import CollectionList from './pages/Collection/CollectionList';
import CategoriesList from './pages/Categories/CategoriesList';
import SettingsPage from './pages/Settings/SettingsPage';
import Cashbook from './pages/Cashbook/Cashbook';
import CashbookReports from './pages/Cashbook/CashbookReports';
import AccountLedger from './pages/Finance/AccountLedger';
import TrialBalance from './pages/Finance/TrialBalance';
import MasterPage from './pages/Master/MasterPage';
import AccessoriesList from './pages/Collection/AccessoriesList';
import StockInventoryPage from './pages/Collection/StockInventoryPage';
import LookbookPage from './pages/Collection/LookbookPage';
import BulkImportPage from './pages/Collection/BulkImportPage';
import OutfitFormPage from './pages/Collection/OutfitFormPage';

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Keep theme consistent
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }

    // Handle session expiry globally
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/login')) {
          console.warn('Session expired or unauthorized (401). Redirecting to login.');
          dispatch(logout());
          toast.error('Session expired. Please log in again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [dispatch]);

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
          
          {/* Super Admin Specific Routes */}
          {(user?.role === 'SUPER_ADMIN' || !user?.role) && (
            <>
              <Route path="stores" element={<StoresList />} />
              <Route path="bucket" element={<BucketExplorer />} />
              <Route path="plans" element={<PlansList />} />
              <Route path="subscriptions" element={<SubscriptionsList />} />
            </>
          )}

          {/* Collection / Outfits Section */}
          <Route path="outfits" element={<CollectionList />} />
          <Route path="collection" element={<CollectionList />} />
          <Route path="collection/outfits" element={<CollectionList />} />
          <Route path="collection/create" element={<OutfitFormPage />} />
          <Route path="collection/edit/:id" element={<OutfitFormPage />} />
          <Route path="outfits/create" element={<Navigate to="/collection/create" replace />} />
          <Route path="outfits/edit/:id" element={<OutfitFormPage />} />
          <Route path="inventory/create" element={<Navigate to="/collection/create" replace />} />
          <Route path="inventory" element={<Navigate to="/outfits" replace />} />
          <Route path="inventory/products" element={<Navigate to="/outfits" replace />} />
          <Route path="inventory/product" element={<Navigate to="/outfits" replace />} />

          {/* Accessories Module (Direct & Nested Routes) */}
          <Route path="accessories" element={<AccessoriesList />} />
          <Route path="collection/accessories" element={<AccessoriesList />} />
          <Route path="inventory/accessory" element={<Navigate to="/collection/accessories" replace />} />
          <Route path="inventory/accessories" element={<Navigate to="/collection/accessories" replace />} />

          {/* Barcode & Stock */}
          <Route path="stock" element={<StockInventoryPage />} />
          <Route path="collection/stock" element={<StockInventoryPage />} />
          <Route path="inventory/items" element={<Navigate to="/collection/stock" replace />} />

          {/* Lookbook / Catalogue */}
          <Route path="lookbook" element={<LookbookPage />} />
          <Route path="collection/lookbook" element={<LookbookPage />} />
          <Route path="catalogue" element={<Navigate to="/collection/lookbook" replace />} />
          <Route path="inventory/catalogue" element={<Navigate to="/collection/lookbook" replace />} />

          {/* Bulk Import */}
          <Route path="bulk-import" element={<BulkImportPage />} />
          <Route path="collection/import" element={<BulkImportPage />} />
          <Route path="collection/bulk-import" element={<BulkImportPage />} />
          <Route path="inventory/excel-import" element={<Navigate to="/collection/import" replace />} />
          <Route path="inventory/bulk-insert" element={<Navigate to="/collection/import" replace />} />

          {/* Store Operations */}
          <Route path="cashbook" element={<Cashbook />} />
          <Route path="transactions" element={<Navigate to="/cashbook" replace />} />
          <Route path="cashbook-reports" element={<CashbookReports />} />
          <Route path="reports/cashbook" element={<Navigate to="/cashbook-reports" replace />} />
          <Route path="account-ledger" element={<AccountLedger />} />
          <Route path="ledger" element={<Navigate to="/account-ledger" replace />} />
          <Route path="trial-balance" element={<TrialBalance />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="roles" element={<RolesList />} />
          <Route path="users" element={<UsersList />} />
          <Route path="users/create" element={<UserFormPage />} />
          <Route path="users/edit/:id" element={<UserFormPage />} />
          <Route path="staff" element={<UsersList />} />

          {/* Store Setup & Master Attributes */}
          <Route path="categories" element={<CategoriesList />} />
          <Route path="master" element={<MasterPage />} />
          <Route path="sizes" element={<MasterPage defaultTab="sizes" />} />
          <Route path="colors" element={<MasterPage defaultTab="colors" />} />
          <Route path="time-slots" element={<MasterPage defaultTab="time-slots" />} />
          <Route path="reminders" element={<MasterPage defaultTab="reminders" />} />
          <Route path="accounts" element={<MasterPage defaultTab="accounts" />} />
          <Route path="security-accounts" element={<MasterPage defaultTab="security-accounts" />} />

          {/* Shared Settings & Profile */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="setup" element={<Navigate to="/settings" replace />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
