import React, { useState, useRef, useEffect } from 'react';
import { useCharacters } from '../contexts/CharacterContext';

// Settings component for application configuration
const Settings: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    exportData, 
    importData, 
    resetState,
    setUIState
  } = useCharacters();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state
  const [activeSection, setActiveSection] = useState<string>('general');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showBackupSuccess, setShowBackupSuccess] = useState<boolean>(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  
  // Bayesian algorithm settings
  const [bayesianSettings, setBayesianSettings] = useState({
    confidenceThreshold: 0.7,
    minEvidenceRequired: 2,
    maxSuggestions: 5,
    enableAutoComplete: true,
    suggestionsAggressiveness: 0.5 // 0-1 scale: conservative to aggressive
  });
  
  // Network visualization settings
  const [networkSettings, setNetworkSettings] = useState({
    defaultLayout: 'standard', // standard, hierarchical, circular
    nodeSize: 30,
    edgeWidth: 2,
    physicsEnabled: true,
    showLabels: true,
    showImages: true,
    animationSpeed: 0.5, // 0-1 scale: slow to fast
    clusterByDefault: false
  });
  
  // Form defaults
  const [formSettings, setFormSettings] = useState({
    autoSaveDrafts: true,
    autoSaveInterval: 60, // seconds
    confirmBeforeExit: true,
    showSuggestions: true,
    defaultSocialRole: 'Follower',
    defaultAttachmentStyle: 'Secure',
    defaultCommunicationStyle: 'Direct'
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    storeDataLocally: true,
    enableAnalytics: false,
    showDisclaimers: true,
    enableEncryption: false,
    encryptionKey: '',
    autoDeleteInactive: false,
    inactivityPeriod: 90 // days
  });
  
  // Backup settings
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: false,
    backupInterval: 7, // days
    backupLocation: 'local', // local, cloud (future)
    backupHistory: 3, // number of backups to keep
    includeImages: true
  });
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Load Bayesian settings
        const savedBayesianSettings = localStorage.getItem('bayesianSettings');
        if (savedBayesianSettings) {
          setBayesianSettings(JSON.parse(savedBayesianSettings));
        }
        
        // Load network settings
        const savedNetworkSettings = localStorage.getItem('networkSettings');
        if (savedNetworkSettings) {
          setNetworkSettings(JSON.parse(savedNetworkSettings));
        }
        
        // Load form settings
        const savedFormSettings = localStorage.getItem('formSettings');
        if (savedFormSettings) {
          setFormSettings(JSON.parse(savedFormSettings));
        }
        
        // Load privacy settings
        const savedPrivacySettings = localStorage.getItem('privacySettings');
        if (savedPrivacySettings) {
          setPrivacySettings(JSON.parse(savedPrivacySettings));
        }
        
        // Load backup settings
        const savedBackupSettings = localStorage.getItem('backupSettings');
        if (savedBackupSettings) {
          setBackupSettings(JSON.parse(savedBackupSettings));
        }
        
        // Get last backup date
        const lastBackup = localStorage.getItem('lastBackupDate');
        if (lastBackup) {
          setLastBackupDate(lastBackup);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setUIState({
          notification: {
            show: true,
            message: 'Error loading settings',
            type: 'error'
          }
        });
      }
    };
    
    loadSettings();
  }, [setUIState]);
  
  // Save settings when they change
  useEffect(() => {
    const saveSettings = () => {
      try {
        localStorage.setItem('bayesianSettings', JSON.stringify(bayesianSettings));
        localStorage.setItem('networkSettings', JSON.stringify(networkSettings));
        localStorage.setItem('formSettings', JSON.stringify(formSettings));
        localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
        localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
      } catch (error) {
        console.error('Error saving settings:', error);
        setUIState({
          notification: {
            show: true,
            message: 'Error saving settings',
            type: 'error'
          }
        });
      }
    };
    
    saveSettings();
  }, [bayesianSettings, networkSettings, formSettings, privacySettings, backupSettings, setUIState]);
  
  // Check if auto backup is needed
  useEffect(() => {
    if (!backupSettings.autoBackup || !lastBackupDate) return;
    
    const lastBackup = new Date(lastBackupDate);
    const now = new Date();
    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastBackup >= backupSettings.backupInterval) {
      handleBackup();
    }
  }, [backupSettings.autoBackup, backupSettings.backupInterval, lastBackupDate]);
  
  // Handle export data
  const handleExportData = () => {
    try {
      setIsExporting(true);
      
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
      
      setUIState({
        notification: {
          show: true,
          message: 'Data exported successfully',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setUIState({
        notification: {
          show: true,
          message: 'Error exporting data',
          type: 'error'
        }
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle import data
  const handleImportData = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process imported file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        importData(jsonData);
        
        setUIState({
          notification: {
            show: true,
            message: 'Data imported successfully',
            type: 'success'
          }
        });
      } catch (error) {
        console.error('Error importing data:', error);
        setUIState({
          notification: {
            show: true,
            message: 'Error importing data. Invalid format.',
            type: 'error'
          }
        });
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.onerror = () => {
      setUIState({
        notification: {
          show: true,
          message: 'Error reading file',
          type: 'error'
        }
      });
      setIsImporting(false);
    };
    
    reader.readAsText(file);
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  // Handle reset data
  const handleResetData = () => {
    setShowConfirmReset(true);
  };
  
  // Confirm reset data
  const confirmResetData = () => {
    resetState();
    setShowConfirmReset(false);
    
    setUIState({
      notification: {
        show: true,
        message: 'All data has been reset',
        type: 'info'
      }
    });
  };
  
  // Handle backup
  const handleBackup = () => {
    try {
      // Create backup data
      const backupData = {
        data: JSON.parse(exportData()),
        settings: {
          bayesianSettings,
          networkSettings,
          formSettings,
          privacySettings,
          backupSettings
        },
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
      
      // Convert to JSON
      const backupJson = JSON.stringify(backupData);
      
      // Create backup file
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `social-profiles-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Update last backup date
      const now = new Date().toISOString();
      localStorage.setItem('lastBackupDate', now);
      setLastBackupDate(now);
      
      // Show success message
      setShowBackupSuccess(true);
      setTimeout(() => setShowBackupSuccess(false), 3000);
      
      setUIState({
        notification: {
          show: true,
          message: 'Backup created successfully',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      setUIState({
        notification: {
          show: true,
          message: 'Error creating backup',
          type: 'error'
        }
      });
    }
  };
  
  // Handle restore
  const handleRestore = () => {
    if (backupFileInputRef.current) {
      backupFileInputRef.current.click();
    }
  };
  
  // Process backup file
  const handleBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        // Validate backup data
        if (!backupData.data || !backupData.settings || !backupData.version || !backupData.timestamp) {
          throw new Error('Invalid backup file format');
        }
        
        // Import data
        importData(JSON.stringify(backupData.data));
        
        // Restore settings
        setBayesianSettings(backupData.settings.bayesianSettings);
        setNetworkSettings(backupData.settings.networkSettings);
        setFormSettings(backupData.settings.formSettings);
        setPrivacySettings(backupData.settings.privacySettings);
        setBackupSettings(backupData.settings.backupSettings);
        
        setUIState({
          notification: {
            show: true,
            message: 'Backup restored successfully',
            type: 'success'
          }
        });
      } catch (error) {
        console.error('Error restoring backup:', error);
        setUIState({
          notification: {
            show: true,
            message: 'Error restoring backup. Invalid format.',
            type: 'error'
          }
        });
      }
    };
    
    reader.onerror = () => {
      setUIState({
        notification: {
          show: true,
          message: 'Error reading backup file',
          type: 'error'
        }
      });
    };
    
    reader.readAsText(file);
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  // Update Bayesian settings
  const updateBayesianSetting = (key: keyof typeof bayesianSettings, value: any) => {
    setBayesianSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Update network settings
  const updateNetworkSetting = (key: keyof typeof networkSettings, value: any) => {
    setNetworkSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Update form settings
  const updateFormSetting = (key: keyof typeof formSettings, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Update privacy settings
  const updatePrivacySetting = (key: keyof typeof privacySettings, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Update backup settings
  const updateBackupSetting = (key: keyof typeof backupSettings, value: any) => {
    setBackupSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Render confirm reset modal
  const renderConfirmResetModal = () => {
    if (!showConfirmReset) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Confirm Data Reset</h3>
          </div>
          <div className="modal-body">
            <p className="warning-text">
              This action will permanently delete all character data and relationships.
              This cannot be undone.
            </p>
            <p>
              Consider creating a backup before proceeding.
            </p>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowConfirmReset(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger"
              onClick={confirmResetData}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render section navigation
  const renderSectionNav = () => {
    const sections = [
      { id: 'general', label: 'General' },
      { id: 'bayesian', label: 'Algorithm' },
      { id: 'network', label: 'Network' },
      { id: 'form', label: 'Form' },
      { id: 'privacy', label: 'Privacy' },
      { id: 'backup', label: 'Backup & Restore' },
      { id: 'about', label: 'About' }
    ];
    
    return (
      <div className="settings-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    );
  };
  
  // Render general settings section
  const renderGeneralSection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">General Settings</h2>
        
        <div className="setting-group">
          <h3 className="group-title">Appearance</h3>
          
          <div className="setting-item">
            <div className="setting-label">Theme</div>
            <div className="setting-control">
              <button 
                className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`}
                onClick={toggleTheme}
              >
                <span className="toggle-option dark">Dark</span>
                <span className="toggle-slider"></span>
                <span className="toggle-option light">Light</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Data Management</h3>
          
          <div className="setting-item">
            <div className="setting-label">Export Data</div>
            <div className="setting-control">
              <button 
                className="btn btn-primary"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export All Data'}
              </button>
              <div className="setting-description">
                Export all character data and relationships as a JSON file
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Import Data</div>
            <div className="setting-control">
              <button 
                className="btn btn-primary"
                onClick={handleImportData}
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Data'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
              />
              <div className="setting-description">
                Import character data and relationships from a JSON file
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Reset Data</div>
            <div className="setting-control">
              <button 
                className="btn btn-danger"
                onClick={handleResetData}
              >
                Reset All Data
              </button>
              <div className="setting-description warning-text">
                Delete all character data and relationships permanently
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Bayesian algorithm settings section
  const renderBayesianSection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">Algorithm Settings</h2>
        <p className="section-description">
          Configure the Bayesian inference algorithm that powers character trait predictions and autocomplete.
        </p>
        
        <div className="setting-group">
          <h3 className="group-title">Inference Parameters</h3>
          
          <div className="setting-item">
            <div className="setting-label">Confidence Threshold</div>
            <div className="setting-control">
              <div className="slider-container">
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={bayesianSettings.confidenceThreshold}
                  onChange={(e) => updateBayesianSetting('confidenceThreshold', parseFloat(e.target.value))}
                  className="form-range"
                />
                <div className="slider-value">{Math.round(bayesianSettings.confidenceThreshold * 100)}%</div>
              </div>
              <div className="setting-description">
                Minimum confidence required for trait suggestions (higher = fewer but more confident suggestions)
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Minimum Evidence Required</div>
            <div className="setting-control">
              <div className="number-input-container">
                <button 
                  className="number-decrement"
                  onClick={() => updateBayesianSetting('minEvidenceRequired', Math.max(1, bayesianSettings.minEvidenceRequired - 1))}
                  disabled={bayesianSettings.minEvidenceRequired <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={bayesianSettings.minEvidenceRequired}
                  onChange={(e) => updateBayesianSetting('minEvidenceRequired', Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                  className="number-input"
                />
                <button 
                  className="number-increment"
                  onClick={() => updateBayesianSetting('minEvidenceRequired', Math.min(5, bayesianSettings.minEvidenceRequired + 1))}
                  disabled={bayesianSettings.minEvidenceRequired >= 5}
                >
                  +
                </button>
              </div>
              <div className="setting-description">
                Number of traits that must be defined before suggestions are generated
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Maximum Suggestions</div>
            <div className="setting-control">
              <div className="number-input-container">
                <button 
                  className="number-decrement"
                  onClick={() => updateBayesianSetting('maxSuggestions', Math.max(1, bayesianSettings.maxSuggestions - 1))}
                  disabled={bayesianSettings.maxSuggestions <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bayesianSettings.maxSuggestions}
                  onChange={(e) => updateBayesianSetting('maxSuggestions', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="number-input"
                />
                <button 
                  className="number-increment"
                  onClick={() => updateBayesianSetting('maxSuggestions', Math.min(10, bayesianSettings.maxSuggestions + 1))}
                  disabled={bayesianSettings.maxSuggestions >= 10}
                >
                  +
                </button>
              </div>
              <div className="setting-description">
                Maximum number of suggestions to show for each trait category
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Suggestions Aggressiveness</div>
            <div className="setting-control">
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={bayesianSettings.suggestionsAggressiveness}
                  onChange={(e) => updateBayesianSetting('suggestionsAggressiveness', parseFloat(e.target.value))}
                  className="form-range"
                />
                <div className="slider-labels">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
                <div className="slider-value">{Math.round(bayesianSettings.suggestionsAggressiveness * 100)}%</div>
              </div>
              <div className="setting-description">
                How aggressively the algorithm suggests traits (higher = more speculative suggestions)
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Autocomplete</h3>
          
          <div className="setting-item">
            <div className="setting-label">Enable Autocomplete</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={bayesianSettings.enableAutoComplete}
                  onChange={(e) => updateBayesianSetting('enableAutoComplete', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Allow the algorithm to automatically complete character profiles based on existing traits
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render network visualization settings section
  const renderNetworkSection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">Network Visualization Settings</h2>
        <p className="section-description">
          Configure how character relationships are displayed in the network view.
        </p>
        
        <div className="setting-group">
          <h3 className="group-title">Layout</h3>
          
          <div className="setting-item">
            <div className="setting-label">Default Layout</div>
            <div className="setting-control">
              <select
                value={networkSettings.defaultLayout}
                onChange={(e) => updateNetworkSetting('defaultLayout', e.target.value)}
                className="form-select"
              >
                <option value="standard">Standard</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="circular">Circular</option>
              </select>
              <div className="setting-description">
                How characters and relationships are arranged in the network view
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Node Size</div>
            <div className="setting-control">
              <div className="slider-container">
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={networkSettings.nodeSize}
                  onChange={(e) => updateNetworkSetting('nodeSize', parseInt(e.target.value))}
                  className="form-range"
                />
                <div className="slider-value">{networkSettings.nodeSize}px</div>
              </div>
              <div className="setting-description">
                Base size of character nodes in the network
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Edge Width</div>
            <div className="setting-control">
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={networkSettings.edgeWidth}
                  onChange={(e) => updateNetworkSetting('edgeWidth', parseFloat(e.target.value))}
                  className="form-range"
                />
                <div className="slider-value">{networkSettings.edgeWidth}px</div>
              </div>
              <div className="setting-description">
                Base width of relationship connections in the network
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Animation Speed</div>
            <div className="setting-control">
              <div className="slider-container">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={networkSettings.animationSpeed}
                  onChange={(e) => updateNetworkSetting('animationSpeed', parseFloat(e.target.value))}
                  className="form-range"
                />
                <div className="slider-labels">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
                <div className="slider-value">{Math.round(networkSettings.animationSpeed * 100)}%</div>
              </div>
              <div className="setting-description">
                Speed of network animations and transitions
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Display Options</h3>
          
          <div className="setting-item">
            <div className="setting-label">Enable Physics</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={networkSettings.physicsEnabled}
                  onChange={(e) => updateNetworkSetting('physicsEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Enable interactive physics simulation for network nodes
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Show Labels</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={networkSettings.showLabels}
                  onChange={(e) => updateNetworkSetting('showLabels', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Display character names on network nodes
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Show Images</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={networkSettings.showImages}
                  onChange={(e) => updateNetworkSetting('showImages', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Display character profile images on network nodes
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Cluster by Default</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={networkSettings.clusterByDefault}
                  onChange={(e) => updateNetworkSetting('clusterByDefault', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Automatically group characters by social role in the network view
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render form settings section
  const renderFormSection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">Form Settings</h2>
        <p className="section-description">
          Configure character creation and editing form behavior.
        </p>
        
        <div className="setting-group">
          <h3 className="group-title">Auto-Save</h3>
          
          <div className="setting-item">
            <div className="setting-label">Auto-Save Drafts</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formSettings.autoSaveDrafts}
                  onChange={(e) => updateFormSetting('autoSaveDrafts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Automatically save character drafts while editing
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Auto-Save Interval</div>
            <div className="setting-control">
              <div className="slider-container">
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={formSettings.autoSaveInterval}
                  onChange={(e) => updateFormSetting('autoSaveInterval', parseInt(e.target.value))}
                  className="form-range"
                  disabled={!formSettings.autoSaveDrafts}
                />
                <div className="slider-value">{formSettings.autoSaveInterval} seconds</div>
              </div>
              <div className="setting-description">
                How often drafts are automatically saved
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Form Behavior</h3>
          
          <div className="setting-item">
            <div className="setting-label">Confirm Before Exit</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formSettings.confirmBeforeExit}
                  onChange={(e) => updateFormSetting('confirmBeforeExit', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Show confirmation dialog when leaving a form with unsaved changes
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Show Suggestions</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formSettings.showSuggestions}
                  onChange={(e) => updateFormSetting('showSuggestions', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Show trait suggestions based on existing character data
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Default Values</h3>
          
          <div className="setting-item">
            <div className="setting-label">Default Social Role</div>
            <div className="setting-control">
              <select
                value={formSettings.defaultSocialRole}
                onChange={(e) => updateFormSetting('defaultSocialRole', e.target.value)}
                className="form-select"
              >
                <option value="Leader">Leader</option>
                <option value="Follower">Follower</option>
                <option value="Connector">Connector</option>
                <option value="Outlier">Outlier</option>
                <option value="Gatekeeper">Gatekeeper</option>
                <option value="Mediator">Mediator</option>
              </select>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Default Attachment Style</div>
            <div className="setting-control">
              <select
                value={formSettings.defaultAttachmentStyle}
                onChange={(e) => updateFormSetting('defaultAttachmentStyle', e.target.value)}
                className="form-select"
              >
                <option value="Secure">Secure</option>
                <option value="Anxious">Anxious</option>
                <option value="Avoidant">Avoidant</option>
                <option value="Fearful-Avoidant">Fearful-Avoidant</option>
              </select>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Default Communication Style</div>
            <div className="setting-control">
              <select
                value={formSettings.defaultCommunicationStyle}
                onChange={(e) => updateFormSetting('defaultCommunicationStyle', e.target.value)}
                className="form-select"
              >
                <option value="Direct">Direct</option>
                <option value="Indirect">Indirect</option>
                <option value="Reserved">Reserved</option>
                <option value="Analytical">Analytical</option>
                <option value="Emotional">Emotional</option>
                <option value="Functional">Functional</option>
                <option value="Personal">Personal</option>
                <option value="Intuitive">Intuitive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render privacy settings section
  const renderPrivacySection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">Privacy Settings</h2>
        <p className="section-description">
          Configure how your data is stored and managed.
        </p>
        
        <div className="setting-group">
          <h3 className="group-title">Data Storage</h3>
          
          <div className="setting-item">
            <div className="setting-label">Store Data Locally</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.storeDataLocally}
                  onChange={(e) => updatePrivacySetting('storeDataLocally', e.target.checked)}
                  disabled={true} // Currently only local storage is supported
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Store all data in your browser's local storage (currently the only option)
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Enable Encryption</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.enableEncryption}
                  onChange={(e) => updatePrivacySetting('enableEncryption', e.target.checked)}
                  disabled={true} // Not yet implemented
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Encrypt stored data with a password (coming soon)
              </div>
            </div>
          </div>
          
          {privacySettings.enableEncryption && (
            <div className="setting-item">
              <div className="setting-label">Encryption Key</div>
              <div className="setting-control">
                <input
                  type="password"
                  value={privacySettings.encryptionKey}
                  onChange={(e) => updatePrivacySetting('encryptionKey', e.target.value)}
                  className="form-control"
                  placeholder="Enter encryption password"
                  disabled={true} // Not yet implemented
                />
                <div className="setting-description warning-text">
                  Important: If you lose this password, your data cannot be recovered
                </div>
              </div>
            </div>
          )}
          
          <div className="setting-item">
            <div className="setting-label">Auto-Delete Inactive Data</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.autoDeleteInactive}
                  onChange={(e) => updatePrivacySetting('autoDeleteInactive', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Automatically delete data after a period of inactivity
              </div>
            </div>
          </div>
          
          {privacySettings.autoDeleteInactive && (
            <div className="setting-item">
              <div className="setting-label">Inactivity Period</div>
              <div className="setting-control">
                <div className="slider-container">
                  <input
                    type="range"
                    min="30"
                    max="365"
                    step="30"
                    value={privacySettings.inactivityPeriod}
                    onChange={(e) => updatePrivacySetting('inactivityPeriod', parseInt(e.target.value))}
                    className="form-range"
                  />
                  <div className="slider-value">{privacySettings.inactivityPeriod} days</div>
                </div>
                <div className="setting-description">
                  How long before inactive data is automatically deleted
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Privacy Controls</h3>
          
          <div className="setting-item">
            <div className="setting-label">Enable Analytics</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.enableAnalytics}
                  onChange={(e) => updatePrivacySetting('enableAnalytics', e.target.checked)}
                  disabled={true} // Not yet implemented
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Allow anonymous usage data collection to improve the application (coming soon)
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Show Disclaimers</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.showDisclaimers}
                  onChange={(e) => updatePrivacySetting('showDisclaimers', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Show ethical usage disclaimers throughout the application
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Privacy Disclaimer</h3>
          <div className="disclaimer-box">
            <p>
              This application is designed for personal use to help individuals with social anxiety, memory difficulties, or autism spectrum disorders to better understand and navigate social relationships.
            </p>
            <p>
              <strong>Important:</strong> All data is stored locally in your browser. No data is transmitted to any server unless you explicitly export it.
            </p>
            <p>
              <strong>Ethical Usage:</strong> This tool should only be used with the knowledge and consent of the people whose profiles you create. Using this tool to manipulate or exploit others is unethical and potentially illegal.
            </p>
            <p>
              <strong>Data Security:</strong> Regular backups are recommended as browser storage can be cleared accidentally.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Render backup and restore section
  const renderBackupSection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">Backup & Restore</h2>
        <p className="section-description">
          Manage backups of your data to prevent loss.
        </p>
        
        <div className="setting-group">
          <h3 className="group-title">Manual Backup</h3>
          
          <div className="setting-item">
            <div className="setting-label">Create Backup</div>
            <div className="setting-control">
              <button 
                className="btn btn-primary"
                onClick={handleBackup}
              >
                Create Backup Now
              </button>
              <div className="setting-description">
                Create a complete backup of all data and settings
              </div>
              {lastBackupDate && (
                <div className="last-backup-info">
                  Last backup: {new Date(lastBackupDate).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Restore from Backup</div>
            <div className="setting-control">
              <button 
                className="btn btn-primary"
                onClick={handleRestore}
              >
                Restore from Backup
              </button>
              <input
                type="file"
                ref={backupFileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleBackupFileChange}
              />
              <div className="setting-description">
                Restore data and settings from a previous backup
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Automatic Backup</h3>
          
          <div className="setting-item">
            <div className="setting-label">Enable Auto-Backup</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={backupSettings.autoBackup}
                  onChange={(e) => updateBackupSetting('autoBackup', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Automatically create backups on a regular schedule
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Backup Interval</div>
            <div className="setting-control">
              <select
                value={backupSettings.backupInterval}
                onChange={(e) => updateBackupSetting('backupInterval', parseInt(e.target.value))}
                className="form-select"
                disabled={!backupSettings.autoBackup}
              >
                <option value="1">Daily</option>
                <option value="7">Weekly</option>
                <option value="14">Bi-weekly</option>
                <option value="30">Monthly</option>
              </select>
              <div className="setting-description">
                How often automatic backups are created
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Include Images</div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={backupSettings.includeImages}
                  onChange={(e) => updateBackupSetting('includeImages', e.target.checked)}
                  disabled={!backupSettings.autoBackup}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="setting-description">
                Include character images in backups (increases file size)
              </div>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Backup History</div>
            <div className="setting-control">
              <div className="number-input-container">
                <button 
                  className="number-decrement"
                  onClick={() => updateBackupSetting('backupHistory', Math.max(1, backupSettings.backupHistory - 1))}
                  disabled={backupSettings.backupHistory <= 1 || !backupSettings.autoBackup}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={backupSettings.backupHistory}
                  onChange={(e) => updateBackupSetting('backupHistory', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="number-input"
                  disabled={!backupSettings.autoBackup}
                />
                <button 
                  className="number-increment"
                  onClick={() => updateBackupSetting('backupHistory', Math.min(10, backupSettings.backupHistory + 1))}
                  disabled={backupSettings.backupHistory >= 10 || !backupSettings.autoBackup}
                >
                  +
                </button>
              </div>
              <div className="setting-description">
                Number of backup versions to keep
              </div>
            </div>
          </div>
        </div>
        
        <div className="setting-group">
          <h3 className="group-title">Backup Location</h3>
          
          <div className="setting-item">
            <div className="setting-label">Storage Location</div>
            <div className="setting-control">
              <select
                value={backupSettings.backupLocation}
                onChange={(e) => updateBackupSetting('backupLocation', e.target.value)}
                className="form-select"
              >
                <option value="local">Local Download</option>
                <option value="cloud" disabled>Cloud Storage (Coming Soon)</option>
              </select>
              <div className="setting-description">
                Where backup files are stored
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render about section
  const renderAboutSection = () => {
    return (
      <div className="settings-section">
        <h2 className="section-title">About</h2>
        
        <div className="about-container">
          <div className="app-logo">
            <span className="logo-text">SocialProfiler</span>
          </div>
          
          <div className="app-version">
            <span className="version-label">Version:</span>
            <span className="version-number">1.0.0</span>
          </div>
          
          <div className="app-description">
            <p>
              SocialProfiler is a tool designed to help individuals with social anxiety, memory difficulties, or autism spectrum disorders to better understand and navigate social relationships.
            </p>
            <p>
              The application uses a Bayesian inference algorithm to analyze and predict personality traits and behavioral patterns based on observed characteristics.
            </p>
          </div>
          
          <div className="app-disclaimer">
            <h3>Important Disclaimer</h3>
            <p>
              This application is intended for personal use as a memory aid and social learning tool. It should be used ethically and responsibly.
            </p>
            <p>
              <strong>Ethical Usage:</strong> Always obtain consent before creating profiles of real individuals. This tool is designed to help you better understand and remember important details about people you know, not to manipulate or exploit them.
            </p>
            <p>
              <strong>Privacy:</strong> All data is stored locally in your browser. No data is transmitted to any server unless you explicitly export it.
            </p>
            <p>
              <strong>Not a Diagnostic Tool:</strong> This application is not a diagnostic tool and should not be used to diagnose or treat any medical or psychological condition.
            </p>
          </div>
          
          <div className="app-credits">
            <h3>Credits</h3>
            <p>
              Created as a tool to assist individuals with social challenges in navigating interpersonal relationships.
            </p>
            <p>
              Powered by a custom Bayesian inference algorithm designed to model human personality traits and behavioral patterns.
            </p>
          </div>
          
          <div className="app-license">
            <h3>License</h3>
            <p>
              © {new Date().getFullYear()} SocialProfiler
            </p>
            <p>
              All rights reserved. This application is for personal use only.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Render active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSection();
      case 'bayesian':
        return renderBayesianSection();
      case 'network':
        return renderNetworkSection();
      case 'form':
        return renderFormSection();
      case 'privacy':
        return renderPrivacySection();
      case 'backup':
        return renderBackupSection();
      case 'about':
        return renderAboutSection();
      default:
        return renderGeneralSection();
    }
  };
  
  return (
    <div className="settings-container">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="text-secondary">
          Configure application behavior and manage your data
        </p>
      </div>
      
      <div className="settings-content">
        {renderSectionNav()}
        
        <div className="settings-panel">
          {renderActiveSection()}
        </div>
      </div>
      
      {renderConfirmResetModal()}
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileChange}
      />
      
      <input
        type="file"
        ref={backupFileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleBackupFileChange}
      />
      
      {/* Backup success notification */}
      {showBackupSuccess && (
        <div className="backup-success-notification">
          <div className="success-icon">✓</div>
          <div className="success-message">Backup created successfully</div>
        </div>
      )}
    </div>
  );
};

export default Settings;
