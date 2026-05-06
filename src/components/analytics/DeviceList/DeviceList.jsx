import React from "react";

const DeviceList = ({ devices = [] }) => {
  const getStatusColors = (status) => {
    const colors = {
      active: {
        bg: "var(--color-success-dim)",
        text: "var(--color-success)",
        dot: true,
      },
      online: {
        bg: "var(--color-success-dim)",
        text: "var(--color-success)",
        dot: true,
      },
      warning: {
        bg: "var(--color-warning-dim)",
        text: "var(--color-warning)",
        dot: false,
      },
      danger: {
        bg: "var(--color-danger-dim)",
        text: "var(--color-danger)",
        dot: false,
      },
      inactive: {
        bg: "var(--bg-surface)",
        text: "var(--text-muted)",
        dot: false,
      },
      offline: {
        bg: "var(--bg-surface)",
        text: "var(--text-muted)",
        dot: false,
      },
    };
    return colors[status] || colors.offline;
  };

  if (devices.length === 0) {
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
            margin: "0 0 24px 0",
          }}
        >
          Connected Devices
        </h2>
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            color: "var(--text-muted)",
          }}
        >
          No devices found
        </div>
      </div>
    );
  }

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
          margin: "0 0 24px 0",
        }}
      >
        Connected Devices
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Device ID
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Last Seen
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Model
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const statusColors = getStatusColors(device.status);
              return (
                <tr
                  key={device.device_id}
                  style={{
                    borderBottom: "1px solid var(--border-default)",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "var(--bg-elevated)",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                        }}
                      >
                        📱
                      </div>
                      <code
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {device.device_id?.substring(0, 12)}...
                      </code>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {device.name || "Unnamed"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {statusColors.dot && (
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: statusColors.text,
                            animation: "pulse-dot 1.8s infinite",
                          }}
                          className="pulse"
                        />
                      )}
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "11px",
                          fontWeight: 500,
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                        }}
                      >
                        {device.status || "unknown"}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {device.last_seen
                      ? new Date(device.last_seen).toLocaleString()
                      : "Never"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {device.model || "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceList;
