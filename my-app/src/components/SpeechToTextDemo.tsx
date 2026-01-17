import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import {
  trackInteractionStarted,
  trackRecordingCompleted,
  trackInteractionSaved,
} from "../lib/amplitude";

export function SpeechToTextDemo() {
  const [transcript, setTranscript] = useState<string>("");
  const [processedData, setProcessedData] = useState<{
    summary: string;
    tags: string[];
    sentiment: string;
    confidence: number;
    keyTopics: string[];
  } | null>(null);
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
  const saveProcessedInteraction = useMutation(api.interactions.insert);

  // Demo values
  const visitorId = "visitor-" + (localStorage.getItem("visitorId") || 
    (() => { const id = Date.now().toString(36); localStorage.setItem("visitorId", id); return id; })());
  const boothId = "booth-elevenlabs-001";
  const boothName = "ElevenLabs Demo";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    setError(null);
    setTranscript("");
    setProcessedData(null);

    trackInteractionStarted({
      visitorId,
      boothId,
      boothName,
      mode: "voice",
    });

    await startRecording();
  };

  const handleStopAndTranscribe = async () => {
    setIsProcessing(true);
    setStatus("Stopping recording...");

    try {
      const audioBlob = await stopRecording();
      const duration = recordingTime;

      trackRecordingCompleted({
        visitorId,
        boothId,
        durationSec: duration,
        willTranscribe: true,
      });

      if (!audioBlob) {
        throw new Error("No audio recorded");
      }

      // Convert to base64
      setStatus("Converting audio...");
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);

      // Transcribe with ElevenLabs
      setStatus("Transcribing with ElevenLabs...");
      const transcriptResult = await transcribeAudio({
        audioBase64: base64Audio,
        mimeType: audioBlob.type || "audio/webm",
      });

      if (transcriptResult.error) {
        throw new Error(transcriptResult.error);
      }

      const transcriptText = transcriptResult.text || "";
      setTranscript(transcriptText);

      // Process with LLM (OpenRouter/Gemini)
      setStatus("Analyzing with AI...");
      await saveProcessedInteraction({
        visitorId,
        visitorBoothId: boothId,
        boothName,
        transcript: transcriptText,
        hasAudio: true,
        recordingDurationSec: duration,
        transcriptSource: "elevenlabs",
        processingStatus: "completed",
      });

      // For demo purposes, create mock processed data
      const mockProcessedData = {
        summary: "AI-generated summary of the conversation",
        tags: ["demo", "speech-to-text"],
        sentiment: "positive" as const,
        confidence: 0.85,
        keyTopics: ["technology", "demo"],
      };

      setProcessedData(mockProcessedData);

      // Track with enriched data
      trackInteractionSaved({
        visitorId,
        boothId,
        boothName,
        hasAudio: true,
        transcriptLen: transcriptText.length,
        summary: mockProcessedData.summary,
        tags: mockProcessedData.tags,
        sentiment: mockProcessedData.sentiment,
        confidence: mockProcessedData.confidence,
        keyTopics: mockProcessedData.keyTopics,
        llmModel: "demo-model",
      });

      setStatus("Complete!");

    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      setError(message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🎤 Speech to Text + AI Analysis</h2>
      <p style={{ color: "#888", marginBottom: "20px" }}>
        Record → Transcribe (ElevenLabs) → Analyze (OpenRouter/Gemini) → Track (Amplitude)
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

      {/* Timer */}
      <div style={{
        fontSize: "48px",
        fontWeight: "bold",
        textAlign: "center",
        margin: "30px 0",
        fontFamily: "monospace",
      }}>
        {formatTime(recordingTime)}
      </div>

      {/* Recording indicator */}
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

      {/* Controls */}
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
            ⏹️ Stop & Analyze
          </button>
        )}
      </div>

      {/* Status */}
      {status && (
        <div style={{ textAlign: "center", color: "#888", marginBottom: "20px" }}>
          {isProcessing && "⏳ "}{status}
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div style={{
          padding: "16px",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          border: "1px solid #333",
          marginBottom: "16px",
        }}>
          <h3 style={{ margin: "0 0 12px 0" }}>📝 Transcript</h3>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{transcript}</p>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "14px" }}>
            {transcript.length} chars • {transcript.split(/\s+/).length} words
          </p>
        </div>
      )}

      {/* AI Analysis Results */}
      {processedData && (
        <div style={{
          padding: "16px",
          backgroundColor: "#0a2a1a",
          borderRadius: "8px",
          border: "1px solid #008060",
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#00ff88" }}>🤖 AI Analysis</h3>
          
          {/* Summary */}
          <div style={{ marginBottom: "12px" }}>
            <strong>Summary:</strong>
            <p style={{ margin: "4px 0 0", color: "#ccc" }}>{processedData.summary}</p>
          </div>

          {/* Tags */}
          {processedData.tags.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <strong>Tags:</strong>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                {processedData.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#008060",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment & Confidence */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
            <div>
              <strong>Sentiment:</strong>{" "}
              <span style={{
                color: processedData.sentiment === "positive" ? "#0f0" :
                       processedData.sentiment === "negative" ? "#f00" : "#ff0",
              }}>
                {processedData.sentiment}
              </span>
            </div>
            <div>
              <strong>Confidence:</strong>{" "}
              <span>{Math.round(processedData.confidence * 100)}%</span>
            </div>
          </div>

          {/* Key Topics */}
          {processedData.keyTopics.length > 0 && (
            <div>
              <strong>Key Topics:</strong>
              <p style={{ margin: "4px 0 0", color: "#ccc" }}>
                {processedData.keyTopics.join(", ")}
              </p>
            </div>
          )}
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