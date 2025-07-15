// This file manages the display of the form view, including handling form submissions and validations.

export function setupFormView() {
  document.addEventListener("DOMContentLoaded", () => {
    initializeForm();
    setupFormEventListeners();
  });
}

function initializeForm() {
  setDefaultDate();
}

export function setDefaultDate() {
  const sessionDateElement = document.getElementById("sessionDate");
  if (sessionDateElement) {
    sessionDateElement.value = new Date().toISOString().split("T")[0];
  }
}

function setupFormEventListeners() {
  const saveUpdateButton = document.getElementById("saveUpdateButton");
  if (saveUpdateButton) {
    saveUpdateButton.addEventListener("click", saveUpdate);
  }

  const clearFormButton = document.getElementById("clearFormButton");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm);
  }
}

async function saveUpdate() {
  const errors = validateForm();
  if (errors.length > 0) {
    errors.forEach((error) => showAlert(error, "error"));
    return;
  }

  try {
    // Extract session data
    const sessionData = {
      user_name: getElementValue("userName"),
      date: getElementValue("sessionDate"),
      grid_box_name: getElementValue("gridBoxName"),
      loading_order: getElementValue("loadingOrder"),
      puck_name: getElementValue("puckName"),
      puck_position: getElementValue("puckPosition"),
    };

    // Extract sample information
    const sampleData = {
      sample_name: getElementValue("sampleName"),
      sample_concentration: getElementValue("sampleConcentration"),
      additives: getElementValue("additives"),
      default_volume_ul: getElementValue("volume"),
    };

    // Extract vitrobot settings data
    const vitrobotSettings = {
      humidity_percent: getElementValue("humidity"),
      temperature_c: getElementValue("temperature"),
      blot_force: getElementValue("blotForce"),
      blot_time_seconds: getElementValue("blotTime"),
      wait_time_seconds: getElementValue("waitTime"),
      glow_discharge_applied: getElementChecked("glowDischarge"),
    };

    // Extract grid information
    const gridInfo = {
      grid_type: getElementValue("gridType"),
      grid_batch: getElementValue("gridBatch"),
      glow_discharge_applied: getElementChecked("glowDischarge"),
      glow_discharge_current: getElementValue("glowCurrent"),
      glow_discharge_time: getElementValue("glowTime"),
    };

    // Extract grid preparation data
    const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
    const gridPreparations = Array.from(checkedGrids).map((checkbox) => {
      const row = checkbox.closest("tr");
      return {
        slot_number: row.getAttribute("data-slot"),
        grid_id: parseInt(document.getElementById("gridType").value) || null,
        sample_id: null,
        sample_name: sampleData.sample_name,
        sample_concentration: sampleData.sample_concentration,
        additives: sampleData.additives,
        comments: getRowValue(row, ".grid-comments"),
        volume_ul_override: getRowValue(row, ".grid-volume"),
        blot_time_override: getRowValue(row, ".grid-blot-time"),
        blot_force_override: getRowValue(row, ".grid-blot-force"),
        grid_batch_override: getRowValue(row, ".grid-batch-override"),
        additives_override: getRowValue(row, ".grid-additives"),
        include_in_session: true,
      };
    });

    // Construct the request body
    const requestBody = {
      session: sessionData,
      sample: sampleData,
      vitrobot_settings: vitrobotSettings,
      grid_info: gridInfo,
      grids: gridPreparations,
    };

    // Send the request to the backend
    const response = await fetch("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "Failed to save session data"
      );
    }

    showAlert("Data saved successfully!", "success");
  } catch (error) {
    console.error("Error saving data:", error);
    showAlert(`Error saving data: ${error.message}`, "error");
  }
}

function clearForm() {
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="date"], textarea'
  );
  inputs.forEach((input) => (input.value = ""));

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => (checkbox.checked = false));

  const selects = document.querySelectorAll("select");
  selects.forEach((select) => (select.selectedIndex = 0));

  showAlert("Form cleared", "info");
}

// Helper functions for form handling
function getElementValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : "";
}

function getElementChecked(id) {
  const element = document.getElementById(id);
  return element ? element.checked : false;
}

function getRowValue(row, selector) {
  if (selector === ".grid-slot") {
    return row.getAttribute("data-slot") || "";
  }
  const element = row.querySelector(selector);
  return element ? element.value : "";
}

function validateForm() {
  const errors = [];
  const requiredFields = [
    { id: "userName", name: "User Name" },
    { id: "sessionDate", name: "Session Date" },
    { id: "gridBoxName", name: "Grid Box Name" },
  ];

  requiredFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      errors.push(`Please enter ${field.name}.`);
    }
  });

  const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
  if (checkedGrids.length === 0) {
    errors.push("Please select at least one grid.");
  }

  const glowDischarge = document.getElementById("glowDischarge");
  if (glowDischarge && glowDischarge.checked) {
    const glowCurrent = document.getElementById("glowCurrent");
    const glowTime = document.getElementById("glowTime");

    if (!glowCurrent || !glowCurrent.value) {
      errors.push("Please enter glow discharge current.");
    }
    if (!glowTime || !glowTime.value) {
      errors.push("Please enter glow discharge time.");
    }
  }

  return errors;
}
