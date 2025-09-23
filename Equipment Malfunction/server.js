// Lightweight telemetry server with SQLite persistence and SSE streaming
// Run with: npm run server

import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173'], credentials: false }))
app.use(express.json({ limit: '1mb' }))

// --- Database setup ---
const db = new Database('telemetry.db')
db.pragma('journal_mode = WAL')
db.exec(`
CREATE TABLE IF NOT EXISTS telemetry (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ts INTEGER NOT NULL,
	payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ts INTEGER NOT NULL,
	level TEXT NOT NULL,
	message TEXT NOT NULL
);
`)

const insertTelemetry = db.prepare('INSERT INTO telemetry (ts, payload) VALUES (?, ?)')
const insertAlert = db.prepare('INSERT INTO alerts (ts, level, message) VALUES (?, ?, ?)')

// --- Alert rules (align with frontend) ---
function deriveAlerts(t) {
	const alerts = []
	if (t.pump2TempC > 70) alerts.push({ level: 'critical', message: 'Cooling pump #2 is overheating' })
	else if (t.pump2TempC > 55) alerts.push({ level: 'warning', message: 'Cooling pump #2 temperature trending high' })

	if (t.vibrationMmS > 4) alerts.push({ level: 'critical', message: 'Excessive vibration detected in rotary assembly' })
	else if (t.vibrationMmS > 2.5) alerts.push({ level: 'warning', message: 'Vibration above nominal threshold' })

	if (t.pressureKPa < 95) alerts.push({ level: 'warning', message: 'Cabin pressure below target band' })
	if (t.batteryHealthPct < 70) alerts.push({ level: 'warning', message: 'Battery health degraded; plan maintenance' })

	// Life Support
	if (t.oxygenPct < 19.5) alerts.push({ level: 'critical', message: 'Life Support: O₂ too low' })
	else if (t.oxygenPct > 23.5) alerts.push({ level: 'warning', message: 'Life Support: O₂ above safe band' })
	if (t.co2Ppm > 5000) alerts.push({ level: 'critical', message: 'Life Support: CO₂ scrubber failure (high CO₂)' })
	else if (t.co2Ppm > 2000) alerts.push({ level: 'warning', message: 'Life Support: CO₂ buildup detected' })
	if (t.waterRecyclePct < 70) alerts.push({ level: 'warning', message: 'Life Support: Water recycling efficiency low' })
	if (t.cabinPressureKPa < 95) alerts.push({ level: 'critical', message: 'Life Support: Cabin pressure drop' })

	// Thermal
	if (t.radiatorEfficiencyPct < 60) alerts.push({ level: 'critical', message: 'Thermal: Radiator failure suspected' })
	else if (t.radiatorEfficiencyPct < 75) alerts.push({ level: 'warning', message: 'Thermal: Radiator efficiency reduced' })
	if (t.moduleTempImbalanceC > 5) alerts.push({ level: 'warning', message: 'Thermal: Temperature imbalance between modules' })

	// Power
	if (t.batteryLevelPct < 20) alerts.push({ level: 'critical', message: 'Power: Battery level critical (<20%)' })
	if (t.solarChargeKw < 0.5) alerts.push({ level: 'warning', message: 'Power: Solar panel charging low' })
	if (t.pduStatusOk === false) alerts.push({ level: 'critical', message: 'Power: PDU failure' })

	// Comms
	if (t.signalStrengthDb < -100) alerts.push({ level: 'critical', message: 'Comms: Signal strength lost' })
	else if (t.signalStrengthDb < -85) alerts.push({ level: 'warning', message: 'Comms: Weak signal' })
	if (t.antennaAligned === false) alerts.push({ level: 'warning', message: 'Comms: Antenna misalignment' })
	if (t.commsLinkUp === false) alerts.push({ level: 'critical', message: 'Comms: Communication blackout' })

	// Nav
	if (t.gyroOk === false || t.starTrackerOk === false) alerts.push({ level: 'critical', message: 'Nav: Gyro/Star tracker failure' })
	if (t.thrusterStatus === 'misfire') alerts.push({ level: 'critical', message: 'Nav: Thruster misfire detected' })
	if (t.dockingOk === false) alerts.push({ level: 'critical', message: 'Nav: Docking system error' })

	// Suit
	if (t.suitOxygenOk === false) alerts.push({ level: 'critical', message: 'EVA: Oxygen pack malfunction' })
	if (t.suitCoolingOk === false) alerts.push({ level: 'critical', message: 'EVA: Suit cooling failure' })
	if (t.suitPressureOk === false) alerts.push({ level: 'critical', message: 'EVA: Suit pressure loss' })

	// Hazard
	if (t.smokeDetected) alerts.push({ level: 'critical', message: 'Hazard: Smoke detected' })
	if (t.toxicAmmoniaPpm > 25) alerts.push({ level: 'critical', message: 'Hazard: Ammonia leak' })
	else if (t.toxicAmmoniaPpm > 10) alerts.push({ level: 'warning', message: 'Hazard: Toxic gas detected' })

	// Equipment
	if (t.roboticArmOk === false) alerts.push({ level: 'warning', message: 'Equipment: Robotic arm failure' })
	if (t.payloadOk === false) alerts.push({ level: 'warning', message: 'Equipment: Scientific payload malfunction' })
	return alerts
}

// --- SSE clients ---
const clients = new Set()
function broadcast(obj) {
	const data = `data: ${JSON.stringify(obj)}\n\n`
	for (const res of clients) {
		try { res.write(data) } catch { /* ignore */ }
	}
}

app.get('/sse', (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')
	res.flushHeaders()
	res.write('retry: 3000\n\n')
	clients.add(res)
	req.on('close', () => clients.delete(res))
})

// Ingest real telemetry
app.post('/telemetry', (req, res) => {
	const t = req.body || {}
	t.ts = Date.now()
	insertTelemetry.run(t.ts, JSON.stringify(t))
	const alerts = deriveAlerts(t)
	for (const a of alerts) insertAlert.run(t.ts, a.level, a.message)
	broadcast({ type: 'telemetry', telemetry: t, alerts })
	res.json({ ok: true })
})

// Basic recent history endpoint
app.get('/latest', (req, res) => {
	const row = db.prepare('SELECT ts, payload FROM telemetry ORDER BY id DESC LIMIT 1').get()
	if (!row) return res.json(null)
	res.json({ ts: row.ts, ...JSON.parse(row.payload) })
})

// --- Optional simulator (can be removed when feeding real data) ---
function randomWalk(base, maxDelta, min = -Infinity, max = Infinity) {
	const v = Number((base + (Math.random() - 0.5) * maxDelta).toFixed(2))
	return Math.min(max, Math.max(min, v))
}

let sim = {
	temperatureC: 22,
	pressureKPa: 101,
	vibrationMmS: 1.2,
	powerKw: 4.0,
	pump2TempC: 35,
	batteryHealthPct: 98,
	oxygenPct: 21,
	co2Ppm: 600,
	waterRecyclePct: 85,
	cabinPressureKPa: 101,
	radiatorEfficiencyPct: 90,
	moduleTempImbalanceC: 1.0,
	batteryLevelPct: 80,
	solarChargeKw: 3.0,
	pduStatusOk: true,
	signalStrengthDb: -65,
	antennaAligned: true,
	commsLinkUp: true,
	gyroOk: true,
	starTrackerOk: true,
	thrusterStatus: 'nominal',
	dockingOk: true,
	suitOxygenOk: true,
	suitCoolingOk: true,
	suitPressureOk: true,
	smokeDetected: false,
	toxicAmmoniaPpm: 0,
	roboticArmOk: true,
	payloadOk: true,
}

setInterval(() => {
	// Comment out this block to disable simulator
	sim = {
		...sim,
		temperatureC: randomWalk(sim.temperatureC, 0.6),
		pressureKPa: randomWalk(sim.pressureKPa, 0.8),
		vibrationMmS: Math.max(0, randomWalk(sim.vibrationMmS, 0.4)),
		powerKw: Math.max(0, randomWalk(sim.powerKw, 0.3)),
		pump2TempC: randomWalk(sim.pump2TempC, 0.9),
		batteryHealthPct: Math.max(50, randomWalk(sim.batteryHealthPct - 0.01, 0.02)),
		oxygenPct: randomWalk(sim.oxygenPct, 0.2, 18, 23.8),
		co2Ppm: Math.max(400, randomWalk(sim.co2Ppm, 20)),
		waterRecyclePct: randomWalk(sim.waterRecyclePct, 0.6, 60, 95),
		cabinPressureKPa: randomWalk(sim.cabinPressureKPa, 0.5),
		radiatorEfficiencyPct: randomWalk(sim.radiatorEfficiencyPct, 0.8, 50, 100),
		moduleTempImbalanceC: Math.max(0, randomWalk(sim.moduleTempImbalanceC, 0.2)),
		batteryLevelPct: Math.max(5, randomWalk(sim.batteryLevelPct - 0.02, 0.1)),
		solarChargeKw: Math.max(0, randomWalk(sim.solarChargeKw, 0.2)),
		signalStrengthDb: randomWalk(sim.signalStrengthDb, 1.0),
	}
	const t = { ts: Date.now(), ...sim }
	insertTelemetry.run(t.ts, JSON.stringify(t))
	const alerts = deriveAlerts(t)
	for (const a of alerts) insertAlert.run(t.ts, a.level, a.message)
	broadcast({ type: 'telemetry', telemetry: t, alerts })
}, 1500)

app.listen(PORT, () => {
	console.log(`Telemetry server on http://localhost:${PORT}`)
})

