# Multi-Agent Project Configuration

## Project-Agnostic Agent Roles

### Agent 1: Core Systems Specialist
**Focus**: Complex business logic, data operations, AI integration, algorithms  
**Skills**: Advanced programming, data structures, API integration, complex problem-solving

### Agent 2: User Experience Specialist  
**Focus**: User interface, design, user interactions, usability, accessibility  
**Skills**: UI/UX design, frontend development, user psychology, visual design

---

## Project Configurations

### RPGlitch Configuration
```yaml
project: RPGlitch
base_path: Perchance/RPGlitch/

agent_1_files:
  - RPGlitch.js (core logic, database, AI integration)
  - modules/database.js (if modular)
  - modules/ai-integration.js (if modular)

agent_2_files:
  - RPGlitch.html (structure, templates)
  - RPGlitch.css (styling, responsive design)
  - modules/ui-components.js (if modular)

coordination_points:
  - DOM element IDs and classes
  - Data attributes for JS interaction
  - CSS classes for state management
  - Event handling interfaces
```

### ImageGlitch Configuration
```yaml
project: ImageGlitch
base_path: Perchance/ImageGlitch/

agent_1_files:
  - ImageGlitch.js (core logic, prompt processing, AI integration)
  - modules/prompt-engine.js (if modular)
  - modules/image-generation.js (if modular)

agent_2_files:
  - ImageGlitch.html (structure, templates)
  - ImageGlitch.css (styling, responsive design)
  - modules/ui-components.js (if modular)

coordination_points:
  - Image gallery interfaces
  - Prompt input and processing
  - Settings and configuration UI
  - Generation status and feedback
```

### Generic Web Project Configuration
```yaml
project: Generic
base_path: project_root/

agent_1_files:
  - backend/ (business logic)
  - data/ (data management)
  - integrations/ (API integrations)
  - core/ (core algorithms)

agent_2_files:
  - frontend/ (user interface)
  - styles/ (styling and design)
  - components/ (UI components)
  - assets/ (images, icons)

coordination_points:
  - API contracts between frontend/backend
  - Data models and interfaces
  - UI component specifications
  - Integration testing scenarios
```

---

## Configuration Usage

### Startup Process
1. Read project config for current project
2. Determine agent roles based on configuration
3. Set file ownership according to config
4. Establish coordination points from config

### Handoff Process
1. Use project-specific templates
2. Reference coordination points from config
3. Transfer file ownership per config
4. Set project-specific integration requirements

### Project Switching
- Same agents can work on different projects
- Different configurations for each project
- Consistent agent roles across projects
- Project-specific coordination points

---

## Benefits of Generic System

### Flexibility
- Any Project: Works with RPGlitch, ImageGlitch, or any web project
- Any Tech Stack: Adaptable to different technologies
- Any Team Size: Works with 1, 2 agents

### Consistency
- Same Agent Roles: Consistent specialization across projects
- Same Rules: All agents follow same quality standards
- Same Processes: Handoff/handback works everywhere

### Scalability
- New Projects: Easy to add new project configurations
- Team Changes: Agents can switch between projects
- Skill Development: Agents specialize in their domain across projects
