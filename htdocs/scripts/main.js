// This file serves as the entry point for the application. It initializes the page, sets up event listeners, and handles the main application logic.

// Import utilities
import * as formUtils from "./utils/formUtils.js";

// Import components
import * as componentLoader from "./components/componentLoader.js";

// Import views
import { setupFormView, setDefaultDate } from "./views/formView.js";

// Import controllers
import * as sessionController from "./controllers/sessionController.js";

// Import tabs functionality
import { setupTabs } from "./components/tabs.js";

document.addEventListener("DOMContentLoaded", () => {
  initializePage();
});

function initializePage() {
  // First load all components
  componentLoader.loadComponents(() => {
    // Then set up tabs functionality
    setupTabs();

    // Set up views
    setupFormView();
    // Note: setupDatabaseView() is now only called when the database tab is activated
    // This prevents duplicate event listeners and alerts

    // Additional setup
    setupEventListeners();
  });
}

function setupEventListeners() {
  // Set up real-time validation
  formUtils.setupRealTimeValidation();

  // Event listeners for the Input Form view
  const saveUpdateButton = document.getElementById("saveUpdateButton");
  if (saveUpdateButton) {
    saveUpdateButton.addEventListener("click", sessionController.saveUpdate);
  }

  const clearFormButton = document.getElementById("clearFormButton");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", formUtils.clearFormFields);
  }

  const nextBoxButton = document.getElementById("nextBoxButton");
  if (nextBoxButton) {
    nextBoxButton.addEventListener("click", sessionController.nextBox);
  }
}
