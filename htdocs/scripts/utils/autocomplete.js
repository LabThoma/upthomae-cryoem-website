// Autocomplete utility functions for dropdown population
// This file contains reusable autocomplete functionality that can be used across different forms

/**
 * Fetch data from an API endpoint and populate a dropdown
 * @param {string} elementId - ID of the select element to populate
 * @param {string} apiEndpoint - API endpoint to fetch data from
 * @param {string} defaultOptionText - Text for the default option
 * @param {Function} transformData - Optional function to transform the API response data
 * @param {Function} onError - Optional error callback
 * @param {boolean} addNewOption - Whether to add an "Add new..." option
 */
export async function populateDropdownFromAPI(
  elementId,
  apiEndpoint,
  defaultOptionText = "Select...",
  transformData = null,
  onError = null,
  addNewOption = false
) {
  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const processedData = transformData ? transformData(data) : data;

    populateDropdown(
      elementId,
      processedData,
      defaultOptionText,
      null,
      null,
      addNewOption
    );

    console.log(
      `Loaded ${processedData.length} items into dropdown ${elementId}`
    );
    return processedData;
  } catch (error) {
    console.error(`Error loading data for ${elementId}:`, error);
    if (onError) {
      onError(error);
    } else {
      // Fallback: ensure dropdown has at least the default option
      const select = document.getElementById(elementId);
      if (select) {
        select.innerHTML = `<option value="">${defaultOptionText}</option>`;
      }
    }
    return [];
  }
}

/**
 * Populate a dropdown with an array of data
 * @param {string} elementId - ID of the select element to populate
 * @param {Array} data - Array of data to populate (strings or objects)
 * @param {string} defaultOptionText - Text for the default option
 * @param {string} valueKey - Key to use for option values (if data contains objects)
 * @param {string} textKey - Key to use for option text (if data contains objects)
 * @param {boolean} addNewOption - Whether to add an "Add new..." option
 */
export function populateDropdown(
  elementId,
  data,
  defaultOptionText = "Select...",
  valueKey = null,
  textKey = null,
  addNewOption = false
) {
  const select = document.getElementById(elementId);
  if (!select) {
    console.warn(`Element with ID '${elementId}' not found`);
    return;
  }

  // Clear existing options
  select.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultOptionText;
  select.appendChild(defaultOption);

  // Add data options
  data.forEach((item) => {
    const option = document.createElement("option");

    if (typeof item === "string") {
      // Simple string data
      option.value = item;
      option.textContent = item;
    } else {
      // Object data
      option.value = valueKey ? item[valueKey] : item;
      option.textContent = textKey ? item[textKey] : item.toString();
    }

    select.appendChild(option);
  });

  // Add "Add new..." option if requested
  if (addNewOption) {
    const newOption = document.createElement("option");
    newOption.value = "__ADD_NEW__";
    newOption.textContent = "+ Add new...";
    select.appendChild(newOption);
  }
}

/**
 * Handle "Add new" option selection by converting dropdown to input field
 * @param {HTMLSelectElement} selectElement - The select element
 * @param {string} placeholder - Placeholder text for the input field
 * @param {Array} originalOptions - Original options to restore dropdown if needed
 */
export function handleAddNewOption(
  selectElement,
  placeholder = "Enter new value...",
  originalOptions = null
) {
  if (selectElement.value === "__ADD_NEW__") {
    // Store original options if not provided
    if (!originalOptions) {
      originalOptions = Array.from(selectElement.options)
        .filter((option) => option.value && option.value !== "__ADD_NEW__")
        .map((option) => ({ value: option.value, text: option.textContent }));
    }

    // Create input element
    const input = document.createElement("input");
    input.type = "text";
    input.id = selectElement.id;
    input.name = selectElement.name;
    input.className = selectElement.className;
    input.placeholder = placeholder;
    input.required = selectElement.required;
    input.dataset.originalOptions = JSON.stringify(originalOptions);

    // Create a container with the input and a "back to dropdown" button
    const container = document.createElement("div");
    container.className = "input-with-dropdown-option";
    container.style.cssText = "display: flex; gap: 5px; align-items: center;";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.textContent = "↓";
    backButton.title = "Back to dropdown";
    backButton.style.cssText =
      "padding: 5px 8px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer; border-radius: 3px;";

    container.appendChild(input);
    container.appendChild(backButton);

    // Replace select with container
    selectElement.parentNode.replaceChild(container, selectElement);

    // Add event listener to back button
    backButton.addEventListener("click", () => {
      const newSelect = document.createElement("select");
      newSelect.id = input.id;
      newSelect.name = input.name;
      newSelect.className = input.className;
      newSelect.required = input.required;

      // Restore original options
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select...";
      newSelect.appendChild(defaultOption);

      const storedOptions = JSON.parse(input.dataset.originalOptions);
      storedOptions.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        newSelect.appendChild(optionElement);
      });

      // Add "Add new" option back
      const addNewOption = document.createElement("option");
      addNewOption.value = "__ADD_NEW__";
      addNewOption.textContent = "+ Add new...";
      newSelect.appendChild(addNewOption);

      // Set current input value as selected if it matches an option
      if (
        input.value &&
        storedOptions.some((opt) => opt.value === input.value)
      ) {
        newSelect.value = input.value;
      }

      container.parentNode.replaceChild(newSelect, container);

      // Re-attach the change handler
      newSelect.addEventListener("change", function () {
        handleAddNewOption(this, placeholder, storedOptions);
      });
    });

    // Focus the input for immediate typing
    input.focus();

    return input;
  }
  return selectElement;
}
