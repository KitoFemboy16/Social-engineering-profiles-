import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCharacters } from '../contexts/CharacterContext';
import {
  Character,
  Relationship,
  RelationshipType,
  RelationshipStrength,
  IntroversionExtroversion,
  AttachmentStyle,
  TrustLevel,
  SocialRole,
  CommunicationStyle,
  Vulnerability,
  MotivationFactor,
  InsecurityFactor,
  TrustTrigger
} from '../types/Character';
import BayesianInference from '../services/BayesianInference';

// Character Detail component displays comprehensive information about a character
const CharacterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    characters, 
    relationships,
    deleteCharacter,
    calculateCompatibility,
    generateRapportStrategy,
    selectCharacter,
    setUIState
  } = useCharacters();
  
  // State for UI controls
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState<boolean>(false);
  const [relatedCharacters, setRelatedCharacters] = useState<{
    character: Character;
    relationship: Relationship;
    compatibility: number;
  }[]>([]);
  const [rapportStrategies, setRapportStrategies] = useState<string[]>([]);
  const [compatibilityScores, setCompatibilityScores] = useState<{
    character: Character;
    score: number;
    rank: number;
  }[]>([]);
  
  // Refs for charts
  const vulnerabilityChartRef = useRef<HTMLCanvasElement>(null);
  const personalityRadarRef = useRef<HTMLCanvasElement>(null);
  const compatibilityChartRef = useRef<HTMLCanvasElement>(null);
  
  // Get character data
  const character = characters.find(c => c.basicInfo.id === id);
  
  // Effects
  
  // Load character data and related information
  useEffect(() => {
    if (!id || !character) {
      navigate('/');
      return;
    }
    
    // Select this character in context
    selectCharacter(id);
    
    // Find relationships involving this character
    const characterRelationships = relationships.filter(
      r => r.sourceId === id || r.targetId === id
    );
    
    // Get related characters with relationship info
    const related = characterRelationships.map(relationship => {
      const relatedId = relationship.sourceId === id ? relationship.targetId : relationship.sourceId;
      const relatedCharacter = characters.find(c => c.basicInfo.id === relatedId);
      
      if (!relatedCharacter) return null;
      
      const compatibility = calculateCompatibility(id, relatedId);
      
      return {
        character: relatedCharacter,
        relationship,
        compatibility
      };
    }).filter(Boolean) as {
      character: Character;
      relationship: Relationship;
      compatibility: number;
    }[];
    
    setRelatedCharacters(related);
    
    // Generate rapport strategies
    const strategies = generateRapportStrategy(id);
    setRapportStrategies(strategies);
    
    // Calculate compatibility with all other characters
    const allCompatibility = characters
      .filter(c => c.basicInfo.id !== id)
      .map(c => ({
        character: c,
        score: calculateCompatibility(id, c.basicInfo.id)
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    
    setCompatibilityScores(allCompatibility);
    
  }, [id, character, characters, relationships, calculateCompatibility, generateRapportStrategy, navigate, selectCharacter]);
  
  // Draw charts when data is available
  useEffect(() => {
    if (!character) return;
    
    // Draw vulnerability chart
    drawVulnerabilityChart();
    
    // Draw personality radar
    drawPersonalityRadar();
    
    // Draw compatibility chart
    drawCompatibilityChart();
    
  }, [character, compatibilityScores, activeTab]);
  
  // Handle character not found
  if (!character) {
    return (
      <div className="character-not-found">
        <h2>Character Not Found</h2>
        <p>The character you're looking for doesn't exist or has been deleted.</p>
        <Link to="/" className="btn btn-primary">Back to Characters</Link>
      </div>
    );
  }
  
  // Chart drawing functions
  
  // Draw vulnerability chart
  const drawVulnerabilityChart = () => {
    if (!vulnerabilityChartRef.current || !character.psychologicalProfile.likelyVulnerabilities.length) return;
    
    const ctx = vulnerabilityChartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, vulnerabilityChartRef.current.width, vulnerabilityChartRef.current.height);
    
    const width = vulnerabilityChartRef.current.width;
    const height = vulnerabilityChartRef.current.height;
    const barHeight = 30;
    const spacing = 15;
    const maxBarWidth = width - 200; // Leave space for labels
    
    // Sort vulnerabilities by probability
    const sortedVulnerabilities = [...character.psychologicalProfile.likelyVulnerabilities]
      .sort((a, b) => b.probability - a.probability);
    
    // Draw each vulnerability bar
    sortedVulnerabilities.forEach((vulnerability, index) => {
      const y = index * (barHeight + spacing) + 20;
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '14px var(--font-primary)';
      ctx.textAlign = 'right';
      ctx.fillText(vulnerability.type, 180, y + barHeight / 2 + 5);
      
      // Draw bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(200, y, maxBarWidth, barHeight);
      
      // Draw bar fill
      const gradient = ctx.createLinearGradient(200, 0, 200 + maxBarWidth, 0);
      gradient.addColorStop(0, 'rgba(0, 229, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 119, 255, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(200, y, maxBarWidth * vulnerability.probability, barHeight);
      
      // Draw percentage
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${Math.round(vulnerability.probability * 100)}%`,
        200 + maxBarWidth * vulnerability.probability + 10,
        y + barHeight / 2 + 5
      );
    });
  };
  
  // Draw personality radar chart
  const drawPersonalityRadar = () => {
    if (!personalityRadarRef.current) return;
    
    const ctx = personalityRadarRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, personalityRadarRef.current.width, personalityRadarRef.current.height);
    
    const width = personalityRadarRef.current.width;
    const height = personalityRadarRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 30;
    
    // Define personality traits to display
    const traits = [
      { 
        name: 'Introversion', 
        value: getIntroversionValue(character.psychologicalProfile.introversionExtroversion) 
      },
      { 
        name: 'Emotional', 
        value: character.decisionMaking.emotionVsLogic 
      },
      { 
        name: 'Trust', 
        value: getTrustValue(character.psychologicalProfile.trustLevel) 
      },
      { 
        name: 'Approval Need', 
        value: character.socialHierarchyPosition.approvalDependency 
      },
      { 
        name: 'Influence', 
        value: character.socialHierarchyPosition.influence 
      },
      { 
        name: 'Disclosure', 
        value: character.communication.disclosureDepth || 0.5 
      }
    ];
    
    const sides = traits.length;
    const angleStep = (Math.PI * 2) / sides;
    
    // Draw axis lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.stroke();
    }
    
    // Draw concentric circles
    const circles = 4;
    for (let i = 1; i <= circles; i++) {
      const circleRadius = (radius * i) / circles;
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw trait labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px var(--font-primary)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + (radius + 20) * Math.cos(angle);
      const y = centerY + (radius + 20) * Math.sin(angle);
      
      ctx.fillText(traits[i].name, x, y);
    }
    
    // Draw data points and connect them
    ctx.beginPath();
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = traits[i].value;
      const pointRadius = radius * value;
      
      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Close the path
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 119, 255, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Stroke the outline
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw data points
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = traits[i].value;
      const pointRadius = radius * value;
      
      const x = centerX + pointRadius * Math.cos(angle);
      const y = centerY + pointRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };
  
  // Draw compatibility chart
  const drawCompatibilityChart = () => {
    if (!compatibilityChartRef.current || compatibilityScores.length === 0) return;
    
    const ctx = compatibilityChartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, compatibilityChartRef.current.width, compatibilityChartRef.current.height);
    
    const width = compatibilityChartRef.current.width;
    const height = compatibilityChartRef.current.height;
    const barHeight = 30;
    const spacing = 15;
    const maxBarWidth = width - 200; // Leave space for labels
    
    // Limit to top 5 compatibility scores
    const topScores = compatibilityScores.slice(0, 5);
    
    // Draw each compatibility bar
    topScores.forEach((item, index) => {
      const y = index * (barHeight + spacing) + 20;
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '14px var(--font-primary)';
      ctx.textAlign = 'right';
      ctx.fillText(
        item.character.basicInfo.name || item.character.basicInfo.alias || 'Unknown',
        180,
        y + barHeight / 2 + 5
      );
      
      // Draw bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(200, y, maxBarWidth, barHeight);
      
      // Draw bar fill with color based on compatibility
      const gradient = ctx.createLinearGradient(200, 0, 200 + maxBarWidth, 0);
      
      if (item.score >= 0.8) {
        gradient.addColorStop(0, 'rgba(0, 255, 157, 0.7)'); // High compatibility - green
        gradient.addColorStop(1, 'rgba(0, 255, 157, 0.3)');
      } else if (item.score >= 0.6) {
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.7)'); // Good compatibility - blue
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0.3)');
      } else if (item.score >= 0.4) {
        gradient.addColorStop(0, 'rgba(255, 204, 0, 0.7)'); // Moderate compatibility - yellow
        gradient.addColorStop(1, 'rgba(255, 204, 0, 0.3)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 45, 85, 0.7)'); // Low compatibility - red
        gradient.addColorStop(1, 'rgba(255, 45, 85, 0.3)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(200, y, maxBarWidth * item.score, barHeight);
      
      // Draw percentage
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${Math.round(item.score * 100)}%`,
        200 + maxBarWidth * item.score + 10,
        y + barHeight / 2 + 5
      );
    });
  };
  
  // Helper functions
  
  // Get introversion value (0-1) from enum
  const getIntroversionValue = (ie: IntroversionExtroversion): number => {
    switch (ie) {
      case IntroversionExtroversion.HIGHLY_INTROVERTED:
        return 0.9;
      case IntroversionExtroversion.INTROVERTED:
        return 0.7;
      case IntroversionExtroversion.AMBIVERT:
        return 0.5;
      case IntroversionExtroversion.EXTROVERTED:
        return 0.3;
      case IntroversionExtroversion.HIGHLY_EXTROVERTED:
        return 0.1;
      default:
        return 0.5;
    }
  };
  
  // Get trust value (0-1) from enum
  const getTrustValue = (trust: TrustLevel): number => {
    switch (trust) {
      case TrustLevel.HIGHLY_SKEPTICAL:
        return 0.1;
      case TrustLevel.SKEPTICAL:
        return 0.3;
      case TrustLevel.NEUTRAL:
        return 0.5;
      case TrustLevel.TRUSTING:
        return 0.7;
      case TrustLevel.HIGHLY_TRUSTING:
        return 0.9;
      default:
        return 0.5;
    }
  };
  
  // Get color for attachment style
  const getAttachmentStyleColor = (style: AttachmentStyle): string => {
    switch (style) {
      case AttachmentStyle.SECURE:
        return 'var(--success)';
      case AttachmentStyle.ANXIOUS:
        return 'var(--warning)';
      case AttachmentStyle.AVOIDANT:
        return 'var(--accent-secondary)';
      case AttachmentStyle.FEARFUL_AVOIDANT:
        return 'var(--danger)';
      default:
        return 'var(--text-secondary)';
    }
  };
  
  // Get color for relationship type
  const getRelationshipColor = (type: RelationshipType): string => {
    switch (type) {
      case RelationshipType.FAMILY:
        return 'var(--success)';
      case RelationshipType.FRIEND:
        return 'var(--accent-primary)';
      case RelationshipType.ROMANTIC:
        return 'var(--accent-tertiary)';
      case RelationshipType.PROFESSIONAL:
        return 'var(--warning)';
      case RelationshipType.RIVAL:
        return 'var(--danger)';
      case RelationshipType.MENTOR:
      case RelationshipType.MENTEE:
        return 'var(--accent-secondary)';
      default:
        return 'var(--text-secondary)';
    }
  };
  
  // Get icon for communication style
  const getCommunicationIcon = (style: CommunicationStyle): string => {
    switch (style) {
      case CommunicationStyle.DIRECT:
        return '→';
      case CommunicationStyle.INDIRECT:
        return '↝';
      case CommunicationStyle.RESERVED:
        return '⊝';
      case CommunicationStyle.ANALYTICAL:
        return '⊡';
      case CommunicationStyle.EMOTIONAL:
        return '♡';
      case CommunicationStyle.FUNCTIONAL:
        return '⚙';
      case CommunicationStyle.PERSONAL:
        return '☺';
      case CommunicationStyle.INTUITIVE:
        return '✧';
      default:
        return '?';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: Date | string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: Date | string | undefined): string => {
    if (!dateOfBirth) return 'Unknown';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };
  
  // Handle character deletion
  const handleDeleteCharacter = () => {
    if (!character) return;
    
    deleteCharacter(character.basicInfo.id);
    navigate('/');
    
    setUIState({
      notification: {
        show: true,
        message: `Character ${character.basicInfo.name || character.basicInfo.alias || 'Unknown'} deleted`,
        type: 'info'
      }
    });
  };
  
  // Render delete confirmation modal
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Confirm Deletion</h3>
          <p>
            Are you sure you want to delete {character.basicInfo.name || character.basicInfo.alias || 'this character'}?
            This action cannot be undone.
          </p>
          
          <div className="modal-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            
            <button 
              className="btn btn-danger"
              onClick={handleDeleteCharacter}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render character header
  const renderHeader = () => {
    return (
      <div className="character-header">
        <div className="character-identity">
          {character.basicInfo.imageUrl ? (
            <img 
              src={character.basicInfo.imageUrl} 
              alt={character.basicInfo.name || character.basicInfo.alias || 'Character'} 
              className="character-avatar"
            />
          ) : (
            <div className="character-avatar-placeholder">
              {(character.basicInfo.name || character.basicInfo.alias || '?').charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="character-name-info">
            <h1 className="character-name">
              {character.basicInfo.name || character.basicInfo.alias || 'Unknown Character'}
            </h1>
            
            {character.basicInfo.alias && character.basicInfo.name && (
              <div className="character-alias">
                Alias: {character.basicInfo.alias}
              </div>
            )}
            
            <div className="character-meta">
              {character.basicInfo.dateOfBirth && (
                <span className="character-age">
                  Age: {calculateAge(character.basicInfo.dateOfBirth)}
                </span>
              )}
              
              {character.basicInfo.country && (
                <span className="character-location">
                  {character.basicInfo.city ? `${character.basicInfo.city}, ` : ''}
                  {character.basicInfo.country}
                </span>
              )}
              
              <span className="character-created">
                Created: {formatDate(character.basicInfo.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="character-actions">
          <Link 
            to={`/edit/${character.basicInfo.id}`}
            className="btn btn-primary"
          >
            Edit Profile
          </Link>
          
          <button 
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };
  
  // Render tab navigation
  const renderTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'psychological', label: 'Psychological Profile' },
      { id: 'communication', label: 'Communication' },
      { id: 'social', label: 'Social Positioning' },
      { id: 'relationships', label: 'Relationships' },
      { id: 'compatibility', label: 'Compatibility' },
      { id: 'rapport', label: 'Rapport Strategies' }
    ];
    
    return (
      <div className="character-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };
  
  // Render overview tab
  const renderOverviewTab = () => {
    return (
      <div className="tab-content overview-tab">
        <div className="overview-grid">
          <div className="overview-card personality-card">
            <h3>Personality Snapshot</h3>
            <div className="personality-traits">
              <div className="personality-trait">
                <span className="trait-label">Introversion/Extroversion:</span>
                <span 
                  className="trait-value"
                  style={{ color: character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.HIGHLY_INTROVERTED || 
                    character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.INTROVERTED ? 
                    'var(--accent-tertiary)' : 'var(--warning)' 
                  }}
                >
                  {character.psychologicalProfile.introversionExtroversion}
                </span>
              </div>
              
              <div className="personality-trait">
                <span className="trait-label">Attachment Style:</span>
                <span 
                  className="trait-value"
                  style={{ color: getAttachmentStyleColor(character.psychologicalProfile.attachmentStyle) }}
                >
                  {character.psychologicalProfile.attachmentStyle}
                </span>
              </div>
              
              <div className="personality-trait">
                <span className="trait-label">Trust Level:</span>
                <span className="trait-value">
                  {character.psychologicalProfile.trustLevel}
                </span>
              </div>
              
              <div className="personality-trait">
                <span className="trait-label">Social Role:</span>
                <span className="trait-value">
                  {character.socialHierarchyPosition.role}
                </span>
              </div>
              
              <div className="personality-trait">
                <span className="trait-label">Communication Style:</span>
                <span className="trait-value">
                  {getCommunicationIcon(character.communication.primaryStyle)} {character.communication.primaryStyle}
                </span>
              </div>
              
              <div className="personality-trait">
                <span className="trait-label">Decision Making:</span>
                <span className="trait-value">
                  {character.decisionMaking.emotionVsLogic > 0.7 ? 'Highly Emotional' : 
                    character.decisionMaking.emotionVsLogic > 0.5 ? 'Somewhat Emotional' :
                    character.decisionMaking.emotionVsLogic < 0.3 ? 'Highly Logical' :
                    character.decisionMaking.emotionVsLogic < 0.5 ? 'Somewhat Logical' :
                    'Balanced'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="overview-card vulnerabilities-card">
            <h3>Key Vulnerabilities</h3>
            {character.psychologicalProfile.likelyVulnerabilities.length > 0 ? (
              <div className="vulnerabilities-list">
                {character.psychologicalProfile.likelyVulnerabilities.slice(0, 3).map((vulnerability, index) => (
                  <div key={index} className="vulnerability-item">
                    <div className="vulnerability-name">{vulnerability.type}</div>
                    <div className="vulnerability-bar-container">
                      <div 
                        className="vulnerability-bar-fill" 
                        style={{ width: `${vulnerability.probability * 100}%` }}
                      ></div>
                    </div>
                    <div className="vulnerability-probability">
                      {Math.round(vulnerability.probability * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No vulnerabilities identified</div>
            )}
          </div>
          
          <div className="overview-card motivations-card">
            <h3>Core Motivations</h3>
            {character.motivationsInsecurities.desires.length > 0 ? (
              <div className="motivations-list">
                {character.motivationsInsecurities.desires.slice(0, 3).map((desire, index) => (
                  <div key={index} className="motivation-item">
                    <div className="motivation-name">{desire.type}</div>
                    <div className="motivation-strength">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`strength-dot ${i < Math.round(desire.strength * 5) ? 'active' : ''}`}
                        ></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No motivations identified</div>
            )}
          </div>
          
          <div className="overview-card fears-card">
            <h3>Core Fears</h3>
            {character.motivationsInsecurities.fears.length > 0 ? (
              <div className="fears-list">
                {character.motivationsInsecurities.fears.slice(0, 3).map((fear, index) => (
                  <div key={index} className="fear-item">
                    <div className="fear-name">{fear.type}</div>
                    <div className="fear-strength">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`strength-dot ${i < Math.round(fear.strength * 5) ? 'active' : ''}`}
                        ></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No fears identified</div>
            )}
          </div>
          
          <div className="overview-card relationships-card">
            <h3>Key Relationships</h3>
            {relatedCharacters.length > 0 ? (
              <div className="relationships-preview">
                {relatedCharacters.slice(0, 3).map((relation, index) => (
                  <Link 
                    key={index}
                    to={`/character/${relation.character.basicInfo.id}`}
                    className="relationship-preview-item"
                  >
                    <div 
                      className="relationship-type-indicator"
                      style={{ backgroundColor: getRelationshipColor(relation.relationship.type) }}
                    ></div>
                    <div className="relationship-name">
                      {relation.character.basicInfo.name || relation.character.basicInfo.alias || 'Unknown'}
                    </div>
                    <div className="relationship-type">
                      {relation.relationship.type}
                    </div>
                  </Link>
                ))}
                
                {relatedCharacters.length > 3 && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('relationships')}
                  >
                    View All ({relatedCharacters.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="no-data">
                <p>No relationships defined</p>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRelationshipModal(true)}
                >
                  Add Relationship
                </button>
              </div>
            )}
          </div>
          
          <div className="overview-card rapport-card">
            <h3>Rapport Building</h3>
            {rapportStrategies.length > 0 ? (
              <div className="rapport-strategies-preview">
                <ul className="strategies-list">
                  {rapportStrategies.slice(0, 3).map((strategy, index) => (
                    <li key={index} className="strategy-item">
                      {strategy}
                    </li>
                  ))}
                </ul>
                
                {rapportStrategies.length > 3 && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('rapport')}
                  >
                    View All Strategies
                  </button>
                )}
              </div>
            ) : (
              <div className="no-data">No rapport strategies available</div>
            )}
          </div>
        </div>
        
        <div className="personality-radar-container">
          <h3>Personality Profile</h3>
          <canvas 
            ref={personalityRadarRef} 
            width={400} 
            height={400} 
            className="personality-radar"
          ></canvas>
        </div>
      </div>
    );
  };
  
  // Render psychological profile tab
  const renderPsychologicalTab = () => {
    return (
      <div className="tab-content psychological-tab">
        <div className="section-grid">
          <div className="profile-section">
            <h3>Psychological Core</h3>
            <div className="profile-traits">
              <div className="profile-trait">
                <span className="trait-label">Introversion/Extroversion:</span>
                <span 
                  className="trait-value"
                  style={{ color: character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.HIGHLY_INTROVERTED || 
                    character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.INTROVERTED ? 
                    'var(--accent-tertiary)' : 'var(--warning)' 
                  }}
                >
                  {character.psychologicalProfile.introversionExtroversion}
                </span>
              </div>
              
              <div className="profile-trait">
                <span className="trait-label">Attachment Style:</span>
                <span 
                  className="trait-value"
                  style={{ color: getAttachmentStyleColor(character.psychologicalProfile.attachmentStyle) }}
                >
                  {character.psychologicalProfile.attachmentStyle}
                </span>
                <div className="trait-description">
                  {character.psychologicalProfile.attachmentStyle === AttachmentStyle.SECURE && 
                    "Comfortable with intimacy and independence. Forms healthy bonds."
                  }
                  {character.psychologicalProfile.attachmentStyle === AttachmentStyle.ANXIOUS && 
                    "Fears abandonment and seeks reassurance. Needs consistent validation."
                  }
                  {character.psychologicalProfile.attachmentStyle === AttachmentStyle.AVOIDANT && 
                    "Values independence over intimacy. May withdraw when feeling too close."
                  }
                  {character.psychologicalProfile.attachmentStyle === AttachmentStyle.FEARFUL_AVOIDANT && 
                    "Desires closeness but fears getting hurt. Shows contradictory behaviors."
                  }
                </div>
              </div>
              
              <div className="profile-trait">
                <span className="trait-label">Trust Level:</span>
                <span className="trait-value">
                  {character.psychologicalProfile.trustLevel}
                </span>
                <div className="trait-description">
                  {character.psychologicalProfile.trustLevel === TrustLevel.HIGHLY_SKEPTICAL && 
                    "Extremely cautious about trusting others. Requires substantial proof of trustworthiness."
                  }
                  {character.psychologicalProfile.trustLevel === TrustLevel.SKEPTICAL && 
                    "Generally cautious about trusting others. Takes time to build trust."
                  }
                  {character.psychologicalProfile.trustLevel === TrustLevel.NEUTRAL && 
                    "Balanced approach to trust. Neither overly trusting nor skeptical."
                  }
                  {character.psychologicalProfile.trustLevel === TrustLevel.TRUSTING && 
                    "Generally willing to trust others. Gives benefit of the doubt."
                  }
                  {character.psychologicalProfile.trustLevel === TrustLevel.HIGHLY_TRUSTING && 
                    "Very open to trusting others. May be vulnerable to manipulation."
                  }
                </div>
              </div>
              
              <div className="profile-trait">
                <span className="trait-label">Self-Disclosure Level:</span>
                <div className="trait-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${(character.psychologicalProfile.selfDisclosureLevel || 0.5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Very Private</span>
                    <span>Very Open</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-trait">
                <span className="trait-label">Confidence Level:</span>
                <div className="trait-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${(character.psychologicalProfile.confidenceLevel || 0.5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Insecure</span>
                    <span>Very Confident</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Vulnerabilities</h3>
            <div className="vulnerabilities-chart-container">
              <canvas 
                ref={vulnerabilityChartRef} 
                width={600} 
                height={300} 
                className="vulnerabilities-chart"
              ></canvas>
            </div>
            
            {character.psychologicalProfile.mirroringStrategy && (
              <div className="mirroring-strategy">
                <h4>Mirroring Strategy</h4>
                <p>{character.psychologicalProfile.mirroringStrategy}</p>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h3>Motivations & Insecurities</h3>
            <div className="motivations-insecurities-grid">
              <div className="motivations-column">
                <h4>Desires</h4>
                {character.motivationsInsecurities.desires.length > 0 ? (
                  <div className="motivations-list">
                    {character.motivationsInsecurities.desires.map((desire, index) => (
                      <div key={index} className="motivation-item">
                        <div className="motivation-name">{desire.type}</div>
                        <div className="motivation-bar-container">
                          <div 
                            className="motivation-bar-fill" 
                            style={{ width: `${desire.strength * 100}%` }}
                          ></div>
                        </div>
                        <div className="motivation-strength">
                          {Math.round(desire.strength * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No desires identified</div>
                )}
                
                {character.motivationsInsecurities.primaryMotivation && (
                  <div className="primary-motivation">
                    <h5>Primary Motivation</h5>
                    <p>{character.motivationsInsecurities.primaryMotivation}</p>
                  </div>
                )}
                
                {character.motivationsInsecurities.secondaryMotivation && (
                  <div className="secondary-motivation">
                    <h5>Secondary Motivation</h5>
                    <p>{character.motivationsInsecurities.secondaryMotivation}</p>
                  </div>
                )}
                
                {character.motivationsInsecurities.hiddenMotivation && (
                  <div className="hidden-motivation">
                    <h5>Hidden Motivation</h5>
                    <p>{character.motivationsInsecurities.hiddenMotivation}</p>
                  </div>
                )}
              </div>
              
              <div className="insecurities-column">
                <h4>Fears</h4>
                {character.motivationsInsecurities.fears.length > 0 ? (
                  <div className="fears-list">
                    {character.motivationsInsecurities.fears.map((fear, index) => (
                      <div key={index} className="fear-item">
                        <div className="fear-name">{fear.type}</div>
                        <div className="fear-bar-container">
                          <div 
                            className="fear-bar-fill" 
                            style={{ width: `${fear.strength * 100}%` }}
                          ></div>
                        </div>
                        <div className="fear-strength">
                          {Math.round(fear.strength * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No fears identified</div>
                )}
                
                {character.motivationsInsecurities.coreInsecurity && (
                  <div className="core-insecurity">
                    <h5>Core Insecurity</h5>
                    <p>{character.motivationsInsecurities.coreInsecurity}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Trust Signals & Vulnerability Markers</h3>
            <div className="trust-signals-grid">
              <div className="trust-triggers-column">
                <h4>Trust Triggers</h4>
                {character.trustSignalsVulnerabilityMarkers.triggers.length > 0 ? (
                  <div className="trust-triggers-list">
                    {character.trustSignalsVulnerabilityMarkers.triggers.map((trigger, index) => (
                      <div key={index} className="trust-trigger-item">
                        <div className="trust-trigger-name">{trigger.type}</div>
                        <div className="trust-trigger-bar-container">
                          <div 
                            className="trust-trigger-bar-fill" 
                            style={{ width: `${trigger.effectiveness * 100}%` }}
                          ></div>
                        </div>
                        <div className="trust-trigger-effectiveness">
                          {Math.round(trigger.effectiveness * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No trust triggers identified</div>
                )}
              </div>
              
              <div className="vulnerability-markers-column">
                <h4>Vulnerability Indicators</h4>
                
                {character.trustSignalsVulnerabilityMarkers.strategy && (
                  <div className="trust-building-strategy">
                    <h5>Trust Building Strategy</h5>
                    <p>{character.trustSignalsVulnerabilityMarkers.strategy}</p>
                  </div>
                )}
                
                <div className="vulnerability-metrics">
                  {character.trustSignalsVulnerabilityMarkers.vulnerabilityDisplayFrequency !== undefined && (
                    <div className="vulnerability-metric">
                      <span className="metric-label">Vulnerability Display:</span>
                      <div className="metric-slider">
                        <div className="slider-track">
                          <div 
                            className="slider-fill" 
                            style={{ width: `${character.trustSignalsVulnerabilityMarkers.vulnerabilityDisplayFrequency * 100}%` }}
                          ></div>
                        </div>
                        <div className="slider-labels">
                          <span>Rarely</span>
                          <span>Often</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {character.trustSignalsVulnerabilityMarkers.trustBuildingSpeed !== undefined && (
                    <div className="vulnerability-metric">
                      <span className="metric-label">Trust Building Speed:</span>
                      <div className="metric-slider">
                        <div className="slider-track">
                          <div 
                            className="slider-fill" 
                            style={{ width: `${character.trustSignalsVulnerabilityMarkers.trustBuildingSpeed * 100}%` }}
                          ></div>
                        </div>
                        <div className="slider-labels">
                          <span>Very Slow</span>
                          <span>Very Fast</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {character.trustSignalsVulnerabilityMarkers.boundaryStrength !== undefined && (
                    <div className="vulnerability-metric">
                      <span className="metric-label">Boundary Strength:</span>
                      <div className="metric-slider">
                        <div className="slider-track">
                          <div 
                            className="slider-fill" 
                            style={{ width: `${character.trustSignalsVulnerabilityMarkers.boundaryStrength * 100}%` }}
                          ></div>
                        </div>
                        <div className="slider-labels">
                          <span>Weak</span>
                          <span>Strong</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {character.trustSignalsVulnerabilityMarkers.traumaResponsePatterns && 
                 character.trustSignalsVulnerabilityMarkers.traumaResponsePatterns.length > 0 && (
                  <div className="trauma-responses">
                    <h5>Trauma Response Patterns</h5>
                    <div className="trauma-response-tags">
                      {character.trustSignalsVulnerabilityMarkers.traumaResponsePatterns.map((response, index) => (
                        <span key={index} className="trauma-response-tag">
                          {response}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render communication tab
  const renderCommunicationTab = () => {
    return (
      <div className="tab-content communication-tab">
        <div className="section-grid">
          <div className="profile-section">
            <h3>Communication Style</h3>
            <div className="communication-style-container">
              <div className="primary-communication-style">
                <div className="style-icon" style={{ fontSize: '2rem' }}>
                  {getCommunicationIcon(character.communication.primaryStyle)}
                </div>
                <div className="style-name">
                  {character.communication.primaryStyle}
                </div>
                <div className="style-description">
                  {character.communication.primaryStyle === CommunicationStyle.DIRECT && 
                    "Straightforward and clear. Says what they mean without ambiguity."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.INDIRECT && 
                    "Hints and suggests rather than stating directly. May use subtlety and implication."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.RESERVED && 
                    "Speaks less, observes more. Careful about sharing thoughts and feelings."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.ANALYTICAL && 
                    "Focuses on facts and logic. Prefers structured, rational discussion."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.EMOTIONAL && 
                    "Emphasizes feelings and personal experiences. Expressive and passionate."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.FUNCTIONAL && 
                    "Practical and solution-oriented. Focuses on what works rather than theory."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.PERSONAL && 
                    "Relationship-focused. Emphasizes connection and shared experiences."
                  }
                  {character.communication.primaryStyle === CommunicationStyle.INTUITIVE && 
                    "Follows hunches and impressions. May jump between topics based on intuitive connections."
                  }
                </div>
              </div>
              
              {character.communication.secondaryStyle && (
                <div className="secondary-communication-style">
                  <h4>Secondary Style</h4>
                  <div className="style-icon" style={{ fontSize: '1.5rem' }}>
                    {getCommunicationIcon(character.communication.secondaryStyle)}
                  </div>
                  <div className="style-name">
                    {character.communication.secondaryStyle}
                  </div>
                </div>
              )}
            </div>
            
            <div className="communication-channels">
              <h4>Preferred Channels</h4>
              <div className="channel-tags">
                {character.communication.preferredChannels.map((channel, index) => (
                  <span key={index} className="channel-tag">
                    {channel}
                  </span>
                ))}
              </div>
            </div>
            
            {character.communication.preferredInput && (
              <div className="preferred-input">
                <h4>Preferred Input Style</h4>
                <p>{character.communication.preferredInput}</p>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h3>Communication Metrics</h3>
            <div className="communication-metrics">
              {character.communication.braggingLikelihood !== undefined && (
                <div className="communication-metric">
                  <span className="metric-label">Bragging Likelihood:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.communication.braggingLikelihood * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Rarely Brags</span>
                      <span>Often Brags</span>
                    </div>
                  </div>
                </div>
              )}
              
              {character.communication.disclosureDepth !== undefined && (
                <div className="communication-metric">
                  <span className="metric-label">Disclosure Depth:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.communication.disclosureDepth * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Surface Level</span>
                      <span>Deep Disclosure</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {character.communication.conflictStyle && (
              <div className="conflict-style">
                <h4>Conflict Communication Style</h4>
                <p>{character.communication.conflictStyle}</p>
              </div>
            )}
            
            {character.communication.humorStyle && (
              <div className="humor-style">
                <h4>Humor Style</h4>
                <p>{character.communication.humorStyle}</p>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h3>Decision-Making Style</h3>
            <div className="decision-making-container">
              <div className="emotion-logic-spectrum">
                <h4>Emotion vs Logic</h4>
                <div className="spectrum-container">
                  <div className="spectrum-track">
                    <div 
                      className="spectrum-marker"
                      style={{ left: `${character.decisionMaking.emotionVsLogic * 100}%` }}
                    ></div>
                  </div>
                  <div className="spectrum-labels">
                    <span>Purely Logical</span>
                    <span>Balanced</span>
                    <span>Purely Emotional</span>
                  </div>
                </div>
                <div className="spectrum-description">
                  {character.decisionMaking.emotionVsLogic > 0.8 && 
                    "Decisions are heavily influenced by emotions and feelings. Logic takes a back seat."
                  }
                  {character.decisionMaking.emotionVsLogic > 0.6 && character.decisionMaking.emotionVsLogic <= 0.8 && 
                    "Emotions tend to guide decisions more than logic, but some rational consideration occurs."
                  }
                  {character.decisionMaking.emotionVsLogic >= 0.4 && character.decisionMaking.emotionVsLogic <= 0.6 && 
                    "Balances emotional and logical considerations when making decisions."
                  }
                  {character.decisionMaking.emotionVsLogic >= 0.2 && character.decisionMaking.emotionVsLogic < 0.4 && 
                    "Logic tends to guide decisions more than emotions, but feelings are still considered."
                  }
                  {character.decisionMaking.emotionVsLogic < 0.2 && 
                    "Decisions are heavily based on logical analysis with little emotional influence."
                  }
                </div>
              </div>
              
              <div className="decision-pacing">
                <h4>Decision Pacing</h4>
                <div className="pacing-value">{character.decisionMaking.pacing}</div>
                <div className="pacing-description">
                  {character.decisionMaking.pacing === 'Very slow' && 
                    "Takes extensive time to consider all options before deciding. May struggle with decision paralysis."
                  }
                  {character.decisionMaking.pacing === 'Slow' && 
                    "Deliberate and careful when making decisions. Prefers to have ample time to consider options."
                  }
                  {character.decisionMaking.pacing === 'Moderate' && 
                    "Balanced approach to decision-making. Neither rushed nor overly deliberate."
                  }
                  {character.decisionMaking.pacing === 'Fast' && 
                    "Makes decisions quickly and efficiently. Comfortable with limited information."
                  }
                  {character.decisionMaking.pacing === 'Very fast' && 
                    "Highly decisive and quick to act. May sometimes act before fully considering consequences."
                  }
                </div>
              </div>
              
              {character.decisionMaking.bestPersuasionTactic && (
                <div className="persuasion-tactic">
                  <h4>Best Persuasion Tactic</h4>
                  <p>{character.decisionMaking.bestPersuasionTactic}</p>
                </div>
              )}
            </div>
            
            <div className="decision-metrics">
              {character.decisionMaking.riskTolerance !== undefined && (
                <div className="decision-metric">
                  <span className="metric-label">Risk Tolerance:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.decisionMaking.riskTolerance * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Risk Averse</span>
                      <span>Risk Seeking</span>
                    </div>
                  </div>
                </div>
              )}
              
              {character.decisionMaking.impulsivity !== undefined && (
                <div className="decision-metric">
                  <span className="metric-label">Impulsivity:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.decisionMaking.impulsivity * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Deliberate</span>
                      <span>Impulsive</span>
                    </div>
                  </div>
                </div>
              )}
              
              {character.decisionMaking.groupInfluence !== undefined && (
                <div className="decision-metric">
                  <span className="metric-label">Group Influence:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.decisionMaking.groupInfluence * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Independent</span>
                      <span>Group-Influenced</span>
                    </div>
                  </div>
                </div>
              )}
              
              {character.decisionMaking.decisionConfidence !== undefined && (
                <div className="decision-metric">
                  <span className="metric-label">Decision Confidence:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.decisionMaking.decisionConfidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Self-Doubting</span>
                      <span>Very Confident</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render social positioning tab
  const renderSocialTab = () => {
    return (
      <div className="tab-content social-tab">
        <div className="section-grid">
          <div className="profile-section">
            <h3>Social Hierarchy Position</h3>
            <div className="social-role-container">
              <div className="social-role">
                <div className="role-badge" style={{ 
                  backgroundColor: 
                    character.socialHierarchyPosition.role === SocialRole.LEADER ? 'var(--accent-tertiary)' :
                    character.socialHierarchyPosition.role === SocialRole.FOLLOWER ? 'var(--accent-secondary)' :
                    character.socialHierarchyPosition.role === SocialRole.CONNECTOR ? 'var(--success)' :
                    character.socialHierarchyPosition.role === SocialRole.OUTLIER ? 'var(--warning)' :
                    character.socialHierarchyPosition.role === SocialRole.GATEKEEPER ? 'var(--accent-primary)' :
                    character.socialHierarchyPosition.role === SocialRole.MEDIATOR ? 'var(--accent-primary)' :
                    'var(--text-secondary)'
                }}>
                  {character.socialHierarchyPosition.role.charAt(0)}
                </div>
                <div className="role-name">
                  {character.socialHierarchyPosition.role}
                </div>
                <div className="role-description">
                  {character.socialHierarchyPosition.role === SocialRole.LEADER && 
                    "Takes charge and directs others. Often the decision-maker in groups."
                  }
                  {character.socialHierarchyPosition.role === SocialRole.FOLLOWER && 
                    "Comfortable with others taking the lead. Supportive and collaborative."
                  }
                  {character.socialHierarchyPosition.role === SocialRole.CONNECTOR && 
                    "Links different social circles. Facilitates introductions and connections."
                  }
                  {character.socialHierarchyPosition.role === SocialRole.OUTLIER && 
                    "Operates outside typical social structures. Independent and unconventional."
                  }
                  {character.socialHierarchyPosition.role === SocialRole.GATEKEEPER && 
                    "Controls access to resources or social groups. Influential through selective inclusion."
                  }
                  {character.socialHierarchyPosition.role === SocialRole.MEDIATOR && 
                    "Resolves conflicts and facilitates understanding between different parties."
                  }
                </div>
              </div>
              
              {character.socialHierarchyPosition.groupStatus && (
                <div className="group-status">
                  <h4>Group Status</h4>
                  <p>{character.socialHierarchyPosition.groupStatus}</p>
                </div>
              )}
            </div>
            
            {character.socialHierarchyPosition.bestTactic && (
              <div className="approach-tactic">
                <h4>Best Approach Tactic</h4>
                <p>{character.socialHierarchyPosition.bestTactic}</p>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h3>Social Metrics</h3>
            <div className="social-metrics">
              <div className="social-metric">
                <span className="metric-label">Social Influence:</span>
                <div className="metric-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${character.socialHierarchyPosition.influence * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Low Influence</span>
                    <span>High Influence</span>
                  </div>
                </div>
              </div>
              
              <div className="social-metric">
                <span className="metric-label">Approval Dependency:</span>
                <div className="metric-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${character.socialHierarchyPosition.approvalDependency * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Independent</span>
                    <span>Approval-Seeking</span>
                  </div>
                </div>
              </div>
              
              {character.socialHierarchyPosition.dominanceLevel !== undefined && (
                <div className="social-metric">
                  <span className="metric-label">Dominance Level:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.socialHierarchyPosition.dominanceLevel * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Submissive</span>
                      <span>Dominant</span>
                    </div>
                  </div>
                </div>
              )}
              
              {character.socialHierarchyPosition.socialCapital !== undefined && (
                <div className="social-metric">
                  <span className="metric-label">Social Capital:</span>
                  <div className="metric-slider">
                    <div className="slider-track">
                      <div 
                        className="slider-fill" 
                        style={{ width: `${character.socialHierarchyPosition.socialCapital * 100}%` }}
                      ></div>
                    </div>
                    <div className="slider-labels">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Identity Anchors</h3>
            {character.identityAnchors.coreAnchors.length > 0 ? (
              <div className="identity-anchors-list">
                {character.identityAnchors.coreAnchors.map((anchor, index) => (
                  <div key={index} className="identity-anchor-item">
                    <div className="anchor-name">{anchor.type}</div>
                    <div className="anchor-metrics">
                      <div className="anchor-metric">
                        <span className="metric-label">Centrality:</span>
                        <div className="metric-slider">
                          <div className="slider-track">
                            <div 
                              className="slider-fill" 
                              style={{ width: `${anchor.centrality * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="anchor-metric">
                        <span className="metric-label">Visibility:</span>
                        <div className="metric-slider">
                          <div className="slider-track">
                            <div 
                              className="slider-fill" 
                              style={{ width: `${anchor.visibility * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No identity anchors identified</div>
            )}
            
            {character.identityAnchors.aspirationalIdentities && 
             character.identityAnchors.aspirationalIdentities.length > 0 && (
              <div className="aspirational-identities">
                <h4>Aspirational Identities</h4>
                <div className="identity-tags">
                  {character.identityAnchors.aspirationalIdentities.map((identity, index) => (
                    <span key={index} className="identity-tag">
                      {identity.type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {character.identityAnchors.rejectedIdentities && 
             character.identityAnchors.rejectedIdentities.length > 0 && (
              <div className="rejected-identities">
                <h4>Rejected Identities</h4>
                <div className="identity-tags">
                  {character.identityAnchors.rejectedIdentities.map((identity, index) => (
                    <span key={index} className="identity-tag rejected">
                      {identity.type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {character.identityAnchors.identityFlexibility !== undefined && (
              <div className="identity-metric">
                <span className="metric-label">Identity Flexibility:</span>
                <div className="metric-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${character.identityAnchors.identityFlexibility * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Rigid</span>
                    <span>Flexible</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h3>Loyalty Network</h3>
            {character.loyaltyNetwork.primaryLoyalties.length > 0 ? (
              <div className="loyalty-list">
                {character.loyaltyNetwork.primaryLoyalties.map((loyalty, index) => (
                  <div key={index} className="loyalty-item">
                    <div className="loyalty-entity">{loyalty.entity}</div>
                    <div className="loyalty-type">{loyalty.type}</div>
                    <div className="loyalty-bar-container">
                      <div 
                        className="loyalty-bar-fill" 
                        style={{ width: `${loyalty.strength * 100}%` }}
                      ></div>
                    </div>
                    <div className="loyalty-strength">
                      {Math.round(loyalty.strength * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No loyalties identified</div>
            )}
            
            {character.loyaltyNetwork.conflictingLoyalties && 
             character.loyaltyNetwork.conflictingLoyalties.length > 0 && (
              <div className="conflicting-loyalties">
                <h4>Conflicting Loyalties</h4>
                <div className="loyalty-list">
                  {character.loyaltyNetwork.conflictingLoyalties.map((loyalty, index) => (
                    <div key={index} className="loyalty-item conflicting">
                      <div className="loyalty-entity">{loyalty.entity}</div>
                      <div className="loyalty-type">{loyalty.type}</div>
                      <div className="loyalty-bar-container">
                        <div 
                          className="loyalty-bar-fill" 
                          style={{ width: `${loyalty.strength * 100}%` }}
                        ></div>
                      </div>
                      <div className="loyalty-strength">
                        {Math.round(loyalty.strength * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {character.loyaltyNetwork.loyaltyThreshold !== undefined && (
              <div className="loyalty-metric">
                <span className="metric-label">Loyalty Threshold:</span>
                <div className="metric-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${character.loyaltyNetwork.loyaltyThreshold * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Easy to Gain</span>
                    <span>Hard to Gain</span>
                  </div>
                </div>
              </div>
            )}
            
            {character.loyaltyNetwork.betrayalSensitivity !== undefined && (
              <div className="loyalty-metric">
                <span className="metric-label">Betrayal Sensitivity:</span>
                <div className="metric-slider">
                  <div className="slider-track">
                    <div 
                      className="slider-fill" 
                      style={{ width: `${character.loyaltyNetwork.betrayalSensitivity * 100}%` }}
                    ></div>
                  </div>
                  <div className="slider-labels">
                    <span>Forgiving</span>
                    <span>Unforgiving</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render relationships tab
  const renderRelationshipsTab = () => {
    return (
      <div className="tab-content relationships-tab">
        <div className="relationships-header">
          <h3>Character Relationships</h3>
          <button 
            className="btn btn-primary"
            onClick={() => setShowRelationshipModal(true)}
          >
            Add Relationship
          </button>
        </div>
        
        {relatedCharacters.length > 0 ? (
          <div className="relationships-grid">
            {relatedCharacters.map((relation, index) => (
              <div key={index} className="relationship-card">
                <div 
                  className="relationship-type-indicator"
                  style={{ backgroundColor: getRelationshipColor(relation.relationship.type) }}
                ></div>
                
                <div className="relationship-header">
                  <Link 
                    to={`/character/${relation.character.basicInfo.id}`}
                    className="character-link"
                  >
                    {relation.character.basicInfo.imageUrl ? (
                      <img 
                        src={relation.character.basicInfo.imageUrl} 
                        alt={relation.character.basicInfo.name || relation.character.basicInfo.alias || 'Character'} 
                        className="character-thumbnail"
                      />
                    ) : (
                      <div className="character-thumbnail-placeholder">
                        {(relation.character.basicInfo.name || relation.character.basicInfo.alias || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="character-info">
                      <div className="character-name">
                        {relation.character.basicInfo.name || relation.character.basicInfo.alias || 'Unknown'}
                      </div>
                      <div className="character-role">
                        {relation.character.socialHierarchyPosition.role}
                      </div>
                    </div>
                  </Link>
                </div>
                
                <div className="relationship-details">
                  <div className="relationship-type">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{relation.relationship.type}</span>
                  </div>
                  
                  <div className="relationship-strength">
                    <span className="detail-label">Strength:</span>
                    <span className="detail-value">{relation.relationship.strength}</span>
                  </div>
                  
                  <div className="relationship-compatibility">
                    <span className="detail-label">Compatibility:</span>
                    <span 
                      className="detail-value"
                      style={{ 
                        color: relation.compatibility >= 0.8 ? 'var(--success)' :
                              relation.compatibility >= 0.6 ? 'var(--accent-primary)' :
                              relation.compatibility >= 0.4 ? 'var(--warning)' :
                              'var(--danger)'
                      }}
                    >
                      {Math.round(relation.compatibility * 100)}%
                    </span>
                  </div>
                  
                  {relation.relationship.description && (
                    <div className="relationship-description">
                      <span className="detail-label">Description:</span>
                      <p>{relation.relationship.description}</p>
                    </div>
                  )}
                  
                  {relation.relationship.startDate && (
                    <div className="relationship-start-date">
                      <span className="detail-label">Since:</span>
                      <span className="detail-value">{formatDate(relation.relationship.startDate)}</span>
                    </div>
                  )}
                  
                  {relation.relationship.trust !== undefined && (
                    <div className="relationship-trust">
                      <span className="detail-label">Trust Level:</span>
                      <div className="trust-bar-container">
                        <div 
                          className="trust-bar-fill" 
                          style={{ width: `${relation.relationship.trust * 100}%` }}
                        ></div>
                      </div>
                      <span className="trust-value">{Math.round(relation.relationship.trust * 100)}%</span>
                    </div>
                  )}
                  
                  {relation.relationship.conflict !== undefined && (
                    <div className="relationship-conflict">
                      <span className="detail-label">Conflict Level:</span>
                      <div className="conflict-bar-container">
                        <div 
                          className="conflict-
