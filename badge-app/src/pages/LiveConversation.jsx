import { useState, useRef } from 'react'
import { Mic, Square, Sparkles, AlertCircle } from 'lucide-react'
import { useAction } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import './LiveConversation.css'

export default function LiveConversation() {
    const { user } = useUser();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

    const transcribeAudio = useAction(api.speechToText.transcribeAudio);
    const processInteraction = useAction(api.processInteraction.process);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                if (audioChunksRef.current.length === 0) {
                    setError("No audio recorded.");
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                processRecording(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setFeedback(null);
            setError(null);
        } catch (err) {
            console.error("Microphone error:", err);
            setError("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const processRecording = async (audioBlob) => {
        try {
            // 1. Convert to Base64
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64Audio = btoa(binary);

            // 2. Transcribe
            const transResult = await transcribeAudio({
                audioBase64: base64Audio,
                mimeType: 'audio/webm',
            });

            if (!transResult.success || !transResult.text || transResult.text.trim().length === 0) {
                setError("No speech detected via transcription.");
                setIsProcessing(false);
                return;
            }

            // 3. Process & Save (Includes Feedback Loop)
            const result = await processInteraction({
                userId: user.id,
                boothId: "live-interaction", // Generic ID for ad-hoc live convos
                boothName: "Live Conversation",
                transcript: transResult.text,
                hasAudio: true,
                recordingDurationSec: Math.round(audioBlob.size / 32000), // Approx
            });

            setFeedback(result);

        } catch (err) {
            console.error("Processing failed:", err);
            setError("Failed to process conversation.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="live-conversation">
            <div className="live-header">
                <h1>Live Conversation</h1>
                <p>Record your real-time interactions to evolve your profile.</p>
            </div>

            <div className="record-area">
                {!isRecording && !isProcessing && (
                    <button className="record-btn start" onClick={startRecording}>
                        <Mic size={48} />
                        <span>Start Recording</span>
                    </button>
                )}

                {isRecording && (
                    <button className="record-btn stop" onClick={stopRecording}>
                        <div className="pulse-ring"></div>
                        <Square size={48} fill="currentColor" />
                        <span>Stop Recording</span>
                    </button>
                )}

                {isProcessing && (
                    <div className="processing-state">
                        <div className="spinner"></div>
                        <p>Analyzing conversation...</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {feedback && (
                <div className="feedback-card">
                    <div className="feedback-header">
                        <Sparkles className="icon-sparkle" />
                        <h2>Interactive Analysis</h2>
                    </div>

                    <div className="feedback-summary">
                        <h3>Summary</h3>
                        <p>{feedback.summary}</p>
                    </div>

                    <div className="feedback-stats">
                        <div className="stat-item">
                            <label>Alignment</label>
                            <div className="score-ring" style={{ '--score': `${feedback.profileAlignmentScore}%` }}>
                                <span>{feedback.profileAlignmentScore}%</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <label>Sentiment</label>
                            <span className={`sentiment-badge ${feedback.sentiment}`}>
                                {feedback.sentiment}
                            </span>
                        </div>
                    </div>

                    <div className="feedback-tags">
                        <h3>Identity Updates</h3>
                        <div className="tags-list">
                            {feedback.mentionedSkills?.map(skill => (
                                <span key={skill} className="tag skill">+ {skill}</span>
                            ))}
                            {feedback.mentionedInterests?.map(interest => (
                                <span key={interest} className="tag interest">+ {interest}</span>
                            ))}
                            {(!feedback.mentionedSkills?.length && !feedback.mentionedInterests?.length) &&
                                <span className="no-tags">No new skills/interests detected.</span>
                            }
                        </div>
                    </div>

                    <div className="feedback-action">
                        <h3>Suggested Follow Up</h3>
                        <p>{feedback.suggestedFollowUp}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
