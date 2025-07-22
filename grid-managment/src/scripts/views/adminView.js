// Admin view functionality
// This file handles all admin-related functionality including forms and data management

import { showAlert } from "../components/alertSystem.js";

export function setupAdminView() {
  setupAdminButtons();
  setupGridModal();
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
  const gridData = {
    manufacturer: formData.get("manufacturer"),
    support: formData.get("support"),
    spacing: formData.get("spacing"),
    grid_material: formData.get("gridMaterial"),
    grid_mesh: formData.get("gridMesh"),
    extra_layer: formData.get("extraLayer"),
    extra_layer_thickness: formData.get("extraLayerThickness"),
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
  }
}
