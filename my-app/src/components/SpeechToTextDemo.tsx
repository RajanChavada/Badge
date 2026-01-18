import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

// Type for recommendations from Convex - matches DB schema
type Recommendation = {
  _id: string;
  _creationTime: number;
  createdAt: number;
  visitorId: string;
  recommendedBoothId: string;
  recommendedBoothName: string;
  matchScore: number;
  matchReasons: string[];
  basedOnTags: string[];
  basedOnInteractions: string[];
  status: string;
  updatedAt?: number;
};

export function SpeechToTextDemo() {
  const [transcript, setTranscript] = useState<string>("");
  const [processedData, setProcessedData] = useState<{
    summary: string;
    tags: string[];
    sentiment: string;
    confidence: number;
    keyTopics: string[];
    mentionedSkills: string[];
    mentionedInterests: string[];
    connectionPotential: string;
    suggestedFollowUp: string;
    interactionNumber: number;
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

  // Convex actions - USE THE ACTION, NOT THE MUTATION!
  const transcribeAudio = useAction(api.speechToText.transcribeAudio);
  // The process action is in processInteraction.ts
  const saveInteraction = useAction(api.processInteraction.process);


  // Get visitor ID from localStorage
  const [visitorId] = useState(() => {
    let id = localStorage.getItem("visitorId");
    if (!id) {
      id = "visitor-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      localStorage.setItem("visitorId", id);
    }
    return id;
  });

  // Demo booth info
  const boothId = "booth-elevenlabs-001";
  const boothName = "ElevenLabs Demo";

  // Fetch recommendations for this visitor (live updates!)
  // Note: File is named reccomendations.ts (typo), so API is reccomendations
  const recommendations = useQuery(api.reccomendations.getForVisitor, { visitorId });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    setError(null);
    setTranscript("");
    setProcessedData(null);
    setStatus("Starting recording...");

    await startRecording();
    setStatus("Recording... Speak clearly into your microphone");
  };

  const handleStopAndTranscribe = async () => {
    setIsProcessing(true);
    setStatus("Stopping recording...");

    try {
      const audioBlob = await stopRecording();
      const duration = recordingTime;

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("No audio recorded - check microphone permissions");
      }

      console.log("[UI] Audio blob:", audioBlob.size, "bytes, type:", audioBlob.type);

      // Convert to base64
      setStatus("Converting audio...");
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);

      // Step 1: Transcribe with ElevenLabs
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

      // Check if we got a real transcript
      if (!transcriptText || transcriptText.length < 10 || transcriptText.includes("overlapping noise")) {
        setStatus("⚠️ Couldn't hear clearly. Try speaking louder or closer to the mic.");
        setIsProcessing(false);
        return;
      }


      // Step 2: Process with LLM
      setStatus("Analyzing with AI (OpenRouter)...");
      
      const result = await saveInteraction({
        visitorId,
        visitorBoothId: boothId,
        boothName,
        transcript: transcriptText,
        hasAudio: true,
        recordingDurationSec: duration,
      });

      console.log("[UI] LLM result:", result);

      // Set the REAL processed data from LLM
      setProcessedData({
        summary: result.summary || "No summary generated",
        tags: result.tags || [],
        sentiment: result.sentiment || "neutral",
        confidence: result.confidence || 0,
        keyTopics: result.keyTopics || [],
        mentionedSkills: result.mentionedSkills || [],
        mentionedInterests: result.mentionedInterests || [],
        connectionPotential: result.connectionPotential || "medium",
        suggestedFollowUp: result.suggestedFollowUp || "Follow up soon",
        interactionNumber: result.interactionNumber || 1,
      });

      setStatus("✅ Complete!");

    } catch (err) {
      console.error("[UI] Error:", err);
      const message = err instanceof Error ? err.message : "Processing failed";
      setError(message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRecommendationClick = (reco: any, index: number) => {
    // Log click for debugging
    console.log("[UI] Recommendation clicked:", reco.recommendedBoothName, "position:", index + 1);
    alert(`Navigate to: ${reco.recommendedBoothName}\n\nMatch reason: ${reco.matchReasons[0]}`);
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
          <span>Recording... Speak clearly!</span>
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
          marginBottom: "16px",
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

          {/* Skills */}
          {processedData.mentionedSkills && processedData.mentionedSkills.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <strong>Skills Detected:</strong>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                {processedData.mentionedSkills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#6b21a8",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {skill}
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
                {processedData.sentiment === "positive" ? "😊" : 
                 processedData.sentiment === "negative" ? "😞" : "😐"} {processedData.sentiment}
              </span>
            </div>
            <div>
              <strong>Confidence:</strong>{" "}
              <span>{Math.round(processedData.confidence * 100)}%</span>
            </div>
          </div>

          {/* Connection Potential */}
          <div style={{ marginBottom: "12px" }}>
            <strong>Connection Potential:</strong>{" "}
            <span style={{
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: processedData.connectionPotential === "high" ? "#22c55e" :
                             processedData.connectionPotential === "low" ? "#ef4444" : "#eab308",
              color: "#000",
              fontSize: "12px",
            }}>
              {processedData.connectionPotential}
            </span>
          </div>

          {/* Suggested Follow-up */}
          <div style={{ marginBottom: "12px" }}>
            <strong>Suggested Follow-up:</strong>
            <p style={{ margin: "4px 0 0", color: "#ccc" }}>{processedData.suggestedFollowUp}</p>
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

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div style={{
          padding: "16px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          borderRadius: "8px",
          border: "1px solid #6366f1",
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#a5b4fc" }}>🎯 Who to Talk to Next</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recommendations.map((reco: Recommendation, index: number) => (
              <button
                key={reco._id}
                onClick={() => handleRecommendationClick(reco, index)}
                style={{
                  padding: "12px",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", color: "#fff" }}>
                    {reco.recommendedBoothName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    {reco.matchReasons[0]}
                  </div>
                </div>
                <span style={{
                  padding: "4px 8px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}>
                  {reco.matchScore}% match
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Debug info */}
      <div style={{ marginTop: "20px", fontSize: "12px", color: "#444", textAlign: "center" }}>
        Visitor: {visitorId}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}