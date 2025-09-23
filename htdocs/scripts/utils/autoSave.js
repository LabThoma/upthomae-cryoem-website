// Auto-save utility functions for forms
// This file contains reusable auto-save functionality that can be used across different forms

import { showModalAlert } from "../components/alertSystem.js";
import { formatTimestamp } from "./dateUtils.js";

// Auto-save state management
class AutoSaveManager {
  constructor() {
    this.autoSaveInterval = null;
    this.lastAutoSaveTime = null;
    this.isAutoSaving = false;
    this.formHasChanges = false;
    this.isSettingUpForm = true;
    this.autoSaveIntervalMs = 5 * 60 * 1000; // 5 minutes default
    this.setupDelayMs = 500; // Delay before activating change detection
  }

  /**
   * Start auto-save for a form
   * @param {Object} config - Configuration object
   * @param {string} config.formId - ID of the form element
   * @param {Function} config.extractDataFn - Function to extract form data
   * @param {Function} config.saveFn - Function to save the data (should return a promise)
   * @param {string} config.alertContainerId - ID of the alert container for feedback
   * @param {number} config.intervalMs - Auto-save interval in milliseconds (optional)
   */
  start(config) {
    this.config = config;
    if (config.intervalMs) {
      this.autoSaveIntervalMs = config.intervalMs;
    }

    // Clear any existing interval
    this.stop();

    console.log(
      `Starting auto-save with ${
        this.autoSaveIntervalMs / 60000
      }-minute interval`
    );
    this.autoSaveInterval = setInterval(
      () => this.performAutoSave(),
      this.autoSaveIntervalMs
    );

    // Setup change detection
    this.setupChangeDetection();

    // Complete form setup after delay
    setTimeout(() => {
      this.isSettingUpForm = false;
      console.log("Form setup complete - change detection active");
    }, this.setupDelayMs);
  }

  /**
   * Stop auto-save
   */
  stop() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log("Auto-save stopped");
    }
    this.reset();
  }

  /**
   * Reset auto-save state
   */
  reset() {
    this.lastAutoSaveTime = null;
    this.isAutoSaving = false;
    this.formHasChanges = false;
    this.isSettingUpForm = true;
  }

  /**
   * Mark form as having changes (called after manual save to reset state)
   */
  markSaved() {
    this.formHasChanges = false;
    this.lastAutoSaveTime = new Date();
  }

  /**
   * Setup change detection for the form
   */
  setupChangeDetection() {
    const form = document.getElementById(this.config.formId);
    if (!form) {
      console.error(`Form with ID '${this.config.formId}' not found`);
      return;
    }

    console.log("Setting up change detection");

    // Add change listeners to all form inputs
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      const eventType =
        input.type === "checkbox" || input.type === "radio"
          ? "change"
          : "input";
      input.addEventListener(eventType, (event) => {
        // Ignore changes during initial form setup
        if (this.isSettingUpForm) {
          return;
        }

        if (!this.formHasChanges) {
          this.formHasChanges = true;
          console.log("Form changes detected");
        }
      });
    });

    // Reset change tracking
    this.formHasChanges = false;
  }

  /**
   * Perform auto-save
   */
  async performAutoSave() {
    // Don't auto-save if already saving or no changes
    if (this.isAutoSaving || !this.formHasChanges) {
      console.log(
        "Skipping auto-save: isAutoSaving =",
        this.isAutoSaving,
        ", formHasChanges =",
        this.formHasChanges
      );
      return;
    }

    // Don't auto-save if manual save happened recently (less than 1 minute ago)
    if (this.lastAutoSaveTime) {
      const timeSinceLastSave = new Date() - new Date(this.lastAutoSaveTime);
      if (timeSinceLastSave < 60000) {
        console.log("Skipping auto-save: recent manual save");
        return;
      }
    }

    this.isAutoSaving = true;
    console.log("Performing auto-save...");

    try {
      // Extract form data using provided function
      const payload = this.config.extractDataFn();

      // Save using provided save function
      const result = await this.config.saveFn(payload);

      // Update tracking variables
      this.lastAutoSaveTime = new Date();
      this.formHasChanges = false;

      // Show success message with timestamp
      const timeString = formatTimestamp(this.lastAutoSaveTime);
      showModalAlert(
        `Auto-saved at ${timeString}`,
        "success",
        this.config.alertContainerId
      );

      console.log("Auto-save completed successfully");
      return result;
    } catch (error) {
      console.error("Auto-save failed:", error);
      showModalAlert(
        "Auto-save failed - your changes are not saved",
        "error",
        this.config.alertContainerId
      );
    } finally {
      this.isAutoSaving = false;
    }
  }

  /**
   * Get the current state of auto-save
   */
  getState() {
    return {
      isActive: this.autoSaveInterval !== null,
      hasChanges: this.formHasChanges,
      isAutoSaving: this.isAutoSaving,
      lastSaveTime: this.lastAutoSaveTime,
      isSettingUp: this.isSettingUpForm,
    };
  }
}

// Export a singleton instance for easy use
export const autoSaveManager = new AutoSaveManager();

// Export the class for cases where multiple instances are needed
export { AutoSaveManager };
