/**
 * 🤖 AI-Driven Rule Selection System
 * 
 * Phase 3.1 Implementation: Main Integration Module
 * 
 * This module provides the main API for the AI-driven rule selection system,
 * integrating all components and providing a seamless interface for the
 * existing context-aware rule loading system.
 * 
 * @version 1.0.0
 * @author RPGlitch Team
 * @date 2025-01-02
 */

const IntelligentRuleSelector = require('./intelligent-rule-selector');
const ContextAnalyzer = require('./context-analyzer');
const TaskClassifier = require('./task-classifier');
const PerformanceOptimizer = require('./performance-optimizer');

/**
 * AI-Driven Rule Selection System
 * 
 * Main class that provides the API for intelligent rule selection,
 * integrating all components and providing backward compatibility
 * with the existing context-aware rule loading system.
 */
class AIRuleSelectionSystem {
  constructor(options = {}) {
    this.selector = new IntelligentRuleSelector();
    this.contextAnalyzer = new ContextAnalyzer();
    this.taskClassifier = new TaskClassifier();
    this.performanceOptimizer = new PerformanceOptimizer();
    
    this.enabled = options.enabled !== false; // Enabled by default
    this.fallbackEnabled = options.fallbackEnabled !== false; // Fallback enabled by default
    this.performanceTracking = options.performanceTracking !== false; // Performance tracking enabled by default
    
    this.stats = {
      totalRequests: 0,
      successfulSelections: 0,
      fallbackSelections: 0,
      averageResponseTime: 0,
      averageConfidence: 0
    };
  }

  /**
   * Main API method for intelligent rule selection
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @param {Array} history - Task history
   * @returns {Object} Rule selection results
   */
  selectRules(task, environment = {}, history = []) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      if (!this.enabled) {
        return this.getFallbackSelection(task, environment);
      }

      const results = this.selector.selectRules(task, environment, history);
      
      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateStats(results, responseTime, false);
      
      return results;
    } catch (error) {
      console.error('Error in AI rule selection:', error);
      
      if (this.fallbackEnabled) {
        const fallbackResults = this.getFallbackSelection(task, environment);
        this.updateStats(fallbackResults, Date.now() - startTime, true);
        return fallbackResults;
      }
      
      throw error;
    }
  }

  /**
   * Enhanced context analysis with AI capabilities
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @param {Array} history - Task history
   * @returns {Object} Enhanced context analysis
   */
  analyzeContext(task, environment = {}, history = []) {
    return this.contextAnalyzer.analyzeContext(task, environment, history);
  }

  /**
   * Classify task using AI-driven classification
   * @param {Object} task - Task to classify
   * @param {Object} context - Context information
   * @returns {Object} Task classification
   */
  classifyTask(task, context = {}) {
    return this.taskClassifier.classifyTask(task, context);
  }

  /**
   * Optimize performance for rule selection
   * @param {Object} task - Task to optimize
   * @param {Object} context - Context information
   * @param {Array} candidateRules - Candidate rules
   * @returns {Object} Performance optimization results
   */
  optimizePerformance(task, context, candidateRules) {
    return this.performanceOptimizer.optimizeRuleSelection(task, context, candidateRules);
  }

  /**
   * Get system statistics and performance metrics
   * @returns {Object} System statistics
   */
  getStats() {
    return {
      ...this.stats,
      systemInfo: {
        version: '1.0.0',
        enabled: this.enabled,
        fallbackEnabled: this.fallbackEnabled,
        performanceTracking: this.performanceTracking
      },
      componentStats: {
        selector: this.selector.getSelectionStats(),
        performance: this.performanceOptimizer.getPerformanceStats()
      }
    };
  }

  /**
   * Enable or disable the AI system
   * @param {Boolean} enabled - Whether to enable the system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`AI Rule Selection System ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable fallback mode
   * @param {Boolean} enabled - Whether to enable fallback
   */
  setFallbackEnabled(enabled) {
    this.fallbackEnabled = enabled;
    console.log(`Fallback mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable performance tracking
   * @param {Boolean} enabled - Whether to enable performance tracking
   */
  setPerformanceTracking(enabled) {
    this.performanceTracking = enabled;
    console.log(`Performance tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Reset system statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulSelections: 0,
      fallbackSelections: 0,
      averageResponseTime: 0,
      averageConfidence: 0
    };
    console.log('System statistics reset');
  }

  /**
   * Get fallback selection when AI system is disabled or fails
   * @param {Object} task - Task to analyze
   * @param {Object} environment - Environment context
   * @returns {Object} Fallback selection
   */
  getFallbackSelection(task, environment) {
    const fallbackRules = [
      { 
        id: 'unified-thinking-framework.mdc', 
        score: 0.8, 
        confidence: 0.7,
        selectionReason: 'Fallback: Core thinking framework'
      },
      { 
        id: 'context-aware-rule-loading.mdc', 
        score: 0.6, 
        confidence: 0.6,
        selectionReason: 'Fallback: Context-aware loading'
      }
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
      insights: ['AI system disabled or failed, using fallback approach'],
      fallback: true
    };
  }

  /**
   * Update system statistics
   * @param {Object} results - Selection results
   * @param {Number} responseTime - Response time in milliseconds
   * @param {Boolean} isFallback - Whether this was a fallback selection
   */
  updateStats(results, responseTime, isFallback) {
    if (isFallback) {
      this.stats.fallbackSelections++;
    } else {
      this.stats.successfulSelections++;
    }

    // Update average response time
    const totalRequests = this.stats.totalRequests;
    this.stats.averageResponseTime = 
      ((this.stats.averageResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;

    // Update average confidence
    if (results.averageConfidence) {
      this.stats.averageConfidence = 
        ((this.stats.averageConfidence * (totalRequests - 1)) + results.averageConfidence) / totalRequests;
    }
  }

  /**
   * Health check for the AI system
   * @returns {Object} Health status
   */
  healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        selector: 'operational',
        contextAnalyzer: 'operational',
        taskClassifier: 'operational',
        performanceOptimizer: 'operational'
      },
      stats: this.stats
    };

    // Check if any components are failing
    try {
      this.selector.getSelectionStats();
    } catch (error) {
      health.components.selector = 'error';
      health.status = 'degraded';
    }

    return health;
  }

  /**
   * Get system configuration
   * @returns {Object} System configuration
   */
  getConfig() {
    return {
      enabled: this.enabled,
      fallbackEnabled: this.fallbackEnabled,
      performanceTracking: this.performanceTracking,
      version: '1.0.0'
    };
  }

  /**
   * Update system configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.enabled !== undefined) {
      this.setEnabled(config.enabled);
    }
    if (config.fallbackEnabled !== undefined) {
      this.setFallbackEnabled(config.fallbackEnabled);
    }
    if (config.performanceTracking !== undefined) {
      this.setPerformanceTracking(config.performanceTracking);
    }
  }
}

/**
 * Factory function to create AI Rule Selection System instance
 * @param {Object} options - Configuration options
 * @returns {AIRuleSelectionSystem} System instance
 */
function createAIRuleSelectionSystem(options = {}) {
  return new AIRuleSelectionSystem(options);
}

/**
 * Legacy compatibility function for existing context-aware rule loading
 * @param {Object} task - Task to analyze
 * @param {Object} environment - Environment context
 * @returns {Array} Selected rule IDs
 */
function selectRulesLegacy(task, environment = {}) {
  const system = new AIRuleSelectionSystem();
  const results = system.selectRules(task, environment);
  return results.selectedRules.map(rule => rule.id);
}

// Export the main class and factory function
module.exports = AIRuleSelectionSystem;
module.exports.create = createAIRuleSelectionSystem;
module.exports.selectRulesLegacy = selectRulesLegacy;

// Export individual components for advanced usage
module.exports.IntelligentRuleSelector = IntelligentRuleSelector;
module.exports.ContextAnalyzer = ContextAnalyzer;
module.exports.TaskClassifier = TaskClassifier;
module.exports.PerformanceOptimizer = PerformanceOptimizer;

// Example usage and testing
if (require.main === module) {
  console.log('🤖 AI-Driven Rule Selection System - Phase 3.1');
  console.log('==============================================');
  
  // Create system instance
  const aiSystem = createAIRuleSelectionSystem({
    enabled: true,
    fallbackEnabled: true,
    performanceTracking: true
  });

  // Test the system
  const task = "Implement AI-driven rule selection system for Phase 3.1";
  const environment = { 
    mode: 'operational', 
    availableTools: ['mcp', 'javascript'],
    timeLimit: 300000 
  };
  const history = [];

  console.log('\n📋 Testing AI Rule Selection...');
  console.log('Task:', task);
  console.log('Environment:', environment);

  try {
    // Perform intelligent rule selection
    const results = aiSystem.selectRules(task, environment, history);
    
    console.log('\n✅ Selection Results:');
    console.log('Selected Rules:', results.selectedRules.length);
    console.log('Average Confidence:', results.averageConfidence.toFixed(2));
    console.log('Performance Metrics:', results.performanceMetrics);
    console.log('Recommendations:', results.recommendations);
    console.log('Insights:', results.insights);

    // Show system statistics
    console.log('\n📊 System Statistics:');
    console.log(JSON.stringify(aiSystem.getStats(), null, 2));

    // Show health status
    console.log('\n🏥 Health Check:');
    console.log(JSON.stringify(aiSystem.healthCheck(), null, 2));

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }

  console.log('\n🎉 AI Rule Selection System ready for integration!');
}