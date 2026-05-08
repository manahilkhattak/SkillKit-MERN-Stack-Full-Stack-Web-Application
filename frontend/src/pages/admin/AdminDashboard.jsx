import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDate, Badge } from '../../utils/helpers';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout breadcrumb="Admin Dashboard"><div className="loading">Loading...</div></Layout>;

  const s = data?.stats || {};
  const chartData = (data?.monthlyRevenue || []).map(d => ({
    month: `${d._id.y}-${String(d._id.m).padStart(2,'0')}`, revenue: d.total, count: d.count,
  }));

  return (
    <Layout breadcrumb="Admin Dashboard">
      <div className="page-title">Admin Dashboard</div>
      <div className="page-sub">Platform-wide overview — inventory, leases, payments, users.</div>

      {/* Row 1: Users + Leases */}
      <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: .5 }}>Users</div>
      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Total Lessees</div><div className="stat-val">{s.totalUsers}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Active</div><div className="stat-val" style={{ color: 'var(--green)' }}>{s.activeUsers}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Blocked</div><div className="stat-val" style={{ color: 'var(--red)' }}>{s.blockedUsers}</div></div>
      </div>

      <div style={{ marginBottom: 8, marginTop: 16, fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: .5 }}>Inventory</div>
      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Kit Types</div><div className="stat-val">{s.totalKitTypes}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Available Items</div><div className="stat-val" style={{ color: 'var(--green)' }}>{s.availableItems}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">On Lease</div><div className="stat-val" style={{ color: 'var(--amber)' }}>{s.onLeaseItems}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Maintenance</div><div className="stat-val">{s.maintenanceItems}</div></div>
      </div>

      <div style={{ marginBottom: 8, marginTop: 16, fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: .5 }}>Leasing</div>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Pending Applications</div><div className="stat-val" style={{ color: s.pendingApps > 0 ? 'var(--amber)' : 'inherit' }}>{s.pendingApps}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Active Leases</div><div className="stat-val" style={{ color: 'var(--green)' }}>{s.activeLeases}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Overdue Payments</div><div className="stat-val" style={{ color: s.overduePayments > 0 ? 'var(--red)' : 'inherit' }}>{s.overduePayments}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Flagged Transactions</div><div className="stat-val" style={{ color: s.flaggedTx > 0 ? 'var(--red)' : 'inherit' }}>{s.flaggedTx}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Revenue (Lease Payments)</span></div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmtPKR(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#22783c" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty"><p>No payment data yet.</p></div>}
        </div>

        {/* Quick links */}
        <div className="card">
          <div className="card-header"><span className="card-title">Quick Actions</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.pendingApps > 0 && <Link to="/admin/applications" className="btn btn-primary btn-full">Review {s.pendingApps} Application{s.pendingApps > 1 ? 's' : ''}</Link>}
            {s.overduePayments > 0 && <Link to="/admin/payments?status=overdue" className="btn btn-danger btn-full">{s.overduePayments} Overdue Payment{s.overduePayments > 1 ? 's' : ''}</Link>}
            <Link to="/admin/kits" className="btn btn-outline btn-full"> Manage Kits</Link>
            <Link to="/admin/items" className="btn btn-outline btn-full"> Manage Items</Link>
            <Link to="/admin/flagged" className="btn btn-ghost btn-full"> Flagged Transactions</Link>
          </div>
        </div>
      </div>

      {/* Pending applications */}
      {data?.recentApps?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Pending Applications</span>
            <Link to="/admin/applications" style={{ fontSize: 12 }}>View all →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Applicant</th><th>Kit</th><th>Trade</th><th>Applied</th><th>Action</th></tr></thead>
              <tbody>
                {data.recentApps.map(a => (
                  <tr key={a._id}>
                    <td data-label="Applicant"><div style={{fontWeight:600}}>{a.userId?.name}</div><div style={{fontSize:12,color:'var(--gray-400)'}}>{a.userId?.phone}</div></td>
                    <td data-label="Kit">{a.toolKitId?.name}</td>
                    <td data-label="Trade"><Badge status={a.toolKitId?.trade} /></td>
                    <td data-label="Applied" style={{fontSize:12}}>{fmtDate(a.createdAt)}</td>
                    <td><Link to="/admin/applications" className="btn btn-primary btn-sm">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue payments */}
      {data?.recentOverdue?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{color:'var(--red)'}}>Overdue Payments</span>
            <Link to="/admin/payments" style={{ fontSize: 12 }}>View all →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lessee</th><th>Kit</th><th>Amount Due</th><th>Due Date</th></tr></thead>
              <tbody>
                {data.recentOverdue.map(p => (
                  <tr key={p._id}>
                    <td data-label="Lessee"><div style={{fontWeight:600}}>{p.userId?.name}</div><div style={{fontSize:12,color:'var(--gray-400)'}}>{p.userId?.phone}</div></td>
                    <td data-label="Kit">{p.toolKitId?.name}</td>
                    <td data-label="Amount" style={{fontWeight:700,color:'var(--red)'}}>{fmtPKR(p.amount)}</td>
                    <td data-label="Due" style={{fontSize:12,color:'var(--red)'}}>{fmtDate(p.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
