import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { connectDetectionStream } from "../services/api";

const useWebSocket = (sessionId = "default-session") => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const isAwaitingResponseRef = useRef(false);
  const { dispatch } = useApp();

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const ws = connectDetectionStream();

      ws.onopen = () => {
        console.log("WebSocket connected to /ws/stream");
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        isAwaitingResponseRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const detection = JSON.parse(event.data);
          isAwaitingResponseRef.current = false;

          if (detection.error) {
            setError(detection.error);
            return;
          }

          if (!detection.detection_id) {
            return;
          }

          dispatch({
            type: "ADD_DETECTION",
            payload: detection,
          });
        } catch (e) {
          isAwaitingResponseRef.current = false;
          console.error("Failed to parse detection result:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error");
        setIsConnected(false);
        isAwaitingResponseRef.current = false;
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        isAwaitingResponseRef.current = false;
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect to WebSocket:", err);
      setError(err.message);
      setIsLoading(false);
      isAwaitingResponseRef.current = false;
    }
  }, [dispatch]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    isAwaitingResponseRef.current = false;
  }, []);

  const sendFrame = useCallback(
    (frameBase64) => {
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        isAwaitingResponseRef.current
      ) {
        return false;
      }

      try {
        isAwaitingResponseRef.current = true;
        wsRef.current.send(
          JSON.stringify({
            frame: frameBase64,
            session_id: sessionId,
            timestamp: new Date().toISOString(),
          }),
        );
        return true;
      } catch (e) {
        isAwaitingResponseRef.current = false;
        console.error("Failed to send frame:", e);
        return false;
      }
    },
    [sessionId],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    isConnected,
    isLoading,
    error,
    sendFrame,
    disconnect,
    connect,
    isAwaitingResponseRef,
  };
};

export default useWebSocket;
