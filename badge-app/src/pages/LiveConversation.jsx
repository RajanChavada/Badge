import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Sparkles, AlertCircle, ArrowRight, X, Send, MessageCircle } from 'lucide-react'
import { useAction } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { createChatSession, sendChatMessage } from '../utils/backboardClient';
import ReactMarkdown from 'react-markdown';
import BrainVisual from '../components/BrainVisual';
import './LiveConversation.css'

export default function LiveConversation() {
    const { user } = useUser();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

    // Chat modal state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatSessionRef = useRef(null);

    const transcribeAudio = useAction(api.speechToText.transcribeAudio);
    const processInteraction = useAction(api.processInteraction.process);
    const sendChatAction = useAction(api.backboard.sendChatMessage);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const chatContainerRef = useRef(null);

    // Auto-scroll chat to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages, isChatLoading]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioUpload(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const handleAudioUpload = async (audioBlob) => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1];
                try {
                    const transcription = await transcribeAudio({
                        audioBase64: base64Audio,
                        mimeType: audioBlob.type || 'audio/webm',
                    });

                    if (!transcription.success) throw new Error(transcription.error || "Transcription failed");
                    const transcriptText = transcription.text || "";
                    if (!transcriptText) {
                        setError("No speech detected. Please try again.");
                        setIsProcessing(false);
                        return;
                    }

                    const data = await processInteraction({
                        userId: user.id,
                        boothId: "networking-coach",
                        boothName: "Networking Coach",
                        transcript: transcriptText,
                        hasAudio: true,
                        recordingDurationSec: Math.ceil(audioBlob.size / 32000),
                    });
                    setFeedback(data);
                } catch (err) {
                    console.error("API Error:", err);
                    setError(err.message || "Processing failed");
                } finally {
                    setIsProcessing(false);
                }
            };
        } catch (err) {
            console.error("Upload preparation failed:", err);
            setError("Failed to prepare audio.");
            setIsProcessing(false);
        }
    };

    const openChatModal = async () => {
        if (!feedback) return;
        setIsChatOpen(true);
        setIsChatLoading(true);
        setChatMessages([]);

        const context = {
            summary: feedback.summary || '',
            nextBestAction: feedback.suggestedFollowUp || '',
            mentionedSkills: feedback.mentionedSkills || [],
            mentionedInterests: feedback.mentionedInterests || [],
        };

        const session = createChatSession(context, sendChatAction, user?.id);
        chatSessionRef.current = session;

        try {
            const initialResponse = await sendChatMessage(
                session,
                `Help me prepare for this next action: "${feedback.suggestedFollowUp}". Give me a quick tip.`
            );
            setChatMessages([{ role: 'assistant', content: initialResponse }]);
        } catch (err) {
            setChatMessages([{
                role: 'assistant',
                content: `Next action: **${feedback.suggestedFollowUp}**\n\nHow can I help you prepare?`
            }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsChatLoading(true);

        try {
            const response = await sendChatMessage(chatSessionRef.current, userMessage);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="live-conversation-container">
            <BrainVisual isRecording={isRecording} />

            <div className="content-wrapper">
                <div className="conversation-header">
                    <h1>Live Conversation</h1>
                    <p>Record your real-time interactions to evolve your profile.</p>
                </div>

                <div className="recording-area">
                    <button
                        className={`record-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                    >
                        {isRecording ? <Square size={32} /> : <Mic size={32} />}
                        <div className="record-ring"></div>
                    </button>
                    <p className="record-status">
                        {isProcessing ? 'Analyzing...' : isRecording ? 'Recording...' : 'Tap to start'}
                    </p>
                </div>

                {error && (
                    <div className="error-card">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}

                {feedback && (
                    <div className="feedback-card">
                        <div className="feedback-header">
                            <Sparkles className="feedback-icon" />
                            <h2>Analysis Complete</h2>
                        </div>

                        <div className="summary-section">
                            <h3>Summary</h3>
                            <p>{feedback.summary}</p>
                        </div>

                        <div className="action-section">
                            <div className="action-header">
                                <h3>Next Best Action</h3>
                                <span className="confidence-badge">
                                    {(feedback.confidence * 100).toFixed(0)}% Match
                                </span>
                            </div>
                            <p className="action-text">{feedback.suggestedFollowUp}</p>

                            <button className="chat-action-btn" onClick={openChatModal}>
                                <span>Get Coach Advice</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isChatOpen && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal">
                        <div className="chat-modal-header">
                            <div className="chat-title">
                                <MessageCircle size={20} />
                                <span>Networking Coach</span>
                            </div>
                            <button className="close-btn" onClick={() => setIsChatOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="chat-messages" ref={chatContainerRef}>
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`chat-message ${msg.role}`}>
                                    <div className="message-content">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="chat-message assistant">
                                    <div className="message-content typing">
                                        <span>.</span><span>.</span><span>.</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="chat-input-area">
                            <input
                                type="text"
                                placeholder="Ask for advice..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isChatLoading}
                            />
                            <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatLoading}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
