// This file manages the display of the database view, including fetching and rendering session data.

// Import the showAlert function
import { showAlert } from "../components/alertSystem.js";
import { setupGridModalEventListeners } from "../components/gridModal.js";
import { formatDate } from "../utils/dateUtils.js";

// Flag to prevent multiple initialization
let isDatabaseViewInitialized = false;

// Flag to prevent multiple event listener setup
let areEventListenersSetup = false;

// Cache for users data to avoid re-fetching when toggling filters
let cachedUsersData = null;

export function setupDatabaseView() {
  // Prevent multiple initialization
  if (isDatabaseViewInitialized) {
    // Just refresh the view, don't fetch data again to avoid duplicate alerts
    return;
  }

  // Only setup event listeners once
  if (!areEventListenersSetup) {
    setupDatabaseEventListeners();
    setupTrashEventListeners(); // Move this here so it's only called once
    areEventListenersSetup = true;
  }

  // Load users table on initial setup
  fetchUsersData();
  isDatabaseViewInitialized = true;
}

function setupDatabaseEventListeners() {
  // Event delegation for dynamically created user view buttons
  document.addEventListener("click", function (event) {
    // Handle clicks on the button or its icon
    const button = event.target.closest(".view-user-grids-btn");
    if (button) {
      const username = button.getAttribute("data-username");
      showUserGrids(username);
    }
  });

  // Back to users button
  document.addEventListener("click", function (event) {
    if (event.target.id === "backToUsersButton") {
      showUsersTable();
    }
  });

  // Refresh database button
  document.addEventListener("click", function (event) {
    if (event.target.closest("#refreshDatabaseButton")) {
      refreshCurrentView();
    }
  });

  // Show trashed grid boxes checkbox
  document.addEventListener("change", function (event) {
    if (event.target.id === "showTrashedGridBoxes") {
      refreshCurrentView();
    }
  });

  // Show inactive users checkbox
  document.addEventListener("change", function (event) {
    if (event.target.id === "showInactiveUsers") {
      refreshUsersTable(); // Refresh the users table with new filter
    }
  });
}

export async function fetchUserGridData(username) {
  try {
    console.log("Fetching data for user:", username);

    // Use the detailed user sessions endpoint with the username
    const response = await fetch(`/api/users/${username}/sessions`);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const sessions = await response.json();
    console.log(`Received ${sessions.length} sessions for ${username}`);

    // Update the grid database header to show the user
    const gridDatabase = document.getElementById("grid-database");
    if (gridDatabase) {
      const titleElement = gridDatabase.querySelector(".section-title");
      if (titleElement) {
        titleElement.textContent = `Grid Database - ${username}`;
      }
    }

    if (sessions.length === 0) {
      showAlert(`No grids found for user: ${username}`, "info");
      // Show empty table
      const tableBody = document.getElementById("databaseTableBody");
      if (tableBody) {
        tableBody.innerHTML =
          '<tr><td colspan="3">No sessions found for this user</td></tr>';
      }
    } else {
      const showTrashed =
        document.getElementById("showTrashedGridBoxes")?.checked || false;
      updateDatabaseTable(sessions, showTrashed);
      showAlert(
        `Displaying ${sessions.length} grids for ${username}`,
        "success"
      );
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    showAlert(`Error: ${error.message}`, "error");
  }
}

export async function fetchGridData() {
  try {
    // Use the "all" special case for your user sessions endpoint
    const response = await fetch("/api/users/all/sessions");

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const sessions = await response.json();
    console.log(`Received ${sessions.length} total sessions`);

    const showTrashed =
      document.getElementById("showTrashedGridBoxes")?.checked || false;
    updateDatabaseTable(sessions, showTrashed);
    showAlert("Displaying all grids", "success");
  } catch (error) {
    console.error("Error fetching all grid data:", error);
    showAlert("Error fetching grid data", "error");
  }
}

export async function fetchUsersData() {
  try {
    // Use the new dedicated users endpoint
    const response = await fetch("/api/users");

    if (!response.ok) {
      throw new Error(`Failed to fetch users data: ${response.status}`);
    }

    const users = await response.json();

    // Cache the users data
    cachedUsersData = users;

    // Update the table with current filter
    refreshUsersTable();
    showAlert(`Found ${users.length} users`, "info");
  } catch (error) {
    console.error("Error fetching users data:", error);
    showAlert(`Error fetching users: ${error.message}`, "error");
  }
}

function refreshUsersTable() {
  if (!cachedUsersData) {
    fetchUsersData();
    return;
  }

  // Check the show inactive users checkbox state
  const showInactive =
    document.getElementById("showInactiveUsers")?.checked || false;
  updateUsersTable(cachedUsersData, showInactive);
}

export function updateDatabaseTable(sessions, showTrashedGridBoxes = false) {
  console.log("Sessions data structure:", JSON.stringify(sessions, null, 2));
  const tableBody = document.getElementById("databaseTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7">No sessions found</td></tr>';
    return;
  }

  // Filter sessions based on whether to show trashed grid boxes
  const filteredSessions = sessions.filter((session) => {
    if (showTrashedGridBoxes) {
      return true; // Show all sessions
    }

    // Check if this grid box is completely trashed
    const hasUsedGrids =
      session.grid_preparations &&
      session.grid_preparations.some(
        (grid) =>
          grid.include_in_session === true || grid.include_in_session === 1
      );

    const hasUntrashedGrids =
      session.grid_preparations &&
      session.grid_preparations.some(
        (grid) =>
          (grid.include_in_session === true || grid.include_in_session === 1) &&
          !(grid.trashed === true || grid.trashed === 1)
      );

    const isCompletelyTrashed = hasUsedGrids && !hasUntrashedGrids;

    // Only show sessions that are not completely trashed
    return !isCompletelyTrashed;
  });

  if (filteredSessions.length === 0) {
    const message = showTrashedGridBoxes
      ? "No sessions found"
      : "No active sessions found (check 'Show also trashed grid boxes' to see all)";
    tableBody.innerHTML = `<tr><td colspan="4">${message}</td></tr>`;
    return;
  }

  filteredSessions.forEach((session) => {
    console.log("Session data:", session);
    console.log("Grid preparations:", session.grid_preparations);
    const row = document.createElement("tr");

    let dateDisplay = formatDate(session.date);

    let sampleName = "N/A";
    if (session.sample_names) {
      sampleName = session.sample_names;
    } else if (
      session.grid_preparations &&
      session.grid_preparations.length > 0
    ) {
      const gridWithSample = session.grid_preparations.find(
        (grid) => grid.sample_name
      );
      if (gridWithSample) {
        sampleName = gridWithSample.sample_name;
      }
    }

    // Check if any grids in this session are in use and not already trashed
    const hasUsedGrids =
      session.grid_preparations &&
      session.grid_preparations.some(
        (grid) =>
          grid.include_in_session === true || grid.include_in_session === 1
      );

    const hasUntrashedGrids =
      session.grid_preparations &&
      session.grid_preparations.some(
        (grid) =>
          (grid.include_in_session === true || grid.include_in_session === 1) &&
          !(grid.trashed === true || grid.trashed === 1)
      );

    // Check if this grid box is completely trashed (all used grids are trashed)
    const isCompletelyTrashed = hasUsedGrids && !hasUntrashedGrids;

    // Add CSS class for completely trashed grid boxes
    if (isCompletelyTrashed) {
      row.classList.add("trashed-gridbox");
    }

    row.innerHTML = `
      <td>
        <span class="expandable-row-icon" data-session-id="${
          session.session_id
        }">▶</span>
        ${session.grid_box_name || "N/A"}
      </td>
      <td>${dateDisplay}</td> 
      <td>${sampleName}</td>
      <td>
        ${
          hasUsedGrids && !isCompletelyTrashed
            ? `
          <button class="btn-icon btn-danger trash-gridbox-btn" 
                  data-session-id="${session.session_id}" 
                  title="Trash whole grid box">
            <i class="fas fa-trash-alt"></i>
          </button>
        `
            : ""
        }
      </td>
    `;
    tableBody.appendChild(row);

    const detailRow = document.createElement("tr");
    detailRow.className = "expandable-row";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 4;

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    const grids = session.grid_preparations || [];
    console.log("Grids for session:", grids);

    // Extract session-level values to use as fallbacks
    const sessionGridType = session.grid_info?.grid_type || "N/A";
    const sessionBlotTime =
      session.settings?.blot_time_seconds ||
      session.vitrobot_settings?.blot_time_seconds ||
      "N/A";
    const sessionBlotForce =
      session.settings?.blot_force ||
      session.vitrobot_settings?.blot_force ||
      "N/A";
    const sessionDefaultVolume =
      session.settings?.default_volume_ul ||
      session.sample?.default_volume_ul ||
      "N/A";

    // For debugging
    console.log("Session standard values:", {
      gridType: sessionGridType,
      blotTime: sessionBlotTime,
      blotForce: sessionBlotForce,
      defaultVolume: sessionDefaultVolume,
      settings: session.settings,
      vitrobot_settings: session.vitrobot_settings,
    });

    for (let i = 1; i <= 4; i++) {
      // Debug each grid row as it's being processed
      console.log(`Creating grid row for slot ${i}`);

      const gridData =
        grids.find(
          (g) => parseInt(g.slot_number) === i || parseInt(g.slot) === i
        ) || {};

      console.log(`Grid data for slot ${i}:`, gridData);

      // Check if this slot is actually used (include_in_session should be true)
      const isSlotUsed =
        gridData.include_in_session === true ||
        gridData.include_in_session === 1;

      if (!isSlotUsed) {
        // Show "Slot not used" for unused slots
        gridTableHTML += `
          <tr class="unused-slot">
            <td>${i}</td>
            <td colspan="6" style="text-align: center; font-style: italic; color: #666;">Slot not used</td>
            <td>
              <button class="btn-icon btn-success add-grid-btn" data-session-id="${session.session_id}" data-slot="${i}" title="Add Grid to Slot">
                <i class="fas fa-plus"></i>
              </button>
            </td>
          </tr>
        `;
      } else {
        // Use session values as fallbacks if grid-specific values are missing
        // Use explicit null/undefined checks so zero values are displayed
        const blotTime =
          gridData.blot_time_override !== undefined && gridData.blot_time_override !== null
            ? gridData.blot_time_override
            : gridData.blot_time !== undefined && gridData.blot_time !== null
              ? gridData.blot_time
              : gridData.blot_time_seconds !== undefined && gridData.blot_time_seconds !== null
                ? gridData.blot_time_seconds
                : sessionBlotTime !== undefined && sessionBlotTime !== null
                  ? sessionBlotTime
                  : "N/A";

        const blotForce =
          gridData.blot_force_override !== undefined && gridData.blot_force_override !== null
            ? gridData.blot_force_override
            : gridData.blot_force !== undefined && gridData.blot_force !== null
              ? gridData.blot_force
              : sessionBlotForce !== undefined && sessionBlotForce !== null
                ? sessionBlotForce
                : "N/A";

        const volume =
          gridData.volume_ul_override !== undefined && gridData.volume_ul_override !== null
            ? gridData.volume_ul_override
            : gridData.default_volume_ul !== undefined && gridData.default_volume_ul !== null
              ? gridData.default_volume_ul
              : sessionDefaultVolume !== undefined && sessionDefaultVolume !== null
                ? sessionDefaultVolume
                : "N/A";

        const additives =
          gridData.additives_override || gridData.additives || "N/A";

        const gridType =
          gridData.grid_type_override ||
          gridData.grid_type ||
          gridData.type ||
          sessionGridType ||
          "N/A";

        // Check if grid is trashed
        const isTrashed = gridData.trashed === true || gridData.trashed === 1;
        const trashedClass = isTrashed ? ' class="trashed-grid"' : "";

        gridTableHTML += `
          <tr${trashedClass}>
            <td>${i}</td>
            <td>${gridType}</td>
            <td>${blotTime}</td>
            <td>${blotForce}</td>
            <td>${volume}</td>
            <td>${additives}</td>
            <td class="comments-col">${gridData.comments || "No comments"}</td>
            <td>
              <button class="btn-icon view-grid-btn" data-session-id="${
                session.session_id
              }" data-slot="${i}" title="View & Edit">
                <i class="fas fa-book-open"></i>
              </button>
              ${
                isTrashed
                  ? `<button class="btn-icon btn-success untrash-grid-btn" data-prep-id="${gridData.prep_id}" data-session-id="${session.session_id}" data-slot="${i}" title="Restore Grid">
                      <i class="fas fa-undo"></i>
                    </button>`
                  : `<button class="btn-icon btn-danger trash-grid-btn" data-prep-id="${gridData.prep_id}" data-session-id="${session.session_id}" data-slot="${i}" title="Trash Grid">
                      <i class="fas fa-trash"></i>
                    </button>`
              }
            </td>
          </tr>
        `;
      }
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

  const expandIcons = document.querySelectorAll(".expandable-row-icon");
  expandIcons.forEach((icon) => {
    // Remove any existing event listeners by cloning the element
    const newIcon = icon.cloneNode(true);
    icon.parentNode.replaceChild(newIcon, icon);

    newIcon.addEventListener("click", function () {
      const sessionId = this.getAttribute("data-session-id");
      const content = document.getElementById(`details-${sessionId}`);
      const detailRow = this.closest("tr").nextElementSibling;

      this.classList.toggle("expanded");
      content.classList.toggle("expanded");
      detailRow.classList.toggle("visible");
      this.textContent = this.textContent === "▶" ? "▼" : "▶";
    });
  });

  // Set up grid modal event listeners once after all rows are created
  setupGridModalEventListeners();
}

export function updateUsersTable(users, showInactiveUsers = false) {
  const tableBody = document.getElementById("usersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!users || users.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
    return;
  }

  // Filter users based on checkbox state
  let filteredUsers;
  if (showInactiveUsers) {
    filteredUsers = users; // Show all users
  } else {
    filteredUsers = users.filter((user) => user.activeGridBoxes > 0); // Only show users with active grid boxes
  }

  if (filteredUsers.length === 0) {
    const message = showInactiveUsers
      ? "No users found"
      : "No active users found (check 'Show inactive users' to see all)";
    tableBody.innerHTML = `<tr><td colspan="4">${message}</td></tr>`;
    return;
  }

  filteredUsers.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.activeGridBoxes}</td>
      <td>${user.nextBoxName}</td>
      <td>
        <button class="btn-icon view-user-grids-btn" data-username="${user.username}" title="View User's Grids">
          <i class="fas fa-table"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

export function showUserGrids(username) {
  // Hide users table
  const usersSection = document.querySelector(
    "#databaseView .form-section:first-child"
  );
  if (usersSection) {
    usersSection.style.display = "none";
  }

  // Show grid database
  const gridDatabase = document.getElementById("grid-database");
  if (gridDatabase) {
    gridDatabase.style.display = "block";
  }

  // Fetch and display user's grids
  fetchUserGridData(username);
}

export function showUsersTable() {
  // Show users table
  const usersSection = document.querySelector(
    "#databaseView .form-section:first-child"
  );
  if (usersSection) {
    usersSection.style.display = "block";
  }

  // Hide grid database
  const gridDatabase = document.getElementById("grid-database");
  if (gridDatabase) {
    gridDatabase.style.display = "none";
  }

  // Clear grid database content
  const tableBody = document.getElementById("databaseTableBody");
  if (tableBody) {
    tableBody.innerHTML = "";
  }

  // Refresh users table if we have cached data, otherwise fetch it
  if (cachedUsersData) {
    refreshUsersTable();
  } else {
    fetchUsersData();
  }
}

function setupTrashEventListeners() {
  // Event listeners for trash buttons
  document.addEventListener("click", async function (event) {
    // Handle clicks on the button or its icon
    const button = event.target.closest(".trash-grid-btn");
    if (button) {
      const prepId = button.getAttribute("data-prep-id");
      const sessionId = button.getAttribute("data-session-id");
      const slot = button.getAttribute("data-slot");

      if (confirm(`Are you sure you want to trash the grid in slot ${slot}?`)) {
        await trashGrid(prepId, sessionId, slot);
      }
    }
  });

  // Event listeners for trash whole gridbox buttons
  document.addEventListener("click", async function (event) {
    // Handle clicks on the button or its icon
    const button = event.target.closest(".trash-gridbox-btn");
    if (button) {
      const sessionId = button.getAttribute("data-session-id");

      if (
        confirm(
          `Are you sure you want to trash ALL grids in this grid box? This will mark all used slots as trashed.`
        )
      ) {
        await trashWholeGridBox(sessionId);
      }
    }
  });

  // Event listeners for untrash buttons
  document.addEventListener("click", async function (event) {
    // Handle clicks on the button or its icon
    const button = event.target.closest(".untrash-grid-btn");
    if (button) {
      const prepId = button.getAttribute("data-prep-id");
      const sessionId = button.getAttribute("data-session-id");
      const slot = button.getAttribute("data-slot");

      if (
        confirm(`Are you sure you want to restore the grid in slot ${slot}?`)
      ) {
        await untrashGrid(prepId, sessionId, slot);
      }
    }
  });

  // Event listeners for add grid buttons
  document.addEventListener("click", async function (event) {
    // Handle clicks on the button or its icon
    const button = event.target.closest(".add-grid-btn");
    if (button) {
      const sessionId = button.getAttribute("data-session-id");
      const slot = button.getAttribute("data-slot");

      if (confirm(`Are you sure you want to add a new grid to slot ${slot}?`)) {
        await addNewGrid(sessionId, slot);
      }
    }
  });
}

async function trashGrid(prepId, sessionId, slot) {
  try {
    const response = await fetch(`/api/grid-preparations/${prepId}/trash`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to trash grid: ${response.status}`);
    }

    const result = await response.json();
    showAlert(`Grid in slot ${slot} has been trashed`, "success");

    // Refresh the view to show updated status
    refreshCurrentView();
  } catch (error) {
    console.error("Error trashing grid:", error);
    showAlert(`Error trashing grid: ${error.message}`, "error");
  }
}

async function untrashGrid(prepId, sessionId, slot) {
  try {
    const response = await fetch(`/api/grid-preparations/${prepId}/untrash`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to restore grid: ${response.status}`);
    }

    const result = await response.json();
    showAlert(`Grid in slot ${slot} has been restored`, "success");

    // Refresh the view to show updated status
    refreshCurrentView();
  } catch (error) {
    console.error("Error restoring grid:", error);
    showAlert(`Error restoring grid: ${error.message}`, "error");
  }
}

async function trashWholeGridBox(sessionId) {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/trash-all-grids`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to trash grid box: ${response.status}`);
    }

    const result = await response.json();
    showAlert(
      `All grids in grid box have been trashed (${result.affectedRows} grids affected)`,
      "success"
    );

    // Refresh the view to show updated status
    refreshCurrentView();
  } catch (error) {
    console.error("Error trashing grid box:", error);
    showAlert(`Error trashing grid box: ${error.message}`, "error");
  }
}

async function addNewGrid(sessionId, slot) {
  try {
    const response = await fetch(
      `/api/sessions/${sessionId}/grid-preparations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slot_number: slot,
          include_in_session: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add grid: ${response.status}`);
    }

    const result = await response.json();
    showAlert(`New grid added to slot ${slot}`, "success");

    // Refresh the view to show updated status
    refreshCurrentView();
  } catch (error) {
    console.error("Error adding grid:", error);
    showAlert(`Error adding grid: ${error.message}`, "error");
  }
}

function refreshCurrentView() {
  // Check if we're viewing a specific user's grids or all grids
  const gridDatabase = document.getElementById("grid-database");
  if (gridDatabase && gridDatabase.style.display !== "none") {
    const titleElement = gridDatabase.querySelector(".section-title");
    if (titleElement && titleElement.textContent.includes(" - ")) {
      // We're viewing a specific user's grids
      const username = titleElement.textContent.split(" - ")[1];
      fetchUserGridData(username);
    } else {
      // We're viewing all grids
      fetchGridData();
    }
  }
}
