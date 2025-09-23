# Spacecraft Maintenance Dashboard

Run backend (SSE + SQLite) and frontend, then enable Live Data to see real alerts.

## Prerequisites
- Node 18+

## Install deps
```bash
npm install
```

## Start backend (port 3001)
```bash
npm run server
```
This starts an Express server with Server-Sent Events (SSE) at `/sse`, a telemetry ingest endpoint at `/telemetry`, and persists data to `telemetry.db` via SQLite.

## Start frontend (port 5173)
```bash
npm run dev
```
Open the printed URL in your browser.

## Enable Live Data
- Toggle "Live Data" in the header. Status will show connecting/live/error.
- When live is on, the dashboard uses server telemetry and server-derived alerts.

## Send real telemetry
POST JSON to the backend to simulate/pipe real sensors:
```bash
curl -X POST http://localhost:3001/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "temperatureC": 22.4,
    "pressureKPa": 101.1,
    "vibrationMmS": 1.1,
    "powerKw": 4.2,
    "pump2TempC": 36.0,
    "batteryHealthPct": 97.5,
    "oxygenPct": 21.0,
    "co2Ppm": 650,
    "waterRecyclePct": 86,
    "cabinPressureKPa": 101,
    "radiatorEfficiencyPct": 90,
    "moduleTempImbalanceC": 1.0,
    "batteryLevelPct": 78,
    "solarChargeKw": 3.2,
    "pduStatusOk": true,
    "signalStrengthDb": -68,
    "antennaAligned": true,
    "commsLinkUp": true,
    "gyroOk": true,
    "starTrackerOk": true,
    "thrusterStatus": "nominal",
    "dockingOk": true,
    "suitOxygenOk": true,
    "suitCoolingOk": true,
    "suitPressureOk": true,
    "smokeDetected": false,
    "toxicAmmoniaPpm": 0,
    "roboticArmOk": true,
    "payloadOk": true
  }'
```

The server immediately broadcasts the telemetry and computed alerts to all connected clients via SSE and stores them in SQLite.

## Notes
- If you don’t POST telemetry, the server includes a built-in simulator that emits data every ~1.5s. You can remove it by deleting the `setInterval` in `server.js`.
- If Live Data is off, the app uses local mock data with fault injection.
