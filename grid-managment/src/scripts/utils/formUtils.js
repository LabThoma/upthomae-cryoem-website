// This file contains utility functions for form validation and handling.

// Validation rules matching the backend schema
const VALIDATION_RULES = {
  sessions: {
    userName: {
      required: true,
      maxLength: 255,
      minLength: 1,
      label: "User Name",
    },
    sessionDate: { required: true, type: "date", label: "Session Date" },
    gridBoxName: { required: false, maxLength: 255, label: "Grid Box Name" },
    loadingOrder: { required: false, maxLength: 255, label: "Loading Order" },
    puckName: { required: false, maxLength: 255, label: "Puck Name" },
    puckPosition: { required: false, maxLength: 255, label: "Puck Position" },
  },
  vitrobot: {
    humidity: {
      type: "decimal",
      min: 0,
      max: 100,
      precision: 2,
      label: "Humidity %",
    },
    temperature: {
      type: "decimal",
      min: -50,
      max: 50,
      precision: 2,
      label: "Temperature °C",
    },
    blotForce: { type: "integer", min: -100, max: 100, label: "Blot Force" },
    blotTime: {
      type: "decimal",
      min: 0,
      max: 60,
      precision: 2,
      label: "Blot Time (s)",
    },
    waitTime: {
      type: "decimal",
      min: 0,
      max: 300,
      precision: 2,
      label: "Wait Time (s)",
    },
  },
  grid: {
    gridType: { required: true, maxLength: 255, label: "Grid Type" },
    gridBatch: { maxLength: 100, label: "Grid Batch" },
    glowCurrent: {
      type: "decimal",
      min: 0,
      max: 100,
      precision: 2,
      label: "Glow Discharge Current",
    },
    glowTime: {
      type: "integer",
      min: 0,
      max: 3600,
      label: "Glow Discharge Time",
    },
  },
  gridPrep: {
    slotNumber: { type: "integer", min: 1, max: 48, label: "Slot Number" },
    volumeOverride: {
      type: "decimal",
      min: 0,
      max: 99.99,
      precision: 2,
      label: "Volume Override (μL)",
    },
    blotTimeOverride: {
      type: "decimal",
      min: 0,
      max: 99.99,
      precision: 2,
      label: "Blot Time Override",
    },
    blotForceOverride: {
      type: "decimal",
      min: -99.99,
      max: 99.99,
      precision: 2,
      label: "Blot Force Override",
    },
    comments: { maxLength: 1000, label: "Comments" },
  },
  sample: {
    sampleName: {
      required: true,
      maxLength: 255,
      minLength: 1,
      label: "Sample Name",
    },
    sampleConcentration: { maxLength: 100, label: "Sample Concentration" },
    additives: { maxLength: 1000, label: "Additives" },
    volume: {
      type: "decimal",
      min: 0,
      max: 99.99,
      precision: 2,
      label: "Default Volume (μL)",
    },
  },
};

/**
 * Validates a single field value against validation rules
 */
function validateField(value, rules) {
  const errors = [];

  // Handle empty values
  if (value === null || value === undefined || value === "") {
    if (rules.required) {
      errors.push(`${rules.label} is required`);
    }
    return errors;
  }

  // Type validation
  switch (rules.type) {
    case "integer":
      const intValue = parseInt(value);
      if (isNaN(intValue) || !Number.isInteger(parseFloat(value))) {
        errors.push(`${rules.label} must be a whole number`);
        break;
      }
      if (rules.min !== undefined && intValue < rules.min) {
        errors.push(`${rules.label} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && intValue > rules.max) {
        errors.push(`${rules.label} must be no more than ${rules.max}`);
      }
      break;

    case "decimal":
      const floatValue = parseFloat(value);
      if (isNaN(floatValue)) {
        errors.push(`${rules.label} must be a valid number`);
        break;
      }
      if (rules.min !== undefined && floatValue < rules.min) {
        errors.push(`${rules.label} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && floatValue > rules.max) {
        errors.push(`${rules.label} must be no more than ${rules.max}`);
      }
      if (rules.precision) {
        const decimalPlaces = (floatValue.toString().split(".")[1] || "")
          .length;
        if (decimalPlaces > rules.precision) {
          errors.push(
            `${rules.label} can have at most ${rules.precision} decimal places`
          );
        }
      }
      break;

    case "date":
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        errors.push(`${rules.label} must be a valid date`);
      }
      break;
  }

  // String length validation
  if (typeof value === "string") {
    if (rules.minLength && value.trim().length < rules.minLength) {
      errors.push(
        `${rules.label} must be at least ${rules.minLength} characters long`
      );
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(
        `${rules.label} must be no more than ${rules.maxLength} characters long`
      );
    }
  }

  return errors;
}

/**
 * Enhanced form validation with detailed error reporting
 */
export function validateForm() {
  const errors = [];

  // Validate session fields
  const sessionFields = [
    { id: "userName", rules: VALIDATION_RULES.sessions.userName },
    { id: "sessionDate", rules: VALIDATION_RULES.sessions.sessionDate },
    { id: "gridBoxName", rules: VALIDATION_RULES.sessions.gridBoxName },
    { id: "loadingOrder", rules: VALIDATION_RULES.sessions.loadingOrder },
    { id: "puckName", rules: VALIDATION_RULES.sessions.puckName },
    { id: "puckPosition", rules: VALIDATION_RULES.sessions.puckPosition },
  ];

  sessionFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) {
      const fieldErrors = validateField(element.value, field.rules);
      errors.push(...fieldErrors);
    }
  });

  // Validate sample information
  const sampleFields = [
    { id: "sampleName", rules: VALIDATION_RULES.sample.sampleName },
    { id: "sampleConcentration", rules: VALIDATION_RULES.sample.sampleConcentration },
    { id: "additives", rules: VALIDATION_RULES.sample.additives },
    { id: "volume", rules: VALIDATION_RULES.sample.volume }
  ];

  sampleFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) {
      const fieldErrors = validateField(element.value, field.rules);
      errors.push(...fieldErrors);
    }
  });

  // Validate vitrobot settings
  const vitrobotFields = [
    { id: "humidity", rules: VALIDATION_RULES.vitrobot.humidity },
    { id: "temperature", rules: VALIDATION_RULES.vitrobot.temperature },
    { id: "blotForce", rules: VALIDATION_RULES.vitrobot.blotForce },
    { id: "blotTime", rules: VALIDATION_RULES.vitrobot.blotTime },
    { id: "waitTime", rules: VALIDATION_RULES.vitrobot.waitTime },
  ];

  vitrobotFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element && element.value) {
      const fieldErrors = validateField(element.value, field.rules);
      errors.push(...fieldErrors);
    }
  });

  // Validate grid settings
  const gridFields = [
    { id: "gridType", rules: VALIDATION_RULES.grid.gridType },
    { id: "gridBatch", rules: VALIDATION_RULES.grid.gridBatch },
  ];

  gridFields.forEach((field) => {
    const element = document.getElementById(field.id);
    if (element) {
      const fieldErrors = validateField(element.value, field.rules);
      errors.push(...fieldErrors);
    }
  });

  // Check glow discharge settings if enabled
  const glowDischarge = document.getElementById("glowDischarge");
  if (glowDischarge && glowDischarge.checked) {
    const glowCurrent = document.getElementById("glowCurrent");
    const glowTime = document.getElementById("glowTime");

    if (glowCurrent) {
      const currentErrors = validateField(
        glowCurrent.value,
        VALIDATION_RULES.grid.glowCurrent
      );
      errors.push(...currentErrors);
    }
    if (glowTime) {
      const timeErrors = validateField(
        glowTime.value,
        VALIDATION_RULES.grid.glowTime
      );
      errors.push(...timeErrors);
    }
  }

  // Check if at least one grid is selected
  const checkedGrids = document.querySelectorAll(".grid-checkbox:checked");
  if (checkedGrids.length === 0) {
    errors.push("Please select at least one grid.");
  }

  // Validate each selected grid
  checkedGrids.forEach((checkbox, index) => {
    const gridContainer =
      checkbox.closest(".grid-item") || checkbox.closest(".grid-row");
    if (gridContainer) {
      // Validate grid-specific fields
      const slotInput = gridContainer.querySelector('[name*="slot"]');
      const volumeInput = gridContainer.querySelector('[name*="volume"]');
      const sampleNameInput = gridContainer.querySelector('[name*="sample"]');

      if (slotInput && slotInput.value) {
        const slotErrors = validateField(
          slotInput.value,
          VALIDATION_RULES.gridPrep.slotNumber
        );
        errors.push(...slotErrors.map((err) => `Grid ${index + 1}: ${err}`));
      }

      if (volumeInput && volumeInput.value) {
        const volumeErrors = validateField(
          volumeInput.value,
          VALIDATION_RULES.gridPrep.volumeOverride
        );
        errors.push(...volumeErrors.map((err) => `Grid ${index + 1}: ${err}`));
      }

      if (sampleNameInput && sampleNameInput.value) {
        const sampleErrors = validateField(
          sampleNameInput.value,
          VALIDATION_RULES.sample.sampleName
        );
        errors.push(...sampleErrors.map((err) => `Grid ${index + 1}: ${err}`));
      }
    }
  });

  return errors;
}

/**
 * Real-time field validation
 */
export function validateFieldRealTime(fieldId, rules) {
  const element = document.getElementById(fieldId);
  if (!element) return;

  const errors = validateField(element.value, rules);

  // Remove existing error styling
  element.classList.remove("error");
  const existingError = element.parentNode.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // Add error styling and message if there are errors
  if (errors.length > 0) {
    element.classList.add("error");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = errors[0]; // Show first error
    element.parentNode.appendChild(errorDiv);
  }

  return errors.length === 0;
}

/**
 * Setup real-time validation for form fields
 */
export function setupRealTimeValidation() {
  // Session fields
  Object.entries(VALIDATION_RULES.sessions).forEach(([field, rules]) => {
    const element = document.getElementById(field);
    if (element) {
      element.addEventListener("blur", () =>
        validateFieldRealTime(field, rules)
      );
      if (rules.type === "date") {
        element.addEventListener("change", () =>
          validateFieldRealTime(field, rules)
        );
      }
    }
  });

  // Sample fields
  Object.entries(VALIDATION_RULES.sample).forEach(([field, rules]) => {
    const element = document.getElementById(field);
    if (element) {
      element.addEventListener("blur", () =>
        validateFieldRealTime(field, rules)
      );
    }
  });

  // Vitrobot fields
  Object.entries(VALIDATION_RULES.vitrobot).forEach(([field, rules]) => {
    const element = document.getElementById(field);
    if (element) {
      element.addEventListener("blur", () =>
        validateFieldRealTime(field, rules)
      );
    }
  });

  // Grid fields
  Object.entries(VALIDATION_RULES.grid).forEach(([field, rules]) => {
    const element = document.getElementById(field);
    if (element) {
      element.addEventListener("blur", () =>
        validateFieldRealTime(field, rules)
      );
    }
  });
}

export function clearFormFields() {
  // Clear form fields
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="number"], input[type="date"], textarea'
  );
  inputs.forEach((input) => {
    input.value = "";
    input.classList.remove("error");
  });

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => (checkbox.checked = false));

  const selects = document.querySelectorAll("select");
  selects.forEach((select) => (select.selectedIndex = 0));

  // Remove error messages
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
}
