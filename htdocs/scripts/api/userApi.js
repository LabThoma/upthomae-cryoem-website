// This file contains functions for interacting with user-related API endpoints.
// It exports functions like fetchUserData and updateUserData.

const API_BASE_URL = "/api/users";

export async function fetchUserData(userName) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${encodeURIComponent(userName)}/sessions`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data for user: ${userName}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

export async function updateUserData(userName, userData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${encodeURIComponent(userName)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to update data for user: ${userName}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
}
