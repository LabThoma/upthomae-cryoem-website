// This file manages the grid edit modal functionality, including displaying and updating grid details.

import { showAlert } from "./alertSystem.js";
import { formatDateForInput } from "../utils/dateUtils.js";

// Flag to prevent multiple modal event listener setup
let isGridEditModalInitialized = false;

export async function showGridEditModal(sessionId, slotNumber) {
  try {
    // Always create the form inline for reliability
    createEditFormInline();

    // Fetch session data
    const response = await fetch(
      `http://localhost:3000/api/sessions/${sessionId}`
    );
    if (!response.ok) throw new Error(`Failed to fetch session ${sessionId}`);

    const sessionData = await response.json();

    const gridData =
      sessionData.grids?.find(
        (g) => parseInt(g.slot_number) === parseInt(slotNumber)
      ) || {};

    const session = sessionData.session || {};
    const settings = sessionData.settings || {};
    const grid_info = sessionData.grid_info || {};

    // Store the session data globally for later use in the submit handler
    window.currentEditSessionData = sessionData;
    window.currentEditGridData = gridData;

    // Populate the form with current data
    populateEditForm(sessionData, gridData, slotNumber);

    // Show the modal
    document.getElementById("gridEditModal").style.display = "block";
  } catch (error) {
    console.error("Error loading edit modal:", error);
    showAlert(`Error loading edit modal: ${error.message}`, "error");
  }
}

async function loadEditModalContent() {
  try {
    const modalContent = document.getElementById("gridEditModalContent");
    if (modalContent && modalContent.innerHTML.trim() === "") {
      // Load the HTML content from the separate file
      const response = await fetch("./scripts/components/grid-edit-modal.html");
      if (!response.ok) throw new Error("Failed to load edit modal template");

      const html = await response.text();
      modalContent.innerHTML = html;
    }
  } catch (error) {
    console.error("Error loading modal template:", error);
    // Fallback: create the form inline
    createEditFormInline();
  }
}

function createEditFormInline() {
  const modalContent = document.getElementById("gridEditModalContent");
  modalContent.innerHTML = `
    <h2 class="section-title">Edit Grid Details</h2>
    
    <form id="editGridForm" class="admin-form">
      <input type="hidden" id="editSessionId" name="sessionId">
      <input type="hidden" id="editSlotNumber" name="slotNumber">
      
      <!-- Session Information Section -->
      <div class="form-section">
        <h3>Session Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="editUserName">User Name:</label>
            <input type="text" id="editUserName" name="user_name" readonly>
          </div>
          <div class="form-group">
            <label for="editDate">Date:</label>
            <input type="date" id="editDate" name="date">
          </div>
          <div class="form-group">
            <label for="editGridBoxName">Grid Box Name:</label>
            <input type="text" id="editGridBoxName" name="grid_box_name">
          </div>
          <div class="form-group">
            <label for="editLoadingOrder">Loading Order:</label>
            <input type="text" id="editLoadingOrder" name="loading_order">
          </div>
          <div class="form-group">
            <label for="editPuckName">Puck Name:</label>
            <input type="text" id="editPuckName" name="puck_name">
          </div>
          <div class="form-group">
            <label for="editPuckPosition">Puck Position:</label>
            <input type="text" id="editPuckPosition" name="puck_position">
          </div>
        </div>
      </div>

      <!-- Sample Information Section -->
      <div class="form-section">
        <h3>Sample Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="editSampleName">Sample Name:</label>
            <input type="text" id="editSampleName" name="sample_name">
          </div>
          <div class="form-group">
            <label for="editSampleConcentration">Sample Concentration:</label>
            <input type="text" id="editSampleConcentration" name="sample_concentration">
          </div>
          <div class="form-group">
            <label for="editAdditives">Sample Additives:</label>
            <input type="text" id="editAdditives" name="additives">
          </div>
          <div class="form-group">
            <label for="editVolume">Volume (μL):</label>
            <input type="number" id="editVolume" name="volume_ul" step="0.1">
          </div>
        </div>
      </div>

      <!-- Grid Information Section -->
      <div class="form-section">
        <h3>Grid Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="editGridType">Grid Type:</label>
            <input type="text" id="editGridType" name="grid_type">
          </div>
          <div class="form-group">
            <label for="editGridBatch">Grid Batch:</label>
            <input type="text" id="editGridBatch" name="grid_batch">
          </div>
          <div class="form-group">
            <label for="editGlowDischargeApplied">Glow Discharge Applied:</label>
            <input type="checkbox" id="editGlowDischargeApplied" name="glow_discharge_applied">
          </div>
          <div class="form-group">
            <label for="editGlowDischargeCurrent">Glow Discharge Current:</label>
            <input type="text" id="editGlowDischargeCurrent" name="glow_discharge_current">
          </div>
          <div class="form-group">
            <label for="editGlowDischargeTime">Glow Discharge Time:</label>
            <input type="text" id="editGlowDischargeTime" name="glow_discharge_time">
          </div>
        </div>
      </div>

      <!-- Vitrobot Settings Section -->
      <div class="form-section">
        <h3>Vitrobot Settings</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="editHumidity">Humidity (%):</label>
            <input type="number" id="editHumidity" name="humidity_percent" step="0.1">
          </div>
          <div class="form-group">
            <label for="editTemperature">Temperature (°C):</label>
            <input type="number" id="editTemperature" name="temperature_c" step="0.1">
          </div>
          <div class="form-group">
            <label for="editBlotForce">Blot Force:</label>
            <input type="number" id="editBlotForce" name="blot_force" step="0.1">
          </div>
          <div class="form-group">
            <label for="editBlotTime">Blot Time (seconds):</label>
            <input type="number" id="editBlotTime" name="blot_time_seconds" step="0.1">
          </div>
          <div class="form-group">
            <label for="editWaitTime">Wait Time (seconds):</label>
            <input type="number" id="editWaitTime" name="wait_time_seconds" step="0.1">
          </div>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="form-section">
        <h3>Comments</h3>
        <div class="form-group">
          <label for="editComments">Comments:</label>
          <textarea id="editComments" name="comments" rows="3"></textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save Changes</button>
        <button type="button" id="cancelEditGrid" class="btn btn-secondary">Cancel</button>
      </div>
    </form>
  `;
}

function populateEditForm(sessionData, gridData, slotNumber) {
  const session = sessionData.session || {};
  const settings = sessionData.settings || {};
  const grid_info = sessionData.grid_info || {};

  // Set hidden fields
  setValue("editSessionId", session.session_id);
  setValue("editSlotNumber", slotNumber);

  // Populate session information
  setValue("editUserName", session.user_name);
  setValue("editDate", formatDateForInput(session.date));
  setValue("editGridBoxName", session.grid_box_name);
  setValue("editLoadingOrder", session.loading_order);
  setValue("editPuckName", session.puck_name);
  setValue("editPuckPosition", session.puck_position);

  // Populate sample information
  setValue("editSampleName", gridData.sample_name);
  setValue("editSampleConcentration", gridData.sample_concentration);
  setValue("editAdditives", gridData.additives_override || gridData.additives);
  setValue("editVolume", gridData.volume_ul_override || settings.volume_ul);

  // Populate grid information
  setValue("editGridType", grid_info.grid_type);
  setValue(
    "editGridBatch",
    gridData.grid_batch_override || grid_info.grid_batch
  );
  setChecked("editGlowDischargeApplied", grid_info.glow_discharge_applied);
  setValue("editGlowDischargeCurrent", grid_info.glow_discharge_current);
  setValue("editGlowDischargeTime", grid_info.glow_discharge_time);

  // Populate vitrobot settings
  setValue("editHumidity", settings.humidity_percent);
  setValue("editTemperature", settings.temperature_c);
  setValue(
    "editBlotForce",
    gridData.blot_force_override || settings.blot_force
  );
  setValue(
    "editBlotTime",
    gridData.blot_time_override || settings.blot_time_seconds
  );
  setValue("editWaitTime", settings.wait_time_seconds);

  // Populate comments
  setValue("editComments", gridData.comments);
}

function setValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element && value !== undefined && value !== null) {
    element.value = value;
  }
}

function setChecked(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.checked = !!value;
  }
}

export function setupGridEditModalEventListeners() {
  // Prevent setting up listeners multiple times
  if (isGridEditModalInitialized) {
    return;
  }

  // Use event delegation for edit buttons
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("edit-grid-btn")) {
      const sessionId = event.target.getAttribute("data-session-id");
      const slotNumber = event.target.getAttribute("data-slot");
      showGridEditModal(sessionId, slotNumber);
    }
  });

  // Close modal handlers
  document.addEventListener("click", function (event) {
    if (
      event.target.id === "closeGridEditModal" ||
      event.target.id === "cancelEditGrid"
    ) {
      closeEditModal();
    }
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("gridEditModal");
    if (event.target === modal) {
      closeEditModal();
    }
  });

  // Handle form submission
  document.addEventListener("submit", function (event) {
    if (event.target.id === "editGridForm") {
      event.preventDefault();
      handleEditSubmit();
    }
  });

  isGridEditModalInitialized = true;
}

function closeEditModal() {
  document.getElementById("gridEditModal").style.display = "none";
}

async function handleEditSubmit() {
  try {
    const formData = new FormData(document.getElementById("editGridForm"));
    const sessionId = formData.get("sessionId");
    const slotNumber = parseInt(formData.get("slotNumber"));

    // Get the stored session data
    const sessionData = window.currentEditSessionData;
    const gridData = window.currentEditGridData;

    if (!sessionData) {
      throw new Error(
        "Session data not found. Please close and reopen the edit modal."
      );
    }

    // Build ALL grids for the session, updating only the edited one
    const allGrids = [];
    const existingGrids = sessionData.grids || [];

    // Ensure we have all 4 slots
    for (let slot = 1; slot <= 4; slot++) {
      const existingGrid = existingGrids.find(
        (g) => parseInt(g.slot_number) === slot
      );

      if (slot === slotNumber) {
        // This is the slot being edited - use form data
        // Determine if values should be treated as overrides
        const originalSettings = sessionData.settings || {};
        const originalGridInfo = sessionData.grid_info || {};

        // Extract form values
        const formBlotForce = parseFloat(formData.get("blot_force"));
        const formBlotTime = parseFloat(formData.get("blot_time_seconds"));
        const formVolume = parseFloat(formData.get("volume_ul"));
        const formAdditives = formData.get("additives");
        const formGridBatch = formData.get("grid_batch");

        // Only set as override if it's different from session/sample/grid defaults
        const blotForceOverride =
          !isNaN(formBlotForce) && formBlotForce !== originalSettings.blot_force
            ? formBlotForce
            : null;
        const blotTimeOverride =
          !isNaN(formBlotTime) &&
          formBlotTime !== originalSettings.blot_time_seconds
            ? formBlotTime
            : null;
        const volumeOverride =
          !isNaN(formVolume) &&
          formVolume !==
            (gridData.default_volume_ul || originalSettings.volume_ul)
            ? formVolume
            : null;
        const additivesOverride =
          formAdditives && formAdditives !== gridData.additives
            ? formAdditives
            : null;
        const gridBatchOverride =
          formGridBatch && formGridBatch !== originalGridInfo.grid_batch
            ? formGridBatch
            : null;

        allGrids.push({
          slot_number: slot,
          sample_id: gridData.sample_id, // Preserve existing sample_id
          sample_name: formData.get("sample_name"),
          sample_concentration: formData.get("sample_concentration"),
          additives: gridData.additives, // Keep original sample additives
          volume_ul_override: volumeOverride,
          blot_force_override: blotForceOverride,
          blot_time_override: blotTimeOverride,
          grid_batch_override: gridBatchOverride,
          additives_override: additivesOverride,
          comments: formData.get("comments"),
          include_in_session: true,
        });
      } else if (existingGrid && existingGrid.include_in_session) {
        // This is an existing slot that should be preserved
        allGrids.push({
          slot_number: slot,
          sample_id: existingGrid.sample_id,
          sample_name: existingGrid.sample_name,
          sample_concentration: existingGrid.sample_concentration,
          additives: existingGrid.additives,
          volume_ul_override: existingGrid.volume_ul_override,
          blot_force_override: existingGrid.blot_force_override,
          blot_time_override: existingGrid.blot_time_override,
          grid_batch_override: existingGrid.grid_batch_override,
          additives_override: existingGrid.additives_override,
          comments: existingGrid.comments,
          include_in_session: true,
        });
      }
      // If slot doesn't exist or isn't included, don't add it (it will remain empty)
    }

    // Build the update payload with existing IDs preserved
    // Update session-wide vitrobot settings for fields WITHOUT override columns
    // Only blot_force and blot_time are excluded since they have override columns
    const updateData = {
      session: {
        user_name: formData.get("user_name"),
        date: formData.get("date"),
        grid_box_name: formData.get("grid_box_name"),
        loading_order: formData.get("loading_order"),
        puck_name: formData.get("puck_name"),
        puck_position: formData.get("puck_position"),
      },
      // Update vitrobot settings for system-wide fields (no override columns)
      vitrobot_settings: {
        humidity_percent: parseFloat(formData.get("humidity_percent")) || null,
        temperature_c: parseFloat(formData.get("temperature_c")) || null,
        wait_time_seconds:
          parseFloat(formData.get("wait_time_seconds")) || null,
        // blot_force and blot_time_seconds are NOT updated here
        // since they have override columns and should only affect this grid
      },
      // Only update grid_info if grid-specific fields changed
      grid_info: {
        grid_type: formData.get("grid_type"),
        grid_batch: formData.get("grid_batch"),
        glow_discharge_applied: formData.get("glow_discharge_applied") === "on",
        glow_discharge_current: formData.get("glow_discharge_current"),
        glow_discharge_time: formData.get("glow_discharge_time"),
      },
      grids: allGrids,
    }; // Send update request
    const response = await fetch(
      `http://localhost:3000/api/sessions/${sessionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update session: ${response.status}`);
    }

    showAlert("Grid details updated successfully!", "success");
    closeEditModal();

    // Clean up stored data
    delete window.currentEditSessionData;
    delete window.currentEditGridData;

    // Refresh the database view
    if (window.currentView === "database") {
      const databaseView = await import("../views/databaseView.js");
      databaseView.fetchGridData();
    }
  } catch (error) {
    console.error("Error updating grid details:", error);
    showAlert(`Error updating grid details: ${error.message}`, "error");
  }
}
