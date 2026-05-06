import React from "react";

const AlertItem = ({ alert, onResolve }) => {
  const getSeverityColors = (severity) => {
    const colors = {
      high: {
        border: "var(--color-danger)",
        bg: "var(--color-danger-dim)",
        badge: "var(--color-danger)",
        badgeBg: "var(--color-danger-dim)",
      },
      medium: {
        border: "var(--color-warning)",
        bg: "var(--color-warning-dim)",
        badge: "var(--color-warning)",
        badgeBg: "var(--color-warning-dim)",
      },
      low: {
        border: "var(--accent-blue)",
        bg: "rgba(59, 130, 246, 0.08)",
        badge: "var(--accent-blue)",
        badgeBg: "rgba(59, 130, 246, 0.1)",
      },
    };
    return colors[severity] || colors.low;
  };

  const severityColors = getSeverityColors(alert.severity);

  return (
    <div
      style={{
        borderLeft: `3px solid ${severityColors.border}`,
        backgroundColor: severityColors.bg,
        borderRadius: "var(--radius-md)",
        padding: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: severityColors.badgeBg,
              color: severityColors.badge,
            }}
          >
            {alert.severity.toUpperCase()}
          </span>
          <span
            style={{
              fontWeight: 500,
              color: "var(--text-primary)",
              fontSize: "14px",
            }}
          >
            {alert.title}
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            flexShrink: 0,
            marginLeft: "12px",
          }}
        >
          {alert.time}
        </span>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          margin: "0 0 8px 0",
        }}
      >
        {alert.description}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          Face: {alert.device}
        </span>
        {onResolve && (
          <button
            onClick={() => onResolve(alert.alertId)}
            style={{
              background: "transparent",
              border: `1px solid var(--border-default)`,
              color: "var(--text-secondary)",
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--accent-cyan)";
              e.currentTarget.style.borderColor = "var(--accent-cyan)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertItem;
