// This file contains the logic for handling session-related operations.

import * as alertSystem from "../components/alertSystem.js";

export async function saveUpdate(event) {
  // Prevent default form submission behavior
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  // Import these utilities dynamically to avoid circular dependencies
  const formUtils = await import("../utils/formUtils.js");

  const errors = formUtils.validateForm();
  if (errors.length > 0) {
    errors.forEach((error) => alertSystem.showAlert(error, "error"));
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

    console.log("Session Data:", sessionData);

    // Extract sample information
    const sampleData = {
      sample_name: getElementValue("sampleName"),
      sample_concentration: getElementValue("sampleConcentration"),
      additives: getElementValue("additives"),
      default_volume_ul: getElementValue("volume"),
    };

    console.log("Sample Data:", sampleData);

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

    console.log("Grid Info:", gridInfo);
    console.log("Vitrobot Settings:", vitrobotSettings);

    // Extract grid preparation data
    const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
    const gridPreparations = Array.from(checkedGrids).map((checkbox) => {
      const row = checkbox.closest("tr");
      return {
        slot_number: row.getAttribute("data-slot"),
        grid_id: null, // We'll resolve this on the server
        sample_id: null, // We'll resolve this on the server
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

    console.log("Grid Preparations:", gridPreparations);

    // Construct the request body
    const requestBody = {
      session: sessionData,
      sample: sampleData,
      vitrobot_settings: vitrobotSettings,
      grid_info: gridInfo,
      grids: gridPreparations,
    };

    console.log("Request Body:", requestBody);

    // First check if a session with this grid box name already exists for this user
    const checkResponse = await fetch(
      `/api/sessions/check?user_name=${encodeURIComponent(
        sessionData.user_name
      )}&grid_box_name=${encodeURIComponent(sessionData.grid_box_name)}`
    );

    let existingSession = null;
    if (checkResponse.ok) {
      const checkResult = await checkResponse.json();
      existingSession = checkResult.session;
    }

    let response, result;

    if (existingSession) {
      // Update existing session
      console.log("Updating existing session:", existingSession.session_id);
      response = await fetch(`/api/sessions/${existingSession.session_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      result = await response.json();
      if (!response.ok) {
        // Handle error response - ensure we get a string message
        let errorMessage = "Failed to update session data";
        if (result.message) {
          errorMessage =
            typeof result.message === "string"
              ? result.message
              : JSON.stringify(result.message);
        } else if (result.error) {
          errorMessage =
            typeof result.error === "string"
              ? result.error
              : JSON.stringify(result.error);
        }
        throw new Error(errorMessage);
      }
      console.log("Session updated successfully:", result);
      alertSystem.showAlert("Grid box data updated successfully!", "success");
    } else {
      // Create new session
      console.log("Creating new session");
      response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      result = await response.json();
      if (!response.ok) {
        // Handle error response - ensure we get a string message
        let errorMessage = "Failed to save session data";
        if (result.message) {
          errorMessage =
            typeof result.message === "string"
              ? result.message
              : JSON.stringify(result.message);
        } else if (result.error) {
          errorMessage =
            typeof result.error === "string"
              ? result.error
              : JSON.stringify(result.error);
        }
        throw new Error(errorMessage);
      }
      console.log("Session created successfully:", result);
      alertSystem.showAlert("New grid box created successfully!", "success");
    }
  } catch (error) {
    console.error("Error saving data:", error);
    alertSystem.showAlert(`Error saving data: ${error.message}`, "error");
  }
}

// Helper functions for form data extraction
function getElementValue(id) {
  const element = document.getElementById(id);
  if (!element) return "";

  // Handle special cases for grid type and batch dropdowns with custom inputs
  if (id === "gridType") {
    if (element.value === "__custom__") {
      const customInput = document.getElementById("gridTypeCustom");
      return customInput ? customInput.value : "";
    }
    return element.value;
  }

  if (id === "gridBatch") {
    if (element.value === "__custom__") {
      const customInput = document.getElementById("gridBatchCustom");
      return customInput ? customInput.value : "";
    }
    return element.value;
  }

  // For numeric fields that should be null when empty, convert empty strings to null
  const numericFields = [
    "volume",
    "humidity",
    "temperature",
    "blotForce",
    "blotTime",
    "waitTime",
    "glowCurrent",
    "glowTime",
  ];
  if (numericFields.includes(id) && element.value.trim() === "") {
    return null;
  }

  return element.value;
}

function getElementChecked(id) {
  const element = document.getElementById(id);
  return element ? element.checked : false;
}

function getRowValue(row, selector) {
  // Special case for slot numbers as they are fixed text
  if (selector === ".grid-slot") {
    return row.getAttribute("data-slot") || "";
  }
  const element = row.querySelector(selector);
  return element ? element.value : "";
}

export async function fetchGridData() {
  try {
    const response = await fetch("/api/sessions");
    if (!response.ok) throw new Error("Failed to fetch grid data");

    const sessions = await response.json();
    return sessions;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function nextBox(event) {
  // Prevent default form submission behavior
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  try {
    // Get selected user
    const userName = getElementValue("userName");
    if (!userName) {
      alertSystem.showAlert("Please select a user first.", "error");
      return;
    }

    // Fetch user data to get next box name
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const users = await response.json();
    const user = users.find((u) => u.username === userName);

    if (!user) {
      alertSystem.showAlert("User not found.", "error");
      return;
    }

    // Set the next box name
    const gridBoxNameElement = document.getElementById("gridBoxName");
    if (gridBoxNameElement) {
      gridBoxNameElement.value = user.nextBoxName;
    }

    // Clear puck position field
    const puckPositionElement = document.getElementById("puckPosition");
    if (puckPositionElement) {
      puckPositionElement.value = "";
    }

    // Clear and re-populate grid details table
    const gridTableBody = document.getElementById("grid-tbody");
    if (gridTableBody) {
      // Import and use gridTable module
      const { setupGridTable } = await import("../components/gridTable.js");
      setupGridTable();
    }

    alertSystem.showAlert(
      `Next box "${user.nextBoxName}" prepared for ${userName}`,
      "success"
    );
  } catch (error) {
    console.error("Error preparing next box:", error);
    alertSystem.showAlert(
      `Error preparing next box: ${error.message}`,
      "error"
    );
  }
}
