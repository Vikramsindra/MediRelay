// utils/vitalsHelper.js

// 🧠 Regex patterns
const VITAL_PATTERNS = {
  bloodPressure: /(?:BP|B\.P\.)[:\s]*(\d{2,3}\/\d{2,3})/i,
  heartRate: /(?:HR|pulse)[:\s]*(\d{2,3})/i,
  spo2: /(?:SpO2|oxygen)[:\s]*(\d{2,3})/i,
  temperature: /(?:temp)[:\s]*(\d{2}\.?\d?)/i,
  respiratoryRate: /(?:RR)[:\s]*(\d{1,2})/i,
  gcs: /(?:GCS)[:\s]*(\d{1,2})/i,
};

// 🔍 Extract vitals
const extractVitalsFromText = (text) => {
  if (!text) return {};

  const vitals = {};

  for (const [key, pattern] of Object.entries(VITAL_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      vitals[key] = key === "bloodPressure"
        ? match[1]
        : parseFloat(match[1]);
    }
  }

  return vitals;
};

// ⚡ Auto severity (simple version)
const autoDetectSeverity = (vitals = {}, complaint = "") => {
  const text = complaint.toLowerCase();

  // 🔴 Critical
  if (text.includes("stemi") || text.includes("stroke")) return "critical";
  if (vitals.spo2 && vitals.spo2 < 88) return "critical";
  if (vitals.gcs && vitals.gcs < 9) return "critical";

  // 🟡 High
  if (vitals.spo2 && vitals.spo2 < 94) return "high";
  if (vitals.heartRate && vitals.heartRate > 120) return "high";

  // 🟢 Default
  return "stable";
};

module.exports = {
  extractVitalsFromText,
  autoDetectSeverity,
};