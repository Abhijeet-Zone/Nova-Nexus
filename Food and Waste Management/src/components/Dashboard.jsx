import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';

// Mock datasets for waste & food management
const timeSeries = [
  { month: 'Jan', waste: 12, recycled: 7, organic: 3, energy: 2 },
  { month: 'Feb', waste: 14, recycled: 8, organic: 3.5, energy: 2.5 },
  { month: 'Mar', waste: 13, recycled: 8.5, organic: 4, energy: 2.2 },
  { month: 'Apr', waste: 15, recycled: 9, organic: 4.5, energy: 2.8 },
  { month: 'May', waste: 16, recycled: 10, organic: 5, energy: 3 },
  { month: 'Jun', waste: 15, recycled: 10.5, organic: 5.2, energy: 2.6 },
  { month: 'Jul', waste: 17, recycled: 11, organic: 5.6, energy: 3.2 },
  { month: 'Aug', waste: 16, recycled: 11.5, organic: 5.3, energy: 3.1 },
  { month: 'Sep', waste: 15, recycled: 11.7, organic: 5.1, energy: 2.9 },
  { month: 'Oct', waste: 14, recycled: 11.2, organic: 4.7, energy: 2.5 },
  { month: 'Nov', waste: 13, recycled: 10.8, organic: 4.2, energy: 2.2 },
  { month: 'Dec', waste: 12, recycled: 10.5, organic: 4, energy: 2 }
];

const composition = [
  { name: 'Organic', value: 42, color: '#22c55e' },
  { name: 'Plastic', value: 18, color: '#60a5fa' },
  { name: 'Paper', value: 14, color: '#f97316' },
  { name: 'Glass', value: 9, color: '#a78bfa' },
  { name: 'Metal', value: 7, color: '#f472b6' },
  { name: 'Other', value: 10, color: '#94a3b8' }
];

const radarData = [
  { category: 'Kitchen', generated: 120, recycled: 70 },
  { category: 'Cafeteria', generated: 100, recycled: 65 },
  { category: 'Offices', generated: 60, recycled: 40 },
  { category: 'Workshops', generated: 80, recycled: 55 },
  { category: 'Labs', generated: 75, recycled: 50 }
];

const COLORS = composition.map((c) => c.color);

export default function Dashboard() {
  return (
    <div className="dashboard-grid">
      {/* Line Chart: Waste vs Recycled */}
      <div className="card">
        <div className="card-title">Waste vs Recycled (Monthly)</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: '#0b1416', border: '1px solid #1f2937' }} />
            <Legend />
            <Line type="monotone" dataKey="waste" stroke="#f43f5e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="recycled" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Area Chart: Organic diversion */}
      <div className="card">
        <div className="card-title">Organic Diversion Trend</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={timeSeries}>
            <defs>
              <linearGradient id="organic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: '#0b1416', border: '1px solid #1f2937' }} />
            <Area type="monotone" dataKey="organic" stroke="#22c55e" fill="url(#organic)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart: Energy recovery */}
      <div className="card">
        <div className="card-title">Energy Recovery</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={timeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: '#0b1416', border: '1px solid #1f2937' }} />
            <Bar dataKey="energy" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart: Composition */}
      <div className="card">
        <div className="card-title">Waste Composition</div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Tooltip contentStyle={{ background: '#0b1416', border: '1px solid #1f2937' }} />
            <Pie data={composition} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
              {composition.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart: Department performance */}
      <div className="card">
        <div className="card-title">Department Performance</div>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1f2937" />
            <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
            <PolarRadiusAxis stroke="#9ca3af" />
            <Radar name="Generated" dataKey="generated" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
            <Radar name="Recycled" dataKey="recycled" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Composed Chart: Combined view */}
      <div className="card">
        <div className="card-title">Combined Metrics</div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={timeSeries}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: '#0b1416', border: '1px solid #1f2937' }} />
            <Area type="monotone" dataKey="recycled" fill="#22c55e33" stroke="#22c55e" />
            <Bar dataKey="waste" barSize={16} fill="#f43f5e" />
            <Line type="monotone" dataKey="organic" stroke="#16a34a" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Minimal styles scoped to the dashboard; most theming in index.css
// You can move these to a CSS/SCSS module if preferred.
export const dashboardStyles = `
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (min-width: 1200px) {
  .dashboard-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.card {
  background: #0b1416;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 12px 12px 8px;
}
.card-title {
  color: #e5e7eb;
  font-size: 14px;
  margin-bottom: 8px;
}
`;
