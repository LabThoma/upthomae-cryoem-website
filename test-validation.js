/**
 * Test suite for the validation module
 */

const {
  validateTable,
  validateSessionData,
  sanitizeInput,
  VALIDATION_SCHEMAS,
} = require("./validation.js");

// Test data
const validSessionData = {
  session: {
    user_name: "John Doe",
    date: "2025-07-21",
    grid_box_name: "Box A",
    loading_order: "1-12",
    puck_name: "Puck 1",
    puck_position: "A1",
  },
  vitrobot_settings: {
    humidity_percent: 85.5,
    temperature_c: 4.0,
    blot_force: 15,
    blot_time_seconds: 3.5,
    wait_time_seconds: 30.0,
    glow_discharge_applied: true,
  },
  grid_info: {
    grid_type: "Quantifoil R1.2/1.3",
    grid_batch: "Batch123",
    glow_discharge_applied: true,
    glow_discharge_current: 25.0,
    glow_discharge_time: 60,
  },
  grids: [
    {
      slot_number: 1,
      volume_ul_override: 3.5,
      blot_time_override: 4.0,
      comments: "Test grid",
      include_in_session: true,
      sample_name: "Test Sample",
      sample_concentration: "2 mg/ml",
    },
  ],
};

const invalidSessionData = {
  session: {
    user_name: "", // Invalid: empty string
    date: "invalid-date", // Invalid: bad date format
    grid_box_name: "A".repeat(300), // Invalid: too long
  },
  vitrobot_settings: {
    humidity_percent: 150, // Invalid: over 100%
    temperature_c: "not a number", // Invalid: string instead of number
    blot_force: -5, // Invalid: negative value
  },
  grids: [
    {
      slot_number: "not a number", // Invalid: string instead of integer
      volume_ul_override: 999.999, // Invalid: too many decimal places
      include_in_session: "maybe", // Invalid: not a boolean
    },
  ],
};

// Test functions
function runTests() {
  console.log("🧪 Starting Validation Tests...\n");

  // Test 1: Valid session data
  console.log("Test 1: Valid session data");
  const validErrors = validateSessionData(validSessionData);
  if (validErrors.length === 0) {
    console.log("✅ PASS - Valid data accepted");
  } else {
    console.log("❌ FAIL - Valid data rejected:", validErrors);
  }

  // Test 2: Invalid session data
  console.log("\nTest 2: Invalid session data");
  const invalidErrors = validateSessionData(invalidSessionData);
  if (invalidErrors.length > 0) {
    console.log("✅ PASS - Invalid data rejected");
    console.log("   Errors found:", invalidErrors.length);
    invalidErrors.forEach((error) => console.log(`   - ${error}`));
  } else {
    console.log("❌ FAIL - Invalid data accepted");
  }

  // Test 3: Individual table validation
  console.log("\nTest 3: Individual table validation");

  // Valid sample
  const validSample = {
    sample_name: "Test Sample",
    sample_concentration: "2 mg/ml",
    default_volume_ul: 3.5,
  };
  const sampleErrors = validateTable("samples", validSample);
  if (sampleErrors.length === 0) {
    console.log("✅ PASS - Valid sample accepted");
  } else {
    console.log("❌ FAIL - Valid sample rejected:", sampleErrors);
  }

  // Invalid sample
  const invalidSample = {
    sample_name: "", // Required but empty
    default_volume_ul: "not a number",
  };
  const invalidSampleErrors = validateTable("samples", invalidSample);
  if (invalidSampleErrors.length > 0) {
    console.log("✅ PASS - Invalid sample rejected:", invalidSampleErrors);
  } else {
    console.log("❌ FAIL - Invalid sample accepted");
  }

  // Test 4: Data sanitization
  console.log("\nTest 4: Data sanitization");
  const dirtyData = {
    sample_name: "  Test Sample  ", // Has whitespace
    default_volume_ul: "3.5", // String number
    sample_concentration: null,
  };
  const sanitized = sanitizeInput("samples", dirtyData);
  console.log("Original:", dirtyData);
  console.log("Sanitized:", sanitized);

  if (
    sanitized.sample_name === "Test Sample" &&
    sanitized.default_volume_ul === 3.5 &&
    sanitized.sample_concentration === null
  ) {
    console.log("✅ PASS - Data sanitized correctly");
  } else {
    console.log("❌ FAIL - Data sanitization failed");
  }

  // Test 5: Type conversion
  console.log("\nTest 5: Type conversion");
  const typeTestData = {
    humidity_percent: "85.5", // String number
    blot_force: "15", // String integer
    glow_discharge_applied: "true", // String boolean
  };
  const typeSanitized = sanitizeInput("vitrobot_settings", typeTestData);

  if (
    typeof typeSanitized.humidity_percent === "number" &&
    typeof typeSanitized.blot_force === "number" &&
    typeof typeSanitized.glow_discharge_applied === "boolean"
  ) {
    console.log("✅ PASS - Types converted correctly");
    console.log("   Converted:", typeSanitized);
  } else {
    console.log("❌ FAIL - Type conversion failed");
    console.log("   Result:", typeSanitized);
  }

  // Test 6: Edge cases
  console.log("\nTest 6: Edge cases");

  // Null/undefined values
  const nullData = {
    sample_name: "Required Field",
    sample_concentration: null,
    additives: undefined,
    default_volume_ul: "",
  };
  const nullErrors = validateTable("samples", nullData);
  const nullSanitized = sanitizeInput("samples", nullData);

  if (nullErrors.length === 0 && nullSanitized.sample_concentration === null) {
    console.log("✅ PASS - Null/undefined values handled correctly");
  } else {
    console.log("❌ FAIL - Null/undefined handling failed");
    console.log("   Errors:", nullErrors);
    console.log("   Sanitized:", nullSanitized);
  }

  // Boundary values
  const boundaryData = {
    humidity_percent: 100, // Max value
    temperature_c: -50, // Min value
    blot_force: 0, // Min value
  };
  const boundaryErrors = validateTable("vitrobot_settings", boundaryData);

  if (boundaryErrors.length === 0) {
    console.log("✅ PASS - Boundary values accepted");
  } else {
    console.log("❌ FAIL - Valid boundary values rejected:", boundaryErrors);
  }

  console.log("\n🏁 Tests completed!");
}

// Additional utility functions for testing in development
function testSpecificField(tableName, fieldName, value) {
  console.log(`Testing ${tableName}.${fieldName} = ${value}`);
  const schema = VALIDATION_SCHEMAS[tableName];
  if (!schema || !schema[fieldName]) {
    console.log("❌ Field not found in schema");
    return;
  }

  const testData = { [fieldName]: value };
  const errors = validateTable(tableName, testData);
  const sanitized = sanitizeInput(tableName, testData);

  console.log("Errors:", errors);
  console.log("Sanitized:", sanitized);
}

function showSchema(tableName) {
  console.log(`Schema for ${tableName}:`);
  console.log(JSON.stringify(VALIDATION_SCHEMAS[tableName], null, 2));
}

// Export test functions for use in development
module.exports = {
  runTests,
  testSpecificField,
  showSchema,
  validSessionData,
  invalidSessionData,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
