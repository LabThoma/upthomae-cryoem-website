// This file handles the tab navigation functionality

import { setupDatabaseView } from "../views/databaseView.js";

export function setupTabs() {
  // Get all tab elements
  const tabs = document.querySelectorAll(".nav-tab");

  // Add click event listeners to each tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetView = tab.getAttribute("data-target");

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
      }
    });
  });

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
