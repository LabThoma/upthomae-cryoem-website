const express = require("express");
const mariadb = require("mariadb");
const cors = require("cors");
const {
  createValidationMiddleware,
  validateSessionMiddleware,
} = require("./validation.js");
const app = express();
const port = 3000;

// Enable CORS middleware - FIXED
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type"],
  })
);

// Middleware to parse JSON
app.use(express.json());

// Serve static files (for your HTML form)
app.use(express.static("public"));

// MariaDB connection pool
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  database: "test_database",
  connectionLimit: 5,
  bigIntAsNumber: true, // Convert BIGINT to Number
});

// Helper function to convert BigInt values to strings/numbers
const sanitizeBigInt = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    // Convert BigInt to number if it's within safe integer range
    return obj <= Number.MAX_SAFE_INTEGER ? Number(obj) : obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeBigInt);
  }

  if (typeof obj === "object") {
    // Handle date objects from MariaDB (they have year, month, day properties)
    if (obj && "year" in obj && "month" in obj && "day" in obj) {
      console.log("Converting MariaDB date object to string:", obj);
      return `${obj.year}-${String(obj.month).padStart(2, "0")}-${String(
        obj.day
      ).padStart(2, "0")}`;
    }

    // Handle JS Date objects
    if (obj instanceof Date) {
      return obj.toISOString().split("T")[0];
    }

    // Handle regular objects
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeBigInt(value)])
    );
  }

  return obj;
};

// ===== REFERENCE DATA ENDPOINTS =====

// Get all samples for dropdown
app.get("/api/samples", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query(
      "SELECT * FROM samples ORDER BY sample_name"
    );
    connection.release();
    res.json(sanitizeBigInt(rows));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching samples");
  }
});

// Get all grid types for dropdown
app.get("/api/grid-types", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query(
      "SELECT * FROM grid_types ORDER BY grid_type_name"
    );
    connection.release();
    res.json(sanitizeBigInt(rows));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching grid types");
  }
});

// Add new sample
app.post(
  "/api/samples",
  createValidationMiddleware("samples"),
  async (req, res) => {
    const { sample_name, sample_concentration, additives, default_volume_ul } =
      req.body;
    try {
      const connection = await pool.getConnection();
      const result = await connection.query(
        "INSERT INTO samples (sample_name, sample_concentration, additives, default_volume_ul) VALUES (?, ?, ?, ?)",
        [sample_name, sample_concentration, additives, default_volume_ul]
      );
      connection.release();
      res.status(201).json({ id: sanitizeBigInt(result.insertId) });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding sample");
    }
  }
);

// Add new grid type
app.post("/api/grid-types", async (req, res) => {
  const {
    grid_type_name,
    manufacturer,
    support,
    spacing,
    grid_material,
    grid_mesh,
    extra_layer,
    extra_layer_thickness,
    q_number,
    extra_info,
    quantity,
  } = req.body;

  try {
    const connection = await pool.getConnection();
    const result = await connection.query(
      `INSERT INTO grid_types (
          grid_type_name,
          manufacturer, 
          support, 
          spacing, 
          grid_material, 
          grid_mesh, 
          extra_layer, 
          extra_layer_thickness, 
          q_number, 
          extra_info, 
          quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        grid_type_name || null,
        manufacturer || null,
        support || null,
        spacing || null,
        grid_material || null,
        grid_mesh || null,
        extra_layer || null,
        extra_layer_thickness || null,
        q_number || null,
        extra_info || null,
        quantity ? parseInt(quantity) : null,
      ]
    );
    connection.release();
    res.status(201).json({
      id: sanitizeBigInt(result.insertId),
      message: "Grid type added successfully",
    });
  } catch (err) {
    console.error("Error adding grid type:", err);
    res.status(500).json({ error: "Error adding grid type: " + err.message });
  }
});

// Get grid type summary for admin
app.get("/api/grid-types/summary", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query(`
      SELECT 
        gt.grid_type_name,
        SUM(
          CASE 
            WHEN gt.marked_as_empty = TRUE THEN 0
            ELSE COALESCE(gt.quantity, 0) - COALESCE(usage_counts.total_used, 0)
          END
        ) as total_unused_grids,
        SUM(COALESCE(usage_counts.used_last_3_months, 0)) as total_used_last_3_months,
        COUNT(gt.grid_type_id) as batch_count
      FROM grid_types gt
      LEFT JOIN (
        SELECT 
          g.grid_batch as q_number,
          COUNT(*) as total_used,
          COUNT(CASE WHEN g.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 1 END) as used_last_3_months
        FROM grids g
        WHERE g.grid_batch IS NOT NULL AND g.grid_batch != ''
        GROUP BY g.grid_batch
      ) usage_counts ON gt.q_number = usage_counts.q_number
      GROUP BY gt.grid_type_name
      ORDER BY gt.grid_type_name
    `);
    connection.release();
    res.json(sanitizeBigInt(rows));
  } catch (err) {
    console.error("Error fetching grid type summary:", err);
    res
      .status(500)
      .json({ error: "Error fetching grid type summary: " + err.message });
  }
});

// Get detailed batches for a specific grid type name
app.get("/api/grid-types/batches/:gridTypeName", async (req, res) => {
  const gridTypeName = decodeURIComponent(req.params.gridTypeName);
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query(
      `
      SELECT 
        gt.grid_type_id,
        gt.grid_type_name,
        gt.q_number,
        gt.quantity,
        gt.created_at,
        gt.marked_as_empty,
        gt.marked_as_in_use,
        COALESCE(usage_counts.used_grids, 0) as used_grids,
        CASE 
          WHEN gt.marked_as_empty = TRUE THEN 0
          ELSE COALESCE(gt.quantity, 0) - COALESCE(usage_counts.used_grids, 0)
        END as remaining_grids
      FROM grid_types gt
      LEFT JOIN (
        SELECT 
          g.grid_batch as q_number,
          COUNT(*) as used_grids
        FROM grids g
        WHERE g.grid_batch IS NOT NULL AND g.grid_batch != ''
        GROUP BY g.grid_batch
      ) usage_counts ON gt.q_number = usage_counts.q_number
      WHERE gt.grid_type_name = ?
      ORDER BY gt.created_at DESC
    `,
      [gridTypeName]
    );
    connection.release();

    res.json(sanitizeBigInt(rows));
  } catch (err) {
    console.error("Error fetching grid type batches:", err);
    res
      .status(500)
      .json({ error: "Error fetching grid type batches: " + err.message });
  }
});

// Get detailed grid info for a specific grid type
app.get("/api/grid-types/:id/details", async (req, res) => {
  const gridTypeId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query(
      `
      SELECT 
        gt.grid_type_id,
        gt.grid_type_name,
        gt.q_number,
        gt.quantity,
        gt.created_at,
        gt.marked_as_empty,
        gt.marked_as_in_use,
        COALESCE(usage_counts.used_grids, 0) as used_grids,
        CASE 
          WHEN gt.marked_as_empty = TRUE THEN 0
          ELSE COALESCE(gt.quantity, 0) - COALESCE(usage_counts.used_grids, 0)
        END as remaining_grids
      FROM grid_types gt
      LEFT JOIN (
        SELECT 
          g.grid_batch as q_number,
          COUNT(*) as used_grids
        FROM grids g
        WHERE g.grid_batch IS NOT NULL AND g.grid_batch != ''
        GROUP BY g.grid_batch
      ) usage_counts ON gt.q_number = usage_counts.q_number
      WHERE gt.grid_type_id = ?
    `,
      [gridTypeId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: "Grid type not found" });
    }

    res.json(sanitizeBigInt(rows[0]));
  } catch (err) {
    console.error("Error fetching grid type details:", err);
    res
      .status(500)
      .json({ error: "Error fetching grid type details: " + err.message });
  }
});

// Update grid type (for edit functionality)
app.put("/api/grid-types/:id", async (req, res) => {
  const gridTypeId = req.params.id;
  const {
    grid_type_name,
    manufacturer,
    support,
    spacing,
    grid_material,
    grid_mesh,
    extra_layer,
    extra_layer_thickness,
    q_number,
    extra_info,
    quantity,
  } = req.body;

  try {
    const connection = await pool.getConnection();
    const result = await connection.query(
      `UPDATE grid_types SET
         grid_type_name = ?,
         manufacturer = ?, 
         support = ?, 
         spacing = ?, 
         grid_material = ?, 
         grid_mesh = ?, 
         extra_layer = ?, 
         extra_layer_thickness = ?, 
         q_number = ?, 
         extra_info = ?, 
         quantity = ?,
         updated_at = NOW()
       WHERE grid_type_id = ?`,
      [
        grid_type_name || null,
        manufacturer || null,
        support || null,
        spacing || null,
        grid_material || null,
        grid_mesh || null,
        extra_layer || null,
        extra_layer_thickness || null,
        q_number || null,
        extra_info || null,
        quantity ? parseInt(quantity) : null,
        gridTypeId,
      ]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Grid type not found" });
    }

    res.json({ message: "Grid type updated successfully" });
  } catch (err) {
    console.error("Error updating grid type:", err);
    res.status(500).json({ error: "Error updating grid type: " + err.message });
  }
});

// Delete grid type
app.delete("/api/grid-types/:id", async (req, res) => {
  const gridTypeId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const result = await connection.query(
      "DELETE FROM grid_types WHERE grid_type_id = ?",
      [gridTypeId]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Grid type not found" });
    }

    res.json({ message: "Grid type deleted successfully" });
  } catch (err) {
    console.error("Error deleting grid type:", err);
    res.status(500).json({ error: "Error deleting grid type: " + err.message });
  }
});

// Mark grid type as empty (indicates batch is exhausted due to unlogged usage)
app.patch("/api/grid-types/:id/mark-empty", async (req, res) => {
  const gridTypeId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const result = await connection.query(
      "UPDATE grid_types SET marked_as_empty = TRUE, updated_at = NOW() WHERE grid_type_id = ?",
      [gridTypeId]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Grid type not found" });
    }

    res.json({ message: "Grid type marked as empty successfully" });
  } catch (err) {
    console.error("Error marking grid type as empty:", err);
    res
      .status(500)
      .json({ error: "Error marking grid type as empty: " + err.message });
  }
});

// Mark grid type as in use (indicates batch is currently being used)
app.patch("/api/grid-types/:id/mark-in-use", async (req, res) => {
  const gridTypeId = req.params.id;
  try {
    const connection = await pool.getConnection();
    const result = await connection.query(
      "UPDATE grid_types SET marked_as_in_use = TRUE, updated_at = NOW() WHERE grid_type_id = ?",
      [gridTypeId]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Grid type not found" });
    }

    res.json({ message: "Grid type marked as in use successfully" });
  } catch (err) {
    console.error("Error marking grid type as in use:", err);
    res
      .status(500)
      .json({ error: "Error marking grid type as in use: " + err.message });
  }
});

// ===== SESSION ENDPOINTS =====

// Get all sessions with basic info
app.get("/api/sessions", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const rows = await connection.query(`
      SELECT s.*, 
             COUNT(gp.prep_id) as grid_count,
             vs.humidity_percent, vs.temperature_c
      FROM sessions s
      LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
      LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
      GROUP BY s.session_id
      ORDER BY s.date DESC, s.created_at DESC
    `);
    connection.release();

    res.json(sanitizeBigInt(rows));
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).send("Error fetching sessions");
  }
});

// Check if a session exists for a given user and grid box name
app.get("/api/sessions/check", async (req, res) => {
  const { user_name, grid_box_name } = req.query;

  if (!user_name || !grid_box_name) {
    return res.status(400).json({
      error: "user_name and grid_box_name are required parameters",
    });
  }

  try {
    const connection = await pool.getConnection();

    const sessions = await connection.query(
      "SELECT session_id, user_name, date, grid_box_name FROM sessions WHERE user_name = ? AND grid_box_name = ? ORDER BY updated_at DESC LIMIT 1",
      [user_name, grid_box_name]
    );

    connection.release();

    if (sessions.length > 0) {
      res.json({
        exists: true,
        session: sanitizeBigInt(sessions[0]),
      });
    } else {
      res.json({
        exists: false,
        session: null,
      });
    }
  } catch (err) {
    console.error("Error checking for existing session:", err);
    res.status(500).json({ error: "Error checking for existing session" });
  }
});

// Get complete session data (for editing/viewing)
app.get("/api/sessions/:id", async (req, res) => {
  const sessionId = req.params.id;
  try {
    const connection = await pool.getConnection();

    // Get session info
    const session = await connection.query(
      "SELECT * FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    // Get vitrobot settings
    const settings = await connection.query(
      "SELECT * FROM vitrobot_settings WHERE session_id = ?",
      [sessionId]
    );

    // Get grid info
    const gridInfo = await connection.query(
      "SELECT * FROM grids WHERE session_id = ?",
      [sessionId]
    );

    // Get grid preparations with sample and grid type info
    const grids = await connection.query(
      `
      SELECT gp.*, 
             s.sample_name, s.sample_concentration, s.additives, s.default_volume_ul,
             g.grid_type, g.grid_batch
      FROM grid_preparations gp
      LEFT JOIN samples s ON gp.sample_id = s.sample_id
      LEFT JOIN grids g ON gp.grid_id = g.grid_id
      WHERE gp.session_id = ?
      ORDER BY gp.slot_number
    `,
      [sessionId]
    );

    connection.release();

    if (session.length === 0) {
      return res.status(404).send("Session not found");
    }

    // Format the date specifically if needed
    if (session[0].date && typeof session[0].date === "object") {
      if (
        "year" in session[0].date &&
        "month" in session[0].date &&
        "day" in session[0].date
      ) {
        session[0].date = `${session[0].date.year}-${String(
          session[0].date.month
        ).padStart(2, "0")}-${String(session[0].date.day).padStart(2, "0")}`;
      }
    }

    const result = {
      session: session[0],
      settings: settings[0] || {},
      grid_info: gridInfo[0] || {},
      grids: grids,
    };

    res.json(sanitizeBigInt(result));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching session details");
  }
});

// Create new session with vitrobot settings and grids
app.post("/api/sessions", validateSessionMiddleware, async (req, res) => {
  const { session, vitrobot_settings, grid_info, grids } = req.body;

  console.log("Request Body:", req.body);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert session FIRST
    const sessionResult = await connection.query(
      `INSERT INTO sessions (user_name, date, grid_box_name, loading_order, puck_name, puck_position) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session.user_name,
        session.date,
        session.grid_box_name,
        session.loading_order,
        session.puck_name,
        session.puck_position,
      ]
    );

    // Now we have sessionId
    const sessionId = sanitizeBigInt(sessionResult.insertId);
    console.log("Created session with ID:", sessionId);

    // THEN insert grid info using the sessionId
    const gridResult = await connection.query(
      `INSERT INTO grids (session_id, grid_type, grid_batch, glow_discharge_applied, 
        glow_discharge_current, glow_discharge_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sessionId, // Now sessionId is defined
        grid_info.grid_type || null,
        grid_info.grid_batch || null,
        grid_info.glow_discharge_applied || false,
        grid_info.glow_discharge_current || null,
        grid_info.glow_discharge_time || null,
      ]
    );

    // Get the generated grid ID to use in grid_preparations
    const gridId = sanitizeBigInt(gridResult.insertId);
    console.log("Created grid with ID:", gridId);
    console.log("Grid insert result:", gridResult);
    console.log("Grid insert result type:", typeof gridId);

    // Insert vitrobot settings
    await connection.query(
      `INSERT INTO vitrobot_settings (session_id, humidity_percent, temperature_c, blot_force, blot_time_seconds, wait_time_seconds, glow_discharge_applied)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        vitrobot_settings.humidity_percent || null, // Use NULL if value is empty
        vitrobot_settings.temperature_c || null,
        vitrobot_settings.blot_force || null,
        vitrobot_settings.blot_time_seconds || null,
        vitrobot_settings.wait_time_seconds || null,
        vitrobot_settings.glow_discharge_applied || false, // Default to false
      ]
    );

    console.log("Vitrobot Settings Inserted:", vitrobot_settings);

    // Insert grid preparations
    for (const grid of grids) {
      if (grid.include_in_session) {
        // Handle sample creation/lookup based on sample_name
        let sampleId = null;

        if (grid.sample_name) {
          // Check if this sample already exists FOR THIS SESSION/GRID BOX
          const existingSamples = await connection.query(
            `SELECT s.sample_id FROM samples s 
             JOIN grid_preparations gp ON s.sample_id = gp.sample_id 
             WHERE gp.session_id = ? AND s.sample_name = ?`,
            [sessionId, grid.sample_name]
          );

          if (existingSamples.length > 0) {
            // Use existing sample from this session
            sampleId = existingSamples[0].sample_id;
            console.log(
              `Found existing sample ID ${sampleId} for "${grid.sample_name}" in session ${sessionId}`
            );
          } else {
            // Create a new sample for this grid box/session
            const sampleResult = await connection.query(
              "INSERT INTO samples (sample_name, sample_concentration, additives, default_volume_ul) VALUES (?, ?, ?, ?)",
              [
                grid.sample_name,
                grid.sample_concentration,
                grid.additives || null,
                req.body.sample ? req.body.sample.default_volume_ul : null,
              ]
            );
            sampleId = sampleResult.insertId;
            console.log(
              `Created new sample ID ${sampleId} for "${grid.sample_name}" in session ${sessionId}`
            );
          }
        }
        // Fall back to sample_id if provided directly
        else if (grid.sample_id) {
          sampleId = grid.sample_id;
        }
        console.log(
          `Inserting grid preparation for slot ${grid.slot_number} with grid_id: ${gridId}`
        );

        // Then use the resolved sampleId in the grid preparation insert
        const insertResult = await connection.query(
          `INSERT INTO grid_preparations (
        session_id, 
        slot_number, 
        sample_id, 
        grid_id, 
        volume_ul_override, 
        blot_time_override, 
        blot_force_override, 
        grid_batch_override, 
        comments, 
        additives_override, 
        include_in_session
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            grid.slot_number,
            sampleId, // Now using our resolved sampleId
            gridId,
            grid.volume_ul_override || null,
            grid.blot_time_override || null,
            grid.blot_force_override || null,
            grid.grid_batch_override || null,
            grid.comments || null,
            grid.additives_override || null,
            grid.include_in_session,
          ]
        );
        console.log(
          `Grid preparation inserted with ID: ${insertResult.insertId}, grid_id: ${gridId}`
        );
      }
    }

    // Verify what was actually inserted
    const verificationResult = await connection.query(
      `SELECT * FROM grid_preparations WHERE session_id = ?`,
      [sessionId]
    );
    console.log(
      "VERIFICATION - Actual grid_preparations in database:",
      sanitizeBigInt(verificationResult)
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      session_id: sessionId,
      message: "Session created successfully",
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error creating session:", err);

    // Make sure you don't send a response if headers were already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to create session",
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Update existing session
app.put("/api/sessions/:id", async (req, res) => {
  const sessionId = req.params.id;
  const { session, vitrobot_settings, grid_info, grids } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Update session
    await connection.query(
      `UPDATE sessions SET user_name = ?, date = ?, grid_box_name = ?, loading_order = ?, puck_name = ?, puck_position = ?, updated_at = CURRENT_TIMESTAMP
       WHERE session_id = ?`,
      [
        session.user_name,
        session.date,
        session.grid_box_name,
        session.loading_order,
        session.puck_name,
        session.puck_position,
        sessionId,
      ]
    );

    // Update grid info
    const existingGridInfo = await connection.query(
      "SELECT * FROM grids WHERE session_id = ?",
      [sessionId]
    );

    if (existingGridInfo.length > 0) {
      // Update existing grid info
      await connection.query(
        `UPDATE grids SET 
          grid_type = ?, grid_batch = ?, glow_discharge_applied = ?,
          glow_discharge_current = ?, glow_discharge_time = ?, 
          updated_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
        [
          grid_info.grid_type || null,
          grid_info.grid_batch || null,
          grid_info.glow_discharge_applied || false,
          grid_info.glow_discharge_current || null,
          grid_info.glow_discharge_time || null,
          sessionId,
        ]
      );
    } else {
      // Insert new grid info
      await connection.query(
        `INSERT INTO grids (
          session_id, grid_type, grid_batch, glow_discharge_applied, 
          glow_discharge_current, glow_discharge_time
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          grid_info.grid_type || null,
          grid_info.grid_batch || null,
          grid_info.glow_discharge_applied || false,
          grid_info.glow_discharge_current || null,
          grid_info.glow_discharge_time || null,
        ]
      );
    }

    // Update vitrobot settings
    await connection.query(
      `UPDATE vitrobot_settings SET humidity_percent = ?, temperature_c = ?, blot_force = ?, blot_time_seconds = ?, wait_time_seconds = ?, glow_discharge_applied = ?, updated_at = CURRENT_TIMESTAMP
       WHERE session_id = ?`,
      [
        vitrobot_settings.humidity_percent || null,
        vitrobot_settings.temperature_c || null,
        vitrobot_settings.blot_force || null,
        vitrobot_settings.blot_time_seconds || null,
        vitrobot_settings.wait_time_seconds || null,
        vitrobot_settings.glow_discharge_applied || false,
        sessionId,
      ]
    );

    // Delete existing grid preparations and re-insert
    await connection.query(
      "DELETE FROM grid_preparations WHERE session_id = ?",
      [sessionId]
    );

    // Get the grid_id for this session
    const gridQuery = await connection.query(
      "SELECT grid_id FROM grids WHERE session_id = ?",
      [sessionId]
    );
    const gridId = gridQuery.length > 0 ? gridQuery[0].grid_id : null;

    // Insert updated grid preparations
    for (const grid of grids) {
      if (grid.include_in_session) {
        // Handle sample creation/lookup based on sample_name
        let sampleId = null;

        if (grid.sample_name) {
          // Check if this sample already exists FOR THIS SESSION/GRID BOX
          const existingSamples = await connection.query(
            `SELECT s.sample_id FROM samples s 
             JOIN grid_preparations gp ON s.sample_id = gp.sample_id 
             WHERE gp.session_id = ? AND s.sample_name = ?`,
            [sessionId, grid.sample_name]
          );

          if (existingSamples.length > 0) {
            // Use existing sample from this session
            sampleId = existingSamples[0].sample_id;
            console.log(
              `Found existing sample ID ${sampleId} for "${grid.sample_name}" in session ${sessionId}`
            );
          } else {
            // Create a new sample for this grid box/session
            const sampleResult = await connection.query(
              "INSERT INTO samples (sample_name, sample_concentration, additives, default_volume_ul) VALUES (?, ?, ?, ?)",
              [
                grid.sample_name,
                grid.sample_concentration,
                grid.additives || null,
                req.body.sample ? req.body.sample.default_volume_ul : null,
              ]
            );
            sampleId = sampleResult.insertId;
            console.log(
              `Created new sample ID ${sampleId} for "${grid.sample_name}" in session ${sessionId}`
            );
          }
        }
        // Fall back to sample_id if provided directly
        else if (grid.sample_id) {
          sampleId = grid.sample_id;
        }

        await connection.query(
          `INSERT INTO grid_preparations (
      session_id, 
      slot_number, 
      sample_id, 
      grid_id, 
      volume_ul_override, 
      blot_time_override, 
      blot_force_override, 
      grid_batch_override, 
      comments, 
      additives_override,
      include_in_session
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            grid.slot_number,
            sampleId,
            gridId,
            grid.volume_ul_override || null,
            grid.blot_time_override || null,
            grid.blot_force_override || null,
            grid.grid_batch_override || null,
            grid.comments || null,
            grid.additives_override || null,
            grid.include_in_session,
          ]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Session updated successfully" });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).send("Error updating session");
  } finally {
    if (connection) connection.release();
  }
});

// Delete session
app.delete("/api/sessions/:id", async (req, res) => {
  const sessionId = req.params.id;
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM sessions WHERE session_id = ?", [
      sessionId,
    ]);
    connection.release();
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting session");
  }
});

// Get sessions by user name
app.get("/api/users/:username/sessions", async (req, res) => {
  const username = req.params.username;
  try {
    const connection = await pool.getConnection();

    // Get basic session information first
    let query = `
      SELECT s.*,
             COUNT(gp.prep_id) as grid_count,
             vs.humidity_percent, vs.temperature_c,
             (
               SELECT GROUP_CONCAT(DISTINCT sam.sample_name SEPARATOR ', ')
               FROM grid_preparations gp2
               LEFT JOIN samples sam ON gp2.sample_id = sam.sample_id
               WHERE gp2.session_id = s.session_id AND sam.sample_name IS NOT NULL
             ) as sample_names
      FROM sessions s
      LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
      LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
    `;

    // Only filter by username if not "all"
    if (username !== "all") {
      query += " WHERE s.user_name = ?";
    }

    query += " GROUP BY s.session_id ORDER BY s.date DESC, s.created_at DESC";

    // Execute the query with or without the username parameter
    const rows =
      username !== "all"
        ? await connection.query(query, [username])
        : await connection.query(query);

    // For each session, get detailed grid preparation information
    for (let i = 0; i < rows.length; i++) {
      const sessionId = rows[i].session_id;

      // Get vitrobot settings
      const settings = await connection.query(
        "SELECT * FROM vitrobot_settings WHERE session_id = ?",
        [sessionId]
      );
      rows[i].settings = settings[0] || {};

      // Get grid preparations
      const gridPreps = await connection.query(
        `SELECT gp.*,
          s.sample_name, s.sample_concentration, s.additives, s.default_volume_ul,
          g.grid_type, g.grid_batch  
        FROM grid_preparations gp
        LEFT JOIN samples s ON gp.sample_id = s.sample_id
        LEFT JOIN grids g ON gp.grid_id = g.grid_id
        WHERE gp.session_id = ?
        ORDER BY gp.slot_number`,
        [sessionId]
      );
      rows[i].grid_preparations = gridPreps;
    }

    connection.release();

    // Format dates and sanitize BigInt values
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].date && typeof rows[i].date === "object") {
        if (
          "year" in rows[i].date &&
          "month" in rows[i].date &&
          "day" in rows[i].date
        ) {
          rows[i].date = `${rows[i].date.year}-${String(
            rows[i].date.month
          ).padStart(2, "0")}-${String(rows[i].date.day).padStart(2, "0")}`;
        }
      }
    }

    res.json(sanitizeBigInt(rows));
  } catch (err) {
    console.error("Error fetching user sessions:", err);
    res.status(500).send(`Error fetching sessions for user: ${username}`);
  }
});

// ===== USER ENDPOINTS =====

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const users = await connection.query(`
      SELECT 
        s.user_name,
        COUNT(DISTINCT s.session_id) as total_sessions,
        COUNT(DISTINCT DATE(s.date)) as session_days,
        COUNT(gp.prep_id) as total_grids,
        MAX(s.date) as last_session_date,
        MIN(s.date) as first_session_date
      FROM sessions s
      LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
      GROUP BY s.user_name
      ORDER BY s.user_name
    `);

    connection.release();

    // Process the results to add computed fields
    const processedUsers = users.map((user) => ({
      username: user.user_name,
      totalSessions: user.total_sessions || 0,
      totalGrids: user.total_grids || 0,
      sessionDays: user.session_days || 0,
      lastSessionDate: user.last_session_date,
      firstSessionDate: user.first_session_date,
      // Dummy values that can be replaced with real logic later
      activeGridBoxes: 0, // Could be calculated based on recent sessions
      nextBoxName: `${user.user_name}_Box_${(user.total_sessions || 0) + 1}`, // Simple naming convention
    }));

    res.json(sanitizeBigInt(processedUsers));
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Error fetching users");
  }
});

// ===== UTILITY ENDPOINTS =====

// Get dashboard statistics
app.get("/api/dashboard", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const stats = await connection.query(`
      SELECT 
        COUNT(DISTINCT s.session_id) as total_sessions,
        COUNT(gp.prep_id) as total_grids,
        COUNT(DISTINCT s.user_name) as active_users,
        AVG(vs.humidity_percent) as avg_humidity,
        AVG(vs.temperature_c) as avg_temperature
      FROM sessions s
      LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
      LEFT JOIN vitrobot_settings vs ON s.session_id = vs.session_id
      WHERE s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const recentSessions = await connection.query(`
      SELECT s.session_id, s.user_name, s.date, s.puck_name, COUNT(gp.prep_id) as grid_count
      FROM sessions s
      LEFT JOIN grid_preparations gp ON s.session_id = gp.session_id AND gp.include_in_session = TRUE
      GROUP BY s.session_id
      ORDER BY s.date DESC, s.created_at DESC
      LIMIT 10
    `);

    connection.release();

    res.json(
      sanitizeBigInt({
        stats: stats[0],
        recent_sessions: recentSessions,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching dashboard data");
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "unhealthy", error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Vitrobot Server running at http://localhost:${port}`);
  console.log(`API endpoints available:`);
  console.log(`  GET  /api/sessions - List all sessions`);
  console.log(`  GET  /api/sessions/:id - Get session details`);
  console.log(`  POST /api/sessions - Create new session`);
  console.log(`  PUT  /api/sessions/:id - Update session`);
  console.log(`  GET  /api/samples - Get all samples`);
  console.log(`  GET  /api/grid-types - Get all grid types`);
  console.log(`  GET  /api/users - Get all users with statistics`);
  console.log(
    `  GET  /api/users/:username/sessions - Get sessions for a specific user`
  );
  console.log(`  GET  /api/dashboard - Get dashboard stats`);
  console.log(`  GET  /api/health - Health check`);
});
