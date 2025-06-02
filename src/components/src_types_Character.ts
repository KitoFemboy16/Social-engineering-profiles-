import { v4 as uuidv4 } from 'uuid';

// ==========================================
// Basic Character Information
// ==========================================

export interface BasicInfo {
  id: string;
  name: string;
  alias?: string;
  dateOfBirth?: Date;
  country?: string;
  city?: string;
  imageUrl?: string;
  avatarConfig?: AvatarConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvatarConfig {
  hairStyle: string;
  hairColor: string;
  faceShape: string;
  eyeColor: string;
  skinTone: string;
  facialFeatures: string[];
  accessories: string[];
}

// ==========================================
// Psychological Profile
// ==========================================

export enum IntroversionExtroversion {
  HIGHLY_INTROVERTED = "Highly Introverted",
  INTROVERTED = "Introverted",
  AMBIVERT = "Ambivert",
  EXTROVERTED = "Extroverted",
  HIGHLY_EXTROVERTED = "Highly Extroverted"
}

export enum AttachmentStyle {
  SECURE = "Secure",
  ANXIOUS = "Anxious",
  AVOIDANT = "Avoidant",
  FEARFUL_AVOIDANT = "Fearful-Avoidant"
}

export enum TrustLevel {
  HIGHLY_SKEPTICAL = "Highly Skeptical",
  SKEPTICAL = "Skeptical",
  NEUTRAL = "Neutral",
  TRUSTING = "Trusting",
  HIGHLY_TRUSTING = "Highly Trusting"
}

export interface Vulnerability {
  type: string;
  probability: number;
}

export interface PsychologicalProfile {
  introversionExtroversion: IntroversionExtroversion;
  attachmentStyle: AttachmentStyle;
  trustLevel: TrustLevel;
  likelyVulnerabilities: Vulnerability[];
  mirroringStrategy?: string;
  selfDisclosureLevel?: number; // 0-1 scale
  confidenceLevel?: number; // 0-1 scale
}

// ==========================================
// Social Hierarchy Position
// ==========================================

export enum SocialRole {
  LEADER = "Leader",
  FOLLOWER = "Follower",
  CONNECTOR = "Connector",
  OUTLIER = "Outlier",
  GATEKEEPER = "Gatekeeper",
  MEDIATOR = "Mediator"
}

export interface SocialHierarchyPosition {
  role: SocialRole;
  influence: number; // 0-1 scale
  approvalDependency: number; // 0-1 scale
  bestTactic?: string;
  groupStatus?: string;
  dominanceLevel?: number; // 0-1 scale
  socialCapital?: number; // 0-1 scale
}

// ==========================================
// Motivations & Insecurities
// ==========================================

export interface MotivationFactor {
  type: string;
  strength: number; // 0-1 scale
}

export interface InsecurityFactor {
  type: string;
  strength: number; // 0-1 scale
}

export interface MotivationsInsecurities {
  desires: MotivationFactor[];
  fears: InsecurityFactor[];
  primaryMotivation?: string;
  secondaryMotivation?: string;
  hiddenMotivation?: string;
  coreInsecurity?: string;
}

// ==========================================
// Trust Signals & Vulnerability Markers
// ==========================================

export interface TrustTrigger {
  type: string;
  effectiveness: number; // 0-1 scale
}

export interface TrustSignalsVulnerabilityMarkers {
  triggers: TrustTrigger[];
  strategy?: string;
  vulnerabilityDisplayFrequency?: number; // 0-1 scale
  trustBuildingSpeed?: number; // 0-1 scale
  traumaResponsePatterns?: string[];
  boundaryStrength?: number; // 0-1 scale
}

// ==========================================
// Communication Style
// ==========================================

export enum CommunicationStyle {
  DIRECT = "Direct",
  INDIRECT = "Indirect",
  RESERVED = "Reserved",
  ANALYTICAL = "Analytical",
  EMOTIONAL = "Emotional",
  FUNCTIONAL = "Functional",
  PERSONAL = "Personal",
  INTUITIVE = "Intuitive"
}

export enum CommunicationChannel {
  VERBAL = "Verbal",
  WRITTEN = "Written",
  NONVERBAL = "Non-verbal",
  DIGITAL = "Digital"
}

export interface Communication {
  primaryStyle: CommunicationStyle;
  secondaryStyle?: CommunicationStyle;
  preferredChannels: CommunicationChannel[];
  braggingLikelihood?: number; // 0-1 scale
  preferredInput?: string;
  conflictStyle?: string;
  humorStyle?: string;
  disclosureDepth?: number; // 0-1 scale
}

// ==========================================
// Decision-Making Style
// ==========================================

export interface DecisionMaking {
  emotionVsLogic: number; // 0-1 scale (0 = purely logical, 1 = purely emotional)
  pacing: string;
  bestPersuasionTactic?: string;
  riskTolerance?: number; // 0-1 scale
  impulsivity?: number; // 0-1 scale
  groupInfluence?: number; // 0-1 scale (how much they're influenced by group decisions)
  decisionConfidence?: number; // 0-1 scale
}

// ==========================================
// Routine Patterns
// ==========================================

export interface DailyRoutine {
  time: string; // e.g., "08:00"
  activity: string;
  frequency: number; // 0-1 scale (likelihood of occurrence)
  location?: string;
}

export interface RoutinePatterns {
  dailyRoutines: DailyRoutine[];
  weeklyPatterns?: string[];
  predictability?: number; // 0-1 scale
  spontaneity?: number; // 0-1 scale
  stressResponse?: string;
  comfortActivities?: string[];
}

// ==========================================
// Loyalty Network
// ==========================================

export interface LoyaltyFactor {
  entity: string; // person, group, idea, etc.
  strength: number; // 0-1 scale
  type: string; // family, friend, ideology, etc.
}

export interface LoyaltyNetwork {
  primaryLoyalties: LoyaltyFactor[];
  conflictingLoyalties?: LoyaltyFactor[];
  loyaltyThreshold?: number; // 0-1 scale (how much is needed to gain loyalty)
  betrayalSensitivity?: number; // 0-1 scale
  inGroupOutGroupBias?: number; // 0-1 scale
}

// ==========================================
// Digital Footprint
// ==========================================

export enum DigitalPlatform {
  FACEBOOK = "Facebook",
  INSTAGRAM = "Instagram",
  TWITTER = "Twitter",
  LINKEDIN = "LinkedIn",
  REDDIT = "Reddit",
  TIKTOK = "TikTok",
  YOUTUBE = "YouTube",
  DISCORD = "Discord",
  TELEGRAM = "Telegram",
  WHATSAPP = "WhatsApp",
  OTHER = "Other"
}

export interface DigitalActivity {
  platform: DigitalPlatform;
  usageFrequency: number; // 0-1 scale
  contentType: string[];
  publicPrivate: number; // 0-1 scale (0 = very private, 1 = very public)
}

export interface DigitalFootprint {
  activities: DigitalActivity[];
  onlinePersona?: string;
  privacyConcern?: number; // 0-1 scale
  digitalLiteracy?: number; // 0-1 scale
  contentCreationFrequency?: number; // 0-1 scale
  responseTime?: number; // average response time in minutes
}

// ==========================================
// Identity Anchors
// ==========================================

export interface IdentityAnchor {
  type: string; // profession, hobby, belief, relationship, etc.
  centrality: number; // 0-1 scale (how central to identity)
  visibility: number; // 0-1 scale (how visible to others)
}

export interface IdentityAnchors {
  coreAnchors: IdentityAnchor[];
  aspirationalIdentities?: IdentityAnchor[];
  rejectedIdentities?: IdentityAnchor[];
  identityFlexibility?: number; // 0-1 scale
  selfAwareness?: number; // 0-1 scale
}

// ==========================================
// Character Relationships
// ==========================================

export enum RelationshipType {
  FAMILY = "Family",
  FRIEND = "Friend",
  ROMANTIC = "Romantic",
  PROFESSIONAL = "Professional",
  ACQUAINTANCE = "Acquaintance",
  RIVAL = "Rival",
  MENTOR = "Mentor",
  MENTEE = "Mentee",
  OTHER = "Other"
}

export enum RelationshipStrength {
  VERY_WEAK = "Very Weak",
  WEAK = "Weak",
  MODERATE = "Moderate",
  STRONG = "Strong",
  VERY_STRONG = "Very Strong"
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: RelationshipStrength;
  description?: string;
  startDate?: Date;
  influence?: number; // 0-1 scale (influence on the source)
  trust?: number; // 0-1 scale
  conflict?: number; // 0-1 scale
}

// ==========================================
// Complete Character
// ==========================================

export interface Character {
  basicInfo: BasicInfo;
  psychologicalProfile: PsychologicalProfile;
  socialHierarchyPosition: SocialHierarchyPosition;
  motivationsInsecurities: MotivationsInsecurities;
  trustSignalsVulnerabilityMarkers: TrustSignalsVulnerabilityMarkers;
  communication: Communication;
  decisionMaking: DecisionMaking;
  routinePatterns: RoutinePatterns;
  loyaltyNetwork: LoyaltyNetwork;
  digitalFootprint: DigitalFootprint;
  identityAnchors: IdentityAnchors;
  relationships?: Relationship[];
}

// ==========================================
// Bayesian Inference Types
// ==========================================

export interface PriorProbability {
  trait: string;
  category: string;
  probability: number;
}

export interface LikelihoodMultiplier {
  evidence: string;
  trait: string;
  multiplier: number;
}

export interface EvidenceVariable {
  trait: string;
  probability: number;
}

export interface BayesianInference {
  priors: PriorProbability[];
  likelihoods: LikelihoodMultiplier[];
  evidence: EvidenceVariable[];
  posteriors: Map<string, Map<string, number>>;
}

export interface InferenceResult {
  category: string;
  traits: {
    [trait: string]: number;
  };
  recommendedTrait: string;
  confidence: number;
}

// ==========================================
// Network Graph Types
// ==========================================

export interface NetworkNode {
  id: string;
  label: string;
  title?: string;
  group?: string;
  shape?: string;
  image?: string;
  size?: number;
}

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  title?: string;
  width?: number;
  dashes?: boolean;
  arrows?: string;
  color?: string;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// ==========================================
// Factory Functions
// ==========================================

export const createNewCharacter = (): Character => {
  return {
    basicInfo: {
      id: uuidv4(),
      name: "",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    psychologicalProfile: {
      introversionExtroversion: IntroversionExtroversion.AMBIVERT,
      attachmentStyle: AttachmentStyle.SECURE,
      trustLevel: TrustLevel.NEUTRAL,
      likelyVulnerabilities: []
    },
    socialHierarchyPosition: {
      role: SocialRole.FOLLOWER,
      influence: 0.5,
      approvalDependency: 0.5
    },
    motivationsInsecurities: {
      desires: [],
      fears: []
    },
    trustSignalsVulnerabilityMarkers: {
      triggers: []
    },
    communication: {
      primaryStyle: CommunicationStyle.DIRECT,
      preferredChannels: [CommunicationChannel.VERBAL]
    },
    decisionMaking: {
      emotionVsLogic: 0.5,
      pacing: "Moderate"
    },
    routinePatterns: {
      dailyRoutines: []
    },
    loyaltyNetwork: {
      primaryLoyalties: []
    },
    digitalFootprint: {
      activities: []
    },
    identityAnchors: {
      coreAnchors: []
    }
  };
};
