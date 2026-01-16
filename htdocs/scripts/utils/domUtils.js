// This file contains utility functions for DOM manipulation.

export function getElementValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : "";
}

export function getElementChecked(id) {
  const element = document.getElementById(id);
  return element ? element.checked : false;
}

export function getRowValue(row, selector) {
  if (selector === ".grid-slot") {
    return row.getAttribute("data-slot") || "";
  }
  const element = row.querySelector(selector);
  return element ? element.value : "";
}

/**
 * Get all currently expanded row IDs from a specific table
 * @param {string} tableBodyId - The ID of the table body element
 * @returns {Array<string>} Array of expanded row IDs
 */
export function getExpandedRowIds(tableBodyId) {
  const expandedIds = [];
  const expandedIcons = document.querySelectorAll(
    `#${tableBodyId} .expandable-row-icon.expanded`
  );
  expandedIcons.forEach((icon) => {
    // Try different data attributes that might contain the ID
    const id =
      icon.getAttribute("data-session-id") ||
      icon.getAttribute("data-session-idx") ||
      icon.getAttribute("data-grid-type-name");
    if (id) {
      expandedIds.push(id);
    }
  });
  return expandedIds;
}

/**
 * Restore expanded state for rows with matching IDs
 * @param {string} tableBodyId - The ID of the table body element
 * @param {Array<string>} expandedIds - Array of IDs that should be expanded
 */
export function restoreExpandedState(tableBodyId, expandedIds) {
  if (!expandedIds || expandedIds.length === 0) return;

  expandedIds.forEach((id) => {
    // Try to find the icon with any of the possible data attributes
    const selectors = [
      `#${tableBodyId} .expandable-row-icon[data-session-id="${id}"]`,
      `#${tableBodyId} .expandable-row-icon[data-session-idx="${id}"]`,
      `#${tableBodyId} .expandable-row-icon[data-grid-type-name="${id}"]`,
    ];

    let icon = null;
    for (const selector of selectors) {
      icon = document.querySelector(selector);
      if (icon) break;
    }

    if (icon) {
      // Find the associated content and detail row
      const detailRow = icon.closest("tr").nextElementSibling;

      // Try to find content with different ID patterns
      const sessionId = icon.getAttribute("data-session-id");
      const sessionIdx = icon.getAttribute("data-session-idx");
      const gridTypeName = icon.getAttribute("data-grid-type-name");

      let content = null;
      if (sessionId) {
        content =
          document.getElementById(`details-${sessionId}`) ||
          document.getElementById(`microscope-session-details-${sessionId}`);
      } else if (sessionIdx !== null) {
        content =
          document.getElementById(`microscope-session-details-${sessionIdx}`) ||
          document.getElementById(`microscope-details-${sessionIdx}`);
      } else if (gridTypeName) {
        content = document.getElementById(`grid-type-details-${gridTypeName}`);
      }

      if (content && detailRow) {
        icon.classList.add("expanded");
        content.classList.add("expanded");
        detailRow.classList.add("visible");
        icon.textContent = "▼";
      }
    }
  });
}
