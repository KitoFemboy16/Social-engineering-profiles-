import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, DataSet, Options, NodeOptions, EdgeOptions } from 'vis-network';
import { useCharacters } from '../contexts/CharacterContext';
import { 
  Character, 
  Relationship, 
  SocialRole, 
  IntroversionExtroversion,
  AttachmentStyle,
  RelationshipType,
  RelationshipStrength,
  NetworkNode,
  NetworkEdge
} from '../types/Character';

// Network view component that visualizes character relationships
const NetworkView: React.FC = () => {
  const { 
    characters, 
    relationships, 
    networkGraph, 
    generateNetworkGraph, 
    selectCharacter,
    setUIState
  } = useCharacters();
  
  const navigate = useNavigate();
  const networkContainer = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  
  // State for filtering and visualization options
  const [filters, setFilters] = useState({
    relationshipTypes: Object.values(RelationshipType).reduce((acc, type) => {
      acc[type] = true;
      return acc;
    }, {} as Record<string, boolean>),
    socialRoles: Object.values(SocialRole).reduce((acc, role) => {
      acc[role] = true;
      return acc;
    }, {} as Record<string, boolean>),
    minRelationshipStrength: RelationshipStrength.VERY_WEAK,
    showLabels: true,
    showImages: true,
    clusterByRole: false,
    physicsEnabled: true
  });
  
  // State for network visualization options
  const [networkOptions, setNetworkOptions] = useState({
    layout: 'standard', // standard, hierarchical, circular
    nodeSize: 30, // base node size
    edgeWidth: 2, // base edge width
    nodeDistance: 150, // distance between nodes
    springLength: 150, // spring length for physics
    springConstant: 0.05, // spring constant for physics
    stabilization: true // whether to stabilize the network on load
  });
  
  // State for UI controls
  const [showControls, setShowControls] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Generate network data if not already available
  useEffect(() => {
    if (!networkGraph && characters.length > 0) {
      generateNetworkGraph();
    }
  }, [networkGraph, characters, generateNetworkGraph]);
  
  // Apply filters to create filtered network data
  const filteredNetworkData = useMemo(() => {
    if (!networkGraph) return { nodes: [], edges: [] };
    
    // Filter nodes based on social role
    const filteredNodes = networkGraph.nodes.filter(node => {
      const character = characters.find(c => c.basicInfo.id === node.id);
      if (!character) return false;
      
      return filters.socialRoles[character.socialHierarchyPosition.role];
    });
    
    // Get IDs of filtered nodes
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter edges based on relationship type and strength
    const filteredEdges = networkGraph.edges.filter(edge => {
      const relationship = relationships.find(r => r.id === edge.id);
      if (!relationship) return false;
      
      // Check if both nodes are in the filtered set
      if (!nodeIds.has(relationship.sourceId) || !nodeIds.has(relationship.targetId)) {
        return false;
      }
      
      // Check relationship type filter
      if (!filters.relationshipTypes[relationship.type]) {
        return false;
      }
      
      // Check relationship strength filter
      const strengthValues = {
        [RelationshipStrength.VERY_WEAK]: 1,
        [RelationshipStrength.WEAK]: 2,
        [RelationshipStrength.MODERATE]: 3,
        [RelationshipStrength.STRONG]: 4,
        [RelationshipStrength.VERY_STRONG]: 5
      };
      
      return strengthValues[relationship.strength] >= strengthValues[filters.minRelationshipStrength];
    });
    
    return { 
      nodes: filteredNodes,
      edges: filteredEdges
    };
  }, [networkGraph, characters, relationships, filters]);
  
  // Initialize and update network visualization
  useEffect(() => {
    if (!networkContainer.current || !filteredNetworkData.nodes.length) return;
    
    // Create datasets for nodes and edges
    const nodes = new DataSet<NodeOptions>(
      filteredNetworkData.nodes.map(node => {
        const character = characters.find(c => c.basicInfo.id === node.id);
        if (!character) return node;
        
        // Customize node appearance based on character traits
        return {
          ...node,
          label: filters.showLabels ? node.label : undefined,
          shape: filters.showImages ? 'circularImage' : 'dot',
          image: filters.showImages ? (character.basicInfo.imageUrl || getDefaultAvatar(character)) : undefined,
          size: getNodeSize(character),
          color: getNodeColor(character),
          borderWidth: 3,
          borderColor: getBorderColor(character),
          font: {
            color: 'rgba(255, 255, 255, 0.9)',
            size: 14,
            face: 'Roboto Mono',
            background: 'rgba(10, 10, 15, 0.7)'
          },
          title: generateNodeTooltip(character)
        };
      })
    );
    
    const edges = new DataSet<EdgeOptions>(
      filteredNetworkData.edges.map(edge => {
        const relationship = relationships.find(r => r.id === edge.id);
        if (!relationship) return edge;
        
        // Customize edge appearance based on relationship
        return {
          ...edge,
          width: getEdgeWidth(relationship),
          color: {
            color: getEdgeColor(relationship.type),
            highlight: '#FFFFFF',
            hover: '#FFFFFF'
          },
          dashes: relationship.type === RelationshipType.RIVAL,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.5
            }
          },
          font: {
            color: 'rgba(255, 255, 255, 0.7)',
            size: 12,
            background: 'rgba(10, 10, 15, 0.7)'
          },
          title: generateEdgeTooltip(relationship)
        };
      })
    );
    
    // Configure network options
    const options: Options = {
      nodes: {
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0, 229, 255, 0.2)',
          size: 10,
          x: 0,
          y: 0
        }
      },
      edges: {
        width: networkOptions.edgeWidth,
        selectionWidth: 2,
        smooth: {
          type: 'continuous',
          forceDirection: 'none',
          roundness: 0.5
        },
        shadow: {
          enabled: true,
          color: 'rgba(0, 0, 0, 0.5)',
          size: 5,
          x: 0,
          y: 0
        }
      },
      physics: {
        enabled: filters.physicsEnabled,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: networkOptions.springLength,
          springConstant: networkOptions.springConstant,
          damping: 0.09
        },
        stabilization: {
          enabled: networkOptions.stabilization,
          iterations: 1000,
          updateInterval: 100
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
        keyboard: {
          enabled: true,
          bindToWindow: false
        }
      },
      layout: {
        randomSeed: 42,
        improvedLayout: true,
        ...(networkOptions.layout === 'hierarchical' ? {
          hierarchical: {
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 150,
            nodeSpacing: 100
          }
        } : {}),
        ...(networkOptions.layout === 'circular' ? {
          improvedLayout: false
        } : {})
      },
      groups: {
        [SocialRole.LEADER]: {
          color: { background: '#E91E63', border: '#C2185B' }
        },
        [SocialRole.FOLLOWER]: {
          color: { background: '#2196F3', border: '#1976D2' }
        },
        [SocialRole.CONNECTOR]: {
          color: { background: '#4CAF50', border: '#388E3C' }
        },
        [SocialRole.OUTLIER]: {
          color: { background: '#9C27B0', border: '#7B1FA2' }
        },
        [SocialRole.GATEKEEPER]: {
          color: { background: '#FF9800', border: '#F57C00' }
        },
        [SocialRole.MEDIATOR]: {
          color: { background: '#00BCD4', border: '#0097A7' }
        }
      }
    };
    
    // Create network instance
    if (!networkInstance.current) {
      networkInstance.current = new Network(
        networkContainer.current,
        { nodes, edges },
        options
      );
      
      // Add event listeners
      networkInstance.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          // Node click
          const nodeId = params.nodes[0];
          setSelectedNode(nodeId as string);
          selectCharacter(nodeId as string);
          navigate(`/character/${nodeId}`);
        } else if (params.edges.length > 0) {
          // Edge click
          const edgeId = params.edges[0];
          setSelectedEdge(edgeId as string);
          
          // Show relationship details in a modal or sidebar
          const relationship = relationships.find(r => r.id === edgeId);
          if (relationship) {
            // Could show a modal with relationship details here
            console.log('Selected relationship:', relationship);
          }
        } else {
          // Background click
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      });
      
      // Add hover event for better UX
      networkInstance.current.on('hoverNode', (params) => {
        document.body.style.cursor = 'pointer';
      });
      
      networkInstance.current.on('blurNode', () => {
        document.body.style.cursor = 'default';
      });
      
      networkInstance.current.on('hoverEdge', () => {
        document.body.style.cursor = 'pointer';
      });
      
      networkInstance.current.on('blurEdge', () => {
        document.body.style.cursor = 'default';
      });
      
      // Stabilization events for loading indicator
      networkInstance.current.on('stabilizationProgress', (params) => {
        const progress = Math.round((params.iterations / params.total) * 100);
        setUIState({
          isLoading: true,
          notification: {
            show: true,
            message: `Stabilizing network: ${progress}%`,
            type: 'info'
          }
        });
      });
      
      networkInstance.current.on('stabilizationIterationsDone', () => {
        setUIState({
          isLoading: false,
          notification: {
            show: true,
            message: 'Network stabilized',
            type: 'success'
          }
        });
      });
    } else {
      // Update existing network
      networkInstance.current.setOptions(options);
      nodes.clear();
      edges.clear();
      nodes.add(filteredNetworkData.nodes.map(node => {
        const character = characters.find(c => c.basicInfo.id === node.id);
        if (!character) return node;
        
        return {
          ...node,
          label: filters.showLabels ? node.label : undefined,
          shape: filters.showImages ? 'circularImage' : 'dot',
          image: filters.showImages ? (character.basicInfo.imageUrl || getDefaultAvatar(character)) : undefined,
          size: getNodeSize(character),
          color: getNodeColor(character),
          borderWidth: 3,
          borderColor: getBorderColor(character),
          font: {
            color: 'rgba(255, 255, 255, 0.9)',
            size: 14,
            face: 'Roboto Mono',
            background: 'rgba(10, 10, 15, 0.7)'
          },
          title: generateNodeTooltip(character)
        };
      }));
      edges.add(filteredNetworkData.edges.map(edge => {
        const relationship = relationships.find(r => r.id === edge.id);
        if (!relationship) return edge;
        
        return {
          ...edge,
          width: getEdgeWidth(relationship),
          color: {
            color: getEdgeColor(relationship.type),
            highlight: '#FFFFFF',
            hover: '#FFFFFF'
          },
          dashes: relationship.type === RelationshipType.RIVAL,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.5
            }
          },
          font: {
            color: 'rgba(255, 255, 255, 0.7)',
            size: 12,
            background: 'rgba(10, 10, 15, 0.7)'
          },
          title: generateEdgeTooltip(relationship)
        };
      }));
    }
    
    // Apply clustering if enabled
    if (filters.clusterByRole) {
      clusterByRole();
    }
    
    // Cleanup function
    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }
    };
  }, [
    filteredNetworkData, 
    characters, 
    relationships, 
    filters, 
    networkOptions, 
    navigate, 
    selectCharacter,
    setUIState
  ]);
  
  // Cluster nodes by social role
  const clusterByRole = () => {
    if (!networkInstance.current) return;
    
    // Clear any existing clusters
    networkInstance.current.openCluster();
    
    if (!filters.clusterByRole) return;
    
    // Group nodes by social role
    const roleGroups = characters.reduce((groups, character) => {
      const role = character.socialHierarchyPosition.role;
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(character.basicInfo.id);
      return groups;
    }, {} as Record<string, string[]>);
    
    // Create clusters for each role
    Object.entries(roleGroups).forEach(([role, nodeIds]) => {
      if (nodeIds.length < 2) return; // Don't cluster single nodes
      
      networkInstance.current?.cluster({
        joinCondition: (nodeOptions) => {
          return nodeIds.includes(nodeOptions.id as string);
        },
        clusterNodeProperties: {
          id: `cluster:${role}`,
          label: `${role} Cluster`,
          shape: 'dot',
          size: 40 + (nodeIds.length * 5),
          color: {
            background: getClusterColor(role as SocialRole),
            border: getBorderColorForRole(role as SocialRole)
          },
          borderWidth: 3,
          font: {
            size: 14,
            color: 'white'
          }
        },
        clusterEdgeProperties: {
          color: getEdgeColor(RelationshipType.OTHER),
          width: 2
        }
      });
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Handle relationship type filter toggle
  const handleRelationshipTypeToggle = (type: RelationshipType) => {
    setFilters(prev => ({
      ...prev,
      relationshipTypes: {
        ...prev.relationshipTypes,
        [type]: !prev.relationshipTypes[type]
      }
    }));
  };
  
  // Handle social role filter toggle
  const handleSocialRoleToggle = (role: SocialRole) => {
    setFilters(prev => ({
      ...prev,
      socialRoles: {
        ...prev.socialRoles,
        [role]: !prev.socialRoles[role]
      }
    }));
  };
  
  // Handle network option changes
  const handleNetworkOptionChange = (option: string, value: any) => {
    setNetworkOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // Handle export of the network
  const handleExportNetwork = () => {
    if (!networkInstance.current) return;
    
    setIsExporting(true);
    
    try {
      // Get network position data
      const positions = networkInstance.current.getPositions();
      
      // Create exportable data
      const exportData = {
        nodes: filteredNetworkData.nodes.map(node => ({
          ...node,
          x: positions[node.id]?.x,
          y: positions[node.id]?.y
        })),
        edges: filteredNetworkData.edges,
        options: networkOptions,
        filters
      };
      
      // Convert to JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create download link
      const exportFileName = `social-network-${new Date().toISOString().slice(0, 10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      setUIState({
        notification: {
          show: true,
          message: 'Network exported successfully',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error exporting network:', error);
      setUIState({
        notification: {
          show: true,
          message: 'Error exporting network',
          type: 'error'
        }
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle export as image
  const handleExportImage = () => {
    if (!networkInstance.current) return;
    
    setIsExporting(true);
    
    try {
      // Get network as canvas
      const canvas = networkInstance.current.canvas.frame.canvas;
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const exportFileName = `social-network-${new Date().toISOString().slice(0, 10)}.png`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUrl);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      setUIState({
        notification: {
          show: true,
          message: 'Network image exported successfully',
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error exporting network image:', error);
      setUIState({
        notification: {
          show: true,
          message: 'Error exporting network image',
          type: 'error'
        }
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle fit view
  const handleFitView = () => {
    if (!networkInstance.current) return;
    networkInstance.current.fit({
      animation: {
        duration: 1000,
        easingFunction: 'easeInOutQuad'
      }
    });
  };
  
  // Helper functions for node and edge styling
  
  // Get node size based on character influence
  const getNodeSize = (character: Character): number => {
    const baseSize = networkOptions.nodeSize;
    const influenceFactor = character.socialHierarchyPosition.influence;
    return baseSize + (influenceFactor * 20);
  };
  
  // Get node color based on character traits
  const getNodeColor = (character: Character): string => {
    // Base color from social role
    return getColorForRole(character.socialHierarchyPosition.role);
  };
  
  // Get border color based on attachment style
  const getBorderColor = (character: Character): string => {
    switch (character.psychologicalProfile.attachmentStyle) {
      case AttachmentStyle.SECURE:
        return '#4CAF50'; // Green
      case AttachmentStyle.ANXIOUS:
        return '#FFC107'; // Amber
      case AttachmentStyle.AVOIDANT:
        return '#2196F3'; // Blue
      case AttachmentStyle.FEARFUL_AVOIDANT:
        return '#F44336'; // Red
      default:
        return '#757575'; // Grey
    }
  };
  
  // Get edge width based on relationship strength
  const getEdgeWidth = (relationship: Relationship): number => {
    const baseWidth = networkOptions.edgeWidth;
    const strengthMultipliers = {
      [RelationshipStrength.VERY_WEAK]: 0.5,
      [RelationshipStrength.WEAK]: 0.75,
      [RelationshipStrength.MODERATE]: 1,
      [RelationshipStrength.STRONG]: 1.5,
      [RelationshipStrength.VERY_STRONG]: 2
    };
    
    return baseWidth * (strengthMultipliers[relationship.strength] || 1);
  };
  
  // Get edge color based on relationship type
  const getEdgeColor = (type: string): string => {
    switch (type) {
      case RelationshipType.FAMILY:
        return '#4CAF50'; // Green
      case RelationshipType.FRIEND:
        return '#2196F3'; // Blue
      case RelationshipType.ROMANTIC:
        return '#E91E63'; // Pink
      case RelationshipType.PROFESSIONAL:
        return '#FFC107'; // Amber
      case RelationshipType.ACQUAINTANCE:
        return '#9E9E9E'; // Grey
      case RelationshipType.RIVAL:
        return '#F44336'; // Red
      case RelationshipType.MENTOR:
        return '#9C27B0'; // Purple
      case RelationshipType.MENTEE:
        return '#673AB7'; // Deep Purple
      default:
        return '#757575'; // Grey
    }
  };
  
  // Get color for social role
  const getColorForRole = (role: SocialRole): string => {
    switch (role) {
      case SocialRole.LEADER:
        return '#E91E63'; // Pink
      case SocialRole.FOLLOWER:
        return '#2196F3'; // Blue
      case SocialRole.CONNECTOR:
        return '#4CAF50'; // Green
      case SocialRole.OUTLIER:
        return '#9C27B0'; // Purple
      case SocialRole.GATEKEEPER:
        return '#FF9800'; // Orange
      case SocialRole.MEDIATOR:
        return '#00BCD4'; // Cyan
      default:
        return '#757575'; // Grey
    }
  };
  
  // Get border color for role (slightly darker)
  const getBorderColorForRole = (role: SocialRole): string => {
    switch (role) {
      case SocialRole.LEADER:
        return '#C2185B'; // Darker Pink
      case SocialRole.FOLLOWER:
        return '#1976D2'; // Darker Blue
      case SocialRole.CONNECTOR:
        return '#388E3C'; // Darker Green
      case SocialRole.OUTLIER:
        return '#7B1FA2'; // Darker Purple
      case SocialRole.GATEKEEPER:
        return '#F57C00'; // Darker Orange
      case SocialRole.MEDIATOR:
        return '#0097A7'; // Darker Cyan
      default:
        return '#616161'; // Darker Grey
    }
  };
  
  // Get cluster color
  const getClusterColor = (role: SocialRole): string => {
    return getColorForRole(role);
  };
  
  // Generate default avatar based on character traits
  const getDefaultAvatar = (character: Character): string => {
    // Could generate a data URL for a simple SVG avatar
    // For now, return a placeholder
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(character.basicInfo.name || character.basicInfo.alias || 'Unknown')}&background=${getColorForRole(character.socialHierarchyPosition.role).replace('#', '')}&color=fff`;
  };
  
  // Generate HTML tooltip for node
  const generateNodeTooltip = (character: Character): string => {
    return `
      <div class="network-tooltip">
        <div class="tooltip-header">
          <strong>${character.basicInfo.name || character.basicInfo.alias || 'Unknown'}</strong>
        </div>
        <div class="tooltip-content">
          <div><span>Role:</span> ${character.socialHierarchyPosition.role}</div>
          <div><span>Personality:</span> ${character.psychologicalProfile.introversionExtroversion}</div>
          <div><span>Attachment:</span> ${character.psychologicalProfile.attachmentStyle}</div>
          <div><span>Communication:</span> ${character.communication.primaryStyle}</div>
        </div>
        <div class="tooltip-footer">Click for details</div>
      </div>
    `;
  };
  
  // Generate HTML tooltip for edge
  const generateEdgeTooltip = (relationship: Relationship): string => {
    const source = characters.find(c => c.basicInfo.id === relationship.sourceId);
    const target = characters.find(c => c.basicInfo.id === relationship.targetId);
    
    return `
      <div class="network-tooltip">
        <div class="tooltip-header">
          <strong>${relationship.type} Relationship</strong>
        </div>
        <div class="tooltip-content">
          <div><span>From:</span> ${source?.basicInfo.name || source?.basicInfo.alias || 'Unknown'}</div>
          <div><span>To:</span> ${target?.basicInfo.name || target?.basicInfo.alias || 'Unknown'}</div>
          <div><span>Strength:</span> ${relationship.strength}</div>
          ${relationship.description ? `<div><span>Description:</span> ${relationship.description}</div>` : ''}
        </div>
      </div>
    `;
  };
  
  // Render empty state
  const renderEmptyState = () => {
    return (
      <div className="empty-state">
        <h2>No Network Data</h2>
        <p>Create at least two characters and define relationships between them to visualize the network.</p>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/create')}
        >
          Create Character
        </button>
      </div>
    );
  };
  
  // Render network controls
  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <div className="network-controls card">
        <div className="card-header">
          <h3>Network Controls</h3>
          <button 
            className="btn btn-icon"
            onClick={() => setShowControls(false)}
            aria-label="Hide controls"
          >
            ×
          </button>
        </div>
        
        <div className="card-body">
          <div className="control-section">
            <h4>Relationship Types</h4>
            <div className="filter-toggles">
              {Object.values(RelationshipType).map(type => (
                <div key={type} className="filter-toggle">
                  <input
                    type="checkbox"
                    id={`relationship-${type}`}
                    checked={filters.relationshipTypes[type]}
                    onChange={() => handleRelationshipTypeToggle(type)}
                    className="form-check-input"
                  />
                  <label 
                    htmlFor={`relationship-${type}`}
                    className="form-check-label"
                    style={{ color: getEdgeColor(type) }}
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h4>Social Roles</h4>
            <div className="filter-toggles">
              {Object.values(SocialRole).map(role => (
                <div key={role} className="filter-toggle">
                  <input
                    type="checkbox"
                    id={`role-${role}`}
                    checked={filters.socialRoles[role]}
                    onChange={() => handleSocialRoleToggle(role)}
                    className="form-check-input"
                  />
                  <label 
                    htmlFor={`role-${role}`}
                    className="form-check-label"
                    style={{ color: getColorForRole(role) }}
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h4>Relationship Strength</h4>
            <select
              value={filters.minRelationshipStrength}
              onChange={(e) => handleFilterChange('minRelationshipStrength', e.target.value)}
              className="form-select"
            >
              {Object.values(RelationshipStrength).map(strength => (
                <option key={strength} value={strength}>
                  {strength} or stronger
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-section">
            <h4>Layout</h4>
            <select
              value={networkOptions.layout}
              onChange={(e) => handleNetworkOptionChange('layout', e.target.value)}
              className="form-select"
            >
              <option value="standard">Standard</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="circular">Circular</option>
            </select>
          </div>
          
          <div className="control-section">
            <h4>Display Options</h4>
            <div className="filter-toggles">
              <div className="filter-toggle">
                <input
                  type="checkbox"
                  id="show-labels"
                  checked={filters.showLabels}
                  onChange={() => handleFilterChange('showLabels', !filters.showLabels)}
                  className="form-check-input"
                />
                <label htmlFor="show-labels" className="form-check-label">
                  Show Labels
                </label>
              </div>
              
              <div className="filter-toggle">
                <input
                  type="checkbox"
                  id="show-images"
                  checked={filters.showImages}
                  onChange={() => handleFilterChange('showImages', !filters.showImages)}
                  className="form-check-input"
                />
                <label htmlFor="show-images" className="form-check-label">
                  Show Images
                </label>
              </div>
              
              <div className="filter-toggle">
                <input
                  type="checkbox"
                  id="cluster-by-role"
                  checked={filters.clusterByRole}
                  onChange={() => handleFilterChange('clusterByRole', !filters.clusterByRole)}
                  className="form-check-input"
                />
                <label htmlFor="cluster-by-role" className="form-check-label">
                  Cluster by Role
                </label>
              </div>
              
              <div className="filter-toggle">
                <input
                  type="checkbox"
                  id="physics-enabled"
                  checked={filters.physicsEnabled}
                  onChange={() => handleFilterChange('physicsEnabled', !filters.physicsEnabled)}
                  className="form-check-input"
                />
                <label htmlFor="physics-enabled" className="form-check-label">
                  Enable Physics
                </label>
              </div>
            </div>
          </div>
          
          <div className="control-section">
            <h4>Node Distance</h4>
            <div className="slider-container">
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={networkOptions.nodeDistance}
                onChange={(e) => handleNetworkOptionChange('nodeDistance', parseInt(e.target.value))}
                className="form-range"
              />
              <div className="slider-value">{networkOptions.nodeDistance}px</div>
            </div>
          </div>
          
          <div className="control-section">
            <h4>Node Size</h4>
            <div className="slider-container">
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={networkOptions.nodeSize}
                onChange={(e) => handleNetworkOptionChange('nodeSize', parseInt(e.target.value))}
                className="form-range"
              />
              <div className="slider-value">{networkOptions.nodeSize}px</div>
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <button 
            className="btn btn-primary"
            onClick={handleFitView}
          >
            Fit View
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleExportNetwork}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleExportImage}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Image'}
          </button>
        </div>
      </div>
    );
  };
  
  // Render legend
  const renderLegend = () => {
    if (!showLegend) return null;
    
    return (
      <div className="network-legend card">
        <div className="legend-header">
          <h4>Legend</h4>
          <button 
            className="btn btn-icon btn-sm"
            onClick={() => setShowLegend(false)}
            aria-label="Hide legend"
          >
            ×
          </button>
        </div>
        
        <div className="legend-section">
          <h5>Social Roles</h5>
          {Object.values(SocialRole).map(role => (
            <div key={role} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: getColorForRole(role) }}
              ></div>
              <div className="legend-label">{role}</div>
            </div>
          ))}
        </div>
        
        <div className="legend-section">
          <h5>Attachment Styles</h5>
          {Object.values(AttachmentStyle).map(style => (
            <div key={style} className="legend-item">
              <div 
                className="legend-color" 
                style={{ 
                  backgroundColor: 'transparent',
                  border: `2px solid ${getBorderColor({ psychologicalProfile: { attachmentStyle: style } } as Character)}`
                }}
              ></div>
              <div className="legend-label">{style}</div>
            </div>
          ))}
        </div>
        
        <div className="legend-section">
          <h5>Relationship Types</h5>
          {Object.values(RelationshipType).map(type => (
            <div key={type} className="legend-item">
              <div 
                className="legend-line" 
                style={{ 
                  backgroundColor: getEdgeColor(type),
                  height: '2px',
                  width: '20px',
                  ...(type === RelationshipType.RIVAL ? {
                    backgroundImage: 'linear-gradient(to right, transparent 50%, ' + getEdgeColor(type) + ' 50%)',
                    backgroundSize: '6px 100%'
                  } : {})
                }}
              ></div>
              <div className="legend-label">{type}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="network-view-container">
      <div className="page-header">
        <h1>Character Network</h1>
        <p className="text-secondary">
          Visualize relationships and connections between your characters.
        </p>
      </div>
      
      {characters.length < 2 ? (
        renderEmptyState()
      ) : (
        <div className="network-content">
          <div className="network-container" ref={networkContainer}>
            {/* Network will be rendered here by vis-network */}
          </div>
          
          {/* Toggle buttons for controls and legend */}
          <div className="network-toggles">
            {!showControls && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowControls(true)}
              >
                Show Controls
              </button>
            )}
            
            {!showLegend && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLegend(true)}
              >
                Show Legend
              </button>
            )}
          </div>
          
          {renderControls()}
          {renderLegend()}
        </div>
      )}
    </div>
  );
};

export default NetworkView;
