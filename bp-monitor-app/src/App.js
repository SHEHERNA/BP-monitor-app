import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, ComposedChart 
} from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  const [user, setUser] = useState(null); 
  const [usernameInput, setUsernameInput] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [history, setHistory] = useState([]);
  const [showAlert, setShowAlert] = useState(false); // For the Crisis Pop-up

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    if (user) {
      const allData = JSON.parse(localStorage.getItem("bp_app_users") || "{}");
      setHistory(allData[user] || []);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const allData = JSON.parse(localStorage.getItem("bp_app_users") || "{}");
      allData[user] = history;
      localStorage.setItem("bp_app_users", JSON.stringify(allData));
    }
  }, [history, user]);

  const addReading = (e) => {
    e.preventDefault();
    const sys = Number(systolic);
    const dia = Number(diastolic);
    
    let category = { label: "Normal", color: "#22c55e" };
    let isCrisis = false;

    if (sys >= 180 || dia >= 120) {
      category = { label: "CRISIS! Call Doctor", color: "#ef4444" };
      isCrisis = true;
    }
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

    // Trigger the Emergency Pop-up
    if (isCrisis) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000); // Hide after 5 seconds
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`VitalTrack Report: ${user}`, 14, 15);
    autoTable(doc, {
      head: [['Date', 'Time', 'BP', 'Status']],
      body: history.map(i => [i.date, i.time, `${i.systolic}/${i.diastolic}`, i.status]),
      startY: 25,
    });
    doc.save(`${user}_Report.pdf`);
  };

  if (!user) {
    return (
      <div style={uniqueLoginContainer}>
        <style>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .animate-in { animation: fadeInUp 0.8s ease-out forwards; }
        `}</style>
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
            <form onSubmit={(e) => { e.preventDefault(); setUser(usernameInput); }}>
              <input style={glassInput} placeholder="Enter name" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required />
              <button style={neonButton} type="submit">Access Dashboard →</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={appBgStyle}>
      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .alert-box { animation: slideDown 0.4s ease-out; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; width: 90%; max-width: 400px; }
      `}</style>

      {/* EMERGENCY CRISIS POP-UP */}
      {showAlert && (
        <div className="alert-box" style={emergencyPopStyle}>
          <div style={{fontSize: '1.5rem'}}>⚠️ EMERGENCY</div>
          <div style={{fontWeight: 'bold'}}>Your BP is dangerously high!</div>
          <div style={{fontSize: '0.9rem', marginTop: '5px'}}>Please contact your doctor immediately.</div>
        </div>
      )}

      <div style={contentWrapper}>
        <header style={headerStyle}>
          <h2 style={{margin: 0, color: '#1e293b'}}>{user}'s Profile</h2>
          <div style={{display:'flex', gap: '8px'}}>
            <button onClick={downloadPDF} style={actionBtn}>📥 PDF</button>
            <button onClick={() => setUser(null)} style={logoutBtn}>Switch</button>
          </div>
        </header>

        {/* TREND CHART */}
        <div style={mainCard}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" fontSize={10} stroke="#94a3b8" />
              <YAxis domain={[40, 200]} fontSize={10} stroke="#94a3b8" />
              <Tooltip />
              <ReferenceLine y={180} stroke="#ef4444" strokeDasharray="3 3" label={{value: 'CRISIS', fill: '#ef4444', fontSize: 10}} />
              <Line type="monotone" dataKey="systolic" stroke="#6366f1" strokeWidth={3} dot={{r:4}} />
              <Line type="monotone" dataKey="diastolic" stroke="#22c55e" strokeWidth={3} dot={{r:4}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* INPUT FORM */}
        <div style={mainCard}>
          <form onSubmit={addReading} style={{ display: "flex", gap: "10px" }}>
            <input style={modernInput} type="number" placeholder="Sys" value={systolic} onChange={(e) => setSystolic(e.target.value)} required />
            <input style={modernInput} type="number" placeholder="Dia" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} required />
            <button style={saveBtn} type="submit">Save</button>
          </form>
        </div>

        {/* COLORED HISTORY LIST */}
        <h4 style={{color: '#64748b', marginLeft: '10px'}}>Recent Activity</h4>
        {history.slice().reverse().map(item => (
          <div key={item.id} style={historyItem}>
            <div style={{display:'flex', alignItems: 'center', gap: '15px'}}>
               <div style={{fontSize: '1.2rem', fontWeight: '800', color: item.color}}>
                 {item.systolic}/{item.diastolic}
               </div>
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

// --- STYLING ---
const emergencyPopStyle = { backgroundColor: '#ef4444', color: 'white', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)', border: '2px solid white' };
const appBgStyle = { backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif", padding: '20px' };
const uniqueLoginContainer = { display: 'flex', height: '100vh', width: '100vw', background: '#0f172a', overflow: 'hidden' };
const leftPanel = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white', position: 'relative' };
const circleDecor = { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', top: '-100px', left: '-100px', filter: 'blur(100px)', opacity: 0.3 };
const rightPanel = { flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' };
const glassCard = { width: '380px', padding: '40px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' };
const brandText = { fontSize: '4rem', fontWeight: '900', margin: 0 };
const subText = { fontSize: '1.2rem', color: '#94a3b8' };
const greetingText = { color: '#818cf8', fontWeight: '800', fontSize: '0.7rem', letterSpacing: '2px' };
const loginHeader = { color: 'white', margin: '10px 0 30px 0' };
const glassInput = { width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid #334155', padding: '15px 5px', color: 'white', outline: 'none', marginBottom: '30px', fontSize: '1.1rem' };
const neonButton = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.4)' };
const contentWrapper = { maxWidth: "450px", margin: "0 auto" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" };
const mainCard = { backgroundColor: "white", padding: "20px", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "15px" };
const modernInput = { padding: "14px", borderRadius: "16px", border: "1px solid #e2e8f0", width: "100%", outline: 'none' };
const saveBtn = { padding: "14px 28px", backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: "16px", fontWeight: "700", cursor: 'pointer' };
const actionBtn = { padding: "8px 14px", backgroundColor: "#f1f5f9", border: 'none', borderRadius: "10px", fontWeight: "700", fontSize: '0.75rem', cursor: 'pointer' };
const logoutBtn = { padding: "8px 14px", backgroundColor: "#fee2e2", color: '#ef4444', border: 'none', borderRadius: "10px", fontWeight: "700", fontSize: '0.75rem', cursor: 'pointer' };
const historyItem = { backgroundColor: 'white', padding: '15px', borderRadius: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const delBtn = { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.1rem' };