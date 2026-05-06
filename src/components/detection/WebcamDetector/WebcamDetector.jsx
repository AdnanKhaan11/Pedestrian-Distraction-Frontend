import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import useWebSocket from "../../../hooks/useWebSocket";
import { useApp } from "../../../context/AppContext";
import { detectImage } from "../../../services/api";

const RESOLUTION_PRESETS = [
  { label: "360p (640x360)", value: "640x360", width: 640, height: 360 },
  { label: "480p (854x480)", value: "854x480", width: 854, height: 480 },
  { label: "720p (1280x720)", value: "1280x720", width: 1280, height: 720 },
];

const FPS_PRESETS = [
  { label: "0.25 fps", value: 4000 },
  { label: "0.5 fps", value: 2000 },
  { label: "1.0 fps", value: 1000 },
  { label: "1.5 fps", value: 667 },
];

const UPLOAD_SESSION_ID = "image-upload-session";
const getAnnotatedImageSrc = (detection) =>
  detection?.annotated_frame_base64
    ? `data:image/jpeg;base64,${detection.annotated_frame_base64}`
    : "";

const WebcamDetector = () => {
  const videoRef = useRef(null);
  const previewContainerRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const imageInputRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("Camera off");
  const [lastDetection, setLastDetection] = useState(null);
  const [frameInterval, setFrameInterval] = useState(2000);
  const [selectedResolution, setSelectedResolution] = useState(
    RESOLUTION_PRESETS[0].value,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadDetection, setUploadDetection] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploadTesting, setIsUploadTesting] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  const { state } = useApp();
  const {
    isConnected,
    error: socketError,
    sendFrame,
    connect,
    disconnect,
    isAwaitingResponseRef,
  } = useWebSocket("detector-session");

  const selectedResolutionPreset = useMemo(
    () =>
      RESOLUTION_PRESETS.find((preset) => preset.value === selectedResolution) ||
      RESOLUTION_PRESETS[0],
    [selectedResolution],
  );

  const visiblePedestrians = useMemo(
    () => lastDetection?.pedestrians || [],
    [lastDetection],
  );

  const liveAnnotatedImageSrc = useMemo(
    () => getAnnotatedImageSrc(lastDetection),
    [lastDetection],
  );

  const uploadAnnotatedImageSrc = useMemo(
    () => getAnnotatedImageSrc(uploadDetection),
    [uploadDetection],
  );

  const actualProcessingSeconds = useMemo(() => {
    const processingMs = lastDetection?.processing_time_ms || 0;
    return processingMs > 0 ? processingMs / 1000 : 0;
  }, [lastDetection]);

  const isTabletOrSmaller = viewportWidth < 1024;
  const isMobile = viewportWidth < 768;

  const applyCameraStream = useCallback(async (resolutionPreset) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: resolutionPreset.width },
        height: { ideal: resolutionPreset.height },
      },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = async () => {
        await videoRef.current?.play?.();
      };
    }

    return stream;
  }, []);

  useEffect(() => {
    if (state.detections && state.detections.length > 0) {
      const latest = state.detections[0];
      setLastDetection(latest);

      const violations =
        latest.pedestrians?.filter((pedestrian) => pedestrian.is_violation)
          .length || 0;
      const phones =
        latest.pedestrians?.filter((pedestrian) => pedestrian.phone_detected)
          .length || 0;
      const pedestrians = latest.pedestrians?.length || 0;

      if (violations > 0) {
        setDetectionStatus(
          `${violations} violation${violations > 1 ? "s" : ""} detected`,
        );
      } else if (phones > 0) {
        setDetectionStatus(`${phones} phone${phones > 1 ? "s" : ""} detected`);
      } else if (pedestrians > 0) {
        setDetectionStatus(
          `${pedestrians} safe pedestrian${pedestrians > 1 ? "s" : ""} detected`,
        );
      } else {
        setDetectionStatus("No phone-use alert in latest frame");
      }
    }
  }, [state.detections]);

  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !isConnected) {
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = selectedResolutionPreset.width;
    offscreen.height = selectedResolutionPreset.height;

    const ctx = offscreen.getContext("2d", { alpha: false });
    if (!ctx) {
      return;
    }

    ctx.drawImage(
      video,
      0,
      0,
      selectedResolutionPreset.width,
      selectedResolutionPreset.height,
    );

    const frameBase64 = offscreen.toDataURL("image/jpeg", 0.78).split(",")[1];
    if (frameBase64 && sendFrame(frameBase64)) {
      setDetectionStatus("Processing frame...");
    }
  }, [isConnected, selectedResolutionPreset, sendFrame]);

  useEffect(() => {
    if (!isStreaming) {
      return undefined;
    }

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }

    captureIntervalRef.current = setInterval(() => {
      if (
        videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA &&
        !isAwaitingResponseRef.current
      ) {
        captureAndSendFrame();
      }
    }, frameInterval);

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [captureAndSendFrame, frameInterval, isAwaitingResponseRef, isStreaming]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === previewContainerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isConnected && isStreaming && !isAwaitingResponseRef.current) {
      setDetectionStatus("Waiting for detection...");
    } else if (!isConnected && isStreaming) {
      const timer = setTimeout(() => {
        setDetectionStatus("Reconnecting...");
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConnected, isStreaming, isAwaitingResponseRef]);

  useEffect(() => {
    if (socketError) {
      setDetectionStatus(socketError);
    }
  }, [socketError]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    disconnect();
    setIsStreaming(false);
    setDetectionStatus("Camera off");
    setLastDetection(null);
  }, [disconnect]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  const startCamera = useCallback(async () => {
    try {
      await applyCameraStream(selectedResolutionPreset);

      setIsStreaming(true);
      setDetectionStatus("Connecting...");
      connect();
    } catch (error) {
      console.error("Error accessing camera:", error);
      setDetectionStatus("Camera access denied");
      setIsStreaming(false);
    }
  }, [applyCameraStream, connect, selectedResolutionPreset]);

  const restartCameraAtResolution = useCallback(
    async (resolutionPreset) => {
      try {
        setDetectionStatus(`Switching to ${resolutionPreset.label}...`);

        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }

        await applyCameraStream(resolutionPreset);
        setDetectionStatus(`Camera restarted at ${resolutionPreset.label}`);
      } catch (error) {
        console.error("Error changing camera resolution:", error);
        setDetectionStatus("Failed to change camera resolution");
      }
    },
    [applyCameraStream],
  );

  const handleResolutionChange = async (event) => {
    const nextValue = event.target.value;
    const nextPreset =
      RESOLUTION_PRESETS.find((preset) => preset.value === nextValue) ||
      RESOLUTION_PRESETS[0];

    setSelectedResolution(nextValue);

    if (isStreaming) {
      await restartCameraAtResolution(nextPreset);
    }
  };

  const toggleFullscreen = async () => {
    if (!previewContainerRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement === previewContainerRef.current) {
        await document.exitFullscreen();
      } else {
        await previewContainerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const openUploadWorkspace = () => {
    setIsUploadOpen(true);
    setUploadError("");
  };

  const closeUploadWorkspace = () => {
    setIsUploadOpen(false);
  };

  const handleSelectImage = () => {
    imageInputRef.current?.click();
  };

  const handleUploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadedFileName(file.name);
    setUploadError("");
    setUploadDetection(null);
    setIsUploadTesting(true);

    try {
      const previewUrl = URL.createObjectURL(file);
      setUploadedImageUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return previewUrl;
      });

      const base64Frame = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.split(",")[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await detectImage({
        frame: base64Frame,
        sessionId: UPLOAD_SESSION_ID,
      });
      setUploadDetection(result);
    } catch (error) {
      console.error("Upload detection failed:", error);
      setUploadError(error.message || "Failed to test image");
    } finally {
      setIsUploadTesting(false);
      event.target.value = "";
    }
  };

  const getStatusColors = () => {
    if (detectionStatus.toLowerCase().includes("violation")) {
      return {
        bg: "var(--color-danger-dim)",
        border: "var(--color-danger)",
        text: "var(--color-danger)",
      };
    }

    if (
      detectionStatus.toLowerCase().includes("phone") ||
      detectionStatus.toLowerCase().includes("processing")
    ) {
      return {
        bg: "var(--color-warning-dim)",
        border: "var(--color-warning)",
        text: "var(--color-warning)",
      };
    }

    if (detectionStatus.toLowerCase().includes("off")) {
      return {
        bg: "var(--bg-surface)",
        border: "var(--border-default)",
        text: "var(--text-muted)",
      };
    }

    return {
      bg: "var(--color-success-dim)",
      border: "var(--color-success)",
      text: "var(--color-success)",
    };
  };

  const statusColors = getStatusColors();

  return (
    <>
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
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Real-time Detection
            </h2>
            <p
              style={{
                margin: "6px 0 0 0",
                color: "var(--text-secondary)",
                fontSize: "12px",
              }}
            >
              The preview now shows the model's actual annotated output frame.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button
              onClick={openUploadWorkspace}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid var(--accent-cyan)",
                cursor: "pointer",
                backgroundColor: "transparent",
                color: "var(--accent-cyan)",
              }}
            >
              Test Photo
            </button>
            <button
              onClick={toggleFullscreen}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid var(--border-default)",
                cursor: "pointer",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
            <button
              onClick={isStreaming ? stopCamera : startCamera}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: isStreaming
                  ? "var(--color-danger)"
                  : "var(--color-success)",
                color: "white",
              }}
            >
              {isStreaming ? "Stop Camera" : "Start Camera"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            textAlign: "center",
            fontWeight: 600,
            backgroundColor: statusColors.bg,
            border: `1px solid ${statusColors.border}`,
            color: statusColors.text,
          }}
        >
          {detectionStatus}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
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
              Camera Resolution
            </label>
            <select
              value={selectedResolution}
              onChange={handleResolutionChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
              }}
            >
              {RESOLUTION_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
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
              Requested Frame Rate
            </label>
            <select
              value={frameInterval}
              onChange={(event) =>
                setFrameInterval(parseInt(event.target.value, 10))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
              }}
            >
              {FPS_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Actual Model Time
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--accent-cyan)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {actualProcessingSeconds
                ? `${actualProcessingSeconds.toFixed(2)}s / frame`
                : "waiting..."}
            </div>
          </div>
        </div>

        <div
          ref={previewContainerRef}
          style={{
            position: "relative",
            backgroundColor: "#000",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            minHeight: isFullscreen ? "100vh" : "320px",
            marginBottom: "16px",
            border: `1px solid ${visiblePedestrians.length > 0 ? "var(--color-warning)" : "var(--border-default)"}`,
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: liveAnnotatedImageSrc ? "absolute" : "relative",
              inset: liveAnnotatedImageSrc ? 0 : "auto",
              width: "100%",
              height: isFullscreen ? "100vh" : "auto",
              maxHeight: isFullscreen ? "100vh" : "520px",
              objectFit: "contain",
              display: "block",
              backgroundColor: "#000",
              opacity: liveAnnotatedImageSrc ? 0 : 1,
            }}
          />

          {liveAnnotatedImageSrc && (
            <img
              src={liveAnnotatedImageSrc}
              alt="Annotated detection preview"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: isFullscreen ? "100vh" : "100%",
                maxHeight: isFullscreen ? "100vh" : "520px",
                objectFit: "contain",
                display: "block",
                backgroundColor: "#000",
              }}
            />
          )}

          {!isStreaming && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "18px",
                    marginBottom: "8px",
                  }}
                >
                  Camera preview ready
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  Choose a resolution, start the camera, or test with a photo.
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {[
            {
              label: "Visible Alerts",
              value: visiblePedestrians.length,
              color: "var(--color-warning)",
            },
            {
              label: "Violations",
              value:
                lastDetection?.pedestrians?.filter((pedestrian) => pedestrian.is_violation)
                  .length || 0,
              color: "var(--color-danger)",
            },
            {
              label: "Phones",
              value:
                lastDetection?.pedestrians?.filter((pedestrian) => pedestrian.phone_detected)
                  .length || 0,
              color: "var(--accent-cyan)",
            },
            {
              label: "Requested FPS",
              value: (1000 / frameInterval).toFixed(2),
              color: "var(--color-success)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: item.color,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "rgba(0, 212, 255, 0.08)",
            border: "1px solid var(--accent-cyan)",
            borderRadius: "var(--radius-md)",
            fontSize: "12px",
            color: "var(--accent-cyan)",
          }}
        >
          One frame is sent only after the previous result returns. This keeps
          the boxes current and avoids WebSocket overload on slower PCs.
        </div>
      </div>

      {isUploadOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            backgroundColor: "rgba(2, 6, 23, 0.94)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px",
              padding: isMobile ? "16px" : "18px 24px",
              borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                Photo Detection Tester
              </div>
              <div
                style={{
                  marginTop: "6px",
                  color: "#94A3B8",
                  fontSize: "13px",
                }}
              >
                Upload a photo and verify the model from the UI.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <button
                onClick={handleSelectImage}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  backgroundColor: "var(--accent-cyan)",
                  border: "none",
                  color: "#001018",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Upload Photo
              </button>
              <button
                onClick={closeUploadWorkspace}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(148, 163, 184, 0.4)",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Close
              </button>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadFile}
            style={{ display: "none" }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isTabletOrSmaller
                ? "minmax(0, 1fr)"
                : "minmax(0, 2fr) minmax(320px, 1fr)",
              gap: "20px",
              padding: isMobile ? "16px" : "20px 24px 24px",
              flex: 1,
              minHeight: 0,
              overflow: "auto",
            }}
          >
            <div
              style={{
                backgroundColor: "#020617",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "16px",
                padding: "16px",
                minHeight: 0,
                overflow: "auto",
              }}
            >
              {uploadedImageUrl ? (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={uploadAnnotatedImageSrc || uploadedImageUrl}
                    alt="Uploaded preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    minHeight: isMobile ? "280px" : "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94A3B8",
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  Upload an image to run a detection test.
                </div>
              )}
            </div>

            <div
              style={{
                backgroundColor: "#020617",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "16px",
                padding: "16px",
                color: "white",
                overflow: "auto",
                minHeight: 0,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
                Test Result
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>File</div>
                  <div style={{ marginTop: "4px", fontWeight: 600 }}>
                    {uploadedFileName || "No file selected"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Model Status
                  </div>
                  <div style={{ marginTop: "4px", fontWeight: 600 }}>
                    {isUploadTesting
                      ? "Running detection..."
                      : uploadDetection?.error_message
                        ? "Detection error"
                        : uploadDetection
                          ? "Detection completed with backend-rendered output"
                          : "Waiting"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Processing Time
                  </div>
                  <div style={{ marginTop: "4px", fontWeight: 600 }}>
                    {uploadDetection?.processing_time_ms
                      ? `${(uploadDetection.processing_time_ms / 1000).toFixed(2)}s`
                      : "--"}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    color: "#FCA5A5",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    marginBottom: "16px",
                  }}
                >
                  {uploadError}
                </div>
              )}

              {uploadDetection && !uploadDetection.error_message && (
                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {(uploadDetection.pedestrians || []).map((pedestrian, index) => (
                    <div
                      key={`${pedestrian.pedestrian_id || "pedestrian"}-${index}`}
                      style={{
                        padding: "12px",
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        borderRadius: "12px",
                        border: `1px solid ${pedestrian.is_violation ? "rgba(239, 68, 68, 0.45)" : pedestrian.phone_detected ? "rgba(245, 158, 11, 0.45)" : "rgba(148, 163, 184, 0.2)"}`,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                        Person {index + 1}
                      </div>
                      <div style={{ fontSize: "13px", color: "#CBD5E1" }}>
                        posture: {pedestrian.posture_state}
                      </div>
                      <div style={{ fontSize: "13px", color: "#CBD5E1" }}>
                        phone: {pedestrian.phone_detected ? "yes" : "no"}
                      </div>
                      <div style={{ fontSize: "13px", color: "#CBD5E1" }}>
                        violation: {pedestrian.is_violation ? "yes" : "no"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WebcamDetector;
