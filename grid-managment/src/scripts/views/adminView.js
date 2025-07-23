// Admin view functionality
// This file handles all admin-related functionality including forms and data management

import { showAlert } from "../components/alertSystem.js";

export function setupAdminView() {
  setupAdminButtons();
  setupGridModal();
  loadGridSummary();
  // Make handleSelectChange globally available
  window.handleSelectChange = handleSelectChange;
  // Make toggleGridType globally available for onclick handlers
  window.toggleGridType = toggleGridType;
}

function setupAdminButtons() {
  const addNewGridsButton = document.getElementById("addNewGridsButton");

  if (addNewGridsButton) {
    addNewGridsButton.addEventListener("click", openGridModal);
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
    const url = isEditMode
      ? `http://localhost:3000/api/grid-types/${editId}`
      : "http://localhost:3000/api/grid-types";

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
    const response = await fetch(
      "http://localhost:3000/api/grid-types/summary"
    );
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
        )}" onclick="toggleGridType('${encodeURIComponent(
      gridType.grid_type_name
    )}')">▶</span>
        ${gridType.grid_type_name || "Unnamed Grid Type"} (${
      gridType.batch_count
    } batch${gridType.batch_count !== 1 ? "es" : ""})
      </td>
      <td>${gridType.total_unused_grids || 0}</td>
      <td>${gridType.total_used_last_3_months || 0}</td>
      <td>
        <span class="text-muted" style="font-size: 0.85em;">Expand to see batches</span>
      </td>
    `;

    // Detail row (initially hidden, using existing expandable-row class)
    const detailRow = document.createElement("tr");
    detailRow.className = "expandable-row";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 4;
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
    icon.addEventListener("click", function () {
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
      `http://localhost:3000/api/grid-types/batches/${encodeURIComponent(
        gridTypeName
      )}`
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
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  batches.forEach((batch) => {
    tableHTML += `
      <tr>
        <td>${batch.q_number || "N/A"}</td>
        <td>${batch.quantity || 0}</td>
        <td>${batch.used_grids || 0}</td>
        <td>${batch.remaining_grids || 0}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editGridType(${
              batch.grid_type_id
            })">
              Edit
            </button>
            <button class="action-btn empty" onclick="markGridTypeEmpty(${
              batch.grid_type_id
            })">
              Mark Empty
            </button>
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
    const response = await fetch(`http://localhost:3000/api/grid-types`);
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
    const response = await fetch(
      `http://localhost:3000/api/grid-types/${gridTypeId}/mark-empty`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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
    const response = await fetch(
      `http://localhost:3000/api/grid-types/${gridTypeId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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

// Make functions globally accessible
window.editGridType = editGridType;
window.markGridTypeEmpty = markGridTypeEmpty;
window.deleteGridType = deleteGridType;
