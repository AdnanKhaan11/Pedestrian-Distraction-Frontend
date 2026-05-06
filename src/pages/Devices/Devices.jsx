import React, { useState, useEffect } from "react";
import DeviceList from "../../components/analytics/DeviceList/DeviceList";
import { getDevices } from "../../services/api";

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDevices();
        setDevices(data.devices || []);
      } catch (err) {
        console.error("Failed to fetch devices:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();

    // Poll every 10 seconds
    const interval = setInterval(fetchDevices, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Device Management
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          Manage and monitor all connected devices
        </p>
      </div>

      {error && (
        <div
          style={{
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
            padding: "32px",
            color: "var(--text-muted)",
          }}
        >
          Loading devices...
        </div>
      ) : (
        <DeviceList devices={devices} />
      )}
    </div>
  );
};

export default Devices;
