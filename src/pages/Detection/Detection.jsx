import React from "react";
import WebcamDetector from "../../components/detection/WebcamDetector/WebcamDetector";

const Detection = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Real-time Phone Detection
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          Live camera monitoring, fullscreen preview, and photo-based testing in
          one workspace.
        </p>
      </div>

      <WebcamDetector />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            What Changed
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[
              "Safe and out_of_frame overlays are hidden from the live preview.",
              "Frames are now throttled so the browser waits for the previous result before sending the next one.",
              "Camera resolution can be selected before starting the stream.",
              "Photo testing runs against the same backend model from the UI.",
            ].map((text) => (
              <div
                key={text}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                {text}
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
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 16px 0",
            }}
          >
            Usage Tips
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[
              "Use 360p or 480p first if your PC is CPU-bound.",
              "If the model takes 2-6 seconds per frame, that is backend inference time, not a WebSocket bug.",
              "Use the photo tester to verify model output before troubleshooting the camera.",
              "Save persistent thresholds and defaults from the Settings page, not from this screen.",
            ].map((text) => (
              <div
                key={text}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detection;
