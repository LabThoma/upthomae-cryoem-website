// This file handles the loading of reusable components into the application.
// It exports a function loadComponents that fetches and inserts HTML components.

// Import necessary functions
import { setDefaultDate } from "../views/formView.js";
import { setupGridTable } from "./gridTable.js";
import { setupTabs } from "./tabs.js";

export function loadComponents(callback) {
  const components = [
    { id: "header", filePath: "components/header.html" },
    { id: "session-info", filePath: "components/session-info.html" },
    { id: "sample-info", filePath: "components/sample-info.html" },
    { id: "grid-info", filePath: "components/grid-info.html" },
    { id: "vitrobot-settings", filePath: "components/vitrobot-settings.html" },
    { id: "grid-details", filePath: "components/grid-details.html" },
    { id: "grid-database", filePath: "components/grid-database.html" },
    { id: "alertContainer", filePath: "components/alert.html" },
  ];

  let loadedCount = 0;

  components.forEach(({ id, filePath }) => {
    fetch(filePath)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        return response.text();
      })
      .then((html) => {
        const element = document.getElementById(id);
        if (element) {
          element.innerHTML = html;
        }

        // Call setDefaultDate after session-info is loaded
        if (id === "session-info") {
          setDefaultDate();
        }

        // Setup tabs after header is loaded
        if (id === "header") {
          setupTabs();
        }

        // Call setupGridTable after grid-details is loaded
        if (id === "grid-details") {
          setupGridTable();
        }

        loadedCount++;

        // Call the callback after all components are loaded
        if (
          loadedCount === components.length &&
          typeof callback === "function"
        ) {
          callback();
        }
      })
      .catch((error) => console.error(error));
  });
}
