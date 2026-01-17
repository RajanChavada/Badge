import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import {
  trackInteractionStarted,
  trackRecordingCompleted,
  trackInteractionSaved,
} from "../lib/amplitude";

export function SpeechToTextDemo() {
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    error: recorderError,
  } = useAudioRecorder();

  const transcribeAudio = useAction(api.speechToText.transcribeAudio);

  const demoBoothId = "demo-booth-001";
  const demoBoothName = "ElevenLabs";
  const visitorId = "demo-user";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    setError(null);
    setTranscript("");
    
    trackInteractionStarted({
      visitorId,
      boothId: demoBoothId,
      boothName: demoBoothName,
      mode: "voice",
    });

    await startRecording();
  };

  const handleStopAndTranscribe = async () => {
    setIsProcessing(true);
    setStatus("Stopping recording...");

    try {
      const audioBlob = await stopRecording();
      
      trackRecordingCompleted({
        visitorId,
        visitorBoothId: demoBoothId,
        durationSec: recordingTime,
        willTranscribe: true,
      });

      if (!audioBlob) {
        throw new Error("No audio recorded");
      }

      setStatus("Converting audio...");

      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);

      setStatus("Transcribing with ElevenLabs...");

      const result = await transcribeAudio({
        audioBase64: base64Audio,
        mimeType: audioBlob.type || "audio/webm",
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setTranscript(result.text || "");
      setStatus("Done!");

      trackInteractionSaved({
        visitorId,
        visitorBoothId: demoBoothId,
        hasAudio: true,
        transcriptLen: result.text?.length || 0,
        tagCount: 0,
        summaryLen: 0,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription failed";
      setError(message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🎤 Speech to Text Demo</h2>
      <p style={{ color: "#888", marginBottom: "20px" }}>
        Record audio and transcribe using ElevenLabs Scribe v2
      </p>

      {(error || recorderError) && (
        <div style={{
          padding: "12px",
          backgroundColor: "#fee",
          border: "1px solid #f00",
          borderRadius: "8px",
          marginBottom: "20px",
          color: "#c00",
        }}>
          {error || recorderError}
        </div>
      )}

      <div style={{
        fontSize: "48px",
        fontWeight: "bold",
        textAlign: "center",
        margin: "30px 0",
        fontFamily: "monospace",
      }}>
        {formatTime(recordingTime)}
      </div>

      {isRecording && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "20px",
        }}>
          <div style={{
            width: "12px",
            height: "12px",
            backgroundColor: "#f00",
            borderRadius: "50%",
            animation: "pulse 1s infinite",
          }} />
          <span>Recording...</span>
        </div>
      )}

      <div style={{
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        marginBottom: "20px",
      }}>
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#008060",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopAndTranscribe}
            disabled={isProcessing}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#c00",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            ⏹️ Stop & Transcribe
          </button>
        )}
      </div>

      {status && (
        <div style={{ textAlign: "center", color: "#888", marginBottom: "20px" }}>
          {isProcessing && "⏳ "}{status}
        </div>
      )}

      {transcript && (
        <div style={{
          padding: "16px",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          border: "1px solid #333",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}>
            <h3 style={{ margin: 0 }}>📝 Transcript</h3>
            <button
              onClick={() => navigator.clipboard.writeText(transcript)}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                backgroundColor: "#333",
                color: "white",
                border: "1px solid #555",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📋 Copy
            </button>
          </div>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{transcript}</p>
          <p style={{ margin: "12px 0 0", color: "#666", fontSize: "14px" }}>
            Characters: {transcript.length} | Words: {transcript.split(/\s+/).length}
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}