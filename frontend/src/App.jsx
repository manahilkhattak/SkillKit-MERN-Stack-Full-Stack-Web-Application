import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/Guards';

// Public
import Landing           from './pages/Landing';
import { Login, Register } from './pages/auth/Auth';

// Lessee
import Dashboard         from './pages/lessee/Dashboard';
import BrowseKits        from './pages/lessee/BrowseKits';
import Apply             from './pages/lessee/Apply';
import MyLease           from './pages/lessee/MyLease';
import MyPayments        from './pages/lessee/MyPayments';
import Wallet            from './pages/lessee/Wallet';
import { Notifications, Profile } from './pages/lessee/LesseeOther';

// Admin
import AdminDashboard    from './pages/admin/AdminDashboard';
import { AdminKits, AdminItems } from './pages/admin/AdminInventory';
import AdminApplications from './pages/admin/AdminApplications';
import { AdminLeases, AdminPayments, AdminFlagged, AdminUsers, AdminReports } from './pages/admin/AdminPages';

// 404
const NotFound = () => (
  <div style={{ textAlign:'center', padding:'80px 20px', fontFamily:"'Inter',sans-serif" }}>
    <div style={{ fontSize:64, marginBottom:16 }}>🔧</div>
    <h1 style={{ fontSize:48, color:'#1a5c2e', fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:8 }}>404</h1>
    <p style={{ color:'#9aa3af', marginBottom:24 }}>Page not found.</p>
    <a href="/" style={{ background:'#22783c', color:'#fff', padding:'10px 24px', borderRadius:10, fontWeight:700, textDecoration:'none', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Go Home</a>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration:3500, style:{ fontFamily:"'Inter',sans-serif", fontSize:13 } }} />
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Lessee */}
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kits"         element={<ProtectedRoute><BrowseKits /></ProtectedRoute>} />
          <Route path="/apply"        element={<ProtectedRoute><Apply /></ProtectedRoute>} />
          <Route path="/my-lease"     element={<ProtectedRoute><MyLease /></ProtectedRoute>} />
          <Route path="/my-payments"  element={<ProtectedRoute><MyPayments /></ProtectedRoute>} />
          <Route path="/wallet"       element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"                  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/kits"             element={<AdminRoute><AdminKits /></AdminRoute>} />
          <Route path="/admin/items"            element={<AdminRoute><AdminItems /></AdminRoute>} />
          <Route path="/admin/applications"     element={<AdminRoute><AdminApplications /></AdminRoute>} />
          <Route path="/admin/leases"           element={<AdminRoute><AdminLeases /></AdminRoute>} />
          <Route path="/admin/payments"         element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/flagged"          element={<AdminRoute><AdminFlagged /></AdminRoute>} />
          <Route path="/admin/users"            element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/reports"          element={<AdminRoute><AdminReports /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
