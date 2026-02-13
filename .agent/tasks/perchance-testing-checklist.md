# Perchance Deployment Testing Checklist

> **Purpose**: Comprehensive testing checklist for features that require validation on Perchance deployment, especially those involving plugins, external services, and responsive layouts.

## 🎯 Priority Testing Areas

### 1. StoryMode (Just Completed)

#### Desktop Layout

- [ ] Verify cinematic 2-8-2 column layout (left panel, center feed, right panel)
- [ ] Confirm full-bleed character panels with images
- [ ] Verify signature color overlays use correct entity colors
- [ ] Check gradient blend mode (hard-light) on panel overlays

#### Mobile Layout (25vh Stacked Header)

- [ ] Confirm panels stack horizontally at top (50% width each)
- [ ] Verify 25vh fixed height for panel row
- [ ] Check border between left/right panels
- [ ] Confirm story feed appears below panels (full width)

#### Message Interactions

- [ ] **Hover States**: Hover over AI messages to reveal action buttons
- [ ] **Timestamp**: Verify timestamp becomes solid (opacity: 1) on hover
- [ ] **Action Buttons**:
    - [ ] **Continue**: Extends last AI message
    - [ ] **Regenerate**: Retries last AI response
    - [ ] **Edit**: Prompts to edit message text
    - [ ] **Copy**: Copies message to clipboard
    - [ ] **Delete**: Removes message from feed
- [ ] **White Text**: All message text is white (#fff) for readability
- [ ] **Button Styling**: Hover shows white background with signature color icons

### 2. Left Panel / Profile Features

#### Profile Display

- [ ] Profile picture loads correctly (fallback if no image)
- [ ] Character name displays with signature color
- [ ] Trait fields render properly
- [ ] Description shows with correct formatting

#### Profile Editing

- [ ] Click "Edit" to open profile editor
- [ ] Trait fields are editable (Name, Personality, etc.)
- [ ] **AI Enhancement**: Click "Enhance" buttons on trait fields
    - [ ] Button updates to "Busy..." immediately
    - [ ] Enhanced trait updates after AI response
    - [ ] Field deselects when enhancement starts
- [ ] **Visual Enhancement**: Click "Paint" to generate new profile image
    - [ ] Uses AI image generation (Perchance plugin)
    - [ ] Image updates in profile after generation
- [ ] **Signature Color**: Color picker works and updates entity color
- [ ] Save changes persist to IndexedDB

#### Profile Panel Interactions

- [ ] Click panel in StoryMode opens full profile view
- [ ] Profile modal closes properly (ESC key, click outside)
- [ ] Nameplate displays correctly (top corner of panel)

### 3. AI Plugin Integration

#### Message Generation

- [ ] User can send messages via input bar
- [ ] AI responds within reasonable time
- [ ] Streaming text appears progressively (if enabled)
- [ ] Loading skeleton shows while AI processes
- [ ] Error handling: network failures display retry button

#### AI-Powered Features

- [ ] **Continue**: Extends AI's last message coherently
- [ ] **Regenerate**: Produces different response to same prompt
- [ ] **Trait Enhancement**: AI improves trait descriptions
- [ ] **Visual Generation**: AI creates character portraits

#### Plugin Configuration

- [ ] Verify Perchance AI plugin is configured correctly
- [ ] Check API key/settings if required
- [ ] Test fallback behavior if plugin unavailable

### 4. Image Generation (Perchance Plugin)

#### Character Visuals

- [ ] Generate new character portrait via "Paint" button
- [ ] Image loads and displays in profile
- [ ] Image persists after page reload (IndexedDB)
- [ ] Fallback color background if image fails

#### Scene Headers (if implemented)

- [ ] Scene transition images generate correctly
- [ ] Images render inline with messages

### 5. Data Persistence (IndexedDB)

#### Character Data

- [ ] Create new character and verify it persists after reload
- [ ] Edit character and verify changes save
- [ ] Delete character and verify removal

#### Story Data

- [ ] Start new story and send messages
- [ ] Reload page and verify story feed persists
- [ ] Delete messages and verify removal
- [ ] "Reset Data" in Control Panel clears all data

#### Settings

- [ ] Toggle DevMode and verify persistence
- [ ] Change theme settings if applicable
- [ ] Verify settings survive page reload

### 6. Responsive Layout (Mobile)

#### Storyboard (Character Selection)

- [ ] Character pills display correctly on mobile
- [ ] Shuffle button works
- [ ] Character selection prevents duplicates (AI ≠ User)
- [ ] "Start Story" button navigates to StoryMode

#### StoryMode Mobile

- [ ] Panels stack at top (verified above)
- [ ] Input bar stays at bottom (sticky)
- [ ] Message bubbles don't overflow (80% max-width)
- [ ] Action buttons work on touch (tap to reveal)

#### Control Panel Mobile

- [ ] Settings modal renders correctly
- [ ] All toggles and buttons accessible
- [ ] Scrolling works if content overflows

### 7. Interactions & Kinetics

#### Hover Effects

- [ ] Message action buttons appear smoothly (200ms transition)
- [ ] StorymodePanel overlay intensifies on hover
- [ ] Button hover states use signature colors

#### Click Feedback

- [ ] All buttons provide visual feedback on click
- [ ] No double-click issues causing duplicate actions
- [ ] Loading states prevent spam clicking

### 8. Freedom Protocol (Security)

#### Storage Override

- [ ] Verify localStorage intercept prevents penalty flags
- [ ] Check console for `[Shield] Freedom Protocol Active.` message
- [ ] No blocked/policy keys in localStorage

#### Content Sanitization

- [ ] AI-generated content doesn't execute scripts
- [ ] User input properly escaped in messages
- [ ] No XSS vulnerabilities in profile fields

### 9. Performance

#### Load Times

- [ ] Page loads within 3 seconds on Perchance
- [ ] Images lazy-load or load efficiently
- [ ] No JavaScript errors in console

#### Runtime Performance

- [ ] Smooth scrolling in message feed
- [ ] No lag when hovering over messages
- [ ] AI streaming doesn't freeze UI

### 10. Edge Cases

#### Empty States

- [ ] Empty story feed shows fallback message
- [ ] No characters created shows placeholder
- [ ] Missing profile image shows fallback color

#### Error Handling

- [ ] Network timeout shows retry button
- [ ] Invalid AI response handled gracefully
- [ ] Failed image generation doesn't break UI

## 📋 Testing Workflow

### Pre-Deployment

1. Run `npm run deploy` to build production artifact
2. Verify build completes without errors
3. Check `dist/index.html` size (~350KB expected)

### Deployment to Perchance

1. Upload `dist/index.html` to Perchance generator
2. Test immediately after deployment (cache issues)
3. Test again after 5-10 minutes (CDN propagation)

### Test Sequence

1. **Smoke Test**: Load page, verify no console errors
2. **Character Setup**: Create AI and User characters
3. **StoryMode**: Start story, exchange messages
4. **Actions**: Test all message action buttons
5. **Profile**: Edit profiles, enhance traits, generate images
6. **Mobile**: Resize browser to 400px, test layout
7. **Persistence**: Reload page, verify data survived
8. **Reset**: Use "Reset Data" to clear and start fresh

## 🐛 Known Issues to Watch For

- **Plugin Timeout**: Perchance AI might be slower than localhost mock
- **Image Generation**: Perchance image generation might have different timing than localhost
- **IndexedDB Quota**: Large story feeds might hit storage limits
- **Mobile Safari**: Hover states might not work; use tap instead
- **CSP Headers**: Perchance might have Content Security Policy restrictions

## 📝 Notes

- Test on multiple browsers: Chrome, Firefox, Safari (mobile)
- Test on multiple devices: Desktop, tablet, mobile
- Keep browser console open to catch errors
- Document any Perchance-specific quirks for future reference

---

**Last Updated**: 2026-02-09  
**Related Tracks**: StoryMode Restoration, Profile Refactor, Control Panel Redesign
