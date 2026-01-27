# Rescue Status Sync Implementation Plan

## 1. Problem Statement

### Current Situation

- Users can mark grids as "rescued" (`rescued = 0` or `rescued = 1`) in `microscope_details` table
- The `grid_preparations` table has a separate `trashed` flag that is NOT automatically updated
- This creates data inconsistency: a grid can be marked as trashed at the microscope but still appear as available in the grid database

### Desired Behavior

- When a grid is marked as `rescued = 1` at the microscope, it should automatically be marked as NOT trashed in `grid_preparations` EXCEPT if the date of the microscope session is older than the `trashed_at` date
- When a grid is marked as `rescued = 0` (not rescued/trashed at microscope), it should be marked as trashed in `grid_preparations`
- Maintain an audit trail of which microscope session caused the status change
- Handle edge cases gracefully (multiple sessions, NULL prep_id, etc.)

---

## 2. Questions & Decisions

### Q1: What does "rescued" mean exactly?

**Decision:**

- `rescued = 1` → Grid was **kept/saved** at the microscope (good quality, worth keeping)
  - Action: Set `trashed = 0` in grid_preparations (untrash)
  - Exception: If the grid was trashed after the microscope session, it should be kept as trashed
- `rescued = 0` → Grid was **discarded/thrown away** at the microscope (poor quality)
  - Action: Set `trashed = 1` in grid_preparations (mark as trashed)
- `rescued = NULL` or field not set → No action taken yet
  - Action: No change to grid_preparations

### Q2: Should we always update the trashed status, or only in certain conditions?

**Decision:**

- **Always update** when rescued status is explicitly set (`0` or `1`)
- **Exception:** Only update if `prep_id` is not NULL (can't update what we can't link)
- **Override:** The manual trashing takes precedence over the microscope markings as rescued

### Q3: What if a grid appears in multiple microscope sessions with different rescued values?

**Scenarios:**

- Session 1 (Jan 15): Grid "AB12g3" → `rescued = 1` (kept)
- Session 2 (Jan 20): Same grid → `rescued = 0` (discarded)

**Decision:**

- **Timestamp comparison determines status** - compare `trashed_at` with microscope session date
- When saving a microscope session, check the timestamps:
  - If `trashed_at` is NEWER than microscope session date → Manual trashing wins, don't update
  - If microscope session date is NEWER than `trashed_at` → Microscope wins, update status
- **Always keep** `last_microscope_session` - never clear it, maintains full audit trail

**Implementation:**

```sql
-- Only update if microscope session is newer than manual trashing (or never trashed)
UPDATE grid_preparations
SET ...
WHERE prep_id = ?
  AND (trashed_at IS NULL OR ? > trashed_at)
-- ? is the microscope_session.date
```

**Why this is better:**

- Editing an old microscope session won't revive a grid that was manually trashed later
- Green highlighting always shows if grid was at microscope (history preserved)
- Clear timestamp-based precedence: most recent action wins

### Q4: What about grids with NULL prep_id?

**Decision:**

- **Skip sync for grids without prep_id** (can't link them)
- Log a warning in the application logs for tracking
- **Future enhancement:** Could implement fuzzy matching to try to find the prep_id based on grid_identifier pattern
- Do NOT fail the entire microscope session save operation if some grids can't be synced

### Q5: Should we backfill historical data?

**Decision:**

- **Yes, but in a separate migration script** (not as part of the main feature)
- Create a data migration script that:
  1. Finds all existing microscope_details entries with rescued status
  2. Updates corresponding grid_preparations based on the MOST RECENT session date
  3. Logs any conflicts or issues to a report file
  4. Runs as a one-time operation after the feature is deployed

**Script Name:** `backfill_rescued_status.php`

### Q6: Should users be notified when grid status is auto-updated?

**Decision:**

- **No immediate notification** during save (would be disruptive)
- **Visual feedback in UI:**
  - When viewing grid preparations overview, show grids that were on the microscope was green (same idea as the shipped identification)
  - Add a green button that goes to the microscope modal popup with all the details
  - Trashed grids that were on the microscope should be green but also crossed out

---

## 3. Database & API Changes

### 3.1 New Column for `grid_preparations` Table

```sql
-- Migration: Add microscope session tracking column
ALTER TABLE grid_preparations
ADD COLUMN last_microscope_session INT(11) DEFAULT NULL
    COMMENT 'The microscope_session_id this grid was last at; if set, the trashed status was synced from microscope',
ADD CONSTRAINT fk_last_microscope_session
    FOREIGN KEY (last_microscope_session)
    REFERENCES microscope_sessions(microscope_session_id)
    ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_last_microscope_session ON grid_preparations(last_microscope_session);
```

**Why this is sufficient:**

- We already have `trashed` (0 = kept/rescued, 1 = discarded)
- We already have `trashed_at` (timestamp of when status changed)
- We just need to track which microscope session this grid was in (audit trail + UI display)
- If `last_microscope_session` is NULL → never at microscope or manually changed after
- If `last_microscope_session` has value → was at microscope, status synced from there

### 3.2 Schema Compatibility

**Backward Compatibility:**

- Single nullable column with default NULL, won't break existing queries
- Existing `trashed` and `trashed_at` columns remain unchanged
- Can be deployed without downtime

**Logic:**

- When microscope session sets `rescued = 1`: Set `trashed = 0`, `trashed_at = [microscope_date]`, `last_microscope_session = [session_id]`
- When microscope session sets `rescued = 0`: Set `trashed = 1`, `trashed_at = [microscope_date]`, `last_microscope_session = [session_id]`
- When manual trash/untrash: Set `trashed` and `trashed_at` as usual, but **keep** `last_microscope_session` (preserves history that it was at microscope)

### 3.3 API Changes Needed for Visual Display

To show grids with microscope sessions in the UI (green highlighting + button), we need to:

**A) Modify:** `htdocs/php/endpoints/users.php` - Function `getUserSessions()`

The current query:

```sql
SELECT gp.*, g.grid_type, g.grid_batch
FROM grid_preparations gp
LEFT JOIN grids g ON gp.grid_id = g.grid_id
WHERE gp.session_id = ?
```

**Change to include microscope data:**

```sql
SELECT gp.*, g.grid_type, g.grid_batch,
       md.microscope_session_id,
       md.rescued,
       ms.date as microscope_date,
       ms.microscope
FROM grid_preparations gp
LEFT JOIN grids g ON gp.grid_id = g.grid_id
LEFT JOIN microscope_details md ON gp.prep_id = md.prep_id
LEFT JOIN microscope_sessions ms ON md.microscope_session_id = ms.microscope_session_id
WHERE gp.session_id = ?
ORDER BY gp.slot_number
```

**B) Return format:** Each grid_preparation object will include (via JOIN, not stored):

```json
{
  "prep_id": 123,
  "trashed": 0,
  "last_microscope_session": 456, // STORED in grid_preparations
  // Everything below comes from JOIN to microscope tables (not duplicated in DB):
  "microscope_session_id": 456, // From microscope_details via JOIN
  "microscope_date": "2026-01-20", // From microscope_sessions via JOIN
  "microscope": "Krios 1", // From microscope_sessions via JOIN
  "rescued": 1 // From microscope_details via JOIN
}
```

**Important:** Only `last_microscope_session` is stored in `grid_preparations`. All other microscope data comes from JOINing at query time - no data duplication!

**C) Frontend changes:** `htdocs/scripts/views/databaseView.js`

**1. Add green background styling for grids at microscope:**

When rendering grid rows, check if `microscope_session_id` is not NULL:

```javascript
// Check if grid was at microscope
const wasAtMicroscope = gridData.microscope_session_id !== null;
const microscopeClass = wasAtMicroscope ? ' class="microscope-grid"' : "";

// Combine with existing trashed/shipped classes
const isTrashed = gridData.trashed === true || gridData.trashed === 1;
const isShipped = gridData.shipped === true || gridData.shipped === 1;

// Build class list
let classes = [];
if (wasAtMicroscope) classes.push("microscope-grid");
if (isTrashed) classes.push("trashed-grid");
if (isShipped) classes.push("shipped-grid");
const classAttr = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";

gridTableHTML += `<tr${classAttr}>...`;
```

**2. Add CSS styling:**

In `htdocs/styles/components/` or appropriate CSS file:

```css
/* Green background for grids that were at microscope (similar to shipped-grid) */
.microscope-grid {
  background-color: #d4edda; /* Light green */
}

/* When grid is both at microscope and trashed, keep green but add strikethrough */
.microscope-grid.trashed-grid {
  background-color: #d4edda;
  text-decoration: line-through;
}
```

**3. Add microscope session button:**

In the Actions column, add a new button when `microscope_session_id` exists:

```javascript
// In the actions <td>
<td>
  <button
    class="btn-icon view-grid-btn"
    data-session-id="${session.session_id}"
    data-slot="${i}"
    title="View & Edit"
  >
    <i class="fas fa-book-open"></i>
  </button>
  $
  {wasAtMicroscope
    ? `<button class="btn-icon btn-success view-microscope-session-btn" 
          data-microscope-session-id="${gridData.microscope_session_id}" 
          data-grid-identifier="${gridData.grid_identifier || session.grid_box_name + "g" + i}" 
          title="View Microscope Session">
        <i class="fas fa-microscope"></i>
      </button>`
    : ""}
  ${/* existing ship/trash buttons */}
</td>
```

**4. Add event listener for microscope button:**

```javascript
// Add to setupDatabaseEventListeners() function
document.addEventListener("click", function (event) {
  const button = event.target.closest(".view-microscope-session-btn");
  if (button) {
    const microscopeSessionId = button.getAttribute(
      "data-microscope-session-id",
    );
    const gridIdentifier = button.getAttribute("data-grid-identifier");

    // Import and use existing microscope grid modal
    import { showMicroscopeGridModal } from "../components/microscopeGridModal.js";
    showMicroscopeGridModal(microscopeSessionId, gridIdentifier);
  }
});
```

**Visual Result:**

- Grids that were at microscope: **Green background row**
- Grids at microscope + trashed: **Green background + strikethrough text**
- Green microscope button appears in actions column to view microscope session details
- Similar pattern to existing "shipped-grid" styling

### 3.4 Manual Trash/Untrash Operations

**IMPORTANT:** Manual operations do NOT clear `last_microscope_session`. This preserves the history.

**Modify:** `htdocs/php/endpoints/grid_preparations.php`

Current trash function:

```php
UPDATE grid_preparations SET trashed = TRUE, trashed_at = NOW(), updated_at = NOW()
WHERE prep_id = ?
```

**NO CHANGE NEEDED** - keep it as is! The `last_microscope_session` stays intact, maintaining the audit trail.

When displaying grids, the UI can show both:

- Green highlighting (was at microscope)
- Trashed status (current state based on most recent action)

---

## 4. Core Sync Implementation

### 4.1 Sync Function in Microscope Sessions

**Add to:** `htdocs/php/endpoints/microscope_sessions.php`

Create a new function to sync rescued status to grid_preparations:

```php
/**
 * Sync rescued status from microscope session to grid preparation
 *
 * @param Database $db Database connection
 * @param int|null $prepId Grid preparation ID (if NULL, skip sync)
 * @param int $rescued Rescued status: 1 = kept, 0 = discarded
 * @param int $microscopeSessionId The microscope session ID
 * @param string $microscopeSessionDate Date of microscope session (YYYY-MM-DD)
 * @return bool True if synced, false if skipped
 */
function syncRescuedStatusToGridPrep($db, $prepId, $rescued, $microscopeSessionId, $microscopeSessionDate) {
    // Skip if no prep_id to link to
    if ($prepId === null) {
        error_log("Cannot sync rescued status: prep_id is NULL for microscope_session_id $microscopeSessionId");
        return false;
    }

    try {
        // Check if we should update based on timestamp comparison
        $existingRows = $db->query(
            "SELECT trashed_at FROM grid_preparations WHERE prep_id = ?",
            [$prepId]
        );

        if (empty($existingRows)) {
            error_log("Cannot sync rescued status: prep_id $prepId not found");
            return false;
        }

        $existing = $existingRows[0];

        // Skip if manually trashed AFTER this microscope session
        if ($existing['trashed_at'] !== null) {
            $trashedDate = new DateTime($existing['trashed_at']);
            $microscopeDate = new DateTime($microscopeSessionDate);

            if ($trashedDate > $microscopeDate) {
                error_log("Skipping sync for prep_id $prepId: manually trashed after microscope session (trashed: {$existing['trashed_at']}, microscope: $microscopeSessionDate)");
                return false;
            }
        }

        // Perform the sync - microscope session is newer or no previous trashing
        if ($rescued == 1) {
            // Grid was RESCUED (kept) - untrash it
            $result = $db->execute(
                "UPDATE grid_preparations
                 SET trashed = 0,
                     trashed_at = ?,
                     last_microscope_session = ?,
                     updated_at = NOW()
                 WHERE prep_id = ?",
                [$microscopeSessionDate, $microscopeSessionId, $prepId]
            );

            error_log("Synced prep_id $prepId: rescued (kept) from microscope_session_id $microscopeSessionId");
        } else {
            // Grid was NOT rescued (discarded) - mark as trashed
            $result = $db->execute(
                "UPDATE grid_preparations
                 SET trashed = 1,
                     trashed_at = ?,
                     last_microscope_session = ?,
                     updated_at = NOW()
                 WHERE prep_id = ?",
                [$microscopeSessionDate, $microscopeSessionId, $prepId]
            );

            error_log("Synced prep_id $prepId: not rescued (trashed) from microscope_session_id $microscopeSessionId");
        }

        return $result['rowCount'] > 0;

    } catch (Exception $e) {
        error_log("Failed to sync rescued status for prep_id $prepId: " . $e->getMessage());
        throw $e;
    }
}
```

### 4.2 Integration into saveMicroscopeSession()

**Modify:** `saveMicroscopeSession()` function in `htdocs/php/endpoints/microscope_sessions.php`

After successfully inserting each microscope_detail (around line 158), add the sync call:

```php
// After successful insert of microscope_detail:
if ($detailResult['rowCount'] === 1) {
    $insertedSlots[] = $microscope_slot;
    $count++;

    // NEW: Sync rescued status to grid_preparations if prep_id exists
    if ($prep_id !== null && isset($rescued)) {
        try {
            $synced = syncRescuedStatusToGridPrep($db, $prep_id, $rescued, $sessionId, $input['date']);
            // Note: $input['date'] is the microscope session date
            // Track sync results (optional for response)
        } catch (Exception $e) {
            // Log but don't fail the entire transaction
            error_log("Warning: Could not sync rescued status for prep_id $prep_id: " . $e->getMessage());
        }
    }
}
```

**Important:** This happens INSIDE the existing transaction, so if the microscope session save fails, the grid status updates will also rollback!
