import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Volume2, VolumeX, Plus } from 'lucide-react'
import useAppStore from '../store/useAppStore.js'
import './ChatInterface.css'

export default function ChatInterface() {
  const { userProfile } = useAppStore()
  const [chatSessions, setChatSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        // TODO: Send audio to speech-to-text service
        // Convert audio blob to text and add as message
        handleAudioInput(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsListening(true)
    } catch (error) {
      console.error('Microphone access denied:', error)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const handleAudioInput = async (audioBlob) => {
    // TODO: Call speech-to-text AI service
    // Convert audio to text
    console.log('Audio input received:', audioBlob)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedSession) return

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    }

    setMessages([...messages, newMessage])
    setInputMessage('')
    setIsLoading(true)

    // TODO: Call AI service to generate contextual response
    // Use user profile, booth/person info, and conversation history
    // to generate personalized response
    setTimeout(() => {
      const aiResponse = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        content: `Thanks for sharing that! [AI-generated response based on your conversation with ${
          'targetPerson' in selectedSession.targetPerson
            ? selectedSession.targetPerson.name
            : selectedSession.targetPerson.name
        }]`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  const handleTextToSpeech = async () => {
    // TODO: Call text-to-speech AI service
    // Play audio response
    setIsSpeaking(true)
    setTimeout(() => setIsSpeaking(false), 2000)
  }

  const createNewSession = (sessionType) => {
    // TODO: Create new chat session
    // Allow user to select booth or person to practice with
    const newSession = {
      id: `session-${Date.now()}`,
      userId: userProfile?.userId || '',
      targetPerson: {
        id: 'dummy',
        name: 'Recruiter',
        role: 'Software Engineer',
        company: 'Tech Company',
        bio: 'Experienced tech professional',
        expertise: [],
      },
      sessionType,
      messages: [],
      startTime: Date.now(),
    }
    setChatSessions([...chatSessions, newSession])
    setSelectedSession(newSession)
    setMessages([])
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h1>Networking Practice</h1>
        <p className="subtitle">
          Practice your pitch and learn from AI-powered interactions
        </p>
      </div>

      <div className="chat-container">
        {/* Sessions Sidebar */}
        <div className="sessions-sidebar">
          <button
            className="new-session-btn"
            onClick={() => createNewSession('practice')}
          >
            <Plus size={20} />
            New Practice
          </button>
          <button
            className="new-session-btn secondary"
            onClick={() => createNewSession('exploration')}
          >
            <Plus size={20} />
            Explore Topic
          </button>

          <div className="sessions-list">
            <h3>Sessions</h3>
            {chatSessions.length > 0 ? (
              <div className="session-items">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    className={`session-item ${
                      selectedSession?.id === session.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedSession(session)
                      setMessages(session.messages)
                    }}
                  >
                    <div className="session-title">
                      {session.sessionType === 'practice'
                        ? '💬 Practice'
                        : '🔍 Explore'}
                    </div>
                    <div className="session-target">
                      {(session.targetPerson).name || 'Chat'}
                    </div>
                    <div className="session-time">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-sessions">
                <p>No sessions yet</p>
                <p className="hint">Start a new practice session</p>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="tips-section">
            <h3>💡 Tips</h3>
            <ul>
              <li>Be authentic and genuine</li>
              <li>Ask thoughtful questions</li>
              <li>Listen actively</li>
              <li>Follow up with connections</li>
            </ul>
          </div>
        </div>

        {/* Main Chat Area */}
        {selectedSession ? (
          <div className="chat-main">
            <div className="chat-session-header">
              <div>
                <h2>
                  {selectedSession.sessionType === 'practice'
                    ? 'Practice Session'
                    : 'Explore'}
                </h2>
                <p>
                  with{' '}
                  {((selectedSession.targetPerson).name) || 'AI'}
                </p>
              </div>
              <div className="session-badge">
                {selectedSession.sessionType === 'practice'
                  ? '🎯 Practice'
                  : '📚 Learning'}
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h3>Welcome to your practice session!</h3>
                  <p>
                    Start by introducing yourself or asking about the company.
                  </p>
                  <p className="hint">
                    💡 Tip: Use the microphone to practice your verbal pitch
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender}`}
                  >
                    <div className="message-avatar">
                      {message.sender === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <p>{message.content}</p>
                      {message.sender === 'ai' && (
                        <button
                          className="btn-speak"
                          onClick={() =>
                            handleTextToSpeech()
                          }
                          disabled={isSpeaking}
                        >
                          {isSpeaking ? (
                            <>
                              <Volume2 size={16} /> Speaking...
                            </>
                          ) : (
                            <>
                              <VolumeX size={16} /> Hear response
                            </>
                          )}
                        </button>
                      )}
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="message ai loading">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="input-actions">
                <button
                  className={`btn-mic ${isListening ? 'recording' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Stop recording' : 'Start recording'}
                >
                  {isListening ? (
                    <Mic size={20} />
                  ) : (
                    <MicOff size={20} />
                  )}
                </button>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder={
                      isListening
                        ? 'Recording...'
                        : 'Type your message or press microphone...'
                    }
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleSendMessage()
                      }
                    }}
                    disabled={isListening}
                  />
                </div>
                <button
                  className="btn-send"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="input-hint">
                Press Shift + Enter for new line, or click Send
              </p>
            </div>
          </div>
        ) : (
          <div className="no-session">
            <div className="empty-state">
              <h2>No session selected</h2>
              <p>Start a new practice session to begin</p>
              <button
                className="btn-start-session"
                onClick={() => createNewSession('practice')}
              >
                Start Practice Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
