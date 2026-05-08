import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDate, fmtDateTime, Badge, ordinal } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function MyPayments() {
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // paymentId currently being paid

  const load = async () => {
    try {
      const [l, w] = await Promise.all([api.get('/leases/mine'), api.get('/wallet')]);
      setLease(l.data.lease);
      setPayments(l.data.payments || []);
      setWallet(w.data.wallet);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const payNow = async (paymentId, amount) => {
    if (!wallet || wallet.balance < amount) {
      toast.error(`Insufficient balance. Need ${fmtPKR(amount)}, have ${fmtPKR(wallet?.balance || 0)}.`);
      return;
    }
    if (!confirm(`Pay ${fmtPKR(amount)} from your wallet?`)) return;
    setPaying(paymentId);
    try {
      await api.post(`/payments/pay/${paymentId}`);
      toast.success('Installment paid successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setPaying(null); }
  };

  if (loading) return <Layout breadcrumb="Payment Schedule"><div className="loading">Loading...</div></Layout>;

  const paid    = payments.filter(p => p.status === 'paid').length;
  const overdue = payments.filter(p => p.status === 'overdue').length;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.paidAmount || 0), 0);

  const statusColor = { paid: 'var(--green)', overdue: 'var(--red)', due: 'var(--amber)', upcoming: 'var(--gray-400)', waived: 'var(--gray-400)' };

  return (
    <Layout breadcrumb="Payment Schedule">
      <div className="page-title">Payment Schedule</div>
      <div className="page-sub">Your 12-month Ijarah installment timeline.</div>

      {!lease ? (
        <div className="empty">
          <div className="e-icon"></div>
          <p style={{ marginBottom: 16 }}>No active lease found.</p>
          <Link to="/kits" className="btn btn-primary">Browse Kits</Link>
        </div>
      ) : (
        <>
          {overdue > 0 && (
            <div className="alert alert-danger">
              {overdue} overdue payment{overdue > 1 ? 's' : ''}. Pay immediately to avoid lease default.
            </div>
          )}

          {/* Summary */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Wallet Balance</div><div className="stat-val" style={{ fontSize: 18, color: 'var(--green)' }}>{fmtPKR(wallet?.balance)}</div></div>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Paid</div><div className="stat-val" style={{ color: 'var(--green)' }}>{paid}</div><div className="stat-sub">of {lease.totalMonths} installments</div></div>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Total Paid</div><div className="stat-val" style={{ fontSize: 18 }}>{fmtPKR(totalPaid)}</div></div>
            <div className="stat"><div className="stat-icon"></div><div className="stat-label">Overdue</div><div className="stat-val" style={{ color: overdue > 0 ? 'var(--red)' : 'var(--green)' }}>{overdue}</div></div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">{lease.toolKitId?.name} — Installment Timeline</span>
              <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtPKR(lease.monthlyRent)}/month</span>
            </div>
            <div className="timeline">
              {payments.map(p => (
                <div key={p._id} className={`timeline-item ${p.status}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.status === 'paid' ? 'var(--green-pale)' : p.status === 'overdue' ? 'var(--red-pale)' : 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {p.status === 'paid' ? '✅' : p.status === 'overdue' ? '🔴' : p.status === 'due' ? '📅' : '⏳'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{ordinal(p.installmentNo)} Installment</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        Due: {fmtDate(p.dueDate)}
                        {p.paidAt && <span style={{ marginLeft: 8, color: 'var(--green)' }}>· Paid: {fmtDate(p.paidAt)}</span>}
                        {p.transactionRef && <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11 }}>· Ref: {p.transactionRef}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, color: statusColor[p.status] || 'var(--gray-800)' }}>{fmtPKR(p.amount)}</span>
                    <Badge status={p.status} />
                    {(p.status === 'due' || p.status === 'overdue') && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={paying === p._id}
                        onClick={() => payNow(p._id, p.amount)}
                      >
                        {paying === p._id ? 'Paying...' : 'Pay Now'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {wallet?.balance < lease.monthlyRent && (
            <div className="alert alert-warn" style={{ marginTop: 16 }}>
              Your wallet balance ({fmtPKR(wallet?.balance)}) is less than one installment ({fmtPKR(lease.monthlyRent)}).
              <Link to="/wallet" style={{ marginLeft: 8, fontWeight: 700, color: 'inherit' }}>Top up: </Link>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
