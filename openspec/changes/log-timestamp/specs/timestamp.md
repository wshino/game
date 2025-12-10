# Spec: Log Timestamp

## Summary

Add timestamp prefix to game log entries.

## Requirements

### Functional Requirements

1. **Timestamp Format**
   - Format: `[HH:MM]` (24-hour format)
   - Example: `[09:05]`, `[14:30]`, `[23:59]`

2. **Display Location**
   - Prepend to each log message
   - Format: `[HH:MM] {message}`

3. **Time Source**
   - Use current browser time (local time)

## Technical Design

### Modify: `src/utils/logger.js`

Update the `addLog` function:

```javascript
export function addLog(message) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `[${hours}:${minutes}]`;

    // Prepend timestamp to message
    const logMessage = `${timestamp} ${message}`;

    // ... existing log display logic
}
```

## Test Cases

### TC-1: Timestamp format is correct

**Given**: Current time is 14:05
**When**: addLog("Test message") is called
**Then**: Log shows "[14:05] Test message"

### TC-2: Hours are zero-padded

**Given**: Current time is 09:05
**When**: addLog("Morning event") is called
**Then**: Log shows "[09:05] Morning event"

### TC-3: Minutes are zero-padded

**Given**: Current time is 14:03
**When**: addLog("Event") is called
**Then**: Log shows "[14:03] Event"

## Acceptance Criteria

- [ ] Timestamp appears before each log message
- [ ] Format is `[HH:MM]` with zero-padding
- [ ] Existing log functionality unchanged
- [ ] No console errors
