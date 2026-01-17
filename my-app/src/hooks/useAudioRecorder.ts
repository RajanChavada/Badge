import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setRecordingTime(0);

      console.log("[Recorder] Requesting microphone access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;
      console.log("[Recorder] Got stream, creating MediaRecorder...");

      // Check supported mime types
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      console.log("[Recorder] Using mimeType:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        console.log("[Recorder] Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("[Recorder] Error:", event);
        setError("Recording error occurred");
      };

      mediaRecorder.onstart = () => {
        console.log("[Recorder] Started");
        setIsRecording(true);
      };

      mediaRecorder.onstop = () => {
        console.log("[Recorder] Stopped");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      console.log("[Recorder] Recording started successfully");

    } catch (err) {
      console.error("[Recorder] Failed to start:", err);
      const message = err instanceof Error ? err.message : "Failed to start recording";
      setError(message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    console.log("[Recorder] Stop requested, current state:", {
      hasMediaRecorder: !!mediaRecorderRef.current,
      state: mediaRecorderRef.current?.state,
    });

    return new Promise((resolve) => {
      // Clear timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        console.log("[Recorder] No active recorder");
        setIsRecording(false);
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        console.log("[Recorder] Stopped, chunks:", chunksRef.current.length);
        
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log("[Recorder] Created blob:", blob.size, "bytes");
        
        chunksRef.current = [];
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
            console.log("[Recorder] Stopped track:", track.kind);
          });
          streamRef.current = null;
        }

        setIsRecording(false);
        setIsPaused(false);
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
  };
}