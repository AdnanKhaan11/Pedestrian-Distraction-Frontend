/**
 * Centralized API service for all backend communications.
 * Every API call in the app goes through this file.
 */

// Use environment variable or default to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Extract WS protocol and host for WebSocket connections
const getWSUrl = (path) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, "")
    : "localhost:8000";
  return `${protocol}//${host}${path}`;
};

const parseJsonResponse = async (response, fallbackMessage) => {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || fallbackMessage);
  }

  return data;
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD APIs
// ─────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/stats`);
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  return response.json();
};

export const getDashboardTimeline = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/timeline`);
  if (!response.ok) throw new Error("Failed to fetch dashboard timeline");
  return response.json();
};

// ─────────────────────────────────────────────────────────────
// ALERTS APIs
// ─────────────────────────────────────────────────────────────

export const getAlerts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.severity) queryParams.append("severity", params.severity);
  if (params.resolved !== undefined)
    queryParams.append("resolved", params.resolved);
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);

  const url = `${API_BASE}/api/alerts?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch alerts");
  return response.json();
};

export const resolveAlert = async (alertId) => {
  const response = await fetch(`${API_BASE}/api/alerts/${alertId}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return parseJsonResponse(response, "Failed to resolve alert");
};

export const deleteAlert = async (alertId) => {
  const response = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
    method: "DELETE",
  });
  return parseJsonResponse(response, "Failed to delete alert");
};

// ─────────────────────────────────────────────────────────────
// SETTINGS APIs
// ─────────────────────────────────────────────────────────────

export const getSettings = async () => {
  const response = await fetch(`${API_BASE}/api/settings`);
  if (!response.ok) throw new Error("Failed to fetch settings");
  return response.json();
};

export const updateSettings = async (settings) => {
  const response = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error("Failed to update settings");
  return response.json();
};

// ─────────────────────────────────────────────────────────────
// DEVICES APIs
// ─────────────────────────────────────────────────────────────

export const getDevices = async () => {
  const response = await fetch(`${API_BASE}/api/devices`);
  if (!response.ok) throw new Error("Failed to fetch devices");
  return response.json();
};

// ─────────────────────────────────────────────────────────────
// FACES APIs
// ─────────────────────────────────────────────────────────────

export const getFaces = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const url = `${API_BASE}/api/faces?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch faces");
  return response.json();
};

export const deleteFace = async (faceId) => {
  const response = await fetch(`${API_BASE}/api/faces/${faceId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete face");
  return response.json();
};

// ─────────────────────────────────────────────────────────────
// TRAINING APIs
// ─────────────────────────────────────────────────────────────

export const startTraining = async (config) => {
  const response = await fetch(`${API_BASE}/api/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return parseJsonResponse(response, "Failed to start training");
};

export const getTrainingStatus = async () => {
  const response = await fetch(`${API_BASE}/api/train/status`);
  if (!response.ok) throw new Error("Failed to fetch training status");
  return response.json();
};

export const getCurrentTraining = async () => {
  const response = await fetch(`${API_BASE}/api/train/current`);
  return parseJsonResponse(response, "Failed to fetch current training job");
};

export const getTrainingHistory = async (limit = 20) => {
  const response = await fetch(`${API_BASE}/api/train/history?limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch training history");
  return response.json();
};

export const cancelTraining = async () => {
  const response = await fetch(`${API_BASE}/api/train/current`, {
    method: "DELETE",
  });
  return parseJsonResponse(response, "Failed to cancel training");
};

export const pauseTraining = async () => {
  const response = await fetch(`${API_BASE}/api/train/current/pause`, {
    method: "POST",
  });
  return parseJsonResponse(response, "Failed to pause training");
};

export const resumeTraining = async () => {
  const response = await fetch(`${API_BASE}/api/train/current/resume`, {
    method: "POST",
  });
  return parseJsonResponse(response, "Failed to resume training");
};

export const deleteTrainingHistoryJob = async (jobId) => {
  const response = await fetch(`${API_BASE}/api/train/history/${jobId}`, {
    method: "DELETE",
  });
  return parseJsonResponse(response, "Failed to delete training history");
};

// ─────────────────────────────────────────────────────────────
// DETECTION APIs (WebSocket)
// ─────────────────────────────────────────────────────────────

export const connectDetectionStream = () => {
  // Connect to WebSocket /ws/stream
  const wsUrl = getWSUrl("/ws/stream");
  return new WebSocket(wsUrl);
};

export const detectImage = async ({ frame, sessionId = "upload-session" }) => {
  const response = await fetch(`${API_BASE}/api/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      frame,
      session_id: sessionId,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to run image detection");
  }
  return response.json();
};

export const connectTrainingLogs = () => {
  // Connect to WebSocket /ws/train-logs
  const wsUrl = getWSUrl("/ws/train-logs");
  return new WebSocket(wsUrl);
};
