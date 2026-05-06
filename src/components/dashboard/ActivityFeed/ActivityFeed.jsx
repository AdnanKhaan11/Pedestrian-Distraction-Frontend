import React, { useState, useEffect } from "react";
import { getAlerts } from "../../../services/api";

const ActivityFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getAlerts({ limit: 5 });
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityStyle = (severity) => {
    if (severity === "HIGH")
      return {
        bg: "var(--color-danger-dim)",
        color: "var(--color-danger)",
        icon: "🚨",
      };
    if (severity === "MEDIUM")
      return {
        bg: "var(--color-warning-dim)",
        color: "var(--color-warning)",
        icon: "⚠️",
      };
    return {
      bg: "rgba(59,130,246,0.1)",
      color: "var(--accent-blue)",
      icon: "ℹ️",
    };
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
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
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 16px 0",
        }}
      >
        Recent Activity
      </h2>

      {loading && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Loading...
        </p>
      )}

      {!loading && alerts.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          No recent activity
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {alerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);
          return (
            <div
              key={alert.alert_id || alert._id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                backgroundColor: style.bg,
                border: `1px solid ${style.color}33`,
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: style.bg,
                  border: `1px solid ${style.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "14px",
                }}
              >
                {style.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    margin: "0 0 2px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {alert.alert_type || "Violation Detected"}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    margin: "0 0 2px 0",
                  }}
                >
                  {alert.message || alert.description || "Phone usage detected"}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    margin: 0,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatTime(alert.created_at || alert.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
