import { useState, useEffect } from 'react'
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
  const vectorizeAction = useAction(api.users.vectorizeProfileInSnowflake)
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
        const updatedFormData = {
          ...formData,
          headline: result.identity.headline || formData.headline,
          summary: result.identity.summary || formData.summary,
          education: result.identity.education || formData.education,
          experience: result.identity.experience || formData.experience,
          projects: result.identity.projects || formData.projects,
          skills: result.identity.skills || formData.skills,
          technicalSkills: result.identity.technicalSkills || formData.technicalSkills,
          interests: result.identity.interests || formData.interests,
          goals: result.identity.goals || formData.goals,
          targetRoles: result.identity.targetRoles || formData.targetRoles,
          lookingFor: result.identity.lookingFor || formData.lookingFor,
        }
        setFormData(updatedFormData)
        
        setStatus('📊 Vectorizing profile...')
        try {
          await vectorizeAction({
            clerkId: user.id,
            name: updatedFormData.name || user?.fullName,
            education: updatedFormData.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join('; '),
            interests: updatedFormData.interests,
            resumeText: extractedText,
          })
          setStatus('✅ Resume analyzed and vectorized!')
        } catch (vectorErr) {
          console.error('Vectorization error:', vectorErr)
          setStatus('✅ Resume analyzed! (vectorization failed)')
        }
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

      // Vectorize the profile
      setStatus('Vectorizing profile...')
      await vectorizeAction({
        clerkId: user.id,
        name: formData.name,
        education: formData.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join('; '),
        interests: formData.interests,
        resumeText: extractedResumeText || undefined,
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

  return (
    <div className="profile-page">
      {/* 3D Badge Card */}
      <Tilt
        className="badge-tilt"
        perspective={1000}
        glareEnable={true}
        glareMaxOpacity={0.45}
        scale={1.02}
      >
        <div className="badge-card" onClick={() => setIsModalOpen(true)}>
          <div className="badge-slot">
            <div className="badge-hole"></div>
          </div>

          <div className="badge-header">
            UoftHacks 13
          </div>

          <div className="badge-content">
            <img
              src={user?.imageUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="badge-avatar"
            />
            <h2 className="badge-name">{formData.name || user?.fullName || "Your Name"}</h2>
            <p className="badge-role">
              {formData.headline || "Tap to build your profile"}
            </p>

            <div className="badge-tags">
              {formData.skills.slice(0, 3).map(skill => (
                <span key={skill} className="mini-tag">{skill}</span>
              ))}
              {formData.interests.slice(0, 2).map(int => (
                <span key={int} className="mini-tag">{int}</span>
              ))}
            </div>
          </div>

          <div className="badge-footer">
            <div className="barcode"></div>
            <span className="tap-hint">Tap card to edit profile</span>
          </div>
        </div>
      </Tilt>

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
                    <Upload size={32} className="upload-icon-large" />
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
                        <span key={skill} className="tag-badge">{skill}</span>
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
    </div>
  )
}