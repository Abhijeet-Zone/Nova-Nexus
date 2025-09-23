// services/api.js

export async function getNavigation() {
    // simulate API data
    return { x: 90.03, y: 19.91, z: 48.64 };
}

export async function getStress() {
    // simulate AI API response
    const stress = Math.floor(Math.random() * 100); // random stress level
    const recommendation =
        stress > 70
            ? "Take a short break and do breathing exercises."
            : stress > 40
            ? "Maintain focus, but consider a quick relaxation."
            : "All good! Continue mission tasks.";

    return { stress, recommendation };
}

export async function getCommunication() {
    // simulate comms status
    const isLive = Math.random() > 0.2; // 80% chance it's live
    return { status: isLive ? "Live ✅" : "Disconnected ❌" };
}

const STORAGE_KEY = "stress_assessments_v1";

export function saveAssessment(record) {
    try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        list.unshift(record);
        const trimmed = list.slice(0, 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
        // no-op
    }
}

export function loadAssessments() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
        return [];
    }
}
  