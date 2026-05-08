import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const lesseeNav = [
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/kits',       label: 'Browse Kits' },
  { to: '/apply',     label: 'Apply for Lease' },
  { to: '/my-lease',     label: 'My Lease' },
  { to: '/my-payments',  label: 'Payment Schedule' },
  { to: '/wallet',     label: 'My Wallet' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile',   label: 'Profile' },
];

const adminNav = [
  { section: 'Overview' },
  { to: '/admin',    label: 'Dashboard' },
  { section: 'Inventory' },
  { to: '/admin/kits',  label: 'Tool Kits' },
  { to: '/admin/items',   label: 'Physical Items' },
  { section: 'Leasing' },
  { to: '/admin/applications',label: 'Applications' },
  { to: '/admin/leases',  label: 'Active Leases' },
  { to: '/admin/payments', label: 'Payments' },
  { section: 'Finance' },
  { to: '/admin/flagged',  label: 'Flagged Transactions' },
  { section: 'Users' },
  { to: '/admin/users',   label: 'Lessees' },
  { section: 'Reports' },
  { to: '/admin/reports', label: 'Revenue Reports' },
];

export default function Layout({ children, breadcrumb }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout(); navigate('/login');
  };

  const nav = isAdmin ? adminNav : lesseeNav;

  return (
    <div className="app">
      <div className={`overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">Skill<span>Kit</span></div>
        <nav className="sidebar-nav">
          {nav.map((item, i) => item.section
            ? <div key={i} className="nav-section">{item.section}</div>
            : (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin' || item.to === '/dashboard'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}>
                <span className="icon">{item.icon}</span> {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-footer">BS FinTech · FAST University</div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-l">
            <button className="hamburger" onClick={() => setOpen(o => !o)}>☰</button>
            <div className="breadcrumb"><strong>{breadcrumb || 'Dashboard'}</strong></div>
          </div>
          <div className="topbar-r">
            <span style={{ fontSize:13, fontWeight:600, color:'var(--gray-600)' }}>{user?.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={doLogout}>Log Out</button>
          </div>
        </div>
        <div className="page fade-in">{children}</div>
      </div>
    </div>
  );
}
