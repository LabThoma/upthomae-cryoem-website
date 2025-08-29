// This file manages the display of the microscope tab, including rendering a user table.

// Structure and naming follows databaseView.js for consistency.

let isMicroscopeTabInitialized = false;

export function setupMicroscopeTab() {
  if (isMicroscopeTabInitialized) {
    return;
  }
  renderMicroscopeUserTable();
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
          <button class="btn-icon" title="View User Details">
            <i class="fas fa-user"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    if (users.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='3'>No users found</td></tr>";
    }
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan='3'>Error: ${err.message}</td></tr>`;
  }
}
