// This file contains the logic for handling user-related operations.

// Import needed functions from other modules
import { updateDatabaseTable } from "../views/databaseView.js";
import { showAlert } from "../components/alertSystem.js";

export async function viewUserData(userName) {
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

  const encodedUsername = encodeURIComponent(userName);
  const url = `/api/users/${encodedUsername}/sessions`;
  console.log(`Sending request to: ${url}`);

  try {
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

export function editSession(sessionId) {
  showAlert(
    `Edit session ${sessionId} functionality not implemented yet`,
    "info"
  );
}
