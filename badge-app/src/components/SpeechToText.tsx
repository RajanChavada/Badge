import { useState } from "react";
import { useAction } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { Mic, Square, Sparkles } from "lucide-react";

export function SpeechToText({ boothId, boothName }: { boothId: string; boothName: string }) {
  const { user } = useUser();
  const [transcript, setTranscript] = useState<string>("");
  const [analysis, setAnalysis] = useState<any>(null);
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
  const processInteraction = useAction(api.processInteraction.process);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    if (!user) {
      setError("Please sign in first");
      return;
    }

    setError(null);
    setTranscript("");
    setAnalysis(null);
    setStatus("Starting recording...");

    await startRecording();
    setStatus("🎤 Recording... Speak clearly!");
  };

  const handleStopAndProcess = async () => {
    if (!user) return;

    setIsProcessing(true);
    setStatus("Stopping recording...");

    try {
      const audioBlob = await stopRecording();
      const duration = recordingTime;

      if (!audioBlob || audioBlob.size === 0) {
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

      // Transcribe
      setStatus("✨ Transcribing with ElevenLabs...");
      const transcriptResult = await transcribeAudio({
        audioBase64: base64Audio,
        mimeType: audioBlob.type || "audio/webm",
      });

      if (transcriptResult.error) {
        throw new Error(transcriptResult.error);
      }

      const transcriptText = transcriptResult.text || "";
      setTranscript(transcriptText);

      if (!transcriptText || transcriptText.length < 10) {
        setStatus("⚠️ Couldn't hear clearly. Try speaking louder.");
        setIsProcessing(false);
        return;
      }

      // Process with profile context
      setStatus("🤖 Analyzing with your profile context...");

      const result = await processInteraction({
        userId: user.id,
        boothId,
        boothName,
        transcript: transcriptText,
        hasAudio: true,
        recordingDurationSec: duration,
      });

      setAnalysis(result);
      setStatus("✅ Analysis complete!");

    } catch (err) {
      console.error("[SpeechToText] Error:", err);
      const message = err instanceof Error ? err.message : "Processing failed";
      setError(message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="speech-to-text">
      {(error || recorderError) && (
        <div className="error-banner">
          {error || recorderError}
          {(error?.includes("Configuration Error") || recorderError?.includes("Configuration Error")) && (
            <div style={{ marginTop: "8px", fontSize: "0.9em" }}>
              👉 Add keys in Convex Dashboard &gt; Settings &gt; Environment Variables
            </div>
          )}
        </div>
      )}

      {/* Timer */}
      <div className="timer">{formatTime(recordingTime)}</div>

      {/* Controls */}
      <div className="controls">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing || !user}
            className="btn-record"
          >
            <Mic size={20} />
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopAndProcess}
            disabled={isProcessing}
            className="btn-stop"
          >
            <Square size={20} />
            Stop & Analyze
          </button>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className="status">
          {isProcessing && <Sparkles className="spin" size={16} />}
          {status}
        </div>
      )}

      {/* Results */}
      {transcript && (
        <div className="result-section">
          <h3>📝 Transcript</h3>
          <p>{transcript}</p>
        </div>
      )}

      {analysis && (
        <div className="result-section highlight">
          <h3><Sparkles size={16} /> Profile-Aware Analysis</h3>

          <div className="analysis-grid">
            <div className="analysis-item">
              <strong>Summary:</strong>
              <p>{analysis.summary}</p>
            </div>

            <div className="analysis-item">
              <strong>Profile Alignment:</strong>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${analysis.profileAlignmentScore || 50}%` }}
                />
                <span>{analysis.profileAlignmentScore || 50}%</span>
              </div>
            </div>

            {analysis.careerRelevance?.length > 0 && (
              <div className="analysis-item">
                <strong>Why This Matters for You:</strong>
                <ul>
                  {analysis.careerRelevance.map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="analysis-item">
              <strong>Next Step:</strong>
              <p>{analysis.suggestedFollowUp}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
