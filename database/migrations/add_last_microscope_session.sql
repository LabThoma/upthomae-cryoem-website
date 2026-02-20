-- Migration: Add last_microscope_session tracking to grid_preparations
-- Date: 2026-01-27
-- Purpose: Track which microscope session a grid was last at, enabling:
--   1. Auto-sync of rescued status from microscope to grid database
--   2. Visual indication in UI that grid was at microscope
--   3. Full audit trail of microscope sessions

-- Add the column
ALTER TABLE grid_preparations
ADD COLUMN last_microscope_session INT(11) DEFAULT NULL
    COMMENT 'The microscope_session_id this grid was last at; used for audit trail and UI display';

-- Add foreign key constraint
ALTER TABLE grid_preparations
ADD CONSTRAINT fk_last_microscope_session
    FOREIGN KEY (last_microscope_session)
    REFERENCES microscope_sessions(microscope_session_id)
    ON DELETE SET NULL;

-- Add index for performance (querying grids by microscope session)
CREATE INDEX idx_last_microscope_session ON grid_preparations(last_microscope_session);

-- Verify the changes
DESCRIBE grid_preparations;
