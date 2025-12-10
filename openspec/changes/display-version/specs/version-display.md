# Spec: Version Display

## Summary

Display the application version from `package.json` on the game screen header.

## Requirements

### Functional Requirements

1. **Version Source**
   - Version MUST be sourced from `package.json` `version` field
   - Current version: `1.0.0`

2. **Display Location**
   - Version MUST be displayed in the game header area
   - Position: Below the subtitle "未知なる海へ、富と栄光を求めて"
   - Format: `v{major}.{minor}.{patch}` (e.g., `v1.0.0`)

3. **Styling**
   - Font size: Smaller than subtitle (approximately 0.8em)
   - Color: Semi-transparent to not distract from main content
   - Alignment: Center-aligned with header

### Non-Functional Requirements

1. **Performance**
   - No runtime network requests to fetch version
   - Version should be available immediately on page load

2. **Maintainability**
   - Version should be defined in a single source file
   - Easy to update when releasing new versions

## Technical Design

### New File: `src/core/version.js`

```javascript
// Version information - keep in sync with package.json
export const VERSION = '1.0.0';
```

### Modify: `index.html`

Add version display element in header:

```html
<header>
    <h1>🚢 大航海時代 🚢</h1>
    <p class="subtitle">未知なる海へ、富と栄光を求めて</p>
    <p id="version-display" class="version"></p>
</header>
```

### Modify: `src/game.js`

Import and display version on initialization:

```javascript
import { VERSION } from './core/version.js';

function initGame() {
    // Display version
    const versionElement = document.getElementById('version-display');
    if (versionElement) {
        versionElement.textContent = `v${VERSION}`;
    }

    // ... existing init code
}
```

### Modify: `style.css`

Add styling for version display:

```css
.version {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 5px;
}
```

## Test Cases

### TC-1: Version is displayed on page load

**Given**: User opens the game
**When**: Page finishes loading
**Then**: Version "v1.0.0" is visible in the header area

### TC-2: Version format is correct

**Given**: Version in version.js is "1.0.0"
**When**: Displayed on screen
**Then**: Shows "v1.0.0" (with 'v' prefix)

### TC-3: Version is styled appropriately

**Given**: Version is displayed
**When**: User views the header
**Then**: Version text is smaller and less prominent than subtitle

## Acceptance Criteria

- [ ] Version displays correctly in header
- [ ] Version matches value in `src/core/version.js`
- [ ] Styling does not interfere with existing header elements
- [ ] No console errors related to version display
