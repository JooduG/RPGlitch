# MCP Reference Guide

## Quick Commands for Daily Use

### Orchestrator Commands

**Automatic Mode (Recommended)**:

- Just describe your task - the orchestrator selects optimal role and approach
- "Fix the typo in login button" → Operational + Professional Coding
- "Add character preview feature" → Tactical + Sequential Thinking  
- "Optimize development workflow" → Strategic + Contemplative Thinking

**Manual Role Selection**:

- `strategic` → Strategic Role (System Architect)
- `tactical` → Tactical Role (Project Planner)  
- `operational` → Operational Role (Code Implementer)

### Daily Workflow

**Morning Setup**:

- "Show me the current todo list"
- "What's the next priority task?"
- "Show me what we worked on yesterday"

**Development Tasks**:

- "Create a new [component]"
- "Debug the [issue]"
- "Optimize [code] for performance"
- "Fix [validation] errors"

**Documentation**:

- "Update user guide with this feature"
- "Add this pattern to design system"
- "Create troubleshooting guide"

### Memory & Documentation Access

- "Show me what we learned about [topic]"
- "Read the [guide] documentation"
- "Save this solution to troubleshooting"
- "Find React hooks documentation"
- "Search for JavaScript error handling"

## Complete MCP Commands Reference

### File System Operations

- `fsRead` - Read file contents
- `fsWrite` - Create/append files
- `fsReplace` - Search and replace in files
- `listDirectory` - List directory contents
- `fileSearch` - Fuzzy search for files

### Command Execution

- `executeBash` - Execute Windows cmd.exe commands
- `execute_command` - Execute shell commands
- `get_platform_info` - Get platform information
- `get_whitelist` - Get whitelisted commands
- `add_to_whitelist` - Add command to whitelist
- `update_security_level` - Update command security
- `remove_from_whitelist` - Remove from whitelist
- `get_pending_commands` - Get pending approvals
- `approve_command` - Approve pending command
- `deny_command` - Deny pending command

### Code Review & Analysis

- `codeReview` - Comprehensive code analysis (SAST, secrets, quality)
- `displayFindings` - Display code issues in panel
- `search_code` - Regex code search across repositories
- `list_repos` - List available repositories
- `get_file_source` - Get source code for files
- `dump_codebase_context` - Read entire codebase with chunking

### Browser Automation

- `browser_navigate` - Navigate to URL
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_snapshot` - Capture page state
- `browser_take_screenshot` - Take screenshots
- `browser_evaluate` - Execute JavaScript
- `browser_wait_for` - Wait for conditions
- `browser_tab_new` - Open new tab
- `browser_tab_select` - Switch tabs
- `browser_close` - Close browser

### Documentation & Search

- `microsoft_docs_search` - Search Microsoft documentation
- `microsoft_docs_fetch` - Fetch complete documentation pages
- `resolve-library-id` - Resolve library names to IDs
- `get-library-docs` - Get library documentation

### Time & Conversion

- `get_current_time` - Get current time in timezone
- `convert_time` - Convert between timezones

### Reasoning & Analysis

- `multiagentdebate` - Multi-persona debate tool
- `sequentialthinking` - Dynamic problem-solving
- `sequentialthinking_tools` - Sequential thinking with tool recommendations
- `scientificMethod` - Scientific method reasoning
- `collaborativeReasoning` - Multi-expert collaboration
- `metacognitiveMonitoring` - Self-monitoring of reasoning
- `clear_thought` - Unified reasoning operations

### NPM Package Analysis

- `npmVersions` - Get package versions
- `npmLatest` - Get latest version and changelog
- `npmDeps` - Analyze dependencies
- `npmTypes` - Check TypeScript types
- `npmSize` - Get package size info
- `npmVulnerabilities` - Check for vulnerabilities
- `npmTrends` - Get download trends
- `npmCompare` - Compare packages
- `npmMaintainers` - Get maintainer info
- `npmScore` - Get package quality scores
- `npmPackageReadme` - Get README content
- `npmSearch` - Search packages
- `npmLicenseCompatibility` - Check license compatibility
- `npmRepoStats` - Get repository statistics
- `npmDeprecated` - Check deprecation status
- `npmChangelogAnalysis` - Analyze changelogs
- `npmAlternatives` - Find alternative packages
- `npmQuality` - Analyze quality metrics
- `npmMaintenance` - Analyze maintenance metrics

### Task Management

- `request_planning` - Create task requests
- `get_next_task` - Get next pending task
- `mark_task_done` - Mark task complete
- `approve_task_completion` - Approve completed task
- `approve_request_completion` - Approve entire request
- `open_task_details` - Get task details
- `list_requests` - List all requests
- `add_tasks_to_request` - Add tasks to request
- `update_task` - Update task details
- `delete_task` - Delete task

### PowerShell Operations

- `run_powershell` - Execute PowerShell code
- `run_powershell_with_progress` - Execute with progress reporting
- `get_system_info` - Get system information
- `get_running_services` - Get service information
- `get_processes` - Get process information
- `get_event_logs` - Get Windows event logs
- `generate_script_from_template` - Generate from templates
- `generate_custom_script` - Generate custom scripts
- `ensure_directory` - Create directories
- `generate_intune_remediation_script` - Create Intune remediation
- `generate_intune_script_pair` - Create Intune detection/remediation
- `generate_bigfix_relevance_script` - Create BigFix relevance
- `generate_bigfix_action_script` - Create BigFix action
- `generate_bigfix_script_pair` - Create BigFix relevance/action

### Knowledge Management

- `create_entities` - Create knowledge entities
- `create_relations` - Create entity relationships
- `add_observations` - Add entity observations
- `delete_entities` - Delete entities
- `delete_observations` - Delete observations
- `delete_relations` - Delete relationships
- `read_graph` - Read entire knowledge graph
- `search_nodes` - Search knowledge nodes
- `open_nodes` - Open specific nodes

### Memory & Notes

- `delete_note` - Delete notes
- `read_content` - Read file content
- `build_context` - Build context from memory
- `recent_activity` - Get recent activity
- `search_notes` - Search notes
- `read_note` - Read specific note
- `view_note` - View formatted note
- `write_note` - Create/update note
- `canvas` - Create Obsidian canvas
- `edit_note` - Edit existing note
- `move_note` - Move note location
- `sync_status` - Check sync status
- `list_memory_projects` - List projects
- `switch_project` - Switch project context
- `get_current_project` - Get current project
- `set_default_project` - Set default project
- `create_memory_project` - Create new project
- `delete_project` - Delete project

### Research & Papers

- `search_research_areas` - Search research areas
- `get_research_area` - Get area details
- `list_research_area_tasks` - List area tasks
- `search_authors` - Search authors
- `get_paper_author` - Get author details
- `list_papers_by_author_id` - List papers by author ID
- `list_papers_by_author_name` - List papers by author name
- `list_conferences` - List conferences
- `get_conference` - Get conference details
- `list_conference_proceedings` - List proceedings
- `get_conference_proceeding` - Get proceeding details
- `list_conference_papers` - List conference papers
- `search_papers` - Search papers
- `get_paper` - Get paper details
- `list_paper_repositories` - List paper repositories
- `list_paper_datasets` - List paper datasets
- `list_paper_methods` - List paper methods
- `list_paper_results` - List paper results
- `list_paper_tasks` - List paper tasks
- `read_paper_from_url` - Read paper from URL

### Hugging Face

- `search-models` - Search HF models
- `get-model-info` - Get model details
- `search-datasets` - Search HF datasets
- `get-dataset-info` - Get dataset details
- `search-spaces` - Search HF Spaces
- `get-space-info` - Get Space details
- `get-paper-info` - Get paper info by arXiv ID
- `get-daily-papers` - Get daily papers
- `search-collections` - Search collections
- `get-collection-info` - Get collection details

### UI Components (Magic UI)

- `getUIComponents` - List all UI components
- `getLayout` - Get layout components
- `getMedia` - Get media components
- `getMotion` - Get motion components
- `getTextReveal` - Get text reveal components
- `getTextEffects` - Get text effect components
- `getButtons` - Get button components
- `getEffects` - Get effect components
- `getWidgets` - Get widget components
- `getBackgrounds` - Get background components
- `getDevices` - Get device components

### GitHub Documentation

- `read_wiki_structure` - Get documentation topics
- `read_wiki_contents` - View repository documentation
- `ask_question` - Ask questions about repositories

### Documentation Tools

- `reindex_docs` - Reindex documentation
- `list_indexed_docs` - List indexed documents

### Utility Tools

- `echo` - Echo messages
- `add` - Add two numbers
- `longRunningOperation` - Demo long operations
- `printEnv` - Print environment variables
- `sampleLLM` - Sample from LLM
- `getTinyImage` - Get example image
- `annotatedMessage` - Demo annotations
- `getResourceReference` - Get resource references
- `startElicitation` - Demo elicitation feature
- `getResourceLinks` - Get resource links
- `structuredContent` - Return structured content

## Troubleshooting

### Common Issues

- "Analyze why the app is slow"
- "Debug the build process"
- "Fix the CSS compilation errors"
- "Debug the Perchance integration"

### System Health

- "Show me the current rule configuration"
- "What MCP servers are available?"
- "Check if all MCP servers are properly configured"

## Success Indicators

✅ **Responses are faster** and more relevant  
✅ **Documentation is always available** when needed  
✅ **Thinking approach matches** task complexity  
✅ **Rules are contextually appropriate**  
✅ **Workflow feels seamless** and intuitive

**Total Commands: 200+**
