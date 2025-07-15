// This file manages the alert system for displaying messages to the user.
// It exports a function showAlert that creates and displays alert messages.

export function showAlert(message, type = "success") {
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
