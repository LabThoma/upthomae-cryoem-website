// This file manages the alert system for displaying messages to the user.
// It exports a function showAlert that creates and displays alert messages.

export function showAlert(message, type = "success") {
  const containers = [
    document.getElementById("alertContainer"),
    document.getElementById("alertContainerBottom"),
  ];

  const hasContainer = containers.some((container) => container !== null);

  if (!hasContainer) {
    console.log(`${type.toUpperCase()}: ${message}`);
    return;
  }

  containers.forEach((container) => {
    if (container) {
      const alert = document.createElement("div");
      alert.className = `alert alert-${type}`;
      alert.textContent = message;

      container.appendChild(alert);
      setTimeout(() => alert.remove(), 5000);
    }
  });
}

// Modal-specific alert function that shows alerts within a specific container
export function showModalAlert(
  message,
  type = "success",
  containerId = "modalAlertContainer"
) {
  const modalContainer = document.getElementById(containerId);

  if (!modalContainer) {
    // Fallback to global alert system if modal container not found
    showAlert(message, type);
    return;
  }

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  modalContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}
