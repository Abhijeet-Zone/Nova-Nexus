import React, { useEffect, useState } from "react";
import { getCommunication } from "./api";

export default function Communication() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function fetchData() {
      const data = await getCommunication();
      setStatus(data.status);
    }
    fetchData();

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h2>📡 Communication Link</h2>
      <p>Status: {status}</p>
    </div>
  );
}
