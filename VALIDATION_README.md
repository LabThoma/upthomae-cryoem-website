# Input Validation System

## Overview

This project uses a comprehensive input validation system for all data sent to the MariaDB database. Validation is enforced on both the frontend (client-side) and backend (server-side) to ensure data integrity, security, and alignment with the database schema.

## What's Implemented

### Backend Validation (`validation.js` & `validation.php`)

- **Schema-based validation** for all database tables
- **Type validation** (integer, decimal, string, text, boolean, date)
- **Range and length validation** (min/max values, string/text length limits)
- **Precision validation** (decimal places for decimals)
- **Data sanitization** (type conversion and cleaning)
- **Express middleware** for automatic validation (Node.js)
- **PHP validation functions** for server-side checks

### Frontend Validation (`formUtils.js`)

- **Real-time field validation** (on blur/change events)
- **Form submission validation**
- **Visual error indicators** (red borders, error messages)
- **Consistent validation rules** matching backend schema

### Database Schema Alignment

Validation rules are directly based on the MariaDB schema in `setup.sql`:

#### Table: `sessions`

- `session_id`: Primary key, auto-increment integer
- `user_name`: Required string, 1-255 characters
- `date`: Required valid date
- `grid_box_name`: Optional string, max 255 characters
- `loading_order`: Optional string, max 255 characters
- `puck_name`: Optional string, max 255 characters
- `puck_position`: Optional string, max 255 characters
- `created_at`, `updated_at`: Timestamps

#### Table: `samples`

- `sample_id`: Primary key, auto-increment integer
- `session_id`: Required integer (foreign key)
- `sample_name`: Required string, 1-255 characters
- `sample_concentration`: Optional string, max 100 characters
- `buffer`: Optional string, max 500 characters
- `additives`: Optional text, max 1000 characters
- `default_volume_ul`: Optional string, max 200 characters
- `created_at`, `updated_at`: Timestamps

#### Table: `grid_types`

- `grid_type_id`: Primary key, auto-increment integer
- `grid_type_name`: Optional string, max 255 characters
- `grid_batch`: Optional string, max 255 characters
- `manufacturer`: Optional string, max 255 characters
- `support`: Optional string, max 255 characters
- `spacing`: Optional string, max 255 characters
- `grid_material`: Optional string, max 255 characters
- `grid_mesh`: Optional string, max 255 characters
- `extra_layer`: Optional string, max 255 characters
- `extra_layer_thickness`: Optional string, max 255 characters
- `q_number`: Optional string, max 255 characters
- `extra_info`: Optional text, max 1000 characters
- `quantity`: Optional positive integer
- `specifications`: Optional text, max 1000 characters
- `marked_as_empty`, `marked_as_in_use`: Boolean flags
- `created_at`, `updated_at`: Timestamps

#### Table: `grids`

- `grid_id`: Primary key, auto-increment integer
- `session_id`: Required integer (foreign key)
- `grid_type`: Required string, max 255 characters
- `grid_batch`: Optional string, max 100 characters
- `glow_discharge_applied`: Boolean
- `glow_discharge_current`: Optional decimal, 0-100 mA, max 2 decimal places
- `glow_discharge_time`: Optional integer, 0-3600 seconds
- `created_at`, `updated_at`: Timestamps

#### Table: `vitrobot_settings`

- `setting_id`: Primary key, auto-increment integer
- `session_id`: Required integer (foreign key)
- `humidity_percent`: Optional string, max 200 characters
- `temperature_c`: Optional decimal, 0-50°C, max 2 decimal places
- `blot_force`: Optional integer, -50 to 50
- `blot_time_seconds`: Optional decimal, 0-100 seconds, max 2 decimal places
- `wait_time_seconds`: Optional string, max 200 characters
- `glow_discharge_applied`: Boolean
- `created_at`, `updated_at`: Timestamps

#### Table: `grid_preparations`

- `prep_id`: Primary key, auto-increment integer
- `session_id`: Required integer (foreign key)
- `slot_number`: Optional integer, 1-48
- `sample_id`: Optional integer (foreign key)
- `volume_ul_override`: Optional string, max 200 characters
- `comments`: Optional text, max 1000 characters
- `include_in_session`: Boolean
- `blot_time_override`: Optional decimal, 0-100 seconds, max 2 decimal places
- `blot_force_override`: Optional decimal, -50 to 50, max 2 decimal places
- `grid_batch_override`: Optional string, max 100 characters
- `grid_type_override`: Optional string, max 255 characters
- `additives_override`: Optional string, max 100 characters
- `grid_id`: Optional integer (foreign key)
- `trashed`: Boolean flag
- `trashed_at`: Timestamp
- `shipped`: Boolean flag
- `shipped_at`: Timestamp
- `created_at`, `updated_at`: Timestamps

## How to Use

```javascript
// Validate against 'sessions' schema
app.post("/api/sessions", validateSessionMiddleware, async (req, res) => {
  // req.body is validated and sanitized
});

// Validate against 'samples' schema
app.post(
  "/api/samples",
  createValidationMiddleware("samples"),
  async (req, res) => {
    // req.body is validated and sanitized
  }
);
```

### Backend Validation (PHP)

Use the provided functions in `validation.php` to validate and flatten errors for all major tables. Example:

```php
$errors = validateSession($sessionData);
if (!empty($errors)) {
    // Handle errors
}
```

### Frontend Forms

```javascript
import { validateForm, setupRealTimeValidation } from "./utils/formUtils.js";

setupRealTimeValidation();
const errors = validateForm();
if (errors.length > 0) {
  // Display errors to user
}
```

## Testing

Run validation tests:

```bash
node test-validation.js
```

Test specific fields:

```javascript
const { testSpecificField } = require("./test-validation.js");
Run the validation tests:
```

## Error Handling

### Validation Errors (400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Session: user_name is required",
    "Vitrobot Settings: blot_force must be at least -50",
    "Grid 1: volume_ul_override can have at most 2 decimal places"
  ]
}
```

### Frontend Error Display

- Fields with errors get red borders and error messages
- Real-time validation shows errors as user types/leaves fields
- Form submission is blocked until all errors are resolved
