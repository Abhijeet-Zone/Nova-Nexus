import React, { useMemo, useState } from 'react';

function Toggle({ checked, onChange }) {
  return (
    <button
      aria-label={checked ? 'Turn off' : 'Turn on'}
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? 'on' : 'off'}`}
    >
      <span className="knob" />
    </button>
  );
}

// Lightweight icons
const Icon = {
  urine: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 10c0-3 2-6 5-6s5 3 5 6-2 5-5 5-5-2-5-5z" stroke="#60a5fa" strokeWidth="1.3" />
      <path d="M12 15v4" stroke="#60a5fa" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  plasma: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l-3 7h4l-1 5 3-7h-4l1-5z" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fecal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="3" width="12" height="14" rx="2" stroke="#38bdf8" strokeWidth="1.3" />
      <path d="M8.5 7h7M8.5 10h7M8.5 13h7" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  algae: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20c0-5 4-5 4-10 0-3-2-4-4-4s-4 1-4 4c0 5 4 5 4 10z" stroke="#34d399" strokeWidth="1.3" />
      <path d="M9 9c-1 0-2-.5-3-1.5M15 9c1 0 2-.5 3-1.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  hydro: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3c-2 3-5 6-5 9a5 5 0 1010 0c0-3-3-6-5-9z" stroke="#22c55e" strokeWidth="1.3" />
    </svg>
  ),
  air: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9h10M6 13h8M10 17h7" stroke="#93c5fd" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

function StatusPill({ online }) {
  return (
    <span className={`status-pill ${online ? 'ok' : 'bad'}`}>{online ? 'ONLINE' : 'OFFLINE'}</span>
  );
}

function ReactorCard({ name, icon, description, initial, onChange }) {
  const [online, setOnline] = useState(initial.online);
  const [eff, setEff] = useState(initial.efficiency);
  const [maint, setMaint] = useState(initial.maintenance);
  const [power, setPower] = useState(initial.power);

  const headerColor = useMemo(() => {
    switch (name) {
      case 'Urine Recycler': return '#60a5fa';
      case 'Plasma Reactor': return '#f59e0b';
      case 'Fecal Bio Reactor': return '#38bdf8';
      case 'Algae Bioreactor': return '#34d399';
      case 'Hydroponics': return '#22c55e';
      case 'Air Recycler': return '#93c5fd';
      default: return '#a3a3a3';
    }
  }, [name]);

  function toggle(v) {
    setOnline(v);
    onChange?.({ name, online: v, efficiency: eff, maintenance: maint, power });
  }

  return (
    <div className="reactor-card">
      <div className="reactor-head">
        <div className="reactor-title" style={{ color: headerColor }}>
          <span className="reactor-icon">{icon}</span>
          {name}
        </div>
        <Toggle checked={online} onChange={toggle} />
      </div>

      <div className="reactor-row"><span>Efficiency:</span><b>{eff}%</b></div>
      <div className="reactor-row"><span>Maintenance:</span><b>{maint}%</b></div>
      <div className="reactor-row"><span>Power:</span><b>{power}W</b></div>
      <div className="reactor-row"><span>Status:</span><StatusPill online={online} /></div>

      <div className="reactor-desc">{description}</div>
    </div>
  );
}

export default function Sidebar({ onStatusChange }) {
  const items = [
    {
      name: 'Urine Recycler',
      icon: Icon.urine,
      description: 'Converts urine to clean water via distillation and filtration',
      initial: { efficiency: 83, maintenance: 77, power: 50, online: false },
    },
    {
      name: 'Plasma Reactor',
      icon: Icon.plasma,
      description: 'Burns solid waste at extreme temperatures; generates power',
      initial: { efficiency: 60, maintenance: 57, power: 200, online: true },
    },
    {
      name: 'Fecal Bio Reactor',
      icon: Icon.fecal,
      description: 'Anaerobic digestion produces biogas and fertilizer',
      initial: { efficiency: 92, maintenance: 45, power: 30, online: true },
    },
    {
      name: 'Algae Bioreactor',
      icon: Icon.algae,
      description: 'Photosynthetic algae produces oxygen and biomass',
      initial: { efficiency: 85, maintenance: 74, power: 75, online: true },
    },
    {
      name: 'Hydroponics',
      icon: Icon.hydro,
      description: 'Soilless cultivation produces fresh vegetables and fruits',
      initial: { efficiency: 78, maintenance: 82, power: 120, online: true },
    },
    {
      name: 'Air Recycler',
      icon: Icon.air,
      description: 'CO₂ scrubbing and O₂ recycling system',
      initial: { efficiency: 96, maintenance: 38, power: 90, online: true },
    },
  ];

  return (
    <aside className="sidebar">
      {items.map((it) => (
        <ReactorCard key={it.name} {...it} onChange={onStatusChange} />
      ))}
    </aside>
  );
}
