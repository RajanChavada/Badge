import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useAction } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { ArrowLeft, Mail, Briefcase, GraduationCap, Target, Code, User, Sparkles, X, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import './UserProfile.css';

export default function UserProfile() {
  const { clerkId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const profile = useQuery(api.users.getProfile, { clerkId });
  const currentUserProfile = useQuery(api.users.getProfile, currentUser?.id ? { clerkId: currentUser.id } : 'skip');
  const generateTalkingPointsAction = useAction(api.users.generateConversationTalkingPoints);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState(null);
  const [loadingTalkingPoints, setLoadingTalkingPoints] = useState(false);

  useEffect(() => {
    if (profile !== undefined) {
      setLoading(false);
    }
  }, [profile]);

  const handleGenerateTalkingPoints = async () => {
    if (!currentUserProfile) return;
    
    setLoadingTalkingPoints(true);
    try {
      const result = await generateTalkingPointsAction({
        myProfile: currentUserProfile,
        theirProfile: profile,
      });
      setTalkingPoints(result);
    } catch (err) {
      console.error('Error generating talking points:', err);
      setTalkingPoints(null);
    } finally {
      setLoadingTalkingPoints(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
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
    <div className="profile-page">
      <button className="back-button-fixed" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

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
          UofTHacks 13
            </div>

            <div className="badge-content">
          <div className="badge-avatar-container">
            <div className="badge-avatar-placeholder">
              {profile.name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>

          <div className="badge-info">
            <h1>{profile.name || 'Anonymous'}</h1>
            {identity.headline && <p className="headline">{identity.headline}</p>}
            {profile.email && (
              <div className="contact-row">
            <Mail size={14} />
            <span>{profile.email}</span>
              </div>
            )}
          </div>

          <div className="badge-tags">
            {(identity.skills || identity.interests)?.slice(0, 5).map((item, idx) => (
              <span key={idx} className="badge-tag">{item}</span>
            ))}
          </div>
            </div>

            <div className="badge-footer">
          <div className="tap-hint">
            Tap card to view details
          </div>
            </div>
          </div>
        </Tilt>

        {/* Details Modal */}
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
                <h2><User size={24} /> {profile.name || 'Profile'}</h2>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              {!talkingPoints && (
                <div className="modal-action-bar">
                  <button 
                    className="btn-talking-points"
                    onClick={handleGenerateTalkingPoints}
                    disabled={loadingTalkingPoints}
                  >
                    <Lightbulb size={18} />
                    {loadingTalkingPoints ? 'Generating...' : 'Get Talking Points'}
                  </button>
                </div>
              )}

              {talkingPoints && (
                <div className="talking-points-section">
                  <div className="talking-points-header">
                    <Lightbulb size={20} />
                    <h3>Conversation Talking Points</h3>
                    <button 
                      className="btn-close-small"
                      onClick={() => setTalkingPoints(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="talking-points-content">
                    {talkingPoints.commonInterests && talkingPoints.commonInterests.length > 0 && (
                      <div className="talking-point-group">
                        <h4>🎯 Common Interests</h4>
                        <ul>
                          {talkingPoints.commonInterests.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {talkingPoints.complementarySkills && talkingPoints.complementarySkills.length > 0 && (
                      <div className="talking-point-group">
                        <h4>⚡ Complementary Skills</h4>
                        <ul>
                          {talkingPoints.complementarySkills.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {talkingPoints.questions && talkingPoints.questions.length > 0 && (
                      <div className="talking-point-group">
                        <h4>❓ Questions to Ask</h4>
                        <ul>
                          {talkingPoints.questions.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {talkingPoints.suggestions && talkingPoints.suggestions.length > 0 && (
                      <div className="talking-point-group">
                        <h4>💡 Suggestions</h4>
                        <ul>
                          {talkingPoints.suggestions.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-body">
                {/* About Section */}
                {identity.summary && (
                  <div className="profile-section">
                    <div className="section-header">
                      <User size={20} />
                      <h3>About</h3>
                    </div>
                    <p className="summary">{identity.summary}</p>
                  </div>
                )}

                {/* Education Section */}
                {identity.education && identity.education.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <GraduationCap size={20} />
                      <h3>Education</h3>
                    </div>
                    {identity.education.map((edu, idx) => (
                      <div key={idx} className="education-item">
                        <h4>{edu.institution}</h4>
                        {edu.degree && <p className="degree">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>}
                        <div className="education-details">
                          {edu.graduationYear && <span className="detail">Class of {edu.graduationYear}</span>}
                          {edu.gpa && <span className="detail">GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience Section */}
                {identity.experience && identity.experience.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <Briefcase size={20} />
                      <h3>Experience</h3>
                    </div>
                    {identity.experience.map((exp, idx) => (
                      <div key={idx} className="experience-item">
                        <h4>{exp.role}</h4>
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

                {/* Projects Section */}
                {identity.projects && identity.projects.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <Code size={20} />
                      <h3>Projects</h3>
                    </div>
                    {identity.projects.map((proj, idx) => (
                      <div key={idx} className="project-item">
                        <h4>{proj.name}</h4>
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

                {/* Skills Section */}
                {identity.skills && identity.skills.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <Sparkles size={20} />
                      <h3>Skills</h3>
                    </div>
                    <div className="tags">
                      {identity.skills.map((skill, idx) => (
                        <span key={idx} className="tag skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests Section */}
                {identity.interests && identity.interests.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <Sparkles size={20} />
                      <h3>Interests</h3>
                    </div>
                    <div className="tags">
                      {identity.interests.map((interest, idx) => (
                        <span key={idx} className="tag">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals Section */}
                {identity.goals && identity.goals.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <Target size={20} />
                      <h3>Goals</h3>
                    </div>
                    <ul className="goals-list">
                      {identity.goals.map((goal, idx) => (
                        <li key={idx}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Roles Section */}
                {identity.targetRoles && identity.targetRoles.length > 0 && (
                  <div className="profile-section">
                    <div className="section-header">
                      <Target size={20} />
                      <h3>Looking For</h3>
                    </div>
                    <div className="tags">
                      {identity.targetRoles.map((role, idx) => (
                        <span key={idx} className="tag target-tag">{role}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
