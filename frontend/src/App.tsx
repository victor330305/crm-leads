import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Conversations from './pages/Conversations';
import Analytics from './pages/Analytics';
import Products from './pages/Products';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/" replace /> : <Login />
        } />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index          element={<Dashboard />} />
          <Route path="leads"   element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="analytics"     element={<Analytics />} />
          <Route path="products"      element={<Products />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
