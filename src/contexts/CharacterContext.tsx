import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  Character, 
  Relationship, 
  createNewCharacter, 
  NetworkGraph, 
  NetworkNode, 
  NetworkEdge,
  EvidenceVariable
} from '../types/Character';
import BayesianInference from '../services/BayesianInference';

// ==========================================
// Context Types
// ==========================================

interface CharacterState {
  characters: Character[];
  relationships: Relationship[];
  selectedCharacterId: string | null;
  networkGraph: NetworkGraph | null;
  theme: 'dark' | 'light';
  uiState: {
    isFormOpen: boolean;
    isNetworkViewActive: boolean;
    isLoading: boolean;
    notification: {
      show: boolean;
      message: string;
      type: 'success' | 'error' | 'info';
    };
  };
}

type CharacterAction = 
  | { type: 'ADD_CHARACTER'; character: Character }
  | { type: 'UPDATE_CHARACTER'; character: Character }
  | { type: 'DELETE_CHARACTER'; characterId: string }
  | { type: 'SELECT_CHARACTER'; characterId: string | null }
  | { type: 'ADD_RELATIONSHIP'; relationship: Relationship }
  | { type: 'UPDATE_RELATIONSHIP'; relationship: Relationship }
  | { type: 'DELETE_RELATIONSHIP'; relationshipId: string }
  | { type: 'SET_CHARACTERS'; characters: Character[] }
  | { type: 'SET_RELATIONSHIPS'; relationships: Relationship[] }
  | { type: 'GENERATE_NETWORK_GRAPH' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_UI_STATE'; uiState: Partial<CharacterState['uiState']> }
  | { type: 'AUTOCOMPLETE_CHARACTER'; characterId: string }
  | { type: 'IMPORT_DATA'; data: { characters: Character[]; relationships: Relationship[] } }
  | { type: 'RESET_STATE' };

interface CharacterContextType extends CharacterState {
  addCharacter: (character: Omit<Character, 'basicInfo'> & { basicInfo: Partial<Character['basicInfo']> }) => void;
  updateCharacter: (character: Character) => void;
  deleteCharacter: (characterId: string) => void;
  selectCharacter: (characterId: string | null) => void;
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  updateRelationship: (relationship: Relationship) => void;
  deleteRelationship: (relationshipId: string) => void;
  generateNetworkGraph: () => void;
  toggleTheme: () => void;
  setUIState: (uiState: Partial<CharacterState['uiState']>) => void;
  autocompleteCharacter: (characterId: string) => void;
  getSuggestedTraits: (characterId: string, category: string, count?: number) => { trait: string; probability: number }[];
  calculateCompatibility: (character1Id: string, character2Id: string) => number;
  generateRapportStrategy: (characterId: string) => string[];
  exportData: () => string;
  importData: (jsonData: string) => void;
  resetState: () => void;
}

// ==========================================
// Initial State
// ==========================================

const initialState: CharacterState = {
  characters: [],
  relationships: [],
  selectedCharacterId: null,
  networkGraph: null,
  theme: 'dark', // Default to dark theme for Black Mirror aesthetic
  uiState: {
    isFormOpen: false,
    isNetworkViewActive: false,
    isLoading: false,
    notification: {
      show: false,
      message: '',
      type: 'info'
    }
  }
};

// ==========================================
// Context Creation
// ==========================================

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

// ==========================================
// Reducer
// ==========================================

function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
  switch (action.type) {
    case 'ADD_CHARACTER':
      return {
        ...state,
        characters: [...state.characters, action.character]
      };
    
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map(character => 
          character.basicInfo.id === action.character.basicInfo.id ? action.character : character
        )
      };
    
    case 'DELETE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter(character => character.basicInfo.id !== action.characterId),
        relationships: state.relationships.filter(
          relationship => relationship.sourceId !== action.characterId && relationship.targetId !== action.characterId
        ),
        selectedCharacterId: state.selectedCharacterId === action.characterId ? null : state.selectedCharacterId
      };
    
    case 'SELECT_CHARACTER':
      return {
        ...state,
        selectedCharacterId: action.characterId
      };
    
    case 'ADD_RELATIONSHIP':
      return {
        ...state,
        relationships: [...state.relationships, action.relationship]
      };
    
    case 'UPDATE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.map(relationship => 
          relationship.id === action.relationship.id ? action.relationship : relationship
        )
      };
    
    case 'DELETE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.filter(relationship => relationship.id !== action.relationshipId)
      };
    
    case 'SET_CHARACTERS':
      return {
        ...state,
        characters: action.characters
      };
    
    case 'SET_RELATIONSHIPS':
      return {
        ...state,
        relationships: action.relationships
      };
    
    case 'GENERATE_NETWORK_GRAPH':
      const nodes: NetworkNode[] = state.characters.map(character => ({
        id: character.basicInfo.id,
        label: character.basicInfo.name || character.basicInfo.alias || 'Unknown',
        title: `${character.basicInfo.name || character.basicInfo.alias || 'Unknown'}\n${character.psychologicalProfile.introversionExtroversion}`,
        group: character.socialHierarchyPosition.role,
        shape: 'circularImage',
        image: character.basicInfo.imageUrl || 'https://via.placeholder.com/150',
        size: 30 + (character.socialHierarchyPosition.influence * 20) // Size based on influence
      }));
      
      const edges: NetworkEdge[] = state.relationships.map(relationship => ({
        id: relationship.id,
        from: relationship.sourceId,
        to: relationship.targetId,
        label: relationship.type,
        title: relationship.description || relationship.type,
        width: 1 + (relationship.trust || 0.5) * 5, // Width based on trust
        arrows: 'to',
        color: getRelationshipColor(relationship.type)
      }));
      
      return {
        ...state,
        networkGraph: { nodes, edges }
      };
    
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark'
      };
    
    case 'SET_UI_STATE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          ...action.uiState
        }
      };
    
    case 'AUTOCOMPLETE_CHARACTER': {
      const character = state.characters.find(c => c.basicInfo.id === action.characterId);
      if (!character) return state;
      
      const completedCharacter = BayesianInference.autocompleteCharacter(character);
      
      return {
        ...state,
        characters: state.characters.map(c => 
          c.basicInfo.id === action.characterId ? completedCharacter : c
        )
      };
    }
    
    case 'IMPORT_DATA':
      return {
        ...state,
        characters: action.data.characters,
        relationships: action.data.relationships
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Helper function for network graph edge colors
function getRelationshipColor(type: string): string {
  switch (type) {
    case 'Family':
      return '#4CAF50'; // Green
    case 'Friend':
      return '#2196F3'; // Blue
    case 'Romantic':
      return '#E91E63'; // Pink
    case 'Professional':
      return '#FFC107'; // Amber
    case 'Rival':
      return '#F44336'; // Red
    case 'Mentor':
    case 'Mentee':
      return '#9C27B0'; // Purple
    default:
      return '#757575'; // Grey
  }
}

// ==========================================
// Context Provider
// ==========================================

interface CharacterProviderProps {
  children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const charactersJson = localStorage.getItem('characters');
        const relationshipsJson = localStorage.getItem('relationships');
        
        if (charactersJson) {
          const characters = JSON.parse(charactersJson);
          dispatch({ type: 'SET_CHARACTERS', characters });
        }
        
        if (relationshipsJson) {
          const relationships = JSON.parse(relationshipsJson);
          dispatch({ type: 'SET_RELATIONSHIPS', relationships });
        }
        
        // Load theme preference
        const theme = localStorage.getItem('theme');
        if (theme === 'light' || theme === 'dark') {
          if (theme !== state.theme) {
            dispatch({ type: 'TOGGLE_THEME' });
          }
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        dispatch({
          type: 'SET_UI_STATE',
          uiState: {
            notification: {
              show: true,
              message: 'Failed to load saved data',
              type: 'error'
            }
          }
        });
      }
    };
    
    loadFromLocalStorage();
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    const saveToLocalStorage = () => {
      try {
        localStorage.setItem('characters', JSON.stringify(state.characters));
        localStorage.setItem('relationships', JSON.stringify(state.relationships));
        localStorage.setItem('theme', state.theme);
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
        dispatch({
          type: 'SET_UI_STATE',
          uiState: {
            notification: {
              show: true,
              message: 'Failed to save data',
              type: 'error'
            }
          }
        });
      }
    };
    
    if (state.characters.length > 0 || state.relationships.length > 0) {
      saveToLocalStorage();
    }
  }, [state.characters, state.relationships, state.theme]);
  
  // Add a new character
  const addCharacter = (characterData: Omit<Character, 'basicInfo'> & { basicInfo: Partial<Character['basicInfo']> }) => {
    const newCharacter = createNewCharacter();
    
    // Merge the new character template with the provided data
    const mergedCharacter: Character = {
      ...newCharacter,
      ...characterData,
      basicInfo: {
        ...newCharacter.basicInfo,
        ...characterData.basicInfo,
        updatedAt: new Date()
      }
    };
    
    dispatch({ type: 'ADD_CHARACTER', character: mergedCharacter });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: `Character ${mergedCharacter.basicInfo.name || mergedCharacter.basicInfo.alias || 'Unknown'} created`,
          type: 'success'
        }
      }
    });
    
    return mergedCharacter;
  };
  
  // Update an existing character
  const updateCharacter = (character: Character) => {
    const updatedCharacter = {
      ...character,
      basicInfo: {
        ...character.basicInfo,
        updatedAt: new Date()
      }
    };
    
    dispatch({ type: 'UPDATE_CHARACTER', character: updatedCharacter });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: `Character ${updatedCharacter.basicInfo.name || updatedCharacter.basicInfo.alias || 'Unknown'} updated`,
          type: 'success'
        }
      }
    });
  };
  
  // Delete a character
  const deleteCharacter = (characterId: string) => {
    const character = state.characters.find(c => c.basicInfo.id === characterId);
    
    dispatch({ type: 'DELETE_CHARACTER', characterId });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: `Character ${character?.basicInfo.name || character?.basicInfo.alias || 'Unknown'} deleted`,
          type: 'info'
        }
      }
    });
  };
  
  // Select a character
  const selectCharacter = (characterId: string | null) => {
    dispatch({ type: 'SELECT_CHARACTER', characterId });
  };
  
  // Add a new relationship
  const addRelationship = (relationshipData: Omit<Relationship, 'id'>) => {
    // Generate a unique ID for the relationship
    const relationship: Relationship = {
      id: `rel_${Date.now()}`,
      ...relationshipData
    };
    
    dispatch({ type: 'ADD_RELATIONSHIP', relationship });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: 'Relationship created',
          type: 'success'
        }
      }
    });
    
    return relationship;
  };
  
  // Update an existing relationship
  const updateRelationship = (relationship: Relationship) => {
    dispatch({ type: 'UPDATE_RELATIONSHIP', relationship });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: 'Relationship updated',
          type: 'success'
        }
      }
    });
  };
  
  // Delete a relationship
  const deleteRelationship = (relationshipId: string) => {
    dispatch({ type: 'DELETE_RELATIONSHIP', relationshipId });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: 'Relationship deleted',
          type: 'info'
        }
      }
    });
  };
  
  // Generate network graph
  const generateNetworkGraph = () => {
    dispatch({ type: 'GENERATE_NETWORK_GRAPH' });
  };
  
  // Toggle theme
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };
  
  // Set UI state
  const setUIState = (uiState: Partial<CharacterState['uiState']>) => {
    dispatch({ type: 'SET_UI_STATE', uiState });
  };
  
  // Autocomplete a character using Bayesian inference
  const autocompleteCharacter = (characterId: string) => {
    dispatch({ type: 'AUTOCOMPLETE_CHARACTER', characterId });
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: 'Character profile autocompleted',
          type: 'success'
        }
      }
    });
  };
  
  // Get suggested traits for a character
  const getSuggestedTraits = (characterId: string, category: string, count: number = 3) => {
    const character = state.characters.find(c => c.basicInfo.id === characterId);
    if (!character) return [];
    
    return BayesianInference.getSuggestedTraits(character, category, count);
  };
  
  // Calculate compatibility between two characters
  const calculateCompatibility = (character1Id: string, character2Id: string) => {
    const character1 = state.characters.find(c => c.basicInfo.id === character1Id);
    const character2 = state.characters.find(c => c.basicInfo.id === character2Id);
    
    if (!character1 || !character2) return 0;
    
    return BayesianInference.calculateCompatibility(character1, character2);
  };
  
  // Generate rapport strategy for a character
  const generateRapportStrategy = (characterId: string) => {
    const character = state.characters.find(c => c.basicInfo.id === characterId);
    if (!character) return [];
    
    return BayesianInference.generateRapportStrategy(character);
  };
  
  // Export data as JSON
  const exportData = () => {
    const data = {
      characters: state.characters,
      relationships: state.relationships
    };
    
    return JSON.stringify(data, null, 2);
  };
  
  // Import data from JSON
  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.characters || !Array.isArray(data.characters) || 
          !data.relationships || !Array.isArray(data.relationships)) {
        throw new Error('Invalid data format');
      }
      
      dispatch({ type: 'IMPORT_DATA', data });
      dispatch({
        type: 'SET_UI_STATE',
        uiState: {
          notification: {
            show: true,
            message: 'Data imported successfully',
            type: 'success'
          }
        }
      });
    } catch (error) {
      console.error('Error importing data:', error);
      dispatch({
        type: 'SET_UI_STATE',
        uiState: {
          notification: {
            show: true,
            message: 'Failed to import data: Invalid format',
            type: 'error'
          }
        }
      });
    }
  };
  
  // Reset state
  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
    localStorage.removeItem('characters');
    localStorage.removeItem('relationships');
    
    dispatch({
      type: 'SET_UI_STATE',
      uiState: {
        notification: {
          show: true,
          message: 'All data has been reset',
          type: 'info'
        }
      }
    });
  };
  
  // Context value
  const value: CharacterContextType = {
    ...state,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    generateNetworkGraph,
    toggleTheme,
    setUIState,
    autocompleteCharacter,
    getSuggestedTraits,
    calculateCompatibility,
    generateRapportStrategy,
    exportData,
    importData,
    resetState
  };
  
  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// ==========================================
// Custom Hook
// ==========================================

export const useCharacters = () => {
  const context = useContext(CharacterContext);
  
  if (context === undefined) {
    throw new Error('useCharacters must be used within a CharacterProvider');
  }
  
  return context;
};

export default CharacterContext;
