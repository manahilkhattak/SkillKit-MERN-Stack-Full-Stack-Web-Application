import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDate, Badge } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null);   // application being reviewed
  const [approveItemId, setApproveItemId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/applications${statusFilter ? `?status=${statusFilter}` : ''}`);
      setApps(data.applications || []);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openReview = async (app) => {
    setSelected(app); setApproveItemId(''); setRejectReason('');
    // Load available items of this kit type
    try {
      const { data } = await api.get(`/admin/items?toolKitId=${app.toolKitId._id}&status=available`);
      setItems(data.items || []);
    } catch (_) { setItems([]); }
  };

  const approve = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/applications/${selected._id}/approve`, {
        itemId: approveItemId || undefined,
        conditionOnDispatch: 'good',
      });
      toast.success('Application approved! Lease created.');
      setSelected(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Approval failed'); }
    finally { setActionLoading(false); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason required'); return; }
    setActionLoading(true);
    try {
      await api.patch(`/admin/applications/${selected._id}/reject`, { reason: rejectReason });
      toast.success('Application rejected.');
      setSelected(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <Layout breadcrumb="Applications">
      <div className="page-title">Lease Applications</div>
      <div className="page-sub">Review, approve, or reject NAVTTC graduate applications.</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', ''].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : apps.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Applicant</th><th>Kit</th><th>Trade</th><th>Institute</th><th>Applied</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a._id}>
                    <td data-label="Applicant"><div style={{fontWeight:600}}>{a.userId?.name}</div><div style={{fontSize:12,color:'var(--gray-400)'}}>{a.userId?.cnic} · {a.userId?.phone}</div></td>
                    <td data-label="Kit" style={{fontSize:13,fontWeight:500}}>{a.toolKitId?.name}<div style={{fontSize:11,color:'var(--gray-400)'}}>{fmtPKR(a.toolKitId?.monthlyRent)}/mo</div></td>
                    <td data-label="Trade"><Badge status={a.trade} /></td>
                    <td data-label="Institute" style={{fontSize:12}}>{a.institute}</td>
                    <td data-label="Applied" style={{fontSize:12}}>{fmtDate(a.createdAt)}</td>
                    <td data-label="Status"><Badge status={a.status} />{a.rejectionReason && <div style={{fontSize:11,color:'var(--red)',marginTop:3}}>Reason: {a.rejectionReason}</div>}</td>
                    <td data-label="Action">
                      {a.status === 'pending'
                        ? <button className="btn btn-primary btn-sm" onClick={() => openReview(a)}>Review</button>
                        : <span style={{fontSize:12,color:'var(--gray-400)'}}>Reviewed {fmtDate(a.reviewedAt)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty"><div className="e-icon"></div><p>No {statusFilter} applications.</p></div>}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="modal-bg open">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <div className="modal-title">Review Application</div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            {/* Applicant summary */}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{selected.userId?.name}</div>
              {[['Kit', selected.toolKitId?.name],['Monthly Rent', fmtPKR(selected.toolKitId?.monthlyRent)],['Trade', selected.trade],['Institute', selected.institute],['Graduation Date', fmtDate(selected.gradDate)],['Address', selected.address],['CNIC', selected.userId?.cnic],['Phone', selected.userId?.phone]].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid var(--gray-200)' }}>
                  <span style={{ color: 'var(--gray-600)', fontWeight: 600 }}>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <a href={`/uploads/${selected.cnicDocPath}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View CNIC</a>
              <a href={`/uploads/${selected.certDocPath}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View Certificate</a>
            </div>

            {/* Approve section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}> Approve & Assign Item</div>
              {items.length > 0 ? (
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label">Select Item to Assign <span style={{color:'var(--gray-400)',fontWeight:400}}>(or leave blank for auto-assign)</span></label>
                  <select className="form-control" value={approveItemId} onChange={e => setApproveItemId(e.target.value)}>
                    <option value="">Auto-assign first available</option>
                    {items.map(item => <option key={item._id} value={item._id}>{item.serialNumber} — Condition: {item.condition}</option>)}
                  </select>
                </div>
              ) : (
                <div className="alert alert-warn" style={{ marginBottom: 8 }}>No available units of this kit type. Cannot approve.</div>
              )}
              <button className="btn btn-primary" disabled={actionLoading || items.length === 0} onClick={approve}>
                {actionLoading ? 'Approving...' : `Approve & Create Lease`}
              </button>
            </div>

            <div className="divider" />

            {/* Reject section */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Reject Application</div>
              <div className="form-group">
                <label className="form-label">Reason for Rejection</label>
                <textarea className="form-control" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Documents not clear, CNIC expired..." />
              </div>
              <button className="btn btn-danger" disabled={actionLoading} onClick={reject}>
                {actionLoading ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
