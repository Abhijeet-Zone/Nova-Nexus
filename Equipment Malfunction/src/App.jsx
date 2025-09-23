import { useEffect, useMemo, useState } from 'react'
import './App.css'

function useMockTelemetry() {
	const [telemetry, setTelemetry] = useState(() => ({
		timestamp: Date.now(),
		temperatureC: 22,
		pressureKPa: 101,
		vibrationMmS: 1.2,
		powerKw: 4.0,
		pump2TempC: 35,
		batteryHealthPct: 98,
		// Life Support
		oxygenPct: 21,
		co2Ppm: 600,
		waterRecyclePct: 85,
		cabinPressureKPa: 101,
		// Thermal
		radiatorEfficiencyPct: 90,
		moduleTempImbalanceC: 1.0,
		// Power & Energy
		batteryLevelPct: 80,
		solarChargeKw: 3.0,
		pduStatusOk: true,
		// Communication
		signalStrengthDb: -65,
		antennaAligned: true,
		commsLinkUp: true,
		// Navigation & Control
		gyroOk: true,
		starTrackerOk: true,
		thrusterStatus: 'nominal', // 'nominal' | 'misfire'
		dockingOk: true,
		// Spacesuit & EVA
		suitOxygenOk: true,
		suitCoolingOk: true,
		suitPressureOk: true,
		// Fire / Toxic
		smokeDetected: false,
		toxicAmmoniaPpm: 0,
		// General Equipment
		roboticArmOk: true,
		payloadOk: true,
	}))

	useEffect(() => {
		const intervalId = setInterval(() => {
			setTelemetry((prev) => {
				const drift = (base, maxDelta) => Number((base + (Math.random() - 0.5) * maxDelta).toFixed(2))
				return {
					...prev,
					timestamp: Date.now(),
					temperatureC: drift(prev.temperatureC, 0.6),
					pressureKPa: drift(prev.pressureKPa, 0.8),
					vibrationMmS: Math.max(0, drift(prev.vibrationMmS, 0.4)),
					powerKw: Math.max(0, drift(prev.powerKw, 0.3)),
					pump2TempC: drift(prev.pump2TempC, 0.9),
					batteryHealthPct: Math.max(50, drift(prev.batteryHealthPct - 0.01, 0.02)),
					// Life Support
					oxygenPct: Math.min(23, Math.max(18, drift(prev.oxygenPct, 0.2))),
					co2Ppm: Math.max(400, drift(prev.co2Ppm, 20)),
					waterRecyclePct: Math.min(95, Math.max(60, drift(prev.waterRecyclePct, 0.6))),
					cabinPressureKPa: drift(prev.cabinPressureKPa, 0.5),
					// Thermal
					radiatorEfficiencyPct: Math.min(100, Math.max(50, drift(prev.radiatorEfficiencyPct, 0.8))),
					moduleTempImbalanceC: Math.max(0, drift(prev.moduleTempImbalanceC, 0.2)),
					// Power & Energy
					batteryLevelPct: Math.max(5, drift(prev.batteryLevelPct - 0.02, 0.1)),
					solarChargeKw: Math.max(0, drift(prev.solarChargeKw, 0.2)),
					// Communication
					signalStrengthDb: drift(prev.signalStrengthDb, 1.0),
				}
			})
		}, 1200)
		return () => clearInterval(intervalId)
	}, [])

	return telemetry
}

function deriveAlerts(telemetry) {
	const alerts = []
	// Existing
	if (telemetry.pump2TempC > 70) alerts.push({ level: 'critical', message: 'Cooling pump #2 is overheating' })
	else if (telemetry.pump2TempC > 55) alerts.push({ level: 'warning', message: 'Cooling pump #2 temperature trending high' })

	if (telemetry.vibrationMmS > 4) alerts.push({ level: 'critical', message: 'Excessive vibration detected in rotary assembly' })
	else if (telemetry.vibrationMmS > 2.5) alerts.push({ level: 'warning', message: 'Vibration above nominal threshold' })

	if (telemetry.pressureKPa < 95) alerts.push({ level: 'warning', message: 'Cabin pressure below target band' })
	if (telemetry.batteryHealthPct < 70) alerts.push({ level: 'warning', message: 'Battery health degraded; plan maintenance' })

	// Life Support
	if (telemetry.oxygenPct < 19.5) alerts.push({ level: 'critical', message: 'Life Support: O₂ too low' })
	else if (telemetry.oxygenPct > 23.5) alerts.push({ level: 'warning', message: 'Life Support: O₂ above safe band' })
	if (telemetry.co2Ppm > 5000) alerts.push({ level: 'critical', message: 'Life Support: CO₂ scrubber failure (high CO₂)' })
	else if (telemetry.co2Ppm > 2000) alerts.push({ level: 'warning', message: 'Life Support: CO₂ buildup detected' })
	if (telemetry.waterRecyclePct < 70) alerts.push({ level: 'warning', message: 'Life Support: Water recycling efficiency low' })
	if (telemetry.cabinPressureKPa < 95) alerts.push({ level: 'critical', message: 'Life Support: Cabin pressure drop' })

	// Thermal Control
	if (telemetry.radiatorEfficiencyPct < 60) alerts.push({ level: 'critical', message: 'Thermal: Radiator failure suspected' })
	else if (telemetry.radiatorEfficiencyPct < 75) alerts.push({ level: 'warning', message: 'Thermal: Radiator efficiency reduced' })
	if (telemetry.moduleTempImbalanceC > 5) alerts.push({ level: 'warning', message: 'Thermal: Temperature imbalance between modules' })

	// Power & Energy
	if (telemetry.batteryLevelPct < 20) alerts.push({ level: 'critical', message: 'Power: Battery level critical (<20%)' })
	if (telemetry.solarChargeKw < 0.5) alerts.push({ level: 'warning', message: 'Power: Solar panel charging low' })
	if (telemetry.pduStatusOk === false) alerts.push({ level: 'critical', message: 'Power: PDU failure' })

	// Communication System
	if (telemetry.signalStrengthDb < -100) alerts.push({ level: 'critical', message: 'Comms: Signal strength lost' })
	else if (telemetry.signalStrengthDb < -85) alerts.push({ level: 'warning', message: 'Comms: Weak signal' })
	if (telemetry.antennaAligned === false) alerts.push({ level: 'warning', message: 'Comms: Antenna misalignment' })
	if (telemetry.commsLinkUp === false) alerts.push({ level: 'critical', message: 'Comms: Communication blackout' })

	// Navigation & Control
	if (telemetry.gyroOk === false || telemetry.starTrackerOk === false) alerts.push({ level: 'critical', message: 'Nav: Gyro/Star tracker failure' })
	if (telemetry.thrusterStatus === 'misfire') alerts.push({ level: 'critical', message: 'Nav: Thruster misfire detected' })
	if (telemetry.dockingOk === false) alerts.push({ level: 'critical', message: 'Nav: Docking system error' })

	// Spacesuit & EVA Support
	if (telemetry.suitOxygenOk === false) alerts.push({ level: 'critical', message: 'EVA: Oxygen pack malfunction' })
	if (telemetry.suitCoolingOk === false) alerts.push({ level: 'critical', message: 'EVA: Suit cooling failure' })
	if (telemetry.suitPressureOk === false) alerts.push({ level: 'critical', message: 'EVA: Suit pressure loss' })

	// Fire / Toxic
	if (telemetry.smokeDetected) alerts.push({ level: 'critical', message: 'Hazard: Smoke detected' })
	if (telemetry.toxicAmmoniaPpm > 25) alerts.push({ level: 'critical', message: 'Hazard: Ammonia leak' })
	else if (telemetry.toxicAmmoniaPpm > 10) alerts.push({ level: 'warning', message: 'Hazard: Toxic gas detected' })

	// General Equipment
	if (telemetry.roboticArmOk === false) alerts.push({ level: 'warning', message: 'Equipment: Robotic arm failure' })
	if (telemetry.payloadOk === false) alerts.push({ level: 'warning', message: 'Equipment: Scientific payload malfunction' })

	return alerts
}

function derivePredictions(history) {
	// Simple trend analysis using last 20 samples
	const maxSamples = 20
	const recent = history.slice(-maxSamples)
	if (recent.length < 4) return []

	const slope = (key) => {
		const n = recent.length
		const xMean = (n - 1) / 2
		const yMean = recent.reduce((s, r) => s + r[key], 0) / n
		let num = 0
		let den = 0
		recent.forEach((r, i) => {
			num += (i - xMean) * (r[key] - yMean)
			den += (i - xMean) * (i - xMean)
		})
		return den === 0 ? 0 : num / den
	}

	const predictions = []
	const pumpTrend = slope('pump2TempC')
	if (pumpTrend > 0.25) predictions.push({
		component: 'Cooling pump #2',
		description: 'Temperature rising abnormally; projected to exceed safe limit in ~15 min',
		confidence: 0.78,
	})

	const vibTrend = slope('vibrationMmS')
	if (vibTrend > 0.12) predictions.push({
		component: 'Rotary assembly',
		description: 'Bearing wear likely; increasing vibration trend detected',
		confidence: 0.72,
	})

	const batteryTrend = slope('batteryHealthPct')
	if (batteryTrend < -0.02) predictions.push({
		component: 'Battery pack',
		description: 'Capacity fade accelerating; schedule cell balancing',
		confidence: 0.66,
	})

	return predictions
}

function deriveDiagnosis(telemetry, alerts) {
	// Rule-of-thumb diagnosis for demo
	if (alerts.some((a) => a.message.includes('pump #2')) && telemetry.vibrationMmS < 2)
		return { component: 'Cooling pump #2', cause: 'Impeller friction / coolant blockage', nextStep: 'Switch to backup pump and reduce thermal load' }
	if (telemetry.vibrationMmS > 4)
		return { component: 'Rotary assembly', cause: 'Bearing damage', nextStep: 'Throttle down RPM and engage damping' }
	if (telemetry.pressureKPa < 95)
		return { component: 'Pressure regulation', cause: 'Minor leak or regulator drift', nextStep: 'Tighten fittings; run leak check' }
	if (alerts.some((a) => a.message.startsWith('Life Support'))) 
		return { component: 'Life Support', cause: 'Atmospheric parameter out of range', nextStep: 'Check O₂ injectors and CO₂ scrubbers' }
	if (alerts.some((a) => a.message.startsWith('Thermal'))) 
		return { component: 'Thermal Control', cause: 'Heat rejection degraded', nextStep: 'Inspect radiators and pumps' }
	if (alerts.some((a) => a.message.startsWith('Power'))) 
		return { component: 'Power System', cause: 'Low capacity or distribution fault', nextStep: 'Reduce loads, triage PDU' }
	if (alerts.some((a) => a.message.startsWith('Comms')))
		return { component: 'Communications', cause: 'Link degradation', nextStep: 'Re-align antenna, check transceiver' }
	if (alerts.some((a) => a.message.startsWith('Nav'))) 
		return { component: 'Navigation', cause: 'Sensor/actuator fault', nextStep: 'Switch to redundant sensors, safe mode' }
	if (alerts.some((a) => a.message.startsWith('EVA'))) 
		return { component: 'Spacesuit', cause: 'Subsystem failure', nextStep: 'Abort EVA, return to airlock' }
	if (alerts.some((a) => a.message.startsWith('Hazard'))) 
		return { component: 'Environmental Hazard', cause: 'Smoke or toxic gas', nextStep: 'Seal compartment, scrub air' }
	if (alerts.some((a) => a.message.startsWith('Equipment'))) 
		return { component: 'Equipment', cause: 'Device malfunction', nextStep: 'Run built-in tests, reset module' }
	return { component: 'All systems', cause: 'Nominal', nextStep: 'Continue monitoring' }
}

export default function App() {
	const mockTelemetry = useMockTelemetry()
	const [history, setHistory] = useState([])
	const [autonomyEnabled, setAutonomyEnabled] = useState(true)
	const [eventLog, setEventLog] = useState([])
	const [simStrategy, setSimStrategy] = useState('switch-backup')

	// Live data via SSE
	const [liveEnabled, setLiveEnabled] = useState(false)
	const [liveStatus, setLiveStatus] = useState('off') // off | connecting | live | error
	const [liveTelemetry, setLiveTelemetry] = useState(null)
	const [liveAlerts, setLiveAlerts] = useState(null)

	useEffect(() => {
		if (!liveEnabled) return
		setLiveStatus('connecting')
		let es
		try {
			es = new EventSource('http://localhost:3001/sse')
			es.onmessage = (evt) => {
				try {
					const data = JSON.parse(evt.data)
					if (data.type === 'telemetry') {
						setLiveTelemetry(data.telemetry)
						setLiveAlerts(data.alerts || null)
						setLiveStatus('live')
					}
				} catch {
					// ignore malformed
				}
			}
			es.onerror = () => {
				setLiveStatus('error')
			}
		} catch {
			setLiveStatus('error')
		}
		return () => { if (es) es.close() }
	}, [liveEnabled])

	// Fault injection overrides
	const [overrides, setOverrides] = useState({
		pump2TempC: null,
		vibrationMmS: null,
		pressureKPa: null,
		batteryHealthPct: null,
		// New fields
		oxygenPct: null,
		co2Ppm: null,
		waterRecyclePct: null,
		cabinPressureKPa: null,
		radiatorEfficiencyPct: null,
		moduleTempImbalanceC: null,
		batteryLevelPct: null,
		solarChargeKw: null,
		pduStatusOk: null,
		signalStrengthDb: null,
		antennaAligned: null,
		commsLinkUp: null,
		gyroOk: null,
		starTrackerOk: null,
		thrusterStatus: null,
		dockingOk: null,
		suitOxygenOk: null,
		suitCoolingOk: null,
		suitPressureOk: null,
		smokeDetected: null,
		toxicAmmoniaPpm: null,
		roboticArmOk: null,
		payloadOk: null,
	})

	const baseTelemetry = liveEnabled && liveTelemetry ? liveTelemetry : mockTelemetry
	const teleWithOverrides = useMemo(() => {
		const applied = { ...baseTelemetry }
		Object.entries(overrides).forEach(([k, v]) => {
			if (v !== null) applied[k] = v
		})
		return applied
	}, [baseTelemetry, overrides])

	useEffect(() => {
		setHistory((h) => [...h.slice(-199), teleWithOverrides])
	}, [teleWithOverrides])

	const alerts = useMemo(() => (liveEnabled && liveAlerts ? liveAlerts : deriveAlerts(teleWithOverrides)), [liveEnabled, liveAlerts, teleWithOverrides])
	const predictions = useMemo(() => derivePredictions(history), [history])
	const diagnosis = useMemo(() => deriveDiagnosis(teleWithOverrides, alerts), [teleWithOverrides, alerts])

	const numCritical = alerts.filter(a => a.level === 'critical').length
	const numWarnings = alerts.filter(a => a.level === 'warning').length

	// Autonomous control: act on critical alerts
	useEffect(() => {
		if (!autonomyEnabled) return
		const critical = alerts.find((a) => a.level === 'critical')
		if (!critical) return
		if (critical.message.includes('pump #2')) {
			setEventLog((log) => [
				{ ts: new Date().toISOString(), text: 'Autonomy: Switched to backup cooling pump' },
				...log,
			])
		}
		if (critical.message.includes('vibration')) {
			setEventLog((log) => [
				{ ts: new Date().toISOString(), text: 'Autonomy: Reduced RPM by 20% and enabled damping' },
				...log,
			])
		}
		if (critical.message.includes('Communication blackout')) {
			setEventLog((log) => [
				{ ts: new Date().toISOString(), text: 'Autonomy: Switched to backup comms link' },
				...log,
			])
		}
		if (critical.message.includes('Battery level critical')) {
			setEventLog((log) => [
				{ ts: new Date().toISOString(), text: 'Autonomy: Shed non-critical loads' },
				...log,
			])
		}
	}, [alerts, autonomyEnabled])

	// Data reduction: keep only top alerts and latest telemetry snapshot counts
	const reducedIssues = alerts.slice(0, 3)
	const rawSize = Math.max(1, history.length) * 7 // fields per sample (approx for demo)
	const reducedSize = reducedIssues.length + 1 // +1 for snapshot summary

	function runSimulation() {
		let outcome = ''
		if (simStrategy === 'switch-backup') outcome = 'Switching to backup pump keeps temperature within safe band.'
		if (simStrategy === 'reduce-load') outcome = 'Reducing thermal load by 30% stabilizes pump temperature.'
		if (simStrategy === 'schedule-eva') outcome = 'Scheduling EVA repair mitigates risk but increases timeline.'
		setEventLog((log) => [
			{ ts: new Date().toISOString(), text: `Simulation: ${outcome}` },
			...log,
		])
	}

	function setFault(type) {
		// Existing shortcuts
		if (type === 'overheat') setOverrides((o) => ({ ...o, pump2TempC: 80 }))
		if (type === 'vibration') setOverrides((o) => ({ ...o, vibrationMmS: 5.2 }))
		if (type === 'leak') setOverrides((o) => ({ ...o, pressureKPa: 92, cabinPressureKPa: 92 }))
		if (type === 'battery') setOverrides((o) => ({ ...o, batteryHealthPct: 65, batteryLevelPct: 18 }))
		setEventLog((log) => [
			{ ts: new Date().toISOString(), text: `Fault injected: ${type}` },
			...log,
		])
	}

	function setSubsystemFault(subtype) {
		const now = new Date().toISOString()
		switch (subtype) {
			// Life Support
			case 'ls_o2_low': setOverrides((o) => ({ ...o, oxygenPct: 18.5 })); break
			case 'ls_o2_high': setOverrides((o) => ({ ...o, oxygenPct: 24.0 })); break
			case 'ls_co2_high': setOverrides((o) => ({ ...o, co2Ppm: 6000 })); break
			case 'ls_water_low': setOverrides((o) => ({ ...o, waterRecyclePct: 65 })); break
			case 'ls_pressure_drop': setOverrides((o) => ({ ...o, cabinPressureKPa: 90 })); break
			// Thermal
			case 'th_radiator_fail': setOverrides((o) => ({ ...o, radiatorEfficiencyPct: 55 })); break
			case 'th_temp_imbalance': setOverrides((o) => ({ ...o, moduleTempImbalanceC: 6 })); break
			// Power
			case 'pw_batt_critical': setOverrides((o) => ({ ...o, batteryLevelPct: 15 })); break
			case 'pw_solar_low': setOverrides((o) => ({ ...o, solarChargeKw: 0.2 })); break
			case 'pw_pdu_fail': setOverrides((o) => ({ ...o, pduStatusOk: false })); break
			// Comms
			case 'cm_signal_weak': setOverrides((o) => ({ ...o, signalStrengthDb: -90 })); break
			case 'cm_antenna_misalign': setOverrides((o) => ({ ...o, antennaAligned: false })); break
			case 'cm_blackout': setOverrides((o) => ({ ...o, commsLinkUp: false })); break
			// Navigation
			case 'nv_gyro_fail': setOverrides((o) => ({ ...o, gyroOk: false })); break
			case 'nv_startracker_fail': setOverrides((o) => ({ ...o, starTrackerOk: false })); break
			case 'nv_thruster_misfire': setOverrides((o) => ({ ...o, thrusterStatus: 'misfire' })); break
			case 'nv_docking_error': setOverrides((o) => ({ ...o, dockingOk: false })); break
			// Suit
			case 'sv_o2_fail': setOverrides((o) => ({ ...o, suitOxygenOk: false })); break
			case 'sv_cooling_fail': setOverrides((o) => ({ ...o, suitCoolingOk: false })); break
			case 'sv_pressure_loss': setOverrides((o) => ({ ...o, suitPressureOk: false })); break
			// Hazard
			case 'hz_smoke': setOverrides((o) => ({ ...o, smokeDetected: true })); break
			case 'hz_ammonia': setOverrides((o) => ({ ...o, toxicAmmoniaPpm: 30 })); break
			// Equipment
			case 'eq_arm_fail': setOverrides((o) => ({ ...o, roboticArmOk: false })); break
			case 'eq_payload_fail': setOverrides((o) => ({ ...o, payloadOk: false })); break
			default: break
		}
		setEventLog((log) => [ { ts: now, text: `Fault injected: ${subtype}` }, ...log ])
	}

	function resetFaults() {
		setOverrides({
			pump2TempC: null, vibrationMmS: null, pressureKPa: null, batteryHealthPct: null,
			oxygenPct: null, co2Ppm: null, waterRecyclePct: null, cabinPressureKPa: null,
			radiatorEfficiencyPct: null, moduleTempImbalanceC: null,
			batteryLevelPct: null, solarChargeKw: null, pduStatusOk: null,
			signalStrengthDb: null, antennaAligned: null, commsLinkUp: null,
			gyroOk: null, starTrackerOk: null, thrusterStatus: null, dockingOk: null,
			suitOxygenOk: null, suitCoolingOk: null, suitPressureOk: null,
			smokeDetected: null, toxicAmmoniaPpm: null, roboticArmOk: null, payloadOk: null,
		})
		setEventLog((log) => [
			{ ts: new Date().toISOString(), text: 'Fault overrides reset' },
			...log,
		])
	}

	const anyOverride = Object.values(overrides).some((v) => v !== null)

	// Systems Overview: compute health per subsystem
	const systemsOverview = useMemo(() => {
		function status(ok) { return ok ? 'OK' : 'Issue' }
		const t = teleWithOverrides
		return [
			{ name: 'Life Support', ok: (
				t.oxygenPct >= 19.5 && t.oxygenPct <= 23.5 &&
				t.co2Ppm <= 2000 &&
				t.waterRecyclePct >= 70 &&
				t.cabinPressureKPa >= 95
			) },
			{ name: 'Thermal Control', ok: (
				t.radiatorEfficiencyPct >= 75 &&
				t.moduleTempImbalanceC <= 5
			) },
			{ name: 'Power & Energy', ok: (
				t.batteryLevelPct >= 20 && t.pduStatusOk !== false
			) },
			{ name: 'Communications', ok: (
				t.signalStrengthDb >= -85 && t.antennaAligned !== false && t.commsLinkUp !== false
			) },
			{ name: 'Navigation & Control', ok: (
				t.gyroOk !== false && t.starTrackerOk !== false && t.thrusterStatus !== 'misfire' && t.dockingOk !== false
			) },
			{ name: 'Spacesuit & EVA', ok: (
				t.suitOxygenOk !== false && t.suitCoolingOk !== false && t.suitPressureOk !== false
			) },
			{ name: 'Hazard Detection', ok: (
				t.smokeDetected !== true && t.toxicAmmoniaPpm <= 10
			) },
			{ name: 'Equipment', ok: (
				t.roboticArmOk !== false && t.payloadOk !== false
			) },
		].map(s => ({ ...s, status: status(s.ok) }))
	}, [teleWithOverrides])

	function scrollToAlerts(){
		const el = document.getElementById('alerts')
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	return (
		<div className="app-container">
			<header className="app-header">
				<h1>Spacecraft Maintenance</h1>
				<div className="header-right">
					<div className="alert-indicator" onClick={scrollToAlerts} title={`${numCritical} critical, ${numWarnings} warnings`} role="button" aria-label="Alerts">
						<span className={`bell ${numCritical>0 ? 'pulse' : ''}`}>⚠</span>
						{numCritical>0 ? (
							<span className="badge critical">{numCritical}</span>
						) : numWarnings>0 ? (
							<span className="badge warning">{numWarnings}</span>
						) : null}
					</div>
					<label className="toggle">
						<input type="checkbox" checked={autonomyEnabled} onChange={(e) => setAutonomyEnabled(e.target.checked)} />
						<span>Autonomous Control</span>
					</label>
					<label className="toggle">
						<input type="checkbox" checked={liveEnabled} onChange={(e) => setLiveEnabled(e.target.checked)} />
						<span>Live Data {liveEnabled && <small className="muted">({liveStatus})</small>}</span>
					</label>
				</div>
			</header>

			<main className="grid">
				<section className="card wide">
					<h2>Live Telemetry {anyOverride && <span className="muted">(overrides active)</span>}</h2>
					<div className="telemetry">
						<div><span>Temp (C)</span><strong>{teleWithOverrides.temperatureC.toFixed(1)}</strong></div>
						<div><span>Pressure (kPa)</span><strong>{teleWithOverrides.pressureKPa.toFixed(1)}</strong></div>
						<div><span>Vibration (mm/s)</span><strong>{teleWithOverrides.vibrationMmS.toFixed(2)}</strong></div>
						<div><span>Power (kW)</span><strong>{teleWithOverrides.powerKw.toFixed(2)}</strong></div>
						<div><span>Pump #2 Temp (C)</span><strong>{teleWithOverrides.pump2TempC.toFixed(1)}</strong></div>
						<div><span>Battery Health (%)</span><strong>{teleWithOverrides.batteryHealthPct.toFixed(1)}</strong></div>
						<div><span>O₂ (%)</span><strong>{teleWithOverrides.oxygenPct.toFixed(1)}</strong></div>
						<div><span>CO₂ (ppm)</span><strong>{teleWithOverrides.co2Ppm.toFixed(0)}</strong></div>
						<div><span>Water Recycle (%)</span><strong>{teleWithOverrides.waterRecyclePct.toFixed(0)}</strong></div>
						<div><span>Cabin Pressure (kPa)</span><strong>{teleWithOverrides.cabinPressureKPa.toFixed(1)}</strong></div>
						<div><span>Radiator Eff. (%)</span><strong>{teleWithOverrides.radiatorEfficiencyPct.toFixed(0)}</strong></div>
						<div><span>Temp Imbalance (°C)</span><strong>{teleWithOverrides.moduleTempImbalanceC.toFixed(1)}</strong></div>
						<div><span>Battery Level (%)</span><strong>{teleWithOverrides.batteryLevelPct.toFixed(0)}</strong></div>
						<div><span>Solar Charge (kW)</span><strong>{teleWithOverrides.solarChargeKw.toFixed(1)}</strong></div>
						<div><span>Signal (dB)</span><strong>{teleWithOverrides.signalStrengthDb.toFixed(0)}</strong></div>
					</div>
					<small className="muted">Last update: {new Date((liveEnabled && liveTelemetry ? liveTelemetry.ts : teleWithOverrides.timestamp)).toLocaleTimeString()}</small>
				</section>

				<section className="card" id="alerts">
					<h2>Alerts</h2>
					{alerts.length === 0 ? (
						<p className="muted">All systems nominal.</p>
					) : (
						<ul className="list">
							{alerts.map((a, i) => (
								<li key={i} className={a.level}>
									<strong>{a.level.toUpperCase()}</strong> — {a.message}
								</li>
							))}
						</ul>
					)}
				</section>

				<section className="card">
					<h2>Fault Diagnosis</h2>
					<div className="diagnosis">
						<div><span>Component</span><strong>{diagnosis.component}</strong></div>
						<div><span>Cause</span><strong>{diagnosis.cause}</strong></div>
						<div><span>Recommended</span><strong>{diagnosis.nextStep}</strong></div>
					</div>
				</section>

				<section className="card">
					<h2>Repair Simulation</h2>
					<div className="sim">
						<select value={simStrategy} onChange={(e) => setSimStrategy(e.target.value)}>
							<option value="switch-backup">Switch to backup pump</option>
							<option value="reduce-load">Reduce thermal load</option>
							<option value="schedule-eva">Schedule EVA repair</option>
						</select>
						<button onClick={runSimulation}>Run Simulation</button>
					</div>
				</section>

				<section className="card">
					<h2>Data Reduction</h2>
					<p className="muted">Raw signals: {rawSize} values → Highlighted issues: {reducedSize}</p>
					<ul className="list">
						{reducedIssues.map((a, i) => (
							<li key={i} className={a.level}>
								<strong>{a.level.toUpperCase()}</strong> — {a.message}
							</li>
						))}
					</ul>
				</section>

				<section className="card">
					<h2>Systems Overview</h2>
					<ul className="list">
						{systemsOverview.map((s, i) => (
							<li key={i} className={s.ok ? '' : 'warning'}>
								<strong>{s.name}</strong> — <span className="muted">{s.status}</span>
							</li>
						))}
					</ul>
				</section>

				<section className="card">
					<h2>Fault Injection</h2>
					<div className="sim" style={{flexWrap:'wrap'}}>
						<button onClick={() => setFault('overheat')}>Overheat pump</button>
						<button onClick={() => setFault('vibration')}>High vibration</button>
						<button onClick={() => setFault('leak')}>Pressure leak</button>
						<button onClick={() => setFault('battery')}>Battery degrade</button>
						<select onChange={(e) => { if (e.target.value) { setSubsystemFault(e.target.value); e.target.value=''} }} defaultValue="">
							<option value="" disabled>Inject subsystem fault…</option>
							<optgroup label="Life Support">
								<option value="ls_o2_low">O₂ too low</option>
								<option value="ls_o2_high">O₂ too high</option>
								<option value="ls_co2_high">CO₂ scrubber failure</option>
								<option value="ls_water_low">Water recycling low</option>
								<option value="ls_pressure_drop">Cabin pressure drop</option>
							</optgroup>
							<optgroup label="Thermal Control">
								<option value="th_radiator_fail">Radiator failure</option>
								<option value="th_temp_imbalance">Temp imbalance</option>
							</optgroup>
							<optgroup label="Power & Energy">
								<option value="pw_batt_critical">Battery critical</option>
								<option value="pw_solar_low">Solar charging low</option>
								<option value="pw_pdu_fail">PDU failure</option>
							</optgroup>
							<optgroup label="Communication">
								<option value="cm_signal_weak">Weak signal</option>
								<option value="cm_antenna_misalign">Antenna misalignment</option>
								<option value="cm_blackout">Communication blackout</option>
							</optgroup>
							<optgroup label="Navigation & Control">
								<option value="nv_gyro_fail">Gyro failure</option>
								<option value="nv_startracker_fail">Star tracker failure</option>
								<option value="nv_thruster_misfire">Thruster misfire</option>
								<option value="nv_docking_error">Docking system error</option>
							</optgroup>
							<optgroup label="Spacesuit & EVA">
								<option value="sv_o2_fail">Suit oxygen malfunction</option>
								<option value="sv_cooling_fail">Suit cooling failure</option>
								<option value="sv_pressure_loss">Suit pressure loss</option>
							</optgroup>
							<optgroup label="Hazard / Toxic">
								<option value="hz_smoke">Smoke detected</option>
								<option value="hz_ammonia">Ammonia leak</option>
							</optgroup>
							<optgroup label="Equipment">
								<option value="eq_arm_fail">Robotic arm failure</option>
								<option value="eq_payload_fail">Scientific payload malfunction</option>
							</optgroup>
						</select>
						<button onClick={resetFaults}>Reset</button>
					</div>
					{anyOverride && (
						<p className="muted">Overrides: {Object.entries(overrides).filter(([,v]) => v!==null).map(([k]) => k).join(', ')}</p>
					)}
				</section>

				<section className="card wide">
					<h2>Event Log</h2>
					{eventLog.length === 0 ? (
						<p className="muted">No events yet.</p>
					) : (
						<ul className="log">
							{eventLog.map((e, i) => (
								<li key={i}><span className="muted">{e.ts}</span> — {e.text}</li>
							))}
						</ul>
					)}
				</section>
			</main>
			<footer className="app-footer">
				<span>Demo only — not flight software</span>
			</footer>
		</div>
	)
}
