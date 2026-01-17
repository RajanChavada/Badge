import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

export function SpeechToTextDemo() {
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [language, setLanguage] = useState<string>("");

  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error: recordingError,
  } = useAudioRecorder();

  const transcribeAudio = useAction(api.speechToText.transcribeAudio);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopAndTranscribe = async () => {
    setIsProcessing(true);
    setProcessingStatus("Stopping recording...");
    setTranscript("");

    try {
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        throw new Error("No audio recorded");
      }

      console.log("Audio blob:", {
        size: audioBlob.size,
        type: audioBlob.type,
      });

      // Convert blob to base64
      setProcessingStatus("Converting audio...");
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          if (base64) {
            resolve(base64);
          } else {
            reject(new Error("Failed to convert to base64"));
          }
        };
        reader.onerror = () => reject(reader.error);
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Send to ElevenLabs via Convex action
      setProcessingStatus("Transcribing with ElevenLabs...");
      const result = await transcribeAudio({
        audioBase64,
        mimeType: audioBlob.type || "audio/webm",
      });

      if (result.success && result.text) {
        setTranscript(result.text);
        setLanguage(result.language || "");
        setProcessingStatus("Done!");
      } else {
        setProcessingStatus(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Processing error:", err);
      setProcessingStatus(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎤 Speech to Text Demo</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Record audio and transcribe it using ElevenLabs Scribe
        </p>
      </div>

      {/* Error Display */}
      {recordingError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {recordingError}
        </div>
      )}

      {/* Recording Timer */}
      <div className="text-center py-8">
        <div className="text-6xl font-mono font-bold mb-2">
          {formatTime(recordingTime)}
        </div>
        <div className="text-sm text-gray-500">
          {isRecording
            ? isPaused
              ? "⏸️ Paused"
              : "🔴 Recording..."
            : "Ready to record"}
        </div>
      </div>

      {/* Recording Visualization */}
      {isRecording && !isPaused && (
        <div className="flex justify-center items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-red-500 rounded animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎤 Start Recording
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
              >
                ⏸️ Pause
              </button>
            )}
            <button
              onClick={handleStopAndTranscribe}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              ⏹️ Stop & Transcribe
            </button>
          </>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Transcript Result */}
      {transcript && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">📝 Transcript</h3>
            {language && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                Language: {language}
              </span>
            )}
          </div>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {transcript}
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(transcript)}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            📋 Copy to clipboard
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Start Recording" to begin</li>
          <li>Speak clearly into your microphone</li>
          <li>Click "Stop & Transcribe" when done</li>
          <li>Your speech will be transcribed using ElevenLabs Scribe</li>
        </ul>
      </div>
    </div>
  );
}
