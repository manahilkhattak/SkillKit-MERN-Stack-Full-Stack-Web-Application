import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { fmtPKR } from '../../utils/helpers';
import toast from 'react-hot-toast';

const UploadZone = ({ id, label, file, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div className={`upload-zone ${file ? 'has-file' : ''}`} onClick={() => document.getElementById(id).click()}>
      <input id={id} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => onChange(e.target.files[0])} />
      <div style={{fontSize:28,marginBottom:8}}>📄</div>
      <div style={{fontSize:13,color:'var(--gray-400)'}}>{file ? `✓ ${file.name}` : 'Click to upload (JPEG, PNG, PDF · max 3MB)'}</div>
    </div>
  </div>
);

export default function Apply() {
  const nav = useNavigate();
  const [kits, setKits] = useState([]);
  const [step, setStep] = useState(0);
  const [selectedKit, setSelectedKit] = useState(null);
  const [form, setForm] = useState({ address: '', institute: '', trade: '', gradDate: '' });
  const [cnicDoc, setCnicDoc] = useState(null);
  const [certDoc, setCertDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if already has active lease/application
    Promise.all([api.get('/leases/mine'), api.get('/applications/mine')]).then(([l, a]) => {
      if (l.data.lease) { toast.error('You already have an active lease.'); nav('/my-lease'); return; }
      const pending = a.data.applications?.find(ap => ap.status === 'pending');
      if (pending) { toast.error('You already have a pending application.'); nav('/dashboard'); return; }
    });
    api.get('/kits').then(r => setKits((r.data.kits || []).filter(k => k.counts?.available > 0)));
  }, []);

  const validateStep1 = () => {
    const e = {};
    if (!form.address.trim()) e.address = 'Address required';
    if (!form.institute.trim()) e.institute = 'Institute required';
    if (!form.trade) e.trade = 'Trade required';
    if (!form.gradDate) e.gradDate = 'Graduation date required';
    setErrors(e); return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!cnicDoc || !certDoc) { toast.error('Both documents are required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('toolKitId', selectedKit._id);
      fd.append('address', form.address);
      fd.append('institute', form.institute);
      fd.append('trade', form.trade);
      fd.append('gradDate', form.gradDate);
      fd.append('cnicDoc', cnicDoc);
      fd.append('certDoc', certDoc);
      const { data } = await api.post('/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(data.application);
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  const trades = ['Plumbing','Electrical','Welding','HVAC','Tiling','Carpentry','Other'];
  const steps = ['Personal Info', 'Choose Kit', 'Documents'];

  if (success) return (
    <Layout breadcrumb="Apply">
      <div style={{maxWidth:500,margin:'60px auto',textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:16}}></div>
        <h2 style={{marginBottom:8}}>Application Submitted!</h2>
        <p style={{color:'var(--gray-600)',marginBottom:8}}>Your reference number is <strong>#{success._id.toString().slice(-8).toUpperCase()}</strong></p>
        <p style={{color:'var(--gray-400)',fontSize:13,marginBottom:24}}>You will receive a notification within 2 business days. Track your status in your dashboard.</p>
        <button className="btn btn-primary" onClick={() => nav('/dashboard')}>Back to Dashboard</button>
      </div>
    </Layout>
  );

  return (
    <Layout breadcrumb="Apply for Lease">
      <div className="page-title">Apply for a Starter Kit</div>
      <div className="page-sub">Complete all three steps to submit your lease application.</div>

      {/* Stepper */}
      <div className="steps" style={{maxWidth:600,marginBottom:28}}>
        {steps.map((s, i) => (<>
          <div key={s} className={`step ${i===step?'active':i<step?'done':''}`}>
            <div className="step-circle">{i<step?'✓':i+1}</div>
            <div className="step-label">{s}</div>
          </div>
          {i < steps.length-1 && <div className={`step-line ${i<step?'done':''}`} key={`line-${i}`} />}
        </>))}
      </div>

      <div className="card" style={{maxWidth:600}}>
        {/* Step 0: Personal info */}
        {step === 0 && (
          <div>
            <h3 style={{marginBottom:16,fontSize:16}}>Step 1 — Personal & Education Details</h3>
            <div className="form-group">
              <label className="form-label">Current Residential Address</label>
              <textarea className={`form-control ${errors.address?'err':''}`} rows={2} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="House 5, Street 10, Rawalpindi" />
              {errors.address && <div className="form-err">{errors.address}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">NAVTTC Institute</label>
                <input className={`form-control ${errors.institute?'err':''}`} value={form.institute} onChange={e=>setForm(p=>({...p,institute:e.target.value}))} placeholder="NAVTTC Rawalpindi" />
                {errors.institute && <div className="form-err">{errors.institute}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Your Trade</label>
                <select className={`form-control ${errors.trade?'err':''}`} value={form.trade} onChange={e=>setForm(p=>({...p,trade:e.target.value}))}>
                  <option value="">Select...</option>
                  {trades.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.trade && <div className="form-err">{errors.trade}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Graduation Date</label>
              <input className={`form-control ${errors.gradDate?'err':''}`} type="date" value={form.gradDate} onChange={e=>setForm(p=>({...p,gradDate:e.target.value}))} max={new Date().toISOString().split('T')[0]} />
              {errors.gradDate && <div className="form-err">{errors.gradDate}</div>}
            </div>
            <button className="btn btn-primary" onClick={() => { if (validateStep1()) setStep(1); }}>Next: Choose Kit →</button>
          </div>
        )}

        {/* Step 1: Kit selection */}
        {step === 1 && (
          <div>
            <h3 style={{marginBottom:4,fontSize:16}}>Step 2 — Choose Your Starter Kit</h3>
            <p style={{fontSize:13,color:'var(--gray-400)',marginBottom:16}}>Only kits with available units are shown.</p>
            {kits.length === 0 && <div className="alert alert-warn">No kits are currently available. Check back soon.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              {kits.map(kit => (
                <div key={kit._id} className={`kit-card ${selectedKit?._id===kit._id?'selected':''}`} onClick={() => setSelectedKit(kit)} style={{padding:'14px 16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{kit.name}</div>
                      <div style={{fontSize:12,color:'var(--gray-600)',marginTop:2}}>{kit.components?.map(c=>c.name).join(' · ')}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:800,fontSize:16,color:'var(--green)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{fmtPKR(kit.monthlyRent)}/mo</div>
                      <div style={{fontSize:11,color:'var(--gray-400)'}}>{kit.counts?.available} units available</div>
                    </div>
                  </div>
                  {selectedKit?._id===kit._id && <div style={{marginTop:8,fontSize:12,color:'var(--green)',fontWeight:600}}>✓ Selected</div>}
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" disabled={!selectedKit} onClick={() => setStep(2)}>Next: Upload Documents →</button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div>
            <h3 style={{marginBottom:4,fontSize:16}}>Step 3 — Upload Documents</h3>
            <p style={{fontSize:13,color:'var(--gray-400)',marginBottom:16}}>Your CNIC and NAVTTC certificate are required for verification.</p>
            <UploadZone id="cnic-upload" label="CNIC (front and back, combined)" file={cnicDoc} onChange={setCnicDoc} />
            <UploadZone id="cert-upload" label="NAVTTC Certificate" file={certDoc} onChange={setCertDoc} />
            <div className="alert alert-info" style={{marginBottom:16}}>
               Submitting for: <strong>{selectedKit?.name}</strong> at <strong>{fmtPKR(selectedKit?.monthlyRent)}/month</strong> for {selectedKit?.leaseDuration} months.
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" disabled={loading || !cnicDoc || !certDoc} onClick={submit}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
