import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCharacters } from '../contexts/CharacterContext';
import { 
  Character, 
  SocialRole, 
  IntroversionExtroversion, 
  AttachmentStyle,
  CommunicationStyle
} from '../types/Character';

const CharacterList: React.FC = () => {
  const { 
    characters, 
    deleteCharacter, 
    autocompleteCharacter, 
    exportData, 
    importData,
    calculateCompatibility,
    selectCharacter,
    setUIState
  } = useCharacters();
  
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for search, filter, and sort
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<SocialRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'role'>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  
  // State for compatibility view
  const [compatibilityMode, setCompatibilityMode] = useState(false);
  const [baseCharacterId, setBaseCharacterId] = useState<string | null>(null);
  
  // Filter and sort characters
  const filteredAndSortedCharacters = React.useMemo(() => {
    // First filter by search term and role
    let result = characters.filter(character => {
      const nameMatch = (character.basicInfo.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const aliasMatch = (character.basicInfo.alias || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const roleMatch = filterRole === 'all' || character.socialHierarchyPosition.role === filterRole;
      
      return (nameMatch || aliasMatch) && roleMatch;
    });
    
    // Then sort
    return result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.basicInfo.name || a.basicInfo.alias || '').localeCompare(
            b.basicInfo.name || b.basicInfo.alias || ''
          );
          break;
        case 'created':
          comparison = new Date(a.basicInfo.createdAt).getTime() - new Date(b.basicInfo.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.basicInfo.updatedAt).getTime() - new Date(b.basicInfo.updatedAt).getTime();
          break;
        case 'role':
          comparison = a.socialHierarchyPosition.role.localeCompare(b.socialHierarchyPosition.role);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [characters, searchTerm, filterRole, sortBy, sortDirection]);
  
  // Handle character selection for bulk operations
  const toggleCharacterSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} characters?`)) {
      selectedIds.forEach(id => deleteCharacter(id));
      setSelectedIds([]);
      setBulkMode(false);
    }
  };
  
  // Handle bulk export
  const handleBulkExport = () => {
    // Filter only selected characters
    const selectedCharacters = characters.filter(c => selectedIds.includes(c.basicInfo.id));
    
    // Create a subset of the data with only selected characters
    const exportData = JSON.stringify({
      characters: selectedCharacters,
      relationships: [] // Relationships would need additional filtering
    }, null, 2);
    
    // Create download link
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-profiles-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Exit bulk mode
    setBulkMode(false);
    setSelectedIds([]);
  };
  
  // Handle export all
  const handleExportAll = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-profiles-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle import
  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process imported file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        importData(jsonData);
      } catch (error) {
        console.error('Error importing data:', error);
        setUIState({
          notification: {
            show: true,
            message: 'Error importing data. Invalid format.',
            type: 'error'
          }
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  // Toggle compatibility mode
  const toggleCompatibilityMode = () => {
    setCompatibilityMode(!compatibilityMode);
    if (compatibilityMode) {
      setBaseCharacterId(null);
    }
  };
  
  // Select base character for compatibility
  const selectBaseCharacter = (id: string) => {
    setBaseCharacterId(id);
  };
  
  // Calculate compatibility score for display
  const getCompatibilityScore = (characterId: string) => {
    if (!baseCharacterId || baseCharacterId === characterId) return null;
    
    const score = calculateCompatibility(baseCharacterId, characterId);
    return score;
  };
  
  // Get color based on compatibility score
  const getCompatibilityColor = (score: number | null) => {
    if (score === null) return 'transparent';
    
    if (score >= 0.8) return 'var(--success)';
    if (score >= 0.6) return 'var(--accent-primary)';
    if (score >= 0.4) return 'var(--warning)';
    return 'var(--danger)';
  };
  
  // Format date for display
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get attachment style color
  const getAttachmentStyleColor = (style: AttachmentStyle) => {
    switch (style) {
      case AttachmentStyle.SECURE:
        return 'var(--success)';
      case AttachmentStyle.ANXIOUS:
        return 'var(--warning)';
      case AttachmentStyle.AVOIDANT:
        return 'var(--accent-tertiary)';
      case AttachmentStyle.FEARFUL_AVOIDANT:
        return 'var(--danger)';
      default:
        return 'var(--text-secondary)';
    }
  };
  
  // Get introversion/extroversion color
  const getIntroExtroColor = (style: IntroversionExtroversion) => {
    switch (style) {
      case IntroversionExtroversion.HIGHLY_INTROVERTED:
        return 'var(--accent-tertiary)';
      case IntroversionExtroversion.INTROVERTED:
        return 'var(--accent-secondary)';
      case IntroversionExtroversion.AMBIVERT:
        return 'var(--success)';
      case IntroversionExtroversion.EXTROVERTED:
        return 'var(--warning)';
      case IntroversionExtroversion.HIGHLY_EXTROVERTED:
        return 'var(--danger)';
      default:
        return 'var(--text-secondary)';
    }
  };
  
  // Get communication style icon
  const getCommunicationIcon = (style: CommunicationStyle) => {
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
  
  // Handle character card click
  const handleCardClick = (character: Character) => {
    if (bulkMode) {
      toggleCharacterSelection(character.basicInfo.id);
    } else if (compatibilityMode) {
      if (baseCharacterId === null) {
        selectBaseCharacter(character.basicInfo.id);
      } else if (baseCharacterId === character.basicInfo.id) {
        setBaseCharacterId(null);
      } else {
        // Navigate to comparison view or show comparison modal
        selectCharacter(character.basicInfo.id);
        navigate(`/character/${character.basicInfo.id}`);
      }
    } else {
      // Normal mode - navigate to character detail
      selectCharacter(character.basicInfo.id);
      navigate(`/character/${character.basicInfo.id}`);
    }
  };
  
  // Character card component
  const CharacterCard = ({ character }: { character: Character }) => {
    const isSelected = selectedIds.includes(character.basicInfo.id);
    const isBaseCharacter = baseCharacterId === character.basicInfo.id;
    const compatibilityScore = getCompatibilityScore(character.basicInfo.id);
    const compatibilityColor = getCompatibilityColor(compatibilityScore);
    
    return (
      <div 
        className={`character-card ${isSelected ? 'selected' : ''} ${isBaseCharacter ? 'base-character' : ''}`}
        style={compatibilityMode && !isBaseCharacter && baseCharacterId ? {
          borderLeft: `4px solid ${compatibilityColor}`
        } : {}}
      >
        <div className="character-card-inner">
          {/* Card Front */}
          <div className="character-card-front">
            {/* Selection checkbox for bulk mode */}
            {bulkMode && (
              <div className="character-select">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleCharacterSelection(character.basicInfo.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="form-check-input"
                />
              </div>
            )}
            
            {/* Compatibility indicator */}
            {compatibilityMode && baseCharacterId && !isBaseCharacter && (
              <div 
                className="compatibility-indicator"
                style={{ backgroundColor: compatibilityColor }}
              >
                {compatibilityScore !== null ? `${Math.round(compatibilityScore * 100)}%` : ''}
              </div>
            )}
            
            {/* Base character indicator */}
            {compatibilityMode && isBaseCharacter && (
              <div className="base-indicator">Base</div>
            )}
            
            <div className="character-avatar-container">
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
            </div>
            
            <h3 className="character-name">
              {character.basicInfo.name || character.basicInfo.alias || 'Unknown'}
            </h3>
            
            <div className="character-role">
              {character.socialHierarchyPosition.role}
            </div>
            
            <div className="character-traits-preview">
              <div className="character-trait">
                <span className="trait-icon" style={{ color: getIntroExtroColor(character.psychologicalProfile.introversionExtroversion) }}>
                  {character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.HIGHLY_INTROVERTED || 
                   character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.INTROVERTED ? '◐' : '◑'}
                </span>
                <span className="trait-label">{character.psychologicalProfile.introversionExtroversion}</span>
              </div>
              
              <div className="character-trait">
                <span className="trait-icon" style={{ color: getAttachmentStyleColor(character.psychologicalProfile.attachmentStyle) }}>
                  ⌘
                </span>
                <span className="trait-label">{character.psychologicalProfile.attachmentStyle}</span>
              </div>
              
              <div className="character-trait">
                <span className="trait-icon">
                  {getCommunicationIcon(character.communication.primaryStyle)}
                </span>
                <span className="trait-label">{character.communication.primaryStyle}</span>
              </div>
            </div>
            
            {/* Quick action buttons */}
            {!bulkMode && !compatibilityMode && (
              <div className="character-actions">
                <button 
                  className="btn btn-icon btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit/${character.basicInfo.id}`);
                  }}
                  aria-label="Edit character"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-icon btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    autocompleteCharacter(character.basicInfo.id);
                  }}
                  aria-label="Autocomplete character"
                >
                  🧠
                </button>
                <button 
                  className="btn btn-icon btn-sm btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this character?')) {
                      deleteCharacter(character.basicInfo.id);
                    }
                  }}
                  aria-label="Delete character"
                >
                  🗑️
                </button>
              </div>
            )}
            
            <div className="character-date">
              Created: {formatDate(character.basicInfo.createdAt)}
            </div>
          </div>
          
          {/* Card Back */}
          <div className="character-card-back">
            <h3 className="character-name mb-2">
              {character.basicInfo.name || character.basicInfo.alias || 'Unknown'}
            </h3>
            
            <div className="character-profile-section">
              <h4 className="section-title">Psychological Profile</h4>
              
              <div className="character-trait">
                <span className="character-trait-label">Introversion/Extroversion:</span>
                <span className="character-trait-value" style={{ color: getIntroExtroColor(character.psychologicalProfile.introversionExtroversion) }}>
                  {character.psychologicalProfile.introversionExtroversion}
                </span>
              </div>
              
              <div className="character-trait">
                <span className="character-trait-label">Attachment Style:</span>
                <span className="character-trait-value" style={{ color: getAttachmentStyleColor(character.psychologicalProfile.attachmentStyle) }}>
                  {character.psychologicalProfile.attachmentStyle}
                </span>
              </div>
              
              <div className="character-trait">
                <span className="character-trait-label">Trust Level:</span>
                <span className="character-trait-value">
                  {character.psychologicalProfile.trustLevel}
                </span>
              </div>
            </div>
            
            <div className="character-profile-section">
              <h4 className="section-title">Vulnerabilities</h4>
              {character.psychologicalProfile.likelyVulnerabilities && 
               character.psychologicalProfile.likelyVulnerabilities.length > 0 ? (
                <ul className="vulnerability-list">
                  {character.psychologicalProfile.likelyVulnerabilities.map((vulnerability, index) => (
                    <li key={index} className="vulnerability-item">
                      <span className="vulnerability-type">{vulnerability.type}</span>
                      <div className="vulnerability-bar">
                        <div 
                          className="vulnerability-bar-fill" 
                          style={{ width: `${vulnerability.probability * 100}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No vulnerabilities identified</p>
              )}
            </div>
            
            <div className="character-profile-section">
              <h4 className="section-title">Communication</h4>
              <div className="character-trait">
                <span className="character-trait-label">Primary Style:</span>
                <span className="character-trait-value">
                  {getCommunicationIcon(character.communication.primaryStyle)} {character.communication.primaryStyle}
                </span>
              </div>
              {character.communication.secondaryStyle && (
                <div className="character-trait">
                  <span className="character-trait-label">Secondary Style:</span>
                  <span className="character-trait-value">
                    {getCommunicationIcon(character.communication.secondaryStyle)} {character.communication.secondaryStyle}
                  </span>
                </div>
              )}
            </div>
            
            <div className="character-profile-section">
              <h4 className="section-title">Decision Making</h4>
              <div className="character-trait">
                <span className="character-trait-label">Emotion vs Logic:</span>
                <div className="decision-slider">
                  <div className="decision-slider-track">
                    <div 
                      className="decision-slider-fill" 
                      style={{ width: `${character.decisionMaking.emotionVsLogic * 100}%` }}
                    ></div>
                  </div>
                  <div className="decision-slider-labels">
                    <span>Logical</span>
                    <span>Emotional</span>
                  </div>
                </div>
              </div>
              <div className="character-trait">
                <span className="character-trait-label">Pacing:</span>
                <span className="character-trait-value">
                  {character.decisionMaking.pacing}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="character-list-container">
      <div className="page-header mb-4">
        <h1>Character Profiles</h1>
        <p className="text-secondary">
          Create and manage detailed psychological profiles of individuals in your social network.
        </p>
      </div>
      
      {/* Controls Bar */}
      <div className="controls-bar mb-4">
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="filter-box">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as SocialRole | 'all')}
              className="form-select"
            >
              <option value="all">All Roles</option>
              {Object.values(SocialRole).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div className="sort-box">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'updated' | 'role')}
              className="form-select"
            >
              <option value="name">Sort by Name</option>
              <option value="created">Sort by Created Date</option>
              <option value="updated">Sort by Updated Date</option>
              <option value="role">Sort by Role</option>
            </select>
            
            <button
              className="btn btn-icon"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        <div className="action-buttons">
          <Link to="/create" className="btn btn-primary">
            New Character
          </Link>
          
          <div className="btn-group">
            <button
              className={`btn ${bulkMode ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => {
                setBulkMode(!bulkMode);
                if (compatibilityMode) setCompatibilityMode(false);
                setSelectedIds([]);
                setBaseCharacterId(null);
              }}
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Operations'}
            </button>
            
            <button
              className={`btn ${compatibilityMode ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => {
                toggleCompatibilityMode();
                if (bulkMode) setBulkMode(false);
                setSelectedIds([]);
              }}
            >
              {compatibilityMode ? 'Exit Compatibility' : 'Compare Compatibility'}
            </button>
            
            <button
              className="btn btn-secondary"
              onClick={handleExportAll}
            >
              Export All
            </button>
            
            <button
              className="btn btn-secondary"
              onClick={handleImport}
            >
              Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        {/* Bulk Operations Bar */}
        {bulkMode && selectedIds.length > 0 && (
          <div className="bulk-operations-bar mt-3">
            <span className="selected-count">
              {selectedIds.length} character{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            
            <div className="bulk-actions">
              <button
                className="btn btn-danger"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={handleBulkExport}
              >
                Export Selected
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedIds([])}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
        
        {/* Compatibility Mode Instructions */}
        {compatibilityMode && (
          <div className="compatibility-instructions mt-3">
            {!baseCharacterId ? (
              <p>Select a base character to compare compatibility with others</p>
            ) : (
              <p>
                Base character selected: {
                  characters.find(c => c.basicInfo.id === baseCharacterId)?.basicInfo.name || 
                  characters.find(c => c.basicInfo.id === baseCharacterId)?.basicInfo.alias || 
                  'Unknown'
                } - Click another character to view details or click the base character again to deselect
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Character Grid */}
      {filteredAndSortedCharacters.length > 0 ? (
        <div className="character-grid">
          {filteredAndSortedCharacters.map(character => (
            <div 
              key={character.basicInfo.id} 
              className="character-grid-item"
              onClick={() => handleCardClick(character)}
            >
              <CharacterCard character={character} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          {searchTerm || filterRole !== 'all' ? (
            <>
              <h2>No matching characters found</h2>
              <p>Try adjusting your search or filter criteria</p>
              <button 
                className="btn btn-secondary mt-3"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                }}
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h2>No characters yet</h2>
              <p>Create your first character profile to get started</p>
              <Link to="/create" className="btn btn-primary btn-lg mt-3">
                Create First Character
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterList;
