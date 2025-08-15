/**
 * Comprehensive validation module for the CryoEM database
 * Validates input data types, ranges, and constraints based on the database schema
 */

// Validation schemas based on your database structure
const VALIDATION_SCHEMAS = {
  sessions: {
    user_name: { type: "string", required: true, maxLength: 255, minLength: 1 },
    date: { type: "date", required: true },
    grid_box_name: { type: "string", required: false, maxLength: 255 },
    loading_order: { type: "string", required: false, maxLength: 255 },
    puck_name: { type: "string", required: false, maxLength: 255 },
    puck_position: { type: "integer", required: false, min: 1, max: 12 },
  },

  vitrobot_settings: {
    humidity_percent: {
      type: "decimal",
      required: false,
      min: 0,
      max: 100,
      precision: 2,
    },
    temperature_c: {
      type: "decimal",
      required: false,
      min: -50,
      max: 50,
      precision: 2,
    },
    blot_force: { type: "integer", required: false, min: -100, max: 100 },
    blot_time_seconds: {
      type: "decimal",
      required: false,
      min: 0,
      max: 60,
      precision: 2,
    },
    wait_time_seconds: {
      type: "decimal",
      required: false,
      min: 0,
      max: 300,
      precision: 2,
    },
    glow_discharge_applied: { type: "boolean", required: false },
  },

  grids: {
    grid_type: { type: "string", required: true, maxLength: 255 },
    grid_batch: { type: "string", required: false, maxLength: 100 },
    glow_discharge_applied: { type: "boolean", required: false },
    glow_discharge_current: {
      type: "decimal",
      required: false,
      min: 0,
      max: 100,
      precision: 2,
    },
    glow_discharge_time: {
      type: "integer",
      required: false,
      min: 0,
      max: 3600,
    },
  },

  grid_preparations: {
    slot_number: { type: "integer", required: false, min: 1, max: 48 },
    volume_ul_override: {
      type: "string",
      required: false,
      maxLength: 200,
    },
    incubation_time_seconds: {
      type: "decimal",
      required: false,
      min: 0,
      max: 9999.99,
      precision: 2,
    },
    blot_time_override: {
      type: "decimal",
      required: false,
      min: 0,
      max: 99.99,
      precision: 2,
    },
    blot_force_override: {
      type: "decimal",
      required: false,
      min: -99.99,
      max: 99.99,
      precision: 2,
    },
    grid_batch_override: { type: "string", required: false, maxLength: 100 },
    additives_override: { type: "string", required: false, maxLength: 100 },
    comments: { type: "text", required: false, maxLength: 1000 },
    include_in_session: { type: "boolean", required: false },
  },

  samples: {
    sample_name: {
      type: "string",
      required: true,
      maxLength: 255,
      minLength: 1,
    },
    sample_concentration: { type: "string", required: false, maxLength: 100 },
    additives: { type: "text", required: false, maxLength: 1000 },
    buffer: { type: "string", required: false, maxLength: 500 },
    default_volume_ul: {
      type: "string",
      required: false,
      maxLength: 200,
    },
  },

  grid_types: {
    grid_type_name: {
      type: "string",
      required: true,
      maxLength: 255,
      minLength: 1,
    },
    grid_batch: { type: "string", required: false, maxLength: 255 },
    manufacturer: { type: "string", required: false, maxLength: 255 },
    specifications: { type: "text", required: false, maxLength: 1000 },
  },
};

/**
 * Validates a single field value against its schema
 */
function validateField(fieldName, value, schema) {
  const errors = [];

  // Handle null/undefined values
  if (value === null || value === undefined || value === "") {
    if (schema.required) {
      errors.push(`${fieldName} is required`);
    }
    return errors; // Early return for null/empty values
  }

  // Type validation
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(
          `${fieldName} must be at least ${schema.minLength} characters long`
        );
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(
          `${fieldName} must be no more than ${schema.maxLength} characters long`
        );
      }
      break;

    case "text":
      if (typeof value !== "string") {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(
          `${fieldName} must be no more than ${schema.maxLength} characters long`
        );
      }
      break;

    case "integer":
      const intValue = parseInt(value);
      if (isNaN(intValue) || !Number.isInteger(intValue)) {
        errors.push(`${fieldName} must be a valid integer`);
        break;
      }
      if (schema.min !== undefined && intValue < schema.min) {
        errors.push(`${fieldName} must be at least ${schema.min}`);
      }
      if (schema.max !== undefined && intValue > schema.max) {
        errors.push(`${fieldName} must be no more than ${schema.max}`);
      }
      break;

    case "decimal":
      const floatValue = parseFloat(value);
      if (isNaN(floatValue)) {
        errors.push(`${fieldName} must be a valid number`);
        break;
      }
      if (schema.min !== undefined && floatValue < schema.min) {
        errors.push(`${fieldName} must be at least ${schema.min}`);
      }
      if (schema.max !== undefined && floatValue > schema.max) {
        errors.push(`${fieldName} must be no more than ${schema.max}`);
      }
      if (schema.precision) {
        const decimalPlaces = (floatValue.toString().split(".")[1] || "")
          .length;
        if (decimalPlaces > schema.precision) {
          errors.push(
            `${fieldName} can have at most ${schema.precision} decimal places`
          );
        }
      }
      break;

    case "boolean":
      if (
        typeof value !== "boolean" &&
        value !== 0 &&
        value !== 1 &&
        value !== "true" &&
        value !== "false"
      ) {
        errors.push(`${fieldName} must be a boolean value`);
      }
      break;

    case "date":
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        errors.push(`${fieldName} must be a valid date`);
      }
      break;
  }

  return errors;
}

/**
 * Validates an object against a table schema
 */
function validateTable(tableName, data) {
  const schema = VALIDATION_SCHEMAS[tableName];
  if (!schema) {
    throw new Error(`No validation schema found for table: ${tableName}`);
  }

  const errors = [];

  // Validate each field in the data
  for (const [fieldName, value] of Object.entries(data)) {
    if (schema[fieldName]) {
      const fieldErrors = validateField(fieldName, value, schema[fieldName]);
      errors.push(...fieldErrors);
    }
  }

  // Check for missing required fields
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    if (fieldSchema.required && !(fieldName in data)) {
      errors.push(`${fieldName} is required`);
    }
  }

  return errors;
}

/**
 * Validates a complete session object with all related data
 */
function validateSessionData(sessionData) {
  const allErrors = [];

  // Validate session
  if (sessionData.session) {
    const sessionErrors = validateTable("sessions", sessionData.session);
    allErrors.push(...sessionErrors.map((err) => `Session: ${err}`));
  }

  // Validate vitrobot settings
  if (sessionData.vitrobot_settings) {
    const vitrobotErrors = validateTable(
      "vitrobot_settings",
      sessionData.vitrobot_settings
    );
    allErrors.push(...vitrobotErrors.map((err) => `Vitrobot Settings: ${err}`));
  }

  // Validate grid info
  if (sessionData.grid_info) {
    const gridErrors = validateTable("grids", sessionData.grid_info);
    allErrors.push(...gridErrors.map((err) => `Grid Info: ${err}`));
  }

  // Validate grid preparations
  if (sessionData.grids && Array.isArray(sessionData.grids)) {
    sessionData.grids.forEach((grid, index) => {
      const gridPrepErrors = validateTable("grid_preparations", grid);
      allErrors.push(
        ...gridPrepErrors.map((err) => `Grid ${index + 1}: ${err}`)
      );

      // If grid has sample data, validate it
      if (
        grid.sample_name ||
        grid.sample_concentration ||
        grid.additives ||
        grid.default_volume_ul
      ) {
        const sampleData = {
          sample_name: grid.sample_name,
          sample_concentration: grid.sample_concentration,
          additives: grid.additives,
          default_volume_ul: grid.default_volume_ul,
        };
        const sampleErrors = validateTable("samples", sampleData);
        allErrors.push(
          ...sampleErrors.map((err) => `Grid ${index + 1} Sample: ${err}`)
        );
      }
    });
  }

  return allErrors;
}

/**
 * Sanitizes and converts input data to appropriate types
 */
function sanitizeInput(tableName, data) {
  const schema = VALIDATION_SCHEMAS[tableName];
  if (!schema) {
    return data;
  }

  const sanitized = {};

  for (const [fieldName, value] of Object.entries(data)) {
    if (
      schema[fieldName] &&
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const fieldSchema = schema[fieldName];

      switch (fieldSchema.type) {
        case "integer":
          sanitized[fieldName] = parseInt(value);
          break;
        case "decimal":
          sanitized[fieldName] = parseFloat(value);
          break;
        case "boolean":
          sanitized[fieldName] = Boolean(
            value === true || value === 1 || value === "true"
          );
          break;
        case "string":
        case "text":
          sanitized[fieldName] = String(value).trim();
          break;
        case "date":
          // Use local date methods to avoid timezone conversion
          const dateObj = new Date(value);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          sanitized[fieldName] = `${year}-${month}-${day}`;
          break;
        default:
          sanitized[fieldName] = value;
      }
    } else if (value === null || value === undefined || value === "") {
      // Keep null/undefined values as null for database
      sanitized[fieldName] = null;
    } else {
      sanitized[fieldName] = value;
    }
  }

  return sanitized;
}

/**
 * Express middleware for validation
 */
function createValidationMiddleware(tableName) {
  return (req, res, next) => {
    try {
      const errors = validateTable(tableName, req.body);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors,
        });
      }

      // Sanitize the input
      req.body = sanitizeInput(tableName, req.body);
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal validation error",
      });
    }
  };
}

/**
 * Express middleware for session validation
 */
function validateSessionMiddleware(req, res, next) {
  try {
    const errors = validateSessionData(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Sanitize all parts of the session data
    if (req.body.session) {
      req.body.session = sanitizeInput("sessions", req.body.session);
    }
    if (req.body.vitrobot_settings) {
      req.body.vitrobot_settings = sanitizeInput(
        "vitrobot_settings",
        req.body.vitrobot_settings
      );
    }
    if (req.body.grid_info) {
      req.body.grid_info = sanitizeInput("grids", req.body.grid_info);
    }
    if (req.body.sample) {
      req.body.sample = sanitizeInput("samples", req.body.sample);
    }
    if (req.body.grids && Array.isArray(req.body.grids)) {
      req.body.grids = req.body.grids.map((grid) =>
        sanitizeInput("grid_preparations", grid)
      );
    }

    next();
  } catch (error) {
    console.error("Session validation middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal validation error",
    });
  }
}

module.exports = {
  validateTable,
  validateSessionData,
  sanitizeInput,
  createValidationMiddleware,
  validateSessionMiddleware,
  VALIDATION_SCHEMAS,
};
