// This file contains utility functions for date formatting and manipulation.

/**
 * Formats a date value for display in YYYY-MM-DD format
 * @param {*} dateValue - The date value to format
 * @returns {string} - Formatted date string or fallback
 */
export function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  try {
    // Handle string format - most common case after our server fixes
    if (typeof dateValue === "string") {
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue; // Already in YYYY-MM-DD format
      } else if (dateValue.includes("T")) {
        return dateValue.split("T")[0]; // ISO format with time
      }
    }

    // Handle MariaDB date object
    if (typeof dateValue === "object" && dateValue !== null) {
      if ("year" in dateValue && "month" in dateValue && "day" in dateValue) {
        return `${dateValue.year}-${String(dateValue.month).padStart(
          2,
          "0"
        )}-${String(dateValue.day).padStart(2, "0")}`;
      }
    }

    // Try standard Date constructor but avoid timezone issues
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      // Use local date methods to avoid timezone conversion
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return String(dateValue);
  } catch (e) {
    console.warn("Error formatting date:", dateValue, e);
    return "Invalid date";
  }
}

/**
 * Formats a date value for HTML date input fields
 * Handles timezone issues by avoiding timezone conversion
 * @param {*} dateValue - The date value to format
 * @returns {string} - Formatted date string for input field
 */
export function formatDateForInput(dateValue) {
  if (!dateValue) return "";

  try {
    // Handle string format - most common case
    if (typeof dateValue === "string") {
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue; // Already in YYYY-MM-DD format
      } else if (dateValue.includes("T")) {
        return dateValue.split("T")[0]; // ISO format with time
      }
    }

    // Handle MariaDB date object
    if (typeof dateValue === "object" && dateValue !== null) {
      if ("year" in dateValue && "month" in dateValue && "day" in dateValue) {
        return `${dateValue.year}-${String(dateValue.month).padStart(
          2,
          "0"
        )}-${String(dateValue.day).padStart(2, "0")}`;
      }
    }

    // Try standard Date constructor but avoid timezone issues
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      // Use local date methods to avoid timezone conversion
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return "";
  } catch (e) {
    console.warn("Error formatting date for input:", dateValue, e);
    return "";
  }
}

/**
 * Gets the current date in YYYY-MM-DD format for date inputs
 * Avoids timezone issues by using local date methods
 * @returns {string} - Current date in YYYY-MM-DD format
 */
export function getCurrentDateForInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a timestamp for display (for created_at/updated_at fields)
 * @param {*} timestampValue - The timestamp value to format
 * @returns {string} - Formatted timestamp string
 */
export function formatTimestamp(timestampValue) {
  if (!timestampValue) return "N/A";

  try {
    const dateObj = new Date(timestampValue);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleString(); // Shows both date and time in local timezone
    }
    return String(timestampValue);
  } catch (e) {
    console.warn("Error formatting timestamp:", timestampValue, e);
    return "Invalid timestamp";
  }
}
