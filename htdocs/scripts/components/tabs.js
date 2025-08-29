// This file handles the tab navigation functionality

import { setupDatabaseView } from "../views/databaseView.js";
import { setupAdminView } from "../views/adminView.js";
import { setupMicroscopeTab } from "../views/microscopeView.js";

const ADMIN_PASSWORD = "NoGlycerol!";
let isAdminAuthenticated = false;

export function setupTabs() {
  // Get all tab elements
  const tabs = document.querySelectorAll(".nav-tab");

  // Add click event listeners to each tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetView = tab.getAttribute("data-target");

      // Handle admin tab differently
      if (targetView === "adminView" && !isAdminAuthenticated) {
        // Show password prompt but don't switch tab visually until authenticated
        switchToView(targetView);
        showAdminPasswordPrompt();
        return;
      }

      // Remove active class from all tabs and views
      document.querySelectorAll(".nav-tab").forEach((t) => {
        t.classList.remove("active");
      });

      document.querySelectorAll(".content-view").forEach((view) => {
        view.classList.remove("active");
      });

      // Add active class to clicked tab and its target view
      tab.classList.add("active");
      const viewElement = document.getElementById(targetView);
      viewElement.classList.add("active");

      // Initialize views when they become active
      if (targetView === "databaseView") {
        setupDatabaseView();
      } else if (targetView === "microscopeView") {
        setupMicroscopeTab();
      } else if (targetView === "adminView" && isAdminAuthenticated) {
        setupAdminView();
      }
    });
  });

  // Set up admin authentication
  setupAdminAuthentication();

  // Set up Entra logout
  setupEntraLogout();

  // Set the default active tab (Input Form)
  const defaultTab = document.querySelector(
    '.nav-tab[data-target="inputFormView"]'
  );
  if (defaultTab) {
    defaultTab.classList.add("active");
    const targetView = defaultTab.getAttribute("data-target");
    const defaultView = document.getElementById(targetView);
    if (defaultView) {
      defaultView.classList.add("active");
    }
  }
}

function switchToView(targetView) {
  // Remove active class from all tabs and views
  document.querySelectorAll(".nav-tab").forEach((t) => {
    t.classList.remove("active");
  });

  document.querySelectorAll(".content-view").forEach((view) => {
    view.classList.remove("active");
  });

  // Add active class to target view
  const viewElement = document.getElementById(targetView);
  if (viewElement) {
    viewElement.classList.add("active");
  }

  // Only highlight the tab if it's not admin or if admin is authenticated
  if (targetView !== "adminView" || isAdminAuthenticated) {
    const targetTab = document.querySelector(`[data-target="${targetView}"]`);
    if (targetTab) {
      targetTab.classList.add("active");
    }
  }
}

function showAdminPasswordPrompt() {
  const passwordPrompt = document.getElementById("adminPasswordPrompt");
  const adminContent = document.getElementById("adminContent");

  if (passwordPrompt && adminContent) {
    passwordPrompt.style.display = "block";
    adminContent.style.display = "none";
  }
}

function setupAdminAuthentication() {
  const loginButton = document.getElementById("adminLoginButton");
  const passwordInput = document.getElementById("adminPassword");
  const errorDiv = document.getElementById("adminLoginError");
  const logoutButton = document.getElementById("adminLogoutButton");

  if (loginButton && passwordInput) {
    // Handle login button click
    loginButton.addEventListener("click", () => {
      const enteredPassword = passwordInput.value;

      if (enteredPassword === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        showAdminContent();
        clearPasswordError();
        passwordInput.value = ""; // Clear password field

        // Highlight the admin tab
        const adminTab = document.querySelector('[data-target="adminView"]');
        if (adminTab) {
          adminTab.classList.add("active");
        }
      } else {
        showPasswordError("Incorrect password. Please try again.");
        passwordInput.value = "";
      }
    });

    // Handle Enter key in password field
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        loginButton.click();
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      isAdminAuthenticated = false;
      showAdminPasswordPrompt();

      // Remove active class from admin tab
      const adminTab = document.querySelector('[data-target="adminView"]');
      if (adminTab) {
        adminTab.classList.remove("active");
      }

      // Switch to default tab
      const defaultTab = document.querySelector(
        '[data-target="inputFormView"]'
      );
      if (defaultTab) {
        defaultTab.click();
      }
    });
  }
}

function showAdminContent() {
  const passwordPrompt = document.getElementById("adminPasswordPrompt");
  const adminContent = document.getElementById("adminContent");

  if (passwordPrompt && adminContent) {
    passwordPrompt.style.display = "none";
    adminContent.style.display = "block";
    setupAdminView();
  }
}

function showPasswordError(message) {
  const errorDiv = document.getElementById("adminLoginError");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 3000);
  }
}

function clearPasswordError() {
  const errorDiv = document.getElementById("adminLoginError");
  if (errorDiv) {
    errorDiv.style.display = "none";
  }
}

function setupEntraLogout() {
  const entraLogoutButton = document.getElementById("entraLogoutButton");

  if (entraLogoutButton) {
    entraLogoutButton.addEventListener("click", () => {
      // Redirect to Entra logout endpoint
      window.location.href = "/entra/logout.php";
    });
  }
}
