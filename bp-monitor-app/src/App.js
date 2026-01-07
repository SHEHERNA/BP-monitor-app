import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart 
} from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  // --- APP STATE ---
  const [user, setUser] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [history, setHistory] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- ADMIN CONFIG ---
  const ADMIN_CREDENTIALS = { user: "admin", pass: "admin123" };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // --- DATA SYNC ---
  useEffect(() => {
    if (user && !isAdmin) {
      const allData = JSON.parse(localStorage.getItem("bp_app_vault") || "{}");
      setHistory(allData[user]?.history || []);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && !isAdmin) {
      const allData = JSON.parse(localStorage.getItem("bp_app_vault") || "{}");
      if (allData[user]) {
        allData[user].history = history;
        localStorage.setItem("bp_app_vault", JSON.stringify(allData));
      }
    }
  }, [history, user, isAdmin]);

  // --- AUTH ACTIONS ---
  const handleLogin = (e) => {
    e.preventDefault();
    const u = usernameInput.trim();
    const p = passwordInput.trim();

    if (u === ADMIN_CREDENTIALS.user && p === ADMIN_CREDENTIALS.pass) {
      setIsAdmin(true);
      setUser("Admin");
      return;
    }

    const allData = JSON.parse(localStorage.getItem("bp_app_vault") || "{}");
    
    if (allData[u]) {
      if (allData[u].password === p) {
        setUser(u);
        setErrorMsg("");
      } else {
        setErrorMsg("Incorrect password.");
      }
    } else {
      // Create new account
      allData[u] = { password: p, history: [] };
      localStorage.setItem("bp_app_vault", JSON.stringify(allData));
      setUser(u);
      setErrorMsg("");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setUsernameInput("");
    setPasswordInput("");
    setErrorMsg("");
  };

  // --- ADMIN ACTIONS ---
  const deleteUser = (targetUser) => {
    if (window.confirm(`Delete ${targetUser} and all their data?`)) {
      const allData = JSON.parse(localStorage.getItem("bp_app_vault") || "{}");
      delete allData[targetUser];
      localStorage.setItem("bp_app_vault", JSON.stringify(allData));
      // Trigger re-render for admin list
      setIsAdmin(true); 
    }
  };

  // --- DASHBOARD ACTIONS ---
  const addReading = (e) => {
    e.preventDefault();
    const sys = Number(systolic);
    const dia = Number(diastolic);
    
    let category = { label: "Normal", color: "#22c55e" };
    if (sys >= 180 || dia >= 120) category = { label: "CRISIS! Call Doctor", color: "#ef4444" };
    else if (sys >= 140 || dia >= 90) category = { label: "High (Stage 2)", color: "#f97316" };
    else if (sys >= 130 || dia >= 80) category = { label: "High (Stage 1)", color: "#eab308" };
    else if (sys >= 120 && dia < 80) category = { label: "Elevated", color: "#84cc16" };

    const newEntry = {
      id: Date.now(),
      systolic: sys,
      diastolic: dia,
      status: category.label,
      color: category.color,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };

    setHistory([...history, newEntry]);
    setSystolic(""); setDiastolic("");
    if (sys >= 180 || dia >= 120) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`VitalTrack Health Report: ${user}`, 14, 15);
    autoTable(doc, {
      head: [['Date', 'Time', 'BP (Sys/Dia)', 'Status']],
      body: history.map(i => [i.date, i.time, `${i.systolic}/${i.diastolic}`, i.status]),
      startY: 25,
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.save(`${user}_Report.pdf`);
  };

  // --- 1. LOGIN VIEW ---
  if (!user) {
    return (
      <div style={uniqueLoginContainer}>
        <style>{`.animate-in { animation: fadeInUp 0.8s ease-out forwards; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={leftPanel}>
          <div style={circleDecor}></div>
          <div className="animate-in">
            <h1 style={brandText}>VitalTrack</h1>
            <p style={subText}>Advanced Health Visualization.</p>
          </div>
        </div>
        <div style={rightPanel}>
          <div style={glassCard} className="animate-in">
            <span style={greetingText}>{getGreeting()}</span>
            <h2 style={loginHeader}>Who is tracking today?</h2>
            <form onSubmit={handleLogin}>
              <input style={glassInput} placeholder="Username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required />
              <input type="password" style={glassInput} placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
              {errorMsg && <p style={{color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px'}}>{errorMsg}</p>}
              <button style={neonButton} type="submit">Access Dashboard →</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ADMIN VIEW ---
  if (isAdmin) {
    const allUsersData = JSON.parse(localStorage.getItem("bp_app_vault") || "{}");
    return (
      <div style={appBgStyle}>
        <div style={contentWrapper}>
          <header style={headerStyle}>
            <h2>Admin Panel</h2>
            <button onClick={handleLogout} style={logoutBtn}>Logout</button>
          </header>
          <h4 style={{color: '#64748b', marginBottom: '15px'}}>User Accounts Management</h4>
          {Object.keys(allUsersData).map(uName => (
            <div key={uName} style={historyItem}>
              <div>
                <div style={{fontWeight: 'bold', color: '#1e293b'}}>{uName}</div>
                <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>{allUsersData[uName].history.length} Readings stored</div>
              </div>
              <button onClick={() => deleteUser(uName)} style={{...delBtn, color: '#ef4444', background: '#fee2e2'}}>Delete User</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 3. DASHBOARD VIEW ---
  return (
    <div style={appBgStyle}>
      <style>{`.dashboard-animate { animation: slideInRight 0.6s ease-out forwards; } @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {showAlert && (
        <div style={emergencyPopStyle} className="dashboard-animate">
          <div style={{fontSize: '1.2rem', fontWeight: '900'}}>⚠️ EMERGENCY ALERT</div>
          <div>Your BP is dangerously high!</div>
        </div>
      )}
      <div style={contentWrapper} className="dashboard-animate">
        <header style={headerStyle}>
          <div>
            <span style={{fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold'}}>PATIENT FILE</span>
            <h2 style={{margin: 0, color: '#1e293b'}}>{user}'s Dashboard</h2>
          </div>
          <div style={{display:'flex', gap: '8px'}}>
            <button onClick={downloadPDF} style={actionBtn}>📥 PDF</button>
            <button onClick={handleLogout} style={logoutBtn}>Logout</button>
          </div>
        </header>

        <div style={mainCard}>
          <h4 style={cardTitle}>Blood Pressure Trend</h4>
          <div style={{ height: "220px", marginTop: '15px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" fontSize={10} stroke="#94a3b8" />
                <YAxis domain={[40, 220]} fontSize={10} stroke="#94a3b8" />
                <Tooltip />
                <ReferenceLine y={180} stroke="#ef4444" strokeDasharray="3 3" label={{value: 'CRISIS', fill: '#ef4444', fontSize: 10}} />
                <Line type="monotone" dataKey="systolic" stroke="#6366f1" strokeWidth={4} dot={{r:5, fill:'#6366f1', strokeWidth:2, stroke:'#fff'}} />
                <Line type="monotone" dataKey="diastolic" stroke="#22c55e" strokeWidth={4} dot={{r:5, fill:'#22c55e', strokeWidth:2, stroke:'#fff'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={mainCard}>
          <form onSubmit={addReading} style={{ display: "flex", gap: "10px" }}>
            <input style={modernInput} type="number" placeholder="Sys" value={systolic} onChange={(e) => setSystolic(e.target.value)} required />
            <input style={modernInput} type="number" placeholder="Dia" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} required />
            <button style={saveBtn} type="submit">Save</button>
          </form>
        </div>

        <h4 style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '15px'}}>Health Logs</h4>
        {history.slice().reverse().map(item => (
          <div key={item.id} style={historyItem}>
            <div style={{display:'flex', alignItems: 'center', gap: '15px'}}>
               <div style={{fontSize: '1.3rem', fontWeight: '900', color: item.color}}>{item.systolic}/{item.diastolic}</div>
               <div>
                 <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: item.color}}>{item.status}</div>
                 <div style={{fontSize: '0.65rem', color: '#94a3b8'}}>{item.date} • {item.time}</div>
               </div>
            </div>
            <button onClick={() => setHistory(history.filter(h => h.id !== item.id))} style={delBtn}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STYLES (Keep Original) ---
const emergencyPopStyle = { backgroundColor: '#ef4444', color: 'white', padding: '15px', borderRadius: '20px', textAlign: 'center', position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '400px', border: '3px solid white' };
const appBgStyle = { backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif", padding: '20px' };
const uniqueLoginContainer = { display: 'flex', height: '100vh', width: '100vw', background: '#0f172a', overflow: 'hidden' };
const leftPanel = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white', position: 'relative' };
const circleDecor = { position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', top: '-150px', left: '-150px', filter: 'blur(120px)', opacity: 0.3 };
const rightPanel = { flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' };
const glassCard = { width: '400px', padding: '50px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(30px)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' };
const brandText = { fontSize: '4.5rem', fontWeight: '900', margin: 0, letterSpacing: '-3px' };
const subText = { fontSize: '1.2rem', color: '#94a3b8', marginTop: '10px' };
const greetingText = { color: '#818cf8', fontWeight: '900', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase' };
const loginHeader = { color: 'white', margin: '15px 0 35px 0', fontSize: '1.8rem' };
const glassInput = { width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid #334155', padding: '15px 5px', color: 'white', outline: 'none', marginBottom: '20px', fontSize: '1.2rem' };
const neonButton = { width: '100%', padding: '18px', borderRadius: '20px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.4)', fontSize: '1rem' };
const contentWrapper = { maxWidth: "480px", margin: "0 auto" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" };
const mainCard = { backgroundColor: "white", padding: "24px", borderRadius: "30px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", marginBottom: "20px" };
const cardTitle = { margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: '700' };
const modernInput = { padding: "16px", borderRadius: "18px", border: "1.5px solid #e2e8f0", width: "100%", outline: 'none', fontSize: '1rem' };
const saveBtn = { padding: "16px 32px", backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: "18px", fontWeight: "800", cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' };
const actionBtn = { padding: "10px 16px", backgroundColor: "#ecfdf5", color: "#059669", border: 'none', borderRadius: "14px", fontWeight: "800", fontSize: '0.75rem', cursor: 'pointer' };
const logoutBtn = { padding: "10px 16px", backgroundColor: "#fef2f2", color: '#ef4444', border: 'none', borderRadius: "14px", fontWeight: "800", fontSize: '0.75rem', cursor: 'pointer' };
const historyItem = { backgroundColor: 'white', padding: '18px', borderRadius: '25px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' };
const delBtn = { background: '#f8fafc', border: 'none', color: '#cbd5e1', cursor: 'pointer', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
