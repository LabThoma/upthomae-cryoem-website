document.addEventListener("DOMContentLoaded", () => {
  initializePage();
});

// Initialize the page and set up event listeners
function initializePage() {
  loadComponents(() => {
    setupEventListeners();
  });
}

// Set the default date to today
function setDefaultDate() {
  const sessionDateElement = document.getElementById("sessionDate");
  if (sessionDateElement) {
    sessionDateElement.value = new Date().toISOString().split("T")[0];
  }
}

// Set up event listeners for various UI interactions
function setupEventListeners() {
  // Initialize grid table
  setupGridTable();

  const glowDischarge = document.getElementById("glowDischarge");
  if (glowDischarge) {
    glowDischarge.addEventListener("change", toggleGlowDischargeSettings);
  }

  const saveUpdateButton = document.getElementById("saveUpdateButton");
  if (saveUpdateButton) {
    saveUpdateButton.addEventListener("click", saveUpdate);
  }

  const viewUserButton = document.getElementById("viewUserButton");
  if (viewUserButton) {
    viewUserButton.addEventListener("click", () => viewUserData("Bob Smith"));
  }

  // These buttons are not currently used. Some need to be implemented.
  const saveToGridListButton = document.getElementById("saveToGridListButton");
  if (saveToGridListButton) {
    saveToGridListButton.addEventListener("click", saveToGridList);
  }

  const viewDatabaseButton = document.getElementById("viewDatabaseButton");
  if (viewDatabaseButton) {
    viewDatabaseButton.addEventListener("click", viewGridDatabase);
  }

  const nextBoxButton = document.getElementById("nextBoxButton");
  if (nextBoxButton) {
    nextBoxButton.addEventListener("click", prepareNextBox);
  }

  const clearFormButton = document.getElementById("clearFormButton");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm);
  }
}

// Toggle visibility of glow discharge settings
function toggleGlowDischargeSettings() {
  const settings = document.getElementById("glowDischargeSettings");
  if (settings) {
    settings.style.display = this.checked ? "grid" : "none";
  }
}

// Save and update grid data
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

    console.log("Session Data:", sessionData);

    // Extract vitrobot settings data
    const vitrobotSettings = {
      humidity_percent: getElementValue("humidity"),
      temperature_c: getElementValue("temperature"),
      blot_force: getElementValue("blotForce"),
      blot_time_seconds: getElementValue("blotTime"),
      wait_time_seconds: getElementValue("waitTime"),
      default_volume_ul: getElementValue("drainTime"),
      glow_discharge_applied: getElementChecked("glowDischarge"),
    };

    console.log("Vitrobot Settings:", vitrobotSettings);

    // Extract grid preparation data
    const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
    const gridPreparations = Array.from(checkedGrids).map((checkbox) => {
      const row = checkbox.closest("tr");
      return {
        slot_number: row.getAttribute("data-slot"),
        comments: getRowValue(row, ".grid-comments"),
        volume_ul_override: getRowValue(row, ".grid-volume"),
        blot_time_override: getRowValue(row, ".grid-blot-time"),
        blot_force_override: getRowValue(row, ".grid-blot-force"),
        grid_batch: getRowValue(row, ".grid-batch"),
        additives_override: getRowValue(row, ".grid-additives"),
        include_in_session: true,
      };
    });

    console.log("Grid Preparations:", gridPreparations);

    // Construct the request body
    const requestBody = {
      session: sessionData,
      vitrobot_settings: vitrobotSettings,
      grids: gridPreparations,
    };

    console.log("Request Body:", requestBody);

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

    console.log("Session saved successfully:", result);
    showAlert("Data saved successfully!", "success");
  } catch (error) {
    console.error("Error saving data:", error);
    showAlert(`Error saving data: ${error.message}`, "error");
  }
}

// Helper function to safely get element value
function getElementValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : "";
}

// Helper function to safely get element checked state
function getElementChecked(id) {
  const element = document.getElementById(id);
  return element ? element.checked : false;
}

// Helper function to safely get row value
function getRowValue(row, selector) {
  // Special case for slot numbers as they are fixed text
  if (selector === ".grid-slot") {
    return row.getAttribute("data-slot") || "";
  }
  const element = row.querySelector(selector);
  return element ? element.value : "";
}

// Validate the form before saving - IMPROVED VERSION
function validateForm() {
  const errors = [];

  // Check required fields that should exist
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

  // Check if at least one grid is selected
  const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
  if (checkedGrids.length === 0) {
    errors.push("Please select at least one grid.");
  }

  // Check glow discharge settings if enabled
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

// Fetch grid data from the server and update the database table
async function fetchGridData() {
  try {
    const response = await fetch("http://localhost:3000/api/sessions");
    if (!response.ok) throw new Error("Failed to fetch grid data");

    const sessions = await response.json();
    updateDatabaseTable(sessions);
  } catch (error) {
    console.error(error);
    showAlert("Error fetching grid data", "error");
  }
}

// Update the grid database table with fetched data
function updateDatabaseTable(sessions) {
  const tableBody = document.getElementById("databaseTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No sessions found</td></tr>';
    return;
  }

  sessions.forEach((session) => {
    // Create main row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <span class="expandable-row-icon" data-session-id="${
          session.session_id
        }">▶</span>
        ${session.grid_box_name || "N/A"}
      </td>
      <td>${session.date || "N/A"}</td>
      <td>${session.sample_id || "N/A"}</td>
    `;
    tableBody.appendChild(row);

    // Create expandable content row
    const detailRow = document.createElement("tr");
    detailRow.className = "expandable-row";

    // Create a cell that spans all columns
    const detailCell = document.createElement("td");
    detailCell.colSpan = 3; // Span across all columns

    // Create the grid detail table
    let gridTableHTML = `
      <div class="expandable-content" id="details-${session.session_id}">
        <h4 class="detail-subtitle">Grid Details</h4>
        <div class="grid-detail-container">
          <table class="grid-detail-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Grid Type</th>
                <th>Blot Time</th>
                <th>Blot Force</th>
                <th>Volume</th>
                <th>Additive</th>
                <th class="comments-col">Comments</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Generate 4 rows for the grids
    // Check if session has grid_preparations data
    const grids = session.grid_preparations || [];

    // Generate rows for each slot (1-4)
    for (let i = 1; i <= 4; i++) {
      // Find the grid data for this slot if it exists
      const gridData = grids.find((g) => g.slot_number === i) || {};

      gridTableHTML += `
        <tr>
          <td>${i}</td>
          <td>${gridData.grid_type_id || "N/A"}</td>
          <td>${gridData.blot_time_override || session.blot_time || "N/A"}</td>
          <td>${
            gridData.blot_force_override || session.blot_force || "N/A"
          }</td>
          <td>${gridData.volume_ul_override || session.volume_ul || "N/A"}</td>
          <td>${gridData.additives_override || "N/A"}</td>
          <td class="comments-col">${gridData.comments || "No comments"}</td>
        </tr>
      `;
    }

    gridTableHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    detailCell.innerHTML = gridTableHTML;
    detailRow.appendChild(detailCell);
    tableBody.appendChild(detailRow);
  });

  // Add event listeners to the expandable row icons after the table is populated
  const expandIcons = document.querySelectorAll(".expandable-row-icon");
  expandIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const sessionId = this.getAttribute("data-session-id");
      const content = document.getElementById(`details-${sessionId}`);

      // Toggle expanded class
      this.classList.toggle("expanded");
      content.classList.toggle("expanded");
    });
  });
}

// Show an alert message
function showAlert(message, type = "success") {
  const container = document.getElementById("alertContainer");
  if (!container) {
    console.log(`${type.toUpperCase()}: ${message}`);
    return;
  }

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  container.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

// Load reusable components
function loadComponents(callback) {
  const components = [
    { id: "header", filePath: "components/header.html" },
    { id: "session-info", filePath: "components/session-info.html" },
    { id: "sample-info", filePath: "components/sample-info.html" },
    { id: "grid-info", filePath: "components/grid-info.html" },
    { id: "vitrobot-settings", filePath: "components/vitrobot-settings.html" },
    { id: "grid-details", filePath: "components/grid-details.html" },
    { id: "grid-database", filePath: "components/grid-database.html" },
  ];

  let loadedCount = 0;

  components.forEach(({ id, filePath }) => {
    fetch(filePath)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        return response.text();
      })
      .then((html) => {
        const element = document.getElementById(id);
        if (element) {
          element.innerHTML = html;
        }

        // Call setDefaultDate after session-info is loaded
        if (id === "session-info") {
          setDefaultDate();
        }
        loadedCount++;

        // Call the callback after all components are loaded
        if (
          loadedCount === components.length &&
          typeof callback === "function"
        ) {
          callback();
        }
      })
      .catch((error) => console.error(error));
  });
}

function setupGridTable() {
  const tbody = document.querySelector(".grid-table tbody");
  if (!tbody) return;

  // Clear any existing rows
  tbody.innerHTML = "";

  // Generate 4 identical rows with different slot numbers
  for (let i = 1; i <= 4; i++) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-grid", i);
    tr.setAttribute("data-slot", i);

    tr.innerHTML = `
      <td>${i}</td>
      <td><input type="checkbox" class="grid-checkbox" /></td>
      <td><input type="text" class="grid-comments" placeholder="Notes" /></td>
      <td><input type="number" class="grid-volume" step="0.1" placeholder="Override" /></td>
      <td><input type="number" class="grid-blot-time" placeholder="Override" /></td>
      <td><input type="number" class="grid-blot-force" placeholder="Override" /></td>
      <td><input type="text" class="grid-batch" placeholder="Override" /></td>
    <td><input type="text" class="grid-additives" step="0.1" placeholder="Override" /></td>
      `;

    tbody.appendChild(tr);
  }
}

// Placeholder functions for missing functionality
function saveToGridList() {
  showAlert("Save to Grid List functionality not implemented yet", "info");
}

function viewGridDatabase() {
  fetchGridData();
}

function prepareNextBox() {
  showAlert("Prepare Next Box functionality not implemented yet", "info");
}

function clearForm() {
  // Clear form fields
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

function editSession(sessionId) {
  showAlert(
    `Edit session ${sessionId} functionality not implemented yet`,
    "info"
  );
}

function deleteSession(sessionId) {
  if (confirm("Are you sure you want to delete this session?")) {
    // Implement delete functionality
    showAlert(
      `Delete session ${sessionId} functionality not implemented yet`,
      "info"
    );
  }
}

// Fetch and display grid data for a specific user
async function viewUserData(userName) {
  console.log(`Fetching data for user: ${userName}`);

  // Make the grid database component visible
  const gridDatabaseDiv = document.getElementById("grid-database");
  if (gridDatabaseDiv) {
    gridDatabaseDiv.style.display = "block";
  }

  // Also make the database view inside the component visible
  const databaseView = document.getElementById("databaseView");
  if (databaseView) {
    databaseView.style.display = "block";
  }

  try {
    // Rest of your existing code...
    const encodedUsername = encodeURIComponent(userName);
    const url = `http://localhost:3000/api/users/${encodedUsername}/sessions`;
    console.log(`Sending request to: ${url}`);

    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);

    if (!response.ok)
      throw new Error(`Failed to fetch data for user: ${userName}`);

    const userSessions = await response.json();
    console.log(
      `Received ${userSessions.length} sessions for ${userName}:`,
      userSessions
    );

    // Update the table with this user's sessions
    updateDatabaseTable(userSessions);

    // Show user-specific message
    showAlert(`Displaying grid data for ${userName}`, "info");
  } catch (error) {
    console.error("Error in viewUserData:", error);
    showAlert(`Error fetching data for ${userName}: ${error.message}`, "error");
  }
}
