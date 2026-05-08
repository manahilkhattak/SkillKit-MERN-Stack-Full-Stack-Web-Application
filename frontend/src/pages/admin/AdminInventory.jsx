import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, fmtDate, Badge } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Tool Kits (catalog management) ────────────────────────────
export function AdminKits() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'',trade:'',description:'',monthlyRent:'',replacementCost:'',leaseDuration:12,components:'' });

  const load = () => api.get('/kits').then(r => setKits(r.data.kits||[])).finally(()=>setLoading(false));
  useEffect(()=>{ load(); },[]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const components = form.components.split('\n').filter(Boolean).map(line => {
        const parts = line.split(',');
        return { name: parts[0]?.trim(), quantity: parseInt(parts[1])||1, unit: parts[2]?.trim()||'piece' };
      });
      const payload = { ...form, components, monthlyRent: parseFloat(form.monthlyRent), replacementCost: parseFloat(form.replacementCost), leaseDuration: parseInt(form.leaseDuration) };
      if (editing) await api.put(`/admin/kits/${editing}`, payload);
      else await api.post('/admin/kits', payload);
      toast.success(editing ? 'Kit updated' : 'Kit created');
      setShowForm(false); setEditing(null); setForm({name:'',trade:'',description:'',monthlyRent:'',replacementCost:'',leaseDuration:12,components:''});
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const startEdit = (kit) => {
    setEditing(kit._id);
    setForm({ name:kit.name, trade:kit.trade, description:kit.description||'', monthlyRent:kit.monthlyRent, replacementCost:kit.replacementCost, leaseDuration:kit.leaseDuration||12, components:kit.components?.map(c=>`${c.name},${c.quantity},${c.unit}`).join('\n')||'' });
    setShowForm(true);
  };

  const toggle = async (id) => {
    try { await api.patch(`/admin/kits/${id}/toggle`); toast.success('Updated'); load(); }
    catch (_) { toast.error('Failed'); }
  };

  const trades = ['Plumbing','Electrical','Welding','HVAC','Tiling','Carpentry','Other'];

  return (
    <Layout breadcrumb="Tool Kits">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><div className="page-title">Tool Kit Catalog</div><div className="page-sub">Master list of kit types. Add physical items separately.</div></div>
        <button className="btn btn-primary" onClick={()=>{setShowForm(f=>!f);setEditing(null);setForm({name:'',trade:'',description:'',monthlyRent:'',replacementCost:'',leaseDuration:12,components:''})}}>+ Add Kit Type</button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{marginBottom:16,fontSize:16}}>{editing?'Edit Kit':'New Kit Type'}</h3>
          <form onSubmit={save}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Kit Name</label><input className="form-control" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Plumbing Starter Kit" required /></div>
              <div className="form-group"><label className="form-label">Trade</label><select className="form-control" value={form.trade} onChange={e=>setForm(p=>({...p,trade:e.target.value}))} required><option value="">Select...</option>{trades.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Monthly Rent (PKR)</label><input className="form-control" type="number" value={form.monthlyRent} onChange={e=>setForm(p=>({...p,monthlyRent:e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Replacement Cost (PKR)</label><input className="form-control" type="number" value={form.replacementCost} onChange={e=>setForm(p=>({...p,replacementCost:e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Lease Duration (months)</label><input className="form-control" type="number" value={form.leaseDuration} onChange={e=>setForm(p=>({...p,leaseDuration:e.target.value}))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
            <div className="form-group">
              <label className="form-label">Components <span style={{color:'var(--gray-400)',fontWeight:400}}>(one per line: Name, Quantity, Unit)</span></label>
              <textarea className="form-control" rows={5} value={form.components} onChange={e=>setForm(p=>({...p,components:e.target.value}))} placeholder={"Hilti SDS Drill, 1, piece\nPipe Threader, 1, piece\nPipe Wrench, 2, piece"} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" type="submit">Save</button>
              <button className="btn btn-ghost" type="button" onClick={()=>{setShowForm(false);setEditing(null)}}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
        {kits.map(k => (
          <div key={k._id} className="card" style={{opacity:k.isActive?1:.6}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{k.trade}</div>
                <h3 style={{fontSize:15,marginBottom:2}}>{k.name}</h3>
              </div>
              <Badge status={k.isActive?'active':'retired'} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Monthly Rent</div><strong>{fmtPKR(k.monthlyRent)}</strong></div>
              <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 10px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Replacement</div><strong>{fmtPKR(k.replacementCost)}</strong></div>
              <div style={{background:'var(--green-pale)',borderRadius:6,padding:'8px 10px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>Available</div><strong style={{color:'var(--green)'}}>{k.counts?.available||0}</strong></div>
              <div style={{background:'var(--amb-pale)',borderRadius:6,padding:'8px 10px',fontSize:12}}><div style={{color:'var(--gray-400)',marginBottom:2}}>On Lease</div><strong>{k.counts?.onLease||0}</strong></div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline btn-sm" onClick={()=>startEdit(k)}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>toggle(k._id)}>{k.isActive?'Deactivate':'Activate'}</button>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="loading">Loading...</div>}
    </Layout>
  );
}

// ── Individual Tool Items ──────────────────────────────────────
export function AdminItems() {
  const [items, setItems] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ toolKitId:'', status:'' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ toolKitId:'', quantity:1, condition:'new', purchaseCost:'', notes:'' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v))).toString();
      const [i, k] = await Promise.all([api.get(`/admin/items?${params}`), api.get('/kits')]);
      setItems(i.data.items||[]); setKits(k.data.kits||[]);
    } catch(_){} finally{setLoading(false);}
  };

  useEffect(()=>{ load(); },[]);

  const addItems = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/items', { ...addForm, purchaseCost: addForm.purchaseCost ? parseFloat(addForm.purchaseCost) : undefined, quantity: parseInt(addForm.quantity) });
      toast.success(`${data.items.length} item(s) added`);
      setShowAdd(false); setAddForm({toolKitId:'',quantity:1,condition:'new',purchaseCost:'',notes:''});
      load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try { await api.patch(`/admin/items/${id}/status`, { status }); toast.success('Status updated'); load(); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const updateCondition = async (id, condition) => {
    try { await api.patch(`/admin/items/${id}/condition`, { condition }); toast.success('Condition updated'); load(); }
    catch(err) { toast.error('Failed'); }
  };

  return (
    <Layout breadcrumb="Physical Items">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><div className="page-title">Physical Tool Items</div><div className="page-sub">Individual kit units, each with unique serial number, condition, and status.</div></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(f=>!f)}>+ Add Items</button>
      </div>

      {showAdd && (
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{marginBottom:16,fontSize:16}}>Add Physical Items to Inventory</h3>
          <form onSubmit={addItems}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Kit Type</label>
                <select className="form-control" value={addForm.toolKitId} onChange={e=>setAddForm(p=>({...p,toolKitId:e.target.value}))} required>
                  <option value="">Select kit type...</option>
                  {kits.map(k=><option key={k._id} value={k._id}>{k.name}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Quantity to Add</label><input className="form-control" type="number" min="1" max="50" value={addForm.quantity} onChange={e=>setAddForm(p=>({...p,quantity:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Initial Condition</label>
                <select className="form-control" value={addForm.condition} onChange={e=>setAddForm(p=>({...p,condition:e.target.value}))}>
                  {['new','good','fair','poor'].map(c=><option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Purchase Cost (PKR)</label><input className="form-control" type="number" value={addForm.purchaseCost} onChange={e=>setAddForm(p=>({...p,purchaseCost:e.target.value}))} placeholder="Optional" /></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><input className="form-control" value={addForm.notes} onChange={e=>setAddForm(p=>({...p,notes:e.target.value}))} placeholder="Any notes about this batch..." /></div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" type="submit">Add to Inventory</button>
              <button className="btn btn-ghost" type="button" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div className="form-group" style={{marginBottom:0,flex:1,minWidth:200}}><label className="form-label">Kit Type</label>
            <select className="form-control" value={filters.toolKitId} onChange={e=>setFilters(p=>({...p,toolKitId:e.target.value}))}>
              <option value="">All Kit Types</option>
              {kits.map(k=><option key={k._id} value={k._id}>{k.name}</option>)}
            </select></div>
          <div className="form-group" style={{marginBottom:0}}><label className="form-label">Status</label>
            <select className="form-control" value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}>
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="on_lease">On Lease</option>
              <option value="under_maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select></div>
          <button className="btn btn-primary" onClick={load}>Filter</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : items.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Serial Number</th><th>Kit Type</th><th>Status</th><th>Condition</th><th>Current Lessee</th><th>Added</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td data-label="Serial"><code style={{fontSize:12,background:'var(--bg)',padding:'2px 6px',borderRadius:4}}>{item.serialNumber}</code></td>
                    <td data-label="Kit" style={{fontWeight:600,fontSize:13}}>{item.toolKitId?.name}</td>
                    <td data-label="Status"><Badge status={item.status} /></td>
                    <td data-label="Condition">
                      <select className="form-control" style={{width:'auto',minHeight:32,padding:'4px 8px',fontSize:12}} value={item.condition} onChange={e=>updateCondition(item._id,e.target.value)} disabled={item.status==='on_lease'}>
                        {['new','good','fair','poor'].map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td data-label="Lessee" style={{fontSize:12}}>{item.currentLesseeId ? <><div style={{fontWeight:600}}>{item.currentLesseeId.name}</div><div style={{color:'var(--gray-400)'}}>{item.currentLesseeId.phone}</div></> : '—'}</td>
                    <td data-label="Added" style={{fontSize:12}}>{fmtDate(item.createdAt)}</td>
                    <td data-label="Actions">
                      {item.status !== 'on_lease' && (
                        <select className="form-control" style={{width:'auto',minHeight:32,padding:'4px 8px',fontSize:12}} value={item.status} onChange={e=>updateStatus(item._id,e.target.value)}>
                          <option value="available">Available</option>
                          <option value="under_maintenance">Maintenance</option>
                          <option value="retired">Retired</option>
                        </select>
                      )}
                      {item.status === 'on_lease' && <span style={{fontSize:12,color:'var(--gray-400)'}}>On lease</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty"><div className="e-icon"></div><p>No items found.</p></div>}
      </div>
    </Layout>
  );
}
