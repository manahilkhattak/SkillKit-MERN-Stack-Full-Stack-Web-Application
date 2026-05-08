import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 40px',height:64,background:'#fff',borderBottom:'1px solid #e2e6ea',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:'#1a5c2e' }}>Skill<span style={{ color:'#2e9e50' }}>Kit</span></div>
        <div style={{ display:'flex',gap:10 }}>
          <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#1a5c2e 0%,#2e9e50 100%)',color:'#fff',padding:'80px 40px',textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:16 }}></div>
        <h1 style={{ fontSize:'clamp(28px,5vw,52px)',color:'#fff',marginBottom:16 }}>Your Skills Deserve the Right Tools</h1>
        <p style={{ fontSize:17,opacity:.88,maxWidth:620,margin:'0 auto 32px' }}>
          SkillKit finances your toolbox through Ijarah: A halal lease model. NAVTTC graduates get a professional starter kit and pay a small daily/monthly rent. No bank. No interest. No barriers.
        </p>
        <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap' }}>
          <Link to="/register" className="btn" style={{ background:'#fff',color:'#1a5c2e',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700 }}>Apply for a Kit →</Link>
          <a href="#how" className="btn" style={{ background:'transparent',color:'#fff',border:'2px solid rgba(255,255,255,.5)',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>How It Works</a>
        </div>
      </div>

      {/* Problem + Solution */}
      <section style={{ padding:'60px 40px',maxWidth:1100,margin:'0 auto' }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:40 }}>
          <div className="card" style={{ borderLeft:'4px solid #dc3545' }}>
            <h3 style={{ marginBottom:12,color:'#dc3545' }}> The Problem</h3>
            <p style={{ color:'#545f6d',lineHeight:1.8 }}>A plumber graduates from NAVTTC with a recognized certificate but cannot afford a Hilti Drill and Pipe Threader set (PKR 50,000–65,000). Banks don't consider hand tools as collateral. Microfinance charges 30%+ interest. So they remain a low-wage helper at PKR 700/day instead of working as an independent contractor at PKR 3,000/day.</p>
          </div>
          <div className="card" style={{ borderLeft:'4px solid #22783c' }}>
            <h3 style={{ marginBottom:12,color:'#22783c' }}> The SkillKit Solution</h3>
            <p style={{ color:'#545f6d',lineHeight:1.8 }}>SkillKit partners with NAVTTC institutes to offer Ijarah-based tool leasing. The institute owns the tools. The graduate pays a monthly rental of ~PKR 4,500 for 12 months. Fully halal — no interest, no conventional loan. After the lease, they return the tools (or renew). Net gain: PKR 2,300/day more income from day one.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ background:'#f4f6f9',padding:'60px 40px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <h2 style={{ textAlign:'center',fontSize:28,marginBottom:8 }}>How SkillKit Works</h2>
          <p style={{ textAlign:'center',color:'#9aa3af',marginBottom:40 }}>Like rent-a-car, but for your toolbox</p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20 }}>
            {[
              { n:'1',title:'Register & Apply',desc:'Create your account, upload your NAVTTC certificate and CNIC, and select your starter kit.' },
              { n:'2',title:'Get Approved',desc:'Your institute coordinator reviews your application within 2 business days.' },
              { n:'3',title:'Collect Your Kit',desc:'Visit the institute office. You are assigned a specific physical kit with a unique serial number.' },
              { n:'4',title:'Pay Monthly',desc:'Top up your wallet and pay monthly installments (e.g. PKR 4,500/month). Track every payment.' },
              { n:'5',title:'Build Your Business',desc:'Start taking independent contracts. Earn PKR 3,000+ per day instead of PKR 700 as a helper.' },
            ].map(s => (
              <div key={s.n} className="card" style={{ textAlign:'center',padding:'24px 18px' }}>
                <div style={{ width:40,height:40,borderRadius:'50%',background:'#22783c',color:'#fff',fontSize:16,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px' }}>{s.n}</div>
                <div style={{ fontSize:28,marginBottom:8 }}>{s.icon}</div>
                <h3 style={{ fontSize:15,marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:13,color:'#545f6d' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample kits */}
      <section style={{ padding:'60px 40px',maxWidth:1100,margin:'0 auto' }}>
        <h2 style={{ textAlign:'center',fontSize:28,marginBottom:8 }}>Available Starter Kits</h2>
        <p style={{ textAlign:'center',color:'#9aa3af',marginBottom:40 }}>Curated tool sets for every NAVTTC trade</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20 }}>
          {[
            { trade:'Plumbing',name:'Plumbing Starter Kit',rent:4500,tools:'Hilti Drill · Pipe Threader · Pipe Wrenches · Pipe Cutter · Tool Bag' },
            { trade:'Electrical',name:'Electrical Starter Kit',rent:3800,tools:'Multimeter · Wire Stripper · Screwdrivers · Voltage Tester · Tool Belt' },
            { trade:'Welding',name:'Welding Starter Kit',rent:5200,tools:'Arc Welder · Welding Helmet · Angle Grinder · Electrode Set · Gloves' },
            { trade:'HVAC',name:'HVAC Starter Kit',rent:6000,tools:'Manifold Gauge · Refrigerant Scale · Flaring Tool · Pipe Bender · Vacuum Pump' },
          ].map(k => (
            <div key={k.trade} className="card">
              <div style={{ fontSize:36,marginBottom:10 }}>{k.icon}</div>
              <div style={{ fontSize:11,fontWeight:700,color:'#22783c',textTransform:'uppercase',letterSpacing:.5,marginBottom:4 }}>{k.trade}</div>
              <h3 style={{ fontSize:15,marginBottom:8 }}>{k.name}</h3>
              <p style={{ fontSize:12,color:'#545f6d',marginBottom:14,lineHeight:1.8 }}>{k.tools}</p>
              <div style={{ fontSize:19,fontWeight:800,color:'#22783c',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                PKR {k.rent.toLocaleString()} <small style={{ fontSize:12,fontWeight:400,color:'#9aa3af' }}>/month</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#1a5c2e',color:'rgba(255,255,255,.7)',padding:'28px 40px',textAlign:'center',fontSize:13 }}>
        <strong style={{ color:'#fff' }}>SkillKit</strong> — Ijarah-Based Vocational Tool Leasing &nbsp;|&nbsp; BS FinTech · FAST University Islamabad
      </footer>
    </div>
  );
}
