import {
  AttachmentStyle,
  BayesianInference,
  Character,
  CommunicationChannel,
  CommunicationStyle,
  EvidenceVariable,
  IdentityAnchor,
  InferenceResult,
  IntroversionExtroversion,
  LikelihoodMultiplier,
  PriorProbability,
  SocialRole,
  TrustLevel,
  Vulnerability
} from '../types/Character';

// ==========================================
// Prior Probabilities
// ==========================================

// These represent base rates in the general population
const PRIORS: PriorProbability[] = [
  // Psychological Profile Priors
  { trait: IntroversionExtroversion.HIGHLY_INTROVERTED, category: 'introversionExtroversion', probability: 0.10 },
  { trait: IntroversionExtroversion.INTROVERTED, category: 'introversionExtroversion', probability: 0.30 },
  { trait: IntroversionExtroversion.AMBIVERT, category: 'introversionExtroversion', probability: 0.40 },
  { trait: IntroversionExtroversion.EXTROVERTED, category: 'introversionExtroversion', probability: 0.15 },
  { trait: IntroversionExtroversion.HIGHLY_EXTROVERTED, category: 'introversionExtroversion', probability: 0.05 },

  { trait: AttachmentStyle.SECURE, category: 'attachmentStyle', probability: 0.55 },
  { trait: AttachmentStyle.ANXIOUS, category: 'attachmentStyle', probability: 0.20 },
  { trait: AttachmentStyle.AVOIDANT, category: 'attachmentStyle', probability: 0.20 },
  { trait: AttachmentStyle.FEARFUL_AVOIDANT, category: 'attachmentStyle', probability: 0.05 },

  { trait: TrustLevel.HIGHLY_SKEPTICAL, category: 'trustLevel', probability: 0.05 },
  { trait: TrustLevel.SKEPTICAL, category: 'trustLevel', probability: 0.25 },
  { trait: TrustLevel.NEUTRAL, category: 'trustLevel', probability: 0.40 },
  { trait: TrustLevel.TRUSTING, category: 'trustLevel', probability: 0.25 },
  { trait: TrustLevel.HIGHLY_TRUSTING, category: 'trustLevel', probability: 0.05 },

  // Vulnerabilities
  { trait: 'Fear of abandonment', category: 'vulnerabilities', probability: 0.15 },
  { trait: 'Need for validation', category: 'vulnerabilities', probability: 0.30 },
  { trait: 'Fear of rejection', category: 'vulnerabilities', probability: 0.25 },
  { trait: 'Overthinking', category: 'vulnerabilities', probability: 0.35 },
  { trait: 'Imposter syndrome', category: 'vulnerabilities', probability: 0.20 },
  { trait: 'Perfectionism', category: 'vulnerabilities', probability: 0.15 },
  { trait: 'Need for control', category: 'vulnerabilities', probability: 0.10 },
  { trait: 'Fear of failure', category: 'vulnerabilities', probability: 0.30 },
  { trait: 'Fear of intimacy', category: 'vulnerabilities', probability: 0.15 },
  { trait: 'Fear of conflict', category: 'vulnerabilities', probability: 0.25 },
  { trait: 'Need for reassurance', category: 'vulnerabilities', probability: 0.20 },
  { trait: 'Fear of being irrelevant', category: 'vulnerabilities', probability: 0.15 },

  // Social Hierarchy Position Priors
  { trait: SocialRole.LEADER, category: 'socialRole', probability: 0.10 },
  { trait: SocialRole.FOLLOWER, category: 'socialRole', probability: 0.50 },
  { trait: SocialRole.CONNECTOR, category: 'socialRole', probability: 0.15 },
  { trait: SocialRole.OUTLIER, category: 'socialRole', probability: 0.15 },
  { trait: SocialRole.GATEKEEPER, category: 'socialRole', probability: 0.05 },
  { trait: SocialRole.MEDIATOR, category: 'socialRole', probability: 0.05 },

  // Communication Style Priors
  { trait: CommunicationStyle.DIRECT, category: 'communicationStyle', probability: 0.20 },
  { trait: CommunicationStyle.INDIRECT, category: 'communicationStyle', probability: 0.25 },
  { trait: CommunicationStyle.RESERVED, category: 'communicationStyle', probability: 0.15 },
  { trait: CommunicationStyle.ANALYTICAL, category: 'communicationStyle', probability: 0.10 },
  { trait: CommunicationStyle.EMOTIONAL, category: 'communicationStyle', probability: 0.15 },
  { trait: CommunicationStyle.FUNCTIONAL, category: 'communicationStyle', probability: 0.05 },
  { trait: CommunicationStyle.PERSONAL, category: 'communicationStyle', probability: 0.05 },
  { trait: CommunicationStyle.INTUITIVE, category: 'communicationStyle', probability: 0.05 },

  // Communication Channel Priors
  { trait: CommunicationChannel.VERBAL, category: 'communicationChannel', probability: 0.40 },
  { trait: CommunicationChannel.WRITTEN, category: 'communicationChannel', probability: 0.20 },
  { trait: CommunicationChannel.NONVERBAL, category: 'communicationChannel', probability: 0.15 },
  { trait: CommunicationChannel.DIGITAL, category: 'communicationChannel', probability: 0.25 },

  // Motivations Priors
  { trait: 'Belonging', category: 'desires', probability: 0.30 },
  { trait: 'Achievement', category: 'desires', probability: 0.25 },
  { trait: 'Recognition', category: 'desires', probability: 0.15 },
  { trait: 'Power', category: 'desires', probability: 0.10 },
  { trait: 'Security', category: 'desires', probability: 0.20 },
  { trait: 'Freedom', category: 'desires', probability: 0.15 },
  { trait: 'Understanding', category: 'desires', probability: 0.10 },
  { trait: 'Being understood', category: 'desires', probability: 0.25 },
  { trait: 'Creativity', category: 'desires', probability: 0.10 },
  { trait: 'Harmony', category: 'desires', probability: 0.15 },
  { trait: 'Growth', category: 'desires', probability: 0.15 },
  { trait: 'Helping others', category: 'desires', probability: 0.10 },

  // Insecurities Priors
  { trait: 'Rejection', category: 'fears', probability: 0.30 },
  { trait: 'Failure', category: 'fears', probability: 0.25 },
  { trait: 'Abandonment', category: 'fears', probability: 0.15 },
  { trait: 'Inadequacy', category: 'fears', probability: 0.20 },
  { trait: 'Criticism', category: 'fears', probability: 0.15 },
  { trait: 'Being controlled', category: 'fears', probability: 0.10 },
  { trait: 'Being irrelevant', category: 'fears', probability: 0.15 },
  { trait: 'Uncertainty', category: 'fears', probability: 0.20 },
  { trait: 'Vulnerability', category: 'fears', probability: 0.15 },
  { trait: 'Conflict', category: 'fears', probability: 0.25 },
  { trait: 'Intimacy', category: 'fears', probability: 0.10 },
  { trait: 'Being misunderstood', category: 'fears', probability: 0.20 },

  // Trust Triggers Priors
  { trait: 'Shared interests', category: 'trustTriggers', probability: 0.25 },
  { trait: 'Vulnerability disclosure', category: 'trustTriggers', probability: 0.15 },
  { trait: 'Consistent behavior', category: 'trustTriggers', probability: 0.20 },
  { trait: 'Shared values', category: 'trustTriggers', probability: 0.15 },
  { trait: 'Active listening', category: 'trustTriggers', probability: 0.10 },
  { trait: 'Shared experiences', category: 'trustTriggers', probability: 0.20 },
  { trait: 'Relatability', category: 'trustTriggers', probability: 0.25 },
  { trait: 'Shared emotional language', category: 'trustTriggers', probability: 0.15 },
  { trait: 'Shared humor', category: 'trustTriggers', probability: 0.15 },
  { trait: 'Perceived competence', category: 'trustTriggers', probability: 0.10 },
  { trait: 'Shared adversity', category: 'trustTriggers', probability: 0.10 },
  { trait: 'Perceived authenticity', category: 'trustTriggers', probability: 0.20 },

  // Decision Making Priors
  { trait: 'Highly emotional', category: 'emotionVsLogic', probability: 0.10 },
  { trait: 'Moderately emotional', category: 'emotionVsLogic', probability: 0.25 },
  { trait: 'Balanced', category: 'emotionVsLogic', probability: 0.30 },
  { trait: 'Moderately logical', category: 'emotionVsLogic', probability: 0.25 },
  { trait: 'Highly logical', category: 'emotionVsLogic', probability: 0.10 },

  { trait: 'Very slow', category: 'decisionPacing', probability: 0.10 },
  { trait: 'Slow', category: 'decisionPacing', probability: 0.20 },
  { trait: 'Moderate', category: 'decisionPacing', probability: 0.40 },
  { trait: 'Fast', category: 'decisionPacing', probability: 0.20 },
  { trait: 'Very fast', category: 'decisionPacing', probability: 0.10 },

  // Identity Anchors Priors
  { trait: 'Professional role', category: 'identityAnchors', probability: 0.25 },
  { trait: 'Relationships', category: 'identityAnchors', probability: 0.20 },
  { trait: 'Beliefs/values', category: 'identityAnchors', probability: 0.15 },
  { trait: 'Skills/abilities', category: 'identityAnchors', probability: 0.15 },
  { trait: 'Group membership', category: 'identityAnchors', probability: 0.10 },
  { trait: 'Personal history', category: 'identityAnchors', probability: 0.10 },
  { trait: 'Physical attributes', category: 'identityAnchors', probability: 0.05 },
];

// ==========================================
// Likelihood Multipliers
// ==========================================

// These represent how much more/less likely a trait is given evidence
const LIKELIHOOD_MULTIPLIERS: LikelihoodMultiplier[] = [
  // Introverted/Extroverted Evidence Effects
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: AttachmentStyle.AVOIDANT, multiplier: 1.8 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: AttachmentStyle.FEARFUL_AVOIDANT, multiplier: 1.5 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: TrustLevel.SKEPTICAL, multiplier: 1.3 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: TrustLevel.HIGHLY_SKEPTICAL, multiplier: 1.4 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: 'Fear of rejection', multiplier: 1.5 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: 'Overthinking', multiplier: 1.7 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: SocialRole.OUTLIER, multiplier: 2.0 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: CommunicationStyle.RESERVED, multiplier: 2.2 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: CommunicationStyle.ANALYTICAL, multiplier: 1.6 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: CommunicationChannel.WRITTEN, multiplier: 1.8 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: 'Being misunderstood', multiplier: 1.5 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: 'Slow', multiplier: 1.6 },
  { evidence: IntroversionExtroversion.HIGHLY_INTROVERTED, trait: 'Very slow', multiplier: 1.4 },
  
  { evidence: IntroversionExtroversion.INTROVERTED, trait: AttachmentStyle.AVOIDANT, multiplier: 1.4 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: TrustLevel.SKEPTICAL, multiplier: 1.2 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: 'Overthinking', multiplier: 1.5 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: SocialRole.OUTLIER, multiplier: 1.5 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: CommunicationStyle.RESERVED, multiplier: 1.8 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: CommunicationStyle.ANALYTICAL, multiplier: 1.4 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: CommunicationChannel.WRITTEN, multiplier: 1.5 },
  { evidence: IntroversionExtroversion.INTROVERTED, trait: 'Slow', multiplier: 1.3 },
  
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: AttachmentStyle.SECURE, multiplier: 1.3 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: TrustLevel.TRUSTING, multiplier: 1.4 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: SocialRole.CONNECTOR, multiplier: 1.8 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: SocialRole.LEADER, multiplier: 1.5 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: CommunicationStyle.DIRECT, multiplier: 1.6 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: CommunicationStyle.EMOTIONAL, multiplier: 1.4 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: CommunicationChannel.VERBAL, multiplier: 1.7 },
  { evidence: IntroversionExtroversion.EXTROVERTED, trait: 'Fast', multiplier: 1.5 },
  
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: AttachmentStyle.SECURE, multiplier: 1.5 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: TrustLevel.TRUSTING, multiplier: 1.6 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: TrustLevel.HIGHLY_TRUSTING, multiplier: 1.8 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: SocialRole.CONNECTOR, multiplier: 2.0 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: SocialRole.LEADER, multiplier: 1.9 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: CommunicationStyle.DIRECT, multiplier: 1.8 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: CommunicationStyle.EMOTIONAL, multiplier: 1.7 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: CommunicationChannel.VERBAL, multiplier: 2.0 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: 'Recognition', multiplier: 1.7 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: 'Fast', multiplier: 1.6 },
  { evidence: IntroversionExtroversion.HIGHLY_EXTROVERTED, trait: 'Very fast', multiplier: 1.8 },
  
  // Attachment Style Evidence Effects
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Fear of abandonment', multiplier: 2.5 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Need for reassurance', multiplier: 2.2 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Fear of rejection', multiplier: 2.0 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Overthinking', multiplier: 1.8 },
  { evidence: AttachmentStyle.ANXIOUS, trait: CommunicationStyle.EMOTIONAL, multiplier: 1.7 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Belonging', multiplier: 1.9 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Being understood', multiplier: 1.8 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Vulnerability disclosure', multiplier: 1.6 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Highly emotional', multiplier: 1.7 },
  { evidence: AttachmentStyle.ANXIOUS, trait: 'Moderately emotional', multiplier: 1.5 },
  
  { evidence: AttachmentStyle.AVOIDANT, trait: 'Fear of intimacy', multiplier: 2.3 },
  { evidence: AttachmentStyle.AVOIDANT, trait: CommunicationStyle.RESERVED, multiplier: 1.9 },
  { evidence: AttachmentStyle.AVOIDANT, trait: 'Freedom', multiplier: 1.8 },
  { evidence: AttachmentStyle.AVOIDANT, trait: 'Being controlled', multiplier: 1.7 },
  { evidence: AttachmentStyle.AVOIDANT, trait: SocialRole.OUTLIER, multiplier: 1.6 },
  { evidence: AttachmentStyle.AVOIDANT, trait: 'Moderately logical', multiplier: 1.4 },
  { evidence: AttachmentStyle.AVOIDANT, trait: 'Highly logical', multiplier: 1.5 },
  
  { evidence: AttachmentStyle.FEARFUL_AVOIDANT, trait: 'Fear of abandonment', multiplier: 2.0 },
  { evidence: AttachmentStyle.FEARFUL_AVOIDANT, trait: 'Fear of intimacy', multiplier: 2.0 },
  { evidence: AttachmentStyle.FEARFUL_AVOIDANT, trait: 'Overthinking', multiplier: 2.1 },
  { evidence: AttachmentStyle.FEARFUL_AVOIDANT, trait: TrustLevel.HIGHLY_SKEPTICAL, multiplier: 1.9 },
  { evidence: AttachmentStyle.FEARFUL_AVOIDANT, trait: 'Vulnerability', multiplier: 1.8 },
  
  { evidence: AttachmentStyle.SECURE, trait: TrustLevel.TRUSTING, multiplier: 1.8 },
  { evidence: AttachmentStyle.SECURE, trait: 'Consistent behavior', multiplier: 1.6 },
  { evidence: AttachmentStyle.SECURE, trait: 'Balanced', multiplier: 1.7 },
  { evidence: AttachmentStyle.SECURE, trait: 'Moderate', multiplier: 1.5 },
  
  // Trust Level Evidence Effects
  { evidence: TrustLevel.HIGHLY_SKEPTICAL, trait: 'Fear of betrayal', multiplier: 2.2 },
  { evidence: TrustLevel.HIGHLY_SKEPTICAL, trait: CommunicationStyle.RESERVED, multiplier: 1.8 },
  { evidence: TrustLevel.HIGHLY_SKEPTICAL, trait: 'Perceived authenticity', multiplier: 0.5 }, // Negative effect
  
  { evidence: TrustLevel.TRUSTING, trait: 'Vulnerability disclosure', multiplier: 1.7 },
  { evidence: TrustLevel.TRUSTING, trait: 'Shared experiences', multiplier: 1.6 },
  
  // Social Role Evidence Effects
  { evidence: SocialRole.LEADER, trait: 'Power', multiplier: 2.0 },
  { evidence: SocialRole.LEADER, trait: 'Achievement', multiplier: 1.8 },
  { evidence: SocialRole.LEADER, trait: CommunicationStyle.DIRECT, multiplier: 1.7 },
  { evidence: SocialRole.LEADER, trait: 'Fast', multiplier: 1.6 },
  
  { evidence: SocialRole.FOLLOWER, trait: 'Security', multiplier: 1.6 },
  { evidence: SocialRole.FOLLOWER, trait: 'Belonging', multiplier: 1.5 },
  
  { evidence: SocialRole.CONNECTOR, trait: 'Relatability', multiplier: 1.9 },
  { evidence: SocialRole.CONNECTOR, trait: 'Shared interests', multiplier: 1.7 },
  { evidence: SocialRole.CONNECTOR, trait: CommunicationStyle.PERSONAL, multiplier: 1.8 },
  
  { evidence: SocialRole.OUTLIER, trait: 'Being misunderstood', multiplier: 1.8 },
  { evidence: SocialRole.OUTLIER, trait: 'Freedom', multiplier: 1.7 },
  { evidence: SocialRole.OUTLIER, trait: 'Being irrelevant', multiplier: 1.6 },
  
  // Communication Style Evidence Effects
  { evidence: CommunicationStyle.DIRECT, trait: 'Conflict', multiplier: 1.4 },
  { evidence: CommunicationStyle.DIRECT, trait: TrustLevel.TRUSTING, multiplier: 1.3 },
  
  { evidence: CommunicationStyle.INDIRECT, trait: 'Conflict', multiplier: 0.7 }, // Negative effect
  { evidence: CommunicationStyle.INDIRECT, trait: 'Fear of rejection', multiplier: 1.5 },
  
  { evidence: CommunicationStyle.RESERVED, trait: 'Being misunderstood', multiplier: 1.6 },
  { evidence: CommunicationStyle.RESERVED, trait: 'Vulnerability', multiplier: 1.5 },
  
  { evidence: CommunicationStyle.ANALYTICAL, trait: 'Highly logical', multiplier: 2.0 },
  { evidence: CommunicationStyle.ANALYTICAL, trait: 'Moderately logical', multiplier: 1.7 },
  
  { evidence: CommunicationStyle.EMOTIONAL, trait: 'Highly emotional', multiplier: 2.0 },
  { evidence: CommunicationStyle.EMOTIONAL, trait: 'Moderately emotional', multiplier: 1.7 },
  
  // Many more multipliers would be defined for a complete system...
];

// ==========================================
// Helper Functions
// ==========================================

/**
 * Gets the prior probability for a trait in a category
 */
function getPrior(trait: string, category: string): number {
  const prior = PRIORS.find(p => p.trait === trait && p.category === category);
  return prior ? prior.probability : 0.01; // Default to small probability if not found
}

/**
 * Gets all traits for a specific category
 */
function getTraitsForCategory(category: string): PriorProbability[] {
  return PRIORS.filter(p => p.category === category);
}

/**
 * Gets the likelihood multiplier for evidence affecting a trait
 */
function getLikelihoodMultiplier(evidence: string, trait: string): number {
  const multiplier = LIKELIHOOD_MULTIPLIERS.find(
    lm => lm.evidence === evidence && lm.trait === trait
  );
  return multiplier ? multiplier.multiplier : 1.0; // Default to no effect if not found
}

/**
 * Calculates the normalization factor for a category
 */
function calculateNormalizationFactor(
  category: string,
  evidence: EvidenceVariable[]
): number {
  const traits = getTraitsForCategory(category);
  let normalizationFactor = 0;
  
  for (const trait of traits) {
    let posterior = trait.probability;
    
    // Apply each piece of evidence
    for (const ev of evidence) {
      const multiplier = getLikelihoodMultiplier(ev.trait, trait.trait);
      posterior *= Math.pow(multiplier, ev.probability);
    }
    
    normalizationFactor += posterior;
  }
  
  return normalizationFactor;
}

/**
 * Calculates posterior probabilities for all traits in a category
 */
function calculatePosteriors(
  category: string,
  evidence: EvidenceVariable[]
): Map<string, number> {
  const traits = getTraitsForCategory(category);
  const normalizationFactor = calculateNormalizationFactor(category, evidence);
  const posteriors = new Map<string, number>();
  
  for (const trait of traits) {
    let posterior = trait.probability;
    
    // Apply each piece of evidence
    for (const ev of evidence) {
      const multiplier = getLikelihoodMultiplier(ev.trait, trait.trait);
      posterior *= Math.pow(multiplier, ev.probability);
    }
    
    // Normalize
    if (normalizationFactor > 0) {
      posterior /= normalizationFactor;
    }
    
    posteriors.set(trait.trait, posterior);
  }
  
  return posteriors;
}

/**
 * Finds the trait with the highest probability in a map
 */
function findHighestProbabilityTrait(posteriors: Map<string, number>): { trait: string, probability: number } {
  let highestTrait = '';
  let highestProbability = 0;
  
  posteriors.forEach((probability, trait) => {
    if (probability > highestProbability) {
      highestTrait = trait;
      highestProbability = probability;
    }
  });
  
  return { trait: highestTrait, probability: highestProbability };
}

/**
 * Calculates confidence based on the difference between the highest and second highest probabilities
 */
function calculateConfidence(posteriors: Map<string, number>): number {
  const probabilities = Array.from(posteriors.values()).sort((a, b) => b - a);
  
  if (probabilities.length <= 1) {
    return 1.0;
  }
  
  // Confidence is higher when the gap between highest and second highest is larger
  const gap = probabilities[0] - probabilities[1];
  
  // Normalize to 0-1 range
  return Math.min(1.0, Math.max(0.0, gap * 3)); // Multiplier can be adjusted
}

// ==========================================
// Main Inference Engine
// ==========================================

/**
 * Performs Bayesian inference to calculate trait probabilities based on evidence
 */
export function performInference(evidence: EvidenceVariable[]): BayesianInference {
  const posteriors = new Map<string, Map<string, number>>();
  
  // Calculate posteriors for each category
  const categories = Array.from(new Set(PRIORS.map(p => p.category)));
  
  for (const category of categories) {
    posteriors.set(category, calculatePosteriors(category, evidence));
  }
  
  return {
    priors: PRIORS,
    likelihoods: LIKELIHOOD_MULTIPLIERS,
    evidence,
    posteriors
  };
}

/**
 * Gets inference results for a specific category
 */
export function getInferenceResult(inference: BayesianInference, category: string): InferenceResult | null {
  const categoryPosteriors = inference.posteriors.get(category);
  
  if (!categoryPosteriors) {
    return null;
  }
  
  const { trait: recommendedTrait, probability } = findHighestProbabilityTrait(categoryPosteriors);
  const confidence = calculateConfidence(categoryPosteriors);
  
  // Convert Map to object for easier consumption
  const traitsObject: { [trait: string]: number } = {};
  categoryPosteriors.forEach((prob, trait) => {
    traitsObject[trait] = prob;
  });
  
  return {
    category,
    traits: traitsObject,
    recommendedTrait,
    confidence
  };
}

/**
 * Gets all inference results for all categories
 */
export function getAllInferenceResults(inference: BayesianInference): InferenceResult[] {
  const results: InferenceResult[] = [];
  
  inference.posteriors.forEach((_, category) => {
    const result = getInferenceResult(inference, category);
    if (result) {
      results.push(result);
    }
  });
  
  return results;
}

/**
 * Extracts evidence from a character's existing traits
 */
export function extractEvidenceFromCharacter(character: Character): EvidenceVariable[] {
  const evidence: EvidenceVariable[] = [];
  
  // Extract from psychological profile
  if (character.psychologicalProfile.introversionExtroversion) {
    evidence.push({
      trait: character.psychologicalProfile.introversionExtroversion,
      probability: 1.0
    });
  }
  
  if (character.psychologicalProfile.attachmentStyle) {
    evidence.push({
      trait: character.psychologicalProfile.attachmentStyle,
      probability: 1.0
    });
  }
  
  if (character.psychologicalProfile.trustLevel) {
    evidence.push({
      trait: character.psychologicalProfile.trustLevel,
      probability: 1.0
    });
  }
  
  // Extract from social hierarchy
  if (character.socialHierarchyPosition.role) {
    evidence.push({
      trait: character.socialHierarchyPosition.role,
      probability: 1.0
    });
  }
  
  // Extract from communication
  if (character.communication.primaryStyle) {
    evidence.push({
      trait: character.communication.primaryStyle,
      probability: 1.0
    });
  }
  
  // Add more extractions as needed...
  
  return evidence;
}

// ==========================================
// Autocomplete Functions
// ==========================================

/**
 * Autocompletes a character based on existing traits
 */
export function autocompleteCharacter(character: Character): Character {
  // Create a deep copy to avoid modifying the original
  const completedCharacter: Character = JSON.parse(JSON.stringify(character));
  
  // Extract evidence from existing traits
  const evidence = extractEvidenceFromCharacter(character);
  
  // Perform inference
  const inference = performInference(evidence);
  
  // Fill in missing traits with highest probability options
  
  // Psychological Profile
  if (!completedCharacter.psychologicalProfile.introversionExtroversion) {
    const result = getInferenceResult(inference, 'introversionExtroversion');
    if (result) {
      completedCharacter.psychologicalProfile.introversionExtroversion = 
        result.recommendedTrait as IntroversionExtroversion;
    }
  }
  
  if (!completedCharacter.psychologicalProfile.attachmentStyle) {
    const result = getInferenceResult(inference, 'attachmentStyle');
    if (result) {
      completedCharacter.psychologicalProfile.attachmentStyle = 
        result.recommendedTrait as AttachmentStyle;
    }
  }
  
  if (!completedCharacter.psychologicalProfile.trustLevel) {
    const result = getInferenceResult(inference, 'trustLevel');
    if (result) {
      completedCharacter.psychologicalProfile.trustLevel = 
        result.recommendedTrait as TrustLevel;
    }
  }
  
  // Fill in vulnerabilities
  if (!completedCharacter.psychologicalProfile.likelyVulnerabilities || 
      completedCharacter.psychologicalProfile.likelyVulnerabilities.length === 0) {
    const result = getInferenceResult(inference, 'vulnerabilities');
    if (result) {
      // Get top 3 vulnerabilities
      const vulnerabilities = Object.entries(result.traits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trait, probability]) => ({
          type: trait,
          probability
        }));
      
      completedCharacter.psychologicalProfile.likelyVulnerabilities = vulnerabilities;
    }
  }
  
  // Social Hierarchy
  if (!completedCharacter.socialHierarchyPosition.role) {
    const result = getInferenceResult(inference, 'socialRole');
    if (result) {
      completedCharacter.socialHierarchyPosition.role = 
        result.recommendedTrait as SocialRole;
    }
  }
  
  // Communication
  if (!completedCharacter.communication.primaryStyle) {
    const result = getInferenceResult(inference, 'communicationStyle');
    if (result) {
      completedCharacter.communication.primaryStyle = 
        result.recommendedTrait as CommunicationStyle;
    }
  }
  
  // Decision Making
  if (!completedCharacter.decisionMaking.emotionVsLogic) {
    const result = getInferenceResult(inference, 'emotionVsLogic');
    if (result) {
      // Map the categorical result to a numerical value
      const emotionLogicMap: { [key: string]: number } = {
        'Highly emotional': 0.9,
        'Moderately emotional': 0.7,
        'Balanced': 0.5,
        'Moderately logical': 0.3,
        'Highly logical': 0.1
      };
      
      completedCharacter.decisionMaking.emotionVsLogic = 
        emotionLogicMap[result.recommendedTrait] || 0.5;
    }
  }
  
  if (!completedCharacter.decisionMaking.pacing) {
    const result = getInferenceResult(inference, 'decisionPacing');
    if (result) {
      completedCharacter.decisionMaking.pacing = result.recommendedTrait;
    }
  }
  
  // Motivations & Insecurities
  if (!completedCharacter.motivationsInsecurities.desires || 
      completedCharacter.motivationsInsecurities.desires.length === 0) {
    const result = getInferenceResult(inference, 'desires');
    if (result) {
      // Get top 3 desires
      const desires = Object.entries(result.traits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trait, probability]) => ({
          type: trait,
          strength: probability
        }));
      
      completedCharacter.motivationsInsecurities.desires = desires;
    }
  }
  
  if (!completedCharacter.motivationsInsecurities.fears || 
      completedCharacter.motivationsInsecurities.fears.length === 0) {
    const result = getInferenceResult(inference, 'fears');
    if (result) {
      // Get top 3 fears
      const fears = Object.entries(result.traits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trait, probability]) => ({
          type: trait,
          strength: probability
        }));
      
      completedCharacter.motivationsInsecurities.fears = fears;
    }
  }
  
  // Trust Signals
  if (!completedCharacter.trustSignalsVulnerabilityMarkers.triggers || 
      completedCharacter.trustSignalsVulnerabilityMarkers.triggers.length === 0) {
    const result = getInferenceResult(inference, 'trustTriggers');
    if (result) {
      // Get top 3 trust triggers
      const triggers = Object.entries(result.traits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trait, probability]) => ({
          type: trait,
          effectiveness: probability
        }));
      
      completedCharacter.trustSignalsVulnerabilityMarkers.triggers = triggers;
    }
  }
  
  // Identity Anchors
  if (!completedCharacter.identityAnchors.coreAnchors || 
      completedCharacter.identityAnchors.coreAnchors.length === 0) {
    const result = getInferenceResult(inference, 'identityAnchors');
    if (result) {
      // Get top 3 identity anchors
      const anchors = Object.entries(result.traits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([trait, probability]) => ({
          type: trait,
          centrality: probability,
          visibility: 0.5 // Default visibility
        }));
      
      completedCharacter.identityAnchors.coreAnchors = anchors;
    }
  }
  
  return completedCharacter;
}

/**
 * Gets suggested traits for a specific category based on existing evidence
 */
export function getSuggestedTraits(
  character: Character,
  category: string,
  count: number = 3
): { trait: string, probability: number }[] {
  // Extract evidence from existing traits
  const evidence = extractEvidenceFromCharacter(character);
  
  // Perform inference
  const inference = performInference(evidence);
  
  // Get result for the category
  const result = getInferenceResult(inference, category);
  
  if (!result) {
    return [];
  }
  
  // Return top N suggestions
  return Object.entries(result.traits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([trait, probability]) => ({
      trait,
      probability
    }));
}

/**
 * Calculates compatibility between two characters
 */
export function calculateCompatibility(character1: Character, character2: Character): number {
  let compatibilityScore = 0;
  let totalFactors = 0;
  
  // Compare psychological profiles
  if (character1.psychologicalProfile.attachmentStyle === AttachmentStyle.SECURE &&
      character2.psychologicalProfile.attachmentStyle === AttachmentStyle.SECURE) {
    compatibilityScore += 1;
  } else if (character1.psychologicalProfile.attachmentStyle === AttachmentStyle.ANXIOUS &&
             character2.psychologicalProfile.attachmentStyle === AttachmentStyle.AVOIDANT) {
    compatibilityScore += 0.3; // Anxious-avoidant pairs often attract but have challenges
  } else if (character1.psychologicalProfile.attachmentStyle === AttachmentStyle.AVOIDANT &&
             character2.psychologicalProfile.attachmentStyle === AttachmentStyle.ANXIOUS) {
    compatibilityScore += 0.3;
  } else {
    compatibilityScore += 0.5; // Other combinations
  }
  totalFactors += 1;
  
  // Compare introversion/extroversion
  const introExtroCompat = 1 - Math.abs(
    getIntroversionExtroversionValue(character1.psychologicalProfile.introversionExtroversion) -
    getIntroversionExtroversionValue(character2.psychologicalProfile.introversionExtroversion)
  ) / 4; // Normalize to 0-1
  compatibilityScore += introExtroCompat;
  totalFactors += 1;
  
  // Compare communication styles
  if (character1.communication.primaryStyle === character2.communication.primaryStyle) {
    compatibilityScore += 1; // Same communication style is generally compatible
  } else if (
    (character1.communication.primaryStyle === CommunicationStyle.DIRECT && 
     character2.communication.primaryStyle === CommunicationStyle.DIRECT) ||
    (character1.communication.primaryStyle === CommunicationStyle.ANALYTICAL && 
     character2.communication.primaryStyle === CommunicationStyle.ANALYTICAL)
  ) {
    compatibilityScore += 0.9; // These pairs often work well
  } else if (
    (character1.communication.primaryStyle === CommunicationStyle.DIRECT && 
     character2.communication.primaryStyle === CommunicationStyle.INDIRECT) ||
    (character1.communication.primaryStyle === CommunicationStyle.INDIRECT && 
     character2.communication.primaryStyle === CommunicationStyle.DIRECT)
  ) {
    compatibilityScore += 0.4; // These pairs often have challenges
  } else {
    compatibilityScore += 0.6; // Other combinations
  }
  totalFactors += 1;
  
  // Compare decision-making styles
  const decisionMakingCompat = 1 - Math.abs(
    character1.decisionMaking.emotionVsLogic -
    character2.decisionMaking.emotionVsLogic
  );
  compatibilityScore += decisionMakingCompat;
  totalFactors += 1;
  
  // Calculate average compatibility
  return compatibilityScore / totalFactors;
}

/**
 * Helper to convert IntroversionExtroversion enum to numeric value
 */
function getIntroversionExtroversionValue(ie: IntroversionExtroversion): number {
  switch (ie) {
    case IntroversionExtroversion.HIGHLY_INTROVERTED: return 0;
    case IntroversionExtroversion.INTROVERTED: return 1;
    case IntroversionExtroversion.AMBIVERT: return 2;
    case IntroversionExtroversion.EXTROVERTED: return 3;
    case IntroversionExtroversion.HIGHLY_EXTROVERTED: return 4;
    default: return 2; // Default to ambivert
  }
}

/**
 * Generates a strategy for building rapport with a character
 */
export function generateRapportStrategy(character: Character): string[] {
  const strategies: string[] = [];
  
  // Based on introversion/extroversion
  if (character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.HIGHLY_INTROVERTED ||
      character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.INTROVERTED) {
    strategies.push("Give them space and time to process");
    strategies.push("Prefer deeper one-on-one conversations over group settings");
    strategies.push("Don't force them to socialize extensively");
  } else if (character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.EXTROVERTED ||
             character.psychologicalProfile.introversionExtroversion === IntroversionExtroversion.HIGHLY_EXTROVERTED) {
    strategies.push("Engage in active, energetic conversations");
    strategies.push("Include them in group activities");
    strategies.push("Be receptive to their need to verbally process thoughts");
  }
  
  // Based on attachment style
  if (character.psychologicalProfile.attachmentStyle === AttachmentStyle.ANXIOUS) {
    strategies.push("Provide regular reassurance and check-ins");
    strategies.push("Be consistent and reliable in communication");
    strategies.push("Acknowledge their feelings and concerns");
  } else if (character.psychologicalProfile.attachmentStyle === AttachmentStyle.AVOIDANT) {
    strategies.push("Respect their need for independence");
    strategies.push("Don't push for emotional disclosure too quickly");
    strategies.push("Give them space when they seem overwhelmed");
  } else if (character.psychologicalProfile.attachmentStyle === AttachmentStyle.FEARFUL_AVOIDANT) {
    strategies.push("Be patient with mixed signals");
    strategies.push("Maintain consistent, non-threatening presence");
    strategies.push("Avoid pressuring for commitment or deep emotional sharing");
  }
  
  // Based on communication style
  if (character.communication.primaryStyle === CommunicationStyle.DIRECT) {
    strategies.push("Be straightforward and honest");
    strategies.push("Don't beat around the bush");
    strategies.push("Appreciate their frankness rather than taking offense");
  } else if (character.communication.primaryStyle === CommunicationStyle.INDIRECT) {
    strategies.push("Pay attention to subtle cues and hints");
    strategies.push("Ask clarifying questions gently");
    strategies.push("Don't force direct confrontation");
  } else if (character.communication.primaryStyle === CommunicationStyle.ANALYTICAL) {
    strategies.push("Provide logical reasoning and evidence");
    strategies.push("Focus on facts and specific details");
    strategies.push("Respect their need to analyze before deciding");
  } else if (character.communication.primaryStyle === CommunicationStyle.EMOTIONAL) {
    strategies.push("Acknowledge and validate their feelings");
    strategies.push("Show empathy and emotional attunement");
    strategies.push("Don't dismiss emotional reactions as irrational");
  }
  
  // Based on trust triggers
  if (character.trustSignalsVulnerabilityMarkers.triggers && 
      character.trustSignalsVulnerabilityMarkers.triggers.length > 0) {
    
    // Find the most effective trigger
    const mostEffectiveTrigger = character.trustSignalsVulnerabilityMarkers.triggers
      .sort((a, b) => b.effectiveness - a.effectiveness)[0];
    
    if (mostEffectiveTrigger.type === 'Shared interests') {
      strategies.push("Find and discuss common interests or hobbies");
    } else if (mostEffectiveTrigger.type === 'Vulnerability disclosure') {
      strategies.push("Share appropriate personal struggles or challenges");
    } else if (mostEffectiveTrigger.type === 'Consistent behavior') {
      strategies.push("Be reliable and consistent in your actions");
    } else if (mostEffectiveTrigger.type === 'Shared values') {
      strategies.push("Identify and emphasize shared values or beliefs");
    } else if (mostEffectiveTrigger.type === 'Shared emotional language') {
      strategies.push("Mirror their emotional expression style");
    }
  }
  
  // Based on motivations
  if (character.motivationsInsecurities.desires && 
      character.motivationsInsecurities.desires.length > 0) {
    
    // Find the strongest desire
    const strongestDesire = character.motivationsInsecurities.desires
      .sort((a, b) => b.strength - a.strength)[0];
    
    if (strongestDesire.type === 'Belonging') {
      strategies.push("Create a sense of inclusion and acceptance");
    } else if (strongestDesire.type === 'Recognition') {
      strategies.push("Acknowledge their achievements and contributions");
    } else if (strongestDesire.type === 'Being understood') {
      strategies.push("Show that you truly understand their perspective");
    } else if (strongestDesire.type === 'Achievement') {
      strategies.push("Recognize their competence and accomplishments");
    }
  }
  
  return strategies;
}

// Export the main API
export default {
  performInference,
  getInferenceResult,
  getAllInferenceResults,
  extractEvidenceFromCharacter,
  autocompleteCharacter,
  getSuggestedTraits,
  calculateCompatibility,
  generateRapportStrategy
};
