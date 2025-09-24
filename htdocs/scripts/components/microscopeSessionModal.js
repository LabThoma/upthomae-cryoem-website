// Microscope Session Modal Component
// This file handles the microscope session modal functionality

import { showAlert, showModalAlert } from "./alertSystem.js";
import { getCurrentDateForInput } from "../utils/dateUtils.js";
import {
  renderInteractiveStarRating,
  setupStarRatings,
} from "../utils/starRating.js";
import { autoSaveManager } from "../utils/autoSave.js";
import {
  populateDropdownFromAPI,
  handleAddNewOption,
} from "../utils/autocomplete.js";

/**
 * Populate microscope dropdown specifically for this modal
 * @param {string} elementId - ID of the select element to populate
 */
async function populateMicroscopeDropdown(elementId = "sessionMicroscope") {
  return await populateDropdownFromAPI(
    elementId,
    "/api/microscope-sessions/microscopes",
    "Select Microscope...",
    null,
    (error) => {
      console.error("Failed to load microscopes:", error);
      // Could show user-friendly message here if needed
    },
    true // Enable "Add new" option
  );
}

/**
 * Validate a grid identifier by checking against the database
 * @param {string} gridIdentifier - The grid identifier to validate
 * @param {HTMLElement} inputField - The input field for visual feedback
 */
async function validateGridIdentifier(gridIdentifier, inputField) {
  if (!gridIdentifier.trim()) return; // Don't validate empty fields

  try {
    // Use a dummy microscope name since we only care about grid validation
    const params = new URLSearchParams({
      microscope: "validation", // This will be ignored by the API for validation
      grid_identifier: gridIdentifier,
    });

    const response = await fetch(
      `/api/microscope-sessions/last-parameters?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Check for grid identifier errors
    if (result.error_type === "invalid_format") {
      inputField.classList.add("error");
      showModalAlert(result.message, "error", false); // Red alert that stays until manually closed
    } else if (result.error_type === "not_found") {
      inputField.classList.add("error");
      showModalAlert(`${result.message}`, "error", false); // Red alert that stays
    } else {
      // Valid grid identifier - clear error styling
      inputField.classList.remove("error");
    }
  } catch (error) {
    console.error("Error validating grid identifier:", error);
  }
}

/**
 * Fetch last collection parameters for autopopulation
 * @param {string} microscope - The microscope name
 * @param {string} gridIdentifier - The grid identifier to extract user from
 * @returns {Promise<object|null>} The parameters object or null if not found
 */
async function fetchLastCollectionParameters(microscope, gridIdentifier) {
  try {
    const params = new URLSearchParams({
      microscope: microscope,
      grid_identifier: gridIdentifier,
    });

    const response = await fetch(
      `/api/microscope-sessions/last-parameters?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching last collection parameters:", error);
    return null;
  }
}

/**
 * Populate foldout fields with collection parameters
 * @param {string} slot - The slot number
 * @param {object} parameters - The parameters object from API
 */
function populateFoldoutParameters(slot, parameters) {
  const foldoutRow = document.querySelector(
    `.microscope-foldout[data-slot="${slot}"]`
  );
  if (!foldoutRow || !parameters) return;

  // Map of parameter names to form field names
  const parameterMapping = {
    px_size: "px_size[]",
    magnification: "magnification[]",
    exposure_e: "exposure_e[]",
    exposure_time: "exposure_time[]",
    spot_size: "spot_size[]",
    illumination_area: "illumination_area[]",
    exp_per_hole: "exp_per_hole[]",
    nominal_defocus: "nominal_defocus[]",
    objective: "objective[]",
    slit_width: "slit_width[]",
  };

  // Populate each field if it has a value AND the field is currently empty
  Object.entries(parameterMapping).forEach(([paramKey, fieldName]) => {
    const value = parameters[paramKey];
    if (value !== null && value !== undefined && value !== "") {
      const field = foldoutRow.querySelector(`[name="${fieldName}"]`);
      if (field && field.value.trim() === "") {
        // Only populate if field is empty
        field.value = value;

        // Add visual highlighting
        field.classList.add("autopopulated-field");

        // Remove highlight when user manually edits the field
        field.addEventListener(
          "input",
          () => {
            field.classList.remove("autopopulated-field");
          },
          { once: true }
        );
      }
    }
  });
}

// Global variable to track current session ID for updates
let currentSessionId = null;

// Global callback for when session is saved/updated
let onSessionSavedCallback = null;

// Flag to track when we're programmatically loading data (vs user interaction)
let isLoadingFormData = false;

// Microscope Session Modal Functions
export function setupMicroscopeSessionModal() {
  const modal = document.getElementById("microscopeSessionModal");
  const closeBtn = modal?.querySelector(".close-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMicroscopeSessionModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeMicroscopeSessionModal();
    });
  }
}

export function openMicroscopeSessionModal(
  sessionId = null,
  onSavedCallback = null
) {
  const modal = document.getElementById("microscopeSessionModal");
  const content = document.getElementById("microscopeSessionModalContent");

  if (modal && content) {
    // Set session tracking based on parameter
    currentSessionId = sessionId;
    onSessionSavedCallback = onSavedCallback;

    // Add wide class for this modal
    modal.querySelector(".modal-content").classList.add("wide");

    // Load the form content
    content.innerHTML = generateMicroscopeSessionForm();
    setupMicroscopeSessionForm();

    modal.style.display = "block";
    document.body.classList.add("modal-open");

    // Clear any existing alerts in the modal
    const modalAlertContainer = document.getElementById("modalAlertContainer");
    if (modalAlertContainer) {
      modalAlertContainer.innerHTML = "";
    }

    // Start auto-save system using the utility
    autoSaveManager.start({
      formId: "microscopeSessionForm",
      extractDataFn: extractFormData,
      saveFn: saveMicroscopeSessionData,
      alertContainerId: "modalAlertContainer",
    });
  }
}

// Function to set the current session ID (for editing)
export function setCurrentSessionId(sessionId) {
  currentSessionId = sessionId;
}

// Function to get the current session ID
export function getCurrentSessionId() {
  return currentSessionId;
}

// Function to set the loading flag
export function setLoadingFormData(loading) {
  isLoadingFormData = loading;
}

function closeMicroscopeSessionModal() {
  const modal = document.getElementById("microscopeSessionModal");
  if (modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    // Remove wide class
    modal.querySelector(".modal-content").classList.remove("wide");
    // Reset session tracking when closing
    currentSessionId = null;
    onSessionSavedCallback = null;

    // Stop auto-save system using the utility
    autoSaveManager.stop();
  }
}

// Auto-save wrapper function for microscope sessions
async function saveMicroscopeSessionData(payload) {
  // Determine if this is a new session or an update
  const isUpdate = currentSessionId !== null;
  const method = isUpdate ? "PUT" : "POST";
  const url = isUpdate
    ? `/api/microscope-sessions/${currentSessionId}`
    : "/api/microscope-sessions";

  const response = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Server returned ${response.status}`);
  }

  const result = await response.json();

  // If this was the first save, update the session ID
  if (!isUpdate && result.id) {
    currentSessionId = result.id;
    const submitButton = document.querySelector(
      '#microscopeSessionForm button[type="submit"]'
    );
    if (submitButton) {
      submitButton.textContent = "Update Session";
    }
  }

  // Call the callback to refresh the admin table if provided
  if (onSessionSavedCallback) {
    onSessionSavedCallback();
  }

  return result;
}

function generateMicroscopeSessionForm() {
  const todayDate = getCurrentDateForInput();
  return `
    <h2>New Microscope Session</h2>
    <div id="modalAlertContainer" class="alert-container"></div>
    <form id="microscopeSessionForm">
      <div class="session-info-grid">
        <div class="form-group">
          <label for="sessionDate">Date *</label>
          <input type="date" name="date" id="sessionDate" value="${todayDate}" required />
        </div>
        <div class="form-group">
          <label for="sessionMicroscope">Microscope *</label>
          <select name="microscope" id="sessionMicroscope" required>
            <option value="">Select Microscope...</option>
            <!-- Microscopes will be populated dynamically from the API -->
          </select>
        </div>
        <div class="form-group checkbox-group">
          <input type="checkbox" id="sessionOvernight" name="overnight" />
          <label for="sessionOvernight">Overnight Session</label>
        </div>
        <div class="form-group checkbox-group">
          <input type="checkbox" id="sessionClipped" name="clipped_at_microscope" />
          <label for="sessionClipped">Clipped at Microscope</label>
        </div>
        <div class="form-group" style="grid-column: 1 / -1;">
          <label for="sessionIssues">Issues/Notes</label>
          <textarea name="issues" id="sessionIssues" rows="2" placeholder="Any issues or notes about the session"></textarea>
        </div>
      </div>

      <h3>Grid Slots (12 slots)</h3>
      <div class="microscope-table-container">
        <table class="grid-detail-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Grid Identifier</th>
              <th>Atlas</th>
              <th>Screened</th>
              <th>Collected</th>
              <th>Grid Quality</th>
              <th>Particle Number</th>
              <th>Ice Quality</th>
              <th>Rescued</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody id="microscopeSlotsTableBody">
            <!-- Rows will be generated by JS -->
          </tbody>
        </table>
      </div>

      <div class="button-group" style="margin-top: 20px; text-align: center;">
        <button type="submit" class="btn btn-primary">Save Session</button>
        <button type="button" id="cancelMicroscopeSession" class="btn btn-secondary">Cancel</button>
      </div>
    </form>
  `;
}

function setupMicroscopeSessionForm() {
  const form = document.getElementById("microscopeSessionForm");
  const cancelBtn = document.getElementById("cancelMicroscopeSession");

  // Set default date to today (with small delay to ensure DOM is ready)
  setTimeout(() => {
    const dateInput = document.getElementById("sessionDate");
    if (dateInput) {
      dateInput.value = getCurrentDateForInput();
    }
  }, 10);

  // Generate 12 rows for slots
  generateMicroscopeSlotRows();

  // Setup star ratings after rows are generated
  setupStarRatings();

  // Setup foldout functionality for collected checkboxes
  setupCollectedFoldouts();

  // Setup grid identifier validation
  setupGridIdentifierValidation();

  // Populate microscope dropdown
  populateMicroscopeDropdown("sessionMicroscope");

  // Setup "Add new" functionality for microscope dropdown
  const microscopeSelect = document.getElementById("sessionMicroscope");
  if (microscopeSelect) {
    microscopeSelect.addEventListener("change", function () {
      handleAddNewOption(this, "Enter new microscope name...");
    });
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", handleMicroscopeSessionSubmit);
  }

  // Handle cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeMicroscopeSessionModal);
  }
}

function generateMicroscopeSlotRows() {
  const tbody = document.getElementById("microscopeSlotsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  for (let i = 12; i >= 1; i--) {
    const tr = document.createElement("tr");
    tr.dataset.slot = i;
    tr.innerHTML = `
      <td><strong>${i}</strong></td>
      <td><input name="grid_identifier[]" type="text" placeholder="e.g. JS001g1" style="width: 100%;" /></td>
      <td><input name="atlas[]" type="checkbox" /></td>
      <td><select name="screened[]" style="width: 100%;">
        <option value="">Select...</option>
        <option value="no">No</option>
        <option value="manually">Manually</option>
        <option value="automatically">Automatically</option>
      </select></td>
      <td><input name="collected[]" type="checkbox" /></td>
      <td>${renderInteractiveStarRating("grid_quality", i, 0)}</td>
      <td>${renderInteractiveStarRating("particle_number", i, 0)}</td>
      <td>${renderInteractiveStarRating("ice_quality", i, 0)}</td>
      <td><input name="rescued[]" type="checkbox" /></td>
      <td><textarea name="comments[]" placeholder="Notes" style="width: 100%; height: 40px; resize: vertical; box-sizing: border-box;" rows="2"></textarea></td>
    `;
    tbody.appendChild(tr);

    // Add the foldout row for additional microscope details
    const foldoutRow = document.createElement("tr");
    foldoutRow.className = "expandable-row microscope-foldout";
    foldoutRow.dataset.slot = i;
    foldoutRow.innerHTML = `
      <td colspan="10">
        <div class="expandable-content microscope-details" id="microscope-details-${i}">
          <h4 class="detail-subtitle">Collection Details for Slot ${i}</h4>
          <div class="microscope-details-grid">
            <div class="form-group">
              <label>Multigrid</label>
              <input name="multigrid[]" type="checkbox" />
            </div>
            <div class="form-group">
              <label>Px Size (Å)</label>
              <input name="px_size[]" type="number" step="0.001" placeholder="e.g. 1.06" />
            </div>
            <div class="form-group">
              <label>Magnification</label>
              <input name="magnification[]" type="number" placeholder="e.g. 81000" />
            </div>
            <div class="form-group">
              <label>Exposure (e/Å²)</label>
              <input name="exposure_e[]" type="number" step="1" placeholder="e.g. 40" />
            </div>
            <div class="form-group">
              <label>Exposure Time (s)</label>
              <input name="exposure_time[]" type="number" step="0.1" placeholder="e.g. 2.5" />
            </div>
            <div class="form-group">
              <label>Spot Size</label>
              <input name="spot_size[]" type="number" placeholder="e.g. 4" />
            </div>
            <div class="form-group">
              <label>Illumination Area</label>
              <input name="illumination_area[]" type="number" step="0.01" placeholder="e.g. 3.5" />
            </div>
            <div class="form-group">
              <label>Exp per Hole</label>
              <input name="exp_per_hole[]" type="number" placeholder="e.g. 3" />
            </div>
            <div class="form-group">
              <label>Images</label>
              <input name="images[]" type="number" placeholder="e.g. 1500" />
            </div>
            <div class="form-group">
              <label>Nominal Defocus</label>
              <input name="nominal_defocus[]" type="text" placeholder="e.g. -1.5 to -2.5" />
            </div>
            <div class="form-group">
              <label>Objective</label>
              <input name="objective[]" type="number" placeholder="e.g. 100" />
            </div>
            <div class="form-group">
              <label>Slit Width</label>
              <input name="slit_width[]" type="number" placeholder="e.g. 20" />
            </div>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(foldoutRow);
  }
}

// Extract form data into a reusable payload structure
function extractFormData() {
  const form = document.getElementById("microscopeSessionForm");
  if (!form) {
    throw new Error("Microscope session form not found");
  }

  const formData = new FormData(form);

  // Collect slot details
  const details = [];
  const tbody = document.getElementById("microscopeSlotsTableBody");
  tbody.querySelectorAll("tr").forEach((tr) => {
    // Skip foldout rows - only process main slot rows
    if (tr.classList.contains("microscope-foldout")) {
      return;
    }

    const gridIdentifierElement = tr.querySelector(
      '[name="grid_identifier[]"]'
    );
    if (!gridIdentifierElement) {
      return; // Skip if this isn't a main slot row
    }

    const grid_identifier = gridIdentifierElement.value.trim();
    if (grid_identifier) {
      const collectedElement = tr.querySelector('[name="collected[]"]');
      const detail = {
        microscope_slot: parseInt(tr.dataset.slot),
        grid_identifier: grid_identifier,
        atlas: tr.querySelector('[name="atlas[]"]').checked ? 1 : 0,
        screened: tr.querySelector('[name="screened[]"]').value.trim() || null,
        collected: collectedElement ? (collectedElement.checked ? 1 : 0) : 0,
        grid_quality: tr.querySelector('[name="grid_quality[]"]').value || null,
        particle_number:
          tr.querySelector('[name="particle_number[]"]').value || null,
        ice_quality: tr.querySelector('[name="ice_quality[]"]').value || null,
        rescued: tr.querySelector('[name="rescued[]"]').checked ? 1 : 0,
        comments: tr.querySelector('[name="comments[]"]').value.trim() || null,
      };

      // Add additional microscope details if collected checkbox is checked
      if (collectedElement && collectedElement.checked) {
        const slot = tr.dataset.slot;
        const foldoutRow = document.querySelector(
          `.microscope-foldout[data-slot="${slot}"]`
        );

        if (foldoutRow) {
          const multigridElement = foldoutRow.querySelector(
            '[name="multigrid[]"]'
          );
          const pxSizeElement = foldoutRow.querySelector('[name="px_size[]"]');
          const magnificationElement = foldoutRow.querySelector(
            '[name="magnification[]"]'
          );
          const exposureEElement = foldoutRow.querySelector(
            '[name="exposure_e[]"]'
          );
          const exposureTimeElement = foldoutRow.querySelector(
            '[name="exposure_time[]"]'
          );
          const spotSizeElement = foldoutRow.querySelector(
            '[name="spot_size[]"]'
          );
          const illuminationAreaElement = foldoutRow.querySelector(
            '[name="illumination_area[]"]'
          );
          const expPerHoleElement = foldoutRow.querySelector(
            '[name="exp_per_hole[]"]'
          );
          const imagesElement = foldoutRow.querySelector('[name="images[]"]');
          const nominalDefocusElement = foldoutRow.querySelector(
            '[name="nominal_defocus[]"]'
          );
          const objectiveElement = foldoutRow.querySelector(
            '[name="objective[]"]'
          );
          const slitWidthElement = foldoutRow.querySelector(
            '[name="slit_width[]"]'
          );

          detail.multigrid = multigridElement
            ? multigridElement.checked
              ? 1
              : 0
            : 0;
          detail.px_size = pxSizeElement ? pxSizeElement.value || null : null;
          detail.magnification = magnificationElement
            ? magnificationElement.value || null
            : null;
          detail.exposure_e = exposureEElement
            ? exposureEElement.value || null
            : null;
          detail.exposure_time = exposureTimeElement
            ? exposureTimeElement.value || null
            : null;
          detail.spot_size = spotSizeElement
            ? spotSizeElement.value || null
            : null;
          detail.illumination_area = illuminationAreaElement
            ? illuminationAreaElement.value || null
            : null;
          detail.exp_per_hole = expPerHoleElement
            ? expPerHoleElement.value || null
            : null;
          detail.images = imagesElement ? imagesElement.value || null : null;
          detail.nominal_defocus = nominalDefocusElement
            ? nominalDefocusElement.value.trim() || null
            : null;
          detail.objective = objectiveElement
            ? objectiveElement.value || null
            : null;
          detail.slit_width = slitWidthElement
            ? slitWidthElement.value || null
            : null;
        }
      }

      details.push(detail);
    }
  });

  return {
    date: formData.get("date"),
    microscope: formData.get("microscope"),
    overnight: formData.get("overnight") ? 1 : 0,
    clipped_at_microscope: formData.get("clipped_at_microscope") ? 1 : 0,
    issues: formData.get("issues") || null,
    details: details,
  };
}

async function handleMicroscopeSessionSubmit(event) {
  event.preventDefault();

  try {
    const payload = extractFormData();
    // Determine if this is a new session or an update
    const isUpdate = currentSessionId !== null;
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate
      ? `/api/microscope-sessions/${currentSessionId}`
      : "/api/microscope-sessions";

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const result = await response.json();

    if (isUpdate) {
      showModalAlert(
        `Microscope session updated successfully! Session ID: ${currentSessionId}`,
        "success"
      );
      // Call the callback to refresh the admin table
      if (onSessionSavedCallback) {
        onSessionSavedCallback();
      }
    } else {
      // First save - store the session ID and change button text
      currentSessionId = result.id;
      const submitButton = document.querySelector(
        '#microscopeSessionForm button[type="submit"]'
      );
      if (submitButton) {
        submitButton.textContent = "Update Session";
      }
      showModalAlert(
        `Microscope session saved successfully! Session ID: ${result.id}`,
        "success"
      );
      // Call the callback to refresh the admin table
      if (onSessionSavedCallback) {
        onSessionSavedCallback();
      }
    }

    // Reset change tracking after successful manual save using auto-save utility
    autoSaveManager.markSaved();

    // Don't close the modal - keep it open for further edits
  } catch (error) {
    console.error("Error saving microscope session:", error);
    showModalAlert(`Failed to save session: ${error.message}`, "error");
  }
}

// Foldout Functions
function setupCollectedFoldouts() {
  const collectedCheckboxes = document.querySelectorAll(
    'input[name="collected[]"]'
  );

  collectedCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", async function () {
      const row = this.closest("tr");
      const slot = row.dataset.slot;
      const foldoutRow = document.querySelector(
        `.microscope-foldout[data-slot="${slot}"]`
      );
      const content = document.getElementById(`microscope-details-${slot}`);

      if (this.checked) {
        // Show foldout
        foldoutRow.classList.add("visible");
        content.classList.add("expanded");

        // Only autopopulate if this is the first time (fields are empty)
        if (shouldOfferAutopopulation(slot)) {
          await autopopulateCollectionParameters(slot);
        }
      } else {
        // Hide foldout and clear values
        foldoutRow.classList.remove("visible");
        content.classList.remove("expanded");
        clearFoldoutValues(slot);
      }
    });
  });
}

/**
 * Check if we should offer autopopulation for this slot
 * Only offer if we're not currently loading form data programmatically
 * @param {string} slot - The slot number
 * @returns {boolean} - Whether to offer autopopulation
 */
function shouldOfferAutopopulation(slot) {
  // Don't offer autopopulation when we're programmatically loading data
  if (isLoadingFormData) {
    return false;
  }

  // Always allow autopopulation for manual user interactions
  // (whether in new session or editing mode)
  return true;
}
/**
 * Show preview modal for collection parameters before applying
 * @param {object} result - The API result with parameters and user info
 * @param {string} slot - The slot number
 * @param {Function} onApply - Callback to execute when user clicks Apply
 */
function showParametersPreviewModal(result, slot, onApply) {
  // Create modal HTML
  const modalHtml = `
    <div class="modal" id="parametersPreviewModal" style="display: block;">
      <div class="modal-content" style="max-width: 500px;">
        <span class="close-modal" onclick="document.getElementById('parametersPreviewModal').remove()">&times;</span>
        <h3>Load Last Collection Settings?</h3>
        <p><strong>From:</strong> ${result.user}<br>
        <strong>Last used:</strong> ${result.last_used}</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>Parameters to load:</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            ${Object.entries(result.parameters)
              .filter(
                ([key, value]) =>
                  value !== null && value !== undefined && value !== ""
              )
              .map(([key, value]) => {
                const displayName = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                return `<div><strong>${displayName}:</strong> ${value}</div>`;
              })
              .join("")}
          </div>
        </div>
        
        <div style="text-align: right; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="document.getElementById('parametersPreviewModal').remove()" style="margin-right: 10px;">Cancel</button>
          <button class="btn btn-success" id="applyParametersBtn">Apply These Settings</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to document
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Add event listener to Apply button
  document
    .getElementById("applyParametersBtn")
    .addEventListener("click", () => {
      document.getElementById("parametersPreviewModal").remove();
      onApply();
    });

  // Close on background click
  document
    .getElementById("parametersPreviewModal")
    .addEventListener("click", (e) => {
      if (e.target.id === "parametersPreviewModal") {
        document.getElementById("parametersPreviewModal").remove();
      }
    });
}

/**
 * Autopopulate collection parameters when checkbox is first checked
 * @param {string} slot - The slot number
 */
async function autopopulateCollectionParameters(slot) {
  try {
    // Get microscope name from the form
    const microscopeField = document.getElementById("sessionMicroscope");
    if (!microscopeField || !microscopeField.value) {
      console.log("No microscope selected, skipping autopopulation");
      return;
    }

    // Get grid identifier from the slot row
    const row = document.querySelector(`tr[data-slot="${slot}"]`);
    const gridIdentifierField = row?.querySelector(
      '[name="grid_identifier[]"]'
    );
    if (!gridIdentifierField || !gridIdentifierField.value.trim()) {
      console.log("No grid identifier found, skipping autopopulation");
      return;
    }

    const microscope = microscopeField.value;
    const gridIdentifier = gridIdentifierField.value.trim();

    // Fetch last parameters
    const result = await fetchLastCollectionParameters(
      microscope,
      gridIdentifier
    );

    if (result && result.parameters) {
      // Show preview modal with confirmation
      showParametersPreviewModal(result, slot, () => {
        // This callback runs when user clicks "Apply These Settings"
        populateFoldoutParameters(slot, result.parameters);

        // Show success message
        const message = `Loaded last parameters from ${result.user} (${result.last_used})`;
        showModalAlert(message, "success");

        console.log("Autopopulated collection parameters:", result);
      });
    } else {
      // Determine alert type based on the error type and message
      const message =
        result?.message || "No previous collection parameters found";
      const errorType = result?.error_type;
      let alertType = "info";

      // Handle specific error types
      if (errorType === "invalid_format") {
        alertType = "error";
        showModalAlert(message, alertType, false); // false = don't auto-dismiss
      } else if (errorType === "not_found") {
        alertType = "error";
        showModalAlert(`${message}`, alertType, false); // false = don't auto-dismiss
      } else if (message.includes("No user found")) {
        alertType = "error";
        showModalAlert(
          message +
            "\n\nThis grid may not be properly linked to a user session.",
          alertType,
          false
        ); // false = don't auto-dismiss
      } else {
        // No previous parameters - this is normal for new users or first-time microscope use
        showModalAlert(message, alertType);
      }

      console.log("No parameters to autopopulate:", result);
    }
  } catch (error) {
    console.error("Error during autopopulation:", error);
    showModalAlert("Failed to load collection parameters", "error");
  }
}

function clearFoldoutValues(slot) {
  const foldoutRow = document.querySelector(
    `.microscope-foldout[data-slot="${slot}"]`
  );
  if (foldoutRow) {
    const inputs = foldoutRow.querySelectorAll("input");
    inputs.forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });
  }
}

/**
 * Setup validation for grid identifier fields
 */
function setupGridIdentifierValidation() {
  const gridIdFields = document.querySelectorAll('[name="grid_identifier[]"]');

  gridIdFields.forEach((field) => {
    // Validate on blur (when user finishes typing and moves away)
    field.addEventListener("blur", async function () {
      const gridId = this.value.trim();
      if (gridId) {
        await validateGridIdentifier(gridId, this);
      } else {
        // Clear error styling if field is empty
        this.classList.remove("error");
      }
    });
  });
}
