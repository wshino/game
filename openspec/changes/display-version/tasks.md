# Tasks: Display Version Feature

## Overview

Implementation tasks for displaying version information on the game screen.

## Tasks

### Phase 1: Core Implementation

- [ ] **Task 1.1**: Create `src/core/version.js`
  - Export VERSION constant with value from package.json
  - File location: `src/core/version.js`

- [ ] **Task 1.2**: Update `index.html`
  - Add `<p id="version-display" class="version"></p>` in header section
  - Place after subtitle element

- [ ] **Task 1.3**: Update `src/game.js`
  - Import VERSION from `./core/version.js`
  - Add version display logic in `initGame()` function

### Phase 2: Styling

- [ ] **Task 2.1**: Add CSS styles
  - Add `.version` class to `style.css`
  - Style: smaller font, semi-transparent, centered

### Phase 3: Testing

- [ ] **Task 3.1**: Manual verification
  - Open game in browser
  - Verify version displays correctly
  - Verify styling is appropriate

- [ ] **Task 3.2**: Add unit test (optional)
  - Test VERSION export from version.js
  - Test format matches expected pattern

## Dependencies

- None (standalone feature)

## Estimated Scope

- Files to create: 1
- Files to modify: 3
- Lines of code: ~20
