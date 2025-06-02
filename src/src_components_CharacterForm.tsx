import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacters } from '../contexts/CharacterContext';
import {
  Character,
  createNewCharacter,
  IntroversionExtroversion,
  AttachmentStyle,
  TrustLevel,
  SocialRole,
  CommunicationStyle,
  CommunicationChannel,
  RelationshipType,
  EvidenceVariable,
  Vulnerability,
  MotivationFactor,
  InsecurityFactor,
  TrustTrigger,
  IdentityAnchor
} from '../types/Character';
import BayesianInference from '../services/BayesianInference';

// Form section types
type FormSection = 
  | 'basicInfo'
  | 'psychologicalProfile'
  | 'socialHierarchy'
  | 'motivationsInsecurities'
  | 'trustSignals'
  | 'communication'
  | 'decisionMaking'
  | 'routinePatterns'
  | 'loyaltyNetwork'
  | 'digitalFootprint'
  | 'identityAnchors'
  | 'review';

// Form validation state
interface FormErrors {
  basicInfo?: {
    name?: string;
    alias?: string;
    dateOfBirth?: string;
    country?: string;
    city?: string;
    imageUrl?: string;
  };
  [key: string]: any;
}

const CharacterForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    characters, 
    addCharacter, 
    updateCharacter, 
    getSuggestedTraits,
    setUIState
  } = useCharacters();
  
  // Form state
  const [character, setCharacter] = useState<Character>(createNewCharacter());
  const [currentSection, setCurrentSection] = useState<FormSection>('basicInfo');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [exitDestination, setExitDestination] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [suggestedTraits, setSuggestedTraits] = useState<{
    [category: string]: { trait: string; probability: number }[];
  }>({});
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  
  // Section order for navigation
  const sectionOrder: FormSection[] = [
    'basicInfo',
    'psychologicalProfile',
    'socialHierarchy',
    'motivationsInsecurities',
    'trustSignals',
    'communication',
    'decisionMaking',
    'routinePatterns',
    'loyaltyNetwork',
    'digitalFootprint',
    'identityAnchors',
    'review'
  ];
  
  // Section titles for display
  const sectionTitles: Record<FormSection, string> = {
    basicInfo: 'Basic Information',
    psychologicalProfile: 'Psychological Profile',
    socialHierarchy: 'Social Hierarchy',
    motivationsInsecurities: 'Motivations & Insecurities',
    trustSignals: 'Trust Signals & Vulnerabilities',
    communication: 'Communication Style',
    decisionMaking: 'Decision-Making Style',
    routinePatterns: 'Routine Patterns',
    loyaltyNetwork: 'Loyalty Network',
    digitalFootprint: 'Digital Footprint',
    identityAnchors: 'Identity Anchors',
    review: 'Review & Submit'
  };
  
  // Load character data if editing
  useEffect(() => {
    if (id) {
      const existingCharacter = characters.find(c => c.basicInfo.id === id);
      if (existingCharacter) {
        setCharacter(JSON.parse(JSON.stringify(existingCharacter))); // Deep copy
        
        // Set image preview if available
        if (existingCharacter.basicInfo.imageUrl) {
          setImagePreview(existingCharacter.basicInfo.imageUrl);
        }
      } else {
        // Character not found, redirect to list
        navigate('/');
        setUIState({
          notification: {
            show: true,
            message: 'Character not found',
            type: 'error'
          }
        });
      }
    }
  }, [id, characters, navigate, setUIState]);
  
  // Calculate form progress
  useEffect(() => {
    const totalSections = sectionOrder.length - 1; // Exclude review section
    const completedSections = calculateCompletedSections();
    setFormProgress(Math.floor((completedSections / totalSections) * 100));
  }, [character]);
  
  // Update suggested traits when character changes
  useEffect(() => {
    if (!isAutocompleting) {
      updateSuggestedTraits();
    }
  }, [character.psychologicalProfile, character.socialHierarchyPosition, character.communication]);
  
  // Prompt before leaving if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSaving) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSaving]);
  
  // Calculate completed sections for progress bar
  const calculateCompletedSections = () => {
    let completed = 0;
    
    // Basic Info
    if (
      character.basicInfo.name || 
      character.basicInfo.alias || 
      character.basicInfo.imageUrl
    ) {
      completed++;
    }
    
    // Psychological Profile
    if (
      character.psychologicalProfile.introversionExtroversion !== IntroversionExtroversion.AMBIVERT ||
      character.psychologicalProfile.attachmentStyle !== AttachmentStyle.SECURE ||
      character.psychologicalProfile.trustLevel !== TrustLevel.NEUTRAL ||
      character.psychologicalProfile.likelyVulnerabilities.length > 0
    ) {
      completed++;
    }
    
    // Social Hierarchy
    if (
      character.socialHierarchyPosition.role !== SocialRole.FOLLOWER ||
      character.socialHierarchyPosition.influence !== 0.5 ||
      character.socialHierarchyPosition.approvalDependency !== 0.5
    ) {
      completed++;
    }
    
    // Motivations & Insecurities
    if (
      character.motivationsInsecurities.desires.length > 0 ||
      character.motivationsInsecurities.fears.length > 0
    ) {
      completed++;
    }
    
    // Trust Signals
    if (character.trustSignalsVulnerabilityMarkers.triggers.length > 0) {
      completed++;
    }
    
    // Communication
    if (
      character.communication.primaryStyle !== CommunicationStyle.DIRECT ||
      character.communication.secondaryStyle ||
      character.communication.preferredChannels.length > 1
    ) {
      completed++;
    }
    
    // Decision Making
    if (
      character.decisionMaking.emotionVsLogic !== 0.5 ||
      character.decisionMaking.pacing !== "Moderate"
    ) {
      completed++;
    }
    
    // Routine Patterns
    if (character.routinePatterns.dailyRoutines.length > 0) {
      completed++;
    }
    
    // Loyalty Network
    if (character.loyaltyNetwork.primaryLoyalties.length > 0) {
      completed++;
    }
    
    // Digital Footprint
    if (character.digitalFootprint.activities.length > 0) {
      completed++;
    }
    
    // Identity Anchors
    if (character.identityAnchors.coreAnchors.length > 0) {
      completed++;
    }
    
    return completed;
  };
  
  // Update suggested traits based on current character data
  const updateSuggestedTraits = () => {
    // Extract evidence from character
    const evidence = BayesianInference.extractEvidenceFromCharacter(character);
    
    // Get suggestions for different categories
    const newSuggestions: { [category: string]: { trait: string; probability: number }[] } = {};
    
    // Vulnerabilities
    newSuggestions.vulnerabilities = getSuggestedTraits(character.basicInfo.id, 'vulnerabilities', 5);
    
    // Desires
    newSuggestions.desires = getSuggestedTraits(character.basicInfo.id, 'desires', 5);
    
    // Fears
    newSuggestions.fears = getSuggestedTraits(character.basicInfo.id, 'fears', 5);
    
    // Trust triggers
    newSuggestions.trustTriggers = getSuggestedTraits(character.basicInfo.id, 'trustTriggers', 5);
    
    // Communication style
    newSuggestions.communicationStyle = getSuggestedTraits(character.basicInfo.id, 'communicationStyle', 3);
    
    // Decision making
    newSuggestions.emotionVsLogic = getSuggestedTraits(character.basicInfo.id, 'emotionVsLogic', 3);
    newSuggestions.decisionPacing = getSuggestedTraits(character.basicInfo.id, 'decisionPacing', 3);
    
    // Identity anchors
    newSuggestions.identityAnchors = getSuggestedTraits(character.basicInfo.id, 'identityAnchors', 5);
    
    setSuggestedTraits(newSuggestions);
  };
  
  // Handle form field changes
  const handleChange = (section: string, field: string, value: any) => {
    setIsDirty(true);
    
    setCharacter(prev => {
      const updated = { ...prev };
      
      if (section === 'basicInfo' && field === 'imageUrl') {
        // Handle image upload separately
        return updated;
      }
      
      // Handle nested fields
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        (updated as any)[section][parentField][childField] = value;
      } else {
        (updated as any)[section][field] = value;
      }
      
      // Update timestamp
      updated.basicInfo.updatedAt = new Date();
      
      return updated;
    });
  };
  
  // Handle array field changes (add/remove items)
  const handleArrayChange = (
    section: string, 
    field: string, 
    action: 'add' | 'update' | 'remove', 
    value?: any, 
    index?: number
  ) => {
    setIsDirty(true);
    
    setCharacter(prev => {
      const updated = { ...prev };
      const array = [...((updated as any)[section][field] || [])];
      
      if (action === 'add' && value) {
        array.push(value);
      } else if (action === 'update' && typeof index === 'number' && value) {
        array[index] = value;
      } else if (action === 'remove' && typeof index === 'number') {
        array.splice(index, 1);
      }
      
      (updated as any)[section][field] = array;
      updated.basicInfo.updatedAt = new Date();
      
      return updated;
    });
  };
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      // Update character with image data URL
      setCharacter(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          imageUrl: result,
          updatedAt: new Date()
        }
      }));
      
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle form navigation
  const handleNavigation = (direction: 'next' | 'prev' | FormSection) => {
    // Validate current section before proceeding
    if (direction === 'next' && !validateSection(currentSection)) {
      return;
    }
    
    let nextSection: FormSection;
    
    if (typeof direction === 'string' && direction !== 'next' && direction !== 'prev') {
      // Direct navigation to a specific section
      nextSection = direction;
    } else {
      // Sequential navigation
      const currentIndex = sectionOrder.indexOf(currentSection);
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (nextIndex < 0 || nextIndex >= sectionOrder.length) {
        return; // Out of bounds
      }
      
      nextSection = sectionOrder[nextIndex];
    }
    
    setCurrentSection(nextSection);
    
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Validate current section
  const validateSection = (section: FormSection): boolean => {
    const errors: FormErrors = {};
    
    if (section === 'basicInfo') {
      // Require either name or alias
      if (!character.basicInfo.name && !character.basicInfo.alias) {
        errors.basicInfo = {
          ...(errors.basicInfo || {}),
          name: 'Either name or alias is required'
        };
      }
    }
    
    // Update error state
    setFormErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate all sections
    for (const section of sectionOrder) {
      if (section === 'review') continue; // Skip review section
      if (!validateSection(section)) {
        setCurrentSection(section);
        setUIState({
          notification: {
            show: true,
            message: `Please fix errors in ${sectionTitles[section]}`,
            type: 'error'
          }
        });
        return;
      }
    }
    
    try {
      setIsSaving(true);
      
      if (id) {
        // Update existing character
        updateCharacter(character);
      } else {
        // Create new character
        addCharacter(character);
      }
      
      setIsDirty(false);
      navigate('/');
      
      setUIState({
        notification: {
          show: true,
          message: `Character ${character.basicInfo.name || character.basicInfo.alias} ${id ? 'updated' : 'created'} successfully`,
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error saving character:', error);
      setUIState({
        notification: {
          show: true,
          message: `Error ${id ? 'updating' : 'creating'} character`,
          type: 'error'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    try {
      setIsSaving(true);
      
      if (id) {
        // Update existing character
        updateCharacter(character);
      } else {
        // Create new character
        addCharacter(character);
      }
      
      setIsDirty(false);
      
      setUIState({
        notification: {
          show: true,
          message: `Draft saved successfully`,
          type: 'success'
        }
      });
      
      // If new character, redirect to edit page with new ID
      if (!id) {
        navigate(`/edit/${character.basicInfo.id}`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setUIState({
        notification: {
          show: true,
          message: 'Error saving draft',
          type: 'error'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel/exit
  const handleCancel = (destination: string = '/') => {
    if (isDirty) {
      setShowConfirmExit(true);
      setExitDestination(destination);
    } else {
      navigate(destination);
    }
  };
  
  // Handle autocomplete for the entire character
  const handleAutocomplete = () => {
    setIsAutocompleting(true);
    
    try {
      const completedCharacter = BayesianInference.autocompleteCharacter(character);
      setCharacter(completedCharacter);
      setIsDirty(true);
      
      setUIState({
        notification: {
          show: true,
          message: 'Character profile autocompleted',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error autocompleting character:', error);
      setUIState({
        notification: {
          show: true,
          message: 'Error autocompleting character',
          type: 'error'
        }
      });
    } finally {
      setIsAutocompleting(false);
    }
  };
  
  // Handle adding a suggested trait
  const handleAddSuggestedTrait = (category: string, trait: string, probability: number) => {
    setIsDirty(true);
    
    switch (category) {
      case 'vulnerabilities':
        handleArrayChange(
          'psychologicalProfile',
          'likelyVulnerabilities',
          'add',
          { type: trait, probability }
        );
        break;
        
      case 'desires':
        handleArrayChange(
          'motivationsInsecurities',
          'desires',
          'add',
          { type: trait, strength: probability }
        );
        break;
        
      case 'fears':
        handleArrayChange(
          'motivationsInsecurities',
          'fears',
          'add',
          { type: trait, strength: probability }
        );
        break;
        
      case 'trustTriggers':
        handleArrayChange(
          'trustSignalsVulnerabilityMarkers',
          'triggers',
          'add',
          { type: trait, effectiveness: probability }
        );
        break;
        
      case 'communicationStyle':
        if (!character.communication.secondaryStyle) {
          handleChange('communication', 'secondaryStyle', trait);
        }
        break;
        
      case 'emotionVsLogic':
        const emotionLogicMap: { [key: string]: number } = {
          'Highly emotional': 0.9,
          'Moderately emotional': 0.7,
          'Balanced': 0.5,
          'Moderately logical': 0.3,
          'Highly logical': 0.1
        };
        handleChange('decisionMaking', 'emotionVsLogic', emotionLogicMap[trait] || 0.5);
        break;
        
      case 'decisionPacing':
        handleChange('decisionMaking', 'pacing', trait);
        break;
        
      case 'identityAnchors':
        handleArrayChange(
          'identityAnchors',
          'coreAnchors',
          'add',
          { type: trait, centrality: probability, visibility: 0.5 }
        );
        break;
    }
  };
  
  // Render confirmation dialog
  const renderConfirmExitDialog = () => {
    if (!showConfirmExit) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Unsaved Changes</h3>
          <p>You have unsaved changes. What would you like to do?</p>
          
          <div className="modal-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowConfirmExit(false)}
            >
              Continue Editing
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => {
                handleSaveAsDraft();
                setShowConfirmExit(false);
              }}
            >
              Save as Draft
            </button>
            
            <button 
              className="btn btn-danger"
              onClick={() => {
                setIsDirty(false);
                setShowConfirmExit(false);
                navigate(exitDestination);
              }}
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render progress bar
  const renderProgressBar = () => {
    return (
      <div className="form-progress-container">
        <div className="form-progress-bar">
          <div 
            className="form-progress-fill"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
        <div className="form-progress-text">
          {formProgress}% Complete
        </div>
      </div>
    );
  };
  
  // Render form navigation
  const renderFormNavigation = () => {
    const currentIndex = sectionOrder.indexOf(currentSection);
    const isFirstSection = currentIndex === 0;
    const isLastSection = currentIndex === sectionOrder.length - 1;
    
    return (
      <div className="form-navigation">
        <button
          className="btn btn-secondary"
          onClick={() => handleNavigation('prev')}
          disabled={isFirstSection}
        >
          Previous
        </button>
        
        <div className="form-section-indicator">
          {sectionOrder.map((section, index) => (
            <div 
              key={section}
              className={`form-section-dot ${currentSection === section ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}
              onClick={() => handleNavigation(section)}
              title={sectionTitles[section]}
            ></div>
          ))}
        </div>
        
        {isLastSection ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Submit'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => handleNavigation('next')}
          >
            Next
          </button>
        )}
      </div>
    );
  };
  
  // Render suggested traits
  const renderSuggestedTraits = (category: string) => {
    const suggestions = suggestedTraits[category] || [];
    
    if (suggestions.length === 0) {
      return null;
    }
    
    return (
      <div className="suggested-traits">
        <h4 className="suggested-traits-title">Suggested {category}</h4>
        <div className="suggested-traits-list">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggested-trait-button"
              onClick={() => handleAddSuggestedTrait(category, suggestion.trait, suggestion.probability)}
            >
              <span className="suggested-trait-name">{suggestion.trait}</span>
              <span className="suggested-trait-probability">{Math.round(suggestion.probability * 100)}%</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render form sections
  const renderFormSection = () => {
    switch (currentSection) {
      case 'basicInfo':
        return renderBasicInfoSection();
      case 'psychologicalProfile':
        return renderPsychologicalProfileSection();
      case 'socialHierarchy':
        return renderSocialHierarchySection();
      case 'motivationsInsecurities':
        return renderMotivationsInsecuritiesSection();
      case 'trustSignals':
        return renderTrustSignalsSection();
      case 'communication':
        return renderCommunicationSection();
      case 'decisionMaking':
        return renderDecisionMakingSection();
      case 'routinePatterns':
        return renderRoutinePatternsSection();
      case 'loyaltyNetwork':
        return renderLoyaltyNetworkSection();
      case 'digitalFootprint':
        return renderDigitalFootprintSection();
      case 'identityAnchors':
        return renderIdentityAnchorsSection();
      case 'review':
        return renderReviewSection();
      default:
        return null;
    }
  };
  
  // Basic Info Section
  const renderBasicInfoSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Basic Information</h2>
        <p className="form-section-description">
          Enter basic identifying information about the character. Either name or alias is required.
        </p>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              className={`form-control ${formErrors.basicInfo?.name ? 'is-invalid' : ''}`}
              value={character.basicInfo.name || ''}
              onChange={(e) => handleChange('basicInfo', 'name', e.target.value)}
              placeholder="Full name (if known)"
            />
            {formErrors.basicInfo?.name && (
              <div className="invalid-feedback">{formErrors.basicInfo.name}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="alias" className="form-label">Alias/Nickname</label>
            <input
              type="text"
              id="alias"
              className="form-control"
              value={character.basicInfo.alias || ''}
              onChange={(e) => handleChange('basicInfo', 'alias', e.target.value)}
              placeholder="Alias or nickname"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              className="form-control"
              value={character.basicInfo.dateOfBirth ? new Date(character.basicInfo.dateOfBirth).toISOString().split('T')[0] : ''}
              onChange={(e) => handleChange('basicInfo', 'dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="country" className="form-label">Country</label>
            <input
              type="text"
              id="country"
              className="form-control"
              value={character.basicInfo.country || ''}
              onChange={(e) => handleChange('basicInfo', 'country', e.target.value)}
              placeholder="Country of residence"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="city" className="form-label">City</label>
            <input
              type="text"
              id="city"
              className="form-control"
              value={character.basicInfo.city || ''}
              onChange={(e) => handleChange('basicInfo', 'city', e.target.value)}
              placeholder="City of residence"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Profile Image</label>
          <div className="image-upload-container">
            {imagePreview ? (
              <div className="image-preview-container">
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className="image-preview"
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm image-remove-btn"
                  onClick={() => {
                    setImagePreview(null);
                    handleChange('basicInfo', 'imageUrl', '');
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div 
                className="image-upload-placeholder"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">+</div>
                <div className="upload-text">Upload Image</div>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageUpload}
            />
            
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? 'Change Image' : 'Select Image'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Psychological Profile Section
  const renderPsychologicalProfileSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Psychological Profile</h2>
        <p className="form-section-description">
          Define the core psychological traits that shape this character's behavior and interactions.
        </p>
        
        <div className="form-group">
          <label htmlFor="introversionExtroversion" className="form-label">Introversion/Extroversion</label>
          <select
            id="introversionExtroversion"
            className="form-select"
            value={character.psychologicalProfile.introversionExtroversion}
            onChange={(e) => handleChange('psychologicalProfile', 'introversionExtroversion', e.target.value)}
          >
            {Object.values(IntroversionExtroversion).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <div className="form-text">
            How the person gains energy and processes information - from internal reflection to external interaction.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="attachmentStyle" className="form-label">Attachment Style</label>
          <select
            id="attachmentStyle"
            className="form-select"
            value={character.psychologicalProfile.attachmentStyle}
            onChange={(e) => handleChange('psychologicalProfile', 'attachmentStyle', e.target.value)}
          >
            {Object.values(AttachmentStyle).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <div className="form-text">
            How they form emotional bonds and handle relationships.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="trustLevel" className="form-label">Trust Level</label>
          <select
            id="trustLevel"
            className="form-select"
            value={character.psychologicalProfile.trustLevel}
            onChange={(e) => handleChange('psychologicalProfile', 'trustLevel', e.target.value)}
          >
            {Object.values(TrustLevel).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <div className="form-text">
            Their general tendency to trust or distrust others.
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Likely Vulnerabilities</label>
          
          {character.psychologicalProfile.likelyVulnerabilities.map((vulnerability, index) => (
            <div key={index} className="array-item vulnerability-item">
              <div className="array-item-content">
                <input
                  type="text"
                  className="form-control"
                  value={vulnerability.type}
                  onChange={(e) => handleArrayChange(
                    'psychologicalProfile',
                    'likelyVulnerabilities',
                    'update',
                    { ...vulnerability, type: e.target.value },
                    index
                  )}
                  placeholder="Vulnerability type"
                />
                
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={vulnerability.probability}
                    onChange={(e) => handleArrayChange(
                      'psychologicalProfile',
                      'likelyVulnerabilities',
                      'update',
                      { ...vulnerability, probability: parseFloat(e.target.value) },
                      index
                    )}
                    className="form-range"
                  />
                  <div className="slider-value">{Math.round(vulnerability.probability * 100)}%</div>
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-danger btn-sm array-item-remove"
                onClick={() => handleArrayChange(
                  'psychologicalProfile',
                  'likelyVulnerabilities',
                  'remove',
                  undefined,
                  index
                )}
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleArrayChange(
              'psychologicalProfile',
              'likelyVulnerabilities',
              'add',
              { type: '', probability: 0.5 }
            )}
          >
            Add Vulnerability
          </button>
          
          {renderSuggestedTraits('vulnerabilities')}
        </div>
        
        <div className="form-group">
          <label htmlFor="mirroringStrategy" className="form-label">Mirroring Strategy</label>
          <input
            type="text"
            id="mirroringStrategy"
            className="form-control"
            value={character.psychologicalProfile.mirroringStrategy || ''}
            onChange={(e) => handleChange('psychologicalProfile', 'mirroringStrategy', e.target.value)}
            placeholder="How to mirror their behavior to build rapport"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="selfDisclosureLevel" className="form-label">Self-Disclosure Level</label>
          <div className="slider-container">
            <input
              type="range"
              id="selfDisclosureLevel"
              min="0"
              max="1"
              step="0.01"
              value={character.psychologicalProfile.selfDisclosureLevel || 0.5}
              onChange={(e) => handleChange('psychologicalProfile', 'selfDisclosureLevel', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Very Private</span>
              <span>Very Open</span>
            </div>
            <div className="slider-value">{Math.round((character.psychologicalProfile.selfDisclosureLevel || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="confidenceLevel" className="form-label">Confidence Level</label>
          <div className="slider-container">
            <input
              type="range"
              id="confidenceLevel"
              min="0"
              max="1"
              step="0.01"
              value={character.psychologicalProfile.confidenceLevel || 0.5}
              onChange={(e) => handleChange('psychologicalProfile', 'confidenceLevel', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Insecure</span>
              <span>Very Confident</span>
            </div>
            <div className="slider-value">{Math.round((character.psychologicalProfile.confidenceLevel || 0.5) * 100)}%</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Social Hierarchy Section
  const renderSocialHierarchySection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Social Hierarchy Position</h2>
        <p className="form-section-description">
          Define how this character positions themselves in social groups and hierarchies.
        </p>
        
        <div className="form-group">
          <label htmlFor="role" className="form-label">Social Role</label>
          <select
            id="role"
            className="form-select"
            value={character.socialHierarchyPosition.role}
            onChange={(e) => handleChange('socialHierarchyPosition', 'role', e.target.value)}
          >
            {Object.values(SocialRole).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <div className="form-text">
            Their primary role in social groups.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="influence" className="form-label">Social Influence</label>
          <div className="slider-container">
            <input
              type="range"
              id="influence"
              min="0"
              max="1"
              step="0.01"
              value={character.socialHierarchyPosition.influence}
              onChange={(e) => handleChange('socialHierarchyPosition', 'influence', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Low Influence</span>
              <span>High Influence</span>
            </div>
            <div className="slider-value">{Math.round(character.socialHierarchyPosition.influence * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="approvalDependency" className="form-label">Approval Dependency</label>
          <div className="slider-container">
            <input
              type="range"
              id="approvalDependency"
              min="0"
              max="1"
              step="0.01"
              value={character.socialHierarchyPosition.approvalDependency}
              onChange={(e) => handleChange('socialHierarchyPosition', 'approvalDependency', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Independent</span>
              <span>Approval-Seeking</span>
            </div>
            <div className="slider-value">{Math.round(character.socialHierarchyPosition.approvalDependency * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="bestTactic" className="form-label">Best Approach Tactic</label>
          <input
            type="text"
            id="bestTactic"
            className="form-control"
            value={character.socialHierarchyPosition.bestTactic || ''}
            onChange={(e) => handleChange('socialHierarchyPosition', 'bestTactic', e.target.value)}
            placeholder="Most effective way to approach them"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="groupStatus" className="form-label">Group Status</label>
          <input
            type="text"
            id="groupStatus"
            className="form-control"
            value={character.socialHierarchyPosition.groupStatus || ''}
            onChange={(e) => handleChange('socialHierarchyPosition', 'groupStatus', e.target.value)}
            placeholder="Their status within their primary group"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dominanceLevel" className="form-label">Dominance Level</label>
          <div className="slider-container">
            <input
              type="range"
              id="dominanceLevel"
              min="0"
              max="1"
              step="0.01"
              value={character.socialHierarchyPosition.dominanceLevel || 0.5}
              onChange={(e) => handleChange('socialHierarchyPosition', 'dominanceLevel', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Submissive</span>
              <span>Dominant</span>
            </div>
            <div className="slider-value">{Math.round((character.socialHierarchyPosition.dominanceLevel || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="socialCapital" className="form-label">Social Capital</label>
          <div className="slider-container">
            <input
              type="range"
              id="socialCapital"
              min="0"
              max="1"
              step="0.01"
              value={character.socialHierarchyPosition.socialCapital || 0.5}
              onChange={(e) => handleChange('socialHierarchyPosition', 'socialCapital', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Low</span>
              <span>High</span>
            </div>
            <div className="slider-value">{Math.round((character.socialHierarchyPosition.socialCapital || 0.5) * 100)}%</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Motivations & Insecurities Section
  const renderMotivationsInsecuritiesSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Motivations & Insecurities</h2>
        <p className="form-section-description">
          Define what drives this character and what fears or insecurities they have.
        </p>
        
        <div className="form-group">
          <label className="form-label">Core Desires</label>
          
          {character.motivationsInsecurities.desires.map((desire, index) => (
            <div key={index} className="array-item desire-item">
              <div className="array-item-content">
                <input
                  type="text"
                  className="form-control"
                  value={desire.type}
                  onChange={(e) => handleArrayChange(
                    'motivationsInsecurities',
                    'desires',
                    'update',
                    { ...desire, type: e.target.value },
                    index
                  )}
                  placeholder="Desire type"
                />
                
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={desire.strength}
                    onChange={(e) => handleArrayChange(
                      'motivationsInsecurities',
                      'desires',
                      'update',
                      { ...desire, strength: parseFloat(e.target.value) },
                      index
                    )}
                    className="form-range"
                  />
                  <div className="slider-value">{Math.round(desire.strength * 100)}%</div>
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-danger btn-sm array-item-remove"
                onClick={() => handleArrayChange(
                  'motivationsInsecurities',
                  'desires',
                  'remove',
                  undefined,
                  index
                )}
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleArrayChange(
              'motivationsInsecurities',
              'desires',
              'add',
              { type: '', strength: 0.5 }
            )}
          >
            Add Desire
          </button>
          
          {renderSuggestedTraits('desires')}
        </div>
        
        <div className="form-group">
          <label className="form-label">Core Fears</label>
          
          {character.motivationsInsecurities.fears.map((fear, index) => (
            <div key={index} className="array-item fear-item">
              <div className="array-item-content">
                <input
                  type="text"
                  className="form-control"
                  value={fear.type}
                  onChange={(e) => handleArrayChange(
                    'motivationsInsecurities',
                    'fears',
                    'update',
                    { ...fear, type: e.target.value },
                    index
                  )}
                  placeholder="Fear type"
                />
                
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={fear.strength}
                    onChange={(e) => handleArrayChange(
                      'motivationsInsecurities',
                      'fears',
                      'update',
                      { ...fear, strength: parseFloat(e.target.value) },
                      index
                    )}
                    className="form-range"
                  />
                  <div className="slider-value">{Math.round(fear.strength * 100)}%</div>
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-danger btn-sm array-item-remove"
                onClick={() => handleArrayChange(
                  'motivationsInsecurities',
                  'fears',
                  'remove',
                  undefined,
                  index
                )}
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleArrayChange(
              'motivationsInsecurities',
              'fears',
              'add',
              { type: '', strength: 0.5 }
            )}
          >
            Add Fear
          </button>
          
          {renderSuggestedTraits('fears')}
        </div>
        
        <div className="form-group">
          <label htmlFor="primaryMotivation" className="form-label">Primary Motivation</label>
          <input
            type="text"
            id="primaryMotivation"
            className="form-control"
            value={character.motivationsInsecurities.primaryMotivation || ''}
            onChange={(e) => handleChange('motivationsInsecurities', 'primaryMotivation', e.target.value)}
            placeholder="Main driving force"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="secondaryMotivation" className="form-label">Secondary Motivation</label>
          <input
            type="text"
            id="secondaryMotivation"
            className="form-control"
            value={character.motivationsInsecurities.secondaryMotivation || ''}
            onChange={(e) => handleChange('motivationsInsecurities', 'secondaryMotivation', e.target.value)}
            placeholder="Secondary driving force"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="hiddenMotivation" className="form-label">Hidden Motivation</label>
          <input
            type="text"
            id="hiddenMotivation"
            className="form-control"
            value={character.motivationsInsecurities.hiddenMotivation || ''}
            onChange={(e) => handleChange('motivationsInsecurities', 'hiddenMotivation', e.target.value)}
            placeholder="Motivation they don't openly acknowledge"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="coreInsecurity" className="form-label">Core Insecurity</label>
          <input
            type="text"
            id="coreInsecurity"
            className="form-control"
            value={character.motivationsInsecurities.coreInsecurity || ''}
            onChange={(e) => handleChange('motivationsInsecurities', 'coreInsecurity', e.target.value)}
            placeholder="Fundamental insecurity that drives behavior"
          />
        </div>
      </div>
    );
  };
  
  // Trust Signals Section
  const renderTrustSignalsSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Trust Signals & Vulnerability Markers</h2>
        <p className="form-section-description">
          Define what builds trust with this character and what signals vulnerability.
        </p>
        
        <div className="form-group">
          <label className="form-label">Trust Triggers</label>
          
          {character.trustSignalsVulnerabilityMarkers.triggers.map((trigger, index) => (
            <div key={index} className="array-item trigger-item">
              <div className="array-item-content">
                <input
                  type="text"
                  className="form-control"
                  value={trigger.type}
                  onChange={(e) => handleArrayChange(
                    'trustSignalsVulnerabilityMarkers',
                    'triggers',
                    'update',
                    { ...trigger, type: e.target.value },
                    index
                  )}
                  placeholder="Trigger type"
                />
                
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={trigger.effectiveness}
                    onChange={(e) => handleArrayChange(
                      'trustSignalsVulnerabilityMarkers',
                      'triggers',
                      'update',
                      { ...trigger, effectiveness: parseFloat(e.target.value) },
                      index
                    )}
                    className="form-range"
                  />
                  <div className="slider-value">{Math.round(trigger.effectiveness * 100)}%</div>
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-danger btn-sm array-item-remove"
                onClick={() => handleArrayChange(
                  'trustSignalsVulnerabilityMarkers',
                  'triggers',
                  'remove',
                  undefined,
                  index
                )}
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleArrayChange(
              'trustSignalsVulnerabilityMarkers',
              'triggers',
              'add',
              { type: '', effectiveness: 0.5 }
            )}
          >
            Add Trust Trigger
          </button>
          
          {renderSuggestedTraits('trustTriggers')}
        </div>
        
        <div className="form-group">
          <label htmlFor="strategy" className="form-label">Trust Building Strategy</label>
          <textarea
            id="strategy"
            className="form-control form-textarea"
            value={character.trustSignalsVulnerabilityMarkers.strategy || ''}
            onChange={(e) => handleChange('trustSignalsVulnerabilityMarkers', 'strategy', e.target.value)}
            placeholder="Effective strategy to build trust"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="vulnerabilityDisplayFrequency" className="form-label">Vulnerability Display Frequency</label>
          <div className="slider-container">
            <input
              type="range"
              id="vulnerabilityDisplayFrequency"
              min="0"
              max="1"
              step="0.01"
              value={character.trustSignalsVulnerabilityMarkers.vulnerabilityDisplayFrequency || 0.5}
              onChange={(e) => handleChange('trustSignalsVulnerabilityMarkers', 'vulnerabilityDisplayFrequency', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Rarely Shows Vulnerability</span>
              <span>Often Shows Vulnerability</span>
            </div>
            <div className="slider-value">{Math.round((character.trustSignalsVulnerabilityMarkers.vulnerabilityDisplayFrequency || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="trustBuildingSpeed" className="form-label">Trust Building Speed</label>
          <div className="slider-container">
            <input
              type="range"
              id="trustBuildingSpeed"
              min="0"
              max="1"
              step="0.01"
              value={character.trustSignalsVulnerabilityMarkers.trustBuildingSpeed || 0.5}
              onChange={(e) => handleChange('trustSignalsVulnerabilityMarkers', 'trustBuildingSpeed', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Very Slow</span>
              <span>Very Fast</span>
            </div>
            <div className="slider-value">{Math.round((character.trustSignalsVulnerabilityMarkers.trustBuildingSpeed || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="traumaResponsePatterns" className="form-label">Trauma Response Patterns</label>
          <input
            type="text"
            id="traumaResponsePatterns"
            className="form-control"
            value={(character.trustSignalsVulnerabilityMarkers.traumaResponsePatterns || []).join(', ')}
            onChange={(e) => handleChange(
              'trustSignalsVulnerabilityMarkers', 
              'traumaResponsePatterns', 
              e.target.value.split(',').map(item => item.trim()).filter(Boolean)
            )}
            placeholder="Fight, flight, freeze, fawn, etc."
          />
          <div className="form-text">
            Separate multiple responses with commas
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="boundaryStrength" className="form-label">Boundary Strength</label>
          <div className="slider-container">
            <input
              type="range"
              id="boundaryStrength"
              min="0"
              max="1"
              step="0.01"
              value={character.trustSignalsVulnerabilityMarkers.boundaryStrength || 0.5}
              onChange={(e) => handleChange('trustSignalsVulnerabilityMarkers', 'boundaryStrength', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Weak Boundaries</span>
              <span>Strong Boundaries</span>
            </div>
            <div className="slider-value">{Math.round((character.trustSignalsVulnerabilityMarkers.boundaryStrength || 0.5) * 100)}%</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Communication Section
  const renderCommunicationSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Communication Style</h2>
        <p className="form-section-description">
          Define how this character communicates and processes information.
        </p>
        
        <div className="form-group">
          <label htmlFor="primaryStyle" className="form-label">Primary Communication Style</label>
          <select
            id="primaryStyle"
            className="form-select"
            value={character.communication.primaryStyle}
            onChange={(e) => handleChange('communication', 'primaryStyle', e.target.value)}
          >
            {Object.values(CommunicationStyle).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <div className="form-text">
            Their dominant way of expressing themselves.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="secondaryStyle" className="form-label">Secondary Communication Style</label>
          <select
            id="secondaryStyle"
            className="form-select"
            value={character.communication.secondaryStyle || ''}
            onChange={(e) => handleChange('communication', 'secondaryStyle', e.target.value || undefined)}
          >
            <option value="">None</option>
            {Object.values(CommunicationStyle).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <div className="form-text">
            Their secondary or backup communication style.
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Preferred Communication Channels</label>
          
          <div className="checkbox-group">
            {Object.values(CommunicationChannel).map(channel => (
              <div key={channel} className="form-check">
                <input
                  type="checkbox"
                  id={`channel-${channel}`}
                  className="form-check-input"
                  checked={character.communication.preferredChannels.includes(channel)}
                  onChange={(e) => {
                    const updatedChannels = e.target.checked
                      ? [...character.communication.preferredChannels, channel]
                      : character.communication.preferredChannels.filter(c => c !== channel);
                    
                    handleChange('communication', 'preferredChannels', updatedChannels);
                  }}
                />
                <label htmlFor={`channel-${channel}`} className="form-check-label">
                  {channel}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="braggingLikelihood" className="form-label">Bragging Likelihood</label>
          <div className="slider-container">
            <input
              type="range"
              id="braggingLikelihood"
              min="0"
              max="1"
              step="0.01"
              value={character.communication.braggingLikelihood || 0.5}
              onChange={(e) => handleChange('communication', 'braggingLikelihood', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Rarely Brags</span>
              <span>Often Brags</span>
            </div>
            <div className="slider-value">{Math.round((character.communication.braggingLikelihood || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="preferredInput" className="form-label">Preferred Input Style</label>
          <input
            type="text"
            id="preferredInput"
            className="form-control"
            value={character.communication.preferredInput || ''}
            onChange={(e) => handleChange('communication', 'preferredInput', e.target.value)}
            placeholder="How they best receive information"
          />
          <div className="form-text">
            E.g., visual, auditory, direct instructions, storytelling, etc.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="conflictStyle" className="form-label">Conflict Communication Style</label>
          <input
            type="text"
            id="conflictStyle"
            className="form-control"
            value={character.communication.conflictStyle || ''}
            onChange={(e) => handleChange('communication', 'conflictStyle', e.target.value)}
            placeholder="How they communicate during conflict"
          />
          <div className="form-text">
            E.g., avoidant, aggressive, passive-aggressive, assertive, etc.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="humorStyle" className="form-label">Humor Style</label>
          <input
            type="text"
            id="humorStyle"
            className="form-control"
            value={character.communication.humorStyle || ''}
            onChange={(e) => handleChange('communication', 'humorStyle', e.target.value)}
            placeholder="Their sense of humor"
          />
          <div className="form-text">
            E.g., sarcastic, self-deprecating, observational, dark, etc.
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="disclosureDepth" className="form-label">Disclosure Depth</label>
          <div className="slider-container">
            <input
              type="range"
              id="disclosureDepth"
              min="0"
              max="1"
              step="0.01"
              value={character.communication.disclosureDepth || 0.5}
              onChange={(e) => handleChange('communication', 'disclosureDepth', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Surface Level</span>
              <span>Deep Disclosure</span>
            </div>
            <div className="slider-value">{Math.round((character.communication.disclosureDepth || 0.5) * 100)}%</div>
          </div>
        </div>
        
        {renderSuggestedTraits('communicationStyle')}
      </div>
    );
  };
  
  // Decision Making Section
  const renderDecisionMakingSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Decision-Making Style</h2>
        <p className="form-section-description">
          Define how this character makes decisions and processes choices.
        </p>
        
        <div className="form-group">
          <label htmlFor="emotionVsLogic" className="form-label">Emotion vs Logic</label>
          <div className="slider-container">
            <input
              type="range"
              id="emotionVsLogic"
              min="0"
              max="1"
              step="0.01"
              value={character.decisionMaking.emotionVsLogic}
              onChange={(e) => handleChange('decisionMaking', 'emotionVsLogic', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Purely Logical</span>
              <span>Purely Emotional</span>
            </div>
            <div className="slider-value">{Math.round(character.decisionMaking.emotionVsLogic * 100)}%</div>
          </div>
          
          {renderSuggestedTraits('emotionVsLogic')}
        </div>
        
        <div className="form-group">
          <label htmlFor="pacing" className="form-label">Decision Pacing</label>
          <input
            type="text"
            id="pacing"
            className="form-control"
            value={character.decisionMaking.pacing}
            onChange={(e) => handleChange('decisionMaking', 'pacing', e.target.value)}
            placeholder="How quickly they make decisions"
          />
          <div className="form-text">
            E.g., very slow, slow, moderate, fast, very fast
          </div>
          
          {renderSuggestedTraits('decisionPacing')}
        </div>
        
        <div className="form-group">
          <label htmlFor="bestPersuasionTactic" className="form-label">Best Persuasion Tactic</label>
          <input
            type="text"
            id="bestPersuasionTactic"
            className="form-control"
            value={character.decisionMaking.bestPersuasionTactic || ''}
            onChange={(e) => handleChange('decisionMaking', 'bestPersuasionTactic', e.target.value)}
            placeholder="Most effective way to persuade them"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="riskTolerance" className="form-label">Risk Tolerance</label>
          <div className="slider-container">
            <input
              type="range"
              id="riskTolerance"
              min="0"
              max="1"
              step="0.01"
              value={character.decisionMaking.riskTolerance || 0.5}
              onChange={(e) => handleChange('decisionMaking', 'riskTolerance', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Risk Averse</span>
              <span>Risk Seeking</span>
            </div>
            <div className="slider-value">{Math.round((character.decisionMaking.riskTolerance || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="impulsivity" className="form-label">Impulsivity</label>
          <div className="slider-container">
            <input
              type="range"
              id="impulsivity"
              min="0"
              max="1"
              step="0.01"
              value={character.decisionMaking.impulsivity || 0.5}
              onChange={(e) => handleChange('decisionMaking', 'impulsivity', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Deliberate</span>
              <span>Impulsive</span>
            </div>
            <div className="slider-value">{Math.round((character.decisionMaking.impulsivity || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="groupInfluence" className="form-label">Group Influence</label>
          <div className="slider-container">
            <input
              type="range"
              id="groupInfluence"
              min="0"
              max="1"
              step="0.01"
              value={character.decisionMaking.groupInfluence || 0.5}
              onChange={(e) => handleChange('decisionMaking', 'groupInfluence', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Independent Decisions</span>
              <span>Group-Influenced</span>
            </div>
            <div className="slider-value">{Math.round((character.decisionMaking.groupInfluence || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="decisionConfidence" className="form-label">Decision Confidence</label>
          <div className="slider-container">
            <input
              type="range"
              id="decisionConfidence"
              min="0"
              max="1"
              step="0.01"
              value={character.decisionMaking.decisionConfidence || 0.5}
              onChange={(e) => handleChange('decisionMaking', 'decisionConfidence', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Self-Doubting</span>
              <span>Very Confident</span>
            </div>
            <div className="slider-value">{Math.round((character.decisionMaking.decisionConfidence || 0.5) * 100)}%</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Routine Patterns Section
  const renderRoutinePatternsSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Routine Patterns</h2>
        <p className="form-section-description">
          Define this character's regular routines and patterns.
        </p>
        
        <div className="form-group">
          <label className="form-label">Daily Routines</label>
          
          {character.routinePatterns.dailyRoutines.map((routine, index) => (
            <div key={index} className="array-item routine-item">
              <div className="array-item-content">
                <div className="routine-time-activity">
                  <input
                    type="time"
                    className="form-control time-input"
                    value={routine.time}
                    onChange={(e) => handleArrayChange(
                      'routinePatterns',
                      'dailyRoutines',
                      'update',
                      { ...routine, time: e.target.value },
                      index
                    )}
                  />
                  
                  <input
                    type="text"
                    className="form-control"
                    value={routine.activity}
                    onChange={(e) => handleArrayChange(
                      'routinePatterns',
                      'dailyRoutines',
                      'update',
                      { ...routine, activity: e.target.value },
                      index
                    )}
                    placeholder="Activity"
                  />
                </div>
                
                <div className="routine-details">
                  <input
                    type="text"
                    className="form-control"
                    value={routine.location || ''}
                    onChange={(e) => handleArrayChange(
                      'routinePatterns',
                      'dailyRoutines',
                      'update',
                      { ...routine, location: e.target.value },
                      index
                    )}
                    placeholder="Location (optional)"
                  />
                  
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={routine.frequency}
                      onChange={(e) => handleArrayChange(
                        'routinePatterns',
                        'dailyRoutines',
                        'update',
                        { ...routine, frequency: parseFloat(e.target.value) },
                        index
                      )}
                      className="form-range"
                    />
                    <div className="slider-value">{Math.round(routine.frequency * 100)}%</div>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                className="btn btn-danger btn-sm array-item-remove"
                onClick={() => handleArrayChange(
                  'routinePatterns',
                  'dailyRoutines',
                  'remove',
                  undefined,
                  index
                )}
              >
                ×
              </button>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleArrayChange(
              'routinePatterns',
              'dailyRoutines',
              'add',
              { time: '09:00', activity: '', frequency: 0.5 }
            )}
          >
            Add Daily Routine
          </button>
        </div>
        
        <div className="form-group">
          <label htmlFor="weeklyPatterns" className="form-label">Weekly Patterns</label>
          <input
            type="text"
            id="weeklyPatterns"
            className="form-control"
            value={(character.routinePatterns.weeklyPatterns || []).join(', ')}
            onChange={(e) => handleChange(
              'routinePatterns', 
              'weeklyPatterns', 
              e.target.value.split(',').map(item => item.trim()).filter(Boolean)
            )}
            placeholder="Regular weekly activities"
          />
          <div className="form-text">
            Separate multiple patterns with commas
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="predictability" className="form-label">Routine Predictability</label>
          <div className="slider-container">
            <input
              type="range"
              id="predictability"
              min="0"
              max="1"
              step="0.01"
              value={character.routinePatterns.predictability || 0.5}
              onChange={(e) => handleChange('routinePatterns', 'predictability', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Highly Variable</span>
              <span>Highly Predictable</span>
            </div>
            <div className="slider-value">{Math.round((character.routinePatterns.predictability || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="spontaneity" className="form-label">Spontaneity</label>
          <div className="slider-container">
            <input
              type="range"
              id="spontaneity"
              min="0"
              max="1"
              step="0.01"
              value={character.routinePatterns.spontaneity || 0.5}
              onChange={(e) => handleChange('routinePatterns', 'spontaneity', parseFloat(e.target.value))}
              className="form-range"
            />
            <div className="slider-labels">
              <span>Rigid Planner</span>
              <span>Highly Spontaneous</span>
            </div>
            <div className="slider-value">{Math.round((character.routinePatterns.spontaneity || 0.5) * 100)}%</div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="stressResponse" className="form-label">Stress Response Pattern</label>
          <input
            type="text"
            id="stressResponse"
            className="form-control"
            value={character.routinePatterns.stressResponse || ''}
            onChange={(e) => handleChange('routinePatterns', 'stressResponse', e.target.value)}
            placeholder="How their routine changes under stress"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="comfortActivities" className="form-label">Comfort Activities</label>
          <input
            type="text"
            id="comfortActivities"
            className="form-control"
            value={(character.routinePatterns.comfortActivities || []).join(', ')}
            onChange={(e) => handleChange(
              'routinePatterns', 
              'comfortActivities', 
              e.target.value.split(',').map(item => item.trim()).filter(Boolean)
            )}
            placeholder="Activities they do for comfort"
          />
          <div className="form-text">
            Separate multiple activities with commas
          </div>
        </div>
      </div>
    );
  };
  
  // Loyalty Network Section
  const renderLoyaltyNetworkSection = () => {
    return (
      <div className="form-section">
        <h2 className="form-section-title">Loyalty Network</h2>
        <p className="form-section-description">
          Define this character's loyalties and allegiances.
        </p>
        
        <div className="form-group">
          <label className="form-label">Primary Loyalties</label>
          
          {character.loyaltyNetwork.primaryLoyalties.map((loyalty, index) => (
            <div key={index} className="array-item loyalty-
