import React, { useEffect, useMemo, useState } from "react";
import { getStress, saveAssessment, loadAssessments } from "./api";

export default function StressMonitor() {
	const [liveStress, setLiveStress] = useState(null);
	const [recommendation, setRecommendation] = useState("");
	const [answers, setAnswers] = useState({
		workload: 2,
		sleep: 2,
		focus: 2,
		mood: 2,
		comms: 2,
	});
	const [history, setHistory] = useState([]);

	useEffect(() => {
		let isMounted = true;
		async function fetchData() {
			const data = await getStress();
			if (!isMounted) return;
			setLiveStress(data.stress);
			setRecommendation(data.recommendation);
		}
		fetchData();
		const interval = setInterval(fetchData, 5000);
		return () => {
			isMounted = false;
			clearInterval(interval);
		};
	}, []);

	useEffect(() => {
		const existing = loadAssessments();
		setHistory(existing);
	}, []);

	const score = useMemo(() => {
		// Higher is more stressed: invert positive items as needed
		const weights = { workload: 1.0, sleep: 1.0, focus: 1.0, mood: 1.0, comms: 1.0 };
		const raw = (
			answers.workload * weights.workload +
			(4 - answers.sleep) * weights.sleep +
			answers.focus * weights.focus +
			answers.mood * weights.mood +
			answers.comms * weights.comms
		);
		// Normalize to 0-100 (max raw 20)
		return Math.round((raw / 20) * 100);
	}, [answers]);

	const aiTips = useMemo(() => {
		if (score >= 70) {
			return [
				"Enable AI Copilot for procedure checklists to reduce cognitive load.",
				"Let AI auto-summarize comms and flag action items.",
				"Use guided 2-minute box-breathing: 4-4-4-4 pattern.",
			];
		}
		if (score >= 40) {
			return [
				"Use AI to pre-fill logs and you confirm.",
				"Switch comms to highlights-only digest.",
				"Schedule a micro-break after current task.",
			];
		}
		return [
			"Keep AI suggestions on passive mode (notifications only).",
			"Batch messages; let AI triage non-urgent queries.",
		];
	}, [score]);

	function updateAnswer(key, value) {
		setAnswers((prev) => ({ ...prev, [key]: Number(value) }));
	}

	function handleSave() {
		const record = {
			timestamp: Date.now(),
			score,
			answers,
			liveStress,
			aiTips,
		};
		saveAssessment(record);
		setHistory((prev) => [record, ...prev].slice(0, 10));
	}

	return (
		<div className="card">
			<h2>🧠 Psychological Stress Assessment</h2>
			<p>Live estimator: {liveStress === null ? "—" : `${liveStress}/100`}</p>
			<p><strong>AI Recommendation:</strong> {recommendation}</p>

			<div style={{ display: "grid", gap: 12, marginTop: 12 }}>
				<label>
					Workload pressure (0 low - 4 high)
					<input type="range" min="0" max="4" value={answers.workload} onChange={(e) => updateAnswer("workload", e.target.value)} />
				</label>
				<label>
					Sleep quality (0 poor - 4 excellent)
					<input type="range" min="0" max="4" value={answers.sleep} onChange={(e) => updateAnswer("sleep", e.target.value)} />
				</label>
				<label>
					Focus difficulty (0 easy - 4 hard)
					<input type="range" min="0" max="4" value={answers.focus} onChange={(e) => updateAnswer("focus", e.target.value)} />
				</label>
				<label>
					Mood strain (0 calm - 4 tense)
					<input type="range" min="0" max="4" value={answers.mood} onChange={(e) => updateAnswer("mood", e.target.value)} />
				</label>
				<label>
					Communication load (0 light - 4 heavy)
					<input type="range" min="0" max="4" value={answers.comms} onChange={(e) => updateAnswer("comms", e.target.value)} />
				</label>
			</div>

			<div style={{ marginTop: 16 }}>
				<p><strong>Assessment score:</strong> {score}/100</p>
				<ul>
					{aiTips.map((tip, idx) => (
						<li key={idx}>{tip}</li>
					))}
				</ul>
				<button onClick={handleSave}>Save Assessment</button>
			</div>

			{history.length > 0 && (
				<div style={{ marginTop: 16 }}>
					<h3>Recent assessments</h3>
					<ul>
						{history.map((h) => (
							<li key={h.timestamp}>
								{new Date(h.timestamp).toLocaleTimeString()} — {h.score}/100 (live {h.liveStress ?? "—"})
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
