<?php
// Validation functions ported from validation.js

function validateSession($session) {
    $errors = [];
    
    // Validate user_name
    if (empty($session['user_name'])) {
        $errors[] = 'User name is required';
    } elseif (strlen($session['user_name']) > 100) {
        $errors[] = 'User name cannot exceed 100 characters';
    }
    
    // Validate date
    if (empty($session['date'])) {
        $errors[] = 'Date is required';
    } else {
        // Check if it's a valid date
        $date = DateTime::createFromFormat('Y-m-d', $session['date']);
        if (!$date || $date->format('Y-m-d') !== $session['date']) {
            $errors[] = 'Date must be in YYYY-MM-DD format';
        }
    }
    
    // Validate optional fields
    if (!empty($session['grid_box_name']) && strlen($session['grid_box_name']) > 100) {
        $errors[] = 'Grid box name cannot exceed 100 characters';
    }
    
    if (!empty($session['loading_order'])) {
        if (!is_numeric($session['loading_order']) || $session['loading_order'] < 1) {
            $errors[] = 'Loading order must be a positive number';
        }
    }
    
    if (!empty($session['puck_name']) && strlen($session['puck_name']) > 100) {
        $errors[] = 'Puck name cannot exceed 100 characters';
    }
    
    if (!empty($session['puck_position'])) {
        if (!is_numeric($session['puck_position']) || $session['puck_position'] < 1 || $session['puck_position'] > 12) {
            $errors[] = 'Puck position must be a number between 1 and 12';
        }
    }
    
    return $errors;
}

function validateVitrobotSettings($settings) {
    $errors = [];
    
    if (!empty($settings['humidity_percent'])) {
        if (!is_numeric($settings['humidity_percent']) || $settings['humidity_percent'] < 0 || $settings['humidity_percent'] > 100) {
            $errors[] = 'Humidity must be a number between 0 and 100';
        }
    }
    
    if (!empty($settings['temperature_c'])) {
        if (!is_numeric($settings['temperature_c']) || $settings['temperature_c'] < -50 || $settings['temperature_c'] > 50) {
            $errors[] = 'Temperature must be a number between -50 and 50°C';
        }
    }
    
    if (!empty($settings['blot_force'])) {
        if (!is_numeric($settings['blot_force']) || $settings['blot_force'] < 0 || $settings['blot_force'] > 20) {
            $errors[] = 'Blot force must be a number between 0 and 20';
        }
    }
    
    if (!empty($settings['blot_time_seconds'])) {
        if (!is_numeric($settings['blot_time_seconds']) || $settings['blot_time_seconds'] < 0 || $settings['blot_time_seconds'] > 30) {
            $errors[] = 'Blot time must be a number between 0 and 30 seconds';
        }
    }
    
    if (!empty($settings['wait_time_seconds'])) {
        if (!is_numeric($settings['wait_time_seconds']) || $settings['wait_time_seconds'] < 0 || $settings['wait_time_seconds'] > 30) {
            $errors[] = 'Wait time must be a number between 0 and 30 seconds';
        }
    }
    
    return $errors;
}

function validateGridInfo($gridInfo) {
    $errors = [];
    
    if (!empty($gridInfo['grid_type']) && strlen($gridInfo['grid_type']) > 100) {
        $errors[] = 'Grid type cannot exceed 100 characters';
    }
    
    if (!empty($gridInfo['grid_batch']) && strlen($gridInfo['grid_batch']) > 100) {
        $errors[] = 'Grid batch cannot exceed 100 characters';
    }
    
    if (!empty($gridInfo['glow_discharge_current'])) {
        if (!is_numeric($gridInfo['glow_discharge_current']) || $gridInfo['glow_discharge_current'] < 0 || $gridInfo['glow_discharge_current'] > 50) {
            $errors[] = 'Glow discharge current must be a number between 0 and 50 mA';
        }
    }
    
    if (!empty($gridInfo['glow_discharge_time'])) {
        if (!is_numeric($gridInfo['glow_discharge_time']) || $gridInfo['glow_discharge_time'] < 0 || $gridInfo['glow_discharge_time'] > 300) {
            $errors[] = 'Glow discharge time must be a number between 0 and 300 seconds';
        }
    }
    
    return $errors;
}

function validateSample($sample) {
    $errors = [];
    
    if (empty($sample['sample_name'])) {
        $errors[] = 'Sample name is required';
    } elseif (strlen($sample['sample_name']) > 255) {
        $errors[] = 'Sample name cannot exceed 255 characters';
    }
    
    if (!empty($sample['sample_concentration']) && strlen($sample['sample_concentration']) > 100) {
        $errors[] = 'Sample concentration cannot exceed 100 characters';
    }
    
    if (!empty($sample['additives']) && strlen($sample['additives']) > 1000) {
        $errors[] = 'Additives cannot exceed 1000 characters';
    }

    if (!empty($sample['buffer']) && strlen($sample['buffer']) > 500) {
        $errors[] = 'Buffer cannot exceed 500 characters';
    }
    
    if (!empty($sample['default_volume_ul'])) {
        if (!is_numeric($sample['default_volume_ul']) || $sample['default_volume_ul'] < 0 || $sample['default_volume_ul'] > 99.99) {
            $errors[] = 'Default volume must be a number between 0 and 99.99 μL';
        }
    }
    
    return $errors;
}

function validateGridPreparation($grid) {
    $errors = [];
    
    if (isset($grid['slot_number'])) {
        if (!is_numeric($grid['slot_number']) || $grid['slot_number'] < 1 || $grid['slot_number'] > 12) {
            $errors[] = 'Slot number must be between 1 and 12';
        }
    }
    
    if (!empty($grid['volume_ul_override'])) {
        if (!is_numeric($grid['volume_ul_override']) || $grid['volume_ul_override'] <= 0 || $grid['volume_ul_override'] > 20) {
            $errors[] = 'Volume override must be a number between 0 and 20 μL';
        }
    }
    
    if (!empty($grid['blot_time_override'])) {
        if (!is_numeric($grid['blot_time_override']) || $grid['blot_time_override'] < 0 || $grid['blot_time_override'] > 30) {
            $errors[] = 'Blot time override must be a number between 0 and 30 seconds';
        }
    }
    
    if (!empty($grid['blot_force_override'])) {
        if (!is_numeric($grid['blot_force_override']) || $grid['blot_force_override'] < 0 || $grid['blot_force_override'] > 20) {
            $errors[] = 'Blot force override must be a number between 0 and 20';
        }
    }
    
    if (!empty($grid['grid_batch_override']) && strlen($grid['grid_batch_override']) > 100) {
        $errors[] = 'Grid batch override cannot exceed 100 characters';
    }
    
    if (!empty($grid['grid_type_override']) && strlen($grid['grid_type_override']) > 100) {
        $errors[] = 'Grid type override cannot exceed 100 characters';
    }
    
    if (!empty($grid['comments']) && strlen($grid['comments']) > 1000) {
        $errors[] = 'Comments cannot exceed 1000 characters';
    }
    
    if (!empty($grid['additives_override']) && strlen($grid['additives_override']) > 500) {
        $errors[] = 'Additives override cannot exceed 500 characters';
    }
    
    return $errors;
}

function validateGridType($gridType) {
    $errors = [];
    
    if (empty($gridType['grid_type'])) {
        $errors[] = 'Grid type is required';
    } elseif (strlen($gridType['grid_type']) > 100) {
        $errors[] = 'Grid type cannot exceed 100 characters';
    }
    
    if (empty($gridType['mesh_size'])) {
        $errors[] = 'Mesh size is required';
    } elseif (strlen($gridType['mesh_size']) > 50) {
        $errors[] = 'Mesh size cannot exceed 50 characters';
    }
    
    if (empty($gridType['support_film'])) {
        $errors[] = 'Support film is required';
    } elseif (strlen($gridType['support_film']) > 100) {
        $errors[] = 'Support film cannot exceed 100 characters';
    }
    
    if (!empty($gridType['batch_number']) && strlen($gridType['batch_number']) > 100) {
        $errors[] = 'Batch number cannot exceed 100 characters';
    }
    
    if (!empty($gridType['manufacturer']) && strlen($gridType['manufacturer']) > 100) {
        $errors[] = 'Manufacturer cannot exceed 100 characters';
    }
    
    if (!empty($gridType['grids_per_box'])) {
        if (!is_numeric($gridType['grids_per_box']) || $gridType['grids_per_box'] < 1 || $gridType['grids_per_box'] > 200) {
            $errors[] = 'Grids per box must be a number between 1 and 200';
        }
    }
    
    if (!empty($gridType['cost_per_grid'])) {
        if (!is_numeric($gridType['cost_per_grid']) || $gridType['cost_per_grid'] < 0) {
            $errors[] = 'Cost per grid must be a positive number';
        }
    }
    
    return $errors;
}

function validateCompleteSession($input) {
    $allErrors = [];
    
    // Validate session
    if (isset($input['session'])) {
        $sessionErrors = validateSession($input['session']);
        if (!empty($sessionErrors)) {
            $allErrors['session'] = $sessionErrors;
        }
    }
    
    // Validate vitrobot settings
    if (isset($input['vitrobot_settings'])) {
        $vitrobotErrors = validateVitrobotSettings($input['vitrobot_settings']);
        if (!empty($vitrobotErrors)) {
            $allErrors['vitrobot_settings'] = $vitrobotErrors;
        }
    }
    
    // Validate grid info
    if (isset($input['grid_info'])) {
        $gridInfoErrors = validateGridInfo($input['grid_info']);
        if (!empty($gridInfoErrors)) {
            $allErrors['grid_info'] = $gridInfoErrors;
        }
    }
    
    // Validate grids (grid preparations)
    if (isset($input['grids']) && is_array($input['grids'])) {
        foreach ($input['grids'] as $index => $grid) {
            // If this grid includes a sample, validate the sample data
            if (!empty($grid['sample_name'])) {
                $sampleErrors = validateSample($grid);
                if (!empty($sampleErrors)) {
                    $allErrors["grids"][$index]['sample'] = $sampleErrors;
                }
            }
            
            // Validate grid preparation data
            $gridErrors = validateGridPreparation($grid);
            if (!empty($gridErrors)) {
                $allErrors["grids"][$index]['grid'] = $gridErrors;
            }
        }
    }
    
    return $allErrors;
}

// Helper function to flatten nested validation errors into a single array of strings
function flattenValidationErrors($errors, $prefix = '') {
    $flattened = [];
    
    foreach ($errors as $key => $value) {
        if (is_array($value)) {
            if (is_numeric($key)) {
                // For numeric keys (like grid indices), create a more readable prefix
                $newPrefix = $prefix ? $prefix . "[item " . $key . "]" : "Item " . $key;
            } else {
                // For string keys, append to prefix
                $newPrefix = $prefix ? $prefix . "." . $key : $key;
            }
            
            $flattened = array_merge($flattened, flattenValidationErrors($value, $newPrefix));
        } else {
            // This is a string error message
            if ($prefix) {
                $flattened[] = $prefix . ": " . $value;
            } else {
                $flattened[] = $value;
            }
        }
    }
    
    return $flattened;
}

?>
