import React, { useState } from "react";
import HealthDashboard from "./component/health.jsx";
import HealthChatbot from "./component/HealthChatbot.jsx";
import EyeScanner from "./component/EyeScanner.jsx";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="App">
      <header>
        <h1>🩺Astronaut Health </h1>
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Health Data
          </button>
          <button 
            className={`nav-tab ${activeTab === 'chatbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatbot')}
          >
            🤖 AI Assistant
          </button>
          <button 
            className={`nav-tab ${activeTab === 'eyescanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('eyescanner')}
          >
            👁️ Eye Scanner
          </button>
        </nav>
      </header>
      
      <main className="main-content">
        {activeTab === 'dashboard' && <HealthDashboard />}
        {activeTab === 'chatbot' && <HealthChatbot />}
        {activeTab === 'eyescanner' && <EyeScanner />}
      </main>
    </div>
  );
}

export default App;
