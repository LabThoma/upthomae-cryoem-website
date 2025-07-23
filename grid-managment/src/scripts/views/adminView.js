// Admin view functionality
// This file handles all admin-related functionality including forms and data management

import { showAlert } from "../components/alertSystem.js";

export function setupAdminView() {
  setupAdminButtons();
  setupGridModal();
  // Make handleSelectChange globally available
  window.handleSelectChange = handleSelectChange;
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
  
  const formData = new FormData(event.target);
  
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
  const extraLayerThickness = getFieldValue("extraLayerThickness", "extraLayerThicknessOther");
  
  // Generate the shortened grid type name
  const gridTypeName = generateGridTypeName(
    manufacturer, support, spacing, gridMaterial, gridMesh, extraLayer, extraLayerThickness
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
    quantity: formData.get("quantity")
  };

  try {
    const response = await fetch("http://localhost:3000/api/grid-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gridData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add grid type");
    }

    const result = await response.json();
    showAlert("Grid type added successfully!", "success");
    clearGridForm();
    closeGridModal();
  } catch (error) {
    console.error("Error adding grid type:", error);
    showAlert(`Error adding grid type: ${error.message}`, "error");
  }
}

function clearGridForm() {
  const form = document.getElementById("newGridForm");
  if (form) {
    form.reset();
    // Also hide all custom input fields
    const customInputs = form.querySelectorAll('input[id$="Other"]');
    customInputs.forEach(input => {
      input.style.display = 'none';
    });
    // Clear the preview
    updateGridTypeNamePreview();
  }
}

// Function to setup event listeners for real-time preview updates
function setupPreviewUpdaters(form) {
  const fieldsToWatch = [
    'manufacturer', 'manufacturerOther',
    'support', 'supportOther',
    'spacing', 'spacingOther',
    'gridMaterial', 'gridMaterialOther',
    'gridMesh', 'gridMeshOther',
    'extraLayer', 'extraLayerOther',
    'extraLayerThickness', 'extraLayerThicknessOther'
  ];

  fieldsToWatch.forEach(fieldName => {
    const field = form.querySelector(`#${fieldName}`);
    if (field) {
      field.addEventListener('input', updateGridTypeNamePreview);
      field.addEventListener('change', updateGridTypeNamePreview);
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
    const mainValue = mainField ? mainField.value : '';
    if (mainValue === "other") {
      const otherField = form.querySelector(`[name="${otherFieldName}"]`);
      return otherField ? otherField.value : '';
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
  const extraLayerThickness = getFieldValue("extraLayerThickness", "extraLayerThicknessOther");

  // Generate the preview name
  const gridTypeName = generateGridTypeName(
    manufacturer, support, spacing, gridMaterial, gridMesh, extraLayer, extraLayerThickness
  );

  // Update the preview display
  if (gridTypeName.trim()) {
    previewElement.innerHTML = gridTypeName;
  } else {
    previewElement.innerHTML = '<em>Enter details above to see generated name...</em>';
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
function generateGridTypeName(manufacturer, support, spacing, gridMaterial, gridMesh, extraLayer, extraLayerThickness) {
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
  const manufacturerShort = manufacturer === "Quantifoil" ? "QF" : manufacturer === "Ultrafoil" ? "UF" : null;
  const shouldOmitSupport = (
    (support === "Holey Carbon" && manufacturerShort === "QF") ||
    (support === "Holey Gold" && manufacturerShort === "UF")
  );
  
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
      extraLayerPart += " " + (extraLayer.length <= 2 ? extraLayer : extraLayer.substring(0, 1).toUpperCase());
    }
    nameParts.push(extraLayerPart);
  }
  
  return nameParts.join(" ");
}
