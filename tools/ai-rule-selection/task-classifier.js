/**
 * 🎯 AI-Driven Task Classifier
 * 
 * Phase 3.1 Implementation: Enhanced ML-based Task Classification
 * 
 * This module provides sophisticated task classification using machine learning
 * techniques to categorize tasks and identify optimal rule sets and thinking approaches.
 * 
 * @version 1.0.0
 * @author RPGlitch Team
 * @date 2025-01-02
 */

class TaskClassifier {
  constructor() {
    this.mlModel = new EnhancedMLModel();
    this.ruleMatcher = new RuleMatcher();
    this.thinkingSelector = new ThinkingApproachSelector();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.classificationCache = new Map();
  }

  /**
   * Classify task and provide comprehensive recommendations
   * @param {Object} task - Task to classify
   * @param {Object} context - Context from ContextAnalyzer
   * @returns {Object} Comprehensive classification with recommendations
   */
  classifyTask(task, context = {}) {
    const taskId = this.generateTaskId(task);
    
    // Check cache first
    if (this.classificationCache.has(taskId)) {
      return this.classificationCache.get(taskId);
    }

    const classification = {
      primary: this.classifyPrimaryTask(task, context),
      secondary: this.classifySecondaryTask(task, context),
      complexity: this.assessTaskComplexity(task, context),
      thinkingApproach: this.selectThinkingApproach(task, context),
      ruleRecommendations: this.generateRuleRecommendations(task, context),
      toolRecommendations: this.generateToolRecommendations(task, context),
      performanceOptimizations: this.optimizeForPerformance(task, context),
      confidence: this.calculateConfidence(task, context)
    };

    // Cache the classification
    this.classificationCache.set(taskId, classification);
    
    return classification;
  }

  /**
   * Classify primary task type using enhanced ML model
   * @param {Object} task - Task to classify
   * @param {Object} context - Context information
   * @returns {Object} Primary classification
   */
  classifyPrimaryTask(task, context) {
    const features = this.extractEnhancedFeatures(task, context);
    const prediction = this.mlModel.predictPrimary(features);
    
    return {
      type: prediction.type,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning,
      alternatives: prediction.alternatives
    };
  }

  /**
   * Classify secondary task characteristics
   * @param {Object} task - Task to classify
   * @param {Object} context - Context information
   * @returns {Object} Secondary classification
   */
  classifySecondaryTask(task, context) {
    const features = this.extractEnhancedFeatures(task, context);
    const characteristics = [];

    // Analyze task characteristics
    if (features.hasUrgency) {
      characteristics.push({
        type: 'urgency',
        level: 'high',
        confidence: 0.8
      });
    }

    if (features.hasCollaboration) {
      characteristics.push({
        type: 'collaboration',
        level: 'team',
        confidence: 0.7
      });
    }

    if (features.hasInnovation) {
      characteristics.push({
        type: 'innovation',
        level: 'creative',
        confidence: 0.6
      });
    }

    return {
      characteristics,
      complexity: this.assessSecondaryComplexity(features),
      domain: this.identifyDomain(features)
    };
  }

  /**
   * Assess task complexity using multiple dimensions
   * @param {Object} task - Task to assess
   * @param {Object} context - Context information
   * @returns {Object} Complexity assessment
   */
  assessTaskComplexity(task, context) {
    const features = this.extractEnhancedFeatures(task, context);
    
    const dimensions = {
      cognitive: this.assessCognitiveComplexity(features),
      technical: this.assessTechnicalComplexity(features),
      temporal: this.assessTemporalComplexity(features),
      social: this.assessSocialComplexity(features)
    };

    const overallScore = Object.values(dimensions).reduce((sum, dim) => sum + dim.score, 0) / 4;
    const overallLevel = this.scoreToLevel(overallScore);

    return {
      overall: {
        level: overallLevel,
        score: overallScore,
        confidence: this.calculateComplexityConfidence(dimensions)
      },
      dimensions,
      factors: this.identifyComplexityFactors(features)
    };
  }

  /**
   * Select optimal thinking approach based on task characteristics
   * @param {Object} task - Task to analyze
   * @param {Object} context - Context information
   * @returns {Object} Thinking approach recommendation
   */
  selectThinkingApproach(task, context) {
    const primary = this.classifyPrimaryTask(task, context);
    const complexity = this.assessTaskComplexity(task, context);
    
    return this.thinkingSelector.selectApproach(primary, complexity, context);
  }

  /**
   * Generate rule recommendations based on classification
   * @param {Object} task - Task to analyze
   * @param {Object} context - Context information
   * @returns {Object} Rule recommendations
   */
  generateRuleRecommendations(task, context) {
    const primary = this.classifyPrimaryTask(task, context);
    const complexity = this.assessTaskComplexity(task, context);
    
    return this.ruleMatcher.matchRules(primary, complexity, context);
  }

  /**
   * Generate tool recommendations based on task requirements
   * @param {Object} task - Task to analyze
   * @param {Object} context - Context information
   * @returns {Object} Tool recommendations
   */
  generateToolRecommendations(task, context) {
    const features = this.extractEnhancedFeatures(task, context);
    const recommendations = {
      essential: [],
      recommended: [],
      optional: []
    };

    // Essential tools based on task type
    if (features.hasDebug) {
      recommendations.essential.push('debugging-tools', 'error-analysis');
    }

    if (features.hasImplement) {
      recommendations.essential.push('development-environment', 'version-control');
    }

    if (features.hasDesign) {
      recommendations.essential.push('design-tools', 'prototyping');
    }

    // Recommended tools based on complexity
    if (features.complexityLevel === 'high') {
      recommendations.recommended.push('sequential-thinking-tools', 'project-management');
    }

    // Optional tools based on domain
    if (features.hasFrontend) {
      recommendations.optional.push('css-frameworks', 'ui-libraries');
    }

    return recommendations;
  }

  /**
   * Optimize task for performance
   * @param {Object} task - Task to optimize
   * @param {Object} context - Context information
   * @returns {Object} Performance optimizations
   */
  optimizeForPerformance(task, context) {
    return this.performanceOptimizer.optimize(task, context);
  }

  /**
   * Extract enhanced features for classification
   * @param {Object} task - Task to analyze
   * @param {Object} context - Context information
   * @returns {Object} Enhanced feature vector
   */
  extractEnhancedFeatures(task, context) {
    const text = typeof task === 'string' ? task : JSON.stringify(task);
    const words = text.toLowerCase().split(/\s+/);
    
    const features = {
      // Basic task indicators
      hasDebug: words.some(w => ['debug', 'fix', 'error', 'bug', 'issue', 'problem'].includes(w)),
      hasImplement: words.some(w => ['implement', 'create', 'build', 'develop', 'code'].includes(w)),
      hasDesign: words.some(w => ['design', 'plan', 'architecture', 'structure', 'layout'].includes(w)),
      hasAnalyze: words.some(w => ['analyze', 'review', 'examine', 'investigate', 'study'].includes(w)),
      hasOptimize: words.some(w => ['optimize', 'improve', 'enhance', 'refactor', 'performance'].includes(w)),
      
      // Complexity indicators
      hasComplex: words.some(w => ['complex', 'multi-step', 'system', 'integration', 'advanced'].includes(w)),
      hasSimple: words.some(w => ['simple', 'quick', 'basic', 'easy', 'straightforward'].includes(w)),
      
      // Domain indicators
      hasFrontend: words.some(w => ['ui', 'frontend', 'css', 'html', 'react', 'vue', 'angular'].includes(w)),
      hasBackend: words.some(w => ['api', 'backend', 'server', 'database', 'node', 'python'].includes(w)),
      hasDevOps: words.some(w => ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'].includes(w)),
      
      // Tool indicators
      hasTools: words.some(w => ['tool', 'mcp', 'framework', 'library', 'plugin'].includes(w)),
      
      // Urgency indicators
      hasUrgency: words.some(w => ['urgent', 'asap', 'quick', 'fast', 'immediate'].includes(w)),
      
      // Collaboration indicators
      hasCollaboration: words.some(w => ['team', 'collaborate', 'review', 'share', 'coordinate'].includes(w)),
      
      // Innovation indicators
      hasInnovation: words.some(w => ['innovate', 'creative', 'new', 'experimental', 'pioneer'].includes(w)),
      
      // Length and complexity
      wordCount: words.length,
      uniqueWords: new Set(words).size,
      hasCode: text.includes('{') || text.includes('(') || text.includes(';'),
      
      // Context-based features
      mode: context.mode || 'operational',
      availableTools: context.availableTools || [],
      timeLimit: context.timeLimit || null
    };

    // Calculate complexity level
    features.complexityLevel = this.calculateComplexityLevel(features);
    
    return features;
  }

  /**
   * Calculate complexity level from features
   * @param {Object} features - Feature vector
   * @returns {String} Complexity level
   */
  calculateComplexityLevel(features) {
    let score = 0;
    
    if (features.hasComplex) score += 3;
    if (features.hasImplement) score += 2;
    if (features.hasDesign) score += 3;
    if (features.hasAnalyze) score += 2;
    if (features.hasBackend) score += 2;
    if (features.hasDevOps) score += 3;
    if (features.hasTools) score += 1;
    if (features.wordCount > 30) score += 2;
    if (features.hasCode) score += 1;

    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Assess cognitive complexity
   * @param {Object} features - Feature vector
   * @returns {Object} Cognitive complexity assessment
   */
  assessCognitiveComplexity(features) {
    let score = 0;
    const factors = [];

    if (features.hasDesign) {
      score += 3;
      factors.push('design-thinking');
    }

    if (features.hasAnalyze) {
      score += 2;
      factors.push('analytical-thinking');
    }

    if (features.hasInnovation) {
      score += 2;
      factors.push('creative-thinking');
    }

    if (features.wordCount > 50) {
      score += 1;
      factors.push('information-density');
    }

    return {
      score: Math.min(score / 5, 1.0),
      level: this.scoreToLevel(score / 5),
      factors
    };
  }

  /**
   * Assess technical complexity
   * @param {Object} features - Feature vector
   * @returns {Object} Technical complexity assessment
   */
  assessTechnicalComplexity(features) {
    let score = 0;
    const factors = [];

    if (features.hasBackend) {
      score += 2;
      factors.push('backend-development');
    }

    if (features.hasDevOps) {
      score += 3;
      factors.push('devops-infrastructure');
    }

    if (features.hasTools) {
      score += 1;
      factors.push('tool-integration');
    }

    if (features.hasCode) {
      score += 1;
      factors.push('code-implementation');
    }

    return {
      score: Math.min(score / 5, 1.0),
      level: this.scoreToLevel(score / 5),
      factors
    };
  }

  /**
   * Assess temporal complexity
   * @param {Object} features - Feature vector
   * @returns {Object} Temporal complexity assessment
   */
  assessTemporalComplexity(features) {
    let score = 0;
    const factors = [];

    if (features.hasUrgency) {
      score += 3;
      factors.push('time-pressure');
    }

    if (features.hasComplex) {
      score += 2;
      factors.push('multi-step-process');
    }

    if (features.wordCount > 30) {
      score += 1;
      factors.push('scope-size');
    }

    return {
      score: Math.min(score / 5, 1.0),
      level: this.scoreToLevel(score / 5),
      factors
    };
  }

  /**
   * Assess social complexity
   * @param {Object} features - Feature vector
   * @returns {Object} Social complexity assessment
   */
  assessSocialComplexity(features) {
    let score = 0;
    const factors = [];

    if (features.hasCollaboration) {
      score += 3;
      factors.push('team-coordination');
    }

    if (features.hasReview) {
      score += 2;
      factors.push('stakeholder-review');
    }

    return {
      score: Math.min(score / 5, 1.0),
      level: this.scoreToLevel(score / 5),
      factors
    };
  }

  /**
   * Convert score to level
   * @param {Number} score - Score (0-1)
   * @returns {String} Level
   */
  scoreToLevel(score) {
    if (score >= 0.7) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence in classification
   * @param {Object} task - Task object
   * @param {Object} context - Context object
   * @returns {Number} Confidence score (0-1)
   */
  calculateConfidence(task, context) {
    const features = this.extractEnhancedFeatures(task, context);
    let confidence = 0.5;

    // Increase confidence based on clear indicators
    if (features.hasDebug || features.hasImplement || features.hasDesign) {
      confidence += 0.2;
    }

    if (features.complexityLevel !== 'medium') {
      confidence += 0.1;
    }

    if (features.wordCount > 10 && features.wordCount < 100) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate unique task ID for caching
   * @param {Object} task - Task object
   * @returns {String} Unique task ID
   */
  generateTaskId(task) {
    const taskStr = typeof task === 'string' ? task : JSON.stringify(task);
    return btoa(taskStr).slice(0, 16);
  }

  /**
   * Identify complexity factors
   * @param {Object} features - Feature vector
   * @returns {Array} Complexity factors
   */
  identifyComplexityFactors(features) {
    const factors = [];

    if (features.hasComplex) factors.push('multi-step-process');
    if (features.hasBackend) factors.push('backend-integration');
    if (features.hasDevOps) factors.push('infrastructure-complexity');
    if (features.hasTools) factors.push('tool-integration');
    if (features.hasUrgency) factors.push('time-pressure');
    if (features.hasCollaboration) factors.push('team-coordination');

    return factors;
  }

  /**
   * Assess secondary complexity
   * @param {Object} features - Feature vector
   * @returns {Object} Secondary complexity
   */
  assessSecondaryComplexity(features) {
    return {
      level: features.complexityLevel,
      factors: this.identifyComplexityFactors(features)
    };
  }

  /**
   * Identify domain
   * @param {Object} features - Feature vector
   * @returns {String} Domain
   */
  identifyDomain(features) {
    if (features.hasFrontend) return 'frontend';
    if (features.hasBackend) return 'backend';
    if (features.hasDevOps) return 'devops';
    return 'general';
  }

  /**
   * Calculate complexity confidence
   * @param {Object} dimensions - Complexity dimensions
   * @returns {Number} Confidence score
   */
  calculateComplexityConfidence(dimensions) {
    const scores = Object.values(dimensions).map(d => d.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}

/**
 * Enhanced ML Model for Task Classification
 */
class EnhancedMLModel {
  constructor() {
    this.model = this.initializeModel();
  }

  initializeModel() {
    return {
      predictPrimary: (features) => this.predictPrimaryTask(features)
    };
  }

  predictPrimaryTask(features) {
    let type = 'general';
    let confidence = 0.5;
    let reasoning = [];
    let alternatives = [];

    // Determine primary task type with confidence scoring
    if (features.hasDebug) {
      type = 'debugging';
      confidence = 0.85;
      reasoning.push('Strong debugging indicators detected');
      alternatives.push('troubleshooting', 'error-resolution');
    } else if (features.hasImplement) {
      type = 'implementation';
      confidence = 0.80;
      reasoning.push('Implementation keywords identified');
      alternatives.push('development', 'coding');
    } else if (features.hasDesign) {
      type = 'design';
      confidence = 0.75;
      reasoning.push('Design and architecture focus detected');
      alternatives.push('planning', 'architecture');
    } else if (features.hasAnalyze) {
      type = 'analysis';
      confidence = 0.70;
      reasoning.push('Analysis and review indicators present');
      alternatives.push('investigation', 'examination');
    } else if (features.hasOptimize) {
      type = 'optimization';
      confidence = 0.65;
      reasoning.push('Optimization and improvement focus');
      alternatives.push('enhancement', 'refactoring');
    }

    // Adjust confidence based on complexity
    if (features.complexityLevel === 'high') {
      confidence += 0.1;
      reasoning.push('High complexity supports classification');
    }

    return {
      type,
      confidence: Math.min(confidence, 1.0),
      reasoning: reasoning.join('; '),
      alternatives
    };
  }
}

/**
 * Rule Matcher for Intelligent Rule Selection
 */
class RuleMatcher {
  constructor() {
    this.ruleDatabase = this.initializeRuleDatabase();
  }

  initializeRuleDatabase() {
    return {
      'debugging': ['scss-debugging.mdc', 'error-handling.mdc'],
      'implementation': ['vanilla-javascript-development.mdc', 'perchance-architecture.mdc'],
      'design': ['css-principles.mdc', 'design-system.mdc'],
      'analysis': ['context7-usage.mdc', 'data-analysis.mdc'],
      'optimization': ['performance-optimization.mdc', 'code-quality.mdc']
    };
  }

  matchRules(primary, complexity, context) {
    const rules = {
      essential: ['unified-thinking-framework.mdc'],
      recommended: [],
      optional: []
    };

    // Add task-specific rules
    if (this.ruleDatabase[primary.type]) {
      rules.recommended.push(...this.ruleDatabase[primary.type]);
    }

    // Add complexity-based rules
    if (complexity.overall.level === 'high') {
      rules.recommended.push('sequential-thinking-guide.mdc');
    }

    // Add context-based rules
    if (context.mode === 'strategic') {
      rules.recommended.push('strategic-planning.mdc');
    }

    return rules;
  }
}

/**
 * Thinking Approach Selector
 */
class ThinkingApproachSelector {
  selectApproach(primary, complexity, context) {
    const approach = {
      primary: 'contemplative',
      secondary: 'sequential',
      reasoning: []
    };

    // Select primary approach
    if (complexity.overall.level === 'high') {
      approach.primary = 'sequential';
      approach.reasoning.push('High complexity requires structured approach');
    } else if (primary.type === 'implementation' && complexity.overall.level === 'low') {
      approach.primary = 'professional';
      approach.reasoning.push('Simple implementation benefits from professional approach');
    }

    // Select secondary approach
    if (approach.primary === 'sequential') {
      approach.secondary = 'contemplative';
    } else if (approach.primary === 'contemplative') {
      approach.secondary = 'sequential';
    }

    return approach;
  }
}

/**
 * Performance Optimizer
 */
class PerformanceOptimizer {
  optimize(task, context) {
    const optimizations = [];

    if (context.mode === 'operational') {
      optimizations.push('Use fast execution mode');
    }

    if (context.timeLimit) {
      optimizations.push('Prioritize time-sensitive operations');
    }

    return {
      optimizations,
      estimatedTime: this.estimateTime(task, context)
    };
  }

  estimateTime(task, context) {
    // Simple time estimation logic
    const baseTime = 60; // minutes
    return `${baseTime} minutes`;
  }
}

// Export the main class
module.exports = TaskClassifier;

// Example usage
if (require.main === module) {
  const classifier = new TaskClassifier();
  
  const task = "Implement AI-driven rule selection system for Phase 3.1";
  const context = { mode: 'operational', complexity: 'high' };
  
  const classification = classifier.classifyTask(task, context);
  console.log('Task Classification:', JSON.stringify(classification, null, 2));
}