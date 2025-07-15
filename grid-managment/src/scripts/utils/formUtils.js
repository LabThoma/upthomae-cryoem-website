// This file contains utility functions for form validation and handling.

export function validateForm() {
  const errors = [];

  // Check required fields that should exist
  const requiredFields = [
    { id: "userName", name: "User Name" },
    { id: "sessionDate", name: "Session Date" },
    { id: "gridBoxName", name: "Grid Box Name" },
  ];

  requiredFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      errors.push(`Please enter ${field.name}.`);
    }
  });

  // Check if at least one grid is selected
  const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
  if (checkedGrids.length === 0) {
    errors.push("Please select at least one grid.");
  }

  // Check glow discharge settings if enabled
  const glowDischarge = document.getElementById("glowDischarge");
  if (glowDischarge && glowDischarge.checked) {
    const glowCurrent = document.getElementById("glowCurrent");
    const glowTime = document.getElementById("glowTime");

    if (!glowCurrent || !glowCurrent.value) {
      errors.push("Please enter glow discharge current.");
    }
    if (!glowTime || !glowTime.value) {
      errors.push("Please enter glow discharge time.");
    }
  }

  return errors;
}

export function clearFormFields() {
  // Clear form fields
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="date"], textarea'
  );
  inputs.forEach((input) => (input.value = ""));

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => (checkbox.checked = false));

  const selects = document.querySelectorAll("select");
  selects.forEach((select) => (select.selectedIndex = 0));
}
