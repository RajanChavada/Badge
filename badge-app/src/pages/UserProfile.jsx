import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ArrowLeft, Mail, Briefcase, GraduationCap, Target, Code, User, Sparkles } from 'lucide-react';
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

  const identity = profile.identity || {};

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
          {identity.headline && (
            <p className="headline">{identity.headline}</p>
          )}
          {profile.email && (
            <div className="contact-info">
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
          )}
        </div>

        {identity.summary && (
          <div className="profile-section">
            <div className="section-header">
              <User size={20} />
              <h2>About</h2>
            </div>
            <p className="summary">{identity.summary}</p>
          </div>
        )}

        {identity.education && identity.education.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <GraduationCap size={20} />
              <h2>Education</h2>
            </div>
            {identity.education.map((edu, idx) => (
              <div key={idx} className="education-item">
                <h3>{edu.institution}</h3>
                {edu.degree && <p className="degree">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>}
                <div className="education-details">
                  {edu.graduationYear && <span className="detail">Class of {edu.graduationYear}</span>}
                  {edu.gpa && <span className="detail">GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {identity.experience && identity.experience.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Briefcase size={20} />
              <h2>Experience</h2>
            </div>
            {identity.experience.map((exp, idx) => (
              <div key={idx} className="experience-item">
                <h3>{exp.role}</h3>
                <p className="company">{exp.company}</p>
                {exp.duration && <p className="duration">{exp.duration}</p>}
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="highlights">
                    {exp.highlights.map((highlight, hIdx) => (
                      <li key={hIdx}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {identity.projects && identity.projects.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Code size={20} />
              <h2>Projects</h2>
            </div>
            {identity.projects.map((proj, idx) => (
              <div key={idx} className="project-item">
                <h3>{proj.name}</h3>
                {proj.description && <p className="project-desc">{proj.description}</p>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="tags">
                    {proj.technologies.map((tech, tIdx) => (
                      <span key={tIdx} className="tag tech-tag">{tech}</span>
                    ))}
                  </div>
                )}
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="project-link">
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {identity.skills && identity.skills.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Sparkles size={20} />
              <h2>Skills</h2>
            </div>
            <div className="tags">
              {identity.skills.map((skill, idx) => (
                <span key={idx} className="tag skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {identity.interests && identity.interests.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Code size={20} />
              <h2>Interests</h2>
            </div>
            <div className="tags">
              {identity.interests.map((interest, idx) => (
                <span key={idx} className="tag">{interest}</span>
              ))}
            </div>
          </div>
        )}

        {identity.goals && identity.goals.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Target size={20} />
              <h2>Goals</h2>
            </div>
            <ul className="goals-list">
              {identity.goals.map((goal, idx) => (
                <li key={idx}>{goal}</li>
              ))}
            </ul>
          </div>
        )}

        {identity.targetRoles && identity.targetRoles.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Target size={20} />
              <h2>Looking For</h2>
            </div>
            <div className="tags">
              {identity.targetRoles.map((role, idx) => (
                <span key={idx} className="tag target-tag">{role}</span>
              ))}
            </div>
          </div>
        )}

        {identity.lookingFor && identity.lookingFor.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <Target size={20} />
              <h2>Availability</h2>
            </div>
            <div className="tags">
              {identity.lookingFor.map((item, idx) => (
                <span key={idx} className="tag availability-tag">{item}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
