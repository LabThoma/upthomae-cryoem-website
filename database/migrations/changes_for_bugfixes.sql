-- Update exposure_time column to allow 2 decimal places
-- Run this on your existing database to fix the data type

ALTER TABLE `microscope_details`
MODIFY COLUMN `exposure_time` decimal(5, 2) DEFAULT NULL;

-- Verify the change
DESCRIBE `microscope_details`;
