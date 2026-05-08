import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { fmtPKR, fmtDate, Badge, ordinal } from '../../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/wallet').catch(() => ({ data: { wallet: null } })),
      api.get('/leases/mine').catch(() => ({ data: { lease: null, payments: [] } })),
      api.get('/applications/mine').catch(() => ({ data: { applications: [] } })),
    ]).then(([w, l, a]) => {
      setWallet(w.data.wallet);
      setLease(l.data.lease);
      setPayments(l.data.payments || []);
      setApps(a.data.applications || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout breadcrumb="Dashboard"><div className="loading">Loading...</div></Layout>;

  const paid = payments.filter(p => p.status === 'paid').length;
  const overdue = payments.filter(p => p.status === 'overdue').length;
  const due = payments.filter(p => p.status === 'due').length;
  const pct = lease ? Math.round((paid / lease.totalMonths) * 100) : 0;
  const pendingApp = apps.find(a => a.status === 'pending');

  return (
    <Layout breadcrumb="Dashboard">
      <div className="page-title">Welcome back, {user?.name?.split(' ')[0]} </div>
      <div className="page-sub">Here's your SkillKit overview.</div>

      {user?.status === 'blocked' && (
        <div className="alert alert-danger"> Your account is blocked. Contact your institute administrator.</div>
      )}
      {overdue > 0 && (
        <div className="alert alert-danger">
          You have {overdue} overdue payment{overdue > 1 ? 's' : ''}. <Link to="/my-payments" style={{color:'inherit',fontWeight:700}}>Pay now →</Link>
        </div>
      )}
      {due > 0 && !overdue && (
        <div className="alert alert-warn">
          You have {due} payment{due > 1 ? 's' : ''} due this month. <Link to="/my-payments" style={{color:'inherit',fontWeight:700}}>View schedule →</Link>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-icon"></div>
          <div className="stat-label">Wallet Balance</div>
          <div className="stat-val" style={{color:'var(--green)',fontSize:20}}>{fmtPKR(wallet?.balance)}</div>
        </div>
        <div className="stat">
          <div className="stat-icon"></div>
          <div className="stat-label">Lease Status</div>
          <div className="stat-val" style={{fontSize:16,marginTop:6}}>
            {lease ? <Badge status={lease.status} /> : <span style={{color:'var(--gray-400)',fontSize:14}}>No active lease</span>}
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon"></div>
          <div className="stat-label">Installments Paid</div>
          <div className="stat-val">{lease ? `${paid} / ${lease.totalMonths}` : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-icon"></div>
          <div className="stat-label">Overdue Payments</div>
          <div className="stat-val" style={{color: overdue > 0 ? 'var(--red)' : 'var(--green)'}}>{overdue}</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
        {/* Lease card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Lease</span>
            {lease && <Link to="/my-lease" style={{fontSize:12}}>Full details →</Link>}
          </div>
          {lease ? (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16}}>{lease.toolKitId?.name}</div>
                  <div style={{fontSize:12,color:'var(--gray-400)'}}>{lease.toolItemId?.serialNumber} · {lease.toolKitId?.trade}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:800,fontSize:18,color:'var(--green)'}}>{fmtPKR(lease.monthlyRent)}<small style={{fontWeight:400,fontSize:12,color:'var(--gray-400)'}}>/mo</small></div>
                  <div style={{fontSize:12,color:'var(--gray-400)'}}>Ends {fmtDate(lease.endDate)}</div>
                </div>
              </div>
              <div style={{marginBottom:6,display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span>Lease progress</span><span>{pct}% complete</span>
              </div>
              <div className="prog-outer" style={{marginBottom:8}}>
                <div className={`prog-inner ${pct>=100?'':''}` } style={{width:`${pct}%`}} />
              </div>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <Link to="/my-payments" className="btn btn-primary btn-sm"> Pay Installment</Link>
                <Link to="/my-lease" className="btn btn-ghost btn-sm">View Details</Link>
              </div>
            </div>
          ) : pendingApp ? (
            <div className="empty">
              <div className="e-icon"></div>
              <p style={{marginBottom:8}}>Application for <strong>{pendingApp.toolKitId?.name}</strong> is pending review.</p>
              <p style={{fontSize:12,color:'var(--gray-400)'}}>You will be notified within 2 business days.</p>
            </div>
          ) : (
            <div className="empty">
              <div className="e-icon"></div>
              <p style={{marginBottom:16}}>No active lease yet. Browse available kits and apply.</p>
              <Link to="/kits" className="btn btn-primary btn-sm">Browse Starter Kits</Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-header"><span className="card-title">Quick Actions</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <Link to="/kits" className="btn btn-outline btn-full">Browse Kits</Link>
              {!lease && !pendingApp && <Link to="/apply" className="btn btn-primary btn-full"> Apply for Lease</Link>}
              {lease && <Link to="/my-payments" className="btn btn-primary btn-full"> Pay Installment</Link>}
              <Link to="/wallet" className="btn btn-outline btn-full">Wallet</Link>
              <Link to="/notifications" className="btn btn-ghost btn-full">Notifications</Link>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Wallet</span></div>
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <div style={{fontSize:22,fontWeight:800,color:'var(--green)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{fmtPKR(wallet?.balance)}</div>
              <div style={{fontSize:12,color:'var(--gray-400)',marginBottom:12}}>Available balance</div>
              <Link to="/wallet" className="btn btn-outline btn-sm btn-full">Top Up →</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
