import React, { useEffect } from "react";
import {
  getImageSrc,
  getStatus,
  getName,
  getFaceId,
  getConfidence,
  getViolationType,
  getZone,
  getCamera,
  getViolationCount,
  getStatusLabel,
  getFirstSeen,
  getLastSeen,
  getGPS,
  formatDateTime,
  StatusBadge,
  ConfidenceBar,
} from "./ViolatorCard";

// ─── Toast ────────────────────────────────────────────────────
export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 200,
        background: isSuccess ? "#065F46" : "#7F1D1D",
        border: `1px solid ${isSuccess ? "#22C55E" : "#EF4444"}`,
        borderRadius: 12,
        padding: "12px 18px",
        color: "#F1F5F9",
        fontSize: 14,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        animation: "toastIn 0.25s ease",
        maxWidth: 360,
      }}
    >
      <span>{isSuccess ? "✅" : "❌"}</span>
      <span style={{ flex: 1 }}>{toast.msg}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          fontSize: 16,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── ViolatorModal ────────────────────────────────────────────
const ViolatorModal = ({ face, onClose }) => {
  if (!face) return null;

  const imgSrc = getImageSrc(face);
  const status = getStatus(face);
  const name = getName(face);
  const faceId = getFaceId(face);
  const confidence = getConfidence(face);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Violator details"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: 18,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Image ───────────────────────────────────────── */}
        <div
          style={{
            width: "100%",
            height: 280,
            background: "#0A1628",
            borderRadius: "18px 18px 0 0",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={`Full capture of ${name}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                background: "#0A1628",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "#475569",
              }}
            >
              <span style={{ fontSize: 52 }}>📷</span>
              <span style={{ fontSize: 13 }}>No captured image available</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: 36,
              height: 36,
              color: "#F1F5F9",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ✕
          </button>

          {/* Status badge overlay */}
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <StatusBadge status={status} />
          </div>

          {/* Repeat badge */}
          {getViolationCount(face) > 1 && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "rgba(239,68,68,0.9)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              🔁 Repeat Offender
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 18,
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 2,
                }}
              >
                Violator ID
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#F1F5F9",
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                #VL-{faceId.slice(-6).toUpperCase()}
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#64748B",
                fontStyle: name === "Unidentified" ? "italic" : "normal",
                fontWeight: 500,
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {name}
            </div>
          </div>

          {/* Info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {[
              {
                label: "Violation Type",
                value: getViolationType(face),
                icon: "⚠️",
              },
              { label: "Zone", value: getZone(face), icon: "📍" },
              { label: "Camera", value: getCamera(face), icon: "🎥" },
              {
                label: "Total Occurrences",
                value: `${getViolationCount(face)}×`,
                icon: "🔁",
              },
              { label: "Status", value: getStatusLabel(status), icon: "🔴" },
              {
                label: "First Seen",
                value: formatDateTime(getFirstSeen(face)),
                icon: "📅",
              },
              {
                label: "Last Seen",
                value: formatDateTime(getLastSeen(face)),
                icon: "🕐",
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  background: "#0F172A",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: "1px solid #1e3a5f",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#CBD5E1",
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}
                >
                  {icon} {value}
                </div>
              </div>
            ))}
          </div>

          {/* AI Confidence */}
          <div
            style={{
              background: "#0F172A",
              borderRadius: 10,
              padding: "12px 14px",
              border: "1px solid #1e3a5f",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 6,
              }}
            >
              🤖 AI Detection Confidence
            </div>
            <ConfidenceBar value={confidence} />
            <div style={{ fontSize: 11, color: "#475569", marginTop: 5 }}>
              Higher confidence = more accurate detection
            </div>
          </div>

          {/* GPS */}
          {getGPS(face) && (
            <div
              style={{
                background: "rgba(59,130,246,0.08)",
                borderRadius: 10,
                padding: "10px 14px",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 3,
                }}
              >
                🌐 GPS Location
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#3B82F6",
                  fontFamily: "monospace",
                }}
              >
                {getGPS(face)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolatorModal;
