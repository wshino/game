# Proposal: Add Timestamp to Game Log

## Overview

Add timestamp prefix to each log entry in the game log for better tracking.

## Current State

- Log entries show only the message text
- No timestamp information available
- Hard to track when events occurred

## Proposed Solution

Add `[HH:MM]` timestamp prefix to each log entry.

Example:
```
[14:30] Arrived at Lisbon port
[14:31] Bought 10 silk for 500 gold
```

## Implementation

Modify the `addLog` function in `src/utils/logger.js` to prepend current time.

## Expected Benefits

1. Better event tracking
2. Useful for debugging
3. Improved user experience

## Impact Scope

### Files to Modify
- `src/utils/logger.js` - Add timestamp to addLog function

### No Changes Required
- HTML, CSS, or other JavaScript files

## Risk Assessment

**Risk Level**: Very Low

- Single file change
- No impact on game logic
- Simple string formatting
