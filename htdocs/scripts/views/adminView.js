// Admin view functionality
// This file handles all admin-related functionality including forms and data management

import { showAlert } from "../components/alertSystem.js";
import {
  setupMicroscopeSessionModal,
  openMicroscopeSessionModal,
} from "../components/microscopeSessionModal.js";
import { renderStarRating } from "../utils/starRating.js";

// Flag to prevent multiple initialization
let isAdminViewInitialized = false;

export function setupAdminView() {
  // Prevent multiple initialization
  if (isAdminViewInitialized) {
    return;
  }

  setupAdminButtons();
  setupGridModal();
  setupMicroscopeSessionModal();
  loadGridSummary();
  loadMicroscopeSessions();
  // Make handleSelectChange globally available
  window.handleSelectChange = handleSelectChange;

  isAdminViewInitialized = true;
}

function setupAdminButtons() {
  const addNewGridsButton = document.getElementById("addNewGridsButton");
  const openMicroscopeSessionBtn = document.getElementById(
    "openMicroscopeSessionBtn",
  );

  if (addNewGridsButton) {
    addNewGridsButton.addEventListener("click", openGridModal);
  }

  if (openMicroscopeSessionBtn) {
    openMicroscopeSessionBtn.addEventListener("click", () =>
      openMicroscopeSessionModal(null, loadMicroscopeSessions),
    );
  }
}

function setupGridModal() {
  const form = document.getElementById("newGridForm");
  const clearButton = document.getElementById("clearGridForm");
  const closeButton = document.getElementById("closeGridInputModal");
  const modal = document.getElementById("gridInputModal");

  if (form) {
    form.addEventListener("submit", handleGridFormSubmit);
    // Add event listeners for real-time preview updates
    setupPreviewUpdaters(form);
  }

  if (clearButton) {
    clearButton.addEventListener("click", clearGridForm);
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeGridModal);
  }

  // Close modal when clicking outside the content
  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeGridModal();
      }
    });
  }
}

function openGridModal() {
  const modal = document.getElementById("gridInputModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function closeGridModal() {
  const modal = document.getElementById("gridInputModal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function handleGridFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const isEditMode = form.dataset.editMode === "true";
  const editId = form.dataset.editId;

  // Helper function to get the final value (either from dropdown or custom input)
  function getFieldValue(fieldName, otherFieldName) {
    const mainValue = formData.get(fieldName);
    if (mainValue === "other") {
      return formData.get(otherFieldName);
    }
    return mainValue;
  }

  // Get all field values
  const manufacturer = getFieldValue("manufacturer", "manufacturerOther");
  const support = getFieldValue("support", "supportOther");
  const spacing = getFieldValue("spacing", "spacingOther");
  const gridMaterial = getFieldValue("gridMaterial", "gridMaterialOther");
  const gridMesh = getFieldValue("gridMesh", "gridMeshOther");
  const extraLayer = getFieldValue("extraLayer", "extraLayerOther");
  const extraLayerThickness = getFieldValue(
    "extraLayerThickness",
    "extraLayerThicknessOther",
  );

  // Generate the shortened grid type name
  const gridTypeName = generateGridTypeName(
    manufacturer,
    support,
    spacing,
    gridMaterial,
    gridMesh,
    extraLayer,
    extraLayerThickness,
  );

  const gridData = {
    grid_type_name: gridTypeName,
    manufacturer: manufacturer,
    support: support,
    spacing: spacing,
    grid_material: gridMaterial,
    grid_mesh: gridMesh,
    extra_layer: extraLayer,
    extra_layer_thickness: extraLayerThickness,
    q_number: formData.get("qNumber"),
    extra_info: formData.get("extraInfo"),
    quantity: formData.get("quantity"),
  };

  try {
    const url = isEditMode ? `/api/grid-types/${editId}` : "/api/grid-types";

    const method = isEditMode ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gridData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error ||
          `Failed to ${isEditMode ? "update" : "add"} grid type`,
      );
    }

    const result = await response.json();
    showAlert(
      `Grid type ${isEditMode ? "updated" : "added"} successfully!`,
      "success",
    );
    clearGridForm();
    closeGridModal();
    loadGridSummary(); // Refresh the summary table
  } catch (error) {
    console.error(
      `Error ${isEditMode ? "updating" : "adding"} grid type:`,
      error,
    );
    showAlert(
      `Error ${isEditMode ? "updating" : "adding"} grid type: ${error.message}`,
      "error",
    );
  }
}

function clearGridForm() {
  const form = document.getElementById("newGridForm");
  if (form) {
    form.reset();
    // Also hide all custom input fields
    const customInputs = form.querySelectorAll('input[id$="Other"]');
    customInputs.forEach((input) => {
      input.style.display = "none";
    });
    // Clear the preview
    updateGridTypeNamePreview();
    // Reset edit mode
    delete form.dataset.editMode;
    delete form.dataset.editId;
  }
}

// Function to setup event listeners for real-time preview updates
function setupPreviewUpdaters(form) {
  const fieldsToWatch = [
    "manufacturer",
    "manufacturerOther",
    "support",
    "supportOther",
    "spacing",
    "spacingOther",
    "gridMaterial",
    "gridMaterialOther",
    "gridMesh",
    "gridMeshOther",
    "extraLayer",
    "extraLayerOther",
    "extraLayerThickness",
    "extraLayerThicknessOther",
  ];

  fieldsToWatch.forEach((fieldName) => {
    const field = form.querySelector(`#${fieldName}`);
    if (field) {
      field.addEventListener("input", updateGridTypeNamePreview);
      field.addEventListener("change", updateGridTypeNamePreview);
    }
  });
}

// Function to update the grid type name preview
function updateGridTypeNamePreview() {
  const form = document.getElementById("newGridForm");
  const previewElement = document.getElementById("gridTypeNamePreview");

  if (!form || !previewElement) return;

  // Helper function to get the final value (either from dropdown or custom input)
  function getFieldValue(fieldName, otherFieldName) {
    const mainField = form.querySelector(`[name="${fieldName}"]`);
    const mainValue = mainField ? mainField.value : "";
    if (mainValue === "other") {
      const otherField = form.querySelector(`[name="${otherFieldName}"]`);
      return otherField ? otherField.value : "";
    }
    return mainValue;
  }

  // Get all field values
  const manufacturer = getFieldValue("manufacturer", "manufacturerOther");
  const support = getFieldValue("support", "supportOther");
  const spacing = getFieldValue("spacing", "spacingOther");
  const gridMaterial = getFieldValue("gridMaterial", "gridMaterialOther");
  const gridMesh = getFieldValue("gridMesh", "gridMeshOther");
  const extraLayer = getFieldValue("extraLayer", "extraLayerOther");
  const extraLayerThickness = getFieldValue(
    "extraLayerThickness",
    "extraLayerThicknessOther",
  );

  // Generate the preview name
  const gridTypeName = generateGridTypeName(
    manufacturer,
    support,
    spacing,
    gridMaterial,
    gridMesh,
    extraLayer,
    extraLayerThickness,
  );

  // Update the preview display
  if (gridTypeName.trim()) {
    previewElement.innerHTML = gridTypeName;
  } else {
    previewElement.innerHTML =
      "<em>Enter details above to see generated name...</em>";
  }
}

// Function to handle dropdown changes and show/hide custom input fields
function handleSelectChange(selectElement, customInputId) {
  const customInput = document.getElementById(customInputId);
  if (selectElement.value === "other") {
    customInput.style.display = "block";
    customInput.required = true;
  } else {
    customInput.style.display = "none";
    customInput.required = false;
    customInput.value = "";
  }
  // Update the preview whenever a dropdown changes
  updateGridTypeNamePreview();
}

// Function to generate shortened grid type name
function generateGridTypeName(
  manufacturer,
  support,
  spacing,
  gridMaterial,
  gridMesh,
  extraLayer,
  extraLayerThickness,
) {
  let nameParts = [];

  // 1. Manufacturer (shortened only for known ones)
  if (manufacturer) {
    if (manufacturer === "Quantifoil") {
      nameParts.push("QF");
    } else if (manufacturer === "Ultrafoil") {
      nameParts.push("UF");
    } else {
      // For custom manufacturers, use the full name
      nameParts.push(manufacturer);
    }
  }

  // 2. Support logic
  const manufacturerShort =
    manufacturer === "Quantifoil"
      ? "QF"
      : manufacturer === "Ultrafoil"
        ? "UF"
        : null;
  const shouldOmitSupport =
    (support === "Holey Carbon" && manufacturerShort === "QF") ||
    (support === "Holey Gold" && manufacturerShort === "UF");

  if (support && !shouldOmitSupport) {
    // Use full support names, no shortening
    nameParts.push(support);
  }

  // 3. Spacing (omit if Lacey is selected)
  const shouldOmitSpacing = support === "Lacey Carbon";
  if (spacing && !shouldOmitSpacing) {
    nameParts.push(spacing);
  }

  // 4. Grid Material
  if (gridMaterial) {
    nameParts.push(gridMaterial);
  }

  // 5. Grid Mesh
  if (gridMesh) {
    nameParts.push(gridMesh);
  }

  // 6. Extra Layer (with + sign and shortened)
  if (extraLayer) {
    let extraLayerPart = "+";
    if (extraLayerThickness) {
      extraLayerPart += " " + extraLayerThickness;
    }
    if (extraLayer === "Carbon") {
      extraLayerPart += " C";
    } else {
      // For custom extra layer, use first character or short form
      extraLayerPart +=
        " " +
        (extraLayer.length <= 2
          ? extraLayer
          : extraLayer.substring(0, 1).toUpperCase());
    }
    nameParts.push(extraLayerPart);
  }

  return nameParts.join(" ");
}

// Load and display grid summary table
async function loadGridSummary() {
  try {
    const response = await fetch("/api/grid-types/summary");
    if (!response.ok) {
      throw new Error("Failed to fetch grid summary");
    }

    const summaryData = await response.json();
    displayGridSummary(summaryData);
  } catch (error) {
    console.error("Error loading grid summary:", error);
    showAlert(`Error loading grid summary: ${error.message}`, "error");
  }
}

// Display grid summary table
function displayGridSummary(summaryData) {
  const tableBody = document.getElementById("gridSummaryTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  summaryData.forEach((gridType) => {
    // Skip entries with null grid_type_name
    if (!gridType.grid_type_name) return;

    // Main summary row
    const summaryRow = document.createElement("tr");
    summaryRow.innerHTML = `
      <td>
        <span class="expandable-row-icon" data-grid-type-name="${encodeURIComponent(
          gridType.grid_type_name,
        )}">▶</span>
        ${gridType.grid_type_name || "Unnamed Grid Type"} (${
          gridType.batch_count
        } batch${gridType.batch_count !== 1 ? "es" : ""})
      </td>
      <td>${gridType.total_unused_grids || 0}</td>
      <td>${gridType.total_used_last_3_months || 0}</td>
    `;

    // Detail row (initially hidden, using existing expandable-row class)
    const detailRow = document.createElement("tr");
    detailRow.className = "expandable-row";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 3;
    detailCell.innerHTML = `
      <div class="expandable-content" id="grid-details-${encodeURIComponent(
        gridType.grid_type_name,
      )}">
        <h4 class="detail-subtitle">Individual Batches for "${
          gridType.grid_type_name
        }"</h4>
        <div id="batch-details-${encodeURIComponent(gridType.grid_type_name)}">
          Loading batches...
        </div>
      </div>
    `;

    detailRow.appendChild(detailCell);
    tableBody.appendChild(summaryRow);
    tableBody.appendChild(detailRow);
  });

  // Set up expand/collapse functionality scoped to grid summary table only
  const gridSummaryTable = document.getElementById("gridSummaryTableBody");
  const expandIcons =
    gridSummaryTable?.querySelectorAll(".expandable-row-icon") || [];
  expandIcons.forEach((icon) => {
    // Remove any existing event listeners by cloning the element
    const newIcon = icon.cloneNode(true);
    icon.parentNode.replaceChild(newIcon, icon);

    newIcon.addEventListener("click", function () {
      const gridTypeName = decodeURIComponent(
        this.getAttribute("data-grid-type-name"),
      );
      const content = document.getElementById(
        `grid-details-${encodeURIComponent(gridTypeName)}`,
      );
      const detailRow = this.closest("tr").nextElementSibling;

      this.classList.toggle("expanded");
      content.classList.toggle("expanded");
      detailRow.classList.toggle("visible");
      this.textContent = this.textContent === "▶" ? "▼" : "▶";

      // Load batch details if expanding and not already loaded
      if (this.classList.contains("expanded")) {
        const batchContainer = document.getElementById(
          `batch-details-${encodeURIComponent(gridTypeName)}`,
        );
        if (
          batchContainer &&
          batchContainer.innerHTML.trim() === "Loading batches..."
        ) {
          loadGridTypeBatches(gridTypeName, batchContainer);
        }
      }
    });
  });
}

// Load batches for a specific grid type
async function loadGridTypeBatches(gridTypeName, container) {
  try {
    container.innerHTML = "Fetching batch data...";
    const response = await fetch(
      `/api/grid-types/batches?type=${encodeURIComponent(gridTypeName)}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const batches = await response.json();
    displayGridTypeBatches(batches, container);
  } catch (error) {
    console.error("Error loading grid type batches:", error);
    container.innerHTML = `<p style="color: red;">Error loading batches: ${error.message}</p>`;
  }
}

// Display batches for a grid type
function displayGridTypeBatches(batches, container) {
  if (batches.length === 0) {
    container.innerHTML = "<p>No batches found for this grid type.</p>";
    return;
  }

  let tableHTML = `
    <table class="grid-detail-table">
      <thead>
        <tr>
          <th>Q Number</th>
          <th>Total Quantity</th>
          <th>Used Grids</th>
          <th>Remaining Grids</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  batches.forEach((batch) => {
    const isMarkedEmpty = batch.marked_as_empty;
    const isMarkedInUse = batch.marked_as_in_use;

    let statusText;
    if (isMarkedEmpty) {
      statusText =
        '<span style="color: orange; font-weight: bold;">Marked Empty</span>';
    } else if (isMarkedInUse) {
      statusText =
        '<span style="color: blue; font-weight: bold;">In Use</span>';
    } else if (batch.remaining_grids <= 0) {
      statusText = '<span style="color: red;">Empty</span>';
    } else {
      statusText = '<span style="color: green;">Available</span>';
    }

    tableHTML += `
      <tr>
        <td>${batch.q_number || "N/A"}</td>
        <td>${batch.quantity || 0}</td>
        <td>${batch.used_grids || 0}</td>
        <td>${batch.remaining_grids || 0}</td>
        <td>${statusText}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editGridType(${
              batch.grid_type_id
            })">
              Edit
            </button>
            ${
              !isMarkedEmpty && batch.remaining_grids > 0
                ? `
            <button class="action-btn empty" onclick="markGridTypeEmpty(${batch.grid_type_id})">
              Mark Empty
            </button>
            `
                : ""
            }
            ${
              !isMarkedEmpty && !isMarkedInUse && batch.remaining_grids > 0
                ? `
            <button class="action-btn in-use" onclick="markGridTypeInUse(${batch.grid_type_id})">
              Mark In Use
            </button>
            `
                : ""
            }
            <button class="action-btn delete" onclick="deleteGridType(${
              batch.grid_type_id
            })">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
}

// Edit grid type function
async function editGridType(gridTypeId) {
  try {
    // Get current grid type data
    const response = await fetch(`/api/grid-types`);
    if (!response.ok) {
      throw new Error("Failed to fetch grid types");
    }

    const gridTypes = await response.json();
    const gridType = gridTypes.find((gt) => gt.grid_type_id === gridTypeId);

    if (!gridType) {
      throw new Error("Grid type not found");
    }

    // Pre-populate the form with existing data
    populateGridForm(gridType);
    openGridModal();

    // Change the form to edit mode
    const form = document.getElementById("newGridForm");
    form.dataset.editMode = "true";
    form.dataset.editId = gridTypeId;
  } catch (error) {
    console.error("Error editing grid type:", error);
    showAlert(`Error editing grid type: ${error.message}`, "error");
  }
}

// Populate form with existing grid type data
function populateGridForm(gridType) {
  const form = document.getElementById("newGridForm");
  if (!form) return;

  // Set form values
  setFormFieldValue(form, "manufacturer", gridType.manufacturer);
  setFormFieldValue(form, "support", gridType.support);
  setFormFieldValue(form, "spacing", gridType.spacing);
  setFormFieldValue(form, "gridMaterial", gridType.grid_material);
  setFormFieldValue(form, "gridMesh", gridType.grid_mesh);
  setFormFieldValue(form, "extraLayer", gridType.extra_layer);
  setFormFieldValue(
    form,
    "extraLayerThickness",
    gridType.extra_layer_thickness,
  );

  // Set text fields
  const qNumberField = form.querySelector('[name="qNumber"]');
  if (qNumberField) qNumberField.value = gridType.q_number || "";

  const extraInfoField = form.querySelector('[name="extraInfo"]');
  if (extraInfoField) extraInfoField.value = gridType.extra_info || "";

  const quantityField = form.querySelector('[name="quantity"]');
  if (quantityField) quantityField.value = gridType.quantity || "";

  // Update preview
  updateGridTypeNamePreview();
}

// Helper function to set form field values
function setFormFieldValue(form, fieldName, value) {
  const field = form.querySelector(`[name="${fieldName}"]`);
  if (!field || !value) return;

  // Check if the value exists in the dropdown options
  const option = Array.from(field.options).find((opt) => opt.value === value);

  if (option) {
    field.value = value;
  } else {
    // Value doesn't exist in dropdown, set to "other" and populate custom field
    field.value = "other";
    const customField = form.querySelector(`[name="${fieldName}Other"]`);
    if (customField) {
      customField.value = value;
      customField.style.display = "block";
      customField.required = true;
    }
  }
}

// Mark grid type as empty
async function markGridTypeEmpty(gridTypeId) {
  if (
    !confirm(
      "Are you sure you want to mark this grid type as empty? This will set the quantity to 0.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/grid-types/${gridTypeId}/mark-empty`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to mark grid type as empty");
    }

    showAlert("Grid type marked as empty successfully!", "success");
    loadGridSummary(); // Refresh the table
  } catch (error) {
    console.error("Error marking grid type as empty:", error);
    showAlert(`Error marking grid type as empty: ${error.message}`, "error");
  }
}

// Delete grid type
async function deleteGridType(gridTypeId) {
  if (
    !confirm(
      "Are you sure you want to delete this grid type? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/grid-types/${gridTypeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete grid type");
    }

    showAlert("Grid type deleted successfully!", "success");
    loadGridSummary(); // Refresh the table
  } catch (error) {
    console.error("Error deleting grid type:", error);
    showAlert(`Error deleting grid type: ${error.message}`, "error");
  }
}

// Mark grid type as in use
async function markGridTypeInUse(gridTypeId) {
  if (
    !confirm(
      "Are you sure you want to mark this grid type as 'In Use'? This indicates the batch is currently being used.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/grid-types/${gridTypeId}/mark-in-use`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to mark grid type as in use");
    }

    showAlert("Grid type marked as in use successfully!", "success");
    loadGridSummary(); // Refresh the table
  } catch (error) {
    console.error("Error marking grid type as in use:", error);
    showAlert(`Error marking grid type as in use: ${error.message}`, "error");
  }
}

// Make functions globally accessible
window.editGridType = editGridType;
window.markGridTypeEmpty = markGridTypeEmpty;
window.markGridTypeInUse = markGridTypeInUse;
window.deleteGridType = deleteGridType;

// Load and display microscope sessions table
async function loadMicroscopeSessions() {
  try {
    const response = await fetch("/api/microscope-sessions");
    if (!response.ok) {
      throw new Error("Failed to fetch microscope sessions");
    }

    const sessionsData = await response.json();

    // Store sessions data globally for editing
    globalSessionsData = sessionsData;

    displayMicroscopeSessions(sessionsData);
  } catch (error) {
    console.error("Error loading microscope sessions:", error);
    showAlert(`Error loading microscope sessions: ${error.message}`, "error");
  }
}

// Display microscope sessions table
function displayMicroscopeSessions(sessionsData) {
  const tableBody = document.getElementById("microscopeSessionsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (sessionsData.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='6'>No microscope sessions found</td></tr>";
    return;
  }

  sessionsData.forEach((session, idx) => {
    // Main session row
    const sessionRow = document.createElement("tr");
    // Convert newlines to HTML line breaks for issues display
    const issuesDisplay = (session.issues || "").replace(/\n/g, "<br>");

    sessionRow.innerHTML = `
      <td>
        <span class="expandable-row-icon" data-session-idx="${idx}">▶</span>
        ${session.date || ""}
      </td>
      <td>${session.microscope || ""}</td>
      <td>${session.users || "N/A"}</td>
      <td>${session.grid_count || 0}</td>
      <td>${session.overnight ? "Yes" : "No"}</td>
      <td class="issues-col">${issuesDisplay}</td>
    `;

    // Detail row (initially hidden)
    const detailRow = document.createElement("tr");
    detailRow.className = "expandable-row";
    const detailCell = document.createElement("td");
    detailCell.colSpan = 6;

    // Create grid details table - always show slots 12 down to 1
    let gridRows = "";
    for (let slot = 12; slot >= 1; slot--) {
      const gridDetail = session.details?.find(
        (detail) => detail.microscope_slot === slot,
      );

      if (gridDetail) {
        // Slot has data
        // Show 'none' in images if not collected, otherwise show actual image count
        const imagesDisplay = gridDetail.collected
          ? gridDetail.images || ""
          : "none";
        // Convert newlines to HTML line breaks for display
        const commentsDisplay = (gridDetail.comments || "").replace(
          /\n/g,
          "<br>",
        );

        gridRows += `
          <tr>
            <td>${slot}</td>
            <td>${gridDetail.grid_identifier || ""}</td>
            <td>${gridDetail.screened || ""}</td>
            <td>${imagesDisplay}</td>
            <td>${renderStarRating(gridDetail.ice_quality)}</td>
            <td>${renderStarRating(gridDetail.particle_number)}</td>
            <td>${renderStarRating(gridDetail.grid_quality)}</td>
            <td>${gridDetail.rescued ? "Yes" : "No"}</td>
            <td class="comments-col">${commentsDisplay}</td>
          </tr>
        `;
      } else {
        // Empty slot
        gridRows += `
          <tr style="color: #888; font-style: italic;">
            <td>${slot}</td>
            <td colspan="8" style="text-align: center;">Empty slot</td>
          </tr>
        `;
      }
    }

    detailCell.innerHTML = `
      <div class="expandable-content" id="microscope-session-details-${idx}">
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px; gap: 10px;">
          <h4 class="detail-subtitle" style="margin: 0;">Details for Session on ${session.date}</h4>
          <button class="btn-icon btn-warning" onclick="editMicroscopeSession(${session.microscope_session_id}, ${idx})" title="Edit this microscope session">
            <i class="fas fa-pen-to-square"></i>
          </button>
        </div>
        <div class="grid-detail-container">
          <table class="microscope-grid-table">
            <colgroup>
              <col style="width: 5%;">
              <col style="width: 10%;">
              <col style="width: 8%;">
              <col style="width: 8%;">
              <col style="width: 12%;">
              <col style="width: 12%;">
              <col style="width: 12%;">
              <col style="width: 8%;">
              <col style="width: 25%;">
            </colgroup>
            <thead>
              <tr>
                <th>Slot</th>
                <th>Grid ID</th>
                <th>Screened</th>
                <th>Images</th>
                <th>Ice Quality</th>
                <th>Particle #</th>
                <th>Grid Quality</th>
                <th>Rescued</th>
                <th class="comments-col">Comments</th>
              </tr>
            </thead>
            <tbody>
              ${gridRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    detailRow.appendChild(detailCell);
    tableBody.appendChild(sessionRow);
    tableBody.appendChild(detailRow);

    // Toggle logic for details row and content
    sessionRow
      .querySelector(".expandable-row-icon")
      .addEventListener("click", function () {
        detailRow.classList.toggle("visible");
        const content = detailRow.querySelector(".expandable-content");
        content.classList.toggle("expanded");
        this.classList.toggle("expanded");
        this.textContent = this.textContent === "▶" ? "▼" : "▶";
      });
  });
}

// Store sessions data globally for editing
let globalSessionsData = [];

// Edit microscope session function
async function editMicroscopeSession(sessionId, sessionIndex) {
  try {
    // Get the session data from the global store
    const sessionData = globalSessionsData[sessionIndex];

    if (!sessionData) {
      throw new Error("Session data not found");
    }

    // Open the modal with existing data
    openMicroscopeSessionModalForEdit(sessionData);
  } catch (error) {
    console.error("Error editing microscope session:", error);
    showAlert(`Error editing microscope session: ${error.message}`, "error");
  }
}

// Function to open modal for editing with pre-filled data
function openMicroscopeSessionModalForEdit(sessionData) {
  // Open the modal with the session ID for editing and a callback to refresh
  openMicroscopeSessionModal(
    sessionData.microscope_session_id,
    loadMicroscopeSessions,
  );

  // Wait a bit for the modal to render, then populate it
  setTimeout(async () => {
    await populateMicroscopeSessionForm(sessionData);
  }, 100);
}

// Function to populate the microscope session form with existing data
async function populateMicroscopeSessionForm(sessionData) {
  const form = document.getElementById("microscopeSessionForm");
  if (!form) return;

  // Import the flag from microscopeSessionModal and updateAllStarRatingsVisuals from utils
  const { setLoadingFormData } =
    await import("../components/microscopeSessionModal.js");
  const { updateAllStarRatingsVisuals } =
    await import("../utils/starRating.js");

  // Set loading flag to prevent autopopulation during form population
  setLoadingFormData(true);

  // Set basic session info
  const dateField = form.querySelector('[name="date"]');
  if (dateField && sessionData.date) {
    dateField.value = sessionData.date;
  }

  const microscopeField = form.querySelector('[name="microscope"]');
  if (microscopeField && sessionData.microscope) {
    microscopeField.value = sessionData.microscope;
  }

  const overnightField = form.querySelector('[name="overnight"]');
  if (overnightField) {
    overnightField.checked = sessionData.overnight || false;
  }

  const clippedField = form.querySelector('[name="clipped_at_microscope"]');
  if (clippedField) {
    clippedField.checked = sessionData.clipped_at_microscope || false;
  }

  const issuesField = form.querySelector('[name="issues"]');
  if (issuesField && sessionData.issues) {
    issuesField.value = sessionData.issues;
  }

  // Change the form title and button text
  const titleElement = form.parentElement.querySelector("h2");
  if (titleElement) {
    titleElement.textContent = `Edit Microscope Session - ${sessionData.date}`;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Update Session";
  }

  // Populate grid details
  if (sessionData.details && Array.isArray(sessionData.details)) {
    sessionData.details.forEach((detail) => {
      populateSlotData(detail);
    });
  }

  // Update star rating visuals after values are set
  setTimeout(() => {
    updateAllStarRatingsVisuals();
  }, 50);

  // Clear loading flag after a short delay to ensure all events have been processed
  setTimeout(() => {
    setLoadingFormData(false);
  }, 300);
}

// Function to populate individual slot data
function populateSlotData(detail) {
  const slot = detail.microscope_slot;
  const tbody = document.getElementById("microscopeSlotsTableBody");
  if (!tbody) return;

  // Find the row for this slot
  const slotRow = tbody.querySelector(`tr[data-slot="${slot}"]`);
  if (!slotRow) return;

  // Populate basic grid info
  const gridIdField = slotRow.querySelector('[name="grid_identifier[]"]');
  if (gridIdField && detail.grid_identifier) {
    gridIdField.value = detail.grid_identifier;
  }

  const atlasField = slotRow.querySelector('[name="atlas[]"]');
  if (atlasField) {
    atlasField.checked = detail.atlas || false;
  }

  const screenedField = slotRow.querySelector('[name="screened[]"]');
  if (screenedField && detail.screened) {
    screenedField.value = detail.screened;
  }

  const collectedField = slotRow.querySelector('[name="collected[]"]');
  if (collectedField) {
    collectedField.checked = detail.collected || false;
    // Trigger change event to show/hide foldout
    collectedField.dispatchEvent(new Event("change"));
  }

  // Set star ratings - just set the hidden input values
  // The setupStarRatings() in the modal will handle the visual state
  if (detail.grid_quality) {
    const gridQualityField = slotRow.querySelector('[name="grid_quality[]"]');
    if (gridQualityField) {
      gridQualityField.value = detail.grid_quality;
    }
  }

  if (detail.particle_number) {
    const particleNumberField = slotRow.querySelector(
      '[name="particle_number[]"]',
    );
    if (particleNumberField) {
      particleNumberField.value = detail.particle_number;
    }
  }

  if (detail.ice_quality) {
    const iceQualityField = slotRow.querySelector('[name="ice_quality[]"]');
    if (iceQualityField) {
      iceQualityField.value = detail.ice_quality;
    }
  }

  const rescuedField = slotRow.querySelector('[name="rescued[]"]');
  if (rescuedField) {
    rescuedField.checked = detail.rescued || false;
  }

  const commentsField = slotRow.querySelector('[name="comments[]"]');
  if (commentsField && detail.comments) {
    commentsField.value = detail.comments;
  }

  // If collected is checked, populate the microscope details
  if (detail.collected) {
    setTimeout(() => {
      populateMicroscopeDetails(slot, detail);
    }, 200);
  }
}

// Function to populate microscope collection details
function populateMicroscopeDetails(slot, detail) {
  const foldoutRow = document.querySelector(
    `.microscope-foldout[data-slot="${slot}"]`,
  );
  if (!foldoutRow) return;

  // Populate microscope-specific fields
  const fieldMappings = {
    "multigrid[]": "multigrid",
    "px_size[]": "px_size",
    "magnification[]": "magnification",
    "exposure_e[]": "exposure_e",
    "exposure_time[]": "exposure_time",
    "spot_size[]": "spot_size",
    "illumination_area[]": "illumination_area",
    "exp_per_hole[]": "exp_per_hole",
    "images[]": "images",
    "nominal_defocus[]": "nominal_defocus",
    "objective[]": "objective",
    "slit_width[]": "slit_width",
  };

  Object.entries(fieldMappings).forEach(([fieldName, dataKey]) => {
    const field = foldoutRow.querySelector(`[name="${fieldName}"]`);
    if (field && detail[dataKey] !== undefined && detail[dataKey] !== null) {
      if (field.type === "checkbox") {
        field.checked = detail[dataKey] || false;
      } else {
        field.value = detail[dataKey];
      }
    }
  });
}

// Make the edit function globally accessible
window.editMicroscopeSession = editMicroscopeSession;
