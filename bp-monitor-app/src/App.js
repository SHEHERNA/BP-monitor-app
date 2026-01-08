import React, { useState } from "react";
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Area, BarChart, Bar, Cell 
} from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getAnalysis } from './analysis';

export default function App() {
  const [user, setUser] = useState(null); 
  const [role, setRole] = useState("user");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState(null);

  // Function to get Greeting based on current time
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const input = usernameInput.trim();
    if (input.toLowerCase() === "admin") {
      setUser("Root_Admin");
      setRole("admin");
    } else if (input) {
      setUser(input);
      setRole("user");
    }
    // SECURE: Automatically clears credentials from the UI once logged in
    setUsernameInput("");
    setPasswordInput("");
  };

  const addReading = (e) => {
    e.preventDefault();
    const userSpecificHistory = history.filter(h => h.account === user);
    const res = getAnalysis(Number(systolic), Number(diastolic), userSpecificHistory);
    
    if (res.type !== 'original') {
      setAlert({ msg: res.msg, color: res.color });
      setTimeout(() => setAlert(null), 4000);
    }

    const newEntry = {
      id: Date.now(),
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      status: res.msg,
      medical: res.medical,
      color: res.color,
      type: res.type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      account: user
    };
    setHistory([...history, newEntry]);
    setSystolic(""); setDiastolic("");
  };

  const downloadPDF = (title = "Health Report", dataToExport) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated for: ${user}`, 14, 28);
    
    const rows = dataToExport.map(h => [h.date + ' ' + h.time, `${h.systolic}/${h.diastolic}`, h.medical, h.status]);
    autoTable(doc, { 
        startY: 35, 
        head: [['Timestamp', 'BP Reading', 'Diagnosis', 'Security Status']], 
        body: rows,
        headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`VitalTrack_${user}_Report.pdf`);
  };

  // --- LOGIN UI ---
  if (!user) {
    return (
      <div style={darkBg}>
        <div style={heroSection}>
          <h1 style={heroTitle}>VitalTrack</h1>
          <p style={heroSub}>Advanced Health Visualization.</p>
        </div>
        <div style={glassCard}>
          <p style={greeting}>{getTimeGreeting()}</p>
          <h2 style={loginHeading}>Who is tracking today?</h2>
          <form onSubmit={handleLogin} style={{marginTop: '30px'}}>
            <input style={darkInput} placeholder="Username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required />
            <input type="password" style={darkInput} placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
            <button style={heroBtn} type="submit">Access Dashboard →</button>
          </form>
        </div>
      </div>
    );
  }

  // --- PROFESSIONAL ADMIN PAGE ---
  if (role === "admin") {
    const attacks = history.filter(h => h.type === 'attack').length;
    const uniqueUsers = Array.from(new Set(history.map(h => h.account)));

    return (
      <div style={adminContainer}>
        <aside style={adminSidebar}>
          <div style={sidebarBrand}>VT MONITOR</div>
          <div style={sidebarTabActive}>📊 System Overview</div>
          <div style={sidebarTab}>👥 Accounts</div>
          <div style={sidebarTab}>🛡️ Security Audit</div>
          <button onClick={() => setUser(null)} style={adminLogout}>End Session</button>
        </aside>

        <main style={adminContent}>
          <div style={adminHeader}>
            <div>
              <p style={{color: '#6366f1', fontWeight: 'bold', margin: 0}}>{getTimeGreeting()}</p>
              <h1>Global Administration</h1>
            </div>
            <button onClick={() => downloadPDF("Master Security Audit", history)} style={primaryBtn}>Master Export (PDF)</button>
          </div>

          <div style={statGrid}>
            <div style={statCard}><h3>Total Records</h3><p>{history.length}</p></div>
            <div style={statCard}><h3>Active Users</h3><p>{uniqueUsers.length}</p></div>
            <div style={statCard}><h3>Threats Detected</h3><p style={{color: '#ef4444'}}>{attacks}</p></div>
          </div>

          <div style={adminPanelBody}>
            <div style={panelSection}>
              <h3>Account Management</h3>
              <table style={adminTable}>
                <thead>
                  <tr><th>Account</th><th>Integrity</th><th>Activity</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {uniqueUsers.map(accName => (
                    <tr key={accName}>
                      <td>{accName}</td>
                      <td>
                        <span style={{color: history.some(h => h.account === accName && h.type === 'attack') ? '#ef4444' : '#10b981'}}>
                          {history.some(h => h.account === accName && h.type === 'attack') ? '🚨 Compromised' : '✓ Secure'}
                        </span>
                      </td>
                      <td>{history.filter(h => h.account === accName).length} Logs</td>
                      <td><button style={miniBtn} onClick={() => downloadPDF(`Audit_${accName}`, history.filter(h => h.account === accName))}>Export User PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={panelSection}>
              <h3>Global Activity</h3>
              <div style={scrollLog}>
                {history.slice().reverse().map(log => (
                  <div key={log.id} style={auditEntry}>
                    <strong>{log.account}</strong>: {log.systolic}/{log.diastolic} - <small>{log.status}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- PRIVACY-ENABLED USER PAGE ---
  const myData = history.filter(h => h.account === user);

  return (
    <div style={dashboardLayout}>
      {alert && <div style={{...alertPop, backgroundColor: alert.color}}>{alert.msg}</div>}
      <nav style={navbar}>
        <div style={{fontWeight: 'bold', color: '#4f46e5'}}>VitalTrack Portal</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <span style={{fontSize: '0.8rem', color: '#64748b'}}>{getTimeGreeting()}, <b>{user}</b></span>
            <button onClick={() => setUser(null)} style={logoutBtn}>Logout</button>
        </div>
      </nav>
      <div style={mainGrid}>
        <div style={leftCol}>
          <div style={chartCard}>
            <div style={cardHeader}>
                <h3>My Biometric Trends</h3>
                <button onClick={() => downloadPDF("Personal Health Report", myData)} style={outlineBtn}>Download My PDF</button>
            </div>
            <div style={{height: '250px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={myData}>
                  <XAxis dataKey="time" fontSize={10} />
                  <YAxis domain={[40, 200]} fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="systolic" fill="#f5f3ff" stroke="#4f46e5" strokeWidth={3} />
                  <Line type="monotone" dataKey="diastolic" stroke="#10b981" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={chartCard}>
            <h3>Submit New Reading</h3>
            <form onSubmit={addReading} style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <input style={formInput} type="number" placeholder="Systolic" value={systolic} onChange={(e) => setSystolic(e.target.value)} required />
              <input style={formInput} type="number" placeholder="Diastolic" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} required />
              <button style={actionBtn} type="submit">Analyze & Log</button>
            </form>
          </div>
        </div>
        <div style={rightCol}>
          <h3>My History</h3>
          {myData.slice().reverse().map(h => (
            <div key={h.id} style={logItem}>
               <div style={{...statusDot, backgroundColor: h.color}}></div>
               <div style={{flex: 1}}>
                 <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <strong>{h.systolic}/{h.diastolic}</strong>
                    <small style={{color: '#94a3b8'}}>{h.time}</small>
                 </div>
                 <div style={{fontSize: '0.85rem', color: h.color, fontWeight: 'bold'}}>{h.medical}</div>
                 <div style={systemTag}>{h.status}</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- STYLES (Kept exactly the same) ---
const darkBg = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: 'white', fontFamily: 'sans-serif' };
const heroSection = { maxWidth: '400px' };
const heroTitle = { fontSize: '4.5rem', margin: 0, letterSpacing: '-2px' };
const heroSub = { fontSize: '1.2rem', color: '#94a3b8' };
const glassCard = { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', padding: '50px', borderRadius: '30px', width: '400px', border: '1px solid rgba(255,255,255,0.1)' };
const greeting = { color: '#6366f1', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' };
const loginHeading = { fontSize: '1.8rem', margin: 0 };
const darkInput = { width: '100%', padding: '15px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: 'white', marginBottom: '20px', fontSize: '1.1rem', outline: 'none' };
const heroBtn = { width: '100%', padding: '16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const adminContainer = { display: 'flex', height: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' };
const adminSidebar = { width: '260px', background: '#1e293b', color: 'white', padding: '30px', position: 'relative' };
const sidebarBrand = { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '40px', color: '#6366f1' };
const sidebarTabActive = { padding: '12px', background: '#334155', borderRadius: '8px', marginBottom: '10px' };
const sidebarTab = { padding: '12px', color: '#94a3b8', cursor: 'pointer' };
const adminContent = { flex: 1, padding: '40px', overflowY: 'auto' };
const adminHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const statGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' };
const statCard = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const adminPanelBody = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' };
const panelSection = { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const adminTable = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' };
const scrollLog = { height: '350px', overflowY: 'auto' };
const auditEntry = { padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' };
const miniBtn = { padding: '5px 10px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' };
const adminLogout = { position: 'absolute', bottom: '30px', width: '200px', padding: '10px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white' };
const primaryBtn = { background: '#4f46e5', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const dashboardLayout = { background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' };
const navbar = { background: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' };
const mainGrid = { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', padding: '30px 40px' };
const leftCol = { display: 'flex', flexDirection: 'column', gap: '25px' };
const rightCol = { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: '80vh' };
const chartCard = { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const logItem = { display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' };
const statusDot = { width: '4px', borderRadius: '4px' };
const alertPop = { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '15px 30px', borderRadius: '12px', color: 'white', zIndex: 1000, fontWeight: 'bold' };
const actionBtn = { padding: '12px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' };
const formInput = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' };
const logoutBtn = { padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px' };
const outlineBtn = { padding: '8px 16px', background: 'white', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' };
const systemTag = { fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' };
