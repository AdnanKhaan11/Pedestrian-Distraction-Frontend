import React, { useState, useEffect } from "react";
import AlertItem from "../AlertItem/AlertItem";
import { getAlerts, resolveAlert } from "../../../services/api";

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const visibleAlerts = alerts.slice(0, 5);

  const fetchAlerts = async () => {
    try {
      setError(null);
      const response = await getAlerts({ limit: 5 });
      // Map API response to component format
      const mappedAlerts = (response.alerts || []).map((alert) => ({
        id: alert.alert_id,
        severity: alert.severity.toLowerCase(),
        title: alert.title,
        device: alert.face_id || "Unknown",
        time: new Date(alert.timestamp).toLocaleString(),
        description: alert.description,
        resolved: alert.resolved,
        alertId: alert.alert_id,
      }));
      setAlerts(mappedAlerts);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch on mount and set up polling
  useEffect(() => {
    fetchAlerts();

    // Poll every 5 seconds
    const interval = setInterval(fetchAlerts, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      // Refresh alerts after resolving
      fetchAlerts();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Recent Alerts
        </h2>
        <span
          style={{
            backgroundColor: "var(--color-danger-dim)",
            color: "var(--color-danger)",
            fontSize: "11px",
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {visibleAlerts.filter((a) => !a.resolved).length} Active
        </span>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px",
            backgroundColor: "var(--color-danger-dim)",
            border: `1px solid var(--color-danger)`,
            color: "var(--color-danger)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px",
            color: "var(--text-muted)",
          }}
        >
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px",
            color: "var(--text-muted)",
          }}
        >
          No alerts found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {visibleAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onResolve={handleResolve} />
          ))}
        </div>
      )}

      <button
        style={{
          width: "100%",
          marginTop: "12px",
          padding: "10px",
          color: "var(--accent-cyan)",
          fontWeight: 500,
          background: "transparent",
          border: "none",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          fontSize: "13px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-surface)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        View All Alerts
      </button>
    </div>
  );
};

export default AlertsPanel;
