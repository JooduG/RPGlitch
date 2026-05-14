# Track Spec: Implement Character Profile Management

## Overview
This track implements the foundational character management system for RPGlitch. It enables users to create, view, edit, and delete character profiles, persisting them locally via Dexie.js.

## Requirements
- **Persistence**: Profiles must be stored in IndexedDB using Dexie.js.
- **Data Model**:
  - `id`: UUID (Primary Key)
  - `name`: String
  - `bio`: Markdown String
  - `stats`: Object (Strength, Agility, Intelligence, etc.)
  - `appearance`: String (Description for image generation)
- **UI Components**:
  - `CharacterDashboard`: Overview of all profiles.
  - `CharacterForm`: Create and Edit interface.
  - `CharacterCard`: Summary view.

## Success Criteria
- User can create a new character.
- Character details are preserved after page refresh.
- Character can be deleted from the dashboard.
- 80% test coverage for the repository and logic.
