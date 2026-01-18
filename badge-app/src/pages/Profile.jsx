import { useState, useEffect, useMemo, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery, useAction } from 'convex/react'
import useAppStore from '../store/useAppStore.js'
import { api } from '../../convex/_generated/api.js'
import { extractTextFromPDF } from '../utils/pdfParser.js'
import Tilt from 'react-parallax-tilt'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Save, Sparkles, User, Briefcase, GraduationCap, Code, Target, QrCode } from 'lucide-react'
import './Profile.css'

const INTERESTS = ['AI/ML', 'Web Dev', 'Mobile Dev', 'Cloud', 'Data Science', 'DevOps', 'Security', 'Product', 'Blockchain', 'IoT']
const SECTORS = ['Tech', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Gaming', 'Social Media', 'Enterprise', 'Startup', 'Non-profit']
const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UX Designer', 'Founder', 'Intern', 'Graduate', 'Full-Stack Dev', 'ML Engineer']
const LOOKING_FOR = ['Internship', 'Full-time', 'Co-op', 'Part-time', 'Mentorship', 'Collaboration', 'Networking', 'Hiring']

export default function Profile() {
  const { user } = useUser()
  const parseResumeAction = useAction(api.resumeParser.parseResume)
  const getProfileQuery = useQuery(api.users.getProfile, user?.id ? { clerkId: user.id } : 'skip')
  const upsertProfileMutation = useMutation(api.users.upsertProfile)

  const { userProfile, setUserProfile } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    headline: '',
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    technicalSkills: [],
    interests: [],
    goals: [],
    targetRoles: [],
    targetSectors: [],
    lookingFor: [],
  })

  // Evolution Stats (Hardcoded for now as requested)
  const [progress] = useState({
    communication: 65,
    skills: 42,
    sponsors: 78,
    opportunities: 30,
  })

  const overallJourney = useMemo(() =>
    Math.round((progress.communication + progress.skills + progress.sponsors + progress.opportunities) / 4),
    [progress]
  )

  const floatingMetrics = [
    { label: "Comm.", value: progress.communication },
    { label: "Skills", value: progress.skills },
    { label: "Sponsors", value: progress.sponsors },
    { label: "Reach", value: progress.opportunities },
  ]


  // Processing States
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [extractedResumeText, setExtractedResumeText] = useState('')
  const [parsedIdentity, setParsedIdentity] = useState(null)

  // Initialize Data
  useEffect(() => {
    if (getProfileQuery) {
      const profile = getProfileQuery
      const identity = profile.identity || {}

      const mapped = {
        name: profile.name || user?.fullName || '',
        email: profile.email || user?.primaryEmailAddress?.emailAddress || '',
        headline: identity.headline || '',
        summary: identity.summary || '',
        education: identity.education || [],
        experience: identity.experience || [],
        projects: identity.projects || [],
        skills: identity.skills || [],
        technicalSkills: identity.technicalSkills || [],
        interests: identity.interests || [],
        goals: identity.goals || [],
        targetRoles: identity.targetRoles || [],
        targetSectors: identity.targetCompanyTypes || [],
        lookingFor: identity.lookingFor || [],
      }

      setFormData(mapped)
      setParsedIdentity(identity)
      setUserProfile({ ...profile, ...mapped })
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }))
    }
  }, [getProfileQuery, user, setUserProfile])

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || []
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
      return { ...prev, [field]: updated }
    })
  }

  const [isDragging, setIsDragging] = useState(false)

  const processFile = async (file) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setResumeFile(file)
    setUploading(true)
    setError('')
    setStatus('📄 Extracting text...')

    try {
      const extractedText = await extractTextFromPDF(file)
      setExtractedResumeText(extractedText)

      setUploading(false)
      setParsing(true)
      setStatus('🤖 AI Analyzing...')

      const result = await parseResumeAction({
        resumeText: extractedText,
        userName: user?.fullName || formData.name,
        userEmail: user?.primaryEmailAddress?.emailAddress || formData.email,
      })

      if (result.success && result.identity) {
        setParsedIdentity(result.identity)
        setFormData(prev => ({
          ...prev,
          headline: result.identity.headline || prev.headline,
          summary: result.identity.summary || prev.summary,
          education: result.identity.education || prev.education,
          experience: result.identity.experience || prev.experience,
          projects: result.identity.projects || prev.projects,
          skills: result.identity.skills || prev.skills,
          technicalSkills: result.identity.technicalSkills || prev.technicalSkills,
          interests: result.identity.interests || prev.interests,
          goals: result.identity.goals || prev.goals,
          targetRoles: result.identity.targetRoles || prev.targetRoles,
          lookingFor: result.identity.lookingFor || prev.lookingFor,
        }))
        setStatus('✅ Resume analyzed!')
      } else {
        setError(result.error || 'AI parsing failed')
      }
    } catch (err) {
      console.error('Resume error:', err)
      setError('Failed to process resume')
    } finally {
      setUploading(false)
      setParsing(false)
    }
  }

  const handleResumeUpload = (e) => {
    const file = e.target.files[0]
    processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }

  const handleSave = async () => {
    setUploading(true)
    setStatus('Saving...')

    try {
      const identity = {
        headline: formData.headline || `${formData.name} - Attendee`,
        summary: formData.summary,
        education: formData.education.length ? formData.education : undefined,
        experience: formData.experience.length ? formData.experience : undefined,
        projects: formData.projects.length ? formData.projects : undefined,
        skills: formData.skills,
        technicalSkills: formData.technicalSkills.length ? formData.technicalSkills : undefined,
        interests: formData.interests,
        goals: formData.goals,
        targetRoles: formData.targetRoles.length ? formData.targetRoles : undefined,
        targetCompanyTypes: formData.targetSectors.length ? formData.targetSectors : undefined,
        lookingFor: formData.lookingFor.length ? formData.lookingFor : undefined,
      }

      await upsertProfileMutation({
        clerkId: user.id,
        email: formData.email,
        name: formData.name,
        resumeText: extractedResumeText || undefined,
        identity,
      })

      setUserProfile({ ...formData, identity })
      setStatus('Saved!')
      setTimeout(() => {
        setIsModalOpen(false)
        setStatus('')
      }, 1000)
    } catch (err) {
      console.error(err)
      setError('Failed to save profile')
    } finally {
      setUploading(false)
    }
  }

  const [isFlipped, setIsFlipped] = useState(false)

  // Toggle body class to hide navbar and prevent scroll
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open')
      document.documentElement.style.backgroundColor = '#000' // Force dark back for overlay
    } else {
      document.body.classList.remove('modal-open')
      document.documentElement.style.backgroundColor = ''
    }
    return () => {
      document.body.classList.remove('modal-open')
      document.documentElement.style.backgroundColor = ''
    }
  }, [isModalOpen])

  return (
    <>
      <div className={`profile-page ${isModalOpen ? 'modal-is-open' : ''}`}>
        <div className="welcome-header">
          <h1>Your Identity</h1>
          <p className="subtitle">Evolving through experience</p>
        </div>

        {/* 3D Flippable Badge Card */}
        <div className="badge-scene">
          <Tilt
            perspective={1200}
            glareEnable={true}
            glareMaxOpacity={0.15}
            scale={1.02}
            gyroscope={true}
            className="badge-tilt-wrapper"
          >
            <motion.div
              className={`badge-container ${isFlipped ? 'is-flipped' : ''}`}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* FRONT SIDE */}
              <div className="badge-face front" onClick={() => setIsFlipped(true)}>
                <div className="badge-slot">
                  <div className="badge-hole"></div>
                </div>
                <div className="badge-header">Event Attendee 2026</div>
                <div className="badge-content">
                  <img
                    src={user?.imageUrl || "https://via.placeholder.com/150"}
                    alt="Profile"
                    className="badge-avatar"
                  />
                  <h2 className="badge-name">{formData.name || user?.fullName || "Your Name"}</h2>
                  <p className="badge-role">
                    {formData.headline || "Your Headline"}
                  </p>
                  <div className="badge-tags">
                    {formData.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="mini-tag">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="badge-footer">
                  <div className="barcode"></div>
                  <span className="tap-hint">Tap to see your journey →</span>
                </div>
              </div>

              {/* BACK SIDE */}
              <div className="badge-face back" onClick={() => setIsFlipped(false)}>
                <div className="evolution-header">
                  <h3>Identity Evolution</h3>
                  <div className="overall-stat">
                    <span>Journey Completion</span>
                    <span className="stat-value">{overallJourney}%</span>
                  </div>
                  <div className="progress-bar-large">
                    <motion.div
                      className="progress-fill-large"
                      initial={{ width: 0 }}
                      animate={{ width: `${overallJourney}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>

                <div className="sub-meters">
                  {[
                    { label: "Communication", val: progress.communication },
                    { label: "Skill Discovery", val: progress.skills },
                    { label: "Sponsor Interactions", val: progress.sponsors },
                    { label: "Opportunities", val: progress.opportunities },
                  ].map((item, idx) => (
                    <div key={idx} className="sub-meter-item">
                      <div className="meter-label">
                        <span>{item.label}</span>
                        <span className="meter-val">{item.val}%</span>
                      </div>
                      <div className="meter-track">
                        <motion.div
                          className="meter-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.val}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + (idx * 0.1) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="badge-footer back-footer">
                  <span className="tap-hint">Tap to see profile ←</span>
                </div>
              </div>
            </motion.div>
          </Tilt>
        </div>

        {/* Floating Action Buttons */}
        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={() => setIsModalOpen(true)}>
            <Sparkles size={16} /> Edit Profile
          </button>
        </div>


      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2><User size={24} /> Edit Your Badge Profile</h2>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {error && <div className="error-banner">{error}</div>}

                {/* Resume Upload */}
                <div className="form-section">
                  <h3>Resume Auto-Fill</h3>
                  <label
                    className={`resume-upload-box ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      disabled={uploading || parsing}
                    />
                    <div className="upload-icon-container">
                      <Upload size={40} />
                    </div>
                    <div>
                      <strong>{isDragging ? "Drop Resume Here" : "Upload Resume (PDF)"}</strong>
                      <p>Drag & drop or click to upload</p>
                    </div>
                    {(uploading || parsing) && <p className="status-text">{status}</p>}
                  </label>
                </div>

                {parsedIdentity && (
                  <div className="ai-preview">
                    <div className="preview-header"><Sparkles size={16} /> AI Extracted Identity</div>
                    <p>Verified profile elements have been populated below.</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="profile-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} />
                  </div>

                  <div className="form-group">
                    <label>Professional Headline</label>
                    <input
                      name="headline"
                      value={formData.headline}
                      onChange={handleInputChange}
                      placeholder="e.g. CS Student at UofT | Full Stack Dev"
                    />
                  </div>

                  <div className="form-group">
                    <label>Summary</label>
                    <textarea
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  {/* Skills Tag Input */}
                  <div className="form-group">
                    <label>Skills</label>
                    <div className="tags-container">
                      {formData.skills.map(skill => (
                        <span key={skill} className="tag-badge pill">{skill}</span>
                      ))}
                    </div>
                    <p className="hint-text">Skills are auto-extracted from your resume.</p>
                  </div>

                  {/* Interests */}
                  <div className="form-group">
                    <label>Interests</label>
                    <div className="multi-select">
                      {INTERESTS.map(item => (
                        <button
                          key={item}
                          type="button"
                          className={`tag ${formData.interests.includes(item) ? 'selected' : ''}`}
                          onClick={() => handleMultiSelect('interests', item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Looking For */}
                  <div className="form-group">
                    <label>Looking For</label>
                    <div className="multi-select">
                      {LOOKING_FOR.map(item => (
                        <button
                          key={item}
                          type="button"
                          className={`tag ${formData.lookingFor.includes(item) ? 'selected' : ''}`}
                          onClick={() => handleMultiSelect('lookingFor', item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSave} disabled={uploading}>
                    {uploading ? 'Saving...' : <><Save size={18} /> Save Badge</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}