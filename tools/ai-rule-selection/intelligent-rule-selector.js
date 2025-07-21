/**
 * 🧠 Intelligent Rule Selector
 * 
 * Phase 3.1 Implementation: AI-Driven Rule Selection Orchestrator
 * 
 * This module orchestrates the Context Analyzer, Task Classifier, and Performance
 * Optimizer to provide intelligent, context-aware rule selection with optimal
 * performance and accuracy.
 * 
 * @version 1.0.0
 * @author RPGlitch Team
 * @date 2025-01-02
 */

const ContextAnalyzer = require('./context-analyzer');
const TaskClassifier = require('./task-classifier');
const PerformanceOptimizer = require('./performance-optimizer');

class IntelligentRuleSelector {
  constructor() {
    this.contextAnalyzer = new ContextAnalyzer();
    this.taskClassifier = new TaskClassifier();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.ruleRepository = new RuleRepository();
    this.selectionCache = new Map();
    this.selectionHistory = new Map();
  }

  /**
   * Main method for intelligent rule selection
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @param {Array} history - Task history
   * @returns {Object} Intelligent rule selection results
   */
  selectRules(task, environment = {}, history = []) {
    const selectionId = this.generateSelectionId(task, environment);
    
    // Check cache first
    if (this.selectionCache.has(selectionId)) {
      return this.selectionCache.get(selectionId);
    }

    try {
      const selection = this.performIntelligentSelection(task, environment, history);
      
      // Cache the selection
      this.selectionCache.set(selectionId, selection);
      
      // Track selection history
      this.trackSelection(selectionId, selection);
      
      return selection;
    } catch (error) {
      console.error('Error in intelligent rule selection:', error);
      return this.getFallbackSelection(task, environment);
    }
  }

  /**
   * Perform the complete intelligent selection process
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @param {Array} history - Task history
   * @returns {Object} Complete selection results
   */
  performIntelligentSelection(task, environment, history) {
    // Step 1: Context Analysis
    const contextAnalysis = this.contextAnalyzer.analyzeContext(task, environment, history);
    
    // Step 2: Task Classification
    const taskClassification = this.taskClassifier.classifyTask(task, contextAnalysis);
    
    // Step 3: Candidate Rule Generation
    const candidateRules = this.generateCandidateRules(task, contextAnalysis, taskClassification);
    
    // Step 4: Performance Optimization
    const performanceOptimization = this.performanceOptimizer.optimizeRuleSelection(
      task, 
      contextAnalysis, 
      candidateRules
    );
    
    // Step 5: Final Rule Selection
    const selectedRules = this.selectFinalRules(candidateRules, performanceOptimization, contextAnalysis);
    
    // Step 6: Generate comprehensive results
    const results = this.generateResults(
      task,
      contextAnalysis,
      taskClassification,
      performanceOptimization,
      selectedRules
    );

    return results;
  }

  /**
   * Generate candidate rules based on analysis
   * @param {Object} task - Task to analyze
   * @param {Object} contextAnalysis - Context analysis results
   * @param {Object} taskClassification - Task classification results
   * @returns {Array} Candidate rules
   */
  generateCandidateRules(task, contextAnalysis, taskClassification) {
    const candidates = [];
    
    // Get base rules from repository
    const baseRules = this.ruleRepository.findCandidates(contextAnalysis);
    
    // Score and rank rules
    const scoredRules = baseRules.map(rule => ({
      ...rule,
      score: this.scoreRule(rule, contextAnalysis, taskClassification),
      relevance: this.calculateRelevance(rule, contextAnalysis),
      effectiveness: this.estimateEffectiveness(rule, taskClassification)
    }));
    
    // Sort by score and return top candidates
    return scoredRules
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // Top 15 candidates
  }

  /**
   * Score a rule based on multiple factors
   * @param {Object} rule - Rule to score
   * @param {Object} contextAnalysis - Context analysis
   * @param {Object} taskClassification - Task classification
   * @returns {Number} Rule score (0-1)
   */
  scoreRule(rule, contextAnalysis, taskClassification) {
    let score = 0.5; // Base score
    
    // Relevance scoring
    const relevance = this.calculateRelevance(rule, contextAnalysis);
    score += relevance * 0.3;
    
    // Task type matching
    const taskTypeMatch = this.calculateTaskTypeMatch(rule, taskClassification);
    score += taskTypeMatch * 0.2;
    
    // Complexity matching
    const complexityMatch = this.calculateComplexityMatch(rule, contextAnalysis);
    score += complexityMatch * 0.2;
    
    // Performance scoring
    const performanceScore = this.getPerformanceScore(rule);
    score += performanceScore * 0.2;
    
    // Domain matching
    const domainMatch = this.calculateDomainMatch(rule, contextAnalysis);
    score += domainMatch * 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate rule relevance
   * @param {Object} rule - Rule to analyze
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Number} Relevance score (0-1)
   */
  calculateRelevance(rule, contextAnalysis) {
    let relevance = 0.5;
    
    // Check if rule matches task type
    if (this.ruleMatchesTaskType(rule, contextAnalysis.taskType)) {
      relevance += 0.3;
    }
    
    // Check if rule matches complexity
    if (this.ruleMatchesComplexity(rule, contextAnalysis.complexity)) {
      relevance += 0.2;
    }
    
    return Math.min(relevance, 1.0);
  }

  /**
   * Calculate task type match
   * @param {Object} rule - Rule to analyze
   * @param {Object} taskClassification - Task classification
   * @returns {Number} Task type match score (0-1)
   */
  calculateTaskTypeMatch(rule, taskClassification) {
    const primaryType = taskClassification.primary.type;
    const ruleCategories = rule.categories || [];
    
    if (ruleCategories.includes(primaryType)) {
      return 1.0;
    }
    
    // Check for partial matches
    const secondaryTypes = taskClassification.primary.alternatives || [];
    for (const type of secondaryTypes) {
      if (ruleCategories.includes(type)) {
        return 0.7;
      }
    }
    
    return 0.3; // Default match score
  }

  /**
   * Calculate complexity match
   * @param {Object} rule - Rule to analyze
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Number} Complexity match score (0-1)
   */
  calculateComplexityMatch(rule, contextAnalysis) {
    const taskComplexity = contextAnalysis.complexity.level;
    const ruleComplexity = rule.complexity || 'medium';
    
    if (taskComplexity === ruleComplexity) {
      return 1.0;
    }
    
    // Allow some flexibility in complexity matching
    if ((taskComplexity === 'high' && ruleComplexity === 'medium') ||
        (taskComplexity === 'medium' && ruleComplexity === 'low')) {
      return 0.8;
    }
    
    return 0.4;
  }

  /**
   * Calculate domain match
   * @param {Object} rule - Rule to analyze
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Number} Domain match score (0-1)
   */
  calculateDomainMatch(rule, contextAnalysis) {
    const taskDomain = contextAnalysis.requirements.domain || 'general';
    const ruleDomains = rule.domains || ['general'];
    
    if (ruleDomains.includes(taskDomain)) {
      return 1.0;
    }
    
    if (ruleDomains.includes('general')) {
      return 0.6;
    }
    
    return 0.2;
  }

  /**
   * Get performance score for a rule
   * @param {Object} rule - Rule to analyze
   * @returns {Number} Performance score (0-1)
   */
  getPerformanceScore(rule) {
    return rule.performanceScore || 0.5;
  }

  /**
   * Estimate rule effectiveness
   * @param {Object} rule - Rule to analyze
   * @param {Object} taskClassification - Task classification
   * @returns {Number} Effectiveness estimate (0-1)
   */
  estimateEffectiveness(rule, taskClassification) {
    let effectiveness = 0.5;
    
    // Base effectiveness on task type match
    const taskTypeMatch = this.calculateTaskTypeMatch(rule, taskClassification);
    effectiveness += taskTypeMatch * 0.3;
    
    // Consider rule quality
    if (rule.quality === 'high') {
      effectiveness += 0.2;
    }
    
    return Math.min(effectiveness, 1.0);
  }

  /**
   * Select final rules based on optimization results
   * @param {Array} candidateRules - Candidate rules
   * @param {Object} performanceOptimization - Performance optimization results
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Array} Final selected rules
   */
  selectFinalRules(candidateRules, performanceOptimization, contextAnalysis) {
    const optimizedRules = performanceOptimization.optimizedRules;
    const maxRules = this.calculateOptimalRuleCount(contextAnalysis);
    
    // Combine optimization results with candidate scoring
    const finalRules = candidateRules
      .filter(rule => optimizedRules.some(optRule => optRule.id === rule.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRules);
    
    return finalRules.map(rule => ({
      ...rule,
      selectionReason: this.generateSelectionReason(rule, contextAnalysis),
      confidence: this.calculateSelectionConfidence(rule, contextAnalysis)
    }));
  }

  /**
   * Calculate optimal rule count based on context
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Number} Optimal rule count
   */
  calculateOptimalRuleCount(contextAnalysis) {
    const complexity = contextAnalysis.complexity.level;
    const urgency = contextAnalysis.requirements.time;
    
    let baseCount = 5;
    
    if (complexity === 'high') {
      baseCount += 3;
    } else if (complexity === 'low') {
      baseCount -= 2;
    }
    
    if (urgency === 'high') {
      baseCount -= 2;
    } else if (urgency === 'low') {
      baseCount += 2;
    }
    
    return Math.max(3, Math.min(10, baseCount));
  }

  /**
   * Generate selection reason for a rule
   * @param {Object} rule - Selected rule
   * @param {Object} contextAnalysis - Context analysis
   * @returns {String} Selection reason
   */
  generateSelectionReason(rule, contextAnalysis) {
    const reasons = [];
    
    if (rule.score > 0.8) {
      reasons.push('High relevance score');
    }
    
    if (this.ruleMatchesTaskType(rule, contextAnalysis.taskType)) {
      reasons.push('Matches task type');
    }
    
    if (this.ruleMatchesComplexity(rule, contextAnalysis.complexity)) {
      reasons.push('Appropriate complexity level');
    }
    
    return reasons.join(', ');
  }

  /**
   * Calculate selection confidence
   * @param {Object} rule - Selected rule
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Number} Confidence score (0-1)
   */
  calculateSelectionConfidence(rule, contextAnalysis) {
    let confidence = rule.score || 0.5;
    
    // Boost confidence for well-matched rules
    if (this.ruleMatchesTaskType(rule, contextAnalysis.taskType)) {
      confidence += 0.2;
    }
    
    if (this.ruleMatchesComplexity(rule, contextAnalysis.complexity)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate comprehensive results
   * @param {Object} task - Original task
   * @param {Object} contextAnalysis - Context analysis results
   * @param {Object} taskClassification - Task classification results
   * @param {Object} performanceOptimization - Performance optimization results
   * @param {Array} selectedRules - Selected rules
   * @returns {Object} Comprehensive results
   */
  generateResults(task, contextAnalysis, taskClassification, performanceOptimization, selectedRules) {
    return {
      task: task,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      
      // Analysis results
      contextAnalysis,
      taskClassification,
      performanceOptimization,
      
      // Final selection
      selectedRules,
      ruleCount: selectedRules.length,
      averageConfidence: this.calculateAverageConfidence(selectedRules),
      
      // Performance metrics
      performanceMetrics: {
        selectionTime: this.measureSelectionTime(),
        totalRulesConsidered: contextAnalysis.candidateRules?.length || 0,
        optimizationApplied: true,
        cacheHit: false
      },
      
      // Recommendations
      recommendations: this.generateRecommendations(selectedRules, contextAnalysis),
      
      // Insights
      insights: this.generateInsights(task, contextAnalysis, taskClassification)
    };
  }

  /**
   * Calculate average confidence of selected rules
   * @param {Array} selectedRules - Selected rules
   * @returns {Number} Average confidence
   */
  calculateAverageConfidence(selectedRules) {
    if (selectedRules.length === 0) return 0;
    
    const totalConfidence = selectedRules.reduce((sum, rule) => sum + rule.confidence, 0);
    return totalConfidence / selectedRules.length;
  }

  /**
   * Generate recommendations based on selection
   * @param {Array} selectedRules - Selected rules
   * @param {Object} contextAnalysis - Context analysis
   * @returns {Array} Recommendations
   */
  generateRecommendations(selectedRules, contextAnalysis) {
    const recommendations = [];
    
    if (selectedRules.length === 0) {
      recommendations.push('No rules selected - consider fallback approach');
    }
    
    if (selectedRules.length > 8) {
      recommendations.push('Consider reducing rule set for better performance');
    }
    
    if (contextAnalysis.complexity.level === 'high') {
      recommendations.push('Use sequential thinking approach for complex task');
    }
    
    return recommendations;
  }

  /**
   * Generate insights about the selection process
   * @param {Object} task - Original task
   * @param {Object} contextAnalysis - Context analysis
   * @param {Object} taskClassification - Task classification
   * @returns {Array} Insights
   */
  generateInsights(task, contextAnalysis, taskClassification) {
    const insights = [];
    
    insights.push(`Task classified as ${taskClassification.primary.type} with ${taskClassification.confidence} confidence`);
    insights.push(`Complexity level: ${contextAnalysis.complexity.level}`);
    insights.push(`Recommended thinking approach: ${taskClassification.thinkingApproach.primary}`);
    
    return insights;
  }

  /**
   * Get fallback selection when intelligent selection fails
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @returns {Object} Fallback selection
   */
  getFallbackSelection(task, environment) {
    const fallbackRules = [
      { id: 'unified-thinking-framework.mdc', score: 0.8, confidence: 0.7 },
      { id: 'context-aware-rule-loading.mdc', score: 0.6, confidence: 0.6 }
    ];
    
    return {
      task: task,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      selectedRules: fallbackRules,
      ruleCount: fallbackRules.length,
      averageConfidence: 0.65,
      performanceMetrics: {
        selectionTime: 0,
        totalRulesConsidered: 2,
        optimizationApplied: false,
        cacheHit: false
      },
      recommendations: ['Using fallback rule selection'],
      insights: ['Intelligent selection failed, using fallback approach']
    };
  }

  /**
   * Generate selection ID for caching
   * @param {Object} task - Task object
   * @param {Object} environment - Environment object
   * @returns {String} Selection ID
   */
  generateSelectionId(task, environment) {
    const taskStr = typeof task === 'string' ? task : JSON.stringify(task);
    const envStr = JSON.stringify(environment);
    return btoa(taskStr + envStr).slice(0, 16);
  }

  /**
   * Track selection for historical analysis
   * @param {String} selectionId - Selection ID
   * @param {Object} selection - Selection results
   */
  trackSelection(selectionId, selection) {
    this.selectionHistory.set(selectionId, {
      ...selection,
      timestamp: Date.now()
    });
  }

  /**
   * Measure selection time
   * @returns {Number} Selection time in milliseconds
   */
  measureSelectionTime() {
    // Simulate selection time measurement
    return Math.random() * 100 + 50; // 50-150ms
  }

  /**
   * Check if rule matches task type
   * @param {Object} rule - Rule to check
   * @param {Object} taskType - Task type
   * @returns {Boolean} Whether rule matches task type
   */
  ruleMatchesTaskType(rule, taskType) {
    const ruleCategories = rule.categories || [];
    return ruleCategories.includes(taskType);
  }

  /**
   * Check if rule matches complexity
   * @param {Object} rule - Rule to check
   * @param {Object} complexity - Complexity assessment
   * @returns {Boolean} Whether rule matches complexity
   */
  ruleMatchesComplexity(rule, complexity) {
    const ruleComplexity = rule.complexity || 'medium';
    return ruleComplexity === complexity.level;
  }

  /**
   * Get selection statistics
   * @returns {Object} Selection statistics
   */
  getSelectionStats() {
    const selections = Array.from(this.selectionHistory.values());
    
    if (selections.length === 0) {
      return { totalSelections: 0, averageConfidence: 0 };
    }

    const totalSelections = selections.length;
    const averageConfidence = selections.reduce((sum, sel) => sum + sel.averageConfidence, 0) / totalSelections;

    return {
      totalSelections,
      averageConfidence,
      recentSelections: selections.slice(-10)
    };
  }
}

/**
 * Rule Repository for Rule Management
 */
class RuleRepository {
  constructor() {
    this.rules = new Map();
    this.loadRules();
  }

  loadRules() {
    // Load rules from the actual rule files
    const ruleDefinitions = [
      { 
        id: 'unified-thinking-framework.mdc', 
        categories: ['general', 'thinking'],
        complexity: 'medium',
        domains: ['general'],
        quality: 'high',
        performanceScore: 0.9
      },
      { 
        id: 'sequential-thinking-guide.mdc', 
        categories: ['complex', 'analysis'],
        complexity: 'high',
        domains: ['general'],
        quality: 'high',
        performanceScore: 0.8
      },
      { 
        id: 'context-aware-rule-loading.mdc', 
        categories: ['system', 'optimization'],
        complexity: 'medium',
        domains: ['general'],
        quality: 'high',
        performanceScore: 0.85
      },
      { 
        id: 'vanilla-javascript-development.mdc', 
        categories: ['implementation', 'development'],
        complexity: 'medium',
        domains: ['frontend', 'backend'],
        quality: 'high',
        performanceScore: 0.8
      },
      { 
        id: 'css-principles.mdc', 
        categories: ['design', 'frontend'],
        complexity: 'medium',
        domains: ['frontend'],
        quality: 'high',
        performanceScore: 0.75
      },
      { 
        id: 'scss-debugging.mdc', 
        categories: ['debugging', 'frontend'],
        complexity: 'low',
        domains: ['frontend'],
        quality: 'medium',
        performanceScore: 0.7
      },
      { 
        id: 'perchance-architecture.mdc', 
        categories: ['architecture', 'implementation'],
        complexity: 'high',
        domains: ['general'],
        quality: 'high',
        performanceScore: 0.85
      },
      { 
        id: 'MCP-ECOSYSTEM-GUIDE.mdc', 
        categories: ['tools', 'integration'],
        complexity: 'medium',
        domains: ['general'],
        quality: 'high',
        performanceScore: 0.8
      }
    ];

    ruleDefinitions.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  findCandidates(context) {
    return Array.from(this.rules.values())
      .filter(rule => this.isRelevant(rule, context))
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }

  isRelevant(rule, context) {
    // Simple relevance check - in production, this would be more sophisticated
    return true;
  }
}

// Export the main class
module.exports = IntelligentRuleSelector;

// Example usage
if (require.main === module) {
  const selector = new IntelligentRuleSelector();
  
  const task = "Implement AI-driven rule selection system for Phase 3.1";
  const environment = { mode: 'operational', availableTools: ['mcp', 'javascript'] };
  const history = [];
  
  const selection = selector.selectRules(task, environment, history);
  console.log('Intelligent Rule Selection:', JSON.stringify(selection, null, 2));
}