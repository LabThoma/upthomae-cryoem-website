-- Backfill Script: Sync rescued status from microscope_details to grid_preparations
-- Created: 29 January 2026
-- 
-- Purpose:
-- - Updates historical grid_preparations data based on microscope session rescued status
-- - Uses MOST RECENT microscope session for each prep_id
-- - Respects timestamp precedence (manual trashing after microscope session is preserved)
--
-- IMPORTANT: This updates production data. Create a backup first!
-- Run: mysqldump -u root test_database > backup_before_backfill.sql
-- Step 1: Update grid_preparations with rescued status and last_microscope_session
-- Only updates if:
--   1. The grid was never manually trashed (trashed_at IS NULL), OR
--   2. The grid was manually trashed BEFORE the microscope session (trashed_at <= date)
UPDATE grid_preparations gp
    INNER JOIN (
        -- Get the most recent microscope session for each prep_id
        SELECT md.prep_id,
            md.microscope_session_id,
            md.rescued,
            ms.date
        FROM microscope_details md
            INNER JOIN microscope_sessions ms ON md.microscope_session_id = ms.microscope_session_id
        WHERE md.prep_id IS NOT NULL
            AND (md.prep_id, ms.date) IN (
                -- Subquery to find the maximum date for each prep_id
                SELECT md2.prep_id,
                    MAX(ms2.date)
                FROM microscope_details md2
                    INNER JOIN microscope_sessions ms2 ON md2.microscope_session_id = ms2.microscope_session_id
                WHERE md2.prep_id IS NOT NULL
                GROUP BY md2.prep_id
            )
    ) latest ON gp.prep_id = latest.prep_id
SET gp.trashed = CASE
        WHEN latest.rescued = 1 THEN 0
        ELSE 1
    END,
    gp.last_microscope_session = latest.microscope_session_id
WHERE -- Respect timestamp precedence: only update if not manually trashed after microscope session
    gp.trashed_at IS NULL
    OR gp.trashed_at <= latest.date;
-- Verify results (run these SELECT statements after the UPDATE):
-- SELECT COUNT(*) as total_grids, COUNT(last_microscope_session) as grids_at_microscope, 
--        SUM(trashed = 1) as trashed_count 
-- FROM grid_preparations;