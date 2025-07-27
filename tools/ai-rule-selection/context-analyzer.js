/**
 * 🤖 AI-Driven Context Analyzer
 * 
 * Phase 3.1 Implementation: AI-Driven Rule Selection
 * 
 * This module provides intelligent context analysis for rule selection,
 * building on the existing context-aware rule loading framework with
 * ML-based task classification and performance optimization.
 * 
 * @version 1.0.0
 * @author RPGlitch Team
 * @date 2025-01-02
 */

class ContextAnalyzer {
  constructor() {
    this.mlModel = new TaskClassificationModel();
    this.performanceTracker = new PerformanceTracker();
    this.ruleRepository = new RuleRepository();
    this.contextCache = new Map();
  }

  /**
   * Analyze task context and provide intelligent rule selection recommendations
   * @param {Object} task - The task to analyze
   * @param {Object} environment - Current environment context
   * @param {Array} history - Task history for pattern recognition
   * @returns {Object} Context analysis with rule recommendations
   */
  analyzeContext(task, environment = {}, history = []) {
    const contextId = this.generateContextId(task, environment);
    
    // Check cache first
    if (this.contextCache.has(contextId)) {
      return this.contextCache.get(contextId);
    }

    const analysis = {
      taskType: this.classifyTask(task),
      complexity: this.assessComplexity(task),
      requirements: this.extractRequirements(task),
      constraints: this.identifyConstraints(environment),
      patterns: this.findPatterns(history),
      performance: this.analyzePerformance(task),
      recommendations: this.generateRecommendations(task, environment)
    };

    // Cache the analysis
    this.contextCache.set(contextId, analysis);
    
    return analysis;
  }

  /**
   * ML-based task classification using pattern recognition
   * @param {Object} task - Task to classify
   * @returns {Object} Classification with confidence scores
   */
  classifyTask(task) {
    const features = this.extractTaskFeatures(task);
    
    // Enhanced error handling and fallback mechanism
    let prediction;
    try {
      prediction = this.mlModel.predict(features);
    } catch (error) {
      console.warn('ML model prediction failed, using fallback:', error.message);
      prediction = this.fallbackClassification(features);
    }
    
    return {
      primary: prediction.primary,
      secondary: prediction.secondary,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning
    };
  }

  /**
   * Fallback classification when ML model fails
   * @param {Object} features - Feature vector
   * @returns {Object} Fallback classification
   */
  fallbackClassification(features) {
    let primary = 'general';
    let secondary = 'general';
    let confidence = 0.6;
    let reasoning = ['Fallback classification used'];

    // Enhanced fallback logic with better confidence scoring
    if (features.hasDebug) {
      primary = 'debugging';
      confidence = 0.75;
      reasoning.push('Task contains debugging keywords');
    } else if (features.hasImplement) {
      primary = 'implementation';
      confidence = 0.8;
      reasoning.push('Task contains implementation keywords');
    } else if (features.hasDesign) {
      primary = 'design';
      confidence = 0.75;
      reasoning.push('Task contains design keywords');
    } else if (features.hasAnalyze) {
      primary = 'analysis';
      confidence = 0.7;
      reasoning.push('Task contains analysis keywords');
    } else if (features.hasOptimize) {
      primary = 'optimization';
      confidence = 0.7;
      reasoning.push('Task contains optimization keywords');
    }

    // Enhanced secondary classification
    if (features.hasComplex) {
      secondary = 'complex';
      reasoning.push('Task appears to be complex');
    } else if (features.hasSimple) {
      secondary = 'simple';
      reasoning.push('Task appears to be simple');
    }

    return {
      primary,
      secondary,
      confidence,
      reasoning: reasoning.join('; ')
    };
  }

  /**
   * Extract features from task for ML classification
   * @param {Object} task - Task to analyze
   * @returns {Object} Feature vector
   */
  extractTaskFeatures(task) {
    const text = typeof task === 'string' ? task : JSON.stringify(task);
    const words = text.toLowerCase().split(/\s+/);
    
    return {
      // Task type indicators
      hasDebug: words.some(w => ['debug', 'fix', 'error', 'bug', 'issue'].includes(w)),
      hasImplement: words.some(w => ['implement', 'create', 'build', 'develop'].includes(w)),
      hasDesign: words.some(w => ['design', 'plan', 'architecture', 'structure'].includes(w)),
      hasAnalyze: words.some(w => ['analyze', 'review', 'examine', 'investigate'].includes(w)),
      hasOptimize: words.some(w => ['optimize', 'improve', 'enhance', 'refactor'].includes(w)),
      
      // Complexity indicators
      hasComplex: words.some(w => ['complex', 'multi-step', 'system', 'integration'].includes(w)),
      hasSimple: words.some(w => ['simple', 'quick', 'basic', 'easy'].includes(w)),
      
      // Domain indicators
      hasFrontend: words.some(w => ['ui', 'frontend', 'css', 'html', 'react'].includes(w)),
      hasBackend: words.some(w => ['api', 'backend', 'server', 'database'].includes(w)),
      hasDevOps: words.some(w => ['deploy', 'ci/cd', 'docker', 'kubernetes'].includes(w)),
      
      // Tool indicators
      hasTools: words.some(w => ['tool', 'mcp', 'framework', 'library'].includes(w)),
      
      // Length and complexity
      wordCount: words.length,
      uniqueWords: new Set(words).size,
      hasCode: text.includes('{') || text.includes('(') || text.includes(';')
    };
  }

  /**
   * Assess task complexity using multiple factors
   * @param {Object} task - Task to assess
   * @returns {Object} Complexity assessment
   */
  assessComplexity(task) {
    const features = this.extractTaskFeatures(task);
    let score = 0;
    const factors = [];

    // Task type complexity
    if (features.hasDebug) { score += 2; factors.push('debugging'); }
    if (features.hasImplement) { score += 3; factors.push('implementation'); }
    if (features.hasDesign) { score += 4; factors.push('design'); }
    if (features.hasAnalyze) { score += 3; factors.push('analysis'); }
    if (features.hasOptimize) { score += 3; factors.push('optimization'); }

    // Domain complexity
    if (features.hasFrontend) { score += 1; factors.push('frontend'); }
    if (features.hasBackend) { score += 2; factors.push('backend'); }
    if (features.hasDevOps) { score += 3; factors.push('devops'); }

    // Tool complexity
    if (features.hasTools) { score += 2; factors.push('tools'); }

    // Length complexity
    if (features.wordCount > 20) { score += 2; factors.push('length'); }
    if (features.hasCode) { score += 1; factors.push('code'); }

    // Determine complexity level
    let level = 'low';
    if (score >= 6) level = 'high';
    else if (score >= 3) level = 'medium';

    return {
      level,
      score,
      factors,
      confidence: Math.min(score / 10, 1.0)
    };
  }

  /**
   * Extract requirements from task description
   * @param {Object} task - Task to analyze
   * @returns {Object} Extracted requirements
   */
  extractRequirements(task) {
    const text = typeof task === 'string' ? task : JSON.stringify(task);
    const requirements = {
      tools: [],
      skills: [],
      time: 'medium',
      priority: 'medium'
    };

    // Extract tool requirements
    const toolPatterns = [
      { pattern: /mcp|tool|framework/gi, category: 'tools' },
      { pattern: /javascript|js|typescript|ts/gi, category: 'languages' },
      { pattern: /css|scss|html/gi, category: 'frontend' },
      { pattern: /node|npm|yarn/gi, category: 'backend' }
    ];

    toolPatterns.forEach(({ pattern, category }) => {
      const matches = text.match(pattern);
      if (matches) {
        requirements.tools.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Extract time requirements
    if (text.match(/quick|fast|urgent|asap/gi)) {
      requirements.time = 'high';
      requirements.priority = 'high';
    } else if (text.match(/slow|thorough|detailed/gi)) {
      requirements.time = 'low';
    }

    return requirements;
  }

  /**
   * Identify constraints from environment
   * @param {Object} environment - Environment context
   * @returns {Object} Identified constraints
   */
  identifyConstraints(environment) {
    return {
      mode: environment.mode || 'operational',
      availableTools: environment.availableTools || [],
      timeLimit: environment.timeLimit || null,
      complexity: environment.complexity || 'medium',
      domain: environment.domain || 'general'
    };
  }

  /**
   * Find patterns in task history
   * @param {Array} history - Task history
   * @returns {Object} Pattern analysis
   */
  findPatterns(history) {
    if (!history || history.length === 0) {
      return { patterns: [], confidence: 0 };
    }

    const patterns = [];
    const recentTasks = history.slice(-10); // Last 10 tasks

    // Analyze task type patterns
    const taskTypes = recentTasks.map(task => this.classifyTask(task).primary);
    const typeFrequency = {};
    taskTypes.forEach(type => {
      typeFrequency[type] = (typeFrequency[type] || 0) + 1;
    });

    // Find most common patterns
    Object.entries(typeFrequency)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .forEach(([type, count]) => {
        patterns.push({
          type: 'task_type',
          value: type,
          frequency: count,
          confidence: count / recentTasks.length
        });
      });

    return {
      patterns,
      confidence: patterns.length > 0 ? Math.max(...patterns.map(p => p.confidence)) : 0
    };
  }

  /**
   * Analyze performance implications
   * @param {Object} task - Task to analyze
   * @returns {Object} Performance analysis
   */
  analyzePerformance(task) {
    const complexity = this.assessComplexity(task);
    const requirements = this.extractRequirements(task);

    return {
      estimatedTime: this.estimateTime(complexity, requirements),
      resourceIntensity: this.assessResourceIntensity(complexity),
      optimizationOpportunities: this.identifyOptimizations(task)
    };
  }

  /**
   * Generate rule recommendations based on analysis
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @returns {Object} Rule recommendations
   */
  generateRecommendations(task, environment) {
    const classification = this.classifyTask(task);
    const complexity = this.assessComplexity(task);
    const requirements = this.extractRequirements(task);

    const recommendations = {
      primaryRules: this.selectPrimaryRules(classification, complexity),
      secondaryRules: this.selectSecondaryRules(classification, complexity),
      optionalRules: this.selectOptionalRules(requirements),
      thinkingApproach: this.recommendThinkingApproach(complexity, classification),
      toolRecommendations: this.recommendTools(requirements, environment)
    };

    return recommendations;
  }

  /**
   * Select primary rules based on classification and complexity
   * @param {Object} classification - Task classification
   * @param {Object} complexity - Complexity assessment
   * @returns {Array} Primary rule recommendations
   */
  selectPrimaryRules(classification, complexity) {
    const rules = ['thinking-framework.mdc'];

    // Add complexity-based rules
    if (complexity.level === 'high') {
      rules.push('thinking-framework.mdc'); // Use thinking-framework.mdc for sequential thinking
    }

    // Add task-type specific rules
    switch (classification.primary) {
      case 'debugging':
        rules.push('scss-debugging.mdc');
        break;
      case 'implementation':
        rules.push('js-development.mdc');
        break;
      case 'design':
        rules.push('scss-modern-css-frameworks.mdc');
        break;
      case 'analysis':
        rules.push('mcp-context7.mdc');
        break;
    }

    return rules;
  }

  /**
   * Select secondary rules for additional context
   * @param {Object} classification - Task classification
   * @param {Object} complexity - Complexity assessment
   * @returns {Array} Secondary rule recommendations
   */
  selectSecondaryRules(classification, complexity) {
    const rules = [];

    // Add domain-specific rules based on requirements
    if (classification.primary === 'implementation') {
      rules.push('perchance-architecture.mdc');
      rules.push('perchance-development-lifecycle.mdc');
    }

    if (complexity.level === 'medium' || complexity.level === 'high') {
      rules.push('system-context-aware-rule-loading-enhanced.mdc');
    }

    return rules;
  }

  /**
   * Select optional rules based on requirements
   * @param {Object} requirements - Task requirements
   * @returns {Array} Optional rule recommendations
   */
  selectOptionalRules(requirements) {
    const rules = [];

    if (requirements.tools.includes('mcp')) {
      rules.push('mcp-comprehensive-guide.mdc');
    }

    if (requirements.tools.includes('css') || requirements.tools.includes('scss')) {
      rules.push('scss-advanced-patterns.mdc');
    }

    return rules;
  }

  /**
   * Recommend thinking approach based on complexity and classification
   * @param {Object} complexity - Complexity assessment
   * @param {Object} classification - Task classification
   * @returns {String} Recommended thinking approach
   */
  recommendThinkingApproach(complexity, classification) {
    if (complexity.level === 'high') {
      return 'sequential';
    } else if (complexity.level === 'low' && classification.primary === 'implementation') {
      return 'professional';
    } else {
      return 'contemplative';
    }
  }

  /**
   * Recommend tools based on requirements and environment
   * @param {Object} requirements - Task requirements
   * @param {Object} environment - Environment context
   * @returns {Array} Tool recommendations
   */
  recommendTools(requirements, environment) {
    const tools = [];

    if (requirements.tools.includes('mcp')) {
      tools.push('memory-bank-mcp', 'context7-mcp', 'sequential-thinking-tools');
    }

    if (requirements.time === 'high') {
      tools.push('fast-execution-tools');
    }

    return tools;
  }

  /**
   * Generate unique context ID for caching
   * @param {Object} task - Task object
   * @param {Object} environment - Environment object
   * @returns {String} Unique context ID
   */
  generateContextId(task, environment) {
    const taskStr = typeof task === 'string' ? task : JSON.stringify(task);
    const envStr = JSON.stringify(environment);
    return btoa(taskStr + envStr).slice(0, 16);
  }

  /**
   * Estimate time based on complexity and requirements
   * @param {Object} complexity - Complexity assessment
   * @param {Object} requirements - Task requirements
   * @returns {String} Time estimate
   */
  estimateTime(complexity, requirements) {
    const baseTime = {
      low: 30,
      medium: 120,
      high: 480
    };

    let time = baseTime[complexity.level] || 120;

    if (requirements.time === 'high') {
      time *= 0.5;
    } else if (requirements.time === 'low') {
      time *= 2;
    }

    return `${Math.round(time)} minutes`;
  }

  /**
   * Assess resource intensity
   * @param {Object} complexity - Complexity assessment
   * @returns {String} Resource intensity level
   */
  assessResourceIntensity(complexity) {
    if (complexity.level === 'high') return 'high';
    if (complexity.level === 'medium') return 'medium';
    return 'low';
  }

  /**
   * Identify optimization opportunities
   * @param {Object} task - Task to analyze
   * @returns {Array} Optimization opportunities
   */
  identifyOptimizations(task) {
    const optimizations = [];
    const features = this.extractTaskFeatures(task);

    if (features.wordCount > 50) {
      optimizations.push('Consider breaking down into smaller tasks');
    }

    if (features.hasComplex) {
      optimizations.push('Use sequential thinking approach');
    }

    if (features.hasTools) {
      optimizations.push('Leverage MCP ecosystem for automation');
    }

    return optimizations;
  }
}

/**
 * ML Model for Task Classification
 */
class TaskClassificationModel {
  constructor() {
    this.model = this.initializeModel();
  }

  initializeModel() {
    // Simple rule-based model - in production, this would be a trained ML model
    return {
      predict: (features) => this.predictTaskType(features)
    };
  }

  predictTaskType(features) {
    let primary = 'general';
    let secondary = 'general';
    let confidence = 0.6; // Enhanced base confidence
    let reasoning = [];
    let featureCount = 0;

    // Enhanced primary task type detection with weighted scoring
    if (features.hasDebug) {
      primary = 'debugging';
      confidence = 0.85; // Increased confidence
      featureCount++;
      reasoning.push('Task contains debugging keywords');
    } else if (features.hasImplement) {
      primary = 'implementation';
      confidence = 0.8; // Increased confidence
      featureCount++;
      reasoning.push('Task contains implementation keywords');
    } else if (features.hasDesign) {
      primary = 'design';
      confidence = 0.8; // Increased confidence
      featureCount++;
      reasoning.push('Task contains design keywords');
    } else if (features.hasAnalyze) {
      primary = 'analysis';
      confidence = 0.75; // Increased confidence
      featureCount++;
      reasoning.push('Task contains analysis keywords');
    } else if (features.hasOptimize) {
      primary = 'optimization';
      confidence = 0.75; // Increased confidence
      featureCount++;
      reasoning.push('Task contains optimization keywords');
    }

    // Enhanced secondary task type detection with weighted scoring
    if (features.hasComplex && primary !== 'debugging') {
      secondary = 'complex';
      confidence += 0.05; // Bonus for complexity detection
      featureCount++;
      reasoning.push('Task appears to be complex');
    } else if (features.hasSimple) {
      secondary = 'simple';
      confidence += 0.03; // Bonus for simplicity detection
      featureCount++;
      reasoning.push('Task appears to be simple');
    }

    // Enhanced confidence calculation based on feature count and context
    if (featureCount > 1) {
      confidence += 0.05; // Bonus for multiple feature detection
      reasoning.push('Multiple task characteristics detected');
    }

    // Domain-specific confidence adjustments
    if (features.hasFrontend) {
      confidence += 0.02;
      reasoning.push('Frontend domain detected');
    }
    if (features.hasBackend) {
      confidence += 0.03;
      reasoning.push('Backend domain detected');
    }
    if (features.hasDevOps) {
      confidence += 0.04;
      reasoning.push('DevOps domain detected');
    }

    // Cap confidence at 0.95 to maintain realism
    confidence = Math.min(confidence, 0.95);

    return {
      primary,
      secondary,
      confidence,
      reasoning: reasoning.join('; ')
    };
  }
}

/**
 * Performance Tracker
 */
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
  }

  trackPerformance(taskId, metrics) {
    this.metrics.set(taskId, {
      ...metrics,
      timestamp: Date.now()
    });
  }

  getPerformanceScore(taskType) {
    const relevantMetrics = Array.from(this.metrics.values())
      .filter(m => m.taskType === taskType)
      .slice(-10); // Last 10 tasks

    if (relevantMetrics.length === 0) return 0.5;

    const avgScore = relevantMetrics.reduce((sum, m) => sum + m.score, 0) / relevantMetrics.length;
    return Math.min(avgScore, 1.0);
  }
}

/**
 * Rule Repository
 */
class RuleRepository {
  constructor() {
    this.rules = new Map();
    this.loadRules();
  }

  loadRules() {
    // In production, this would load from the actual rule files
    const ruleDefinitions = [
      { id: 'thinking-framework.mdc', category: 'core', priority: 1 },
      { id: 'system-context-aware-rule-loading-enhanced.mdc', category: 'system', priority: 1 },
      { id: 'js-development.mdc', category: 'development', priority: 3 },
      { id: 'scss-modern-css-frameworks.mdc', category: 'frontend', priority: 3 },
      { id: 'scss-debugging.mdc', category: 'debugging', priority: 4 },
      { id: 'perchance-architecture.mdc', category: 'architecture', priority: 2 },
      { id: 'mcp-comprehensive-guide.mdc', category: 'tools', priority: 3 },
      { id: 'mcp-context7.mdc', category: 'tools', priority: 3 }
    ];

    ruleDefinitions.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  findCandidates(context) {
    return Array.from(this.rules.values())
      .filter(rule => this.isRelevant(rule, context))
      .sort((a, b) => a.priority - b.priority);
  }

  isRelevant(rule, context) {
    // Simple relevance check - in production, this would be more sophisticated
    return true;
  }
}

// Export the main class
module.exports = ContextAnalyzer;

// Example usage
if (require.main === module) {
  const analyzer = new ContextAnalyzer();
  
  const task = "Implement a new feature for the RPGlitch app that adds AI-driven rule selection";
  const environment = { mode: 'operational', availableTools: ['mcp', 'javascript'] };
  
  const analysis = analyzer.analyzeContext(task, environment);
  console.log('Context Analysis:', JSON.stringify(analysis, null, 2));
}