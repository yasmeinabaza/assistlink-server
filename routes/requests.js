import express from "express";
import db from "../db/db.js";
import { careCenterAuth } from "../middleware/auth.js";

const router = express.Router();

// GET ALL REQUESTS - GET /api/requests
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name as patient_name, c.name as care_center_name
       FROM requests r
       JOIN users u ON r.patient_id = u.id
       JOIN care_centers c ON r.care_center_id = c.id
       ORDER BY r.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// GET REQUESTS BY PATIENT - GET /api/requests/patient/:patientId
router.get("/patient/:patientId", async (req, res) => {
  const patientId = req.params.patientId;
  try {
    const result = await db.query(
      `SELECT r.*, c.name as care_center_name
       FROM requests r
       JOIN care_centers c ON r.care_center_id = c.id
       WHERE r.patient_id = $1
       ORDER BY r.id DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// ============================================
// GET REQUESTS BY ENGINEER (using user_id) 
// GET /api/requests/engineer/:userId
// ============================================
router.get("/engineer/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    // First find the engineer_id from the engineers table using user_id
    const engineerResult = await db.query(
      `SELECT id FROM engineers WHERE user_id = $1`,
      [userId]
    );
    
    if (engineerResult.rows.length === 0) {
      return res.json([]);
    }
    
    const engineerId = engineerResult.rows[0].id;
    
    // Now get requests for this engineer
    const result = await db.query(
      `SELECT r.*, u.name as patient_name, c.name as care_center_name
       FROM requests r
       JOIN users u ON r.patient_id = u.id
       JOIN care_centers c ON r.care_center_id = c.id
       WHERE r.engineer_id = $1
       ORDER BY r.id DESC`,
      [engineerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error in /engineer/:userId:", error);
    res.status(500).json({ message: "Database error" });
  }
});

// GET request by ID - GET /api/requests/:id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query(
      `SELECT r.*, u.name as patient_name, u.email as patient_email, u.phone as patient_phone,
              c.name as care_center_name, c.location as care_center_location
       FROM requests r
       JOIN users u ON r.patient_id = u.id
       JOIN care_centers c ON r.care_center_id = c.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// CREATE REQUEST - POST /api/requests
router.post("/", async (req, res) => {
  const { patientId, careCenterId, deviceType, reason, affectedArea, notes } = req.body;
  const timestamp = Date.now().toString().slice(-4);
  const requestNumber = `REQ-${timestamp}`;

  try {
    const result = await db.query(
      `INSERT INTO requests 
       (request_number, patient_id, care_center_id, device_type, reason, affected_area, notes, status, submitted_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Submitted', CURRENT_DATE)
       RETURNING *`,
      [requestNumber, patientId, careCenterId, deviceType, reason, affectedArea, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// UPDATE REQUEST STATUS - PUT /api/requests/:id/status (care center only)
router.put("/:id/status", careCenterAuth, async (req, res) => {
  const id = req.params.id;
  const { status, engineerId } = req.body;

  try {
    let query = `UPDATE requests SET status = $1`;
    const params = [status];
    let paramCount = 2;

    if (status === 'Approved') {
      query += `, approved_date = CURRENT_DATE`;
    } else if (status === 'Rejected') {
      query += `, rejected_date = CURRENT_DATE`;
    } else if (status === 'Delivered') {
      query += `, delivered_date = CURRENT_DATE`;
    }

    if (engineerId) {
      query += `, engineer_id = $${paramCount}, assigned_date = CURRENT_DATE`;
      params.push(engineerId);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// ADD MEASUREMENTS - POST /api/requests/:id/measurements
router.post("/:id/measurements", async (req, res) => {
  const id = req.params.id;
  const { height, weight, limbLength, circumference, additionalNotes } = req.body;

  try {
    const existing = await db.query(
      "SELECT * FROM measurements WHERE request_id = $1",
      [id]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE measurements 
         SET height = $1, weight = $2, limb_length = $3, circumference = $4, additional_notes = $5
         WHERE request_id = $6
         RETURNING *`,
        [height, weight, limbLength, circumference, additionalNotes, id]
      );
    } else {
      result = await db.query(
        `INSERT INTO measurements (request_id, height, weight, limb_length, circumference, additional_notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, height, weight, limbLength, circumference, additionalNotes]
      );
    }

    await db.query(
      `UPDATE requests SET status = 'In Progress' WHERE id = $1 AND status = 'Approved'`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;