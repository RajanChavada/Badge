import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery, useAction } from 'convex/react'
import useAppStore from '../store/useAppStore.js'
import { api } from '../../convex/_generated/api.js'
import { extractTextFromPDF } from '../utils/pdfParser.js'
import { Upload, Save, Sparkles, User, Briefcase, GraduationCap, Code, Target } from 'lucide-react'
import './Profile.css'

const INTERESTS = ['AI/ML', 'Web Dev', 'Mobile Dev', 'Cloud', 'Data Science', 'DevOps', 'Security', 'Product', 'Blockchain', 'IoT']
const SECTORS = ['Tech', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Gaming', 'Social Media', 'Enterprise', 'Startup', 'Non-profit']
const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UX Designer', 'Founder', 'Intern', 'Graduate', 'Full-Stack Dev', 'ML Engineer']
const LOOKING_FOR = ['Internship', 'Full-time', 'Co-op', 'Part-time', 'Mentorship', 'Collaboration', 'Networking', 'Hiring']

export default function Profile() {
  const { user } = useUser()
  const getProfileQuery = useQuery(api.users.getProfile, user?.id ? { clerkId: user.id } : 'skip')
  const upsertProfileMutation = useMutation(api.users.upsertProfile)
  const generateResumeUploadUrlMutation = useMutation(api.users.generateResumeUploadUrl)
  const saveResumeFileIdMutation = useMutation(api.users.saveResumeFileId)
  const parseResumeAction = useAction(api.resumeParser.parseResume)
  const { userProfile, setUserProfile } = useAppStore()
  const [isEditing, setIsEditing] = useState(!userProfile)
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
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
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [extractedResumeText, setExtractedResumeText] = useState('')
  const [parsedIdentity, setParsedIdentity] = useState(null)

  // Load existing profile from Convex when the user signs in
  useEffect(() => {
    if (getProfileQuery === undefined) return

    setLoadingProfile(false)
    const profile = getProfileQuery
    if (profile) {
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
      setIsEditing(false)
      setUserProfile({ ...profile, ...mapped })
    }
  }, [getProfileQuery, setUserProfile, user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleMultiSelect = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }))
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      setUploading(true)
      setError('')
      setStatus('📄 Extracting text from PDF...')

      try {
        // Step 1: Extract text from PDF
        const extractedText = await extractTextFromPDF(file)
        setExtractedResumeText(extractedText)
        setStatus(`✅ Extracted ${extractedText.length} characters. Now analyzing with AI...`)

        // Step 2: AUTOMATICALLY parse with Gemini AI
        setParsing(true)
        setUploading(false)

        const result = await parseResumeAction({
          resumeText: extractedText,
          userName: user?.fullName || formData.name,
          userEmail: user?.primaryEmailAddress?.emailAddress || formData.email,
        })

        if (result.success && result.identity) {
          console.log('[Profile] AI parsed identity:', result.identity)
          setParsedIdentity(result.identity)

          // Update form with AI-extracted data
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

          setStatus('✅ Resume analyzed! Review your profile and click Save.')
        } else {
          setError(result.error || 'AI parsing failed. You can still fill in your profile manually.')
          setStatus('')
        }
      } catch (err) {
        console.error('Resume processing error:', err)
        setError('Could not process PDF. Please try again or fill in manually.')
        setStatus('')
      } finally {
        setUploading(false)
        setParsing(false)
      }
    }
  }

  // Manual re-parse option (in case user wants to try again)
  const handleParseWithAI = async () => {
    if (!extractedResumeText) {
      setError('Please upload a resume first')
      return
    }

    setParsing(true)
    setStatus('🤖 Re-analyzing resume with AI...')
    setError('')

    try {
      const result = await parseResumeAction({
        resumeText: extractedResumeText,
        userName: user?.fullName || formData.name,
        userEmail: user?.primaryEmailAddress?.emailAddress || formData.email,
      })

      if (result.success && result.identity) {
        console.log('[Profile] AI parsed identity:', result.identity)
        setParsedIdentity(result.identity)

        // Update form with AI-extracted data
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

        setStatus('✅ Resume analyzed! Review and save your profile.')
      } else {
        setError(result.error || 'Failed to parse resume')
      }
    } catch (err) {
      console.error('AI parsing error:', err)
      setError('AI parsing failed. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setUploading(true)
    setStatus('Saving to Convex...')
    setError('')

    try {
      // Build rich identity object
      const identity = {
        headline: formData.headline || `${formData.name} - Hackathon Attendee`,
        summary: formData.summary,
        education: formData.education.length > 0 ? formData.education : undefined,
        experience: formData.experience.length > 0 ? formData.experience : undefined,
        projects: formData.projects.length > 0 ? formData.projects : undefined,
        skills: formData.skills,
        technicalSkills: formData.technicalSkills.length > 0 ? formData.technicalSkills : undefined,
        interests: formData.interests,
        goals: formData.goals,
        targetRoles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
        targetCompanyTypes: formData.targetSectors.length > 0 ? formData.targetSectors : undefined,
        lookingFor: formData.lookingFor.length > 0 ? formData.lookingFor : undefined,
      }

      await upsertProfileMutation({
        clerkId: user.id,
        email: formData.email || user?.primaryEmailAddress?.emailAddress || '',
        name: formData.name || user?.fullName || '',
        resumeText: extractedResumeText || undefined,
        identity,
      })

      setUserProfile({ ...formData, identity })
      setIsEditing(false)
      setResumeFile(null)
      setStatus('Saved!')
    } catch (err) {
      console.error(err)
      setError('Failed to save profile to Convex.')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        headline: userProfile.identity?.headline || '',
        summary: userProfile.identity?.summary || '',
        education: userProfile.identity?.education || [],
        experience: userProfile.identity?.experience || [],
        projects: userProfile.identity?.projects || [],
        skills: userProfile.identity?.skills || [],
        technicalSkills: userProfile.identity?.technicalSkills || [],
        interests: userProfile.identity?.interests || [],
        goals: userProfile.identity?.goals || [],
        targetRoles: userProfile.identity?.targetRoles || [],
        targetSectors: userProfile.identity?.targetCompanyTypes || [],
        lookingFor: userProfile.identity?.lookingFor || [],
      })
    }
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <p className="subtitle">Build your professional identity</p>
      </div>

      {loadingProfile && <p className="loading">Loading profile...</p>}
      {error && <p className="error-text">{error}</p>}
      {status && <p className="status-text">{status}</p>}

      <div className="profile-container">
        {/* Resume Upload Section - SINGLE INSTANCE */}
        <section className="resume-section">
          <h2><Upload size={20} /> Resume Upload</h2>
          <div className="resume-upload">
            <div className="upload-area">
              <Sparkles size={32} />
              <h3>Upload Your Resume</h3>
              <p>PDF format - AI will automatically extract your profile</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={uploading || parsing}
                className="file-input"
              />
              {resumeFile && (
                <p className="file-info">
                  Selected: <strong>{resumeFile.name}</strong>
                </p>
              )}
            </div>

            {uploading && (
              <div className="processing-status">
                <Upload size={20} className="spin" />
                <p>📄 Extracting text from PDF...</p>
              </div>
            )}

            {parsing && (
              <div className="processing-status">
                <Sparkles size={20} className="spin" />
                <p>🤖 AI is analyzing your resume...</p>
              </div>
            )}
          </div>
        </section>

        {/* AI-Extracted Identity Preview */}
        {parsedIdentity && (
          <section className="ai-identity-section">
            <h2><Sparkles size={20} /> AI-Extracted Identity</h2>
            <div className="identity-preview">
              {parsedIdentity.headline && (
                <div className="identity-item">
                  <strong>Headline:</strong> {parsedIdentity.headline}
                </div>
              )}
              {parsedIdentity.summary && (
                <div className="identity-item">
                  <strong>Summary:</strong> {parsedIdentity.summary}
                </div>
              )}
              {parsedIdentity.education?.length > 0 && (
                <div className="identity-item">
                  <strong><GraduationCap size={16} /> Education:</strong>
                  <ul>
                    {parsedIdentity.education.map((edu, i) => (
                      <li key={i}>{edu.degree} in {edu.field} - {edu.institution} ({edu.graduationYear})</li>
                    ))}
                  </ul>
                </div>
              )}
              {parsedIdentity.experience?.length > 0 && (
                <div className="identity-item">
                  <strong><Briefcase size={16} /> Experience:</strong>
                  <ul>
                    {parsedIdentity.experience.map((exp, i) => (
                      <li key={i}>{exp.role} at {exp.company} ({exp.duration})</li>
                    ))}
                  </ul>
                </div>
              )}
              {parsedIdentity.projects?.length > 0 && (
                <div className="identity-item">
                  <strong><Code size={16} /> Projects:</strong>
                  <ul>
                    {parsedIdentity.projects.map((proj, i) => (
                      <li key={i}>{proj.name} - {proj.technologies?.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}
              {parsedIdentity.skills?.length > 0 && (
                <div className="identity-item">
                  <strong>Skills:</strong>
                  <div className="tags-view">
                    {parsedIdentity.skills.map((skill) => (
                      <span key={skill} className="tag-badge">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Re-parse option */}
            {extractedResumeText && !parsing && (
              <button
                type="button"
                className="btn-reparse"
                onClick={handleParseWithAI}
                disabled={parsing}
              >
                <Sparkles size={16} />
                Re-analyze with AI
              </button>
            )}
          </section>
        )}

        {/* Personal Details */}
        <section className="form-section">
          <h2><User size={20} /> Personal Details</h2>
          {isEditing ? (
            <form className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="headline">Professional Headline</label>
                <input
                  type="text"
                  id="headline"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  placeholder="CS Student at UofT | Full-Stack Developer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="summary">Summary</label>
                <textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Brief professional summary..."
                  rows={3}
                />
              </div>

              {/* Skills from AI */}
              <div className="form-group">
                <label><Code size={16} /> Skills (from resume)</label>
                <div className="tags-view editable">
                  {formData.skills.map((skill) => (
                    <span key={skill} className="tag-badge">{skill}</span>
                  ))}
                  {formData.skills.length === 0 && <span className="hint">Upload resume to extract skills</span>}
                </div>
              </div>

              {/* Interests */}
              <div className="form-group">
                <label><Target size={16} /> Interests</label>
                <div className="multi-select">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      className={`tag ${formData.interests.includes(interest) ? 'selected' : ''}`}
                      onClick={() => handleMultiSelect('interests', interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Sectors */}
              <div className="form-group">
                <label>Target Sectors</label>
                <div className="multi-select">
                  {SECTORS.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      className={`tag ${formData.targetSectors.includes(sector) ? 'selected' : ''}`}
                      onClick={() => handleMultiSelect('targetSectors', sector)}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Roles */}
              <div className="form-group">
                <label>Roles Sought</label>
                <div className="multi-select">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`tag ${formData.targetRoles.includes(role) ? 'selected' : ''}`}
                      onClick={() => handleMultiSelect('targetRoles', role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Looking For */}
              <div className="form-group">
                <label>Looking For</label>
                <div className="multi-select">
                  {LOOKING_FOR.map((item) => (
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

              <div className="form-actions">
                <button type="button" className="btn-save" onClick={handleSave} disabled={uploading || parsing}>
                  <Save size={18} />
                  Save Profile
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="view-item">
                <span className="label">Name:</span>
                <span className="value">{formData.name}</span>
              </div>
              <div className="view-item">
                <span className="label">Email:</span>
                <span className="value">{formData.email}</span>
              </div>
              {formData.headline && (
                <div className="view-item">
                  <span className="label">Headline:</span>
                  <span className="value">{formData.headline}</span>
                </div>
              )}
              {formData.summary && (
                <div className="view-item">
                  <span className="label">Summary:</span>
                  <span className="value">{formData.summary}</span>
                </div>
              )}

              {formData.skills.length > 0 && (
                <div className="view-item">
                  <span className="label">Skills:</span>
                  <div className="tags-view">
                    {formData.skills.map((skill) => (
                      <span key={skill} className="tag-badge skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.interests.length > 0 && (
                <div className="view-item">
                  <span className="label">Interests:</span>
                  <div className="tags-view">
                    {formData.interests.map((interest) => (
                      <span key={interest} className="tag-badge">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetSectors.length > 0 && (
                <div className="view-item">
                  <span className="label">Target Sectors:</span>
                  <div className="tags-view">
                    {formData.targetSectors.map((sector) => (
                      <span key={sector} className="tag-badge">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetRoles.length > 0 && (
                <div className="view-item">
                  <span className="label">Target Roles:</span>
                  <div className="tags-view">
                    {formData.targetRoles.map((role) => (
                      <span key={role} className="tag-badge">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.lookingFor.length > 0 && (
                <div className="view-item">
                  <span className="label">Looking For:</span>
                  <div className="tags-view">
                    {formData.lookingFor.map((item) => (
                      <span key={item} className="tag-badge highlight">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" className="btn-edit" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}