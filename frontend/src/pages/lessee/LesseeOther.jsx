// ── Notifications ─────────────────────────────────────────────
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const icon = { lease:'📋', payment:'💳', wallet:'💰', application:'📝', account:'👤', system:'⚙️' };

export function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await api.get('/notifications'); setNotifs(data.notifications || []); }
    catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    try { await api.patch('/notifications/read-all'); toast.success('All marked as read'); load(); }
    catch (_) { toast.error('Failed'); }
  };

  const markOne = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); load(); } catch (_) {}
  };

  const unread = notifs.filter(n => !n.read).length;

  if (loading) return <Layout breadcrumb="Notifications"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout breadcrumb="Notifications">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">
            Notifications
            {unread > 0 && <span style={{ marginLeft: 10, background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 50, padding: '2px 9px' }}>{unread}</span>}
          </div>
          <div className="page-sub">Alerts about your lease, payments and account.</div>
        </div>
        {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAll}>✓ Mark all read</button>}
      </div>

      {notifs.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifs.map(n => (
            <div key={n._id} onClick={() => !n.read && markOne(n._id)} style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 'var(--radius)', border: `1px solid ${n.read ? 'var(--gray-200)' : 'var(--green-mid)'}`, background: n.read ? '#fff' : 'var(--green-pale)', cursor: n.read ? 'default' : 'pointer', transition: 'background var(--ease)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon[n.type] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fmtDateTime(n.createdAt)}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty"><div className="e-icon">🔔</div><p>No notifications yet.</p></div>
      )}
    </Layout>
  );
}

// ── Profile ────────────────────────────────────────────────────
export function Profile() {
  const [form, setForm] = useState({ name: '', phone: '', cnic: '', institute: '', trade: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data.user;
      setUser(u);
      setForm({ name: u.name || '', phone: u.phone || '', cnic: u.cnic || '', institute: u.institute || '', trade: u.trade || '' });
    });
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.put('/auth/profile', form); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) { toast.error('Passwords do not match'); return; }
    if (pw.newPassword.length < 8) { toast.error('Min 8 characters'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed!');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPwLoading(false); }
  };

  const trades = ['Plumbing','Electrical','Welding','HVAC','Tiling','Carpentry','Other'];

  return (
    <Layout breadcrumb="Profile">
      <div className="page-title">My Profile</div>
      <div className="page-sub">Update your personal and contact details.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Personal Details</span></div>
          <form onSubmit={updateProfile}>
            {[['name','Full Name','text','Muhammad Ali'],['phone','Phone','tel','03001234567'],['cnic','CNIC','text','3520212345678'],['institute','NAVTTC Institute','text','NAVTTC Rawalpindi']].map(([k,l,t,ph]) => (
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <input className="form-control" type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Trade</label>
              <select className="form-control" value={form.trade} onChange={e=>setForm(p=>({...p,trade:e.target.value}))}>
                <option value="">Select trade</option>
                {trades.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Change Password</span></div>
          <form onSubmit={changePassword}>
            {[['currentPassword','Current Password'],['newPassword','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <input className="form-control" type="password" value={pw[k]} onChange={e=>setPw(p=>({...p,[k]:e.target.value}))} placeholder="••••••••" required />
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={pwLoading}>{pwLoading?'Changing...':'Change Password'}</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
