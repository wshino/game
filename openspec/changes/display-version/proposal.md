# Proposal: Display Version Information on Game Screen

## Overview

Display the game version number on the game screen header for better user experience and debugging support.

## Current State

- Version is defined in `package.json` as `"version": "1.0.0"`
- No version information is currently visible to users
- Debugging and support issues are harder to track without visible version info

## Proposed Solution

### Display Location

Add version information to the game header, displayed next to or below the game title:

```
🚢 大航海時代 🚢
未知なる海へ、富と栄光を求めて
v1.0.0
```

### Implementation Approach

1. **Build-time injection**: Inject version from `package.json` during build/bundling
2. **Runtime display**: Show version in the header area of `index.html`

Since this project uses vanilla ES modules without a build step, we will:
- Create a `src/core/version.js` file that exports the version
- Update this file manually or via script when version changes
- Display the version in the game UI

### Alternative Considered

- Reading `package.json` at runtime via fetch: Rejected due to unnecessary network request and potential CORS issues in some environments

## Expected Benefits

1. **User Experience**: Users can easily identify which version they are playing
2. **Support**: Easier to troubleshoot issues when users can report their version
3. **Testing**: Clear verification that correct version is deployed

## Impact Scope

### Files to Create
- `src/core/version.js` - Version constant

### Files to Modify
- `index.html` - Add version display element
- `src/game.js` - Import and display version on init

### No Changes Required
- Game logic, services, or other UI components

## Risk Assessment

**Risk Level**: Low

- No impact on game functionality
- Simple, isolated change
- Easy to test and verify

## References

- [package.json](../../../package.json) - Source of version number
