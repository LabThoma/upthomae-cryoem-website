// filepath: /grid-management/grid-management/src/scripts/controllers/gridController.js
export function prepareNextBox() {
  showAlert("Prepare Next Box functionality not implemented yet", "info");
}

export function clearForm() {
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="date"], textarea'
  );
  inputs.forEach((input) => (input.value = ""));

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => (checkbox.checked = false));

  const selects = document.querySelectorAll("select");
  selects.forEach((select) => (select.selectedIndex = 0));

  showAlert("Form cleared", "info");
}
