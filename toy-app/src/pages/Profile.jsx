import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useAppStore } from '../store/useAppStore.js'
import { Upload, Save } from 'lucide-react'
import './Profile.css'

const INTERESTS = ['AI/ML', 'Web Dev', 'Mobile Dev', 'Cloud', 'Data Science', 'DevOps', 'Security', 'Product']
const SECTORS = ['Tech', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Gaming', 'Social Media', 'Enterprise']
const ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UX Designer', 'Founder', 'Intern', 'Graduate']

export default function Profile() {
  const { user } = useUser()
  const { userProfile, setUserProfile } = useAppStore()
  const [isEditing, setIsEditing] = useState(!userProfile)
  const [formData, setFormData] = useState(
    userProfile
      ? {
          name: userProfile.name,
          education: userProfile.education,
          experience: userProfile.experience,
          contactInfo: userProfile.contactInfo,
          interests: userProfile.interests || [],
          targetSectors: userProfile.targetSectors || [],
          targetRoles: userProfile.targetRoles || [],
        }
      : {
          name: user?.fullName || '',
          education: '',
          experience: '',
          contactInfo: user?.primaryEmailAddress?.emailAddress || '',
          interests: [],
          targetSectors: [],
          targetRoles: [],
        }
  )
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading] = useState(false)

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

      // TODO: Parse resume with AI service
      // 1. Upload to Convex storage
      // 2. Call AI parsing service to extract:
      //    - Name, email, phone
      //    - Skills
      //    - Experience history
      //    - Education
      // 3. Pre-populate form fields
      // 4. Update user profile with parsed data

      setTimeout(() => {
        setUploading(false)
      }, 2000)
    }
  }

  const handleSave = async () => {
    setUploading(true)

    // TODO: Save profile to Convex backend
    // 1. Validate form data
    // 2. Upload resume if provided
    // 3. Save to Convex database
    // 4. Update local store

    const newProfile = {
      id: userProfile?.id || `profile-${Date.now()}`,
      userId: user?.id || '',
      name: formData.name,
      email: formData.contactInfo,
      education: formData.education,
      experience: formData.experience,
      contactInfo: formData.contactInfo,
      interests: formData.interests,
      targetSectors: formData.targetSectors,
      targetRoles: formData.targetRoles,
      resumeUrl: userProfile?.resumeUrl,
      createdAt: userProfile?.createdAt || Date.now(),
      updatedAt: Date.now(),
    }

    setUserProfile(newProfile)
    setIsEditing(false)
    setUploading(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        education: userProfile.education,
        experience: userProfile.experience,
        contactInfo: userProfile.contactInfo,
        interests: userProfile.interests,
        targetSectors: userProfile.targetSectors,
        targetRoles: userProfile.targetRoles,
      })
    }
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <p className="subtitle">Build your professional identity</p>
      </div>

      <div className="profile-container">
        {/* Resume Section */}
        <section className="resume-section">
          <h2>Resume</h2>
          <div className="resume-upload">
            <div className="upload-area">
              <Upload size={32} />
              <h3>Upload Your Resume</h3>
              <p>PDF, DOC, or DOCX format (Max 5MB)</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={uploading}
                className="file-input"
              />
              {resumeFile && (
                <p className="file-info">
                  Selected: <strong>{resumeFile.name}</strong>
                </p>
              )}
              {userProfile?.resumeUrl && (
                <p className="resume-status">✓ Resume uploaded</p>
              )}
            </div>
            {uploading && <p className="uploading">Parsing resume...</p>}
          </div>
        </section>

        {/* Personal Details */}
        <section className="form-section">
          <h2>Personal Details</h2>
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
                <label htmlFor="contactInfo">Email/Phone</label>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="education">Education</label>
                <textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="BS Computer Science, Stanford University"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience</label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Software Engineer at Tech Corp (2020-2023)..."
                  rows={3}
                />
              </div>

              {/* Interests */}
              <div className="form-group">
                <label>Interests</label>
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

              <div className="form-actions">
                <button type="button" className="btn-save" onClick={handleSave} disabled={uploading}>
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
                <span className="label">Contact:</span>
                <span className="value">{formData.contactInfo}</span>
              </div>
              <div className="view-item">
                <span className="label">Education:</span>
                <span className="value">{formData.education || 'Not provided'}</span>
              </div>
              <div className="view-item">
                <span className="label">Experience:</span>
                <span className="value">{formData.experience || 'Not provided'}</span>
              </div>

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
