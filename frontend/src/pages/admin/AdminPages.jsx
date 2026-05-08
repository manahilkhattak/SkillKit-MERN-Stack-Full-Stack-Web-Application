import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDate, fmtDateTime, Badge, ordinal } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Admin Leases ───────────────────────────────────────────────
export function AdminLeases() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [selected, setSelected] = useState(null);
  const [leasePayments, setLeasePayments] = useState([]);
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({ conditionOnReturn: 'good', reason: '', returnNotes: '' });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/admin/leases${filter ? `?status=${filter}` : ''}`); setLeases(data.leases||[]); }
    catch(_){} finally{setLoading(false);}
  };

  const openLease = async (lease) => {
    setSelected(lease);
    try { const { data } = await api.get(`/admin/leases/${lease._id}`); setLeasePayments(data.payments||[]); }
    catch(_) { setLeasePayments([]); }
  };

  const doAction = async (action) => {
    try {
      const endpoint = action === 'complete' ? `/admin/leases/${selected._id}/complete` : `/admin/leases/${selected._id}/terminate`;
      await api.patch(endpoint, actionForm);
      toast.success(`Lease ${action}d successfully`);
      setActionModal(null); setSelected(null); load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  useEffect(()=>{ load(); },[filter]);

  return (
    <Layout breadcrumb="Active Leases">
      <div className="page-title">Lease Management</div>
      <div className="page-sub">All Ijarah lease contracts. Approve returns and manage lease lifecycle.</div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {['active','completed','terminated','defaulted',''].map(s=>(
          <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(s)}>{s||'All'}</button>
        ))}
      </div>
      <div className="card">
        {loading?<div className="loading">Loading...</div>:leases.length?(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lessee</th><th>Kit</th><th>Item Serial</th><th>Start</th><th>End</th><th>Rent/mo</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {leases.map(l=>(
                  <tr key={l._id}>
                    <td data-label="Lessee"><div style={{fontWeight:600}}>{l.userId?.name}</div><div style={{fontSize:12,color:'var(--gray-400)'}}>{l.userId?.phone}</div></td>
                    <td data-label="Kit" style={{fontSize:13}}>{l.toolKitId?.name}</td>
                    <td data-label="Serial"><code style={{fontSize:11}}>{l.toolItemId?.serialNumber}</code></td>
                    <td data-label="Start" style={{fontSize:12}}>{fmtDate(l.startDate)}</td>
                    <td data-label="End" style={{fontSize:12}}>{fmtDate(l.endDate)}</td>
                    <td data-label="Rent" style={{fontWeight:700,color:'var(--green)'}}>{fmtPKR(l.monthlyRent)}</td>
                    <td data-label="Status"><Badge status={l.status} /></td>
                    <td data-label="Action"><button className="btn btn-outline btn-sm" onClick={()=>openLease(l)}>Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):<div className="empty"><div className="e-icon"></div><p>No {filter} leases.</p></div>}
      </div>

      {/* Lease detail modal */}
      {selected && (
        <div className="modal-bg open">
          <div className="modal" style={{maxWidth:600}}>
            <div className="modal-head">
              <div className="modal-title">{selected.toolKitId?.name} — {selected.userId?.name}</div>
              <button className="modal-close" onClick={()=>setSelected(null)}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              {[['Serial',<code style={{fontSize:11}}>{selected.toolItemId?.serialNumber}</code>],['Status',<Badge status={selected.status}/>],['Start Date',fmtDate(selected.startDate)],['End Date',fmtDate(selected.endDate)],['Monthly Rent',fmtPKR(selected.monthlyRent)],['Condition (dispatch)',selected.conditionOnDispatch||'—'],].map(([k,v])=>(
                <div key={k} style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>{k}</div><strong>{v}</strong></div>
              ))}
            </div>
            <h4 style={{marginBottom:10,fontSize:14}}>Payment Schedule</h4>
            <div style={{maxHeight:200,overflowY:'auto',marginBottom:16}}>
              {leasePayments.map(p=>(
                <div key={p._id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                  <span>{ordinal(p.installmentNo)} — Due {fmtDate(p.dueDate)}</span>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}><span>{fmtPKR(p.amount)}</span><Badge status={p.status}/></div>
                </div>
              ))}
            </div>
            {selected.status==='active' && (
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>setActionModal('complete')}> Mark Returned</button>
                <button className="btn btn-danger btn-sm" onClick={()=>setActionModal('terminate')}> Terminate</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">{actionModal==='complete'?'Mark as Returned':'Terminate Lease'}</div>
              <button className="modal-close" onClick={()=>setActionModal(null)}>×</button>
            </div>
            <div className="form-group"><label className="form-label">Condition on Return</label>
              <select className="form-control" value={actionForm.conditionOnReturn} onChange={e=>setActionForm(p=>({...p,conditionOnReturn:e.target.value}))}>
                {['new','good','fair','poor'].map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            {actionModal==='terminate' && <div className="form-group"><label className="form-label">Reason for Termination</label><input className="form-control" value={actionForm.reason} onChange={e=>setActionForm(p=>({...p,reason:e.target.value}))} placeholder="e.g. Non-payment for 3 months" /></div>}
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={actionForm.returnNotes} onChange={e=>setActionForm(p=>({...p,returnNotes:e.target.value}))} /></div>
            <div style={{display:'flex',gap:8}}>
              <button className={`btn ${actionModal==='complete'?'btn-primary':'btn-danger'}`} onClick={()=>doAction(actionModal)}>Confirm</button>
              <button className="btn btn-ghost" onClick={()=>setActionModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Admin Payments ─────────────────────────────────────────────
export function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/admin/payments${filter?`?status=${filter}`:''}`); setPayments(data.payments||[]); }
    catch(_){} finally{setLoading(false);}
  };

  useEffect(()=>{ load(); },[filter]);

  return (
    <Layout breadcrumb="Payments">
      <div className="page-title">Lease Payments</div>
      <div className="page-sub">All installment records across all active and historical leases.</div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[['','All'],['paid','Paid'],['overdue','Overdue'],['due','Due'],['upcoming','Upcoming']].map(([v,l])=>(
          <button key={v} className={`btn btn-sm ${filter===v?'btn-primary':'btn-ghost'}`} onClick={()=>setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="card">
        {loading?<div className="loading">Loading...</div>:payments.length?(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lessee</th><th>Kit</th><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Paid At</th><th>Ref</th></tr></thead>
              <tbody>
                {payments.map(p=>(
                  <tr key={p._id} style={p.status==='overdue'?{background:'#fff8f8'}:{}}>
                    <td data-label="Lessee"><div style={{fontWeight:600}}>{p.userId?.name}</div><div style={{fontSize:12,color:'var(--gray-400)'}}>{p.userId?.phone}</div></td>
                    <td data-label="Kit" style={{fontSize:13}}>{p.toolKitId?.name}</td>
                    <td data-label="#" style={{textAlign:'center'}}>{p.installmentNo}</td>
                    <td data-label="Due" style={{fontSize:12}}>{fmtDate(p.dueDate)}</td>
                    <td data-label="Amount" style={{fontWeight:700,color:p.status==='paid'?'var(--green)':p.status==='overdue'?'var(--red)':'inherit'}}>{fmtPKR(p.amount)}</td>
                    <td data-label="Status"><Badge status={p.status}/></td>
                    <td data-label="Paid At" style={{fontSize:12}}>{p.paidAt?fmtDate(p.paidAt):'—'}</td>
                    <td data-label="Ref"><code style={{fontSize:11}}>{p.transactionRef||'—'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):<div className="empty"><div className="e-icon"></div><p>No {filter} payments.</p></div>}
      </div>
    </Layout>
  );
}

// ── Admin Flagged Transactions ─────────────────────────────────
export function AdminFlagged() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ api.get('/admin/transactions/flagged').then(r=>setTxs(r.data.transactions||[])).finally(()=>setLoading(false)); },[]);
  return (
    <Layout breadcrumb="Flagged Transactions">
      <div className="page-title">Flagged Transactions</div>
      <div className="page-sub">Wallet deposits and withdrawals flagged by suspicious activity rules.</div>
      <div className="card" style={{marginBottom:20,background:'var(--red-pale)',border:'1px solid #f5a5a5'}}>
        <div className="card-title" style={{marginBottom:10}}>Active Suspicious Rules</div>
        <div style={{fontSize:13,display:'grid',gap:4}}>
          <div><strong>Rule 1:</strong> Single deposit exceeds PKR 200,000</div>
          <div><strong>Rule 2:</strong> More than 5 wallet operations within 10 minutes</div>
          <div><strong>Rule 3:</strong> More than 3 failed transactions in a single day</div>
          <div><strong>Rule 4:</strong> Same deposit amount used 3+ times within 24 hours</div>
          <div><strong>Rule 5:</strong> Account registered less than 7 days ago deposits more than PKR 50,000</div>
        </div>
      </div>
      <div className="card">
        {loading?<div className="loading">Loading...</div>:txs.length?(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Transaction ID</th><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Reasons</th><th>Date</th></tr></thead>
              <tbody>
                {txs.map(tx=>(
                  <tr key={tx._id} style={{background:'#fff8f8'}}>
                    <td data-label="ID"><code style={{fontSize:11}}>{tx.transactionId}</code></td>
                    <td data-label="User"><div style={{fontWeight:600}}>{tx.userId?.name}</div><div style={{fontSize:12,color:'var(--gray-400)'}}>{tx.userId?.email}</div></td>
                    <td data-label="Type">{tx.type.replace('_',' ')}</td>
                    <td data-label="Amount" style={{fontWeight:700,color:'var(--red)'}}>{fmtPKR(tx.amount)}</td>
                    <td data-label="Status"><Badge status={tx.status}/></td>
                    <td data-label="Reasons" style={{fontSize:12,maxWidth:250}}>{tx.suspiciousReasons?.map((r,i)=><div key={i} style={{marginBottom:2}}>• {r}</div>)}</td>
                    <td data-label="Date" style={{fontSize:12}}>{fmtDateTime(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):<div className="empty"><div className="e-icon"></div><p>No flagged transactions.</p></div>}
      </div>
    </Layout>
  );
}

// ── Admin Users ────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({...(search&&{search}),...(statusFilter&&{status:statusFilter})}).toString();
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users||[]);
    } catch(_){} finally{setLoading(false);}
  };

  useEffect(()=>{ load(); },[]);

  const openDetail = async (user) => {
    setSelected(user);
    try { const { data } = await api.get(`/admin/users/${user._id}`); setDetail(data); }
    catch(_) { setDetail(null); }
  };

  const blockUnblock = async (id, action) => {
    try {
      await api.patch(`/admin/users/${id}/${action}`);
      toast.success(`User ${action}ed`);
      setSelected(null); setDetail(null); load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  return (
    <Layout breadcrumb="Lessees">
      <div className="page-title">Lessee Management</div>
      <div className="page-sub">View, search, and manage all registered lessees.</div>
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div className="form-group" style={{marginBottom:0,flex:1,minWidth:200}}><label className="form-label">Search</label>
            <input className="form-control" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email, CNIC..." onKeyDown={e=>e.key==='Enter'&&load()} /></div>
          <div className="form-group" style={{marginBottom:0}}><label className="form-label">Status</label>
            <select className="form-control" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">All</option><option value="active">Active</option><option value="blocked">Blocked</option>
            </select></div>
          <button className="btn btn-primary" onClick={load}>Search</button>
        </div>
      </div>
      <div className="card">
        {loading?<div className="loading">Loading...</div>:users.length?(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>CNIC</th><th>Trade</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u._id}>
                    <td data-label="Name" style={{fontWeight:600}}>{u.name}</td>
                    <td data-label="Email" style={{fontSize:13}}>{u.email}</td>
                    <td data-label="Phone" style={{fontSize:12}}>{u.phone||'—'}</td>
                    <td data-label="CNIC" style={{fontSize:12}}>{u.cnic||'—'}</td>
                    <td data-label="Trade">{u.trade?<Badge status={u.trade}/>:'—'}</td>
                    <td data-label="Status"><Badge status={u.status}/></td>
                    <td data-label="Joined" style={{fontSize:12}}>{fmtDate(u.createdAt)}</td>
                    <td data-label="Action" style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openDetail(u)}>Details</button>
                      {u.status==='active'
                        ?<button className="btn btn-danger btn-sm" onClick={()=>blockUnblock(u._id,'block')}>Block</button>
                        :<button className="btn btn-primary btn-sm" onClick={()=>blockUnblock(u._id,'unblock')}>Unblock</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):<div className="empty"><div className="e-icon"></div><p>No users found.</p></div>}
      </div>

      {/* User detail modal */}
      {selected && detail && (
        <div className="modal-bg open">
          <div className="modal" style={{maxWidth:580}}>
            <div className="modal-head">
              <div className="modal-title">{selected.name}</div>
              <button className="modal-close" onClick={()=>{setSelected(null);setDetail(null)}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
              <div style={{background:'var(--bg)',borderRadius:6,padding:'10px 12px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Wallet Balance</div><strong style={{color:'var(--green)',fontSize:16}}>{fmtPKR(detail.wallet?.balance)}</strong></div>
              <div style={{background:'var(--bg)',borderRadius:6,padding:'10px 12px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Active Lease</div><strong>{detail.activeLease?detail.activeLease.toolKitId?.name:'None'}</strong></div>
              <div style={{background:'var(--bg)',borderRadius:6,padding:'10px 12px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Institute</div><strong>{selected.institute||'—'}</strong></div>
              <div style={{background:'var(--bg)',borderRadius:6,padding:'10px 12px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Trade</div><strong>{selected.trade||'—'}</strong></div>
            </div>
            <h4 style={{fontSize:14,marginBottom:8}}>Application History</h4>
            {detail.applications?.map(a=>(
              <div key={a._id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                <span>{a.toolKitId?.name}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{color:'var(--gray-400)',fontSize:12}}>{fmtDate(a.createdAt)}</span><Badge status={a.status}/></div>
              </div>
            ))}
            <div style={{marginTop:16,display:'flex',gap:8}}>
              {selected.status==='active'
                ?<button className="btn btn-danger" onClick={()=>blockUnblock(selected._id,'block')}>Block User</button>
                :<button className="btn btn-primary" onClick={()=>blockUnblock(selected._id,'unblock')}>Unblock User</button>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Admin Reports ──────────────────────────────────────────────
const COLORS = ['#22783c','#f59e0b','#3b82f6','#dc3545','#8b5cf6'];

export function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/admin/reports/revenue?months=12').then(r=>setReport(r.data)).finally(()=>setLoading(false));
  },[]);

  const revenueChart = (report?.revenue||[]).map(d=>({
    month:`${d._id.y}-${String(d._id.m).padStart(2,'0')}`, revenue:d.total, count:d.count,
  }));

  const tradeChart = (report?.byTrade||[]).map(d=>({ name:d._id, value:d.total }));

  if(loading) return <Layout breadcrumb="Reports"><div className="loading">Loading...</div></Layout>;

  return (
    <Layout breadcrumb="Revenue Reports">
      <div className="page-title">Revenue Reports</div>
      <div className="page-sub">Lease payment revenue, trade breakdown, and system wallet summary.</div>
      {report?.systemWallet && (
        <div className="stat-grid" style={{marginBottom:24}}>
          <div className="stat"><div className="stat-icon"></div><div className="stat-label">Total Wallet Balance (System)</div><div className="stat-val" style={{fontSize:18}}>{fmtPKR(report.systemWallet.total)}</div></div>
          <div className="stat"><div className="stat-icon"></div><div className="stat-label">Total Ever Deposited</div><div className="stat-val" style={{fontSize:18}}>{fmtPKR(report.systemWallet.deposited)}</div></div>
        </div>
      )}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-header"><span className="card-title">Monthly Revenue — Last 12 Months</span></div>
        {revenueChart.length?(
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueChart} margin={{top:10,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>fmtPKR(v)}/>
              <Bar dataKey="revenue" name="Revenue" fill="#22783c" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ):<div className="empty"><p>No payment data yet.</p></div>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Revenue by Trade</span></div>
          {tradeChart.length?(
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={tradeChart} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {tradeChart.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v=>fmtPKR(v)}/><Legend/>
              </PieChart>
            </ResponsiveContainer>
          ):<div className="empty"><p>No data.</p></div>}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Revenue Summary by Trade</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trade</th><th>Total Revenue</th><th>Payments</th></tr></thead>
              <tbody>
                {(report?.byTrade||[]).map(d=>(
                  <tr key={d._id}>
                    <td data-label="Trade" style={{fontWeight:600}}>{d._id}</td>
                    <td data-label="Revenue" style={{fontWeight:700,color:'var(--green)'}}>{fmtPKR(d.total)}</td>
                    <td data-label="Count">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
