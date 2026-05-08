import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDate, Badge } from '../../utils/helpers';

export default function MyLease() {
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/leases/mine'),
      api.get('/applications/mine'),
    ]).then(([l, a]) => {
      setLease(l.data.lease);
      setPayments(l.data.payments || []);
      setApps(a.data.applications || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout breadcrumb="My Lease"><div className="loading">Loading...</div></Layout>;

  const paid = payments.filter(p => p.status === 'paid').length;
  const pct  = lease ? Math.round((paid / lease.totalMonths) * 100) : 0;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.paidAmount, 0);
  const remaining = (lease?.totalMonths - paid) * (lease?.monthlyRent || 0);

  return (
    <Layout breadcrumb="My Lease">
      <div className="page-title">My Lease</div>
      <div className="page-sub">Your active Ijarah lease contract details.</div>

      {lease ? (
        <>
          {/* Lease summary card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{lease.toolKitId?.trade}</div>
                <h2 style={{ fontSize: 22, marginBottom: 4 }}>{lease.toolKitId?.name}</h2>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Serial: <strong>{lease.toolItemId?.serialNumber}</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge status={lease.status} />
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>Lease ID: #{lease._id.toString().slice(-8).toUpperCase()}</div>
              </div>
            </div>

            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
              {[
                ['Monthly Rent', fmtPKR(lease.monthlyRent)],
                ['Lease Start', fmtDate(lease.startDate)],
                ['Lease End', fmtDate(lease.endDate)],
                ['Duration', `${lease.totalMonths} months`],
                ['Kit Condition', <Badge key="c" status={lease.toolItemId?.condition} />],
                ['Replacement Value', fmtPKR(lease.toolKitId?.replacementCost)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Lease progress</span>
              <span style={{ color: 'var(--gray-400)' }}>{paid} of {lease.totalMonths} installments paid</span>
            </div>
            <div className="prog-outer" style={{ marginBottom: 6 }}>
              <div className="prog-inner" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-400)' }}>
              <span>{pct}% complete</span>
              <span>{lease.totalMonths - paid} months remaining</span>
            </div>
          </div>

          {/* Financial summary */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Total Paid</div><div className="stat-val" style={{ fontSize: 18, color: 'var(--green)' }}>{fmtPKR(totalPaid)}</div></div>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Remaining</div><div className="stat-val" style={{ fontSize: 18 }}>{fmtPKR(remaining)}</div></div>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Installments Paid</div><div className="stat-val">{paid} / {lease.totalMonths}</div></div>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Overdue</div><div className="stat-val" style={{ color: payments.filter(p => p.status === 'overdue').length > 0 ? 'var(--red)' : 'var(--green)' }}>{payments.filter(p => p.status === 'overdue').length}</div></div>
          </div>

          {/* Kit components */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Kit Components</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {lease.toolKitId?.components?.map((c, i) => (
                <div key={i} style={{ background: 'var(--green-pale)', border: '1px solid var(--green-mid)', borderRadius: 6, padding: '6px 12px', fontSize: 13 }}>
                  <strong>{c.quantity}×</strong> {c.name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/my-payments" className="btn btn-primary"> View Payment Schedule</Link>
            <Link to="/wallet" className="btn btn-outline">Top Up Wallet</Link>
          </div>
        </>
      ) : (
        <div>
          {/* Show application history */}
          {apps.length > 0 ? (
            <div>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                 You don't have an active lease yet. Check your application status below.
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Application History</span></div>
                {apps.map(app => (
                  <div key={app._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{app.toolKitId?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Applied {fmtDate(app.createdAt)}</div>
                      {app.rejectionReason && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>Reason: {app.rejectionReason}</div>}
                    </div>
                    <Badge status={app.status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty">
              <div className="e-icon"></div>
              <p style={{ marginBottom: 16 }}>No active lease. Apply for a starter kit to get started.</p>
              <Link to="/kits" className="btn btn-primary">Browse Starter Kits →</Link>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
