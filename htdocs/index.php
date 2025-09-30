<?php
// Load Composer autoloader and authentication
require_once('vendor/autoload.php');
require_once('entra/auth_check.php');

// Require authentication for this page
requireAuth();

// Get user information
$userInfo = getUserInfo();
$userName = getUserName();
$userEmail = getUserEmail();
$userSciper = getUserSciper();
$userGroups = getUserGroups();

// Page variables
$pageTitle = "THOMAE cryoEM";
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo htmlspecialchars($pageTitle); ?></title>
    <link rel="stylesheet" href="styles/main.css" />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css"
    />
    <link rel="icon" href="data:," />
  </head>
  <body>
    <div class="container">
      <!-- Header Component -->
      <div id="header"></div>

      <!-- Alert Container -->
      <div id="alertContainer"></div>

      <div class="content">
        <!-- Input Form View -->
        <div id="inputFormView" class="content-view">
          <!-- Session Information Component -->
          <div id="session-info" class="form-section"></div>

          <!-- Sample Information Component -->
          <div id="sample-info" class="form-section"></div>

          <!-- Grid Information Component -->
          <div id="grid-info" class="form-section"></div>

          <!-- Vitrobot Settings Component -->
          <div id="vitrobot-settings" class="form-section"></div>

          <!-- Grid Details Component -->
          <div id="grid-details" class="form-section"></div>

          <!-- Buttons for Saving and Updating -->
          <div class="button-group">
            <button id="saveUpdateButton" class="btn btn-primary">
              Save & Update
            </button>
            <button id="nextBoxButton" class="btn btn-secondary">
              Next Box
            </button>
            <button id="clearFormButton" class="btn btn-danger">
              Clear Form
            </button>
          </div>

          <!-- Bottom Alert Container for Input Form -->
          <div id="alertContainerBottom"></div>
        </div>

        <!-- Database View -->
        <div id="databaseView" class="content-view">
          <!-- Users Table -->
          <div class="form-section">
            <h2 class="section-title">Users</h2>
            <div class="checkbox-group" style="margin-bottom: 15px">
              <input type="checkbox" id="showInactiveUsers" />
              <label for="showInactiveUsers">Show inactive users</label>
            </div>
            <div style="overflow-x: auto">
              <table class="grid-table" id="usersTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Active Grid Boxes</th>
                    <th>Next Box Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- Grid Database Component -->
          <div
            id="grid-database"
            class="form-section"
            style="display: none"
          ></div>

          <div class="button-group" style="display: none">
            <button id="viewAllButton" class="btn btn-secondary">
              Back to Users
            </button>
          </div>
        </div>

        <!-- Microscope View -->
        <div id="microscopeView" class="content-view">
          <div class="form-section">
            <h2 class="section-title">Users</h2>
            <div style="overflow-x: auto">
              <table class="grid-table" id="microscopeUsersTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Last Session</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="microscopeUsersTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Blog View -->
        <div id="blogView" class="content-view">
          <!-- Blog content will be dynamically loaded by blogView.js -->
        </div>

        <!-- Admin View -->
        <div id="adminView" class="content-view">
          <div id="adminPasswordPrompt" class="form-section">
            <h2 class="section-title">Admin Access</h2>
            <div class="form-row">
              <label for="adminPassword">Password:</label>
              <input
                type="password"
                id="adminPassword"
                placeholder="Enter password"
              />
              <button id="adminLoginButton" class="btn btn-primary">
                Login
              </button>
            </div>
            <div
              id="adminLoginError"
              style="color: red; margin-top: 10px; display: none"
            ></div>
          </div>

          <div id="adminContent" class="form-section" style="display: none">
            <h2 class="section-title">Admin Panel</h2>

            <div class="admin-actions">
              <!-- Grid Summary Section -->
              <div class="admin-section">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                  "
                >
                  <h3 style="margin: 0">Grid Type Summary</h3>
                  <button id="addNewGridsButton" class="btn btn-primary">
                    Add New Grids
                  </button>
                </div>
                <div class="grid-summary-container">
                  <table class="grid-table" id="gridSummaryTable">
                    <thead>
                      <tr>
                        <th>Grid Type</th>
                        <th>Unused Grids</th>
                        <th>Used (Last 3 Months)</th>
                      </tr>
                    </thead>
                    <tbody id="gridSummaryTableBody">
                      <!-- Summary rows will be populated here -->
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Microscope Sessions Section -->
              <div class="admin-section">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                  "
                >
                  <h3 style="margin: 0">Microscope Sessions</h3>
                  <button id="openMicroscopeSessionBtn" class="btn btn-primary">
                    New Microscope Session
                  </button>
                </div>
                <div class="microscope-sessions-container">
                  <table class="grid-table" id="microscopeSessionsTable">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Microscope</th>
                        <th>Users</th>
                        <th>Number of Grids</th>
                        <th>Overnight</th>
                        <th>Issues</th>
                      </tr>
                    </thead>
                    <tbody id="microscopeSessionsTableBody">
                      <!-- Session rows will be populated here -->
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="admin-section">
                <h3>System Actions</h3>
                <p>Administrative functions</p>
                <button id="adminLogoutButton" class="btn btn-danger">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Grid Details -->
    <div id="gridModal" class="modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div id="gridModalContent"></div>
      </div>
    </div>

    <!-- Modal for Microscope Sessions -->
    <div id="microscopeSessionModal" class="modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div id="microscopeSessionModalContent"></div>
      </div>
    </div>

    <!-- Modal for Microscope Grid Details -->
    <div id="microscopeGridModal" class="modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div id="microscopeGridModalContent"></div>
      </div>
    </div>

    
    <!-- Load main script as a module -->
    <script type="module" src="scripts/main.js"></script>
  </body>
</html>
