// This file serves as the entry point for the application. It initializes the page, sets up event listeners, and handles the main application logic.

// Import utilities
import * as domUtils from "./utils/domUtils.js";
import * as formUtils from "./utils/formUtils.js";
import * as dateUtils from "./utils/dateUtils.js";

// Import API services
import * as sessionApi from "./api/sessionApi.js";
import * as userApi from "./api/userApi.js";

// Import components
import * as componentLoader from "./components/componentLoader.js";
import * as alertSystem from "./components/alertSystem.js";
import * as gridTable from "./components/gridTable.js";
import * as gridModal from "./components/gridModal.js";

// Import views
import { setupFormView, setDefaultDate } from "./views/formView.js";
import * as databaseView from "./views/databaseView.js";

// Import controllers
import * as userController from "./controllers/userController.js";
import * as gridController from "./controllers/gridController.js";
import * as sessionController from "./controllers/sessionController.js";

// Import tabs functionality
import { setupTabs } from "./components/tabs.js";

document.addEventListener("DOMContentLoaded", () => {
  initializePage();
});

function initializePage() {
  // First load all components
  componentLoader.loadComponents(() => {
    // Then set up tabs functionality
    setupTabs();

    // Set up views
    setupFormView();
    databaseView.setupDatabaseView();

    // Additional setup
    setupEventListeners();
  });
}

function setupEventListeners() {
  // Set up real-time validation
  formUtils.setupRealTimeValidation();

  // Event listeners for the Input Form view
  const saveUpdateButton = document.getElementById("saveUpdateButton");
  if (saveUpdateButton) {
    saveUpdateButton.addEventListener("click", sessionController.saveUpdate);
  }

  const clearFormButton = document.getElementById("clearFormButton");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", formUtils.clearFormFields);
  }
}

// document.addEventListener("DOMContentLoaded", () => {
//   initializePage();
// });

// // Initialize the page and set up event listeners
// function initializePage() {
//   loadComponents(() => {
//     setupEventListeners();
//   });
// }

// // Set the default date to today
// function setDefaultDate() {
//   const sessionDateElement = document.getElementById("sessionDate");
//   if (sessionDateElement) {
//     sessionDateElement.value = new Date().toISOString().split("T")[0];
//   }
// }

// // Set up event listeners for various UI interactions
// function setupEventListeners() {
//   // Initialize grid table
//   setupGridTable();

//   const glowDischarge = document.getElementById("glowDischarge");
//   if (glowDischarge) {
//     glowDischarge.addEventListener("change", toggleGlowDischargeSettings);
//   }

//   const saveUpdateButton = document.getElementById("saveUpdateButton");
//   if (saveUpdateButton) {
//     saveUpdateButton.addEventListener("click", saveUpdate);
//   }

//   const viewUserButton = document.getElementById("viewUserButton");
//   if (viewUserButton) {
//     viewUserButton.addEventListener("click", () => viewUserData("Bob Smith"));
//   }

//   // These buttons are not currently used. Some need to be implemented.
//   const saveToGridListButton = document.getElementById("saveToGridListButton");
//   if (saveToGridListButton) {
//     saveToGridListButton.addEventListener("click", saveToGridList);
//   }

//   const viewDatabaseButton = document.getElementById("viewDatabaseButton");
//   if (viewDatabaseButton) {
//     viewDatabaseButton.addEventListener("click", viewGridDatabase);
//   }

//   const nextBoxButton = document.getElementById("nextBoxButton");
//   if (nextBoxButton) {
//     nextBoxButton.addEventListener("click", prepareNextBox);
//   }

//   const clearFormButton = document.getElementById("clearFormButton");
//   if (clearFormButton) {
//     clearFormButton.addEventListener("click", clearForm);
//   }
// }

// // Toggle visibility of glow discharge settings
// function toggleGlowDischargeSettings() {
//   const settings = document.getElementById("glowDischargeSettings");
//   if (settings) {
//     settings.style.display = this.checked ? "grid" : "none";
//   }
// }

// // Save and update grid data
// async function saveUpdate() {
//   const errors = validateForm();
//   if (errors.length > 0) {
//     errors.forEach((error) => showAlert(error, "error"));
//     return;
//   }

//   try {
//     // Extract session data
//     const sessionData = {
//       user_name: getElementValue("userName"),
//       date: getElementValue("sessionDate"),
//       grid_box_name: getElementValue("gridBoxName"),
//       loading_order: getElementValue("loadingOrder"),
//       puck_name: getElementValue("puckName"),
//       puck_position: getElementValue("puckPosition"),
//     };

//     console.log("Session Data:", sessionData);

//     // Extract sample information (add this section)
//     const sampleData = {
//       sample_name: getElementValue("sampleName"),
//       sample_concentration: getElementValue("sampleConcentration"),
//       additives: getElementValue("additives"),
//       default_volume_ul: getElementValue("volume"),
//     };

//     console.log("Sample Data:", sampleData);

//     // Extract vitrobot settings data
//     const vitrobotSettings = {
//       humidity_percent: getElementValue("humidity"),
//       temperature_c: getElementValue("temperature"),
//       blot_force: getElementValue("blotForce"),
//       blot_time_seconds: getElementValue("blotTime"),
//       wait_time_seconds: getElementValue("waitTime"),
//       glow_discharge_applied: getElementChecked("glowDischarge"),
//     };

//     // Extract grid information
//     const gridInfo = {
//       grid_type: getElementValue("gridType"),
//       grid_batch: getElementValue("gridBatch"),
//       glow_discharge_applied: getElementChecked("glowDischarge"),
//       glow_discharge_current: getElementValue("glowCurrent"),
//       glow_discharge_time: getElementValue("glowTime"),
//     };

//     console.log("Grid Info:", gridInfo);

//     console.log("Vitrobot Settings:", vitrobotSettings);

//     // Extract grid preparation data
//     const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
//     const gridPreparations = Array.from(checkedGrids).map((checkbox) => {
//       const row = checkbox.closest("tr");
//       return {
//         slot_number: row.getAttribute("data-slot"),
//         grid_id: parseInt(document.getElementById("gridType").value) || null,
//         sample_id: null, // We'll resolve this on the server
//         sample_name: sampleData.sample_name,
//         sample_concentration: sampleData.sample_concentration,
//         additives: sampleData.additives,
//         comments: getRowValue(row, ".grid-comments"),
//         volume_ul_override: getRowValue(row, ".grid-volume"),
//         blot_time_override: getRowValue(row, ".grid-blot-time"),
//         blot_force_override: getRowValue(row, ".grid-blot-force"),
//         grid_batch_override: getRowValue(row, ".grid-batch-override"),
//         additives_override: getRowValue(row, ".grid-additives"),
//         include_in_session: true,
//       };
//     });

//     console.log("Grid Preparations:", gridPreparations);

//     // Construct the request body
//     const requestBody = {
//       session: sessionData,
//       sample: sampleData,
//       vitrobot_settings: vitrobotSettings,
//       grid_info: gridInfo,
//       grids: gridPreparations,
//     };

//     console.log("Request Body:", requestBody);

//     // Send the request to the backend
//     const response = await fetch("http://localhost:3000/api/sessions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(requestBody),
//     });

//     const result = await response.json();

//     if (!response.ok) {
//       throw new Error(
//         result.message || result.error || "Failed to save session data"
//       );
//     }

//     console.log("Session saved successfully:", result);
//     showAlert("Data saved successfully!", "success");
//   } catch (error) {
//     console.error("Error saving data:", error);
//     showAlert(`Error saving data: ${error.message}`, "error");
//   }
// }

// // Helper function to safely get element value
// function getElementValue(id) {
//   const element = document.getElementById(id);
//   return element ? element.value : "";
// }

// // Helper function to safely get element checked state
// function getElementChecked(id) {
//   const element = document.getElementById(id);
//   return element ? element.checked : false;
// }

// // Helper function to safely get row value
// function getRowValue(row, selector) {
//   // Special case for slot numbers as they are fixed text
//   if (selector === ".grid-slot") {
//     return row.getAttribute("data-slot") || "";
//   }
//   const element = row.querySelector(selector);
//   return element ? element.value : "";
// }

// // Validate the form before saving - IMPROVED VERSION
// function validateForm() {
//   const errors = [];

//   // Check required fields that should exist
//   const requiredFields = [
//     { id: "userName", name: "User Name" },
//     { id: "sessionDate", name: "Session Date" },
//     { id: "gridBoxName", name: "Grid Box Name" },
//   ];

//   requiredFields.forEach((field) => {
//     const element = document.getElementById(field.id);
//     if (!element || !element.value.trim()) {
//       errors.push(`Please enter ${field.name}.`);
//     }
//   });

//   // Check if at least one grid is selected
//   const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
//   if (checkedGrids.length === 0) {
//     errors.push("Please select at least one grid.");
//   }

//   // Check glow discharge settings if enabled
//   const glowDischarge = document.getElementById("glowDischarge");
//   if (glowDischarge && glowDischarge.checked) {
//     const glowCurrent = document.getElementById("glowCurrent");
//     const glowTime = document.getElementById("glowTime");

//     if (!glowCurrent || !glowCurrent.value) {
//       errors.push("Please enter glow discharge current.");
//     }
//     if (!glowTime || !glowTime.value) {
//       errors.push("Please enter glow discharge time.");
//     }
//   }

//   return errors;
// }

// // Fetch grid data from the server and update the database table
// async function fetchGridData() {
//   try {
//     const response = await fetch("http://localhost:3000/api/sessions");
//     if (!response.ok) throw new Error("Failed to fetch grid data");

//     const sessions = await response.json();
//     updateDatabaseTable(sessions);
//   } catch (error) {
//     console.error(error);
//     showAlert("Error fetching grid data", "error");
//   }
// }

// // Update the grid database table with fetched data
// function updateDatabaseTable(sessions) {
//   const tableBody = document.getElementById("databaseTableBody");
//   if (!tableBody) return;

//   tableBody.innerHTML = "";

//   if (!sessions || sessions.length === 0) {
//     tableBody.innerHTML = '<tr><td colspan="6">No sessions found</td></tr>';
//     return;
//   }

//   sessions.forEach((session) => {
//     // Create main row
//     const row = document.createElement("tr");

//     // Format date correctly - handle case where it might be an object or string
//     let dateDisplay = "N/A";
//     if (session.date) {
//       try {
//         // First check if it's already a formatted string
//         if (
//           typeof session.date === "string" &&
//           session.date.match(/^\d{4}-\d{2}-\d{2}$/)
//         ) {
//           dateDisplay = session.date;
//           console.log("Using date string directly:", dateDisplay);
//         }
//         // Then try to convert from timestamp or date object
//         else if (session.date) {
//           console.log("Attempting to convert date:", session.date);
//           const dateObj = new Date(session.date);
//           console.log("Created date object:", dateObj);
//           if (!isNaN(dateObj.getTime())) {
//             // Check if it's a valid date
//             dateDisplay = dateObj.toISOString().split("T")[0];
//             console.log("Converted to ISO string:", dateDisplay);
//           }
//         }
//       } catch (e) {
//         console.warn("Invalid date format:", session.date, e);
//         dateDisplay = "Invalid date";
//       }
//     }

//     // Get sample name from the first grid preparation that has one
//     let sampleName = "N/A";

//     // Check for sample_names field first (from SQL GROUP_CONCAT)
//     if (session.sample_names) {
//       sampleName = session.sample_names;
//     }
//     // Fall back to other options if available
//     else if (
//       session.grid_preparations &&
//       session.grid_preparations.length > 0
//     ) {
//       const gridWithSample = session.grid_preparations.find(
//         (grid) => grid.sample_name
//       );
//       if (gridWithSample) {
//         sampleName = gridWithSample.sample_name;
//       }
//     }

//     row.innerHTML = `
//       <td>
//         <span class="expandable-row-icon" data-session-id="${
//           session.session_id
//         }">▶</span>
//         ${session.grid_box_name || "N/A"}
//       </td>
//       <td>${dateDisplay}</td>
//       <td>${sampleName}</td>
//     `;
//     tableBody.appendChild(row);

//     // Create expandable content row
//     const detailRow = document.createElement("tr");
//     detailRow.className = "expandable-row";

//     // Create a cell that spans all columns
//     const detailCell = document.createElement("td");
//     detailCell.colSpan = 3; // Span across all columns

//     // Create the grid detail table
//     let gridTableHTML = `
//       <div class="expandable-content" id="details-${session.session_id}">
//         <h4 class="detail-subtitle">Grid Details</h4>
//         <div class="grid-detail-container">
//           <table class="grid-detail-table">
//             <thead>
//               <tr>
//                 <th>Slot</th>
//                 <th>Grid Type</th>
//                 <th>Blot Time</th>
//                 <th>Blot Force</th>
//                 <th>Volume</th>
//                 <th>Additive</th>
//                 <th class="comments-col">Comments</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//     `;

//     // Generate 4 rows for the grids
//     // Check if session has grid_preparations data
//     const grids = session.grid_preparations || [];

//     // Generate rows for each slot (1-4)
//     for (let i = 1; i <= 4; i++) {
//       // Find the grid data for this slot if it exists
//       const gridData = session.grid_preparations
//         ? session.grid_preparations.find(
//             (g) => parseInt(g.slot_number) === i
//           ) || {}
//         : {};

//       // Enhanced debugging
//       console.log(
//         `Session ${session.session_id}, Slot ${i} - Complete grid data:`,
//         gridData
//       );

//       // Check specifically for grid_type_name
//       console.log(
//         `Grid type name available:`,
//         Boolean(gridData.grid_type_name)
//       );
//       console.log(`Grid type name value:`, gridData.grid_type_name);

//       // List all keys in the grid data object
//       console.log(`Available fields for grid:`, Object.keys(gridData));

//       // Get blot time, force, and volume from the right places
//       const blotTime =
//         gridData.blot_time_override ||
//         (session.settings ? session.settings.blot_time_seconds : null) ||
//         "N/A";

//       const blotForce =
//         gridData.blot_force_override ||
//         (session.settings ? session.settings.blot_force : null) ||
//         "N/A";

//       const volume =
//         gridData.volume_ul_override || gridData.default_volume_ul || "N/A";

//       const additives =
//         gridData.additives_override || gridData.additives || "N/A";

//       const gridType = gridData.grid_type || "N/A";

//       gridTableHTML += `
//     <tr>
//       <td>${i}</td>
//       <td>${gridType}</td>
//       <td>${blotTime}</td>
//       <td>${blotForce}</td>
//       <td>${volume}</td>
//       <td>${additives}</td>
//       <td class="comments-col">${gridData.comments || "No comments"}</td>
//       <td>
//          <button class="btn-small view-grid-btn" data-session-id="${
//            session.session_id
//          }" data-slot="${i}">View</button>
//       </td>
//     </tr>
//   `;
//     }

//     gridTableHTML += `
//             </tbody>
//           </table>
//         </div>
//       </div>
//     `;

//     detailCell.innerHTML = gridTableHTML;
//     detailRow.appendChild(detailCell);
//     tableBody.appendChild(detailRow);
//   });

//   // Add event listeners to the expandable row icons after the table is populated
//   const expandIcons = document.querySelectorAll(".expandable-row-icon");
//   expandIcons.forEach((icon) => {
//     icon.addEventListener("click", function () {
//       const sessionId = this.getAttribute("data-session-id");
//       const content = document.getElementById(`details-${sessionId}`);
//       const detailRow = this.closest("tr").nextElementSibling;

//       // Add debugging
//       console.log("Icon clicked for session:", sessionId);
//       console.log("Content element:", content);
//       console.log("Detail row:", detailRow);

//       // Toggle expanded class on the icon
//       this.classList.toggle("expanded");
//       console.log("Icon classes after toggle:", this.className);

//       // Toggle expanded class on the content
//       content.classList.toggle("expanded");
//       console.log("Content classes after toggle:", content.className);

//       // Toggle the visible class on the expandable-row
//       detailRow.classList.toggle("visible");
//       console.log("Detail row classes after toggle:", detailRow.className);

//       // Toggle the arrow icon
//       this.textContent = this.textContent === "▶" ? "▼" : "▶";
//     });
//   });

//   setupGridModalEventListeners();

//   function formatDate(dateValue) {
//     if (!dateValue) return "N/A";

//     try {
//       // Handle string format - most common case after our server fixes
//       if (typeof dateValue === "string") {
//         if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
//           return dateValue; // Already in YYYY-MM-DD format
//         } else if (dateValue.includes("T")) {
//           return dateValue.split("T")[0]; // ISO format with time
//         }
//       }

//       // Handle MariaDB date object
//       if (typeof dateValue === "object" && dateValue !== null) {
//         if ("year" in dateValue && "month" in dateValue && "day" in dateValue) {
//           return `${dateValue.year}-${String(dateValue.month).padStart(
//             2,
//             "0"
//           )}-${String(dateValue.day).padStart(2, "0")}`;
//         }
//       }

//       // Try standard Date constructor
//       const dateObj = new Date(dateValue);
//       if (!isNaN(dateObj.getTime())) {
//         return dateObj.toISOString().split("T")[0];
//       }

//       return String(dateValue);
//     } catch (e) {
//       console.warn("Error formatting date:", dateValue, e);
//       return "Invalid date";
//     }
//   }

//   // Show grid detail modal
//   function showGridModal(sessionId, slotNumber) {
//     // Find the session and grid data
//     fetch(`http://localhost:3000/api/sessions/${sessionId}`)
//       .then((response) => {
//         if (!response.ok)
//           throw new Error(`Failed to fetch session ${sessionId}`);
//         return response.json();
//       })
//       .then((sessionData) => {
//         // Find the specific grid data for this slot
//         const gridData =
//           sessionData.grids?.find(
//             (g) => parseInt(g.slot_number) === parseInt(slotNumber)
//           ) || {};

//         // Get the session and settings data with fallbacks
//         const session = sessionData.session || {};
//         const settings = sessionData.settings || {};
//         const grid_info = sessionData.grid_info || {};

//         // Populate the modal with all available data
//         const modalContent = document.getElementById("gridModalContent");

//         modalContent.innerHTML = `
//         <h2 class="grid-modal-title">Grid Details - ${
//           session.grid_box_name || "Unknown Box"
//         } (Slot ${slotNumber})</h2>

//         <div class="grid-detail-info">
//           <div class="grid-detail-section">
//             <h3>Session Information</h3>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">User:</div>
//               <div class="grid-detail-value">${session.user_name || "N/A"}</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Date:</div>
//               <div class="grid-detail-value">${formatDate(session.date)}</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Box Name:</div>
//               <div class="grid-detail-value">${
//                 session.grid_box_name || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Loading Order:</div>
//               <div class="grid-detail-value">${
//                 session.loading_order || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Puck Name:</div>
//               <div class="grid-detail-value">${session.puck_name || "N/A"}</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Puck Position:</div>
//               <div class="grid-detail-value">${
//                 session.puck_position || "N/A"
//               }</div>
//             </div>
//           </div>

//           <div class="grid-detail-section">
//             <h3>Sample Information</h3>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Sample Name:</div>
//               <div class="grid-detail-value">${
//                 gridData.sample_name || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Sample Concentration:</div>
//               <div class="grid-detail-value">${
//                 gridData.sample_concentration || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Sample Additives:</div>
//               <div class="grid-detail-value">${
//                 gridData.additives || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Volume (μL):</div>
//               <div class="grid-detail-value">${
//                 gridData.volume_ul_override ||
//                 gridData.default_volume_ul ||
//                 "N/A"
//               }</div>
//             </div>
//           </div>

//           <div class="grid-detail-section">
//         <h3>Grid Information</h3>
//         <div class="grid-detail-item">
//           <div class="grid-detail-label">Slot Number:</div>
//           <div class="grid-detail-value">${slotNumber}</div>
//         </div>
//         <div class="grid-detail-item">
//           <div class="grid-detail-label">Grid Type:</div>
//           <div class="grid-detail-value">${grid_info.grid_type || "N/A"}</div>
//         </div>
//         <div class="grid-detail-item">
//           <div class="grid-detail-label">Grid Batch:</div>
//           <div class="grid-detail-value">${grid_info.grid_batch || "N/A"}</div>
//         </div>
//         ${
//           gridData.grid_batch_override
//             ? `<div class="grid-detail-item">
//             <div class="grid-detail-label">Grid Batch Override:</div>
//             <div class="grid-detail-value">${gridData.grid_batch_override}</div>
//           </div>`
//             : ""
//         }
//         <div class="grid-detail-item">
//           <div class="grid-detail-label">Glow Discharge Applied:</div>
//           <div class="grid-detail-value">${
//             grid_info.glow_discharge_applied ? "Yes" : "No"
//           }</div>
//         </div>
//         <div class="grid-detail-item">
//           <div class="grid-detail-label">Glow Discharge Current:</div>
//           <div class="grid-detail-value">${
//             grid_info.glow_discharge_current || "N/A"
//           }</div>
//         </div>
//         <div class="grid-detail-item">
//           <div class="grid-detail-label">Glow Discharge Time:</div>
//           <div class="grid-detail-value">${
//             grid_info.glow_discharge_time || "N/A"
//           }</div>
//         </div>
//       </div>

//           <div class="grid-detail-section">
//             <h3>Vitrobot Settings</h3>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Humidity (%):</div>
//               <div class="grid-detail-value">${
//                 settings.humidity_percent || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Temperature (°C):</div>
//               <div class="grid-detail-value">${
//                 settings.temperature_c || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Blot Force:</div>
//               <div class="grid-detail-value">${
//                 gridData.blot_force_override || settings.blot_force || "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Blot Time:</div>
//               <div class="grid-detail-value">${
//                 gridData.blot_time_override ||
//                 settings.blot_time_seconds ||
//                 "N/A"
//               }</div>
//             </div>
//             <div class="grid-detail-item">
//               <div class="grid-detail-label">Wait Time:</div>
//               <div class="grid-detail-value">${
//                 settings.wait_time_seconds || "N/A"
//               }</div>
//             </div>
//           </div>
//         </div>

//         <div class="grid-detail-section">
//           <h3>Comments</h3>
//           <div class="grid-detail-value">${
//             gridData.comments || "No comments"
//           }</div>
//         </div>
//       `;

//         // Show the modal
//         document.getElementById("gridModal").style.display = "block";
//       })
//       .catch((error) => {
//         console.error("Error fetching grid details:", error);
//         showAlert(`Error fetching grid details: ${error.message}`, "error");
//       });
//   }

//   function setupGridModalEventListeners() {
//     // Add event listeners to the view buttons
//     const viewButtons = document.querySelectorAll(".view-grid-btn");
//     viewButtons.forEach((button) => {
//       button.addEventListener("click", function () {
//         const sessionId = this.getAttribute("data-session-id");
//         const slotNumber = this.getAttribute("data-slot");
//         showGridModal(sessionId, slotNumber);
//       });
//     });

//     // Add event listener to the close button
//     const closeModal = document.querySelector(".close-modal");
//     if (closeModal) {
//       closeModal.addEventListener("click", function () {
//         document.getElementById("gridModal").style.display = "none";
//       });
//     }

//     // Close modal when clicking outside the content
//     window.addEventListener("click", function (event) {
//       const modal = document.getElementById("gridModal");
//       if (event.target === modal) {
//         modal.style.display = "none";
//       }
//     });
//   }
// }

// // Show an alert message
// function showAlert(message, type = "success") {
//   const container = document.getElementById("alertContainer");
//   if (!container) {
//     console.log(`${type.toUpperCase()}: ${message}`);
//     return;
//   }

//   const alert = document.createElement("div");
//   alert.className = `alert alert-${type}`;
//   alert.textContent = message;

//   container.appendChild(alert);
//   setTimeout(() => alert.remove(), 5000);
// }

// // Load reusable components
// function loadComponents(callback) {
//   const components = [
//     { id: "header", filePath: "components/header.html" },
//     { id: "session-info", filePath: "components/session-info.html" },
//     { id: "sample-info", filePath: "components/sample-info.html" },
//     { id: "grid-info", filePath: "components/grid-info.html" },
//     { id: "vitrobot-settings", filePath: "components/vitrobot-settings.html" },
//     { id: "grid-details", filePath: "components/grid-details.html" },
//     { id: "grid-database", filePath: "components/grid-database.html" },
//   ];

//   let loadedCount = 0;

//   components.forEach(({ id, filePath }) => {
//     fetch(filePath)
//       .then((response) => {
//         if (!response.ok) throw new Error(`Failed to load ${filePath}`);
//         return response.text();
//       })
//       .then((html) => {
//         const element = document.getElementById(id);
//         if (element) {
//           element.innerHTML = html;
//         }

//         // Call setDefaultDate after session-info is loaded
//         if (id === "session-info") {
//           setDefaultDate();
//         }
//         loadedCount++;

//         // Call the callback after all components are loaded
//         if (
//           loadedCount === components.length &&
//           typeof callback === "function"
//         ) {
//           callback();
//         }
//       })
//       .catch((error) => console.error(error));
//   });
// }

// function setupGridTable() {
//   const tbody = document.querySelector(".grid-table tbody");
//   if (!tbody) return;

//   // Clear any existing rows
//   tbody.innerHTML = "";

//   // Generate 4 identical rows with different slot numbers
//   for (let i = 1; i <= 4; i++) {
//     const tr = document.createElement("tr");
//     tr.setAttribute("data-grid", i);
//     tr.setAttribute("data-slot", i);

//     tr.innerHTML = `
//       <td>${i}</td>
//       <td><input type="checkbox" class="grid-checkbox" /></td>
//       <td><input type="text" class="grid-comments" placeholder="Notes" /></td>
//       <td><input type="number" class="grid-volume" step="0.1" placeholder="Override" /></td>
//       <td><input type="number" class="grid-blot-time" placeholder="Override" /></td>
//       <td><input type="number" class="grid-blot-force" placeholder="Override" /></td>
//       <td><input type="text" class="grid-batch-override" placeholder="Override" /></td>
//     <td><input type="text" class="grid-additives" step="0.1" placeholder="Override" /></td>
//       `;

//     tbody.appendChild(tr);
//   }
// }

// // Placeholder functions for missing functionality
// function saveToGridList() {
//   showAlert("Save to Grid List functionality not implemented yet", "info");
// }

// function viewGridDatabase() {
//   fetchGridData();
// }

// function prepareNextBox() {
//   showAlert("Prepare Next Box functionality not implemented yet", "info");
// }

// function clearForm() {
//   // Clear form fields
//   const inputs = document.querySelectorAll(
//     'input[type="text"], input[type="number"], input[type="date"], textarea'
//   );
//   inputs.forEach((input) => (input.value = ""));

//   const checkboxes = document.querySelectorAll('input[type="checkbox"]');
//   checkboxes.forEach((checkbox) => (checkbox.checked = false));

//   const selects = document.querySelectorAll("select");
//   selects.forEach((select) => (select.selectedIndex = 0));

//   showAlert("Form cleared", "info");
// }

// function editSession(sessionId) {
//   showAlert(
//     `Edit session ${sessionId} functionality not implemented yet`,
//     "info"
//   );
// }

// function deleteSession(sessionId) {
//   if (confirm("Are you sure you want to delete this session?")) {
//     // Implement delete functionality
//     showAlert(
//       `Delete session ${sessionId} functionality not implemented yet`,
//       "info"
//     );
//   }
// }

// // Fetch and display grid data for a specific user
// async function viewUserData(userName) {
//   console.log(`Fetching data for user: ${userName}`);

//   // Make the grid database component visible
//   const gridDatabaseDiv = document.getElementById("grid-database");
//   if (gridDatabaseDiv) {
//     gridDatabaseDiv.style.display = "block";
//   }

//   // Also make the database view inside the component visible
//   const databaseView = document.getElementById("databaseView");
//   if (databaseView) {
//     databaseView.style.display = "block";
//   }

//   try {
//     // Rest of your existing code...
//     const encodedUsername = encodeURIComponent(userName);
//     const url = `http://localhost:3000/api/users/${encodedUsername}/sessions`;
//     console.log(`Sending request to: ${url}`);

//     const response = await fetch(url);
//     console.log(`Response status: ${response.status}`);

//     if (!response.ok)
//       throw new Error(`Failed to fetch data for user: ${userName}`);

//     const userSessions = await response.json();
//     console.log(
//       `Received ${userSessions.length} sessions for ${userName}:`,
//       userSessions
//     );

//     // Update the table with this user's sessions
//     updateDatabaseTable(userSessions);

//     // Show user-specific message
//     showAlert(`Displaying grid data for ${userName}`, "info");
//   } catch (error) {
//     console.error("Error in viewUserData:", error);
//     showAlert(`Error fetching data for ${userName}: ${error.message}`, "error");
//   }
// }
