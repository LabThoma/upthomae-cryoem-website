// This file manages the alert system for displaying messages to the user.
// It exports a function showAlert that creates and displays alert messages.

export function showAlert(message, type = "success", autoDismiss = true) {
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

      // Add close button for non-dismissible alerts
      if (!autoDismiss) {
        alert.innerHTML = `
          <span>${message}</span>
          <button class="alert-close-btn" onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: inherit; font-weight: bold; cursor: pointer;">&times;</button>
        `;
      }

      container.appendChild(alert);

      // Only auto-dismiss if autoDismiss is true
      if (autoDismiss) {
        setTimeout(() => alert.remove(), 5000);
      }
    }
  });
}

// Modal-specific alert function that shows alerts within a specific container
export function showModalAlert(
  message,
  type = "success",
  autoDismiss = true,
  containerId = "modalAlertContainer"
) {
  const modalContainer = document.getElementById(containerId);

  if (!modalContainer) {
    // Fallback to global alert system if modal container not found
    showAlert(message, type, autoDismiss);
    return;
  }

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;

  // Add special styling for auto-save messages
  if (type === "info" && message.includes("Auto-sav")) {
    alert.classList.add("alert-auto-save");
  }

  // Add close button for non-dismissible alerts or set text content
  if (!autoDismiss) {
    alert.innerHTML = `
      <span>${message}</span>
      <button class="alert-close-btn" onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: inherit; font-weight: bold; cursor: pointer; float: right;">&times;</button>
    `;
  } else {
    alert.textContent = message;
  }

  modalContainer.appendChild(alert);

  // Only auto-dismiss if autoDismiss is true
  if (autoDismiss) {
    // Auto-save messages disappear faster (3 seconds instead of 5)
    const timeout = alert.classList.contains("alert-auto-save") ? 3000 : 5000;
    setTimeout(() => alert.remove(), timeout);
  }
}
