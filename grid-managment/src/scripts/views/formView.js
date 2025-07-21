// This file manages the display of the form view, including handling form submissions and validations.

import { showAlert } from "../components/alertSystem.js";
import { validateForm, clearFormFields } from "../utils/formUtils.js";

export function setupFormView() {
  initializeForm();
  setupFormEventListeners();
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

    const response = await fetch("http://localhost:3000/api/users");

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
    sessionDateElement.value = new Date().toISOString().split("T")[0];
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
