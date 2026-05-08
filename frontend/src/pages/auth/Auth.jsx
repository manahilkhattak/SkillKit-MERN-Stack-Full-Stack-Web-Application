// src/pages/auth/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function Login() {
  const { login } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', f);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      nav(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f4f6f9',padding:20 }}>
      <div style={{ width:'100%',maxWidth:420 }}>
        <div style={{ textAlign:'center',marginBottom:28 }}>
          <div style={{ fontSize:36,marginBottom:8 }}></div>
          <h1 style={{ fontSize:26,color:'#1a5c2e',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Skill<span style={{ color:'#2e9e50' }}>Kit</span></h1>
          <p style={{ color:'#9aa3af',fontSize:13 }}>Vocational Tool Leasing Platform</p>
        </div>
        <div className="card">
          <h2 style={{ marginBottom:20,fontSize:18 }}>Log In</h2>
          {error && <div className="alert alert-danger" style={{ marginBottom:16 }}>{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group"><label className="form-label">Email Address</label>
              <input className="form-control" type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))} placeholder="you@example.com" required /></div>
            <div className="form-group"><label className="form-label">Password</label>
              <input className="form-control" type="password" value={f.password} onChange={e=>setF(p=>({...p,password:e.target.value}))} placeholder="••••••••" required /></div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
          </form>
        </div>
        <p style={{ textAlign:'center',marginTop:14,fontSize:13,color:'#545f6d' }}>New here? <Link to="/register">Create account</Link></p>
        <p style={{ textAlign:'center',marginTop:6,fontSize:12,color:'#9aa3af' }}><Link to="/">← Back to home</Link></p>
      </div>
    </div>
  );
}

// src/pages/auth/Register.jsx
export function Register() {
  const { login } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ name:'',email:'',password:'',confirm:'',phone:'',cnic:'',institute:'',trade:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const s = k => e => setF(p => ({...p,[k]:e.target.value}));

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Name required';
    if (!f.email) e.email = 'Email required';
    if (f.password.length < 8) e.password = 'Min 8 characters';
    if (f.password !== f.confirm) e.confirm = 'Passwords do not match';
    if (!f.phone.trim()) e.phone = 'Phone number required';
    if (!/^\d{13}$/.test(f.cnic)) e.cnic = 'Valid 13-digit CNIC required';
    setErrors(e); return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault(); if (!validate()) return; setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name:f.name,email:f.email,password:f.password,phone:f.phone,cnic:f.cnic,institute:f.institute,trade:f.trade });
      login(data.token, data.user);
      toast.success('Account created! Welcome to SkillKit.');
      nav('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fe = {}; err.response.data.errors.forEach(e => { fe[e.field] = e.message; }); setErrors(fe);
      }
    } finally { setLoading(false); }
  };

  const field = (key, label, type='text', placeholder='', required=false) => (
    <div className="form-group">
      <label className="form-label">{label}{!required && <span style={{color:'#9aa3af',fontWeight:400}}> (optional)</span>}</label>
      <input className={`form-control ${errors[key]?'err':''}`} type={type} value={f[key]} onChange={s(key)} placeholder={placeholder} />
      {errors[key] && <div className="form-err">{errors[key]}</div>}
    </div>
  );

  const trades = ['Plumbing','Electrical','Welding','HVAC','Tiling','Carpentry','Other'];

  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f4f6f9',padding:20 }}>
      <div style={{ width:'100%',maxWidth:520 }}>
        <div style={{ textAlign:'center',marginBottom:24 }}>
          <div style={{ fontSize:36,marginBottom:8 }}></div>
          <h1 style={{ fontSize:26,color:'#1a5c2e',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Skill<span style={{ color:'#2e9e50' }}>Kit</span></h1>
          <p style={{ color:'#9aa3af',fontSize:13 }}>Create your lessee account</p>
        </div>
        <div className="card">
          <h2 style={{ marginBottom:20,fontSize:18 }}>Create Account</h2>
          <form onSubmit={submit} noValidate>
            {field('name','Full Name','text','Muhammad Ali Khan',true)}
            {field('email','Email Address','email','ali@example.com',true)}
            <div className="form-row">
              <div className="form-group"><label className="form-label">Password</label>
                <input className={`form-control ${errors.password?'err':''}`} type="password" value={f.password} onChange={s('password')} placeholder="Min 8 characters" />
                {errors.password && <div className="form-err">{errors.password}</div>}</div>
              <div className="form-group"><label className="form-label">Confirm Password</label>
                <input className={`form-control ${errors.confirm?'err':''}`} type="password" value={f.confirm} onChange={s('confirm')} placeholder="Repeat password" />
                {errors.confirm && <div className="form-err">{errors.confirm}</div>}</div>
            </div>
            <div className="form-row">
              {field('phone','Phone','tel','03001234567',true)}
              {field('cnic','CNIC (13 digits)','text','3520212345678',true)}
            </div>
            <div className="form-row">
              {field('institute','NAVTTC Institute','text','NAVTTC Rawalpindi')}
              <div className="form-group"><label className="form-label">Trade <span style={{color:'#9aa3af',fontWeight:400}}>(optional)</span></label>
                <select className="form-control" value={f.trade} onChange={s('trade')}>
                  <option value="">Select trade...</option>
                  {trades.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading?'Creating account...':'Create Account'}</button>
          </form>
        </div>
        <p style={{ textAlign:'center',marginTop:14,fontSize:13,color:'#545f6d' }}>Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
