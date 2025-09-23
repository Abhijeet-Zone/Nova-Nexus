import React from "react";
import "./App.css";
import Navigation from "./component/Navigation";
import StressMonitor from "./component/StressMonitor";
import Communication from "./component/Communication";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Astronaut Mission Console</h1>
        <p>Mission Elapsed Time: 00:05:42</p>
      </header>

      <main className="dashboard">
        <Navigation />
        <StressMonitor />
        <Communication />
      </main>
    </div>
  );
}
