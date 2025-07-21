# Input Validation System

## Overview

This project now has a comprehensive input validation system that validates all data before it reaches the MariaDB database. The validation works on both frontend (client-side) and backend (server-side) to ensure data integrity and security.

## What's Implemented

### 1. Backend Validation (`validation.js`)

- **Schema-based validation** for all database tables
- **Type validation** (integer, decimal, string, text, boolean, date)
- **Range validation** (min/max values)
- **Length validation** (string/text length limits)
- **Precision validation** (decimal places)
- **Data sanitization** (type conversion and cleaning)
- **Express middleware** for automatic validation

### 2. Frontend Validation (`formUtils.js`)

- **Real-time field validation** (on blur/change events)
- **Form submission validation**
- **Visual error indicators** (red borders, error messages)
- **Consistent validation rules** matching backend schema

### 3. Database Schema Alignment

The validation rules are based on your MariaDB schema from `setup.sql`:

#### Sessions

- `user_name`: Required string, 1-255 characters
- `date`: Required valid date
- `grid_box_name`, `loading_order`, `puck_name`, `puck_position`: Optional strings, max 255 characters

#### Samples

- `sample_name`: Required string, 1-255 characters
- `sample_concentration`: Optional string, max 100 characters
- `additives`: Optional text, max 1000 characters
- `default_volume_ul`: 0-99.99 μL, max 2 decimal places

#### Vitrobot Settings

- `humidity_percent`: 0-100%, max 2 decimal places
- `temperature_c`: -50 to 50°C, max 2 decimal places
- `blot_force`: -100 to 100 (allows negative values)
- `blot_time_seconds`: 0-60 seconds, max 2 decimal places
- `wait_time_seconds`: 0-300 seconds, max 2 decimal places

#### Grid Preparations

- `slot_number`: 1-48 (integer)
- `volume_ul_override`: 0-99.99 μL, max 2 decimal places
- `incubation_time_seconds`: 0-9999.99 seconds, max 2 decimal places
- `blot_time_override`: 0-99.99 seconds, max 2 decimal places
- `blot_force_override`: -99.99 to 99.99 (allows negative values)
- `comments`: Max 1000 characters
- `grid_batch_override`: Max 100 characters
- `additives_override`: Max 100 characters

#### Grid Types

- `grid_type_name`: Required string, 1-255 characters
- `grid_batch`, `manufacturer`: Optional strings, max 255 characters
- `specifications`: Optional text, max 1000 characters

#### Grids

- `grid_type`: Required string, max 255 characters
- `grid_batch`: Optional string, max 100 characters
- `glow_discharge_current`: 0-100 mA, max 2 decimal places
- `glow_discharge_time`: 0-3600 seconds (integer)

## How to Use

### Backend API Routes

All POST routes now have automatic validation:

```javascript
// Automatically validates against 'sessions' schema
app.post("/api/sessions", validateSessionMiddleware, async (req, res) => {
  // req.body is already validated and sanitized
});

// Automatically validates against 'samples' schema
app.post(
  "/api/samples",
  createValidationMiddleware("samples"),
  async (req, res) => {
    // req.body is already validated and sanitized
  }
);
```

### Frontend Forms

```javascript
import { validateForm, setupRealTimeValidation } from "./utils/formUtils.js";

// Setup real-time validation on page load
setupRealTimeValidation();

// Validate before form submission
const errors = validateForm();
if (errors.length > 0) {
  // Display errors to user
  console.log("Validation errors:", errors);
}
```

## Testing

Run the validation tests:

```bash
node test-validation.js
```

Test specific fields:

```javascript
const { testSpecificField } = require("./test-validation.js");
testSpecificField("vitrobot_settings", "blot_force", -25);
```

## Error Handling

### Validation Errors (400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Session: user_name is required",
    "Vitrobot Settings: blot_force must be at least -100",
    "Grid 1: volume_ul_override can have at most 2 decimal places"
  ]
}
```

### Frontend Error Display

- Fields with errors get red borders and error messages
- Real-time validation shows errors as user types/leaves fields
- Form submission is blocked until all errors are resolved

## Recent Changes

- **Blot Force**: Now allows negative values (-100 to 100 for vitrobot settings, -99.99 to 99.99 for grid preparation overrides)
- This change affects both `vitrobot_settings.blot_force` and `grid_preparations.blot_force_override`

## Security Benefits

1. **SQL Injection Prevention**: All data is validated and sanitized before database queries
2. **Data Type Safety**: Ensures only correct data types reach the database
3. **Range Validation**: Prevents invalid values that could cause application errors
4. **Length Limits**: Prevents buffer overflow and ensures database constraints are met
5. **Double Validation**: Both client and server-side validation for maximum security
