// This file manages the display of the database view, including fetching and rendering session data.

export async function fetchGridData() {
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

export function updateDatabaseTable(sessions) {
  const tableBody = document.getElementById("databaseTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No sessions found</td></tr>';
    return;
  }

  sessions.forEach((session) => {
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

    for (let i = 1; i <= 4; i++) {
      const gridData = grids.find((g) => parseInt(g.slot_number) === i) || {};

      const blotTime = gridData.blot_time_override || "N/A";
      const blotForce = gridData.blot_force_override || "N/A";
      const volume = gridData.volume_ul_override || "N/A";
      const additives = gridData.additives_override || "N/A";
      const gridType = gridData.grid_type || "N/A";

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
            <button class="btn-small view-grid-btn" data-session-id="${
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
