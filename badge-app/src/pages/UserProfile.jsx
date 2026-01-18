import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ArrowLeft, Mail, Briefcase, GraduationCap, Target, Code } from 'lucide-react';
import './UserProfile.css';

export default function UserProfile() {
  const { clerkId } = useParams();
  const navigate = useNavigate();
  const profile = useQuery(api.users.getProfile, { clerkId });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile !== undefined) {
      setLoading(false);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="error">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h1>{profile.name || 'Anonymous'}</h1>
          {profile.contactInfo && (
            <div className="contact-info">
              <Mail size={16} />
              <span>{profile.contactInfo}</span>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="section-header">
            <GraduationCap size={20} />
            <h2>Education</h2>
          </div>
          <p>{profile.education || 'No education information provided'}</p>
        </div>

        <div className="profile-section">
          <div className="section-header">
            <Briefcase size={20} />
            <h2>Experience</h2>
          </div>
          <p>{profile.experience || 'No experience information provided'}</p>
        </div>

        {profile.interests && profile.interests.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Code size={20} />
              <h2>Interests</h2>
            </div>
            <div className="tags">
              {profile.interests.map((interest, idx) => (
                <span key={idx} className="tag">{interest}</span>
              ))}
            </div>
          </div>
        )}

        {profile.targetSectors && profile.targetSectors.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Target size={20} />
              <h2>Target Sectors</h2>
            </div>
            <div className="tags">
              {profile.targetSectors.map((sector, idx) => (
                <span key={idx} className="tag">{sector}</span>
              ))}
            </div>
          </div>
        )}

        {profile.targetRoles && profile.targetRoles.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Target size={20} />
              <h2>Target Roles</h2>
            </div>
            <div className="tags">
              {profile.targetRoles.map((role, idx) => (
                <span key={idx} className="tag">{role}</span>
              ))}
            </div>
          </div>
        )}

        {profile.resumeText && (
          <div className="profile-section">
            <div className="section-header">
              <Briefcase size={20} />
              <h2>Resume Summary</h2>
            </div>
            <p className="resume-text">{profile.resumeText.slice(0, 500)}...</p>
          </div>
        )}
      </div>
    </div>
  );
}
