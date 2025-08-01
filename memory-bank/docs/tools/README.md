# Development Tools

## Overview

This directory contains various development tools and utilities for the project.

## Structure

```
tools/
├── diagnostics/         # Diagnostic and analysis tools
├── ai-rule-selection/   # AI-powered rule selection tools
├── browser-tools/       # Browser automation tools
├── test-globs/          # Testing utilities
└── archives/            # Archived tools and reports
```

## Tools

### Diagnostics

- **automation-collect-diagnostics.js**: Automated diagnostic collection
- **atomic-class-generator.js**: CSS class generation utility
- **css-cleanup.js**: CSS cleanup and optimization
- **css-performance-analyzer.js**: CSS performance analysis

### AI Rule Selection

- **context-analyzer.js**: Context analysis for rule selection
- **intelligent-rule-selector.js**: Intelligent rule selection
- **performance-optimizer.js**: Performance optimization
- **task-classifier.js**: Task classification

### Browser Tools

- Browser automation and testing utilities

### Test Globs

- Testing utilities and patterns

### Debugging Helpers

- `install-busybox.sh` installs BusyBox which provides the `hexdump` tool for binary inspection. Run from `tools/setup` to install.
  After installation, you can invoke hexdump via BusyBox, e.g.:

  ```bash
  busybox hexdump -C path/to/file | head
  ```

  If building a Docker image, ensure the script runs in the Dockerfile so BusyBox is available at runtime.

## Usage

Each tool directory contains specific utilities for different aspects of development. Refer to individual tool directories for detailed documentation.

## Archives

Old diagnostic reports and outdated tools are stored in the `archives/` directory.
