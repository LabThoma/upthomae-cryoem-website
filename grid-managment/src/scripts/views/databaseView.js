// This file manages the display of the database view, including fetching and rendering session data.

// Import the showAlert function
import { showAlert } from "../components/alertSystem.js";
import { setupGridModalEventListeners } from "../components/gridModal.js";

export function setupDatabaseView() {
  setupDatabaseEventListeners();
  // Load users table on initial setup
  fetchUsersData();
}

function setupDatabaseEventListeners() {
  // Event delegation for dynamically created user view buttons
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('view-user-grids-btn')) {
      const username = event.target.getAttribute('data-username');
      showUserGrids(username);
    }
  });

  // Back to users button
  document.addEventListener('click', function(event) {
    if (event.target.id === 'backToUsersButton') {
      showUsersTable();
    }
  });
}

export async function fetchUserGridData(username) {
  try {
    console.log("Fetching data for user:", username);

    // Use the detailed user sessions endpoint with the username
    const response = await fetch(
      `http://localhost:3000/api/users/${username}/sessions`
    );

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
        tableBody.innerHTML = '<tr><td colspan="3">No sessions found for this user</td></tr>';
      }
    } else {
      updateDatabaseTable(sessions);
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
    const response = await fetch(
      "http://localhost:3000/api/users/all/sessions"
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const sessions = await response.json();
    console.log(`Received ${sessions.length} total sessions`);

    updateDatabaseTable(sessions);
    showAlert("Displaying all grids", "success");
  } catch (error) {
    console.error("Error fetching all grid data:", error);
    showAlert("Error fetching grid data", "error");
  }
}

export async function fetchUsersData() {
  try {
    // For now, we'll fetch all sessions and extract unique users
    // In the future, you might want a dedicated /api/users endpoint
    const response = await fetch("http://localhost:3000/api/users/all/sessions");
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users data: ${response.status}`);
    }

    const sessions = await response.json();
    
    // Extract unique users from sessions
    const usersMap = new Map();
    sessions.forEach(session => {
      const username = session.user_name;
      if (username && !usersMap.has(username)) {
        usersMap.set(username, {
          username: username,
          activeGridBoxes: 0, // Dummy value for now
          nextBoxName: `${username}_Box_Next`, // Dummy value for now
        });
      }
    });

    const users = Array.from(usersMap.values());
    updateUsersTable(users);
    showAlert(`Found ${users.length} users`, "info");
  } catch (error) {
    console.error("Error fetching users data:", error);
    showAlert(`Error fetching users: ${error.message}`, "error");
  }
}

export function updateDatabaseTable(sessions) {
  console.log("Sessions data structure:", JSON.stringify(sessions, null, 2));
  const tableBody = document.getElementById("databaseTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No sessions found</td></tr>';
    return;
  }

  sessions.forEach((session) => {
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

    row.innerHTML = `
      <td>
        <span class="expandable-row-icon" data-session-id="${
          session.session_id
        }">▶</span>
        ${session.grid_box_name || "N/A"}
      </td>
      <td>${dateDisplay}</td> 
      <td>${sampleName}</td> 
    `;
    tableBody.appendChild(row);

    const detailRow = document.createElement("tr");
    detailRow.className = "expandable-row";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 3;

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

    setupGridModalEventListeners();

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

      // Use session values as fallbacks if grid-specific values are missing
      const blotTime =
        gridData.blot_time_override ||
        gridData.blot_time ||
        gridData.blot_time_seconds ||
        sessionBlotTime ||
        "N/A";

      const blotForce =
        gridData.blot_force_override ||
        gridData.blot_force ||
        sessionBlotForce ||
        "N/A";

      const volume =
        gridData.volume_ul_override ||
        gridData.default_volume_ul ||
        sessionDefaultVolume ||
        "N/A";

      const additives =
        gridData.additives_override || gridData.additives || "N/A";

      const gridType =
        gridData.grid_type || gridData.type || sessionGridType || "N/A";

      gridTableHTML += `
        <tr>
          <td>${i}</td>
          <td>${gridType}</td>
          <td>${blotTime}</td>
          <td>${blotForce}</td>
          <td>${volume}</td>
          <td>${additives}</td>
          <td class="comments-col">${gridData.comments || "No comments"}</td>
          <td>
            <button class="btn btn-small view-grid-btn" data-session-id="${
              session.session_id
            }" data-slot="${i}">View</button>
          </td>
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

  const expandIcons = document.querySelectorAll(".expandable-row-icon");
  expandIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const sessionId = this.getAttribute("data-session-id");
      const content = document.getElementById(`details-${sessionId}`);
      const detailRow = this.closest("tr").nextElementSibling;

      this.classList.toggle("expanded");
      content.classList.toggle("expanded");
      detailRow.classList.toggle("visible");
      this.textContent = this.textContent === "▶" ? "▼" : "▶";
    });
  });
}

export function updateUsersTable(users) {
  const tableBody = document.getElementById("usersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!users || users.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.activeGridBoxes}</td>
      <td>${user.nextBoxName}</td>
      <td>
        <button class="btn btn-small view-user-grids-btn" data-username="${user.username}">
          View Grids
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

export function showUserGrids(username) {
  // Hide users table
  const usersSection = document.querySelector("#databaseView .form-section:first-child");
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
  const usersSection = document.querySelector("#databaseView .form-section:first-child");
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
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  try {
    if (typeof dateValue === "string") {
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      } else if (dateValue.includes("T")) {
        return dateValue.split("T")[0];
      }
    }

    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split("T")[0];
    }

    return String(dateValue);
  } catch (e) {
    console.warn("Error formatting date:", dateValue, e);
    return "Invalid date";
  }
}
