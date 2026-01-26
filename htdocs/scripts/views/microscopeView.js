// This file manages the display of the microscope tab, including rendering a user table.

// Structure and naming follows databaseView.js for consistency.

import { renderStarRating } from "../utils/starRating.js";
import {
  showMicroscopeGridModal,
  setupMicroscopeGridModal,
} from "../components/microscopeGridModal.js";
import { showAlert } from "../components/alertSystem.js";

let isMicroscopeTabInitialized = false;

export function setupMicroscopeTab() {
  if (isMicroscopeTabInitialized) {
    return;
  }
  renderMicroscopeUserTable();
  setupMicroscopeGridModal();
  isMicroscopeTabInitialized = true;
}

async function renderMicroscopeUserTable() {
  const tableBody = document.getElementById("microscopeUsersTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

  try {
    const response = await fetch("/api/users");
    if (!response.ok) throw new Error("Failed to fetch users");
    const users = await response.json();
    tableBody.innerHTML = "";

    users.forEach((user) => {
      let microscopeSessionDisplay;
      if (user.hasMicroscopeSession && user.lastMicroscopeSessionDate) {
        microscopeSessionDisplay = user.lastMicroscopeSessionDate;
      } else {
        microscopeSessionDisplay = "No microscope sessions found";
      }
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${microscopeSessionDisplay}</td>
        <td>
          <button class="btn-icon view-user-microscope-btn" data-username="${user.username}" title="View User's Microscope Sessions">
            <i class="fas fa-microscope"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    // Show user's microscope sessions table and populate with API data
    async function showUserMicroscopeSessions(username) {
      // Hide users table
      const usersSection = document.querySelector(
        "#microscopeView .form-section",
      );
      if (usersSection) {
        usersSection.style.display = "none";
      }

      // Show microscope sessions table
      let sessionsSection = document.getElementById(
        "microscopeSessionsSection",
      );
      if (!sessionsSection) {
        sessionsSection = document.createElement("div");
        sessionsSection.id = "microscopeSessionsSection";
        sessionsSection.className = "form-section";
        sessionsSection.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
        <h2 class="section-title microscope-sessions-title" style="margin: 0;">Microscope Sessions for ${username}</h2>
        <button id="backToMicroscopeUsersButton" class="btn btn-secondary">Back to Users</button>
      </div>
      <div style="overflow-x: auto">
        <table class="grid-table" id="microscopeUserSessionsTable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Microscope</th>
              <th>Number of Grids</th>
              <th>Grid Boxes</th>
            </tr>
          </thead>
          <tbody id="microscopeUserSessionsTableBody">
            <tr><td colspan="4">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    `;
        document.getElementById("microscopeView").appendChild(sessionsSection);
      } else {
        // Update the title for the selected user
        const titleElement = sessionsSection.querySelector(
          ".microscope-sessions-title",
        );
        if (titleElement) {
          titleElement.textContent = `Microscope Sessions for ${username}`;
        }
      }
      sessionsSection.style.display = "block";

      // Fetch and populate microscope sessions
      const tableBody = document.getElementById(
        "microscopeUserSessionsTableBody",
      );
      if (!tableBody) return;
      tableBody.innerHTML = `<tr><td colspan='4'>Loading...</td></tr>`;
      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(username)}/microscope-sessions`,
        );
        if (!response.ok)
          throw new Error("Failed to fetch microscope sessions");
        const sessions = await response.json();
        tableBody.innerHTML = "";
        if (sessions.length === 0) {
          tableBody.innerHTML = `<tr><td colspan='4'>No microscope sessions found</td></tr>`;
        } else {
          sessions.forEach((session, idx) => {
            // Main session row
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>
                <span class="expandable-row-icon" data-session-idx="${idx}">▶</span>
                ${session.date || ""}
              </td>
              <td>${session.microscope || ""}</td>
              <td>${session.numberOfGrids ?? 0}</td>
              <td>${session.gridBoxes || ""}</td>
            `;
            tableBody.appendChild(row);

            // Details row (hidden by default)
            const detailRow = document.createElement("tr");
            detailRow.className = "expandable-row";
            const detailCell = document.createElement("td");
            detailCell.colSpan = 4;
            // Render grid rows from session.grids
            let gridRows = "";
            if (session.grids && session.grids.length > 0) {
              gridRows = session.grids
                .map(
                  (grid) => `
                <tr>
                  <td>${grid.grid_identifier || ""}</td>
                  <td class="sample-col">${grid.sample || ""}</td>
                  <td>${renderStarRating(grid.grid_quality)}</td>
                  <td>${renderStarRating(grid.ice_quality)}</td>
                  <td>${renderStarRating(grid.particle_concentration)}</td>
                  <td>${grid.number_of_images ?? ""}</td>
                  <td>${
                    grid.rescued == 1 ? "Yes" : grid.rescued == 0 ? "No" : ""
                  }</td>
                  <td>
                    <button class="btn-icon view-microscope-grid-btn" 
                            data-session-id="${session.id}" 
                            data-grid-identifier="${grid.grid_identifier}" 
                            data-microscope-slot="${grid.microscope_slot}"
                            title="View Grid Details">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              `,
                )
                .join("");
            } else {
              gridRows = `<tr><td colspan="8" style="text-align:center; color:#888;">No data</td></tr>`;
            }
            detailCell.innerHTML = `
              <div class="expandable-content" id="microscope-details-${idx}">
                <h4 class="detail-subtitle">Grid Details</h4>
                <div class="grid-detail-container">
                  <table class="grid-detail-table">
                    <thead>
                      <tr>
                        <th>Grid Name</th>
                        <th class="sample-col">Sample</th>
                        <th>Grid Quality</th>
                        <th>Ice Quality</th>
                        <th>Particle Concentration</th>
                        <th>Number of Images</th>
                        <th>Rescued</th>
                        <th>Actions</th>
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
            tableBody.appendChild(detailRow);

            // Toggle logic for details row and content
            row
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
      } catch (err) {
        tableBody.innerHTML = `<tr><td colspan='4'>Error: ${err.message}</td></tr>`;
      }
    }

    // Event delegation for microscope view buttons
    document.addEventListener("click", function (event) {
      const button = event.target.closest(".view-user-microscope-btn");
      if (button) {
        const username = button.getAttribute("data-username");
        showUserMicroscopeSessions(username);
      }

      // Handle grid details modal buttons
      const gridButton = event.target.closest(".view-microscope-grid-btn");
      if (gridButton) {
        const sessionId = gridButton.getAttribute("data-session-id");
        const gridIdentifier = gridButton.getAttribute("data-grid-identifier");
        const microscopeSlot = gridButton.getAttribute("data-microscope-slot");
        showMicroscopeGridModal(sessionId, gridIdentifier, microscopeSlot);
      }

      if (event.target.id === "backToMicroscopeUsersButton") {
        // Hide sessions section and show users table again
        const sessionsSection = document.getElementById(
          "microscopeSessionsSection",
        );
        if (sessionsSection) {
          sessionsSection.style.display = "none";
        }
        const usersSection = document.querySelector(
          "#microscopeView .form-section",
        );
        if (usersSection) {
          usersSection.style.display = "block";
        }
      }
    });
    if (users.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='3'>No users found</td></tr>";
    }
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan='3'>Error: ${err.message}</td></tr>`;
  }
}
