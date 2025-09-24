// Microscope Grid Details Modal Component
// This file handles the microscope grid details modal functionality

import { showAlert } from "./alertSystem.js";
import { renderStarRating } from "../utils/starRating.js";

/**
 * Show microscope grid details modal
 * @param {string} sessionId - The microscope session ID
 * @param {string} gridIdentifier - The grid identifier
 * @param {string} microscopeSlot - The microscope slot number
 */
export function showMicroscopeGridModal(
  sessionId,
  gridIdentifier,
  microscopeSlot
) {
  const modal = document.getElementById("microscopeGridModal");
  const modalContent = document.getElementById("microscopeGridModalContent");

  if (!modal || !modalContent) {
    console.error("Microscope grid modal elements not found");
    return;
  }

  // Show loading state
  modalContent.innerHTML = `
    <div class="microscope-grid-modal">
      <h2 class="modal-title">Loading grid details...</h2>
      <div style="text-align: center; padding: 40px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #609BBF;"></i>
      </div>
    </div>
  `;
  modal.style.display = "block";

  // Fetch detailed data from microscope session endpoint
  fetchMicroscopeGridDetails(
    sessionId,
    gridIdentifier,
    microscopeSlot,
    modalContent
  );
}

/**
 * Fetch grid details from microscope session endpoint
 * @param {string} sessionId - The microscope session ID
 * @param {string} gridIdentifier - The grid identifier
 * @param {string} microscopeSlot - The microscope slot number
 * @param {HTMLElement} modalContent - The modal content element
 */
async function fetchMicroscopeGridDetails(
  sessionId,
  gridIdentifier,
  microscopeSlot,
  modalContent
) {
  try {
    const response = await fetch(`/api/microscope-sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch microscope session: ${response.status}`);
    }

    const sessionData = await response.json();

    // Find the specific grid in the session details
    const gridData = sessionData.details?.find(
      (detail) =>
        detail.grid_identifier === gridIdentifier &&
        detail.microscope_slot == microscopeSlot
    );

    if (!gridData) {
      throw new Error(
        `Grid ${gridIdentifier} not found in microscope session ${sessionId}`
      );
    }

    // Render the modal with the fetched data
    renderModalContent(gridData, sessionData, modalContent);
  } catch (error) {
    console.error("Error fetching microscope grid details:", error);
    modalContent.innerHTML = `
      <div class="microscope-grid-modal">
        <h2 class="modal-title">Error Loading Grid Details</h2>
        <div style="text-align: center; padding: 40px;">
          <p style="color: #dc3545;">${error.message}</p>
          <button class="btn btn-secondary" onclick="document.getElementById('microscopeGridModal').style.display='none'">Close</button>
        </div>
      </div>
    `;
    showAlert("Error loading grid details", "error");
  }
}

/**
 * Render the modal content with grid and session data
 * @param {Object} gridData - The grid data object
 * @param {Object} sessionData - The session data object
 * @param {HTMLElement} modalContent - The modal content element
 */
function renderModalContent(gridData, sessionData, modalContent) {
  // Build the modal content
  modalContent.innerHTML = `
    <div class="microscope-grid-modal">
      <h2 class="modal-title">Microscope session details for grid '${
        gridData.grid_identifier || "Unknown"
      }'</h2>
      
      <div class="grid-detail-sections">
        <!-- Microscope Details Section -->
        <div class="grid-detail-section">
          <h3>Microscope Details</h3>
          <div class="detail-row">
            <label>Microscope:</label>
            <span>${sessionData.microscope || "N/A"}</span>
          </div>
          <div class="detail-row">
            <label>Date:</label>
            <span>${sessionData.date || "N/A"}</span>
          </div>
          <div class="detail-row">
            <label>Microscope Slot:</label>
            <span>${gridData.microscope_slot || "N/A"}</span>
          </div>
          <div class="detail-row">
            <label>Sample:</label>
            <span>${gridData.sample_name || "N/A"}</span>
          </div>
        </div>

        <!-- Quality Ratings Section -->
        <div class="grid-detail-section">
          <h3>Quality Ratings</h3>
          <div class="detail-row">
            <label>Rescued:</label>
            <span>${
              gridData.rescued == 1
                ? "Yes"
                : gridData.rescued == 0
                ? "No"
                : "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <label>Ice Quality:</label>
            <span class="star-rating-display">${renderStarRating(
              gridData.ice_quality
            )}</span>
          </div>
          <div class="detail-row">
            <label>Particle Concentration:</label>
            <span class="star-rating-display">${renderStarRating(
              gridData.particle_number
            )}</span>
          </div>
          <div class="detail-row">
            <label>Grid Quality:</label>
            <span class="star-rating-display">${renderStarRating(
              gridData.grid_quality
            )}</span>
          </div>
        </div>

        <!-- Screening Information Section -->
        <div class="grid-detail-section">
          <h3>Screening Information</h3>
          <div class="detail-row">
            <label>Atlas:</label>
            <span>${
              gridData.atlas == 1 ? "Yes" : gridData.atlas == 0 ? "No" : "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <label>Screened:</label>
            <span>${
              gridData.screened === "no"
                ? "No"
                : gridData.screened === "manually"
                ? "Manually"
                : gridData.screened === "automatically"
                ? "Automatically"
                : gridData.screened || "N/A"
            }</span>
          </div>
          <div class="detail-row comments-row">
            <label>Comments:</label>
            <div class="comments-content">
              ${
                gridData.comments
                  ? `<p>${gridData.comments}</p>`
                  : "<p class='text-muted'>No comments</p>"
              }
            </div>
          </div>
        </div>

        <!-- Collection Information Section -->
        <div class="grid-detail-section">
          <h3>Collection Information</h3>
          ${
            gridData.collected == 0
              ? `<div class="detail-row">
                   <div style="text-align: center; padding: 20px; color: #6c757d; font-style: italic;">
                     No data collected
                   </div>
                 </div>`
              : gridData.collected == 1
              ? `<div class="detail-row">
                   <label>Number of Images:</label>
                   <span>${gridData.images ?? "N/A"}</span>
                 </div>
                 <div class="detail-row">
                   <label>Pixel Size (Å):</label>
                   <span>${gridData.px_size ?? "N/A"}</span>
                 </div>
                 <div class="detail-row">
                   <label>Magnification:</label>
                   <span>${
                     gridData.magnification
                       ? gridData.magnification.toLocaleString()
                       : "N/A"
                   }</span>
                 </div>
                 <div class="detail-row">
                   <label>Exposure (e⁻/Å²):</label>
                   <span>${gridData.exposure_e ?? "N/A"}</span>
                 </div>
                 <div class="detail-row">
                   <label>Nominal Defocus:</label>
                   <span>${gridData.nominal_defocus ?? "N/A"}</span>
                 </div>
                 <div class="detail-row">
                   <label>Objective:</label>
                   <span>${gridData.objective ?? "N/A"}</span>
                 </div>
                 <div class="detail-row">
                   <label>Slit Width (eV):</label>
                   <span>${gridData.slit_width ?? "N/A"}</span>
                 </div>`
              : `<div class="detail-row">
                   <label>Collection Status:</label>
                   <span>Unknown</span>
                 </div>`
          }
        </div>

        <!-- Images Section (placeholder for future expansion) -->
        <div class="grid-detail-section">
          <h3>Images</h3>
          <div class="detail-row">
            <div class="images-placeholder">
              <p class="text-muted">Image gallery will be added here in the future</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners for the microscope grid modal
 */
export function setupMicroscopeGridModal() {
  const modal = document.getElementById("microscopeGridModal");

  if (!modal) {
    console.error("Microscope grid modal not found");
    return;
  }

  // Close modal when clicking the X button
  const closeButton = modal.querySelector(".close-modal");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // Close modal when clicking outside of it
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "block") {
      modal.style.display = "none";
    }
  });
}
