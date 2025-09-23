import React from 'react';
import Dashboard, { dashboardStyles } from './components/Dashboard.jsx';
import Sidebar from './components/Sidebar.jsx';

function KPI({ icon, title, consumption, value, percent, bottomLine }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-left">
          <div className="kpi-icon">{icon}</div>
          <div>
            <div className="kpi-title">{title}</div>
            <div className="kpi-sub">{consumption}</div>
          </div>
        </div>
        <div className="kpi-value">{value}</div>
      </div>

      <div className="progress-wrap">
        <div className="progress" style={{ width: `${percent}%` }} />
      </div>

      {bottomLine && <div className="kpi-note">{bottomLine}</div>}
    </div>
  );
}

/* ---------- Simple SVG icons ---------- */
function DropIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 7 8 7 12a5 5 0 0010 0c0-4-5-10-5-10z" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14v0" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FoodIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v20" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8c0 0 2-3 5-3s5 3 5 3" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11v6" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Additional icons
function BioreactorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="3" width="10" height="14" rx="2" stroke="#38bdf8" strokeWidth="1.2" />
      <path d="M9 7h6M9 10h6M9 13h6" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 19h12" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function AlgaeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20c0-5 4-5 4-10 0-3-2-4-4-4s-4 1-4 4c0 5 4 5 4 10z" stroke="#34d399" strokeWidth="1.2" fill="none" />
      <path d="M9 9c-1 0-2-.5-3-1.5M15 9c1 0 2-.5 3-1.5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function App() {
  const kpis = [
    {
      icon: <DropIcon />,
      title: 'Water Used',
      consumption: 'Facilities and cleaning',
      value: '1,240 L',
      percent: 62,
      bottomLine: 'Target: < 1,500 L/day',
    },
    {
      icon: <FoodIcon />,
      title: 'Food Waste',
      consumption: 'Kitchen + Cafeteria',
      value: '320 kg',
      percent: 48,
      bottomLine: 'Compost diversion up 8% MoM',
    },
    {
      icon: <BoltIcon />,
      title: 'Energy Recovery',
      consumption: 'Waste-to-energy yield',
      value: '2.9 MWh',
      percent: 73,
      bottomLine: 'Weekly avg based on last 4 weeks',
    },
    {
      icon: <TrashIcon />,
      title: 'Total Waste',
      consumption: 'All departments',
      value: '15.6 t',
      percent: 55,
      bottomLine: 'Down 5% vs last month',
    },
    {
      icon: <BioreactorIcon />,
      title: 'Fecal Waste Bioreactor',
      consumption: 'Anaerobic digestion volume',
      value: '1.2 m³',
      percent: 68,
      bottomLine: 'Methane yield trending +4% WoW',
    },
    {
      icon: <AlgaeIcon />,
      title: 'Algae Bioreactor',
      consumption: 'Biomass productivity',
      value: '24 kg',
      percent: 64,
      bottomLine: 'O₂ output ~0.5 kg/day',
    },
  ];

  return (
    <div className="app-shell">
      <style>{dashboardStyles}</style>
      <header className="app-header">
        <div className="title">Waste & Food Management</div>
        <div className="subtitle">Live overview • Last 12 months</div>
      </header>

      <div className="main-grid">
        <Sidebar />
        <div className="main-content">
          <section className="kpis">
            {kpis.map((k, i) => (
              <KPI key={i} {...k} />
            ))}
          </section>

          <Dashboard />
        </div>
      </div>
    </div>
  );
}

export default App;