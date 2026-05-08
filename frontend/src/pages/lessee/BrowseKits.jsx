import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR, Badge } from '../../utils/helpers';

export default function BrowseKits() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/kits').then(r => setKits(r.data.kits || [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? kits.filter(k => k.trade === filter) : kits;
  const trades = [...new Set(kits.map(k => k.trade))];

  if (loading) return <Layout breadcrumb="Browse Kits"><div className="loading">Loading kits...</div></Layout>;

  return (
    <Layout breadcrumb="Browse Kits">
      <div className="page-title">Starter Kit Catalog</div>
      <div className="page-sub">Browse available tool kits by trade. Each kit type shows live unit availability.</div>

      {/* Trade filter */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
        <button className={`btn btn-sm ${!filter?'btn-primary':'btn-ghost'}`} onClick={() => setFilter('')}>All Trades</button>
        {trades.map(t => <button key={t} className={`btn btn-sm ${filter===t?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(t)}>{t}</button>)}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
        {filtered.map(kit => (
          <div key={kit._id} className={`kit-card ${kit.counts?.available === 0 ? 'unavailable' : ''}`} onClick={() => kit.counts?.available > 0 && setSelected(kit)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>{kit.trade}</div>
                <h3 style={{fontSize:16,marginBottom:4}}>{kit.name}</h3>
              </div>
              <Badge status={kit.counts?.available > 0 ? 'available' : 'on_lease'} />
            </div>
            <p style={{fontSize:12,color:'var(--gray-600)',marginBottom:14,lineHeight:1.8}}>
              {kit.components?.map(c => c.name).join(' · ')}
            </p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:'var(--green)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {fmtPKR(kit.monthlyRent)}<small style={{fontSize:12,fontWeight:400,color:'var(--gray-400)'}}>/mo</small>
                </div>
                <div style={{fontSize:11,color:'var(--gray-400)'}}>{kit.leaseDuration} months · {fmtPKR(kit.replacementCost)} replacement value</div>
              </div>
              <div style={{fontSize:12,fontWeight:600,color: kit.counts?.available > 0 ? 'var(--green)' : 'var(--red)'}}>
                {kit.counts?.available} available
              </div>
            </div>
            {kit.counts?.available > 0 && (
              <div style={{marginTop:14}}><Link to="/apply" className="btn btn-primary btn-sm">Apply for this Kit →</Link></div>
            )}
          </div>
        ))}
      </div>

      {/* Kit detail modal */}
      {selected && (
        <div className="modal-bg open">
          <div className="modal" style={{maxWidth:540}}>
            <div className="modal-head">
              <div className="modal-title">{selected.name}</div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{marginBottom:16}}>
              <Badge status={selected.trade} />&nbsp;&nbsp;
              <span style={{fontSize:13,color:'var(--gray-400)'}}>{selected.leaseDuration}-month lease</span>
            </div>
            <p style={{fontSize:13,color:'var(--gray-600)',marginBottom:16}}>{selected.description}</p>
            <h4 style={{marginBottom:10,fontSize:14}}>Components Included</h4>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
              {selected.components?.map((c, i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',background:'var(--bg)',borderRadius:6,fontSize:13}}>
                  <span>{c.name}</span>
                  <span style={{color:'var(--gray-400)'}}>{c.quantity} {c.unit}</span>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
              <div className="stat" style={{padding:'12px 16px'}}>
                <div className="stat-label">Monthly Rent</div>
                <div style={{fontSize:20,fontWeight:800,color:'var(--green)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{fmtPKR(selected.monthlyRent)}</div>
              </div>
              <div className="stat" style={{padding:'12px 16px'}}>
                <div className="stat-label">Replacement Value</div>
                <div style={{fontSize:16,fontWeight:700}}>{fmtPKR(selected.replacementCost)}</div>
              </div>
              <div className="stat" style={{padding:'12px 16px'}}>
                <div className="stat-label">Units Available</div>
                <div style={{fontSize:20,fontWeight:800,color:'var(--green)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{selected.counts?.available}</div>
              </div>
              <div className="stat" style={{padding:'12px 16px'}}>
                <div className="stat-label">Lease Duration</div>
                <div style={{fontSize:16,fontWeight:700}}>{selected.leaseDuration} months</div>
              </div>
            </div>
            <Link to="/apply" className="btn btn-primary btn-full" onClick={() => setSelected(null)}>Apply for This Kit →</Link>
          </div>
        </div>
      )}
    </Layout>
  );
}
