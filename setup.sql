/*M!999999\- enable the sandbox mode */
-- MariaDB dump 10.19-11.8.2-MariaDB, for osx10.20 (arm64)
-- UPDATED: Schema aligned with validation rules (2025-07-21)
--
-- Host: localhost    Database: test_database
-- ------------------------------------------------------
-- Server version	11.8.2-MariaDB
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */
;
--
-- Table structure for table `grid_preparations`
--

DROP TABLE IF EXISTS `grid_preparations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `grid_preparations` (
  `prep_id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `slot_number` int(11) DEFAULT NULL COMMENT 'Range: 1-48',
  `sample_id` int(11) DEFAULT NULL,
  `volume_ul_override` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-99.99 μL',
  `incubation_time_seconds` decimal(7, 2) DEFAULT NULL COMMENT 'Range: 0-9999.99 seconds',
  `comments` text DEFAULT NULL COMMENT 'Max 1000 characters',
  `include_in_session` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `blot_time_override` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-99.99 seconds',
  `blot_force_override` decimal(6, 2) DEFAULT NULL COMMENT 'Range: -99.99 to 99.99',
  `grid_batch_override` varchar(100) DEFAULT NULL COMMENT 'Max 100 characters',
  `grid_type_override` varchar(255) DEFAULT NULL COMMENT 'Automatically populated grid type name when grid_batch_override is used',
  `additives_override` varchar(100) DEFAULT NULL COMMENT 'Max 100 characters',
  `grid_id` int(11) DEFAULT NULL,
  `trashed` tinyint(1) DEFAULT 0 COMMENT 'Boolean flag to indicate if grid is trashed',
  `trashed_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when grid was trashed',
  PRIMARY KEY (`prep_id`),
  KEY `session_id` (`session_id`),
  KEY `fk_grid_preparations_grid_id` (`grid_id`),
  CONSTRAINT `fk_grid_preparations_grid_id` FOREIGN KEY (`grid_id`) REFERENCES `grids` (`grid_id`) ON DELETE
  SET NULL ON UPDATE CASCADE,
    CONSTRAINT `grid_preparations_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 84 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `grid_types`
--

DROP TABLE IF EXISTS `grid_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `grid_types` (
  `grid_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `grid_type_name` varchar(255) DEFAULT NULL COMMENT 'Optional, 1-255 characters',
  `grid_batch` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `manufacturer` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `support` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `spacing` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `grid_material` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `grid_mesh` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `extra_layer` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `extra_layer_thickness` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `q_number` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `extra_info` text DEFAULT NULL COMMENT 'Optional, max 1000 characters',
  `quantity` int(11) DEFAULT NULL COMMENT 'Optional, positive integer',
  `specifications` text DEFAULT NULL COMMENT 'Optional, max 1000 characters',
  `marked_as_empty` tinyint(1) DEFAULT 0 COMMENT 'Boolean flag to indicate if grid batch is marked as empty',
  `marked_as_in_use` tinyint(1) DEFAULT 0 COMMENT 'Boolean flag to indicate if grid batch is currently being used',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`grid_type_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `grids`
--

DROP TABLE IF EXISTS `grids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `grids` (
  `grid_id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `grid_type` varchar(255) NOT NULL COMMENT 'Required, max 255 characters',
  `grid_batch` varchar(100) DEFAULT NULL COMMENT 'Optional, max 100 characters',
  `glow_discharge_applied` tinyint(1) DEFAULT 0,
  `glow_discharge_current` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-100 mA',
  `glow_discharge_time` int(11) DEFAULT NULL COMMENT 'Range: 0-3600 seconds',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`grid_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `grids_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 40 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `samples`
--

DROP TABLE IF EXISTS `samples`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `samples` (
  `sample_id` int(11) NOT NULL AUTO_INCREMENT,
  `sample_name` varchar(255) NOT NULL COMMENT 'Required, 1-255 characters',
  `sample_concentration` varchar(100) DEFAULT NULL COMMENT 'Optional, max 100 characters',
  `additives` text DEFAULT NULL COMMENT 'Optional, max 1000 characters',
  `default_volume_ul` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-99.99 μL',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`sample_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 26 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `sessions` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL COMMENT 'Required, 1-255 characters',
  `date` date NOT NULL COMMENT 'Required date',
  `grid_box_name` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `loading_order` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `puck_name` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `puck_position` varchar(255) DEFAULT NULL COMMENT 'Optional, max 255 characters',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`session_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 88 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `vitrobot_settings`
--

DROP TABLE IF EXISTS `vitrobot_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8mb4 */
;
CREATE TABLE `vitrobot_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `humidity_percent` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-100%',
  `temperature_c` decimal(5, 2) DEFAULT NULL COMMENT 'Range: -50 to 50°C',
  `blot_force` int(11) DEFAULT NULL COMMENT 'Range: -100 to 100',
  `blot_time_seconds` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-60 seconds',
  `wait_time_seconds` decimal(5, 2) DEFAULT NULL COMMENT 'Range: 0-300 seconds',
  `glow_discharge_applied` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `vitrobot_settings_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 80 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */
;
-- Schema updated on 2025-07-21 to align with validation rules
-- Key changes:
-- 1. blot_force_override: decimal(5,2) -> decimal(6,2) (allows negative values)
-- 2. incubation_time_seconds: decimal(5,2) -> decimal(7,2) (allows values up to 9999.99)
-- 3. Added validation range comments to all fields