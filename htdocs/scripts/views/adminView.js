// Admin view functionality
// This file handles all admin-related functionality including forms and data management

import { showAlert } from "../components/alertSystem.js";

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
  // Make handleSelectChange globally available
  window.handleSelectChange = handleSelectChange;

  isAdminViewInitialized = true;
}

function setupAdminButtons() {
  const addNewGridsButton = document.getElementById("addNewGridsButton");
  const openMicroscopeSessionBtn = document.getElementById(
    "openMicroscopeSessionBtn"
  );

  if (addNewGridsButton) {
    addNewGridsButton.addEventListener("click", openGridModal);
  }

  if (openMicroscopeSessionBtn) {
    openMicroscopeSessionBtn.addEventListener(
      "click",
      openMicroscopeSessionModal
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
    "extraLayerThicknessOther"
  );

  // Generate the shortened grid type name
  const gridTypeName = generateGridTypeName(
    manufacturer,
    support,
    spacing,
    gridMaterial,
    gridMesh,
    extraLayer,
    extraLayerThickness
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
          `Failed to ${isEditMode ? "update" : "add"} grid type`
      );
    }

    const result = await response.json();
    showAlert(
      `Grid type ${isEditMode ? "updated" : "added"} successfully!`,
      "success"
    );
    clearGridForm();
    closeGridModal();
    loadGridSummary(); // Refresh the summary table
  } catch (error) {
    console.error(
      `Error ${isEditMode ? "updating" : "adding"} grid type:`,
      error
    );
    showAlert(
      `Error ${isEditMode ? "updating" : "adding"} grid type: ${error.message}`,
      "error"
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
    "extraLayerThicknessOther"
  );

  // Generate the preview name
  const gridTypeName = generateGridTypeName(
    manufacturer,
    support,
    spacing,
    gridMaterial,
    gridMesh,
    extraLayer,
    extraLayerThickness
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
  extraLayerThickness
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
          gridType.grid_type_name
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
        gridType.grid_type_name
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

  // Set up expand/collapse functionality using existing pattern
  const expandIcons = document.querySelectorAll(".expandable-row-icon");
  expandIcons.forEach((icon) => {
    // Remove any existing event listeners by cloning the element
    const newIcon = icon.cloneNode(true);
    icon.parentNode.replaceChild(newIcon, icon);

    newIcon.addEventListener("click", function () {
      const gridTypeName = decodeURIComponent(
        this.getAttribute("data-grid-type-name")
      );
      const content = document.getElementById(
        `grid-details-${encodeURIComponent(gridTypeName)}`
      );
      const detailRow = this.closest("tr").nextElementSibling;

      this.classList.toggle("expanded");
      content.classList.toggle("expanded");
      detailRow.classList.toggle("visible");
      this.textContent = this.textContent === "▶" ? "▼" : "▶";

      // Load batch details if expanding and not already loaded
      if (this.classList.contains("expanded")) {
        const batchContainer = document.getElementById(
          `batch-details-${encodeURIComponent(gridTypeName)}`
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
      `/api/grid-types/batches?type=${encodeURIComponent(gridTypeName)}`
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
    gridType.extra_layer_thickness
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
      "Are you sure you want to mark this grid type as empty? This will set the quantity to 0."
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
      "Are you sure you want to delete this grid type? This action cannot be undone."
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
      "Are you sure you want to mark this grid type as 'In Use'? This indicates the batch is currently being used."
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

// Microscope Session Modal Functions
function setupMicroscopeSessionModal() {
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

function openMicroscopeSessionModal() {
  const modal = document.getElementById("microscopeSessionModal");
  const content = document.getElementById("microscopeSessionModalContent");

  if (modal && content) {
    // Add wide class for this modal
    modal.querySelector(".modal-content").classList.add("wide");

    // Load the form content
    content.innerHTML = generateMicroscopeSessionForm();
    setupMicroscopeSessionForm();

    modal.style.display = "block";
    document.body.classList.add("modal-open");
  }
}

function closeMicroscopeSessionModal() {
  const modal = document.getElementById("microscopeSessionModal");
  if (modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    // Remove wide class
    modal.querySelector(".modal-content").classList.remove("wide");
  }
}

function generateMicroscopeSessionForm() {
  return `
    <h2>New Microscope Session</h2>
    <form id="microscopeSessionForm">
      <div class="session-info-grid">
        <div class="form-group">
          <label for="sessionDate">Date *</label>
          <input type="date" name="date" id="sessionDate" required />
        </div>
        <div class="form-group">
          <label for="sessionMicroscope">Microscope *</label>
          <input type="text" name="microscope" id="sessionMicroscope" required placeholder="e.g. Krios1" />
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

  // Set default date to today
  const dateInput = document.getElementById("sessionDate");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

  // Generate 12 rows for slots
  generateMicroscopeSlotRows();

  // Setup star ratings after rows are generated
  setupStarRatings();

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
  for (let i = 1; i <= 12; i++) {
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
      <td><div class="star-rating" data-field="grid_quality" data-slot="${i}">
        <span class="star" data-value="1">★</span>
        <span class="star" data-value="2">★</span>
        <span class="star" data-value="3">★</span>
        <span class="star" data-value="4">★</span>
        <span class="star" data-value="5">★</span>
        <input type="hidden" name="grid_quality[]" value="0" />
      </div></td>
      <td><div class="star-rating" data-field="particle_number" data-slot="${i}">
        <span class="star" data-value="1">★</span>
        <span class="star" data-value="2">★</span>
        <span class="star" data-value="3">★</span>
        <span class="star" data-value="4">★</span>
        <span class="star" data-value="5">★</span>
        <input type="hidden" name="particle_number[]" value="0" />
      </div></td>
      <td><div class="star-rating" data-field="ice_quality" data-slot="${i}">
        <span class="star" data-value="1">★</span>
        <span class="star" data-value="2">★</span>
        <span class="star" data-value="3">★</span>
        <span class="star" data-value="4">★</span>
        <span class="star" data-value="5">★</span>
        <input type="hidden" name="ice_quality[]" value="0" />
      </div></td>
      <td><input name="comments[]" type="text" placeholder="Notes" style="width: 100%;" /></td>
    `;
    tbody.appendChild(tr);
  }
}

async function handleMicroscopeSessionSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // Collect slot details
  const details = [];
  const tbody = document.getElementById("microscopeSlotsTableBody");
  tbody.querySelectorAll("tr").forEach((tr) => {
    const grid_identifier = tr
      .querySelector('[name="grid_identifier[]"]')
      .value.trim();
    if (grid_identifier) {
      details.push({
        microscope_slot: parseInt(tr.dataset.slot),
        grid_identifier: grid_identifier,
        atlas: tr.querySelector('[name="atlas[]"]').checked ? 1 : 0,
        screened: tr.querySelector('[name="screened[]"]').value.trim() || null,
        collected: tr.querySelector('[name="collected[]"]').checked ? 1 : 0,
        grid_quality: tr.querySelector('[name="grid_quality[]"]').value || null,
        particle_number:
          tr.querySelector('[name="particle_number[]"]').value || null,
        ice_quality: tr.querySelector('[name="ice_quality[]"]').value || null,
        comments: tr.querySelector('[name="comments[]"]').value.trim() || null,
      });
    }
  });

  const payload = {
    date: formData.get("date"),
    microscope: formData.get("microscope"),
    overnight: formData.get("overnight") ? 1 : 0,
    clipped_at_microscope: formData.get("clipped_at_microscope") ? 1 : 0,
    issues: formData.get("issues") || null,
    details: details,
  };

  try {
    const response = await fetch("/api/microscope-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const result = await response.json();
    showAlert(
      `Microscope session saved successfully! Session ID: ${result.id}`,
      "success"
    );
    closeMicroscopeSessionModal();
  } catch (error) {
    console.error("Error saving microscope session:", error);
    showAlert(`Failed to save session: ${error.message}`, "error");
  }
}

// Star Rating Functions
function setupStarRatings() {
  const starRatings = document.querySelectorAll(".star-rating");

  starRatings.forEach((rating) => {
    const stars = rating.querySelectorAll(".star");
    const hiddenInput = rating.querySelector('input[type="hidden"]');

    stars.forEach((star) => {
      // Add hover effect
      star.addEventListener("mouseenter", () => {
        const value = parseInt(star.dataset.value);
        highlightStars(rating, value);
      });

      // Click to set rating
      star.addEventListener("click", () => {
        const value = parseInt(star.dataset.value);
        setStarRating(rating, value);
        hiddenInput.value = value;
      });
    });

    // Reset on mouse leave
    rating.addEventListener("mouseleave", () => {
      const currentValue = parseInt(hiddenInput.value);
      highlightStars(rating, currentValue);
    });
  });
}

function highlightStars(ratingContainer, value) {
  const stars = ratingContainer.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add("active");
      star.classList.remove("inactive");
    } else {
      star.classList.remove("active");
      star.classList.add("inactive");
    }
  });
}

function setStarRating(ratingContainer, value) {
  const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
  hiddenInput.value = value;
  highlightStars(ratingContainer, value);
}

// Make functions globally accessible
window.editGridType = editGridType;
window.markGridTypeEmpty = markGridTypeEmpty;
window.markGridTypeInUse = markGridTypeInUse;
window.deleteGridType = deleteGridType;
