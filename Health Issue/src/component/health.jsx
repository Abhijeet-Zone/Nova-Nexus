import React from "react";
import healthData from "./health.js";

export default function HealthDashboard() {
  return (
    <div className="dashboard-container">
      <h2>🚀 Astronaut Health & Solutions</h2>
      <table>
        <thead>
          <tr>
            <th>Health Problem</th>
            <th>Health Solution</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {healthData.map((item, index) => (
            <tr key={index}>
              <td>{item.problem}</td>
              <td>{item.aiSolution}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// keep only the component's default export above