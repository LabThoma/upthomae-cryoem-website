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
