// This file manages the grid modal functionality, including displaying grid details.
// It exports functions like showGridModal and setupGridModalEventListeners.

import { showAlert } from "./alertSystem.js";

export function showGridModal(sessionId, slotNumber) {
  fetch(`http://localhost:3000/api/sessions/${sessionId}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch session ${sessionId}`);
      return response.json();
    })
    .then((sessionData) => {
      const gridData =
        sessionData.grids?.find(
          (g) => parseInt(g.slot_number) === parseInt(slotNumber)
        ) || {};

      const session = sessionData.session || {};
      const settings = sessionData.settings || {};
      const grid_info = sessionData.grid_info || {};

      const modalContent = document.getElementById("gridModalContent");

      modalContent.innerHTML = `
        <h2 class="grid-modal-title">Grid Details - ${
          session.grid_box_name || "Unknown Box"
        } (Slot ${slotNumber})</h2>
        
        <div class="grid-detail-info">
          <div class="grid-detail-section">
            <h3>Session Information</h3>
            <div class="grid-detail-item">
              <div class="grid-detail-label">User:</div>
              <div class="grid-detail-value">${session.user_name || "N/A"}</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Date:</div>
              <div class="grid-detail-value">${formatDate(session.date)}</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Box Name:</div>
              <div class="grid-detail-value">${
                session.grid_box_name || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Loading Order:</div>
              <div class="grid-detail-value">${
                session.loading_order || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Puck Name:</div>
              <div class="grid-detail-value">${session.puck_name || "N/A"}</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Puck Position:</div>
              <div class="grid-detail-value">${
                session.puck_position || "N/A"
              }</div>
            </div>
          </div>
          
          <div class="grid-detail-section">
            <h3>Sample Information</h3>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Sample Name:</div>
              <div class="grid-detail-value">${
                gridData.sample_name || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Sample Concentration:</div>
              <div class="grid-detail-value">${
                gridData.sample_concentration || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Sample Additives:</div>
              <div class="grid-detail-value">${
                gridData.additives || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Volume (μL):</div>
              <div class="grid-detail-value">${
                gridData.volume_ul_override ||
                gridData.default_volume_ul ||
                "N/A"
              }</div>
            </div>
          </div>
          
          <div class="grid-detail-section">
            <h3>Grid Information</h3>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Slot Number:</div>
              <div class="grid-detail-value">${slotNumber}</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Grid Type:</div>
              <div class="grid-detail-value">${
                grid_info.grid_type || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Grid Batch:</div>
              <div class="grid-detail-value">${
                grid_info.grid_batch || "N/A"
              }</div>
            </div>
            ${
              gridData.grid_batch_override
                ? `<div class="grid-detail-item">
                    <div class="grid-detail-label">Grid Batch Override:</div>
                    <div class="grid-detail-value">${gridData.grid_batch_override}</div>
                  </div>`
                : ""
            }
            <div class="grid-detail-item">
              <div class="grid-detail-label">Glow Discharge Applied:</div>
              <div class="grid-detail-value">${
                grid_info.glow_discharge_applied ? "Yes" : "No"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Glow Discharge Current:</div>
              <div class="grid-detail-value">${
                grid_info.glow_discharge_current || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Glow Discharge Time:</div>
              <div class="grid-detail-value">${
                grid_info.glow_discharge_time || "N/A"
              }</div>
            </div>
          </div>
          
          <div class="grid-detail-section">
            <h3>Vitrobot Settings</h3>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Humidity (%):</div>
              <div class="grid-detail-value">${
                settings.humidity_percent || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Temperature (°C):</div>
              <div class="grid-detail-value">${
                settings.temperature_c || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Blot Force:</div>
              <div class="grid-detail-value">${
                gridData.blot_force_override || settings.blot_force || "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Blot Time:</div>
              <div class="grid-detail-value">${
                gridData.blot_time_override ||
                settings.blot_time_seconds ||
                "N/A"
              }</div>
            </div>
            <div class="grid-detail-item">
              <div class="grid-detail-label">Wait Time:</div>
              <div class="grid-detail-value">${
                settings.wait_time_seconds || "N/A"
              }</div>
            </div>
          </div>
        </div>
        
        <div class="grid-detail-section">
          <h3>Comments</h3>
          <div class="grid-detail-value">${
            gridData.comments || "No comments"
          }</div>
        </div>
      `;

      document.getElementById("gridModal").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching grid details:", error);
      showAlert(`Error fetching grid details: ${error.message}`, "error");
    });
}

// Flag to prevent multiple modal event listener setup
let isGridModalInitialized = false;

export function setupGridModalEventListeners() {
  // Prevent setting up listeners multiple times
  if (isGridModalInitialized) {
    return;
  }

  // Use event delegation instead of attaching to individual buttons
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("view-grid-btn")) {
      const sessionId = event.target.getAttribute("data-session-id");
      const slotNumber = event.target.getAttribute("data-slot");
      showGridModal(sessionId, slotNumber);
    }
  });

  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", function () {
      document.getElementById("gridModal").style.display = "none";
    });
  }

  window.addEventListener("click", function (event) {
    const modal = document.getElementById("gridModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  isGridModalInitialized = true;
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
