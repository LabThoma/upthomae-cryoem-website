// This file manages the grid modal functionality, including displaying grid details and inline editing.
// It exports functions like showGridModal and setupGridModalEventListeners.

import { showAlert } from "./alertSystem.js";
import { formatDate, formatDateForInput } from "../utils/dateUtils.js";

// Store current session data for inline editing
let currentSessionData = null;
let currentGridData = null;
let currentSlotNumber = null;

export function showGridModal(sessionId, slotNumber) {
  fetch(`http://localhost:3000/api/sessions/${sessionId}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch session ${sessionId}`);
      return response.json();
    })
    .then((sessionData) => {
      const gridData =
        sessionData.grids?.find(
          (g) => parseInt(g.slot_number) === parseInt(slotNumber)
        ) || {};

      const session = sessionData.session || {};
      const settings = sessionData.settings || {};
      const grid_info = sessionData.grid_info || {};

      // Store data for inline editing
      currentSessionData = sessionData;
      currentGridData = gridData;
      currentSlotNumber = slotNumber;

      const modalContent = document.getElementById("gridModalContent");

      modalContent.innerHTML = `
        <h2 class="grid-modal-title">Grid Details - ${
          session.grid_box_name || "Unknown Box"
        } (Slot ${slotNumber})</h2>
        
        <div class="grid-detail-info">
          <div class="grid-detail-section">
            <h3>Session Information</h3>
            ${createEditableField(
              "Box Name",
              "grid_box_name",
              session.grid_box_name,
              "session"
            )}
            ${createEditableField(
              "Loading Order",
              "loading_order",
              session.loading_order,
              "session"
            )}
            ${createEditableField(
              "Puck Name",
              "puck_name",
              session.puck_name,
              "session"
            )}
            ${createEditableField(
              "Puck Position",
              "puck_position",
              session.puck_position,
              "session"
            )}
            ${createReadOnlyField("User", session.user_name)}
            ${createEditableField(
              "Date",
              "date",
              formatDateForInput(session.date),
              "session",
              null,
              "date"
            )}
          </div>
          
          <div class="grid-detail-section">
            <h3>Sample Information</h3>
            ${createEditableField(
              "Sample Name",
              "sample_name",
              gridData.sample_name,
              "grid"
            )}
            ${createEditableField(
              "Sample Concentration",
              "sample_concentration",
              gridData.sample_concentration,
              "grid"
            )}
            ${createEditableField(
              "Sample Additives",
              "additives",
              gridData.additives_override || gridData.additives,
              "grid",
              "additives"
            )}
            ${createEditableField(
              "Volume (μL)",
              "volume_ul",
              gridData.volume_ul_override || gridData.default_volume_ul,
              "grid",
              "volume",
              "number"
            )}
          </div>
          
          <div class="grid-detail-section">
            <h3>Grid Information</h3>
            ${createReadOnlyField("Slot Number", slotNumber)}
            ${createEditableField(
              "Grid Type",
              "grid_type",
              grid_info.grid_type,
              "grid_info"
            )}
            ${createEditableField(
              "Grid Batch",
              "grid_batch",
              gridData.grid_batch_override || grid_info.grid_batch,
              "grid",
              "grid_batch"
            )}
            ${createEditableField(
              "Glow Discharge Current",
              "glow_discharge_current",
              grid_info.glow_discharge_current,
              "grid_info"
            )}
            ${createEditableField(
              "Glow Discharge Time",
              "glow_discharge_time",
              grid_info.glow_discharge_time,
              "grid_info"
            )}
            ${createCheckboxField(
              "Glow Discharge Applied",
              "glow_discharge_applied",
              grid_info.glow_discharge_applied,
              "grid_info"
            )}
          </div>
          
          <div class="grid-detail-section">
            <h3>Vitrobot Settings</h3>
            ${createEditableField(
              "Humidity (%)",
              "humidity_percent",
              settings.humidity_percent,
              "settings",
              null,
              "number"
            )}
            ${createEditableField(
              "Temperature (°C)",
              "temperature_c",
              settings.temperature_c,
              "settings",
              null,
              "number"
            )}
            ${createEditableField(
              "Blot Force",
              "blot_force",
              gridData.blot_force_override || settings.blot_force,
              "grid",
              "blot_force",
              "number"
            )}
            ${createEditableField(
              "Blot Time (s)",
              "blot_time_seconds",
              gridData.blot_time_override || settings.blot_time_seconds,
              "grid",
              "blot_time",
              "number"
            )}
            ${createEditableField(
              "Wait Time (s)",
              "wait_time_seconds",
              settings.wait_time_seconds,
              "settings",
              null,
              "number"
            )}
          </div>
          
          <div class="grid-detail-section">
            <h3>Comments</h3>
            ${createEditableField(
              "Comments",
              "comments",
              gridData.comments,
              "grid",
              null,
              "textarea"
            )}
          </div>
        </div>
      `;

      document.getElementById("gridModal").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching grid details:", error);
      showAlert(`Error fetching grid details: ${error.message}`, "error");
    });
}

// Helper function to create editable fields
function createEditableField(
  label,
  fieldName,
  value,
  dataType,
  overrideField = null,
  inputType = "text"
) {
  const displayValue = value || "N/A";
  const editIcon = "✏️";

  return `
    <div class="grid-detail-item">
      <div class="grid-detail-label">${label}:</div>
      <div class="grid-detail-value-container">
        <div class="grid-detail-value" id="display_${fieldName}">${displayValue}</div>
        <div class="edit-field-container" id="edit_${fieldName}" style="display: none;">
          ${
            inputType === "textarea"
              ? `<textarea class="inline-edit-input" data-field="${fieldName}" data-type="${dataType}" data-override="${
                  overrideField || ""
                }">${value || ""}</textarea>`
              : `<input type="${inputType}" class="inline-edit-input" data-field="${fieldName}" data-type="${dataType}" data-override="${
                  overrideField || ""
                }" value="${value || ""}" ${
                  inputType === "number" ? 'step="0.1"' : ""
                }>`
          }
          <button class="save-edit-btn" data-field="${fieldName}">✓</button>
          <button class="cancel-edit-btn" data-field="${fieldName}">✗</button>
        </div>
        <span class="edit-icon" data-field="${fieldName}">${editIcon}</span>
      </div>
    </div>
  `;
}

// Helper function to create read-only fields
function createReadOnlyField(label, value) {
  const displayValue = value || "N/A";
  return `
    <div class="grid-detail-item">
      <div class="grid-detail-label">${label}:</div>
      <div class="grid-detail-value">${displayValue}</div>
    </div>
  `;
}

// Helper function to create checkbox fields
function createCheckboxField(label, fieldName, value, dataType) {
  const editIcon = "✏️";
  const displayValue = value ? "Yes" : "No";

  return `
    <div class="grid-detail-item">
      <div class="grid-detail-label">${label}:</div>
      <div class="grid-detail-value-container">
        <div class="grid-detail-value" id="display_${fieldName}">${displayValue}</div>
        <div class="edit-field-container" id="edit_${fieldName}" style="display: none;">
          <input type="checkbox" class="inline-edit-checkbox" data-field="${fieldName}" data-type="${dataType}" ${
    value ? "checked" : ""
  }>
          <button class="save-edit-btn" data-field="${fieldName}">✓</button>
          <button class="cancel-edit-btn" data-field="${fieldName}">✗</button>
        </div>
        <span class="edit-icon" data-field="${fieldName}">${editIcon}</span>
      </div>
    </div>
  `;
}

// Flag to prevent multiple modal event listener setup
let isGridModalInitialized = false;

export function setupGridModalEventListeners() {
  // Prevent setting up listeners multiple times
  if (isGridModalInitialized) {
    return;
  }

  // Use event delegation for grid view buttons
  document.addEventListener("click", function (event) {
    // Handle clicks on the button or its icon
    const button = event.target.closest(".view-grid-btn");
    if (button) {
      const sessionId = button.getAttribute("data-session-id");
      const slotNumber = button.getAttribute("data-slot");
      showGridModal(sessionId, slotNumber);
    }
  });

  // Handle inline editing - edit icon clicks
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("edit-icon")) {
      const fieldName = event.target.getAttribute("data-field");
      startInlineEdit(fieldName);
    }
  });

  // Handle save button clicks
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("save-edit-btn")) {
      const fieldName = event.target.getAttribute("data-field");
      saveInlineEdit(fieldName);
    }
  });

  // Handle cancel button clicks
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("cancel-edit-btn")) {
      const fieldName = event.target.getAttribute("data-field");
      cancelInlineEdit(fieldName);
    }
  });

  // Handle Enter key to save, Escape key to cancel
  document.addEventListener("keydown", function (event) {
    if (
      event.target.classList.contains("inline-edit-input") ||
      event.target.classList.contains("inline-edit-checkbox")
    ) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const fieldName = event.target.getAttribute("data-field");
        saveInlineEdit(fieldName);
      } else if (event.key === "Escape") {
        const fieldName = event.target.getAttribute("data-field");
        cancelInlineEdit(fieldName);
      }
    }
  });

  // Close modal handlers
  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", function () {
      document.getElementById("gridModal").style.display = "none";
    });
  }

  window.addEventListener("click", function (event) {
    const modal = document.getElementById("gridModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  isGridModalInitialized = true;
}

// Inline editing functions
function startInlineEdit(fieldName) {
  const displayElement = document.getElementById(`display_${fieldName}`);
  const editElement = document.getElementById(`edit_${fieldName}`);
  const editIcon = document.querySelector(
    `.edit-icon[data-field="${fieldName}"]`
  );

  if (displayElement && editElement && editIcon) {
    displayElement.style.display = "none";
    editElement.style.display = "flex";
    editIcon.style.display = "none";

    // Focus on the input
    const input = editElement.querySelector(
      ".inline-edit-input, .inline-edit-checkbox"
    );
    if (input) {
      input.focus();
      if (input.type === "text" || input.tagName === "TEXTAREA") {
        input.select();
      }
    }
  }
}

function cancelInlineEdit(fieldName) {
  const displayElement = document.getElementById(`display_${fieldName}`);
  const editElement = document.getElementById(`edit_${fieldName}`);
  const editIcon = document.querySelector(
    `.edit-icon[data-field="${fieldName}"]`
  );

  if (displayElement && editElement && editIcon) {
    displayElement.style.display = "block";
    editElement.style.display = "none";
    editIcon.style.display = "inline";

    // Reset input value to original
    const input = editElement.querySelector(
      ".inline-edit-input, .inline-edit-checkbox"
    );
    if (input) {
      if (input.type === "checkbox") {
        const originalValue = getOriginalFieldValue(
          fieldName,
          input.getAttribute("data-type")
        );
        input.checked = !!originalValue;
      } else {
        const originalValue = getOriginalFieldValue(
          fieldName,
          input.getAttribute("data-type")
        );
        input.value = originalValue || "";
      }
    }
  }
}

async function saveInlineEdit(fieldName) {
  const editElement = document.getElementById(`edit_${fieldName}`);
  const input = editElement.querySelector(
    ".inline-edit-input, .inline-edit-checkbox"
  );

  if (!input || !currentSessionData) {
    showAlert("Error: Unable to save changes", "error");
    return;
  }

  const dataType = input.getAttribute("data-type");
  const overrideField = input.getAttribute("data-override");

  let newValue;
  if (input.type === "checkbox") {
    newValue = input.checked;
  } else if (input.type === "number") {
    newValue = parseFloat(input.value) || null;
  } else {
    newValue = input.value.trim() || null;
  }

  try {
    // Use the existing save logic but for single field
    await saveFieldUpdate(fieldName, newValue, dataType, overrideField);

    // Update the display
    const displayElement = document.getElementById(`display_${fieldName}`);
    if (displayElement) {
      if (input.type === "checkbox") {
        displayElement.textContent = newValue ? "Yes" : "No";
      } else {
        displayElement.textContent = newValue || "N/A";
      }
    }

    // Hide edit interface
    cancelInlineEdit(fieldName);

    showAlert("Field updated successfully!", "success");
  } catch (error) {
    console.error("Error saving field:", error);
    showAlert(`Error saving field: ${error.message}`, "error");
  }
}

function getOriginalFieldValue(fieldName, dataType) {
  if (!currentSessionData || !currentGridData) return null;

  const session = currentSessionData.session || {};
  const settings = currentSessionData.settings || {};
  const grid_info = currentSessionData.grid_info || {};

  switch (dataType) {
    case "session":
      // Special handling for date field to format properly for date input
      if (fieldName === "date") {
        return formatDateForInput(session[fieldName]);
      }
      return session[fieldName];
    case "settings":
      return settings[fieldName];
    case "grid_info":
      return grid_info[fieldName];
    case "grid":
      // Handle override fields
      if (fieldName === "additives") {
        return currentGridData.additives_override || currentGridData.additives;
      } else if (fieldName === "volume_ul") {
        return (
          currentGridData.volume_ul_override ||
          currentGridData.default_volume_ul
        );
      } else if (fieldName === "grid_batch") {
        return currentGridData.grid_batch_override || grid_info.grid_batch;
      } else if (fieldName === "blot_force") {
        return currentGridData.blot_force_override || settings.blot_force;
      } else if (fieldName === "blot_time_seconds") {
        return currentGridData.blot_time_override || settings.blot_time_seconds;
      } else {
        return currentGridData[fieldName];
      }
    default:
      return null;
  }
}

async function saveFieldUpdate(fieldName, newValue, dataType, overrideField) {
  if (!currentSessionData || !currentGridData) {
    throw new Error("Session data not available");
  }

  const sessionId = currentSessionData.session.session_id;
  const slotNumber = currentSlotNumber;

  // Build update payload using the same logic as the old edit modal
  const allGrids = [];
  const existingGrids = currentSessionData.grids || [];
  let updatedGrid = null; // Declare this variable at the proper scope

  // Build all grids, updating only the edited one
  for (let slot = 1; slot <= 4; slot++) {
    const existingGrid = existingGrids.find(
      (g) => parseInt(g.slot_number) === slot
    );

    if (slot == slotNumber) {
      // This is the slot being edited - apply the field change
      updatedGrid = { ...currentGridData };

      // Apply the field update with override logic
      if (dataType === "grid" && overrideField) {
        // Handle override fields
        const originalSettings = currentSessionData.settings || {};
        const originalGridInfo = currentSessionData.grid_info || {};

        if (overrideField === "additives") {
          updatedGrid.additives_override =
            newValue && newValue !== currentGridData.additives
              ? newValue
              : null;
        } else if (overrideField === "volume") {
          const defaultVolume =
            currentGridData.default_volume_ul || originalSettings.volume_ul;
          updatedGrid.volume_ul_override =
            newValue && newValue !== defaultVolume ? newValue : null;
        } else if (overrideField === "grid_batch") {
          updatedGrid.grid_batch_override =
            newValue && newValue !== originalGridInfo.grid_batch
              ? newValue
              : null;
        } else if (overrideField === "blot_force") {
          updatedGrid.blot_force_override =
            newValue && newValue !== originalSettings.blot_force
              ? newValue
              : null;
        } else if (overrideField === "blot_time") {
          updatedGrid.blot_time_override =
            newValue && newValue !== originalSettings.blot_time_seconds
              ? newValue
              : null;
        }
      } else {
        // Direct field update
        updatedGrid[fieldName] = newValue;
      }

      allGrids.push({
        slot_number: slot,
        sample_id: updatedGrid.sample_id,
        sample_name: updatedGrid.sample_name,
        sample_concentration: updatedGrid.sample_concentration,
        additives: updatedGrid.additives,
        volume_ul_override: updatedGrid.volume_ul_override,
        blot_force_override: updatedGrid.blot_force_override,
        blot_time_override: updatedGrid.blot_time_override,
        grid_batch_override: updatedGrid.grid_batch_override,
        additives_override: updatedGrid.additives_override,
        comments: updatedGrid.comments,
        include_in_session: true,
      });
    } else if (existingGrid && existingGrid.include_in_session) {
      // Preserve existing grids unchanged
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
  }

  // Build update payload
  const updateData = {
    grids: allGrids,
  };

  // Add session updates if this is a session field
  if (dataType === "session") {
    updateData.session = {
      ...currentSessionData.session,
      [fieldName]: newValue,
    };
  }

  // Add vitrobot settings updates (preserve existing, only update system-wide fields)
  if (dataType === "settings") {
    updateData.vitrobot_settings = {
      humidity_percent:
        dataType === "settings" && fieldName === "humidity_percent"
          ? newValue
          : currentSessionData.settings?.humidity_percent,
      temperature_c:
        dataType === "settings" && fieldName === "temperature_c"
          ? newValue
          : currentSessionData.settings?.temperature_c,
      wait_time_seconds:
        dataType === "settings" && fieldName === "wait_time_seconds"
          ? newValue
          : currentSessionData.settings?.wait_time_seconds,
      // Preserve existing blot settings
      blot_force: currentSessionData.settings?.blot_force,
      blot_time_seconds: currentSessionData.settings?.blot_time_seconds,
    };
  }

  // Add grid_info updates if this is a grid_info field
  if (dataType === "grid_info") {
    updateData.grid_info = {
      ...currentSessionData.grid_info,
      [fieldName]: newValue,
    };
  }

  // Send update request
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

  // Update local data only if we actually updated a grid
  if (dataType === "grid" && updatedGrid) {
    Object.assign(currentGridData, updatedGrid);
  }

  // Refresh the database view if it's open
  if (window.currentView === "database") {
    const databaseView = await import("../views/databaseView.js");
    databaseView.fetchGridData();
  }
}
