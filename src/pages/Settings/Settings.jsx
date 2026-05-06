import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  cancelTraining,
  connectTrainingLogs,
  deleteTrainingHistoryJob,
  getSettings,
  getTrainingHistory,
  getTrainingStatus,
  pauseTraining,
  resumeTraining,
  startTraining,
  updateSettings,
} from "../../services/api";

const toastBaseStyle = {
  position: "fixed",
  top: "18px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1500,
  minWidth: "320px",
  maxWidth: "520px",
  padding: "14px 18px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: 600,
  boxShadow: "0 14px 36px rgba(0, 0, 0, 0.28)",
};

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [trainingModel, setTrainingModel] = useState("posture_classifier");
  const [trainingEpochs, setTrainingEpochs] = useState(10);
  const [trainingLR, setTrainingLR] = useState(0.001);
  const [trainingBatchSize, setTrainingBatchSize] = useState(32);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isStartingTraining, setIsStartingTraining] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingHistoryError, setTrainingHistoryError] = useState(null);
  const trainingWsRef = useRef(null);
  const trainingStatusIntervalRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrainingHistory = useCallback(async () => {
    try {
      setTrainingHistoryError(null);
      const data = await getTrainingHistory(20);
      setTrainingHistory(data.history || []);
    } catch (err) {
      console.error("Failed to fetch training history:", err);
      setTrainingHistoryError(err.message || "Failed to load training history");
    }
  }, []);

  const getJobId = (job) => job?.job_id || job?._id || "";

  useEffect(() => {
    fetchSettings();
    fetchTrainingHistory();
    return () => {
      window.clearTimeout(toastTimeoutRef.current);
    };
  }, [fetchSettings, fetchTrainingHistory, showToast]);

  const stopTrainingPolling = useCallback(() => {
    if (trainingStatusIntervalRef.current) {
      window.clearInterval(trainingStatusIntervalRef.current);
      trainingStatusIntervalRef.current = null;
    }
  }, []);

  const handleTrainingFinished = useCallback(
    async (nextStatus) => {
      stopTrainingPolling();
      setIsTraining(false);
      setIsStartingTraining(false);
      trainingWsRef.current?.close();
      trainingWsRef.current = null;
      if (nextStatus) {
        setTrainingStatus(nextStatus);
        setTrainingProgress(nextStatus.progress_percent || 0);
      }
      await fetchTrainingHistory();
    },
    [fetchTrainingHistory, stopTrainingPolling],
  );

  const pollTrainingStatus = useCallback(async () => {
    try {
      const status = await getTrainingStatus();
      setTrainingStatus(status);
      setIsTraining(status.status === "running");
      setTrainingProgress(status.progress_percent || 0);

      if (status.status === "paused") {
        setIsTraining(false);
      }

      if (["completed", "cancelled", "error", "none"].includes(status.status)) {
        await handleTrainingFinished(status);
      }
    } catch (err) {
      console.error("Failed to fetch training status:", err);
    }
  }, [handleTrainingFinished]);

  const startTrainingPolling = useCallback(() => {
    stopTrainingPolling();
    trainingStatusIntervalRef.current = window.setInterval(() => {
      pollTrainingStatus();
    }, 2000);
  }, [pollTrainingStatus, stopTrainingPolling]);

  const connectTrainingWS = useCallback(() => {
    trainingWsRef.current?.close();

    const ws = connectTrainingLogs();
    ws.onopen = () => {
      setTrainingLogs((prev) => [...prev, "Connected to training log stream."]);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "progress") {
          const epoch = Number(msg.epoch || 0);
          const totalEpochs = Number(msg.total_epochs || 0);
          setTrainingProgress(
            totalEpochs > 0 ? (epoch / totalEpochs) * 100 : 0,
          );
          setTrainingLogs((prev) => [
            ...prev,
            `[${epoch}/${totalEpochs || "?"}] loss: ${msg.loss?.toFixed?.(4) ?? "--"} acc: ${msg.accuracy?.toFixed?.(4) ?? "--"}`,
          ]);
        } else if (msg.type === "log") {
          setTrainingLogs((prev) => [...prev, msg.message]);
        } else if (msg.type === "complete") {
          setTrainingProgress(100);
          setTrainingLogs((prev) => [
            ...prev,
            `Training complete. Accuracy: ${msg.metrics?.final_accuracy ?? "--"}`,
          ]);
          const nextStatus = {
            ...(trainingStatus || {}),
            status: "completed",
            metrics: msg.metrics || {},
            progress_percent: 100,
          };
          handleTrainingFinished(nextStatus);
          showToast("success", "Training completed successfully.");
          ws.close();
        } else if (msg.type === "error") {
          setTrainingLogs((prev) => [...prev, `Error: ${msg.message}`]);
          const nextStatus = {
            ...(trainingStatus || {}),
            status: "error",
          };
          handleTrainingFinished(nextStatus);
          showToast("error", msg.message || "Training failed.");
          ws.close();
        }
      } catch (parseError) {
        console.error(parseError);
      }
    };
    ws.onerror = () => {
      setTrainingLogs((prev) => [
        ...prev,
        "Training log stream error. Live logs may be unavailable.",
      ]);
    };
    ws.onclose = () => {
      trainingWsRef.current = null;
    };
    trainingWsRef.current = ws;
  }, [handleTrainingFinished, showToast, trainingStatus]);

  useEffect(() => {
    return () => {
      stopTrainingPolling();
      trainingWsRef.current?.close();
    };
  }, [stopTrainingPolling]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNumberChange = (key, value, parser = parseFloat) => {
    setSettings((prev) => ({ ...prev, [key]: parser(value) }));
  };

  const handleSaveSettings = async () => {
    if (!settings) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const { _id, ...settingsToSend } = settings;
      const response = await updateSettings(settingsToSend);
      const refreshed = await getSettings();
      setSettings(refreshed);
      showToast(
        "success",
        response.message || "Settings saved successfully.",
      );
    } catch (err) {
      console.error("Settings save failed:", err);
      const message = err.message || "Failed to save settings";
      setError(message);
      showToast("error", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartTraining = useCallback(async () => {
    try {
      setError(null);
      setTrainingLogs([]);
      setTrainingProgress(0);
      setIsStartingTraining(true);
      connectTrainingWS();
      const result = await startTraining({
        model_type: trainingModel,
        epochs: trainingEpochs,
        learning_rate: trainingLR,
        batch_size: trainingBatchSize,
      });
      setIsTraining(true);
      const nextStatus = {
        job_id: result.job_id,
        status: "running",
        model_type: trainingModel,
        started_at: new Date().toISOString(),
        current_epoch: 0,
        total_epochs: trainingEpochs,
        progress_percent: 0,
      };
      setTrainingStatus(nextStatus);
      startTrainingPolling();
      pollTrainingStatus();
      setTrainingLogs((prev) => [
        ...prev,
        `${trainingModel === "phone_detector" ? "Phone detector" : "Posture classifier"} training started.`,
      ]);
      showToast("success", "Training started.");
    } catch (err) {
      trainingWsRef.current?.close();
      trainingWsRef.current = null;
      stopTrainingPolling();
      setIsTraining(false);
      setTrainingStatus(null);
      console.error("Failed to start training:", err);
      const message = err.message || "Failed to start training";
      setError(message);
      showToast("error", message);
    } finally {
      setIsStartingTraining(false);
    }
  }, [connectTrainingWS, pollTrainingStatus, showToast, startTrainingPolling, stopTrainingPolling, trainingBatchSize, trainingEpochs, trainingLR, trainingModel]);

  const handleStopTraining = useCallback(async () => {
    try {
      setError(null);
      const result = await cancelTraining();
      const nextStatus = {
        ...(trainingStatus || {}),
        status: "cancelled",
        progress_percent: trainingProgress,
      };
      setTrainingLogs((prev) => [...prev, result.message || "Training cancelled"]);
      await handleTrainingFinished(nextStatus);
      showToast("success", result.message || "Training cancelled.");
    } catch (err) {
      console.error("Failed to stop training:", err);
      const message = err.message || "Failed to stop training";
      setError(message);
      showToast("error", message);
    }
  }, [handleTrainingFinished, showToast, trainingProgress, trainingStatus]);

  const handlePauseTraining = useCallback(async () => {
    try {
      setError(null);
      const result = await pauseTraining();
      stopTrainingPolling();
      setIsTraining(false);
      setTrainingStatus((prev) => ({
        ...(prev || {}),
        status: "paused",
      }));
      setTrainingLogs((prev) => [...prev, result.message || "Training paused"]);
      showToast("success", result.message || "Training paused.");
    } catch (err) {
      console.error("Failed to pause training:", err);
      const message = err.message || "Failed to pause training";
      setError(message);
      showToast("error", message);
    }
  }, [showToast, stopTrainingPolling]);

  const handleResumeTraining = useCallback(async () => {
    try {
      setError(null);
      const result = await resumeTraining();
      setIsTraining(true);
      setTrainingStatus((prev) => ({
        ...(prev || {}),
        status: "running",
      }));
      setTrainingLogs((prev) => [...prev, result.message || "Training resumed"]);
      startTrainingPolling();
      pollTrainingStatus();
      showToast("success", result.message || "Training resumed.");
    } catch (err) {
      console.error("Failed to resume training:", err);
      const message = err.message || "Failed to resume training";
      setError(message);
      showToast("error", message);
    }
  }, [pollTrainingStatus, resumeTraining, showToast, startTrainingPolling]);

  const handleDeleteTrainingHistory = useCallback(
    async (job, event) => {
      event.stopPropagation();

      const jobId = getJobId(job);
      if (!jobId) {
        return;
      }

      try {
        setTrainingHistoryError(null);
        await deleteTrainingHistoryJob(jobId);
        setTrainingHistory((prev) =>
          prev.filter((item) => getJobId(item) !== jobId),
        );
        showToast("success", "Training history deleted.");
      } catch (err) {
        console.error("Failed to delete training history:", err);
        const message = err.message || "Failed to delete training history";
        setTrainingHistoryError(message);
        showToast("error", message);
      }
    },
    [showToast],
  );

  const handleTrainingHistoryCardClick = useCallback(
    async (job) => {
      if (!["running", "paused"].includes(job?.status)) {
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to stop the current training session? This will end the training immediately.",
      );

      if (!confirmed) {
        return;
      }

      await handleStopTraining();
    },
    [handleStopTraining],
  );

  const isPaused = trainingStatus?.status === "paused";
  const isTrainingActive = isTraining || isPaused || isStartingTraining;
  const isCompactLayout =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  const formatDateTime = (value) => {
    if (!value) {
      return "--";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }

    return parsed.toLocaleString();
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!startedAt) {
      return "--";
    }

    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();

    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return "--";
    }

    const totalSeconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <p style={{ color: "var(--color-danger)" }}>
          Failed to load settings.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && (
        <div
          style={{
            ...toastBaseStyle,
            backgroundColor:
              toast.type === "success"
                ? "var(--color-success-dim)"
                : "var(--color-danger-dim)",
            border: `1px solid ${toast.type === "success" ? "var(--color-success)" : "var(--color-danger)"}`,
            color:
              toast.type === "success"
                ? "var(--color-success)"
                : "var(--color-danger)",
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          Configure detection, camera, and training preferences.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--color-danger-dim)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            Detection Thresholds
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {[
              {
                key: "detection_confidence_threshold",
                label: "Detection Confidence",
                description: "Minimum confidence for detections",
              },
              {
                key: "alert_confidence_threshold",
                label: "Alert Confidence",
                description: "Threshold for creating alerts",
              },
              {
                key: "face_similarity_threshold",
                label: "Face Similarity",
                description: "Threshold for face matching",
              },
            ].map((item) => (
              <div key={item.key}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  {item.label}{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    {(settings[item.key] * 100).toFixed(0)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings[item.key] * 100}
                  onChange={(event) =>
                    handleNumberChange(
                      item.key,
                      parseFloat(event.target.value) / 100,
                    )
                  }
                  style={{
                    width: "100%",
                    accentColor: "var(--accent-cyan)",
                    cursor: "pointer",
                  }}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    margin: "4px 0 0 0",
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            Camera & Runtime
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Camera Resolution
              </label>
              <select
                value={settings.camera_resolution}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    camera_resolution: event.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              >
                <option value="640x360">360p (640x360)</option>
                <option value="854x480">480p (854x480)</option>
                <option value="1280x720">720p (1280x720)</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Requested Frame Sample Rate
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.frame_sample_rate}
                onChange={(event) =>
                  handleNumberChange(
                    "frame_sample_rate",
                    event.target.value,
                    (value) => parseInt(value, 10),
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Auto Refresh Interval (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="60000"
                step="500"
                value={settings.auto_refresh_interval_ms}
                onChange={(event) =>
                  handleNumberChange(
                    "auto_refresh_interval_ms",
                    event.target.value,
                    (value) => parseInt(value, 10),
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            Features
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Notifications Enabled
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Show real-time alert feedback
                </p>
              </div>
              <button
                onClick={() => handleToggle("notifications_enabled")}
                style={{
                  position: "relative",
                  width: "44px",
                  height: "24px",
                  borderRadius: "99px",
                  backgroundColor: settings.notifications_enabled
                    ? "var(--accent-cyan)"
                    : "var(--bg-surface)",
                  border: `1px solid ${settings.notifications_enabled ? "var(--accent-cyan)" : "var(--border-default)"}`,
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "18px",
                    height: "18px",
                    borderRadius: "99px",
                    backgroundColor: "white",
                    transform: settings.notifications_enabled
                      ? "translateX(20px)"
                      : "translateX(0)",
                    transition: "transform 0.15s ease",
                  }}
                />
              </button>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Active Model
              </label>
              <select
                value={settings.active_model}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    active_model: event.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              >
                <option value="phone_detector">Phone Detector</option>
                <option value="posture_classifier">Posture Classifier</option>
                <option value="posture_classifier_v1">
                  Posture Classifier v1
                </option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Max Concurrent Cameras
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={settings.max_concurrent_cameras}
                onChange={(event) =>
                  handleNumberChange(
                    "max_concurrent_cameras",
                    event.target.value,
                    (value) => parseInt(value, 10),
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: isCompactLayout ? "stretch" : "flex-end",
        }}
      >
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          style={{
            width: isCompactLayout ? "100%" : "auto",
            padding: "12px 24px",
            backgroundColor: isSaving
              ? "var(--bg-surface)"
              : "var(--accent-cyan)",
            color: isSaving ? "var(--text-muted)" : "var(--bg-primary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: "0 0 16px 0",
          }}
        >
          Model Training
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Model
            </label>
            <select
              value={trainingModel}
              onChange={(event) => setTrainingModel(event.target.value)}
              disabled={isTrainingActive}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            >
              <option value="posture_classifier">Posture Classifier</option>
              <option value="phone_detector">Phone Detector</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Epochs
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={trainingEpochs}
              onChange={(event) => setTrainingEpochs(parseInt(event.target.value, 10))}
              disabled={isTrainingActive}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Learning Rate
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              max="0.1"
              value={trainingLR}
              onChange={(event) => setTrainingLR(parseFloat(event.target.value))}
              disabled={isTrainingActive}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Batch Size
            </label>
            <input
              type="number"
              min="1"
              max="256"
              value={trainingBatchSize}
              onChange={(event) =>
                setTrainingBatchSize(parseInt(event.target.value, 10))
              }
              disabled={isTrainingActive}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <button
            onClick={handleStartTraining}
            disabled={isTrainingActive}
            style={{
              padding: "10px 20px",
              backgroundColor: isTrainingActive
                ? "var(--bg-surface)"
                : "var(--accent-cyan)",
              color:
                isTrainingActive
                  ? "var(--text-muted)"
                  : "var(--bg-primary)",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isTrainingActive ? "not-allowed" : "pointer",
              width: isCompactLayout ? "100%" : "auto",
            }}
          >
            {isTraining
              ? "Training in progress..."
              : isStartingTraining
                ? "Starting training..."
                : "Start Training"}
          </button>

          {isTraining && (
            <button
              onClick={handlePauseTraining}
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--color-warning)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: isCompactLayout ? "100%" : "auto",
              }}
            >
              Pause Training
            </button>
          )}

          {isPaused && (
            <button
              onClick={handleResumeTraining}
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--color-success)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: isCompactLayout ? "100%" : "auto",
              }}
            >
              Resume Training
            </button>
          )}

          {(isTraining || isPaused) && (
            <button
              onClick={handleStopTraining}
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--color-danger)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: isCompactLayout ? "100%" : "auto",
              }}
            >
              Stop Training
            </button>
          )}
        </div>

        {(isTraining || isStartingTraining || isPaused) && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Training Progress
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--accent-cyan)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {Math.round(trainingProgress)}%
                </span>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                }}
              >
                Status:{" "}
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {trainingStatus?.status || (isStartingTraining ? "starting" : "running")}
                </span>
                {" • "}
                Epoch{" "}
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {trainingStatus?.current_epoch || 0}/
                  {trainingStatus?.total_epochs || trainingEpochs}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "99px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${trainingProgress}%`,
                    height: "100%",
                    backgroundColor: "var(--accent-cyan)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "8px",
                maxHeight: "200px",
                overflowY: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                lineHeight: "1.4",
              }}
            >
              {trainingLogs.length === 0 ? (
                <div style={{ color: "var(--text-muted)" }}>Waiting for logs...</div>
              ) : (
                trainingLogs.map((log, index) => <div key={index}>{log}</div>)
              )}
            </div>
          </div>
        )}

        {trainingStatus && !isTraining && !isPaused && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "rgba(0, 212, 255, 0.08)",
              border: "1px solid var(--accent-cyan)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            <p style={{ margin: "0 0 4px 0" }}>
              <strong>Status:</strong>{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {trainingStatus.status}
              </span>
            </p>
            {trainingStatus.current_epoch ? (
              <p style={{ margin: 0 }}>
                <strong>Progress:</strong>{" "}
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  Epoch {trainingStatus.current_epoch}/{trainingStatus.total_epochs}
                </span>
              </p>
            ) : null}
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Training History
            </h3>
            <button
              onClick={fetchTrainingHistory}
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {trainingHistoryError && (
            <div
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                backgroundColor: "var(--color-danger-dim)",
                border: "1px solid var(--color-danger)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-danger)",
                fontSize: "12px",
              }}
            >
              {trainingHistoryError}
            </div>
          )}

          {trainingHistory.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                padding: "12px 0",
              }}
            >
              No past training runs found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {trainingHistory.map((job) => (
                <div
                  key={getJobId(job)}
                  onClick={() => handleTrainingHistoryCardClick(job)}
                  style={{
                    position: "relative",
                    padding: "12px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    cursor: ["running", "paused"].includes(job.status)
                      ? "pointer"
                      : "default",
                  }}
                >
                  {!["running", "paused"].includes(job.status) && (
                    <button
                      onClick={(event) =>
                        handleDeleteTrainingHistory(job, event)
                      }
                      title="Delete training history"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "999px",
                        border: "1px solid rgba(248, 250, 252, 0.18)",
                        backgroundColor: "rgba(15, 23, 42, 0.82)",
                        color: "#F8FAFC",
                        fontSize: "18px",
                        fontWeight: 700,
                        lineHeight: 1,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        boxShadow: "0 6px 16px rgba(2, 6, 23, 0.32)",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor =
                          "rgba(255, 59, 59, 0.18)";
                        event.currentTarget.style.borderColor =
                          "rgba(255, 59, 59, 0.55)";
                        event.currentTarget.style.color = "#FF6B6B";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor =
                          "rgba(15, 23, 42, 0.82)";
                        event.currentTarget.style.borderColor =
                          "rgba(248, 250, 252, 0.18)";
                        event.currentTarget.style.color = "#F8FAFC";
                      }}
                    >
                      ×
                    </button>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 700,
                      }}
                    >
                      {job.model_type === "phone_detector"
                        ? "Phone Detector"
                        : "Posture Classifier"}
                    </span>
                    <span
                      style={{
                        color:
                          job.status === "completed"
                            ? "var(--color-success)"
                            : job.status === "cancelled"
                              ? "var(--color-warning)"
                              : job.status === "running"
                                ? "var(--accent-cyan)"
                                : "var(--color-danger)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Started: {formatDateTime(job.started_at)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Duration: {formatDuration(job.started_at, job.completed_at)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Epochs: {job.current_epoch || 0}/{job.epochs || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Accuracy: {job.metrics?.final_accuracy ?? "--"} | Loss:{" "}
                    {job.metrics?.final_loss ?? "--"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Settings;
