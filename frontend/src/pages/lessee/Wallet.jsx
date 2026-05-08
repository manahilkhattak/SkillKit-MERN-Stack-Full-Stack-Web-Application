import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDateTime, Badge } from '../../utils/helpers';
import toast from 'react-hot-toast';

const txIcon = { deposit: '⬇️', withdrawal: '⬆️', lease_payment: '🔧', refund: '↩️' };

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'deposit' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const load = async () => {
    try {
      const [w, t] = await Promise.all([api.get('/wallet'), api.get(`/wallet/transactions${typeFilter ? `?type=${typeFilter}` : ''}`)]);
      setWallet(w.data.wallet);
      setTxs(t.data.transactions || []);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [typeFilter]);

  const doAction = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      const endpoint = modal === 'deposit' ? '/wallet/deposit' : '/wallet/withdraw';
      const { data } = await api.post(endpoint, { amount: val, description: desc || undefined });
      if (data.transaction?.status === 'flagged') {
        toast('Transaction flagged for review. Balance not updated.', { icon: '🚨' });
      } else {
        toast.success(`${modal === 'deposit' ? 'Deposited' : 'Withdrawn'} ${fmtPKR(val)} successfully`);
      }
      setModal(null); setAmount(''); setDesc('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Layout breadcrumb="Wallet"><div className="loading">Loading wallet...</div></Layout>;

  return (
    <Layout breadcrumb="Wallet">
      <div className="page-title">My Wallet</div>
      <div className="page-sub">Fund your wallet to pay monthly lease installments.</div>

      {/* Balance card */}
      <div style={{ background: 'linear-gradient(135deg,#1a5c2e,#2e9e50)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', color: '#fff', marginBottom: 24 }}>
        <div style={{ fontSize: 13, opacity: .8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Available Balance</div>
        <div style={{ fontSize: 40, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 20 }}>{fmtPKR(wallet?.balance)}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }} onClick={() => setModal('deposit')}>⬇️ Deposit</button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }} onClick={() => setModal('withdraw')}>⬆️ Withdraw</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Total Deposited</div><div className="stat-val" style={{ fontSize: 18 }}>{fmtPKR(wallet?.totalDeposited)}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Spent on Leases</div><div className="stat-val" style={{ fontSize: 18 }}>{fmtPKR(wallet?.totalSpent)}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Transactions</div><div className="stat-val">{txs.length}</div></div>
        <div className="stat"><div className="stat-icon"></div><div className="stat-label">Status</div><div className="stat-val" style={{ fontSize: 16, marginTop: 4 }}><Badge status={wallet?.status} /></div></div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Transaction History</span>
          <select className="form-control" style={{ width: 'auto', minHeight: 36, padding: '4px 10px', fontSize: 13 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="lease_payment">Lease Payments</option>
          </select>
        </div>
        {txs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Description</th><th>Status</th></tr></thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx._id} style={tx.suspiciousFlag ? { background: '#fff8f8' } : {}}>
                    <td data-label="Date" style={{ fontSize: 12 }}>{fmtDateTime(tx.createdAt)}</td>
                    <td data-label="Type"><span style={{ marginRight: 6 }}>{txIcon[tx.type] || '💸'}</span>{tx.type.replace('_', ' ')}</td>
                    <td data-label="Amount" style={{ fontWeight: 700, color: tx.type === 'deposit' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'deposit' ? '+' : '−'}{fmtPKR(tx.amount)}
                    </td>
                    <td data-label="Balance After">{fmtPKR(tx.balanceAfter)}</td>
                    <td data-label="Description" style={{ fontSize: 12, color: 'var(--gray-600)' }}>{tx.description || '—'}</td>
                    <td data-label="Status">
                      <Badge status={tx.status} />
                      {tx.suspiciousFlag && <span style={{ marginLeft: 6, fontSize: 11 }}></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><div className="e-icon"></div><p>No transactions yet. Make your first deposit!</p></div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">{modal === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}</div>
              <button className="modal-close" onClick={() => { setModal(null); setAmount(''); setDesc(''); }}>×</button>
            </div>
            {modal === 'withdraw' && (
              <div className="alert alert-info" style={{ marginBottom: 12 }}>Available: <strong>{fmtPKR(wallet?.balance)}</strong></div>
            )}
            <div className="form-group">
              <label className="form-label">Amount (PKR)</label>
              <input className="form-control" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 10000" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <input className="form-control" type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Easypaisa top-up" />
            </div>
            <button className="btn btn-primary btn-full" disabled={submitting || !amount} onClick={doAction}>
              {submitting ? 'Processing...' : modal === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
