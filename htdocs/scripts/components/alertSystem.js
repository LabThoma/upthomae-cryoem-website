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
