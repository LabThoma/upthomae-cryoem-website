// This file manages the display of the form view, including handling form submissions and validations.

import { showAlert } from "../components/alertSystem.js";
import { validateForm, clearFormFields } from "../utils/formUtils.js";
import { getCurrentDateForInput } from "../utils/dateUtils.js";

export function setupFormView() {
  initializeForm();
  setupFormEventListeners();
  initializeGridComponents();
  loadGridTypes();
}

function initializeGridComponents() {
  // Ensure grid batch dropdown starts in correct state
  clearGridBatchDropdown();

  // Hide custom input fields initially
  const gridTypeCustom = document.getElementById("gridTypeCustom");
  if (gridTypeCustom) {
    gridTypeCustom.style.display = "none";
    gridTypeCustom.required = false;
  }

  const gridBatchCustom = document.getElementById("gridBatchCustom");
  if (gridBatchCustom) {
    gridBatchCustom.style.display = "none";
    gridBatchCustom.required = false;
  }
}

function initializeForm() {
  setDefaultDate();
  loadUsers();
}

async function loadUsers() {
  try {
    // Wait for the userName element to be available
    const userSelect = await waitForElement("userName");
    if (!userSelect) {
      console.error("userName element not found after waiting");
      return;
    }

    const response = await fetch("/api/users");

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const users = await response.json();
    populateUserDropdown(users);
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("Error loading users. Using default options.", "warning");
  }
}

// Helper function to wait for an element to be available
function waitForElement(id, maxAttempts = 50, interval = 100) {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkForElement = () => {
      const element = document.getElementById(id);
      if (element) {
        resolve(element);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkForElement, interval);
      } else {
        resolve(null);
      }
    };
    checkForElement();
  });
}

function populateUserDropdown(users) {
  const userSelect = document.getElementById("userName");
  if (!userSelect) return;

  // Clear existing options except the first one (Select User)
  const firstOption = userSelect.querySelector('option[value=""]');
  userSelect.innerHTML = "";
  if (firstOption) {
    userSelect.appendChild(firstOption);
  } else {
    // Create default option if it doesn't exist
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select User";
    userSelect.appendChild(defaultOption);
  }

  // Add users from the API
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.username;
    option.textContent = user.username;
    userSelect.appendChild(option);
  });

  // Add option to add new user
  const newUserOption = document.createElement("option");
  newUserOption.value = "__new_user__";
  newUserOption.textContent = "+ Add New User";
  userSelect.appendChild(newUserOption);

  console.log(`Loaded ${users.length} users into dropdown`);
}

export function setDefaultDate() {
  const sessionDateElement = document.getElementById("sessionDate");
  if (sessionDateElement) {
    sessionDateElement.value = getCurrentDateForInput();
  }
}

function setupFormEventListeners() {
  // Note: saveUpdateButton event listener is handled in main.js to avoid duplicates

  const clearFormButton = document.getElementById("clearFormButton");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm);
  }

  const glowDischarge = document.getElementById("glowDischarge");
  if (glowDischarge) {
    glowDischarge.addEventListener("change", toggleGlowDischargeSettings);
  }

  // Handle user selection changes
  const userSelect = document.getElementById("userName");
  if (userSelect) {
    userSelect.addEventListener("change", handleUserSelection);
  }
}

function handleUserSelection(event) {
  if (event.target.value === "__new_user__") {
    const newUserName = prompt("Enter new user name:");
    if (newUserName && newUserName.trim()) {
      // Add the new user to the dropdown
      const option = document.createElement("option");
      option.value = newUserName.trim();
      option.textContent = newUserName.trim();

      // Insert before the "Add New User" option
      const addNewOption = event.target.querySelector(
        'option[value="__new_user__"]'
      );
      event.target.insertBefore(option, addNewOption);

      // Select the new user
      event.target.value = newUserName.trim();

      showAlert(`Added new user: ${newUserName.trim()}`, "success");
    } else {
      // Reset to empty selection if cancelled or empty
      event.target.value = "";
    }
  } else if (event.target.value && event.target.value !== "") {
    // Auto-populate grid box name for existing users
    autoPopulateGridBoxName(event.target.value);
  } else {
    // Clear grid box name if no user selected
    const gridBoxNameElement = document.getElementById("gridBoxName");
    if (gridBoxNameElement) {
      gridBoxNameElement.value = "";
    }
  }
}

// Auto-populate grid box name based on selected user
async function autoPopulateGridBoxName(userName) {
  try {
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const users = await response.json();
    const user = users.find((u) => u.username === userName);

    if (user && user.nextBoxName) {
      const gridBoxNameElement = document.getElementById("gridBoxName");
      if (gridBoxNameElement) {
        gridBoxNameElement.value = user.nextBoxName;
        showAlert(`Grid box name set to: ${user.nextBoxName}`, "info");
      }
    } else {
      console.warn(`No next box name found for user: ${userName}`);
    }
  } catch (error) {
    console.error("Error auto-populating grid box name:", error);
    showAlert("Could not auto-populate grid box name", "warning");
  }
}

// Toggle visibility of glow discharge settings
function toggleGlowDischargeSettings() {
  const settings = document.getElementById("glowDischargeSettings");
  if (settings) {
    settings.style.display = this.checked ? "grid" : "none";
  }
}

// Note: saveUpdate function moved to sessionController.js to avoid duplication
// The saveUpdateButton event listener is handled in main.js

/*
async function saveUpdate() {
  const errors = validateForm();
  if (errors.length > 0) {
    errors.forEach((error) => showAlert(error, "error"));
    return;
  }

  try {
    // This function has been moved to sessionController.js
    // to maintain proper separation of concerns and avoid duplication
    ...rest of the function content...
  } catch (error) {
    console.error("Error saving data:", error);
    showAlert(`Error saving data: ${error.message}`, "error");
  }
}
*/

function clearForm() {
  // Use the imported clearFormFields function
  clearFormFields();

  // Reset grid type dropdown
  const gridTypeSelect = document.getElementById("gridType");
  if (gridTypeSelect) {
    gridTypeSelect.value = "";
  }

  // Reset custom grid type input
  const gridTypeCustom = document.getElementById("gridTypeCustom");
  if (gridTypeCustom) {
    gridTypeCustom.style.display = "none";
    gridTypeCustom.required = false;
    gridTypeCustom.value = "";
  }

  // Clear grid batch dropdown
  clearGridBatchDropdown();

  // Hide the glow discharge settings
  const glowDischargeSettings = document.getElementById(
    "glowDischargeSettings"
  );
  if (glowDischargeSettings) {
    glowDischargeSettings.style.display = "none";
  }

  // Set default date again
  setDefaultDate();

  showAlert("Form cleared", "success");
}

// Note: Helper functions getElementValue, getElementChecked, and getRowValue
// have been moved to sessionController.js where they are actually used

// ===== GRID TYPE FUNCTIONALITY =====

// Load grid types for dropdown
async function loadGridTypes() {
  try {
    // Wait for the gridType element to be available
    const gridTypeSelect = await waitForElement("gridType");
    if (!gridTypeSelect) {
      console.error("gridType element not found after waiting");
      return;
    }

    const response = await fetch("/api/grid-types/summary");
    if (!response.ok) {
      throw new Error("Failed to fetch grid types");
    }

    const gridTypes = await response.json();
    populateGridTypeDropdown(gridTypes);
  } catch (error) {
    console.error("Error loading grid types:", error);
    showAlert("Error loading grid types. Using manual input.", "warning");
  }
}

// Populate grid type dropdown
function populateGridTypeDropdown(gridTypes) {
  const gridTypeSelect = document.getElementById("gridType");
  if (!gridTypeSelect) return;

  // Clear all existing options
  gridTypeSelect.innerHTML = "";

  // Always add the default option first
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Grid Type";
  gridTypeSelect.appendChild(defaultOption);

  // Add grid types from the API
  gridTypes.forEach((gridType) => {
    if (gridType.grid_type_name) {
      const option = document.createElement("option");
      option.value = gridType.grid_type_name;
      option.textContent = gridType.grid_type_name;
      gridTypeSelect.appendChild(option);
    }
  });

  // Add custom option at the end
  const customOption = document.createElement("option");
  customOption.value = "__custom__";
  customOption.textContent = "+ Enter Custom";
  gridTypeSelect.appendChild(customOption);

  // Ensure the default option is selected
  gridTypeSelect.value = "";

  console.log(`Loaded ${gridTypes.length} grid types into dropdown`);
}

// Handle grid type selection changes
function handleGridTypeChange(selectElement) {
  const customInput = document.getElementById("gridTypeCustom");

  if (selectElement.value === "__custom__") {
    // Show custom input field
    customInput.style.display = "block";
    customInput.required = true;
    // Set grid batch dropdown to allow custom entry
    setGridBatchToCustomMode();
  } else if (selectElement.value === "") {
    // Hide custom input and clear grid batch
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
    clearGridBatchDropdown();
  } else {
    // Hide custom input and load batches for selected grid type
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
    loadGridBatches(selectElement.value);

    // Auto-populate glow discharge settings based on grid type
    autoPopulateGlowDischargeSettings(selectElement.value);
  }
}

// Auto-populate glow discharge settings based on grid type
function autoPopulateGlowDischargeSettings(gridType) {
  if (!gridType) return;

  const glowDischargeCheckbox = document.getElementById("glowDischarge");
  const glowCurrentInput = document.getElementById("glowCurrent");
  const glowTimeInput = document.getElementById("glowTime");
  const glowDischargeSettings = document.getElementById(
    "glowDischargeSettings"
  );

  const gridTypeUpper = gridType.toUpperCase();

  if (
    gridTypeUpper.startsWith("QF") ||
    gridTypeUpper.startsWith("QUANTIFOIL")
  ) {
    // Quantifoil grids: enable glow discharge, 15mA, 60s
    if (glowDischargeCheckbox) {
      glowDischargeCheckbox.checked = true;
    }
    if (glowCurrentInput) {
      glowCurrentInput.value = "15";
    }
    if (glowTimeInput) {
      glowTimeInput.value = "60";
    }
    // Show the glow discharge settings section
    if (glowDischargeSettings) {
      glowDischargeSettings.style.display = "grid";
    }
    showAlert(
      "Glow discharge settings auto-populated for Quantifoil (15mA, 60s)",
      "info"
    );
  } else if (
    gridTypeUpper.startsWith("UF") ||
    gridTypeUpper.startsWith("ULTRAFOIL")
  ) {
    // Ultrafoil grids: enable glow discharge, 15mA, 90s
    if (glowDischargeCheckbox) {
      glowDischargeCheckbox.checked = true;
    }
    if (glowCurrentInput) {
      glowCurrentInput.value = "15";
    }
    if (glowTimeInput) {
      glowTimeInput.value = "90";
    }
    // Show the glow discharge settings section
    if (glowDischargeSettings) {
      glowDischargeSettings.style.display = "grid";
    }
    showAlert(
      "Glow discharge settings auto-populated for Ultrafoil (15mA, 90s)",
      "info"
    );
  }
  // For other grid types, don't change any settings (leave as user set them)
}

// Load grid batches for the selected grid type
async function loadGridBatches(gridTypeName) {
  try {
    const response = await fetch(
      `/api/grid-types/batches/${encodeURIComponent(gridTypeName)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch grid batches");
    }

    const batches = await response.json();
    populateGridBatchDropdown(batches);
  } catch (error) {
    console.error("Error loading grid batches:", error);
    showAlert("Error loading batches. You can enter manually.", "warning");
    clearGridBatchDropdown();
  }
}

// Populate grid batch dropdown
function populateGridBatchDropdown(batches) {
  const gridBatchSelect = document.getElementById("gridBatch");
  if (!gridBatchSelect) return;

  // Clear existing options
  gridBatchSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Q Number";
  gridBatchSelect.appendChild(defaultOption);

  // Filter to only show "In Use" batches
  const inUseBatches = batches.filter(
    (batch) => batch.marked_as_in_use && batch.q_number
  );

  // Add "In Use" batches
  inUseBatches.forEach((batch) => {
    const option = document.createElement("option");
    option.value = batch.q_number;
    option.textContent = `${batch.q_number} (${batch.remaining_grids} left)`;
    gridBatchSelect.appendChild(option);
  });

  // Add custom option at the end
  const customOption = document.createElement("option");
  customOption.value = "__custom__";
  customOption.textContent = "+ Enter Custom Q Number";
  gridBatchSelect.appendChild(customOption);

  console.log(`Loaded ${inUseBatches.length} in-use batches for grid type`);
}

// Clear grid batch dropdown
function clearGridBatchDropdown() {
  const gridBatchSelect = document.getElementById("gridBatch");
  if (!gridBatchSelect) return;

  gridBatchSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Grid Type First";
  gridBatchSelect.appendChild(defaultOption);

  // Hide custom input
  const customInput = document.getElementById("gridBatchCustom");
  if (customInput) {
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
  }
}

// Set grid batch dropdown to custom mode (for when custom grid type is selected)
function setGridBatchToCustomMode() {
  const gridBatchSelect = document.getElementById("gridBatch");
  if (!gridBatchSelect) return;

  gridBatchSelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Q Number";
  gridBatchSelect.appendChild(defaultOption);

  // Add custom option
  const customOption = document.createElement("option");
  customOption.value = "__custom__";
  customOption.textContent = "+ Enter Custom Q Number";
  gridBatchSelect.appendChild(customOption);

  // Hide custom input initially
  const customInput = document.getElementById("gridBatchCustom");
  if (customInput) {
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
  }
}

// Handle grid batch selection changes
function handleGridBatchChange(selectElement) {
  const customInput = document.getElementById("gridBatchCustom");

  if (selectElement.value === "__custom__") {
    // Show custom input field
    customInput.style.display = "block";
    customInput.required = true;
  } else {
    // Hide custom input field
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
  }
}

// Make functions globally accessible for onclick handlers
window.handleGridTypeChange = handleGridTypeChange;
window.handleGridBatchChange = handleGridBatchChange;
