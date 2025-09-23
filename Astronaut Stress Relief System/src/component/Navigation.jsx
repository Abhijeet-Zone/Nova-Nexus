import React, { useEffect, useState } from "react";
import { getNavigation } from "./api";

export default function Navigation() {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    async function fetchData() {
      const data = await getNavigation();
      setPosition(data);
    }
    fetchData();

    const interval = setInterval(fetchData, 5000); // update every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h2>🛰️ Navigation Console</h2>
      <p>X: {position.x} km</p>
      <p>Y: {position.y} km</p>
      <p>Z: {position.z} km</p>
      <p>Last Waypoint: ({position.x}, {position.y}, {position.z})</p>

      <div>
        <button>Autopilot</button>
        <button>Pause</button>
        <button>Recenter</button>
      </div>
    </div>
  );
}
