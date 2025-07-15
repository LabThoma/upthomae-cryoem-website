// filepath: /grid-management/grid-management/src/scripts/api/sessionApi.js

export async function createSession(requestBody) {
  const response = await fetch("http://localhost:3000/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(
      result.message || result.error || "Failed to create session"
    );
  }

  return await response.json();
}

export async function fetchSessions() {
  const response = await fetch("http://localhost:3000/api/sessions");

  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }

  return await response.json();
}

export async function deleteSession(sessionId) {
  const response = await fetch(
    `http://localhost:3000/api/sessions/${sessionId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const result = await response.json();
    throw new Error(
      result.message || result.error || "Failed to delete session"
    );
  }

  return await response.json();
}
