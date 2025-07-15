// This file contains utility functions for date formatting and manipulation.

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

    // Try standard Date constructor
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
